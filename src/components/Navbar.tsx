import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeToggleDropdown, ThemeSegmentedControl } from './ThemeToggle';
import {
  Gamepad2,
  Search,
  Bell,
  ShieldAlert,
  UserCheck,
  Menu,
  X,
  FileSearch,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  UserPlus,
  LogIn,
  LogOut,
  User as UserIcon,
  Shield
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    logout,
    view,
    setView,
    setAdminTab,
    unreadNotifsCount,
    setNotificationsOpen,
    openAuthModal,
    setOrderLookupOpen,
    searchQuery,
    setSearchQuery,
    setCatalogTab,
    setSelectedCatalog
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user && user.role !== 'CUSTOMER';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'games', label: 'Games' },
    { id: 'cards', label: 'Cards & Vouchers' },
    { id: 'offers', label: 'Offers' },
    { id: 'orders', label: 'My Orders' },
    { id: 'support', label: 'Support & Help' }
  ];

  const handleNavClick = (viewId: any) => {
    if (viewId === 'cards') {
      setCatalogTab('card');
      setSelectedCatalog('all');
    } else if (viewId === 'games') {
      setCatalogTab('game');
      setSelectedCatalog('all');
    }
    setView(viewId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0f1a]/95 backdrop-blur-md border-b border-cyan-500/20 shadow-lg shadow-black/40">
      {/* Top Banner Notice for Nepal Manual Processing */}
      <div className="bg-gradient-to-r from-blue-950/80 via-purple-950/80 to-blue-950/80 border-b border-white/5 py-1 px-4 text-xs text-center text-slate-300 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          <strong className="text-cyan-400 font-semibold">Nepal’s Manual Top-Up Center:</strong> Average delivery time: <strong>5 – 15 mins</strong> via eSewa, Khalti, Fonepay & Bank Transfer
        </span>
        <button
          onClick={() => setOrderLookupOpen(true)}
          className="ml-2 underline text-cyan-300 hover:text-cyan-200 hidden sm:inline"
        >
          Check Order Status →
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo Branding */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-[#0a0c14] rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  GAMING<span className="text-cyan-400">ZONE</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                  NP
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 uppercase font-gaming">
                Top-Up Center • NPR
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search PUBG, Free Fire, MLBB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavClick('games');
              }}
              className="w-full bg-[#131726] border border-slate-800 focus:border-cyan-500/50 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === link.id
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Order Lookup Button */}
            <button
              onClick={() => setOrderLookupOpen(true)}
              title="Track Order Status"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 hover:text-white transition-colors"
            >
              <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track Order</span>
            </button>

            {/* Theme Toggle Switcher (Dark / Light / System) */}
            <ThemeToggleDropdown />

            {/* Notifications Bell */}
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-black flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Admin Desk Button - ONLY visible to verified administrative staff */}
            {isAdmin && (
              <button
                onClick={() => {
                  setView('admin');
                  setAdminTab('dashboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-sm shadow-purple-500/20 hover:bg-purple-900 transition-all"
                title="Enter Operations Admin Desk"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Admin Desk</span>
              </button>
            )}

            {/* Profile Avatar & Dropdown / Login & Register buttons */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 transition-all text-left"
                  title="Account Menu"
                >
                  <img
                    src={user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-cyan-500/40 shrink-0"
                  />
                  <div className="hidden xl:block pr-1">
                    <span className="text-xs font-semibold text-white block leading-tight max-w-[100px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-cyan-400 font-bold block uppercase tracking-wider">
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'CUSTOMER' ? 'Gamer' : user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
                </button>

                {/* Profile dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f1222] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold uppercase">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        handleNavClick('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                      <span>My Profile &amp; Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        handleNavClick('orders');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <FileSearch className="w-4 h-4 text-blue-400" />
                      <span>My Orders &amp; Top-Ups</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setView('admin');
                          setAdminTab('dashboard');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-300 hover:text-white hover:bg-purple-950/60 transition-colors text-left font-semibold"
                      >
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Operations Admin Desk</span>
                      </button>
                    )}

                    {user.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => {
                          setView('admin');
                          setAdminTab('staff');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-300 hover:text-white hover:bg-purple-950/60 transition-colors text-left"
                      >
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        <span>Staff &amp; Access Control</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-black" />
                  <span className="hidden sm:inline">Sign Up Free</span>
                  <span className="sm:hidden">Sign Up</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a0c14] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search PUBG, Free Fire, MLBB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavClick('games');
              }}
              className="w-full bg-[#131726] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium ${
                  view === link.id
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Theme Selector */}
          <div className="pt-3 pb-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Theme Mode</span>
            <ThemeSegmentedControl />
          </div>

          {/* Mobile Auth and Track Section */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
                  />
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                    <span className="text-[10px] text-cyan-400 font-semibold">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => { setOrderLookupOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium"
              >
                <FileSearch className="w-4 h-4" />
                <span>Track Order By ID</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setView('admin'); setAdminTab('dashboard'); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-semibold"
                >
                  Admin Panel →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
