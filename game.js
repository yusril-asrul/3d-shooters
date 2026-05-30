import * as THREE from 'three';

const PI = Math.PI;
const PI2 = PI * 2;

// --- DOM refs ---
const scoreEl = document.getElementById('score');
const killsEl = document.getElementById('kills');
const healthEl = document.getElementById('health');
const ammoEl = document.getElementById('ammo');
const reserveEl = document.getElementById('reserve');
const messageEl = document.getElementById('message');
const instructionsEl = document.getElementById('instructions');
const crosshairEl = document.getElementById('crosshair');
const damageOverlay = document.getElementById('damage-overlay');
const hitmarkerEl = document.getElementById('hitmarker');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

// --- Sound System (Web Audio) ---
let audioCtx;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playNoise(duration, freq, type, vol, ramp) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sawtooth';
  osc.frequency.setValueAtTime(freq || 200, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol || 0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration || 0.1));
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + (duration || 0.1));
}

function playGunshot() {
  if (!audioCtx) return;
  // Sharp noise burst
  const bufferSize = audioCtx.sampleRate * 0.08;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
}

function playFootstep() {
  playNoise(0.06, 80 + Math.random() * 40, 'sine', 0.12);
}

function playZombieGrowl() {
  if (!audioCtx || Math.random() > 0.15) return;
  // Deep low rumble with filter
  const bufferSize = audioCtx.sampleRate * 0.5;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const t = i / audioCtx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * 0.3 + Math.sin(t * 50) * 0.7;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, audioCtx.currentTime);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  src.start();
}

function playZombieAttack() {
  if (!audioCtx) return;
  // Deep growl + roar
  [0, 120].forEach(offset => {
    const bufferSize = audioCtx.sampleRate * 0.25;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / audioCtx.sampleRate;
      data[i] = Math.sin(t * (40 + offset * 0.3)) * 0.6 + (Math.random() * 2 - 1) * 0.2;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime + offset / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + offset / 1000 + 0.2);
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioCtx.currentTime);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(audioCtx.currentTime + offset / 1000);
  });
}

function playHit() {
  playNoise(0.05, 400, 'square', 0.2);
}

function playPlayerHurt() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  gain.connect(audioCtx.destination);
  osc.connect(gain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function playReload() {
  if (!audioCtx) return;
  // Click
  setTimeout(() => playNoise(0.03, 800, 'square', 0.15), 200);
  // Slide
  setTimeout(() => playNoise(0.08, 200, 'sawtooth', 0.1), 500);
  // Click back
  setTimeout(() => playNoise(0.03, 1000, 'square', 0.15), 900);
}

function playPickup(type) {
  if (!audioCtx) return;
  const freq = type === 'health' ? 600 : 400;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 80, 150);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.7, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.8);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
sun.position.set(50, 50, 30);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x3a7d44,
  roughness: 0.9,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Grid helper (subtle) ---
const grid = new THREE.GridHelper(200, 40, 0x55aa55, 0x2d5a2d);
grid.position.y = 0.05;
scene.add(grid);

// --- World objects ---
function createBuilding(x, z, w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createTree(x, z) {
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

// Build level layout
const buildings = [];
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
  buildings.push(createBuilding(b.x, b.z, b.w, b.h, b.d, b.color));
}

// --- Spatial Hash (building collision acceleration) ---
const CELL_SIZE = 10;
const buildingCells = {};

function hashKey(x, z) {
  return `${Math.floor(x / CELL_SIZE)},${Math.floor(z / CELL_SIZE)}`;
}

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

function queryBuilding(pos) {
  const key = hashKey(pos.x, pos.z);
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

// --- Collision ---
function checkEntityCollision(pos, radius) {
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

function checkCollision(pos) {
  return checkEntityCollision(pos, playerRadius);
}

// Trees
const treePositions = [
  [-3, -5], [5, -8], [-8, 5], [8, 8], [-11, -6],
  [14, 4], [-14, 9], [6, -13], [-9, -14], [16, -8],
  [-16, -5], [4, 16], [-4, -16], [18, 14], [-18, 12],
];
for (const [tx, tz] of treePositions) {
  createTree(tx, tz);
}

// --- Player state ---
const player = {
  health: 100,
  maxHealth: 100,
  speed: 6,
  height: 1.7,
  velocityY: 0,
  isGrounded: true,
};

const weapon = {
  ammo: 30,
  maxAmmo: 30,
  reserve: 90,
  damage: 25,
  fireRate: 0.12,
  reloadTime: 1.5,
  isReloading: false,
};

// --- Input ---
const keys = {};
let isLocked = false;
let isAiming = false;

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && !weapon.isReloading) reload();
  if (e.key === ' ') {
    e.preventDefault();
    if (player.isGrounded) {
      player.velocityY = 6;
      player.isGrounded = false;
    }
  }
});
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

