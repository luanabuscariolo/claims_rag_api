from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.insurance import PagamentoListResponse, PagamentoResponse, StatusPagamento
from app.services.pagamento_service import PagamentoService

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])


def get_service(db: AsyncSession = Depends(get_db)) -> PagamentoService:
    return PagamentoService(db)


@router.get("", response_model=PagamentoListResponse, summary="Listar pagamentos")
async def list_pagamentos(
    sinistro_id: Optional[str]           = Query(None, description="Filtrar por ID do sinistro, ex: SIN-000001"),
    status_:     Optional[StatusPagamento] = Query(None, alias="status", description="Filtrar por status: pago, pendente, cancelado"),
    skip:        int = Query(0, ge=0),
    limit:       int = Query(20, ge=1, le=100),
    service: PagamentoService = Depends(get_service),
) -> PagamentoListResponse:
    return await service.list_pagamentos(sinistro_id, status_, skip, limit)


@router.get("/{pagamento_id}", response_model=PagamentoResponse, summary="Buscar pagamento por ID")
async def get_pagamento(
    pagamento_id: int,
    service: PagamentoService = Depends(get_service),
) -> PagamentoResponse:
    pagamento = await service.get_by_id(pagamento_id)
    if not pagamento:
        raise HTTPException(status_code=404, detail=f"Pagamento {pagamento_id} não encontrado")
    return PagamentoResponse.model_validate(pagamento)
