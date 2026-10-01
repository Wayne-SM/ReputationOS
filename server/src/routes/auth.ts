import { Router } from 'express';
import { ZodError } from 'zod';
import { registerSchema, loginSchema } from '../lib/validation.js';
import { registerUser, loginUser, AuthError } from '../services/auth.service.js';
import { invalidateSession } from '../lib/session.js';
import { env } from '../lib/env.js';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { businesses, businessMembers } from '../db/schema.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Helper to set session cookie
function setSessionCookie(res: any, sessionId: string) {
  res.cookie('session', sessionId, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: env.SESSION_EXPIRY_SECONDS * 1000,
    path: '/',
  });
}

// ── POST /register ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    setSessionCookie(res, result.session.id);

    res.status(201).json({
      user: result.user,
      business: result.business,
      role: 'owner',
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
      return;
    }
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    setSessionCookie(res, result.session.id);

    res.status(200).json({
      user: result.user,
      business: result.business,
      role: result.role,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      });
      return;
    }
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /logout ────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (authReq.session?.id) {
      await invalidateSession(authReq.session.id);
    }

    res.clearCookie('session', {
      path: '/',
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? 'none' : 'lax',
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /me ─────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  const [membership] = await db
    .select({
      business: businesses,
      role: businessMembers.role,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(eq(businessMembers.userId, authReq.user.id))
    .limit(1);

  res.status(200).json({
    user: authReq.user,
    business: membership?.business ?? null,
    role: membership?.role ?? null,
  });
});

export default router;
