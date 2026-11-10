/**
 * Open-World New York City Generator with Iconic Landmarks for Spider-Man 3D.
 * Exact world-space building colliders (NO sky collisions!).
 * Features Empire State Building, Chrysler Building, One World Trade, Flatiron,
 * Brooklyn Bridge, Times Square, Central Park, Daily Bugle, and Avengers Tower.
 */
import * as THREE from 'three';
import {
  createSkyscraperFacadeTexture,
  createBillboardTexture,
  createRoadTexture,
} from './textures';

export interface LandmarkData {
  id: string;
  name: string;
  shortDesc: string;
  fact: string;
  position: THREE.Vector3;
  cameraLookAt: THREE.Vector3;
  height: number;
  badge: string;
  discovered: boolean;
}

export interface BuildingCollider {
  box: THREE.Box3;
  isWall: boolean;
  canWeb: boolean;
  name: string;
}

export interface CityEnvironment {
  scene: THREE.Scene;
  group: THREE.Group;
  landmarks: LandmarkData[];
  colliders: BuildingCollider[];
  waterMesh: THREE.Mesh;
  billboardMeshes: THREE.Mesh[];
  beaconLights: THREE.PointLight[];
  update: (time: number) => void;
  findBestWebAnchor: (
    playerPos: THREE.Vector3,
    velocity: THREE.Vector3,
    cameraDir: THREE.Vector3,
    sidePreference?: 'left' | 'right' | 'auto'
  ) => { point: THREE.Vector3; buildingName: string; normal: THREE.Vector3; side: 'left' | 'right' } | null;
  findWebZipTarget: (
    playerPos: THREE.Vector3,
    cameraDir: THREE.Vector3
  ) => { point: THREE.Vector3; type: 'rooftop' | 'spire' | 'water_tower' } | null;
  checkCollision: (
    pos: THREE.Vector3,
    radius: number
  ) => {
    collided: boolean;
    normal: THREE.Vector3;
    penetration: number;
    isGround: boolean;
    isWall: boolean;
  };
  setTimeOfDay: (tod: 'day' | 'sunset' | 'night') => void;
}

