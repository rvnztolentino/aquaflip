'use client';

import { useState } from 'react';
import Game from '@/components/game';

export default function Home() {
  const [isNightMode, setIsNightMode] = useState(false);

  return (
    <main className={`min-h-screen font-sans flex flex-col items-center justify-center p-4 selection:bg-[#7BA67B] selection:text-white transition-all duration-800 ease-in-out ${isNightMode ? 'bg-[#1C1C18] text-[#E1E1D7]' : 'bg-[#F5F5F0] text-[#434338]'}`}>
      <div className="w-full max-w-4xl flex flex-col items-center text-center mb-6 px-2">
        <h1 className={`text-3xl font-black uppercase tracking-widest italic transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#E1E1D7]' : 'text-[#434338]'}`}>Aquaflip</h1>
        <p className={`text-xs mt-1.5 tracking-wide font-mono transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>
          by @rvnztolentino · built with Google AI Studio
        </p>
      </div>
      
      <Game onNightModeChange={setIsNightMode} />
    </main>
  );
}
