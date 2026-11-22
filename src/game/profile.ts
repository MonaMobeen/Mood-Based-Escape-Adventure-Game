import { DEFAULT_STYLE } from './constants';
import type { ItemCategory } from './catalog';
import type { CharacterStyle } from './types';

export const SAVE_STORAGE_KEY = 'barbie_malibu_world_save_v1';
export const SAVE_BACKUP_KEY = 'coastal_runway_backup_v1';
const LEGACY_BEST_KEY = 'barbie_malibu_runway_best_v1';
export const CURRENT_SAVE_SCHEMA_VERSION = 2;

export interface SavedLook {
  id: string;
  name: string;
  style: CharacterStyle;
  accessoryId: string | null;
  bagId: string | null;
  shoesId?: string | null;
  score: number;
  createdAt: number;
}

export interface DailyMissionProgress {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardCredits: number;
  claimed: boolean;
}

export interface WeeklyChallengeProgress {
  weekKey: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardCredits: number;
  claimed: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  check: (save: PlayerSaveData) => boolean;
}

export interface CategoryStats {
  correct: number;
  mistakes: number;
}

export interface CommercialState {
  adFree: boolean;
  vipPass: boolean;
  ownedBundles: string[];
  adsWatchedToday: number;
  lastAdDate: string;
  runsSinceShowcase: number;
  interstitialOptIn: boolean;
}

export interface SeasonalEventState {
  eventId: string;
  tokens: number;
  claimedTiers: number[];
}

export type FavoriteWorldId = 'peaceful' | 'discovery' | 'satisfying' | 'adventure' | 'fashion';
export type PeacefulWeatherId = 'morning' | 'rain' | 'sunset' | 'night';

export interface PeacefulFlowerBed {
  slot: number;
  flowerId: string;
  growth: 1 | 2 | 3;
}

export interface PeacefulWorldSave {
  unlockedSanctuaries: string[];
  activeSanctuary: string;
  weather: PeacefulWeatherId;
  flowersPlanted: PeacefulFlowerBed[];
  placedDecorIds: string[];
  flowersCollected: number;
  flowerCollectionIds: string[];
}

export interface PlayerSaveData {
  schemaVersion?: number;
  playerName: string;
  avatarBadge: 'crown' | 'heart' | 'star' | 'butterfly';
  favoriteWorld?: FavoriteWorldId;
  coins: number;
  credits: number;
  xp: number;
  hintsBalance: number;
  bestRunScore: number;
  highestUnlockedLevel: number;
  levelStars: Record<number, number>; // levelNumber -> 1..3 stars
  style: CharacterStyle;
  equippedAccessory: string | null;
  equippedBag: string | null;
  equippedShoes?: string | null;
  unlockedBoutiqueIds: string[];
  unlockedRoomThemes: string[];
  activeRoomTheme: string;
  unlockedSearchRooms: string[];
  activeSearchRoom: string;
  tutorialsCompleted: {
    roomSearch: boolean;
    running: boolean;
  };
  savedLooks: SavedLook[];
  peacefulWorld?: PeacefulWorldSave;
  satisfiedActivitiesCompleted?: string[];

  // Daily / Weekly / Chests / Spin / Seasonal
  lastLoginDate: string;
  loginStreak: number;
  dailyClaimedToday: boolean;
  lastSpinDate: string;
  bonusSpins: number;
  claimedChests: number[];
  claimedAchievements: string[];
  dailyMissionsDate: string;
  dailyMissions: DailyMissionProgress[];
  weeklyChallenge: WeeklyChallengeProgress;
  seasonalEvent: SeasonalEventState;

  // Fair Commercialization & Store
  commercial: CommercialState;

  // Telemetry for Smart Dream Organizer & Search Adventure
  itemsOrganizedTotal: number;
  hiddenObjectsFoundTotal: number;
  searchLevelsCleared: number;
  smartPuzzlesSolved: number;
  makeoversCompleted: number;
  mysteriesSolved: number;
  shoppingTripsCompleted: number;
  runsCompleted: number;
  totalRunDistance: number;
  categoryStats: Record<ItemCategory, CategoryStats>;

