from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from fastapi import APIRouter
from pydantic import Field

from app.routers import local, route
from app.schemas.local import LocalPlanRequest
from app.schemas.route import RouteRequest


router = APIRouter()


class PlanRouteRequest(RouteRequest):
    mode: Literal["route"] = "route"


class PlanLocalRequest(LocalPlanRequest):
    mode: Literal["local"] = "local"


PlanRequest = Annotated[Union[PlanRouteRequest, PlanLocalRequest], Field(discriminator="mode")]


@router.post(
    "/plan",
    summary="Plan a flight (route or local)",
    description="Uses a discriminated union request body with `mode` set to `route` or `local`.",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "examples": {
                        "route": {
                            "summary": "Route planning",
                            "value": {
                                "mode": "route",
                                "origin": "KSFO",
                                "destination": "KLAX",
                                "speed": 110,
                                "speed_unit": "knots",
                                "altitude": 5500,
                                "avoid_airspaces": False,
                                "avoid_terrain": False,
                                "apply_wind": True,
                            },
                        },
                        "local": {
                            "summary": "Local planning",
                            "value": {
                                "mode": "local",
                                "airport": "KSFO",
                                "radius_nm": 25,
                            },
                        },
                    }
                }
            }
        }
    },
)
def plan(req: PlanRequest) -> Any:
    if req.mode == "route":
        return route.calculate_route(req)

    return local.local_plan(req)
