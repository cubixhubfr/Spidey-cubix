/**
 * Missions, Speed-Swing Ring Challenges & Collectibles System.
 * Manages landmark discovery, aerial ring race courses, hidden backpacks,
 * and dynamic Spider-Sense crime events.
 */
import * as THREE from 'three';
import { CityEnvironment, LandmarkData } from './city';
import { PlayerPhysicsState } from './physics';
import { sound } from './audio';

export interface RingCheckpoint {
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
  passed: boolean;
}

export interface SwingChallenge {
  id: string;
  title: string;
  description: string;
  goldTime: number;
  silverTime: number;
  bronzeTime: number;
  rings: RingCheckpoint[];
}

export interface BackpackCollectible {
  id: string;
  title: string;
  locationName: string;
  lore: string;
  position: THREE.Vector3;
  mesh?: THREE.Group;
  collected: boolean;
}

export interface CrimeEvent {
  id: string;
  title: string;
  description: string;
  position: THREE.Vector3;
  thugsRemaining: number;
  active: boolean;
  mesh?: THREE.Group;
}

export interface MissionsManager {
  activeChallenge: SwingChallenge | null;
  challengeTimer: number;
  challengeResult: { grade: 'gold' | 'silver' | 'bronze' | 'failed'; time: number } | null;
  backpacks: BackpackCollectible[];
  discoveredLandmarksCount: number;
  totalLandmarksCount: number;
  recentlyDiscoveredLandmark: LandmarkData | null;
  recentlyCollectedBackpack: BackpackCollectible | null;
  activeCrime: CrimeEvent | null;
  startChallenge: (challengeId: string) => void;
  abandonChallenge: () => void;
  dismissLandmarkPopup: () => void;
  dismissBackpackPopup: () => void;
  update: (delta: number, playerState: PlayerPhysicsState) => void;
  challenges: SwingChallenge[];
}

