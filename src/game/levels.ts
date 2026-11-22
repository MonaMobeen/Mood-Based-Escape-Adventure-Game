import type { OutfitId } from './types';

export type LevelModeType =
  | 'messy_room'
  | 'closet_hunt'
  | 'jewelry_hunt'
  | 'makeup_mystery'
  | 'memory_challenge'
  | 'dream_room'
  | 'running'
  | 'makeover'
  | 'shopping'
  | 'mystery'
  | 'smart_organizer';

export interface ChapterDef {
  id: number;
  name: string;
  subtitle: string;
  themeColor: string;
  bgTint: string;
  startLevel: number;
  endLevel: number;
}

export interface GameLevelDef {
  levelNumber: number;
  chapterId: number;
  title: string;
  mode: LevelModeType;
  objectiveText: string;
  modifierLabel: string;
  timeLimitSec: number;
  itemCount: number;
  targetScore: number;
  targetDistance: number;
  budgetCap: number;
  recommendedOutfit: OutfitId;
  rewardCoins: number;
  rewardCredits: number;
  rewardXp: number;
  limitedCapacity?: number;
  clutterCount?: number;
}

export const CHAPTERS: ChapterDef[] = [
  { id: 1, name: 'Emerald Cove Bedroom', subtitle: 'Messy room hidden object hunts, tidying & boardwalk sprints', themeColor: '#0F766E', bgTint: '#F0FDFA', startLevel: 1, endLevel: 30 },
  { id: 2, name: 'Ocean Breeze Vanity Loft', subtitle: 'Makeup mysteries, timed beauty sorting & coastal shopping', themeColor: '#0284C7', bgTint: '#F0F9FF', startLevel: 31, endLevel: 60 },
  { id: 3, name: 'Coastal Dressing Wing', subtitle: 'Overflowing closet hunts, runway dashes & tight storage', themeColor: '#0D9488', bgTint: '#ECFEFF', startLevel: 61, endLevel: 90 },
  { id: 4, name: 'Boardwalk Boutique', subtitle: 'Smart budget shopping, jewelry hunts & makeover rush', themeColor: '#D97706', bgTint: '#FFFBEB', startLevel: 91, endLevel: 120 },
  { id: 5, name: 'Turquoise Pop Studio', subtitle: 'Memory search challenges, concert styling & fast drones', themeColor: '#0369A1', bgTint: '#E0F2FE', startLevel: 121, endLevel: 150 },
  { id: 6, name: 'Seafoam Terrace Lounge', subtitle: 'Dense clutter rooms, multi-zone combos & precision hunts', themeColor: '#059669', bgTint: '#ECFDF5', startLevel: 151, endLevel: 180 },
  { id: 7, name: 'Coral Pearl Vault', subtitle: 'Couture matching, rare jewelry hunts & gala sprints', themeColor: '#0F766E', bgTint: '#F0FDFA', startLevel: 181, endLevel: 210 },
  { id: 8, name: 'Midnight Ocean Penthouse', subtitle: 'Grandmaster Dreamhouse searches for true coastal icons', themeColor: '#134E4A', bgTint: '#CCFBF1', startLevel: 211, endLevel: 240 },
];

const MODE_ROTATION: LevelModeType[] = [
  'messy_room',
  'running',
  'closet_hunt',
  'dream_room',
  'jewelry_hunt',
  'smart_organizer',
  'makeup_mystery',
  'makeover',
  'memory_challenge',
  'shopping',
];

const ROOM_TITLES = [
  'Morning Closet Refresh',
  'Vanity Mirror Reset',
  'Beach Bag Unpack',
  'Shoe Rack Symmetry',
  'Evening Gown Sort',
  'Skincare Shelf Glow',
  'Study Desk Revival',
  'Weekend Trunk Pack',
  'Boutique Haul Sort',
  'Gala Prep Blitz',
];

const MODIFIERS = [
  'Classic Search',
  'Beat the Clock',
  '2x Streak Bonus',
  'Hidden Under Clutter',
  'Precision Moves',
  'Starlight Rush',
];

