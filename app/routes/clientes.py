from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import ClienteCreate, ClienteListResponse, ClienteResponse
from app.services.cliente_service import ClienteService

router = APIRouter(prefix="/clientes", tags=["Clientes"])


def get_service(db: AsyncSession = Depends(get_db)) -> ClienteService:
    return ClienteService(db)


@router.get("", response_model=ClienteListResponse, summary="Listar clientes")
async def list_clientes(
    regiao: Optional[str] = Query(None, description="Filtrar por região: Sudeste, Sul, Nordeste..."),
    skip:   int = Query(0, ge=0, description="Registros a pular"),
    limit:  int = Query(20, ge=1, le=100, description="Máximo de registros"),
    service: ClienteService = Depends(get_service),
) -> ClienteListResponse:
    return await service.list_clientes(regiao, skip, limit)


@router.get("/{cliente_id}", response_model=ClienteResponse, summary="Buscar cliente por ID")
async def get_cliente(
    cliente_id: int,
    service: ClienteService = Depends(get_service),
) -> ClienteResponse:
    cliente = await service.get_by_id(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=f"Cliente {cliente_id} não encontrado")
    return ClienteResponse.model_validate(cliente)


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED, summary="Criar novo cliente")
async def create_cliente(
    payload: ClienteCreate,
    service: ClienteService = Depends(get_service),
) -> ClienteResponse:
    return await service.create(payload)
