from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.insurance import (
    SinistroDB, SinistroCreate, SinistroListResponse,
    SinistroResponse, SinistroStatusUpdate,
    TipoSeguro, StatusSinistro,
)


class SinistroService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_sinistros(
        self,
        tipo: Optional[TipoSeguro] = None,
        status: Optional[StatusSinistro] = None,
        regiao: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> SinistroListResponse:
        query = select(SinistroDB)
        if tipo:
            query = query.where(SinistroDB.tipo == tipo.value)
        if status:
            query = query.where(SinistroDB.status == status.value)
        if regiao:
            query = query.where(SinistroDB.regiao == regiao)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = [SinistroResponse.model_validate(s) for s in result.scalars().all()]

        return SinistroListResponse(total=total, items=items)

    async def get_by_id(self, sinistro_id: str) -> SinistroDB | None:
        result = await self.db.execute(select(SinistroDB).where(SinistroDB.id == sinistro_id))
        return result.scalar_one_or_none()

    async def create(self, payload: SinistroCreate) -> SinistroResponse:
        sinistro = SinistroDB(
            **payload.model_dump(),
            status=StatusSinistro.PENDENTE,
            criado_em=datetime.utcnow(),
            atualizado_em=datetime.utcnow(),
        )
        self.db.add(sinistro)
        await self.db.flush()
        await self.db.refresh(sinistro)
        return SinistroResponse.model_validate(sinistro)

    async def update_status(self, sinistro_id: str, payload: SinistroStatusUpdate) -> SinistroResponse | None:
        sinistro = await self.get_by_id(sinistro_id)
        if not sinistro:
            return None
        sinistro.status = payload.status.value
        if payload.valor_aprovado is not None:
            sinistro.valor_aprovado = payload.valor_aprovado
        sinistro.atualizado_em = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(sinistro)
        return SinistroResponse.model_validate(sinistro)

    async def get_stats(self) -> dict:
        by_status = await self.db.execute(
            select(
                SinistroDB.status,
                func.count(SinistroDB.id).label("total"),
                func.sum(SinistroDB.valor_reclamado).label("valor_reclamado"),
                func.avg(SinistroDB.valor_reclamado).label("media_reclamado"),
            ).group_by(SinistroDB.status)
        )
        by_tipo = await self.db.execute(
            select(
                SinistroDB.tipo,
                func.count(SinistroDB.id).label("total"),
                func.sum(SinistroDB.valor_reclamado).label("valor_reclamado"),
            ).group_by(SinistroDB.tipo)
        )
        return {
            "por_status": [
                {
                    "status": r.status,
                    "total": r.total,
                    "valor_reclamado": round(r.valor_reclamado or 0, 2),
                    "media_reclamado": round(r.media_reclamado or 0, 2),
                }
                for r in by_status.all()
            ],
            "por_tipo": [
                {
                    "tipo": r.tipo,
                    "total": r.total,
                    "valor_reclamado": round(r.valor_reclamado or 0, 2),
                }
                for r in by_tipo.all()
            ],
        }