  // Accessibility & Audio Settings
  settings: {
    sfxEnabled: boolean;
    musicEnabled: boolean;
    musicVolume: number;
    ambienceEnabled: boolean;
    ambienceVolume: number;
    ambienceMode?: 'ocean' | 'rain';
    noPressureMode?: boolean;
    highContrastHints: boolean;
    reducedMotion: boolean;
  };
}

export interface StoreBundleDef {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  badge: string;
  creditsCost: number;
  usdDisplay: string;
  grantCoins: number;
  grantCredits: number;
  grantHints: number;
  grantAdFree?: boolean;
  grantVip?: boolean;
  accent: string;
}

export const STORE_BUNDLES: StoreBundleDef[] = [
  {
    id: 'emerald_starter',
    sku: 'com.coastal.dreamhouse.emerald_pack',
    name: 'Emerald Tide Starter Pack',
    subtitle: 'Boost your coastal wardrobe with Coins, Credits & Search Hints.',
    badge: 'Best Value',
    creditsCost: 85,
    usdDisplay: '$1.99',
    grantCoins: 600,
    grantCredits: 40,
    grantHints: 6,
    accent: '#0D9488',
  },
  {
    id: 'ad_free_pass',
    sku: 'com.coastal.dreamhouse.ad_free',
    name: 'Ad-Free Coastal Pass',
    subtitle: 'Removes optional post-run showcase breaks permanently + bonus Hints.',
    badge: 'No Breaks',
    creditsCost: 140,
    usdDisplay: '$2.99',
    grantCoins: 350,
    grantCredits: 0,
    grantHints: 5,
    grantAdFree: true,
    accent: '#0284C7',
  },
  {
    id: 'vip_coastal_club',
    sku: 'com.coastal.dreamhouse.vip_club',
    name: 'Ocean Club VIP Pass',
    subtitle: 'Ad-Free +25% Bonus Coins on completions, +1,200 Coins & 10 Hints.',
    badge: 'VIP Tier',
    creditsCost: 240,
    usdDisplay: '$4.99',
    grantCoins: 1200,
    grantCredits: 80,
    grantHints: 10,
    grantAdFree: true,
    grantVip: true,
    accent: '#0F766E',
  },
];

export const SEASONAL_TIERS = [
  { tier: 1, tokens: 30, label: 'Seafoam Chest', coins: 200, credits: 30 },
  { tier: 2, tokens: 75, label: 'Coral Reef Box', coins: 400, credits: 60 },
  { tier: 3, tokens: 140, label: 'Emerald Crown Vault', coins: 850, credits: 120 },
];

export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function getPlayerLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  let level = 1;
  let remaining = Math.max(0, xp);
  let needed = 120;
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = Math.round(120 + (level - 1) * 45);
  }
  return { level, currentLevelXp: remaining, nextLevelXp: needed };
}

export function buildDailyMissions(): DailyMissionProgress[] {
  return [
    { id: 'search_8', title: 'Find 8 hidden objects in Messy Room', target: 8, current: 0, rewardCoins: 150, rewardCredits: 30, claimed: false },
    { id: 'sort_12', title: 'Organize 12 Dream Room items', target: 12, current: 0, rewardCoins: 140, rewardCredits: 25, claimed: false },
    { id: 'run_400', title: 'Dash 400m in Running Adventure', target: 400, current: 0, rewardCoins: 160, rewardCredits: 30, claimed: false },
    { id: 'smart_1', title: 'Complete a Smart Dream Organizer challenge', target: 1, current: 0, rewardCoins: 180, rewardCredits: 35, claimed: false },
    { id: 'style_1', title: 'Create a Makeover or Fashion Look', target: 1, current: 0, rewardCoins: 130, rewardCredits: 20, claimed: false },
  ];
}

