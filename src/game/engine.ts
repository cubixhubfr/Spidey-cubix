/**
 * Master Three.js Game Engine for Spider-Man NYC Web-Slinger 3D.
 * Manages WebGL lifecycle, software WebGL pacing, lights, environment PMREM,
 * camera kinematics, controls input, and game state loops.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildNYCEnvironment, CityEnvironment } from './city';
import { createSpiderManCharacter, SpiderManCharacter } from './character';
import { createPhysicsEngine, PhysicsEngine, InputState } from './physics';
import { createMissionsManager, MissionsManager } from './missions';
import { createVisualEffects, VisualEffects } from './vfx';
import { sound } from './audio';

export type GameMode = 'title' | 'playing' | 'paused' | 'photo_mode';
export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface GameEngine {
  city: CityEnvironment;
  character: SpiderManCharacter;
  physics: PhysicsEngine;
  missions: MissionsManager;
  vfx: VisualEffects;
  setGameMode: (mode: GameMode) => void;
  getGameMode: () => GameMode;
  setTimeOfDay: (tod: TimeOfDay) => void;
  getTimeOfDay: () => TimeOfDay;
  fastTravelToLandmark: (landmarkId: string) => void;
  dispose: () => void;
}

export function initGameEngine(
  container: HTMLDivElement,
  onStateUpdate: (data: {
    speedMph: number;
    altitudeFt: number;
    webFluid: number;
    momentumGauge: number;
    comboCount: number;
    mode: GameMode;
    anchorBuilding?: string;
    isSwinging: boolean;
    isDiving: boolean;
    isWallRunning: boolean;
    isZipping: boolean;
    canAnchor: boolean;
  }) => void
): GameEngine {
  // 1. Detect Software WebGL
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  })();

  // 2. Setup Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // 3. Scene & Camera Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf59e0b);

  const camera = new THREE.PerspectiveCamera(
    68,
    container.clientWidth / container.clientHeight,
    0.1,
    1800
  );
  camera.position.set(0, 220, 35);

  // 4. Studio Environment Reflection (RoomEnvironment)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  pmremGenerator.dispose();

  // 5. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
  const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x0f172a, 1.2);
  hemiLight.position.set(0, 300, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffedd5, 2.4);
  keyLight.position.set(250, 400, 180);
  if (!isSoftwareGl) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 50;
    keyLight.shadow.camera.far = 700;
    const d = 160;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
  }
  scene.add(keyLight);

  // 6. Subsystem Instantiation
  const city = buildNYCEnvironment(scene);
  const character = createSpiderManCharacter();
  scene.add(character.group);

  const physics = createPhysicsEngine(character, city, camera);
  const missions = createMissionsManager(scene, city);
  const vfx = createVisualEffects(scene);

  let currentMode: GameMode = 'title';
  let currentTimeOfDay: TimeOfDay = 'sunset';

  const setTimeOfDay = (tod: TimeOfDay) => {
    currentTimeOfDay = tod;
    city.setTimeOfDay(tod);

    if (tod === 'sunset') {
      scene.background = new THREE.Color(0xd97706);
      hemiLight.color.setHex(0xfde68a);
      hemiLight.groundColor.setHex(0x312e81);
      hemiLight.intensity = 1.3;
      keyLight.color.setHex(0xf97316);
      keyLight.intensity = 2.6;
    } else if (tod === 'night') {
      scene.background = new THREE.Color(0x050811);
      hemiLight.color.setHex(0x1e3a8a);
      hemiLight.groundColor.setHex(0x020617);
      hemiLight.intensity = 0.6;
      keyLight.color.setHex(0x38bdf8);
      keyLight.intensity = 1.0;
    } else {
      // Day
      scene.background = new THREE.Color(0x7dd3fc);
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0x334155);
      hemiLight.intensity = 1.5;
      keyLight.color.setHex(0xffffff);
      keyLight.intensity = 2.8;
    }
  };

  setTimeOfDay('sunset');

  // Fast Travel to NYC Landmarks
  const fastTravelToLandmark = (landmarkId: string) => {
    const lm = city.landmarks.find((l) => l.id === landmarkId);
    if (!lm) return;
    physics.teleportTo(lm.position.clone());
    sound.playWebZip();
  };

  // 7. Input Handling System
  const input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    swing: false,
    swingJustPressed: false,
    jumpJustPressed: false,
    zipJustPressed: false,
    dive: false,
  };

  // Camera Orbit Euler for Mouse Look
  let cameraPitch = 0.05;
  let cameraYaw = Math.PI;
  let isPointerLocked = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    // If on title screen, pressing Space or Enter starts the game
    if (currentMode === 'title') {
      if (e.code === 'Space' || e.code === 'Enter') {
        sound.init();
        setGameMode('playing');
        return;
      }
    }

    if (e.code === 'Escape') {
      if (currentMode === 'playing') {
        setGameMode('paused');
      } else if (currentMode === 'paused') {
        setGameMode('playing');
      }
      return;
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        input.right = true;
        break;
      case 'Space':
        if (!input.swing) input.swingJustPressed = true;
        input.swing = true;
        input.jumpJustPressed = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        input.dive = true;
        break;
      case 'KeyE':
        input.zipJustPressed = true;
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        input.right = false;
        break;
      case 'Space':
        input.swing = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        input.dive = false;
        break;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (currentMode === 'title') {
      sound.init();
      setGameMode('playing');
      return;
    }

    if (currentMode !== 'playing') return;

    if (e.button === 0) {
      // Left click = Web Swing
      if (!input.swing) input.swingJustPressed = true;
      input.swing = true;
    } else if (e.button === 2) {
      // Right click = Web-Zip Point Launch
      input.zipJustPressed = true;
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      input.swing = false;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (currentMode !== 'playing' && currentMode !== 'photo_mode') return;

    const sensitivity = 0.0028;
    cameraYaw -= e.movementX * sensitivity;
    cameraPitch = Math.max(-1.1, Math.min(1.1, cameraPitch - e.movementY * sensitivity));

    // Update camera direction based on yaw/pitch
    const cosPitch = Math.cos(cameraPitch);
    const camDirX = Math.sin(cameraYaw) * cosPitch;
    const camDirY = Math.sin(cameraPitch);
    const camDirZ = Math.cos(cameraYaw) * cosPitch;

    const lookTarget = camera.position.clone().add(new THREE.Vector3(camDirX, camDirY, camDirZ));
    camera.lookAt(lookTarget);
  };

  // Clear held keys on blur
  const handleWindowBlur = () => {
    input.forward = false;
    input.backward = false;
    input.left = false;
    input.right = false;
    input.swing = false;
    input.dive = false;
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleWindowBlur);

  const canvas = renderer.domElement;
  canvas.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('mousemove', handleMouseMove);

  // Resize handler
  const handleResize = () => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', handleResize);

  // 8. Software WebGL Loop Pacer (FenceSync)
  let frameId = 0;
  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 60);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  // 9. Main Animation Loop
  let lastTime = performance.now();
  let titleOrbitAngle = 0;

  const tick = () => {
    const now = performance.now();
    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    city.update(now * 0.001);

    if (currentMode === 'title') {
      // Atmospheric cinematic orbit around Spider-Man perched atop Empire State Spire
      titleOrbitAngle += dt * 0.35;
      const orbitRadius = 14;
      const heroPos = new THREE.Vector3(0, 215, 20);

      camera.position.x = heroPos.x + Math.sin(titleOrbitAngle) * orbitRadius;
      camera.position.z = heroPos.z + Math.cos(titleOrbitAngle) * orbitRadius;
      camera.position.y = heroPos.y + 3.5 + Math.sin(titleOrbitAngle * 0.5) * 1.5;
      camera.lookAt(heroPos.x, heroPos.y + 1.2, heroPos.z);

      character.updateAnimation(dt, 'idle', 0, new THREE.Vector3(), 0);
    } else if (currentMode === 'playing') {
      // Simulation step
      physics.update(dt, input);
      missions.update(dt, physics.state);
      vfx.update(dt, physics.state.position, physics.state.velocity, physics.state.speedMph);

      // Trigger Spider-Sense when diving near ground or high speed close to walls
      if (physics.state.isDiving && physics.state.position.y < 45) {
        vfx.triggerSpiderSense();
      }

      // Reset edge triggers
      input.swingJustPressed = false;
      input.jumpJustPressed = false;
      input.zipJustPressed = false;

      // Dispatch UI update
      onStateUpdate({
        speedMph: physics.state.speedMph,
        altitudeFt: physics.state.altitudeFt,
        webFluid: Math.round(physics.state.webFluid),
        momentumGauge: Math.round(physics.state.momentumGauge),
        comboCount: physics.state.comboCount,
        mode: currentMode,
        anchorBuilding: physics.state.anchorBuilding,
        isSwinging: physics.state.isSwinging,
        isDiving: physics.state.isDiving,
        isWallRunning: physics.state.isWallRunning,
        isZipping: physics.state.isZipping,
        canAnchor: physics.state.canAnchor,
      });
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  };

  // Start loop
  tick();

  const setGameMode = (mode: GameMode) => {
    currentMode = mode;
    if (mode === 'playing') {
      sound.init();
    }
  };

  const getGameMode = () => currentMode;
  const getTimeOfDay = () => currentTimeOfDay;

  // Cleanup
  const dispose = () => {
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);

    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    city,
    character,
    physics,
    missions,
    vfx,
    setGameMode,
    getGameMode,
    setTimeOfDay,
    getTimeOfDay,
    fastTravelToLandmark,
    dispose,
  };
}
