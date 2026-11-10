/**
 * Procedural Visual FX for Spider-Man NYC Web-Slinger 3D.
 * Includes high-speed aerodynamic wind streak lines, impact dust puffs,
 * and Spider-Sense tingling warning arcs.
 */
import * as THREE from 'three';

export interface VisualEffects {
  group: THREE.Group;
  update: (delta: number, playerPos: THREE.Vector3, playerVel: THREE.Vector3, speedMph: number) => void;
  triggerSpiderSense: () => void;
  triggerImpactDust: (pos: THREE.Vector3) => void;
}

export function createVisualEffects(scene: THREE.Scene): VisualEffects {
  const vfxGroup = new THREE.Group();
  scene.add(vfxGroup);

  // ==========================================
  // 1. HIGH-SPEED AERODYNAMIC WIND STREAKS
  // ==========================================
  const streakCount = 45;
  const streakGeo = new THREE.BufferGeometry();
  const streakPositions = new Float32Array(streakCount * 2 * 3);

  // Initialize random streaks around player
  for (let i = 0; i < streakCount; i++) {
    const rx = (Math.random() - 0.5) * 12;
    const ry = (Math.random() - 0.5) * 10;
    const rz = (Math.random() - 0.5) * 12;

    streakPositions[i * 6] = rx;
    streakPositions[i * 6 + 1] = ry;
    streakPositions[i * 6 + 2] = rz;

    streakPositions[i * 6 + 3] = rx;
    streakPositions[i * 6 + 4] = ry + 2;
    streakPositions[i * 6 + 5] = rz;
  }

  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
  const streakMat = new THREE.LineBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.0,
    linewidth: 1.5,
  });

  const speedStreaks = new THREE.LineSegments(streakGeo, streakMat);
  speedStreaks.frustumCulled = false;
  vfxGroup.add(speedStreaks);

  // ==========================================
  // 2. SPIDER-SENSE TINGLING ARC EFFECT
  // ==========================================
  const senseArcsGroup = new THREE.Group();
  senseArcsGroup.visible = false;
  vfxGroup.add(senseArcsGroup);

  const senseMat = new THREE.LineBasicMaterial({
    color: 0xf43f5e,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
  });

  // Create iconic squiggly tingling waves above head
  for (let a = 0; a < 5; a++) {
    const angle = (a - 2) * 0.35;
    const curvePoints: THREE.Vector3[] = [];
    for (let s = 0; s < 4; s++) {
      const dist = 0.6 + s * 0.25;
      const wobble = (s % 2 === 0 ? 0.08 : -0.08);
      curvePoints.push(
        new THREE.Vector3(
          Math.sin(angle) * dist + wobble,
          Math.cos(angle) * dist,
          0
        )
      );
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const arcLine = new THREE.Line(arcGeo, senseMat);
    senseArcsGroup.add(arcLine);
  }

  let senseTimer = 0;

  const triggerSpiderSense = () => {
    senseArcsGroup.visible = true;
    senseTimer = 0.5;
  };

  const triggerImpactDust = (pos: THREE.Vector3) => {
    // Quick ground impact flash
    const flashGeo = new THREE.RingGeometry(0.2, 2.5, 16);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.position.copy(pos);
    flashMesh.position.y += 0.05;
    flashMesh.rotation.x = -Math.PI / 2;
    scene.add(flashMesh);

    // Fade out and dispose
    let fadeTime = 0.25;
    const fadeInterval = setInterval(() => {
      fadeTime -= 0.05;
      flashMesh.scale.addScalar(0.15);
      flashMat.opacity = fadeTime * 3.2;
      if (fadeTime <= 0) {
        clearInterval(fadeInterval);
        scene.remove(flashMesh);
        flashGeo.dispose();
        flashMat.dispose();
      }
    }, 50);
  };

  const update = (delta: number, playerPos: THREE.Vector3, playerVel: THREE.Vector3, speedMph: number) => {
    // Update Wind Streaks
    const normSpeed = Math.max(0, Math.min(1, (speedMph - 25) / 65));
    streakMat.opacity = normSpeed * 0.75;

    if (normSpeed > 0.05) {
      speedStreaks.position.copy(playerPos);
      const posAttr = streakGeo.attributes.position as THREE.BufferAttribute;
      const velNorm = playerVel.clone().normalize();
      const streakLength = 2.0 + normSpeed * 5.0;

      for (let i = 0; i < streakCount; i++) {
        // Move streak positions along inverted velocity
        let px = posAttr.getX(i * 2);
        let py = posAttr.getY(i * 2);
        let pz = posAttr.getZ(i * 2);

        px += (Math.random() - 0.5) * 0.2;
        py += (Math.random() - 0.5) * 0.2;
        pz += (Math.random() - 0.5) * 0.2;

        posAttr.setXYZ(i * 2, px, py, pz);
        posAttr.setXYZ(
          i * 2 + 1,
          px - velNorm.x * streakLength,
          py - velNorm.y * streakLength,
          pz - velNorm.z * streakLength
        );
      }
      posAttr.needsUpdate = true;
    }

    // Update Spider-Sense tingling
    if (senseTimer > 0) {
      senseTimer -= delta;
      senseArcsGroup.position.copy(playerPos);
      senseArcsGroup.position.y += 1.8;
      senseArcsGroup.scale.setScalar(1 + Math.sin(senseTimer * 20) * 0.2);
      if (senseTimer <= 0) {
        senseArcsGroup.visible = false;
      }
    }
  };

  return {
    group: vfxGroup,
    update,
    triggerSpiderSense,
    triggerImpactDust,
  };
}
