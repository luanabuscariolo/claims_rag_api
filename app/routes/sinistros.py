from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import (
    SinistroCreate, SinistroListResponse, SinistroResponse,
    SinistroStatusUpdate, TipoSeguro, StatusSinistro,
)
from app.services.sinistro_service import SinistroService

router = APIRouter(prefix="/sinistros", tags=["Sinistros"])


def get_service(db: AsyncSession = Depends(get_db)) -> SinistroService:
    return SinistroService(db)


@router.get("", response_model=SinistroListResponse, summary="Listar sinistros com filtros")
async def list_sinistros(
    tipo:   Optional[TipoSeguro]    = Query(None, description="Filtrar por tipo: auto, home, health"),
    status_: Optional[StatusSinistro] = Query(None, alias="status", description="Filtrar por status: aprovado, pendente, rejeitado, em_analise"),
    regiao: Optional[str]           = Query(None, description="Filtrar por região"),
    skip:   int = Query(0, ge=0),
    limit:  int = Query(20, ge=1, le=100),
    service: SinistroService = Depends(get_service),
) -> SinistroListResponse:
    return await service.list_sinistros(tipo, status_, regiao, skip, limit)


# IMPORTANTE: /stats deve vir ANTES de /{sinistro_id}
# Se a rota /{sinistro_id} viesse primeiro, o FastAPI tentaria
# interpretar "stats" como um sinistro_id e retornaria 404.
@router.get("/stats", summary="Estatísticas de sinistros por status e tipo")
async def get_stats(service: SinistroService = Depends(get_service)) -> dict:
    return await service.get_stats()


@router.get("/{sinistro_id}", response_model=SinistroResponse, summary="Buscar sinistro por ID")
async def get_sinistro(
    sinistro_id: str,
    service: SinistroService = Depends(get_service),
) -> SinistroResponse:
    sinistro = await service.get_by_id(sinistro_id)
    if not sinistro:
        raise HTTPException(status_code=404, detail=f"Sinistro '{sinistro_id}' não encontrado")
    return SinistroResponse.model_validate(sinistro)


@router.post("", response_model=SinistroResponse, status_code=status.HTTP_201_CREATED, summary="Criar novo sinistro")
async def create_sinistro(
    payload: SinistroCreate,
    service: SinistroService = Depends(get_service),
) -> SinistroResponse:
    existing = await service.get_by_id(payload.id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Sinistro '{payload.id}' já existe")
    return await service.create(payload)


@router.patch("/{sinistro_id}/status", response_model=SinistroResponse, summary="Atualizar status do sinistro")
async def update_status(
    sinistro_id: str,
    payload: SinistroStatusUpdate,
    service: SinistroService = Depends(get_service),
) -> SinistroResponse:
    result = await service.update_status(sinistro_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail=f"Sinistro '{sinistro_id}' não encontrado")
    return result
