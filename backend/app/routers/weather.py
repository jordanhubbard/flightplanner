from __future__ import annotations

from fastapi import APIRouter, HTTPException


router = APIRouter()


@router.get("/weather/{code}")
def weather_for_airport(code: str) -> dict:
    raise HTTPException(status_code=501, detail=f"Weather endpoint not implemented yet (requested: {code})")