document.addEventListener('mousedown', (e) => {
  if (e.button === 2) isAiming = true;
  if (e.button === 0 && isLocked) shoot();
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 2) isAiming = false;
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

// --- Pointer Lock ---
renderer.domElement.addEventListener('click', () => {
  initAudio();
  if (!isLocked) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === renderer.domElement;
  messageEl.classList.toggle('show', !isLocked);
  messageEl.textContent = isLocked ? '' : 'Klik untuk mulai';
  crosshairEl.style.display = isLocked ? 'block' : 'none';
  instructionsEl.style.display = isLocked ? 'block' : 'none';
});

// --- Mouse look ---
let yaw = 0;
let pitch = 0;
const lookSensitivity = 0.002;

document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  yaw -= e.movementX * lookSensitivity;
  pitch -= e.movementY * lookSensitivity;
  pitch = Math.max(-PI / 2 + 0.05, Math.min(PI / 2 - 0.05, pitch));
});

// --- Weapon Model ---
let gunGroup, barrelTipLocal;

function createWeapon() {
  gunGroup = new THREE.Group();
  gunGroup.position.set(0, 0, 0);

  const matDark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.7 });
  const matLight = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.5 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.22), matDark);
  body.position.set(0, 0, -0.02);
  gunGroup.add(body);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.18), matLight);
  barrel.position.set(0, 0.005, -0.17);
  gunGroup.add(barrel);

  // Muzzle tip (slightly wider)
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.04), matDark);
  muzzle.position.set(0, 0.005, -0.26);
  gunGroup.add(muzzle);

  // Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.04), matWood);
  grip.position.set(0, -0.075, 0.07);
  grip.rotation.x = -0.2;
  gunGroup.add(grip);

  // Trigger guard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), matDark);
  guard.position.set(0, -0.025, 0.04);
  gunGroup.add(guard);

  // Magazine
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.025), matDark);
  mag.position.set(0, -0.09, -0.02);
  gunGroup.add(mag);

  // Slide
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.2), matLight);
  slide.position.set(0, 0.04, -0.04);
  gunGroup.add(slide);

  // Barrel tip in local space (for bullet origin)
  barrelTipLocal = new THREE.Vector3(0, 0.005, -0.28);

  // Animation states
  gunGroup.userData.recoil = 0;
  gunGroup.userData.reloadTimer = 0;
  gunGroup.userData.basePos = new THREE.Vector3(0.35, -0.25, -0.5);

  scene.add(gunGroup);
}

