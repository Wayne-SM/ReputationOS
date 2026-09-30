import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface SourceDetails {
  sourceType: string;
  label: string;
  url: string;
  qrPreviewDataUrl?: string;
  downloadPngUrl?: string;
  downloadSvgUrl?: string;
}

interface SourcesApiResponse {
  reception: SourceDetails;
  instagram: SourceDetails;
  business: {
    name: string;
    slug: string;
  };
}

export function SourcesPage() {
  const { business, logout } = useAuth();
  const [data, setData] = useState<SourcesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function loadSources() {
      try {
        const res = await fetch('/api/v1/sources', {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load sources:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSources();
  }, []);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldId ? null : curr));
    }, 2000);
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
            <span className="text-sm font-medium text-gray-600">
              {business?.name || 'My Business'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Overview
            </Link>
            <Link
              to="/sources"
              className="text-sm font-semibold text-brand-600 border-b-2 border-brand-600 py-5 transition-colors"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Review Acquisition Channels
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              2 Active Channels
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Each business receives two dedicated acquisition channels for clean attribution without complexity: One physical Reception QR code and one Instagram link.
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Generating channels...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── CARD 1: RECEPTION QR ────────────────────────── */}
            <div className="card space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                      Physical Channel
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                      Reception Counter QR
                    </h2>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                    source=reception
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Place this QR code at your reception counter, billing desk, or exit point where in-person customers interact with staff.
                </p>

                {/* QR Preview Box */}
                <div className="flex justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  {data?.reception?.qrPreviewDataUrl ? (
                    <img
                      src={data.reception.qrPreviewDataUrl}
                      alt="Reception QR Code"
                      className="w-48 h-48 rounded-xl shadow-sm bg-white p-2 border border-gray-200"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                </div>

                {/* Direct Feedback URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Encoded Reception URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={data?.reception?.url || ''}
                      className="input text-xs font-mono bg-gray-50 text-gray-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        data?.reception?.url &&
                        copyToClipboard(data.reception.url, 'reception_url')
                      }
                      className="btn-secondary text-xs px-3 whitespace-nowrap"
                    >
                      {copiedField === 'reception_url' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Actions */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <a
                  href="/api/v1/sources/reception/qr.png"
                  download={`${business?.slug}-reception-qr.png`}
                  className="btn-primary text-xs flex-1 text-center py-2.5 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PNG (High-Res)
                </a>
                <a
                  href="/api/v1/sources/reception/qr.svg"
                  download={`${business?.slug}-reception-qr.svg`}
                  className="btn-secondary text-xs flex-1 text-center py-2.5 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Download SVG (Vector)
                </a>
              </div>
            </div>

            {/* ── CARD 2: INSTAGRAM LINK ─────────────────────── */}
            <div className="card space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider">
                      Digital Channel
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                      Instagram Bio Link
                    </h2>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                    source=instagram
                  </span>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Use this link in your Instagram bio, Linktree, or story stickers to turn your social media followers and story viewers into customer reviews.
                </p>

                {/* Instagram Visual Mock */}
                <div className="p-6 bg-gradient-to-tr from-pink-50 via-purple-50 to-amber-50 rounded-2xl border border-pink-100/50 flex flex-col items-center justify-center gap-3 py-10">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">
                    Instagram Ready Link
                  </span>
                </div>

                {/* Direct Instagram Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Attributed Instagram URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={data?.instagram?.url || ''}
                      className="input text-xs font-mono bg-gray-50 text-gray-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        data?.instagram?.url &&
                        copyToClipboard(data.instagram.url, 'instagram_url')
                      }
                      className="btn-secondary text-xs px-3 whitespace-nowrap"
                    >
                      {copiedField === 'instagram_url' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    data?.instagram?.url &&
                    copyToClipboard(data.instagram.url, 'instagram_main_btn')
                  }
                  className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copiedField === 'instagram_main_btn'
                    ? 'Copied to Clipboard!'
                    : 'Copy Link for Instagram Bio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
