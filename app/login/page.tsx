/**
 * Login Page
 *
 * Authentication page for BevGenie users
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/auth/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
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
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-white/60">Sign in to your BevGenie account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-white/80">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#06B6D4] hover:text-[#0891B2]"
              >
                Forgot password?
              </Link>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-sm text-white/60">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-[#06B6D4] hover:text-[#0891B2]">
            Sign up
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
