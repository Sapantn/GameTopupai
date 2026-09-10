import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Game, Catalog } from '../types';
import { GameCard } from '../components/GameCard';
import { Search, Gamepad2, CreditCard, Layers, ArrowUpDown, Sparkles } from 'lucide-react';

export const GamesPage: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    catalogTab,
    setCatalogTab,
    selectedCatalog,
    setSelectedCatalog
  } = useApp();

  const [games, setGames] = useState<Game[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'price-asc' | 'price-desc'>('popular');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesData, catalogsData] = await Promise.all([
          api.getGames(),
          api.getCatalogs()
        ]);
        setGames(Array.isArray(gamesData) ? gamesData : []);
        setCatalogs(Array.isArray(catalogsData) ? catalogsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getLowestPrice = (g: Game) => {
    if (!g.packages || g.packages.length === 0) return 999999;
    return Math.min(...g.packages.map(p => p.price));
  };

  const safeGames = Array.isArray(games) ? games : [];
  const safeCatalogs = Array.isArray(catalogs) ? catalogs : [];

  // Filter catalogs for current active domain (or all)
  const displayedCatalogs = safeCatalogs.filter(c => {
    if (catalogTab === 'all' as any) return true;
    return c.type === catalogTab;
  });

  const filteredGames = safeGames
    .filter(g => {
      // 1. Domain match (Game vs Card)
      if ((catalogTab as string) !== 'all') {
        const itemType = g.catalogType || (g.category === 'voucher' ? 'card' : 'game');
        if (itemType !== catalogTab) return false;
      }

      // 2. Specific Catalog filter
      if (selectedCatalog !== 'all') {
        const matchesSpecific =
          g.catalogSlug === selectedCatalog ||
          g.catalogId === selectedCatalog ||
          (g.category && g.category.toLowerCase() === selectedCatalog.toLowerCase());
        if (!matchesSpecific) return false;
      }

      // 3. Search query match
      const matchesSearch =
        !searchQuery ||
        (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return getLowestPrice(a) - getLowestPrice(b);
      if (sortBy === 'price-desc') return getLowestPrice(b) - getLowestPrice(a);
      return 0;
    });

  const isCardsMode = catalogTab === 'card';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#101426] via-[#161a32] to-[#101426] border border-cyan-500/30 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            {isCardsMode ? 'Digital Gift Cards & Subscriptions' : 'Instant Game Top-Up'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white mt-1">
            {isCardsMode ? 'Card, Voucher & License Marketplace' : 'Game Top-Up Marketplace'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {isCardsMode
              ? 'Browse Mobile Game Cards, Gift Cards, Payment Cards, Streaming & Subscriptions delivered rapidly with NPR local checkout.'
              : 'Direct diamonds, UC, coins, and battle passes for PC, Mobile, Webgames, and Xbox with instant local manual fulfillment.'}
          </p>
        </div>

        {/* Quick Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder={isCardsMode ? "Search gift cards, Netflix, Steam..." : "Search PUBG, Free Fire, MLBB..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0c16] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Section Navigation: Games vs Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        
        {/* Domain Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCatalogTab('game');
              setSelectedCatalog('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              !isCardsMode
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30 ring-1 ring-purple-400/50'
                : 'bg-[#121627] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Games Catalog</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-700/50">
              {safeGames.filter(g => (g.catalogType || 'game') === 'game' && g.category !== 'voucher').length}
            </span>
          </button>

          <button
            onClick={() => {
              setCatalogTab('card');
              setSelectedCatalog('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isCardsMode
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 ring-1 ring-amber-400/50'
                : 'bg-[#121627] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Cards & Vouchers</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-200 border border-amber-700/50">
              {safeGames.filter(g => g.catalogType === 'card' || g.category === 'voucher').length}
            </span>
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#121627] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="popular">Most Popular</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Sub-Catalog Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCatalog('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            selectedCatalog === 'all'
              ? isCardsMode ? 'bg-amber-500 text-black shadow-md' : 'bg-purple-600 text-white shadow-md'
              : 'bg-[#121626] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All {isCardsMode ? 'Cards' : 'Games'}
        </button>

        {displayedCatalogs.map((cat) => {
          const isSelected = selectedCatalog === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatalog(cat.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                isSelected
                  ? isCardsMode
                    ? 'bg-amber-500 text-black shadow-md font-bold'
                    : 'bg-purple-600 text-white shadow-md font-bold'
                  : 'bg-[#121626] text-slate-400 hover:text-white border border-slate-800'
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
            </button>
          );
        })}
      </div>

      {/* Game / Card Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#111422] animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-20 bg-[#111424] rounded-2xl border border-slate-800/80 p-8 space-y-4">
          {isCardsMode ? (
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
          ) : (
            <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
          )}
          <h3 className="text-lg font-heading font-bold text-white">
            No {isCardsMode ? 'cards' : 'games'} found in this category
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `We couldn't find items matching "${searchQuery}".`
              : `There are currently no items under this catalog filter.`}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCatalog('all');
            }}
            className="px-4 py-2 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-semibold"
          >
            Clear Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

    </div>
  );
};
