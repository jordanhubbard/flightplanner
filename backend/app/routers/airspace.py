from __future__ import annotations

from fastapi import APIRouter, HTTPException


router = APIRouter()


@router.get("/airspace")
def airspace_status() -> dict:
    """Airspace support is not implemented yet."""
    raise HTTPException(status_code=501, detail="Airspace endpoint not implemented yet")
