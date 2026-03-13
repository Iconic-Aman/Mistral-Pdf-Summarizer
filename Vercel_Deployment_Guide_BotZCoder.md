# Vercel Deployment Guide — BotZCoder

> **Next.js Frontend · botzcoder.com · Free Hosting**

---

## Overview

This guide walks you through deploying your Next.js frontend for `botzcoder.com` on Vercel — from your local machine to a live production URL with a custom domain and automated CI/CD.

> **Why Vercel?** Vercel was built by the same team that created Next.js. Features like App Router, SSR, and image optimization work perfectly with zero config.

---

## Frontend Hosting Options

Your domain `botzcoder.com` is independent — you own it and can point it to any platform. Vercel is simply the most optimized choice for Next.js.

| Platform | Custom Domain | Free | Next.js Support |
|---|---|---|---|
| **Vercel** ✅ Recommended | ✓ | ✓ | Best — built by the Next.js team |
| Netlify | ✓ | ✓ | Very good |
| Cloudflare Pages | ✓ | ✓ | Good |
| Oracle Free VM | ✓ | ✓ | Full control, Docker support |

---

## Prerequisites

Before you start, make sure you have the following:

- Node.js 18+ installed on your machine
- Your Next.js frontend code in a GitHub repository
- A Vercel account — sign up free at [vercel.com](https://vercel.com)
- Your domain `botzcoder.com` registered and DNS managed via Cloudflare

---

## Step 1 — Install Vercel CLI

Install the Vercel CLI globally on your machine. This is a one-time setup.

```bash
npm install -g vercel
```

Verify the installation:

```bash
vercel --version
```

---

## Step 2 — Build Locally First

Always verify your project builds without errors before deploying. Vercel runs this same command internally.

```bash
cd frontend
npm install
npm run build
```

> ⚠️ **Warning:** If `npm run build` fails locally, it will also fail on Vercel. Fix all build errors before proceeding.

---

## Step 3 — Login to Vercel

Authenticate the CLI with your Vercel account:

```bash
vercel login
```

This opens your browser. Sign in with the same account (GitHub or Google) that you used to create your Vercel account. You will see `Logged in as yourname` in the terminal when done.

---

## Step 4 — Deploy from Localhost (Preview)

Inside your `frontend/` folder, run:

```bash
vercel
```

The CLI will ask you a few questions the first time:

```
? Set up and deploy "frontend"?  →  Y
? Which scope?                   →  your account name
? Link to existing project?      →  N
? Project name?                  →  botzcoder-frontend
? Directory?                     →  ./
? Override settings?             →  N
```

After a few seconds, Vercel gives you a preview URL:

```
https://botzcoder-frontend-xyz.vercel.app
```

> ℹ️ This is a **preview deployment** — not production yet. Use it to verify everything looks and works correctly.

---

## Step 5 — Deploy to Production

Once you have confirmed the preview looks correct, promote it to production:

```bash
vercel --prod
```

Your app is now live at your permanent Vercel URL:

```
https://botzcoder-frontend.vercel.app
```

---

## Step 6 — Add Environment Variables

Your Next.js app needs to know the backend API URL. Set the following environment variable on Vercel:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.botzcoder.com` |

**Add it via CLI:**

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter value:          https://api.botzcoder.com
# Select environments:  Production, Preview, Development
```

Or via the dashboard: **Project → Settings → Environment Variables → Add New.**

---

## Step 7 — Connect GitHub for Auto CI/CD

This is a one-time setup that gives you automatic deployments on every `git push`.

1. Go to **vercel.com/dashboard**
2. Open your project → **Settings → Git**
3. Click **Connect Git Repository**
4. Select your GitHub repo
5. Set **Production Branch** to `main`

> ✅ From this point on, every `git push origin main` automatically deploys your frontend to production in about 60 seconds.

The automatic deployment flow:

```
git push origin main
        ↓
Vercel detects the push automatically
        ↓
Runs: npm install → npm run build
        ↓
Deploys to botzcoder.com in ~60 seconds
        ↓
You get a deployment notification ✓
```

---

## Step 8 — Add Custom Domain

### In Vercel Dashboard

1. Go to **Project → Settings → Domains**
2. Click **Add Domain**
3. Type: `www.botzcoder.com`
4. Click **Add**

### In Cloudflare DNS

Vercel will show you two DNS records to add. Go to your Cloudflare dashboard and add them:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `899365475ca64f3f.vercel-dns-017.com.` |

> ✅ SSL/HTTPS is handled automatically by Vercel. It will be active within a few minutes of the DNS records propagating.

---

## Step 9 — Optional: GitHub Actions CI/CD File

If you want to run tests or checks **before** deploying, you can add a GitHub Actions workflow. This is optional — the GitHub integration from Step 7 already handles automatic deploys without this file.

Create this file in your repo:

```
.github/workflows/frontend.yml
```

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths: [frontend/**]   # only triggers when frontend/ changes

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install & Build
        working-directory: frontend
        run: |
          npm install
          npm run build        # fails here = deploy never happens

      - name: Deploy to Vercel
        working-directory: frontend
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Add these three secrets in GitHub: **Repository → Settings → Secrets → Actions:**

| Secret Name | Where to find it |
|---|---|
| `VERCEL_TOKEN` | Vercel Dashboard → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel env pull` locally → check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same `.vercel/project.json` file as above |

---

## Quick Reference — Exact Order

| Step | Action |
|---|---|
| 1 | `npm install -g vercel` |
| 2 | `cd frontend && npm run build` — verify no errors |
| 3 | `vercel login` |
| 4 | `vercel` — first preview deploy |
| 5 | `vercel --prod` — push to production |
| 6 | `vercel env add NEXT_PUBLIC_API_URL` |
| 7 | Connect GitHub repo in Vercel dashboard (auto CI/CD from now on) |
| 8 | Add `www.botzcoder.com` in Vercel → Settings → Domains |
| 9 | Add DNS records (A + CNAME) in Cloudflare dashboard |

> ✅ After Step 7, every `git push origin main` deploys automatically. You never need the CLI again for routine deploys.

---

*BotZCoder · www.botzcoder.com · Next.js · FastAPI · PostgreSQL · HF Spaces*
