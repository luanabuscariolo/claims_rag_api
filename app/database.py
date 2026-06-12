from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import os

from app.models.claim import Base
import app.models.insurance  # noqa: F401 — registers all 6 tables with Base.metadata

# DATABASE_URL = "sqlite+aiosqlite:///./data/insurance.db"
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:432931@localhost:5432/seguros_treino"
)

# Create async engine and sessionmaker
engine = create_async_engine(
    DATABASE_URL,
    echo=True, 
    pool_size=5,
    max_overflow=10,
)

async_session = async_sessionmaker(
    bind=engine, 
    expire_on_commit=False, 
    class_=AsyncSession
)

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

