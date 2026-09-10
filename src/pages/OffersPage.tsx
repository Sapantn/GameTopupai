import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { OfferBanner, PromoCode } from '../types';
import { Tag, Sparkles, Copy, Check, Gift, ArrowRight, Clock, Percent } from 'lucide-react';

export const OffersPage: React.FC = () => {
  const { setView, addToast } = useApp();
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [offersData, promosData] = await Promise.all([
          api.getOffers(),
          api.getPromoCodes()
        ]);
        setOffers(offersData);
        setPromoCodes(promosData.filter(p => p.active));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(`Promo code "${code}" copied! Apply at checkout.`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const safeOffers = Array.isArray(offers) ? offers : [];
  const safePromoCodes = Array.isArray(promoCodes) ? promoCodes : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-[#13172a] to-cyan-950/60 border border-purple-500/30 rounded-3xl p-6 sm:p-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-xs font-bold uppercase tracking-wider font-gaming">
          <Gift className="w-3.5 h-3.5" />
          <span>Exclusive Deals in NPR</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">
          Offers &amp; Promo Codes
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Enjoy festival discounts, seasonal top-up bonuses, and exclusive promo codes on PUBG UC, Free Fire Diamonds, and Mobile Legends top-ups.
        </p>
      </div>

      {/* Featured Offer Banners */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Featured Promotions</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeOffers.map((off) => (
            <div
              key={off.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-800 hover:border-cyan-500/40 bg-[#111424] shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={off.bannerUrl || (off as any).imageUrl}
                  alt={off.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111424] via-[#111424]/40 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Limited Time
                </span>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-heading font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">
                  {off.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {off.subtitle}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-medium">
                    Valid for all Nepal players
                  </span>
                  <button
                    onClick={() => {
                      setView('games');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Claim Offer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Promo Codes Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
          <Percent className="w-5 h-5 text-cyan-400" />
          <span>Active Promo Codes</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {safePromoCodes.map((code) => (
            <div
              key={code.id}
              className="bg-[#111424] rounded-2xl border border-slate-800 hover:border-purple-500/40 p-5 space-y-4 relative shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/30">
                    <Tag className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 text-[10px] font-bold border border-slate-800">
                    {code.type === 'percentage' ? `${code.value}% OFF` : `NPR ${code.value} OFF`}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-mono font-bold text-lg text-white tracking-wider">
                    {code.code}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {code.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Min Order:</span>
                    <span className="font-gaming text-white">NPR {code.minOrderAmount}</span>
                  </div>
                  {code.maxDiscount && (
                    <div className="flex justify-between">
                      <span>Max Discount:</span>
                      <span className="font-gaming text-white">NPR {code.maxDiscount}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(code.code)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedCode === code.code ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code: {code.code}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
