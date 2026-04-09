import React from 'react';

export function Footer() {
  const links = [
    'BLOG', 'GUIDE', 'ABOUT US', 'CONTACT US', 'PRIVACY SETTINGS', 'HELP CENTER', 'STREAKLY'
  ];

  return (
    <footer className="w-full max-w-7xl mx-auto px-8 py-16 mt-12 border-t border-zinc-900">
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-12">
        {links.map((link) => (
          <a
            key={link}
            href="#"
            className={`text-xs font-bold tracking-[0.2em] transition-colors ${
              link === 'STREAKLY' ? 'text-emerald-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {link}
          </a>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
          ©COPYRIGHT ALL RIGHT SERVED
        </p>
      </div>
    </footer>
  );
}
