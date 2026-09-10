import React, { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { GameCard } from '../components/GameCard';
import { HowItWorks } from '../components/HowItWorks';
import { CustomerReviews } from '../components/CustomerReviews';
import { FaqSection } from '../components/FaqSection';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Game, OfferBanner, Catalog } from '../types';
import {
  Gamepad2,
  CreditCard,
  Layers,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  Tag,
  Zap,
  Gift
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setView, navigateToGame } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogDomain, setCatalogDomain] = useState<'all' | 'game' | 'card'>('all');
  const [activeCatalogSlug, setActiveCatalogSlug] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesData, offersData, catalogsData] = await Promise.all([
          api.getGames(),
          api.getOffers(),
          api.getCatalogs()
        ]);
        setGames(gamesData);
        setOffers(offersData);
        setCatalogs(catalogsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const safeGames = Array.isArray(games) ? games : [];
  const safeOffers = Array.isArray(offers) ? offers : [];
  const safeCatalogs = Array.isArray(catalogs) ? catalogs : [];

  const displayedCatalogs = safeCatalogs.filter(c => {
    if (catalogDomain === 'all') return true;
    return c.type === catalogDomain;
  });

  const filteredGames = safeGames.filter(g => {
    if (catalogDomain !== 'all') {
      const gType = g.catalogType || (g.category === 'voucher' ? 'card' : 'game');
      if (gType !== catalogDomain) return false;
    }
    if (activeCatalogSlug === 'all') return true;
    return (
      g.catalogSlug === activeCatalogSlug ||
      g.catalogId === activeCatalogSlug ||
      (g.category && g.category.toLowerCase() === activeCatalogSlug.toLowerCase())
    );
  });

  const popularGames = safeGames.filter(g => g.popular);

  return (
    <div className="space-y-12">
      {/* Cyberpunk Hero */}
      <Hero />

      {/* Active Promotion Banners Carousel / Row */}
      {safeOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeOffers.slice(0, 2).map((offer) => (
              <div
                key={offer.id}
                className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-[#111425] to-[#171a2e] p-5 flex items-center justify-between shadow-xl"
              >
                <div className="space-y-1 max-w-[70%]">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    Special Promotion
                  </span>
                  <h3 className="font-heading font-bold text-white text-base sm:text-lg">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-1">
                    {offer.subtitle}
                  </p>
                  <button
                    onClick={() => {
                      setView('offers');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="pt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>View Offers &amp; Promo Codes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-slate-700 shadow-md">
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Games Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-gaming">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>Trending in Nepal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mt-1">
              Most Popular Top-Ups
            </h2>
          </div>
          <button
            onClick={() => {
              setView('games');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all {games.length} games</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Popular Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* All Games & Products with Dynamic Catalog Filtering */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
                Catalog & Marketplace
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
                Available Games & Digital Cards
              </h2>
            </div>

            {/* Catalog Domain Tabs: All vs Games vs Cards */}
            <div className="flex items-center gap-1.5 bg-[#121626] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => {
                  setCatalogDomain('all');
                  setActiveCatalogSlug('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  catalogDomain === 'all'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setCatalogDomain('game');
                  setActiveCatalogSlug('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  catalogDomain === 'game'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Games
              </button>
              <button
                onClick={() => {
                  setCatalogDomain('card');
                  setActiveCatalogSlug('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  catalogDomain === 'card'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Cards & Vouchers
              </button>
            </div>
          </div>

          {/* Dynamic Catalog Sub-Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCatalogSlug('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeCatalogSlug === 'all'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Items ({safeGames.length})
            </button>
            {displayedCatalogs.map((cat) => {
              const isSelected = activeCatalogSlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatalogSlug(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? cat.type === 'card'
                        ? 'bg-amber-500 text-black shadow-md font-bold'
                        : 'bg-purple-600 text-white shadow-md font-bold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.badge && (
                    <span className={`text-[9px] px-1 rounded uppercase font-extrabold ${
                      isSelected ? 'bg-black/20 text-current' : 'bg-pink-900/60 text-pink-300 border border-pink-700/40'
                    }`}>
                      {cat.badge}
                    </span>
                  )}
                  {cat.itemCount !== undefined && cat.itemCount > 0 && (
                    <span className="text-[10px] opacity-70">
                      ({cat.itemCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#111422] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* 4-Step Process Explanation */}
      <HowItWorks />

      {/* Gamer Testimonials */}
      <CustomerReviews />

      {/* Frequently Asked Questions */}
      <FaqSection />

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-purple-950 to-cyan-950 border border-cyan-500/40 p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
            Ready to Level Up Your Game?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Get your diamonds, UC, and coins delivered safely to your player account within 5 to 15 minutes. Verified manual payments in NPR.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setView('games');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-heading font-bold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all"
            >
              Browse Games &amp; Top Up Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
