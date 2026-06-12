from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import (
    ApoliceDB, ApoliceListResponse, ApoliceResponse,
    CoberturaDB, CoberturaResponse,
    SinistroDB, SinistroResponse,
    TipoSeguro, StatusApolice,
)


class ApoliceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_apolices(
        self,
        tipo: Optional[TipoSeguro] = None,
        status: Optional[StatusApolice] = None,
        cliente_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> ApoliceListResponse:
        query = select(ApoliceDB)
        if tipo:
            query = query.where(ApoliceDB.tipo == tipo.value)
        if status:
            query = query.where(ApoliceDB.status == status.value)
        if cliente_id is not None:
            query = query.where(ApoliceDB.cliente_id == cliente_id)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [ApoliceResponse.model_validate(a) for a in result.scalars().all()]

        return ApoliceListResponse(total=total, items=items)

    async def get_by_numero(self, numero_apolice: str) -> ApoliceDB | None:
        result = await self.db.execute(
            select(ApoliceDB).where(ApoliceDB.numero_apolice == numero_apolice)
        )
        return result.scalar_one_or_none()

    async def get_coberturas(self, numero_apolice: str) -> list[CoberturaResponse]:
        apolice = await self.get_by_numero(numero_apolice)
        if not apolice:
            return []
        result = await self.db.execute(
            select(CoberturaDB).where(CoberturaDB.apolice_id == apolice.id)
        )
        return [CoberturaResponse.model_validate(c) for c in result.scalars().all()]

    async def get_sinistros(self, numero_apolice: str) -> list[SinistroResponse]:
        result = await self.db.execute(
            select(SinistroDB).where(SinistroDB.numero_apolice == numero_apolice)
        )
        return [SinistroResponse.model_validate(s) for s in result.scalars().all()]
