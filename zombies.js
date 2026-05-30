import * as THREE from 'three';
import { PI, PI2, state } from './state.js';
import { playZombieGrowl, playZombieAttack, playHit as playHitSound, playPlayerHurt, playPickup } from './audio.js';
import { updateHUD, showMessage, hideMessage, showDamageOverlay, showHitmarker, gameOver } from './ui.js';

let scene;
let camera;

export function initZombies(s, c) {
  scene = s;
  camera = c;
}

const POOL_SIZE = 30;
const zombiePool = [];

function buildZombieGeometry() {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.85 });
  const darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.9 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.9 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.4), clothMat);
  body.position.y = 1.0; body.castShadow = true;
  group.add(body); body.userData.zombieGroup = group;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skinMat);
  head.position.set(0, 1.6, 0); head.castShadow = true;
  group.add(head); head.userData.zombieGroup = group;

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
  eyeL.position.set(-0.14, 1.65, -0.24); group.add(eyeL); eyeL.userData.zombieGroup = group;
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), eyeMat);
  eyeR.position.set(0.14, 1.65, -0.24); group.add(eyeR); eyeR.userData.zombieGroup = group;

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.45, 1.35, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), darkSkinMat);
  leftArm.position.y = -0.25; leftArm.castShadow = true;
  leftArmGroup.add(leftArm); leftArm.userData.zombieGroup = group;
  group.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.45, 1.35, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), darkSkinMat);
  rightArm.position.y = -0.25; rightArm.castShadow = true;
  rightArmGroup.add(rightArm); rightArm.userData.zombieGroup = group;
  group.add(rightArmGroup);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.65, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), clothMat);
  leftLeg.position.y = -0.275; leftLeg.castShadow = true;
  leftLegGroup.add(leftLeg); leftLeg.userData.zombieGroup = group;
  group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.65, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), clothMat);
  rightLeg.position.y = -0.275; rightLeg.castShadow = true;
  rightLegGroup.add(rightLeg); rightLeg.userData.zombieGroup = group;
  group.add(rightLegGroup);

  group.userData.parts = { leftArm: leftArmGroup, rightArm: rightArmGroup, leftLeg: leftLegGroup, rightLeg: rightLegGroup, head };
  group.userData.materials = { skinMat, darkSkinMat, clothMat, eyeMat };
  return group;
}

