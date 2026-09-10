import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { SupportTicket } from '../../types';
import { MessageSquare, Send, CheckCircle2, Clock, AlertCircle, User, Phone, Check } from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const { user, addToast } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await api.getSupportTickets();
      const list = Array.isArray(data) ? data : [];
      setTickets(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
      } else if (selectedTicket) {
        const fresh = list.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      await api.addTicketMessage(selectedTicket.id, {
        senderRole: 'AGENT',
        senderName: `${user?.name || 'Kathmandu Support'} (Staff)`,
        message: replyText.trim()
      });
      setReplyText('');
      addToast('Reply sent to customer', 'success');
      fetchTickets();
    } catch (err) {
      addToast('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    try {
      await api.updateTicketStatus(selectedTicket.id, newStatus);
      addToast(`Ticket status changed to ${newStatus}`, 'info');
      fetchTickets();
    } catch (err) {
      addToast('Failed to update ticket status', 'error');
    }
  };

  const cannedReplies = [
    'Your payment has been manually verified in our eSewa portal. Top-up in progress!',
    'The Character ID entered is invalid or from a different region. Please reply with correct ID.',
    'Could you please upload the full screenshot showing the 16-digit Reference Code?',
    'Top-up successfully dispatched to your account! Thank you for choosing GamingZone Nepal.'
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Support Desk &amp; Customer Tickets
          </h2>
          <p className="text-xs text-slate-400">
            Communicate with customers regarding payment receipts, wrong IDs, and refund resolutions.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          Refresh Tickets
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#101322] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        
        {/* Tickets List */}
        <div className="lg:col-span-4 border-r border-slate-800 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
            <span className="font-heading font-bold text-xs uppercase text-slate-300">
              Active Inquiries ({tickets.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  selectedTicket?.id === t.id
                    ? 'bg-purple-950/50 border border-purple-500/40 shadow'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">
                    {t.ticketNumber}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                    t.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-purple-950 text-purple-300 border-purple-500/40'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                  {t.subject}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>{t.customerName}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation & Controls */}
        <div className="lg:col-span-8 flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-[#131728] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-purple-400 font-bold">
                      • {selectedTicket.gameName || 'General'}
                    </span>
                    {selectedTicket.orderId && (
                      <span className="font-mono text-xs bg-slate-900 px-2 py-0.5 rounded text-cyan-300 border border-slate-700">
                        Order: {selectedTicket.orderId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>User: <strong>{selectedTicket.customerName}</strong></span>
                    <span>Phone: <strong className="font-mono text-cyan-300">{selectedTicket.customerPhone}</strong></span>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e: any) => handleStatusChange(e.target.value)}
                    className="bg-[#0f121e] border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="OPEN">Status: OPEN</option>
                    <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                    <option value="WAITING_ON_CUSTOMER">Status: WAITING ON CUSTOMER</option>
                    <option value="RESOLVED">Status: RESOLVED</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d101c]">
                {(selectedTicket.messages || []).map((msg, i) => {
                  const isStaff = msg.senderRole === 'AGENT';
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 max-w-[85%] ${
                        isStaff ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isStaff
                            ? 'bg-purple-900 border border-purple-500/40 text-purple-300'
                            : 'bg-cyan-900 border border-cyan-500/40 text-cyan-300'
                        }`}
                      >
                        {isStaff ? 'GZ' : 'U'}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          isStaff
                            ? 'bg-purple-950/60 border border-purple-500/30 text-purple-100 rounded-tr-none'
                            : 'bg-[#15192c] border border-slate-700 text-slate-200 rounded-tl-none'
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

              {/* Quick Canned Responses */}
              <div className="px-4 py-2 border-t border-slate-800 bg-[#101322] flex gap-2 overflow-x-auto">
                <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 self-center">
                  Quick Reply:
                </span>
                {cannedReplies.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyText(r)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950 text-[10px] text-slate-300 hover:text-purple-300 border border-slate-800 whitespace-nowrap transition-colors"
                  >
                    {r.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-slate-800 bg-[#131728] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official response to customer..."
                  className="flex-1 bg-[#0d101c] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a ticket to reply.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
