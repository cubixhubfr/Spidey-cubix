/**
 * Speed-Swing Ring Challenge Modal.
 * Displays high-speed canyon ring courses, target times, and start buttons.
 */
import React from 'react';
import { SwingChallenge } from '../game/missions';
import { Trophy, Clock, X, Play, CheckCircle } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: SwingChallenge[];
  onStartChallenge: (id: string) => void;
  activeChallenge: SwingChallenge | null;
  onAbandonChallenge: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onStartChallenge,
  activeChallenge,
  onAbandonChallenge,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-4 select-none pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-tech tracking-widest text-amber-400 font-bold block">
                MANHATTAN TRIAL RACES
              </span>
              <h2 className="font-comic text-2xl tracking-wide">
                SPEED-SWING RING COURSES
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Course Banner */}
        {activeChallenge && (
          <div className="mb-4 bg-amber-950/40 border border-amber-600/50 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
              <span className="font-tech text-sm text-amber-300 font-bold">
                ACTIVE COURSE: {activeChallenge.title}
              </span>
            </div>
            <button
              onClick={onAbandonChallenge}
              className="bg-red-800/80 hover:bg-red-700 text-xs px-2.5 py-1 rounded font-tech text-white cursor-pointer"
            >
              ABANDON
            </button>
          </div>
        )}

        {/* Challenge Cards List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {challenges.map((ch) => {
            const isActive = activeChallenge?.id === ch.id;
            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-950/20 border-amber-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-comic text-xl text-white tracking-wide">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      onStartChallenge(ch.id);
                      onClose();
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-tech text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isActive ? 'RESTART' : 'START COURSE'}</span>
                  </button>
                </div>

                {/* Target Medals */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-tech">
                  <div className="bg-slate-900/80 p-2 rounded flex items-center justify-between">
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <span>🥇 GOLD:</span>
                    </span>
                    <span className="font-mono text-slate-200">≤ {ch.goldTime}s</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center space-x-1">
                      <span>🥈 SILVER:</span>
                    </span>
                    <span className="font-mono text-slate-200">≤ {ch.silverTime}s</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded flex items-center justify-between">
                    <span className="text-amber-600 font-bold flex items-center space-x-1">
                      <span>🥉 BRONZE:</span>
                    </span>
                    <span className="font-mono text-slate-200">≤ {ch.bronzeTime}s</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
