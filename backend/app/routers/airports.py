from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.airport import get_airport_coordinates


router = APIRouter()


@router.get("/airports/{code}")
def airport_lookup(code: str) -> dict:
    airport = get_airport_coordinates(code)
    if not airport:
        raise HTTPException(status_code=404, detail=f"Airport {code} not found")
    return airport


@router.get("/airport/{code}")
def airport_lookup_legacy(code: str) -> dict:
    return airport_lookup(code)
