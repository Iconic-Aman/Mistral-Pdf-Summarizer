# High-Level Design — Mistral PDF Summarizer (Full-Stack Showcase)

## Overview

A modern, full-stack portfolio-quality web application that wraps the fine-tuned `aman012/mistral-7b-instruct-v0.3-bnb-4bit-200` model into an elegant UI. The architecture is **fully deployed on free-tier services** under `botzcoder.com`, with the heavy ML workload isolated to its own Hugging Face Space microservice.

---

## Technology & Deployment Stack

| Layer | Technology | Deployed On | Why |
|---|---|---|---|
| **Frontend** | Next.js 14 (React + App Router) | **Vercel** | Native Next.js host, free, auto-deploys on git push |
| **Styling** | Tailwind CSS + Framer Motion | — | Premium UI, smooth animations |
| **Backend API** | FastAPI (Python) + Uvicorn | **Render.com** | Free Python hosting; lightweight — no model loaded here |
| **ML Microservice** | FastAPI (inference only) + Unsloth | **Hugging Face Spaces** | Free GPU/CPU; model is already on HF Hub |
| **Database** | PostgreSQL | **Neon.tech** | Free forever; Render's free DB deletes after 90 days |
| **File Storage** | Cloudflare R2 | **Cloudflare** | Free 10GB, S3-compatible, zero egress fees |
| **DNS + SSL** | Cloudflare | **Cloudflare** | Free HTTPS, routes `botzcoder.com` subdomains |

> ⚠️ **Key Design Decision — ML Isolation:** Mistral-7B 4-bit requires ~4–6 GB RAM. To stay on free tiers, the model is **not loaded in the main FastAPI backend**. Instead, it lives in a dedicated HF Space that the backend calls as an internal API.

---

## Domain Routing

```
www.botzcoder.com     →  Vercel         (Next.js frontend)
api.botzcoder.com     →  Render.com     (FastAPI backend)
ml.botzcoder.com      →  HF Spaces      (Mistral inference microservice)
```

DNS records (via Cloudflare):

| Type | Name | Target |
|---|---|---|
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `api` | `your-service.onrender.com` |

SSL is automatic via Cloudflare — no config needed.

---

## System Architecture

```mermaid
graph TD
    subgraph User["🌐 Browser — www.botzcoder.com"]
        UI["Next.js Frontend\n(Vercel)"]
    end

    subgraph API["🐍 FastAPI Backend — api.botzcoder.com\n(Render.com)"]
        REST["REST API Layer\n/api/v1/..."]
        SSEProxy["SSE Proxy\n/api/v1/summarize/stream"]
        FileHandler["PDF Handler\n(PyMuPDF + Cloudflare R2)"]
        DBClient["DB Client\n(SQLAlchemy → Neon)"]
    end

    subgraph ML["🤗 HF Space — ml.botzcoder.com\n(HuggingFace Spaces)"]
        InferenceAPI["FastAPI Inference\n/infer  /stream"]
        Model["aman012/mistral-7b-instruct-v0.3-bnb-4bit-200\n(Unsloth, loaded at startup)"]
        InferenceAPI --> Model
    end

    subgraph DB["🗄️ Neon.tech PostgreSQL"]
        JobsTable["jobs"]
        SummariesTable["summaries"]
        ChunksTable["chunks"]
    end

    subgraph Storage["☁️ Cloudflare R2"]
        PDFBucket["pdf-bucket bucket"]
    end

    UI -- "POST /upload" --> REST
    UI -- "GET /summarize/stream/{job_id} SSE" --> SSEProxy
    UI -- "GET /jobs  GET /jobs/:id" --> REST

    REST --> FileHandler
    FileHandler --> PDFBucket
    REST --> DBClient
    DBClient --> JobsTable & SummariesTable & ChunksTable

    SSEProxy -- "POST /infer (HTTP stream)" --> InferenceAPI

    class ML highlight
```

---

## Component Breakdown

