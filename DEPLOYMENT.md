# Reputation OS — Zero-Cost Production Deployment Runbook (₹0/month)

This runbook provides step-by-step instructions to deploy and operate the entire **Reputation OS** platform on cloud infrastructure completely within the **free tiers** (₹0 infrastructure cost) during early testing and validation.

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             End Customers              │
                      │  (Reception QR Scan / Instagram Link)  │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (SPA) — Hosted on Vercel / Cloudflare Pages (Free Tier)            │
│  - React 18 + Vite + Tailwind CSS                                            │
│  - Static CDN Edge Delivery                                                  │
│  - Rewrite rules configured for /r/:businessSlug and /dashboard              │
└────────────────────────────────────────┬─────────────────────────────────────┘
                                         │ HTTPS Fetch (Credentials: include)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  BACKEND API — Hosted on Render / Fly.io Web Service (Free Tier)             │
│  - Node.js 22 + Express + TypeScript                                         │
│  - Multi-tenant tenant isolation middleware                                   │
│  - In-process QR code engine (qrcode) — Zero API costs                       │
│  - Helmet + Rate Limiting + httpOnly Secure Sessions                         │
└────────────────────────────────────────┬─────────────────────────────────────┘
                                         │ Pooled TCP / SSL (require)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  DATABASE — Hosted on Neon.tech / Supabase (Free Tier)                       │
│  - PostgreSQL 16 serverless                                                  │
│  - 13 indexed relational tables via Drizzle ORM                              │
│  - First-party telemetry storage (analytics_events & feedback)               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step 1: PostgreSQL Database Setup (Neon — Free Tier)

1. **Create Free Account:**
   - Sign up at [neon.tech](https://neon.tech) (0.5 GB storage, serverless compute, ₹0 cost).
2. **Create Project:**
   - Name: `reputation-os-prod`
   - Region: Choose closest to target businesses (e.g., `AWS ap-south-1` Mumbai or `AWS us-east-2`).
3. **Copy Pooled Connection String:**
   - Neon provides a pooled connection string with `?sslmode=require`:
     ```text
     postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-12345.ap-south-1.aws.neon.tech/neondb?sslmode=require
     ```
4. **Push Database Schema:**
   - From your local terminal, apply all schema migrations directly to Neon:
     ```bash
     cd server
     DATABASE_URL="YOUR_NEON_CONNECTION_STRING" npm run db:push
     ```
   - All 13 tables, relations, and compound indexes will be created automatically.
5. **(Optional) Seed Demo Account:**
   - If desired, seed a sample business (`Grand Horizon Cafe`) and demo user:
     ```bash
     DATABASE_URL="YOUR_NEON_CONNECTION_STRING" npm run db:seed
     ```

---

## 3. Step 2: Backend API Deployment (Render — Free Tier)

1. **Create Free Web Service on Render:**
   - Sign up at [render.com](https://render.com).
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository (`Reputation OS`).
2. **Service Configuration:**
   - **Environment:** `Node` or `Docker`
   - **Root Directory:** `server` (or leave root if using Dockerfile)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free` (512 MB RAM, 0.1 CPU)
3. **Set Environment Variables in Render Dashboard:**
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://...@...neon.tech/neondb?sslmode=require` | From Step 1 |
   | `AUTH_SECRET` | *(64-hex random string)* | Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `NODE_ENV` | `production` | Enforces secure cookies & hides stack traces |
   | `CORS_ORIGIN` | `https://your-frontend-app.vercel.app` | Your Vercel domain from Step 3 |
   | `SESSION_EXPIRY_SECONDS` | `604800` | 7-day sliding session duration |
   | `AI_PROVIDER` | `noop` | Zero-cost default |
   | `MESSAGING_PROVIDER` | `console` | Zero-cost default |
   | `BILLING_PROVIDER` | `free_tier` | Zero-cost default |
   | `EMAIL_PROVIDER` | `console` | Zero-cost default |
4. **Deploy & Verify Health Endpoint:**
   - Once deployed, visit `https://your-api.onrender.com/api/v1/health`.
   - Expected response: `{"status":"healthy","version":"0.1.0","services":{"database":"connected"}}`.

---

## 4. Step 3: Frontend SPA Deployment (Vercel — Free Tier)

1. **Import Project to Vercel:**
   - Sign up at [vercel.com](https://vercel.com).
   - Click **Add New** → **Project** → Import your repository.
2. **Build Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   - If using a custom proxy or direct backend URL, set `VITE_API_URL` to `https://your-api.onrender.com`.
4. **Verify SPA Routing Rules:**
   - The repository includes [`client/vercel.json`](file:///c:/Automation/QR/client/vercel.json) and [`client/public/_redirects`](file:///c:/Automation/QR/client/public/_redirects), ensuring direct visits to `/r/:businessSlug`, `/dashboard`, `/sources`, and `/settings` are rewritten to `/index.html` without 404 errors.
5. **Update CORS:**
   - Return to Render and ensure `CORS_ORIGIN` matches your assigned Vercel URL (e.g. `https://reputation-os.vercel.app`).

---

## 5. Step 4: End-to-End Production Verification

1. **Sign Up Test:**
   - Navigate to `/signup` and create a business account (e.g., `City Dental Care`).
   - Confirm httpOnly secure cookie is set and redirect to `/dashboard` succeeds.
2. **Review Acquisition Setup:**
   - Navigate to `/sources`.
   - Test **Reception Counter QR**: download PNG and SVG, verify file headers.
   - Test **Instagram Bio Link**: copy link to clipboard.
3. **Public Customer Experience:**
   - Open an incognito browser window and navigate to `/r/city-dental-care`.
   - Submit a 5-star review. Confirm the Google Review CTA button appears immediately.
   - Submit a 2-star review. Confirm the Google Review CTA button appears unconditionally (strict **No Review Gating** policy adherence).
4. **Dashboard Telemetry:**
   - Return to `/dashboard` as business owner.
   - Confirm all 7 metrics increment accurately (Reception Scans, Instagram Visits, Total Feedback, Google Clicks, Rating Distribution).
5. **Business Settings:**
   - Navigate to `/settings`.
   - Paste your actual Google Business Review link (e.g. `https://g.page/r/.../review`).
   - Test the "Test Link" button to ensure it navigates to Google.
   - Save changes and verify public page reflects the updated destination.

---

## 6. Security Hardening Checklist

- [x] **No Review Gating**: System unconditionally offers Google review CTA to all customers regardless of star rating.
- [x] **Strict Tenant Scoping**: All authenticated queries filter through session-derived `business_id`.
- [x] **Cross-Site Cookie Protection**: Session cookies use `httpOnly: true`, `secure: true`, and `sameSite: 'none'`.
- [x] **IP Hashing & Anonymity**: Customer IPs hashed with SHA-256 before storage for abuse prevention; zero raw IP leakage.
- [x] **Anti-Bot Honeypots**: Invisible honeypots discard automated form spam without crashing the server.
- [x] **Multi-Tier Rate Limiting**: Global, auth-specific, and feedback-specific rate limiters active.
- [x] **Zero Paid Dependencies**: In-process QR engine, local database analytics, and No-Op provider fallbacks ensure operation at ₹0 cost.