function updateWeapon(dt) {
  // Reload animation
  if (gunGroup.userData.reloadTimer > 0) {
    gunGroup.userData.reloadTimer -= dt;
    const t = gunGroup.userData.reloadTimer;
    const total = weapon.reloadTime;
    const phase = 1 - t / total;

    if (phase < 0.2) {
      // Gun goes down
      const p = phase / 0.2;
      gunGroup.userData.reloadOffset = p;
    } else if (phase > 0.8) {
      // Gun comes back up
      const p = (phase - 0.8) / 0.2;
      gunGroup.userData.reloadOffset = 1 - p;
    } else {
      gunGroup.userData.reloadOffset = 1;
    }

    if (t <= 0) {
      gunGroup.userData.reloadTimer = 0;
      gunGroup.userData.reloadOffset = 0;
    }
  } else {
    if (gunGroup.userData.reloadOffset > 0) {
      gunGroup.userData.reloadOffset = Math.max(0, gunGroup.userData.reloadOffset - dt * 3);
    }
  }

  // Lerp basePos toward ADS or default
  let targetPos;
  if (isAiming) {
    targetPos = new THREE.Vector3(0.12, -0.12, -0.35);
  } else {
    targetPos = gunGroup.userData.basePos.clone();
  }

  // Apply reload offset (gun drops down and back)
  const reloadAmt = gunGroup.userData.reloadOffset || 0;
  targetPos.y -= reloadAmt * 0.15;
  targetPos.z -= reloadAmt * 0.1;

  const currentOffset = gunGroup.userData.currentOffset || gunGroup.userData.basePos.clone();
  currentOffset.lerp(targetPos, dt * 12);
  gunGroup.userData.currentOffset = currentOffset;

  const offset = currentOffset.clone();
  if (gunGroup.userData.recoil > 0) {
    offset.z += gunGroup.userData.recoil;
    gunGroup.userData.recoil -= dt * 2;
    if (gunGroup.userData.recoil <= 0) gunGroup.userData.recoil = 0;
  }
  const worldPos = offset.clone().applyQuaternion(camera.quaternion).add(camera.position);
  gunGroup.position.copy(worldPos);
  gunGroup.quaternion.copy(camera.quaternion);
}

function getBarrelWorldPos() {
  const v = barrelTipLocal.clone();
  v.applyQuaternion(gunGroup.quaternion);
  v.add(gunGroup.position);
  return v;
}

// --- Shooting ---
let lastShotTime = 0;
const raycaster = new THREE.Raycaster();
const tracers = [];

function shoot() {
  if (!isLocked || weapon.isReloading) return;
  if (weapon.ammo <= 0) { reload(); return; }

  const now = performance.now();
  if (now - lastShotTime < weapon.fireRate * 1000) return;
  lastShotTime = now;

  weapon.ammo--;
  updateHUD();

  // Recoil animation
  gunGroup.userData.recoil = 0.08;

  // Sound
  playGunshot();
  shakeIntensity = Math.max(shakeIntensity, 0.04);

  // Barrel world position
  const barrelPos = getBarrelWorldPos();

  // Muzzle flash
  createMuzzleFlash(barrelPos);

  // Raycast from camera center (for aiming accuracy)
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  raycaster.far = 100;

  let hitPoint = null;
  const intersects = raycaster.intersectObjects(targets, true);
  if (intersects.length > 0) {
    const hit = intersects[0];
    const target = hit.object;
    hitTarget(target, hit.point);
    hitPoint = hit.point;
  }

  // Bullet tracer from barrel to hit or far point
  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(camera.quaternion);
  const endPoint = hitPoint || barrelPos.clone().add(dir.clone().multiplyScalar(80));
  createTracer(barrelPos, endPoint);
}

function createMuzzleFlash(pos) {
  const flash = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffdd44 })
  );
  flash.position.copy(pos);
  flash.quaternion.copy(camera.quaternion);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 40);
}

function createTracer(from, to) {
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const length = from.distanceTo(to);
  const dir = new THREE.Vector3().copy(to).sub(from).normalize();

  const tracer = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.015, length),
    new THREE.MeshBasicMaterial({
      color: 0xffff44,
      transparent: true,
      opacity: 1,
    })
  );
  tracer.position.copy(mid);
  tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  scene.add(tracer);

  tracer.userData.life = 0.1;
  tracers.push(tracer);
}

function updateTracers(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.userData.life -= dt;
    if (t.userData.life <= 0) {
      scene.remove(t);
      tracers.splice(i, 1);
      continue;
    }
    t.material.opacity = t.userData.life * 10;
  }
}

// --- Reload ---
function reload() {
  if (weapon.isReloading || weapon.ammo === weapon.maxAmmo || weapon.reserve <= 0) return;
  weapon.isReloading = true;
  gunGroup.userData.reloadTimer = weapon.reloadTime;
  gunGroup.userData.reloadOffset = 0;
  playReload();
  messageEl.textContent = 'Memuat ulang...';
  messageEl.classList.add('show');
  setTimeout(() => {
    const needed = weapon.maxAmmo - weapon.ammo;
    const available = Math.min(needed, weapon.reserve);
    weapon.ammo += available;
    weapon.reserve -= available;
    weapon.isReloading = false;
    messageEl.classList.remove('show');
    updateHUD();
  }, weapon.reloadTime * 1000);
}

