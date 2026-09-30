import { Router } from 'express';
import { verifyConnection } from '../db/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbConnected = await verifyConnection();

  const status = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
    },
  };

  res.status(dbConnected ? 200 : 503).json(status);
});

export default router;
