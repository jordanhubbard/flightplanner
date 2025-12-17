from __future__ import annotations

import re
from fractions import Fraction
from typing import Any, Dict, Optional

import httpx

from app.utils.ttl_cache import weather_cache


def fetch_metar_raw(station: str) -> Optional[str]:
    station_u = station.upper()
    cache_key = f"metar:{station_u}"

    def _fetch() -> Optional[str]:
        resp = httpx.get(
            "https://aviationweather.gov/api/data/metar",
            params={"ids": station_u, "format": "raw"},
            headers={"User-Agent": "flightplanner"},
            timeout=20,
        )

        if resp.status_code == 204:
            return None

        resp.raise_for_status()
        text = resp.text.strip()
        if not text:
            return None

        # API may return multiple lines; we only requested a single station.
        return text.splitlines()[0].strip() or None

    return weather_cache.get_or_set(cache_key, ttl_s=300, fn=_fetch, allow_stale_on_error=True)


_WIND_RE = re.compile(r"\b(?P<dir>\d{3}|VRB)(?P<speed>\d{2,3})(G(?P<gust>\d{2,3}))?KT\b")
_TEMP_RE = re.compile(r"\b(?P<t>M?\d{2})/(?P<d>M?\d{2})\b")
_VIS_RE = re.compile(r"\b(?P<vis>(P?\d+)(?:\s\d/\d)?|\d+/\d)SM\b")
_CEIL_RE = re.compile(r"\b(?P<kind>BKN|OVC|VV)(?P<hundreds>\d{3})\b")


def _parse_signed_int(token: str) -> int:
    if token.startswith("M"):
        return -int(token[1:])
    return int(token)


def _parse_visibility_sm(token: str) -> Optional[float]:
    token = token.strip().removesuffix("SM")
    if token.startswith("P"):
        try:
            return float(token[1:])
        except Exception:
            return None

    if " " in token:
        whole, frac = token.split(" ", 1)
        try:
            return float(int(whole) + float(Fraction(frac)))
        except Exception:
            return None

    if "/" in token:
        try:
            return float(Fraction(token))
        except Exception:
            return None

    try:
        return float(token)
    except Exception:
        return None


def parse_metar(raw: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {}

    wind_m = _WIND_RE.search(raw)
    if wind_m:
        d = wind_m.group("dir")
        out["wind_direction"] = None if d == "VRB" else int(d)
        out["wind_speed_kt"] = int(wind_m.group("speed"))

    vis_m = _VIS_RE.search(raw)
    if vis_m:
        vis = _parse_visibility_sm(vis_m.group("vis"))
        if vis is not None:
            out["visibility_sm"] = vis

    temps = _TEMP_RE.search(raw)
    if temps:
        try:
            c = _parse_signed_int(temps.group("t"))
            out["temperature_f"] = round((c * 9 / 5) + 32)
        except Exception:
            pass

    ceilings = []
    for m in _CEIL_RE.finditer(raw):
        try:
            ceilings.append(int(m.group("hundreds")) * 100)
        except Exception:
            continue
    if ceilings:
        out["ceiling_ft"] = min(ceilings)

    return out
