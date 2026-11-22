import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  Flame,
  Gift,
  Lamp,
  Lock,
  MapPin,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  TimerOff,
  Wand2,
} from 'lucide-react';
import { STORAGE_ZONES, type StorageZoneId } from '../../game/catalog';
import { soundEngine } from '../../game/audio';
import {
  HIDDEN_OBJECT_CATALOG,
  SEARCH_MODE_META,
  SEARCH_ROOM_LOCATIONS,
  type HiddenObjectDef,
  type SearchRoomLocationId,
  type SearchSubMode,
} from '../../game/hiddenObjects';
import type { GameLevelDef } from '../../game/levels';
import type { PlayerSaveData } from '../../game/profile';
import { HiddenObjectGraphic } from '../HiddenObjectGraphic';

const ROOM_BACKDROP_URLS: Record<SearchRoomLocationId, string> = {
  bedroom: '/src/assets/images/coastal_suite_bedroom_1795346857128.jpg',
  beach_house: '/src/assets/images/beach_house_cove_1795350070022.jpg',
  bathroom: '/src/assets/images/coastal_spa_bathroom_1795346857410.jpg',
  dressing_room: '/src/assets/images/coastal_dressing_wing_1795346856719.jpg',
  kitchen: '/src/assets/images/coastal_sunny_kitchen_1795346856674.jpg',
  garden: '/src/assets/images/coastal_emerald_garden_1795346856008.jpg',
  fantasy_library: '/src/assets/images/fantasy_library_hall_1795350069944.jpg',
  magical_island: '/src/assets/images/dream_island_sanctuary_1795350069153.jpg',
};

interface MessyRoomSearchModeProps {
  save: PlayerSaveData;
  subMode: SearchSubMode;
  levelDef?: GameLevelDef;
  onExit: () => void;
  onUseHint: () => boolean;
  onBuyHintsWithCredits: (count: number, costCredits: number) => void;
  onSelectSearchRoom: (roomId: SearchRoomLocationId) => void;
  onUnlockSearchRoom: (roomId: SearchRoomLocationId, cost: number) => void;
  onMysteryBoxReward: (reward: { coins: number; credits: number; hints: number }) => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
    foundCount: number;
    mistakesCount?: number;
  }) => void;
}

type HiddenCompartmentId = 'wardrobe_door' | 'vanity_drawer' | null;

interface PlacedRoomObject {
  uid: string;
  def: HiddenObjectDef;
  x: number; // 0..1400
  y: number; // 0..860
  rotation: number;
  scale: number;
  zIndex: number;
  isTarget: boolean;
  found: boolean;
  isMovableCover: boolean;
  movedAside: boolean;
  memoryHidden: boolean;
  compartment: HiddenCompartmentId;
  areaLabel: string;
}

interface MysteryBoxSpot {
  uid: string;
  x: number;
  y: number;
  opened: boolean;
  reward: { coins: number; credits: number; hints: number };
  label: string;
}

interface DiscoveryBurst {
  id: number;
  x: number;
  y: number;
  kind: 'discover' | 'pop' | 'wrong' | 'box';
  label?: string;
  def?: HiddenObjectDef;
}

const WORLD_W = 1400;
const WORLD_H = 860;

interface SurfaceSpot {
  x: number;
  y: number;
  scale: number;
  rot: number;
}