function buildBossGeometry() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.7 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.8 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x660000, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.4), bodyMat);
  body.position.y = 1.0; body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), headMat);
  head.position.set(0, 1.55, 0); head.castShadow = true;
  group.add(head);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.04), eyeMat);
  eyeL.position.set(-0.14, 1.6, -0.22); group.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.04), eyeMat);
  eyeR.position.set(0.14, 1.6, -0.22); group.add(eyeR);

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.4, 1.3, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), armMat);
  leftArm.position.y = -0.275; leftArm.castShadow = true;
  leftArmGroup.add(leftArm); group.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.4, 1.3, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), armMat);
  rightArm.position.y = -0.275; rightArm.castShadow = true;
  rightArmGroup.add(rightArm); group.add(rightArmGroup);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.6, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), legMat);
  leftLeg.position.y = -0.25; leftLeg.castShadow = true;
  leftLegGroup.add(leftLeg); group.add(leftLegGroup);

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.6, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), legMat);
  rightLeg.position.y = -0.25; rightLeg.castShadow = true;
  rightLegGroup.add(rightLeg); group.add(rightLegGroup);

  const crownBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.28), crownMat);
  crownBase.position.y = 1.78; group.add(crownBase);
  for (let i = -1; i <= 1; i++) {
    const spike = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), crownMat);
    spike.position.set(i * 0.1, 1.86, 0); group.add(spike);
  }

  group.userData.parts = { leftArm: leftArmGroup, rightArm: rightArmGroup, leftLeg: leftLegGroup, rightLeg: rightLegGroup, head };
  group.userData.materials = { bodyMat, headMat, armMat, legMat, eyeMat, crownMat };
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

  const p = z.userData.parts;
  p.leftArm.rotation.x = 0; p.rightArm.rotation.x = 0;
  p.leftLeg.rotation.x = 0; p.rightLeg.rotation.x = 0;

  const mat = z.userData.materials;
  if (isTank) {
    z.scale.set(1.8, 1.8, 1.8);
    mat.skinMat.color.setHex(0x7a3a2a); mat.darkSkinMat.color.setHex(0x5a2a1a);
    mat.clothMat.color.setHex(0x1a1a2a); mat.eyeMat.color.setHex(0xff6600);
    z.userData.health = 300; z.userData.maxHealth = 300;
    z.userData.speed = 0.8 + Math.random() * 0.6;
    z.userData.attackRange = 2.4; z.userData.scoreValue = 100; z.userData.killScore = 200;
  } else {
    z.scale.set(1, 1, 1);
    mat.skinMat.color.setHex(0x5a7a4a); mat.darkSkinMat.color.setHex(0x3a5a3a);
    mat.clothMat.color.setHex(0x2a3a2a); mat.eyeMat.color.setHex(0xff2200);
    z.userData.health = 100; z.userData.maxHealth = 100;
    z.userData.speed = 1.5 + Math.random() * 2.5;
    z.userData.attackRange = 1.6; z.userData.scoreValue = 10; z.userData.killScore = 50;
  }
  z.userData.type = type; z.userData.alive = true;
  z.userData.walkTime = Math.random() * PI2; z.userData.attackCooldown = 0;
  z.userData.attackTimer = 0;

  // Health bar
  const barGroup = new THREE.Group();
  const barBg = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  barGroup.add(barBg);
  const barFg = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.05, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  barFg.position.z = 0.03;
  barGroup.add(barFg);
  z.userData.barGroup = barGroup;
  z.userData.barFg = barFg;
  scene.add(barGroup);

  scene.add(z);
  state.targets.push(z);
}

function deactivateZombie(z) {
  z.visible = false; z.userData.alive = false;
  if (z.userData.barGroup) scene.remove(z.userData.barGroup);
  scene.remove(z);
  const idx = state.targets.indexOf(z);
  if (idx !== -1) state.targets.splice(idx, 1);
  if (z.userData.type === 'boss') {
    state.boss.active = false;
    state.boss.obj = null;
  }
}

export function createZombie(type, waveZombie) {
  for (const z of zombiePool) {
    if (!z.userData.alive) { activateZombie(z, type); z.userData.waveZombie = !!waveZombie; return z; }
  }
  const z = buildZombieGeometry();
  zombiePool.push(z);
  activateZombie(z, type);
  z.userData.waveZombie = !!waveZombie;
  return z;
}

export function spawnBoss(tier) {
  if (state.boss.active) return;
  const group = buildBossGeometry();
  const s = 2.0 + tier * 0.5;
  group.scale.set(s, s, s);

  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.visible = true;

  const hp = 400 + tier * 300;
  const speed = 0.8 + tier * 0.2;
  const dmg = 10 + tier * 5;

  group.userData.type = 'boss';
  group.userData.alive = true;
  group.userData.tier = tier;
  group.userData.health = hp;
  group.userData.maxHealth = hp;
  group.userData.speed = Math.min(speed, 2.5);
  group.userData.damage = dmg;
  group.userData.attackRange = 3;
  group.userData.attackCooldown = 0;
  group.userData.attackTimer = 0;
  group.userData.walkTime = 0;
  group.userData.scoreValue = 50 + tier * 50;
  group.userData.killScore = 500 + tier * 200;
  group.userData.waveZombie = true;

  const barGroup = new THREE.Group();
  const barBg = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.08, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x333333 })
  );
  barGroup.add(barBg);
  const barFg = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.07, 0.05),
    new THREE.MeshBasicMaterial({ color: 0xff00ff })
  );
  barFg.position.z = 0.03;
  barGroup.add(barFg);
  group.userData.barGroup = barGroup;
  group.userData.barFg = barFg;
  scene.add(barGroup);

  const p = group.userData.parts;
  p.leftArm.rotation.x = 0; p.rightArm.rotation.x = 0;
  p.leftLeg.rotation.x = 0; p.rightLeg.rotation.x = 0;

  scene.add(group);
  state.targets.push(group);
  state.boss.active = true;
  state.boss.obj = group;
  state.boss.health = hp;
  state.boss.maxHealth = hp;
  state.boss.tier = tier;
  state.waveZombiesSpawned++;
  updateHUD();
  showMessage('⚠️ KING ZOMBIE APPEARS!');
  setTimeout(hideMessage, 3000);
}

