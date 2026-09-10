import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Order, OrderStatus } from '../../types';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  RotateCcw,
  XCircle,
  Eye,
  ExternalLink,
  ShieldCheck,
  Send,
  User,
  Copy,
  Check,
  Phone,
  MessageSquare
} from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const { user, addToast } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected Order for Review & Actions
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin action inputs
  const [adminNote, setAdminNote] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [screenshotZoom, setScreenshotZoom] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await api.getAdminOrders({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: search.trim() || undefined
      });
      setOrders(Array.isArray(data) ? data : []);
      if (selectedOrder && Array.isArray(data)) {
        const fresh = data.find(o => o.id === selectedOrder.id);
        if (fresh) setSelectedOrder(fresh);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleStatusAction = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const updated = await api.adminOrderAction(
        selectedOrder.id,
        {
          status: newStatus,
          adminNote: adminNote.trim() || undefined,
          customerFacingMessage: customerMessage.trim() || undefined
        },
        user || undefined
      );
      setSelectedOrder(updated);
      setAdminNote('');
      setCustomerMessage('');
      addToast(`Order ${updated.orderNumber} updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (err: any) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'Top-up Processing':
        return 'bg-blue-950 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'Payment Verified':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'Payment Under Review':
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
      case 'Payment Submitted':
        return 'bg-sky-950 text-sky-300 border-sky-500/40';
      case 'Pending Payment':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Refunded':
        return 'bg-indigo-950 text-indigo-300 border-indigo-500/40';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-rose-950 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Orders &amp; Manual Verification Desk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect transaction references, verify bank SMS, and credit player accounts.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          Refresh Orders
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111424] p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto">
          {[
            'ALL',
            'Payment Submitted',
            'Payment Under Review',
            'Payment Verified',
            'Top-up Processing',
            'Completed',
            'Rejected',
            'Refunded'
          ].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Order, Phone, Txn ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141829] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Main Order Table & Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Orders Table: 7 columns on desktop */}
        <div className="lg:col-span-7 bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#141829] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Game &amp; Pack</th>
                  <th className="p-3.5">Player Info</th>
                  <th className="p-3.5">NPR Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No orders found matching filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const isSelected = selectedOrder?.id === ord.id;
                    return (
                      <tr
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-950/40 border-l-4 border-purple-500' : 'hover:bg-[#14182a]'
                        }`}
                      >
                        <td className="p-3.5 font-mono font-bold text-white">
                          {ord.orderNumber}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{ord.gameName}</span>
                          <span className="text-cyan-300 text-[11px]">{ord.packageName}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-300 text-[11px]">
                          {Object.values(ord.playerInformation || {}).join(' | ') || '—'}
                        </td>
                        <td className="p-3.5 font-gaming font-bold text-white">
                          NPR {ord.finalAmount}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {ord.paymentMethodName}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${getStatusBadge(ord.status)}`}>
                            {ord.status}
                          </span>
                          {ord.isDuplicateTxn && (
                            <span className="block mt-1 text-[9px] text-amber-400 font-bold">
                              ⚠️ Duplicate Txn
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(ord);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 transition-colors"
                            title="Inspect Order"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Inspector & Manual Verification Drawer: 5 columns on desktop */}
        <div className="lg:col-span-5 bg-[#111424] rounded-2xl border border-slate-800 p-5 space-y-5 shadow-2xl">
          {selectedOrder ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-400 font-gaming">
                    Order Inspection
                  </span>
                  <h3 className="font-mono text-base font-bold text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Created: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Duplicate Transaction Warning Banner */}
              {selectedOrder.isDuplicateTxn && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">DUPLICATE TRANSACTION DETECTED!</strong>
                    <span>
                      Reference ID <strong>"{selectedOrder.transactionId}"</strong> was already used on another order. Please verify bank statement carefully before approving.
                    </span>
                  </div>
                </div>
              )}

              {/* Customer & Product Information */}
              <div className="p-3.5 rounded-xl bg-[#141829] border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-cyan-300">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Game &amp; Item:</span>
                  <span className="text-white font-medium">{selectedOrder.gameName} • {selectedOrder.packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Charged:</span>
                  <span className="font-gaming font-bold text-white text-sm">NPR {selectedOrder.finalAmount}</span>
                </div>
              </div>

              {/* In-Game Player ID to Credit */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs space-y-1.5">
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">
                  Target In-Game Player Account
                </span>
                {Object.entries(selectedOrder.playerInformation || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between font-mono text-xs">
                    <span className="text-slate-300 capitalize">{k}:</span>
                    <span className="text-white font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      {v || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Proof & Transaction ID */}
              <div className="p-3.5 rounded-xl bg-[#141829] border border-slate-800 text-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reference ID:</span>
                  <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    {selectedOrder.transactionId || 'Not entered'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Payment Proof Screenshot:</span>
                  {selectedOrder.paymentProofUrl ? (
                    <button
                      type="button"
                      onClick={() => setScreenshotZoom(true)}
                      className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Preview Image</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-slate-500">No image</span>
                  )}
                </div>

                {selectedOrder.paymentProofUrl && (
                  <div
                    onClick={() => setScreenshotZoom(true)}
                    className="w-full h-32 rounded-xl overflow-hidden border border-slate-700 bg-black cursor-pointer relative group"
                  >
                    <img
                      src={selectedOrder.paymentProofUrl}
                      alt="Receipt screenshot"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      Click to Enlarge
                    </div>
                  </div>
                )}
              </div>

              {/* Action Workflow Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-gaming">
                  Manual Workflow Execution
                </span>

                {/* Primary Workflow Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusAction('Payment Verified')}
                    className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Payment</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusAction('Top-up Processing')}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Top-up Processing</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusAction('Completed')}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md disabled:opacity-50 col-span-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Completed (Diamonds/UC Credited)</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusAction('Rejected')}
                    className="p-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Payment</span>
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusAction('Refunded')}
                    className="p-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Process Refund</span>
                  </button>
                </div>

                {/* Internal Admin Note & Customer Message Inputs */}
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Customer-Facing Message (Sent to buyer)
                    </label>
                    <input
                      type="text"
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      placeholder="e.g. UC sent to your Character ID! Enjoy gaming."
                      className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Internal Admin Note (Confidential audit note)
                    </label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Verified with eSewa SMS statement at 14:32"
                      className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs">Select any order from the table to review payment proof &amp; take action.</p>
            </div>
          )}
        </div>

      </div>

      {/* Screenshot Enlarge Modal */}
      {screenshotZoom && selectedOrder?.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setScreenshotZoom(false)}
        >
          <div className="max-w-2xl w-full bg-[#111424] rounded-2xl p-4 border border-slate-700 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Payment Proof Inspection • Ref: {selectedOrder.transactionId}</span>
              <button onClick={() => setScreenshotZoom(false)} className="text-white font-bold">
                Close [×]
              </button>
            </div>
            <img
              src={selectedOrder.paymentProofUrl}
              alt="Payment proof"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
