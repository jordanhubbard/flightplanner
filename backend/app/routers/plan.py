from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from fastapi import APIRouter
from pydantic import Field

from app.routers import local, route


router = APIRouter()


class PlanRouteRequest(route.RouteRequest):
    mode: Literal["route"] = "route"


class PlanLocalRequest(local.LocalPlanRequest):
    mode: Literal["local"] = "local"


PlanRequest = Annotated[Union[PlanRouteRequest, PlanLocalRequest], Field(discriminator="mode")]


@router.post("/plan")
def plan(req: PlanRequest) -> Any:
    if req.mode == "route":
        return route.calculate_route(req)

    return local.local_plan(req)