function destroyBoss(zombie) {
  const pos = zombie.position.clone();
  const tier = zombie.userData.tier || 1;
  createBigExplosion(pos, tier);
  deactivateZombie(zombie);
  state.kills++;
  state.score += zombie.userData.killScore || 500;
  if (zombie.userData.waveZombie) state.waveZombiesKilled++;
  state.boss.active = false;
  state.boss.obj = null;
  state.shakeIntensity = Math.max(state.shakeIntensity, 0.3 + tier * 0.05);
  spawnDrop(pos);
  spawnDrop(pos);
  updateHUD();
  showMessage('💀 KING ZOMBIE DEFEATED!');
  setTimeout(hideMessage, 3000);
}

export function destroyZombie(zombie) {
  if (zombie.userData.type === 'boss') { destroyBoss(zombie); return; }
  const pos = zombie.position.clone();
  createExplosion(pos);
  deactivateZombie(zombie);
  state.kills++;
  state.score += zombie.userData.killScore || 50;
  if (zombie.userData.waveZombie) state.waveZombiesKilled++;
  updateHUD();
  if (Math.random() < 0.6) spawnDrop(pos);
}

function respawnZombie(zombie) {
  const angle = Math.random() * PI2;
  const dist = 20 + Math.random() * 30;
  zombie.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  zombie.userData.health = 100;
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

export function updateTargets(dt) {
  const playerPos = camera.position;
  for (let i = state.targets.length - 1; i >= 0; i--) {
    const t = state.targets[i];
    const data = t.userData;
    const toPlayer = new THREE.Vector3().copy(playerPos).sub(t.position);
    const distXZ = Math.sqrt((playerPos.x - t.position.x) ** 2 + (playerPos.z - t.position.z) ** 2);
    const dist = toPlayer.length();
    toPlayer.y = 0; toPlayer.normalize();

    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z) + PI;
    let currentAngle = t.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff > PI) diff -= PI2;
    while (diff < -PI) diff += PI2;
    t.rotation.y += diff * dt * 5;
    data.attackCooldown -= dt;
    if (distXZ < 20) playZombieGrowl();

    if (data.type === 'boss') {
      // --- BOSS AI: ground pound attack ---
      if (distXZ < data.attackRange) {
        if (data.attackTimer <= 0 && data.attackCooldown <= 0) {
          data.attackTimer = 1.0;
          data.attackCooldown = 2.0;
        }
        if (data.attackTimer > 0) {
          data.attackTimer -= dt;
          const phase = 1 - data.attackTimer / 1.0;
          const windUpEnd = 0.35;
          const slamEnd = 0.65;
          if (phase < windUpEnd) {
            const p = phase / windUpEnd;
            data.parts.leftArm.rotation.x = -p * 1.3;
            data.parts.rightArm.rotation.x = -p * 1.3;
            t.rotation.x = p * 0.3;
          } else if (phase < slamEnd) {
            const p = (phase - windUpEnd) / (slamEnd - windUpEnd);
            data.parts.leftArm.rotation.x = (1 - p) * -1.3;
            data.parts.rightArm.rotation.x = (1 - p) * -1.3;
            t.rotation.x = (1 - p) * 0.3;
            if (p > 0.3 && distXZ < 5) {
              state.shakeIntensity = Math.max(state.shakeIntensity, 0.08 + (data.tier || 1) * 0.02);
            }
          } else {
            const p = (phase - slamEnd) / (1 - slamEnd);
            data.parts.leftArm.rotation.x = p * -0.2;
            data.parts.rightArm.rotation.x = p * -0.2;
            t.rotation.x *= 0.95;
          }
        } else {
          data.parts.leftArm.rotation.x *= 0.9;
          data.parts.rightArm.rotation.x *= 0.9;
          t.rotation.x *= 0.9;
        }
      } else {
        const speed = data.speed;
        if (distXZ > 10) {
          const gates = [{x:0,z:28}, {x:0,z:-28}, {x:28,z:0}, {x:-28,z:0}, {x:0,z:7}];
          let bestGate = {x:0,z:28}; let bestDist = Infinity;
          for (const g of gates) {
            const d = Math.sqrt((g.x - t.position.x) ** 2 + (g.z - t.position.z) ** 2);
            if (d < bestDist) { bestDist = d; bestGate = g; }
          }
          const toGate = new THREE.Vector3(bestGate.x - t.position.x, 0, bestGate.z - t.position.z).normalize();
          const gatePull = Math.min(0.7, bestDist / 40);
          toPlayer.x = toPlayer.x * (1 - gatePull) + toGate.x * gatePull;
          toPlayer.z = toPlayer.z * (1 - gatePull) + toGate.z * gatePull;
          toPlayer.normalize();
        }
        t.position.x += toPlayer.x * speed * dt;
        t.position.z += toPlayer.z * speed * dt;
        data.walkTime += speed * dt * 2;
        const swing = Math.sin(data.walkTime) * 0.3;
        data.parts.leftLeg.rotation.x = -swing; data.parts.rightLeg.rotation.x = swing;
        data.parts.leftArm.rotation.x = -0.2 + Math.sin(data.walkTime + PI) * 0.15;
        data.parts.rightArm.rotation.x = -0.2 - Math.sin(data.walkTime + PI) * 0.15;
        t.position.y = Math.abs(Math.sin(data.walkTime * 2)) * 0.08;
      }
    } else {
      // --- REGULAR ZOMBIE AI ---
      if (distXZ < data.attackRange) {
        if (data.attackTimer <= 0 && data.attackCooldown <= 0) {
          data.attackTimer = 0.6;
          data.attackCooldown = 1.0;
          data.lungeOrigX = t.position.x;
          data.lungeOrigZ = t.position.z;
        }

        if (data.attackTimer > 0) {
          data.attackTimer -= dt;
          const phase = 1 - data.attackTimer / 0.6;
          const windUpEnd = 0.35;
          const lungeEnd = 0.6;
          if (phase < windUpEnd) {
            const p = phase / windUpEnd;
            t.rotation.x = p * 0.4;
            data.parts.leftArm.rotation.x = -p * 0.6;
            data.parts.rightArm.rotation.x = -p * 0.6;
            data.parts.leftLeg.rotation.x *= 0.95;
            data.parts.rightLeg.rotation.x *= 0.95;
            t.position.y = 0;
          } else if (phase < lungeEnd) {
            const p = (phase - windUpEnd) / (lungeEnd - windUpEnd);
            t.rotation.x = (1 - p) * 0.4;
            const lungeStep = p * 0.8;
            t.position.x = data.lungeOrigX + toPlayer.x * lungeStep;
            t.position.z = data.lungeOrigZ + toPlayer.z * lungeStep;
            data.parts.leftArm.rotation.x = p * 1.0;
            data.parts.rightArm.rotation.x = p * 1.0;
            t.position.y = p * 0.3;
          } else {
            const p = (phase - lungeEnd) / (1 - lungeEnd);
            t.rotation.x = (1 - p) * -0.1;
            data.parts.leftArm.rotation.x = (1 - p) * 1.0;
            data.parts.rightArm.rotation.x = (1 - p) * 1.0;
            t.position.y = (1 - p) * 0.3;
          }
        } else {
          t.rotation.x *= 0.9;
          data.parts.leftArm.rotation.x *= 0.9;
          data.parts.rightArm.rotation.x *= 0.9;
          t.position.y *= 0.9;
        }
      } else {
        const speed = distXZ < 10 ? data.speed : data.speed * 0.6;

        if (distXZ > 10) {
          const gates = [{x:0,z:28}, {x:0,z:-28}, {x:28,z:0}, {x:-28,z:0}, {x:0,z:7}];
          let bestGate = {x:0,z:28}; let bestDist = Infinity;
          for (const g of gates) {
            const d = Math.sqrt((g.x - t.position.x) ** 2 + (g.z - t.position.z) ** 2);
            if (d < bestDist) { bestDist = d; bestGate = g; }
          }
          const toGate = new THREE.Vector3(bestGate.x - t.position.x, 0, bestGate.z - t.position.z).normalize();
          const gatePull = Math.min(0.7, bestDist / 40);
          toPlayer.x = toPlayer.x * (1 - gatePull) + toGate.x * gatePull;
          toPlayer.z = toPlayer.z * (1 - gatePull) + toGate.z * gatePull;
          toPlayer.normalize();
        }

        t.position.x += toPlayer.x * speed * dt;
        t.position.z += toPlayer.z * speed * dt;
        data.walkTime += speed * dt * 3;
        const swing = Math.sin(data.walkTime) * 0.5;
        const armSwing = Math.sin(data.walkTime + PI) * 0.4;
        data.parts.leftLeg.rotation.x = -swing; data.parts.rightLeg.rotation.x = swing;
        data.parts.leftArm.rotation.x = armSwing; data.parts.rightArm.rotation.x = -armSwing;
        if (distXZ < 5) { data.parts.leftArm.rotation.x += -0.3; data.parts.rightArm.rotation.x += -0.3; }
        t.position.y = Math.abs(Math.sin(data.walkTime * 2)) * 0.05;
        t.rotation.x *= 0.9;
      }
    }

    // Health bar
    const barGroup = data.barGroup;
    if (barGroup) {
      const healthPct = data.health / data.maxHealth;
      const barFg = data.barFg;
      barFg.scale.x = Math.max(0, healthPct);
      barFg.position.x = -(1 - healthPct) * 0.24;
      if (data.type === 'boss') {
        barFg.material.color.setHex(0xff00ff);
      } else {
        if (healthPct > 0.6) barFg.material.color.setHex(0x00ff00);
        else if (healthPct > 0.3) barFg.material.color.setHex(0xffff00);
        else barFg.material.color.setHex(0xff0000);
      }

      barGroup.position.copy(t.position);
      const barY = data.type === 'boss' ? 2.5 * (t.scale.x || 1) : 2.2 * (t.scale.x || 1);
      barGroup.position.y += barY;
      const lookTarget = new THREE.Vector3(camera.position.x, barGroup.position.y, camera.position.z);
      barGroup.lookAt(lookTarget);
    }

    if (data.type !== 'boss' && dist > 80) respawnZombie(t);
  }
}

