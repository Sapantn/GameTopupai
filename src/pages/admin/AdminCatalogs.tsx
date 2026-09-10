import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Catalog } from '../../types';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Gamepad2,
  CreditCard,
  Sparkles,
  Smartphone,
  Monitor,
  Globe,
  Tv,
  Gift,
  Key,
  Film,
  Headphones,
  ShoppingBag,
  Wrench,
  Laptop,
  MessageCircle,
  Calendar,
  X,
  RotateCcw,
  Tag,
  Hash
} from 'lucide-react';

export const AdminCatalogs: React.FC = () => {
  const { addToast } = useApp();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'game' | 'card'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'game' | 'card' | string>('game');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Gamepad2');
  const [badge, setBadge] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [active, setActive] = useState(true);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const data = await api.getCatalogs(true);
      setCatalogs(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load catalogs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const openNewModal = (defaultDomain: 'game' | 'card' = 'game') => {
    setEditingCatalog(null);
    setName('');
    setSlug('');
    setType(defaultDomain);
    setDescription('');
    setIcon(defaultDomain === 'card' ? 'CreditCard' : 'Gamepad2');
    setBadge('');
    setSortOrder(catalogs.length + 1);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Catalog) => {
    setEditingCatalog(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setType(cat.type);
    setDescription(cat.description || '');
    setIcon(cat.icon || (cat.type === 'card' ? 'CreditCard' : 'Gamepad2'));
    setBadge(cat.badge || '');
    setSortOrder(cat.sortOrder);
    setActive(cat.active);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCatalog) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Catalog name is required', 'error');
      return;
    }

    const finalSlug = slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    try {
      const payload: Partial<Catalog> = {
        name: name.trim(),
        slug: finalSlug,
        type,
        description: description.trim(),
        icon,
        badge: badge.trim().toUpperCase(),
        sortOrder: Number(sortOrder) || 1,
        active
      };

      if (editingCatalog) {
        await api.updateCatalog(editingCatalog.id, payload);
        addToast(`Catalog "${name}" updated successfully`, 'success');
      } else {
        await api.createCatalog(payload);
        addToast(`Catalog category "${name}" created`, 'success');
      }

      setModalOpen(false);
      fetchCatalogs();
    } catch (err: any) {
      console.error(err);
      addToast('Failed to save catalog category', 'error');
    }
  };

  const handleDelete = async (cat: Catalog) => {
    if (window.confirm(`Are you sure you want to delete catalog category "${cat.name}"?`)) {
      try {
        await api.deleteCatalog(cat.id);
        addToast(`Catalog "${cat.name}" deleted`, 'success');
        fetchCatalogs();
      } catch (err: any) {
        addToast('Failed to delete catalog', 'error');
      }
    }
  };

  const handleToggleActive = async (cat: Catalog) => {
    try {
      await api.updateCatalog(cat.id, { active: !cat.active });
      addToast(`Catalog "${cat.name}" is now ${!cat.active ? 'Active' : 'Inactive'}`, 'info');
      fetchCatalogs();
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const getCatalogIcon = (iconName?: string, catType?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'smartphone':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'monitor':
        return <Monitor className="w-4 h-4 text-purple-400" />;
      case 'globe':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'gamepad':
      case 'gamepad2':
        return <Gamepad2 className="w-4 h-4 text-pink-400" />;
      case 'tv':
        return <Tv className="w-4 h-4 text-indigo-400" />;
      case 'gift':
        return <Gift className="w-4 h-4 text-amber-400" />;
      case 'key':
        return <Key className="w-4 h-4 text-yellow-400" />;
      case 'film':
        return <Film className="w-4 h-4 text-rose-400" />;
      case 'headphones':
        return <Headphones className="w-4 h-4 text-green-400" />;
      case 'shoppingbag':
        return <ShoppingBag className="w-4 h-4 text-orange-400" />;
      case 'wrench':
        return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'laptop':
        return <Laptop className="w-4 h-4 text-teal-400" />;
      case 'messagecircle':
        return <MessageCircle className="w-4 h-4 text-violet-400" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-sky-400" />;
      default:
        return catType === 'card' ? (
          <CreditCard className="w-4 h-4 text-amber-400" />
        ) : (
          <Gamepad2 className="w-4 h-4 text-purple-400" />
        );
    }
  };

  const filteredCatalogs = catalogs.filter((c) => {
    const matchesFilter = filterType === 'all' || c.type === filterType;
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.badge && c.badge.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const gameCount = catalogs.filter((c) => c.type === 'game').length;
  const cardCount = catalogs.filter((c) => c.type === 'card').length;
  const totalProducts = catalogs.reduce((acc, c) => acc + (c.itemCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-purple-400" />
              Catalogs & Categories
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/30">
              {catalogs.length} Active Catalogs
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage Game Catalogs (PC, Webgame, Mobile, Xbox) and Card Catalogs (Gift Cards, Game Cards, Streaming, Payment Cards). Add, edit, or customize any category anytime.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openNewModal('game')}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Game Catalog</span>
          </button>
          <button
            onClick={() => openNewModal('card')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card Catalog</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121626] border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Game Catalogs</span>
            <div className="text-2xl font-extrabold text-white flex items-center gap-2">
              {gameCount}
              <span className="text-[11px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                PC, Webgame, Mobile, Xbox
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="bg-[#121626] border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Card & Voucher Catalogs</span>
            <div className="text-2xl font-extrabold text-white flex items-center gap-2">
              {cardCount}
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                13 Categories
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-[#121626] border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Linked Catalog Items</span>
            <div className="text-2xl font-extrabold text-white flex items-center gap-2">
              {totalProducts}
              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Live Store Products
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121626] border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            All ({catalogs.length})
          </button>
          <button
            onClick={() => setFilterType('game')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'game'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Games ({gameCount})
          </button>
          <button
            onClick={() => setFilterType('card')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'card'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Cards & Vouchers ({cardCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalogs, slug, badge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161a2e] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Catalogs Table */}
      <div className="bg-[#121626] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#15192c] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Order</th>
                <th className="px-4 py-3.5">Catalog Name</th>
                <th className="px-4 py-3.5">Slug ID</th>
                <th className="px-4 py-3.5">Domain</th>
                <th className="px-4 py-3.5">Badge</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-center">Items</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading catalog categories...</div>
                  </td>
                </tr>
              ) : filteredCatalogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No catalogs match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredCatalogs.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      #{cat.sortOrder}
                    </td>

                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#181d33] border border-slate-700/80 flex items-center justify-center shrink-0">
                          {getCatalogIcon(cat.icon, cat.type)}
                        </div>
                        <span className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      <span className="bg-[#181d33] px-2 py-0.5 rounded border border-slate-700">
                        {cat.slug}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {cat.type === 'card' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/40">
                          <CreditCard className="w-3 h-3" />
                          Card
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-600/40">
                          <Gamepad2 className="w-3 h-3" />
                          Game
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {cat.badge ? (
                        <span className="px-2 py-0.5 rounded bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/40 font-bold text-[10px] tracking-wider">
                          {cat.badge}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate text-[11px]">
                      {cat.description || <span className="text-slate-600 italic">No description</span>}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-bold font-mono text-[11px] border border-cyan-500/20">
                        {cat.itemCount || 0}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                          cat.active
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-500/30 hover:bg-rose-900/60'
                        }`}
                        title="Click to toggle active status"
                      >
                        {cat.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-purple-500"
                          title="Edit catalog details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-rose-500"
                          title="Delete catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Catalog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121626] border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#161a2e] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCatalog ? `Edit Catalog: ${editingCatalog.name}` : 'Create New Catalog Category'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Catalog Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Xbox, Gift Cards, Payment Cards..."
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Slug ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. xbox or gift-cards"
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Catalog Domain / Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setType(val);
                      if (!icon || icon === 'Gamepad2' || icon === 'CreditCard') {
                        setIcon(val === 'card' ? 'CreditCard' : 'Gamepad2');
                      }
                    }}
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="game">🎮 Game (PC, Webgame, Mobile, Xbox)</option>
                    <option value="card">💳 Card & Voucher (Gift, Music, Video, etc.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description / Subtitle
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what items belong to this category..."
                  className="w-full bg-[#181d33] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Icon Symbol
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Smartphone">Smartphone (Mobile)</option>
                    <option value="Monitor">Monitor (PC)</option>
                    <option value="Globe">Globe (Web Game)</option>
                    <option value="Gamepad">Gamepad (Xbox / Console)</option>
                    <option value="CreditCard">CreditCard (Payment)</option>
                    <option value="Gift">Gift (Gift Cards)</option>
                    <option value="Key">Key (CD-Key)</option>
                    <option value="Film">Film (Video Streaming)</option>
                    <option value="Headphones">Headphones (Music)</option>
                    <option value="ShoppingBag">ShoppingBag</option>
                    <option value="Wrench">Wrench (Tools)</option>
                    <option value="Laptop">Laptop (Software)</option>
                    <option value="MessageCircle">MessageCircle (Social)</option>
                    <option value="Calendar">Calendar (Subscription)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Badge Highlight
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value.toUpperCase())}
                    placeholder="HOT / POPULAR / NEW"
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min={1}
                    className="w-full bg-[#181d33] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-[#181d33] border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <span>Active & visible in customer store filters</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition-all hover:scale-105 active:scale-95"
                >
                  {editingCatalog ? 'Save Changes' : 'Create Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
