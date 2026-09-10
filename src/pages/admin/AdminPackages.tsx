import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Game, GamePackage } from '../../types';
import { Package, Plus, Edit2, Trash2, Check, Tag } from 'lucide-react';

export const AdminPackages: React.FC = () => {
  const { addToast } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);

  // Form
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(100);
  const [discountTag, setDiscountTag] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isBestValue, setIsBestValue] = useState(false);
  const [active, setActive] = useState(true);

  const fetchData = async () => {
    try {
      const gamesData = await api.getGames(true);
      setGames(Array.isArray(gamesData) ? gamesData : []);
      const defaultGame = selectedGameId || (gamesData[0]?.id ?? '');
      setSelectedGameId(defaultGame);

      if (defaultGame) {
        const pkgs = await api.getGamePackages(defaultGame, true);
        setPackages(Array.isArray(pkgs) ? pkgs : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGameSelect = async (gId: string) => {
    setSelectedGameId(gId);
    try {
      const pkgs = await api.getGamePackages(gId, true);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setEditingPackage(null);
    setName('');
    setAmount('');
    setOriginalPrice(0);
    setPrice(100);
    setDiscountTag('');
    setIsPopular(false);
    setIsBestValue(false);
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (pkg: GamePackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setAmount(pkg.amount);
    setOriginalPrice(pkg.originalPrice || 0);
    setPrice(pkg.price);
    setDiscountTag(pkg.discountTag || '');
    setIsPopular(pkg.isPopular || false);
    setIsBestValue(pkg.isBestValue || false);
    setActive(pkg.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) return;

    try {
      const payload: Partial<GamePackage> = {
        gameId: selectedGameId,
        name,
        amount: amount || name,
        originalPrice: originalPrice > price ? originalPrice : undefined,
        price: Number(price),
        discountTag: discountTag || undefined,
        isPopular,
        isBestValue,
        active
      };

      if (editingPackage) {
        await api.updatePackage(editingPackage.id, payload);
        addToast('Package updated successfully', 'success');
      } else {
        await api.createPackage(payload);
        addToast('Package created successfully', 'success');
      }
      setModalOpen(false);
      handleGameSelect(selectedGameId);
    } catch (err) {
      addToast('Failed to save package', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Top-Up Packages &amp; NPR Pricing
          </h2>
          <p className="text-xs text-slate-400">
            Configure Diamond, UC, and Points tiers with custom discounts in Nepalese Rupees.
          </p>
        </div>

        <button
          onClick={openNewModal}
          disabled={!selectedGameId}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </button>
      </div>

      {/* Game Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGameSelect(g.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedGameId === g.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-[#111424] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <img src={g.logoUrl} alt={g.name} className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
            <span>{g.name}</span>
          </button>
        ))}
      </div>

      {/* Packages Table */}
      <div className="bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141829] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Package Name</th>
                <th className="p-3.5">In-Game Value</th>
                <th className="p-3.5">Price (NPR)</th>
                <th className="p-3.5">Discount Tag</th>
                <th className="p-3.5">Badges</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No packages listed for this game yet.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-[#14182a] transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {pkg.name}
                    </td>
                    <td className="p-3.5 font-mono text-cyan-300">
                      {pkg.amount}
                    </td>
                    <td className="p-3.5 font-gaming font-extrabold text-white">
                      NPR {pkg.price}
                      {pkg.originalPrice && (
                        <span className="block text-[10px] line-through text-slate-500 font-normal">
                          NPR {pkg.originalPrice}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {pkg.discountTag ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          {pkg.discountTag}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3.5 space-x-1">
                      {pkg.isBestValue && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[9px] font-bold">
                          BEST VALUE
                        </span>
                      )}
                      {pkg.isPopular && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[9px] font-bold">
                          POPULAR
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        pkg.active ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {pkg.active ? 'ACTIVE' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f121e] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              {editingPackage ? 'Edit Package' : 'Add Top-Up Package'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Package Title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 60 UC or 325 UC + 25 Bonus"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  In-Game Currency Value
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 60 UC"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Selling Price (NPR)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-gaming focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Original Price (NPR)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-gaming focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Promo / Discount Tag
                </label>
                <input
                  type="text"
                  value={discountTag}
                  onChange={(e) => setDiscountTag(e.target.value)}
                  placeholder="e.g. 15% OFF"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Popular</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestValue}
                    onChange={(e) => setIsBestValue(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Best Value</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded bg-[#141829] border-slate-700 text-purple-500"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  Save Package
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
