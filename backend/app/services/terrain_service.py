from __future__ import annotations

import os
from functools import lru_cache
from typing import Iterable, List, Optional, Tuple

import httpx


class TerrainServiceError(RuntimeError):
    pass


def _api_key() -> str:
    key = os.environ.get("OPENTOPOGRAPHY_API_KEY")
    if not key:
        raise TerrainServiceError("Missing OPENTOPOGRAPHY_API_KEY for OpenTopography terrain requests")
    return key


def _parse_aai_grid_elevation_m(text: str) -> Optional[float]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return None

    nodata = None
    data_start = 0
    for idx, line in enumerate(lines):
        parts = line.split()
        if len(parts) >= 2 and parts[0].lower() == "nodata_value":
            try:
                nodata = float(parts[1])
            except Exception:
                nodata = None

        if len(parts) >= 2 and parts[0].lower() in {
            "ncols",
            "nrows",
            "xllcorner",
            "yllcorner",
            "xllcenter",
            "yllcenter",
            "cellsize",
            "nodata_value",
        }:
            data_start = idx + 1
            continue

        break

    for line in lines[data_start:]:
        for token in line.split():
            try:
                v = float(token)
            except Exception:
                continue
            if nodata is not None and v == nodata:
                continue
            return v

    return None


@lru_cache(maxsize=4096)
def get_elevation_m(lat: float, lon: float, demtype: str = "SRTMGL1") -> Optional[float]:
    key = _api_key()
    eps = 1e-4

    params = {
        "demtype": demtype,
        "south": lat - eps,
        "north": lat + eps,
        "west": lon - eps,
        "east": lon + eps,
        "outputFormat": "AAIGrid",
        "API_Key": key,
    }

    resp = httpx.get("https://portal.opentopography.org/API/globaldem", params=params, timeout=30)
    resp.raise_for_status()
    return _parse_aai_grid_elevation_m(resp.text)


def get_elevation_ft(lat: float, lon: float, demtype: str = "SRTMGL1") -> Optional[float]:
    elev_m = get_elevation_m(lat, lon, demtype=demtype)
    if elev_m is None:
        return None
    return elev_m * 3.28084


def max_elevation_ft_along_points(points: Iterable[Tuple[float, float]], demtype: str = "SRTMGL1") -> Optional[float]:
    max_ft: Optional[float] = None
    for lat, lon in points:
        elev_ft = get_elevation_ft(lat, lon, demtype=demtype)
        if elev_ft is None:
            continue
        if max_ft is None or elev_ft > max_ft:
            max_ft = elev_ft
    return max_ft


def elevation_profile(
    points: List[Tuple[float, float]],
    demtype: str = "SRTMGL1",
) -> List[Tuple[float, float, Optional[float]]]:
    out: List[Tuple[float, float, Optional[float]]] = []
    for lat, lon in points:
        out.append((lat, lon, get_elevation_ft(lat, lon, demtype=demtype)))
    return out
