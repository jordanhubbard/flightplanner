from __future__ import annotations

from typing import List, Literal, Optional, Tuple

from pydantic import BaseModel, Field


class RouteRequest(BaseModel):
    origin: str
    destination: str
    speed: float
    speed_unit: Literal["knots", "mph"] = "knots"
    altitude: int = Field(..., description="Requested cruising altitude (ft)")
    avoid_airspaces: bool = False
    avoid_terrain: bool = False
    max_leg_distance: float = 150.0
    plan_fuel_stops: bool = False
    aircraft_range_nm: Optional[float] = None
    fuel_burn_gph: Optional[float] = None
    reserve_minutes: int = 45
    fuel_strategy: Literal["time", "economy"] = "time"
    apply_wind: bool = False
    include_alternates: bool = False


class Segment(BaseModel):
    start: Tuple[float, float]
    end: Tuple[float, float]
    type: Literal["climb", "cruise", "descent"]
    vfr_altitude: int


class AlternateWeather(BaseModel):
    metar: Optional[str] = None
    visibility_sm: Optional[float] = None
    ceiling_ft: Optional[int] = None
    wind_speed_kt: Optional[int] = None
    wind_direction_deg: Optional[int] = None
    temperature_f: Optional[int] = None


class AlternateAirport(BaseModel):
    code: str
    name: Optional[str] = None
    type: Optional[str] = None
    distance_nm: float
    weather: Optional[AlternateWeather] = None


class RouteResponse(BaseModel):
    route: List[str]
    distance_nm: float
    time_hr: float
    origin_coords: Tuple[float, float]
    destination_coords: Tuple[float, float]
    segments: List[Segment]
    alternates: Optional[List[AlternateAirport]] = None
    fuel_stops: Optional[List[str]] = None
    fuel_burn_gph: Optional[float] = None
    reserve_minutes: Optional[int] = None
    fuel_required_gal: Optional[float] = None
    fuel_required_with_reserve_gal: Optional[float] = None
    wind_speed_kt: Optional[float] = None
    wind_direction_deg: Optional[int] = None
    headwind_kt: Optional[float] = None
    crosswind_kt: Optional[float] = None
    groundspeed_kt: Optional[float] = None
