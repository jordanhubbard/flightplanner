from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


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
    daily: List[DailyForecast]


class RouteWeatherRequest(BaseModel):
    points: List[tuple[float, float]] = Field(..., description="Route polyline points as (lat, lon)")
    max_points: int = 10


class RouteWeatherPoint(BaseModel):
    latitude: float
    longitude: float
    temperature_f: float | None = None
    wind_speed_kt: float | None = None
    wind_direction: int | None = None
    time: str | None = None


class RouteWeatherResponse(BaseModel):
    points: List[RouteWeatherPoint]
