import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './lib/env.js';
import { verifyConnection } from './db/index.js';
import healthRouter from './routes/health.js';

const app = express();

// ── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// ── Rate Limiting ───────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/v1', healthRouter);

// ── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error Handler ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: env.isDev ? err.message : 'Internal server error',
  });
});

// ── Start Server ────────────────────────────────────────────
async function start() {
  const dbOk = await verifyConnection();
  if (dbOk) {
    console.log('✓ Database connected');
  } else {
    console.warn('⚠ Database not available — running without DB');
  }

  app.listen(env.PORT, () => {
    console.log(`\n  Reputation OS API`);
    console.log(`  ─────────────────────`);
    console.log(`  Local:   http://localhost:${env.PORT}`);
    console.log(`  Health:  http://localhost:${env.PORT}/api/v1/health`);
    console.log(`  Env:     ${env.NODE_ENV}\n`);
  });
}

start().catch(console.error);

export { app };
