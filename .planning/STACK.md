# STACK.md — Reputation OS

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|----------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| Recharts | 2.x | Lightweight charting (dashboard only) |
| @tanstack/react-query | 5.x | Server state management |
| clsx | - | Conditional class names |
| tailwind-merge | - | Tailwind class merging |

### Backend

| Technology | Version | Purpose |
|------------|---------|----------|
| Node.js | 20.x LTS | Runtime |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | 0.3x.x | Database ORM & migrations |
| Zod | 3.x | Input validation |
| Lucia / Custom Sessions | 3.x / Native | Database-backed session auth with native crypto.scrypt |
| express-rate-limit | 7.x | Rate limiting |
| cors | 2.x | CORS middleware |
| helmet | 7.x | Security headers |
| dotenv | 16.x | Environment variables |

### ₹0 Infrastructure Cost Architecture (MVP Testing)

| Layer | ₹0 Selection | Deployment Option | Cost |
|-------|--------------|-------------------|------|
| **Database** | PostgreSQL (Drizzle ORM) | Local dev / Supabase Free / Neon Free | **₹0** |
| **Backend API** | Node.js + Express (Dockerizable) | Local dev / Render Free / Fly.io Free | **₹0** |
| **Frontend SPA** | React 18 + Vite (Static export) | Cloudflare Pages / Vercel Free / Netlify Free | **₹0** |
| **Telemetry** | First-party PostgreSQL events | Integrated in primary database | **₹0** |
| **QR Engine** | `qrcode` NPM library | In-process server generation | **₹0** |
| **AI / WhatsApp / Billing** | Provider Abstraction (No-Op) | In-process mock / console fallback | **₹0** |

### Provider Abstraction Layer (Zero Cost by Default)

Future paid third-party dependencies are decoupled via interfaces located in `server/src/providers/`:
- **`IAiProvider`**: Default `NoOpAiProvider` (returns null / safe fallback). Ready for OpenAI / Gemini when funded.
- **`IMessagingProvider`**: Default `ConsoleMessagingProvider` (logs formatted message). Ready for WhatsApp Business API when needed.
- **`IBillingProvider`**: Default `FreeTierBillingProvider` (grants active access). Ready for Stripe when monetizing.
- **`IEmailProvider`**: Default `ConsoleEmailProvider` (logs email payload). Ready for Resend / SendGrid when transactional emails needed.

## Stack Rationale

### Why React + Vite (not Next.js)?

- **Separation of concerns:** Distinct frontend SPA and backend API
- **Simpler deployment:** Static frontend + API server, no SSR complexity
- **Customer feedback page:** Served as a fast SPA route, no SSR needed
- **Dashboard is SPA:** No SEO requirements for authenticated dashboard
- **Future flexibility:** API can serve mobile apps, WhatsApp bots, etc.
- Next.js would add SSR complexity without clear benefit for this use case

### Why Drizzle ORM?

- Type-safe SQL queries with full TypeScript inference
- Lightweight — no heavy runtime like Prisma
- SQL-first approach with excellent PostgreSQL support
- Built-in migration tooling
- Good developer experience with schema-as-code

### Why Lucia Auth?

- Purpose-built for session-based auth in Node.js
- No vendor lock-in (unlike Auth0, Clerk)
- Full control over auth flow
- Integrates well with any database via adapters
- Lightweight and well-documented

### Why Express (not Hono/Fastify)?

- Massive ecosystem and middleware library
- Well-understood patterns for middleware composition
- Lucia Auth has excellent Express integration
- Battle-tested in production
- Easy to find solutions for edge cases

### Why Recharts?

- Lightweight React-native charting
- Good defaults for dashboard visualizations
- Responsive and customizable
- Small bundle size compared to alternatives

### Why Tailwind CSS?

- Rapid UI development with utility classes
- Design system consistency via configuration
- Small production bundle (purges unused styles)
- Excellent for responsive design
- No naming conventions to maintain

## Dependencies Not Included (And Why)

| Avoided | Reason |
|---------|--------|
| Redux | Overkill — React Query + local state sufficient |
| Styled Components | Tailwind is simpler and more performant |
| Mongoose | Not using MongoDB |
| Prisma | Heavier than Drizzle, slower cold starts |
| Firebase Auth | Vendor lock-in, unnecessary complexity |
| Chart.js | Recharts is more React-native |
| Moment.js | Dead library — use date-fns or native Date |
| Lodash | Most utilities available natively |
| Socket.io | No real-time requirements in v1 |