// --- Zombies ---
const targets = [];
let score = 0;
let kills = 0;

// Object Pool
const POOL_SIZE = 30;
const zombiePool = [];

function buildZombieGeometry() {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.85 });
  const darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.9 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.9 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), clothMat);
  body.position.y = 1.0;
  body.castShadow = true;
  group.add(body);
  body.userData.zombieGroup = group;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
  head.position.set(0, 1.6, 0);
  head.castShadow = true;
  group.add(head);
  head.userData.zombieGroup = group;

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
  eyeL.position.set(-0.14, 1.65, -0.24);
  group.add(eyeL);
  eyeL.userData.zombieGroup = group;

  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
  eyeR.position.set(0.14, 1.65, -0.24);
  group.add(eyeR);
  eyeR.userData.zombieGroup = group;

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.45, 1.35, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), darkSkinMat);
  leftArm.position.y = -0.25;
  leftArm.castShadow = true;
  leftArmGroup.add(leftArm);
  leftArm.userData.zombieGroup = group;
  group.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.45, 1.35, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), darkSkinMat);
  rightArm.position.y = -0.25;
  rightArm.castShadow = true;
  rightArmGroup.add(rightArm);
  rightArm.userData.zombieGroup = group;
  group.add(rightArmGroup);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.65, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), clothMat);
  leftLeg.position.y = -0.275;
  leftLeg.castShadow = true;
  leftLegGroup.add(leftLeg);
  leftLeg.userData.zombieGroup = group;
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.65, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), clothMat);
  rightLeg.position.y = -0.275;
  rightLeg.castShadow = true;
  rightLegGroup.add(rightLeg);
  rightLeg.userData.zombieGroup = group;
  group.add(rightLegGroup);

  group.userData.parts = {
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    head,
  };
  group.userData.materials = { skinMat, darkSkinMat, clothMat, eyeMat };

  return group;
}

function initZombiePool() {
  for (let i = 0; i < POOL_SIZE; i++) {
    const z = buildZombieGeometry();
    z.visible = false;
    z.userData.alive = false;
    zombiePool.push(z);
  }
}

function activateZombie(z, type) {
  type = type || (Math.random() < 0.2 ? 'tank' : 'normal');
  const isTank = type === 'tank';

  const angle = Math.random() * PI2;
  const dist = 20 + Math.random() * 40;
  z.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  z.rotation.set(0, 0, 0);
  z.visible = true;

  // Reset limb rotations
  const p = z.userData.parts;
  p.leftArm.rotation.x = 0;
  p.rightArm.rotation.x = 0;
  p.leftLeg.rotation.x = 0;
  p.rightLeg.rotation.x = 0;

  // Set type-specific visuals and stats
  const mat = z.userData.materials;
  if (isTank) {
    z.scale.set(1.8, 1.8, 1.8);
    mat.skinMat.color.setHex(0x7a3a2a);
    mat.darkSkinMat.color.setHex(0x5a2a1a);
    mat.clothMat.color.setHex(0x1a1a2a);
    mat.eyeMat.color.setHex(0xff6600);
    z.userData.health = 300;
    z.userData.maxHealth = 300;
    z.userData.speed = 0.8 + Math.random() * 0.6;
    z.userData.attackRange = 2.4;
    z.userData.scoreValue = 100;
    z.userData.killScore = 200;
  } else {
    z.scale.set(1, 1, 1);
    mat.skinMat.color.setHex(0x5a7a4a);
    mat.darkSkinMat.color.setHex(0x3a5a3a);
    mat.clothMat.color.setHex(0x2a3a2a);
    mat.eyeMat.color.setHex(0xff2200);
    z.userData.health = 100;
    z.userData.maxHealth = 100;
    z.userData.speed = 1.5 + Math.random() * 2.5;
    z.userData.attackRange = 1.6;
    z.userData.scoreValue = 10;
    z.userData.killScore = 50;
  }
  z.userData.type = type;
  z.userData.alive = true;
  z.userData.walkTime = Math.random() * PI2;
  z.userData.attackCooldown = 0;

  scene.add(z);
  targets.push(z);
}

