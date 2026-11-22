export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'VICTORY'
  | 'GAME_OVER';

export type OutfitId = 'malibu_skater' | 'pop_star' | 'starlight_gown';
export type HairStyleId = 'blonde_wave' | 'brunette_sleek' | 'rose_curl';
export type SidekickId = 'none' | 'puppy' | 'cockatoo';
export type UnifiedActionKind = 'jump' | 'slide' | 'roll';

export interface CharacterStyle {
  outfit: OutfitId;
  hair: HairStyleId;
  sidekick: SidekickId;
}

export type ObstacleKind =
  | 'velvet_rope'
  | 'hatbox_stack'
  | 'boom_spotlight'
  | 'paparazzi_drone'
  | 'runway_cart';

export type CollectibleKind = 'diamond' | 'crown' | 'heart' | 'wardrobe_box';

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
  speedOffset: number;
  baseY: number;
  phase: number;
  // Windup / telegraph timers (e.g., paparazzi flash or cart warning)
  telegraphTimer: number;
  flashActiveTimer: number;
  triggered: boolean;
  shattered: boolean;
}

export interface Collectible {
  id: number;
  kind: CollectibleKind;
  x: number;
  y: number;
  baseY: number;
  radius: number;
  phase: number;
  collected: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  shape: 'sparkle' | 'circle' | 'heart' | 'confetti';
  rotation: number;
  vRot: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export type AdventureExperienceMode = 'adventure' | 'relaxed';

export type StageVisualBiome =
  | 'ocean_road'
  | 'colorful_city'
  | 'magical_forest'
  | 'fantasy_island'
  | 'mountain_trail'
  | 'dreamy_night';

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  biome: StageVisualBiome;
  targetDistance: number;
  baseSpeed: number;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunColor: string;
  oceanColor: string;
  groundTop: string;
  groundTrim: string;
  groundBody: string;
  accentColor: string;
  isEvening: boolean;
}

export interface RunMission {
  id: string;
  label: string;
  kind: 'diamonds' | 'obstacles' | 'combos' | 'perfects';
  target: number;
  progress: number;
  completed: boolean;
}

export interface HudSnapshot {
  score: number;
  bestScore: number;
  distance: number;
  stageDistance: number;
  stageTargetDistance: number;
  stageIndex: number;
  stageName: string;
  endlessMode: boolean;
  adventureMode: AdventureExperienceMode;
  hearts: number;
  maxHearts: number;
  combo: number;
  comboTimerRatio: number;
  twirlReadyRatio: number;
  glamFeverTimer: number;
  activeOutfit: OutfitId;
  diamondsCollected: number;
  crownsCollected: number;
  obstaclesCleared: number;
  perfectCount: number;
  secondWindUsed: boolean;
  runMission: RunMission;
  recommendedAction: UnifiedActionKind;
  actionWindowActive: boolean;
  isStumbling: boolean;
}
