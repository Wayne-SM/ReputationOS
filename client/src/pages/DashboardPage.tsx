import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { DashboardOverview } from '../../../shared/types/index.js';

export function DashboardPage() {
  const { user, business, logout } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'reception' | 'instagram'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'positive' | 'critical'>('all');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const json = await api.get<DashboardOverview>('/dashboard/overview');
        setData(json);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Network error while loading metrics');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const metrics = data?.metrics;
  const ratingDistribution = data?.ratingDistribution || [];
  const recentFeedback = data?.recentFeedback || [];

  // Filter recent feedback
  const filteredFeedback = recentFeedback.filter((item) => {
    if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
    if (ratingFilter === 'positive' && item.rating < 4) return false;
    if (ratingFilter === 'critical' && item.rating >= 4) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">
              Reputation OS
            </span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-600">
              {business?.name || 'My Business'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-brand-600 border-b-2 border-brand-600 py-5 transition-colors"
            >
              Overview
            </Link>
            <Link
              to="/sources"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              QR & Links
            </Link>
            <Link
              to="/settings"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={() => logout()}
              className="btn-secondary text-xs py-1.5 px-3 ml-2"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Reputation Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time customer feedback and review conversion telemetry for <span className="font-medium text-gray-800">{business?.name}</span>
              {user?.name && <span className="text-gray-400"> • Logged in as {user.name}</span>}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/r/${business?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <span>View Public Feedback Page</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <Link
              to="/sources"
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <span>Get Reception QR</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading metrics...</p>
          </div>
        ) : (
          <>
            {/* ── KPI METRIC CARDS (The 7 MVP Metrics) ───────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Reception Scans */}
              <div className="card space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Reception Scans
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {metrics?.receptionScans ?? 0}
                </div>
                <p className="text-xs text-gray-500">
                  In-person counter QR code scans
                </p>
              </div>

              {/* 2. Instagram Visits */}
              <div className="card space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Instagram Visits
                  </span>
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {metrics?.instagramVisits ?? 0}
                </div>
                <p className="text-xs text-gray-500">
                  Followers visiting via bio link
                </p>
              </div>

              {/* 3. Feedback Submissions */}
              <div className="card space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Feedback
                  </span>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {metrics?.totalFeedback ?? 0}
                </div>
                <p className="text-xs text-gray-500">
                  {metrics?.averageRating ? `${metrics.averageRating} ★ average customer score` : 'No reviews recorded yet'}
                </p>
              </div>

              {/* 4. Google Review Clicks */}
              <div className="card space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Google Review Clicks
                  </span>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {metrics?.googleReviewClicks ?? 0}
                </div>
                <p className="text-xs text-gray-500">
                  Customers channeled to Google profile
                </p>
              </div>
            </div>

            {/* ── TWO-COLUMN SECTION: DISTRIBUTION & FEED ─────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Rating Distribution */}
              <div className="card space-y-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Rating Distribution
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer sentiment breakdown
                  </p>
                </div>

                {/* Score Summary Box */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {metrics?.averageRating ? metrics.averageRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-sm text-gray-400 font-medium"> / 5.0</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Based on {metrics?.totalFeedback ?? 0} submissions
                    </p>
                  </div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          metrics?.averageRating && metrics.averageRating >= star
                            ? 'text-amber-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-3">
                  {ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-gray-700 w-12 flex items-center gap-1">
                        <span>{item.rating}</span>
                        <span className="text-amber-400">★</span>
                      </span>

                      {/* Bar Container */}
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor:
                              item.rating >= 4
                                ? '#10b981'
                                : item.rating === 3
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        />
                      </div>

                      <span className="w-10 text-right text-gray-500 font-mono">
                        {item.count}
                      </span>
                      <span className="w-12 text-right text-gray-400 font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Google Policy Compliance Note */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>
                      <strong className="text-gray-700">Strict Google Policy Compliance:</strong> Every rating (1 to 5) unconditionally accesses your Google Review CTA.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Customer Feedback */}
              <div className="card space-y-4 lg:col-span-2 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Recent Customer Feedback
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Showing latest customer responses and source channels
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setSourceFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        sourceFilter === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Sources
                    </button>
                    <button
                      onClick={() => setSourceFilter('reception')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        sourceFilter === 'reception'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      Reception
                    </button>
                    <button
                      onClick={() => setSourceFilter('instagram')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        sourceFilter === 'instagram'
                          ? 'bg-pink-600 text-white'
                          : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                      }`}
                    >
                      Instagram
                    </button>
                    <span className="text-gray-300 mx-1">|</span>
                    <button
                      onClick={() => setRatingFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        ratingFilter === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Ratings
                    </button>
                    <button
                      onClick={() => setRatingFilter('positive')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        ratingFilter === 'positive'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      4-5 ★
                    </button>
                    <button
                      onClick={() => setRatingFilter('critical')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        ratingFilter === 'critical'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      1-3 ★
                    </button>
                  </div>
                </div>

                {/* Feedback List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {filteredFeedback.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">No feedback submissions yet</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Share your reception QR code or Instagram link to start receiving customer ratings and feedback.
                      </p>
                      <Link to="/sources" className="btn-secondary text-xs inline-block">
                        View QR Code & Links
                      </Link>
                    </div>
                  ) : (
                    filteredFeedback.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Star Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white ${
                                fb.rating >= 4
                                  ? 'bg-green-600'
                                  : fb.rating === 3
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            >
                              <span>{fb.rating}</span>
                              <span>★</span>
                            </span>

                            {/* Customer Name */}
                            <span className="text-xs font-semibold text-gray-800">
                              {fb.customerName || 'Anonymous Customer'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Source Badge */}
                            {fb.sourceType === 'reception' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                Reception QR
                              </span>
                            ) : fb.sourceType === 'instagram' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-pink-50 text-pink-700 border border-pink-200">
                                Instagram Bio
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                                Direct
                              </span>
                            )}

                            {/* Google CTA Click indicator */}
                            {fb.googleReviewClicked && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Customer clicked the Google Review button">
                                ✓ Clicked Google
                              </span>
                            )}

                            <span className="text-[11px] text-gray-400">
                              {new Date(fb.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Feedback text */}
                        {fb.text ? (
                          <p className="text-xs text-gray-700 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 leading-relaxed italic">
                            "{fb.text}"
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No comment provided
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
