import { HAIR_META, OUTFIT_META, STAGES } from './constants';
import type {
  CharacterStyle,
  Collectible,
  FloatingText,
  Obstacle,
  OutfitId,
  Particle,
  StageConfig,
  UnifiedActionKind,
} from './types';

export interface RenderPlayerState {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  sliding: boolean;
  twirling: boolean;
  twirlTimer: number;
  glamFeverTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;
  stumbling?: boolean;
  stumbleProgress?: number;
  slideBlend?: number;
  airBlend?: number;
  rollProgress?: number;
  squashX: number;
  squashY: number;
  runCycle: number;
  style: CharacterStyle;
  activeOutfit: OutfitId;
  accessoryId?: string | null;
  bagId?: string | null;
  shoesId?: string | null;
  studioPose?: 'strut' | 'leap' | 'pose';
}

export interface RenderWorldState {
  width: number;
  height: number;
  groundY: number;
  scrollDistance: number;
  time: number;
  stageIndex: number;
  shakeX: number;
  shakeY: number;
  elimZoom?: number;
  player: RenderPlayerState;
  obstacles: Obstacle[];
  collectibles: Collectible[];
  particles: Particle[];
  floatingTexts: FloatingText[];
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function solveTwoBoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  len1: number,
  len2: number,
  bendSign: 1 | -1
): { jointX: number; jointY: number; endX: number; endY: number } {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const maxReach = Math.max(2, len1 + len2 - 0.5);
  const minReach = Math.abs(len1 - len2) + 0.5;
  const distRaw = Math.hypot(dx, dy);
  const dist = Math.min(maxReach, Math.max(minReach, distRaw));
  const baseAngle = Math.atan2(dy, dx);
  const cosAngle = Math.max(
    -1,
    Math.min(1, (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist))
  );
  const jointAngle = baseAngle + bendSign * Math.acos(cosAngle);
  const jointX = rootX + Math.cos(jointAngle) * len1;
  const jointY = rootY + Math.sin(jointAngle) * len1;
  const endX = rootX + (dx / Math.max(0.001, distRaw)) * dist;
  const endY = rootY + (dy / Math.max(0.001, distRaw)) * dist;
  return { jointX, jointY, endX, endY };
}

function drawCapsuleLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  colorTop: string,
  colorShadow: string
): void {
  const grad = ctx.createLinearGradient(x1 - thickness, y1, x2 + thickness, y2);
  grad.addColorStop(0, colorTop);
  grad.addColorStop(1, colorShadow);
  ctx.strokeStyle = grad;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
): void {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(cx, cy + topCurveHeight);
  ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
  ctx.bezierCurveTo(
    cx - size / 2,
    cy + (size + topCurveHeight) / 2,
    cx,
    cy + (size + topCurveHeight) / 1.4,
    cx,
    cy + size
  );
  ctx.bezierCurveTo(
    cx,
    cy + (size + topCurveHeight) / 1.4,
    cx + size / 2,
    cy + (size + topCurveHeight) / 2,
    cx + size / 2,
    cy + topCurveHeight
  );
  ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
  ctx.closePath();
}