function deactivateZombie(z) {
  z.visible = false;
  z.userData.alive = false;
  scene.remove(z);
  const idx = targets.indexOf(z);
  if (idx !== -1) targets.splice(idx, 1);
}

function createZombie(type) {
  // Find inactive zombie in pool
  for (const z of zombiePool) {
    if (!z.userData.alive) {
      activateZombie(z, type);
      return z;
    }
  }
  // Pool exhausted — create dynamically
  const z = buildZombieGeometry();
  zombiePool.push(z);
  activateZombie(z, type);
  return z;
}

function destroyZombie(zombie) {
  const pos = zombie.position.clone();
  createExplosion(pos);

  deactivateZombie(zombie);

  kills++;
  score += zombie.userData.killScore || 50;
  updateHUD();

  // Drop item with 60% chance
  if (Math.random() < 0.6) {
    spawnDrop(pos);
  }
}

function respawnZombie(zombie) {
  const angle = Math.random() * PI2;
  const dist = 20 + Math.random() * 30;
  zombie.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  const data = zombie.userData;
  data.health = 100;
}

function getZombieGroup(mesh) {
  let obj = mesh;
  while (obj) {
    if (obj.userData && obj.userData.zombieGroup) return obj.userData.zombieGroup;
    if (obj.parent && obj.parent.userData && obj.parent.userData.maxHealth) return obj.parent;
    obj = obj.parent;
  }
  return mesh;
}

function updateTargets(dt) {
  const playerPos = camera.position;

  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    const data = t.userData;

    const toPlayer = new THREE.Vector3().copy(playerPos).sub(t.position);
    const distXZ = Math.sqrt(
      (playerPos.x - t.position.x) ** 2 + (playerPos.z - t.position.z) ** 2
    );
    const dist = toPlayer.length();
    toPlayer.y = 0;
    toPlayer.normalize();

    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z) + PI;
    let currentAngle = t.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff > PI) diff -= PI2;
    while (diff < -PI) diff += PI2;
    t.rotation.y += diff * dt * 5;

    data.attackCooldown -= dt;

    if (distXZ < 20) playZombieGrowl();

    if (distXZ < data.attackRange) {
      data.walkTime += dt * 8;
      const attackPhase = Math.sin(data.walkTime);
      const lunge = Math.max(0, attackPhase) * 0.6;
      t.position.y = lunge;
      t.rotation.x = -lunge * 0.3;

      const thrust = Math.abs(attackPhase) * 1.2;
      data.parts.leftArm.rotation.x = thrust;
      data.parts.rightArm.rotation.x = thrust;
      data.parts.leftLeg.rotation.x *= 0.9;
      data.parts.rightLeg.rotation.x *= 0.9;
    } else {
      const speed = distXZ < 10 ? data.speed : data.speed * 0.6;
      t.position.x += toPlayer.x * speed * dt;
      t.position.z += toPlayer.z * speed * dt;
      checkEntityCollision(t.position, 0.4);

      data.walkTime += speed * dt * 3;
      const swing = Math.sin(data.walkTime) * 0.5;
      const armSwing = Math.sin(data.walkTime + PI) * 0.4;
      data.parts.leftLeg.rotation.x = -swing;
      data.parts.rightLeg.rotation.x = swing;
      data.parts.leftArm.rotation.x = armSwing;
      data.parts.rightArm.rotation.x = -armSwing;

      if (distXZ < 5) {
        data.parts.leftArm.rotation.x += -0.3;
        data.parts.rightArm.rotation.x += -0.3;
      }

      t.position.y = Math.abs(Math.sin(data.walkTime * 2)) * 0.05;
      t.rotation.x *= 0.9;
    }

    if (dist > 80) {
      respawnZombie(t);
    }
  }
}

function hitTarget(mesh, point) {
  const zombie = getZombieGroup(mesh);
  if (!zombie || !zombie.userData) return;

  const data = zombie.userData;
  data.health -= weapon.damage;

  // Hit flash on body/head
  const parts = data.parts;
  if (parts.head) {
    const orig = parts.head.material.color.getHex();
    parts.head.material.color.setHex(0xffffff);
    setTimeout(() => { parts.head.material.color.setHex(orig); }, 60);
  }

  score += data.scoreValue || 10;
  updateHUD();
  playHit();
  // Hitmarker
  crosshairEl.classList.add('hit');
  hitmarkerEl.classList.add('show');
  setTimeout(() => {
    crosshairEl.classList.remove('hit');
    hitmarkerEl.classList.remove('show');
  }, 100);

  if (data.health <= 0) {
    destroyZombie(zombie);
  }
}

