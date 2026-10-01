// ============================================================
// Reputation OS — Shared Types
// ============================================================

/** Review source types */
export type SourceType = 'reception' | 'instagram' | 'whatsapp' | 'direct';

/** Business lifecycle status */
export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

/** Business member roles */
export type MemberRole = 'owner' | 'admin' | 'member';

/** Manual payment method */
export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';

/** Manual payment status */
export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

/** Analytics event types */
export type AnalyticsEventType =
  | 'feedback_page_view'
  | 'rating_selected'
  | 'feedback_started'
  | 'feedback_submitted'
  | 'google_review_clicked';

/** Star rating (1-5) */
export type Rating = 1 | 2 | 3 | 4 | 5;

// ── API Request/Response Types ─────────────────────────────

/** Public business info (exposed on feedback page) */
export interface PublicBusinessInfo {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  accentColor: string;
  feedbackWelcomeText: string;
  feedbackThankYouText: string;
  googleReviewCtaText: string;
  collectContactInfo: boolean;
  contactInfoRequired: boolean;
}

/** Feedback submission payload */
export interface FeedbackSubmission {
  rating: Rating;
  text?: string;
  source: SourceType;
  sessionId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

/** Feedback submission response */
export interface FeedbackResponse {
  success: boolean;
  googleReviewUrl: string | null;
}

/** Analytics event payload */
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  source: SourceType;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

/** Health check response */
export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
  };
}

// ── Dashboard Types ────────────────────────────────────────

/** Reputation overview metrics (Core MVP metrics) */
export interface DashboardMetrics {
  googleRating: number | null;
  googleReviewCount: number;
  totalFeedback: number;
  receptionScans: number;
  instagramVisits: number;
  googleReviewClicks: number;
  feedbackSubmissions: number;
  averageRating: number | null;
}

/** Complete Dashboard Overview response */
export interface DashboardOverview {
  metrics: DashboardMetrics;
  ratingDistribution: RatingDistribution[];
  recentFeedback: FeedbackItem[];
}

// ── Admin & Payment Types ──────────────────────────────────

/** Manual payment ledger entry */
export interface BusinessPayment {
  id: string;
  businessId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}

/** Payload to record a manual payment */
export interface RecordPaymentPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

/** Admin Overview KPI statistics */
export interface AdminOverviewStats {
  totalBusinesses: number;
  pendingBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  rejectedBusinesses: number;
}

/** Admin business summary row in list table */
export interface AdminBusinessSummary {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  latestPaymentStatus: PaymentStatus | 'UNPAID';
  totalPaidAmount: number;
  totalFeedback: number;
  averageRating: number | null;
}

/** Full business detail for admin inspection */
export interface AdminBusinessDetail {
  business: {
    id: string;
    name: string;
    slug: string;
    status: BusinessStatus;
    description: string | null;
    logoUrl: string | null;
    accentColor: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    createdAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  googleReview: {
    googlePlaceId: string | null;
    googleReviewUrl: string | null;
    googleRating: number | null;
    googleReviewCount: number;
  };
  settings: {
    feedbackWelcomeText: string;
    feedbackThankYouText: string;
    googleReviewCtaText: string;
    collectContactInfo: boolean;
  };
  metrics: DashboardMetrics;
  sources: {
    receptionUrl: string;
    instagramUrl: string;
  };
  recentFeedback: FeedbackItem[];
  payments: BusinessPayment[];
}

/** Rating distribution */
export interface RatingDistribution {
  rating: Rating;
  count: number;
  percentage: number;
}

/** Funnel metrics */
export interface FunnelMetrics {
  pageViews: number;
  ratingsSelected: number;
  feedbackStarted: number;
  feedbackSubmitted: number;
  googleReviewClicked: number;
}

/** Feedback list item */
export interface FeedbackItem {
  id: string;
  rating: Rating;
  text: string | null;
  sourceType: SourceType;
  isRead: boolean;
  googleReviewClicked: boolean;
  customerName: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  createdAt: string;
}

/** Business Settings response */
export interface BusinessSettingsData {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    accentColor: string;
    phone: string | null;
    website: string | null;
  };
  googleReview: {
    googlePlaceId: string | null;
    googleReviewUrl: string | null;
    googleRating: number | null;
    googleReviewCount: number;
  };
  settings: {
    feedbackWelcomeText: string;
    feedbackThankYouText: string;
    googleReviewCtaText: string;
    collectContactInfo: boolean;
    contactInfoRequired: boolean;
  };
}

/** Business Settings update payload */
export interface UpdateBusinessSettingsPayload {
  name?: string;
  accentColor?: string;
  description?: string;
  phone?: string;
  website?: string;
  googleReviewUrl?: string;
  googlePlaceId?: string;
  feedbackWelcomeText?: string;
  feedbackThankYouText?: string;
  googleReviewCtaText?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** API error response */
export interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

