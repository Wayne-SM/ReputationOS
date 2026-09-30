import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';

function HomePage() {
  const { isAuthenticated, business } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-xl">
        <div className="h-12 w-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-sm">
          R
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Reputation OS
        </h1>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
          Turn more customer interactions into genuine feedback, Google review opportunities, and actionable reputation insights.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              Go to Dashboard ({business?.name})
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found</p>
      <Link to="/" className="mt-4 text-sm text-brand-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
