import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Game, Catalog } from '../../types';
import { Gamepad2, Plus, Edit2, Check, X, Trash2, Sparkles, ExternalLink, Layers, CreditCard } from 'lucide-react';

export const AdminGames: React.FC = () => {
  const { addToast, setAdminTab } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalogFilter, setSelectedCatalogFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<'mobile' | 'pc' | 'voucher' | string>('mobile');
  const [catalogId, setCatalogId] = useState<string>('');
  const [catalogSlug, setCatalogSlug] = useState<string>('');
  const [catalogType, setCatalogType] = useState<'game' | 'card' | string>('game');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [popular, setPopular] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState('5-15 mins');

  const fetchGames = async () => {
    try {
      const [gamesData, catalogsData] = await Promise.all([
        api.getGames(true),
        api.getCatalogs(true)
      ]);
      setGames(Array.isArray(gamesData) ? gamesData : []);
      setCatalogs(Array.isArray(catalogsData) ? catalogsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openNewModal = () => {
    setEditingGame(null);
    setName('');
    setSlug('');
    const defaultCat = catalogs.find(c => c.slug === 'mobile') || catalogs[0];
    setCategory(defaultCat?.slug || 'mobile');
    setCatalogId(defaultCat?.id || '');
    setCatalogSlug(defaultCat?.slug || 'mobile');
    setCatalogType(defaultCat?.type || 'game');
    setDescription('');
    setBannerUrl('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80');
    setLogoUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80');
    setPopular(false);
    setFeatured(false);
    setActive(true);
    setDeliveryTime('5-15 mins');
    setModalOpen(true);
  };

  const openEditModal = (g: Game) => {
    setEditingGame(g);
    setName(g.name);
    setSlug(g.slug);
    setCategory(g.category);
    const matchedCatalog = catalogs.find(c =>
      c.id === g.catalogId ||
      c.slug === g.catalogSlug ||
      c.slug === g.category ||
      c.name.toLowerCase() === g.category.toLowerCase()
    );
    setCatalogId(g.catalogId || matchedCatalog?.id || '');
    setCatalogSlug(g.catalogSlug || matchedCatalog?.slug || g.category);
    setCatalogType(g.catalogType || matchedCatalog?.type || 'game');
    setDescription(g.description);
    setBannerUrl(g.bannerUrl);
    setLogoUrl(g.logoUrl);
    setPopular(g.popular);
    setFeatured(g.featured);
    setActive(g.active);
    setDeliveryTime(g.deliveryTime || '5-15 mins');
    setModalOpen(true);
  };

  const handleCatalogSelection = (selectedSlug: string) => {
    const matched = catalogs.find(c => c.slug === selectedSlug);
    if (matched) {
      setCategory(matched.slug);
      setCatalogId(matched.id);
      setCatalogSlug(matched.slug);
      setCatalogType(matched.type);
    } else {
      setCategory(selectedSlug);
      setCatalogSlug(selectedSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Game> = {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category,
        catalogId,
        catalogSlug: catalogSlug || category,
        catalogType,
        description,
        bannerUrl,
        logoUrl,
        popular,
        featured,
        active,
        deliveryTime,
        inputFields: editingGame?.inputFields || [
          {
            id: 'playerId',
            label: 'Player ID / User ID',
            type: 'text',
            placeholder: 'Enter numeric Character ID',
            required: true
          }
        ]
      };

      if (editingGame) {
        await api.updateGame(editingGame.id, payload);
        addToast('Game updated successfully', 'success');
      } else {
        await api.createGame(payload);
        addToast('Game added to catalog', 'success');
      }
      setModalOpen(false);
      fetchGames();
    } catch (err: any) {
      addToast('Failed to save game', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Games & Digital Products Management
          </h2>
          <p className="text-xs text-slate-400">
            Configure titles, catalog assignments (PC, Webgame, Mobile, Xbox, Cards), custom player ID fields, and delivery speeds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAdminTab('catalogs')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Manage Catalogs</span>
          </button>
          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Catalog Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCatalogFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            selectedCatalogFilter === 'all'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-[#121626] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Items ({games.length})
        </button>
        {catalogs.map((c) => {
          const count = games.filter(g =>
            g.catalogSlug === c.slug ||
            g.catalogId === c.id ||
            g.category?.toLowerCase() === c.slug.toLowerCase() ||
            g.category?.toLowerCase() === c.name.toLowerCase()
          ).length;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCatalogFilter(c.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedCatalogFilter === c.slug
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#121626] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.type === 'card' ? <CreditCard className="w-3 h-3 text-amber-400" /> : <Gamepad2 className="w-3 h-3 text-purple-400" />}
              <span>{c.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(games || [])
          .filter(g => {
            if (selectedCatalogFilter === 'all') return true;
            return (
              g.catalogSlug === selectedCatalogFilter ||
              g.catalogId === selectedCatalogFilter ||
              g.category?.toLowerCase() === selectedCatalogFilter.toLowerCase()
            );
          })
          .map((g) => (
          <div
            key={g.id}
            className="bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between shadow-xl"
          >
            <div className="h-32 w-full relative overflow-hidden">
              <img src={g.bannerUrl} alt={g.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-transparent to-transparent" />
              <div className="absolute top-3 right-3 flex gap-1">
                {g.popular && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[9px] font-bold">
                    POPULAR
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                  g.active ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {g.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src={g.logoUrl} alt={g.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-heading font-bold text-white text-base leading-tight">
                    {g.name}
                  </h3>
                  <span className="text-[10px] text-purple-400 uppercase font-bold">
                    {g.category} &bull; {g.deliveryTime}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2">
                {g.description}
              </p>

              <div className="text-[11px] text-slate-500 font-mono">
                Input fields: {g.inputFields?.map(f => f.label).join(', ') || 'Player ID'}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  slug: /{g.slug}
                </span>
                <button
                  onClick={() => openEditModal(g)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Game Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#0f121e] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-heading font-bold text-white text-lg">
              {editingGame ? 'Edit Game' : 'Add New Game'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Game Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Slug / URL Key
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. pubg-mobile"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Catalog Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        setAdminTab('catalogs');
                      }}
                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" />
                      Manage
                    </button>
                  </div>
                  <select
                    value={catalogSlug || category}
                    onChange={(e) => handleCatalogSelection(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <optgroup label="🎮 Game Catalogs (PC, Webgame, Mobile, Xbox)">
                      {catalogs
                        .filter(c => c.type === 'game')
                        .map(c => (
                          <option key={c.id} value={c.slug}>
                            {c.name} {c.badge ? `[${c.badge}]` : ''}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="💳 Card & Voucher Catalogs">
                      {catalogs
                        .filter(c => c.type === 'card')
                        .map(c => (
                          <option key={c.id} value={c.slug}>
                            {c.name} {c.badge ? `[${c.badge}]` : ''}
                          </option>
                        ))}
                    </optgroup>
                    {catalogs.length === 0 && (
                      <>
                        <option value="mobile">Mobile Game</option>
                        <option value="pc">PC Game</option>
                        <option value="webgame">Web Game</option>
                        <option value="xbox">Xbox</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Delivery Speed Notice
                  </label>
                  <input
                    type="text"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    placeholder="5-15 mins"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Banner Artwork Image URL
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Logo / Square Icon URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Mark as Popular</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Mark as Featured</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Active for Customers</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  Save Game
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