### 1. Frontend — Vercel (Next.js 14)

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout (dark theme, fonts, SEO metadata)
│   ├── page.tsx                # Landing / Hero page
│   ├── summarize/
│   │   └── page.tsx            # Upload + live summary stream page
│   └── history/
│       └── page.tsx            # Past jobs & summaries
├── components/
│   ├── HeroSection.tsx         # Animated headline, model stats, CTA
│   ├── UploadZone.tsx          # Drag-and-drop PDF uploader
│   ├── SummaryStream.tsx       # Live SSE token stream renderer
│   ├── ProgressBar.tsx         # Per-chunk progress indicator
│   ├── JobCard.tsx             # History card with status badge
│   └── Navbar.tsx              # Navigation
├── lib/
│   ├── api.ts                  # Axios client → api.botzcoder.com
│   └── sse.ts                  # EventSource hook for streaming
└── public/
    └── thumbnail.webp          # Existing project thumbnail
```

**Pages:**

| Page | Purpose | Key Env Var |
|---|---|---|
| `/` | Showcase landing, model info, CTA | — |
| `/summarize` | Upload PDF → streaming summary | `NEXT_PUBLIC_API_URL=https://api.botzcoder.com` |
| `/history` | Browse all past jobs | — |

---

### 2. Backend — Render.com (FastAPI)

> **This service is lightweight — it does NOT load the ML model.**

```
backend/
├── main.py                     # FastAPI app, CORS for botzcoder.com
├── routers/
│   ├── upload.py               # POST /api/v1/upload  →  saves to R2
│   ├── summarize.py            # GET  /api/v1/summarize/stream/{job_id}
│   │                           #      → proxies SSE from HF Space
│   └── jobs.py                 # GET  /api/v1/jobs, /api/v1/jobs/{id}
├── models/
│   └── db_models.py            # SQLAlchemy ORM (Job, Summary, Chunk)
├── schemas/
│   └── pydantic_schemas.py     # Pydantic request/response types
├── db/
│   ├── session.py              # Async engine → Neon DB
│   └── init_db.py              # Create tables on startup
├── storage/
│   └── r2_client.py            # boto3 client for Cloudflare R2
└── requirements.txt
```

**API Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/upload` | Receives PDF, uploads to R2, creates `job` row in DB |
| `GET` | `/api/v1/summarize/stream/{job_id}` | Fetches PDF from R2, calls HF Space `/stream`, proxies SSE to frontend |
| `GET` | `/api/v1/jobs` | Returns list of all past jobs |
| `GET` | `/api/v1/jobs/{job_id}` | Returns full job + summary + chunks |

**Render Environment Variables:**
```
DATABASE_URL     = postgresql://user:pass@ep-xxx.neon.tech/dbname
HF_SPACE_URL     = https://aman012-mistral-inference.hf.space
R2_ENDPOINT      = https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY    = ...
R2_SECRET_KEY    = ...
R2_BUCKET        = pdf-bucket
```

> ⚠️ Render free tier **spins down after 15 min idle**. First request after idle = ~30–60s cold start. Acceptable for portfolio use.

---

### 3. ML Inference Microservice — HF Spaces

> **This is the only place where the Mistral model runs.**

```
hf-space/
├── app.py                      # FastAPI app with /infer and /stream endpoints
├── inference.py                # Refactored from main.ipynb
│                               #   - extract_text(pdf_url) via PyMuPDF
│                               #   - chunk_text(text, max_tokens=1500)
│                               #   - summarize_chunks() → yields tokens
│                               #   - final_summary() → second-pass
├── Dockerfile                  # HF Space Docker runtime config
└── requirements.txt            # unsloth, transformers, pymupdf, fastapi
```

**Inference Endpoints:**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/infer` | Accepts `{ pdf_url, job_id }` → runs full pipeline → returns complete summary |
| `GET` | `/stream/{job_id}` | SSE stream of tokens for a job already in progress |

**Inference Flow inside `inference.py`:**
1. Load model once at startup via Unsloth (4-bit, from HF Hub)
2. `extract_text(pdf_url)` → download PDF from R2, extract via PyMuPDF
3. `chunk_text(text, max_tokens=1500)` → list of chunks
4. For each chunk → `summarize_chunk(chunk)` → yield tokens
5. `final_summary(all_chunk_summaries)` → second-pass refinement, yield tokens

> 💡 Apply for **ZeroGPU** in HF Space settings for free GPU acceleration. Without it, CPU inference on 7B model ≈ 2–5 min per summary.

---

### 4. Database — Neon.tech (PostgreSQL)

