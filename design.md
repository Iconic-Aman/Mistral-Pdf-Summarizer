# High-Level Design — Mistral PDF Summarizer (Full-Stack Showcase)

## Overview

A modern, full-stack portfolio-quality web application that wraps the fine-tuned `aman012/mistral-7b-instruct-v0.3-bnb-4bit-200` model into an elegant UI. The architecture is **fully deployed on free-tier services** under `botzcoder.com`, with the heavy ML workload isolated to its own Hugging Face Space microservice. Users authenticate via **Google OAuth** so every PDF and summary is private to each account.

---

## Technology & Deployment Stack

| Layer | Technology | Deployed On | Why |
|---|---|---|---|
| **Frontend** | Next.js 14 (React + App Router) | **Vercel** | Native Next.js host, free, auto-deploys on git push |
| **Auth** | NextAuth.js + Google OAuth 2.0 | **Google Cloud Console** | Free, no backend auth code needed, handles token lifecycle |
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
| A | `@` | `76.76.21.21` |
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

    subgraph Auth["🔐 Google OAuth 2.0"]
        Google["Google Auth Server\nIssues ID tokens"]
    end

    subgraph API["🐍 FastAPI Backend — api.botzcoder.com\n(Render.com)"]
        REST["REST API Layer\n/api/v1/..."]
        AuthMiddleware["Auth Middleware\nVerify Google token"]
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
        UsersTable["users"]
        JobsTable["jobs"]
        SummariesTable["summaries"]
        ChunksTable["chunks"]
    end

    subgraph Storage["☁️ Cloudflare R2"]
        PDFBucket["pdf-bucket bucket"]
    end

    UI -- "Sign in with Google" --> Google
    Google -- "ID token" --> UI
    UI -- "POST /upload (+ Bearer token)" --> REST
    UI -- "GET /summarize/stream/{job_id} SSE" --> SSEProxy
    UI -- "GET /jobs  GET /jobs/:id" --> REST

    REST --> AuthMiddleware
    AuthMiddleware -- "Verify token → find/create user" --> UsersTable
    REST --> FileHandler
    FileHandler --> PDFBucket
    REST --> DBClient
    DBClient --> JobsTable & SummariesTable & ChunksTable

    SSEProxy -- "POST /infer (HTTP stream)" --> InferenceAPI

    class ML highlight
```

---

## Auth Flow

```
1. User clicks "Sign in with Google" on the frontend
2. NextAuth.js redirects to Google consent screen
3. Google returns an ID token to the frontend
4. Frontend sends ID token in Authorization header with every API request
5. FastAPI middleware verifies token with Google's public keys
6. If valid → look up user in DB by google_id
   - User exists → proceed
   - User doesn't exist → INSERT into users table (first login)
7. All subsequent queries are scoped to that user_id
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
│   │   └── page.tsx            # Upload + live summary stream page (auth required)
│   └── history/
│       └── page.tsx            # Past jobs & summaries (auth required)
├── components/
│   ├── HeroSection.tsx         # Animated headline, model stats, CTA
│   ├── LoginModal.tsx          # Google sign-in modal with spinner state
│   ├── UserMenu.tsx            # Avatar + dropdown (my summaries, sign out)
│   ├── UploadZone.tsx          # Drag-and-drop PDF uploader
│   ├── SummaryStream.tsx       # Live SSE token stream renderer
│   ├── ProgressBar.tsx         # Per-chunk progress indicator
│   ├── JobCard.tsx             # History card with status badge
│   └── Navbar.tsx              # Navigation + theme toggle + auth state
├── lib/
│   ├── api.ts                  # Axios client → api.botzcoder.com (injects Bearer token)
│   └── sse.ts                  # EventSource hook for streaming
├── pages/api/auth/
│   └── [...nextauth].ts        # NextAuth config — Google provider
└── public/
    └── thumbnail.webp
```

**Pages:**

| Page | Purpose | Auth Required |
|---|---|---|
| `/` | Landing page, model info, sign-in CTA | No |
| `/summarize` | Upload PDF → streaming summary | Yes → redirect to login |
| `/history` | Browse all past jobs for this user | Yes → redirect to login |

**Frontend Environment Variables (Vercel):**
```
NEXT_PUBLIC_API_URL        = https://api.botzcoder.com
NEXTAUTH_URL               = https://www.botzcoder.com
NEXTAUTH_SECRET            = <random 32-char string>
GOOGLE_CLIENT_ID           = <from Google Cloud Console>
GOOGLE_CLIENT_SECRET       = <from Google Cloud Console>
```

---

### 2. Backend — Render.com (FastAPI)

> **This service is lightweight — it does NOT load the ML model.**

```
backend/
├── main.py                     # FastAPI app, CORS for botzcoder.com
├── middleware/
│   └── auth.py                 # Verify Google ID token → return user dict
├── routers/
│   ├── upload.py               # POST /api/v1/upload  →  saves to R2
│   ├── summarize.py            # GET  /api/v1/summarize/stream/{job_id}
│   └── jobs.py                 # GET  /api/v1/jobs, /api/v1/jobs/{id}
├── models/
│   └── db_models.py            # SQLAlchemy ORM (User, Job, Summary, Chunk)
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

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/upload` | Required | Receives PDF, uploads to R2, creates `job` row scoped to user |
| `GET` | `/api/v1/summarize/stream/{job_id}` | Required | Fetches PDF from R2, calls HF Space, proxies SSE to frontend |
| `GET` | `/api/v1/jobs` | Required | Returns jobs for the authenticated user only |
| `GET` | `/api/v1/jobs/{job_id}` | Required | Returns job + summary + chunks (only if owned by user) |

**Render Environment Variables:**
```
DATABASE_URL          = postgresql://user:pass@ep-xxx.neon.tech/dbname
HF_SPACE_URL          = https://aman012-mistral-inference.hf.space
R2_ENDPOINT           = https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY         = ...
R2_SECRET_KEY         = ...
R2_BUCKET             = pdf-bucket
GOOGLE_CLIENT_ID      = <same as frontend — used to verify tokens>
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

