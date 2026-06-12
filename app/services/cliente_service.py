from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import ClienteDB, ClienteCreate, ClienteListResponse, ClienteResponse


class ClienteService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_clientes(
        self,
        regiao: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> ClienteListResponse:
        query = select(ClienteDB)
        if regiao:
            query = query.where(ClienteDB.regiao == regiao)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [ClienteResponse.model_validate(c) for c in result.scalars().all()]

        return ClienteListResponse(total=total, items=items)

    async def get_by_id(self, cliente_id: int) -> ClienteDB | None:
        result = await self.db.execute(select(ClienteDB).where(ClienteDB.id == cliente_id))
        return result.scalar_one_or_none()

    async def create(self, payload: ClienteCreate) -> ClienteResponse:
        cliente = ClienteDB(**payload.model_dump())
        self.db.add(cliente)
        await self.db.flush()
        await self.db.refresh(cliente)
        return ClienteResponse.model_validate(cliente)
