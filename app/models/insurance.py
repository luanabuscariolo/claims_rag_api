from datetime import date, datetime
from typing import Optional
from enum import StrEnum
from pydantic import BaseModel, Field

from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, Boolean, Text, ForeignKey

from app.models.claim import Base


# ─── Enums ────────────────────────────────────────────────────────────────────

class TipoSeguro(StrEnum):
    AUTO   = "auto"
    HOME   = "home"
    HEALTH = "health"

class StatusApolice(StrEnum):
    ATIVA     = "ativa"
    EXPIRADA  = "expirada"
    CANCELADA = "cancelada"

class StatusSinistro(StrEnum):
    APROVADO  = "aprovado"
    EM_ANALISE = "em_analise"
    PENDENTE  = "pendente"
    REJEITADO = "rejeitado"

class StatusPagamento(StrEnum):
    PENDENTE  = "pendente"
    PAGO      = "pago"
    CANCELADO = "cancelado"


# ─── SQLAlchemy ORM models ────────────────────────────────────────────────────

class ClienteDB(Base):
    __tablename__ = "clientes"

    id              = Column(Integer, primary_key=True)
    nome            = Column(String(100), nullable=False)
    cpf             = Column(String(14), unique=True, nullable=False)
    email           = Column(String(100))
    telefone        = Column(String(20))
    data_nascimento = Column(Date)
    cidade          = Column(String(80))
    estado          = Column(String(2))
    regiao          = Column(String(20))
    criado_em       = Column(DateTime, default=datetime.utcnow)


class CorretorDB(Base):
    __tablename__ = "corretores"

    id                = Column(Integer, primary_key=True)
    nome              = Column(String(100), nullable=False)
    email             = Column(String(100), unique=True)
    regiao            = Column(String(20))
    taxa_comissao     = Column(Numeric(5, 2))
    data_contratacao  = Column(Date)
    ativo             = Column(Boolean, default=True)


class ApoliceDB(Base):
    __tablename__ = "apolices"

    id               = Column(Integer, primary_key=True)
    numero_apolice   = Column(String(50), unique=True, nullable=False)
    cliente_id       = Column(Integer, ForeignKey("clientes.id"))
    corretor_id      = Column(Integer, ForeignKey("corretores.id"))
    tipo             = Column(String(20), nullable=False)
    data_inicio      = Column(Date, nullable=False)
    data_fim         = Column(Date, nullable=False)
    premio_mensal    = Column(Numeric(10, 2))
    limite_cobertura = Column(Numeric(12, 2))
    franquia         = Column(Numeric(10, 2))
    status           = Column(String(20), default="ativa")


class CoberturaDB(Base):
    __tablename__ = "coberturas"

    id             = Column(Integer, primary_key=True)
    apolice_id     = Column(Integer, ForeignKey("apolices.id"))
    tipo_cobertura = Column(String(100), nullable=False)
    limite         = Column(Numeric(12, 2))
    ativo          = Column(Boolean, default=True)


class SinistroDB(Base):
    __tablename__ = "sinistros"

    id              = Column(String(20), primary_key=True)
    nome_segurado   = Column(String(100), nullable=False)
    tipo            = Column(String(20), nullable=False)
    valor_reclamado = Column(Numeric(12, 2))
    status          = Column(String(20))
    data_sinistro   = Column(Date)
    numero_apolice  = Column(String(50), ForeignKey("apolices.numero_apolice"))
    descricao       = Column(Text)
    criado_em       = Column(DateTime)
    atualizado_em   = Column(DateTime)
    resolvido_em    = Column(DateTime)
    valor_aprovado  = Column(Numeric(12, 2))
    dias_resolucao  = Column(Integer)
    regiao          = Column(String(20))
    canal           = Column(String(30))


class PagamentoDB(Base):
    __tablename__ = "pagamentos"

    id             = Column(Integer, primary_key=True)
    sinistro_id    = Column(String(20), ForeignKey("sinistros.id"))
    valor          = Column(Numeric(12, 2), nullable=False)
    data_pagamento = Column(Date)
    metodo         = Column(String(30))
    status         = Column(String(20), default="pago")
    observacao     = Column(Text)


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

