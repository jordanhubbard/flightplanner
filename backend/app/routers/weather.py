from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.airport import get_airport_coordinates
from app.services import metar
from app.services import open_meteo
from app.services import openweathermap


router = APIRouter()


class WeatherData(BaseModel):
    airport: str
    conditions: str
    temperature: float
    wind_speed: float
    wind_direction: int
    visibility: float
    ceiling: float
    metar: str


class DailyForecast(BaseModel):
    date: str
    temp_max_f: float | None = None
    temp_min_f: float | None = None
    precipitation_mm: float | None = None
    wind_speed_max_kt: float | None = None


class ForecastResponse(BaseModel):
    airport: str
    days: int
    daily: list[DailyForecast]


@router.get("/weather/{code}/forecast", response_model=ForecastResponse)
def weather_forecast(code: str, days: int = 7) -> ForecastResponse:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    try:
        daily = open_meteo.get_daily_forecast(lat=float(coords["latitude"]), lon=float(coords["longitude"]), days=days)
        return ForecastResponse(
            airport=code.upper(),
            days=days,
            daily=[DailyForecast(**row) for row in daily],
        )
    except open_meteo.OpenMeteoError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Forecast service error")


@router.get("/weather/{code}", response_model=WeatherData)
def weather_for_airport(code: str) -> dict:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    try:
        payload = openweathermap.get_current_weather(lat=float(coords["latitude"]), lon=float(coords["longitude"]))
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

        return data
    except openweathermap.OpenWeatherMapError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Weather service error")
