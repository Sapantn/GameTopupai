import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Order, OrderStatus } from '../types';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { user, navigateToOrder, setOrderLookupOpen, setAuthModalOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getMyOrders(user?.id);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

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

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter((ord) => {
    const matchesStatus =
      filterStatus === 'ALL' || ord.status === filterStatus;
    const matchesSearch =
      !search ||
      (ord.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (ord.gameName || '').toLowerCase().includes(search.toLowerCase()) ||
      (ord.transactionId && ord.transactionId.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalSpent = orders
    .filter(o => o.status === 'Completed' || o.status === 'Top-up Processing' || o.status === 'Payment Verified')
    .reduce((acc, curr) => acc + curr.finalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#101426] to-[#171c33] border border-cyan-500/30 rounded-2xl p-6 sm:p-8">
        <div>
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            Customer Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mt-1">
            My Top-Up Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track manual payment verification status and view top-up receipts.
          </p>
        </div>

        {/* Quick Stat Tiles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-slate-800 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Orders
            </span>
            <span className="font-heading font-bold text-lg text-white">
              {orders.length}
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-slate-800 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Completed
            </span>
            <span className="font-heading font-bold text-lg text-emerald-400">
              {orders.filter(o => o.status === 'Completed').length}
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-left">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block">
              Total Spent (NPR)
            </span>
            <span className="font-gaming font-extrabold text-lg text-white">
              NPR {totalSpent}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'Payment Submitted', 'Payment Verified', 'Top-up Processing', 'Completed', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Order ID / Game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121627] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#111424] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#111424] rounded-2xl border border-slate-800 p-8 space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-heading font-bold text-white">No orders found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || filterStatus !== 'ALL'
              ? 'No orders match your filter criteria.'
              : 'You haven’t placed any top-up orders yet.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => setOrderLookupOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300"
            >
              Track by Order ID
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => navigateToOrder(ord.id)}
              className="bg-[#111424] hover:bg-[#13172b] rounded-2xl border border-slate-800 hover:border-cyan-500/50 p-5 transition-all cursor-pointer shadow-lg space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-white">
                      {ord.orderNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Placed on {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center sm:text-right justify-between sm:justify-end gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Amount Paid
                    </span>
                    <span className="font-gaming font-extrabold text-base text-cyan-400">
                      NPR {ord.finalAmount}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToOrder(ord.id);
                    }}
                    className="p-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500 text-slate-300 group-hover:text-black transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items & Player Details */}
              <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{ord.gameName}</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-cyan-300 font-medium">{ord.packageName}</span>
                </div>

                <div className="flex items-center gap-4 text-slate-400">
                  <span>
                    Player ID:{' '}
                    <strong className="text-white font-mono">
                      {Object.values(ord.playerInformation).join(' - ') || 'N/A'}
                    </strong>
                  </span>
                  <span>
                    Method: <strong className="text-white">{ord.paymentMethodName}</strong>
                  </span>
                </div>
              </div>

              {/* Customer message or latest timeline note */}
              {ord.customerFacingMessage && (
                <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-300 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Message from GamingZone Team:</strong> {ord.customerFacingMessage}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
