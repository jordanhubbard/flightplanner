from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter, HTTPException

from app.models.airport import get_airport_coordinates, load_airport_cache
from app.schemas.route import RouteRequest, RouteResponse, Segment
from app.services import a_star
from app.services import terrain_service
from app.services.xctry_route_planner import haversine_nm, plan_route


router = APIRouter()


@router.post("/route", response_model=RouteResponse)
def calculate_route(req: RouteRequest) -> RouteResponse:
    origin = get_airport_coordinates(req.origin)
    dest = get_airport_coordinates(req.destination)
    if not origin or not dest:
        raise HTTPException(status_code=400, detail="Invalid origin or destination code")

    o_lat = origin["latitude"]
    o_lon = origin["longitude"]
    d_lat = dest["latitude"]
    d_lon = dest["longitude"]

    route_codes = [req.origin.upper(), req.destination.upper()]
    if req.plan_fuel_stops or req.aircraft_range_nm is not None:
        max_leg = float(req.aircraft_range_nm) if req.aircraft_range_nm is not None else float(req.max_leg_distance)
        max_leg = min(max_leg, float(req.max_leg_distance))

        candidates = []
        for ap in load_airport_cache():
            icao = str(ap.get("icao") or "").upper()
            iata = str(ap.get("iata") or "").upper()
            code = icao or iata
            if not code:
                continue
            lat = ap.get("latitude")
            lon = ap.get("longitude")
            if lat is None or lon is None:
                continue
            candidates.append(a_star.AirportNode(code=code, lat=float(lat), lon=float(lon)))

        try:
            per_leg_penalty = 0.0
            if req.fuel_strategy == "economy":
                per_leg_penalty = 25.0

            route_codes = a_star.find_route(
                origin=a_star.AirportNode(code=req.origin.upper(), lat=float(o_lat), lon=float(o_lon)),
                destination=a_star.AirportNode(code=req.destination.upper(), lat=float(d_lat), lon=float(d_lon)),
                candidates=candidates,
                max_leg_distance_nm=max_leg,
                per_leg_penalty_nm=per_leg_penalty,
            )
        except a_star.AStarError as e:
            raise HTTPException(status_code=400, detail=str(e))

    try:
        points: List[tuple[float, float]] = []
        planned_segments = []

        for i in range(len(route_codes) - 1):
            a_code = route_codes[i]
            b_code = route_codes[i + 1]
            a_ap = get_airport_coordinates(a_code)
            b_ap = get_airport_coordinates(b_code)
            if not a_ap or not b_ap:
                raise HTTPException(status_code=400, detail="Invalid waypoint code")

            leg_points, leg_segments = plan_route(
                origin=(float(a_ap["latitude"]), float(a_ap["longitude"])),
                destination=(float(b_ap["latitude"]), float(b_ap["longitude"])),
                cruising_altitude_ft=req.altitude,
                avoid_airspaces_enabled=req.avoid_airspaces,
            )

            if not points:
                points = list(leg_points)
            else:
                points.extend(list(leg_points)[1:])

            planned_segments.extend(list(leg_segments))
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Airspace data file not found ({e}). Populate backend/data/airspaces_us.json or set AIRSPACES_FILE."
            ),
        )

    if req.avoid_terrain:
        try:
            max_elev_ft = terrain_service.max_elevation_ft_along_points(points)
        except terrain_service.TerrainServiceError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception:
            raise HTTPException(status_code=503, detail="Terrain service error")

        if max_elev_ft is not None:
            min_safe_alt = max_elev_ft + 1000.0
            if req.altitude < min_safe_alt:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Requested altitude {req.altitude} ft is below recommended minimum {min_safe_alt:.0f} ft "
                        f"(max terrain {max_elev_ft:.0f} ft + 1000 ft clearance)"
                    ),
                )

    total_dist = 0.0
    for i in range(len(points) - 1):
        total_dist += haversine_nm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])

    speed_kt = req.speed if req.speed_unit == "knots" else req.speed * 0.868976
    total_time = total_dist / speed_kt if speed_kt else 0.0

    fuel_burn = None
    reserve_minutes = None
    fuel_required = None
    fuel_required_with_reserve = None

    if req.plan_fuel_stops or req.fuel_burn_gph is not None:
        fuel_burn = float(req.fuel_burn_gph) if req.fuel_burn_gph is not None else 10.0
        reserve_minutes = int(req.reserve_minutes)
        fuel_required = total_time * fuel_burn
        fuel_required_with_reserve = fuel_required + fuel_burn * (reserve_minutes / 60.0)

    segments: List[Segment] = []
    for idx, seg in enumerate(planned_segments):
        seg_type: Literal["climb", "cruise", "descent"] = "cruise"
        if idx == 0:
            seg_type = "climb"
        if idx == len(planned_segments) - 1:
            seg_type = "descent" if len(planned_segments) > 1 else seg_type

        segments.append(
            Segment(
                start=seg.start,
                end=seg.end,
                type=seg_type,
                vfr_altitude=seg.vfr_altitude_ft,
            )
        )

    return RouteResponse(
        route=route_codes,
        distance_nm=round(total_dist, 1),
        time_hr=round(total_time, 2),
        origin_coords=(o_lat, o_lon),
        destination_coords=(d_lat, d_lon),
        segments=segments,
        fuel_stops=route_codes[1:-1] or None,
        fuel_burn_gph=fuel_burn,
        reserve_minutes=reserve_minutes,
        fuel_required_gal=round(fuel_required, 2) if fuel_required is not None else None,
        fuel_required_with_reserve_gal=round(fuel_required_with_reserve, 2)
        if fuel_required_with_reserve is not None
        else None,
    )