# --- Clientes ---

class ClienteCreate(BaseModel):
    nome:            str           = Field(..., max_length=100)
    cpf:             str           = Field(..., max_length=14)
    email:           Optional[str] = Field(None, max_length=100)
    telefone:        Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = None
    cidade:          Optional[str] = Field(None, max_length=80)
    estado:          Optional[str] = Field(None, max_length=2)
    regiao:          Optional[str] = Field(None, max_length=20)

class ClienteResponse(BaseModel):
    id:              int
    nome:            str
    cpf:             str
    email:           Optional[str]
    telefone:        Optional[str]
    data_nascimento: Optional[date]
    cidade:          Optional[str]
    estado:          Optional[str]
    regiao:          Optional[str]
    criado_em:       Optional[datetime]
    model_config = {"from_attributes": True}

class ClienteListResponse(BaseModel):
    total: int
    items: list[ClienteResponse]


# --- Corretores ---

class CorretorResponse(BaseModel):
    id:               int
    nome:             str
    email:            Optional[str]
    regiao:           Optional[str]
    taxa_comissao:    Optional[float]
    data_contratacao: Optional[date]
    ativo:            Optional[bool]
    model_config = {"from_attributes": True}

class CorretorListResponse(BaseModel):
    total: int
    items: list[CorretorResponse]


# --- Apolices ---

class ApoliceResponse(BaseModel):
    id:               int
    numero_apolice:   str
    cliente_id:       Optional[int]
    corretor_id:      Optional[int]
    tipo:             TipoSeguro
    data_inicio:      date
    data_fim:         date
    premio_mensal:    Optional[float]
    limite_cobertura: Optional[float]
    franquia:         Optional[float]
    status:           Optional[StatusApolice]
    model_config = {"from_attributes": True}

class ApoliceListResponse(BaseModel):
    total: int
    items: list[ApoliceResponse]


# --- Coberturas ---

class CoberturaResponse(BaseModel):
    id:             int
    apolice_id:     Optional[int]
    tipo_cobertura: str
    limite:         Optional[float]
    ativo:          Optional[bool]
    model_config = {"from_attributes": True}

class CoberturaListResponse(BaseModel):
    total: int
    items: list[CoberturaResponse]


# --- Sinistros ---

class SinistroCreate(BaseModel):
    id:             str           = Field(..., max_length=20, description="Ex: SIN-000101")
    nome_segurado:  str           = Field(..., max_length=100)
    tipo:           TipoSeguro    = Field(...)
    valor_reclamado: float        = Field(..., gt=0)
    numero_apolice: str           = Field(..., max_length=50)
    descricao:      str           = Field(..., min_length=10)
    data_sinistro:  Optional[date] = None
    regiao:         Optional[str] = Field(None, max_length=20)
    canal:          Optional[str] = Field(None, max_length=30)

class SinistroStatusUpdate(BaseModel):
    status:         StatusSinistro = Field(...)
    valor_aprovado: Optional[float] = Field(None, gt=0)

class SinistroResponse(BaseModel):
    id:              str
    nome_segurado:   str
    tipo:            Optional[str]
    valor_reclamado: Optional[float]
    status:          Optional[str]
    data_sinistro:   Optional[date]
    numero_apolice:  Optional[str]
    descricao:       Optional[str]
    criado_em:       Optional[datetime]
    atualizado_em:   Optional[datetime]
    resolvido_em:    Optional[datetime]
    valor_aprovado:  Optional[float]
    dias_resolucao:  Optional[int]
    regiao:          Optional[str]
    canal:           Optional[str]
    model_config = {"from_attributes": True}

class SinistroListResponse(BaseModel):
    total: int
    items: list[SinistroResponse]


# --- Pagamentos ---

class PagamentoResponse(BaseModel):
    id:             int
    sinistro_id:    Optional[str]
    valor:          float
    data_pagamento: Optional[date]
    metodo:         Optional[str]
    status:         Optional[str]
    observacao:     Optional[str]
    model_config = {"from_attributes": True}

class PagamentoListResponse(BaseModel):
    total: int
    items: list[PagamentoResponse]
