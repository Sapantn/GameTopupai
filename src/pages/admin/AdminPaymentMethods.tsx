import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { PaymentMethod } from '../../types';
import { QrCode, Plus, Edit2, Check, ExternalLink } from 'lucide-react';

export const AdminPaymentMethods: React.FC = () => {
  const { addToast } = useApp();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  // Form
  const [name, setName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);

  const fetchMethods = async () => {
    try {
      const data = await api.getPaymentMethods(true);
      setMethods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const openEdit = (pm: PaymentMethod) => {
    setEditingMethod(pm);
    setName(pm.name);
    setAccountName(pm.accountName);
    setAccountNumber(pm.accountNumber);
    setQrCodeUrl(pm.qrCodeUrl);
    setInstructions(pm.instructions);
    setActive(pm.active);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingMethod(null);
    setName('');
    setAccountName('');
    setAccountNumber('');
    setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GamingZone_Payment');
    setInstructions('Scan the QR code or send payment to our official account. Keep the screenshot.');
    setActive(true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<PaymentMethod> = {
        name,
        accountName,
        accountNumber,
        qrCodeUrl,
        instructions,
        active
      };

      if (editingMethod) {
        await api.updatePaymentMethod(editingMethod.id, payload);
        addToast(`${name} settings updated`, 'success');
      } else {
        await api.createPaymentMethod(payload);
        addToast('New payment method added', 'success');
      }
      setModalOpen(false);
      fetchMethods();
    } catch (err) {
      addToast('Failed to save payment gateway', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Nepal Payment Gateways &amp; QR Codes
          </h2>
          <p className="text-xs text-slate-400">
            Configure official eSewa, Khalti, Fonepay, and Bank accounts where customers manually transfer funds.
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Payment Methods Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(methods || []).map((pm) => (
          <div
            key={pm.id}
            className="bg-[#111424] rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-base">
                      {pm.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      pm.active ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {pm.active ? 'ACTIVE IN CHECKOUT' : 'DISABLED'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openEdit(pm)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Holder:</span>
                  <span className="font-bold text-white">{pm.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account / Phone:</span>
                  <span className="font-mono font-bold text-cyan-300">{pm.accountNumber}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                  {pm.instructions}
                </div>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-4">
              <img
                src={pm.qrCodeUrl}
                alt={`${pm.name} QR`}
                className="w-20 h-20 rounded-xl bg-white p-1 object-contain shrink-0"
              />
              <div className="text-[11px] text-slate-400 space-y-1">
                <span className="block font-semibold text-slate-300">Live Customer QR Code</span>
                <p>Scannable by any mobile banking app in Nepal.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0f121e] border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg">
              {editingMethod ? `Edit ${editingMethod.name}` : 'Add Payment Gateway'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payment Method Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. eSewa or Khalti Wallet"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="GamingZone Nepal"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Wallet ID / Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  QR Code Image URL
                </label>
                <input
                  type="url"
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Manual Transfer Instructions
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none"
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
                  <span>Enable at customer checkout</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                >
                  Save Payment Method
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