export function getLevelDef(levelNumber: number): GameLevelDef {
  const clamped = Math.max(1, Math.min(240, levelNumber));
  const chapterIdx = Math.floor((clamped - 1) / 30);
  const chapter = CHAPTERS[chapterIdx];
  const localIdx = (clamped - 1) % 30;
  const mode = MODE_ROTATION[localIdx % MODE_ROTATION.length];
  const difficulty = (clamped - 1) / 239;

  const itemCount = Math.min(14, 6 + Math.floor(clamped / 28) + (localIdx % 3));
  const searchTargets = Math.min(10, 4 + Math.floor(clamped / 35) + (localIdx % 2));
  const clutterCount = Math.min(115, 42 + Math.floor(difficulty * 70));
  const timeLimitSec = Math.max(38, Math.round(78 - difficulty * 24 + itemCount * 1.6));
  const targetDistance = Math.round(320 + clamped * 4.5);
  const targetScore = Math.round(900 + clamped * 35);
  const budgetCap = Math.round(340 + (clamped % 5) * 70 + chapterIdx * 30);

  const modifierLabel =
    mode === 'dream_room' && localIdx % 4 === 3
      ? 'Tight Storage Cap'
      : MODIFIERS[(clamped + chapterIdx) % MODIFIERS.length];

  const outfits: OutfitId[] = ['malibu_skater', 'pop_star', 'starlight_gown'];
  const recommendedOutfit = outfits[clamped % outfits.length];

  let title = '';
  let objectiveText = '';

  switch (mode) {
    case 'messy_room':
      title = `Messy Room Search #${clamped}`;
      objectiveText = `Explore the messy room (${clutterCount} scattered objects) and find ${searchTargets} hidden treasures!`;
      break;
    case 'closet_hunt':
      title = `Closet Hunt #${clamped}`;
      objectiveText = `Search Barbie's overflowing wardrobe to locate ${searchTargets} dresses, shoes & bags.`;
      break;
    case 'jewelry_hunt':
      title = `Jewelry Hunt #${clamped}`;
      objectiveText = `Spot ${searchTargets} hidden necklaces, earrings, rings & tiaras tucked among vanity clutter.`;
      break;
    case 'makeup_mystery':
      title = `Makeup Mystery #${clamped}`;
      objectiveText = `Find ${searchTargets} missing lipsticks, perfumes & palettes on the crowded beauty counter.`;
      break;
    case 'memory_challenge':
      title = `Memory Search #${clamped}`;
      objectiveText = `Memorize ${Math.min(6, searchTargets)} glowing item spots before clutter covers them!`;
      break;
    case 'dream_room':
      title = `${ROOM_TITLES[clamped % ROOM_TITLES.length]} #${clamped}`;
      objectiveText =
        modifierLabel === 'Tight Storage Cap'
          ? `Sort ${itemCount} items cleanly before storage bins lock in ${timeLimitSec}s.`
          : `Drag & sort all ${itemCount} Dream Room items into their matching zones within ${timeLimitSec}s.`;
      break;
    case 'running':
      title = `Runway Sprint ${clamped}`;
      objectiveText = `Dash ${targetDistance}m across the Malibu runway and hit ${targetScore.toLocaleString()} pts!`;
      break;
    case 'smart_organizer':
      title = `Smart Dream Audit ${clamped}`;
      objectiveText = `Solve Barbie's personalized organization puzzle with high move efficiency.`;
      break;
    case 'makeover':
      title = `Style Makeover ${clamped}`;
      objectiveText = `Craft a ${80 + Math.min(15, Math.floor(clamped / 16))}+ match look for Barbie's upcoming event.`;
      break;
    case 'shopping':
      title = `Boutique Budget ${clamped}`;
      objectiveText = `Complete the 3-item shopping list within ${budgetCap} Coins without overspending.`;
      break;
    case 'mystery':
      title = `Dreamhouse Mystery ${clamped}`;
      objectiveText = `Spot ${Math.min(8, 4 + Math.floor(clamped / 45))} hidden keepsakes before time runs out.`;
      break;
  }

  return {
    levelNumber: clamped,
    chapterId: chapter.id,
    title,
    mode,
    objectiveText,
    modifierLabel,
    timeLimitSec,
    itemCount: mode.includes('room') || mode.includes('hunt') || mode.includes('mystery') || mode === 'memory_challenge' ? searchTargets : itemCount,
    targetScore,
    targetDistance,
    budgetCap,
    recommendedOutfit,
    rewardCoins: Math.round(65 + clamped * 1.4),
    rewardCredits: Math.round(15 + Math.floor(clamped / 6) * 2),
    rewardXp: Math.round(45 + clamped * 1.2),
    limitedCapacity: modifierLabel === 'Tight Storage Cap' ? Math.max(3, Math.ceil(itemCount / 3)) : undefined,
    clutterCount,
  };
}

export function getChapterLevels(chapterId: number): GameLevelDef[] {
  const chapter = CHAPTERS.find((c) => c.id === chapterId) || CHAPTERS[0];
  const list: GameLevelDef[] = [];
  for (let n = chapter.startLevel; n <= chapter.endLevel; n++) {
    list.push(getLevelDef(n));
  }
  return list;
}
