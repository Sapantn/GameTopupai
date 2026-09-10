import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long does manual top-up take after payment?',
      a: 'During standard operating hours (8:00 AM – 11:30 PM NST), orders are verified and manually topped up within 5 to 15 minutes. During peak festival sales or high volume, it may take up to 30 minutes.'
    },
    {
      q: 'Do I need to share my game account password?',
      a: 'NEVER! GamingZone strictly operates on Player ID, Character ID, or Server UID. We will never ask for your game account passwords, Facebook/Google logins, or secret codes.'
    },
    {
      q: 'Which payment options are supported in Nepal?',
      a: 'We accept all major local payment methods: eSewa Wallet, Khalti Digital Wallet, Fonepay Dynamic/Static QR, IME Pay, ConnectIPS, and direct Bank Transfer (NIC Asia, Nabil, Global IME, etc.).'
    },
    {
      q: 'What should I do after sending the payment?',
      a: 'Simply copy the Transaction Code / Reference ID from your eSewa, Khalti, or Mobile Banking app, upload the payment confirmation screenshot, and click Submit. Our admins will verify the reference immediately.'
    },
    {
      q: 'What happens if I submit an incorrect Player ID?',
      a: 'If you made an error entering your Character ID, contact our WhatsApp support (+977 9801234567) immediately with your Order ID before our team marks the order as "Top-up Processing". Once diamonds or UC have been dispatched to an account, transfers cannot be reversed.'
    },
    {
      q: 'Can I request a refund?',
      a: 'Yes. If your payment was verified but the selected item is out of stock, or if you request cancellation before top-up processing has begun, you can request a 100% refund back to your eSewa/Khalti wallet within 2-4 business hours.'
    }
  ];

  return (
    <section className="py-16 bg-[#0a0d18] border-b border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            Help &amp; Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about manual game top-ups in Nepal.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#111424] rounded-xl border border-slate-800/80 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-white hover:text-cyan-300"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{faq.q}</span>
                </span>
                {openIdx === idx ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {openIdx === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
