# Phase 10: Technical Research — Production Hardening & Scalability

## 1. Executive Summary
This research specifies the architecture and configuration necessary to deploy and operate Reputation OS at ₹0 cost while maintaining high security, fast loading times, and zero cross-tenant data leakage.

## 2. Recommended ₹0 Production Stack

| Tier | Provider | Free Tier Specification | Cost |
| :--- | :--- | :--- | :--- |
| **Database** | Neon.tech / Supabase | 0.5 GB PostgreSQL, serverless branching, connection pooling, SSL mode | ₹0 / mo |
| **Backend API** | Render / Fly.io | 512 MB RAM, Node.js runtime, custom domain, automated SSL | ₹0 / mo |
| **Frontend SPA** | Vercel / Cloudflare | Global CDN edge caching, automated branch previews, custom domain | ₹0 / mo |

## 3. SPA Routing & Rewrite Rules
Single-Page Applications using HTML5 History API (such as `react-router-dom`) require static hosts to rewrite all route requests back to `index.html`.
- **Vercel configuration (`client/vercel.json`)**:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Cloudflare / Netlify (`client/public/_redirects`)**:
  ```
  /*    /index.html   200
  ```

## 4. Security Verification Matrix

1. **Helmet & Security Headers:**
   - Content Security Policy (CSP), X-Content-Type-Options, HSTS, Frameguard (`X-Frame-Options: SAMEORIGIN`).
2. **CORS:**
   - Restricted to configured `CORS_ORIGIN` in production (e.g. `https://reputationos.app`), prohibiting wildcards when credentials are transmitted.
3. **Session Cookies:**
   - Cookie flags: `httpOnly: true`, `secure: true` (in production / HTTPS), `sameSite: 'lax'`, `path: '/'`.
4. **Rate Limiting:**
   - Global rate limiter: 100 req / 15 min.
   - Auth rate limiter: 20 attempts / 15 min per IP.
   - Feedback rate limiter: 10 submissions / 15 min per IP.
5. **PII & Bot Protection:**
   - IP addresses hashed with SHA-256 before storage (`ipHash`).
   - Anti-bot invisible honeypot field (`honeypot`).
6. **Strict Tenant Isolation:**
   - All private API routes (`/api/v1/dashboard/*`, `/api/v1/sources/*`, `/api/v1/business/*`) filter strictly through `req.business.id` derived from verified sessions.
