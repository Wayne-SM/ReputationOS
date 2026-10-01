import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { env } from './env.js';

/** Generate a cryptographically random session token */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Create a new session for a user */
export async function createSession(
  userId: string,
): Promise<{ id: string; expiresAt: Date }> {
  const id = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_EXPIRY_SECONDS * 1000);

  await db.insert(sessions).values({ id, userId, expiresAt });

  return { id, expiresAt };
}

/** Validate a session token and return user data if valid */
export async function validateSession(sessionId: string) {
  const result = await db
    .select({
      session: {
        id: sessions.id,
        expiresAt: sessions.expiresAt,
      },
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        isPlatformAdmin: users.isPlatformAdmin,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (result.length === 0) return null;
  return result[0]!;
}

/** Delete a session */
export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
