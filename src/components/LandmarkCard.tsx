/**
 * Landmark Discovery Card & Photo Vantage Modal.
 * Shows rich architectural facts, height, and completion badge when discovering NYC landmarks.
 */
import React from 'react';
import { LandmarkData } from '../game/city';
import { Award, Compass, X, MapPin } from 'lucide-react';

interface LandmarkCardProps {
  landmark: LandmarkData | null;
  onClose: () => void;
  onFastTravel?: (id: string) => void;
}

export const LandmarkCard: React.FC<LandmarkCardProps> = ({ landmark, onClose, onFastTravel }) => {
  if (!landmark) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-md p-4 pointer-events-auto select-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-xl shadow-2xl p-5 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-amber-500/20 text-amber-400 p-1.5 rounded-lg border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-tech tracking-widest text-amber-400 font-bold block">
                LANDMARK DISCOVERED
              </span>
              <h3 className="font-comic text-2xl text-white tracking-wide leading-none">
                {landmark.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge & Elevation Pill */}
        <div className="flex items-center space-x-2 mb-3 font-tech text-xs">
          <span className="bg-red-950/80 text-red-300 border border-red-800/60 px-2 py-0.5 rounded font-bold">
            {landmark.badge}
          </span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>ALTITUDE: {landmark.height}M ({Math.round(landmark.height * 3.28)} FT)</span>
          </span>
        </div>

        {/* Architectural Fact */}
        <p className="text-slate-300 text-sm leading-relaxed mb-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          {landmark.fact}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400 font-tech">
            {landmark.shortDesc}
          </span>
          {onFastTravel && (
            <button
              onClick={() => {
                onFastTravel(landmark.id);
                onClose();
              }}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-tech font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>PERCH AT APEX</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