export function hitTarget(mesh, point) {
  const zombie = getZombieGroup(mesh);
  if (!zombie || !zombie.userData) return;
  const data = zombie.userData;
  data.health -= state.weapon.damage;

  if (data.parts.head) {
    const orig = data.parts.head.material.color.getHex();
    data.parts.head.material.color.setHex(0xffffff);
    setTimeout(() => data.parts.head.material.color.setHex(orig), 60);
  }

  state.score += data.scoreValue || 10;
  updateHUD();
  playHitSound();
  showHitmarker();
  if (data.health <= 0) destroyZombie(zombie);
}

// --- Drops ---
function spawnDrop(pos) {
  const isHealth = Math.random() < 0.5;
  const group = new THREE.Group();
  group.position.copy(pos); group.position.y = 0;

  if (isHealth) {
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0x660000, emissiveIntensity: 0.3 });
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), redMat);
    vBar.position.y = 0.15; group.add(vBar);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), redMat);
    hBar.position.y = 0.15; group.add(hBar);
    group.userData.type = 'health'; group.userData.value = 30;
  } else {
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.7 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), boxMat);
    box.position.y = 0.075; box.castShadow = true; group.add(box);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x442200 }));
    stripe.position.set(0, 0.1, 0.08); group.add(stripe);
    group.userData.type = 'ammo'; group.userData.value = 15;
  }
  group.userData.spawnTime = performance.now();
  group.userData.floatOffset = Math.random() * PI2;
  scene.add(group);
  state.drops.push(group);
}

