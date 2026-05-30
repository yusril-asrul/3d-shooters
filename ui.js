import { state } from './state.js';

export function initUI() {
  const overlay = document.getElementById('damageOverlay');
  if (!overlay) {
    const div = document.createElement('div');
    div.id = 'damageOverlay';
    div.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;opacity:0;transition:opacity 0.1s;';
    document.body.appendChild(div);
  }

  if (!document.getElementById('hitmarker')) {
    const hm = document.createElement('div');
    hm.id = 'hitmarker';
    hm.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      z-index:20;pointer-events:none;color:white;font-size:20px;
      font-weight:bold;font-family:monospace;opacity:0;
      transition:opacity 0.05s;
    `;
    hm.textContent = '✕';
    document.body.appendChild(hm);
  }

  if (!document.getElementById('message')) {
    const msg = document.createElement('div');
    msg.id = 'message';
    msg.style.cssText = `
      position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);
      z-index:30;color:white;font-size:24px;font-family:monospace;
      text-shadow:0 0 10px rgba(0,0,0,0.8);pointer-events:none;display:none;
    `;
    document.body.appendChild(msg);
  }

  if (!document.getElementById('gameOver')) {
    const go = document.createElement('div');
    go.id = 'gameOver';
    go.style.cssText = `
      position:fixed;inset:0;z-index:100;display:none;
      align-items:center;justify-content:center;
      background:rgba(0,0,0,0.6);flex-direction:column;
      cursor:default;
    `;
    const title = document.createElement('div');
    title.style.cssText = 'color:#ff4444;font-size:64px;font-weight:bold;font-family:monospace;margin-bottom:20px;text-shadow:0 0 20px rgba(255,0,0,0.5);';
    title.textContent = 'GAME OVER';
    const stats = document.createElement('div');
    stats.style.cssText = 'color:white;font-size:20px;font-family:monospace;margin-bottom:30px;line-height:1.8;text-align:center;';
    stats.id = 'stats';
    const btn = document.createElement('button');
    btn.id = 'restartBtn';
    btn.style.cssText = `
      font-size:24px;padding:12px 40px;
      background:#444;color:white;border:2px solid white;
      font-family:monospace;cursor:pointer;border-radius:8px;
    `;
    btn.textContent = 'Main Lagi';
    btn.onclick = () => import('./game.js').then(m => m.restart());
    go.appendChild(title);
    go.appendChild(stats);
    go.appendChild(btn);
    document.body.appendChild(go);
  }

  if (!document.getElementById('hudInfo')) {
    const info = document.createElement('div');
    info.id = 'hudInfo';
    info.style.cssText = `
      position:fixed;top:10px;left:10px;z-index:15;
      color:white;font-family:monospace;font-size:14px;
      background:rgba(0,0,0,0.5);padding:8px 14px;border-radius:6px;
      pointer-events:none;text-align:left;line-height:1.7;
    `;
    document.body.appendChild(info);
  }

  if (!document.getElementById('ammoDisplay')) {
    const ammo = document.createElement('div');
    ammo.id = 'ammoDisplay';
    ammo.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:15;
      color:white;font-family:monospace;font-size:22px;
      background:rgba(0,0,0,0.5);padding:8px 18px;border-radius:6px;
      pointer-events:none;text-align:right;line-height:1.4;
    `;
    document.body.appendChild(ammo);
  }

  if (!document.getElementById('minimap')) {
    const mm = document.createElement('canvas');
    mm.id = 'minimap';
    mm.width = 150; mm.height = 150;
    mm.style.cssText = `
      position:fixed;bottom:10px;left:10px;z-index:15;
      border-radius:50%;border:2px solid rgba(255,255,255,0.3);
      background:rgba(0,0,0,0.3);
    `;
    document.body.appendChild(mm);
  }

  updateHUD();
}

export function updateHUD() {
  const info = document.getElementById('hudInfo');
  const ammo = document.getElementById('ammoDisplay');
  if (!info || !ammo) return;

  let waveInfo = `🌊 Wave ${state.wave}`;
  if (state.boss.active) {
    waveInfo += ` 👑 BOSS`;
  } else if (state.waveActive) {
    waveInfo += ` (${state.waveZombiesKilled}/${state.waveZombieCount})`;
  } else if (state.intermission > 0) {
    waveInfo += ` Complete! Next in ${Math.ceil(state.intermission)}s`;
  }

  const healthColor = state.player.health > 50 ? '#ffffff' : state.player.health > 25 ? '#ffcc00' : '#ff4444';
  info.innerHTML = `
    <span style="color:${healthColor}">❤️ ${state.player.health.toFixed(0)}</span><br>
    🎯 Score: ${state.score}<br>
    💀 Kills: ${state.kills}<br>
    ${waveInfo}
  `;

  if (state.currentWeapon === 'knife') {
    ammo.innerHTML = `🔪 Knife`;
  } else {
    const w = state.weapon;
    const ammoColor = w.ammo === 0 ? '#ff4444' : '#ffffff';
    ammo.innerHTML = `<span style="color:${ammoColor}">🔫 ${w.ammo}</span> / ${w.reserve}`;
  }
}