export function buildWeeklyChallenge(): WeeklyChallengeProgress {
  return {
    weekKey: getWeekKey(),
    title: 'Weekly Coastal Tour: Complete 12 levels or runs',
    target: 12,
    current: 0,
    rewardCoins: 650,
    rewardCredits: 110,
    claimed: false,
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_search', title: 'Sharp-Eyed Stylist', description: 'Find 15 hidden objects in messy rooms', rewardCredits: 35, check: (s) => s.hiddenObjectsFoundTotal >= 15 },
  { id: 'master_detective', title: 'Dreamhouse Detective', description: 'Find 60 hidden objects across search adventures', rewardCredits: 85, check: (s) => s.hiddenObjectsFoundTotal >= 60 },
  { id: 'first_tidy', title: 'Sparkle Starter', description: 'Organize 15 items in Dream Room', rewardCredits: 30, check: (s) => s.itemsOrganizedTotal >= 15 },
  { id: 'tidy_pro', title: 'Dreamhouse Curator', description: 'Organize 80 items across any rooms', rewardCredits: 80, check: (s) => s.itemsOrganizedTotal >= 80 },
  { id: 'runway_star', title: 'Boardwalk Sprinter', description: 'Run a total of 1,500m in Runway Dash', rewardCredits: 50, check: (s) => s.totalRunDistance >= 1500 },
  { id: 'high_scorer', title: 'Coastal Icon', description: 'Reach 5,000+ best score in Runway Dash', rewardCredits: 90, check: (s) => s.bestRunScore >= 5000 },
  { id: 'smart_brain', title: 'Smart Organizer', description: 'Solve 3 Smart Dream Organizer puzzles', rewardCredits: 65, check: (s) => s.smartPuzzlesSolved >= 3 },
  { id: 'boutique_vip', title: 'Boutique VIP', description: 'Unlock 4 Boutique items', rewardCredits: 70, check: (s) => s.unlockedBoutiqueIds.length >= 4 },
  { id: 'star_collector', title: 'Emerald Star Collector', description: 'Earn 25 total Level Stars', rewardCredits: 100, check: (s) => Object.values(s.levelStars).reduce((a, b) => a + b, 0) >= 25 },
  { id: 'glam_stylist', title: 'Runway Stylist', description: 'Complete 3 Makeover challenges', rewardCredits: 60, check: (s) => s.makeoversCompleted >= 3 },
  { id: 'peaceful_gardener', title: 'Sanctuary Gardener', description: 'Harvest 5 blooms in Peaceful World', rewardCredits: 45, check: (s) => (s.peacefulWorld?.flowersCollected ?? 0) >= 5 },
  { id: 'flower_collector', title: 'Botanical Collector', description: 'Discover 3 unique flower species', rewardCredits: 55, check: (s) => (s.peacefulWorld?.flowerCollectionIds?.length ?? 0) >= 3 },
  { id: 'five_worlds_explorer', title: 'Little Escape Explorer', description: 'Organize, search, run & garden across worlds', rewardCredits: 80, check: (s) => (s.peacefulWorld?.flowersCollected ?? 0) >= 1 && s.hiddenObjectsFoundTotal >= 5 && s.itemsOrganizedTotal >= 5 && s.runsCompleted >= 1 },
];

export const CHEST_MILESTONES = [
  { stars: 10, label: 'Seafoam Pearl Chest', coins: 220, credits: 45, xp: 90 },
  { stars: 30, label: 'Ocean Breeze Chest', coins: 400, credits: 80, xp: 160 },
  { stars: 65, label: 'Emerald Gold Chest', coins: 650, credits: 130, xp: 240 },
  { stars: 120, label: 'Turquoise Vault Chest', coins: 1100, credits: 220, xp: 400 },
];

export function createInitialSave(): PlayerSaveData {
  let legacyBest = 0;
  try {
    const raw = localStorage.getItem(LEGACY_BEST_KEY);
    if (raw) legacyBest = parseInt(raw, 10) || 0;
  } catch {
    // ignore
  }

  const today = getTodayKey();
  return {
    playerName: 'Coastal Star',
    avatarBadge: 'crown',
    favoriteWorld: 'peaceful',
    coins: 350,
    credits: 60,
    xp: 0,
    hintsBalance: 5,
    bestRunScore: legacyBest,
    highestUnlockedLevel: 1,
    levelStars: {},
    style: { ...DEFAULT_STYLE },
    equippedAccessory: null,
    equippedBag: null,
    equippedShoes: null,
    unlockedBoutiqueIds: [],
    unlockedRoomThemes: ['ocean_breeze', 'malibu_blush'],
    activeRoomTheme: 'ocean_breeze',
    unlockedSearchRooms: ['bedroom', 'beach_house'],
    activeSearchRoom: 'bedroom',
    tutorialsCompleted: {
      roomSearch: false,
      running: false,
    },
    savedLooks: [],
    peacefulWorld: {
      unlockedSanctuaries: ['waterfall_garden', 'dream_island'],
      activeSanctuary: 'waterfall_garden',
      weather: 'morning',
      flowersPlanted: [
        { slot: 0, flowerId: 'lavender_sprig', growth: 2 },
        { slot: 1, flowerId: 'seafoam_lotus', growth: 3 },
        { slot: 2, flowerId: 'sunlit_sunflower', growth: 1 },
      ],
      placedDecorIds: ['timber_bench', 'stone_lantern'],
      flowersCollected: 0,
      flowerCollectionIds: [],
    },
    satisfiedActivitiesCompleted: [],
    lastLoginDate: '',
    loginStreak: 1,
    dailyClaimedToday: false,
    lastSpinDate: '',
    bonusSpins: 1,
    claimedChests: [],
    claimedAchievements: [],
    dailyMissionsDate: today,
    dailyMissions: buildDailyMissions(),
    weeklyChallenge: buildWeeklyChallenge(),
    seasonalEvent: {
      eventId: 'emerald_tide_festival',
      tokens: 0,
      claimedTiers: [],
    },
    commercial: {
      adFree: false,
      vipPass: false,
      ownedBundles: [],
      adsWatchedToday: 0,
      lastAdDate: today,
      runsSinceShowcase: 0,
      interstitialOptIn: true,
    },
    itemsOrganizedTotal: 0,
    hiddenObjectsFoundTotal: 0,
    searchLevelsCleared: 0,
    smartPuzzlesSolved: 0,
    makeoversCompleted: 0,
    mysteriesSolved: 0,
    shoppingTripsCompleted: 0,
    runsCompleted: 0,
    totalRunDistance: 0,
    categoryStats: {
      wardrobe: { correct: 0, mistakes: 0 },
      beauty: { correct: 0, mistakes: 0 },
      study: { correct: 0, mistakes: 0 },
      decor: { correct: 0, mistakes: 0 },
    },
    settings: {
      sfxEnabled: true,
      musicEnabled: false,
      musicVolume: 0.35,
      ambienceEnabled: false,
      ambienceVolume: 0.28,
      ambienceMode: 'ocean',
      noPressureMode: false,
      highContrastHints: false,
      reducedMotion: false,
    },
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
  };
}

function mergeWithFreshSave(fresh: PlayerSaveData, parsed: Partial<PlayerSaveData>): PlayerSaveData {
  const today = getTodayKey();
  const weekKey = getWeekKey();

  const merged: PlayerSaveData = {
    ...fresh,
    ...parsed,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    style: { ...fresh.style, ...(parsed.style || {}) },
    settings: { ...fresh.settings, ...(parsed.settings || {}) },
    tutorialsCompleted: { ...fresh.tutorialsCompleted, ...(parsed.tutorialsCompleted || {}) },
    peacefulWorld: {
      ...fresh.peacefulWorld!,
      ...(parsed.peacefulWorld || {}),
      unlockedSanctuaries: Array.from(
        new Set([
          ...(parsed.peacefulWorld?.unlockedSanctuaries || []),
          'waterfall_garden',
          'dream_island',
        ])
      ),
    },
    satisfiedActivitiesCompleted: parsed.satisfiedActivitiesCompleted ?? fresh.satisfiedActivitiesCompleted,
    weeklyChallenge: {
      ...fresh.weeklyChallenge,
      ...(parsed.weeklyChallenge || {}),
    },
    seasonalEvent: {
      ...fresh.seasonalEvent,
      ...(parsed.seasonalEvent || {}),
    },
    commercial: {
      ...fresh.commercial,
      ...(parsed.commercial || {}),
    },
    unlockedRoomThemes: Array.from(
      new Set([...(parsed.unlockedRoomThemes || []), 'ocean_breeze'])
    ),
    unlockedSearchRooms: Array.from(
      new Set([...(parsed.unlockedSearchRooms || []), 'bedroom', 'beach_house'])
    ),
    categoryStats: {
      wardrobe: { ...fresh.categoryStats.wardrobe, ...(parsed.categoryStats?.wardrobe || {}) },
      beauty: { ...fresh.categoryStats.beauty, ...(parsed.categoryStats?.beauty || {}) },
      study: { ...fresh.categoryStats.study, ...(parsed.categoryStats?.study || {}) },
      decor: { ...fresh.categoryStats.decor, ...(parsed.categoryStats?.decor || {}) },
    },
  };

  if (merged.dailyMissionsDate !== today) {
    merged.dailyMissionsDate = today;
    merged.dailyMissions = buildDailyMissions();
    merged.dailyClaimedToday = false;
    if (merged.lastLoginDate && merged.lastLoginDate !== today) {
      merged.loginStreak = Math.min(7, (merged.loginStreak || 0) + 1);
    }
  }

  if (merged.weeklyChallenge.weekKey !== weekKey) {
    merged.weeklyChallenge = buildWeeklyChallenge();
  }

  if (merged.commercial.lastAdDate !== today) {
    merged.commercial.lastAdDate = today;
    merged.commercial.adsWatchedToday = 0;
  }

  return merged;
}

export function loadPlayerSave(): PlayerSaveData {
  const fresh = createInitialSave();
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
      if (backupRaw) {
        const backupParsed = JSON.parse(backupRaw) as Partial<PlayerSaveData>;
        return mergeWithFreshSave(fresh, backupParsed);
      }
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    if ((parsed.schemaVersion ?? 1) < CURRENT_SAVE_SCHEMA_VERSION) {
      try {
        localStorage.setItem(SAVE_BACKUP_KEY, raw);
      } catch {
        // Ignore backup quota errors
      }
    }
    return mergeWithFreshSave(fresh, parsed);
  } catch {
    try {
      const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
      if (backupRaw) {
        const backupParsed = JSON.parse(backupRaw) as Partial<PlayerSaveData>;
        return mergeWithFreshSave(fresh, backupParsed);
      }
    } catch {
      // Ignore corrupt backup
    }
    return fresh;
  }
}

