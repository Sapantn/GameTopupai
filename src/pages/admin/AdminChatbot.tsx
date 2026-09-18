import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { ChatbotTrigger } from '../../types';
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Hash,
  Eye,
  Play,
  RotateCcw,
  ArrowUpDown,
  MessageSquare,
  HelpCircle,
  Tag,
  AlertCircle
} from 'lucide-react';

export const AdminChatbot: React.FC = () => {
  const { user, addToast } = useApp();
  const [triggers, setTriggers] = useState<ChatbotTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<ChatbotTrigger | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [triggerInput, setTriggerInput] = useState('');
  const [matchType, setMatchType] = useState<'contains' | 'exact'>('contains');
  const [reply, setReply] = useState('');
  const [suggestionInput, setSuggestionInput] = useState('');
  const [priority, setPriority] = useState<number>(5);
  const [active, setActive] = useState(true);
  const [formTab, setFormTab] = useState<'edit' | 'preview'>('edit');

  // Interactive Test Simulator State
  const [testMessage, setTestMessage] = useState('');
  const [simulatedMatch, setSimulatedMatch] = useState<{
    matched: boolean;
    rule?: ChatbotTrigger;
    matchedKeyword?: string;
  } | null>(null);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const data = await api.getChatbotTriggers(false, user?.id);
      setTriggers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load chatbot trigger rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const openNewModal = () => {
    setEditingTrigger(null);
    setName('');
    setTriggerInput('');
    setMatchType('contains');
    setReply('');
    setSuggestionInput('');
    setPriority(5);
    setActive(true);
    setFormTab('edit');
    setModalOpen(true);
  };

  const openEditModal = (t: ChatbotTrigger) => {
    setEditingTrigger(t);
    setName(t.name);
    setTriggerInput(t.triggers.join(', '));
    setMatchType(t.matchType || 'contains');
    setReply(t.reply);
    setSuggestionInput((t.suggestions || []).join(', '));
    setPriority(t.priority || 5);
    setActive(t.active);
    setFormTab('edit');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a descriptive rule name', 'error');
      return;
    }

    const parsedTriggers = triggerInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (parsedTriggers.length === 0) {
      addToast('Please enter at least one trigger keyword or phrase', 'error');
      return;
    }

    if (!reply.trim()) {
      addToast('Please enter the response message the chatbot will send', 'error');
      return;
    }

    const parsedSuggestions = suggestionInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const payload: Partial<ChatbotTrigger> = {
        name: name.trim(),
        triggers: parsedTriggers,
        matchType,
        reply: reply.trim(),
        suggestions: parsedSuggestions,
        priority: Number(priority) || 5,
        active
      };

      if (editingTrigger) {
        await api.updateChatbotTrigger(editingTrigger.id, payload, user?.id);
        addToast(`Trigger "${name}" updated successfully`, 'success');
      } else {
        await api.createChatbotTrigger(payload, user?.id);
        addToast(`Trigger "${name}" created successfully`, 'success');
      }

      setModalOpen(false);
      fetchTriggers();
    } catch (err: any) {
      addToast(err.message || 'Failed to save chatbot trigger', 'error');
    }
  };

  const handleToggle = async (t: ChatbotTrigger) => {
    try {
      await api.toggleChatbotTrigger(t.id, user?.id);
      addToast(`Trigger "${t.name}" is now ${t.active ? 'disabled' : 'active'}`, 'info');
      fetchTriggers();
    } catch (err: any) {
      addToast('Failed to toggle trigger status', 'error');
    }
  };

  const handleDelete = async (t: ChatbotTrigger) => {
    if (!window.confirm(`Delete trigger rule "${t.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteChatbotTrigger(t.id, user?.id);
      addToast(`Trigger "${t.name}" deleted`, 'success');
      fetchTriggers();
    } catch (err: any) {
      addToast('Failed to delete trigger', 'error');
    }
  };

  // Run Test Simulator
  const runSimulation = () => {
    const raw = testMessage.toLowerCase().trim();
    if (!raw) {
      setSimulatedMatch(null);
      return;
    }

    const activeRules = triggers.filter(t => t.active).sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of activeRules) {
      for (const trig of rule.triggers) {
        const cleanTrig = trig.toLowerCase().trim();
        if (!cleanTrig) continue;

        if (rule.matchType === 'exact') {
          if (raw === cleanTrig) {
            setSimulatedMatch({ matched: true, rule, matchedKeyword: trig });
            return;
          }
        } else {
          if (raw.includes(cleanTrig)) {
            setSimulatedMatch({ matched: true, rule, matchedKeyword: trig });
            return;
          }
        }
      }
    }

    setSimulatedMatch({ matched: false });
  };

  // Filter triggers
  const filteredTriggers = triggers.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.triggers.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.reply.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && t.active;
    if (statusFilter === 'inactive') return matchesSearch && !t.active;
    return matchesSearch;
  });

  const totalHits = triggers.reduce((acc, curr) => acc + (curr.hitCount || 0), 0);
  const activeCount = triggers.filter(t => t.active).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-extrabold text-white flex items-center gap-2.5">
              <Bot className="w-7 h-7 text-cyan-400" />
              <span>AI Chatbot Triggers &amp; Auto-Responses</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase">
              ZoneBot AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure custom keyword triggers and immediate replies. When a customer sends matching text, ZoneBot sends your configured message instantly.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Trigger</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Rules</span>
            <p className="text-lg font-bold text-white leading-none mt-0.5">{triggers.length}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Triggers</span>
            <p className="text-lg font-bold text-emerald-400 leading-none mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Times Triggered</span>
            <p className="text-lg font-bold text-indigo-300 leading-none mt-0.5">{totalHits}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111424] border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">AI Integration</span>
            <p className="text-xs font-bold text-purple-300 leading-none mt-0.5">Gemini 3.8 Flash</p>
          </div>
        </div>
      </div>

      {/* Interactive Trigger Simulator */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12162a] via-[#101324] to-[#0c0f1c] border border-cyan-500/30 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Trigger Test Simulator</span>
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Type sample customer messages to verify matching rules in real-time
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSimulation()}
              placeholder="e.g. 'Can I get a refund?', 'discord server link', 'how long to deliver uc?'"
              className="w-full bg-[#0a0c16] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={runSimulation}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <span>Test Trigger</span>
          </button>
          {testMessage && (
            <button
              onClick={() => {
                setTestMessage('');
                setSimulatedMatch(null);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs shrink-0"
              title="Reset test"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Simulator Result */}
        {simulatedMatch && (
          <div
            className={`p-3.5 rounded-xl border text-xs transition-all ${
              simulatedMatch.matched
                ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}
          >
            {simulatedMatch.matched && simulatedMatch.rule ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-bold text-white">
                      Matched Rule: "{simulatedMatch.rule.name}"
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 font-mono text-[10px]">
                      Trigger word: "{simulatedMatch.matchedKeyword}"
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Priority: {simulatedMatch.rule.priority}
                    </span>
                  </div>
                </div>

                <div className="bg-[#090b14]/90 p-3 rounded-lg border border-cyan-500/20 whitespace-pre-line font-mono text-[11px] text-cyan-100">
                  {simulatedMatch.rule.reply}
                </div>

                {simulatedMatch.rule.suggestions && simulatedMatch.rule.suggestions.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Suggested Pills:</span>
                    {simulatedMatch.rule.suggestions.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  No custom trigger rule matched this query. ZoneBot will route this query to <strong>Gemini 3.8 Flash AI</strong> using store catalog &amp; FAQ knowledge!
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search triggers by name, keyword, or reply text..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#111424] border border-slate-800 focus:border-cyan-500 rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({triggers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Disabled ({triggers.length - activeCount})
          </button>
        </div>
      </div>

      {/* Triggers List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading chatbot trigger rules...
        </div>
      ) : filteredTriggers.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111424] border border-slate-800 text-center space-y-3">
          <Bot className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No trigger rules found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No rules matched your search query. Try different terms.'
              : 'Create your first custom chatbot trigger so ZoneBot can send specific answers when keywords are detected.'}
          </p>
          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Trigger</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTriggers.map(t => (
            <div
              key={t.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                t.active
                  ? 'bg-[#111424] border-slate-800 hover:border-slate-700'
                  : 'bg-[#0e101c] border-slate-850 opacity-75'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left info */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                      Priority {t.priority || 5}
                    </span>
                    <h3 className="font-bold text-white text-sm truncate">{t.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        t.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {t.active ? 'Active' : 'Disabled'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
                      {t.matchType === 'exact' ? 'Exact Match Only' : 'Contains Keywords'}
                    </span>
                    {t.hitCount !== undefined && t.hitCount > 0 && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {t.hitCount} automated replies sent
                      </span>
                    )}
                  </div>

                  {/* Trigger Keywords Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      Triggers:
                    </span>
                    {t.triggers.map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  {/* Reply Message Box */}
                  <div className="bg-[#090b14] p-3 rounded-xl border border-slate-800/80 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {t.reply}
                  </div>

                  {/* Suggestions Chips */}
                  {t.suggestions && t.suggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Suggested Options:</span>
                      {t.suggestions.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] border border-slate-700"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex sm:flex-row lg:flex-col items-center gap-2 self-end lg:self-start shrink-0">
                  <button
                    onClick={() => handleToggle(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      t.active
                        ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={t.active ? 'Disable trigger' : 'Enable trigger'}
                  >
                    {t.active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(t)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(t)}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Trigger Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0f1220] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-white text-base">
                    {editingTrigger ? 'Edit Chatbot Trigger Rule' : 'Create New Chatbot Trigger'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Define keywords that trigger ZoneBot to reply with this specific message
                  </p>
                </div>
              </div>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFormTab('edit')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    formTab === 'edit' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('preview')}
                  className={`px-3 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                    formTab === 'preview' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>

            {formTab === 'edit' ? (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Rule Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rule Name &amp; Purpose <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Discord Community Link, Cancellation Policy, Steam Gift Card Info"
                    className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Trigger Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Trigger Keywords / Phrases <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Separate multiple keywords with commas</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={triggerInput}
                    onChange={e => setTriggerInput(e.target.value)}
                    placeholder="e.g. discord, community, join group, viber group, chat group"
                    className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-mono placeholder-slate-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {triggerInput
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                      .map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Match Type & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Matching Logic
                    </label>
                    <select
                      value={matchType}
                      onChange={e => setMatchType(e.target.value as 'contains' | 'exact')}
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="contains">Contains Keyword (Recommended - anywhere in sentence)</option>
                      <option value="exact">Exact Match (Message must exactly equal keyword)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Rule Priority (1–20)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={priority}
                      onChange={e => setPriority(Number(e.target.value))}
                      className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Higher numbers are evaluated first</span>
                  </div>
                </div>

                {/* Reply Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Chatbot Reply Message <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Supports markdown formatting &amp; bullets</span>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder={`e.g. 🎮 **Join the GamingZone Nepal Gamer Community!**\n\n• Discord: https://discord.gg/gamingzonenp\n• WhatsApp: +977 9841000001\n\nSee you inside!`}
                    className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none font-mono leading-relaxed"
                  />
                </div>

                {/* Quick Reply Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Follow-up Suggestion Chips (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    value={suggestionInput}
                    onChange={e => setSuggestionInput(e.target.value)}
                    placeholder="e.g. Browse Games, Payment Methods, Track Order"
                    className="w-full bg-[#090b14] border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                  <span className="text-xs font-semibold text-slate-300">
                    Enable this trigger immediately for customer chat
                  </span>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <span>{editingTrigger ? 'Save Changes' : 'Create Trigger'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Live Preview Mode */
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  This is exactly how ZoneBot AI will render this answer inside the customer widget:
                </div>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#090b14] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">ZoneBot AI</span>
                    <span className="text-[10px] text-cyan-400 ml-auto">Automated Reply</span>
                  </div>

                  <div className="bg-[#12162a] p-3 rounded-xl border border-cyan-500/20 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {reply || 'Type your message in the editor to preview it here.'}
                  </div>

                  {suggestionInput && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestionInput
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full bg-slate-800 border border-cyan-500/30 text-[10px] text-cyan-300 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormTab('edit')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
                  >
                    Back to Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
