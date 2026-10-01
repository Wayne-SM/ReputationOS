import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { StarRating } from '../components/feedback/StarRating';
import type { PublicBusinessInfo } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function FeedbackPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [searchParams] = useSearchParams();

  // Source attribution: reception vs instagram (defaults to reception)
  const sourceParam = searchParams.get('source');
  const source = sourceParam === 'instagram' ? 'instagram' : 'reception';

  // Component State
  const [business, setBusiness] = useState<PublicBusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Post-submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
  const [hasClickedGoogle, setHasClickedGoogle] = useState(false);

  // Generate or retrieve persistent anonymous session ID for this browser visit
  const [sessionId] = useState<string>(() => {
    const key = `reputation_os_session_${businessSlug}`;
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    return sid;
  });

  // Fetch public business branding
  useEffect(() => {
    async function loadBusiness() {
      if (!businessSlug) return;
      try {
        const res = await fetch(`${API_BASE_URL}/public/r/${encodeURIComponent(businessSlug)}?source=${source}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setBusiness(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadBusiness();
  }, [businessSlug, source]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a rating to continue.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/public/r/${encodeURIComponent(businessSlug!)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          text: feedbackText.trim() || undefined,
          source,
          sessionId,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          honeypot: honeypot || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed. Please try again.');
      }

      const data = await res.json();
      setGoogleReviewUrl(data.googleReviewUrl);
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google Review CTA Click
  const handleGoogleClick = async () => {
    if (!googleReviewUrl) return;

    setHasClickedGoogle(true);

    // Track click event asynchronously
    fetch(`${API_BASE_URL}/public/r/${encodeURIComponent(businessSlug!)}/click-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        source,
      }),
    }).catch(() => {
      // Non-blocking
    });

    // Navigate to Google Review URL in new tab
    window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading experience...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-gray-900">Feedback Page Unavailable</h1>
          <p className="mt-2 text-sm text-gray-500">
            This business feedback page could not be found or is temporarily inactive.
          </p>
        </div>
      </div>
    );
  }

  const accentColor = business.accentColor || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Business Branding Header */}
        <div className="text-center space-y-3">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-16 w-16 mx-auto rounded-2xl object-cover shadow-sm border border-gray-100"
            />
          ) : (
            <div
              className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{business.name}</h1>
            {business.description && (
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto line-clamp-2">
                {business.description}
              </p>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          {!isSubmitted ? (
            /* ── FEEDBACK INPUT FLOW ────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-base font-semibold text-gray-900">
                  {business.feedbackWelcomeText || 'How was your experience?'}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tap a star to rate your visit
                </p>
              </div>

              {/* Star Rating Component */}
              <StarRating
                value={rating}
                onChange={(newRating) => {
                  setRating(newRating);
                  if (submitError) setSubmitError('');
                }}
                accentColor={accentColor}
                disabled={isSubmitting}
              />

              {/* Feedback Text Area */}
              <div>
                <label
                  htmlFor="feedbackText"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
                >
                  {rating > 0 && rating <= 3
                    ? 'How can we improve? (Optional)'
                    : 'Your Feedback (Optional)'}
                </label>
                <textarea
                  id="feedbackText"
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    rating > 0 && rating <= 3
                      ? 'Tell us what fell short and how we can make it right for you...'
                      : 'Tell us what you loved or how we can improve...'
                  }
                  className="input resize-none py-2.5"
                  disabled={isSubmitting}
                />
              </div>

              {/* Optional Contact Collection */}
              {business.collectContactInfo && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500">
                    Leave your contact details if you would like us to follow up:
                  </p>
                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email address"
                      className="input"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone number (optional)"
                      className="input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* Hidden Honeypot Field (Anti-Bot) */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {submitError && (
                <div className="rounded-xl bg-red-50 p-3 border border-red-100">
                  <p className="text-xs font-medium text-red-700 text-center">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                style={{
                  backgroundColor: accentColor,
                  ['--tw-ring-color' as any]: accentColor,
                }}
              >
                {isSubmitting ? 'Sending feedback...' : 'Submit Feedback'}
              </button>
            </form>
          ) : (
            /* ── POST-SUBMISSION STATE (ZERO REVIEW GATING) ────── */
            <div className="text-center space-y-6 py-2">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white"
                style={{ backgroundColor: accentColor }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {rating >= 4 ? (
                /* Positive Feedback Response */
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {business.feedbackThankYouText || 'Thank you for your fantastic feedback!'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    We're thrilled you had a great experience with us. It means the world to our team!
                  </p>
                </div>
              ) : (
                /* Lower Rating Empathetic Recovery Response */
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Thank you for your honest feedback
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    We're truly sorry your experience wasn't what you expected. Your notes have been shared directly with management so we can make this right.
                  </p>
                </div>
              )}

              {/* UNIVERSAL GOOGLE REVIEW CTA (ZERO GATING — VISIBLE FOR ALL RATINGS) */}
              {googleReviewUrl && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-medium text-gray-600">
                    {rating >= 4
                      ? 'Would you take 30 seconds to share your positive experience on Google?'
                      : 'You are also welcome to share your public review on Google:'}
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center gap-2.5 active:scale-95 ${
                      rating >= 4
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-gray-400'
                    }`}
                  >
                    {/* Google Colorful G Icon */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>
                      {rating >= 4
                        ? (business.googleReviewCtaText || 'Share Your Review on Google')
                        : 'Review on Google'}
                    </span>
                  </button>

                  {hasClickedGoogle && (
                    <p className="text-[11px] text-gray-400">
                      Redirecting to Google... Thank you for taking the time!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center">
          <p className="text-[11px] text-gray-400">
            Powered by <span className="font-semibold text-gray-500">Reputation OS</span>
          </p>
        </div>
      </div>
    </div>
  );
}
