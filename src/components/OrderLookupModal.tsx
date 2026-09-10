import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Order } from '../types';
import {
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

export const OrderLookupModal: React.FC = () => {
  const { orderLookupOpen, setOrderLookupOpen, navigateToOrder } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!orderLookupOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) {
      setError('Please enter your Order ID (e.g. GZ-20260910-000101) or Phone Number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.checkOrder(q);
      setResults(data);
      if (data.length === 0) {
        setError('No order found matching your search. Please check the Order ID or contact support.');
      }
    } catch (err: any) {
      setError('Failed to search order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
      case 'Rejected':
      case 'Cancelled':
        return 'bg-rose-950 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-xl bg-[#0f121e] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-purple-950/40">
          <div>
            <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Check Top-Up Order Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status tracking for manual Nepal payments
            </p>
          </div>
          <button
            onClick={() => setOrderLookupOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. GZ-20260910-000101) or Phone"
                className="w-full bg-[#141829] border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                'Track'
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>Quick test IDs:</span>
            <button
              type="button"
              onClick={() => { setQuery('GZ-20260910-000101'); }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono"
            >
              GZ-20260910-000101
            </button>
            <button
              type="button"
              onClick={() => { setQuery('GZ-20260910-000102'); }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono"
            >
              GZ-20260910-000102
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {results && results.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Found {results.length} order{results.length > 1 ? 's' : ''}:
              </p>
              {results.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-[#131726] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {ord.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-300 font-medium mt-1">
                        {ord.gameName} • {ord.packageName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white font-gaming">
                        NPR {ord.finalAmount}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Via {ord.paymentMethodName}
                      </p>
                    </div>
                  </div>

                  {/* Player info summary */}
                  <div className="p-2.5 rounded-lg bg-black/40 text-xs text-slate-300 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Player Details</span>
                      <span className="font-mono text-cyan-200">
                        {Object.entries(ord.playerInformation).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Reference ID</span>
                      <span className="font-mono text-purple-200">
                        {ord.transactionId || 'Payment Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Latest Timeline Event */}
                  {ord.timeline && ord.timeline.length > 0 && (
                    <div className="text-xs text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/80">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-200">Latest update:</strong> {ord.timeline[ord.timeline.length - 1].note}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setOrderLookupOpen(false);
                        navigateToOrder(ord.id);
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <span>Open Full Order Receipt & Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
