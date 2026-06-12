from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import CoberturaListResponse, CoberturaResponse
from app.services.cobertura_service import CoberturaService

router = APIRouter(prefix="/coberturas", tags=["Coberturas"])


def get_service(db: AsyncSession = Depends(get_db)) -> CoberturaService:
    return CoberturaService(db)


@router.get("", response_model=CoberturaListResponse, summary="Listar coberturas")
async def list_coberturas(
    apolice_id: Optional[int]  = Query(None, description="Filtrar por ID da apólice"),
    ativo:      Optional[bool] = Query(None, description="Filtrar por ativo: true ou false"),
    skip:       int = Query(0, ge=0),
    limit:      int = Query(20, ge=1, le=100),
    service: CoberturaService = Depends(get_service),
) -> CoberturaListResponse:
    return await service.list_coberturas(apolice_id, ativo, skip, limit)


@router.get("/{cobertura_id}", response_model=CoberturaResponse, summary="Buscar cobertura por ID")
async def get_cobertura(
    cobertura_id: int,
    service: CoberturaService = Depends(get_service),
) -> CoberturaResponse:
    cobertura = await service.get_by_id(cobertura_id)
    if not cobertura:
        raise HTTPException(status_code=404, detail=f"Cobertura {cobertura_id} não encontrada")
    return CoberturaResponse.model_validate(cobertura)
