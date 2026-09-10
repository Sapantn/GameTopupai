import React from 'react';
import { Package, UserCheck, QrCode, Zap, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Select Game & Pack',
      description: 'Choose your game and select the desired diamond, UC, or currency pack priced in NPR.',
      icon: Package,
      accent: 'cyan'
    },
    {
      step: '02',
      title: 'Enter Player Info',
      description: 'Provide your in-game Character ID, Zone ID, or UID. We never ask for your game password.',
      icon: UserCheck,
      accent: 'purple'
    },
    {
      step: '03',
      title: 'Manual Nepal Payment',
      description: 'Scan our eSewa, Khalti, or Fonepay QR code to transfer the exact amount and submit your reference ID.',
      icon: QrCode,
      accent: 'amber'
    },
    {
      step: '04',
      title: 'Fast Top-Up Delivery',
      description: 'Our Kathmandu operations team manually verifies the transfer and credits your game within 5–15 mins.',
      icon: Zap,
      accent: 'emerald'
    }
  ];

  return (
    <section className="py-16 bg-[#0a0d18] border-b border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            How GamingZone Top-Up Works
          </h2>
          <p className="text-sm text-slate-400">
            A 100% manual, secure, and authentic in-game top-up platform built exclusively for Nepal’s gaming community.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-[#111424] p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading font-black text-2xl text-slate-700 group-hover:text-cyan-400/80 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:bg-cyan-950/40 transition-all">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-white text-base mb-2 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manual Safety Check</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