export function showMessage(text) {
  const m = document.getElementById('message');
  if (!m) return;
  m.textContent = text; m.style.display = 'block';
}
export function hideMessage() {
  const m = document.getElementById('message');
  if (m) m.style.display = 'none';
}

export function showDamageOverlay(color) {
  const d = document.getElementById('damageOverlay');
  if (!d) return;
  if (!color || color === '') {
    d.style.opacity = '0';
    setTimeout(() => { d.style.backgroundColor = 'transparent'; }, 100);
    return;
  }
  if (color === 'rgba(255,0,0,0.5)' || color === 'rgba(0,255,0,0.3)' || color === 'rgba(255,170,0,0.3)') {
    d.style.backgroundColor = color;
    d.style.opacity = '1';
    d.style.transition = 'opacity 0.1s';
    setTimeout(() => { d.style.opacity = '0'; }, 50);
  } else {
    d.style.backgroundColor = color;
    d.style.opacity = '1';
  }
}

let hitmarkerTimeout = null;
export function showHitmarker() {
  const hm = document.getElementById('hitmarker');
  if (!hm) return;
  hm.style.opacity = '1';
  if (hitmarkerTimeout) clearTimeout(hitmarkerTimeout);
  hitmarkerTimeout = setTimeout(() => { hm.style.opacity = '0'; }, 100);
}

export function showGameOver() {
  const go = document.getElementById('gameOver');
  if (!go) return;
  go.style.display = 'flex';
  const stats = document.getElementById('stats');
  if (stats) stats.innerHTML = `Score: ${state.score}<br>Kills: ${state.kills}`;
}

let deathTimer = 0;
let deathActive = false;
export function gameOver() {
  if (deathActive) return;
  deathActive = true;
  state.isLocked = false;
  deathTimer = 0;
  document.exitPointerLock();
  document.getElementById('restartBtn').style.display = 'none';
}
export function isDeathActive() { return deathActive; }
export function setDeathActive(v) { deathActive = v; }

export function updateDeathAnimation(dt) {
  if (!deathActive) return;
  deathTimer += dt;
  const t = Math.min(deathTimer / 0.6, 1);
  const ease = t * t * (3 - 2 * t);
  state.cameraHeight = 0.3 + (1 - ease) * (state.cameraHeightDefault - 0.3);
  state.cameraTilt = -30 * ease;
  state.cameraRoll = -45 * ease;
  if (t >= 1) {
    deathActive = false;
    showGameOver();
  }
}

const MINIMAP_SIZE = 150;
const MINIMAP_SCALE = 1.0;

export function updateMinimap() {
  const canvas = document.getElementById('minimap');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = MINIMAP_SIZE / 2, cy = MINIMAP_SIZE / 2;

  ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, MINIMAP_SIZE / 2, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = 'rgba(0,100,0,0.5)';
  ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  if (state.buildings) {
    for (const b of state.buildings) {
      const bx = cx + (b.position.x - state.player.x) / MINIMAP_SCALE;
      const bz = cy + (b.position.z - state.player.z) / MINIMAP_SCALE;
      const bs = (b.geometry.parameters.width || 1.5) / MINIMAP_SCALE;
      const bd = (b.geometry.parameters.depth || 1.5) / MINIMAP_SCALE;
      ctx.fillStyle = 'rgba(100,100,100,0.7)';
      ctx.fillRect(bx - bs / 2, bz - bd / 2, bs, bd);
    }
  }

  const yaw = state.yaw;
  for (const t of state.targets) {
    if (!t.visible) continue;
    const dx = t.position.x - state.player.x;
    const dz = t.position.z - state.player.z;
    const screenX = cx + dx / MINIMAP_SCALE;
    const screenZ = cy + dz / MINIMAP_SCALE;
    if (t.userData.type === 'boss') {
      ctx.fillStyle = '#cc00ff';
      ctx.beginPath();
      ctx.moveTo(screenX, screenZ - 5);
      ctx.lineTo(screenX + 3, screenZ);
      ctx.lineTo(screenX, screenZ + 5);
      ctx.lineTo(screenX - 3, screenZ);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = t.userData.type === 'tank' ? '#ff8800' : '#ff0000';
      ctx.beginPath();
      ctx.arc(screenX, screenZ, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (state.drops) {
    for (const d of state.drops) {
      const dx = d.position.x - state.player.x;
      const dz = d.position.z - state.player.z;
      const sx = cx + dx / MINIMAP_SCALE;
      const sz = cy + dz / MINIMAP_SCALE;
      ctx.fillStyle = d.userData.type === 'health' ? '#00ff00' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(sx, sz, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-yaw);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(-3, 3);
  ctx.lineTo(3, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, MINIMAP_SIZE / 2 - 1, 0, Math.PI * 2);
  ctx.stroke();
}

export function updateUI(dt) {
  updateDeathAnimation(dt);
  updateMinimap();
}
