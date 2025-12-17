from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.airport import get_airport_coordinates
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


@router.get("/weather/{code}", response_model=WeatherData)
def weather_for_airport(code: str) -> dict:
    coords = get_airport_coordinates(code)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Unknown airport '{code}'")

    try:
        payload = openweathermap.get_current_weather(lat=float(coords["latitude"]), lon=float(coords["longitude"]))
        return openweathermap.to_weather_data(code, payload)
    except openweathermap.OpenWeatherMapError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Weather service error")
