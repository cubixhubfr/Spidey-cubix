/**
 * World-Matched, Low-Occlusion In-Game HUD for Spider-Man NYC Web-Slinger 3D.
 * Unobstructed playfield with perimeter clusters:
 * - Speedometer (MPH) & Altitude (ft) with tabular-nums
 * - Web-Fluid & Combo meter
 * - NYC Landmark Compass Radar
 * - Collapsible Bottom Dock for fast-travel checkpoints & challenge launcher
 */
import React, { useState } from 'react';
import { LandmarkData } from '../game/city';
import { SwingChallenge } from '../game/missions';
import { TimeOfDay } from '../game/engine';
import {
  Compass,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  Trophy,
  Pause,
  ChevronDown,
  ChevronUp,
  MapPin,
  Wind,
  ShieldAlert,
} from 'lucide-react';

interface HUDProps {
  speedMph: number;
  altitudeFt: number;
  webFluid: number;
  momentumGauge: number;
  comboCount: number;
  anchorBuilding?: string;
  isSwinging: boolean;
  isDiving: boolean;
  isWallRunning: boolean;
  isZipping: boolean;
  canAnchor?: boolean;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (tod: TimeOfDay) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenChallenges: () => void;
  landmarks: LandmarkData[];
  onFastTravel: (id: string) => void;
  activeChallenge: SwingChallenge | null;
  challengeTimer: number;
}

