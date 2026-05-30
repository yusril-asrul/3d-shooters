import * as THREE from 'three';
import { PI, state } from './state.js';

const CELL_SIZE = 10;
const buildingCells = {};
export const buildings = [];
export const treePositions = [];

function createBuilding(scene, x, z, w, h, d, color, castShadow = true) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createTree(scene, x, z) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });

  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), trunkMat);
  trunk.position.set(x, 0.6, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), leafMat);
  crown.position.set(x, 1.6, z);
  crown.castShadow = true;
  scene.add(crown);
}

function createRoof(scene, x, z, w, d, color, baseHeight) {
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.8, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  roof.position.set(x, baseHeight + 0.4, z);
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);
}

function createBanner(scene, x, z, height) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });

  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), poleMat);
  pole.position.set(x, height + 0.3, z);
  scene.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.02), flagMat);
  flag.position.set(x + 0.2, height + 0.35, z);
  scene.add(flag);
}

function createPath(scene, x, z, w, d) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b6b6b, roughness: 0.95 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat);
  mesh.position.set(x, 0.03, z);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

export function initWorld(scene) {
  state.buildings = buildings;
  state.trees = treePositions;

  // Tower helper: what x-z range a tower covers
  // Tower at (tx, tz) with size s covers [tx - s/2, tx + s/2] in both x and z

  // ========== CASTLE KEEP (4 walls, each with a door opening) ==========
  const keepWallH = 7;
  const keepWallThick = 0.5;
  const keepWallData = [
    // North wall — gap at (0, -4.5) from x=-1.5 to +1.5
    { x: -3.75, z: -4.5, w: 4.5, h: keepWallH, d: keepWallThick, color: 0x7a7a7a },
    { x: 3.75, z: -4.5, w: 4.5, h: keepWallH, d: keepWallThick, color: 0x7a7a7a },
    // East wall — gap at (6, 0) from z=-1.5 to +1.5
    { x: 6, z: -3, w: keepWallThick, h: keepWallH, d: 3, color: 0x7a7a7a },
    { x: 6, z: 3, w: keepWallThick, h: keepWallH, d: 3, color: 0x7a7a7a },
    // South wall — gap at (0, 4.5) from x=-1.5 to +1.5
    { x: -3.75, z: 4.5, w: 4.5, h: keepWallH, d: keepWallThick, color: 0x7a7a7a },
    { x: 3.75, z: 4.5, w: 4.5, h: keepWallH, d: keepWallThick, color: 0x7a7a7a },
    // West wall — gap at (-6, 0) from z=-1.5 to +1.5
    { x: -6, z: -3, w: keepWallThick, h: keepWallH, d: 3, color: 0x7a7a7a },
    { x: -6, z: 3, w: keepWallThick, h: keepWallH, d: 3, color: 0x7a7a7a },
  ];

  // ========== INNER TOWERS (corners of inner bailey, 4 units in from outer walls) ==========
  // Placed at x=±10, z=±7 so inner walls span cleanly between them
  const innerTowerSize = 3;
  const innerTowerH = 9;
  const itPos = [
    [-10, -7], [10, -7], [10, 7], [-10, 7]
  ];
  const innerTowerData = itPos.map(([x, z]) => ({
    x, z, w: innerTowerSize, h: innerTowerH, d: innerTowerSize, color: 0x8a8a7a
  }));

  // ========== OUTER WALLS ==========
  // Outer perimeter forms a square with outer edge at ±28 in both x and z.
  // Corner towers (size 5) at each corner.
  // Wall segments run between the inner edges of corner towers.
  // Corner tower inner edge: ±(28 - 2.5) = ±25.5
  // Each outer wall spans from -25.5 to +25.5 in its long axis.

  const outerWallH = 5;
  const outerWallThick = 1.5;
  const outerWallData = [
    // North wall — gap at (0, -28) from x=-1.5 to +1.5
    { x: -13.5, z: -28, w: 24, h: outerWallH, d: outerWallThick, color: 0x6a6a6a },
    { x: 13.5, z: -28, w: 24, h: outerWallH, d: outerWallThick, color: 0x6a6a6a },
    // South wall — gap at (0, 28) from x=-1.5 to +1.5
    { x: -13.5, z: 28, w: 24, h: outerWallH, d: outerWallThick, color: 0x6a6a6a },
    { x: 13.5, z: 28, w: 24, h: outerWallH, d: outerWallThick, color: 0x6a6a6a },
    // East wall — gap at (28, 0) from z=-1.5 to +1.5
    { x: 28, z: -13.5, w: outerWallThick, h: outerWallH, d: 24, color: 0x6a6a6a },
    { x: 28, z: 13.5, w: outerWallThick, h: outerWallH, d: 24, color: 0x6a6a6a },
    // West wall — gap at (-28, 0) from z=-1.5 to +1.5
    { x: -28, z: -13.5, w: outerWallThick, h: outerWallH, d: 24, color: 0x6a6a6a },
    { x: -28, z: 13.5, w: outerWallThick, h: outerWallH, d: 24, color: 0x6a6a6a },
  ];

  // ========== OUTER CORNER TOWERS ==========
  const outerTowerSize = 5;
  const outerTowerH = 10;
  const otPos = [
    [-28, -28], [28, -28], [28, 28], [-28, 28]
  ];
  const outerTowerData = otPos.map(([x, z]) => ({
    x, z, w: outerTowerSize, h: outerTowerH, d: outerTowerSize, color: 0x9a9a8a
  }));

  // ========== VILLAGE HOUSES ==========
  const houseData = [
    { x: -8, z: 36, w: 3, h: 2.5, d: 3, color: 0x8B5A2B },
    { x: 6, z: 38, w: 3, h: 2.5, d: 3, color: 0x7A4A1A },
    { x: -4, z: 42, w: 3, h: 2.5, d: 3, color: 0x9B6A3B },
    { x: 10, z: 44, w: 3, h: 2.5, d: 3, color: 0x8B5A2B },
    { x: -12, z: 44, w: 3, h: 2.5, d: 3, color: 0x7A4A1A },
    { x: 3, z: 48, w: 3, h: 2.5, d: 3, color: 0x9B6A3B },
    { x: -6, z: 50, w: 3, h: 2.5, d: 3, color: 0x8B5A2B },
    { x: 8, z: 52, w: 3, h: 2.5, d: 3, color: 0x7A4A1A },
  ];

  // ========== BUILD ALL COLLISION OBJECTS ==========
  const allBuildingData = [
    ...keepWallData,
    ...innerTowerData,
    ...outerWallData,
    ...outerTowerData,
    ...houseData,
  ];

  for (const b of allBuildingData) {
    buildings.push(createBuilding(scene, b.x, b.z, b.w, b.h, b.d, b.color, b.h > 1.5));
  }

  // ========== COURTYARD FLOOR ==========
  const courtMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.9 });
  const courtyard = new THREE.Mesh(new THREE.PlaneGeometry(18, 12), courtMat);
  courtyard.rotation.x = -PI / 2;
  courtyard.position.set(0, 0.02, 0);
  courtyard.receiveShadow = true;
  scene.add(courtyard);

  // ========== GATE ==========
  // Gate pillars on either side of the gap
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 });
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const archMat = new THREE.MeshStandardMaterial({ color: 0x7a6a4a, roughness: 0.8 });

  // Left pillar
  const pL = new THREE.Mesh(new THREE.BoxGeometry(1, 5.5, 1.2), pillarMat);
  pL.position.set(-2.2, 2.75, 28);
  pL.castShadow = true;
  scene.add(pL);

  // Right pillar
  const pR = new THREE.Mesh(new THREE.BoxGeometry(1, 5.5, 1.2), pillarMat);
  pR.position.set(2.2, 2.75, 28);
  pR.castShadow = true;
  scene.add(pR);

  // Open gate doors (swung open to each side)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.9 });

  // Left door swung open (against pillar)
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.5, 1.7), doorMat);
  doorL.position.set(-2.2, 1.75, 28.8);
  doorL.castShadow = true;
  scene.add(doorL);
  // Beams on left door
  for (let by = 0.5; by <= 3; by += 0.85) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.5), beamMat);
    b.position.set(-2.22, by, 28.8);
    scene.add(b);
  }

  // Right door swung open (against pillar)
  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.5, 1.7), doorMat);
  doorR.position.set(2.2, 1.75, 28.8);
  doorR.castShadow = true;
  scene.add(doorR);
  // Beams on right door
  for (let by = 0.5; by <= 3; by += 0.85) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.5), beamMat);
    b.position.set(2.22, by, 28.8);
    scene.add(b);
  }

  // Arch above gate
  const arch = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 0.6), archMat);
  arch.position.set(0, 5, 28.4);
  arch.castShadow = true;
  scene.add(arch);

  // ========== KEEP INTERIOR ==========
  // Red carpet from door to throne
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.9 });
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 5.5), carpetMat);
  carpet.position.set(0, 0.025, 1.2);
  carpet.receiveShadow = true;
  scene.add(carpet);

  // Gold trim on carpet edges
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.6 });
  for (let tz = -1.5; tz <= 3.8; tz += 0.08) {
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), trimMat);
    trimL.position.set(-0.82, 0.045, tz);
    scene.add(trimL);
    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), trimMat);
    trimR.position.set(0.82, 0.045, tz);
    scene.add(trimR);
  }

  // Throne (singgasana)
  const throneGoldMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.5 });
  const throneRedMat = new THREE.MeshStandardMaterial({ color: 0xaa1111, roughness: 0.8 });
  const throneWoodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.9 });

  // Base/platform
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.0), throneWoodMat);
  base.position.set(0, 0.1, -1.8);
  base.castShadow = true;
  scene.add(base);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.7), throneRedMat);
  seat.position.set(0, 0.35, -1.7);
  seat.castShadow = true;
  scene.add(seat);

  // Backrest
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.1), throneGoldMat);
  backrest.position.set(0, 0.8, -2.15);
  backrest.castShadow = true;
  scene.add(backrest);

  // Left armrest
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.6), throneGoldMat);
  armL.position.set(-0.76, 0.4, -1.65);
  armL.castShadow = true;
  scene.add(armL);

  // Right armrest
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.6), throneGoldMat);
  armR.position.set(0.76, 0.4, -1.65);
  armR.castShadow = true;
  scene.add(armR);

  // Top decorative sphere on backrest
  const topMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0x442200, emissiveIntensity: 0.2 });
  for (let tx = -0.4; tx <= 0.4; tx += 0.4) {
    const orb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), topMat);
    orb.position.set(tx, 1.25, -2.15);
    scene.add(orb);
  }

  // Lamps inside keep
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff4400, emissiveIntensity: 0.8 });

  // Left lamp
  const poleL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), lampMat);
  poleL.position.set(-2.5, 0.6, -2);
  scene.add(poleL);
  const glowL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), glowMat);
  glowL.position.set(-2.5, 1.3, -2);
  scene.add(glowL);

  // Right lamp
  const poleR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), lampMat);
  poleR.position.set(2.5, 0.6, -2);
  scene.add(poleR);
  const glowR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.25), glowMat);
  glowR.position.set(2.5, 1.3, -2);
  scene.add(glowR);

  // Actual lights from the lamps
  const lightL = new THREE.PointLight(0xff6600, 0.6, 6);
  lightL.position.set(-2.5, 1.4, -2);
  scene.add(lightL);
  const lightR = new THREE.PointLight(0xff6600, 0.6, 6);
  lightR.position.set(2.5, 1.4, -2);
  scene.add(lightR);

  // ========== ROOFS ==========
  const roofColor = 0x8b2500;

  // Keep roof
  createRoof(scene, 0, 0, 14, 11, roofColor, 7);

  // Inner tower roofs
  for (const [tx, tz] of itPos) {
    createRoof(scene, tx, tz, 4, 4, roofColor, 9);
  }

  // Outer tower roofs
  for (const [tx, tz] of otPos) {
    createRoof(scene, tx, tz, 6.5, 6.5, roofColor, 10);
  }

  // Village house roofs
  for (const h of houseData) {
    createRoof(scene, h.x, h.z, 3.6, 3.6, roofColor, 2.5);
  }

  // ========== BANNERS ==========
  for (const [tx, tz] of itPos) {
    createBanner(scene, tx, tz, 9);
  }
  for (const [tx, tz] of otPos) {
    createBanner(scene, tx, tz, 10);
  }
  createBanner(scene, 0, 0, 8);
  // Banners at gate
  createBanner(scene, -2.2, 28, 5.5);
  createBanner(scene, 2.2, 28, 5.5);

  // ========== ROADS ==========
  // Stone path from gate through village
  createPath(scene, 0, 16, 2.5, 10);
  createPath(scene, 0, 26, 2.5, 10);
  createPath(scene, 0, 36, 2.5, 10);
  createPath(scene, 0, 46, 2.5, 10);
  createPath(scene, 0, 56, 2, 6);

  // ========== SPATIAL HASH ==========
  for (const b of allBuildingData) {
    const hw = b.w / 2;
    const hd = b.d / 2;
    const minX = Math.floor((b.x - hw) / CELL_SIZE);
    const maxX = Math.floor((b.x + hw) / CELL_SIZE);
    const minZ = Math.floor((b.z - hd) / CELL_SIZE);
    const maxZ = Math.floor((b.z + hd) / CELL_SIZE);
    const entry = { bx: b.x, bz: b.z, hw, hd, left: b.x - hw, right: b.x + hw, near: b.z - hd, far: b.z + hd };
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const key = `${cx},${cz}`;
        if (!buildingCells[key]) buildingCells[key] = [];
        buildingCells[key].push(entry);
      }
    }
  }

  // ========== TREES ==========
  const treeData = [
    // Courtyard (outside keep walls)
    [8, 0], [-8, 0], [0, -6], [7, 3], [-7, -3],
    // Outside north wall
    [-10, -20], [10, -20], [0, -16],
    [-20, -14], [20, -14],
    // Outside east/west
    [-20, 10], [20, 10],
    [-18, -8], [18, -8],
    // Village area
    [-14, 37], [14, 37],
    [-10, 47], [14, 47],
    [-2, 55], [12, 56],
    // Far areas
    [-35, -15], [35, -15],
    [-35, 15], [35, 15],
    [0, -35], [-15, -30], [15, -30],
  ];

  for (const [tx, tz] of treeData) {
    treePositions.push([tx, tz]);
    createTree(scene, tx, tz);
  }
}

function queryBuilding(pos) {
  const result = [];
  const cx = Math.floor(pos.x / CELL_SIZE);
  const cz = Math.floor(pos.z / CELL_SIZE);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const cell = buildingCells[`${cx + dx},${cz + dz}`];
      if (cell) {
        for (const entry of cell) result.push(entry);
      }
    }
  }
  return result;
}

export function checkEntityCollision(pos, radius) {
  const candidates = queryBuilding(pos);
  for (const b of candidates) {
    const left = b.left - radius;
    const right = b.right + radius;
    const near = b.near - radius;
    const far = b.far + radius;
    if (pos.x > left && pos.x < right && pos.z > near && pos.z < far) {
      const overlapLeft = pos.x - left;
      const overlapRight = right - pos.x;
      const overlapNear = pos.z - near;
      const overlapFar = far - pos.z;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapNear, overlapFar);
      if (minOverlap === overlapLeft) pos.x = left;
      else if (minOverlap === overlapRight) pos.x = right;
      else if (minOverlap === overlapNear) pos.z = near;
      else pos.z = far;
    }
  }
  return pos;
}

const playerRadius = 0.3;

export function checkCollision(pos) {
  return checkEntityCollision(pos, playerRadius);
}
