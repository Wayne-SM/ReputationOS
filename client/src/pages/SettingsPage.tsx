import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { BusinessSettingsData, UpdateBusinessSettingsPayload } from '../../../shared/types/index.js';

export function SettingsPage() {
  const { business, logout } = useAuth();
  const [data, setData] = useState<BusinessSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [feedbackWelcomeText, setFeedbackWelcomeText] = useState('');
  const [feedbackThankYouText, setFeedbackThankYouText] = useState('');
  const [googleReviewCtaText, setGoogleReviewCtaText] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const json = await api.get<BusinessSettingsData>('/business/settings');
        setData(json);
        setName(json.business.name || '');
        setAccentColor(json.business.accentColor || '#2563eb');
        setDescription(json.business.description || '');
        setPhone(json.business.phone || '');
        setWebsite(json.business.website || '');
        setGoogleReviewUrl(json.googleReview.googleReviewUrl || '');
        setGooglePlaceId(json.googleReview.googlePlaceId || '');
        setFeedbackWelcomeText(json.settings.feedbackWelcomeText || '');
        setFeedbackThankYouText(json.settings.feedbackThankYouText || '');
        setGoogleReviewCtaText(json.settings.googleReviewCtaText || '');
      } catch (err) {
        console.error('Failed to load settings:', err);
        setErrorMessage('Network error while loading settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    const payload: UpdateBusinessSettingsPayload = {
      name: name.trim(),
      accentColor: accentColor.trim(),
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      googleReviewUrl: googleReviewUrl.trim() || undefined,
      googlePlaceId: googlePlaceId.trim() || undefined,
      feedbackWelcomeText: feedbackWelcomeText.trim() || undefined,
      feedbackThankYouText: feedbackThankYouText.trim() || undefined,
      googleReviewCtaText: googleReviewCtaText.trim() || undefined,
    };

    try {
      await api.patch('/business/settings', payload);
      setSaveSuccess('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setErrorMessage(err.message || 'Network error while saving settings');
    } finally {
      setIsSaving(false);
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
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              QR & Links
            </Link>
            <Link
              to="/settings"
              className="text-sm font-semibold text-brand-600 border-b-2 border-brand-600 py-5 transition-colors"
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Business Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your Google Review link destination, brand appearance, and customer feedback experience.
          </p>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* ── CARD 1: GOOGLE REVIEW SETTINGS ──────────────── */}
            <div className="card space-y-5 border-l-4 border-l-brand-600">
              <div>
                <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                  Review Growth Engine
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                  Google Review Destination
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Every customer who leaves feedback is offered this link to post their review directly on your Google Business Profile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Google Review URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    placeholder="https://g.page/r/your-business/review"
                    className="input text-sm flex-1 font-mono"
                  />
                  {googleReviewUrl && (
                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-2 whitespace-nowrap flex items-center gap-1"
                    >
                      <span>Test Link</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Tip: Get this link from your Google Business Profile dashboard under "Ask for reviews".
                </p>
              </div>
            </div>

            {/* ── CARD 2: BUSINESS IDENTITY & BRANDING ────────── */}
            <div className="card space-y-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Profile & Appearance
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                  Business Branding
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Customizes how your business appears to customers on the feedback page.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tenant Slug (Permanent)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={data?.business.slug || ''}
                    className="input text-sm bg-gray-100 text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Brand Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-12 rounded-lg cursor-pointer border border-gray-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    placeholder="#2563eb"
                    className="input text-sm font-mono max-w-[140px]"
                  />
                  <span
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Color Preview
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Short Business Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Specialty coffee roasters & artisanal bakery"
                  className="input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* ── CARD 3: FEEDBACK PROMPT CUSTOMIZATION ───────── */}
            <div className="card space-y-5">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer Experience
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                  Feedback Prompts
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Welcome Header Prompt
                  </label>
                  <input
                    type="text"
                    value={feedbackWelcomeText}
                    onChange={(e) => setFeedbackWelcomeText(e.target.value)}
                    placeholder="How was your experience?"
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Thank You Message
                  </label>
                  <input
                    type="text"
                    value={feedbackThankYouText}
                    onChange={(e) => setFeedbackThankYouText(e.target.value)}
                    placeholder="Thank you for your feedback!"
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Google Review CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={googleReviewCtaText}
                    onChange={(e) => setGoogleReviewCtaText(e.target.value)}
                    placeholder="Share your experience on Google"
                    className="input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
