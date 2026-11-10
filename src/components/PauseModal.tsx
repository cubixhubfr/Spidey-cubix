/**
 * Pause Menu Modal & Fast Travel Checkpoints.
 */
import React from 'react';
import { LandmarkData } from '../game/city';
import { Play, RotateCcw, Volume2, VolumeX, Compass, Home, X } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnToTitle: () => void;
  landmarks: LandmarkData[];
  onFastTravel: (id: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onReturnToTitle,
  landmarks,
  onFastTravel,
  isMuted,
  onToggleMute,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-4 select-none pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <span className="text-xs uppercase font-tech tracking-widest text-red-400 font-bold block">
              PATROL SUSPENDED
            </span>
            <h2 className="font-comic text-3xl tracking-wide text-white">
              GAME PAUSED
            </h2>
          </div>
          <button
            onClick={onResume}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Controls Top Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={onResume}
            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-tech font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-tech font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHECKPOINT</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`flex items-center justify-center space-x-2 font-tech font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-950/60 text-amber-300 border border-amber-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isMuted ? 'UNMUTE' : 'MUTE SFX'}</span>
          </button>

          <button
            onClick={onReturnToTitle}
            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-tech font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>TITLE SCREEN</span>
          </button>
        </div>

        {/* NYC Landmarks Fast Travel */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs font-tech font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>FAST-TRAVEL CHECKPOINTS (NYC LANDMARKS)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {landmarks.map((lm) => (
              <button
                key={lm.id}
                onClick={() => {
                  onFastTravel(lm.id);
                  onResume();
                }}
                className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/50 p-2.5 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate font-sans">
                  {lm.name}
                </div>
                <div className="text-[11px] text-slate-400 font-tech">
                  {lm.height}m · {lm.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-tech text-slate-300">
          <div className="text-white font-bold mb-2 uppercase tracking-wider text-slate-200">
            HERO CONTROLS GUIDE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <strong className="text-white">WASD:</strong> Move / Pump swing height
            </div>
            <div>
              <strong className="text-white">SPACE / MOUSE 1:</strong> Web-Swing & Apex Jump
            </div>
            <div>
              <strong className="text-white">SHIFT:</strong> Dive-Bomb through canyons
            </div>
            <div>
              <strong className="text-white">E / MOUSE 2:</strong> Web-Zip Point Launch
            </div>
            <div>
              <strong className="text-white">WALL + FORWARD:</strong> Vertical Wall-Run
            </div>
            <div>
              <strong className="text-white">MOUSE:</strong> 360° Camera Look
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
