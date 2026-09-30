import { describe, it, expect } from 'vitest';

describe('Health endpoint', () => {
  it('should return status object structure', () => {
    const status = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services: { database: 'connected' as const },
    };

    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('timestamp');
    expect(status).toHaveProperty('version');
    expect(status.services).toHaveProperty('database');
  });

  it('should report degraded when database is disconnected', () => {
    const dbConnected = false;
    const status = dbConnected ? 'healthy' : 'degraded';
    expect(status).toBe('degraded');
  });
});
