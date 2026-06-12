from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import CorretorDB, CorretorListResponse, CorretorResponse


class CorretorService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_corretores(
        self,
        ativo: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> CorretorListResponse:
        query = select(CorretorDB)
        if ativo is not None:
            query = query.where(CorretorDB.ativo == ativo)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [CorretorResponse.model_validate(c) for c in result.scalars().all()]

        return CorretorListResponse(total=total, items=items)

    async def get_by_id(self, corretor_id: int) -> CorretorDB | None:
        result = await self.db.execute(select(CorretorDB).where(CorretorDB.id == corretor_id))
        return result.scalar_one_or_none()
