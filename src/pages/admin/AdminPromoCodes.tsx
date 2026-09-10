import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { PromoCode } from '../../types';
import { Tag, Plus, Edit2, Check, X, Percent, DollarSign } from 'lucide-react';

export const AdminPromoCodes: React.FC = () => {
  const { addToast } = useApp();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [type, setType] = useState<'fixed' | 'percentage'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(300);
  const [maxDiscount, setMaxDiscount] = useState<number>(150);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const fetchPromos = async () => {
    try {
      const data = await api.getPromoCodes();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openNew = () => {
    setEditingPromo(null);
    setCode('');
    setType('percentage');
    setValue(10);
    setMinOrderAmount(300);
    setMaxDiscount(150);
    setDescription('Festival discount code');
    setActive(true);
    setModalOpen(true);
  };

  const openEdit = (p: PromoCode) => {
    setEditingPromo(p);
    setCode(p.code);
    setType(p.type);
    setValue(p.value);
    setMinOrderAmount(p.minOrderAmount);
    setMaxDiscount(p.maxDiscount || 0);
    setDescription(p.description);
    setActive(p.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<PromoCode> = {
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        description,
        active
      };

      if (editingPromo) {
        await api.updatePromoCode(editingPromo.id, payload);
        addToast(`Promo code ${code} updated`, 'success');
      } else {
        await api.createPromoCode(payload);
        addToast(`Promo code ${code} created`, 'success');
      }
      setModalOpen(false);
      fetchPromos();
    } catch (err) {
      addToast('Failed to save promo code', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Promo Codes &amp; Discount Vouchers
          </h2>
          <p className="text-xs text-slate-400">
            Set percentage discounts, minimum NPR cart requirements, and usage caps.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Promos Table */}
      <div className="bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141829] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Promo Code</th>
                <th className="p-3.5">Discount Rate</th>
                <th className="p-3.5">Min Order (NPR)</th>
                <th className="p-3.5">Max Cap (NPR)</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(promos || []).map((p) => (
                <tr key={p.id} className="hover:bg-[#14182a] transition-colors">
                  <td className="p-3.5 font-mono font-bold text-white text-sm">
                    {p.code}
                  </td>
                  <td className="p-3.5 font-bold text-cyan-300">
                    {p.type === 'percentage' ? `${p.value}% OFF` : `NPR ${p.value} OFF`}
                  </td>
                  <td className="p-3.5 font-gaming text-slate-300">
                    NPR {p.minOrderAmount}
                  </td>
                  <td className="p-3.5 font-gaming text-slate-300">
                    {p.maxDiscount ? `NPR ${p.maxDiscount}` : 'No cap'}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {p.description}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      p.active ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {p.active ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f121e] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Promo Code (Uppercase)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DASHAIN2026"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat NPR (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Min Order Amount (NPR)
                  </label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Max Discount Cap (NPR)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  <span>Active &amp; redeemable at checkout</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  Save Code
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
