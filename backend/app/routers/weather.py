from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.airport import get_airport_coordinates
from app.schemas.weather import (
    DailyForecast,
    DepartureWindow,
    ForecastResponse,
    RouteWeatherPoint,
    RouteWeatherRequest,
    RouteWeatherResponse,
    WeatherData,
    WeatherRecommendationsResponse,
)
from app.services import flight_recommendations
from app.services import metar
from app.services import open_meteo
from app.services import openweathermap


router = APIRouter()


@router.post(
    "/weather/route",
    response_model=RouteWeatherResponse,
    summary="Sample weather along a route",
    description="Samples Open-Meteo current weather at a subset of the provided points.",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "points": [[37.6213, -122.3790], [34.0522, -118.2437]],
                        "max_points": 10,
                    }
                }
            }
        }
    },
)
def weather_route(req: RouteWeatherRequest) -> RouteWeatherResponse:
    if not req.points:
        raise HTTPException(status_code=400, detail="points cannot be empty")

    max_points = max(1, min(int(req.max_points), 50))
    step = max(1, (len(req.points) + max_points - 1) // max_points)
    sampled = req.points[::step]

    out: list[RouteWeatherPoint] = []
    for lat, lon in sampled:
        try:
            cw = open_meteo.get_current_weather(lat=lat, lon=lon)
            out.append(
                RouteWeatherPoint(
                    latitude=lat,
                    longitude=lon,
                    temperature_f=cw.get("temperature"),
                    wind_speed_kt=cw.get("windspeed"),
                    wind_direction=cw.get("winddirection"),
                    time=cw.get("time"),
                )
            )
        except Exception:
            out.append(RouteWeatherPoint(latitude=lat, longitude=lon))

    return RouteWeatherResponse(points=out)


@router.get(
    "/weather/{code}/forecast",
    response_model=ForecastResponse,
    summary="Daily forecast",
    description="Daily forecast from Open-Meteo (1-16 days).",
)
def weather_forecast(code: str, days: int = 7) -> ForecastResponse:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    try:
        daily = open_meteo.get_daily_forecast(
            lat=float(coords["latitude"]), lon=float(coords["longitude"]), days=days
        )
        return ForecastResponse(
            airport=code.upper(),
            days=days,
            daily=[DailyForecast(**row) for row in daily],
        )
    except open_meteo.OpenMeteoError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Forecast service error")


@router.get(
    "/weather/{code}",
    response_model=WeatherData,
    summary="Current weather",
    description="Current conditions from OpenWeatherMap enriched with METAR parsing when available.",
)
def weather_for_airport(code: str) -> dict:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    try:
        payload = openweathermap.get_current_weather(
            lat=float(coords["latitude"]), lon=float(coords["longitude"])
        )
        data = openweathermap.to_weather_data(code, payload)

        raw = metar.fetch_metar_raw(code.upper())
        if raw:
            data["metar"] = raw
            parsed = metar.parse_metar(raw)
            if parsed.get("temperature_f") is not None:
                data["temperature"] = parsed["temperature_f"]
            if parsed.get("wind_speed_kt") is not None:
                data["wind_speed"] = parsed["wind_speed_kt"]
            if parsed.get("wind_direction") is not None:
                data["wind_direction"] = parsed["wind_direction"]
            if parsed.get("visibility_sm") is not None:
                data["visibility"] = round(float(parsed["visibility_sm"]), 1)
            if parsed.get("ceiling_ft") is not None:
                data["ceiling"] = parsed["ceiling_ft"]

        cat = flight_recommendations.flight_category(
            visibility_sm=(
                float(data.get("visibility")) if data.get("visibility") is not None else None
            ),
            ceiling_ft=float(data.get("ceiling")) if data.get("ceiling") is not None else None,
        )
        data["flight_category"] = cat
        data["recommendation"] = flight_recommendations.recommendation_for_category(cat)
        data["warnings"] = flight_recommendations.warnings_for_conditions(
            visibility_sm=(
                float(data.get("visibility")) if data.get("visibility") is not None else None
            ),
            ceiling_ft=float(data.get("ceiling")) if data.get("ceiling") is not None else None,
            wind_speed_kt=(
                float(data.get("wind_speed")) if data.get("wind_speed") is not None else None
            ),
        )

        return data
    except openweathermap.OpenWeatherMapError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Weather service error")


@router.get(
    "/weather/{code}/recommendations",
    response_model=WeatherRecommendationsResponse,
    summary="Flight recommendations",
    description="VFR/IFR suitability (best-effort) and suggested departure windows using Open-Meteo hourly data.",
)
def weather_recommendations(code: str) -> WeatherRecommendationsResponse:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    raw = metar.fetch_metar_raw(code.upper())
    parsed = metar.parse_metar(raw) if raw else {}

    vis_sm = parsed.get("visibility_sm")
    ceil_ft = parsed.get("ceiling_ft")
    wind_kt = parsed.get("wind_speed_kt")

    cat = flight_recommendations.flight_category(
        visibility_sm=float(vis_sm) if isinstance(vis_sm, (int, float)) else None,
        ceiling_ft=float(ceil_ft) if isinstance(ceil_ft, (int, float)) else None,
    )

    warnings = flight_recommendations.warnings_for_conditions(
        visibility_sm=float(vis_sm) if isinstance(vis_sm, (int, float)) else None,
        ceiling_ft=float(ceil_ft) if isinstance(ceil_ft, (int, float)) else None,
        wind_speed_kt=float(wind_kt) if isinstance(wind_kt, (int, float)) else None,
    )

    try:
        hourly = open_meteo.get_hourly_forecast(
            lat=float(coords["latitude"]), lon=float(coords["longitude"]), hours=24
        )
        windows = flight_recommendations.best_departure_windows(hourly)
    except Exception:
        windows = []

    return WeatherRecommendationsResponse(
        airport=code.upper(),
        current_category=cat,
        recommendation=flight_recommendations.recommendation_for_category(cat),
        warnings=warnings,
        best_departure_windows=[DepartureWindow(**w) for w in windows],
    )
