import { useEffect, useState, useId } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type {
  AdminBusinessDetail,
  BusinessPayment,
  BusinessStatus,
  PaymentMethod,
  PaymentStatus,
} from '@shared/types/index.ts';

export function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [data, setData] = useState<AdminBusinessDetail | null>(null);
  const [payments, setPayments] = useState<BusinessPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states: Google Review Settings
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googleRating, setGoogleRating] = useState<number | ''>('');
  const [googleReviewCount, setGoogleReviewCount] = useState<number | ''>('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form states: Record Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('COMPLETED');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const paymentAmountId = useId();
  const paymentMethodId = useId();
  const paymentStatusId = useId();
  const paymentDateId = useId();
  const paymentReferenceId = useId();
  const paymentNotesId = useId();

  const loadDetails = async () => {
    if (!id) return;
    try {
      setError(null);
      const [detailData, paymentsData] = await Promise.all([
        api.get<AdminBusinessDetail>(`/admin/businesses/${id}`),
        api.get<BusinessPayment[]>(`/admin/businesses/${id}/payments`),
      ]);
      setData(detailData);
      setPayments(paymentsData);
      setGoogleReviewUrl(detailData.googleReview?.googleReviewUrl || '');
      setGoogleRating(detailData.googleReview?.googleRating ?? '');
      setGoogleReviewCount(detailData.googleReview?.googleReviewCount ?? '');
    } catch (err: any) {
      console.error('Failed to load business details:', err);
      setError(err.message || 'Failed to load business profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleUpdateStatus = async (newStatus: BusinessStatus) => {
    if (!id) return;
    try {
      await api.patch(`/admin/businesses/${id}/status`, { status: newStatus });
      setSuccessMessage(`Account status changed to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadDetails();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleSaveGoogleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSavingSettings(true);
    try {
      await api.patch(`/admin/businesses/${id}/settings`, {
        googleReviewUrl: googleReviewUrl.trim() || null,
        googleRating: googleRating === '' ? null : Number(googleRating),
        googleReviewCount: googleReviewCount === '' ? null : Number(googleReviewCount),
      });
      setSuccessMessage('Google review settings saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadDetails();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !paymentAmount) return;
    setIsRecordingPayment(true);
    setPaymentError(null);

    try {
      await api.post(`/admin/businesses/${id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod,
        paymentStatus,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setSuccessMessage('Payment recorded successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
      await loadDetails();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900">Business Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">{error || 'Could not locate this account.'}</p>
          <Link to="/admin" className="btn-primary mt-4 inline-block text-xs py-2 px-4">
            Return to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { business, owner, metrics, recentFeedback, sources } = data;

  const getStatusBadge = (status: BusinessStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">PENDING</span>;
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">ACTIVE</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">SUSPENDED</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">REJECTED</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </Link>
            <Link to="/admin" className="font-semibold text-gray-900 tracking-tight hover:underline">
              Platform Admin
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-600 truncate max-w-xs">
              {business.name}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-xs text-gray-500 hover:text-gray-900">
              ← Back to Overview
            </Link>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button onClick={() => logout()} className="btn-secondary text-xs py-1.5 px-3">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-900 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Header with Title and Lifecycle Controls */}
        <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{business.name}</h1>
              {getStatusBadge(business.status)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Slug: <span className="font-mono text-gray-700">/{business.slug}</span> • Registered {new Date(business.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons for Lifecycle */}
          <div className="flex flex-wrap items-center gap-2">
            {business.status !== 'ACTIVE' && (
              <button
                onClick={() => handleUpdateStatus('ACTIVE')}
                className="btn-primary text-xs py-2 px-3 bg-green-600 hover:bg-green-700"
              >
                Approve & Activate
              </button>
            )}
            {business.status === 'ACTIVE' && (
              <button
                onClick={() => handleUpdateStatus('SUSPENDED')}
                className="btn-secondary text-xs py-2 px-3 text-red-700 border-red-200 hover:bg-red-50"
              >
                Suspend Account
              </button>
            )}
            {business.status === 'PENDING' && (
              <button
                onClick={() => handleUpdateStatus('REJECTED')}
                className="btn-secondary text-xs py-2 px-3 text-gray-600 border-gray-300 hover:bg-gray-100"
              >
                Decline / Reject
              </button>
            )}
            {business.status === 'REJECTED' && (
              <button
                onClick={() => handleUpdateStatus('ACTIVE')}
                className="btn-secondary text-xs py-2 px-3 text-green-700 border-green-300 hover:bg-green-50"
              >
                Reactivate Account
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Details & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Account Profile & Owner Info */}
          <div className="space-y-6">
            <div className="card space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Account Information
              </h2>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Business Owner</span>
                  <span className="font-semibold text-gray-800">{owner.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Owner Email</span>
                  <span className="font-semibold text-gray-800">{owner.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Current Status</span>
                  <div className="mt-0.5">{getStatusBadge(business.status)}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <a
                  href={`/r/${business.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 w-full flex items-center justify-center gap-1.5"
                >
                  <span>Open Public Feedback Page</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={`/r/${business.slug}?source=instagram`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 w-full flex items-center justify-center gap-1.5"
                >
                  <span>Test Instagram Bio Link</span>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Reception QR Source Preview */}
            <div className="card space-y-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Reception QR Source
              </h2>
              <p className="text-xs text-gray-500">
                Primary on-premise scan source configured for this business.
              </p>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1 text-xs">
                <div className="text-gray-400">Target URL:</div>
                <div className="font-mono text-gray-800 break-all select-all text-[11px]">
                  {sources.receptionUrl}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Google Review Settings & Telemetry */}
          <div className="lg:col-span-2 space-y-6">
            {/* Google Review URL Configuration */}
            <div className="card space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Google Review Profile Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Platform owner sets the official Google Review CTA destination for this client.
                </p>
              </div>

              <form onSubmit={handleSaveGoogleSettings} className="space-y-4">
                <div>
                  <label htmlFor="google-review-url-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Google Review Direct URL
                  </label>
                  <input
                    id="google-review-url-input"
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-google-review-link/review"
                    className="input text-xs py-2"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Direct link generated from the client's Google Business Profile.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="current-google-rating-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Current Google Rating
                    </label>
                    <input
                      id="current-google-rating-input"
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={googleRating}
                      onChange={(e) => setGoogleRating(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 4.8"
                      className="input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="google-review-count-input" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Google Review Count
                    </label>
                    <input
                      id="google-review-count-input"
                      type="number"
                      min="0"
                      value={googleReviewCount}
                      onChange={(e) => setGoogleReviewCount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 142"
                      className="input text-xs py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Google Review Settings'}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Metrics */}
            <div className="card space-y-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Telemetry Overview
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Reception Scans</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.receptionScans}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Instagram Visits</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.instagramVisits}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Total Feedback</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalFeedback}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Google Clicks</span>
                  <div className="text-2xl font-bold text-green-600 mt-1">{metrics.googleReviewClicks}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Manual Payments Tracking */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Manual Payment Records
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Offline payments recorded by platform admin (UPI, Bank Transfer, Cash). No automated billing.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Record Payment</span>
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No payments recorded yet for this client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reference / UTR</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">₹{p.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-700">{p.paymentMethod}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.paymentStatus === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : p.paymentStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">{p.reference || '—'}</td>
                      <td className="py-2.5 px-3 text-gray-500">{p.notes || '—'}</td>
                      <td className="py-2.5 px-3 text-gray-400">{p.recordedBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Recent Feedback */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-gray-900">
            Recent Feedback ({recentFeedback.length})
          </h2>
          {recentFeedback.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-xs">
              No customer feedback received yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentFeedback.map((item) => (
                <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-500 text-sm">
                        {'★'.repeat(item.rating)}
                        <span className="text-gray-200">{'★'.repeat(5 - item.rating)}</span>
                      </span>
                      <span className="text-[11px] font-medium text-gray-400">
                        via {item.sourceType === 'instagram' ? 'Instagram' : 'Reception QR'}
                      </span>
                      {item.customerName && (
                        <span className="text-xs font-semibold text-gray-700">
                          • {item.customerName}
                        </span>
                      )}
                    </div>
                    {item.text && <p className="text-xs text-gray-800">{item.text}</p>}
                    {(item.customerEmail || item.customerPhone) && (
                      <div className="text-[11px] text-gray-400">
                        {item.customerEmail && <span>{item.customerEmail} </span>}
                        {item.customerPhone && <span>{item.customerPhone}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Manual Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Record Offline Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label htmlFor={paymentAmountId} className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  id={paymentAmountId}
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="input text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={paymentMethodId} className="block text-xs font-semibold text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    id={paymentMethodId}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="input text-xs py-2 bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={paymentStatusId} className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id={paymentStatusId}
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="input text-xs py-2 bg-white"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={paymentDateId} className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  id={paymentDateId}
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input text-xs py-2"
                />
              </div>

              <div>
                <label htmlFor={paymentReferenceId} className="block text-xs font-semibold text-gray-700 mb-1">
                  Reference / UTR / Txn ID
                </label>
                <input
                  id={paymentReferenceId}
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UPI/1234567890/AXIS"
                  className="input text-xs py-2"
                />
              </div>

              <div>
                <label htmlFor={paymentNotesId} className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id={paymentNotesId}
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid for 6-month onboarding plan"
                  className="input text-xs py-2 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment || !paymentAmount}
                  className="btn-primary flex-1 text-xs py-2"
                >
                  {isRecordingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
