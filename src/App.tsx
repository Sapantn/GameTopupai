/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Layout Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { OrderLookupModal } from './components/OrderLookupModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { ChatbotWidget } from './components/ChatbotWidget';

// Customer Pages
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { GameDetailPage } from './pages/GameDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OffersPage } from './pages/OffersPage';
import { SupportPage } from './pages/SupportPage';
import { ProfilePage } from './pages/ProfilePage';
import { LegalPage } from './pages/LegalPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCatalogs } from './pages/admin/AdminCatalogs';
import { AdminGames } from './pages/admin/AdminGames';
import { AdminPackages } from './pages/admin/AdminPackages';
import { AdminPaymentMethods } from './pages/admin/AdminPaymentMethods';
import { AdminPromoCodes } from './pages/admin/AdminPromoCodes';
import { AdminOffers } from './pages/admin/AdminOffers';
import { AdminSupport } from './pages/admin/AdminSupport';
import { AdminChatbot } from './pages/admin/AdminChatbot';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminStaff } from './pages/admin/AdminStaff';

// Authentication & Authorization Route Guard
import { AdminRouteGuard } from './components/AdminRouteGuard';

// Icons
import { AlertTriangle, CheckCircle, Info, X, Zap } from 'lucide-react';

const MainContent: React.FC = () => {
  const { view, adminTab, toasts, removeToast, siteSettings, resolvedTheme } = useApp();

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, adminTab]);

  // If in Admin view - protected by authentication & role authorization middleware
  if (view === 'admin') {
    return (
      <AdminRouteGuard>
        <AdminLayout>
          {adminTab === 'dashboard' && <AdminDashboard />}
          {adminTab === 'orders' && <AdminOrders />}
          {adminTab === 'catalogs' && <AdminCatalogs />}
          {adminTab === 'games' && <AdminGames />}
          {adminTab === 'packages' && <AdminPackages />}
          {adminTab === 'payment-methods' && <AdminPaymentMethods />}
          {adminTab === 'promo-codes' && <AdminPromoCodes />}
          {adminTab === 'offers' && <AdminOffers />}
          {adminTab === 'support' && <AdminSupport />}
          {adminTab === 'chatbot' && <AdminChatbot />}
          {adminTab === 'audit-logs' && <AdminAuditLogs />}
          {adminTab === 'settings' && <AdminSettings />}
          {adminTab === 'staff' && <AdminStaff />}
        </AdminLayout>
      </AdminRouteGuard>
    );
  }

  // Customer Storefront View
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${
      resolvedTheme === 'light'
        ? 'bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white'
        : 'bg-[#0a0c16] text-slate-100 selection:bg-cyan-500 selection:text-black'
    }`}>
      
      {/* Top Announcement Bar */}
      {siteSettings?.announcementBanner && (
        <div className={`py-1.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 border-b transition-colors ${
          resolvedTheme === 'light'
            ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white border-blue-400/30 shadow-sm'
            : 'bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 text-white border-cyan-500/20'
        }`}>
          <Zap className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span>{siteSettings.announcementBanner}</span>
          <span className="hidden sm:inline text-cyan-200 font-normal">
            &bull; Operational {siteSettings?.operatingHours || '8:00 AM – 11:30 PM NST (Kathmandu)'}
          </span>
        </div>
      )}

      {/* Primary Customer Navbar */}
      <Navbar />

      {/* Dynamic View Router */}
      <main className="flex-1 pb-20 md:pb-12">
        {view === 'home' && <HomePage />}
        {view === 'games' && <GamesPage />}
        {view === 'cards' && <GamesPage />}
        {view === 'game-detail' && <GameDetailPage />}
        {view === 'orders' && <OrdersPage />}
        {view === 'order-detail' && <OrderDetailPage />}
        {view === 'offers' && <OffersPage />}
        {view === 'support' && <SupportPage />}
        {view === 'profile' && <ProfilePage />}
        {view === 'legal' && <LegalPage />}
      </main>

      {/* Customer Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Navigation (smart phone gamers) */}
      <MobileBottomNav />

      {/* Global Modals & Widgets */}
      <AuthModal />
      <OrderLookupModal />
      <NotificationsDrawer />
      <ChatbotWidget />

      {/* Toast Notification Container */}
      <div className="fixed bottom-24 md:bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : 'bg-[#121629]/95 border-cyan-500/40 text-cyan-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs leading-relaxed font-medium">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
