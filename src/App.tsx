/**
 * Spider-Man: NYC Web-Slinger 3D - Main Application Entry.
 * Mounts WebGL canvas inside an isolated container and orchestrates HUD,
 * Title Screen, and Landmark Discovery Modals.
 */
import React, { useEffect, useRef, useState } from 'react';
import { initGameEngine, GameEngine, GameMode, TimeOfDay } from './game/engine';
import { LandmarkData } from './game/city';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { LandmarkCard } from './components/LandmarkCard';
import { ChallengeModal } from './components/ChallengeModal';
import { PauseModal } from './components/PauseModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [gameMode, setGameMode] = useState<GameMode>('title');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('sunset');
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // In-Game Telemetry State
  const [telemetry, setTelemetry] = useState({
    speedMph: 0,
    altitudeFt: 705,
    webFluid: 100,
    momentumGauge: 0,
    comboCount: 0,
    anchorBuilding: undefined as string | undefined,
    isSwinging: false,
    isDiving: false,
    isWallRunning: false,
    isZipping: false,
    canAnchor: false,
  });

  // Modal States
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isControlsGuideOpen, setIsControlsGuideOpen] = useState(false);
  const [discoveredLandmark, setDiscoveredLandmark] = useState<LandmarkData | null>(null);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = initGameEngine(canvasMountRef.current, (data) => {
      setTelemetry({
        speedMph: data.speedMph,
        altitudeFt: data.altitudeFt,
        webFluid: data.webFluid,
        momentumGauge: data.momentumGauge,
        comboCount: data.comboCount,
        anchorBuilding: data.anchorBuilding,
        isSwinging: data.isSwinging,
        isDiving: data.isDiving,
        isWallRunning: data.isWallRunning,
        isZipping: data.isZipping,
        canAnchor: data.canAnchor,
      });

      // Check if landmark was discovered
      if (engine.missions.recentlyDiscoveredLandmark) {
        setDiscoveredLandmark(engine.missions.recentlyDiscoveredLandmark);
        engine.missions.dismissLandmarkPopup();
      }
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.setGameMode('playing');
    setGameMode('playing');
  };

  const handleChangeTimeOfDay = (tod: TimeOfDay) => {
    if (!engineRef.current) return;
    engineRef.current.setTimeOfDay(tod);
    setTimeOfDay(tod);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenPause = () => {
    if (!engineRef.current) return;
    engineRef.current.setGameMode('paused');
    setGameMode('paused');
    setIsPauseOpen(true);
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.setGameMode('playing');
    setGameMode('playing');
    setIsPauseOpen(false);
  };

  const handleRestartCheckpoint = () => {
    if (!engineRef.current) return;
    engineRef.current.physics.resetToCheckpoint();
    handleResume();
  };

  const handleReturnToTitle = () => {
    if (!engineRef.current) return;
    engineRef.current.setGameMode('title');
    setGameMode('title');
    setIsPauseOpen(false);
  };

  const handleFastTravel = (landmarkId: string) => {
    if (!engineRef.current) return;
    engineRef.current.fastTravelToLandmark(landmarkId);
  };

  const handleStartChallenge = (challengeId: string) => {
    if (!engineRef.current) return;
    engineRef.current.missions.startChallenge(challengeId);
  };

  const handleAbandonChallenge = () => {
    if (!engineRef.current) return;
    engineRef.current.missions.abandonChallenge();
  };

  const landmarks = engineRef.current?.city.landmarks || [];
  const challenges = engineRef.current?.missions.challenges || [];
  const activeChallenge = engineRef.current?.missions.activeChallenge || null;
  const challengeTimer = engineRef.current?.missions.challengeTimer || 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {gameMode === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenControls={() => setIsControlsGuideOpen(true)}
        />
      )}

      {/* In-Game World-Matched HUD */}
      {gameMode === 'playing' && (
        <HUD
          speedMph={telemetry.speedMph}
          altitudeFt={telemetry.altitudeFt}
          webFluid={telemetry.webFluid}
          momentumGauge={telemetry.momentumGauge}
          comboCount={telemetry.comboCount}
          anchorBuilding={telemetry.anchorBuilding}
          isSwinging={telemetry.isSwinging}
          isDiving={telemetry.isDiving}
          isWallRunning={telemetry.isWallRunning}
          isZipping={telemetry.isZipping}
          canAnchor={telemetry.canAnchor}
          timeOfDay={timeOfDay}
          onChangeTimeOfDay={handleChangeTimeOfDay}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenPause={handleOpenPause}
          onOpenChallenges={() => setIsChallengesOpen(true)}
          landmarks={landmarks}
          onFastTravel={handleFastTravel}
          activeChallenge={activeChallenge}
          challengeTimer={challengeTimer}
        />
      )}

      {/* Landmark Discovery Popup Card */}
      <LandmarkCard
        landmark={discoveredLandmark}
        onClose={() => setDiscoveredLandmark(null)}
        onFastTravel={handleFastTravel}
      />

      {/* Speed-Swing Ring Challenge Modal */}
      <ChallengeModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        challenges={challenges}
        onStartChallenge={handleStartChallenge}
        activeChallenge={activeChallenge}
        onAbandonChallenge={handleAbandonChallenge}
      />

      {/* Pause Menu Modal */}
      <PauseModal
        isOpen={isPauseOpen}
        onResume={handleResume}
        onRestart={handleRestartCheckpoint}
        onReturnToTitle={handleReturnToTitle}
        landmarks={landmarks}
        onFastTravel={handleFastTravel}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Controls & Mechanics Tutorial Guide Modal */}
      <ControlsGuideModal
        isOpen={isControlsGuideOpen}
        onClose={() => setIsControlsGuideOpen(false)}
      />
    </div>
  );
}