export function buildNYCEnvironment(scene: THREE.Scene): CityEnvironment {
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  const colliders: BuildingCollider[] = [];
  const billboardMeshes: THREE.Mesh[] = [];
  const beaconLights: THREE.PointLight[] = [];

  // Helper to register exact world-space bounding box for building collisions
  const registerBoxCollider = (
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    name: string = 'Building'
  ) => {
    colliders.push({
      box: new THREE.Box3(
        new THREE.Vector3(Math.min(minX, maxX), Math.min(minY, maxY), Math.min(minZ, maxZ)),
        new THREE.Vector3(Math.max(minX, maxX), Math.max(minY, maxY), Math.max(minZ, maxZ))
      ),
      isWall: true,
      canWeb: true,
      name,
    });
  };

  // Procedural Materials
  const texModern = createSkyscraperFacadeTexture('modern_glass');
  const texDeco = createSkyscraperFacadeTexture('art_deco');
  const texBrick = createSkyscraperFacadeTexture('brick_classic');

  const matModernGlass = new THREE.MeshStandardMaterial({
    map: texModern,
    roughness: 0.15,
    metalness: 0.75,
  });

  const matArtDeco = new THREE.MeshStandardMaterial({
    map: texDeco,
    roughness: 0.65,
    metalness: 0.25,
  });

  const matBrick = new THREE.MeshStandardMaterial({
    map: texBrick,
    roughness: 0.85,
    metalness: 0.1,
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85,
  });

  const matGoldDeco = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.7,
  });

  const matDarkRoof = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.9,
    metalness: 0.15,
  });

  const texRoad = createRoadTexture(false);
  const matRoad = new THREE.MeshStandardMaterial({
    map: texRoad,
    roughness: 0.7,
  });

  // Landmark Registry
  const landmarks: LandmarkData[] = [];

  // ==========================================
  // 1. GROUND PLANE, WATER & STREET GRID
  // ==========================================
  const islandWidth = 900;
  const islandLength = 1100;

  // Water Plane
  const waterGeo = new THREE.PlaneGeometry(1800, 1800, 16, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0c2538,
    roughness: 0.15,
    metalness: 0.85,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -2;
  waterMesh.receiveShadow = true;
  cityGroup.add(waterMesh);

  // Manhattan Island Main Ground Deck
  const islandGeo = new THREE.BoxGeometry(islandWidth, 4, islandLength);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
  });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.set(0, -2, 0);
  islandMesh.receiveShadow = true;
  cityGroup.add(islandMesh);

  // Ground collider: Street level is at Y = 0
  colliders.push({
    box: new THREE.Box3(
      new THREE.Vector3(-islandWidth / 2, -4, -islandLength / 2),
      new THREE.Vector3(islandWidth / 2, 0, islandLength / 2)
    ),
    isWall: false,
    canWeb: false,
    name: 'Street Ground',
  });

  // ==========================================
  // 2. EMPIRE STATE BUILDING
  // Midtown (X: 0, Z: 0), Height: 290m
  // ==========================================
  const esbGroup = new THREE.Group();
  esbGroup.position.set(0, 0, 0);

  // Base tier 1 (street lobby: 75 x 45 x 90)
  const esbBase = new THREE.Mesh(new THREE.BoxGeometry(75, 45, 90), matArtDeco);
  esbBase.position.y = 22.5;
  esbBase.castShadow = true;
  esbBase.receiveShadow = true;
  esbGroup.add(esbBase);
  registerBoxCollider(-37.5, 0, -45, 37.5, 45, 45, 'Empire State Building Base');

  // Tier 2 setback (58 x 65 x 70)
  const esbTier2 = new THREE.Mesh(new THREE.BoxGeometry(58, 65, 70), matArtDeco);
  esbTier2.position.y = 45 + 32.5;
  esbTier2.castShadow = true;
  esbGroup.add(esbTier2);
  registerBoxCollider(-29, 45, -35, 29, 110, 35, 'Empire State Building');

  // Tier 3 main shaft (42 x 95 x 52)
  const esbShaft = new THREE.Mesh(new THREE.BoxGeometry(42, 95, 52), matArtDeco);
  esbShaft.position.y = 110 + 47.5;
  esbShaft.castShadow = true;
  esbGroup.add(esbShaft);
  registerBoxCollider(-21, 110, -26, 21, 205, 26, 'Empire State Building Shaft');

  // Observation deck level (26 x 20 x 32)
  const esbObs = new THREE.Mesh(new THREE.BoxGeometry(26, 20, 32), matSteel);
  esbObs.position.y = 205 + 10;
  esbGroup.add(esbObs);
  registerBoxCollider(-13, 205, -16, 13, 225, 16, 'Empire State 86th Obs Deck');

  // Circular Mooring Mast
  const esbMast = new THREE.Mesh(new THREE.CylinderGeometry(7, 10, 35, 16), matSteel);
  esbMast.position.y = 225 + 17.5;
  esbGroup.add(esbMast);
  registerBoxCollider(-8, 225, -8, 8, 260, 8, 'Empire State Mooring Mast');

  // Upper Spire & Lightning Rod
  const esbSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4, 30, 8), matSteel);
  esbSpire.position.y = 260 + 15;
  esbGroup.add(esbSpire);
  registerBoxCollider(-3, 260, -3, 3, 290, 3, 'Empire State Spire');

  // Beacon Light
  const esbBeacon = new THREE.PointLight(0xef4444, 2.5, 90);
  esbBeacon.position.set(0, 292, 0);
  esbGroup.add(esbBeacon);
  beaconLights.push(esbBeacon);

  cityGroup.add(esbGroup);

  landmarks.push({
    id: 'empire_state',
    name: 'Empire State Building',
    shortDesc: 'Art-Deco Masterpiece & Midtown Crown',
    fact: 'Completed in 1931, it stood as the world’s tallest building for nearly 40 years. Its mooring mast was originally intended for airships!',
    position: new THREE.Vector3(0, 225, 20),
    cameraLookAt: new THREE.Vector3(0, 205, 0),
    height: 290,
    badge: 'Midtown Apex',
    discovered: false,
  });

  // ==========================================
  // 3. CHRYSLER BUILDING
  // Midtown East (X: 130, Z: -90), Height: 254m
  // ==========================================
  const cbGroup = new THREE.Group();
  cbGroup.position.set(130, 0, -90);

  // Base (50 x 70 x 50)
  const cbBase = new THREE.Mesh(new THREE.BoxGeometry(50, 70, 50), matBrick);
  cbBase.position.y = 35;
  cbBase.castShadow = true;
  cbGroup.add(cbBase);
  registerBoxCollider(130 - 25, 0, -90 - 25, 130 + 25, 70, -90 + 25, 'Chrysler Building Base');

  // Shaft (36 x 110 x 36)
  const cbShaft = new THREE.Mesh(new THREE.BoxGeometry(36, 110, 36), matBrick);
  cbShaft.position.y = 70 + 55;
  cbShaft.castShadow = true;
  cbGroup.add(cbShaft);
  registerBoxCollider(130 - 18, 70, -90 - 18, 130 + 18, 180, -90 + 18, 'Chrysler Building Shaft');

  // Sunburst Terraces (Crown)
  for (let i = 0; i < 7; i++) {
    const scale = 1 - i * 0.12;
    const tierH = 4.5;
    const tierMesh = new THREE.Mesh(new THREE.CylinderGeometry(14 * scale, 17 * scale, tierH, 16), matSteel);
    tierMesh.position.y = 180 + i * tierH;
    cbGroup.add(tierMesh);
  }
  registerBoxCollider(130 - 16, 180, -90 - 16, 130 + 16, 212, -90 + 16, 'Chrysler Sunburst Crown');

  // Needle Spire
  const cbSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 3.5, 42, 8), matSteel);
  cbSpire.position.y = 212 + 21;
  cbGroup.add(cbSpire);
  registerBoxCollider(130 - 3, 212, -90 - 3, 130 + 3, 254, -90 + 3, 'Chrysler Needle Spire');

  cityGroup.add(cbGroup);

  landmarks.push({
    id: 'chrysler',
    name: 'Chrysler Building',
    shortDesc: 'Sunburst Spire & Art Deco Jewel',
    fact: 'Architect William Van Alen secretly assembled its 125-foot steel vertex inside the tower before hoisting it in just 90 minutes to claim the tallest title in 1930!',
    position: new THREE.Vector3(130, 215, -90),
    cameraLookAt: new THREE.Vector3(130, 180, -90),
    height: 254,
    badge: 'Art Deco Crown',
    discovered: false,
  });

  // ==========================================
  // 4. ONE WORLD TRADE CENTER (FREEDOM TOWER)
  // Lower Manhattan (X: -60, Z: 280), Height: 315m
  // ==========================================
  const owtcGroup = new THREE.Group();
  owtcGroup.position.set(-60, 0, 280);

  // Concrete Base (64 x 45 x 64)
  const owtcBase = new THREE.Mesh(new THREE.BoxGeometry(64, 45, 64), matSteel);
  owtcBase.position.y = 22.5;
  owtcBase.castShadow = true;
  owtcGroup.add(owtcBase);
  registerBoxCollider(-60 - 32, 0, 280 - 32, -60 + 32, 45, 280 + 32, 'One World Trade Base');

  // Chamfered Prism Tower (52 x 190 x 52)
  const owtcPrism = new THREE.Mesh(new THREE.CylinderGeometry(24, 40, 190, 8), matModernGlass);
  owtcPrism.position.y = 45 + 95;
  owtcPrism.rotation.y = Math.PI / 8;
  owtcPrism.castShadow = true;
  owtcGroup.add(owtcPrism);
  registerBoxCollider(-60 - 28, 45, 280 - 28, -60 + 28, 235, 280 + 28, 'One World Trade Tower');

  // Observation Ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 6, 24), matDarkRoof);
  ring.position.y = 235 + 3;
  owtcGroup.add(ring);
  registerBoxCollider(-60 - 20, 235, 280 - 20, -60 + 20, 241, 280 + 20, 'One World Trade Obs Deck');

  // Spire
  const owtcSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 4.5, 70, 8), matSteel);
  owtcSpire.position.y = 241 + 35;
  owtcGroup.add(owtcSpire);
  registerBoxCollider(-60 - 4, 241, 280 - 4, -60 + 4, 315, 280 + 4, 'One World Trade Spire');

  const owtcBeacon = new THREE.PointLight(0x38bdf8, 3, 120);
  owtcBeacon.position.set(0, 312, 0);
  owtcGroup.add(owtcBeacon);
  beaconLights.push(owtcBeacon);

  cityGroup.add(owtcGroup);

  landmarks.push({
    id: 'one_world_trade',
    name: 'One World Trade Center',
    shortDesc: 'Freedom Tower & Harbor Sentinel',
    fact: 'Reaching a symbolic height of 1,776 feet (representing the year of American independence), its chamfered glass facets catch sunlight like an enormous prism.',
    position: new THREE.Vector3(-60, 245, 280),
    cameraLookAt: new THREE.Vector3(-60, 200, 280),
    height: 315,
    badge: 'Harbor Sentinel',
    discovered: false,
  });

  // ==========================================
  // 5. FLATIRON BUILDING
  // Madison Square (X: -110, Z: 60), Height: 95m
  // ==========================================
  const flatironGroup = new THREE.Group();
  flatironGroup.position.set(-110, 0, 60);

  const flatiron = new THREE.Mesh(new THREE.BoxGeometry(38, 90, 60), matArtDeco);
  flatiron.position.y = 45;
  flatiron.castShadow = true;
  flatironGroup.add(flatiron);
  registerBoxCollider(-110 - 20, 0, 60 - 32, -110 + 20, 95, 60 + 32, 'Flatiron Building');

  cityGroup.add(flatironGroup);

  landmarks.push({
    id: 'flatiron',
    name: 'Flatiron Building',
    shortDesc: 'Triangular Architectural Legend',
    fact: 'When completed in 1902, locals called it "Burnham’s Folly" believing strong winds would topple it. The distinctive downdraft gave rise to the phrase "23 Skidoo"!',
    position: new THREE.Vector3(-110, 95, 60),
    cameraLookAt: new THREE.Vector3(-110, 50, 60),
    height: 95,
    badge: 'Wedge Classic',
    discovered: false,
  });

  // ==========================================
  // 6. TIMES SQUARE CANYON & BILLBOARDS
  // Center-West (X: -70, Z: -120), Height: 120m
  // ==========================================
  const tsGroup = new THREE.Group();
  tsGroup.position.set(-70, 0, -120);

  // Left Tower at world position (-105, 60, -120), size (45, 120, 90)
  const tsTowerLeft = new THREE.Mesh(new THREE.BoxGeometry(45, 120, 90), matModernGlass);
  tsTowerLeft.position.set(-35, 60, 0);
  tsGroup.add(tsTowerLeft);
  registerBoxCollider(-70 - 35 - 22.5, 0, -120 - 45, -70 - 35 + 22.5, 120, -120 + 45, 'Times Square West Tower');

  // Right Tower at world position (-35, 60, -120), size (45, 120, 90)
  const tsTowerRight = new THREE.Mesh(new THREE.BoxGeometry(45, 120, 90), matModernGlass);
  tsTowerRight.position.set(35, 60, 0);
  tsGroup.add(tsTowerRight);
  registerBoxCollider(-70 + 35 - 22.5, 0, -120 - 45, -70 + 35 + 22.5, 120, -120 + 45, 'Times Square East Tower');

  // Billboards
  const bb1Tex = createBillboardTexture('bugle', 'SPIDER-MAN: THREAT OR MENACE?', 'MAYOR WARNS MASKED VIGILANTE');
  const bb1 = new THREE.Mesh(new THREE.PlaneGeometry(38, 20), new THREE.MeshBasicMaterial({ map: bb1Tex }));
  bb1.position.set(-12, 45, 0);
  bb1.rotation.y = Math.PI / 2;
  tsGroup.add(bb1);
  billboardMeshes.push(bb1);

  const bb2Tex = createBillboardTexture('stark', 'NEW CLEAN ENERGY GRID', 'POWERING NEW YORK INTO 2030');
  const bb2 = new THREE.Mesh(new THREE.PlaneGeometry(38, 20), new THREE.MeshBasicMaterial({ map: bb2Tex }));
  bb2.position.set(12, 50, 0);
  bb2.rotation.y = -Math.PI / 2;
  tsGroup.add(bb2);
  billboardMeshes.push(bb2);

  const bb3Tex = createBillboardTexture('oscorp', 'BIOTECH SOLUTIONS', 'ENGINEERING TOMORROW');
  const bb3 = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), new THREE.MeshBasicMaterial({ map: bb3Tex }));
  bb3.position.set(0, 75, -45);
  tsGroup.add(bb3);
  billboardMeshes.push(bb3);

  cityGroup.add(tsGroup);

  landmarks.push({
    id: 'times_square',
    name: 'Times Square',
    shortDesc: 'The Crossroads of the World',
    fact: 'Illuminated by billions of lumens of neon and LED displays. Known as "The Great White Way", it hosts over 330,000 visitors every day.',
    position: new THREE.Vector3(-70, 75, -120),
    cameraLookAt: new THREE.Vector3(-70, 30, -120),
    height: 120,
    badge: 'Crossroads Neon',
    discovered: false,
  });

  // ==========================================
  // 7. BROOKLYN BRIDGE
  // East River (X: 340, Z: 180), Height: 86m
  // ==========================================
  const bbBridgeGroup = new THREE.Group();
  bbBridgeGroup.position.set(340, 0, 180);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 });

  const createBridgeTower = (zOffset: number) => {
    const tower = new THREE.Group();
    tower.position.z = zOffset;

    const pierL = new THREE.Mesh(new THREE.BoxGeometry(10, 80, 14), stoneMat);
    pierL.position.set(-14, 40, 0);
    tower.add(pierL);

    const pierR = new THREE.Mesh(new THREE.BoxGeometry(10, 80, 14), stoneMat);
    pierR.position.set(14, 40, 0);
    tower.add(pierR);

    const pierC = new THREE.Mesh(new THREE.BoxGeometry(8, 80, 14), stoneMat);
    pierC.position.set(0, 40, 0);
    tower.add(pierC);

    const header = new THREE.Mesh(new THREE.BoxGeometry(38, 16, 14), stoneMat);
    header.position.set(0, 72, 0);
    tower.add(header);

    const cornice = new THREE.Mesh(new THREE.BoxGeometry(42, 6, 16), stoneMat);
    cornice.position.set(0, 83, 0);
    tower.add(cornice);

    return tower;
  };

  const tower1 = createBridgeTower(-60);
  const tower2 = createBridgeTower(60);
  bbBridgeGroup.add(tower1);
  bbBridgeGroup.add(tower2);

  // Exact world-space colliders for Brooklyn Bridge towers
  registerBoxCollider(340 - 21, 0, 180 - 60 - 8, 340 + 21, 86, 180 - 60 + 8, 'Brooklyn Bridge North Tower');
  registerBoxCollider(340 - 21, 0, 180 + 60 - 8, 340 + 21, 86, 180 + 60 + 8, 'Brooklyn Bridge South Tower');

  // Roadway Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(32, 3, 240), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
  deck.position.set(0, 22, 0);
  bbBridgeGroup.add(deck);
  registerBoxCollider(340 - 16, 20, 180 - 120, 340 + 16, 24, 180 + 120, 'Brooklyn Bridge Roadway');

  cityGroup.add(bbBridgeGroup);

  landmarks.push({
    id: 'brooklyn_bridge',
    name: 'Brooklyn Bridge',
    shortDesc: 'East River Suspension Icon',
    fact: 'Opened in 1883 as the first fixed crossing over the East River. P.T. Barnum once led a parade of 21 elephants across it to prove its structural integrity!',
    position: new THREE.Vector3(340, 85, 180),
    cameraLookAt: new THREE.Vector3(340, 35, 180),
    height: 85,
    badge: 'River Span',
    discovered: false,
  });

  // ==========================================
  // 8. CENTRAL PARK
  // North Manhattan (X: 0, Z: -360), Open ground
  // ==========================================
  const cpGroup = new THREE.Group();
  cpGroup.position.set(0, 0, -360);

  const parkMesh = new THREE.Mesh(new THREE.BoxGeometry(320, 2, 260), new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.95 }));
  parkMesh.position.y = 0.5;
  cpGroup.add(parkMesh);

  // Lake
  const lake = new THREE.Mesh(new THREE.CylinderGeometry(55, 60, 1.8, 24), new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.1, metalness: 0.6 }));
  lake.position.set(-20, 0.8, -10);
  cpGroup.add(lake);

  // Stone Bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 34), stoneMat);
  bridge.position.set(-20, 3, -10);
  cpGroup.add(bridge);
  registerBoxCollider(-20 - 9, 0, -360 - 10 - 17, -20 + 9, 5, -360 - 10 + 17, 'Central Park Stone Bridge');

  cityGroup.add(cpGroup);

  landmarks.push({
    id: 'central_park',
    name: 'Central Park',
    shortDesc: 'Urban Oasis & Green Haven',
    fact: 'Designed by Frederick Law Olmsted and Calvert Vaux in 1858, Central Park spans 843 acres and contains over 18,000 trees right in the heart of Manhattan.',
    position: new THREE.Vector3(0, 15, -360),
    cameraLookAt: new THREE.Vector3(0, 5, -360),
    height: 35,
    badge: 'Green Oasis',
    discovered: false,
  });

  // ==========================================
  // 9. THE DAILY BUGLE
  // Midtown (X: 90, Z: 50), Height: 155m
  // ==========================================
  const dbGroup = new THREE.Group();
  dbGroup.position.set(90, 0, 50);

  const dbMain = new THREE.Mesh(new THREE.BoxGeometry(45, 130, 45), matBrick);
  dbMain.position.y = 65;
  dbMain.castShadow = true;
  dbGroup.add(dbMain);
  registerBoxCollider(90 - 22.5, 0, 50 - 22.5, 90 + 22.5, 130, 50 + 22.5, 'The Daily Bugle');

  const dbRoof = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 26), matDarkRoof);
  dbRoof.position.y = 137;
  dbGroup.add(dbRoof);
  registerBoxCollider(90 - 13, 130, 50 - 13, 90 + 13, 144, 50 + 13, 'Daily Bugle Roof Penthouse');

  // Rooftop 3D Neon Sign
  const dbSignTex = createBillboardTexture('bugle', 'TRUTH IN PRINT', 'J. JONAH JAMESON - EDITOR IN CHIEF');
  const dbSignMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 16), new THREE.MeshBasicMaterial({ map: dbSignTex }));
  dbSignMesh.position.set(0, 150, 0);
  dbGroup.add(dbSignMesh);

  cityGroup.add(dbGroup);

  landmarks.push({
    id: 'daily_bugle',
    name: 'The Daily Bugle',
    shortDesc: 'Home of Peter Parker & J.J.J.',
    fact: 'New York City’s most notorious tabloid newspaper headquarters. J. Jonah Jameson famously bellows here: "Get me pictures of Spider-Man!"',
    position: new THREE.Vector3(90, 145, 50),
    cameraLookAt: new THREE.Vector3(90, 120, 50),
    height: 155,
    badge: 'Bugle Press',
    discovered: false,
  });

  // ==========================================
  // 10. AVENGERS / OSCORP TOWER
  // East River High-Tech Spire (X: -140, Z: -30), Height: 205m
  // ==========================================
  const avGroup = new THREE.Group();
  avGroup.position.set(-140, 0, -30);

  const avShaft = new THREE.Mesh(new THREE.BoxGeometry(40, 160, 40), matModernGlass);
  avShaft.position.y = 80;
  avShaft.castShadow = true;
  avGroup.add(avShaft);
  registerBoxCollider(-140 - 20, 0, -30 - 20, -140 + 20, 160, -30 + 20, 'Avengers Tower');

  const cant = new THREE.Mesh(new THREE.BoxGeometry(32, 10, 48), matSteel);
  cant.position.set(0, 165, 14);
  avGroup.add(cant);
  registerBoxCollider(-140 - 16, 160, -30 + 14 - 24, -140 + 16, 170, -30 + 14 + 24, 'Avengers Flight Deck');

  // Spire
  const avSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.5, 35, 8), matSteel);
  avSpire.position.y = 185;
  avGroup.add(avSpire);
  registerBoxCollider(-140 - 3, 170, -30 - 3, -140 + 3, 205, -30 + 3, 'Avengers Spire');

  cityGroup.add(avGroup);

  landmarks.push({
    id: 'avengers_tower',
    name: 'Avengers Tower',
    shortDesc: 'Stark High-Tech Citadel',
    fact: 'Originally designed by Tony Stark with a clean arc-reactor power grid. Its cantilevered flight deck is built for Quinjet launches!',
    position: new THREE.Vector3(-140, 175, -15),
    cameraLookAt: new THREE.Vector3(-140, 140, -15),
    height: 205,
    badge: 'Earth’s Mightiest',
    discovered: false,
  });

  // ==========================================
  // 11. PROCEDURAL MANHATTAN GRID SKYSCRAPERS
  // Filling out Manhattan's skyscraper canyons
  // ==========================================
  const gridStepX = 75;
  const gridStepZ = 75;
  const blockGeo = new THREE.BoxGeometry(1, 1, 1);
  const mats = [matModernGlass, matArtDeco, matBrick];

  for (let gx = -260; gx <= 260; gx += gridStepX) {
    for (let gz = -320; gz <= 320; gz += gridStepZ) {
      // Clear clearance zone around landmarks & Central Park
      const distESB = Math.hypot(gx - 0, gz - 0);
      const distCB = Math.hypot(gx - 130, gz - (-90));
      const distOWTC = Math.hypot(gx - (-60), gz - 280);
      const distFlat = Math.hypot(gx - (-110), gz - 60);
      const distTS = Math.hypot(gx - (-70), gz - (-120));
      const distBB = Math.hypot(gx - 340, gz - 180);
      const distBugle = Math.hypot(gx - 90, gz - 50);
      const distAV = Math.hypot(gx - (-140), gz - (-30));
      const isPark = Math.abs(gx) < 170 && gz < -220;

      if (
        distESB < 55 ||
        distCB < 45 ||
        distOWTC < 55 ||
        distFlat < 45 ||
        distTS < 55 ||
        distBB < 90 ||
        distBugle < 40 ||
        distAV < 45 ||
        isPark
      ) {
        continue;
      }

      // Height variation based on neighborhood
      const distToMidtown = Math.hypot(gx, gz);
      const baseHeight = 50 + Math.max(0, 110 - distToMidtown * 0.28) + (Math.sin(gx * 0.05 + gz * 0.08) * 35);
      const bHeight = Math.max(35, Math.min(185, baseHeight + ((Math.abs(gx * gz) % 40) - 15)));

      const bWidth = 40 + ((Math.abs(gx * 3) % 15));
      const bDepth = 40 + ((Math.abs(gz * 5) % 15));

      const matIndex = Math.abs((gx * 7 + gz * 13) % mats.length);
      const bMesh = new THREE.Mesh(blockGeo, mats[matIndex]);
      bMesh.scale.set(bWidth, bHeight, bDepth);
      bMesh.position.set(gx, bHeight / 2, gz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      cityGroup.add(bMesh);

      // Register exact world-space collider (stops exactly at roof height bHeight, NO SKY COLLISION!)
      registerBoxCollider(
        gx - bWidth / 2,
        0,
        gz - bDepth / 2,
        gx + bWidth / 2,
        bHeight,
        gz + bDepth / 2,
        'Manhattan Highrise'
      );
    }
  }

  // ==========================================
  // 12. STREETS & AVENUES
  // ==========================================
  const roadW = 22;
  // Avenues
  for (let ax = -260; ax <= 260; ax += gridStepX) {
    const avenue = new THREE.Mesh(new THREE.PlaneGeometry(roadW, islandLength), matRoad);
    avenue.rotation.x = -Math.PI / 2;
    avenue.position.set(ax + gridStepX / 2, 0.05, 0);
    avenue.receiveShadow = true;
    cityGroup.add(avenue);
  }

  // Streets
  for (let sz = -320; sz <= 320; sz += gridStepZ) {
    const street = new THREE.Mesh(new THREE.PlaneGeometry(islandWidth, roadW), matRoad);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.06, sz + gridStepZ / 2);
    street.receiveShadow = true;
    cityGroup.add(street);
  }

  // Time of Day Controller
  const setTimeOfDay = (tod: 'day' | 'sunset' | 'night') => {
    if (tod === 'sunset') {
      scene.fog = new THREE.FogExp2(0xd97706, 0.0016);
      waterMat.color.setHex(0x9a3412);
      beaconLights.forEach((l) => (l.intensity = 3.5));
    } else if (tod === 'night') {
      scene.fog = new THREE.FogExp2(0x090d16, 0.0022);
      waterMat.color.setHex(0x030712);
      beaconLights.forEach((l) => (l.intensity = 5));
    } else {
      scene.fog = new THREE.FogExp2(0x93c5fd, 0.0012);
      waterMat.color.setHex(0x0369a1);
      beaconLights.forEach((l) => (l.intensity = 1.5));
    }
  };

  setTimeOfDay('sunset');

  const update = (time: number) => {
    const pulse = Math.sin(time * 4) > 0 ? 1 : 0.2;
    beaconLights.forEach((b) => {
      b.visible = pulse > 0.5;
    });
    waterMat.roughness = 0.15 + Math.sin(time * 0.8) * 0.03;
  };

  // ==========================================
  // INTELLIGENT MARVEL'S SPIDER-MAN WEB ANCHORING
  // Webs ONLY latch onto physical buildings! No sky swinging!
  // ==========================================
  const findBestWebAnchor = (
    playerPos: THREE.Vector3,
    velocity: THREE.Vector3,
    cameraDir: THREE.Vector3,
    sidePreference: 'left' | 'right' | 'auto' = 'auto'
  ) => {
    const speed = velocity.length();
    // Forward direction follows velocity if moving, else camera
    const forwardDir = speed > 2 ? velocity.clone().normalize() : cameraDir.clone().setY(0).normalize();
    const rightDir = new THREE.Vector3(-forwardDir.z, 0, forwardDir.x);

    const maxReach = 95;
    let bestPoint: THREE.Vector3 | null = null;
    let bestScore = -Infinity;
    let bestBuilding = 'Building';
    const bestNormal = new THREE.Vector3(0, 1, 0);
    let bestSide: 'left' | 'right' = 'right';

    for (const c of colliders) {
      if (!c.canWeb || !c.isWall) continue;

      // CRITICAL: If player is higher than the building's roof, this building cannot be an elevated anchor!
      if (playerPos.y > c.box.max.y + 10) continue;

      // Quick bounding box proximity check
      const clamped = c.box.clampPoint(playerPos, new THREE.Vector3());
      const toClamped = clamped.clone().sub(playerPos);
      const horizontalDist = Math.hypot(toClamped.x, toClamped.z);

      if (horizontalDist > maxReach || horizontalDist < 5) continue;

      // Find an anchor point on the building face or roof corner
      // Optimal anchor altitude is above player, near the building roof
      const candidateY = Math.min(c.box.max.y - 1, Math.max(c.box.min.y + 5, playerPos.y + 14 + horizontalDist * 0.25));
      const candidate = new THREE.Vector3(clamped.x, candidateY, clamped.z);

      const toAnchor = candidate.clone().sub(playerPos);
      const anchorDist = toAnchor.length();
      if (anchorDist < 10 || anchorDist > maxReach) continue;

      const toAnchorNorm = toAnchor.clone().normalize();
      const dotForward = toAnchorNorm.dot(forwardDir);
      const dotRight = toAnchorNorm.dot(rightDir);

      // In Marvel's Spider-Man, webs shoot to buildings to your front-left or front-right!
      if (dotForward < -0.15) continue; // Behind you -> cannot swing forward
      if (Math.abs(dotRight) < 0.08) continue; // Directly dead-center in front of you -> would swing into the wall!

      const isRightSide = dotRight > 0;
      let sideScore = 0;
      if (sidePreference === 'right' && isRightSide) sideScore = 0.5;
      if (sidePreference === 'left' && !isRightSide) sideScore = 0.5;

      // Optimal swing radius is 30m - 55m
      const distScore = 1 - Math.abs(anchorDist - 40) / 45;
      const heightBonus = Math.max(0, (candidate.y - playerPos.y) / 25);
      const score = dotForward * 1.5 + Math.abs(dotRight) * 0.8 + distScore * 1.2 + heightBonus * 1.0 + sideScore;

      if (score > bestScore) {
        bestScore = score;
        bestPoint = candidate;
        bestBuilding = c.name;
        bestSide = isRightSide ? 'right' : 'left';

        // Normal
        if (Math.abs(candidate.x - c.box.max.x) < 2) bestNormal.set(1, 0, 0);
        else if (Math.abs(candidate.x - c.box.min.x) < 2) bestNormal.set(-1, 0, 0);
        else if (Math.abs(candidate.z - c.box.max.z) < 2) bestNormal.set(0, 0, 1);
        else if (Math.abs(candidate.z - c.box.min.z) < 2) bestNormal.set(0, 0, -1);
        else bestNormal.set(0, 1, 0);
      }
    }

    if (bestPoint) {
      return { point: bestPoint, buildingName: bestBuilding, normal: bestNormal, side: bestSide };
    }
    return null;
  };

  // Find Web-Zip / Point Launch Target
  const findWebZipTarget = (playerPos: THREE.Vector3, cameraDir: THREE.Vector3) => {
    let closestTarget: THREE.Vector3 | null = null;
    let minAngle = 0.35;
    let targetType: 'rooftop' | 'spire' | 'water_tower' = 'rooftop';

    for (const c of colliders) {
      if (!c.canWeb || !c.isWall) continue;
      // Roof ledge center
      const roofCenter = new THREE.Vector3(
        (c.box.min.x + c.box.max.x) / 2,
        c.box.max.y,
        (c.box.min.z + c.box.max.z) / 2
      );

      const toTarget = roofCenter.clone().sub(playerPos);
      const dist = toTarget.length();
      if (dist < 12 || dist > 140) continue;

      const dir = toTarget.clone().normalize();
      const angle = cameraDir.angleTo(dir);

      if (angle < minAngle) {
        minAngle = angle;
        closestTarget = roofCenter;
        targetType = c.name.includes('Spire') ? 'spire' : 'rooftop';
      }
    }

    if (closestTarget) {
      return { point: closestTarget, type: targetType };
    }
    return null;
  };

  // ==========================================
  // BULLETPROOF BUILDING COLLISION CHECKER
  // NO SKY COLLISIONS! Exact box face resolution.
  // ==========================================
  const checkCollision = (pos: THREE.Vector3, radius: number) => {
    // 1. Street / Ground Level Collision
    if (pos.y - radius <= 0) {
      return {
        collided: true,
        normal: new THREE.Vector3(0, 1, 0),
        penetration: radius - pos.y,
        isGround: true,
        isWall: false,
      };
    }

    let collided = false;
    const normal = new THREE.Vector3();
    let maxPenetration = 0;
    let isGround = false;
    let isWall = false;

    for (const c of colliders) {
      // Fast AABB rejection: If player is above the building roof or outside box footprint by radius, SKIP!
      if (pos.y - radius > c.box.max.y) continue; // IN THE SKY ABOVE THIS BUILDING -> NO COLLISION!
      if (pos.y + radius < c.box.min.y) continue;
      if (pos.x - radius > c.box.max.x || pos.x + radius < c.box.min.x) continue;
      if (pos.z - radius > c.box.max.z || pos.z + radius < c.box.min.z) continue;

      // Find clamped point on the box
      const cx = Math.max(c.box.min.x, Math.min(c.box.max.x, pos.x));
      const cy = Math.max(c.box.min.y, Math.min(c.box.max.y, pos.y));
      const cz = Math.max(c.box.min.z, Math.min(c.box.max.z, pos.z));
      const clamped = new THREE.Vector3(cx, cy, cz);

      const diff = pos.clone().sub(clamped);
      const distSq = diff.lengthSq();

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        let curNormal = new THREE.Vector3();
        let pen = 0;

        if (dist > 0.001) {
          curNormal.copy(diff.multiplyScalar(1 / dist));
          pen = radius - dist;
        } else {
          // Inside the box! Push out toward the closest face
          const dLeft = pos.x - c.box.min.x;
          const dRight = c.box.max.x - pos.x;
          const dTop = c.box.max.y - pos.y;
          const dBottom = pos.y - c.box.min.y;
          const dBack = pos.z - c.box.min.z;
          const dFront = c.box.max.z - pos.z;

          const minD = Math.min(dLeft, dRight, dTop, dBottom, dBack, dFront);
          if (minD === dTop) {
            curNormal.set(0, 1, 0);
            pen = dTop + radius;
          } else if (minD === dLeft) {
            curNormal.set(-1, 0, 0);
            pen = dLeft + radius;
          } else if (minD === dRight) {
            curNormal.set(1, 0, 0);
            pen = dRight + radius;
          } else if (minD === dFront) {
            curNormal.set(0, 0, 1);
            pen = dFront + radius;
          } else if (minD === dBack) {
            curNormal.set(0, 0, -1);
            pen = dBack + radius;
          } else {
            curNormal.set(0, 1, 0);
            pen = dBottom + radius;
          }
        }

        if (pen > maxPenetration) {
          collided = true;
          maxPenetration = pen;
          normal.copy(curNormal);

          if (normal.y > 0.6) {
            isGround = true;
            isWall = false;
          } else {
            isGround = false;
            isWall = true;
          }
        }
      }
    }

    return {
      collided,
      normal,
      penetration: maxPenetration,
      isGround,
      isWall,
    };
  };

  return {
    scene,
    group: cityGroup,
    landmarks,
    colliders,
    waterMesh,
    billboardMeshes,
    beaconLights,
    update,
    findBestWebAnchor,
    findWebZipTarget,
    checkCollision,
    setTimeOfDay,
  };
}
