import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type {
  AdminOverviewStats,
  AdminBusinessSummary,
  BusinessStatus,
} from '@shared/types/index.ts';

export function AdminDashboardPage() {
  const { user, business, logout } = useAuth();
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusinessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BusinessStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [statsData, businessesData] = await Promise.all([
        api.get<AdminOverviewStats>('/admin/overview'),
        api.get<AdminBusinessSummary[]>('/admin/businesses'),
      ]);
      setStats(statsData);
      setBusinesses(businessesData);
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to load platform data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (businessId: string, newStatus: BusinessStatus) => {
    setUpdatingId(businessId);
    try {
      await api.patch(`/admin/businesses/${businessId}/status`, { status: newStatus });
      // Refresh local list
      await loadData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter businesses
  const filteredBusinesses = businesses.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchSlug = b.slug.toLowerCase().includes(q);
      const matchOwner = b.ownerName.toLowerCase().includes(q);
      const matchEmail = b.ownerEmail.toLowerCase().includes(q);
      return matchName || matchSlug || matchOwner || matchEmail;
    }
    return true;
  });

  const getStatusBadge = (status: BusinessStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            PENDING
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            SUSPENDED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            REJECTED
          </span>
        );
    }
  };

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
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-100 text-brand-800">
              Platform Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            {business && business.status === 'ACTIVE' && (
              <Link
                to="/dashboard"
                className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Go to Business App ({business.name})
              </Link>
            )}
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button
              onClick={() => logout()}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Platform Owner Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage business account lifecycles, configure review settings, and record manual payments.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading platform data...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`card cursor-pointer transition-all hover:border-brand-300 ${
                  statusFilter === 'ALL' ? 'ring-2 ring-brand-500 border-brand-500' : ''
                }`}
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Businesses
                </span>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                  {stats?.totalBusinesses ?? 0}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('PENDING')}
                className={`card cursor-pointer transition-all hover:border-amber-300 ${
                  statusFilter === 'PENDING' ? 'ring-2 ring-amber-500 border-amber-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Pending
                  </span>
                  {(stats?.pendingBusinesses ?? 0) > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold text-amber-600 tracking-tight mt-1">
                  {stats?.pendingBusinesses ?? 0}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('ACTIVE')}
                className={`card cursor-pointer transition-all hover:border-green-300 ${
                  statusFilter === 'ACTIVE' ? 'ring-2 ring-green-500 border-green-500' : ''
                }`}
              >
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  Active
                </span>
                <div className="text-3xl font-extrabold text-green-600 tracking-tight mt-1">
                  {stats?.activeBusinesses ?? 0}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('SUSPENDED')}
                className={`card cursor-pointer transition-all hover:border-red-300 ${
                  statusFilter === 'SUSPENDED' ? 'ring-2 ring-red-500 border-red-500' : ''
                }`}
              >
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  Suspended
                </span>
                <div className="text-3xl font-extrabold text-red-600 tracking-tight mt-1">
                  {stats?.suspendedBusinesses ?? 0}
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('REJECTED')}
                className={`card cursor-pointer transition-all hover:border-gray-400 ${
                  statusFilter === 'REJECTED' ? 'ring-2 ring-gray-600 border-gray-400' : ''
                }`}
              >
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rejected
                </span>
                <div className="text-3xl font-extrabold text-gray-700 tracking-tight mt-1">
                  {stats?.rejectedBusinesses ?? 0}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                {(['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      statusFilter === s
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search business or owner..."
                  className="input text-xs py-2 pl-9"
                />
                <svg
                  className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Businesses Table */}
            <div className="card overflow-hidden p-0 border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Business</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4">Manual Payments</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredBusinesses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                          No businesses found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredBusinesses.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{b.name}</div>
                            <div className="text-xs text-gray-400">/{b.slug}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-800 font-medium text-xs">{b.ownerName}</div>
                            <div className="text-xs text-gray-400">{b.ownerEmail}</div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <div className="font-semibold text-gray-900">
                              ₹{b.totalPaidAmount.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              Status: {b.latestPaymentStatus}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {b.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'ACTIVE')}
                                disabled={updatingId === b.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {b.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'SUSPENDED')}
                                disabled={updatingId === b.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                            {b.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'ACTIVE')}
                                disabled={updatingId === b.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Reactivate
                              </button>
                            )}
                            <Link
                              to={`/admin/businesses/${b.id}`}
                              className="btn-secondary text-xs py-1 px-2.5 inline-block"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