// --- Drops ---
const drops = [];

function spawnDrop(pos) {
  const isHealth = Math.random() < 0.5;
  const group = new THREE.Group();
  group.position.copy(pos);
  group.position.y = 0;

  if (isHealth) {
    // Red cross
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0x660000, emissiveIntensity: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), redMat);
    vBar.position.y = 0.15;
    group.add(vBar);

    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), redMat);
    hBar.position.y = 0.15;
    group.add(hBar);

    group.userData.type = 'health';
    group.userData.value = 30;
  } else {
    // Ammo box
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.7 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x442200 });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), boxMat);
    box.position.y = 0.075;
    box.castShadow = true;
    group.add(box);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.02), stripeMat);
    stripe.position.set(0, 0.1, 0.08);
    group.add(stripe);

    group.userData.type = 'ammo';
    group.userData.value = 15;
  }

  group.userData.spawnTime = performance.now();
  group.userData.floatOffset = Math.random() * PI2;
  scene.add(group);
  drops.push(group);
  return group;
}

function updateDrops(dt) {
  const playerPos = camera.position;

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    const age = (performance.now() - d.userData.spawnTime) / 1000;

    // Despawn after 20 seconds
    if (age > 20) {
      scene.remove(d);
      drops.splice(i, 1);
      continue;
    }

    // Floating animation
    const bob = Math.sin(age * 2 + d.userData.floatOffset) * 0.1;
    d.position.y = bob + 0.2;
    d.rotation.y += dt * 1.5;

    // Opacity fade out in last 3 seconds
    if (age > 17) {
      const fade = 1 - (age - 17) / 3;
      d.children.forEach(child => {
        if (child.material) {
          child.material.transparent = true;
          child.material.opacity = fade;
        }
      });
    }

    // Pickup check
    const dx = playerPos.x - d.position.x;
    const dz = playerPos.z - d.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.2) {
      // Pickup!
      if (d.userData.type === 'health') {
        player.health = Math.min(player.maxHealth, player.health + d.userData.value);
      } else if (d.userData.type === 'ammo') {
        weapon.reserve += d.userData.value;
      }
      updateHUD();

      // Pickup flash
      const color = d.userData.type === 'health' ? 'rgba(0,255,0,0.3)' : 'rgba(255,170,0,0.3)';
      damageOverlay.style.background = color;
      damageOverlay.classList.add('show');
      setTimeout(() => {
        damageOverlay.classList.remove('show');
        damageOverlay.style.background = '';
      }, 200);
      playPickup(d.userData.type);

      scene.remove(d);
      drops.splice(i, 1);
    }
  }
}

// --- Particles ---
const particles = [];

function createExplosion(pos) {
  const colors = [0x44aa00, 0x66cc00, 0x88ff00, 0x226600];
  for (let i = 0; i < 20; i++) {
    const size = 0.1 + Math.random() * 0.3;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
      })
    );
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 0.5;
    mesh.position.z += (Math.random() - 0.5) * 0.5;

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      Math.random() * 6,
      (Math.random() - 0.5) * 8
    );
    mesh.userData.vel = vel;
    mesh.userData.life = 0.6 + Math.random() * 0.4;

    scene.add(mesh);
    particles.push(mesh);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;
    if (p.userData.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
      continue;
    }
    const vel = p.userData.vel;
    vel.y -= 9.8 * dt;
    p.position.add(vel.clone().multiplyScalar(dt));
    p.material.opacity = p.userData.life;
    const scale = p.userData.life;
    p.scale.setScalar(scale);
  }
}

// --- Damage by enemies ---
let damageTimer = 0;

