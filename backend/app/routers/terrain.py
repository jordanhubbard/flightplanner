from __future__ import annotations

from fastapi import APIRouter, HTTPException


router = APIRouter()


@router.get("/terrain")
def terrain_status() -> dict:
    raise HTTPException(status_code=501, detail="Terrain endpoint not implemented yet")
