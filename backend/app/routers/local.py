from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter()


class LocalPlanRequest(BaseModel):
    airport: str = Field(..., description="ICAO/IATA airport code")
    radius_nm: Optional[float] = Field(None, description="Optional radius (NM) for local planning")


@router.post("/local")
def local_plan(_: LocalPlanRequest) -> dict:
    raise HTTPException(status_code=501, detail="Local planning not implemented yet")