function enemyDamagePlayer(dt) {
  damageTimer -= dt;
  if (damageTimer > 0) return;
  damageTimer = 1;

  const playerPos = camera.position;
  for (const t of targets) {
    const dx = playerPos.x - t.position.x;
    const dz = playerPos.z - t.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.7) {
      player.health -= 10;
      updateHUD();

      // Red screen flash
      damageOverlay.classList.add('show');
      setTimeout(() => damageOverlay.classList.remove('show'), 150);
      playZombieAttack();
      playPlayerHurt();
      shakeIntensity = Math.max(shakeIntensity, 0.06);

      if (player.health <= 0) {
        gameOver();
        return;
      }
    }
  }
}

// --- HUD ---
function updateHUD() {
  scoreEl.textContent = score;
  killsEl.textContent = kills;
  healthEl.textContent = player.health;
  ammoEl.textContent = weapon.ammo;
  reserveEl.textContent = weapon.reserve;

  if (player.health < 30) healthEl.style.color = '#ff4444';
  else if (player.health < 60) healthEl.style.color = '#ffaa44';
  else healthEl.style.color = '#44ff44';
}

// --- Game Over ---
let deathTimer = 0;
let deathStartY = 0;
let deathStartPitch = 0;

function gameOver() {
  deathTimer = 0.6;
  deathStartY = camera.position.y;
  deathStartPitch = pitch;
}

function showGameOver() {
  messageEl.innerHTML = `GAME OVER<br>Score: ${score}<br>Kills: ${kills}<br><br>Klik untuk respawn`;
  messageEl.classList.add('show');
  isLocked = false;
  document.exitPointerLock();
  renderer.domElement.addEventListener('click', restart, { once: true });
}

function restart() {
  player.health = player.maxHealth;
  weapon.ammo = weapon.maxAmmo;
  weapon.reserve = 90;
  weapon.isReloading = false;
  score = 0;
  kills = 0;
  damageTimer = 0;
  deathTimer = 0;
  player.velocityY = 0;
  player.isGrounded = true;

  // Clear targets (return to pool)
  while (targets.length) deactivateZombie(targets[0]);

  // Clear particles
  for (const p of particles) scene.remove(p);
  particles.length = 0;

  // Clear drops
  for (const d of drops) scene.remove(d);
  drops.length = 0;

  // Reset position
  camera.position.set(0, player.height, 0);
  yaw = 0;
  pitch = 0;

  updateHUD();
  messageEl.classList.remove('show');
  renderer.domElement.requestPointerLock();

  // Spawn initial targets
  for (let i = 0; i < 8; i++) createZombie();
}

// --- Window resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Game Loop ---
let lastTime = 0;
let spawnTimer = 0;
let footstepTimer = 0;
let shakeIntensity = 0;

