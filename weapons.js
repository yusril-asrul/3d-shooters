import * as THREE from 'three';
import { state } from './state.js';
import { playGunshot, playReload as playReloadSound, playKnifeSwing } from './audio.js';
import { hitTarget } from './zombies.js';
import { updateHUD, showMessage, hideMessage } from './ui.js';

let scene;
let camera;
let gunGroup;
let knifeGroup;
let barrelTipLocal;
let lastShotTime = 0;
let isKnifeAttacking = false;
let knifeSwingTimer = 0;
const raycaster = new THREE.Raycaster();

export function initWeapon(s, c) {
  scene = s;
  camera = c;

  gunGroup = new THREE.Group();
  gunGroup.position.set(0, 0, 0);

  const matDark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.7 });
  const matLight = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.5 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.22), matDark);
  body.position.set(0, 0, -0.02);
  gunGroup.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.18), matLight);
  barrel.position.set(0, 0.005, -0.17);
  gunGroup.add(barrel);
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.04), matDark);
  muzzle.position.set(0, 0.005, -0.26);
  gunGroup.add(muzzle);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.04), matWood);
  grip.position.set(0, -0.075, 0.07);
  grip.rotation.x = -0.2;
  gunGroup.add(grip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), matDark);
  guard.position.set(0, -0.025, 0.04);
  gunGroup.add(guard);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.025), matDark);
  mag.position.set(0, -0.09, -0.02);
  gunGroup.add(mag);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.2), matLight);
  slide.position.set(0, 0.04, -0.04);
  gunGroup.add(slide);

  barrelTipLocal = new THREE.Vector3(0, 0.005, -0.28);
  gunGroup.userData.recoil = 0;
  gunGroup.userData.reloadTimer = 0;
  gunGroup.userData.basePos = new THREE.Vector3(0.35, -0.25, -0.5);
  scene.add(gunGroup);

  knifeGroup = new THREE.Group();
  knifeGroup.position.set(0, 0, 0);

  const matSilver = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
  const matBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.3 });

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.003, 0.12), matSilver);
  blade.position.set(0, 0, -0.06);
  knifeGroup.add(blade);
  const knifeGuard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.01), matBlack);
  knifeGuard.position.set(0, 0, 0);
  knifeGroup.add(knifeGuard);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.06), matDark);
  handle.position.set(0, 0, 0.05);
  knifeGroup.add(handle);

  const matSkin = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
  const matSleeve = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });

  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), matSkin);
  hand.position.set(0, 0, 0.07);
  knifeGroup.add(hand);

  const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.10), matSleeve);
  forearm.position.set(0, 0, 0.14);
  knifeGroup.add(forearm);

  knifeGroup.userData.basePos = new THREE.Vector3(0.25, -0.15, -0.45);
  knifeGroup.userData.stabOffset = 0;
  knifeGroup.visible = false;
  scene.add(knifeGroup);
}

function getBarrelWorldPos() {
  const v = barrelTipLocal.clone();
  v.applyQuaternion(gunGroup.quaternion);
  v.add(gunGroup.position);
  return v;
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
    new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 1 })
  );
  tracer.position.copy(mid);
  tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  scene.add(tracer);
  tracer.userData.life = 0.1;
  state.tracers.push(tracer);
}

export function shoot() {
  if (!state.isLocked) return;
  if (state.currentWeapon === 'knife') { knifeAttack(); return; }
  const w = state.weapon;
  if (w.isReloading) return;
  if (w.ammo <= 0) { reload(); return; }
  const now = performance.now();
  if (now - lastShotTime < w.fireRate * 1000) return;
  lastShotTime = now;

  w.ammo--;
  updateHUD();
  gunGroup.userData.recoil = 0.08;
  playGunshot();
  state.shakeIntensity = Math.max(state.shakeIntensity, 0.04);

  const barrelPos = getBarrelWorldPos();
  createMuzzleFlash(barrelPos);

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  raycaster.far = 100;
  let hitPoint = null;
  const intersects = raycaster.intersectObjects(state.targets, true);
  if (intersects.length > 0) {
    const hit = intersects[0];
    hitTarget(hit.object, hit.point);
    hitPoint = hit.point;
  }

  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(camera.quaternion);
  const endPoint = hitPoint || barrelPos.clone().add(dir.clone().multiplyScalar(80));
  createTracer(barrelPos, endPoint);
}

