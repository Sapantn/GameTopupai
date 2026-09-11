import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { User, UserRole } from '../../types';
import { ROLE_METADATA } from '../../lib/authMiddleware';
import {
  UserCheck,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  KeyRound,
  X,
  UserX,
  Clock,
  Sparkles,
  Shield
} from 'lucide-react';

export const AdminStaff: React.FC = () => {
  const { user, addToast } = useApp();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add / Edit Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Form fields for Add Staff
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('ORDER_MANAGER');
  const [formPassword, setFormPassword] = useState('admin@123');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields for Edit Staff
  const [editRole, setEditRole] = useState<UserRole>('ORDER_MANAGER');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Revoke confirmation modal
  const [revokingStaff, setRevokingStaff] = useState<User | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);

  // Fetch staff list
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaffUsers(user?.id);
      setStaffList(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch staff members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Please provide name and email address.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await api.addStaffUser(
        {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
          role: formRole,
          password: formPassword.trim() || 'admin@123'
        },
        user?.id
      );

      addToast(
        res.isExistingUser
          ? `User "${res.staff.name}" upgraded to ${res.staff.role.replace('_', ' ')}!`
          : `New staff member "${res.staff.name}" successfully created!`,
        'success'
      );

      setIsAddModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormRole('ORDER_MANAGER');
      setFormPassword('admin@123');
      fetchStaff();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff member.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: User) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditPhone(staff.phone || '');
    setEditRole(staff.role);
    setEditStatus(staff.status || 'active');
    setEditPassword(staff.password || '');
    setEditError(null);
  };

  // Handle Update Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      await api.updateStaffUser(
        editingStaff.id,
        {
          name: editName.trim(),
          phone: editPhone.trim() || undefined,
          role: editRole,
          status: editStatus,
          password: editPassword.trim() || undefined
        },
        user?.id
      );

      addToast(`Staff member "${editName}" updated successfully.`, 'success');
      setEditingStaff(null);
      fetchStaff();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update staff member.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Revoke Staff
  const handleRevokeStaff = async () => {
    if (!revokingStaff) return;

    setRevokeSubmitting(true);
    try {
      await api.revokeStaffAccess(revokingStaff.id, user?.id);
      addToast(`Staff access revoked for "${revokingStaff.name}". They are now a regular customer.`, 'info');
      setRevokingStaff(null);
      fetchStaff();
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke staff access.', 'error');
    } finally {
      setRevokeSubmitting(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const totalStaff = staffList.length;
  const superAdmins = staffList.filter((s) => s.role === 'SUPER_ADMIN').length;
  const orderManagers = staffList.filter((s) => s.role === 'ORDER_MANAGER').length;
  const contentManagers = staffList.filter((s) => s.role === 'CONTENT_MANAGER').length;
  const supportAgents = staffList.filter((s) => s.role === 'SUPPORT_AGENT').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e1222] p-5 rounded-2xl border border-purple-500/20 shadow-lg shadow-black/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-extrabold text-white font-heading">
              Staff &amp; Access Control
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-950 border border-purple-500/40 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Provision, manage roles, and grant or revoke access for GamingZone operational staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh staff list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setFormError(null);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Root Super Admin Notification Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-[#13172e] to-indigo-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="text-purple-200 font-semibold flex items-center gap-2">
              <span>Primary Super Administrator:</span>
              <span className="font-mono bg-purple-900/60 px-2 py-0.5 rounded text-purple-100 border border-purple-500/40 font-bold">
                sapanthapa49@gmail.com
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Default password: <span className="font-mono text-purple-300 font-bold">admin@123</span> • Has perpetual, non-revocable root administrative privileges.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Root Protected</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e1222] border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">Total Staff</span>
          <span className="text-xl font-extrabold text-white font-heading mt-0.5 block">{totalStaff}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0e1222] border border-purple-500/30">
          <span className="text-[11px] font-medium text-purple-400 block">Super Admins</span>
          <span className="text-xl font-extrabold text-purple-200 font-heading mt-0.5 block">{superAdmins}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0e1222] border border-blue-500/30">
          <span className="text-[11px] font-medium text-blue-400 block">Order Managers</span>
          <span className="text-xl font-extrabold text-blue-200 font-heading mt-0.5 block">{orderManagers}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0e1222] border border-cyan-500/30">
          <span className="text-[11px] font-medium text-cyan-400 block">Content Managers</span>
          <span className="text-xl font-extrabold text-cyan-200 font-heading mt-0.5 block">{contentManagers}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0e1222] border border-emerald-500/30 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-emerald-400 block">Support Agents</span>
          <span className="text-xl font-extrabold text-emerald-200 font-heading mt-0.5 block">{supportAgents}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d101c] p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, or phone..."
            className="w-full bg-[#14182a] border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'SUPER_ADMIN', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'SUPPORT_AGENT'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                roleFilter === role
                  ? 'bg-purple-950 border border-purple-500/50 text-purple-300'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Members List */}
      <div className="bg-[#0e1222] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141829] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Role &amp; Permissions</th>
                <th className="px-4 py-3.5">Contact Info</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Password</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
                    <span>Loading operational staff roster...</span>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <UserX className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <span>No staff members match the selected criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isPrimaryRoot = staff.email.toLowerCase() === 'sapanthapa49@gmail.com';
                  const isSelf = staff.id === user?.id;
                  const roleMeta = ROLE_METADATA[staff.role] || {
                    label: staff.role,
                    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500/40',
                    description: 'Staff member'
                  };

                  return (
                    <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              staff.photoUrl ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={staff.name}
                            className="w-9 h-9 rounded-xl object-cover border border-purple-500/30 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{staff.name}</span>
                              {isPrimaryRoot && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[9px] font-extrabold">
                                  ROOT
                                </span>
                              )}
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block">{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Permissions */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleMeta.badgeColor}`}
                        >
                          {roleMeta.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 line-clamp-1 max-w-xs">
                          {roleMeta.description}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{staff.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {staff.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
                            <XCircle className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {staff.password || '••••••••'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Edit Role or Credentials"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isPrimaryRoot ? (
                            <span
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                              title="Root Super Admin cannot be removed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              onClick={() => setRevokingStaff(staff)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-500/30 transition-colors"
                              title="Revoke Staff Access"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD STAFF MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f1222] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141829] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="font-heading font-bold text-white text-base">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sapan Thapa"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Email Address</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. staff@gamingzone.com.np"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  If this email is already registered as a customer, their account will be upgraded immediately.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone (Nepal)</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+977 9841000000"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Staff Operational Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ORDER_MANAGER">Order &amp; Payment Slip Manager (Slips, Orders, Refunds)</option>
                  <option value="CONTENT_MANAGER">Content Manager (Games, Packages, Promo Codes, Offers)</option>
                  <option value="SUPPORT_AGENT">Customer Support Agent (Tickets &amp; Live Chat)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full Unrestricted Access)</option>
                </select>
                <div className="mt-1.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                  {ROLE_METADATA[formRole]?.description}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="admin@123"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold transition-all shadow-md shadow-purple-500/25"
                >
                  {formSubmitting ? 'Saving Staff...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STAFF MODAL ================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f1222] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#141829] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-heading font-bold text-white text-base">
                  Edit Staff: {editingStaff.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={editingStaff.email}
                  className="w-full bg-[#101322] border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Phone (Nepal)</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+977 9841000000"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Staff Role</label>
                <select
                  value={editRole}
                  disabled={editingStaff.email.toLowerCase() === 'sapanthapa49@gmail.com'}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                >
                  <option value="ORDER_MANAGER">Order &amp; Payment Slip Manager</option>
                  <option value="CONTENT_MANAGER">Content Manager</option>
                  <option value="SUPPORT_AGENT">Customer Support Agent</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
                {editingStaff.email.toLowerCase() === 'sapanthapa49@gmail.com' && (
                  <span className="text-[10px] text-purple-400 mt-1 block font-semibold">
                    Primary Super Admin role is immutable.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Access Status</label>
                <select
                  value={editStatus}
                  disabled={editingStaff.email.toLowerCase() === 'sapanthapa49@gmail.com'}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-60"
                >
                  <option value="active">Active (Full operational clearance)</option>
                  <option value="suspended">Suspended (Temporarily block login &amp; actions)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reset Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password to reset"
                  className="w-full bg-[#161a2e] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold transition-all shadow-md shadow-purple-500/25"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REVOKE ACCESS CONFIRMATION MODAL ================= */}
      {revokingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f1222] border border-rose-500/30 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-white text-base">
                Revoke Staff Access?
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to revoke staff privileges for{' '}
                <strong className="text-white">{revokingStaff.name}</strong> ({revokingStaff.email})?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>What happens next:</span>
              </div>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                <li>Their account will be demoted to a regular Customer.</li>
                <li>They will immediately lose access to all admin desk tabs.</li>
                <li>Their previous order and top-up records will remain intact.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokingStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revokeSubmitting}
                onClick={handleRevokeStaff}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30"
              >
                {revokeSubmitting ? 'Revoking Access...' : 'Confirm Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