function renderBackground(
  ctx: CanvasRenderingContext2D,
  world: RenderWorldState,
  stage: StageConfig
): void {
  const { width, height, groundY, scrollDistance, time } = world;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0, stage.skyTop);
  skyGrad.addColorStop(0.58, stage.skyMid);
  skyGrad.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, groundY);

  // Sun / Evening Moon
  const sunX = width * 0.76;
  const sunY = stage.isEvening ? height * 0.2 : height * 0.24;
  const sunR = stage.isEvening ? 42 : 66;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 2.4);
  sunGlow.addColorStop(0, stage.sunColor);
  sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stage.sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  if (stage.isEvening) {
    ctx.fillStyle = 'rgba(204, 251, 241, 0.85)';
    for (let i = 0; i < 28; i++) {
      const sx = (i * 173) % width;
      const sy = (i * 97) % (groundY * 0.52);
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 2.2 + i));
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 3 === 0 ? 2.2 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let b = 0; b < 3; b++) {
      const originX = width * (0.2 + b * 0.3);
      const angle = -Math.PI / 2 + Math.sin(time * 0.7 + b * 1.9) * 0.32;
      ctx.save();
      ctx.translate(originX, groundY);
      ctx.rotate(angle);
      const beamGrad = ctx.createLinearGradient(0, 0, height * 0.85, 0);
      beamGrad.addColorStop(0, 'rgba(45, 212, 191, 0.18)');
      beamGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(height * 0.9, -95);
      ctx.lineTo(height * 0.9, 95);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    for (let c = 0; c < 4; c++) {
      const cx = ((c * 380 - scrollDistance * 0.04) % (width + 260)) + (width + 260);
      const drawX = (cx % (width + 260)) - 130;
      const cy = 62 + (c % 2) * 44;
      ctx.beginPath();
      ctx.ellipse(drawX, cy, 62, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(drawX - 28, cy + 5, 36, 15, 0, 0, Math.PI * 2);
      ctx.ellipse(drawX + 30, cy + 4, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Far coastal hills (0.12x parallax)
  const hillBaseY = groundY - 68;
  ctx.fillStyle = stage.isEvening ? '#0B3340' : '#7DD3C8';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width + 40; x += 40) {
    const worldX = x + scrollDistance * 0.12;
    const h = Math.sin(worldX * 0.004) * 26 + Math.cos(worldX * 0.009) * 14;
    ctx.lineTo(x, hillBaseY - h);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  // Sparkling Ocean Strip
  if (!stage.isEvening) {
    const oceanY = groundY - 46;
    const oceanGrad = ctx.createLinearGradient(0, oceanY, 0, groundY);
    oceanGrad.addColorStop(0, stage.oceanColor);
    oceanGrad.addColorStop(1, '#0F766E');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, oceanY, width, 46);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)';
    ctx.lineWidth = 2;
    for (let w = 0; w < 8; w++) {
      const wx =
        (((w * 220 - scrollDistance * 0.25) % (width + 220) + (width + 220)) % (width + 220)) - 110;
      const wy = oceanY + 12 + (w % 3) * 10;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 24, wy - 4, wx + 48, wy);
      ctx.stroke();
    }
  }

  // Midground Biome Scenery (0.38x parallax)
  const spacing = 310;
  const startIdx = Math.floor((scrollDistance * 0.38) / spacing) - 1;
  const endIdx = startIdx + Math.ceil(width / spacing) + 3;
  for (let i = startIdx; i < endIdx; i++) {
    const px = i * spacing - scrollDistance * 0.38;
    if (stage.biome === 'ocean_road') {
      drawPalmTree(ctx, px + 60, groundY - 22, 0.9 + (Math.abs(i) % 3) * 0.12);
      if (i % 2 === 0) {
        drawBeachCabana(ctx, px + 185, groundY - 22);
      }
    } else if (stage.biome === 'colorful_city') {
      drawDreamhouseVilla(ctx, px + 35, groundY - 12, i);
      drawColorfulCityShop(ctx, px + 205, groundY - 12, i);
    } else if (stage.biome === 'magical_forest') {
      drawForestTree(ctx, px + 65, groundY - 12, 0.95 + (Math.abs(i) % 2) * 0.14);
      drawForestTree(ctx, px + 215, groundY - 16, 0.78);
    } else if (stage.biome === 'fantasy_island') {
      drawPalmTree(ctx, px + 70, groundY - 16, 0.92);
      drawLagoonPavilion(ctx, px + 170, groundY - 16, i);
    } else if (stage.biome === 'mountain_trail') {
      drawMountainPeak(ctx, px + 80, groundY - 14, i);
      drawForestTree(ctx, px + 235, groundY - 14, 0.85);
    } else {
      drawGalaArch(ctx, px + 90, groundY - 8, i);
    }
  }

  // Runway / Boardwalk Ground
  ctx.fillStyle = stage.groundBody;
  ctx.fillRect(0, groundY, width, height - groundY);

  ctx.fillStyle = stage.groundTop;
  ctx.fillRect(0, groundY, width, 24);

  const plankStep = 72;
  const offset = -(scrollDistance % plankStep);
  ctx.strokeStyle = stage.isEvening ? 'rgba(255, 215, 100, 0.28)' : 'rgba(255, 255, 255, 0.48)';
  ctx.lineWidth = 2;
  for (let x = offset; x < width + plankStep; x += plankStep) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 2);
    ctx.lineTo(x - 18, groundY + 24);
    ctx.stroke();
  }

  ctx.fillStyle = stage.groundTrim;
  ctx.fillRect(0, groundY, width, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0, groundY + 5, width, 2);

  // Subtle Fever speed lines across ground
  if (world.player.glamFeverTimer > 0) {
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 2;
    for (let s = 0; s < 5; s++) {
      const lx = ((s * 290 - scrollDistance * 1.4) % width + width) % width;
      const ly = groundY + 34 + (s % 3) * 18;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 72, ly);
      ctx.stroke();
    }
  }
}

function drawPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);

  ctx.strokeStyle = '#8C583A';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(16, -65, 6, -132);
  ctx.stroke();

  const topX = 6;
  const topY = -132;
  const angles = [-2.5, -1.8, -0.9, -0.2, 0.5, 1.1];
  ctx.fillStyle = '#0D9488';
  angles.forEach((a) => {
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(26, -14, 52, 6);
    ctx.quadraticCurveTo(24, 6, 0, 0);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

function drawBeachCabana(ctx: CanvasRenderingContext2D, x: number, baseY: number): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, -68, 76, 68);
  ctx.fillStyle = '#0D9488';
  for (let s = 0; s < 4; s++) {
    ctx.fillRect(s * 20, -68, 10, 68);
  }
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(-8, -68);
  ctx.lineTo(38, -94);
  ctx.lineTo(84, -68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDreamhouseVilla(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  index: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  const tint = index % 2 === 0 ? '#E0F2FE' : '#CCFBF1';
  ctx.fillStyle = tint;
  drawRoundedRect(ctx, 0, -118, 150, 118, 6);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-10, -126, 170, 12);
  ctx.fillStyle = '#7DD3FC';
  drawRoundedRect(ctx, 16, -96, 76, 48, 4);
  ctx.fill();
  ctx.fillStyle = '#0F766E';
  drawRoundedRect(ctx, 106, -68, 28, 68, 4);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, -52, 84, 24);
  ctx.restore();
}