function knifeAttack() {
  const now = performance.now();
  if (now - lastShotTime < 300) return;
  if (isKnifeAttacking) return;
  lastShotTime = now;
  isKnifeAttacking = true;
  knifeSwingTimer = 0;

  playKnifeSwing();

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  raycaster.far = 2.5;
  const intersects = raycaster.intersectObjects(state.targets, true);
  if (intersects.length > 0) {
    const hit = intersects[0];
    hitTarget(hit.object, hit.point);
  }
}

export function switchWeapon(type) {
  if (type === state.currentWeapon) return;
  if (state.weapon.isReloading) return;
  state.currentWeapon = type;
  gunGroup.visible = type === 'rifle';
  knifeGroup.visible = type === 'knife';
  isKnifeAttacking = false;
  knifeSwingTimer = 0;
  knifeGroup.userData.stabOffset = 0;
  updateHUD();
}

export function reload() {
  if (state.currentWeapon === 'knife') return;
  const w = state.weapon;
  if (w.isReloading || w.ammo === w.maxAmmo || w.reserve <= 0) return;
  w.isReloading = true;
  gunGroup.userData.reloadTimer = w.reloadTime;
  gunGroup.userData.reloadOffset = 0;
  playReloadSound();
  showMessage('Reload...');
  setTimeout(() => {
    const needed = w.maxAmmo - w.ammo;
    const available = Math.min(needed, w.reserve);
    w.ammo += available;
    w.reserve -= available;
    w.isReloading = false;
    hideMessage();
    updateHUD();
  }, w.reloadTime * 1000);
}

export function updateWeapon(dt) {
  if (state.currentWeapon === 'rifle') {
    updateRifle(dt);
  } else {
    updateKnife(dt);
  }
}

function updateRifle(dt) {
  const w = state.weapon;
  if (gunGroup.userData.reloadTimer > 0) {
    gunGroup.userData.reloadTimer -= dt;
    const t = gunGroup.userData.reloadTimer;
    const total = w.reloadTime;
    const phase = 1 - t / total;
    if (phase < 0.2) {
      gunGroup.userData.reloadOffset = phase / 0.2;
    } else if (phase > 0.8) {
      gunGroup.userData.reloadOffset = (1 - (phase - 0.8) / 0.2);
    } else {
      gunGroup.userData.reloadOffset = 1;
    }
    if (t <= 0) {
      gunGroup.userData.reloadTimer = 0;
      gunGroup.userData.reloadOffset = 0;
    }
  } else if (gunGroup.userData.reloadOffset > 0) {
    gunGroup.userData.reloadOffset = Math.max(0, gunGroup.userData.reloadOffset - dt * 3);
  }

  let targetPos;
  if (state.isAiming) {
    targetPos = new THREE.Vector3(0.12, -0.12, -0.35);
  } else {
    targetPos = gunGroup.userData.basePos.clone();
  }
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

function updateKnife(dt) {
  if (isKnifeAttacking) {
    knifeSwingTimer += dt;
    const stabDuration = 0.2;
    const t = Math.min(knifeSwingTimer / stabDuration, 1);
    knifeGroup.userData.stabOffset = Math.sin(t * Math.PI) * 0.3;
    if (t >= 1) {
      isKnifeAttacking = false;
      knifeSwingTimer = 0;
      knifeGroup.userData.stabOffset = 0;
    }
  } else if (knifeGroup.userData.stabOffset !== 0) {
    knifeGroup.userData.stabOffset *= 0.85;
    if (Math.abs(knifeGroup.userData.stabOffset) < 0.001) knifeGroup.userData.stabOffset = 0;
  }

  const basePos = knifeGroup.userData.basePos.clone();
  basePos.z -= knifeGroup.userData.stabOffset;

  const worldPos = basePos.applyQuaternion(camera.quaternion).add(camera.position);
  knifeGroup.position.copy(worldPos);
  knifeGroup.quaternion.copy(camera.quaternion);
}

export function updateTracers(dt) {
  for (let i = state.tracers.length - 1; i >= 0; i--) {
    const t = state.tracers[i];
    t.userData.life -= dt;
    if (t.userData.life <= 0) {
      scene.remove(t);
      state.tracers.splice(i, 1);
      continue;
    }
    t.material.opacity = t.userData.life * 10;
  }
}
