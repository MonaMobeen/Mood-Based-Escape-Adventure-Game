import type { StorageZoneId } from './catalog';

export type SearchCategory =
  | 'clothes'
  | 'shoes_bags'
  | 'hair_tools'
  | 'jewelry'
  | 'beauty'
  | 'study_toys'
  | 'decor';

export type HiddenShapeId =
  | 'comb'
  | 'hairbrush'
  | 'bow_clip'
  | 'headband'
  | 'curling_wand'
  | 'necklace'
  | 'earrings'
  | 'ring'
  | 'bracelet'
  | 'tiara'
  | 'watch'
  | 'lipstick'
  | 'perfume'
  | 'palette'
  | 'compact'
  | 'serum'
  | 'nail_polish'
  | 'makeup_brush'
  | 'dress'
  | 'shirt'
  | 'skirt'
  | 'jacket'
  | 'heels'
  | 'sneakers'
  | 'skates'
  | 'handbag'
  | 'clutch'
  | 'sunglasses'
  | 'book'
  | 'pen_cup'
  | 'plushie'
  | 'camera'
  | 'headphones'
  | 'lamp'
  | 'plant'
  | 'pillow'
  | 'teacup'
  | 'candle';

export interface HiddenObjectDef {
  id: string;
  name: string;
  category: SearchCategory;
  shape: HiddenShapeId;
  colorName: string;
  primaryColor: string;
  accentColor: string;
  targetZone: StorageZoneId;
  areaHint: string;
}

interface ColorPaletteDef {
  name: string;
  primary: string;
  accent: string;
}

const PALETTES: ColorPaletteDef[] = [
  { name: 'Pink', primary: '#FF2D95', accent: '#FFE4EC' },
  { name: 'Hot Magenta', primary: '#E0218A', accent: '#FDE68A' },
  { name: 'Golden', primary: '#F59E0B', accent: '#FEF3C7' },
  { name: 'Diamond', primary: '#BAE6FD', accent: '#FFFFFF' },
  { name: 'Malibu Aqua', primary: '#00B4D8', accent: '#E0F7FA' },
  { name: 'Rose Pearl', primary: '#F472B6', accent: '#FFF5F8' },
  { name: 'Lavender', primary: '#A855F7', accent: '#F3E8FF' },
  { name: 'Coral', primary: '#FB7185', accent: '#FFF1F2' },
  { name: 'Champagne', primary: '#FBBF24', accent: '#FFFBEB' },
  { name: 'Ruby', primary: '#E11D48', accent: '#FFE4E6' },
];

interface ShapeTemplate {
  shape: HiddenShapeId;
  category: SearchCategory;
  targetZone: StorageZoneId;
  nouns: string[];
}

