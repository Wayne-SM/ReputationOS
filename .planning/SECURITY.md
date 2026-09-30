# SECURITY.md — Reputation OS

## Security Architecture

### Threat Model

Reputation OS handles sensitive business reputation data and customer feedback. Key threat vectors:

1. **Cross-Tenant Data Leakage** — A business accessing another business's feedback, analytics, or settings
2. **Spam/Fake Feedback** — Bots or malicious actors flooding feedback submissions
3. **Account Compromise** — Unauthorized access to business dashboards
4. **Data Injection** — XSS, SQL injection, or other injection attacks
5. **Rate Limit Bypass** — Circumventing rate limits to abuse the platform
6. **Privacy Violations** — Collecting or exposing unnecessary customer PII

### Tenant Isolation

**Strategy:** Database-level isolation via query scoping

| Layer | Mechanism |
|-------|----------|
| Database | All tenant tables include `business_id` FK |
| Query | Every query MUST include `WHERE business_id = ?` |
| Middleware | `tenantMiddleware` extracts `business_id` from session |
| API | No endpoint accepts arbitrary `business_id` from client |
| Validation | Server-side verification that user belongs to requested business |

**Rules:**
- Never accept `business_id` from request body/params for data access
- Always derive `business_id` from authenticated session
- Public routes (`/r/:slug`) resolve business via slug lookup, expose only public data
- JOIN queries must include `business_id` condition on all joined tables

### Authentication Security

| Aspect | Implementation |
|--------|---------------|
| Password Storage | Argon2id hashing |
| Session Storage | Server-side (PostgreSQL) |
| Session Tokens | Cryptographically random, 256-bit |
| Cookie Flags | httpOnly, secure, sameSite=strict |
| Session Expiry | 7 days, sliding window |
| CSRF Protection | SameSite cookies + CSRF token |
| Brute Force | Rate limit: 5 auth attempts / 15 min |

### Input Validation

| Surface | Protection |
|---------|------------|
| API Inputs | Zod schema validation on every endpoint |
| Text Fields | HTML entity encoding, max length limits |
| File Uploads | Type validation, size limits, malware scanning (future) |
| URL Inputs | Protocol whitelist (https only for Google review URLs) |
| SQL | Parameterized queries via Drizzle ORM (no raw SQL) |

### Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Global | 100 requests | 15 minutes |
| Auth (login/register) | 5 requests | 15 minutes |
| Feedback submission | 10 requests | 15 minutes |
| Analytics events | 50 requests | 1 minute |
| API (authenticated) | 200 requests | 15 minutes |
| QR download | 20 requests | 15 minutes |

### Abuse Prevention (Customer Feedback)

| Mechanism | Description |
|-----------|-------------|
| Rate limiting | Max 10 feedback per IP per 15 min |
| Honeypot field | Hidden form field to catch bots |
| Timing check | Reject submissions < 2 seconds (bot speed) |
| Text length | Min 5, max 2000 characters |
| Session dedup | One submission per session ID |
| IP hashing | Store hashed IP for rate limiting, not raw IP |

### API Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Environment Security

- All secrets in environment variables, never in code
- `.env` in `.gitignore`
- `.env.example` with placeholder values committed
- Different secrets per environment (dev/staging/prod)
- Database connection over SSL in production

### Data Privacy

| Data Type | Collection | Storage | Retention |
|-----------|------------|---------|----------|
| Business data | Explicit consent at signup | Encrypted at rest | Until account deletion |
| Customer feedback | Opt-in (submission = consent) | Database | Indefinite (business asset) |
| Customer PII (name/email) | Optional, configurable per business | Database | Deletable on request |
| Analytics events | Automatic, anonymized | Database | 24-month rolling |
| Session IDs | Per-visit, random UUID | Database | Session duration |
| IP addresses | Hashed for rate limiting | Not stored raw | Session duration |

### Security Testing Checklist (Phase 10)

- [ ] Tenant isolation: Tenant A cannot query Tenant B data
- [ ] Auth bypass: Protected routes reject unauthenticated requests
- [ ] Session hijacking: Sessions invalidated on password change
- [ ] CSRF: State-changing requests require valid token
- [ ] XSS: User input rendered safely in all views
- [ ] SQL injection: No raw SQL queries
- [ ] Rate limits: All limits enforced under load
- [ ] IDOR: Object access verified against business membership
- [ ] File upload: Only allowed types accepted
- [ ] Error leakage: No stack traces or internal errors in responses
- [ ] HTTPS: All production traffic encrypted
- [ ] Headers: Security headers present on all responses
- [ ] Dependencies: No known critical vulnerabilities
