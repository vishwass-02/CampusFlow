'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Mail, Lock, LogIn, UserPlus, Key, CheckCircle } from 'lucide-react';

const LineWaves = dynamic(() => import('@/components/LineWaves'), { ssr: false });

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { data } = await api.post('/auth/signup', { email, password });
        setUserId(data.id);
        setIsVerifying(true);
        setMessage('Registration successful! Please check your email inbox for a verification code.');
      } else {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        router.push('/');
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).response?.data?.error || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/verify', { id: userId, code });
      localStorage.setItem('token', data.token);
      router.push('/');
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).response?.data?.error || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050816] flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Animated WebGL background */}
      <div className="line-waves-bg">
        <LineWaves
          speed={0.2}
          innerLineCount={28}
          outerLineCount={32}
          warpIntensity={0.8}
          rotation={-45}
          edgeFadeWidth={0.0}
          colorCycleSpeed={0.6}
          brightness={0.12}
          color1="#3b82f6"
          color2="#6366f1"
          color3="#8b5cf6"
          enableMouseInteraction={true}
          mouseInfluence={1.5}
        />
      </div>

      <div className="relative w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-8 md:p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-2xl mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Key className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            {isVerifying ? 'Verify Email' : isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isVerifying ? 'Enter the verification code sent to your email.' : isSignUp ? 'Join CampusFlow to automate your student life.' : 'Log in to access your dashboard and schedule.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-bold">⚠️</span> {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-bold">✓</span> {message}
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Verification Code</label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  required
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-lg transition-all duration-300 transform active:scale-[0.98] disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : 'Verify & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  required
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <input
                  type="password"
                  required
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all duration-300 transform active:scale-[0.98] disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </>
              )}
            </button>
          </form>
        )}

        {!isVerifying && (
          <div className="mt-6 text-center border-t border-gray-800/80 pt-6">
            <p className="text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setMessage('');
                }}
                className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none"
              >
                {isSignUp ? 'Sign In' : 'Create one'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
