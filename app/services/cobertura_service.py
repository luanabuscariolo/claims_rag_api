from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import CoberturaDB, CoberturaListResponse, CoberturaResponse


class CoberturaService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_coberturas(
        self,
        apolice_id: Optional[int] = None,
        ativo: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> CoberturaListResponse:
        query = select(CoberturaDB)
        if apolice_id is not None:
            query = query.where(CoberturaDB.apolice_id == apolice_id)
        if ativo is not None:
            query = query.where(CoberturaDB.ativo == ativo)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [CoberturaResponse.model_validate(c) for c in result.scalars().all()]

        return CoberturaListResponse(total=total, items=items)

    async def get_by_id(self, cobertura_id: int) -> CoberturaDB | None:
        result = await self.db.execute(select(CoberturaDB).where(CoberturaDB.id == cobertura_id))
        return result.scalar_one_or_none()