export const HUD: React.FC<HUDProps> = ({
  speedMph,
  altitudeFt,
  webFluid,
  momentumGauge,
  comboCount,
  anchorBuilding,
  isSwinging,
  isDiving,
  isWallRunning,
  isZipping,
  canAnchor = false,
  timeOfDay,
  onChangeTimeOfDay,
  isMuted,
  onToggleMute,
  onOpenPause,
  onOpenChallenges,
  landmarks,
  onFastTravel,
  activeChallenge,
  challengeTimer,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Speedometer color progression
  let speedColor = 'text-white';
  if (speedMph > 80) speedColor = 'text-amber-400';
  if (speedMph > 110) speedColor = 'text-red-500 animate-pulse';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ========================================== */}
      {/* 1. TOP PERIMETER: STATUS & CONTROLS        */}
      {/* ========================================== */}
      <div className="flex items-start justify-between">
        {/* Top-Left: Hero Vital Cluster & Web Fluid */}
        <div className="flex flex-col space-y-2 pointer-events-auto">
          {/* Hero Insignia & Web-Fluid Bar */}
          <div className="bg-slate-900/90 border border-red-600/40 rounded-xl p-3 shadow-lg flex items-center space-x-3 w-56">
            {/* Spider Mask Emblem */}
            <div className="w-10 h-10 rounded-lg bg-red-600 border border-red-400 flex items-center justify-center shrink-0 shadow-inner">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                <path d="M12 2C8.5 2 6 5.5 6 9.5C6 13.5 9 18 12 22C15 18 18 13.5 18 9.5C18 5.5 15.5 2 12 2ZM8.5 9C8.5 8.2 9.2 7.5 10 7.5C10.8 7.5 11.5 8.2 11.5 9C11.5 9.8 10.8 10.5 10 10.5C9.2 10.5 8.5 9.8 8.5 9ZM14 10.5C13.2 10.5 12.5 9.8 12.5 9C12.5 8.2 13.2 7.5 14 7.5C14.8 7.5 15.5 8.2 15.5 9C15.5 9.8 14.8 10.5 14 10.5Z" />
              </svg>
            </div>

            {/* Fluid Gauge */}
            <div className="flex-1">
              <div className="flex justify-between items-center text-[10px] font-tech text-slate-300 font-bold mb-1">
                <span>WEB FLUID</span>
                <span className="text-cyan-400 tabular-nums">{webFluid}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-75"
                  style={{ width: `${webFluid}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Combo Multiplier Badge */}
          {comboCount > 0 && (
            <div className="bg-red-950/85 border border-red-500/70 text-red-300 px-3 py-1.5 rounded-lg text-xs font-tech font-bold flex items-center space-x-2 w-max animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
              <span>STYLE COMBO:</span>
              <span className="text-amber-400 font-comic text-lg tabular-nums">
                {comboCount}x
              </span>
            </div>
          )}
        </div>

        {/* Top-Center: Anchor Point & Active Mission Tracker */}
        <div className="flex flex-col items-center space-y-2">
          {/* Active Anchor Target HUD */}
          {isSwinging && anchorBuilding && (
            <div className="bg-slate-900/85 border border-cyan-500/50 px-4 py-1.5 rounded-full text-xs font-tech text-cyan-300 flex items-center space-x-2 shadow-lg animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span className="text-slate-400">ANCHORED:</span>
              <span className="font-bold text-white uppercase">{anchorBuilding}</span>
            </div>
          )}

          {/* Active Ring Challenge Timer */}
          {activeChallenge && (
            <div className="bg-amber-950/90 border border-amber-500/80 px-5 py-2 rounded-xl text-white font-tech flex items-center space-x-3 shadow-xl pointer-events-auto">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="text-[10px] text-amber-300 block uppercase font-bold tracking-wider">
                  {activeChallenge.title}
                </span>
                <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                  {challengeTimer.toFixed(1)}s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Game Settings Cluster */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Time of Day Switcher */}
          <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-1 flex items-center space-x-1 shadow-lg">
            <button
              onClick={() => onChangeTimeOfDay('day')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                timeOfDay === 'day' ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Day"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeTimeOfDay('sunset')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                timeOfDay === 'sunset' ? 'bg-orange-500/30 text-orange-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Sunset"
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeTimeOfDay('night')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                timeOfDay === 'night' ? 'bg-blue-500/30 text-blue-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Night Skyline"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Ring Races Modal Launcher */}
          <button
            onClick={onOpenChallenges}
            className="bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-400 p-2.5 rounded-xl shadow-lg transition-colors cursor-pointer"
            title="Trial Challenges"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-xl border shadow-lg transition-colors cursor-pointer ${
              isMuted
                ? 'bg-amber-950/80 border-amber-600/50 text-amber-300'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onOpenPause}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white p-2.5 rounded-xl shadow-lg transition-colors cursor-pointer"
            title="Pause (ESC)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* CENTER: MARVEL'S SPIDER-MAN WEB RETICLE    */}
      {/* ========================================== */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none select-none">
        {canAnchor && !isSwinging && !isWallRunning && (
          <div className="flex flex-col items-center space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-6 h-6 rounded-full border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.5)]">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
            </div>
            <span className="text-[10px] font-tech font-bold text-cyan-300 bg-slate-950/75 px-2 py-0.5 rounded border border-cyan-500/40 tracking-wider">
              SWING READY [SPACE]
            </span>
          </div>
        )}

        {isSwinging && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] font-tech font-bold text-amber-300 bg-slate-950/80 px-2.5 py-0.5 rounded border border-amber-500/50 tracking-wider shadow-lg">
              HOLD SWING · RELEASE TO LAUNCH · [SPACE] WEB-JUMP
            </span>
          </div>
        )}

        {!canAnchor && !isSwinging && !isWallRunning && altitudeFt > 200 && (
          <div className="flex flex-col items-center space-y-1 opacity-70">
            <span className="text-[10px] font-tech font-bold text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-700/50 tracking-wider">
              OPEN SKY · [SHIFT] DIVE BOMB TO REACH CANYON
            </span>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 2. BOTTOM PERIMETER: TELEMETRY & DOCK      */}
      {/* ========================================== */}
      <div className="flex flex-col items-center w-full">
        {/* Telemetry Wings: Left (Speed/Alt) & Right (Compass Radar) */}
        <div className="flex items-end justify-between w-full mb-3">
          {/* Left Wing: High-Tech Speedometer & Altitude Gauges */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl pointer-events-auto flex items-center space-x-6">
            {/* Speedometer */}
            <div>
              <div className="text-[10px] font-tech text-slate-400 uppercase tracking-widest font-bold">
                VELOCITY
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className={`font-comic text-4xl leading-none tabular-nums ${speedColor}`}>
                  {speedMph}
                </span>
                <span className="text-xs font-tech text-slate-400 font-bold">MPH</span>
              </div>
              {/* Momentum arc line */}
              <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 transition-all duration-75"
                  style={{ width: `${momentumGauge}%` }}
                />
              </div>
            </div>

            {/* Altitude Gauge */}
            <div className="border-l border-slate-800 pl-5">
              <div className="text-[10px] font-tech text-slate-400 uppercase tracking-widest font-bold">
                ALTITUDE
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-tech text-2xl font-bold text-cyan-300 leading-none tabular-nums">
                  {altitudeFt}
                </span>
                <span className="text-xs font-tech text-slate-400 font-bold">FT</span>
              </div>
              <span className="text-[10px] text-slate-500 font-tech block mt-1">
                {Math.round(altitudeFt / 3.28)}M AGL
              </span>
            </div>

            {/* Active Kinematic State Badges */}
            <div className="hidden sm:flex flex-col space-y-1 border-l border-slate-800 pl-4 text-[10px] font-tech font-bold uppercase">
              {isSwinging && (
                <span className="text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                  WEB-SWING
                </span>
              )}
              {isDiving && (
                <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  DIVE-BOMB
                </span>
              )}
              {isWallRunning && (
                <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  WALL-RUN
                </span>
              )}
              {isZipping && (
                <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  WEB-ZIP
                </span>
              )}
            </div>
          </div>

          {/* Right Wing: NYC Landmarks Compass Radar */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl pointer-events-auto flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[10px] font-tech text-slate-400 uppercase tracking-widest font-bold block">
                NYC RADAR
              </span>
              <span className="text-sm font-tech font-bold text-white block">
                {landmarks.filter((l) => l.discovered).length} / {landmarks.length}
              </span>
              <span className="text-[10px] text-amber-400 font-tech">LANDMARKS</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center">
              <Compass className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Unified Bottom Control Dock (Collapsible, Zero Viewport Occlusion) */}
        <div className="w-full max-w-4xl pointer-events-auto flex flex-col items-center">
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setDockCollapsed(!dockCollapsed)}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1 rounded-t-lg border-t border-x border-slate-700/80 text-xs font-tech flex items-center space-x-1 cursor-pointer transition-colors shadow-md"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'SHOW DOCK & CHECKPOINTS' : 'COLLAPSE DOCK'}</span>
          </button>

          {/* Dock Content */}
          {!dockCollapsed && (
            <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-150">
              {/* NYC Landmarks Fast-Travel Quick Pills */}
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-2xl py-0.5">
                <span className="text-[11px] font-tech text-slate-400 font-bold mr-1 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>CHECKPOINTS:</span>
                </span>
                {landmarks.map((lm) => (
                  <button
                    key={lm.id}
                    onClick={() => onFastTravel(lm.id)}
                    className="bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-600 px-2.5 py-1 rounded-lg text-xs font-tech font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    {lm.name}
                  </button>
                ))}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={onOpenChallenges}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-tech font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>COURSES</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
