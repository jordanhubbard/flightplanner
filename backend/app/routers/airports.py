from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.airport import get_airport_coordinates, search_airports


router = APIRouter()


@router.get("/airports/search")
def airports_search(q: str = Query(..., min_length=1), limit: int = Query(20, ge=1, le=50)) -> list[dict]:
    return search_airports(q, limit=limit)


@router.get("/airports/{code}")
def airport_lookup(code: str) -> dict:
    airport = get_airport_coordinates(code)
    if not airport:
        raise HTTPException(status_code=404, detail=f"Airport {code} not found")
    return airport


@router.get("/airport/{code}")
def airport_lookup_legacy(code: str) -> dict:
    return airport_lookup(code)
