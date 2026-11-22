import { soundEngine } from './audio';
import { OUTFIT_META, PHYSICS, STAGES } from './constants';
import { renderWorld, type RenderWorldState } from './renderer';
import type {
  AdventureExperienceMode,
  CharacterStyle,
  Collectible,
  FloatingText,
  GameState,
  HudSnapshot,
  Obstacle,
  ObstacleKind,
  OutfitId,
  Particle,
  RunMission,
  UnifiedActionKind,
} from './types';

const BEST_SCORE_KEY = 'barbie_malibu_runway_best_v1';

const PARTICLE_POOL_SIZE = 180;
const STUMBLE_DURATION = 0.95;

function createRunMission(stageIndex: number): RunMission {
  const templates: Array<Omit<RunMission, 'progress' | 'completed'>> = [
    { id: 'gems_12', label: 'Collect 12 Aqua Gems', kind: 'diamonds', target: 12 },
    { id: 'obs_6', label: 'Clear 6 Runway Hazards', kind: 'obstacles', target: 6 },
    { id: 'perf_3', label: 'Hit 3 Perfect Timings', kind: 'perfects', target: 3 },
    { id: 'combo_6', label: 'Reach a 6x Combo', kind: 'combos', target: 6 },
  ];
  const pick = templates[stageIndex % templates.length];
  return { ...pick, progress: 0, completed: false };
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onStateChange: (nextState: GameState) => void;
}

