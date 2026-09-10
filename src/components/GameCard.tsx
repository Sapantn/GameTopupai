import React from 'react';
import { Game } from '../types';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, Flame, Shield } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { navigateToGame } = useApp();

  const lowestPrice = game.packages && game.packages.length > 0
    ? Math.min(...game.packages.map(p => p.price))
    : null;

  return (
    <div
      onClick={() => navigateToGame(game)}
      className="group relative bg-[#111422] rounded-2xl border border-slate-800/90 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/15 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Top Artwork Banner */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-900">
        <img
          src={game.bannerUrl}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111422] via-[#111422]/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {game.popular && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-black" />
              Popular
            </span>
          )}
          {game.featured && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        {/* Category Pill */}
        {game.category && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-300 text-[10px] font-medium border border-white/10">
            {game.category}
          </span>
        )}

        {/* Circular Logo Overlap */}
        <div className="absolute -bottom-3 left-3 w-12 h-12 rounded-xl border-2 border-cyan-500/60 bg-[#0a0c14] overflow-hidden shadow-lg p-0.5">
          <img
            src={game.logoUrl}
            alt={`${game.name} icon`}
            className="w-full h-full object-cover rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Content details */}
      <div className="p-4 pt-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-bold text-white text-base group-hover:text-cyan-400 transition-colors line-clamp-1">
            {game.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Price & Action footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              Starting from
            </span>
            <span className="font-gaming font-bold text-sm text-white">
              {lowestPrice ? `NPR ${lowestPrice}` : 'Check Packs'}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateToGame(game);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400"
          >
            <span>Top Up</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