function drawGalaArch(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  index: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.strokeStyle = index % 2 === 0 ? '#FCD34D' : '#2DD4BF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(65, 0, 68, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#FCD34D';
  drawStar(ctx, 65, -72, 5, 10, 4.5);
  ctx.fill();
  ctx.restore();
}

function drawColorfulCityShop(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  index: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  const colors = ['#FDE68A', '#BAE6FD', '#FBCFE8'];
  ctx.fillStyle = colors[Math.abs(index) % colors.length];
  drawRoundedRect(ctx, 0, -96, 86, 96, 6);
  ctx.fill();
  ctx.fillStyle = '#0284C7';
  drawRoundedRect(ctx, -4, -104, 94, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, 14, -76, 58, 36, 4);
  ctx.fill();
  ctx.fillStyle = '#F43F5E';
  ctx.fillRect(8, -32, 70, 8);
  ctx.restore();
}

function drawForestTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-7, -75, 14, 75);
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(0, -98, 42, 0, Math.PI * 2);
  ctx.arc(-26, -78, 28, 0, Math.PI * 2);
  ctx.arc(26, -78, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6EE7B7';
  ctx.beginPath();
  ctx.arc(-10, -108, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLagoonPavilion(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  index: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(10, -64, 8, 64);
  ctx.fillRect(72, -64, 8, 64);
  ctx.fillStyle = index % 2 === 0 ? '#0D9488' : '#7C3AED';
  ctx.beginPath();
  ctx.moveTo(-4, -64);
  ctx.lineTo(45, -102);
  ctx.lineTo(94, -64);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMountainPeak(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  index: number
): void {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = index % 2 === 0 ? '#64748B' : '#475569';
  ctx.beginPath();
  ctx.moveTo(-68, 0);
  ctx.lineTo(0, -135);
  ctx.lineTo(68, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(-22, -92);
  ctx.lineTo(0, -135);
  ctx.lineTo(22, -92);
  ctx.lineTo(7, -86);
  ctx.lineTo(-8, -94);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function getObstaclePromptKind(obs: Obstacle): UnifiedActionKind {
  if (obs.kind === 'boom_spotlight') return 'slide';
  if (obs.kind === 'paparazzi_drone') return obs.flashActiveTimer > 0 || obs.telegraphTimer < 0.45 ? 'roll' : 'slide';
  if (obs.kind === 'runway_cart' || obs.kind === 'hatbox_stack') return 'roll';
  return 'jump';
}

function renderObstacle(
  ctx: CanvasRenderingContext2D,
  obs: Obstacle,
  groundY: number,
  time: number,
  playerX: number
): void {
  if (obs.shattered) return;
  ctx.save();

  switch (obs.kind) {
    case 'velvet_rope': {
      const leftX = obs.x + 7;
      const rightX = obs.x + obs.width - 7;
      const topY = obs.y;
      const bottomY = groundY;

      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(leftX - 4, topY + 6, 8, bottomY - topY - 6);
      ctx.fillRect(rightX - 4, topY + 6, 8, bottomY - topY - 6);
      ctx.beginPath();
      ctx.arc(leftX, topY + 6, 7, 0, Math.PI * 2);
      ctx.arc(rightX, topY + 6, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(leftX - 10, bottomY - 6, 20, 6);
      ctx.fillRect(rightX - 10, bottomY - 6, 20, 6);

      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(leftX, topY + 14);
      ctx.quadraticCurveTo((leftX + rightX) / 2, topY + 34, rightX, topY + 14);
      ctx.stroke();
      break;
    }

    case 'hatbox_stack': {
      const bx = obs.x;
      const bottomY = groundY;
      ctx.fillStyle = '#0D9488';
      drawRoundedRect(ctx, bx, bottomY - 38, obs.width, 38, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bx + 10, bottomY - 38, 8, 38);
      ctx.fillRect(bx + obs.width - 18, bottomY - 38, 8, 38);

      ctx.fillStyle = '#0F766E';
      drawRoundedRect(ctx, bx - 3, bottomY - 44, obs.width + 6, 9, 4);
      ctx.fill();

      const topW = obs.width * 0.78;
      const topX = bx + (obs.width - topW) / 2;
      ctx.fillStyle = '#FDE68A';
      drawRoundedRect(ctx, topX, bottomY - 76, topW, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(topX + topW / 2 - 4, bottomY - 76, 8, 32);
      ctx.fillStyle = '#0369A1';
      drawRoundedRect(ctx, topX - 2, bottomY - 82, topW + 4, 8, 4);
      ctx.fill();
      break;
    }

    case 'boom_spotlight': {
      const cx = obs.x + obs.width / 2;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, obs.y + 8);
      ctx.stroke();

      const coneGrad = ctx.createLinearGradient(cx, obs.y + obs.height, cx, groundY);
      coneGrad.addColorStop(0, 'rgba(255, 224, 102, 0.34)');
      coneGrad.addColorStop(1, 'rgba(255, 224, 102, 0.04)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(obs.x + 8, obs.y + obs.height);
      ctx.lineTo(obs.x - 18, groundY);
      ctx.lineTo(obs.x + obs.width + 18, groundY);
      ctx.lineTo(obs.x + obs.width - 8, obs.y + obs.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0F2933';
      drawRoundedRect(ctx, obs.x, obs.y, obs.width, obs.height, 8);
      ctx.fill();
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#FDE047';
      drawRoundedRect(ctx, obs.x + 10, obs.y + obs.height - 10, obs.width - 20, 8, 3);
      ctx.fill();
      break;
    }

    case 'paparazzi_drone': {
      const cx = obs.x + obs.width / 2;
      const cy = obs.y + obs.height / 2;
      const rotorW = 16 + Math.sin(time * 28) * 6;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 22 - rotorW, cy - 16);
      ctx.lineTo(cx - 22 + rotorW, cy - 16);
      ctx.moveTo(cx + 22 - rotorW, cy - 16);
      ctx.lineTo(cx + 22 + rotorW, cy - 16);
      ctx.stroke();

      ctx.fillStyle = '#0F2933';
      drawRoundedRect(ctx, obs.x + 4, obs.y + 6, obs.width - 8, obs.height - 10, 10);
      ctx.fill();

      const windup = Math.max(0, Math.min(1, 1 - obs.telegraphTimer / 0.85));
      if (obs.telegraphTimer > 0 && obs.telegraphTimer < 0.85) {
        ctx.strokeStyle = windup > 0.65 ? '#EF4444' : '#F59E0B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy + 2, 16, -Math.PI / 2, -Math.PI / 2 + windup * Math.PI * 2);
        ctx.stroke();
      }

      if (obs.flashActiveTimer > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + 12);
        ctx.lineTo(cx - 32, cy + 72);
        ctx.lineTo(cx + 32, cy + 72);
        ctx.lineTo(cx + 8, cy + 12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = obs.flashActiveTimer > 0 ? '#FFFFFF' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'runway_cart': {
      const bx = obs.x;
      const by = obs.y;
      ctx.fillStyle = '#0284C7';
      drawRoundedRect(ctx, bx, by + 12, obs.width, obs.height - 20, 8);
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx + obs.width - 6, by + 14);
      ctx.lineTo(bx + obs.width + 6, by + 2);
      ctx.stroke();
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(bx + 8, by + 20, obs.width - 16, 6);
      ctx.fillStyle = '#0F2933';
      ctx.beginPath();
      ctx.arc(bx + 14, groundY - 6, 6, 0, Math.PI * 2);
      ctx.arc(bx + obs.width - 14, groundY - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  // Visual obstacle action cue badge when approaching player
  const distToPlayer = obs.x - playerX;
  if (distToPlayer > 12 && distToPlayer < 310) {
    const cue = getObstaclePromptKind(obs);
    const badgeColor = cue === 'slide' ? '#0284C7' : cue === 'roll' ? '#0891B2' : '#0F766E';
    const label = cue === 'slide' ? 'SLIDE' : cue === 'roll' ? 'ROLL' : 'JUMP';
    const badgeX = obs.x + obs.width / 2;
    const badgeY = Math.max(42, obs.y - 22);
    ctx.fillStyle = badgeColor;
    drawRoundedRect(ctx, badgeX - 25, badgeY - 11, 50, 22, 6);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 10.5px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, badgeX, badgeY + 0.5);
  }

  ctx.restore();
}

function renderCartTelegraphs(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  canvasWidth: number,
  time: number
): void {
  for (const obs of obstacles) {
    if (obs.kind === 'runway_cart' && obs.x > canvasWidth && obs.x < canvasWidth + 320) {
      const pulse = 0.65 + 0.35 * Math.sin(time * 16);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(canvasWidth - 34, obs.y + obs.height * 0.45, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 18px "Outfit", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', canvasWidth - 34, obs.y + obs.height * 0.46);
      ctx.restore();
    }
  }
}

function renderCollectible(
  ctx: CanvasRenderingContext2D,
  item: Collectible,
  time: number
): void {
  if (item.collected) return;
  ctx.save();
  ctx.translate(item.x, item.y);
  const scalePulse = 1 + Math.sin(time * 6 + item.phase) * 0.08;
  ctx.scale(scalePulse, scalePulse);

  if (item.kind === 'diamond') {
    ctx.fillStyle = '#06B6D4';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(13, -3);
    ctx.lineTo(0, 15);
    ctx.lineTo(-13, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#A5F3FC';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(6, -3);
    ctx.lineTo(0, 15);
    ctx.lineTo(-6, -3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (item.kind === 'crown') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-14, 10);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-6, 1);
    ctx.lineTo(0, -13);
    ctx.lineTo(6, 1);
    ctx.lineTo(16, -8);
    ctx.lineTo(14, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(0, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'heart') {
    ctx.fillStyle = '#FB7185';
    drawHeart(ctx, 0, -12, 24);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else if (item.kind === 'wardrobe_box') {
    ctx.fillStyle = '#0D9488';
    drawRoundedRect(ctx, -16, -15, 32, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(-3, -15, 6, 30);
    ctx.fillRect(-16, -3, 32, 6);
    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-6, -18, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(6, -18, 6, 4, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderHeroCharacter(
  ctx: CanvasRenderingContext2D,
  player: RenderPlayerState,
  time: number
): void {
  if (player.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0 && !player.twirling) {
    ctx.globalAlpha = 0.45;
  }

  const outfit = OUTFIT_META[player.activeOutfit];
  const hair = HAIR_META[player.style.hair];
  const isStumbling = Boolean(player.stumbling);
  const stumbleProg = player.stumbleProgress ?? 0;
  const studioPose = player.studioPose;
  const slideBlend = player.slideBlend ?? (player.sliding ? 1 : 0);
  const airBlend = player.airBlend ?? (player.grounded ? 0 : 1);
  const rollProgress = player.rollProgress ?? 0;

  // Ground contact shadow (scales subtly with jump height)
  ctx.save();
  const shadowCx = player.x + player.width / 2;
  const shadowY = player.y + player.height + 2;
  const airShadowScale = Math.max(0.58, 1 - airBlend * 0.25);
  ctx.fillStyle = 'rgba(15, 41, 51, 0.2)';
  ctx.beginPath();
  ctx.ellipse(
    shadowCx,
    shadowY,
    (19 + slideBlend * 8) * airShadowScale,
    5 * airShadowScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  if (player.style.sidekick !== 'none') {
    renderSidekick(ctx, player, time);
  }

  ctx.save();
  const footX = player.x + player.width / 2;
  const footY = player.y + player.height;
  ctx.translate(footX, footY);
  ctx.scale(player.squashX, player.squashY);

  // Subtle Glam Fever / Roll Aura (clean coastal shimmer, no heavy blast)
  if (player.twirling || player.glamFeverTimer > 0) {
    const auraR = player.twirling ? 48 : 42;
    const auraGrad = ctx.createRadialGradient(0, -player.height * 0.5, 8, 0, -player.height * 0.5, auraR);
    auraGrad.addColorStop(0, 'rgba(45, 212, 191, 0.34)');
    auraGrad.addColorStop(0.6, 'rgba(2, 132, 199, 0.16)');
    auraGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -player.height * 0.5, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smoothly blended pose transforms
  if (isStumbling) {
    // Phase 1 (0..0.45): forward trip stagger; Phase 2 (0.45..1.0): knee buckle & catch balance sitting back
    const tripEase = Math.sin(Math.min(1, stumbleProg / 0.45) * Math.PI * 0.5);
    const settleEase = Math.max(0, (stumbleProg - 0.38) / 0.62);
    const tilt = tripEase * 0.34 - settleEase * 0.52;
    ctx.translate(-settleEase * 8, settleEase * 14);
    ctx.rotate(tilt);
  } else if (player.twirling) {
    // Athletic 360-degree tucked forward roll around waist center
    ctx.translate(0, -44);
    ctx.rotate(rollProgress * Math.PI * 2);
    ctx.translate(0, 44);
    ctx.scale(0.94, 0.9);
  } else if (studioPose === 'pose') {
    ctx.rotate(-0.03);
  } else if (studioPose === 'leap') {
    ctx.translate(0, -12 - Math.abs(Math.sin(time * 3)) * 8);
    ctx.rotate(0.08);
  } else {
    const airTilt = Math.max(-0.14, Math.min(0.16, -player.vy * 0.00028)) * airBlend;
    const runTilt = 0.07 * (1 - slideBlend) * (1 - airBlend);
    const slideTilt = -0.52 * slideBlend;
    ctx.rotate(runTilt + airTilt + slideTilt);
    ctx.translate(slideBlend * 3, slideBlend * 10);
  }

  const bobOffset =
    studioPose === 'pose'
      ? Math.sin(time * 2.5) * 1.4
      : isStumbling || player.twirling
      ? 0
      : (1 - airBlend) * (1 - slideBlend) * Math.abs(Math.sin(player.runCycle * 12)) * -2.8;
  ctx.translate(0, bobOffset);

  const stride =
    studioPose === 'pose'
      ? 0.28
      : studioPose === 'leap'
      ? 0.85
      : isStumbling
      ? Math.sin(stumbleProg * 14) * 0.42
      : player.grounded
      ? Math.sin(player.runCycle * 12) * (1 - slideBlend)
      : 0.72 * (1 - slideBlend);

  const armSwing =
    studioPose === 'pose'
      ? -0.4
      : studioPose === 'leap'
      ? -0.95
      : isStumbling
      ? Math.cos(stumbleProg * 18) * 1.1
      : player.grounded
      ? Math.cos(player.runCycle * 12) * (1 - slideBlend)
      : -0.75;

  // Back Arm with 2-bone IK (reaches outward on stumble, tucks on roll, trails cleanly on slide)
  const backHandTargetX = isStumbling
    ? 12 - Math.sin(stumbleProg * 14) * 10
    : player.twirling
    ? 6
    : studioPose === 'leap'
    ? -16
    : (-5 - armSwing * 13) * (1 - slideBlend) - 14 * slideBlend;
  const backHandTargetY = isStumbling
    ? -66 + stumbleProg * 18
    : player.twirling
    ? -48
    : studioPose === 'leap'
    ? -72
    : (-41 + Math.abs(armSwing) * 4) * (1 - slideBlend) - 48 * slideBlend;
  const backArmIK = solveTwoBoneIK(-3, -61, backHandTargetX, backHandTargetY, 12, 11, -1);
  drawCapsuleLimb(ctx, -3, -61, backArmIK.jointX, backArmIK.jointY, 5.2, '#EBC2A4', '#CF9E7E');
  drawCapsuleLimb(ctx, backArmIK.jointX, backArmIK.jointY, backArmIK.endX, backArmIK.endY, 4.6, '#EBC2A4', '#CF9E7E');

  // Back Leg with 2-bone IK (tucked under during slide, bent during stumble/roll)
  const airLift = airBlend * (player.vy < 0 ? -9 : -3);
  const backFootTargetX = isStumbling
    ? -10
    : player.twirling
    ? -6
    : (-4 - stride * 17) * (1 - slideBlend) - 10 * slideBlend;
  const backFootTargetY = isStumbling
    ? -12
    : player.twirling
    ? -20
    : (-8 - Math.max(0, -stride) * 6 + airLift) * (1 - slideBlend) - 14 * slideBlend;
  const backLegIK = solveTwoBoneIK(-2, -39, backFootTargetX, backFootTargetY, 17, 17, 1);
  drawCapsuleLimb(ctx, -2, -39, backLegIK.jointX, backLegIK.jointY, 6.8, '#EBC2A4', '#CF9E7E');
  drawCapsuleLimb(ctx, backLegIK.jointX, backLegIK.jointY, backLegIK.endX, backLegIK.endY, 5.6, '#EBC2A4', '#CF9E7E');
  drawFootwear(ctx, backLegIK.endX, backLegIK.endY + 2, player.activeOutfit, outfit, player.shoesId);

  // Flowing skirt / gown with secondary sway
  const fabricLag = (player.grounded ? Math.sin(player.runCycle * 12) * 3.5 : -6) - Math.min(8, Math.abs(player.vy) * 0.015);
  if (player.activeOutfit === 'starlight_gown') {
    const gownGrad = ctx.createLinearGradient(-24, -46, 14, -8);
    gownGrad.addColorStop(0, outfit.primary);
    gownGrad.addColorStop(1, '#0F766E');
    ctx.fillStyle = gownGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -45);
    ctx.quadraticCurveTo(-36 + fabricLag, -26, -34 + fabricLag, -7);
    ctx.lineTo(15, -7);
    ctx.quadraticCurveTo(14, -26, 8, -45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = outfit.secondary;
    ctx.fillRect(-10, -45, 18, 4);
  } else if (player.activeOutfit === 'pop_star') {
    const skirtGrad = ctx.createLinearGradient(-16, -42, 14, -22);
    skirtGrad.addColorStop(0, outfit.secondary);
    skirtGrad.addColorStop(1, '#083344');
    ctx.fillStyle = skirtGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -41);
    ctx.lineTo(-22 + fabricLag * 0.5, -22);
    ctx.lineTo(15, -22);
    ctx.lineTo(9, -41);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = outfit.secondary;
    ctx.beginPath();
    ctx.moveTo(-9, -42);
    ctx.lineTo(-15 + fabricLag * 0.4, -28);
    ctx.lineTo(13, -28);
    ctx.lineTo(9, -42);
    ctx.closePath();
    ctx.fill();
  }

  // Front Leg with 2-bone IK (extended cleanly forward during slide)
  const frontFootTargetX = isStumbling
    ? 8
    : player.twirling
    ? 8
    : (4 + stride * 18) * (1 - slideBlend) + 22 * slideBlend;
  const frontFootTargetY = isStumbling
    ? -9
    : player.twirling
    ? -19
    : (-8 - Math.max(0, stride) * 7 + airLift * 0.7) * (1 - slideBlend) - 10 * slideBlend;
  const frontLegIK = solveTwoBoneIK(2, -39, frontFootTargetX, frontFootTargetY, 17, 17, 1);
  drawCapsuleLimb(ctx, 2, -39, frontLegIK.jointX, frontLegIK.jointY, 7, '#FBE0CC', '#DFB090');
  drawCapsuleLimb(ctx, frontLegIK.jointX, frontLegIK.jointY, frontLegIK.endX, frontLegIK.endY, 5.8, '#FBE0CC', '#DFB090');
  drawFootwear(ctx, frontLegIK.endX, frontLegIK.endY + 2, player.activeOutfit, outfit, player.shoesId);

  // Sculpted Modern Fashion Torso Silhouette
  const torsoGrad = ctx.createLinearGradient(-10, -64, 11, -38);
  if (player.hitFlashTimer > 0) {
    torsoGrad.addColorStop(0, '#FFFFFF');
    torsoGrad.addColorStop(1, '#E0F2FE');
  } else {
    torsoGrad.addColorStop(0, outfit.primary);
    torsoGrad.addColorStop(1, outfit.secondary);
  }
  ctx.fillStyle = torsoGrad;
  ctx.beginPath();
  ctx.moveTo(-10, -63);
  ctx.quadraticCurveTo(0, -65, 11, -63);
  ctx.quadraticCurveTo(10, -52, 7.5, -40);
  ctx.quadraticCurveTo(0, -37, -7.5, -40);
  ctx.quadraticCurveTo(-10, -52, -10, -63);
  ctx.closePath();
  ctx.fill();

  // Outfit accent & trim
  ctx.fillStyle = outfit.trim;
  if (player.activeOutfit === 'malibu_skater') {
    ctx.fillRect(-8, -44, 16, 3);
  } else if (player.activeOutfit === 'pop_star') {
    drawStar(ctx, 1, -52, 5, 5, 2.2);
    ctx.fill();
  } else {
    ctx.fillRect(-8, -62, 16, 3);
  }

  // Optional Boutique Bag worn on hip/crossbody
  if (player.bagId) {
    ctx.strokeStyle = player.bagId === 'bag_shell_clutch' ? '#FDE68A' : '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -61);
    ctx.lineTo(7, -41);
    ctx.stroke();

    if (player.bagId === 'bag_velvet_tote') {
      ctx.fillStyle = '#0F766E';
      drawRoundedRect(ctx, 1, -45, 13, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#0F2933';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(6, -42, 3, 3);
    } else {
      ctx.fillStyle =
        player.bagId === 'bag_shell_clutch'
          ? '#06B6D4'
          : player.bagId === 'bag_pearl'
          ? '#F8FAFC'
          : '#06B6D4';
      drawRoundedRect(ctx, 2, -44, 11, 9, 4);
      ctx.fill();
      ctx.strokeStyle = '#0F2933';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(7.5, -39.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Flowing multi-strand ponytail with velocity secondary motion
  const hairWave = Math.sin(time * 9 + player.runCycle * 4) * 5.8 - Math.min(8, Math.abs(player.vy) * 0.015);
  const hairGrad = ctx.createLinearGradient(-8, -82, -36, -50);
  hairGrad.addColorStop(0, hair.base);
  hairGrad.addColorStop(1, hair.shadow);
  ctx.fillStyle = hairGrad;
  ctx.beginPath();
  ctx.moveTo(-6, -80);
  ctx.quadraticCurveTo(-32, -77 + hairWave, -37, -50 + hairWave * 0.75);
  ctx.quadraticCurveTo(-22, -55, -7, -69);
  ctx.closePath();
  ctx.fill();

  // Neck
  drawCapsuleLimb(ctx, 0, -63, 1, -70, 5.2, '#FBE0CC', '#E5B89B');

  // Sculpted Head Oval
  const headGrad = ctx.createRadialGradient(4, -80, 2, 1, -77, 13);
  headGrad.addColorStop(0, '#FFF0E5');
  headGrad.addColorStop(0.65, '#FAD5BC');
  headGrad.addColorStop(1, '#DDA887');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(1.5, -77.5, 11.2, 12.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Natural blinking every ~3.2s
  const blinkPhase = time % 3.2;
  const isBlinking = !isStumbling && blinkPhase > 3.04;

  // Expressive Eyebrow
  ctx.strokeStyle = hair.shadow;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (isStumbling) {
    ctx.moveTo(4.5, -83.5);
    ctx.quadraticCurveTo(7.5, -85.5, 10.5, -83.2);
  } else {
    ctx.moveTo(4.5, -82.6);
    ctx.quadraticCurveTo(7.5, -84.2, 10.5, -82);
  }
  ctx.stroke();

  // Eyes (blinks or ocean-teal iris with catchlight)
  if (isBlinking) {
    ctx.strokeStyle = '#0F2933';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(5, -78.5);
    ctx.quadraticCurveTo(8, -77.2, 10.6, -78.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(7.5, -78.5, 2.9, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(8.1, -78.5, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F2933';
    ctx.beginPath();
    ctx.arc(8.3, -78.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8.8, -79.1, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle cheek blush
  ctx.fillStyle = 'rgba(244, 114, 142, 0.34)';
  ctx.beginPath();
  ctx.ellipse(6.5, -74.5, 2.5, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Mouth
  if (isStumbling) {
    ctx.fillStyle = '#9F1239';
    ctx.beginPath();
    ctx.ellipse(7.5, -70.5, 2.0, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.glamFeverTimer > 0 || studioPose) {
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(5, -71.5);
    ctx.quadraticCurveTo(8, -68.5, 10.6, -71.6);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = '#C8526B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(5.2, -71.5);
    ctx.quadraticCurveTo(8, -69.5, 10.2, -71.8);
    ctx.stroke();
  }

  // Hair Crown & Front Swoop
  ctx.fillStyle = hair.base;
  ctx.beginPath();
  ctx.arc(0, -80.5, 12.2, Math.PI * 0.88, Math.PI * 2.08);
  ctx.quadraticCurveTo(3, -83, -9, -76);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hair.highlight;
  ctx.beginPath();
  ctx.ellipse(-2, -88, 6.2, 2.3, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Outfit Headgear + Boutique Accessory
  if (player.accessoryId === 'acc_heart_shades' || player.accessoryId === 'acc_sunnies') {
    ctx.fillStyle = player.accessoryId === 'acc_heart_shades' ? '#FB7185' : '#0F2933';
    drawRoundedRect(ctx, 3.5, -81.2, 8.6, 5, 2);
    ctx.fill();
    ctx.strokeStyle = player.accessoryId === 'acc_heart_shades' ? '#FFF1F2' : '#2DD4BF';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  } else if (player.accessoryId === 'acc_pearl_tiara' || player.accessoryId === 'acc_tiara') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-4, -90);
    ctx.lineTo(-1, -98);
    ctx.lineTo(2, -91);
    ctx.lineTo(5, -98);
    ctx.lineTo(7, -90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(2, -94, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.accessoryId === 'acc_star_headset' || player.accessoryId === 'acc_headset') {
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(1, -80, 12.5, Math.PI * 1.05, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(-1, -78, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-1, -76);
    ctx.lineTo(6, -72);
    ctx.stroke();
  } else if (player.accessoryId === 'acc_flower_crown') {
    const blossoms = ['#FB7185', '#FBBF24', '#A78BFA', '#2DD4BF'];
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(1, -86, 11.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    blossoms.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(-6 + i * 4.5, -90 - (i === 1 || i === 2 ? 2 : 0), 3.1, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (player.activeOutfit === 'malibu_skater') {
    ctx.fillStyle = '#0284C7';
    drawRoundedRect(ctx, -5, -86, 20, 4.2, 2);
    ctx.fill();
  } else if (player.activeOutfit === 'starlight_gown') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-4, -90);
    ctx.lineTo(0, -97);
    ctx.lineTo(4, -90);
    ctx.closePath();
    ctx.fill();
  }

  // Front Arm with 2-bone IK
  const frontHandTargetX = studioPose === 'pose' ? 14 : 7 + armSwing * 13;
  const frontHandTargetY = isStumbling
    ? -68
    : studioPose === 'pose'
    ? -52
    : studioPose === 'leap'
    ? -76
    : -40 - armSwing * 3;
  const frontArmIK = solveTwoBoneIK(2, -59, frontHandTargetX, frontHandTargetY, 12, 11, 1);
  drawCapsuleLimb(ctx, 2, -59, frontArmIK.jointX, frontArmIK.jointY, 5.4, '#FBE0CC', '#DFB090');
  drawCapsuleLimb(ctx, frontArmIK.jointX, frontArmIK.jointY, frontArmIK.endX, frontArmIK.endY, 4.8, '#FBE0CC', '#DFB090');

  ctx.restore();
  ctx.globalAlpha = 1;
}

export { renderHeroCharacter as renderBarbieCharacter };

function drawFootwear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outfitId: OutfitId,
  outfit: (typeof OUTFIT_META)[OutfitId],
  shoesId?: string | null
): void {
  if (shoesId === 'shoe_aqua_skates') {
    ctx.fillStyle = '#00C2D1';
    drawRoundedRect(ctx, x - 6, y - 5, 14, 7.5, 3);
    ctx.fill();
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.arc(x - 2, y + 5, 3.2, 0, Math.PI * 2);
    ctx.arc(x + 6, y + 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 4, y - 6, 7, 2);
  } else if (shoesId === 'shoe_crystal_heels') {
    ctx.fillStyle = '#2DD4BF';
    drawRoundedRect(ctx, x - 5, y - 3, 13, 5.5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#0F766E';
    ctx.fillRect(x - 5, y + 1, 2.5, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 3, y - 3, 3, 2.5);
  } else if (outfitId === 'malibu_skater') {
    ctx.fillStyle = outfit.secondary;
    drawRoundedRect(ctx, x - 6, y - 4, 14, 7, 3);
    ctx.fill();
    ctx.fillStyle = outfit.trim;
    ctx.beginPath();
    ctx.arc(x - 2, y + 5, 3, 0, Math.PI * 2);
    ctx.arc(x + 6, y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (outfitId === 'pop_star') {
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, x - 5, y - 9, 12, 12, 3);
    ctx.fill();
  } else {
    ctx.fillStyle = '#FBBF24';
    drawRoundedRect(ctx, x - 5, y - 3, 12, 6, 3);
    ctx.fill();
  }
}

function renderSidekick(
  ctx: CanvasRenderingContext2D,
  player: RenderPlayerState,
  time: number
): void {
  const sx = player.x - 36;
  if (player.style.sidekick === 'puppy') {
    const hop = Math.abs(Math.sin(time * 11)) * 6;
    const sy = player.y + player.height - 14 - hop;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.arc(9, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(6, -5, 3, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.arc(9, -12, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (player.style.sidekick === 'cockatoo') {
    const bob = Math.sin(time * 8) * 9;
    const sy = player.y + 18 + bob;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#99F6E4';
    const wingY = Math.sin(time * 22) * 7;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(-12, -10 + wingY);
    ctx.lineTo(3, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(2, -14);
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    if (!p.active) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === 'sparkle') {
      drawStar(ctx, 0, 0, 4, p.size, p.size * 0.35);
      ctx.fill();
    } else if (p.shape === 'heart') {
      drawHeart(ctx, 0, -p.size / 2, p.size);
      ctx.fill();
    } else if (p.shape === 'confetti') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  for (const ft of texts) {
    const progress = ft.life / ft.maxLife;
    const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = '800 15px "Outfit", "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(15, 41, 51, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

export function renderWorld(ctx: CanvasRenderingContext2D, world: RenderWorldState): void {
  const stage = STAGES[Math.min(world.stageIndex, STAGES.length - 1)];
  const zoom = world.elimZoom ?? 1;

  ctx.save();
  if (zoom > 1.001) {
    const focusX = world.player.x + world.player.width / 2;
    const focusY = world.player.y + world.player.height * 0.5;
    ctx.translate(focusX, focusY);
    ctx.scale(zoom, zoom);
    ctx.translate(-focusX, -focusY);
  }
  ctx.translate(world.shakeX, world.shakeY);

  renderBackground(ctx, world, stage);

  for (const item of world.collectibles) {
    renderCollectible(ctx, item, world.time);
  }

  for (const obs of world.obstacles) {
    renderObstacle(ctx, obs, world.groundY, world.time, world.player.x);
  }

  renderCartTelegraphs(ctx, world.obstacles, world.width, world.time);

  renderHeroCharacter(ctx, world.player, world.time);

  renderParticles(ctx, world.particles);
  renderFloatingTexts(ctx, world.floatingTexts);

  ctx.restore();
}