export class RunwayGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hudEmitTimer = 0;

  private gameState: GameState = 'TITLE_MENU';
  private style: CharacterStyle;
  private activeOutfit: OutfitId;
  private equippedAccessory: string | null = null;
  private equippedBag: string | null = null;
  private equippedShoes: string | null = null;

  private width = 1280;
  private height = 720;
  private groundY = 560;

  private time = 0;
  private hitstopTimer = 0;
  private shakeTimer = 0;
  private shakeMagnitude = 0;
  private stumbleTimer = 0;

  // Progression & Stats
  private stageIndex = 0;
  private endlessMode = false;
  private adventureMode: AdventureExperienceMode = 'adventure';
  private stageDistance = 0;
  private totalDistance = 0;
  private score = 0;
  private bestScore = 0;
  private hearts = 3;
  private maxHearts = 3;
  private combo = 0;
  private comboTimer = 0;
  private diamondsCollected = 0;
  private crownsCollected = 0;
  private obstaclesCleared = 0;
  private perfectCount = 0;
  private secondWindUsed = false;
  private runMission: RunMission = createRunMission(0);
  private lastTimedObstacleId = -1;

  // Player Physics
  private playerX = 180;
  private playerY = 468;
  private playerVx = 0;
  private playerVy = 0;
  private baseWidth = 38;
  private baseHeight = 96;
  private grounded = true;
  private jumpsRemaining = 2;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private slideTimer = 0;
  private twirlTimer = 0;
  private twirlCooldownTimer = 0;
  private glamFeverTimer = 0;
  private invulnTimer = 0;
  private hitFlashTimer = 0;
  private squashX = 1;
  private squashY = 1;
  private runCycle = 0;
  private slideBlend = 0;
  private airBlend = 0;
  private lastHudCueKey = '';

  // Input Tracking (held vs edge-triggered + touch steer)
  private heldKeys = new Set<string>();
  private touchMoveDir: -1 | 0 | 1 = 0;

  // Entities
  private nextEntityId = 1;
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private spawnTimer = 1.1;
  private trailTimer = 0;

  constructor(
    canvas: HTMLCanvasElement,
    initialStyle: CharacterStyle,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire 2D canvas context');
    }
    this.ctx = context;
    this.style = { ...initialStyle };
    this.activeOutfit = initialStyle.outfit;
    this.callbacks = callbacks;

    try {
      const saved = localStorage.getItem(BEST_SCORE_KEY);
      if (saved) this.bestScore = parseInt(saved, 10) || 0;
    } catch {
      // Ignore storage access errors
    }

    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 6,
        alpha: 1,
        life: 0,
        maxLife: 0.5,
        color: '#2DD4BF',
        shape: 'sparkle',
        rotation: 0,
        vRot: 0,
      });
    }

    this.resize();
    this.resetWorldForRun(0, false);
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    this.width = Math.max(320, Math.floor(rect?.width || window.innerWidth));
    this.height = Math.max(320, Math.floor(rect?.height || window.innerHeight));
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.groundY = Math.floor(this.height * 0.8);
    if (this.grounded) {
      this.playerY = this.groundY - this.getCurrentHeight();
    }
    this.playerX = Math.min(Math.max(this.playerX, 60), this.width * 0.55);
  }

  public setStyle(style: CharacterStyle): void {
    this.style = { ...style };
    if (this.gameState === 'TITLE_MENU') {
      this.activeOutfit = style.outfit;
      this.maxHearts = 3 + OUTFIT_META[this.activeOutfit].extraMaxHearts;
      this.hearts = this.maxHearts;
    }
  }

  public setEquipments(
    accessoryId: string | null,
    bagId: string | null,
    shoesId: string | null = null
  ): void {
    this.equippedAccessory = accessoryId;
    this.equippedBag = bagId;
    this.equippedShoes = shoesId;
  }

  public continueSecondWind(): boolean {
    if (this.gameState !== 'GAME_OVER' || this.secondWindUsed) return false;
    soundEngine.unlock();
    soundEngine.playHeart();
    this.secondWindUsed = true;
    this.hearts = Math.min(this.maxHearts, 2);
    this.stumbleTimer = 0;
    this.invulnTimer = 2.6;
    this.obstacles = this.obstacles.filter((o) => o.x > this.playerX + 260);
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.addFloatingText(this.playerX + 24, this.playerY - 24, 'SECOND WIND!', '#2DD4BF');
    this.spawnBurst(this.playerX + 18, this.playerY + 40, '#2DD4BF', 18, 'sparkle');
    this.emitHud();
    return true;
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    this.heldKeys.clear();
    this.touchMoveDir = 0;
  }

  public setTouchMoveDir(dir: -1 | 0 | 1): void {
    this.touchMoveDir = dir;
  }

  public setAdventureMode(mode: AdventureExperienceMode): void {
    this.adventureMode = mode;
    this.emitHud();
  }

  public startNewRun(
    mode: AdventureExperienceMode = this.adventureMode,
    startStageIndex = 0
  ): void {
    soundEngine.unlock();
    this.adventureMode = mode;
    const clampedStage = Math.max(0, Math.min(STAGES.length - 1, startStageIndex));
    this.resetWorldForRun(clampedStage, false);
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.emitHud();
  }

  public advanceToNextStage(): void {
    soundEngine.unlock();
    const nextIdx = Math.min(this.stageIndex + 1, STAGES.length - 1);
    this.resetStageTransition(nextIdx, false);
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.emitHud();
  }

  public startEndlessEncore(): void {
    soundEngine.unlock();
    this.resetStageTransition(STAGES.length - 1, true);
    this.gameState = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.emitHud();
  }

  private resetWorldForRun(stageIdx: number, endless: boolean): void {
    this.stageIndex = stageIdx;
    this.endlessMode = endless;
    this.activeOutfit = this.style.outfit;
    this.maxHearts = 3 + OUTFIT_META[this.activeOutfit].extraMaxHearts;
    this.hearts = this.maxHearts;
    this.score = 0;
    this.totalDistance = 0;
    this.stageDistance = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.diamondsCollected = 0;
    this.crownsCollected = 0;
    this.obstaclesCleared = 0;
    this.perfectCount = 0;
    this.secondWindUsed = false;
    this.runMission = createRunMission(stageIdx);
    this.stumbleTimer = 0;
    this.lastTimedObstacleId = -1;

    this.resetPlayerPosition();
    this.obstacles = [];
    this.collectibles = [];
    this.floatingTexts = [];
    this.particles.forEach((p) => (p.active = false));
    this.spawnTimer = 0.85;
    this.emitHud();
  }

  private resetStageTransition(stageIdx: number, endless: boolean): void {
    this.stageIndex = stageIdx;
    this.endlessMode = endless;
    this.stageDistance = 0;
    this.hearts = Math.min(this.maxHearts, this.hearts + 1);
    this.runMission = createRunMission(stageIdx);
    this.stumbleTimer = 0;
    this.obstacles = [];
    this.collectibles = [];
    this.floatingTexts = [];
    this.spawnTimer = 0.8;
    this.invulnTimer = 1.0;
    this.resetPlayerPosition();
  }

  private resetPlayerPosition(): void {
    this.playerX = Math.max(96, Math.min(200, this.width * 0.16));
    this.playerY = this.groundY - this.baseHeight;
    this.playerVx = 0;
    this.playerVy = 0;
    this.grounded = true;
    this.jumpsRemaining = 2;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.slideTimer = 0;
    this.twirlTimer = 0;
    this.twirlCooldownTimer = 0;
    this.glamFeverTimer = 0;
    this.invulnTimer = 0;
    this.hitFlashTimer = 0;
    this.squashX = 1;
    this.squashY = 1;
    this.slideBlend = 0;
    this.airBlend = 0;
    this.lastHudCueKey = '';
  }

  private getCurrentHeight(): number {
    return this.slideTimer > 0 ? 52 : this.baseHeight;
  }

  // Intelligent obstacle analysis for the Unified Action Button
  private getUpcomingObstacleInfo(): {
    recommendedAction: UnifiedActionKind;
    actionWindowActive: boolean;
    nearestObstacle: Obstacle | null;
    nearestDist: number;
  } {
    let nearest: Obstacle | null = null;
    let minDist = Infinity;

    for (const obs of this.obstacles) {
      if (obs.shattered) continue;
      if (obs.x + obs.width < this.playerX + 6) continue;
      const dist = obs.x - (this.playerX + this.baseWidth);
      if (dist < 340 && dist < minDist) {
        minDist = dist;
        nearest = obs;
      }
    }

    if (!nearest) {
      return {
        recommendedAction: 'jump',
        actionWindowActive: false,
        nearestObstacle: null,
        nearestDist: 999,
      };
    }

    let action: UnifiedActionKind = 'jump';
    if (nearest.kind === 'boom_spotlight') {
      action = 'slide';
    } else if (nearest.kind === 'paparazzi_drone') {
      if ((nearest.flashActiveTimer > 0 || nearest.telegraphTimer < 0.45) && this.twirlCooldownTimer <= 0) {
        action = 'roll';
      } else {
        action = 'slide';
      }
    } else if (nearest.kind === 'runway_cart' || nearest.kind === 'hatbox_stack') {
      if (this.twirlCooldownTimer <= 0 && minDist < 215) {
        action = 'roll';
      } else {
        action = 'jump';
      }
    } else {
      action = 'jump';
    }

    const windowActive = minDist <= 255 && minDist >= -18;
    return {
      recommendedAction: action,
      actionWindowActive: windowActive,
      nearestObstacle: nearest,
      nearestDist: minDist,
    };
  }

  // Input Handlers
  public handleKeyDown(code: string): void {
    if (this.gameState !== 'PLAYING' || this.stumbleTimer > 0) return;
    const isRepeat = this.heldKeys.has(code);
    this.heldKeys.add(code);

    if (!isRepeat) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        this.performAction('jump');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        this.performAction('slide');
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyE') {
        this.performAction('roll');
      }
    }
  }

  public handleKeyUp(code: string): void {
    this.heldKeys.delete(code);
  }

  public clearHeldKeys(): void {
    this.heldKeys.clear();
    this.touchMoveDir = 0;
  }

  public performAction(action: UnifiedActionKind): void {
    if (this.gameState !== 'PLAYING' || this.stumbleTimer > 0) return;
    soundEngine.unlock();

    const { recommendedAction, actionWindowActive, nearestObstacle, nearestDist } =
      this.getUpcomingObstacleInfo();

    const canRollShatter =
      action === 'roll' &&
      this.twirlCooldownTimer <= 0 &&
      this.twirlTimer <= 0 &&
      nearestObstacle !== null &&
      (nearestObstacle.kind === 'hatbox_stack' ||
        nearestObstacle.kind === 'runway_cart' ||
        nearestObstacle.kind === 'paparazzi_drone');

    if (
      actionWindowActive &&
      nearestObstacle &&
      nearestDist <= 230 &&
      this.lastTimedObstacleId !== nearestObstacle.id &&
      (action === recommendedAction || canRollShatter)
    ) {
      this.lastTimedObstacleId = nearestObstacle.id;
      const isPerfect = nearestDist <= 140 && nearestDist >= 12;
      const isGreat = !isPerfect && nearestDist <= 185 && nearestDist >= 4;
      const bonusPts = isPerfect ? 55 : isGreat ? 30 : 20;
      this.score += bonusPts;
      if (isPerfect) {
        this.perfectCount += 1;
        this.advanceRunMission('perfects', 1);
      }
      soundEngine.playTimingGrade(isPerfect);
      this.addFloatingText(
        this.playerX + 20,
        this.playerY - 18,
        isPerfect ? `PERFECT! +${bonusPts}` : isGreat ? `GREAT! +${bonusPts}` : `NICE! +${bonusPts}`,
        isPerfect ? '#FDE047' : isGreat ? '#38BDF8' : '#2DD4BF'
      );
    }

    if (action === 'slide') {
      this.triggerSlide();
    } else if (action === 'roll') {
      this.triggerTwirl();
    } else {
      this.triggerJump();
    }
  }

  public triggerUnifiedAction(): void {
    this.performAction('jump');
  }

  public triggerJump(): void {
    if (this.gameState !== 'PLAYING' || this.stumbleTimer > 0) return;
    soundEngine.unlock();
    this.jumpBufferTimer = PHYSICS.jumpBufferTime;
    this.slideTimer = 0;
    this.tryExecuteBufferedJump();
  }

  public triggerSlide(): void {
    if (this.gameState !== 'PLAYING' || this.stumbleTimer > 0) return;
    soundEngine.unlock();
    if (!this.grounded && this.playerVy < 380) {
      this.playerVy = 540;
    }
    if (this.slideTimer <= 0) {
      this.slideTimer = PHYSICS.slideDuration;
      this.squashX = 1.24;
      this.squashY = 0.72;
      soundEngine.playSlide();
      this.spawnBurst(this.playerX + 18, this.groundY - 4, '#2DD4BF', 6, 'circle');
    }
  }

  public triggerTwirl(): void {
    if (this.gameState !== 'PLAYING' || this.stumbleTimer > 0) return;
    soundEngine.unlock();
    if (this.twirlCooldownTimer > 0 || this.twirlTimer > 0) return;
    this.twirlTimer = PHYSICS.twirlDuration;
    this.twirlCooldownTimer = PHYSICS.twirlCooldown;
    this.playerVy = Math.min(this.playerVy, -120);
    this.squashX = 1.18;
    this.squashY = 0.88;
    soundEngine.playTwirl();
    this.spawnBurst(
      this.playerX + this.baseWidth / 2,
      this.playerY + this.getCurrentHeight() * 0.5,
      '#38BDF8',
      16,
      'sparkle'
    );
  }

  private tryExecuteBufferedJump(): void {
    if (this.jumpBufferTimer <= 0) return;

    if (this.grounded || this.coyoteTimer > 0) {
      this.playerVy = PHYSICS.jumpVelocity;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.jumpsRemaining = 1;
      this.squashX = 0.8;
      this.squashY = 1.24;
      soundEngine.playJump(false);
      this.spawnBurst(this.playerX + 18, this.groundY - 4, '#E0F2FE', 7, 'circle');
    } else if (this.jumpsRemaining > 0) {
      this.playerVy = PHYSICS.doubleJumpVelocity;
      this.jumpsRemaining = 0;
      this.jumpBufferTimer = 0;
      this.squashX = 0.82;
      this.squashY = 1.22;
      soundEngine.playJump(true);
      this.spawnBurst(
        this.playerX + 18,
        this.playerY + this.getCurrentHeight(),
        '#2DD4BF',
        10,
        'sparkle'
      );
    }
  }

  private update(dt: number): void {
    this.time += dt;

    if (this.gameState === 'TITLE_MENU') {
      this.stageDistance += 95 * dt;
      this.totalDistance += 95 * dt;
      this.runCycle += dt * 1.1;
      this.updateParticles(dt);
      return;
    }

    if (this.gameState !== 'PLAYING') {
      return;
    }

    // Stumble / elimination pre-Game-Over animation phase
    if (this.stumbleTimer > 0) {
      this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
      const decelRatio = Math.max(0, this.stumbleTimer / STUMBLE_DURATION);
      this.stageDistance += 12 * decelRatio * dt;
      this.updateShake(dt);
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);

      // Gentle stumble settle to ground
      if (!this.grounded) {
        this.playerVy += PHYSICS.gravity * 0.85 * dt;
        this.playerY = Math.min(this.groundY - this.baseHeight, this.playerY + this.playerVy * dt);
        if (this.playerY >= this.groundY - this.baseHeight) {
          this.grounded = true;
          this.playerVy = 0;
        }
      }

      if (this.stumbleTimer <= 0) {
        this.persistBestScore();
        this.gameState = 'GAME_OVER';
        this.callbacks.onStateChange('GAME_OVER');
        this.emitHud();
      } else {
        this.hudEmitTimer += dt;
        if (this.hudEmitTimer >= 0.06) {
          this.hudEmitTimer = 0;
          this.emitHud();
        }
      }
      return;
    }

    // Brief hitstop freeze for juicy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateShake(dt);
      this.updateParticles(dt);
      return;
    }

    const stage = STAGES[Math.min(this.stageIndex, STAGES.length - 1)];
    const outfitMeta = OUTFIT_META[this.activeOutfit];
    const endlessRamp = this.endlessMode ? Math.min(220, this.stageDistance * 0.08) : 0;
    const progressRamp = Math.min(65, (this.stageDistance / stage.targetDistance) * 65);
    const feverBoost = this.glamFeverTimer > 0 ? 1.16 : 1.0;
    const twirlBoost = this.twirlTimer > 0 ? 1.25 : 1.0;
    const relaxedScale = this.adventureMode === 'relaxed' ? 0.78 : 1.0;
    const worldSpeed =
      (stage.baseSpeed + progressRamp + endlessRamp) *
      outfitMeta.speedBonus *
      feverBoost *
      twirlBoost *
      relaxedScale;

    // Advance distance & passive score
    const distDelta = (worldSpeed * dt) / 14;
    this.stageDistance += distDelta;
    this.totalDistance += distDelta;
    this.score += distDelta * (1 + this.combo * 0.12);
    if (this.score > this.bestScore) {
      this.bestScore = Math.floor(this.score);
    }

    // Timers
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      this.tryExecuteBufferedJump();
    }
    if (this.slideTimer > 0) this.slideTimer -= dt;
    if (this.twirlTimer > 0) this.twirlTimer -= dt;
    if (this.twirlCooldownTimer > 0) this.twirlCooldownTimer = Math.max(0, this.twirlCooldownTimer - dt);
    if (this.glamFeverTimer > 0) this.glamFeverTimer = Math.max(0, this.glamFeverTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.hitFlashTimer > 0) this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Horizontal positioning (A/D, Left/Right, or touch steer)
    let moveDir = this.touchMoveDir;
    if (this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA')) moveDir -= 1;
    if (this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD')) moveDir += 1;
    moveDir = Math.max(-1, Math.min(1, moveDir)) as -1 | 0 | 1;

    const targetVx = moveDir * 290;
    this.playerVx += (targetVx - this.playerVx) * Math.min(1, dt * 14);
    this.playerX += this.playerVx * dt;
    const minX = 64;
    const maxX = Math.max(minX + 120, this.width * 0.56);
    this.playerX = Math.max(minX, Math.min(maxX, this.playerX));

    // Vertical physics
    const prevHeight = this.getCurrentHeight();
    const gravity = PHYSICS.gravity * outfitMeta.gravityScale;
    this.playerVy += gravity * dt;
    this.playerY += this.playerVy * dt;

    const currentHeight = this.getCurrentHeight();
    if (this.grounded && prevHeight !== currentHeight) {
      this.playerY = this.groundY - currentHeight;
    }

    if (this.playerY + currentHeight >= this.groundY) {
      if (!this.grounded && this.playerVy > 180) {
        this.squashX = 1.2;
        this.squashY = 0.82;
        this.spawnBurst(this.playerX + 18, this.groundY - 3, '#CCFBF1', 5, 'circle');
      }
      this.playerY = this.groundY - currentHeight;
      this.playerVy = 0;
      this.grounded = true;
      this.jumpsRemaining = 2;
      this.coyoteTimer = PHYSICS.coyoteTime;
    } else {
      if (this.grounded) {
        this.grounded = false;
      }
    }

    // Smooth squash-and-stretch & pose blend recovery
    this.squashX += (1 - this.squashX) * Math.min(1, dt * 15);
    this.squashY += (1 - this.squashY) * Math.min(1, dt * 15);
    const targetSlide = this.slideTimer > 0 ? 1 : 0;
    const targetAir = this.grounded ? 0 : 1;
    this.slideBlend += (targetSlide - this.slideBlend) * Math.min(1, dt * 16);
    this.airBlend += (targetAir - this.airBlend) * Math.min(1, dt * 14);
    this.runCycle += dt * (worldSpeed / 400);

    // Subtle sparkle trail during Glam Fever or Roll
    this.trailTimer -= dt;
    if ((this.glamFeverTimer > 0 || this.twirlTimer > 0) && this.trailTimer <= 0) {
      this.trailTimer = 0.055;
      this.spawnParticle(
        this.playerX + 6,
        this.playerY + currentHeight * (0.3 + Math.random() * 0.5),
        -90 - Math.random() * 60,
        (Math.random() - 0.5) * 40,
        7 + Math.random() * 5,
        0.42,
        Math.random() > 0.5 ? '#2DD4BF' : '#FDE047',
        'sparkle'
      );
    }

    // Spawner
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnPattern(stage.id);
      const minInterval = Math.max(0.74, 1.35 - this.stageIndex * 0.14 - (this.endlessMode ? 0.12 : 0));
      const modeMult = this.adventureMode === 'relaxed' ? 1.34 : 1.0;
      this.spawnTimer = (minInterval + Math.random() * 0.55) * modeMult;
    }

    // Update Obstacles & Collisions
    this.updateObstacles(dt, worldSpeed);

    // Update Collectibles & Magnet
    this.updateCollectibles(dt, worldSpeed, outfitMeta.magnetRadius);

    // Update FX
    this.updateShake(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Stage Clear Check
    if (!this.endlessMode && this.stageDistance >= stage.targetDistance) {
      this.persistBestScore();
      if (this.stageIndex >= STAGES.length - 1) {
        soundEngine.playVictory();
        this.gameState = 'VICTORY';
        this.callbacks.onStateChange('VICTORY');
      } else {
        soundEngine.playStageClear();
        this.gameState = 'STAGE_CLEAR';
        this.callbacks.onStateChange('STAGE_CLEAR');
      }
      this.emitHud();
      return;
    }

    const actionCue = this.getUpcomingObstacleInfo();
    const cueKey = `${actionCue.recommendedAction}:${actionCue.actionWindowActive ? 1 : 0}`;
    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.06 || cueKey !== this.lastHudCueKey) {
      this.lastHudCueKey = cueKey;
      this.hudEmitTimer = 0;
      this.emitHud();
    }
  }

  private spawnPattern(stageId: number): void {
    const roll = Math.random();
    const spawnX = this.width + 90;

    if (roll < 0.28) {
      const kind: ObstacleKind = Math.random() > 0.45 ? 'velvet_rope' : 'hatbox_stack';
      const w = kind === 'velvet_rope' ? 54 : 48;
      const h = kind === 'velvet_rope' ? 52 : 76;
      this.obstacles.push({
        id: this.nextEntityId++,
        kind,
        x: spawnX,
        y: this.groundY - h,
        baseY: this.groundY - h,
        width: w,
        height: h,
        speedOffset: 0,
        phase: Math.random() * Math.PI * 2,
        telegraphTimer: 0,
        flashActiveTimer: 0,
        triggered: false,
        shattered: false,
      });

      for (let i = 0; i < 5; i++) {
        const arcOffset = Math.sin((i / 4) * Math.PI) * 95;
        this.collectibles.push({
          id: this.nextEntityId++,
          kind: i === 2 ? 'crown' : 'diamond',
          x: spawnX - 45 + i * 36,
          y: this.groundY - 72 - arcOffset,
          baseY: this.groundY - 72 - arcOffset,
          radius: 15,
          phase: i * 0.5,
          collected: false,
        });
      }
    } else if (roll < 0.54) {
      const boomHeight = 36;
      const boomBottom = this.groundY - 62;
      this.obstacles.push({
        id: this.nextEntityId++,
        kind: 'boom_spotlight',
        x: spawnX,
        y: boomBottom - boomHeight,
        baseY: boomBottom - boomHeight,
        width: 74,
        height: boomHeight,
        speedOffset: 0,
        phase: 0,
        telegraphTimer: 0,
        flashActiveTimer: 0,
        triggered: false,
        shattered: false,
      });

      for (let i = 0; i < 4; i++) {
        this.collectibles.push({
          id: this.nextEntityId++,
          kind: 'diamond',
          x: spawnX - 20 + i * 38,
          y: this.groundY - 26,
          baseY: this.groundY - 26,
          radius: 15,
          phase: i * 0.4,
          collected: false,
        });
      }
    } else if (roll < 0.76 && stageId >= 1) {
      const droneY = this.groundY - 128;
      this.obstacles.push({
        id: this.nextEntityId++,
        kind: 'paparazzi_drone',
        x: spawnX,
        y: droneY,
        baseY: droneY,
        width: 56,
        height: 44,
        speedOffset: 45,
        phase: Math.random() * Math.PI * 2,
        telegraphTimer: 1.45,
        flashActiveTimer: 0,
        triggered: false,
        shattered: false,
      });

      this.collectibles.push({
        id: this.nextEntityId++,
        kind: Math.random() < 0.16 && this.hearts < this.maxHearts ? 'heart' : 'crown',
        x: spawnX + 95,
        y: this.groundY - 140,
        baseY: this.groundY - 140,
        radius: 16,
        phase: 0,
        collected: false,
      });
    } else if (roll < 0.9 && stageId >= 2) {
      this.obstacles.push({
        id: this.nextEntityId++,
        kind: 'runway_cart',
        x: spawnX + 180,
        y: this.groundY - 62,
        baseY: this.groundY - 62,
        width: 62,
        height: 62,
        speedOffset: 180,
        phase: 0,
        telegraphTimer: 0,
        flashActiveTimer: 0,
        triggered: false,
        shattered: false,
      });
    } else {
      const spawnWardrobe = Math.random() < 0.42;
      const waveHigh = Math.random() < 0.5;
      for (let i = 0; i < 5; i++) {
        const yOff = waveHigh
          ? 70 + Math.sin((i / 4) * Math.PI) * 85
          : i % 2 === 0
          ? 48
          : 102;
        this.collectibles.push({
          id: this.nextEntityId++,
          kind: spawnWardrobe && i === 2 ? 'wardrobe_box' : 'diamond',
          x: spawnX + i * 42,
          y: this.groundY - yOff,
          baseY: this.groundY - yOff,
          radius: 17,
          phase: i * 0.6,
          collected: false,
        });
      }
    }
  }

  private updateObstacles(dt: number, worldSpeed: number): void {
    const pHeight = this.getCurrentHeight();
    const px = this.playerX + 7;
    const py = this.playerY + 6;
    const pw = this.baseWidth - 14;
    const ph = pHeight - 10;

    for (const obs of this.obstacles) {
      obs.x -= (worldSpeed + obs.speedOffset) * dt;

      if (obs.kind === 'paparazzi_drone') {
        obs.y = obs.baseY + Math.sin(this.time * 4 + obs.phase) * 14;
        if (obs.x < this.width * 0.85 && obs.telegraphTimer > 0) {
          obs.telegraphTimer -= dt;
          if (obs.telegraphTimer <= 0) {
            obs.flashActiveTimer = 0.24;
          }
        }
        if (obs.flashActiveTimer > 0) {
          obs.flashActiveTimer -= dt;
        }
      }

      if (!obs.triggered && obs.x + obs.width < this.playerX) {
        obs.triggered = true;
        this.obstaclesCleared++;
        this.advanceRunMission('obstacles', 1);
      }

      if (obs.shattered) continue;

      const ox = obs.x + 5;
      const oy = obs.y + 5;
      const ow = obs.width - 10;
      let oh = obs.height - 8;

      if (obs.kind === 'paparazzi_drone' && obs.flashActiveTimer > 0) {
        oh += 54;
      }

      const overlaps = px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
      if (overlaps) {
        if (this.twirlTimer > 0 || this.glamFeverTimer > 0) {
          obs.shattered = true;
          this.obstaclesCleared++;
          this.advanceRunMission('obstacles', 1);
          this.addCombo(150, obs.x + obs.width / 2, obs.y, 'DAZZLE!');
          this.hitstopTimer = 0.03;
          this.triggerShake(4, 0.14);
          soundEngine.playShatter();
          this.spawnBurst(obs.x + obs.width / 2, obs.y + obs.height / 2, '#2DD4BF', 10, 'sparkle');
        } else if (this.invulnTimer <= 0) {
          this.handlePlayerHit();
        }
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -120 && !o.shattered);
  }

  private handlePlayerHit(): void {
    if (this.adventureMode === 'relaxed') {
      this.invulnTimer = 1.65;
      this.hitFlashTimer = 0.16;
      this.hitstopTimer = 0.02;
      this.squashX = 1.14;
      this.squashY = 0.88;
      soundEngine.playCutePop();
      this.spawnBurst(
        this.playerX + this.baseWidth / 2,
        this.playerY + this.getCurrentHeight() / 2,
        '#2DD4BF',
        8,
        'sparkle'
      );
      this.addFloatingText(this.playerX + 18, this.playerY - 14, 'GENTLE BREEZE', '#2DD4BF');
      this.emitHud();
      return;
    }

    this.hearts -= 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.invulnTimer = PHYSICS.invulnDuration;
    this.hitFlashTimer = 0.22;
    this.hitstopTimer = 0.05;
    this.triggerShake(7, 0.22);
    this.squashX = 1.2;
    this.squashY = 0.8;
    soundEngine.playHit();
    this.spawnBurst(
      this.playerX + this.baseWidth / 2,
      this.playerY + this.getCurrentHeight() / 2,
      '#F59E0B',
      8,
      'sparkle'
    );

    if (this.hearts <= 0) {
      this.hearts = 0;
      this.stumbleTimer = STUMBLE_DURATION;
      this.slideTimer = 0;
      this.twirlTimer = 0;
      this.invulnTimer = 0;
      this.spawnBurst(this.playerX + 18, this.groundY - 8, '#E0F2FE', 7, 'circle');
      this.addFloatingText(this.playerX + 18, this.playerY - 14, 'STUMBLED!', '#FDE047');
      this.emitHud();
    } else {
      this.addFloatingText(this.playerX + 18, this.playerY - 12, 'POISE -1', '#FB7185');
      this.emitHud();
    }
  }

  private updateCollectibles(dt: number, worldSpeed: number, outfitMagnet: number): void {
    const pcx = this.playerX + this.baseWidth / 2;
    const pcy = this.playerY + this.getCurrentHeight() / 2;
    const magnetRange = this.glamFeverTimer > 0 ? 250 : outfitMagnet;

    for (const item of this.collectibles) {
      if (item.collected) continue;
      item.x -= worldSpeed * dt;
      item.y = item.baseY + Math.sin(this.time * 4.5 + item.phase) * 7;

      const dx = pcx - item.x;
      const dy = pcy - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRange && dist > 1) {
        const pull = 540 * dt;
        item.x += (dx / dist) * pull;
        item.baseY += (dy / dist) * pull;
        item.y = item.baseY;
      }

      if (dist < item.radius + 26) {
        item.collected = true;
        this.collectItem(item);
      }
    }

    this.collectibles = this.collectibles.filter((c) => !c.collected && c.x > -80);
  }

  private collectItem(item: Collectible): void {
    if (item.kind === 'diamond') {
      this.diamondsCollected++;
      this.advanceRunMission('diamonds', 1);
      this.addCombo(50, item.x, item.y);
      soundEngine.playDiamond(this.combo);
      this.spawnBurst(item.x, item.y, '#06B6D4', 8, 'sparkle');
    } else if (item.kind === 'crown') {
      this.crownsCollected++;
      this.addCombo(150, item.x, item.y, '+CROWN');
      soundEngine.playCrown();
      this.spawnBurst(item.x, item.y, '#FBBF24', 12, 'sparkle');
    } else if (item.kind === 'heart') {
      this.hearts = Math.min(this.maxHearts, this.hearts + 1);
      this.addCombo(100, item.x, item.y, '+HEART');
      soundEngine.playHeart();
      this.spawnBurst(item.x, item.y, '#FB7185', 12, 'heart');
    } else if (item.kind === 'wardrobe_box') {
      const outfits: OutfitId[] = ['malibu_skater', 'pop_star', 'starlight_gown'];
      const nextOutfits = outfits.filter((id) => id !== this.activeOutfit);
      this.activeOutfit = nextOutfits[Math.floor(Math.random() * nextOutfits.length)];
      this.maxHearts = 3 + OUTFIT_META[this.activeOutfit].extraMaxHearts;
      this.hearts = Math.min(this.maxHearts, this.hearts);
      this.glamFeverTimer = PHYSICS.glamFeverDuration;
      this.hitstopTimer = 0.04;
      this.addCombo(250, item.x, item.y, 'TIDAL FEVER!');
      soundEngine.playWardrobeBox();
      this.spawnBurst(item.x, item.y, '#2DD4BF', 22, 'confetti');
    }
  }

  private advanceRunMission(kind: RunMission['kind'], amount: number): void {
    if (this.runMission.completed || this.runMission.kind !== kind) return;
    if (kind === 'combos') {
      this.runMission.progress = Math.max(this.runMission.progress, amount);
    } else {
      this.runMission.progress += amount;
    }
    if (this.runMission.progress >= this.runMission.target) {
      this.runMission.progress = this.runMission.target;
      this.runMission.completed = true;
      this.score += 250;
      soundEngine.playCrown();
      this.addFloatingText(this.playerX + 30, this.playerY - 36, 'MISSION +250!', '#FBBF24');
      this.spawnBurst(this.playerX + 20, this.playerY, '#FBBF24', 16, 'confetti');
    }
  }

  private addCombo(basePts: number, x: number, y: number, customLabel?: string): void {
    this.combo = Math.min(25, this.combo + 1);
    this.advanceRunMission('combos', this.combo);
    this.comboTimer = PHYSICS.comboTimeout;
    const mult = this.combo >= 12 ? 5 : this.combo >= 7 ? 3 : this.combo >= 3 ? 2 : 1;
    const pts = basePts * mult;
    this.score += pts;
    if (this.score > this.bestScore) {
      this.bestScore = Math.floor(this.score);
    }
    const label = customLabel ? `${customLabel} +${pts}` : mult > 1 ? `+${pts} x${mult}` : `+${pts}`;
    this.addFloatingText(x, y - 10, label, mult > 1 ? '#FDE047' : '#FFFFFF');
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y,
      vy: -54,
      text,
      color,
      life: 0,
      maxLife: 0.72,
    });
  }

  private triggerShake(magnitude: number, duration: number): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private updateShake(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeMagnitude = 0;
      }
    }
  }

  private spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    shape: Particle['shape']
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 210;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 40,
        5 + Math.random() * 7,
        0.35 + Math.random() * 0.3,
        color,
        shape
      );
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    maxLife: number,
    color: string,
    shape: Particle['shape']
  ): void {
    const slot = this.particles.find((p) => !p.active);
    if (!slot) return;
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.size = size;
    slot.alpha = 1;
    slot.life = 0;
    slot.maxLife = maxLife;
    slot.color = color;
    slot.shape = shape;
    slot.rotation = Math.random() * Math.PI * 2;
    slot.vRot = (Math.random() - 0.5) * 8;
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.rotation += p.vRot * dt;
      p.alpha = 1 - p.life / p.maxLife;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (const ft of this.floatingTexts) {
      ft.life += dt;
      ft.y += ft.vy * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life < ft.maxLife);
  }

  private persistBestScore(): void {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(Math.floor(this.bestScore)));
    } catch {
      // Ignore storage errors
    }
  }

  private emitHud(): void {
    const stage = STAGES[Math.min(this.stageIndex, STAGES.length - 1)];
    const actionInfo = this.getUpcomingObstacleInfo();
    this.callbacks.onHudUpdate({
      score: Math.floor(this.score),
      bestScore: Math.floor(this.bestScore),
      distance: Math.floor(this.totalDistance),
      stageDistance: Math.floor(this.stageDistance),
      stageTargetDistance: stage.targetDistance,
      stageIndex: this.stageIndex,
      stageName: this.endlessMode ? 'Endless Coastal Encore' : stage.name,
      endlessMode: this.endlessMode,
      adventureMode: this.adventureMode,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      combo: this.combo,
      comboTimerRatio: Math.max(0, this.comboTimer / PHYSICS.comboTimeout),
      twirlReadyRatio: Math.max(0, 1 - this.twirlCooldownTimer / PHYSICS.twirlCooldown),
      glamFeverTimer: this.glamFeverTimer,
      activeOutfit: this.activeOutfit,
      diamondsCollected: this.diamondsCollected,
      crownsCollected: this.crownsCollected,
      obstaclesCleared: this.obstaclesCleared,
      perfectCount: this.perfectCount,
      secondWindUsed: this.secondWindUsed,
      runMission: { ...this.runMission },
      recommendedAction: actionInfo.recommendedAction,
      actionWindowActive: actionInfo.actionWindowActive,
      isStumbling: this.stumbleTimer > 0,
    });
  }

  private render(): void {
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMagnitude * 2 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMagnitude * 2 : 0;
    const stumbleProgress =
      this.stumbleTimer > 0 ? 1 - this.stumbleTimer / STUMBLE_DURATION : 0;
    const elimZoom = this.stumbleTimer > 0 ? 1 + Math.sin(stumbleProgress * Math.PI * 0.5) * 0.1 : 1;

    const worldState: RenderWorldState = {
      width: this.width,
      height: this.height,
      groundY: this.groundY,
      scrollDistance: this.stageDistance * 14,
      time: this.time,
      stageIndex: this.stageIndex,
      shakeX,
      shakeY,
      elimZoom,
      player: {
        x: this.playerX,
        y: this.playerY,
        vy: this.playerVy,
        width: this.baseWidth,
        height: this.getCurrentHeight(),
        grounded: this.grounded,
        sliding: this.slideTimer > 0,
        twirling: this.twirlTimer > 0,
        twirlTimer: this.twirlTimer,
        glamFeverTimer: this.glamFeverTimer,
        invulnTimer: this.invulnTimer,
        hitFlashTimer: this.hitFlashTimer,
        stumbling: this.stumbleTimer > 0,
        stumbleProgress,
        slideBlend: this.slideBlend,
        airBlend: this.airBlend,
        rollProgress:
          this.twirlTimer > 0 ? Math.max(0, 1 - this.twirlTimer / PHYSICS.twirlDuration) : 0,
        squashX: this.squashX,
        squashY: this.squashY,
        runCycle: this.runCycle,
        style: this.style,
        activeOutfit: this.activeOutfit,
        accessoryId: this.equippedAccessory,
        bagId: this.equippedBag,
        shoesId: this.equippedShoes,
      },
      obstacles: this.obstacles,
      collectibles: this.collectibles,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
    };

    renderWorld(this.ctx, worldState);
  }
}
