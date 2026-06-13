![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![Frontend](https://img.shields.io/badge/frontend-WIP-orange)
![License](https://img.shields.io/badge/license-MIT-green)

# Insurance Claims RAG API

A full-stack insurance management system with natural language search, built on a RAG (Retrieval-Augmented Generation) pipeline.

Combines **FastAPI** + **PostgreSQL** + **ChromaDB** + **Sentence Transformers** for semantic retrieval, with optional answer generation via **LM Studio** (local) or any OpenAI-compatible backend. Includes a **React dual-portal frontend** (insurer and client portals).

---

## Features

| Feature | Technology |
|---|---|
| Claims CRUD with filters and pagination | FastAPI + SQLAlchemy + PostgreSQL |
| Insurance entity management (clients, brokers, policies, coverages, claims, payments) | PostgreSQL remote database |
| Policy document ingestion | Chunking + Sentence Transformers |
| Semantic similarity search | ChromaDB (vector database) |
| Natural language Q&A | RAG pipeline + LM Studio / OpenAI-compatible |
| Dual-portal React frontend ⚠️ | React 19 + Vite (insurer + client portals) — **work in progress** |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     React Frontend (port 5173)                          │
│              Insurer Portal         │         Client Portal             │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ proxy /api → localhost:9001
┌────────────────────────▼────────────────────────────────────────────────┐
│                          FastAPI App (port 9001)                        │
├──────────┬─────────────┬──────┬──────────┬───────────┬─────────────────┤
│ /claims  │ /documents  │ /ask │/clientes │/corretores│ /apolices  ...  │
│  CRUD    │ Doc ingest  │  RAG │ clients  │  brokers  │ policies        │
├──────────┼─────────────┼──────┼──────────┴───────────┴─────────────────┤
│ClaimSvc  │         RAGService                InsuranceServices          │
├──────────┼─────────────┴──────┬─────────────────────────────────────────┤
│PostgreSQL│ ChromaDB            │          PostgreSQL (remote DB)         │
│(local)   │ + Sentence Transf. │  clientes, corretores, apolices,        │
│          │                    │  coberturas, sinistros, pagamentos       │
└──────────┴────────────────────┴─────────────────────────────────────────┘
```

### RAG Pipeline

```
INGESTION:
  .txt / .md / .pdf document
      │
      ▼
  Chunking (500 chars, 80 overlap)
      │
      ▼
  Embeddings (all-MiniLM-L6-v2)
      │
      ▼
  ChromaDB (persisted to disk)

QUERY:
  User question
      │
      ▼
  Question embedding
      │
      ▼
  Cosine similarity search in ChromaDB
      │
      ▼
  Top-4 most relevant chunks
      │
      ▼
  Prompt: "Answer based on this context: [chunks]"
      │
      ▼
  LM Studio / OpenAI-compatible LLM → Final answer
```

---

## Project Structure

```
insurance-rag/
├── app/
│   ├── main.py              # FastAPI app, lifespan, routers
│   ├── database.py          # Async PostgreSQL engine (asyncpg)
│   ├── models/
│   │   ├── claim.py         # Claims ORM + Pydantic schemas
│   │   └── insurance.py     # 6 insurance entity ORM models
│   ├── services/
│   │   ├── claim_service.py # Claims business logic
│   │   ├── rag_service.py   # Chunking, embeddings, retrieval, generation
│   │   ├── clientes_service.py
│   │   ├── corretores_service.py
│   │   ├── apolices_service.py
│   │   ├── coberturas_service.py
│   │   ├── sinistros_service.py
│   │   └── pagamentos_service.py
│   └── routes/
│       ├── claims.py        # Claims CRUD endpoints
│       ├── documents.py     # Document ingestion endpoints
│       ├── search.py        # /ask RAG endpoint
│       ├── clientes.py      # Clients CRUD
│       ├── corretores.py    # Brokers CRUD
│       ├── apolices.py      # Policies CRUD
│       ├── coberturas.py    # Coverages CRUD
│       ├── sinistros.py     # Claims (Portuguese schema) CRUD
│       └── pagamentos.py    # Payments CRUD
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router (insurer + client portals)
│   │   ├── pages/           # InsurerLayout pages + client/ subfolder
│   │   ├── components/      # Reusable UI components
│   │   └── services/
│   │       └── api.js       # Axios client (proxied to API)
│   ├── vite.config.js
│   └── package.json
├── data/
│   └── policies/            # Sample .txt policy documents
├── setup.sql                # PostgreSQL schema + seed data
├── Dockerfile               # Multi-stage image (port 9001)
├── docker-compose.yml       # PostgreSQL service + API service
├── requirements.txt
├── MIGRATION_GUIDE.md       # SQLite → PostgreSQL migration notes
├── TUTORIAL_NOVOS_ENDPOINTS.md
├── TUTORIAL_FRONTEND.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+ **or** Docker + Docker Compose
- PostgreSQL 16 (included via Docker Compose; for local setup, provide your own instance)
- Node.js 18+ (only for running the frontend locally)
- (Optional) [LM Studio](https://lmstudio.ai/) for local LLM answer generation

### Option A — Docker (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/insurance-rag.git
cd insurance-rag

# 2. Create a .env file (see Environment Variables below)

# 3. Build and start the containers
docker compose up --build
```

The API will be available at **http://localhost:9001**.

Open **http://localhost:9001/docs** for the interactive Swagger UI.

> Docker Compose starts both the FastAPI app and a PostgreSQL 16 container. The `./data` folder is mounted as a volume so the ChromaDB index persists between restarts.

### Option B — Local Python + Frontend

```bash
# 1. Clone the repository
git clone https://github.com/your-username/insurance-rag.git
cd insurance-rag

# 2. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# or: source .venv/bin/activate  # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the API (requires PostgreSQL running locally)
uvicorn app.main:app --reload --port 9001
```

Open **http://localhost:9001/docs** for the interactive Swagger UI.

**Run the frontend (optional):**

> ⚠️ **Frontend is a work in progress.** The UI has known errors following the recent PostgreSQL migration and new entity endpoints. Pages may fail to load or display incorrect data. Use the API directly (via `/docs`) for reliable access until the frontend is stabilised.

```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

---

### Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=seguros_treino
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/seguros_treino

# LLM backend (LM Studio or OpenAI)
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://host.docker.internal:1234/v1
OPENAI_MODEL=your-loaded-model-name
```

> For Docker, set `DATABASE_URL` to use the compose service name: `postgresql+asyncpg://postgres:your_password@db:5432/seguros_treino`

### LM Studio (Optional)

To enable local LLM answer generation:

1. Download and install [LM Studio](https://lmstudio.ai/)
2. Load a chat model (e.g. `Mistral 7B`, `Llama 3`, `Gemma`)
3. Start the local server (default: `http://localhost:1234`)
4. Set `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `OPENAI_MODEL` in `.env`

> Without LM Studio configured, `/ask` still works — it returns the raw retrieved context chunks instead of a generated answer.

---

## Usage

### Step 1 — Index sample documents

```bash
curl -X POST http://localhost:9001/documents/ingest/seed
```

```json
{
  "seeded": 3,
  "details": [
    {"source": "auto_policy.txt", "chunks_created": 14},
    {"source": "home_policy.txt", "chunks_created": 16},
    {"source": "health_policy.txt", "chunks_created": 18}
  ]
}
```

### Step 2 — Create a claim

```bash
curl -X POST http://localhost:9001/claims \
  -H "Content-Type: application/json" \
  -d '{
    "policy_number": "POL-2024-001",
    "claimant_name": "Jane Smith",
    "claim_type": "auto",
    "description": "Rear-end collision, damage to rear bumper",
    "amount_claimed": 8500.00
  }'
```

### Step 3 — Ask a question (RAG)

```bash
curl -X POST http://localhost:9001/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the deadline to report a collision claim?",
    "policy_type": "auto"
  }'
```

```json
{
  "question": "What is the deadline to report a collision claim?",
  "answer": "According to the auto insurance policy, the insured must report a claim within 72 hours of the incident...",
  "sources": [
    {"source": "auto_policy.txt", "relevance": 0.891}
  ]
}
```

### Step 4 — List claims with filters

```bash
curl http://localhost:9001/claims
curl "http://localhost:9001/claims?status=pending&claim_type=auto"
curl http://localhost:9001/claims/stats/summary
```

### Step 5 — Update claim status

```bash
curl -X PATCH http://localhost:9001/claims/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "amount_approved": 7200.00}'
```

### Step 6 — Query insurance entities

```bash
# List all clients
curl http://localhost:9001/clientes

# List policies for a specific client
curl http://localhost:9001/apolices?cliente_id=1

# List all sinistros (claims in Portuguese schema)
curl http://localhost:9001/sinistros
```

---

## API Reference

### Core

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |

### Claims

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/claims` | Create a claim |
| GET | `/claims` | List claims (with filters) |
| GET | `/claims/{id}` | Get claim by ID |
| PATCH | `/claims/{id}/status` | Update claim status |
| DELETE | `/claims/{id}` | Delete a claim |
| GET | `/claims/stats/summary` | Aggregated statistics |

### Documents & RAG

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/ingest` | Index raw text |
| POST | `/documents/ingest/file` | Upload a .txt, .md, or .pdf file |
| POST | `/documents/ingest/seed` | Index sample policies |
| GET | `/documents/stats` | Vector index info |
| POST | `/ask` | Full RAG Q&A |
| GET | `/ask/retrieve` | Retrieval only (debug) |

### Insurance Entities (remote PostgreSQL)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET / POST | `/clientes` | List / create clients |
| GET / PUT / DELETE | `/clientes/{id}` | Get, update, delete client |
| GET / POST | `/corretores` | List / create brokers |
| GET / PUT / DELETE | `/corretores/{id}` | Get, update, delete broker |
| GET / POST | `/apolices` | List / create policies |
| GET / PUT / DELETE | `/apolices/{id}` | Get, update, delete policy |
| GET / POST | `/coberturas` | List / create coverages |
| GET / PUT / DELETE | `/coberturas/{id}` | Get, update, delete coverage |
| GET / POST | `/sinistros` | List / create sinistros |
| GET / PUT / DELETE | `/sinistros/{id}` | Get, update, delete sinistro |
| GET / POST | `/pagamentos` | List / create payments |
| GET / PUT / DELETE | `/pagamentos/{id}` | Get, update, delete payment |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | FastAPI (async) |
| ORM / Database | SQLAlchemy async + PostgreSQL (asyncpg) |
| Vector store | ChromaDB |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| LLM backend | LM Studio (local) / any OpenAI-compatible API |
| Data validation | Pydantic v2 |
| Frontend | React 19 + Vite + React Router DOM |
| Containerization | Docker (multi-stage) + Docker Compose |

---

## Key Concepts

- **RAG**: retrieves relevant context before generating an answer
- **Chunking with overlap**: splits documents while preserving context at boundaries
- **Semantic embeddings**: vector representations of text meaning
- **Vector database**: similarity search instead of exact keyword matching
- **Dual-layer database**: local PostgreSQL for claims, remote PostgreSQL for insurance entities
- **Async Python**: all I/O operations use `async/await`
- **Dependency injection**: FastAPI injects DB session per request
- **Separation of concerns**: routes → services → models

---

## Roadmap

- [ ] JWT authentication
- [ ] Chunk reranking
- [ ] Hybrid search (vector + BM25)
- [ ] pgvector integration for vector search in PostgreSQL
- [ ] Unit tests (pytest)
- [x] Docker support
- [x] PostgreSQL migration (replaced SQLite)
- [x] PDF support (pypdf)
- [x] React dual-portal frontend (insurer + client)
- [x] Insurance entity CRUD (clientes, corretores, apolices, coberturas, sinistros, pagamentos)
