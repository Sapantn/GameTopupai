import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SiteSettings } from '../../types';
import { Settings, Save, AlertTriangle, Check, ShieldCheck } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { siteSettings, setSiteSettings, addToast } = useApp();
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setFormData(siteSettings);
    }
  }, [siteSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSiteSettings(formData);
      setSiteSettings(updated);
      addToast('Website settings saved & updated across storefront', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-white">
          Website &amp; Storefront Settings
        </h2>
        <p className="text-xs text-slate-400">
          Configure Nepal customer helpline, operational hours, notice tickers, and emergency maintenance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#111424] rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
        
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Platform Name
          </label>
          <input
            type="text"
            value={formData.siteName || formData.websiteName || ''}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value, websiteName: e.target.value })}
            className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              WhatsApp Support Number (E.164 with Nepal code)
            </label>
            <input
              type="text"
              value={formData.supportWhatsApp || formData.whatsappNumber || ''}
              onChange={(e) => setFormData({ ...formData, supportWhatsApp: e.target.value, whatsappNumber: e.target.value })}
              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Customer Phone Hotline
            </label>
            <input
              type="text"
              value={formData.supportPhone || ''}
              onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Support Email Address
            </label>
            <input
              type="email"
              value={formData.supportEmail || formData.contactEmail || ''}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value, contactEmail: e.target.value })}
              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Operating Hours (Nepal Standard Time)
            </label>
            <input
              type="text"
              value={formData.operatingHours || formData.supportHours || ''}
              onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value, supportHours: e.target.value })}
              className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Top Banner Notification Ticker (Displayed on all pages)
          </label>
          <input
            type="text"
            value={formData.announcementBanner || ''}
            onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
            placeholder="Official Notice to gamers..."
            className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!formData.maintenanceMode}
              onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              className="rounded bg-[#141829] border-slate-700 text-rose-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-white block">Maintenance Mode</span>
              <span className="text-slate-400 text-[11px]">
                Pauses new order checkout while keeping existing order lookups available.
              </span>
            </div>
          </label>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Website Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