// Surface-anchored spots calibrated to each room's real furniture geometry
const ROOM_SURFACE_SPOTS: Record<SearchRoomLocationId, SurfaceSpot[]> = {
  bedroom: [
    // Rumpled coastal bed, pillows & throw (left)
    { x: 145, y: 575, scale: 0.94, rot: -14 },
    { x: 245, y: 555, scale: 0.96, rot: 12 },
    { x: 355, y: 615, scale: 1.0, rot: -8 },
    { x: 475, y: 660, scale: 1.02, rot: 16 },
    { x: 225, y: 690, scale: 1.04, rot: -16 },
    { x: 345, y: 745, scale: 1.02, rot: 8 },
    { x: 525, y: 735, scale: 1.04, rot: -10 },
    // Nightstand left
    { x: 78, y: 622, scale: 0.9, rot: 6 },
    // Braided jute rug & oak floor (center)
    { x: 625, y: 745, scale: 1.06, rot: 10 },
    { x: 755, y: 775, scale: 1.08, rot: -12 },
    { x: 895, y: 745, scale: 1.06, rot: 6 },
    { x: 715, y: 700, scale: 1.02, rot: 20 },
    { x: 1005, y: 765, scale: 1.04, rot: -8 },
    // Open oak wardrobe shelves & base (center-right)
    { x: 765, y: 560, scale: 0.9, rot: 5 },
    { x: 840, y: 555, scale: 0.9, rot: -6 },
    { x: 955, y: 265, scale: 0.84, rot: 4 },
    { x: 955, y: 390, scale: 0.86, rot: -8 },
    { x: 955, y: 565, scale: 0.9, rot: 7 },
    // Oak vanity desk, stool & woven chair (right)
    { x: 1175, y: 505, scale: 0.88, rot: 4 },
    { x: 1265, y: 508, scale: 0.88, rot: -8 },
    { x: 1165, y: 635, scale: 0.94, rot: 12 },
    { x: 1320, y: 715, scale: 1.02, rot: -7 },
  ],
  bathroom: [
    // Marble double vanity counter (left)
    { x: 95, y: 565, scale: 0.9, rot: -6 },
    { x: 195, y: 575, scale: 0.9, rot: 8 },
    { x: 315, y: 545, scale: 0.88, rot: -10 },
    { x: 425, y: 530, scale: 0.86, rot: 5 },
    // Woven bath mats & limestone floor (foreground)
    { x: 430, y: 770, scale: 1.06, rot: 14 },
    { x: 545, y: 745, scale: 1.04, rot: -12 },
    { x: 735, y: 755, scale: 1.08, rot: 8 },
    { x: 875, y: 760, scale: 1.06, rot: -14 },
    { x: 640, y: 785, scale: 1.08, rot: 5 },
    // Freestanding soaking tub rim & side stool (center-right)
    { x: 690, y: 575, scale: 0.92, rot: -8 },
    { x: 830, y: 575, scale: 0.92, rot: 10 },
    { x: 935, y: 635, scale: 0.94, rot: -5 },
    { x: 1035, y: 645, scale: 0.94, rot: 12 },
    { x: 1085, y: 750, scale: 1.02, rot: -6 },
    // Built-in oak towel shelves (right)
    { x: 1295, y: 185, scale: 0.84, rot: 4 },
    { x: 1315, y: 325, scale: 0.86, rot: -8 },
    { x: 1290, y: 495, scale: 0.88, rot: 6 },
    { x: 1310, y: 655, scale: 0.92, rot: -10 },
  ],
  dressing_room: [
    // Left open closet shelves, floor & baskets
    { x: 410, y: 280, scale: 0.84, rot: -6 },
    { x: 495, y: 278, scale: 0.84, rot: 8 },
    { x: 415, y: 595, scale: 0.94, rot: -12 },
    { x: 505, y: 615, scale: 0.96, rot: 10 },
    // Cushioned bench beneath gold mirror (center)
    { x: 615, y: 570, scale: 0.92, rot: 5 },
    { x: 705, y: 580, scale: 0.94, rot: -8 },
    { x: 785, y: 575, scale: 0.92, rot: 12 },
    // Tufted teal ottoman & herringbone parquet floor
    { x: 625, y: 720, scale: 1.04, rot: -10 },
    { x: 725, y: 705, scale: 1.04, rot: 8 },
    { x: 805, y: 735, scale: 1.06, rot: 14 },
    { x: 315, y: 735, scale: 1.04, rot: -14 },
    { x: 475, y: 760, scale: 1.06, rot: 6 },
    { x: 925, y: 750, scale: 1.06, rot: -8 },
    // Right hanging closet bay & shelves
    { x: 905, y: 275, scale: 0.84, rot: 6 },
    { x: 985, y: 615, scale: 0.94, rot: -6 },
    // Far-right illuminated display tower
    { x: 1285, y: 205, scale: 0.84, rot: 4 },
    { x: 1295, y: 345, scale: 0.86, rot: -7 },
    { x: 1285, y: 495, scale: 0.88, rot: 8 },
    { x: 1285, y: 655, scale: 0.92, rot: -5 },
    { x: 1175, y: 495, scale: 0.88, rot: 10 },
  ],
  kitchen: [
    // Sea-green cabinetry counter & upper shelves (left)
    { x: 255, y: 255, scale: 0.84, rot: -6 },
    { x: 265, y: 365, scale: 0.86, rot: 8 },
    { x: 235, y: 525, scale: 0.9, rot: -8 },
    { x: 395, y: 505, scale: 0.88, rot: 10 },
    // Ocean window banquette cushions & breakfast table
    { x: 585, y: 515, scale: 0.88, rot: -5 },
    { x: 765, y: 495, scale: 0.88, rot: 8 },
    { x: 965, y: 520, scale: 0.9, rot: -10 },
    // Carrara marble island foreground
    { x: 485, y: 615, scale: 0.98, rot: 6 },
    { x: 605, y: 605, scale: 0.98, rot: -10 },
    { x: 725, y: 590, scale: 0.96, rot: 12 },
    // Oak floor & woven runner
    { x: 285, y: 765, scale: 1.06, rot: -12 },
    { x: 385, y: 725, scale: 1.04, rot: 8 },
    { x: 895, y: 755, scale: 1.06, rot: -6 },
    { x: 1025, y: 735, scale: 1.04, rot: 14 },
    // Open ceramic display hutch (right)
    { x: 1185, y: 315, scale: 0.84, rot: 4 },
    { x: 1295, y: 425, scale: 0.86, rot: -8 },
    { x: 1205, y: 530, scale: 0.88, rot: 6 },
    { x: 1295, y: 645, scale: 0.92, rot: -10 },
  ],
  garden: [
    // White pergola cushioned daybed & timber deck (left)
    { x: 175, y: 545, scale: 0.94, rot: -12 },
    { x: 285, y: 555, scale: 0.96, rot: 10 },
    { x: 385, y: 545, scale: 0.94, rot: -6 },
    { x: 465, y: 565, scale: 0.96, rot: 14 },
    { x: 235, y: 665, scale: 1.02, rot: -8 },
    { x: 425, y: 685, scale: 1.02, rot: 12 },
    // Stone fountain rim & terracotta planters (center)
    { x: 695, y: 575, scale: 0.94, rot: 6 },
    { x: 865, y: 585, scale: 0.94, rot: -10 },
    { x: 780, y: 655, scale: 1.0, rot: 8 },
    { x: 945, y: 665, scale: 1.0, rot: -12 },
    // Sunlit limestone flagstone patio
    { x: 335, y: 765, scale: 1.06, rot: 10 },
    { x: 525, y: 755, scale: 1.06, rot: -14 },
    { x: 695, y: 765, scale: 1.08, rot: 5 },
    { x: 875, y: 745, scale: 1.06, rot: -8 },
    // Mosaic tile tea table & wicker chairs (right)
    { x: 1125, y: 615, scale: 0.96, rot: 8 },
    { x: 1245, y: 635, scale: 1.0, rot: -10 },
    { x: 1325, y: 665, scale: 1.02, rot: 6 },
    { x: 1085, y: 735, scale: 1.04, rot: -6 },
  ],
  beach_house: [
    { x: 185, y: 565, scale: 0.94, rot: -10 },
    { x: 315, y: 585, scale: 0.96, rot: 8 },
    { x: 465, y: 615, scale: 0.98, rot: -6 },
    { x: 585, y: 685, scale: 1.02, rot: 12 },
    { x: 715, y: 625, scale: 0.96, rot: -10 },
    { x: 845, y: 575, scale: 0.92, rot: 8 },
    { x: 965, y: 635, scale: 0.98, rot: -8 },
    { x: 1125, y: 545, scale: 0.92, rot: 10 },
    { x: 1255, y: 625, scale: 0.96, rot: -12 },
    { x: 295, y: 745, scale: 1.06, rot: 6 },
    { x: 535, y: 765, scale: 1.08, rot: -10 },
    { x: 785, y: 755, scale: 1.06, rot: 8 },
    { x: 1045, y: 745, scale: 1.04, rot: -6 },
    { x: 1215, y: 765, scale: 1.04, rot: 12 },
  ],
  fantasy_library: [
    { x: 155, y: 315, scale: 0.86, rot: -6 },
    { x: 265, y: 455, scale: 0.9, rot: 8 },
    { x: 385, y: 615, scale: 0.96, rot: -10 },
    { x: 535, y: 545, scale: 0.92, rot: 6 },
    { x: 675, y: 595, scale: 0.96, rot: -8 },
    { x: 825, y: 565, scale: 0.94, rot: 10 },
    { x: 955, y: 485, scale: 0.9, rot: -12 },
    { x: 1125, y: 345, scale: 0.86, rot: 6 },
    { x: 1245, y: 535, scale: 0.92, rot: -8 },
    { x: 245, y: 745, scale: 1.06, rot: 12 },
    { x: 475, y: 765, scale: 1.08, rot: -6 },
    { x: 725, y: 755, scale: 1.06, rot: 8 },
    { x: 975, y: 745, scale: 1.04, rot: -10 },
    { x: 1205, y: 765, scale: 1.04, rot: 6 },
  ],
  magical_island: [
    { x: 165, y: 585, scale: 0.94, rot: -8 },
    { x: 305, y: 625, scale: 0.98, rot: 10 },
    { x: 455, y: 555, scale: 0.92, rot: -12 },
    { x: 615, y: 665, scale: 1.0, rot: 8 },
    { x: 775, y: 595, scale: 0.96, rot: -6 },
    { x: 925, y: 645, scale: 0.98, rot: 12 },
    { x: 1085, y: 565, scale: 0.92, rot: -10 },
    { x: 1235, y: 625, scale: 0.96, rot: 6 },
    { x: 275, y: 755, scale: 1.06, rot: 8 },
    { x: 515, y: 770, scale: 1.08, rot: -8 },
    { x: 765, y: 760, scale: 1.06, rot: 10 },
    { x: 1015, y: 745, scale: 1.04, rot: -12 },
    { x: 1245, y: 765, scale: 1.04, rot: 6 },
  ],
};

function getCompartmentPositions(roomId: SearchRoomLocationId): {
  wardrobe: { x: number; y: number; doorLeft: number; doorTop: number; doorW: number; doorH: number };
  drawer: { x: number; y: number; btnLeft: number; btnTop: number };
} {
  if (roomId === 'bathroom') {
    return {
      wardrobe: { x: 210, y: 690, doorLeft: 135, doorTop: 615, doorW: 155, doorH: 150 },
      drawer: { x: 385, y: 615, btnLeft: 345, btnTop: 585 },
    };
  }
  if (roomId === 'dressing_room') {
    return {
      wardrobe: { x: 455, y: 600, doorLeft: 375, doorTop: 530, doorW: 165, doorH: 135 },
      drawer: { x: 1185, y: 545, btnLeft: 1135, btnTop: 515 },
    };
  }
  if (roomId === 'kitchen') {
    return {
      wardrobe: { x: 300, y: 650, doorLeft: 215, doorTop: 580, doorW: 170, doorH: 145 },
      drawer: { x: 1195, y: 695, btnLeft: 1135, btnTop: 665 },
    };
  }
  if (roomId === 'garden') {
    return {
      wardrobe: { x: 315, y: 590, doorLeft: 230, doorTop: 535, doorW: 165, doorH: 115 },
      drawer: { x: 1240, y: 645, btnLeft: 1185, btnTop: 615 },
    };
  }
  if (roomId === 'beach_house') {
    return {
      wardrobe: { x: 325, y: 585, doorLeft: 240, doorTop: 525, doorW: 165, doorH: 125 },
      drawer: { x: 1135, y: 605, btnLeft: 1085, btnTop: 575 },
    };
  }
  if (roomId === 'fantasy_library') {
    return {
      wardrobe: { x: 270, y: 450, doorLeft: 195, doorTop: 345, doorW: 150, doorH: 210 },
      drawer: { x: 1045, y: 610, btnLeft: 995, btnTop: 580 },
    };
  }
  if (roomId === 'magical_island') {
    return {
      wardrobe: { x: 350, y: 610, doorLeft: 265, doorTop: 555, doorW: 165, doorH: 115 },
      drawer: { x: 1150, y: 620, btnLeft: 1100, btnTop: 590 },
    };
  }
  return {
    wardrobe: { x: 785, y: 415, doorLeft: 706, doorTop: 215, doorW: 158, doorH: 390 },
    drawer: { x: 1205, y: 565, btnLeft: 1155, btnTop: 525 },
  };
}

