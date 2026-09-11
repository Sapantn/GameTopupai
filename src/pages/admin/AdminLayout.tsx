import React from 'react';
import { useApp, AdminTab } from '../../context/AppContext';
import { canAccessTab } from '../../lib/authMiddleware';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Gamepad2,
  Package,
  QrCode,
  Tag,
  Gift,
  MessageSquare,
  ShieldCheck,
  Settings,
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  History,
  LogOut,
  Lock
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminTab, setAdminTab, user, setView, switchRole } = useApp();

  const navItems: { tab: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'dashboard', label: 'Dashboard & Stats', icon: LayoutDashboard },
    { tab: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
    { tab: 'catalogs', label: 'Catalogs & Categories', icon: Layers },
    { tab: 'games', label: 'Games & Products', icon: Gamepad2 },
    { tab: 'packages', label: 'Top-Up Packages', icon: Package },
    { tab: 'payment-methods', label: 'Nepal Payment QR', icon: QrCode },
    { tab: 'promo-codes', label: 'Promo Codes', icon: Tag },
    { tab: 'offers', label: 'Promotional Banners', icon: Gift },
    { tab: 'support', label: 'Support Tickets', icon: MessageSquare },
    { tab: 'audit-logs', label: 'Audit Trail Logs', icon: History },
    { tab: 'settings', label: 'Website Settings', icon: Settings },
    { tab: 'staff', label: 'Staff & Access Control', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-200 flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0f121e] border-b border-purple-500/25 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base text-white tracking-wider">
                GAMING<span className="text-purple-400">ZONE</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-widest">
                ADMIN DESK
              </span>
            </div>
          </div>

          {/* Current Admin User Info & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#141829] border border-slate-800 px-3 py-1 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-medium">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold">
                {user?.role || 'SUPER_ADMIN'}
              </span>
            </div>

            <button
              onClick={() => {
                switchRole('CUSTOMER');
                setView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5"
              title="Exit admin desk and return to customer storefront"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Exit Admin</span>
            </button>
          </div>
        </header>

        {/* Main Admin Body: Sidebar + View Content */}
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar Nav */}
          <aside className="w-full md:w-64 bg-[#0d101c] border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-1 shrink-0 overflow-x-auto md:overflow-y-auto">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3 py-2 hidden md:block">
              Management Modules
            </div>
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminTab === item.tab;
                const hasAccess = canAccessTab(user?.role, item.tab);
                return (
                  <button
                    key={item.tab}
                    onClick={() => setAdminTab(item.tab)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all text-left ${
                      isActive
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                        : hasAccess
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-850/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : hasAccess ? 'text-slate-500' : 'text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {!hasAccess && (
                      <Lock className="w-3 h-3 text-slate-500 shrink-0 ml-1.5" title="Requires elevated staff clearance" />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Dynamic Admin View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#090b14]">
            {children}
          </main>

        </div>
      </div>
  );
};
