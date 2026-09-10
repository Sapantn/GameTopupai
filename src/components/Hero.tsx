import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Gamepad2,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  FileSearch,
  CheckCircle2
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { setView, setOrderLookupOpen } = useApp();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0a0c14] via-[#0e1220] to-[#0a0c14] border-b border-slate-800/80 cyber-grid">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          
          {/* Subtle Cyber Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-gaming uppercase tracking-widest text-[11px]">
              NEPAL'S #1 VERIFIED TOP-UP CENTER
            </span>
          </div>

          {/* Main Hero Branding */}
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white uppercase">
              GAMING<span className="text-cyan-400">ZONE</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">
                TOP-UP CENTER
              </span>
            </h1>
            <p className="font-heading font-bold text-xl sm:text-2xl text-slate-200">
              Fast, Easy &amp; Secure Game Top-Ups
            </p>
          </div>

          {/* Subtext */}
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Top up your favorite games with convenient payment options in Nepal.
            Pay in <strong>NPR</strong> via <strong>eSewa, Khalti, Fonepay, IME Pay, or Bank Transfer</strong>.
            All orders are processed manually with 100% account safety guaranteed.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setView('games');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-black font-heading font-bold text-sm tracking-wider uppercase hover:brightness-110 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Browse Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setOrderLookupOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-heading font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <FileSearch className="w-4 h-4 text-cyan-400" />
              <span>Check Order</span>
            </button>
          </div>

          {/* Feature Badges */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-[#111524]/80 border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">5 – 15 Mins</p>
                <p className="text-[11px] text-slate-400">Manual Delivery</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111524]/80 border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-950 flex items-center justify-center shrink-0 border border-purple-500/30">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Safe Top-Up</p>
                <p className="text-[11px] text-slate-400">No Passwords Needed</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111524]/80 border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <span className="font-gaming font-bold text-emerald-400 text-xs">NPR</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Nepalese Rupee</p>
                <p className="text-[11px] text-slate-400">Best Official Rates</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111524]/80 border border-slate-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-950 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Local Wallets</p>
                <p className="text-[11px] text-slate-400">eSewa &bull; Khalti &bull; Fonepay</p>
              </div>
            </div>
          </div>

          {/* Payment Partner Pills */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 mr-1">Accepted Payment:</span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
              eSewa
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-950/50 border border-purple-500/30 text-purple-300 font-semibold text-[11px]">
              Khalti
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-950/50 border border-rose-500/30 text-rose-300 font-semibold text-[11px]">
              Fonepay QR
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-950/50 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
              IME Pay
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-950/50 border border-blue-500/30 text-blue-300 font-semibold text-[11px]">
              ConnectIPS / Bank
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
