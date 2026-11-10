/**
 * Title Screen for Spider-Man: NYC Web-Slinger 3D.
 * Features bespoke inline SVG title lockup, live 3D world camera pan,
 * primary Start CTA, and flat control hint line.
 */
import React from 'react';
import { Play, Compass, Wind, Eye } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenControls: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, onOpenControls }) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between p-8 md:p-12 select-none">
      {/* Top Bar Spec Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 bg-slate-900/85 border border-red-500/30 px-4 py-2 rounded-lg text-xs tracking-wider uppercase text-slate-300 font-tech">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="font-bold text-red-400">MANHATTAN SECTOR 01</span>
          <span className="text-slate-500">|</span>
          <span>EMPIRE STATE VANTAGE</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-tech">
          <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">OPEN WORLD 3D</span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">PENDULUM PHYSICS</span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">NYC LANDMARKS</span>
        </div>
      </div>

      {/* Hero Bespoke SVG Title Lockup */}
      <div className="max-w-2xl mt-auto mb-10">
        <div className="mb-3 flex items-center space-x-2 text-amber-400 font-tech text-sm tracking-widest uppercase font-bold">
          <Wind className="w-4 h-4 text-red-500" />
          <span>MARVEL COMICS UNIVERSE OPEN-WORLD</span>
        </div>

        {/* Bespoke Graphic SVG Title */}
        <div className="relative mb-4">
          <svg viewBox="0 0 760 130" className="w-full max-w-xl drop-shadow-[0_10px_25px_rgba(225,29,72,0.45)]">
            <defs>
              <linearGradient id="spiderTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="subTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>

            {/* Primary SPIDER-MAN Text */}
            <text
              x="0"
              y="72"
              fill="url(#spiderTitleGrad)"
              fontFamily="Impact, sans-serif"
              fontSize="82"
              fontWeight="900"
              letterSpacing="2"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinejoin="round"
            >
              SPIDER-MAN
            </text>

            {/* Subtitle NYC WEB-SLINGER 3D */}
            <text
              x="4"
              y="114"
              fill="url(#subTitleGrad)"
              fontFamily="Arial Black, Impact, sans-serif"
              fontSize="30"
              fontWeight="900"
              letterSpacing="6"
              stroke="#050811"
              strokeWidth="3"
            >
              NYC WEB-SLINGER 3D
            </text>
          </svg>
        </div>

        <p className="text-slate-200 text-sm md:text-base max-w-lg mb-8 leading-relaxed font-sans drop-shadow-md">
          Sling through the towering skyscrapers of Manhattan with realistic pendulum physics. Dive-bomb through street canyons, scale iconic landmarks, and defend New York City.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onStartGame}
            className="flex items-center space-x-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-comic text-2xl tracking-wider px-8 py-3.5 rounded-lg shadow-xl shadow-red-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>SWING INTO THE CITY</span>
            <span className="text-xs bg-red-800/80 px-2 py-0.5 rounded font-mono font-normal">SPACE / ENTER</span>
          </button>

          <button
            onClick={onOpenControls}
            className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-tech font-bold text-sm px-5 py-3.5 rounded-lg border border-slate-700/60 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>HOW TO SWING</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-tech text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="text-slate-200 font-bold">CONTROLS:</span>
          <span><strong className="text-white">WASD</strong> Move / Pump Swing</span>
          <span>·</span>
          <span><strong className="text-white">SPACE / CLICK</strong> Web-Swing & Apex Jump</span>
          <span>·</span>
          <span><strong className="text-white">SHIFT</strong> Dive Bomb</span>
          <span>·</span>
          <span><strong className="text-white">E</strong> Web-Zip / Launch</span>
          <span>·</span>
          <span><strong className="text-white">ESC</strong> Pause</span>
        </div>
        <div className="hidden sm:block text-slate-500">
          POWERED BY THREE.JS PBR & REAL-TIME WEB AUDIO
        </div>
      </div>
    </div>
  );
};