> 💡 Apply for **ZeroGPU** in HF Space settings for free GPU acceleration. Without it, CPU inference on 7B model ≈ 2–5 min per summary.

---

### 4. Database — Neon.tech (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- NEW: one row per Google account
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id   TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- UPDATED: now scoped to a user
CREATE TABLE jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    r2_key      TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT NOW(),
    finished_at TIMESTAMP
);

CREATE TABLE summaries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    tokens_used INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chunks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    chunk_index   INTEGER NOT NULL,
    chunk_text    TEXT NOT NULL,
    chunk_summary TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id      ON jobs(user_id);
CREATE INDEX idx_chunks_job_id     ON chunks(job_id);
CREATE INDEX idx_summaries_job_id  ON summaries(job_id);
```

**Entity Relationship:**

```mermaid
erDiagram
    USERS {
        uuid id PK
        string google_id
        string email
        string name
        string avatar_url
        timestamp created_at
    }
    JOBS {
        uuid id PK
        uuid user_id FK
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
        timestamp created_at
    }
    CHUNKS {
        uuid id PK
        uuid job_id FK
        int chunk_index
        text chunk_text
        text chunk_summary
        timestamp created_at
    }
    USERS ||--o{ JOBS : "owns"
    JOBS ||--o| SUMMARIES : "has one"
    JOBS ||--o{ CHUNKS : "has many"
```

---

### 5. File Storage — Cloudflare R2

- Bucket: `pdf-bucket`
- PDFs stored with key `uploads/{user_id}/{job_id}/{filename}.pdf`
- Access via `boto3` using Cloudflare's S3-compatible endpoint
- Both the **backend** (upload) and **HF Space** (download for inference) use the same bucket

> Note: R2 key now includes `user_id` in the path so files are naturally namespaced per user.

---

## End-to-End Data Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js (Vercel)
    participant G  as Google OAuth
    participant BE as FastAPI (Render)
    participant R2 as Cloudflare R2
    participant DB as Neon PostgreSQL
    participant HF as HF Space (Mistral)

    User->>FE: Click "Sign in with Google"
    FE->>G: Redirect to Google consent screen
    G-->>FE: ID token returned
    FE->>BE: POST /api/v1/upload (Bearer: ID token)
    BE->>G: Verify token
    G-->>BE: Token valid + user info
    BE->>DB: Find or create user in users table
    BE->>R2: Upload PDF → uploads/{user_id}/{job_id}/file.pdf
    BE->>DB: INSERT INTO jobs (user_id=..., status='pending')
    BE-->>FE: { job_id }

    FE->>BE: GET /api/v1/summarize/stream/{job_id} (SSE)
    BE->>DB: UPDATE jobs SET status='processing'
    BE->>HF: POST /stream { pdf_url: R2 signed URL, job_id }

    loop Each chunk
        HF-->>BE: SSE token (chunk progress)
        BE-->>FE: SSE token forwarded
        BE->>DB: INSERT INTO chunks (chunk_summary)
    end

    HF-->>BE: SSE final summary tokens
    BE-->>FE: SSE final summary forwarded
    BE->>DB: INSERT INTO summaries (content)
    BE->>DB: UPDATE jobs SET status='done'
    FE-->>User: Display complete summary
```

---

## UI Design

> **Theme:** Warm off-white (`#f5f3ef`) light mode + deep charcoal (`#111009`) dark mode. Amber gold accents (`#c8861a`). Syne + Space Mono typography. CSS-animated parallax background circles. Dark mode toggle in navbar.

| Screen | Key UI Elements |
|---|---|
| **`/` Landing** | Hero headline, model stats, Google sign-in modal with spinner, user avatar + dropdown when logged in |
| **`/summarize`** | Drag-drop upload zone, animated per-chunk progress bar, live token-by-token summary stream, copy/download button |
| **`/history`** | Card grid of past jobs for this user only, filename, date, status badge (`done`/`processing`/`failed`) |

**Auth UI states:**

| State | Navbar | Hero CTA |
|---|---|---|
| Logged out | "SIGN IN →" button | "GET STARTED →" opens login modal |
| Logged in | Avatar circle + name + dropdown | "UPLOAD PDF →" goes directly to `/summarize` |

---

## Build Order

| Step | What | Where |
|---|---|---|
| 1 | Create Neon DB, run full schema SQL (including `users` table) | neon.tech dashboard |
| 2 | Create Cloudflare R2 bucket (`pdf-bucket`) | Cloudflare dashboard |
| 3 | Create Google OAuth credentials (Client ID + Secret) | Google Cloud Console → APIs & Services |
| 4 | Build `hf-space/` → deploy HF Space, test `/infer` via Postman | huggingface.co/spaces |
| 5 | Build `backend/` → deploy Render, set all env vars including `GOOGLE_CLIENT_ID` | render.com |
| 6 | Build `frontend/` → configure NextAuth with Google provider, deploy Vercel | vercel.com |
| 7 | Wire domain via Cloudflare DNS (`A @` + `CNAME www` → Vercel, `CNAME api` → Render) | Cloudflare dashboard |
| 8 | Apply for ZeroGPU on HF Space for faster inference | HF Space settings |

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
| Google OAuth | Free |
| **botzcoder.com domain** | **Only paid cost (~₹800–1500/yr)** |