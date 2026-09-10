import React from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { X, Bell, Check, CheckCheck, Clock, ExternalLink } from 'lucide-react';

export const NotificationsDrawer: React.FC = () => {
  const {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    refreshNotifications,
    user,
    navigateToOrder
  } = useApp();

  if (!notificationsOpen) return null;

  const handleMarkAll = async () => {
    if (!user) return;
    await api.markAllNotificationsRead(user.id);
    refreshNotifications();
  };

  const handleItemClick = async (notif: any) => {
    if (!notif.read) {
      await api.markNotificationRead(notif.id);
      refreshNotifications();
    }
    if (notif.orderId) {
      setNotificationsOpen(false);
      navigateToOrder(notif.orderId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-md bg-[#0f121e] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#131726]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            <h3 className="font-heading font-bold text-white text-base">Notifications</h3>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold">
                {notifications.filter(n => !n.read).length} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/60">
          {(notifications || []).length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-slate-600 mt-1">Status updates on your manual top-ups will appear here.</p>
            </div>
          ) : (
            (notifications || []).map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`pt-3 first:pt-0 p-2.5 rounded-xl cursor-pointer transition-all ${
                  notif.read ? 'bg-transparent hover:bg-slate-900/40' : 'bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-950/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-xs font-semibold ${notif.read ? 'text-slate-300' : 'text-cyan-300'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                {notif.orderId && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-cyan-400 font-medium">
                    <span>View Order Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