function updateMinimap() {
  const s = minimapCanvas.width;
  const r = s / 2;
  const scale = 0.6; // pixels per world unit
  const ctx = minimapCtx;

  ctx.clearRect(0, 0, s, s);

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, PI2);
  ctx.clip();

  // Dark background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, s, s);

  const cx = r;
  const cy = r;
  const px = camera.position.x;
  const pz = camera.position.z;

  // Buildings
  ctx.fillStyle = 'rgba(100,100,120,0.7)';
  for (const b of buildings) {
    const bx = (b.position.x - px) * scale + cx;
    const bz = (b.position.z - pz) * scale + cy;
    const bw = (b.geometry.parameters.width || 0.5) * scale;
    const bd = (b.geometry.parameters.depth || 0.5) * scale;
    ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd);
  }

  // Trees
  ctx.fillStyle = 'rgba(34,139,34,0.5)';
  for (const [tx, tz] of treePositions) {
    const mx = (tx - px) * scale + cx;
    const mz = (tz - pz) * scale + cy;
    ctx.beginPath();
    ctx.arc(mx, mz, 3, 0, PI2);
    ctx.fill();
  }

  // Drops
  for (const d of drops) {
    const mx = (d.position.x - px) * scale + cx;
    const mz = (d.position.z - pz) * scale + cy;
    ctx.fillStyle = d.userData.type === 'health' ? '#44ff44' : '#ffaa44';
    ctx.beginPath();
    ctx.arc(mx, mz, 2.5, 0, PI2);
    ctx.fill();
  }

  // Zombies
  for (const t of targets) {
    const mx = (t.position.x - px) * scale + cx;
    const mz = (t.position.z - pz) * scale + cy;
    ctx.fillStyle = t.userData.type === 'tank' ? '#ff8800' : '#ff3333';
    const r = t.userData.type === 'tank' ? 5 : 3.5;
    ctx.beginPath();
    ctx.arc(mx, mz, r, 0, PI2);
    ctx.fill();
  }

  ctx.restore();

  // Border circle
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, PI2);
  ctx.stroke();

  // Player dot
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, PI2);
  ctx.fill();

  // Player direction
  const dirLen = 10;
  const dx2 = -Math.sin(yaw) * dirLen;
  const dz2 = -Math.cos(yaw) * dirLen;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + dx2, cy + dz2);
  ctx.stroke();
}

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Death animation
  if (deathTimer > 0) {
    deathTimer -= dt;
    const t = 1 - deathTimer / 0.6;
    const eased = t * t;
    camera.position.y = deathStartY + (0.3 - deathStartY) * eased;
    pitch = deathStartPitch + (-PI / 6 - deathStartPitch) * eased;
    const roll = -PI / 4 * eased;
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
    updateMinimap();
    renderer.render(scene, camera);
    if (deathTimer <= 0) showGameOver();
    return;
  }

  if (!isLocked) {
    renderer.render(scene, camera);
    return;
  }

  // Movement
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);

  const moveDir = new THREE.Vector3();
  if (keys['w'] || keys['arrowup']) moveDir.add(forward);
  if (keys['s'] || keys['arrowdown']) moveDir.sub(forward);
  if (keys['a'] || keys['arrowleft']) moveDir.sub(right);
  if (keys['d'] || keys['arrowright']) moveDir.add(right);
  if (keys['shift']) moveDir.multiplyScalar(1.8);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    const speed = player.speed * (keys['shift'] ? 1.8 : 1);
    const newPos = camera.position.clone();
    newPos.x += moveDir.x * speed * dt;
    newPos.z += moveDir.z * speed * dt;
    checkCollision(newPos);
    camera.position.x = newPos.x;
    camera.position.z = newPos.z;

    // Footsteps
    footstepTimer -= dt;
    const stepInterval = keys['shift'] ? 0.3 : 0.45;
    if (footstepTimer <= 0 && player.isGrounded) {
      playFootstep();
      footstepTimer = stepInterval;
    }
  } else {
    footstepTimer = 0;
  }

  // Jump / Gravity
  const GRAVITY = -15;
  if (!player.isGrounded) {
    player.velocityY += GRAVITY * dt;
    camera.position.y += player.velocityY * dt;
    if (camera.position.y <= player.height) {
      camera.position.y = player.height;
      player.velocityY = 0;
      player.isGrounded = true;
    }
  }

  // Camera rotation
  const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  // ADS zoom
  const targetFov = isAiming ? 45 : 70;
  camera.fov += (targetFov - camera.fov) * dt * 12;
  camera.updateProjectionMatrix();

  // Update weapon position (follows camera)
  updateWeapon(dt);

  // Update targets
  updateTargets(dt);
  updateParticles(dt);
  updateTracers(dt);
  updateDrops(dt);
  enemyDamagePlayer(dt);

  // Auto-spawn targets
  spawnTimer -= dt;
  if (spawnTimer <= 0 && targets.length < 12) {
    createZombie();
    spawnTimer = 3 + Math.random() * 4;
  }

  // Screen shake
  if (shakeIntensity > 0) {
    const sx = (Math.random() - 0.5) * shakeIntensity;
    const sy = (Math.random() - 0.5) * shakeIntensity;
    const origX = camera.position.x;
    const origY = camera.position.y;
    camera.position.x += sx;
    camera.position.y += sy;
    shakeIntensity *= 0.85;
    if (shakeIntensity < 0.001) shakeIntensity = 0;
    updateMinimap();
    renderer.render(scene, camera);
    camera.position.x = origX;
    camera.position.y = origY;
  } else {
    updateMinimap();
    renderer.render(scene, camera);
  }
}

// --- Start ---
createWeapon();
updateHUD();
messageEl.classList.add('show');
crosshairEl.style.display = 'none';

// Initialize zombie pool
initZombiePool();

// Initial targets
for (let i = 0; i < 6; i++) createZombie();
spawnTimer = 3;

animate(0);
