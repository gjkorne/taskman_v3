import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(formData.email, formData.password);
      navigate('/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kw-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div
              className="font-sans font-extrabold text-kw-navy"
              style={{ fontSize: '18px', letterSpacing: '0.13em' }}
            >
              K WINDOWS &amp; DOORS
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-px w-5 bg-kw-rule" />
              <span
                className="font-sans font-semibold text-kw-muted"
                style={{ fontSize: '9px', letterSpacing: '0.28em' }}
              >
                EST. 1957
              </span>
              <span className="h-px w-5 bg-kw-rule" />
            </div>
          </div>
          <h1 className="font-serif font-semibold text-2xl text-kw-ink mt-2">
            Task Manager
          </h1>
          <p className="mt-1 text-sm text-kw-body">Sign in to your account</p>
        </div>

        <div className="bg-white border border-kw-border rounded shadow-card p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, email: e.target.value }))
                }
                className="w-full rounded border border-kw-border px-3 py-2.5 text-sm text-kw-text placeholder:text-kw-muted focus:outline-none focus:ring-2 focus:ring-kw-navy/30 focus:border-kw-navy"
                placeholder="you@kwindows.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, password: e.target.value }))
                }
                className="w-full rounded border border-kw-border px-3 py-2.5 text-sm text-kw-text placeholder:text-kw-muted focus:outline-none focus:ring-2 focus:ring-kw-navy/30 focus:border-kw-navy"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full px-6 py-3 rounded text-sm font-semibold text-white bg-kw-navy',
                'hover:bg-kw-navy-deep focus:outline-none focus:ring-2 focus:ring-kw-navy focus:ring-offset-2',
                'transition-colors flex items-center justify-center',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>

            <p className="text-center text-sm text-kw-body">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-kw-navy hover:text-kw-navy-deep font-semibold"
              >
                Sign up
              </button>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-kw-label mt-6">
          © 2026 K Windows &amp; Doors, LLC · Licensed &amp; Insured
        </p>
      </div>
    </div>
  );
}
