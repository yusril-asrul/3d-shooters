import * as THREE from 'three';
import { state, PI, PI2 } from './state.js';
import { initAudio, playFootstep } from './audio.js';
import { initWorld, checkCollision } from './world.js';
import { initWeapon, shoot, reload, updateWeapon, updateTracers, switchWeapon } from './weapons.js';
import { initZombies, createZombie, updateTargets, updateParticles, updateDrops, enemyDamagePlayer, clearAllZombies } from './zombies.js';
import { initUI, updateHUD, showMessage, hideMessage, gameOver, isDeathActive, setDeathActive, updateUI } from './ui.js';

// --- Scene setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 80, 150);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.7, 38);
state.cameraHeightDefault = 1.7;
state.cameraHeight = 1.7;
state.cameraTilt = 0;
state.cameraRoll = 0;

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
const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(200, 40, 0x55aa55, 0x2d5a2d);
grid.position.y = 0.05;
scene.add(grid);

// --- World ---
initWorld(scene);

// --- Initialize modules ---
initUI();
initWeapon(scene, camera);
initZombies(scene, camera);

// --- Input ---
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === '1') switchWeapon('rifle');
  if (e.key === '2') switchWeapon('knife');
  if (e.key.toLowerCase() === 'r') reload();
  if (e.key === ' ') {
    e.preventDefault();
    if (state.player.isGrounded) {
      state.player.velocityY = 6;
      state.player.isGrounded = false;
    }
  }
});
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

document.addEventListener('mousedown', (e) => {
  if (e.button === 2) state.isAiming = true;
  if (e.button === 0 && state.isLocked) shoot();
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 2) state.isAiming = false;
});
document.addEventListener('contextmenu', (e) => e.preventDefault());

