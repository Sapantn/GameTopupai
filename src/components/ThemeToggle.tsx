import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeMode } from '../types';
import { Moon, Sun, Laptop, Check } from 'lucide-react';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'dark',
    label: 'Dark Mode',
    sublabel: 'Cyberpunk neon night interface',
    icon: Moon
  },
  {
    id: 'light',
    label: 'Light Mode',
    sublabel: 'Clean, high-contrast day view',
    icon: Sun
  },
  {
    id: 'system',
    label: 'System Default',
    sublabel: 'Syncs automatically with device OS',
    icon: Laptop
  }
];

/**
 * Compact Dropdown Theme Switcher for Navbar & Admin Bar
 */
export const ThemeToggleDropdown: React.FC<{ className?: string; align?: 'left' | 'right' }> = ({
  className = '',
  align = 'right'
}) => {
  const { themeMode, resolvedTheme, setThemeMode } = useApp();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CurrentIcon = themeMode === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
        title={`Theme: ${themeMode === 'system' ? `System (${resolvedTheme})` : themeMode}`}
        aria-label="Change Color Theme"
      >
        <CurrentIcon className="w-4 h-4 text-cyan-400 transition-transform active:scale-95" />
        <span className="hidden xl:inline text-[11px] font-semibold text-slate-300 capitalize">
          {themeMode === 'system' ? 'System' : themeMode}
        </span>
      </button>

      {open && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-56 rounded-2xl bg-[#0f1222] border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2`}
        >
          <div className="px-3 py-2 border-b border-slate-800 mb-1">
            <p className="text-xs font-bold text-white flex items-center justify-between">
              <span>Theme Appearance</span>
              <span className="text-[10px] font-mono font-normal uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {resolvedTheme}
              </span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Choose your preferred color theme
            </p>
          </div>

          <div className="space-y-1">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setThemeMode(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium leading-tight">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        {opt.id === 'system' ? `Auto: ${resolvedTheme}` : opt.sublabel}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Segmented Pill Theme Switcher (for Mobile Navigation Drawer & Footer)
 */
export const ThemeSegmentedControl: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useApp();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 ${className}`}
    >
      {themeOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = themeMode === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setThemeMode(opt.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-cyan-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={`${opt.label} (${opt.id === 'system' ? `Auto: ${resolvedTheme}` : opt.sublabel})`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{opt.id}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Rich Theme Settings Card for the Profile Page
 */
export const ThemeSettingsCard: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useApp();

  return (
    <div className="bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider font-gaming">
            Display &amp; Appearance
          </span>
          <h3 className="text-lg font-heading font-bold text-white mt-0.5">
            Interface Color Theme
          </h3>
          <p className="text-xs text-slate-400">
            Switch between Dark, Light, or System Default mode for comfortable daytime and late-night gaming.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-200">
            Active: <strong className="text-white capitalize">{themeMode}</strong>{' '}
            {themeMode === 'system' && `(${resolvedTheme})`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themeMode === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => setThemeMode(opt.id)}
              className={`relative cursor-pointer rounded-2xl p-4 border transition-all select-none flex flex-col justify-between gap-3 group ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/40 to-[#12182b] border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#141829] border-slate-800 hover:border-slate-700 hover:bg-[#181d33]'
              }`}
            >
              {/* Top Row: Icon + Checkmark */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-black'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-400 text-black'
                      : 'border-slate-700 bg-slate-900/80 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Text Information */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-white">{opt.label}</h4>
                  {opt.id === 'system' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
                      Auto
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{opt.sublabel}</p>
              </div>

              {/* Visual Mini Preview Bar */}
              <div
                className={`w-full h-8 rounded-lg border p-1 flex items-center gap-1.5 overflow-hidden ${
                  opt.id === 'dark'
                    ? 'bg-[#0a0c14] border-cyan-500/30'
                    : opt.id === 'light'
                    ? 'bg-slate-100 border-slate-300'
                    : 'bg-gradient-to-r from-[#0a0c14] via-slate-700 to-slate-100 border-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    opt.id === 'dark'
                      ? 'bg-cyan-400'
                      : opt.id === 'light'
                      ? 'bg-blue-600'
                      : 'bg-purple-400'
                  }`}
                />
                <div
                  className={`h-1.5 flex-1 rounded ${
                    opt.id === 'dark'
                      ? 'bg-slate-800'
                      : opt.id === 'light'
                      ? 'bg-slate-300'
                      : 'bg-slate-600'
                  }`}
                />
                <div
                  className={`w-4 h-2 rounded text-[8px] flex items-center justify-center font-bold ${
                    opt.id === 'dark'
                      ? 'bg-cyan-900 text-cyan-300'
                      : opt.id === 'light'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-purple-900 text-purple-300'
                  }`}
                >
                  NP
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
