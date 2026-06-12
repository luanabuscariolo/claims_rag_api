from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import CorretorListResponse, CorretorResponse
from app.services.corretor_service import CorretorService

router = APIRouter(prefix="/corretores", tags=["Corretores"])


def get_service(db: AsyncSession = Depends(get_db)) -> CorretorService:
    return CorretorService(db)


@router.get("", response_model=CorretorListResponse, summary="Listar corretores")
async def list_corretores(
    ativo:  Optional[bool] = Query(None, description="Filtrar por ativo: true ou false"),
    skip:   int = Query(0, ge=0),
    limit:  int = Query(20, ge=1, le=100),
    service: CorretorService = Depends(get_service),
) -> CorretorListResponse:
    return await service.list_corretores(ativo, skip, limit)


@router.get("/{corretor_id}", response_model=CorretorResponse, summary="Buscar corretor por ID")
async def get_corretor(
    corretor_id: int,
    service: CorretorService = Depends(get_service),
) -> CorretorResponse:
    corretor = await service.get_by_id(corretor_id)
    if not corretor:
        raise HTTPException(status_code=404, detail=f"Corretor {corretor_id} não encontrado")
    return CorretorResponse.model_validate(corretor)
