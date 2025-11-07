/**
 * Forgot Password Page
 *
 * Allows users to request a password reset email
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A1628]">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-white/10 bg-[#0A1628]/90 p-8 shadow-2xl backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-white/60">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                placeholder="you@company.com"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#06B6D4] px-4 py-3 font-semibold text-[#0A1628] transition-all hover:bg-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
            <p className="text-green-400 text-sm">
              ✓ Check your email! We've sent you a password reset link.
            </p>
          </div>
        )}

        <div className="text-center text-sm text-white/60">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-[#06B6D4] hover:text-[#0891B2]">
            Sign in
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-white/60 hover:text-white/80">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
