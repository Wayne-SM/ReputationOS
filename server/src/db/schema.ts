import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// USERS
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isPlatformAdmin: boolean('is_platform_admin').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// BUSINESSES (Tenant Entity)
// ============================================================

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 500 }),
  accentColor: varchar('accent_color', { length: 7 }).default('#2563eb').notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  website: varchar('website', { length: 500 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// BUSINESS MEMBERS
// ============================================================

export const businessMembers = pgTable('business_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'owner' | 'admin' | 'member'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  uniqueIndex('idx_bm_user_business').on(table.userId, table.businessId),
  index('idx_bm_business').on(table.businessId),
]));

// ============================================================
// BUSINESS SETTINGS
// ============================================================

export const businessSettings = pgTable('business_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }).unique(),
  feedbackWelcomeText: text('feedback_welcome_text').default('How was your experience?'),
  feedbackThankYouText: text('feedback_thank_you_text').default('Thank you for your feedback!'),
  googleReviewCtaText: text('google_review_cta_text').default('Share your experience on Google'),
  collectContactInfo: boolean('collect_contact_info').default(false).notNull(),
  contactInfoRequired: boolean('contact_info_required').default(false).notNull(),
  notifyOnFeedback: boolean('notify_on_feedback').default(true).notNull(),
  notifyOnLowRating: boolean('notify_on_low_rating').default(true).notNull(),
  lowRatingThreshold: integer('low_rating_threshold').default(2).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// GOOGLE REVIEW SETTINGS
// ============================================================

export const googleReviewSettings = pgTable('google_review_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }).unique(),
  googlePlaceId: varchar('google_place_id', { length: 255 }),
  googleReviewUrl: varchar('google_review_url', { length: 500 }),
  googleRating: decimal('google_rating', { precision: 2, scale: 1 }),
  googleReviewCount: integer('google_review_count').default(0).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// REVIEW SOURCES
// ============================================================

export const reviewSources = pgTable('review_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'reception' | 'instagram' | 'whatsapp' | 'direct'
  label: varchar('label', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  url: varchar('url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  uniqueIndex('idx_rs_business_type').on(table.businessId, table.type),
  index('idx_rs_business').on(table.businessId),
]));

// ============================================================
// QR CODES
// ============================================================

export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => reviewSources.id, { onDelete: 'cascade' }).unique(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  qrData: text('qr_data').notNull(),
  styleConfig: jsonb('style_config').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_qr_business').on(table.businessId),
]));

// ============================================================
// FEEDBACK
// ============================================================

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  sourceType: varchar('source_type', { length: 20 }).notNull(),
  sessionId: uuid('session_id').notNull(),
  rating: integer('rating').notNull(),
  text: text('text'),
  customerName: varchar('customer_name', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 20 }),
  isRead: boolean('is_read').default(false).notNull(),
  googleReviewClicked: boolean('google_review_clicked').default(false).notNull(),
  ipHash: varchar('ip_hash', { length: 64 }),
  userAgent: varchar('user_agent', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_fb_business').on(table.businessId),
  index('idx_fb_business_created').on(table.businessId, table.createdAt),
  index('idx_fb_business_source').on(table.businessId, table.sourceType),
  index('idx_fb_business_rating').on(table.businessId, table.rating),
]));

// ============================================================
// ANALYTICS EVENTS
// ============================================================

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  sourceType: varchar('source_type', { length: 20 }).notNull(),
  sessionId: uuid('session_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_ae_business').on(table.businessId),
  index('idx_ae_business_type').on(table.businessId, table.eventType),
  index('idx_ae_business_created').on(table.businessId, table.createdAt),
  index('idx_ae_business_source').on(table.businessId, table.sourceType),
]));

// ============================================================
// BUSINESS PAYMENTS (Manual Ledger)
// ============================================================

export const businessPayments = pgTable('business_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'
  paymentStatus: varchar('payment_status', { length: 20 }).default('COMPLETED').notNull(), // 'COMPLETED' | 'PENDING' | 'FAILED'
  paymentDate: timestamp('payment_date', { withTimezone: true }).defaultNow().notNull(),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ([
  index('idx_bp_business').on(table.businessId),
  index('idx_bp_business_date').on(table.businessId, table.paymentDate),
]));

// ============================================================
// SESSIONS (Auth)
// ============================================================

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ([
  index('idx_sessions_user').on(table.userId),
]));

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  businessMembers: many(businessMembers),
  sessions: many(sessions),
  recordedPayments: many(businessPayments),
}));

export const businessesRelations = relations(businesses, ({ many, one }) => ({
  members: many(businessMembers),
  settings: one(businessSettings),
  googleReviewSettings: one(googleReviewSettings),
  reviewSources: many(reviewSources),
  feedback: many(feedback),
  analyticsEvents: many(analyticsEvents),
  payments: many(businessPayments),
}));

export const businessMembersRelations = relations(businessMembers, ({ one }) => ({
  user: one(users, { fields: [businessMembers.userId], references: [users.id] }),
  business: one(businesses, { fields: [businessMembers.businessId], references: [businesses.id] }),
}));

export const businessSettingsRelations = relations(businessSettings, ({ one }) => ({
  business: one(businesses, { fields: [businessSettings.businessId], references: [businesses.id] }),
}));

export const googleReviewSettingsRelations = relations(googleReviewSettings, ({ one }) => ({
  business: one(businesses, { fields: [googleReviewSettings.businessId], references: [businesses.id] }),
}));

export const reviewSourcesRelations = relations(reviewSources, ({ one }) => ({
  business: one(businesses, { fields: [reviewSources.businessId], references: [businesses.id] }),
  qrCode: one(qrCodes),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  source: one(reviewSources, { fields: [qrCodes.sourceId], references: [reviewSources.id] }),
  business: one(businesses, { fields: [qrCodes.businessId], references: [businesses.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  business: one(businesses, { fields: [feedback.businessId], references: [businesses.id] }),
}));

export const businessPaymentsRelations = relations(businessPayments, ({ one }) => ({
  business: one(businesses, { fields: [businessPayments.businessId], references: [businesses.id] }),
  recordedByUser: one(users, { fields: [businessPayments.recordedBy], references: [users.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  business: one(businesses, { fields: [analyticsEvents.businessId], references: [businesses.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
