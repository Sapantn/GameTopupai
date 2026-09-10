import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { OfferBanner } from '../../types';
import { Gift, Plus, Edit2, Check, Sparkles } from 'lucide-react';

export const AdminOffers: React.FC = () => {
  const { addToast } = useApp();
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferBanner | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [active, setActive] = useState(true);

  const fetchOffers = async () => {
    try {
      const data = await api.getOffers(true);
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openNew = () => {
    setEditingOffer(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80');
    setLink('/games');
    setActive(true);
    setModalOpen(true);
  };

  const openEdit = (off: OfferBanner) => {
    setEditingOffer(off);
    setTitle(off.title || '');
    setSubtitle(off.subtitle || '');
    setImageUrl(off.bannerUrl || off.imageUrl || '');
    setLink(off.link || '/games');
    setActive(off.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<OfferBanner> = {
        title,
        subtitle,
        imageUrl,
        link,
        active
      };

      if (editingOffer) {
        await api.updateOffer(editingOffer.id, payload);
        addToast('Offer updated successfully', 'success');
      } else {
        await api.createOffer(payload);
        addToast('Offer created successfully', 'success');
      }
      setModalOpen(false);
      fetchOffers();
    } catch (err) {
      addToast('Failed to save offer', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Promotional Banners &amp; Deals
          </h2>
          <p className="text-xs text-slate-400">
            Control the hero carousel banners and festival discount alerts on the customer homepage.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Offer Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(offers || []).map((off) => (
          <div
            key={off.id}
            className="bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between"
          >
            <div className="h-44 w-full relative">
              <img src={off.bannerUrl || (off as any).imageUrl} alt={off.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-[#111424]/30 to-transparent" />
              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold border ${
                off.active ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {off.active ? 'LIVE' : 'HIDDEN'}
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-heading font-bold text-white text-lg">
                  {off.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {off.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-purple-400 font-mono">
                  Link: {off.link}
                </span>
                <button
                  onClick={() => openEdit(off)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0f121e] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              {editingOffer ? 'Edit Offer Banner' : 'Create Offer Banner'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dashain Mega UC Bonanza"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Get up to 20% bonus diamonds with eSewa & Khalti"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Artwork Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Route Link
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/games"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Show banner on homepage</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  Save Offer
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
