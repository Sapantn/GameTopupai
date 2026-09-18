import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Game, Order, WebsiteSettings, NotificationItem, UserRole, ThemeMode, ResolvedTheme } from '../types';
import { api } from '../lib/api';

export type AppView =
  | 'home'
  | 'games'
  | 'cards'
  | 'game-detail'
  | 'orders'
  | 'order-detail'
  | 'offers'
  | 'support'
  | 'profile'
  | 'legal'
  | 'admin';

export type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'catalogs'
  | 'games'
  | 'packages'
  | 'payment-methods'
  | 'promo-codes'
  | 'offers'
  | 'support'
  | 'chatbot'
  | 'audit-logs'
  | 'settings'
  | 'staff';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const defaultSiteSettings: WebsiteSettings = {
  websiteName: 'GamingZone Top-up Center',
  siteName: 'GamingZone Top-up Center',
  siteSubtitle: 'Nepal’s #1 Trusted Game Top-Up Marketplace',
  contactEmail: 'support@gamingzone.com.np',
  supportEmail: 'support@gamingzone.com.np',
  supportPhone: '+977 9801234567',
  whatsappNumber: '+9779801234567',
  supportWhatsApp: '+977 9801234567',
  whatsappLink: 'https://wa.me/9779801234567?text=Hi%20GamingZone%20Team%2C%20I%20need%20assistance%20with%20my%20order',
  telegramLink: 'https://t.me/GamingZoneNepal',
  facebookLink: 'https://facebook.com/GamingZoneNepalOfficial',
  currency: 'NPR',
  currencySymbol: 'NPR ',
  orderProcessingNotice: 'All top-ups are manually processed by our operations team in Kathmandu within 5 to 20 minutes of payment verification.',
  announcementBanner: '⚡ Festival Bonanza: Get Up to 20% Extra UC & Diamonds with eSewa/Khalti!',
  maintenanceMode: false,
  minOrderAmount: 50,
  supportHours: '8:00 AM – 11:30 PM NST (7 Days a Week)',
  operatingHours: '8:00 AM – 11:30 PM NST (Kathmandu)'
};

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  view: AppView;
  setView: (view: AppView) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  selectedGame: Game | null;
  setSelectedGame: (game: Game | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  legalTab: 'terms' | 'privacy' | 'refund' | 'manual-payment' | 'about';
  setLegalTab: (tab: 'terms' | 'privacy' | 'refund' | 'manual-payment' | 'about') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  catalogTab: 'game' | 'card';
  setCatalogTab: (tab: 'game' | 'card') => void;
  selectedCatalog: string;
  setSelectedCatalog: (slug: string) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'google' | 'otp' | 'login' | 'register';
  setAuthModalMode: (mode: 'google' | 'otp' | 'login' | 'register') => void;
  openAuthModal: (initialMode?: 'google' | 'otp' | 'login' | 'register') => void;
  logout: () => void;
  orderLookupOpen: boolean;
  setOrderLookupOpen: (open: boolean) => void;
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  refreshNotifications: () => void;
  settings: WebsiteSettings;
  siteSettings: WebsiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<WebsiteSettings>>;
  refreshSettings: () => void;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  navigateToGame: (game: Game) => void;
  navigateToOrder: (orderId: string) => void;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: dark, light, or system default
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('gz_theme') as ThemeMode;
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch (e) {}
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme = themeMode === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themeMode;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.remove('dark', 'light');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('gz_theme', mode);
    } catch (e) {}
  };

  // Load saved session or start as guest so visitors can cleanly sign up or sign in
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('gz_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem('gz_auth_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('gz_auth_user');
      }
    } catch (e) {}
  };

  const [authModalMode, setAuthModalMode] = useState<'google' | 'otp' | 'login' | 'register'>('register');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const openAuthModal = (initialMode?: 'google' | 'otp' | 'login' | 'register') => {
    if (initialMode) setAuthModalMode(initialMode);
    setAuthModalOpen(true);
  };

  const logout = () => {
    setUser(null);
    setToasts(prev => [...prev, { id: `toast-${Date.now()}`, type: 'info', message: 'You have been logged out.' }]);
    if (view === 'admin' || view === 'profile') {
      setView('home');
    }
  };

  const [view, setView] = useState<AppView>('home');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'refund' | 'manual-payment' | 'about'>('manual-payment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catalogTab, setCatalogTab] = useState<'game' | 'card'>('game');
  const [selectedCatalog, setSelectedCatalog] = useState<string>('all');

  const [orderLookupOpen, setOrderLookupOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSiteSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshNotifications = async () => {
    try {
      if (user) {
        const notifs = await api.getNotifications(user.id);
        setNotifications(notifs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSettings = async () => {
    try {
      const s = await api.getSettings();
      if (s) {
        setSettings(prev => ({ ...prev, ...s }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user]);

  // --- URL Routing and History Synchronization ---
  const parsePath = (pathname: string) => {
    const clean = pathname.replace(/^\/+|\/+$/g, '');
    if (!clean || clean === 'home') return { view: 'home' as AppView };
    if (clean === 'games') return { view: 'games' as AppView };
    if (clean === 'cards') return { view: 'cards' as AppView };
    if (clean.startsWith('games/')) {
      const slug = clean.replace('games/', '');
      return { view: 'game-detail' as AppView, gameSlug: slug };
    }
    if (clean === 'orders') return { view: 'orders' as AppView };
    if (clean.startsWith('orders/')) {
      const orderId = clean.replace('orders/', '');
      return { view: 'order-detail' as AppView, orderId };
    }
    if (clean === 'offers') return { view: 'offers' as AppView };
    if (clean === 'support') return { view: 'support' as AppView };
    if (clean === 'profile') return { view: 'profile' as AppView };
    if (clean.startsWith('legal')) {
      const parts = clean.split('/');
      return { view: 'legal' as AppView, legalTab: (parts[1] || 'manual-payment') as any };
    }
    if (clean.startsWith('admin')) {
      const parts = clean.split('/');
      return { view: 'admin' as AppView, adminTab: (parts[1] || 'dashboard') as AdminTab };
    }
    return { view: 'home' as AppView };
  };

  const getPathForView = (
    v: AppView,
    aTab: AdminTab,
    gameSlug?: string,
    ordId?: string | null,
    legTab?: string
  ) => {
    if (v === 'home') return '/';
    if (v === 'games') return '/games';
    if (v === 'cards') return '/cards';
    if (v === 'game-detail' && gameSlug) return `/games/${gameSlug}`;
    if (v === 'orders') return '/orders';
    if (v === 'order-detail' && ordId) return `/orders/${ordId}`;
    if (v === 'offers') return '/offers';
    if (v === 'support') return '/support';
    if (v === 'profile') return '/profile';
    if (v === 'legal') return `/legal/${legTab || 'manual-payment'}`;
    if (v === 'admin') return `/admin/${aTab || 'dashboard'}`;
    return '/';
  };

  // Sync initial URL on mount and handle back/forward browser popstate
  useEffect(() => {
    const syncFromUrl = () => {
      const parsed = parsePath(window.location.pathname);
      setView(parsed.view);
      if (parsed.adminTab) setAdminTab(parsed.adminTab);
      if (parsed.orderId) setSelectedOrderId(parsed.orderId);
      if (parsed.legalTab) setLegalTab(parsed.legalTab);
      if (parsed.gameSlug) {
        api.getGames().then(games => {
          const found = games.find(g => g.slug === parsed.gameSlug || g.id === parsed.gameSlug);
          if (found) setSelectedGame(found);
        }).catch(console.error);
      }
    };

    syncFromUrl();

    const handlePopState = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetView = (newView: AppView) => {
    setView(newView);
    const path = getPathForView(newView, adminTab, selectedGame?.slug || selectedGame?.id, selectedOrderId, legalTab);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const handleSetAdminTab = (newTab: AdminTab) => {
    setAdminTab(newTab);
    if (view === 'admin') {
      const path = `/admin/${newTab}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  };

  const handleSetLegalTab = (tab: any) => {
    setLegalTab(tab);
    if (view === 'legal') {
      const path = `/legal/${tab}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const navigateToGame = (game: Game) => {
    setSelectedGame(game);
    setView('game-detail');
    const path = `/games/${game.slug || game.id}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setView('order-detail');
    const path = `/orders/${orderId}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchRole = (role: UserRole) => {
    if (role === 'CUSTOMER') {
      setUser({
        id: 'usr-demo-customer',
        name: 'Aayush Maharjan (Customer)',
        email: 'demo@gamingzone.com.np',
        phone: '+977 9841234567',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        authProvider: 'email',
        role: 'CUSTOMER',
        status: 'active',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z'
      });
      addToast('Switched to Customer mode', 'info');
      // If currently on admin page, immediately redirect away to customer storefront
      if (view === 'admin') {
        handleSetView('home');
      }
    } else if (role === 'SUPER_ADMIN') {
      setUser({
        id: 'usr-admin-1',
        name: 'Sapan Thapa (Super Admin)',
        email: 'sapanthapa49@gmail.com',
        password: 'admin@123',
        phone: '+977 9841000001',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        authProvider: 'email',
        role: 'SUPER_ADMIN',
        status: 'active',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-11T00:00:00Z'
      });
      addToast('Switched to Super Admin (sapanthapa49@gmail.com)', 'success');
    } else if (role === 'ORDER_MANAGER') {
      setUser({
        id: 'usr-mgr-1',
        name: 'Bikash Thapa (Order Manager)',
        email: 'manager@gamingzone.com.np',
        phone: '+977 9841000002',
        photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        authProvider: 'email',
        role: 'ORDER_MANAGER',
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z'
      });
      addToast('Switched to Order Manager mode', 'info');
    } else if (role === 'CONTENT_MANAGER') {
      setUser({
        id: 'usr-cnt-1',
        name: 'Rohan Gurung (Content Manager)',
        email: 'content@gamingzone.com.np',
        phone: '+977 9841000003',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        authProvider: 'email',
        role: 'CONTENT_MANAGER',
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z'
      });
      addToast('Switched to Content Manager mode', 'info');
    } else if (role === 'SUPPORT_AGENT') {
      setUser({
        id: 'usr-sup-1',
        name: 'Pooja Karki (Support Agent)',
        email: 'support@gamingzone.com.np',
        phone: '+977 9841000004',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        authProvider: 'email',
        role: 'SUPPORT_AGENT',
        status: 'active',
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z'
      });
      addToast('Switched to Support Agent mode', 'info');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        switchRole,
        view,
        setView: handleSetView,
        adminTab,
        setAdminTab: handleSetAdminTab,
        selectedGame,
        setSelectedGame,
        selectedOrderId,
        setSelectedOrderId,
        legalTab,
        setLegalTab: handleSetLegalTab,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        catalogTab,
        setCatalogTab,
        selectedCatalog,
        setSelectedCatalog,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        logout,
        orderLookupOpen,
        setOrderLookupOpen,
        chatbotOpen,
        setChatbotOpen,
        notificationsOpen,
        setNotificationsOpen,
        notifications,
        unreadNotifsCount,
        refreshNotifications,
        settings,
        siteSettings: settings,
        setSiteSettings: setSettings,
        refreshSettings,
        toasts,
        addToast,
        removeToast,
        navigateToGame,
        navigateToOrder,
        themeMode,
        resolvedTheme,
        setThemeMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
