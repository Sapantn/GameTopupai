import React from 'react';
import { useApp } from '../context/AppContext';
import { ThemeSegmentedControl } from './ThemeToggle';
import {
  Gamepad2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  FileText,
  ShieldAlert,
  Send,
  MessageSquare
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setView, setLegalTab } = useApp();

  const handleLegalClick = (tab: any) => {
    setLegalTab(tab);
    setView('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#070911] text-slate-400 border-t border-slate-800/80 pt-12 pb-20 md:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main 4-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px]">
                <div className="w-full h-full bg-[#070911] rounded-[7px] flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-heading font-extrabold text-base tracking-wider text-white">
                GAMING<span className="text-cyan-400">ZONE</span> NP
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Nepal’s dedicated game top-up center. Fast manual top-ups for PUBG Mobile, Free Fire, Mobile Legends, and Roblox using local wallets.
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px]">Kathmandu Operations Center Online</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => { setView('games'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
                  Browse All Games
                </button>
              </li>
              <li>
                <button onClick={() => { setView('offers'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
                  Active Offers &amp; Promo Codes
                </button>
              </li>
              <li>
                <button onClick={() => { setView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
                  My Orders &amp; Receipts
                </button>
              </li>
              <li>
                <button onClick={() => { setView('support'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-cyan-400 transition-colors">
                  Customer Support Helpdesk
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Trust & Policies */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs">
              Security &amp; Policy
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleLegalClick('manual-payment')} className="hover:text-cyan-400 transition-colors text-left flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manual Payment &amp; Verification Policy</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleLegalClick('refund')} className="hover:text-cyan-400 transition-colors text-left">
                  Refund &amp; Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleLegalClick('terms')} className="hover:text-cyan-400 transition-colors text-left">
                  Terms &amp; Service Agreement
                </button>
              </li>
              <li>
                <button onClick={() => handleLegalClick('privacy')} className="hover:text-cyan-400 transition-colors text-left">
                  Privacy Policy &amp; Data Safety
                </button>
              </li>
              <li>
                <button onClick={() => handleLegalClick('about')} className="hover:text-cyan-400 transition-colors text-left">
                  About GamingZone Nepal
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Nepal Contact */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs">
              Nepal Support Desk
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>8:00 AM – 11:30 PM NST (7 Days)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>+977 9801234567 / 01-4456789</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>support@gamingzone.com.np</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Baneshwor, Kathmandu, Nepal</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href="https://wa.me/9779801234567"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 hover:bg-emerald-900 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>

        </div>

        {/* Disclaimer note */}
        <div className="pt-6 border-t border-slate-800/60 text-[11px] text-slate-500 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-slate-400">LEGAL NOTICE &amp; DISCLAIMER:</strong> GamingZone is an independent marketplace operated in Nepal for manual digital game vouchers and direct player ID credits. GamingZone is not affiliated with, endorsed by, or sponsored by Tencent Games, Krafton, Garena, Moonton, miHoYo / HoYoverse, Roblox Corporation, or any other game publishers. All trademarks, registered trademarks, logos, and game artwork shown on this site belong exclusively to their respective owners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-900 text-slate-600">
            <p>&copy; {new Date().getFullYear()} GamingZone Top-up Center Nepal. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-500 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Theme:</span>
                <ThemeSegmentedControl />
              </div>
              <span className="text-slate-800 hidden sm:inline">•</span>
              <p className="font-gaming">
                Currency: <strong className="text-slate-400">NPR</strong>
              </p>
              <span className="text-slate-800">•</span>
              <button
                onClick={() => {
                  setView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-purple-400 transition-colors flex items-center gap-1 text-[10px] text-slate-600"
                title="GamingZone Staff and Operations Login"
              >
                <Shield className="w-3 h-3 text-slate-600" />
                <span>Staff Portal</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
