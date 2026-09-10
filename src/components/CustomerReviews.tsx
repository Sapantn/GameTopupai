import React from 'react';
import { Star, CheckCircle, Quote, ShieldCheck } from 'lucide-react';

export const CustomerReviews: React.FC = () => {
  const reviews = [
    {
      id: 'rev-1',
      name: 'Prashant Khadka',
      location: 'Kathmandu, Baneshwor',
      game: 'PUBG Mobile',
      package: '660 UC Pack',
      rating: 5,
      text: 'Sent eSewa payment and uploaded screenshot. My UC was credited within 7 minutes! No password needed, totally safe and trustworthy service.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
    },
    {
      id: 'rev-2',
      name: 'Anjali Gurung',
      location: 'Pokhara, Lakeside',
      game: 'Free Fire',
      package: 'Weekly Diamond Membership',
      rating: 5,
      text: 'Best top-up rate in Nepal! Used Khalti QR, submitted transaction code and received verification notification on my phone quickly.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
    },
    {
      id: 'rev-3',
      name: 'Bibek Shrestha',
      location: 'Butwal, Rupandehi',
      game: 'Mobile Legends: Bang Bang',
      package: '257 Diamonds',
      rating: 5,
      text: 'Great customer support team. I mistakenly typed my Zone ID wrong, but support agent Pooja contacted me immediately on WhatsApp and corrected it before top-up!',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80'
    }
  ];

  return (
    <section className="py-16 bg-[#0c0f1d] border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest font-gaming">
            Gamer Trust &amp; Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Trusted by 50,000+ Gamers in Nepal
          </h2>
          <p className="text-sm text-slate-400">
            Read real feedback from competitive gamers and casual players across Nepal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#121628] p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-slate-700" />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/40"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white">{rev.name}</h4>
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <p className="text-[10px] text-slate-400">{rev.location}</p>
                  <p className="text-[10px] text-cyan-400/80 font-medium">
                    {rev.game} • {rev.package}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
