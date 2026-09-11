import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { isStaffUser, isStaffRole, STAFF_ROLES } from '../../lib/authMiddleware';
import { AdminTab } from '../../context/AppContext';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  UserX,
  LogIn,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface AdminAccessGateProps {
  children?: React.ReactNode;
  attemptedTab?: AdminTab;
  serverMessage?: string;
  onRetry?: () => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  children,
  attemptedTab,
  serverMessage,
  onRetry
}) => {
  const { user, setUser, setView, switchRole, addToast } = useApp();

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle staff manual login credentials
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail) {
      setAuthError('Please enter your staff email.');
      return;
    }
    setLoading(true);
    setAuthError(null);

    try {
      const res = await api.login(staffEmail.trim(), staffPassword);
      if (!isStaffUser(res.user)) {
        setAuthError('Access denied. This account does not possess staff privileges.');
        setLoading(false);
        return;
      }
      setUser(res.user);
      addToast(`Staff credentials verified. Welcome, ${res.user.name}.`, 'success');
      if (onRetry) onRetry();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid staff credentials. Contact GamingZone Security Operations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeDemoStaff = (role: 'SUPER_ADMIN' | 'ORDER_MANAGER' | 'CONTENT_MANAGER' | 'SUPPORT_AGENT') => {
    switchRole(role);
    addToast(`Authenticated as ${role.replace('_', ' ')}. Re-verifying server credentials...`, 'success');
    if (onRetry) onRetry();
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle security background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-rose-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        
        {/* Top return link */}
        <button
          onClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Customer Storefront</span>
        </button>

        {/* Security Card */}
        <div className="bg-[#0e1222] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <ShieldAlert className="w-7 h-7 text-rose-400 animate-pulse" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2.5 py-0.5 rounded-full inline-block">
              Restricted Portal • Staff Only
            </span>

            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
              Administrator Access Gate
            </h1>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              This area is restricted to authorized GamingZone operations staff. Customer accounts are not permitted to view financial data, customer slips, or management tools.
            </p>
          </div>

          {/* Current status block */}
          <div className="p-3.5 rounded-2xl bg-[#14182a] border border-slate-800 flex items-start gap-3">
            <UserX className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-white block">
                Current Session: {user ? user.name : 'Unauthenticated Visitor'}
              </span>
              <p className="text-slate-400">
                {user
                  ? `Signed in as customer (${user.email || 'Phone user'}). Role: ${user.role} (No Staff Clearance)`
                  : 'No active staff session detected.'}
              </p>
              {attemptedTab && (
                <span className="text-[11px] text-amber-400 font-mono block mt-1">
                  Attempted Module: {attemptedTab}
                </span>
              )}
            </div>
          </div>

          {/* Server-Side Enforced Notice */}
          {serverMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <span className="font-bold text-rose-300 block">Server Authorization Response</span>
                <p className="text-rose-200/90 leading-relaxed">{serverMessage}</p>
              </div>
            </div>
          )}

          {/* Error notice */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Staff Login Form */}
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Staff Official Email / ID
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="admin@gamingzone.com.np"
                  className="w-full bg-[#161a2e] border border-slate-700 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Security Password / Operational PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161a2e] border border-slate-700 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Operations Desk'}</span>
            </button>
          </form>

          {/* Authorized Quick Verification for Development/Testing */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Authorized Staff Authentication
              </span>
              <span className="text-[10px] text-purple-400 font-semibold">
                Staff Testing Gate
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleAuthorizeDemoStaff('SUPER_ADMIN')}
                className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-purple-200 block">Super Admin</span>
                <span className="text-[9px] text-purple-400 block">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleAuthorizeDemoStaff('ORDER_MANAGER')}
                className="p-2 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-blue-500/30 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-blue-200 block">Order Mgr</span>
                <span className="text-[9px] text-blue-400 block">Slips & Orders</span>
              </button>

              <button
                type="button"
                onClick={() => handleAuthorizeDemoStaff('CONTENT_MANAGER')}
                className="p-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-cyan-200 block">Content Mgr</span>
                <span className="text-[9px] text-cyan-400 block">Games & Catalogs</span>
              </button>

              <button
                type="button"
                onClick={() => handleAuthorizeDemoStaff('SUPPORT_AGENT')}
                className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-emerald-200 block">Support</span>
                <span className="text-[9px] text-emerald-400 block">Tickets Desk</span>
              </button>
            </div>
          </div>

          {/* Direct Back Link */}
          <div className="pt-2 text-center">
            <button
              onClick={() => {
                setView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
            >
              &larr; Return to GamingZone Storefront
            </button>
          </div>

        </div>

        {/* Security disclaimer note */}
        <p className="text-center text-[11px] text-slate-500">
          All administrative access attempts and operations are recorded in the security audit trail.
        </p>

      </div>
    </div>
  );
};