renderer.domElement.addEventListener('click', () => {
  initAudio();
  if (!state.isLocked) {
    renderer.domElement.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  state.isLocked = document.pointerLockElement === renderer.domElement;
  if (state.isLocked) {
    hideMessage();
  } else {
    showMessage('Klik untuk mulai');
  }
});

const lookSensitivity = 0.002;
document.addEventListener('mousemove', (e) => {
  if (!state.isLocked) return;
  state.yaw -= e.movementX * lookSensitivity;
  state.pitch -= e.movementY * lookSensitivity;
  state.pitch = Math.max(-PI / 2 + 0.05, Math.min(PI / 2 - 0.05, state.pitch));
});

// --- Window resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Restart ---
export function restart() {
  state.player.health = state.player.maxHealth;
  state.player.velocityY = 0;
  state.player.isGrounded = true;
  state.yaw = 0;
  state.pitch = 0;
  state.shakeIntensity = 0;
  state.damageTimer = 0;
  state.deathTimer = 0;
  state.spawnTimer = 3;
  state.footstepTimer = 0;
  state.weapon.ammo = state.weapon.maxAmmo;
  state.weapon.reserve = 90;
  state.weapon.isReloading = false;
  switchWeapon('rifle');
  state.score = 0;
  state.kills = 0;
  state.cameraHeight = state.cameraHeightDefault;
  state.cameraTilt = 0;
  state.cameraRoll = 0;
  clearAllZombies();
  updateHUD();
  hideMessage();
  renderer.domElement.requestPointerLock();
  document.getElementById('restartBtn').style.display = '';
  const go = document.getElementById('gameOver');
  if (go) go.style.display = 'none';
  setDeathActive(false);
  startWave(1);
}

function startWave(n) {
  state.wave = n;
  state.waveZombieCount = state.waveBaseCount + n * state.waveIncrement;
  state.waveZombiesKilled = 0;
  state.waveZombiesSpawned = 0;
  state.waveActive = true;
  state.intermission = 0;
  state.spawnTimer = 1;
  showMessage(`Wave ${n}`);
  setTimeout(hideMessage, 2000);
  updateHUD();
}

// --- Game Loop ---
let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Death animation (handled by ui.js updateDeathAnimation)
  if (isDeathActive()) {
    updateUI(dt);
    const euler = new THREE.Euler(state.pitch + THREE.MathUtils.degToRad(state.cameraTilt), state.yaw, THREE.MathUtils.degToRad(state.cameraRoll), 'YXZ');
    camera.quaternion.setFromEuler(euler);
    camera.position.y = state.cameraHeight;
    renderer.render(scene, camera);
    return;
  }

  if (!state.isLocked) {
    updateUI(dt);
    renderer.render(scene, camera);
    return;
  }

  // Movement
  const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const moveDir = new THREE.Vector3();
  if (keys['w'] || keys['arrowup']) moveDir.add(forward);
  if (keys['s'] || keys['arrowdown']) moveDir.sub(forward);
  if (keys['a'] || keys['arrowleft']) moveDir.sub(right);
  if (keys['d'] || keys['arrowright']) moveDir.add(right);
  if (keys['shift']) moveDir.multiplyScalar(1.8);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    const speed = state.player.speed * (keys['shift'] ? 1.8 : 1);
    const newPos = camera.position.clone();
    newPos.x += moveDir.x * speed * dt;
    newPos.z += moveDir.z * speed * dt;
    checkCollision(newPos);
    camera.position.x = newPos.x;
    camera.position.z = newPos.z;

    state.footstepTimer -= dt;
    const stepInterval = keys['shift'] ? 0.3 : 0.45;
    if (state.footstepTimer <= 0 && state.player.isGrounded) {
      playFootstep();
      state.footstepTimer = stepInterval;
    }
  } else {
    state.footstepTimer = 0;
  }

  // Jump / Gravity
  const GRAVITY = -15;
  if (!state.player.isGrounded) {
    state.player.velocityY += GRAVITY * dt;
    camera.position.y += state.player.velocityY * dt;
    if (camera.position.y <= state.player.height) {
      camera.position.y = state.player.height;
      state.player.velocityY = 0;
      state.player.isGrounded = true;
    }
  }

  // Camera rotation
  const euler = new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  // ADS zoom
  const targetFov = state.isAiming ? 45 : 70;
  camera.fov += (targetFov - camera.fov) * dt * 12;
  camera.updateProjectionMatrix();

  // Store player position for minimap
  state.player.x = camera.position.x;
  state.player.z = camera.position.z;

  // Update systems
  updateWeapon(dt);
  updateTargets(dt);
  updateParticles(dt);
  updateTracers(dt);
  updateDrops(dt);
  enemyDamagePlayer(dt);
  updateUI(dt);

  // Wave spawn
  if (state.waveActive && state.waveZombiesSpawned < state.waveZombieCount) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.targets.length < 12) {
      createZombie(null, true);
      state.waveZombiesSpawned++;
      state.spawnTimer = 2 + Math.random() * 3;
    }
  }

  // Wave completion
  if (state.waveActive && state.waveZombiesSpawned >= state.waveZombieCount && state.waveZombiesKilled >= state.waveZombieCount) {
    state.waveActive = false;
    state.intermission = 12;
    showMessage(`Wave ${state.wave} Complete!`);
    setTimeout(hideMessage, 2500);
    updateHUD();
  }

  // Intermission
  if (state.intermission > 0 && !state.waveActive) {
    state.intermission -= dt;
    updateHUD();
    if (state.intermission <= 0) {
      startWave(state.wave + 1);
    }
  }

  // Screen shake
  if (state.shakeIntensity > 0) {
    const sx = (Math.random() - 0.5) * state.shakeIntensity;
    const sy = (Math.random() - 0.5) * state.shakeIntensity;
    const origX = camera.position.x;
    const origY = camera.position.y;
    camera.position.x += sx;
    camera.position.y += sy;
    state.shakeIntensity *= 0.85;
    if (state.shakeIntensity < 0.001) state.shakeIntensity = 0;
    renderer.render(scene, camera);
    camera.position.x = origX;
    camera.position.y = origY;
  } else {
    renderer.render(scene, camera);
  }
}

// --- Start ---
updateHUD();
showMessage('Klik untuk mulai');
animate(0);
