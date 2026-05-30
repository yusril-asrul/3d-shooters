import * as THREE from 'three';
import { PI, state } from './state.js';

const CELL_SIZE = 10;
const buildingCells = {};
export const buildings = [];
export const treePositions = [];

function createBuilding(scene, x, z, w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
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

export function initWorld(scene) {
  state.buildings = buildings;
  state.trees = treePositions;
  const buildingData = [
    { x: -8, z: -8, w: 3, h: 4, d: 3, color: 0x4a6fa5 },
    { x: 10, z: -6, w: 4, h: 6, d: 4, color: 0x6b4a3a },
    { x: -6, z: 10, w: 5, h: 3, d: 5, color: 0x5a5a7a },
    { x: 12, z: 10, w: 3, h: 7, d: 3, color: 0x7a5a4a },
    { x: -12, z: 4, w: 3.5, h: 5, d: 3.5, color: 0x4a7a6a },
    { x: 0, z: -14, w: 5, h: 3.5, d: 3, color: 0x7a6a4a },
    { x: -14, z: -12, w: 3, h: 4, d: 3, color: 0x5a4a6a },
    { x: 15, z: -14, w: 4, h: 5, d: 4, color: 0x6a5a4a },
  ];

  for (const b of buildingData) {
    buildings.push(createBuilding(scene, b.x, b.z, b.w, b.h, b.d, b.color));
  }

  // Spatial Hash
  for (const b of buildingData) {
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

  // Trees
  const treeData = [
    [-3, -5], [5, -8], [-8, 5], [8, 8], [-11, -6],
    [14, 4], [-14, 9], [6, -13], [-9, -14], [16, -8],
    [-16, -5], [4, 16], [-4, -16], [18, 14], [-18, 12],
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
