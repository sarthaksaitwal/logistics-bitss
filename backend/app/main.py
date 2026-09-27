from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.services.osrm_client import OSRMClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(
        timeout=settings.osrm_timeout_s,
        headers={"User-Agent": "logistics-bitss/0.1"},
    ) as http:
        app.state.osrm = OSRMClient(http, settings.osrm_url, settings.osrm_profile)
        yield


app = FastAPI(title="Logistics bitss", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
