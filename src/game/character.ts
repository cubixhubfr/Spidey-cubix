/**
 * Composite Procedural 3D Spider-Man Hero Character.
 * Built with 12+ articulate parts: Mask with white curved lenses & black rims,
 * red/blue suit anatomy, chest spider insignia, gauntlets with web-shooters,
 * and procedural kinematics for swinging, diving, wall-running, and leaping.
 */
import * as THREE from 'three';
import { createSpiderEyeTexture, createSpiderWebFabricTexture } from './textures';

export type CharacterState =
  | 'idle'
  | 'swing_left'
  | 'swing_right'
  | 'dive'
  | 'jump_apex'
  | 'wall_run'
  | 'web_zip'
  | 'ground_slide';

export interface SpiderManCharacter {
  group: THREE.Group;
  updateAnimation: (
    delta: number,
    state: CharacterState,
    speedMph: number,
    velocity: THREE.Vector3,
    swingProgress: number
  ) => void;
  getLeftHandPos: () => THREE.Vector3;
  getRightHandPos: () => THREE.Vector3;
  setSuitGlow: (glowing: boolean) => void;
}

export function createSpiderManCharacter(): SpiderManCharacter {
  const rootGroup = new THREE.Group();

  // Materials
  const webFabricTex = createSpiderWebFabricTexture();
  const eyeLensTex = createSpiderEyeTexture();

  const matSuitRed = new THREE.MeshStandardMaterial({
    map: webFabricTex,
    color: 0xe11d48, // Crimson red
    roughness: 0.45,
    metalness: 0.15,
  });

  const matSuitBlue = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Vibrant spider blue
    roughness: 0.35,
    metalness: 0.25,
  });

  const matBlackSpider = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.2,
    metalness: 0.5,
  });

  const matEyeWhite = new THREE.MeshStandardMaterial({
    map: eyeLensTex,
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.85,
    emissive: 0x1e293b,
    emissiveIntensity: 0.2,
  });

  const matEyeRim = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.3,
    metalness: 0.3,
  });

  const matWebShooter = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.95,
  });

  // Base Hero Pelvis & Root
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.9, 0);
  rootGroup.add(pelvisGroup);

  const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.24), matSuitBlue);
  pelvisMesh.castShadow = true;
  pelvisGroup.add(pelvisMesh);

  // Red Belt with Web-Shooter Ammo Cartridges
  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.26), matSuitRed);
  beltMesh.position.y = 0.08;
  pelvisGroup.add(beltMesh);

  // Torso / Chest
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.16, 0);
  pelvisGroup.add(torsoGroup);

  // Muscular V-tapered chest (upper torso)
  const chestGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.45, 8);
  const chestMesh = new THREE.Mesh(chestGeo, matSuitRed);
  chestMesh.position.y = 0.22;
  chestMesh.scale.set(1.1, 1, 0.75);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // Blue lateral torso ribs
  [-0.17, 0.17].forEach((sideX) => {
    const lat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.2), matSuitBlue);
    lat.position.set(sideX, 0.2, 0);
    torsoGroup.add(lat);
  });

  // Iconic Spider Insignia on Chest
  const spiderEmblem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.02), matBlackSpider);
  spiderEmblem.position.set(0, 0.25, 0.14);
  torsoGroup.add(spiderEmblem);

  // Neck & Head
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.45, 0);
  torsoGroup.add(neckGroup);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.12, 0);
  neckGroup.add(headGroup);

  // Mask Head
  const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
  headGeo.scale(0.9, 1.15, 1.05);
  const headMesh = new THREE.Mesh(headGeo, matSuitRed);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Curved Spider Eye Lenses (Left & Right)
  const createEyeLens = (isLeft: boolean) => {
    const eye = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // Black contoured rim
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.02), matEyeRim);
    rim.rotation.z = sign * 0.35;
    rim.position.set(sign * 0.06, 0.02, 0.145);
    eye.add(rim);

    // White reflective lens
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.045, 0.025), matEyeWhite);
    lens.rotation.z = sign * 0.35;
    lens.position.set(sign * 0.06, 0.02, 0.15);
    eye.add(lens);

    return eye;
  };

  headGroup.add(createEyeLens(true));
  headGroup.add(createEyeLens(false));

  // ==========================================
  // ARMS & GAUNTLETS
  // ==========================================
  // Left Arm
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.25, 0.36, 0);
  torsoGroup.add(leftShoulder);

  const leftShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), matSuitRed);
  leftShoulder.add(leftShoulderCap);

  const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8), matSuitBlue);
  leftUpperArm.position.y = -0.14;
  leftShoulder.add(leftUpperArm);

  const leftElbow = new THREE.Group();
  leftElbow.position.set(0, -0.28, 0);
  leftShoulder.add(leftElbow);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26, 8), matSuitRed);
  leftForearm.position.y = -0.13;
  leftElbow.add(leftForearm);

  const leftWebShooter = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), matWebShooter);
  leftWebShooter.position.set(0, -0.22, 0.04);
  leftElbow.add(leftWebShooter);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.26, 0);
  leftElbow.add(leftHand);

  const leftHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matSuitRed);
  leftHand.add(leftHandMesh);

  // Right Arm
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.25, 0.36, 0);
  torsoGroup.add(rightShoulder);

  const rightShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), matSuitRed);
  rightShoulder.add(rightShoulderCap);

  const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8), matSuitBlue);
  rightUpperArm.position.y = -0.14;
  rightShoulder.add(rightUpperArm);

  const rightElbow = new THREE.Group();
  rightElbow.position.set(0, -0.28, 0);
  rightShoulder.add(rightElbow);

  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26, 8), matSuitRed);
  rightForearm.position.y = -0.13;
  rightElbow.add(rightForearm);

  const rightWebShooter = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), matWebShooter);
  rightWebShooter.position.set(0, -0.22, 0.04);
  rightElbow.add(rightWebShooter);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.26, 0);
  rightElbow.add(rightHand);

  const rightHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), matSuitRed);
  rightHand.add(rightHandMesh);

  // ==========================================
  // LEGS & RED BOOTS
  // ==========================================
  // Left Leg
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.13, -0.06, 0);
  pelvisGroup.add(leftHip);

  const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.38, 8), matSuitBlue);
  leftThigh.position.y = -0.19;
  leftThigh.castShadow = true;
  leftHip.add(leftThigh);

  const leftKnee = new THREE.Group();
  leftKnee.position.set(0, -0.38, 0);
  leftHip.add(leftKnee);

  const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.36, 8), matSuitRed);
  leftCalf.position.y = -0.18;
  leftCalf.castShadow = true;
  leftKnee.add(leftCalf);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.18), matSuitRed);
  leftFoot.position.set(0, -0.36, 0.04);
  leftKnee.add(leftFoot);

  // Right Leg
  const rightHip = new THREE.Group();
  rightHip.position.set(0.13, -0.06, 0);
  pelvisGroup.add(rightHip);

  const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.38, 8), matSuitBlue);
  rightThigh.position.y = -0.19;
  rightThigh.castShadow = true;
  rightHip.add(rightThigh);

  const rightKnee = new THREE.Group();
  rightKnee.position.set(0, -0.38, 0);
  rightHip.add(rightKnee);

  const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.36, 8), matSuitRed);
  rightCalf.position.y = -0.18;
  rightCalf.castShadow = true;
  rightKnee.add(rightCalf);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.18), matSuitRed);
  rightFoot.position.set(0, -0.36, 0.04);
  rightKnee.add(rightFoot);

  // Helper vectors for zero GC
  const _leftHandWorld = new THREE.Vector3();
  const _rightHandWorld = new THREE.Vector3();

  const getLeftHandPos = () => {
    leftHand.getWorldPosition(_leftHandWorld);
    return _leftHandWorld;
  };

  const getRightHandPos = () => {
    rightHand.getWorldPosition(_rightHandWorld);
    return _rightHandWorld;
  };

  const setSuitGlow = (glowing: boolean) => {
    matEyeWhite.emissive.setHex(glowing ? 0x38bdf8 : 0x1e293b);
    matEyeWhite.emissiveIntensity = glowing ? 0.8 : 0.2;
  };

  let animTimer = 0;

  // Procedural Kinematic Animation Solver
  const updateAnimation = (
    delta: number,
    state: CharacterState,
    speedMph: number,
    velocity: THREE.Vector3,
    swingProgress: number
  ) => {
    animTimer += delta * 5;

    // Reset default rotations
    leftShoulder.rotation.set(0, 0, 0);
    rightShoulder.rotation.set(0, 0, 0);
    leftElbow.rotation.set(0, 0, 0);
    rightElbow.rotation.set(0, 0, 0);
    leftHip.rotation.set(0, 0, 0);
    rightHip.rotation.set(0, 0, 0);
    leftKnee.rotation.set(0, 0, 0);
    rightKnee.rotation.set(0, 0, 0);
    torsoGroup.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
    pelvisGroup.position.y = 0.9;

    switch (state) {
      case 'idle': {
        // Heroic rooftop crouch / breathing
        const breathe = Math.sin(animTimer * 0.8) * 0.04;
        pelvisGroup.position.y = 0.65 + breathe;
        torsoGroup.rotation.x = 0.35;
        headGroup.rotation.x = -0.3;

        // Crouch arms
        leftShoulder.rotation.x = -0.3;
        leftShoulder.rotation.z = -0.3;
        leftElbow.rotation.x = -0.8;

        rightShoulder.rotation.x = -0.3;
        rightShoulder.rotation.z = 0.3;
        rightElbow.rotation.x = -0.8;

        // Deep crouch legs
        leftHip.rotation.x = -0.9;
        leftHip.rotation.z = -0.35;
        leftKnee.rotation.x = 1.35;

        rightHip.rotation.x = -0.9;
        rightHip.rotation.z = 0.35;
        rightKnee.rotation.x = 1.35;
        break;
      }

      case 'swing_left': {
        // Left arm high reaching forward and up holding web line
        torsoGroup.rotation.x = -0.25;
        torsoGroup.rotation.z = -0.2;

        leftShoulder.rotation.x = -2.8;
        leftShoulder.rotation.z = 0.3;
        leftElbow.rotation.x = 0.2;

        // Right arm trailing for balance
        rightShoulder.rotation.x = 0.6;
        rightShoulder.rotation.z = 0.6;
        rightElbow.rotation.x = -0.4;

        // Dynamic swing kick legs
        const kick = Math.sin(swingProgress * Math.PI) * 0.7;
        leftHip.rotation.x = -0.6 - kick;
        leftKnee.rotation.x = 0.8;

        rightHip.rotation.x = 0.2 + kick * 0.4;
        rightKnee.rotation.x = 0.4;
        break;
      }

      case 'swing_right': {
        // Right arm high reaching forward and up holding web line
        torsoGroup.rotation.x = -0.25;
        torsoGroup.rotation.z = 0.2;

        rightShoulder.rotation.x = -2.8;
        rightShoulder.rotation.z = -0.3;
        rightElbow.rotation.x = 0.2;

        // Left arm trailing for balance
        leftShoulder.rotation.x = 0.6;
        leftShoulder.rotation.z = -0.6;
        leftElbow.rotation.x = -0.4;

        // Dynamic swing kick legs
        const kick = Math.sin(swingProgress * Math.PI) * 0.7;
        rightHip.rotation.x = -0.6 - kick;
        rightKnee.rotation.x = 0.8;

        leftHip.rotation.x = 0.2 + kick * 0.4;
        leftKnee.rotation.x = 0.4;
        break;
      }

      case 'dive': {
        // Full aerodynamic dive-bomb pose
        torsoGroup.rotation.x = 1.45;
        headGroup.rotation.x = -0.7;

        // Arms swept back along sides
        leftShoulder.rotation.x = 0.8;
        leftShoulder.rotation.z = -0.2;
        leftElbow.rotation.x = -0.2;

        rightShoulder.rotation.x = 0.8;
        rightShoulder.rotation.z = 0.2;
        rightElbow.rotation.x = -0.2;

        // Legs together and straight
        leftHip.rotation.x = -0.15;
        leftKnee.rotation.x = 0.1;
        rightHip.rotation.x = -0.15;
        rightKnee.rotation.x = 0.1;
        break;
      }

      case 'jump_apex': {
        // Spread-eagle somersault apex
        torsoGroup.rotation.x = Math.sin(animTimer * 2) * 0.4;

        leftShoulder.rotation.x = -1.8;
        leftShoulder.rotation.z = -0.8;
        leftElbow.rotation.x = -0.5;

        rightShoulder.rotation.x = -1.8;
        rightShoulder.rotation.z = 0.8;
        rightElbow.rotation.x = -0.5;

        leftHip.rotation.x = -0.7;
        leftHip.rotation.z = -0.5;
        leftKnee.rotation.x = 0.9;

        rightHip.rotation.x = -0.7;
        rightHip.rotation.z = 0.5;
        rightKnee.rotation.x = 0.9;
        break;
      }

      case 'wall_run': {
        // Vertical wall running sprint
        const stride = Math.sin(animTimer * 2.2);
        torsoGroup.rotation.x = -0.5;

        // Arm pumping
        leftShoulder.rotation.x = -1.2 + stride * 0.6;
        rightShoulder.rotation.x = -1.2 - stride * 0.6;

        // Rapid leg strides
        leftHip.rotation.x = -0.6 + stride * 0.8;
        leftKnee.rotation.x = Math.max(0, stride) * 1.2;

        rightHip.rotation.x = -0.6 - stride * 0.8;
        rightKnee.rotation.x = Math.max(0, -stride) * 1.2;
        break;
      }

      case 'web_zip': {
        // Twin arms reaching forward torpedo
        torsoGroup.rotation.x = 1.2;

        leftShoulder.rotation.x = -2.6;
        leftShoulder.rotation.z = 0.15;
        rightShoulder.rotation.x = -2.6;
        rightShoulder.rotation.z = -0.15;

        leftHip.rotation.x = -0.2;
        rightHip.rotation.x = -0.2;
        break;
      }

      case 'ground_slide': {
        // Ground sliding roll
        pelvisGroup.position.y = 0.35;
        torsoGroup.rotation.x = 0.7;

        leftShoulder.rotation.x = -0.2;
        rightShoulder.rotation.x = 0.4;

        leftHip.rotation.x = -1.4;
        leftKnee.rotation.x = 1.5;
        rightHip.rotation.x = 0.2;
        rightKnee.rotation.x = 0.4;
        break;
      }
    }
  };

  return {
    group: rootGroup,
    updateAnimation,
    getLeftHandPos,
    getRightHandPos,
    setSuitGlow,
  };
}
