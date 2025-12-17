from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.routers import airspace, airports, health, local, plan, route, terrain, weather


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
    )

    app.include_router(health.router, prefix=settings.api_prefix, tags=["health"])
    app.include_router(plan.router, prefix=settings.api_prefix, tags=["plan"])
    app.include_router(airports.router, prefix=settings.api_prefix, tags=["airports"])
    app.include_router(weather.router, prefix=settings.api_prefix, tags=["weather"])
    app.include_router(route.router, prefix=settings.api_prefix, tags=["route"])
    app.include_router(local.router, prefix=settings.api_prefix, tags=["local"])
    app.include_router(airspace.router, prefix=settings.api_prefix, tags=["airspace"])
    app.include_router(terrain.router, prefix=settings.api_prefix, tags=["terrain"])

    return app
