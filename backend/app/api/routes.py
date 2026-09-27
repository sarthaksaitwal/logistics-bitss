from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.models.schemas import OptimizeRequest, OptimizeResponse
from app.services.optimizer import optimize_route
from app.services.osrm_client import OSRMClient, OSRMError
from app.services.solver import SolverError

router = APIRouter(prefix="/api")

def get_osrm_client(request: Request) -> OSRMClient:
    return request.app.state.osrm

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(
    body: OptimizeRequest,
    osrm: OSRMClient = Depends(get_osrm_client),
) -> OptimizeResponse:
    try:
        return await optimize_route(body, osrm, settings.solver_time_limit_ms)
    except OSRMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except SolverError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
