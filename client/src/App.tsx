import { Routes, Route } from 'react-router-dom';

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Reputation OS
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Customer feedback and review growth platform
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a href="/login" className="btn-primary">
            Sign In
          </a>
          <a href="/signup" className="btn-secondary">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