function getAreaLabel(
  x: number,
  y: number,
  roomId: SearchRoomLocationId,
  compartment: HiddenCompartmentId
): string {
  if (compartment === 'wardrobe_door') {
    return roomId === 'bedroom'
      ? 'Behind the Coastal Oak Closet Panel (tap panel to slide!)'
      : roomId === 'garden' || roomId === 'magical_island'
      ? 'Under the Woven Canopy Basket (tap to peek!)'
      : 'Inside the Storage Cabinet (tap door to open!)';
  }
  if (compartment === 'vanity_drawer') {
    return roomId === 'bedroom'
      ? 'Inside the Oak Vanity Drawer (tap drawer pull!)'
      : 'Inside the Side Compartment (tap to open!)';
  }

  if (roomId === 'bathroom') {
    if (x < 480 && y < 620) return 'On the Marble Double Vanity Counter';
    if (y >= 700 && x < 960) return 'On the Woven Bath Mats';
    if (x >= 550 && x < 1120) return 'Beside the Freestanding Soaking Tub';
    return 'On the Built-In Oak Towel Shelves';
  }
  if (roomId === 'dressing_room') {
    if (x < 560) return 'Inside the Left Boutique Closet Bay';
    if (x >= 560 && x < 860 && y < 650) return 'On the Bench Under the Gold Mirror';
    if (x >= 450 && x < 920 && y >= 650) return 'Around the Tufted Teal Ottoman';
    return 'Near the Lit Shoe & Handbag Display Tower';
  }
  if (roomId === 'kitchen') {
    if (x < 500 && y < 600) return 'Along the Sea-Green Kitchen Counter';
    if (x >= 500 && x < 1050 && y < 560) return 'By the Sunlit Ocean Window Banquette';
    if (x >= 420 && x < 900 && y >= 560) return 'On the Marble Breakfast Island';
    return 'Inside the Ceramic Display Hutch';
  }
  if (roomId === 'garden') {
    if (x < 530) return 'On the Pergola Cushioned Daybed';
    if (x >= 530 && x < 1000 && y < 685) return 'Around the Stone Tiered Fountain';
    if (x < 1020 && y >= 685) return 'Across the Sunlit Limestone Patio';
    return 'On the Mosaic Tile Tea Table';
  }
  if (roomId === 'beach_house') {
    if (x < 520) return 'On the Driftwood Sofa & Window Bench';
    if (x >= 520 && x < 960) return 'Across the Ocean-View Coffee Table';
    return 'Near the Shell Shelf & Breezy Patio Doors';
  }
  if (roomId === 'fantasy_library') {
    if (x < 480) return 'Along the Tall Oak Bookcases';
    if (x >= 480 && x < 980) return 'Across the Velvet Reading Table & Rug';
    return 'Inside the Sunlit Mezzanine Alcove';
  }
  if (roomId === 'magical_island') {
    if (x < 540) return 'Along the Turquoise Shoreline Stepping Stones';
    if (x >= 540 && x < 980) return 'Near the Glowing Lantern Flower Cove';
    return 'By the Palm Lagoon Pier';
  }

  if (x < 600 && y >= 480) return 'Among the Rumpled Bed Sheets & Pillows';
  if (x >= 600 && x < 1060 && y >= 660) return 'On the Round Braided Jute Rug';
  if (x >= 690 && x < 1050 && y < 640) return 'Inside the Open Coastal Oak Wardrobe';
  if (x >= 1060 && y < 620) return 'On the Sunlit Oak Vanity Desk';
  return 'By the Rattan Chair & Floor Corner';
}

function generateMysteryBoxes(roomId: SearchRoomLocationId, seed: number): MysteryBoxSpot[] {
  const rewards = [
    { coins: 45, credits: 0, hints: 0, label: '+45 Coins!' },
    { coins: 0, credits: 15, hints: 0, label: '+15 Credits!' },
    { coins: 20, credits: 0, hints: 1, label: '+1 Hint & +20 Coins!' },
  ];
  const anchors: Record<SearchRoomLocationId, [{ x: number; y: number }, { x: number; y: number }]> = {
    bedroom: [{ x: 180, y: 760 }, { x: 1275, y: 775 }],
    beach_house: [{ x: 210, y: 755 }, { x: 1185, y: 765 }],
    bathroom: [{ x: 350, y: 785 }, { x: 1135, y: 770 }],
    dressing_room: [{ x: 265, y: 755 }, { x: 1095, y: 755 }],
    kitchen: [{ x: 245, y: 775 }, { x: 1095, y: 770 }],
    garden: [{ x: 195, y: 745 }, { x: 1175, y: 775 }],
    fantasy_library: [{ x: 215, y: 760 }, { x: 1190, y: 760 }],
    magical_island: [{ x: 220, y: 765 }, { x: 1185, y: 770 }],
  };
  const spots = anchors[roomId];
  return [0, 1].map((idx) => {
    const pick = rewards[(seed + idx) % rewards.length];
    return {
      uid: `mbox_${seed}_${idx}`,
      x: spots[idx].x + (Math.random() - 0.5) * 40,
      y: spots[idx].y + (Math.random() - 0.5) * 24,
      opened: false,
      reward: { coins: pick.coins, credits: pick.credits, hints: pick.hints },
      label: pick.label,
    };
  });
}

function generateRoomLayout(
  subMode: SearchSubMode,
  roomId: SearchRoomLocationId,
  targetCount: number,
  clutterTotal: number,
  seed: number
): PlacedRoomObject[] {
  const meta = SEARCH_MODE_META[subMode];
  const categoryItems = HIDDEN_OBJECT_CATALOG.filter((it) => meta.categories.includes(it.category));
  const otherItems = HIDDEN_OBJECT_CATALOG.filter((it) => !meta.categories.includes(it.category));

  const shuffledPrimary = [...categoryItems].sort(() => Math.random() - 0.5);
  const shuffledOther = [...otherItems].sort(() => Math.random() - 0.5);

  const targets = shuffledPrimary.slice(0, targetCount);
  const targetIds = new Set(targets.map((t) => t.id));

  const decoysNeeded = Math.max(30, clutterTotal - targets.length);
  const decoyPool = [...shuffledPrimary.slice(targetCount), ...shuffledOther]
    .filter((d) => !targetIds.has(d.id))
    .slice(0, decoysNeeded);

  const placed: PlacedRoomObject[] = [];
  const roomSpots = ROOM_SURFACE_SPOTS[roomId];
  const shuffledSpots = [...roomSpots].sort(() => Math.random() - 0.5);
  const compartmentPos = getCompartmentPositions(roomId);

  const pickNonOverlappingCoords = (base: SurfaceSpot, jitterX: number, jitterY: number, minDist: number) => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const cx = Math.min(WORLD_W - 75, Math.max(75, base.x + (Math.random() - 0.5) * jitterX));
      const cy = Math.min(WORLD_H - 65, Math.max(175, base.y + (Math.random() - 0.5) * jitterY));
      const tooClose = placed.some((p) => !p.compartment && Math.hypot(p.x - cx, p.y - cy) < minDist);
      if (!tooClose) return { x: cx, y: cy };
    }
    return {
      x: Math.min(WORLD_W - 75, Math.max(75, base.x + (Math.random() - 0.5) * jitterX)),
      y: Math.min(WORLD_H - 65, Math.max(175, base.y + (Math.random() - 0.5) * jitterY)),
    };
  };

  targets.forEach((def, idx) => {
    const useWardrobeCompartment = subMode !== 'memory_challenge' && idx === targets.length - 1 && targets.length >= 4;
    const useVanityDrawer = subMode !== 'memory_challenge' && idx === targets.length - 2 && targets.length >= 6;

    let x: number;
    let y: number;
    let scale = 0.94;
    let rotation = Math.round((Math.random() - 0.5) * 24);
    let compartment: HiddenCompartmentId = null;

    if (useWardrobeCompartment) {
      x = compartmentPos.wardrobe.x + (Math.random() - 0.5) * 44;
      y = compartmentPos.wardrobe.y + (Math.random() - 0.5) * 46;
      scale = 0.92;
      rotation = 0;
      compartment = 'wardrobe_door';
    } else if (useVanityDrawer) {
      x = compartmentPos.drawer.x + (Math.random() - 0.5) * 34;
      y = compartmentPos.drawer.y;
      scale = 0.88;
      rotation = 5;
      compartment = 'vanity_drawer';
    } else {
      const spot = shuffledSpots[idx % shuffledSpots.length];
      const coords = pickNonOverlappingCoords(spot, 68, 42, 62);
      x = coords.x;
      y = coords.y;
      scale = spot.scale;
      rotation = spot.rot + Math.round((Math.random() - 0.5) * 12);
    }

    placed.push({
      uid: `target_${seed}_${idx}_${def.id}`,
      def,
      x,
      y,
      rotation,
      scale,
      zIndex: compartment ? 16 : 12 + idx,
      isTarget: true,
      found: false,
      isMovableCover: false,
      movedAside: false,
      memoryHidden: false,
      compartment,
      areaLabel: getAreaLabel(x, y, roomId, compartment),
    });
  });

  decoyPool.forEach((def, idx) => {
    const surfaceTargets = placed.filter((p) => p.isTarget && !p.compartment);
    const coverTarget = idx % 8 === 0 && surfaceTargets.length > 0 ? surfaceTargets[idx % surfaceTargets.length] : null;
    const spot = roomSpots[(idx * 3 + seed) % roomSpots.length];

    let x: number;
    let y: number;
    if (coverTarget) {
      x = coverTarget.x + (Math.random() - 0.5) * 20;
      y = coverTarget.y + (Math.random() - 0.5) * 16;
    } else {
      const coords = pickNonOverlappingCoords(spot, 130, 68, 44);
      x = coords.x;
      y = coords.y;
    }

    placed.push({
      uid: `clutter_${seed}_${idx}_${def.id}`,
      def,
      x,
      y,
      rotation: Math.round((Math.random() - 0.5) * 32),
      scale: Math.max(0.82, (coverTarget ? coverTarget.scale : spot.scale) * (0.92 + Math.random() * 0.16)),
      zIndex: coverTarget ? 32 + idx : 5 + (idx % 16),
      isTarget: false,
      found: false,
      isMovableCover: Boolean(coverTarget) || idx % 5 === 0,
      movedAside: false,
      memoryHidden: false,
      compartment: null,
      areaLabel: getAreaLabel(x, y, roomId, null),
    });
  });

  return placed;
}

