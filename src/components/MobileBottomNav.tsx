import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Gamepad2, Tag, ShoppingBag, User, ShieldAlert } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { view, setView, user, setAdminTab } = useApp();

  const isAdmin = user && user.role !== 'CUSTOMER';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d101d]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
          view === 'home' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-4 h-4" />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button
        onClick={() => { setView('games'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
          view === 'games' || view === 'game-detail' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Gamepad2 className="w-4 h-4" />
        <span className="text-[10px] font-medium">Games</span>
      </button>

      <button
        onClick={() => { setView('offers'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
          view === 'offers' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Tag className="w-4 h-4" />
        <span className="text-[10px] font-medium">Offers</span>
      </button>

      <button
        onClick={() => { setView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
          view === 'orders' || view === 'order-detail' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="text-[10px] font-medium">Orders</span>
      </button>

      {isAdmin ? (
        <button
          onClick={() => { setView('admin'); setAdminTab('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            view === 'admin' ? 'text-purple-400' : 'text-purple-400/70 hover:text-purple-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[10px] font-medium">Admin</span>
        </button>
      ) : (
        <button
          onClick={() => { setView('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            view === 'profile' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      )}
    </nav>
  );
};