export function createMissionsManager(scene: THREE.Scene, city: CityEnvironment): MissionsManager {
  const missionsGroup = new THREE.Group();
  scene.add(missionsGroup);

  // Holographic Ring Material
  const ringGeo = new THREE.TorusGeometry(5, 0.45, 12, 32);
  const ringMatActive = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.8,
  });

  const ringMatNext = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  // Backpack Mesh Generator (Webbed red/blue canvas bag with glowing beam)
  const backpackMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
  const webPouchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
  });

  const backpacks: BackpackCollectible[] = [
    {
      id: 'bp_esb',
      title: 'Peter’s Spare Mask',
      locationName: 'Empire State Spire',
      lore: 'Always keep a backup mask. Aunt May almost washed this one with the red towels once!',
      position: new THREE.Vector3(0, 262, 0),
      collected: false,
    },
    {
      id: 'bp_chrysler',
      title: 'Gargoyle Camera Clamp',
      locationName: 'Chrysler Eagle Perch',
      lore: 'The best angle for Bugle front-page shots. JJJ paid 50 bucks for this photo.',
      position: new THREE.Vector3(130, 182, -90),
      collected: false,
    },
    {
      id: 'bp_bugle',
      title: 'Bugle Press Pass',
      locationName: 'Daily Bugle Rooftop Sign',
      lore: 'Peter Parker - Freelance Photographer. "If you can get a shot of him eating a hot dog, I’ll double the rate!" - Jameson',
      position: new THREE.Vector3(90, 148, 50),
      collected: false,
    },
    {
      id: 'bp_bridge',
      title: 'Suspension Cable Wrench',
      locationName: 'Brooklyn Bridge Gothic Arch',
      lore: 'Helped repair a snapped tension bolt during a high-speed chase with the Rhino.',
      position: new THREE.Vector3(340, 83, 180),
      collected: false,
    },
    {
      id: 'bp_times_sq',
      title: 'Broadway Ticket Stub',
      locationName: 'Times Square Bleachers',
      lore: 'Took MJ to see a musical here. Had to sneak out at intermission to stop a jewelry heist.',
      position: new THREE.Vector3(-70, 48, -120),
      collected: false,
    },
    {
      id: 'bp_freedom',
      title: 'Science Fair 1st Place Ribbon',
      locationName: 'Freedom Tower Observation Rim',
      lore: 'Midtown High 10th Grade Chemistry Expo. "Synthetic fluid polymers with tensile limits exceeding steel".',
      position: new THREE.Vector3(-60, 237, 280),
      collected: false,
    },
    {
      id: 'bp_flatiron',
      title: 'Web-Shooter Spring Prototype',
      locationName: 'Flatiron Wedge Ledge',
      lore: 'Early solenoid valve iteration. Tended to jam in sub-zero winter temperatures.',
      position: new THREE.Vector3(-110, 89, 60),
      collected: false,
    },
    {
      id: 'bp_park',
      title: 'Cracked Science Flash Drive',
      locationName: 'Central Park Stone Bridge',
      lore: 'Oscorp genetic cross-species data file. Encrypted with Peter’s high-school student ID.',
      position: new THREE.Vector3(-20, 5, -10),
      collected: false,
    },
  ];

  // Build 3D backpack collectible meshes
  backpacks.forEach((bp) => {
    const group = new THREE.Group();
    group.position.copy(bp.position);

    const bag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), backpackMat);
    group.add(bag);

    const web = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), webPouchMat);
    web.position.z = 0.45;
    group.add(web);

    // Vertical glowing beacon light pillar
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 45, 8), beaconMat);
    beacon.position.y = 22.5;
    group.add(beacon);

    missionsGroup.add(group);
    bp.mesh = group;
  });

  // Speed-Swing Ring Challenges
  const challenges: SwingChallenge[] = [
    {
      id: 'midtown_sprint',
      title: 'Midtown Canyon Sprint',
      description: 'Swing along 5th Avenue from the Empire State Building to Times Square through the skyscraper canyon!',
      goldTime: 22,
      silverTime: 32,
      bronzeTime: 45,
      rings: [
        { position: new THREE.Vector3(0, 140, 10), passed: false },
        { position: new THREE.Vector3(-20, 100, -30), passed: false },
        { position: new THREE.Vector3(-45, 80, -70), passed: false },
        { position: new THREE.Vector3(-65, 65, -110), passed: false },
        { position: new THREE.Vector3(-70, 50, -140), passed: false },
      ],
    },
    {
      id: 'bridge_slalom',
      title: 'East River Bridge Slalom',
      description: 'Thread through the Gothic arches of the Brooklyn Bridge and skim the river at full speed!',
      goldTime: 26,
      silverTime: 38,
      bronzeTime: 55,
      rings: [
        { position: new THREE.Vector3(340, 95, 230), passed: false },
        { position: new THREE.Vector3(340, 65, 120), passed: false },
        { position: new THREE.Vector3(340, 40, 60), passed: false },
        { position: new THREE.Vector3(340, 30, -10), passed: false },
        { position: new THREE.Vector3(340, 60, -60), passed: false },
      ],
    },
    {
      id: 'freedom_dive',
      title: 'Freedom Spire Apex Dive',
      description: 'Plunge from the pinnacle of One World Trade Center and dive-bomb through low-altitude canyon rings!',
      goldTime: 20,
      silverTime: 30,
      bronzeTime: 42,
      rings: [
        { position: new THREE.Vector3(-60, 270, 280), passed: false },
        { position: new THREE.Vector3(-60, 190, 250), passed: false },
        { position: new THREE.Vector3(-60, 120, 210), passed: false },
        { position: new THREE.Vector3(-60, 60, 160), passed: false },
        { position: new THREE.Vector3(-60, 25, 100), passed: false },
      ],
    },
  ];

  // Dynamic Crime Event
  let activeCrime: CrimeEvent | null = {
    id: 'crime_1',
    title: 'Rooftop Gang Stash Heist',
    description: 'Armed syndicate thugs spotted raiding an Oscorp supply cache on a midtown rooftop!',
    position: new THREE.Vector3(90, 65, -80),
    thugsRemaining: 3,
    active: true,
  };

  // Build crime marker
  const crimeGroup = new THREE.Group();
  crimeGroup.position.copy(activeCrime.position);
  const crimeMarkerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
  const crimeMarker = new THREE.Mesh(new THREE.OctahedronGeometry(3.5), crimeMarkerMat);
  crimeMarker.position.y = 6;
  crimeGroup.add(crimeMarker);
  missionsGroup.add(crimeGroup);
  activeCrime.mesh = crimeGroup;

  let activeChallenge: SwingChallenge | null = null;
  let challengeTimer = 0;
  let challengeResult: { grade: 'gold' | 'silver' | 'bronze' | 'failed'; time: number } | null = null;
  let recentlyDiscoveredLandmark: LandmarkData | null = null;
  let recentlyCollectedBackpack: BackpackCollectible | null = null;

  const startChallenge = (challengeId: string) => {
    const ch = challenges.find((c) => c.id === challengeId);
    if (!ch) return;

    // Reset rings
    ch.rings.forEach((r, idx) => {
      r.passed = false;
      if (!r.mesh) {
        r.mesh = new THREE.Mesh(ringGeo, idx === 0 ? ringMatActive : ringMatNext);
        missionsGroup.add(r.mesh);
      }
      r.mesh.position.copy(r.position);
      r.mesh.visible = true;
    });

    activeChallenge = ch;
    challengeTimer = 0;
    challengeResult = null;
    sound.playRingPassed();
  };

  const abandonChallenge = () => {
    if (activeChallenge) {
      activeChallenge.rings.forEach((r) => {
        if (r.mesh) r.mesh.visible = false;
      });
      activeChallenge = null;
      challengeResult = null;
    }
  };

  const dismissLandmarkPopup = () => {
    recentlyDiscoveredLandmark = null;
  };

  const dismissBackpackPopup = () => {
    recentlyCollectedBackpack = null;
  };

  let animTimer = 0;

  const update = (delta: number, playerState: PlayerPhysicsState) => {
    animTimer += delta;

    // 1. Check Landmark Proximity & Discovery
    for (const lm of city.landmarks) {
      if (lm.discovered) continue;
      const dist = playerState.position.distanceTo(lm.position);
      // Discover if within 55m
      if (dist < 55) {
        lm.discovered = true;
        recentlyDiscoveredLandmark = lm;
        sound.playLandmarkDiscovered();
        playerState.comboCount += 5;
        break;
      }
    }

    // 2. Check Backpack Collectibles Proximity
    for (const bp of backpacks) {
      if (bp.collected) continue;
      if (bp.mesh) {
        bp.mesh.rotation.y += delta * 1.5;
      }
      const dist = playerState.position.distanceTo(bp.position);
      if (dist < 4.0) {
        bp.collected = true;
        if (bp.mesh) bp.mesh.visible = false;
        recentlyCollectedBackpack = bp;
        sound.playCollect();
        playerState.comboCount += 3;
      }
    }

    // 3. Update Active Ring Challenge
    if (activeChallenge) {
      challengeTimer += delta;

      // Find current unpassed ring
      const currentRingIdx = activeChallenge.rings.findIndex((r) => !r.passed);

      if (currentRingIdx === -1) {
        // All rings cleared! Calculate grade
        let grade: 'gold' | 'silver' | 'bronze' = 'bronze';
        if (challengeTimer <= activeChallenge.goldTime) grade = 'gold';
        else if (challengeTimer <= activeChallenge.silverTime) grade = 'silver';

        challengeResult = {
          grade,
          time: Math.round(challengeTimer * 10) / 10,
        };

        sound.playLandmarkDiscovered();
        abandonChallenge();
      } else {
        const ring = activeChallenge.rings[currentRingIdx];
        if (ring.mesh) {
          ring.mesh.material = ringMatActive;
          ring.mesh.rotation.y += delta * 2;
          ring.mesh.scale.setScalar(1 + Math.sin(animTimer * 6) * 0.08);

          // Check if player passed through ring
          const dist = playerState.position.distanceTo(ring.position);
          if (dist < 6.5) {
            ring.passed = true;
            ring.mesh.visible = false;
            sound.playRingPassed();
            playerState.comboCount += 2;
          }
        }
      }
    }

    // 4. Update Crime Event
    if (activeCrime && activeCrime.active && activeCrime.mesh) {
      crimeMarker.rotation.x += delta * 2;
      crimeMarker.rotation.y += delta * 3;

      const dist = playerState.position.distanceTo(activeCrime.position);
      if (dist < 12) {
        // Defeated thugs upon superhero arrival
        activeCrime.thugsRemaining--;
        sound.playImpact(1.0);
        playerState.comboCount += 4;

        if (activeCrime.thugsRemaining <= 0) {
          activeCrime.active = false;
          activeCrime.mesh.visible = false;
          sound.playLandmarkDiscovered();
        }
      }
    }
  };

  return {
    get activeChallenge() {
      return activeChallenge;
    },
    get challengeTimer() {
      return challengeTimer;
    },
    get challengeResult() {
      return challengeResult;
    },
    backpacks,
    get discoveredLandmarksCount() {
      return city.landmarks.filter((l) => l.discovered).length;
    },
    totalLandmarksCount: city.landmarks.length,
    get recentlyDiscoveredLandmark() {
      return recentlyDiscoveredLandmark;
    },
    get recentlyCollectedBackpack() {
      return recentlyCollectedBackpack;
    },
    get activeCrime() {
      return activeCrime;
    },
    startChallenge,
    abandonChallenge,
    dismissLandmarkPopup,
    dismissBackpackPopup,
    update,
    challenges,
  };
}
