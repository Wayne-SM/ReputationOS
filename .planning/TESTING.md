# TESTING.md — Reputation OS

## Testing Strategy

### Philosophy

Test what matters. Prioritize:
1. Tenant isolation (highest priority — security)
2. Core business flows (feedback submission, auth)
3. Data integrity (correct source tracking, metrics)
4. API contract compliance

Avoid:
- Testing framework internals
- Excessive mocking that hides real bugs
- 100% coverage as a goal (focus on meaningful coverage)

### Testing Pyramid

```
          ┌──────────┐
          │   E2E    │  Phase 10 (Playwright)
          │  Tests   │  Critical user journeys
         ┌┴──────────┴┐
         │ Integration │  Phase 2+ (Vitest + Supertest)
         │   Tests     │  API endpoints, DB operations
        ┌┴────────────┴┐
        │  Unit Tests   │  Phase 1+ (Vitest)
        │               │  Business logic, utilities
        └───────────────┘
```

### Framework & Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| Vitest | Unit & integration test runner | 1+ |
| Supertest | HTTP endpoint testing | 2+ |
| @testing-library/react | Component testing | 3+ |
| Playwright | E2E browser testing | 10 |
| c8 / v8 | Code coverage | 2+ |

### Test Structure

```
server/
├── src/
│   ├── services/
│   │   ├── feedback.service.ts
│   │   └── feedback.service.test.ts      # Unit tests co-located
│   ├── routes/
│   │   ├── feedback.routes.ts
│   │   └── feedback.routes.test.ts       # Integration tests co-located
│   └── __tests__/
│       └── tenant-isolation.test.ts      # Cross-cutting tests
client/
├── src/
│   ├── components/
│   │   ├── StarRating.tsx
│   │   └── StarRating.test.tsx           # Component tests co-located
│   └── __tests__/
│       └── feedback-flow.test.tsx        # Flow tests
tests/
├── e2e/                                   # E2E tests (Phase 10)
│   ├── feedback-submission.spec.ts
│   ├── dashboard.spec.ts
│   └── auth-flow.spec.ts
└── fixtures/                              # Shared test data
    ├── businesses.ts
    ├── users.ts
    └── feedback.ts
```

### Test Database

- Separate PostgreSQL database for testing
- Migrations run before test suite
- Database reset between test suites (transaction rollback or truncate)
- Environment: `DATABASE_URL` points to test DB in test config

### Critical Test Scenarios

#### 1. Tenant Isolation (Phase 2)

```typescript
// MUST PASS — highest priority security test
test('Business A cannot access Business B feedback', async () => {
  // Create two businesses
  // Create feedback for Business B
  // Authenticate as Business A
  // Attempt to query Business B's feedback
  // Assert: 0 results or 403
});

test('Public feedback page only exposes public business data', async () => {
  // Hit /r/:slug
  // Assert: only name, logo, accentColor, description returned
  // Assert: no analytics, settings, feedback list exposed
});
```

#### 2. Feedback Submission (Phase 3)

```typescript
test('Feedback stores correct source type', async () => {
  // Submit via reception source
  // Assert source_type = 'reception'
  // Submit via instagram source
  // Assert source_type = 'instagram'
});

test('Google review CTA shown for all ratings', async () => {
  // Submit with rating 1 → CTA present
  // Submit with rating 3 → CTA present
  // Submit with rating 5 → CTA present
  // NO conditional logic based on rating
});

test('Rate limiting blocks excessive submissions', async () => {
  // Submit 10 feedbacks rapidly
  // 11th submission → 429 status
});
```

#### 3. Authentication (Phase 2)

```typescript
test('Protected routes reject unauthenticated requests', async () => {
  // Hit /api/v1/feedback without session
  // Assert: 401
});

test('Login returns valid session', async () => {
  // Register user
  // Login
  // Assert: session cookie set
  // Hit protected route → 200
});
```

#### 4. Analytics Tracking (Phase 6)

```typescript
test('Funnel events tracked in correct order', async () => {
  // Simulate: page_view → rating_selected → feedback_started → feedback_submitted → google_review_clicked
  // Assert: all events recorded with correct types and source
});

test('Analytics events respect privacy', async () => {
  // Create events
  // Assert: no PII in event records
  // Assert: session_id is UUID, not linked to identity
});
```

### Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| Services (business logic) | 80% | Core logic reliability |
| API routes | 70% | Contract compliance |
| Middleware (auth, tenant) | 90% | Security-critical |
| UI components | 60% | Key interactions |
| Utilities | 80% | Shared logic |
| Overall | 70% | Meaningful, not vanity |

### Test Commands

```bash
# Unit + integration tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (Phase 10)
npm run test:e2e

# Server tests only
npm run test:server

# Client tests only
npm run test:client
```

### CI/CD Testing (Phase 10)

```yaml
# GitHub Actions pipeline
- Lint check
- TypeScript compilation
- Unit tests
- Integration tests (with test DB)
- Build verification
- E2E tests (on staged deployment)
```
