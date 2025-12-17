from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter, HTTPException

from app.models.airport import get_airport_coordinates
from app.schemas.route import RouteRequest, RouteResponse, Segment
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

    try:
        points, planned_segments = plan_route(
            origin=(o_lat, o_lon),
            destination=(d_lat, d_lon),
            cruising_altitude_ft=req.altitude,
            avoid_airspaces_enabled=req.avoid_airspaces,
        )
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
        route=[req.origin.upper(), req.destination.upper()],
        distance_nm=round(total_dist, 1),
        time_hr=round(total_time, 2),
        origin_coords=(o_lat, o_lon),
        destination_coords=(d_lat, d_lon),
        segments=segments,
    )
