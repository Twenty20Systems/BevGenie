/**
 * Reset Password Page
 *
 * Allows users to set a new password after clicking the reset link
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/auth/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is authenticated from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
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
          <h1 className="text-3xl font-bold text-white">Set New Password</h1>
          <p className="mt-2 text-sm text-white/60">
            Choose a strong password for your account
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-white/50">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#06B6D4] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                placeholder="••••••••"
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
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
            <p className="text-green-400 text-sm">
              ✓ Password updated successfully! Redirecting to login...
            </p>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className="text-sm text-white/60 hover:text-white/80">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
