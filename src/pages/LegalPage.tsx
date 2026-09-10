import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, RotateCcw, FileText, Lock, Info, Gamepad2 } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const { legalTab, setLegalTab } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setLegalTab('manual-payment')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            legalTab === 'manual-payment'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Manual Payment Policy</span>
        </button>

        <button
          onClick={() => setLegalTab('refund')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            legalTab === 'refund'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refund &amp; Cancellation</span>
        </button>

        <button
          onClick={() => setLegalTab('terms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            legalTab === 'terms'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setLegalTab('privacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            legalTab === 'privacy'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Privacy &amp; Data Safety</span>
        </button>

        <button
          onClick={() => setLegalTab('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            legalTab === 'about'
              ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>About &amp; Disclaimer</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-[#111424] rounded-3xl border border-slate-800 p-6 sm:p-10 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed shadow-xl">
        
        {legalTab === 'manual-payment' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-white">
              Manual Payment &amp; Manual Top-Up Policy
            </h1>
            <p className="text-cyan-300 text-xs font-semibold">
              Last updated: September 2026 • Kathmandu, Nepal
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-bold text-white text-base">
                1. Nature of the Service
              </h3>
              <p>
                GamingZone Top-Up Center operates on a <strong>100% manual payment and manual top-up model</strong>.
                When you place an order, you transfer Nepalese Rupees (NPR) directly to our authorized eSewa, Khalti, Fonepay, or Bank accounts.
                Our physical operations team in Kathmandu manually inspects the payment, confirms the transaction reference in our banking terminals, and manually dispatches the in-game diamonds, UC, or points to your Player ID.
              </p>

              <h3 className="font-heading font-bold text-white text-base">
                2. Average Delivery Time
              </h3>
              <p>
                - Standard hours (8:00 AM – 11:30 PM Nepal Standard Time): <strong>5 to 15 minutes</strong>.<br />
                - Peak hours &amp; Festival promotions: Up to 30 minutes.<br />
                - Orders submitted after 11:30 PM NST will be processed starting at 8:00 AM the following morning.
              </p>

              <h3 className="font-heading font-bold text-white text-base">
                3. Anti-Fraud &amp; Duplicate Transaction Policy
              </h3>
              <p>
                Every transaction code / reference ID submitted by customers is recorded immutably in our system.
                Submitting fraudulent, reused, or fake transaction screenshots is strictly prohibited and will result in instant order cancellation, blacklisting of your phone number and player account, and potential reporting to local payment authorities.
              </p>

              <h3 className="font-heading font-bold text-white text-base">
                4. Player ID Accuracy Responsibility
              </h3>
              <p>
                Because game top-ups are credited directly to the ID provided, customers are solely responsible for ensuring the Character ID / Zone ID entered is correct. If you realize an error immediately after ordering, contact our WhatsApp hotline (+977 9801234567) before the order moves to "Top-up Processing".
              </p>
            </div>
          </div>
        )}

        {legalTab === 'refund' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-white">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-cyan-300 text-xs font-semibold">
              Fair &amp; Transparent Policy for Nepal Gamers
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="font-heading font-bold text-white text-base">
                1. Eligible Refund Scenarios
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Double payments or overpayments made for a single order.</li>
                <li>Items that are temporarily out of stock or unavailable from official game servers.</li>
                <li>Cancellation requests made <em>before</em> our operators mark the order as "Top-up Processing".</li>
                <li>Delivery delays exceeding 60 minutes due to unexpected internal downtime (excluding game publisher server maintenance).</li>
              </ul>

              <h3 className="font-heading font-bold text-white text-base">
                2. Non-Refundable Scenarios
              </h3>
              <p>
                Once an order has been marked as <strong>Completed</strong> and the currency (Diamonds, UC, Robux) has been successfully dispatched to the Player ID provided, no refunds or reversals can be issued under any circumstances due to game publisher restrictions.
              </p>

              <h3 className="font-heading font-bold text-white text-base">
                3. Refund Processing Time
              </h3>
              <p>
                Approved refunds are transferred back to your original eSewa or Khalti wallet within <strong>2 to 4 business hours</strong> with zero deduction fees.
              </p>
            </div>
          </div>
        )}

        {legalTab === 'terms' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-white">
              Terms of Service Agreement
            </h1>
            <p>
              By accessing and using GamingZone Top-up Center, you acknowledge and agree to comply with these terms. You represent that you are at least 13 years of age or possess legal parental consent in Nepal.
            </p>
            <p>
              All transactions are conducted in Nepalese Rupees (NPR). GamingZone reserves the right to modify package pricing without prior notice in accordance with international currency exchange fluctuations.
            </p>
          </div>
        )}

        {legalTab === 'privacy' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-white">
              Privacy Policy &amp; Security
            </h1>
            <p>
              Your privacy and security are paramount. We strictly collect only the information necessary to fulfill your game top-up:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In-Game Character ID / Zone ID (Publicly visible gamer identifiers).</li>
              <li>Nepal phone number and email for receipt notifications and WhatsApp support.</li>
              <li>Payment receipt screenshots and transaction codes for banking reconciliation.</li>
            </ul>
            <p className="pt-2 font-bold text-cyan-300">
              WE NEVER ASK FOR, STORE, OR TRANSMIT YOUR IN-GAME ACCOUNT PASSWORDS, SOCIAL MEDIA LOGINS, OR WALLET PIN CODES.
            </p>
          </div>
        )}

        {legalTab === 'about' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-white">
              About GamingZone Top-Up Center Nepal
            </h1>
            <p>
              GamingZone was founded in Kathmandu to provide competitive and casual gamers across Nepal with a fast, safe, and transparent marketplace to top-up mobile and PC games using domestic payment systems.
            </p>
            <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 text-xs space-y-1 text-slate-400">
              <strong className="text-white block">TRADEMARK DISCLAIMER:</strong>
              GamingZone is an independent third-party service and is not affiliated with, endorsed by, or sponsored by Tencent Games, Krafton, Garena, Moonton, HoYoverse, Riot Games, or Roblox Corp. All trademarks and logos belong to their respective owners.
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
