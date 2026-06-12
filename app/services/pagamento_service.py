from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import PagamentoDB, PagamentoListResponse, PagamentoResponse, StatusPagamento


class PagamentoService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_pagamentos(
        self,
        sinistro_id: Optional[str] = None,
        status: Optional[StatusPagamento] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> PagamentoListResponse:
        query = select(PagamentoDB)
        if sinistro_id:
            query = query.where(PagamentoDB.sinistro_id == sinistro_id)
        if status:
            query = query.where(PagamentoDB.status == status.value)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [PagamentoResponse.model_validate(p) for p in result.scalars().all()]

        return PagamentoListResponse(total=total, items=items)

    async def get_by_id(self, pagamento_id: int) -> PagamentoDB | None:
        result = await self.db.execute(select(PagamentoDB).where(PagamentoDB.id == pagamento_id))
        return result.scalar_one_or_none()
