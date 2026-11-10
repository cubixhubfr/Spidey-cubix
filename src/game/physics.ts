/**
 * Marvel's Spider-Man Realistic Web-Swinging & Kinematic Physics Engine.
 * Features:
 * - Physical building anchor detection (No sky swinging!)
 * - Elastic pendulum dynamics with centrifugal acceleration
 * - Continuous Marvel's Spider-Man auto-apex release & re-latch flow
 * - Body banking & corner turning
 * - High-speed dive-bombing into ground-skimming swoops
 * - Vertical & horizontal skyscraper wall-running with roof vaults
 * - Air Web-Zip and Point Launches
 * - Zero sky collisions (open sky is 100% unobstructed)
 */
import * as THREE from 'three';
import { CityEnvironment } from './city';
import { CharacterState, SpiderManCharacter } from './character';
import { sound } from './audio';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  swing: boolean;
  swingJustPressed: boolean;
  jumpJustPressed: boolean;
  zipJustPressed: boolean;
  dive: boolean;
}

export interface PlayerPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speedMph: number;
  altitudeFt: number;
  isGrounded: boolean;
  isWallRunning: boolean;
  isSwinging: boolean;
  isDiving: boolean;
  isZipping: boolean;
  anchorPoint: THREE.Vector3 | null;
  anchorBuilding?: string;
  swingArm: 'left' | 'right';
  swingProgress: number;
  bankAngle: number;
  comboCount: number;
  webFluid: number;
  momentumGauge: number;
  canAnchor: boolean;
}

export interface PhysicsEngine {
  state: PlayerPhysicsState;
  update: (delta: number, input: InputState) => void;
  webLine: THREE.Line;
  zipLines: THREE.Line[];
  teleportTo: (pos: THREE.Vector3) => void;
  resetToCheckpoint: () => void;
}

