import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function DashboardPage() {
  const { user, business, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Managing reputation for <span className="font-medium text-gray-800">{business?.name}</span> (slug: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{business?.slug}</code>)
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              Phase 2 Multi-Tenant Auth Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Scope</span>
              <p className="text-sm font-mono text-gray-800 mt-1 break-all">{business?.id}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Role</span>
              <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{role}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback URL</span>
              <p className="text-sm font-mono text-brand-600 mt-1">/r/{business?.slug}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