export function updateDrops(dt) {
  const playerPos = camera.position;
  for (let i = state.drops.length - 1; i >= 0; i--) {
    const d = state.drops[i];
    const age = (performance.now() - d.userData.spawnTime) / 1000;
    if (age > 20) { scene.remove(d); state.drops.splice(i, 1); continue; }

    d.position.y = Math.sin(age * 2 + d.userData.floatOffset) * 0.1 + 0.2;
    d.rotation.y += dt * 1.5;

    if (age > 17) {
      const fade = 1 - (age - 17) / 3;
      d.children.forEach(child => { if (child.material) { child.material.transparent = true; child.material.opacity = fade; } });
    }

    const dx = playerPos.x - d.position.x;
    const dz = playerPos.z - d.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.2) {
      if (d.userData.type === 'health') state.player.health = Math.min(state.player.maxHealth, state.player.health + d.userData.value);
      else if (d.userData.type === 'ammo') state.weapon.reserve += d.userData.value;
      updateHUD();
      showDamageOverlay(d.userData.type === 'health' ? 'rgba(0,255,0,0.3)' : 'rgba(255,170,0,0.3)');
      playPickup(d.userData.type);
      scene.remove(d); state.drops.splice(i, 1);
    }
  }
}

// --- Particles ---
function createExplosion(pos) {
  const colors = [0x44aa00, 0x66cc00, 0x88ff00, 0x226600];
  for (let i = 0; i < 20; i++) {
    const size = 0.1 + Math.random() * 0.3;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], transparent: true, opacity: 1 })
    );
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 0.5;
    mesh.position.z += (Math.random() - 0.5) * 0.5;
    const vel = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8);
    mesh.userData.vel = vel;
    mesh.userData.life = 0.6 + Math.random() * 0.4;
    scene.add(mesh);
    state.particles.push(mesh);
  }
}

