'use client';

import { useEffect, useRef, useState } from 'react';
import Game from '@/components/game';

export default function Home() {
  const [isNightMode, setIsNightMode] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStageScale = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const isMobileLandscape = window.innerWidth < 1024 && window.innerWidth > window.innerHeight;
      if (!isMobileLandscape) {
        setStageScale(1);
        return;
      }

      const pagePadding = 32;
      const availableWidth = Math.max(0, window.innerWidth - pagePadding);
      const availableHeight = Math.max(0, window.innerHeight - pagePadding);
      const stageWidth = stage.scrollWidth || stage.getBoundingClientRect().width;
      const stageHeight = stage.scrollHeight || stage.getBoundingClientRect().height;
      const nextScale = Math.min(1, availableWidth / stageWidth, availableHeight / stageHeight);

      setStageScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateStageScale();
    window.addEventListener('resize', updateStageScale);
    window.addEventListener('orientationchange', updateStageScale);

    return () => {
      window.removeEventListener('resize', updateStageScale);
      window.removeEventListener('orientationchange', updateStageScale);
    };
  }, []);

  return (
    <main className={`h-dvh min-h-dvh overflow-hidden font-sans flex flex-col items-center justify-center p-4 selection:bg-[#7BA67B] selection:text-white transition-all duration-800 ease-in-out ${isNightMode ? 'bg-[#1C1C18] text-[#E1E1D7]' : 'bg-[#F5F5F0] text-[#434338]'}`}>
      <div
        ref={stageRef}
        className="w-full flex flex-col items-center"
        style={{ transform: `scale(${stageScale})`, transformOrigin: 'center' }}
      >
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-6 px-2">
          <h1 className={`text-3xl font-black uppercase tracking-widest italic transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#E1E1D7]' : 'text-[#434338]'}`}>Aquaflip</h1>
          <p className={`text-xs mt-1.5 tracking-wide font-mono transition-colors duration-800 ease-in-out ${isNightMode ? 'text-[#8A8A7A]' : 'text-[#8A8A7A]'}`}>
            by @rvnztolentino
          </p>
        </div>
        
        <Game onNightModeChange={setIsNightMode} />
      </div>
    </main>
  );
}