```sql
-- Tracks each summarization job
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    TEXT NOT NULL,
    r2_key      TEXT NOT NULL,            -- path in Cloudflare R2
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | done | failed
    created_at  TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- Final consolidated summary
CREATE TABLE summaries (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    tokens_used  INTEGER,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- Per-chunk summaries (debugging / detailed view)
CREATE TABLE chunks (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id         UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    chunk_index    INTEGER NOT NULL,
    chunk_text     TEXT NOT NULL,
    chunk_summary  TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);
```

**Entity Relationship:**
```mermaid
erDiagram
    JOBS {
        uuid id PK
        text filename
        text r2_key
        text status
        timestamp created_at
        timestamp finished_at
    }
    SUMMARIES {
        uuid id PK
        uuid job_id FK
        text content
        int tokens_used
    }
    CHUNKS {
        uuid id PK
        uuid job_id FK
        int chunk_index
        text chunk_text
        text chunk_summary
    }
    JOBS ||--o| SUMMARIES : "has one"
    JOBS ||--o{ CHUNKS : "has many"
```

---

### 5. File Storage — Cloudflare R2

- Bucket: `pdf-bucket`
- PDFs stored with key `uploads/{job_id}/{filename}.pdf`
- Access via `boto3` using Cloudflare's S3-compatible endpoint
- Both the **backend** (upload) and **HF Space** (download for inference) use the same bucket

---

## End-to-End Data Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js (Vercel)
    participant BE as FastAPI (Render)
    participant R2 as Cloudflare R2
    participant DB as Neon PostgreSQL
    participant HF as HF Space (Mistral)

    User->>FE: Drag & drop PDF
    FE->>BE: POST /api/v1/upload
    BE->>R2: Upload PDF → store at uploads/{job_id}/file.pdf
    BE->>DB: INSERT INTO jobs (status='pending', r2_key=...)
    BE-->>FE: { job_id }

    FE->>BE: GET /api/v1/summarize/stream/{job_id} (SSE)
    BE->>DB: UPDATE jobs SET status='processing'
    BE->>HF: POST /stream  { pdf_url: R2 signed URL, job_id }

    loop Each chunk
        HF-->>BE: SSE token (chunk progress)
        BE-->>FE: SSE token forwarded
        BE->>DB: INSERT INTO chunks (chunk_summary)
    end

    HF-->>BE: SSE final summary tokens
    BE-->>FE: SSE final summary forwarded
    BE->>DB: INSERT INTO summaries (content)
    BE->>DB: UPDATE jobs SET status='done'
    FE-->>User: Display complete summary ✅
```

---

## UI Design Concept

> **Theme:** Premium dark UI — deep navy background, vivid violet/indigo gradient accents, glassmorphism cards, Framer Motion animations.

| Screen | Key UI Elements |
|---|---|
| **`/` Landing** | Animated gradient hero, model stats (7B params, 4-bit, 200-step fine-tune), feature cards, "Try It Now" CTA |
| **`/summarize`** | Drag-drop upload zone, animated per-chunk progress bar, live token-by-token summary stream, copy/download button |
| **`/history`** | Card grid of past jobs, filename, date, status badge (`done`/`processing`/`failed`), expandable full summary |

---

## Build Order (Step-by-Step)

| Step | What | Where |
|---|---|---|
| 1 | Create Neon DB, run schema SQL | neon.tech dashboard |
| 2 | Create Cloudflare R2 bucket | Cloudflare dashboard |
| 3 | Build `hf-space/` → deploy HF Space, test `/infer` via Postman | huggingface.co/spaces |
| 4 | Build `backend/` → deploy Render, set env vars, test `/upload` + `/stream` | render.com |
| 5 | Build `frontend/` → deploy Vercel, set `NEXT_PUBLIC_API_URL` | vercel.com |
| 6 | Wire domain via Cloudflare DNS (CNAME `www` → Vercel, `api` → Render) | Cloudflare dashboard |
| 7 | Apply for ZeroGPU on HF Space for faster inference | HF Space settings |

---

## Cost Breakdown

| Service | Cost |
|---|---|
| Vercel | Free |
| Render.com | Free |
| Neon.tech | Free forever |
| Cloudflare R2 | Free (under 10GB) |
| Cloudflare DNS + SSL | Free |
| Hugging Face Spaces | Free (CPU) / ZeroGPU (apply) |
| **botzcoder.com domain** | **Only paid cost (~₹800–1500/yr)** |
