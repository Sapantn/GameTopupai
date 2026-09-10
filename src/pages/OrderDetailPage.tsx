import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Order, OrderStatus } from '../types';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  QrCode,
  FileText,
  RotateCcw,
  MessageSquare,
  ExternalLink,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { selectedOrderId, setView, addToast } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState(false);

  // Refund request state
  const [refundModal, setRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('Incorrect Package / Double Payment');
  const [refundDesc, setRefundDesc] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchOrder = async () => {
    if (!selectedOrderId) return;
    try {
      const data = await api.getOrderById(selectedOrderId);
      setOrder(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [selectedOrderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading order receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-heading font-bold text-white">Order Not Found</h3>
        <button
          onClick={() => setView('orders')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    addToast('Order number copied!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundDesc.trim()) {
      addToast('Please provide details for your refund request', 'error');
      return;
    }
    setSubmittingRefund(true);
    try {
      const updated = await api.requestRefund(order.id, refundReason, refundDesc.trim());
      setOrder(updated);
      setRefundModal(false);
      addToast('Refund request submitted to Kathmandu finance team', 'success');
    } catch (err: any) {
      addToast(err.message || 'Refund request failed', 'error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const timelineSteps = [
    { label: 'Order Created', key: 'created' },
    { label: 'Payment Submitted', key: 'submitted' },
    { label: 'Payment Verified', key: 'verified' },
    { label: 'Top-up Processing', key: 'processing' },
    { label: 'Completed', key: 'completed' }
  ];

  const getStepProgress = (status: OrderStatus) => {
    switch (status) {
      case 'Pending Payment':
        return 1;
      case 'Payment Submitted':
      case 'Payment Under Review':
        return 2;
      case 'Payment Verified':
        return 3;
      case 'Top-up Processing':
        return 4;
      case 'Completed':
        return 5;
      default:
        return 2;
    }
  };

  const currentStep = getStepProgress(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation & Order ID Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => setView('orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Order Ref:</span>
          <span className="font-mono text-sm font-bold text-white bg-slate-900 border border-slate-700 px-3 py-1 rounded-lg">
            {order.orderNumber}
          </span>
          <button
            onClick={handleCopyOrderNumber}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Copy Order ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-[#111424] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden space-y-6">
        
        {/* Top Status Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-cyan-950/40 via-[#161a32] to-purple-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-gaming uppercase tracking-widest text-cyan-400 font-bold">
              Manual Top-Up Status
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-extrabold text-white">
                {order.status}
              </h1>
              {order.status === 'Completed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : order.status === 'Top-up Processing' ? (
                <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
              ) : (
                <Clock className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recently'}
            </p>
          </div>

          <div className="text-left sm:text-right bg-black/40 border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Total Amount (NPR)
            </span>
            <span className="font-gaming font-extrabold text-2xl text-cyan-400">
              NPR {order.finalAmount}
            </span>
            <span className="text-[11px] text-slate-400 block">
              via {order.paymentMethodName}
            </span>
          </div>
        </div>

        {/* 5-Stage Visual Workflow Timeline */}
        <div className="px-6 sm:px-8 py-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 font-gaming">
            Top-Up Delivery Progress
          </h3>

          <div className="grid grid-cols-5 gap-2 relative">
            {timelineSteps.map((step, idx) => {
              const isDone = idx + 1 <= currentStep;
              const isCurrent = idx + 1 === currentStep;
              return (
                <div key={step.key} className="text-center space-y-2 relative">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    } ${isCurrent ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#111424]' : ''}`}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs block font-semibold leading-tight ${
                      isDone ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer-Facing Message from Admin */}
        {order.customerFacingMessage && (
          <div className="mx-6 sm:mx-8 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-3">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-0.5">Note from Operations Admin:</strong>
              {order.customerFacingMessage}
            </div>
          </div>
        )}

        {/* Order Details & In-Game Account Grid */}
        <div className="px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Game & Package */}
          <div className="p-5 rounded-2xl bg-[#141829] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
              Purchased Product
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Game:</span>
                <span className="font-bold text-white">{order.gameName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Package:</span>
                <span className="font-bold text-cyan-300">{order.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Package Price:</span>
                <span className="font-gaming text-white">NPR {order.packagePrice}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount ({order.promoCode}):</span>
                  <span className="font-gaming">- NPR {order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="text-white">Amount Paid:</span>
                <span className="text-cyan-400 font-gaming">NPR {order.finalAmount}</span>
              </div>
            </div>
          </div>

          {/* Player Information (Character ID, Server) */}
          <div className="p-5 rounded-2xl bg-[#141829] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
              Player Account Details
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(order.playerInformation || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-400 capitalize">{key}:</span>
                  <span className="font-mono font-bold text-cyan-200">{val || '—'}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Customer Phone:</span>
                <span className="font-mono text-white">{order.customerPhone}</span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer Email:</span>
                  <span className="text-white">{order.customerEmail}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Payment Verification Proof Section */}
        <div className="px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#141829] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
              Payment Submission Details
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold text-white">{order.paymentMethodName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference / Txn ID:</span>
                <span className="font-mono font-bold text-purple-300">
                  {order.transactionId || 'Not submitted'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Sent:</span>
                <span className="font-gaming font-bold text-white">
                  NPR {order.paymentSubmittedAmount || order.finalAmount}
                </span>
              </div>
              {order.customerNote && (
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="text-slate-400 block text-[10px] uppercase">Your Note:</span>
                  {order.customerNote}
                </div>
              )}
            </div>
          </div>

          {/* Screenshot Preview */}
          <div className="p-5 rounded-2xl bg-[#141829] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
                Payment Screenshot
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Proof uploaded from your eSewa/Khalti app
              </p>
            </div>

            {order.paymentProofUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={order.paymentProofUrl}
                  alt="Payment receipt proof"
                  onClick={() => setScreenshotModal(true)}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-700 cursor-pointer hover:border-cyan-400 transition-colors"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => setScreenshotModal(true)}
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Fullscreen Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Verified against bank logs
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-500 text-center">
                No screenshot uploaded
              </div>
            )}
          </div>
        </div>

        {/* Detailed Timeline Events History */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="px-6 sm:px-8 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-gaming">
              Chronological Audit Trail
            </h4>
            <div className="space-y-2">
              {order.timeline.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#141829]/60 border border-slate-800/80 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{evt.status}</span>
                      {evt.performedBy && (
                        <span className="text-[10px] text-slate-500">
                          by {evt.performedBy}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs">{evt.note}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Actions Footer */}
        <div className="p-6 bg-[#0c0e1a] border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {order.status !== 'Refunded' && order.status !== 'Cancelled' && (
              <button
                onClick={() => setRefundModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Refund / Cancellation</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/9779801234567?text=Hi%20GamingZone,%20I%20have%20a%20question%20regarding%20my%20order%20${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Support for this Order</span>
            </a>
          </div>
        </div>

      </div>

      {/* Screenshot Zoom Modal */}
      {screenshotModal && order.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setScreenshotModal(false)}
        >
          <div className="max-w-2xl w-full bg-[#101424] rounded-2xl overflow-hidden border border-slate-700 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Payment Proof • Reference: {order.transactionId}</span>
              <button onClick={() => setScreenshotModal(false)} className="text-white font-bold">
                Close [×]
              </button>
            </div>
            <img
              src={order.paymentProofUrl}
              alt="Full receipt"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0f121e] border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-heading font-bold text-white text-lg">
                Request Order Refund
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Refunds are reviewed manually by our finance team in Kathmandu. If approved, funds will be returned to your eSewa/Khalti wallet within 2–4 hours.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason for Refund
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Incorrect Package / Double Payment">Incorrect Package / Double Payment</option>
                  <option value="Entered Wrong Player ID (Before Top-Up)">Entered Wrong Player ID (Before Top-Up)</option>
                  <option value="Delivery Delay Exceeded 30 Mins">Delivery Delay Exceeded 30 Mins</option>
                  <option value="Other Issue">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Explain details &amp; Wallet ID to receive refund
                </label>
                <textarea
                  rows={3}
                  value={refundDesc}
                  onChange={(e) => setRefundDesc(e.target.value)}
                  placeholder="e.g. Please refund NPR 499 to eSewa 9841234567..."
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                >
                  {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setRefundModal(false)}
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
