import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import {
  X,
  Smartphone,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, setUser, addToast, switchRole } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email);
      setUser(res.user);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please enter your full name and email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(name, email, phone);
      setUser(res.user);
      addToast(`Account created! Welcome to GamingZone, ${res.user.name}`, 'success');
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit Nepal mobile number (e.g. 98XXXXXXXX).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.sendOtp(phone);
      setOtpSent(true);
      setOtp('123456'); // Pre-fill sample demo code for seamless tester experience
      addToast(res.message, 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyOtp(phone, otp, name);
      setUser(res.user);
      addToast(`Phone verified! Welcome ${res.user.name}`, 'success');
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nepalgamer.google@gmail.com',
          name: 'Nepal Pro Gamer',
          photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        })
      });
      const data = await res.json();
      setUser(data.user);
      addToast('Signed in with Google account', 'success');
      setAuthModalOpen(false);
    } catch (err) {
      setError('Google sign in simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md bg-[#0f121e] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-purple-950/40">
          <div>
            <h3 className="font-heading font-bold text-white text-lg">
              {mode === 'login' ? 'Gamer Sign In' : mode === 'register' ? 'Create Free Account' : 'Phone OTP Login'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              GamingZone Nepal Top-Up Marketplace
            </p>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-[#131726]/50">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'login'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => { setMode('otp'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'otp'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Nepal Phone OTP
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              mode === 'register'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Email Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@gamingzone.com.np"
                    className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-cyan-500/20"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Nepal Phone OTP Form */}
          {mode === 'otp' && (
            <div className="space-y-3.5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Nepal Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center">
                        +977
                      </span>
                      <div className="relative flex-1">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98XXXXXXXX"
                          className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports NTC, Ncell, and Smart Cell numbers.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs hover:brightness-110 transition-all"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code (OTP)'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Enter 6-Digit OTP sent to +977 {phone}
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full text-center tracking-widest text-lg font-mono bg-[#131726] border border-cyan-500 rounded-xl py-2 text-cyan-300 focus:outline-none"
                    />
                    <p className="text-[11px] text-cyan-400 mt-1 text-center">
                      Demo auto-filled code: <strong>123456</strong>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs hover:brightness-110 transition-all"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-xs text-slate-400 hover:text-white"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Thapa"
                    className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Nepal Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                    className="w-full bg-[#131726] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-black font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-purple-500/20"
              >
                {loading ? 'Creating...' : 'Create Gamer Account'}
              </button>
            </form>
          )}

          {/* Social login divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0f121e] px-2 text-[10px] uppercase tracking-wider text-slate-500 absolute">
              Or Connect With
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-[#141828] hover:bg-[#1a1f33] border border-slate-700 text-xs text-slate-200 flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Trust note */}
          <div className="pt-2 text-center text-[11px] text-slate-500">
            <span>By continuing, you agree to GamingZone's Terms of Service &amp; Privacy Policy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
