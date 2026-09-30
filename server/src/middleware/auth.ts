import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { validateSession } from '../lib/session.js';
import { db } from '../db/index.js';
import { businessMembers, businesses } from '../db/schema.js';

// ── Types ───────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  id: string;
  expiresAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  session: AuthSession;
}

export interface BusinessRequest extends AuthenticatedRequest {
  business: { id: string; name: string; slug: string };
  role: string;
}

// ── Cookie Parser ───────────────────────────────────────────

function parseCookies(
  cookieHeader: string | undefined,
): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key!, val.join('=')];
    }),
  );
}

// ── Middleware: Require Authentication ───────────────────────

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies['session'];

  if (!sessionId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const result = await validateSession(sessionId);
  if (!result) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  (req as AuthenticatedRequest).user = result.user;
  (req as AuthenticatedRequest).session = {
    id: result.session.id,
    expiresAt: result.session.expiresAt,
  };

  next();
}

// ── Middleware: Require Business ─────────────────────────────

export async function requireBusiness(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const [membership] = await db
    .select({
      businessId: businesses.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      role: businessMembers.role,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(eq(businessMembers.userId, authReq.user.id))
    .limit(1);

  if (!membership) {
    res.status(403).json({ error: 'No business associated with this account' });
    return;
  }

  (req as BusinessRequest).business = {
    id: membership.businessId,
    name: membership.businessName,
    slug: membership.businessSlug,
  };
  (req as BusinessRequest).role = membership.role;

  next();
}

// ── Middleware: Require Role ────────────────────────────────

const ROLE_HIERARCHY: Record<string, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function requireRole(minRole: 'member' | 'admin' | 'owner') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const bizReq = req as BusinessRequest;
    const userLevel = ROLE_HIERARCHY[bizReq.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
