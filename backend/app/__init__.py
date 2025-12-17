from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import Settings
from app.routers import airspace, airports, health, local, plan, route, terrain, weather


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )

    limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

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