function createBigExplosion(pos, tier) {
  const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff0000, 0xcc00ff];
  for (let i = 0; i < 50 + tier * 10; i++) {
    const size = 0.15 + Math.random() * 0.5;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)], transparent: true, opacity: 1 })
    );
    mesh.position.copy(pos);
    mesh.position.x += (Math.random() - 0.5) * 1.5;
    mesh.position.z += (Math.random() - 0.5) * 1.5;
    const vel = new THREE.Vector3((Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 12);
    mesh.userData.vel = vel;
    mesh.userData.life = 0.8 + Math.random() * 0.6;
    scene.add(mesh);
    state.particles.push(mesh);
  }
}

export function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.userData.life -= dt;
    if (p.userData.life <= 0) { scene.remove(p); state.particles.splice(i, 1); continue; }
    const vel = p.userData.vel;
    vel.y -= 9.8 * dt;
    p.position.add(vel.clone().multiplyScalar(dt));
    p.material.opacity = p.userData.life;
    p.scale.setScalar(p.userData.life);
  }
}

// --- Damage by enemies ---
export function enemyDamagePlayer(dt) {
  state.damageTimer -= dt;
  if (state.damageTimer > 0) return;
  state.damageTimer = 1;

  const playerPos = camera.position;
  for (const t of state.targets) {
    const dx = playerPos.x - t.position.x;
    const dz = playerPos.z - t.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < t.userData.attackRange + 0.3) {
      state.player.health -= t.userData.damage || 10;
      updateHUD();
      showDamageOverlay('rgba(255,0,0,0.5)');
      setTimeout(() => showDamageOverlay(''), 150);
      playZombieAttack();
      playPlayerHurt();
      state.shakeIntensity = Math.max(state.shakeIntensity, 0.06);
      if (state.player.health <= 0) { gameOver(); return; }
    }
  }
}

export function clearAllZombies() {
  while (state.targets.length) deactivateZombie(state.targets[0]);
}

initZombiePool();
