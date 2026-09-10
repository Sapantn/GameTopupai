import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { SupportTicket, SupportMessage } from '../types';
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  HelpCircle,
  ShieldCheck,
  User
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { user, addToast } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // New ticket form
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [game, setGame] = useState('PUBG Mobile');
  const [message, setMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Reply in selected ticket
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.getSupportTickets(user?.id);
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      } else if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('Please fill out ticket subject and message', 'error');
      return;
    }
    setSubmittingTicket(true);
    try {
      const created = await api.createSupportTicket({
        userId: user?.id || 'usr-guest-' + Date.now(),
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || 'customer@gamingzone.com.np',
        customerPhone: user?.phone || '+977 9800000000',
        orderId: orderNumber.trim() || undefined,
        gameName: game,
        subject: subject.trim(),
        message: message.trim()
      });
      setTickets(prev => [created, ...prev]);
      setSelectedTicket(created);
      setNewTicketModal(false);
      setSubject('');
      setMessage('');
      setOrderNumber('');
      addToast('Support ticket opened! Our Kathmandu team is reviewing it.', 'success');
    } catch (err: any) {
      addToast('Failed to create ticket', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await api.addTicketMessage(selectedTicket.id, {
        senderRole: user?.role === 'CUSTOMER' ? 'CUSTOMER' : 'AGENT',
        senderName: user?.name || 'Customer',
        message: replyText.trim()
      });
      setReplyText('');
      await fetchTickets();
      addToast('Reply sent', 'info');
    } catch (err) {
      addToast('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      case 'IN_PROGRESS':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'WAITING_ON_CUSTOMER':
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
      case 'RESOLVED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'CLOSED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-[#12162a] to-cyan-950/60 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            Customer Helpdesk • Kathmandu, Nepal
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mt-1">
            GamingZone Support Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Need assistance with an order, payment verification, or wrong Player ID? Our support agents are active 7 days a week.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href="https://wa.me/9779801234567"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 hover:bg-emerald-900 transition-colors shadow-lg"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Instant WhatsApp Chat</span>
          </a>
          <button
            onClick={() => setNewTicketModal(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-heading font-bold text-xs flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Open Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp Direct</span>
            <p className="text-xs font-bold text-white font-mono">+977 9801234567</p>
            <span className="text-[10px] text-emerald-400">Response &lt; 5 mins</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-500/40 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Phone Support</span>
            <p className="text-xs font-bold text-white font-mono">01-4456789 / 9841000000</p>
            <span className="text-[10px] text-slate-400">8 AM – 11:30 PM NST</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Official Email</span>
            <p className="text-xs font-bold text-white">support@gamingzone.com.np</p>
            <span className="text-[10px] text-slate-400">Tickets &amp; Receipts</span>
          </div>
        </div>
      </div>

      {/* Ticket Helpdesk Interactive Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#101322] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* Left Column: Tickets List */}
        <div className="border-r border-slate-800 flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#131728]">
            <h3 className="font-heading font-bold text-white text-sm">
              Your Support Tickets
            </h3>
            <span className="text-xs text-slate-400">
              {(tickets || []).length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-slate-800/40">
            {(tickets || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No tickets opened yet. Click "Open Support Ticket" above if you need help with any order.
              </div>
            ) : (
              (tickets || []).map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`pt-2 first:pt-0 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? 'bg-cyan-950/40 border border-cyan-500/40 shadow'
                      : 'hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {t.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border shrink-0 ${getTicketStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-cyan-300 mt-1 line-clamp-1">
                    {t.subject}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span>{t.gameName || 'General Query'}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 2 Columns: Active Ticket Conversation */}
        <div className="lg:col-span-2 flex flex-col h-[520px]">
          {selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getTicketStatusBadge(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {selectedTicket.orderId && (
                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase">Linked Order</span>
                    <span className="font-mono text-cyan-400 font-semibold">
                      {selectedTicket.orderId}
                    </span>
                  </div>
                )}
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d101c]">
                {(selectedTicket.messages || []).map((msg, i) => {
                  const isAgent = msg.senderRole === 'AGENT';
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[85%] ${
                        isAgent ? 'mr-auto' : 'ml-auto flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAgent
                            ? 'bg-purple-900 border border-purple-500/40 text-purple-300'
                            : 'bg-cyan-900 border border-cyan-500/40 text-cyan-300'
                        }`}
                      >
                        {isAgent ? 'GZ' : 'U'}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          isAgent
                            ? 'bg-[#15192c] border border-purple-500/30 text-slate-200 rounded-tl-none'
                            : 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
                          <span className="font-semibold text-white">{msg.senderName}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-slate-800 bg-[#131728] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message to Kathmandu support desk..."
                  className="flex-1 bg-[#0d101c] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a ticket to view conversation history.
            </div>
          )}
        </div>

      </div>

      {/* New Support Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0f121e] border border-cyan-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Open Support Ticket
            </h3>
            <p className="text-xs text-slate-400">
              Submit your inquiry and our Kathmandu agents will review and reply.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Payment made via eSewa but order pending"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Related Game
                  </label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="PUBG Mobile">PUBG Mobile</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="Mobile Legends">Mobile Legends</option>
                    <option value="Genshin Impact">Genshin Impact</option>
                    <option value="Roblox">Roblox</option>
                    <option value="Valorant">Valorant</option>
                    <option value="General Query">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="GZ-20260910-XXXX"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Describe Your Issue <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue with reference ID or player details..."
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
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