const TEMPLATES: ShapeTemplate[] = [
  // Hair Tools (6 shapes * 5-6 palettes)
  { shape: 'comb', category: 'hair_tools', targetZone: 'vanity', nouns: ['Comb', 'Styling Comb', 'Pocket Comb'] },
  { shape: 'hairbrush', category: 'hair_tools', targetZone: 'vanity', nouns: ['Hairbrush', 'Paddle Brush', 'Detangler'] },
  { shape: 'bow_clip', category: 'hair_tools', targetZone: 'vanity', nouns: ['Hair Bow', 'Satin Clip', 'Ribbon Barrette'] },
  { shape: 'headband', category: 'hair_tools', targetZone: 'vanity', nouns: ['Headband', 'Pearl Band', 'Velvet Band'] },
  { shape: 'curling_wand', category: 'hair_tools', targetZone: 'vanity', nouns: ['Hair Wand', 'Curl Styler', 'Wave Iron'] },

  // Jewelry (6 shapes)
  { shape: 'necklace', category: 'jewelry', targetZone: 'vanity', nouns: ['Necklace', 'Pendant Chain', 'Choker'] },
  { shape: 'earrings', category: 'jewelry', targetZone: 'vanity', nouns: ['Earrings', 'Drop Earrings', 'Stud Pair'] },
  { shape: 'ring', category: 'jewelry', targetZone: 'vanity', nouns: ['Ring', 'Sparkle Ring', 'Signet Ring'] },
  { shape: 'bracelet', category: 'jewelry', targetZone: 'vanity', nouns: ['Bracelet', 'Charm Bangle', 'Cuff'] },
  { shape: 'tiara', category: 'jewelry', targetZone: 'closet', nouns: ['Tiara', 'Princess Crown', 'Headpiece'] },
  { shape: 'watch', category: 'jewelry', targetZone: 'vanity', nouns: ['Wristwatch', 'Glam Watch', 'Timepiece'] },

  // Beauty & Makeup (7 shapes)
  { shape: 'lipstick', category: 'beauty', targetZone: 'vanity', nouns: ['Lipstick', 'Lip Gloss', 'Velvet Lip'] },
  { shape: 'perfume', category: 'beauty', targetZone: 'vanity', nouns: ['Perfume Bottle', 'Eau de Parfum', 'Mist Bottle'] },
  { shape: 'palette', category: 'beauty', targetZone: 'vanity', nouns: ['Makeup Palette', 'Eye Shadow', 'Blush Kit'] },
  { shape: 'compact', category: 'beauty', targetZone: 'vanity', nouns: ['Compact Mirror', 'Powder Case', 'Pocket Mirror'] },
  { shape: 'serum', category: 'beauty', targetZone: 'vanity', nouns: ['Glow Serum', 'Skincare Dropper', 'Face Essence'] },
  { shape: 'nail_polish', category: 'beauty', targetZone: 'vanity', nouns: ['Nail Polish', 'Gloss Lacquer', 'Nail Enamel'] },
  { shape: 'makeup_brush', category: 'beauty', targetZone: 'vanity', nouns: ['Blush Brush', 'Powder Brush', 'Kabuki Brush'] },

  // Clothes (4 shapes)
  { shape: 'dress', category: 'clothes', targetZone: 'closet', nouns: ['Party Dress', 'Satin Gown', 'Sundress'] },
  { shape: 'shirt', category: 'clothes', targetZone: 'closet', nouns: ['Blouse', 'Ruffle Top', 'Tee'] },
  { shape: 'skirt', category: 'clothes', targetZone: 'closet', nouns: ['Pleated Skirt', 'Mini Skirt', 'Tulle Skirt'] },
  { shape: 'jacket', category: 'clothes', targetZone: 'closet', nouns: ['Cropped Jacket', 'Varsity Coat', 'Blazer'] },

  // Shoes & Bags (6 shapes)
  { shape: 'heels', category: 'shoes_bags', targetZone: 'closet', nouns: ['Missing Heel', 'Stiletto Shoe', 'Party Pump'] },
  { shape: 'sneakers', category: 'shoes_bags', targetZone: 'closet', nouns: ['Sneaker', 'High-Top Shoe', 'Trainer'] },
  { shape: 'skates', category: 'shoes_bags', targetZone: 'closet', nouns: ['Roller Skate', 'Boardwalk Skate', 'Quad Skate'] },
  { shape: 'handbag', category: 'shoes_bags', targetZone: 'closet', nouns: ['Handbag', 'Tote Bag', 'Shoulder Bag'] },
  { shape: 'clutch', category: 'shoes_bags', targetZone: 'closet', nouns: ['Evening Clutch', 'Glam Purse', 'Mini Bag'] },
  { shape: 'sunglasses', category: 'shoes_bags', targetZone: 'closet', nouns: ['Sunglasses', 'Cat-Eye Shades', 'Sun Frames'] },

  // Study & Toys (5 shapes)
  { shape: 'book', category: 'study_toys', targetZone: 'shelves', nouns: ['Diary', 'Fashion Book', 'Notebook'] },
  { shape: 'pen_cup', category: 'study_toys', targetZone: 'shelves', nouns: ['Pen Holder', 'Marker Cup', 'Stationery Set'] },
  { shape: 'plushie', category: 'study_toys', targetZone: 'shelves', nouns: ['Plush Toy', 'Bunny Plush', 'Teddy Bear'] },
  { shape: 'camera', category: 'study_toys', targetZone: 'shelves', nouns: ['Instant Camera', 'Vlog Cam', 'Photo Camera'] },
  { shape: 'headphones', category: 'study_toys', targetZone: 'shelves', nouns: ['Headphones', 'Studio Beats', 'Music Headset'] },

  // Decor & Everyday (5 shapes)
  { shape: 'lamp', category: 'decor', targetZone: 'storage_box', nouns: ['Table Lamp', 'Vanity Light', 'Bedside Lamp'] },
  { shape: 'plant', category: 'decor', targetZone: 'storage_box', nouns: ['Succulent Pot', 'Mini Plant', 'Flower Pot'] },
  { shape: 'pillow', category: 'decor', targetZone: 'storage_box', nouns: ['Heart Pillow', 'Velvet Cushion', 'Throw Pillow'] },
  { shape: 'teacup', category: 'decor', targetZone: 'storage_box', nouns: ['Latte Mug', 'Teacup', 'Matcha Cup'] },
  { shape: 'candle', category: 'decor', targetZone: 'storage_box', nouns: ['Scented Candle', 'Rose Jar Candle', 'Spa Candle'] },
];

function buildCatalog(): HiddenObjectDef[] {
  const list: HiddenObjectDef[] = [];
  let idx = 0;
  for (const tpl of TEMPLATES) {
    for (let p = 0; p < PALETTES.length; p++) {
      const pal = PALETTES[p];
      const noun = tpl.nouns[(p + idx) % tpl.nouns.length];
      list.push({
        id: `ho_${tpl.shape}_${p}`,
        name: `${pal.name} ${noun}`,
        category: tpl.category,
        shape: tpl.shape,
        colorName: pal.name,
        primaryColor: pal.primary,
        accentColor: pal.accent,
        targetZone: tpl.targetZone,
        areaHint: '',
      });
      idx++;
    }
  }
  return list;
}

// 380 unique searchable items!
export const HIDDEN_OBJECT_CATALOG: HiddenObjectDef[] = buildCatalog();

