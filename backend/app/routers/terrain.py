from __future__ import annotations

from typing import List, Optional, Tuple

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import terrain_service

router = APIRouter()


class TerrainPointResponse(BaseModel):
    latitude: float
    longitude: float
    elevation_ft: Optional[float]


class TerrainProfileRequest(BaseModel):
    points: List[Tuple[float, float]] = Field(..., description="List of (lat, lon) points")
    demtype: str = "SRTMGL1"


class TerrainProfilePoint(BaseModel):
    latitude: float
    longitude: float
    elevation_ft: Optional[float]


class TerrainProfileResponse(BaseModel):
    demtype: str
    points: List[TerrainProfilePoint]


@router.get("/terrain")
def terrain_status() -> dict:
    return {"status": "ok"}


@router.get("/terrain/point", response_model=TerrainPointResponse)
def terrain_point(lat: float, lon: float, demtype: str = "SRTMGL1") -> TerrainPointResponse:
    try:
        elev_ft = terrain_service.get_elevation_ft(lat, lon, demtype=demtype)
    except terrain_service.TerrainServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Terrain service error")

    return TerrainPointResponse(latitude=lat, longitude=lon, elevation_ft=elev_ft)


@router.post("/terrain/profile", response_model=TerrainProfileResponse)
def terrain_profile(req: TerrainProfileRequest) -> TerrainProfileResponse:
    try:
        prof = terrain_service.elevation_profile(req.points, demtype=req.demtype)
    except terrain_service.TerrainServiceError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=503, detail="Terrain service error")

    return TerrainProfileResponse(
        demtype=req.demtype,
        points=[TerrainProfilePoint(latitude=lat, longitude=lon, elevation_ft=elev_ft) for lat, lon, elev_ft in prof],
    )
