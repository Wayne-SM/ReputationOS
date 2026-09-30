import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  users,
  businesses,
  businessMembers,
  businessSettings,
  googleReviewSettings,
  reviewSources,
} from '../db/schema.js';
import { createSession } from '../lib/session.js';
import type { RegisterInput, LoginInput } from '../lib/validation.js';

// ── Password Hashing (Node.js crypto.scrypt) ────────────────

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) return resolve(false);
    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(crypto.timingSafeEqual(storedKey, derivedKey));
    });
  });
}

// ── Slug Generation ─────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ── Auth Error ──────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ── Register ────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new AuthError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);

  // Generate unique slug
  let slug = generateSlug(input.businessName);
  const slugCheck = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (slugCheck.length > 0) {
    slug = `${slug}-${crypto.randomBytes(3).toString('hex')}`;
  }

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
    })
    .returning({ id: users.id, email: users.email, name: users.name });

  // Create business
  const [business] = await db
    .insert(businesses)
    .values({ name: input.businessName, slug })
    .returning();

  // Create business member (owner)
  await db.insert(businessMembers).values({
    userId: user!.id,
    businessId: business!.id,
    role: 'owner',
  });

  // Create business settings (defaults)
  await db.insert(businessSettings).values({
    businessId: business!.id,
  });

  // Create Google review settings (empty)
  await db.insert(googleReviewSettings).values({
    businessId: business!.id,
  });

  // Create default review sources
  await db.insert(reviewSources).values([
    { businessId: business!.id, type: 'reception', label: 'Reception QR' },
    { businessId: business!.id, type: 'instagram', label: 'Instagram' },
  ]);

  // Create session
  const session = await createSession(user!.id);

  return { user: user!, business: business!, session };
}

// ── Login ───────────────────────────────────────────────────

export async function loginUser(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid email or password', 401);
  }

  // Get user's primary business
  const [membership] = await db
    .select({
      business: businesses,
      role: businessMembers.role,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .where(eq(businessMembers.userId, user.id))
    .limit(1);

  const session = await createSession(user.id);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    business: membership?.business ?? null,
    role: membership?.role ?? null,
    session,
  };
}