export function MessyRoomSearchMode({
  save,
  subMode,
  levelDef,
  onExit,
  onUseHint,
  onBuyHintsWithCredits,
  onSelectSearchRoom,
  onUnlockSearchRoom,
  onMysteryBoxReward,
  onComplete,
}: MessyRoomSearchModeProps) {
  const modeMeta = SEARCH_MODE_META[subMode];
  const isTimeBlitz = subMode === 'time_challenge';
  const isMemory = subMode === 'memory_challenge';
  const isOrganizeMode = subMode === 'room_organize';
  const reducedMotion = save.settings.reducedMotion;
  const highContrast = save.settings.highContrastHints;

  const activeRoomId: SearchRoomLocationId =
    (save.activeSearchRoom as SearchRoomLocationId) || 'bedroom';
  const activeRoomMeta =
    SEARCH_ROOM_LOCATIONS.find((r) => r.id === activeRoomId) || SEARCH_ROOM_LOCATIONS[0];
  const compartmentPos = useMemo(() => getCompartmentPositions(activeRoomId), [activeRoomId]);

  const targetCount = isTimeBlitz ? 14 : isMemory ? Math.min(5, levelDef?.itemCount ?? 4) : levelDef?.itemCount ?? 6;
  const clutterCount = levelDef?.clutterCount ?? (subMode === 'messy_room' ? 68 : 54);
  const totalTime = isTimeBlitz ? 60 : levelDef?.timeLimitSec ?? 85;

  const [seed, setSeed] = useState(0);
  const [roomsDrawerOpen, setRoomsDrawerOpen] = useState(false);
  const [objects, setObjects] = useState<PlacedRoomObject[]>(() =>
    generateRoomLayout(subMode, activeRoomId, targetCount, clutterCount, 0)
  );
  const [mysteryBoxes, setMysteryBoxes] = useState<MysteryBoxSpot[]>(() =>
    generateMysteryBoxes(activeRoomId, 0)
  );

  // Interactive Room States
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [vanityDrawerOpen, setVanityDrawerOpen] = useState(false);
  const [warmLighting, setWarmLighting] = useState(true);
  const [relaxedMode, setRelaxedMode] = useState(() => Boolean(save.settings.noPressureMode));
  const [failedRooms, setFailedRooms] = useState<Record<string, boolean>>({});

  // Free Cooldown Radar Warmth Hint
  const [radarCooldown, setRadarCooldown] = useState(0);
  const [warmZoneSpot, setWarmZoneSpot] = useState<{ x: number; y: number } | null>(null);

  // Memory phase: 6s study -> cover
  const [memoryCountdown, setMemoryCountdown] = useState(isMemory ? 6 : 0);
  const [phase, setPhase] = useState<'searching' | 'organizing' | 'finished'>('searching');

  // Organize phase state (for room_organize subMode)
  const [selectedFoundUid, setSelectedFoundUid] = useState<string | null>(null);
  const [organizedUids, setOrganizedUids] = useState<string[]>([]);

  // Viewport Zoom & Pan
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1.06);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.06);
  const dragOriginRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);

  // Gameplay HUD & Rich Feedback
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [bouncedUid, setBouncedUid] = useState<string | null>(null);
  const [shakenUid, setShakenUid] = useState<string | null>(null);
  const [assistantClue, setAssistantClue] = useState<string | null>(null);
  const [hintTargetUid, setHintTargetUid] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; ok: boolean } | null>(null);
  const [bursts, setBursts] = useState<DiscoveryBurst[]>([]);
  const [collectingPreview, setCollectingPreview] = useState<{ id: number; def: HiddenObjectDef } | null>(null);
  const burstIdRef = useRef(1);
  const [wonResult, setWonResult] = useState<{ won: boolean; stars: number; coins: number; credits: number; found: number } | null>(null);

  const targets = useMemo(() => objects.filter((o) => o.isTarget), [objects]);
  const foundTargets = useMemo(() => targets.filter((o) => o.found), [targets]);
  const unfoundTargets = useMemo(() => targets.filter((o) => !o.found), [targets]);

  const displayedTargets = useMemo(
    () => (isTimeBlitz ? unfoundTargets.slice(0, 3) : targets),
    [isTimeBlitz, targets, unfoundTargets]
  );

  const hasTargetInWardrobe = useMemo(
    () => unfoundTargets.some((t) => t.compartment === 'wardrobe_door'),
    [unfoundTargets]
  );
  const hasTargetInDrawer = useMemo(
    () => unfoundTargets.some((t) => t.compartment === 'vanity_drawer'),
    [unfoundTargets]
  );

  const clampPan = useCallback((nx: number, ny: number, z: number) => {
    const vp = viewportRef.current;
    if (!vp) return { x: 0, y: 0 };
    const rect = vp.getBoundingClientRect();
    const scaledW = WORLD_W * z;
    const scaledH = WORLD_H * z;
    const maxOffsetX = Math.max(0, (scaledW - rect.width) / 2 + 40);
    const maxOffsetY = Math.max(0, (scaledH - rect.height) / 2 + 40);
    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nx)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, ny)),
    };
  }, []);

  const updateZoom = useCallback(
    (nextZoom: number) => {
      const clampedZ = Math.max(0.72, Math.min(2.35, Number(nextZoom.toFixed(2))));
      setZoom(clampedZ);
      setPan((p) => clampPan(p.x, p.y, clampedZ));
    },
    [clampPan]
  );

  // Memory phase countdown
  useEffect(() => {
    if (!isMemory || memoryCountdown <= 0 || paused || phase !== 'searching') return;
    const t = window.setTimeout(() => {
      const next = memoryCountdown - 1;
      setMemoryCountdown(next);
      if (next === 0) {
        soundEngine.playClutterMove();
        setObjects((prev) =>
          prev.map((o) => (o.isTarget ? { ...o, memoryHidden: true } : o))
        );
        setFeedbackBanner({
          text: 'Seafoam covers dropped! Tap the remembered hiding spots.',
          ok: true,
        });
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [isMemory, memoryCountdown, paused, phase]);

  // Free Radar Cooldown
  useEffect(() => {
    if (radarCooldown <= 0 || paused || phase !== 'searching') return;
    const id = window.setTimeout(() => setRadarCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(id);
  }, [radarCooldown, paused, phase]);

  const finishSearchAdventure = useCallback(
    (won: boolean, finalFoundCount: number, finalScore: number) => {
      if (phase === 'finished') return;
      setPhase('finished');
      if (won) soundEngine.playVictory();
      else soundEngine.playGentleWrong();

      const accuracy = finalFoundCount / Math.max(1, finalFoundCount + mistakes);
      const stars = !won
        ? isTimeBlitz && finalFoundCount >= 5
          ? 1
          : 0
        : accuracy >= 0.85 && (relaxedMode || timeLeft >= 15)
        ? 3
        : accuracy >= 0.65
        ? 2
        : 1;

      const effectiveWon = won || (isTimeBlitz && finalFoundCount >= 4);
      const baseCoins = levelDef?.rewardCoins ?? 90;
      const baseCredits = levelDef?.rewardCredits ?? 20;
      const baseXp = levelDef?.rewardXp ?? 60;

      const timeBonus = relaxedMode ? 12 : timeLeft * 2;
      const coinsEarned = effectiveWon
        ? baseCoins + Math.round(finalScore * 0.12) + timeBonus
        : 30 + finalFoundCount * 8;
      const creditsEarned = effectiveWon ? baseCredits + stars * 5 : 6;
      const xpEarned = effectiveWon ? baseXp + stars * 18 : 20;

      setWonResult({
        won: effectiveWon,
        stars,
        coins: coinsEarned,
        credits: creditsEarned,
        found: finalFoundCount,
      });

      onComplete({
        won: effectiveWon,
        stars,
        coinsEarned,
        creditsEarned,
        xpEarned,
        foundCount: finalFoundCount,
        mistakesCount: mistakes,
      });
    },
    [isTimeBlitz, levelDef, mistakes, onComplete, phase, relaxedMode, timeLeft]
  );

  // Main countdown timer (paused in Relaxed Mode or global No Pressure Mode)
  const effectiveRelaxed = relaxedMode || Boolean(save.settings.noPressureMode);
  useEffect(() => {
    if (paused || phase !== 'searching' || memoryCountdown > 0 || effectiveRelaxed) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          finishSearchAdventure(false, foundTargets.length, score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [effectiveRelaxed, finishSearchAdventure, foundTargets.length, memoryCountdown, paused, phase, score]);

  const spawnBurst = useCallback(
    (x: number, y: number, kind: DiscoveryBurst['kind'], label?: string, def?: HiddenObjectDef) => {
      const id = burstIdRef.current++;
      setBursts((prev) => [...prev.slice(-10), { id, x, y, kind, label, def }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 950);
    },
    []
  );

  const handleObjectClick = (obj: PlacedRoomObject) => {
    if (paused || phase !== 'searching' || obj.found) return;
    if (isMemory && memoryCountdown > 0) return;
    soundEngine.unlock();

    setBouncedUid(obj.uid);
    window.setTimeout(() => setBouncedUid((cur) => (cur === obj.uid ? null : cur)), 240);

    const isExpectedTarget =
      obj.isTarget &&
      (!isTimeBlitz || displayedTargets.some((dt) => dt.uid === obj.uid));

    if (isExpectedTarget) {
      const nextStreak = streak + 1;
      const pts = 100 + Math.min(100, nextStreak * 20);
      const nextScore = score + pts;
      const nextFoundTotal = foundTargets.length + 1;

      soundEngine.playShimmerDiscover();
      spawnBurst(obj.x, obj.y, 'discover', `+${pts}`, obj.def);

      const collectId = burstIdRef.current++;
      setCollectingPreview({ id: collectId, def: obj.def });
      window.setTimeout(() => {
        setCollectingPreview((cur) => (cur?.id === collectId ? null : cur));
      }, 850);

      setObjects((prev) =>
        prev.map((o) =>
          o.uid === obj.uid ? { ...o, found: true, memoryHidden: false } : o
        )
      );
      setScore(nextScore);
      setStreak(nextStreak);
      setHintTargetUid((cur) => (cur === obj.uid ? null : cur));
      setWarmZoneSpot(null);
      setAssistantClue(null);
      setFeedbackBanner({
        text: `Found ${obj.def.name} · +${pts} pts`,
        ok: true,
      });

      if (nextFoundTotal >= targets.length) {
        if (isOrganizeMode) {
          setPhase('organizing');
          setFeedbackBanner({
            text: 'All items found! Place each treasure into its matching Dreamhouse zone.',
            ok: true,
          });
        } else {
          window.setTimeout(() => {
            finishSearchAdventure(true, nextFoundTotal, nextScore);
          }, 560);
        }
      }
      return;
    }

    // Movable clutter glides aside smoothly
    if (obj.isMovableCover && !obj.movedAside) {
      soundEngine.playClutterMove();
      spawnBurst(obj.x, obj.y, 'pop', 'Moved');
      setObjects((prev) =>
        prev.map((o) =>
          o.uid === obj.uid
            ? {
                ...o,
                movedAside: true,
                x: Math.min(WORLD_W - 65, Math.max(65, o.x + (o.x > WORLD_W / 2 ? -74 : 74))),
                y: Math.min(WORLD_H - 65, o.y + 18),
                rotation: o.rotation + 16,
              }
            : o
        )
      );
      setFeedbackBanner({
        text: `Slid ${obj.def.name} aside — inspect underneath!`,
        ok: true,
      });
      return;
    }

    soundEngine.playGentleWrong();
    spawnBurst(obj.x, obj.y, 'wrong');
    setStreak(0);
    setMistakes((m) => m + 1);
    setShakenUid(obj.uid);
    window.setTimeout(() => setShakenUid((cur) => (cur === obj.uid ? null : cur)), 320);

    const nextTarget = displayedTargets[0];
    setFeedbackBanner({
      text: nextTarget
        ? `That's ${obj.def.name} — keep looking for ${nextTarget.def.name}.`
        : 'Not that item — keep exploring!',
      ok: false,
    });
  };

  // Free Cooldown Radar Warmth Hint
  const handleWarmthRadar = () => {
    if (paused || phase !== 'searching' || radarCooldown > 0) return;
    const target = unfoundTargets[0];
    if (!target) return;
    soundEngine.playAssistantHint();
    setRadarCooldown(18);
    setWarmZoneSpot({
      x: Math.max(120, Math.min(WORLD_W - 120, target.x + (Math.random() - 0.5) * 90)),
      y: Math.max(140, Math.min(WORLD_H - 120, target.y + (Math.random() - 0.5) * 70)),
    });
    setAssistantClue(`Radar Sweep: Look ${target.areaLabel.toLowerCase()}.`);
    window.setTimeout(() => setWarmZoneSpot(null), 4800);
  };

  // Paid Pinpoint Hint
  const handleUseAssistantHint = () => {
    if (paused || phase !== 'searching') return;
    const target = unfoundTargets[0];
    if (!target) return;

    const ok = onUseHint();
    if (!ok) {
      soundEngine.playGentleWrong();
      setAssistantClue('No pinpoint hints left! Use Free Radar or tap "+2 Hints (25 Cr)".');
      return;
    }

    soundEngine.playAssistantHint();
    if (target.compartment === 'wardrobe_door' && !wardrobeOpen) setWardrobeOpen(true);
    if (target.compartment === 'vanity_drawer' && !vanityDrawerOpen) setVanityDrawerOpen(true);

    setHintTargetUid(target.uid);
    setWarmZoneSpot(null);
    setAssistantClue(
      `Pinpoint Clue: ${target.areaLabel} — look for a ${target.def.colorName} ${target.def.shape.replace('_', ' ')}.`
    );

    const targetPanX = (WORLD_W / 2 - target.x) * zoom;
    const targetPanY = (WORLD_H / 2 - target.y) * zoom;
    setPan(clampPan(targetPanX, targetPanY, zoom));
  };

  // Pan & Pinch-to-Zoom Pointer Handling on Viewport
  const handleViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartZoomRef.current = zoom;
      dragOriginRef.current = null;
    } else if (pointersRef.current.size === 1) {
      dragOriginRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
        moved: false,
      };
    }
  };

  const handleViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = dist / Math.max(10, pinchStartDistRef.current);
      updateZoom(pinchStartZoomRef.current * scale);
      return;
    }

    if (dragOriginRef.current) {
      const dx = e.clientX - dragOriginRef.current.x;
      const dy = e.clientY - dragOriginRef.current.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        dragOriginRef.current.moved = true;
        setPan(clampPan(dragOriginRef.current.panX + dx, dragOriginRef.current.panY + dy, zoom));
      }
    }
  };

  const handleViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      window.setTimeout(() => {
        dragOriginRef.current = null;
      }, 20);
    }
  };

  const handleOrganizeFoundItem = (zoneId: StorageZoneId) => {
    if (!selectedFoundUid) return;
    const item = foundTargets.find((t) => t.uid === selectedFoundUid);
    if (!item) return;

    if (item.def.targetZone === zoneId) {
      soundEngine.playCorrectPlace(2);
      const nextOrg = [...organizedUids, item.uid];
      setOrganizedUids(nextOrg);
      setSelectedFoundUid(null);
      setFeedbackBanner({ text: `Organized ${item.def.name} neatly!`, ok: true });
      if (nextOrg.length >= foundTargets.length) {
        finishSearchAdventure(true, foundTargets.length, score + 180);
      }
    } else {
      soundEngine.playGentleWrong();
      setMistakes((m) => m + 1);
      const rightZone = STORAGE_ZONES.find((z) => z.id === item.def.targetZone);
      setFeedbackBanner({
        text: `Try placing ${item.def.name} in ${rightZone?.label || 'another zone'}.`,
        ok: false,
      });
    }
  };

  const handleRestart = (overrideRoomId?: SearchRoomLocationId) => {
    const nextSeed = seed + 1;
    const roomToUse = overrideRoomId || activeRoomId;
    setSeed(nextSeed);
    setObjects(generateRoomLayout(subMode, roomToUse, targetCount, clutterCount, nextSeed));
    setMysteryBoxes(generateMysteryBoxes(roomToUse, nextSeed));
    setWardrobeOpen(false);
    setVanityDrawerOpen(false);
    setWarmZoneSpot(null);
    setRadarCooldown(0);
    setMemoryCountdown(isMemory ? 6 : 0);
    setPhase('searching');
    setSelectedFoundUid(null);
    setOrganizedUids([]);
    setTimeLeft(totalTime);
    setPaused(false);
    setScore(0);
    setStreak(0);
    setMistakes(0);
    setHintTargetUid(null);
    setAssistantClue(null);
    setFeedbackBanner(null);
    setWonResult(null);
    setZoom(1.06);
    setPan({ x: 0, y: 0 });
  };

  const handleRoomButtonClick = (roomId: SearchRoomLocationId, unlockCost: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      if (roomId === activeRoomId) {
        setRoomsDrawerOpen(false);
        return;
      }
      soundEngine.playCutePop();
      onSelectSearchRoom(roomId);
      setRoomsDrawerOpen(false);
      handleRestart(roomId);
    } else if (save.coins >= unlockCost) {
      soundEngine.playWardrobeBox();
      onUnlockSearchRoom(roomId, unlockCost);
      setRoomsDrawerOpen(false);
      handleRestart(roomId);
    } else {
      soundEngine.playGentleWrong();
      setFeedbackBanner({
        text: `Need ${unlockCost} Coins to unlock this Dreamhouse room.`,
        ok: false,
      });
    }
  };

  const handleMysteryBoxTap = (box: MysteryBoxSpot) => {
    if (paused || phase !== 'searching' || box.opened) return;
    soundEngine.playWardrobeBox();
    setMysteryBoxes((prev) =>
      prev.map((b) => (b.uid === box.uid ? { ...b, opened: true } : b))
    );
    spawnBurst(box.x, box.y, 'box', box.label);
    onMysteryBoxReward(box.reward);
    setFeedbackBanner({
      text: `Treasure Trunk Surprise · ${box.label}`,
      ok: true,
    });
  };

  const hintedObject = hintTargetUid ? objects.find((o) => o.uid === hintTargetUid && !o.found) : null;
  const activePhotoUrl = ROOM_BACKDROP_URLS[activeRoomId];
  const photoLoaded = !failedRooms[activeRoomId];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#E6F6F8] overflow-hidden select-none">
      {/* Coastal Studio Header */}
      <header className="z-30 bg-[#F4FAFB]/95 border-b border-[#CBE5E8] px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              onExit();
            }}
            className="btn-tactile h-11 w-11 shrink-0 rounded-xl bg-[#E6F6F8] hover:bg-[#D8EFF2] text-[#0F2933] flex items-center justify-center transition-colors"
            aria-label="Exit Search"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#0F2933] truncate">
              {levelDef ? levelDef.title : modeMeta.title}
            </h2>
            <p className="text-[11px] text-[#356370] truncate">
              {isMemory && memoryCountdown > 0
                ? `Study positions closely — covers drop in ${memoryCountdown}s`
                : `${activeRoomMeta.name} · Drag to pan, pinch to zoom, open compartments`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              setRoomsDrawerOpen((o) => !o);
            }}
            className={`btn-tactile h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              roomsDrawerOpen
                ? 'bg-[#E6F6F8] border-[#0D9488] text-[#0F766E]'
                : 'bg-white border-[#CBE5E8] text-[#0F2933] hover:bg-[#E6F6F8]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Rooms</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playLampToggle();
              setWarmLighting((w) => !w);
            }}
            className={`btn-tactile h-10 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
              warmLighting
                ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#B45309]'
                : 'bg-white border-[#CBE5E8] text-[#164E63]'
            }`}
            aria-label="Toggle studio lighting"
          >
            <Lamp className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{warmLighting ? 'Sunlit' : 'Breeze'}</span>
          </button>

          {!isTimeBlitz && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                setRelaxedMode((r) => !r);
              }}
              className={`btn-tactile h-10 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                relaxedMode
                  ? 'bg-[#ECFEFF] border-[#06B6D4] text-[#0E7490]'
                  : 'bg-white border-[#CBE5E8] text-[#356370]'
              }`}
              title="Toggle Untimed Cozy Search"
            >
              {relaxedMode ? <TimerOff className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 text-[#0284C7]" />}
              <span className="font-mono-num font-bold">
                {relaxedMode ? 'Cozy' : `${timeLeft}s`}
              </span>
            </button>
          )}

          {isTimeBlitz && (
            <div className="px-2.5 py-1.5 text-xs sm:text-sm font-mono-num font-bold text-[#0F2933] flex items-center gap-1">
              <Clock className={`w-4 h-4 ${timeLeft <= 12 ? 'text-rose-600' : 'text-[#0284C7]'}`} />
              <span className={timeLeft <= 12 ? 'text-rose-600' : ''}>{timeLeft}s</span>
            </div>
          )}

          <div className="font-mono-num text-xs sm:text-sm font-bold text-[#0F766E] px-1">
            {foundTargets.length}/{targets.length}
          </div>

          <button
            type="button"
            onClick={handleWarmthRadar}
            disabled={radarCooldown > 0}
            className="btn-tactile h-10 px-3 rounded-xl bg-[#ECFEFF] hover:bg-[#CFFAFE] disabled:opacity-50 border border-[#A5F3FC] text-[#0E7490] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Free area radar sweep"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">
              {radarCooldown > 0 ? `Radar ${radarCooldown}s` : 'Free Radar'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleUseAssistantHint}
            className="btn-tactile h-10 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Wand2 className="w-4 h-4" />
            <span>Hint ({save.hintsBalance})</span>
          </button>

          {save.hintsBalance === 0 && (
            <button
              type="button"
              onClick={() => onBuyHintsWithCredits(2, 25)}
              disabled={save.credits < 25}
              className="btn-tactile h-10 px-2.5 rounded-xl bg-[#0284C7] disabled:opacity-45 text-white text-[11px] font-bold whitespace-nowrap shrink-0"
            >
              +2 Hints
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              setPaused((p) => !p);
            }}
            className="btn-tactile h-10 w-10 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
            aria-label={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Expandable 5-Room Switcher Strip */}
      {roomsDrawerOpen && phase === 'searching' && (
        <div className="z-30 bg-[#F4FAFB] border-b border-[#CBE5E8] px-3 sm:px-5 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-0.5">
            {SEARCH_ROOM_LOCATIONS.map((room) => {
              const unlocked = save.unlockedSearchRooms.includes(room.id);
              const active = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomButtonClick(room.id, room.unlockCost, unlocked)}
                  className={`btn-tactile shrink-0 px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-sm'
                      : unlocked
                      ? 'bg-white border-[#CBE5E8] text-[#0F2933] hover:border-[#0D9488]'
                      : 'bg-[#F4FAFB] border-[#CBE5E8] text-[#356370]'
                  }`}
                >
                  {!unlocked && <Lock className="w-3.5 h-3.5 text-[#D97706]" />}
                  <span>{room.name}</span>
                  {!unlocked && (
                    <span className="font-mono-num text-[11px] text-[#B45309] font-bold">
                      ({room.unlockCost} Coins)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtle Feedback & Combo Bar */}
      {(assistantClue || feedbackBanner || streak >= 2) && (
        <div className="z-20 px-4 py-1.5 bg-white/95 border-b border-[#CBE5E8] flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          {assistantClue ? (
            <span className="text-[#0284C7] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{assistantClue}</span>
            </span>
          ) : feedbackBanner ? (
            <span className={feedbackBanner.ok ? 'text-emerald-700' : 'text-rose-700'}>
              {feedbackBanner.text}
            </span>
          ) : (
            <span className="text-[#356370]">Drag to pan · Pinch or use + / - to zoom</span>
          )}
          {streak >= 2 && (
            <span className="font-mono-num text-[#0F766E] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{streak}x Combo Discovery</span>
            </span>
          )}
        </div>
      )}

      {/* Main Play Area */}
      {phase === 'organizing' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#F4FAFB] to-[#E6F6F8]">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 text-center shadow-sm">
              <h3 className="font-display text-2xl font-bold text-[#0F2933]">
                Phase 2: Organize Your Found Treasures
              </h3>
              <p className="text-xs sm:text-sm text-[#356370] mt-1">
                Select a discovered item below, then tap its matching Dreamhouse zone.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STORAGE_ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => handleOrganizeFoundItem(z.id)}
                  className="btn-tactile p-4 rounded-2xl border-2 border-[#CBE5E8] hover:border-[#0D9488] text-left transition-all shadow-sm"
                  style={{ backgroundColor: z.bgTint }}
                >
                  <div className="text-sm font-bold text-[#0F2933]">{z.label}</div>
                  <div className="text-xs text-[#356370] mt-0.5">{z.subtitle}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {foundTargets
                .filter((t) => !organizedUids.includes(t.uid))
                .map((item) => (
                  <button
                    key={item.uid}
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setSelectedFoundUid(item.uid);
                    }}
                    className={`btn-tactile p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      selectedFoundUid === item.uid
                        ? 'border-[#0D9488] bg-[#E6F6F8] ring-2 ring-[#0D9488]/30'
                        : 'border-[#CBE5E8] bg-white'
                    }`}
                  >
                    <HiddenObjectGraphic item={item.def} className="w-12 h-12" />
                    <span className="text-xs font-semibold text-[#0F2933] text-center">{item.def.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={viewportRef}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onPointerCancel={handleViewportPointerUp}
          onWheel={(e) => {
            e.preventDefault();
            updateZoom(zoom + (e.deltaY < 0 ? 0.14 : -0.14));
          }}
          className="relative flex-1 overflow-hidden touch-none cursor-grab active:cursor-grabbing bg-[#CBE5E8]"
        >
          {/* Collector Fly-In Toast Indicator */}
          {collectingPreview && (
            <div
              className={`absolute left-1/2 bottom-4 -translate-x-1/2 z-40 pointer-events-none px-4 py-2 rounded-2xl bg-white/95 border border-[#0D9488] shadow-xl flex items-center gap-2.5 ${
                reducedMotion ? '' : 'animate-bounce'
              }`}
            >
              <HiddenObjectGraphic item={collectingPreview.def} className="w-8 h-8" />
              <span className="text-xs font-bold text-[#0F2933]">
                Collected {collectingPreview.def.name}!
              </span>
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            </div>
          )}

          {/* Zoom & Pan Architectural Room World */}
          <div
            className="absolute left-1/2 top-1/2 origin-center transition-transform duration-75"
            style={{
              width: WORLD_W,
              height: WORLD_H,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            }}
          >
            {/* Architectural SVG Fallback (Cohesive Coastal Palette — shown if image still loads/errors) */}
            <svg
              viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                <linearGradient id="coastalWallGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={activeRoomMeta.wallBg} />
                  <stop offset="100%" stopColor="#CBE5E8" />
                </linearGradient>
                <linearGradient id="coastalFloorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4B08C" />
                  <stop offset="100%" stopColor="#A97F5A" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width={WORLD_W} height="560" fill="url(#coastalWallGrad)" />
              <rect x="0" y="560" width={WORLD_W} height="300" fill="url(#coastalFloorGrad)" />
              <rect x="340" y="80" width="380" height="320" rx="16" fill="#E0F7FA" stroke="#FFFFFF" strokeWidth="8" />
              <rect x="740" y="130" width="290" height="430" rx="10" fill="#E6F6F8" stroke="#99D3D9" strokeWidth="4" />
              <ellipse cx="760" cy="755" rx="250" ry="68" fill="#E9DEC8" stroke="#CBB799" strokeWidth="3" />
            </svg>

            {/* High-Detail Illustrated Coastal Architectural Room Image (All 5 Rooms) */}
            {photoLoaded && (
              <img
                src={activePhotoUrl}
                alt={activeRoomMeta.name}
                referrerPolicy="no-referrer"
                onError={() => setFailedRooms((prev) => ({ ...prev, [activeRoomId]: true }))}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              />
            )}

            {/* Ambient Sunlit / Ocean Breeze Lighting Layer */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                background: warmLighting
                  ? 'radial-gradient(circle at 38% 34%, rgba(255,248,220,0.16) 0%, rgba(255,244,210,0.06) 52%, rgba(15,41,51,0.09) 100%)'
                  : 'linear-gradient(180deg, rgba(224,247,250,0.12) 0%, rgba(15,118,110,0.08) 100%)',
              }}
            />

            {/* Subtle Animated Curtain Drift */}
            {!reducedMotion && (
              <div
                className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none animate-curtain-sway"
                style={{
                  background: 'linear-gradient(90deg, rgba(244,250,251,0.28) 0%, rgba(244,250,251,0.0) 100%)',
                }}
              />
            )}

            {/* Bedroom Mirror Ring Soft Glow */}
            {activeRoomId === 'bedroom' && warmLighting && !reducedMotion && (
              <div
                className="absolute right-[52px] top-[292px] w-[108px] h-[196px] rounded-full border-2 border-[#FEF08A]/70 shadow-[0_0_24px_rgba(253,224,71,0.45)] pointer-events-none animate-bulb-pulse"
              />
            )}

            {/* Interactive Room Storage Compartments (All 5 Rooms) */}
            {wardrobeOpen && (
              <div
                style={{
                  left: compartmentPos.wardrobe.doorLeft,
                  top: compartmentPos.wardrobe.doorTop,
                  width: compartmentPos.wardrobe.doorW,
                  height: compartmentPos.wardrobe.doorH,
                  zIndex: 11,
                }}
                className="absolute rounded-xl bg-gradient-to-b from-[#134E4A]/95 to-[#0F2933]/95 border border-[#99F6E4]/60 shadow-inner pointer-events-none overflow-hidden"
              >
                <div className="absolute top-5 inset-x-3 h-1 rounded-full bg-[#F59E0B]/80" />
                <div className="absolute inset-x-3 bottom-3 h-1 bg-[#CBE5E8]/40 rounded" />
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dragOriginRef.current?.moved) return;
                soundEngine.playDrawerSlide();
                setWardrobeOpen((o) => !o);
                setFeedbackBanner({
                  text: !wardrobeOpen
                    ? 'Opened the hidden storage compartment — inspect inside!'
                    : 'Closed the storage compartment.',
                  ok: true,
                });
              }}
              style={{
                left: wardrobeOpen ? compartmentPos.wardrobe.doorLeft + compartmentPos.wardrobe.doorW + 6 : compartmentPos.wardrobe.doorLeft,
                top: compartmentPos.wardrobe.doorTop,
                width: wardrobeOpen ? 92 : compartmentPos.wardrobe.doorW,
                height: wardrobeOpen ? 36 : compartmentPos.wardrobe.doorH,
                zIndex: 19,
              }}
              aria-label="Toggle storage compartment"
              className={`absolute rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                wardrobeOpen
                  ? 'bg-[#F4FAFB]/95 border-[#0D9488] shadow-sm'
                  : 'bg-white/10 hover:bg-white/25 border-white/40'
              }`}
            >
              <span
                className={`px-2 py-1 rounded-md bg-white/95 text-[10px] font-bold text-[#0F2933] shadow-sm whitespace-nowrap ${
                  hasTargetInWardrobe && !wardrobeOpen ? 'ring-2 ring-[#0D9488]' : ''
                }`}
              >
                {wardrobeOpen
                  ? 'Close Panel'
                  : activeRoomId === 'garden'
                  ? 'Lift Cushion'
                  : activeRoomId === 'bedroom'
                  ? 'Slide Closet'
                  : 'Open Cabinet'}
              </span>
            </button>

            {vanityDrawerOpen && (
              <div
                style={{
                  left: compartmentPos.drawer.btnLeft - 38,
                  top: compartmentPos.drawer.btnTop + 12,
                  zIndex: 12,
                }}
                className="absolute w-[180px] h-[64px] rounded-xl bg-[#F4FAFB]/95 border-2 border-[#0D9488]/65 shadow-xl pointer-events-none"
              />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dragOriginRef.current?.moved) return;
                soundEngine.playDrawerSlide();
                setVanityDrawerOpen((o) => !o);
                setFeedbackBanner({
                  text: !vanityDrawerOpen ? 'Pulled open the compartment drawer!' : 'Closed the drawer.',
                  ok: true,
                });
              }}
              style={{ left: compartmentPos.drawer.btnLeft, top: compartmentPos.drawer.btnTop, zIndex: 22 }}
              aria-label="Toggle drawer compartment"
              className={`absolute px-2.5 py-1 rounded-lg bg-[#F4FAFB]/95 hover:bg-white border border-[#0D9488] text-[10px] font-bold text-[#0F2933] shadow-sm transition-transform active:scale-95 ${
                hasTargetInDrawer && !vanityDrawerOpen ? 'ring-2 ring-[#0284C7]' : ''
              }`}
            >
              {vanityDrawerOpen ? 'Close Drawer' : 'Open Drawer'}
            </button>

            {/* Free Radar Warm Zone Indicator */}
            {warmZoneSpot && (
              <div
                className={`absolute pointer-events-none rounded-full border-4 border-dashed border-[#06B6D4] bg-[#06B6D4]/15 z-35 ${
                  reducedMotion ? '' : 'animate-pulse'
                }`}
                style={{
                  left: warmZoneSpot.x - 145,
                  top: warmZoneSpot.y - 145,
                  width: 290,
                  height: 290,
                }}
              />
            )}

            {/* Pinpoint Assistant Glowing Halo */}
            {hintedObject && (
              <div
                className={`absolute pointer-events-none rounded-full z-40 ${
                  reducedMotion ? '' : 'animate-pulse'
                } ${
                  highContrast
                    ? 'border-[6px] border-[#F59E0B] bg-[#F59E0B]/25 ring-4 ring-[#0F766E]'
                    : 'border-4 border-[#06B6D4] bg-[#06B6D4]/15 shadow-[0_0_24px_rgba(6,182,212,0.45)]'
                }`}
                style={{
                  left: hintedObject.x - 95,
                  top: hintedObject.y - 95,
                  width: 190,
                  height: 190,
                }}
              />
            )}

            {/* Bonus Mystery Treasure Boxes Inside the Room */}
            {mysteryBoxes.map((box) =>
              box.opened ? null : (
                <button
                  key={box.uid}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragOriginRef.current?.moved) return;
                    handleMysteryBoxTap(box);
                  }}
                  aria-label="Open Mystery Treasure Box"
                  style={{ left: box.x, top: box.y, zIndex: 42 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDE047] to-[#D97706] border-2 border-white shadow-[0_6px_14px_rgba(15,41,51,0.3)] flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Gift className="w-6 h-6 text-[#0F2933]" />
                </button>
              )
            )}

            {/* Scattered, Layered, Grounded Objects */}
            {objects.map((obj) => {
              if (obj.found) return null;
              if (obj.compartment === 'wardrobe_door' && !wardrobeOpen) return null;
              if (obj.compartment === 'vanity_drawer' && !vanityDrawerOpen) return null;

              const isBounced = bouncedUid === obj.uid;
              const isShaken = shakenUid === obj.uid;
              const isStudyGlow = isMemory && memoryCountdown > 0 && obj.isTarget;

              return (
                <button
                  key={obj.uid}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragOriginRef.current?.moved) return;
                    handleObjectClick(obj);
                  }}
                  aria-label={obj.def.name}
                  style={{
                    left: obj.x,
                    top: obj.y,
                    zIndex: isStudyGlow ? 50 : obj.zIndex,
                    transform: `translate(-50%, -50%) rotate(${obj.rotation}deg) scale(${
                      isBounced ? obj.scale * 1.24 : obj.scale
                    }) ${isShaken ? 'translateX(6px)' : ''}`,
                  }}
                  className={`absolute p-1 rounded-xl transition-transform duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0D9488] ${
                    isStudyGlow
                      ? 'ring-4 ring-[#F59E0B] bg-white/85 shadow-lg'
                      : 'hover:scale-110'
                  }`}
                >
                  {obj.memoryHidden ? (
                    <div className="w-12 h-12 rounded-2xl bg-[#99F6E4] border-2 border-[#0F766E] flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-[#0F2933]" />
                    </div>
                  ) : (
                    <HiddenObjectGraphic item={obj.def} className="w-12 h-12 sm:w-14 sm:h-14" />
                  )}
                </button>
              );
            })}

            {/* Delightful Discovery Shimmer Rings & Sparkle Particle Bursts */}
            {bursts.map((b) => (
              <div
                key={b.id}
                className="absolute pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-sparkle-bloom"
                style={{ left: b.x, top: b.y }}
              >
                {b.kind === 'discover' && (
                  <div className="relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-[#2DD4BF] bg-[#0D9488]/15 shadow-[0_0_22px_rgba(13,148,136,0.45)] flex items-center justify-center">
                      {b.def && <HiddenObjectGraphic item={b.def} className="w-12 h-12" />}
                    </div>
                    <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-[#0F766E] text-white font-mono-num text-xs font-bold shadow-md">
                      {b.label}
                    </div>
                  </div>
                )}
                {b.kind === 'box' && (
                  <div className="px-3 py-1 rounded-lg bg-[#F59E0B] text-white font-mono-num text-xs font-bold shadow-md flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    <span>{b.label}</span>
                  </div>
                )}
                {b.kind === 'pop' && (
                  <div className="px-2.5 py-0.5 rounded-lg bg-[#0284C7] text-white text-[11px] font-bold shadow">
                    {b.label}
                  </div>
                )}
                {b.kind === 'wrong' && (
                  <div className="w-6 h-6 rounded-full bg-rose-500/85 text-white text-xs font-bold flex items-center justify-center shadow">
                    ×
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Floating Zoom Controls */}
          <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.25)}
              className="btn-tactile h-11 w-11 rounded-xl bg-white/95 border border-[#CBE5E8] text-[#0F2933] shadow-sm flex items-center justify-center"
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.25)}
              className="btn-tactile h-11 w-11 rounded-xl bg-white/95 border border-[#CBE5E8] text-[#0F2933] shadow-sm flex items-center justify-center"
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="btn-tactile h-11 w-11 rounded-xl bg-white/95 border border-[#CBE5E8] text-[#0F766E] shadow-sm flex items-center justify-center"
              aria-label="Reset zoom"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Target Object Reference Strip */}
      {phase === 'searching' && (
        <div className="z-30 bg-[#F4FAFB]/95 border-t border-[#CBE5E8] px-3 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-xs font-bold text-[#356370] shrink-0 pr-1">
              Find:
            </span>
            {displayedTargets.map((target) => (
              <div
                key={target.uid}
                className={`shrink-0 px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                  target.found
                    ? 'bg-emerald-50 border-emerald-200 opacity-60'
                    : hintTargetUid === target.uid
                    ? 'bg-[#E0F2FE] border-[#0284C7] ring-2 ring-[#0284C7]/30'
                    : 'bg-white border-[#CBE5E8] shadow-xs'
                }`}
              >
                <HiddenObjectGraphic item={target.def} className="w-7 h-7 shrink-0" />
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    target.found ? 'line-through text-emerald-800' : 'text-[#0F2933]'
                  }`}
                >
                  {target.def.name}
                </span>
                {target.found && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {paused && phase !== 'finished' && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/60 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <h3 className="font-display text-2xl font-bold text-[#0F2933]">Search Paused</h3>
            <p className="text-xs text-[#356370]">
              Explore {activeRoomMeta.name}, zoom in on furniture surfaces, and open panels or drawers to discover every hidden treasure!
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
              >
                Resume Search
              </button>
              <button
                type="button"
                onClick={() => handleRestart()}
                className="btn-tactile w-full py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-[#0F2933] font-semibold text-sm"
              >
                Restart Room
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 rounded-xl text-[#356370] font-medium text-sm"
              >
                Exit to Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion / Failure Modal */}
      {wonResult && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/60 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <p className="text-xs font-semibold text-[#0284C7]">
              {wonResult.won ? 'Search Mission Complete' : 'Time Expired'}
            </p>
            <h3 className="font-display text-3xl font-bold text-[#0F2933]">
              {wonResult.won ? 'Eagle-Eyed Icon!' : 'So Close!'}
            </h3>

            {wonResult.won && (
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-7 h-7 ${
                      s <= wonResult.stars ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBE5E8]'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#CBE5E8]">
              <div>
                <div className="text-xs text-[#356370]">Found</div>
                <div className="font-mono-num text-lg font-bold text-[#0F2933]">
                  {wonResult.found}/{targets.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Coins</div>
                <div className="font-mono-num text-lg font-bold text-[#D97706]">+{wonResult.coins}</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Credits</div>
                <div className="font-mono-num text-lg font-bold text-[#0F766E]">+{wonResult.credits}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleRestart()}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play New Layout</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="btn-tactile w-full py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-[#0F2933] font-semibold text-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