export type SearchSubMode =
  | 'messy_room'
  | 'closet_hunt'
  | 'jewelry_hunt'
  | 'makeup_mystery'
  | 'room_organize'
  | 'memory_challenge'
  | 'time_challenge';

export const SEARCH_MODE_META: Record<
  SearchSubMode,
  {
    title: string;
    subtitle: string;
    categories: SearchCategory[];
    roomLabel: string;
    wallBg: string;
    floorBg: string;
  }
> = {
  messy_room: {
    title: 'Messy Room Adventure',
    subtitle: "Explore the coastal suite and tap the requested treasures",
    categories: ['clothes', 'shoes_bags', 'hair_tools', 'jewelry', 'beauty', 'study_toys', 'decor'],
    roomLabel: 'Coastal Master Bedroom',
    wallBg: '#DDF2EF',
    floorBg: '#E6F4F5',
  },
  closet_hunt: {
    title: 'Closet Hunt',
    subtitle: 'Find dresses, shoes, handbags & accessories inside the overflowing wardrobe',
    categories: ['clothes', 'shoes_bags', 'hair_tools'],
    roomLabel: 'Coastal Dressing Wing',
    wallBg: '#F0FDFA',
    floorBg: '#E0F2FE',
  },
  jewelry_hunt: {
    title: 'Jewelry Hunt',
    subtitle: 'Search velvet trays & dresser corners for hidden necklaces, earrings & rings',
    categories: ['jewelry', 'hair_tools'],
    roomLabel: 'Ocean Pearl Boudoir',
    wallBg: '#ECFEFF',
    floorBg: '#CCFBF1',
  },
  makeup_mystery: {
    title: 'Makeup Mystery',
    subtitle: 'Spot lipsticks, serums, palettes & perfumes across the cluttered vanity',
    categories: ['beauty', 'hair_tools'],
    roomLabel: 'Sunlit Vanity Counter',
    wallBg: '#F0F9FF',
    floorBg: '#E6F4F5',
  },
  room_organize: {
    title: 'Find & Organize',
    subtitle: 'First find all hidden items in the room, then sort them into their right zones',
    categories: ['clothes', 'shoes_bags', 'beauty', 'study_toys', 'decor'],
    roomLabel: 'Dream Room Cleanup',
    wallBg: '#ECFEFF',
    floorBg: '#F0FDFA',
  },
  memory_challenge: {
    title: 'Memory Challenge',
    subtitle: 'Memorize where target items sit for 6 seconds before the clutter covers them!',
    categories: ['jewelry', 'beauty', 'shoes_bags', 'study_toys'],
    roomLabel: 'Twilight Memory Suite',
    wallBg: '#E0F2FE',
    floorBg: '#CCFBF1',
  },
  time_challenge: {
    title: 'Time Challenge Blitz',
    subtitle: 'Find as many requested objects as possible in 60 seconds for huge bonus Credits!',
    categories: ['clothes', 'shoes_bags', 'hair_tools', 'jewelry', 'beauty', 'study_toys', 'decor'],
    roomLabel: 'Coastal Speed Search',
    wallBg: '#FFFBEB',
    floorBg: '#E0F2FE',
  },
};

export type SearchRoomLocationId =
  | 'bedroom'
  | 'bathroom'
  | 'dressing_room'
  | 'kitchen'
  | 'garden'
  | 'beach_house'
  | 'fantasy_library'
  | 'magical_island';

export interface SearchRoomLocationDef {
  id: SearchRoomLocationId;
  name: string;
  unlockCost: number;
  wallBg: string;
  floorBg: string;
  accent: string;
}

export const SEARCH_ROOM_LOCATIONS: SearchRoomLocationDef[] = [
  { id: 'bedroom', name: 'Cozy Bedroom', unlockCost: 0, wallBg: '#DDF2EF', floorBg: '#E6F4F5', accent: '#0F766E' },
  { id: 'beach_house', name: 'Coastal Beach House', unlockCost: 0, wallBg: '#E0F7FA', floorBg: '#F0FDFA', accent: '#0284C7' },
  { id: 'bathroom', name: 'Spa Ocean Bathroom', unlockCost: 160, wallBg: '#E0F7FA', floorBg: '#CCFBF1', accent: '#0284C7' },
  { id: 'dressing_room', name: 'Dressing Room', unlockCost: 220, wallBg: '#F0FDFA', floorBg: '#E0F2FE', accent: '#0D9488' },
  { id: 'kitchen', name: 'Sunlit Kitchen', unlockCost: 280, wallBg: '#FFFBEB', floorBg: '#E6F4F5', accent: '#D97706' },
  { id: 'garden', name: 'Emerald Garden', unlockCost: 320, wallBg: '#ECFDF5', floorBg: '#CCFBF1', accent: '#059669' },
  { id: 'fantasy_library', name: 'Fantasy Library', unlockCost: 360, wallBg: '#FEF3C7', floorBg: '#FDE68A', accent: '#B45309' },
  { id: 'magical_island', name: 'Magical Dream Island', unlockCost: 420, wallBg: '#CCFBF1', floorBg: '#E0F7FA', accent: '#0F766E' },
];
