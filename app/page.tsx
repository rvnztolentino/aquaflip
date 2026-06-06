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
      
      <div className={`mt-6 w-full max-w-xs flex flex-col gap-2 font-mono text-[10px] transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#A5A599]' : 'text-[#5A5A40]'}`}>
        <div className={`flex justify-between border-b pb-1 transition-colors duration-800 ease-in-out ${isNightMode ? 'border-[#3C3C34]' : 'border-[#D8D8CF]'}`}>
          <span className="font-bold">SPACE / UP / TAP</span>
          <span className={`transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>JUMP (HOLD HIGHER)</span>
        </div>
        <div className={`flex justify-between border-b pb-1 transition-colors duration-800 ease-in-out ${isNightMode ? 'border-[#3C3C34]' : 'border-[#D8D8CF]'}`}>
          <span className="font-bold">DOWN / SWIPE</span>
          <span className={`transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>CROUCH / SLIDE</span>
        </div>
      </div>
    </main>
  );
}
