import { ROOM_ITEMS, STORAGE_ZONES, type ItemCategory, type RoomItemDef, type StorageZoneId } from './catalog';
import { getWeakestCategory, type PlayerSaveData } from './profile';

export type SmartChallengeType = 'misplaced' | 'duplicate' | 'outfit_match' | 'limited_space';

export interface SmartMisplacedSlot {
  uid: string;
  item: RoomItemDef;
  currentZone: StorageZoneId;
  fixed: boolean;
}

export interface SmartDuplicateSlot {
  uid: string;
  item: RoomItemDef;
  isDuplicate: boolean;
  boxed: boolean;
}

export interface SmartMatchChallenge {
  occasion: string;
  outfitName: string;
  targetItemIds: string[];
  pool: RoomItemDef[];
}

export interface SmartChallengePayload {
  type: SmartChallengeType;
  title: string;
  aiInsight: string;
  instruction: string;
  parMoves: number;
  maxMoves: number;
  weakCategory: ItemCategory;
  misplacedSlots?: SmartMisplacedSlot[];
  duplicateSlots?: SmartDuplicateSlot[];
  matchChallenge?: SmartMatchChallenge;
  limitedItems?: RoomItemDef[];
  zoneCapacity?: number;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generatePersonalizedChallenge(
  save: PlayerSaveData,
  forcedIndex?: number
): SmartChallengePayload {
  const weakCategory = getWeakestCategory(save);
  const weakZone = STORAGE_ZONES.find((z) =>
    ROOM_ITEMS.some((it) => it.category === weakCategory && it.targetZone === z.id)
  ) || STORAGE_ZONES[0];

  const types: SmartChallengeType[] = ['misplaced', 'duplicate', 'outfit_match', 'limited_space'];
  const idx = forcedIndex !== undefined ? forcedIndex % types.length : save.smartPuzzlesSolved % types.length;
  const type = types[idx];

  const weakMistakes = save.categoryStats[weakCategory].mistakes;
  const insightBase =
    weakMistakes > 0
      ? `Dream Organizer noticed ${weakMistakes} recent mix-ups in ${weakZone.label} items — this challenge sharpens your eye there.`
      : `Based on your ${save.style.outfit.replace('_', ' ')} look and ${save.itemsOrganizedTotal} organized items, here is a custom efficiency puzzle.`;

  if (type === 'misplaced') {
    const prioritized = [
      ...ROOM_ITEMS.filter((i) => i.category === weakCategory),
      ...shuffle(ROOM_ITEMS.filter((i) => i.category !== weakCategory)),
    ].slice(0, 8);

    const misplacedIndices = new Set([0, 2, 4, 6]);
    const slots: SmartMisplacedSlot[] = prioritized.map((item, i) => {
      if (misplacedIndices.has(i)) {
        const wrongZones = STORAGE_ZONES.map((z) => z.id).filter((id) => id !== item.targetZone);
        const wrongZone = wrongZones[i % wrongZones.length];
        return { uid: `mp_${i}_${item.id}`, item, currentZone: wrongZone, fixed: false };
      }
      return { uid: `mp_${i}_${item.id}`, item, currentZone: item.targetZone, fixed: true };
    });

    return {
      type: 'misplaced',
      title: 'Spot the Misplaced Treasures',
      aiInsight: insightBase,
      instruction: '4 items are stored in the wrong Dreamhouse zones. Tap or drag each misplaced item to its rightful home!',
      parMoves: 4,
      maxMoves: 8,
      weakCategory,
      misplacedSlots: slots,
    };
  }

  if (type === 'duplicate') {
    const basePool = shuffle(ROOM_ITEMS).slice(0, 5);
    const duplicates = basePool.slice(0, 3);
    const combined = shuffle([
      ...basePool.map((item, i) => ({ uid: `dup_orig_${i}`, item, isDuplicate: false, boxed: false })),
      ...duplicates.map((item, i) => ({ uid: `dup_extra_${i}`, item, isDuplicate: true, boxed: false })),
    ]);

    return {
      type: 'duplicate',
      title: 'Wardrobe Duplicate Audit',
      aiInsight: insightBase,
      instruction: 'Find and pack the 3 duplicate items into the Donation Box without removing unique pieces.',
      parMoves: 3,
      maxMoves: 6,
      weakCategory,
      duplicateSlots: combined,
    };
  }

  if (type === 'outfit_match') {
    const presets: SmartMatchChallenge[] = [
      {
        occasion: 'Sunset Boardwalk Skate',
        outfitName: 'Malibu Skater',
        targetItemIds: ['roller_kicks', 'heart_shades', 'malibu_tote'],
        pool: [],
      },
      {
        occasion: 'Starlight Gala Red Carpet',
        outfitName: 'Starlight Gown',
        targetItemIds: ['silk_gown', 'crystal_heels', 'pearl_choker'],
        pool: [],
      },
      {
        occasion: 'Beverly Pop-Star Backstage',
        outfitName: 'Pop Star',
        targetItemIds: ['velvet_lip', 'glam_palette', 'rose_perfume'],
        pool: [],
      },
    ];
    const picked = presets[save.smartPuzzlesSolved % presets.length];
    const targetDefs = ROOM_ITEMS.filter((i) => picked.targetItemIds.includes(i.id));
    const decoys = shuffle(ROOM_ITEMS.filter((i) => !picked.targetItemIds.includes(i.id))).slice(0, 5);

    return {
      type: 'outfit_match',
      title: 'Smart Outfit-Accessory Match',
      aiInsight: insightBase,
      instruction: `Pick the 3 exact items that complete Barbie's "${picked.occasion}" look.`,
      parMoves: 3,
      maxMoves: 6,
      weakCategory,
      matchChallenge: {
        ...picked,
        pool: shuffle([...targetDefs, ...decoys]),
      },
    };
  }

  // limited_space
  const subset = shuffle(ROOM_ITEMS).slice(0, 8);
  return {
    type: 'limited_space',
    title: 'Compact Storage Blitz',
    aiInsight: insightBase,
    instruction: 'Organize all 8 items into zones while respecting the 3-item capacity limit per bin (extra items go to Deco Overflow)!',
    parMoves: 8,
    maxMoves: 12,
    weakCategory,
    limitedItems: subset,
    zoneCapacity: 3,
  };
}
