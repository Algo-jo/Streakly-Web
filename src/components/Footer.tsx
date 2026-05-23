import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Heart, Mail, Code2, Check, Instagram, MapPin } from 'lucide-react';

export function Footer() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const links = [
    'GUIDE', 'ABOUT US', 'CONTACT US', 'FAQ', 'STREAKLY'
  ];

  const getContent = () => {
    switch (selectedItem) {
      case 'GUIDE':
        return {
          icon: <Code2 className="w-8 h-8 text-emerald-500 font-sans" />,
          title: "Streakly Navigation Guide",
          subtitle: "Get the most out of your consistency dashboard",
          body: (
            <div className="space-y-4 font-sans text-sm text-zinc-350 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              <p className="text-sm">
                Streakly is an offline-first consistency dashboard designed specifically for builders. It removes traditional clutter to focus on compounding your technical habit. Here is an overview of all system features:
              </p>
              
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                  <span className="block font-black text-emerald-400 uppercase tracking-widest text-[9px] mb-1">1. CONTRIBUTION GRID HEATMAP</span>
                  <p className="text-zinc-400">
                    A visual grid inspired by GitHub commit charts. Displays your daily productivity across the entire calendar. Each block increases in brightness as you log more tasks. Includes tooltips revealing active task descriptions and totals.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                  <span className="block font-black text-emerald-400 uppercase tracking-widest text-[9px] mb-1">2. DETAILED ACTIVITY LOGGING</span>
                  <p className="text-zinc-400">
                    Submit detailed summaries of bugfixes, UI refactoring, or database sprints. You can assign labels, toggle statuses, specify duration, link dedicated repositories, and drag-and-drop attachment snapshots.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                  <span className="block font-black text-emerald-400 uppercase tracking-widest text-[9px] mb-1">3. STREAK PROGRESSION ENGINE</span>
                  <p className="text-zinc-400">
                    Maintains real-time counts of both your Current Consecutive Streak and All-Time Highest Streak. Glowing customizable badges evolve visually as your consecutive streaks grow taller.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                  <span className="block font-black text-emerald-400 uppercase tracking-widest text-[9px] mb-1">4. DEV CIRCLE (FOLLOWING INSPIRATION)</span>
                  <p className="text-zinc-400">
                    Browse and explore profiles of outstanding engineers. Toggle follow states to construct your custom community dashboard showing their latest active development highlights.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                  <span className="block font-black text-emerald-400 uppercase tracking-widest text-[9px] mb-1">5. PROFILE MANAGEMENT</span>
                  <p className="text-zinc-400">
                    Fully customize your name, role declaration, developer bio, and avatar. All fields persist locally and synchronizes across your workspace.
                  </p>
                </div>
              </div>
            </div>
          )
        };
      case 'ABOUT US':
        return {
          icon: <Heart className="w-8 h-8 text-red-400" />,
          title: "Our Engineering Creed",
          subtitle: "Designed for software momentum",
          body: (
            <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
              <p>
                Streakly was designed by and for builders. We believe writing code is a craft to be proud of.
              </p>
              <p>
                Our philosophy centers around architectural honesty. We exclude trackers, bloated frameworks, and unrequested AI telemetry, giving you a lightning-fast, high-contrast, distraction-free environment to prioritize deep consistency.
              </p>
              <p className="text-zinc-500 text-xs">
                All client data remains hosted securely in your browser's private sandbox.
              </p>
            </div>
          )
        };
      case 'CONTACT US':
        return {
          icon: <Mail className="w-8 h-8 text-emerald-500" />,
          title: "Developer Contacts",
          subtitle: "Reach out to discuss features and feedback",
          body: (
            <div className="space-y-4 font-sans text-sm text-zinc-300">
              <p className="text-zinc-400 leading-relaxed">
                Need support or want to offer a suggestion? Contact us directly:
              </p>
              <div className="grid grid-cols-1 gap-3 mt-2">
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] font-black tracking-widest text-zinc-500 uppercase">EMAIL ADDRESS</span>
                    <a href="mailto:support@streakly.io" className="text-xs font-bold text-emerald-400 hover:underline">support@streakly.io</a>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] font-black tracking-widest text-zinc-500 uppercase">INSTAGRAM</span>
                    <span className="text-xs font-bold text-zinc-200">@StreaklyEngine</span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="block text-[9px] font-black tracking-widest text-zinc-500 uppercase">OFFICE HEADQUARTERS</span>
                    <span className="text-xs font-bold text-zinc-200">Jakarta, Indonesia</span>
                  </div>
                </div>
              </div>
            </div>
          )
        };
      case 'FAQ':
        return {
          icon: <HelpCircle className="w-8 h-8 text-amber-400" />,
          title: "Frequently Asked Questions",
          subtitle: "Quick answers about Streakly operations",
          body: (
            <div className="space-y-4 font-sans text-sm text-zinc-300 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="space-y-4">
                <div className="border-b border-zinc-900 pb-3">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-1">Q: How is my streak calculated?</h4>
                  <p className="text-zinc-400 text-xs text-justify">Your active streak increments for every consecutive calendar day you log at least one completed activity. If a day passes without anylogged item, your current streak resets to 0.</p>
                </div>
                <div className="border-b border-zinc-900 pb-3">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-1">Q: Code entries cannot be linked?</h4>
                  <p className="text-zinc-400 text-xs text-justify">No, you can simply log activities or configure work links directly. Creating a log immediately tracks active contributions under your central timeline.</p>
                </div>
                <div className="border-b border-zinc-900 pb-3">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-1">Q: Can I modify or delete previous logs?</h4>
                  <p className="text-zinc-400 text-xs text-justify">Yes! Hover or tap any item on the activity feed stream, then click the Edit button to open the log management screen where you can modify descriptions, labels, or update progress metrics.</p>
                </div>
                <div className="border-b border-zinc-900 pb-3">
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-1">Q: Where is my dashboard data saved?</h4>
                  <p className="text-zinc-400 text-xs text-justify">All your settings, log collections, streak badge rankings, and image attachments stay fully private in your web browser's LocalStorage. No code or metadata leaves your local sandbox environment.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-1">Q: How do I follow another developer?</h4>
                  <p className="text-zinc-400 text-xs text-justify">Navigate to the "Following" tab using the main navbar, browse the available profiles, and click the follow button to track their consistency logs securely in your feed.</p>
                </div>
              </div>
            </div>
          )
        };
      case 'STREAKLY':
        return {
          icon: <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-black">S</div>,
          title: "The Streakly Vibe",
          subtitle: "Compile daily victories",
          body: (
            <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
              <p className="text-emerald-400 font-extrabold text-base">"Focus, build, commit, repeat."</p>
              <p>
                Streakly represents absolute architectural purity. Our software engineering pledge is to compile daily victories, keep styling immaculate, provide highest density layouts, and support responsive builders worldwide.
              </p>
            </div>
          )
        };
      default:
        return null;
    }
  };

  const modalContent = getContent();

  return (
    <footer className="w-full max-w-7xl mx-auto px-8 py-16 mt-12 border-t border-zinc-900 font-sans">
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-12">
        {links.map((link) => (
          <button
            key={link}
            onClick={() => setSelectedItem(link)}
            className={`text-xs font-bold tracking-[0.2em] transition-all transform active:scale-95 duration-200 cursor-pointer ${
              link === 'STREAKLY' ? 'text-emerald-500 hover:text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {link}
          </button>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
          ©COPYRIGHT ALL RIGHTS RESERVED • STREAKLY ENGINE
        </p>
      </div>

      {modalContent && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
          <DialogContent className="bg-zinc-950 border border-zinc-500 text-white rounded-3xl p-8 max-w-[500px]">
            <DialogHeader className="flex flex-row items-center gap-4 space-y-0 pb-4 border-b border-zinc-900">
              {modalContent.icon}
              <div className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-white">{modalContent.title}</DialogTitle>
                <p className="text-xs text-zinc-500 font-medium">{modalContent.subtitle}</p>
              </div>
            </DialogHeader>
            <div className="py-6">
              {modalContent.body}
            </div>
            <div className="pt-4 border-t border-zinc-900 flex justify-end">
              <Button 
                onClick={() => setSelectedItem(null)}
                className="bg-zinc-900 border border-zinc-500 hover:bg-zinc-850 hover:text-white text-zinc-300 font-bold px-6 h-11 rounded-xl transition-all"
              >
                <Check className="w-4 h-4 mr-2 text-emerald-500" /> Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </footer>
  );
}
