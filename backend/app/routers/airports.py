from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.airport import get_airport_coordinates, search_airports_advanced


router = APIRouter()


@router.get("/airports/search")
def airports_search(
    q: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    radius_nm: float | None = Query(None, ge=0.1),
) -> list[dict]:
    if not q and (lat is None or lon is None):
        raise HTTPException(status_code=400, detail="q is required unless lat/lon are provided")
    return search_airports_advanced(query=q, limit=limit, lat=lat, lon=lon, radius_nm=radius_nm)


@router.get("/airports/{code}")
def airport_lookup(code: str) -> dict:
    airport = get_airport_coordinates(code)
    if not airport:
        raise HTTPException(status_code=404, detail=f"Airport {code} not found")
    return airport


@router.get("/airport/{code}")
def airport_lookup_legacy(code: str) -> dict:
    return airport_lookup(code)
