import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormData } from './schema';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const inputClass =
  'w-full rounded border border-kw-border px-3 py-2.5 text-sm text-kw-text placeholder:text-kw-muted focus:outline-none focus:ring-2 focus:ring-kw-navy/30 focus:border-kw-navy';

export function RegisterForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.fullName } },
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
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
            Create Account
          </h1>
          <p className="mt-1 text-sm text-kw-body">Set up your team access</p>
        </div>

        <div className="bg-white border border-kw-border rounded shadow-card p-8">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-700">
                <p className="font-semibold">Registration successful!</p>
                <p className="mt-1">Check your email to verify your account. Redirecting to login…</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                {...register('fullName')}
                className={cn(inputClass, errors.fullName && 'border-red-400 focus:border-red-500')}
                placeholder="Greg Kornesczuk"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className={cn(inputClass, errors.email && 'border-red-400 focus:border-red-500')}
                placeholder="you@kwindows.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className={cn(inputClass, errors.password && 'border-red-400 focus:border-red-500')}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-kw-text mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={cn(inputClass, errors.confirmPassword && 'border-red-400 focus:border-red-500')}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full px-6 py-3 rounded text-sm font-semibold text-white bg-kw-navy',
                'hover:bg-kw-navy-deep focus:outline-none focus:ring-2 focus:ring-kw-navy focus:ring-offset-2',
                'transition-colors flex items-center justify-center mt-2',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>

            <p className="text-center text-sm text-kw-body">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-kw-navy hover:text-kw-navy-deep font-semibold"
              >
                Sign in
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
