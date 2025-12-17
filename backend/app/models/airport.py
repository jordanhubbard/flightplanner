from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.utils.data_loader import load_airports

def load_airport_cache() -> List[Dict[str, Any]]:
    return load_airports()


def get_airport_coordinates(code: str) -> Optional[Dict[str, Any]]:
    code_u = code.strip().upper()

    for airport in load_airport_cache():
        icao_code = (airport.get("icao") or airport.get("icaoCode") or "").upper()
        iata_code = (airport.get("iata") or airport.get("iataCode") or "").upper()

        if code_u not in {icao_code, iata_code}:
            continue

        lat, lon = _extract_lat_lon(airport)
        if lat is None or lon is None:
            continue

        return {
            "icao": icao_code,
            "iata": iata_code,
            "name": airport.get("name"),
            "city": airport.get("city"),
            "country": airport.get("country"),
            "latitude": float(lat),
            "longitude": float(lon),
            "elevation": airport.get("elevation"),
            "type": airport.get("type"),
        }

    return None


def _extract_lat_lon(airport: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
    if "geometry" in airport and isinstance(airport["geometry"], dict):
        coords = airport["geometry"].get("coordinates")
        if isinstance(coords, list) and len(coords) == 2:
            lon, lat = coords
            return _to_float(lat), _to_float(lon)

    return _to_float(airport.get("lat") or airport.get("latitude")), _to_float(
        airport.get("lon") or airport.get("longitude")
    )


def _to_float(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        return float(v)
    except Exception:
        return None


def search_airports(query: str, *, limit: int = 20) -> List[Dict[str, Any]]:
    q = query.strip().lower()
    if not q:
        return []

    results: List[Dict[str, Any]] = []
    seen: set[str] = set()

    for airport in load_airport_cache():
        icao_code = (airport.get("icao") or airport.get("icaoCode") or "").upper()
        iata_code = (airport.get("iata") or airport.get("iataCode") or "").upper()
        name = str(airport.get("name") or "")
        city = str(airport.get("city") or "")
        country = str(airport.get("country") or "")

        haystack = " ".join([icao_code, iata_code, name, city, country]).lower()
        if q not in haystack:
            continue

        lat, lon = _extract_lat_lon(airport)
        if lat is None or lon is None:
            continue

        normalized = {
            "icao": icao_code,
            "iata": iata_code,
            "name": airport.get("name"),
            "city": airport.get("city") or "",
            "country": airport.get("country") or "",
            "latitude": float(lat),
            "longitude": float(lon),
            "elevation": airport.get("elevation"),
            "type": airport.get("type") or "",
        }

        key = normalized["icao"] or normalized["iata"] or f"{normalized['latitude']},{normalized['longitude']}"
        if key in seen:
            continue

        seen.add(key)
        results.append(normalized)

        if len(results) >= limit:
            break

    return results