export function restoreBackupSave(): PlayerSaveData | null {
  try {
    const backupRaw = localStorage.getItem(SAVE_BACKUP_KEY);
    if (!backupRaw) return null;
    const parsed = JSON.parse(backupRaw) as Partial<PlayerSaveData>;
    const restored = mergeWithFreshSave(createInitialSave(), parsed);
    savePlayerData(restored);
    return restored;
  } catch {
    return null;
  }
}

export function savePlayerData(data: PlayerSaveData): void {
  try {
    const stamped = { ...data, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION };
    const serialized = JSON.stringify(stamped);
    localStorage.setItem(SAVE_STORAGE_KEY, serialized);
    localStorage.setItem(SAVE_BACKUP_KEY, serialized);
    localStorage.setItem(LEGACY_BEST_KEY, String(Math.floor(data.bestRunScore)));
  } catch {
    // Ignore storage quota errors
  }
}

export function getTotalStars(save: PlayerSaveData): number {
  return Object.values(save.levelStars).reduce((acc, s) => acc + s, 0);
}

export function getCrossWorldFloraCount(save: PlayerSaveData): number {
  return save.peacefulWorld?.flowersCollected ?? 0;
}

export function getWeakestCategory(save: PlayerSaveData): ItemCategory {
  const entries = Object.entries(save.categoryStats) as [ItemCategory, CategoryStats][];
  let worst: ItemCategory = 'beauty';
  let worstScore = -Infinity;
  for (const [cat, stat] of entries) {
    const score = stat.mistakes * 2 - stat.correct * 0.2;
    if (score > worstScore) {
      worstScore = score;
      worst = cat;
    }
  }
  return worst;
}
