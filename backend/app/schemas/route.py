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


class Segment(BaseModel):
    start: Tuple[float, float]
    end: Tuple[float, float]
    type: Literal["climb", "cruise", "descent"]
    vfr_altitude: int


class RouteResponse(BaseModel):
    route: List[str]
    distance_nm: float
    time_hr: float
    origin_coords: Tuple[float, float]
    destination_coords: Tuple[float, float]
    segments: List[Segment]
    fuel_stops: Optional[List[str]] = None
    fuel_burn_gph: Optional[float] = None
    reserve_minutes: Optional[int] = None
    fuel_required_gal: Optional[float] = None
    fuel_required_with_reserve_gal: Optional[float] = None
