import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import {
  User,
  ShieldCheck,
  Smartphone,
  Mail,
  Edit3,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, setUser, addToast, setView, switchRole } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile(user.id, { name, phone, email });
      setUser(res.user);
      setIsEditing(false);
      addToast('Profile updated successfully', 'success');
    } catch (err: any) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Card Header */}
      <div className="bg-gradient-to-r from-[#111425] via-[#161a32] to-[#111425] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl border-2 border-cyan-500/60 overflow-hidden shadow-xl shrink-0 p-1 bg-[#0a0c14]">
            <img
              src={user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-heading font-extrabold text-white">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.phone || '+977 98XXXXXXXX'}</span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Gamer Statistics & Trust Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111424] border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Verified Nepal Gamer
          </span>
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>KYC / Phone Verified</span>
          </p>
          <span className="text-[11px] text-slate-500 block">
            Eligible for instant manual top-ups
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111424] border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Orders Placed
          </span>
          <p className="text-xl font-heading font-extrabold text-white">
            Active Account
          </p>
          <button
            onClick={() => setView('orders')}
            className="text-[11px] text-cyan-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View all my receipts</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[#111424] border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Currency Support
          </span>
          <p className="text-xl font-heading font-extrabold text-cyan-400">
            NPR (Nepalese Rupee)
          </p>
          <span className="text-[11px] text-slate-500 block">
            eSewa, Khalti, Fonepay, Bank
          </span>
        </div>
      </div>

      {/* Account Security & Role Status */}
      <div className="bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider font-gaming">
              Account Status &amp; Permissions
            </span>
            <h3 className="text-lg font-heading font-bold text-white mt-0.5">
              Role &amp; Security Level
            </h3>
            <p className="text-xs text-slate-400">
              Your account access level and verification tier within GamingZone Nepal.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-200">Tier: Verified Nepalese Buyer</span>
          </div>
        </div>

        {user.role === 'CUSTOMER' ? (
          <div className="p-4 rounded-xl bg-[#161a2e] border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-white">Standard Customer Account</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Full access to instant game top-ups, transaction receipts, and live customer support.
              </p>
            </div>
            <button
              onClick={() => {
                setView('orders');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-semibold text-xs hover:bg-cyan-900 transition-colors shrink-0"
            >
              View Order History
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-200">Staff Privileges: {user.role.replace('_', ' ')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900 text-purple-300 font-semibold uppercase">
                  Staff Account
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">
                You have authorized access to the administrative operations desk.
              </p>
            </div>
            <button
              onClick={() => {
                setView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-colors shrink-0"
            >
              Open Admin Desk &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f121e] border border-cyan-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              Edit Account Profile
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mobile Number (Nepal)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
