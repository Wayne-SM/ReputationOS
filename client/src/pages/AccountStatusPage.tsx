import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function AccountStatusPage() {
  const { user, business, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const status = business?.status || 'PENDING';

  // If status became ACTIVE, redirect to dashboard
  useEffect(() => {
    if (status === 'ACTIVE') {
      navigate('/dashboard', { replace: true });
    }
  }, [status, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'PENDING':
        return {
          title: 'Account Pending Verification',
          message: 'Your account is pending verification and activation.',
          subtext:
            'Platform administrators review new business accounts before activation. If you have made a payment via UPI or bank transfer, activation typically takes 15–30 minutes during business hours.',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          badgeText: 'PENDING APPROVAL',
          icon: (
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          iconBg: 'bg-amber-50',
        };
      case 'SUSPENDED':
        return {
          title: 'Account Suspended',
          message: 'Your account has been temporarily suspended. Please contact support.',
          subtext:
            'Access to this business dashboard has been temporarily paused. Please reach out to your account representative or support to resolve this issue.',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          badgeText: 'SUSPENDED',
          icon: (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ),
          iconBg: 'bg-red-50',
        };
      case 'REJECTED':
        return {
          title: 'Account Approval Declined',
          message: 'Your account could not be approved. Please contact support.',
          subtext:
            'Unfortunately, this registration could not be verified or approved under our platform guidelines. Please contact support if you believe this was an error.',
          badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
          badgeText: 'REJECTED',
          icon: (
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          iconBg: 'bg-gray-100',
        };
      default:
        return {
          title: 'Account Active',
          message: 'Your account is active.',
          subtext: 'Redirecting to your dashboard...',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          badgeText: 'ACTIVE',
          icon: null,
          iconBg: 'bg-green-50',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="h-12 w-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-sm">
          R
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-gray-900">
          Reputation OS
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-2xl sm:px-10 text-center space-y-6">
          <div className={`w-16 h-16 ${config.iconBg} rounded-2xl mx-auto flex items-center justify-center`}>
            {config.icon}
          </div>

          <div className="space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeColor}`}>
              {config.badgeText}
            </span>
            <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
            <p className="text-sm font-semibold text-gray-800">{config.message}</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed pt-1">
              {config.subtext}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200/60 space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Business:</span>
              <span className="font-semibold text-gray-800">{business?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Account Owner:</span>
              <span className="text-gray-800">{user?.name} ({user?.email})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Payment Mode:</span>
              <span className="text-gray-800">Manual (UPI / Bank Transfer / Cash)</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-primary w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking activation...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Check Activation Status</span>
                </>
              )}
            </button>

            {user?.isPlatformAdmin && (
              <Link
                to="/admin"
                className="btn-secondary w-full py-2.5 text-sm font-medium text-brand-700 bg-brand-50 border-brand-200 hover:bg-brand-100 flex items-center justify-center gap-2"
              >
                <span>Platform Owner Admin Portal</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}

            <button
              onClick={() => logout()}
              className="btn-secondary w-full py-2 text-xs text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
