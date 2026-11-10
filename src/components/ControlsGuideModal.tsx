/**
 * Controls & Swinging Mechanics Guide Modal.
 */
import React from 'react';
import { Compass, X, Wind, ArrowUp, Zap } from 'lucide-react';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-red-500" />
            <h2 className="font-comic text-2xl tracking-wide">
              HOW TO WEB-SWING IN NYC
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300 font-sans">
          {/* Tip 1 */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
            <div className="bg-red-500/20 text-red-400 p-2 rounded-lg shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-tech text-base font-bold text-white uppercase">
                1. Continuous Marvel's Spider-Man Web-Swinging
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Hold <strong className="text-white">SPACE</strong> or <strong className="text-white">LEFT CLICK</strong> near buildings. Web lines attach exclusively to physical building facades on your left or right—never to the sky! Keep holding to smoothly chain swings as Spidey reaches each apex.
              </p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg shrink-0">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-tech text-base font-bold text-white uppercase">
                2. Web-Jump & Speed Boost Releases
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Release <strong className="text-white">SPACE</strong> at the bottom of your swing for maximum horizontal speed. Tap <strong className="text-white">SPACE</strong> near the top of your swing to perform a high Web-Jump slingshot leap into the skyline!
              </p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
            <div className="bg-cyan-500/20 text-cyan-400 p-2 rounded-lg shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-tech text-base font-bold text-white uppercase">
                3. Dive-Bombing, Air Zip & Wall-Running
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Hold <strong className="text-white">SHIFT</strong> to dive-bomb through skyscraper canyons at 120+ MPH, then pull into a swing to redirect all speed forward! Tap <strong className="text-white">E</strong> to Air Zip, or run into skyscraper walls to sprint up their facades!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 bg-red-600 hover:bg-red-500 text-white font-tech font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          GOT IT, LET’S SWING!
        </button>
      </div>
    </div>
  );
};
