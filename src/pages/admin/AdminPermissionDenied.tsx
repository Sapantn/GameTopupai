import React from 'react';
import { useApp, AdminTab } from '../../context/AppContext';
import { ServerAdminVerificationResult, UserRole } from '../../types';
import {
  ROLE_METADATA,
  TAB_ROLE_PERMISSIONS,
  getAllowedTabsForRole,
} from '../../lib/authMiddleware';
import { ShieldAlert, Lock, ArrowRight, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

interface AdminPermissionDeniedProps {
  attemptedTab: AdminTab;
  serverResult?: ServerAdminVerificationResult | null;
  onRetry?: () => void;
}

export const AdminPermissionDenied: React.FC<AdminPermissionDeniedProps> = ({
  attemptedTab,
  serverResult,
  onRetry
}) => {
  const { user, setAdminTab, setView } = useApp();

  const userRole = (serverResult?.userRole || user?.role) as UserRole | undefined;
  const roleInfo = userRole ? ROLE_METADATA[userRole] : null;
  const allowedRoles = serverResult?.requiredRoles || TAB_ROLE_PERMISSIONS[attemptedTab] || [];
  const permittedTabs = (serverResult?.allowedTabs as AdminTab[]) || getAllowedTabsForRole(userRole);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/40">
        <ShieldAlert className="w-8 h-8 animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-rose-400" />
            403 Forbidden • Server Enforced RBAC
          </span>
        </div>
        <h2 className="text-2xl font-heading font-extrabold text-white">
          Insufficient Role Clearance
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          {serverResult?.message || (
            <>
              Your staff account does not possess the clearance required to access the{' '}
              <span className="text-white font-semibold capitalize">{attemptedTab.replace('-', ' ')}</span>{' '}
              management module.
            </>
          )}
        </p>
      </div>

      {/* Role Comparison Card */}
      <div className="bg-[#101426] border border-slate-800 rounded-2xl p-5 text-left space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Server Verified Role</span>
            <span className="font-bold text-white text-sm">
              {roleInfo?.label || userRole || 'Unknown Role'}
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto border ${roleInfo?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
            {serverResult?.user?.email || user?.email || user?.name || 'Staff User'}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Roles Permitted for this Module:
          </span>
          <div className="flex flex-wrap gap-2">
            {allowedRoles.map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 rounded-lg bg-[#181d33] border border-slate-700 text-slate-300 text-xs font-mono"
              >
                {ROLE_METADATA[role]?.label || role}
              </span>
            ))}
          </div>
        </div>

        {serverResult?.verifiedAt && (
          <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/80">
            <span>Server Timestamp: {new Date(serverResult.verifiedAt).toLocaleTimeString()}</span>
            <span className="text-emerald-400 font-mono">Backend RBAC: Active</span>
          </div>
        )}
      </div>

      {/* Permitted Tabs Navigation */}
      {permittedTabs.length > 0 && (
        <div className="bg-[#0f1220] border border-purple-500/20 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-200">
              Modules accessible with your credentials:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {permittedTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setAdminTab(tab)}
                className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition-colors"
              >
                <span className="capitalize">{tab.replace('-', ' ')}</span>
                <ArrowRight className="w-3 h-3 text-purple-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Retry and Storefront return buttons */}
      <div className="pt-2 flex items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-verify Clearance</span>
          </button>
        )}
        <button
          onClick={() => {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Customer Storefront</span>
        </button>
      </div>
    </div>
  );
};
