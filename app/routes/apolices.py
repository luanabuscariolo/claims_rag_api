from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import (
    ApoliceListResponse, ApoliceResponse,
    CoberturaResponse, SinistroResponse,
    TipoSeguro, StatusApolice,
)
from app.services.apolice_service import ApoliceService

router = APIRouter(prefix="/apolices", tags=["Apólices"])


def get_service(db: AsyncSession = Depends(get_db)) -> ApoliceService:
    return ApoliceService(db)


@router.get("", response_model=ApoliceListResponse, summary="Listar apólices")
async def list_apolices(
    tipo:       Optional[TipoSeguro]   = Query(None, description="Filtrar por tipo: auto, home, health"),
    status:     Optional[StatusApolice] = Query(None, description="Filtrar por status: ativa, expirada, cancelada"),
    cliente_id: Optional[int]          = Query(None, description="Filtrar por ID do cliente"),
    skip:       int = Query(0, ge=0),
    limit:      int = Query(20, ge=1, le=100),
    service: ApoliceService = Depends(get_service),
) -> ApoliceListResponse:
    return await service.list_apolices(tipo, status, cliente_id, skip, limit)


@router.get("/{numero_apolice}", response_model=ApoliceResponse, summary="Buscar apólice pelo número")
async def get_apolice(
    numero_apolice: str,
    service: ApoliceService = Depends(get_service),
) -> ApoliceResponse:
    apolice = await service.get_by_numero(numero_apolice)
    if not apolice:
        raise HTTPException(status_code=404, detail=f"Apólice '{numero_apolice}' não encontrada")
    return ApoliceResponse.model_validate(apolice)


@router.get("/{numero_apolice}/coberturas", response_model=list[CoberturaResponse], summary="Listar coberturas da apólice")
async def get_coberturas(
    numero_apolice: str,
    service: ApoliceService = Depends(get_service),
) -> list[CoberturaResponse]:
    apolice = await service.get_by_numero(numero_apolice)
    if not apolice:
        raise HTTPException(status_code=404, detail=f"Apólice '{numero_apolice}' não encontrada")
    return await service.get_coberturas(numero_apolice)


@router.get("/{numero_apolice}/sinistros", response_model=list[SinistroResponse], summary="Listar sinistros da apólice")
async def get_sinistros(
    numero_apolice: str,
    service: ApoliceService = Depends(get_service),
) -> list[SinistroResponse]:
    apolice = await service.get_by_numero(numero_apolice)
    if not apolice:
        raise HTTPException(status_code=404, detail=f"Apólice '{numero_apolice}' não encontrada")
    return await service.get_sinistros(numero_apolice)