export function createPhysicsEngine(
  character: SpiderManCharacter,
  city: CityEnvironment,
  camera: THREE.PerspectiveCamera
): PhysicsEngine {
  // Reusable vectors for zero GC
  const _gravity = new THREE.Vector3(0, -26.0, 0);
  const _forward = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _camDir = new THREE.Vector3();
  const _toAnchor = new THREE.Vector3();
  const _tangent = new THREE.Vector3();
  const _targetCamPos = new THREE.Vector3();
  const _targetCamLook = new THREE.Vector3();

  // Initial State: Perched on Empire State Building 86th floor observation terrace
  const state: PlayerPhysicsState = {
    position: new THREE.Vector3(0, 226, 18),
    velocity: new THREE.Vector3(0, 0, 0),
    speedMph: 0,
    altitudeFt: Math.round(226 * 3.28),
    isGrounded: true,
    isWallRunning: false,
    isSwinging: false,
    isDiving: false,
    isZipping: false,
    anchorPoint: null,
    anchorBuilding: undefined,
    swingArm: 'right',
    swingProgress: 0,
    bankAngle: 0,
    comboCount: 0,
    webFluid: 100,
    momentumGauge: 0,
    canAnchor: false,
  };

  character.group.position.copy(state.position);

  // Web Line Rendering (Main swing web strand)
  const webCurvePoints = [new THREE.Vector3(), new THREE.Vector3()];
  const webGeo = new THREE.BufferGeometry().setFromPoints(webCurvePoints);
  const webMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
    transparent: true,
    opacity: 0.95,
  });
  const webLine = new THREE.Line(webGeo, webMat);
  webLine.visible = false;
  webLine.frustumCulled = false;
  city.scene.add(webLine);

  // Twin Web-Zip Lines
  const zipLines: THREE.Line[] = [];
  for (let i = 0; i < 2; i++) {
    const zGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const zMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const zLine = new THREE.Line(zGeo, zMat);
    zLine.visible = false;
    zLine.frustumCulled = false;
    city.scene.add(zLine);
    zipLines.push(zLine);
  }

  // Internal physics timers & states
  let initialRopeLength = 0;
  let swingDuration = 0;
  let reSwingCooldown = 0;
  let zipTarget: THREE.Vector3 | null = null;
  let zipTimer = 0;
  let comboResetTimer = 0;
  let lastAnchorSide: 'left' | 'right' = 'right';
  let wallNormal = new THREE.Vector3();
  let wallRunTimer = 0;

  const teleportTo = (pos: THREE.Vector3) => {
    state.position.copy(pos);
    state.velocity.set(0, 0, 0);
    state.isSwinging = false;
    state.isWallRunning = false;
    state.isZipping = false;
    state.isDiving = false;
    state.anchorPoint = null;
    webLine.visible = false;
    zipLines.forEach((l) => (l.visible = false));
    character.group.position.copy(pos);
  };

  const resetToCheckpoint = () => {
    teleportTo(new THREE.Vector3(0, 226, 18));
  };

  const update = (delta: number, input: InputState) => {
    const dt = Math.min(delta, 0.04);

    // Get camera orientation
    camera.getWorldDirection(_camDir);
    const camDirH = _camDir.clone().setY(0).normalize();
    _right.crossVectors(camDirH, new THREE.Vector3(0, 1, 0)).normalize();
    _forward.copy(camDirH);

    // Fluid regeneration
    if (state.webFluid < 100) {
      state.webFluid = Math.min(100, state.webFluid + dt * 20);
    }

    // Combo decay
    if (state.comboCount > 0) {
      comboResetTimer += dt;
      if (comboResetTimer > 5.0) {
        state.comboCount = 0;
      }
    }

    if (reSwingCooldown > 0) {
      reSwingCooldown -= dt;
    }

    // Pre-scan for valid building anchor in range
    const prospectiveAnchor = city.findBestWebAnchor(
      state.position,
      state.velocity,
      _camDir,
      lastAnchorSide === 'right' ? 'left' : 'right'
    );
    state.canAnchor = prospectiveAnchor !== null;

    // ==========================================
    // 1. WEB-ZIP / AIR ZIP / POINT LAUNCH
    // ==========================================
    if (input.zipJustPressed && !state.isZipping && state.webFluid >= 8) {
      const target = city.findWebZipTarget(state.position, camera.getWorldDirection(new THREE.Vector3()));
      if (target) {
        // Point Launch
        zipTarget = target.point.clone();
        state.isZipping = true;
        zipTimer = 0;
        state.isSwinging = false;
        webLine.visible = false;
        state.webFluid -= 8;
        sound.playWebShoot();
        sound.playWebZip();
      } else {
        // Marvel's Spider-Man Air Zip: Quick forward boost in mid-air
        state.velocity.addScaledVector(_forward, 24);
        state.velocity.y = Math.max(state.velocity.y, 4);
        state.isSwinging = false;
        webLine.visible = false;
        state.webFluid -= 5;
        sound.playWebShoot();
        sound.playWebZip();
        state.comboCount++;
        comboResetTimer = 0;
      }
    }

    if (state.isZipping && zipTarget) {
      zipTimer += dt;
      const toTarget = zipTarget.clone().sub(state.position);
      const dist = toTarget.length();

      // Render twin zip cables
      const lHand = character.getLeftHandPos();
      const rHand = character.getRightHandPos();

      const pos0 = zipLines[0].geometry.attributes.position as THREE.BufferAttribute;
      pos0.setXYZ(0, lHand.x, lHand.y, lHand.z);
      pos0.setXYZ(1, zipTarget.x - 0.4, zipTarget.y, zipTarget.z);
      pos0.needsUpdate = true;
      zipLines[0].visible = true;

      const pos1 = zipLines[1].geometry.attributes.position as THREE.BufferAttribute;
      pos1.setXYZ(0, rHand.x, rHand.y, rHand.z);
      pos1.setXYZ(1, zipTarget.x + 0.4, zipTarget.y, zipTarget.z);
      pos1.needsUpdate = true;
      zipLines[1].visible = true;

      if (dist < 4.5 || zipTimer > 0.75) {
        // Slingshot Point Launch over the perch!
        state.isZipping = false;
        zipLines[0].visible = false;
        zipLines[1].visible = false;
        state.velocity.copy(_forward).multiplyScalar(36);
        state.velocity.y = 20; // High slingshot leap!
        sound.playJump();
        state.comboCount++;
        comboResetTimer = 0;
      } else {
        // Fast zip pull
        state.velocity.copy(toTarget.normalize()).multiplyScalar(75);
        state.position.addScaledVector(state.velocity, dt);
      }
    } else {
      zipLines[0].visible = false;
      zipLines[1].visible = false;
    }

    // ==========================================
    // 2. MARVEL'S SPIDER-MAN WEB-SWINGING FLOW
    // ==========================================
    const wantToSwing = input.swing && !state.isGrounded && !state.isWallRunning && !state.isZipping;

    // Attach web if wanting to swing and not already swinging
    if (wantToSwing && !state.isSwinging && reSwingCooldown <= 0 && state.webFluid >= 4) {
      const nextSide = lastAnchorSide === 'right' ? 'left' : 'right';
      const anchorData = city.findBestWebAnchor(state.position, state.velocity, _camDir, nextSide);

      if (anchorData) {
        state.anchorPoint = anchorData.point.clone();
        state.anchorBuilding = anchorData.buildingName;
        state.swingArm = anchorData.side;
        lastAnchorSide = anchorData.side;
        state.isSwinging = true;
        initialRopeLength = state.position.distanceTo(state.anchorPoint);
        swingDuration = 0;
        state.webFluid -= 3;
        state.comboCount++;
        comboResetTimer = 0;

        sound.playWebShoot();
        sound.playWebLatch();
      }
    }

    // PENDULUM SIMULATION
    if (state.isSwinging && state.anchorPoint) {
      swingDuration += dt;
      _toAnchor.copy(state.position).sub(state.anchorPoint);
      const currentRopeDist = _toAnchor.length();
      const ropeDir = _toAnchor.clone().normalize();

      // Gravity pulls down
      state.velocity.addScaledVector(_gravity, dt);

      // Centripetal acceleration along rope: redirects velocity along tangent
      const radialVel = state.velocity.dot(ropeDir);
      if (radialVel > 0) {
        // Cancel outward motion away from anchor
        state.velocity.sub(ropeDir.clone().multiplyScalar(radialVel));
      }

      // Forward swing acceleration (tangential boost)
      // Moving through the bottom of the arc gives maximum acceleration
      const speed = state.velocity.length();
      const heightBelowAnchor = state.anchorPoint.y - state.position.y;
      const isSwingingDown = state.velocity.y < 0;

      // Centrifugal force boosts forward speed at bottom of arc
      if (heightBelowAnchor > 10 && speed > 5) {
        const boost = isSwingingDown ? 18.0 : 12.0;
        state.velocity.addScaledVector(_forward, dt * boost);
      }

      // Swing Pumping: Holding forward adds downward/forward momentum
      if (input.forward) {
        state.velocity.addScaledVector(_forward, dt * 16);
      }

      // Lateral steering through avenue canyons
      if (input.left) {
        state.velocity.addScaledVector(_right, -dt * 18);
      } else if (input.right) {
        state.velocity.addScaledVector(_right, dt * 18);
      }

      // Corner turning & banking: Swing naturally pulls slightly in direction of anchor
      const anchorSideSign = state.swingArm === 'right' ? 1 : -1;
      state.velocity.addScaledVector(_right, anchorSideSign * dt * 8);
      state.bankAngle = THREE.MathUtils.damp(state.bankAngle, anchorSideSign * 0.45, 8, dt);

      // Elastic rope length maintenance
      if (currentRopeDist > initialRopeLength) {
        state.position.copy(state.anchorPoint).add(ropeDir.multiplyScalar(initialRopeLength));
      }

      // Update web line visual
      const handPos = state.swingArm === 'left' ? character.getLeftHandPos() : character.getRightHandPos();
      const posAttr = webLine.geometry.attributes.position as THREE.BufferAttribute;
      posAttr.setXYZ(0, handPos.x, handPos.y, handPos.z);
      posAttr.setXYZ(1, state.anchorPoint.x, state.anchorPoint.y, state.anchorPoint.z);
      posAttr.needsUpdate = true;
      webLine.visible = true;

      // Swing Progress calculation (-1 to 1)
      state.swingProgress = Math.max(-1, Math.min(1, state.velocity.y / 25));

      // =======================================================
      // MARVEL'S SPIDER-MAN AUTO-APEX RELEASE & CHAIN-SWINGING!
      // =======================================================
      // 1. Web-Jump trigger (Player tapped Space while on upswing)
      const isApexJump = input.jumpJustPressed && state.velocity.y > 3;

      // 2. Natural Apex Release (Reached top of forward arc while holding swing)
      const reachedApex = swingDuration > 0.45 && state.velocity.y > -2 && state.velocity.y < 4 && state.position.y > state.anchorPoint.y - 12;

      // 3. User released swing button
      const userReleased = !input.swing;

      if (isApexJump || reachedApex || userReleased) {
        state.isSwinging = false;
        webLine.visible = false;
        sound.playWebRelease();

        if (isApexJump) {
          // Iconic Web-Jump / Slingshot backflip!
          state.velocity.y += 18;
          state.velocity.addScaledVector(_forward, 14);
          sound.playJump();
          state.comboCount++;
          reSwingCooldown = 0.25;
        } else if (reachedApex) {
          // Auto-Apex release: Launch smoothly into the air
          state.velocity.y += 8;
          state.velocity.addScaledVector(_forward, 10);
          sound.playJump();
          // Quick cooldown then auto-re-swing if user is still holding Swing!
          reSwingCooldown = 0.15;
        } else {
          // Bottom release -> Maximum horizontal speed launch!
          if (isSwingingDown || heightBelowAnchor > 15) {
            state.velocity.addScaledVector(_forward, 12);
          }
        }
      }
    } else {
      webLine.visible = false;
      state.bankAngle = THREE.MathUtils.damp(state.bankAngle, 0, 6, dt);
    }

    // ==========================================
    // 3. FREEFALL, DIVE-BOMBING & AIR CONTROL
    // ==========================================
    if (!state.isSwinging && !state.isGrounded && !state.isWallRunning && !state.isZipping) {
      let effGravity = _gravity.y;

      if (input.dive) {
        // High-Speed Aerodynamic Dive-Bomb!
        state.isDiving = true;
        effGravity = _gravity.y * 2.4; // Plunge rapidly like a missile
        state.velocity.addScaledVector(_camDir, dt * 28);
      } else {
        state.isDiving = false;
      }

      state.velocity.y += effGravity * dt;

      // Air control
      if (input.forward) state.velocity.addScaledVector(camDirH, dt * 16);
      if (input.backward) state.velocity.addScaledVector(camDirH, -dt * 12);
      if (input.left) state.velocity.addScaledVector(_right, -dt * 14);
      if (input.right) state.velocity.addScaledVector(_right, dt * 14);

      // Terminal velocity caps
      const maxFall = state.isDiving ? -78 : -50;
      if (state.velocity.y < maxFall) state.velocity.y = maxFall;

      // Air drag (minimal on dive for speed retention)
      const drag = state.isDiving ? 0.998 : 0.993;
      state.velocity.x *= drag;
      state.velocity.z *= drag;
    }

    // ==========================================
    // 4. GROUND RUNNING & JUMPING
    // ==========================================
    if (state.isGrounded && !state.isZipping) {
      state.isDiving = false;
      state.isSwinging = false;
      webLine.visible = false;

      // Ground friction
      state.velocity.x *= 0.86;
      state.velocity.z *= 0.86;

      const moveVec = new THREE.Vector3();
      if (input.forward) moveVec.add(camDirH);
      if (input.backward) moveVec.sub(camDirH);
      if (input.left) moveVec.sub(_right);
      if (input.right) moveVec.add(_right);

      if (moveVec.lengthSq() > 0.01) {
        moveVec.normalize();
        state.velocity.addScaledVector(moveVec, dt * 48);
        const hSpeed = Math.hypot(state.velocity.x, state.velocity.z);
        if (hSpeed > 24) {
          state.velocity.x = (state.velocity.x / hSpeed) * 24;
          state.velocity.z = (state.velocity.z / hSpeed) * 24;
        }
      }

      if (input.jumpJustPressed) {
        state.velocity.y = 18;
        state.isGrounded = false;
        sound.playJump();
      }
    }

    // Apply Velocity to Position
    state.position.addScaledVector(state.velocity, dt);

    // ==========================================
    // 5. BULLETPROOF BUILDING COLLISION & WALL-RUNNING
    // (NO SKY COLLISIONS!)
    // ==========================================
    const playerRadius = 0.85;
    const col = city.checkCollision(state.position, playerRadius);

    if (col.collided) {
      // Push out of solid building or ground
      state.position.addScaledVector(col.normal, col.penetration);

      if (col.isGround) {
        // Rooftop or street landing
        if (!state.isGrounded && state.velocity.y < -12) {
          sound.playImpact(Math.min(1, Math.abs(state.velocity.y) / 35));
        }
        state.isGrounded = true;
        state.isWallRunning = false;
        state.velocity.y = Math.max(0, state.velocity.y);
      } else if (col.isWall) {
        // Wall contact with skyscraper facade
        state.isGrounded = false;
        wallNormal.copy(col.normal);

        // In Marvel's Spider-Man: Wall-running triggers when colliding with a skyscraper face
        // while holding forward or swing
        const dotVelWall = state.velocity.dot(col.normal);
        if (input.forward || input.swing || state.isWallRunning) {
          state.isWallRunning = true;
          state.isSwinging = false;
          webLine.visible = false;
          wallRunTimer += dt;

          // Wall sprint velocity (sprint straight up the skyscraper!)
          state.velocity.y = Math.min(28, Math.max(16, state.velocity.y + 16 * dt));
          // Cancel velocity moving into wall
          if (dotVelWall < 0) {
            state.velocity.sub(col.normal.clone().multiplyScalar(dotVelWall));
          }

          if (wallRunTimer > 0.18) {
            sound.playWallStep();
            wallRunTimer = 0;
          }

          // Wall-Jump: Pressing Jump while on wall kicks off into street canyon
          if (input.jumpJustPressed) {
            state.velocity.addScaledVector(col.normal, 16);
            state.velocity.y = 16;
            state.isWallRunning = false;
            sound.playJump();
          }
        } else {
          // Slide down wall
          state.isWallRunning = false;
          if (dotVelWall < 0) {
            state.velocity.sub(col.normal.clone().multiplyScalar(dotVelWall));
          }
        }
      }
    } else {
      state.isGrounded = false;
      state.isWallRunning = false;
    }

    // ==========================================
    // 6. SPEED & ALTITUDE COMPUTATION
    // ==========================================
    const totalSpeed = state.velocity.length();
    state.speedMph = Math.round(totalSpeed * 2.237);
    state.altitudeFt = Math.max(0, Math.round(state.position.y * 3.28));
    state.momentumGauge = Math.min(100, (state.speedMph / 85) * 100);

    sound.updateSpeedWhoosh(state.speedMph);

    // ==========================================
    // 7. CHARACTER ANIMATION & BANKING
    // ==========================================
    let charState: CharacterState = 'idle';

    if (state.isSwinging) {
      charState = state.swingArm === 'left' ? 'swing_left' : 'swing_right';
    } else if (state.isZipping) {
      charState = 'web_zip';
    } else if (state.isWallRunning) {
      charState = 'wall_run';
    } else if (state.isDiving) {
      charState = 'dive';
    } else if (!state.isGrounded && state.velocity.y > 4) {
      charState = 'jump_apex';
    } else if (state.isGrounded && state.speedMph > 14) {
      charState = 'ground_slide';
    } else {
      charState = 'idle';
    }

    character.group.position.copy(state.position);

    // Dynamic rotation & banking
    if (state.isWallRunning) {
      // Orient facing upward along wall
      character.group.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    } else {
      const hSpeed = Math.hypot(state.velocity.x, state.velocity.z);
      if (hSpeed > 1.2) {
        const yaw = Math.atan2(state.velocity.x, state.velocity.z);
        character.group.rotation.y = THREE.MathUtils.damp(character.group.rotation.y, yaw, 10, dt);
        // Bank roll
        character.group.rotation.z = THREE.MathUtils.damp(character.group.rotation.z, state.bankAngle, 8, dt);
      }
    }

    character.updateAnimation(dt, charState, state.speedMph, state.velocity, state.swingProgress);

    // ==========================================
    // 8. CINEMATIC CAMERA WITH FOV SPEED RUSH
    // ==========================================
    const baseFov = 66;
    const speedRatio = Math.min(1, state.speedMph / 95);
    const targetFov = baseFov + speedRatio * 20;
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
    camera.updateProjectionMatrix();

    // Camera follow rig
    const camDist = 6.2 + speedRatio * 3.0;
    const camHeight = 2.0;

    _targetCamPos.copy(state.position).sub(camDirH.clone().multiplyScalar(camDist));
    _targetCamPos.y += camHeight;

    // Smooth exponential damping
    camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 9, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 8, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 9, dt);

    // Look target
    _targetCamLook.copy(state.position).add(camDirH.clone().multiplyScalar(5));
    _targetCamLook.y += 0.8;
    camera.lookAt(_targetCamLook);
  };

  return {
    state,
    update,
    webLine,
    zipLines,
    teleportTo,
    resetToCheckpoint,
  };
}
