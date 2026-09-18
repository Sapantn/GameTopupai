import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  orderInfo?: {
    id: string;
    status: string;
    gameName: string;
    amount: number;
    paymentMethod: string;
  };
}

const INITIAL_SUGGESTIONS = [
  '🔥 How to buy PUBG UC?',
  '💎 Free Fire Diamonds',
  '💳 Payment via eSewa & Khalti',
  '📦 Check my order status',
  '⏱️ Delivery speed guarantee'
];

export const ChatbotWidget: React.FC = () => {
  const { chatbotOpen, setChatbotOpen, user, navigateToOrder, view } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: "Namaste gamer! 🎮 I'm **ZoneBot**, your 24/7 AI gaming assistant for **GamingZone Nepal**.\n\nAsk me anything about **PUBG UC, Free Fire Diamonds, MLBB**, local payments (**eSewa, Khalti, Fonepay**), or drop your **Order ID** to track delivery live!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [showPromptBubble, setShowPromptBubble] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatbotOpen) {
      scrollToBottom();
      setHasUnreadNotification(false);
      setShowPromptBubble(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [chatbotOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, newMsg];
    setMessages(nextMessages);
    setInputText('');
    setIsTyping(true);

    try {
      // Format history for server
      const history = nextMessages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await api.sendChatMessage(text, history, user?.id);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderInfo: res.orderInfo
      };

      setMessages(prev => [...prev, botMsg]);
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'model',
        text: "I couldn't reach the server right now. For urgent help, reach our Kathmandu team via WhatsApp at **+977 9841000001** or visit our **Support** page.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: "Chat cleared! How can I assist you with top-ups, games, or payment methods today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSuggestions(INITIAL_SUGGESTIONS);
  };

  // Helper to render markdown bold and line breaks simply and safely
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Bullet points
          const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('* ');
          const cleanLine = isBullet ? line.replace(/^([•\-\*]\s*)/, '') : line;

          // Parse **bold** parts
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-200">
                <span className="text-cyan-400 font-bold leading-none mt-1">&bull;</span>
                <div>{formattedLine}</div>
              </div>
            );
          }

          return <p key={idx} className="text-slate-200">{formattedLine}</p>;
        })}
      </div>
    );
  };

  // Do not show on Admin view to keep admin clean and focused
  if (view === 'admin') {
    return null;
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end">
        
        {/* Welcome Prompt Bubble when closed */}
        {!chatbotOpen && showPromptBubble && (
          <div className="mb-2 max-w-[240px] p-3 rounded-2xl bg-[#121629]/95 border border-cyan-500/40 text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 flex items-start gap-2 text-slate-200">
            <Bot className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-cyan-300">Need help?</span> Ask our 24/7 AI about UC, Diamonds & eSewa payments!
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPromptBubble(false);
              }}
              className="text-slate-400 hover:text-white"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toggle Button */}
        <button
          id="btn-open-chatbot"
          onClick={() => setChatbotOpen(!chatbotOpen)}
          className={`relative group p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
            chatbotOpen
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rotate-90 border border-slate-600'
              : 'bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 text-white hover:shadow-cyan-500/30 hover:scale-105 border border-cyan-400/40'
          }`}
          aria-label={chatbotOpen ? 'Close AI Chat' : 'Open AI Chat'}
          title={chatbotOpen ? 'Close AI Assistant' : 'Chat with GamingZone AI Assistant'}
        >
          {chatbotOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              {/* Online Pulse Indicator */}
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 -mt-0.5 -mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0a0c16]"></span>
              </span>

              {/* Ping notification dot */}
              {hasUnreadNotification && (
                <span className="absolute -top-1 -left-1 flex h-3 w-3">
                  <span className="inline-flex rounded-full h-3 w-3 bg-cyan-400 border border-black"></span>
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Floating Chatbot Window */}
      {chatbotOpen && (
        <div
          id="modal-chatbot-window"
          className="fixed bottom-24 md:bottom-24 right-3 md:right-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] md:w-[420px] h-[550px] max-h-[80vh] flex flex-col rounded-3xl bg-[#0d1021] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#141a36] via-[#11172f] to-[#18112e] px-4 py-3.5 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 text-cyan-300">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0d1021]"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-wide">ZoneBot AI</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Instant Game & Order Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChatbotOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Close chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-[#121730]/70 px-4 py-1.5 text-[10px] text-slate-400 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
              <span>Manual delivery: 5–15 mins (Kathmandu NST)</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>100% Safe</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg'
                      : 'bg-[#151a33] border border-slate-800/90 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Order Preview Card if included */}
                  {msg.orderInfo && (
                    <div className="mt-3 p-2.5 rounded-xl bg-[#0c0f20] border border-cyan-500/40 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>#{msg.orderInfo.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                            msg.orderInfo.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : msg.orderInfo.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                          }`}
                        >
                          {msg.orderInfo.status}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        {msg.orderInfo.gameName} &bull; NPR {msg.orderInfo.amount} ({msg.orderInfo.paymentMethod})
                      </div>
                      <button
                        onClick={() => {
                          setChatbotOpen(false);
                          navigateToOrder(msg.orderInfo!.id);
                        }}
                        className="mt-1 w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Open Order Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[9px] ${
                      msg.role === 'user' ? 'text-cyan-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-[#151a33] border border-slate-800 text-slate-400 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[10px] text-slate-400 ml-1">ZoneBot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-[#0c0f20]/90 border-t border-slate-800/80 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(suggestion)}
                disabled={isTyping}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-950 hover:border-cyan-500/40 border border-slate-700/60 text-slate-300 hover:text-cyan-300 text-[11px] transition-all disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#0a0c18] border-t border-cyan-500/20 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about UC, eSewa, or order #..."
                disabled={isTyping}
                className="flex-1 bg-[#141830] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-900/30"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>Powered by Gemini AI &bull; Nepal Time (8AM–11:30PM)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
