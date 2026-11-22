export type ItemCategory = 'wardrobe' | 'beauty' | 'study' | 'decor';
export type StorageZoneId = 'closet' | 'vanity' | 'shelves' | 'storage_box';

export interface RoomItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  targetZone: StorageZoneId;
  color: string;
  accent: string;
  iconType:
    | 'dress'
    | 'heels'
    | 'handbag'
    | 'necklace'
    | 'sunglasses'
    | 'sneakers'
    | 'perfume'
    | 'lipstick'
    | 'palette'
    | 'serum'
    | 'brush'
    | 'mirror'
    | 'journal'
    | 'pens'
    | 'plushie'
    | 'jewelry_box'
    | 'lamp'
    | 'plant'
    | 'cushion'
    | 'frame';
}

export interface StorageZoneDef {
  id: StorageZoneId;
  label: string;
  subtitle: string;
  accent: string;
  bgTint: string;
}

export const STORAGE_ZONES: StorageZoneDef[] = [
  {
    id: 'closet',
    label: 'Dream Wardrobe',
    subtitle: 'Dresses, shoes & bags',
    accent: '#0F766E',
    bgTint: '#F0FDFA',
  },
  {
    id: 'vanity',
    label: 'Vanity Organizer',
    subtitle: 'Makeup, perfume & skincare',
    accent: '#0284C7',
    bgTint: '#F0F9FF',
  },
  {
    id: 'shelves',
    label: 'Study & Display Shelf',
    subtitle: 'Books, toys & keepsakes',
    accent: '#0D9488',
    bgTint: '#ECFEFF',
  },
  {
    id: 'storage_box',
    label: 'Deco Storage Trunk',
    subtitle: 'Lamps, pillows & room decor',
    accent: '#D97706',
    bgTint: '#FFFBEB',
  },
];

export const ROOM_ITEMS: RoomItemDef[] = [
  // Wardrobe
  { id: 'silk_gown', name: 'Seafoam Satin Gown', category: 'wardrobe', targetZone: 'closet', color: '#0D9488', accent: '#CCFBF1', iconType: 'dress' },
  { id: 'crystal_heels', name: 'Crystal Pumps', category: 'wardrobe', targetZone: 'closet', color: '#0284C7', accent: '#FDE68A', iconType: 'heels' },
  { id: 'malibu_tote', name: 'Coastal Tote Bag', category: 'wardrobe', targetZone: 'closet', color: '#06B6D4', accent: '#FFFFFF', iconType: 'handbag' },
  { id: 'pearl_choker', name: 'Pearl Necklace', category: 'wardrobe', targetZone: 'closet', color: '#F8FAFC', accent: '#F59E0B', iconType: 'necklace' },
  { id: 'heart_shades', name: 'Resort Sunglasses', category: 'wardrobe', targetZone: 'closet', color: '#0F766E', accent: '#BAE6FD', iconType: 'sunglasses' },
  { id: 'roller_kicks', name: 'Coral Sneakers', category: 'wardrobe', targetZone: 'closet', color: '#FB7185', accent: '#FFFFFF', iconType: 'sneakers' },

  // Beauty
  { id: 'rose_perfume', name: 'Ocean Breeze Eau', category: 'beauty', targetZone: 'vanity', color: '#38BDF8', accent: '#FBBF24', iconType: 'perfume' },
  { id: 'velvet_lip', name: 'Velvet Lip Gloss', category: 'beauty', targetZone: 'vanity', color: '#E0218A', accent: '#FCD34D', iconType: 'lipstick' },
  { id: 'glam_palette', name: 'Coastal Palette', category: 'beauty', targetZone: 'vanity', color: '#0D9488', accent: '#2DD4BF', iconType: 'palette' },
  { id: 'glow_serum', name: 'Dewy Glow Serum', category: 'beauty', targetZone: 'vanity', color: '#0284C7', accent: '#FFFFFF', iconType: 'serum' },
  { id: 'silk_brush', name: 'Detangle Brush', category: 'beauty', targetZone: 'vanity', color: '#14B8A6', accent: '#F0FDFA', iconType: 'brush' },
  { id: 'pearl_compact', name: 'Compact Mirror', category: 'beauty', targetZone: 'vanity', color: '#FBBF24', accent: '#E0F2FE', iconType: 'mirror' },

  // Study & Personal
  { id: 'dream_journal', name: 'Coastal Journal', category: 'study', targetZone: 'shelves', color: '#0284C7', accent: '#FDE68A', iconType: 'journal' },
  { id: 'glitter_pens', name: 'Gel Pen Cup', category: 'study', targetZone: 'shelves', color: '#06B6D4', accent: '#2DD4BF', iconType: 'pens' },
  { id: 'bunny_plush', name: 'Sea-Seal Plushie', category: 'study', targetZone: 'shelves', color: '#99F6E4', accent: '#0F766E', iconType: 'plushie' },
  { id: 'music_box', name: 'Keepsake Box', category: 'study', targetZone: 'shelves', color: '#F59E0B', accent: '#FFFBEB', iconType: 'jewelry_box' },

  // Decor
  { id: 'shell_lamp', name: 'Seashell Lamp', category: 'decor', targetZone: 'storage_box', color: '#FDE68A', accent: '#0D9488', iconType: 'lamp' },
  { id: 'palm_pot', name: 'Mini Palm Planter', category: 'decor', targetZone: 'storage_box', color: '#10B981', accent: '#CCFBF1', iconType: 'plant' },
  { id: 'velvet_pillow', name: 'Teal Velvet Cushion', category: 'decor', targetZone: 'storage_box', color: '#0D9488', accent: '#F0FDFA', iconType: 'cushion' },
  { id: 'malibu_frame', name: 'Ocean Horizon Frame', category: 'decor', targetZone: 'storage_box', color: '#F59E0B', accent: '#BAE6FD', iconType: 'frame' },
];

export interface BoutiqueItemDef {
  id: string;
  name: string;
  slot: 'accessory' | 'bag' | 'shoes' | 'decor';
  price: number;
  styleScore: number;
  tag: 'Beach' | 'Pop' | 'Gala' | 'Cozy';
  color: string;
  description: string;
}

export const BOUTIQUE_ITEMS: BoutiqueItemDef[] = [
  { id: 'acc_heart_shades', name: 'Malibu Coral Shades', slot: 'accessory', price: 120, styleScore: 28, tag: 'Beach', color: '#FB7185', description: 'Glossy coral-tinted frames for boardwalk sun.' },
  { id: 'acc_pearl_tiara', name: 'Starlight Pearl Tiara', slot: 'accessory', price: 240, styleScore: 45, tag: 'Gala', color: '#F59E0B', description: 'Delicate champagne crown for evening galas.' },
  { id: 'acc_star_headset', name: 'Ocean Pop Headset', slot: 'accessory', price: 180, styleScore: 36, tag: 'Pop', color: '#0284C7', description: 'Stage-ready shimmer headset for concerts.' },
  { id: 'acc_flower_crown', name: 'Botanical Blossom Crown', slot: 'accessory', price: 140, styleScore: 38, tag: 'Cozy', color: '#10B981', description: 'Woven sanctuary blossoms unlocked in Peaceful World or Boutique.' },
  { id: 'bag_shell_clutch', name: 'Seashell Mini Clutch', slot: 'bag', price: 150, styleScore: 32, tag: 'Beach', color: '#06B6D4', description: 'Iridescent turquoise clutch with pearl strap.' },
  { id: 'bag_velvet_tote', name: 'Emerald Velvet Tote', slot: 'bag', price: 210, styleScore: 40, tag: 'Gala', color: '#0F766E', description: 'Structured deep-teal tote with gold clasp.' },
  { id: 'shoe_aqua_skates', name: 'Retro Aqua Skates', slot: 'shoes', price: 160, styleScore: 35, tag: 'Beach', color: '#00C2D1', description: 'Smooth-glide boardwalk roller skates.' },
  { id: 'shoe_crystal_heels', name: 'Seafoam Crystal Heels', slot: 'shoes', price: 260, styleScore: 48, tag: 'Gala', color: '#2DD4BF', description: 'Sculpted satin heels with diamond buckle.' },
  { id: 'dec_neon_mirror', name: 'Vanity Halo Mirror', slot: 'decor', price: 220, styleScore: 42, tag: 'Cozy', color: '#FBBF24', description: 'Warm LED vanity mirror for your Dream Room.' },
  { id: 'dec_palm_canopy', name: 'Coastal Canopy Drape', slot: 'decor', price: 280, styleScore: 50, tag: 'Cozy', color: '#0D9488', description: 'Sheer sea-green canopy with soft fairy lights.' },
  { id: 'dec_disco_globe', name: 'Sapphire Mirror Ball', slot: 'decor', price: 190, styleScore: 38, tag: 'Pop', color: '#0EA5E9', description: 'Sparkling ocean-blue globe for studio dance.' },
];

export interface FashionPaletteDef {
  id: string;
  name: string;
  top: string;
  mid: string;
  floor: string;
  accent: string;
}

export const FASHION_PALETTES: FashionPaletteDef[] = [
  { id: 'sage_mint', name: 'Sage & Sky', top: '#ECFDF5', mid: '#CCFBF1', floor: '#059669', accent: '#10B981' },
  { id: 'lavender_mist', name: 'Lavender Mist', top: '#F5F3FF', mid: '#EDE9FE', floor: '#6D28D9', accent: '#8B5CF6' },
  { id: 'rose_coral', name: 'Rose Coral', top: '#FFF1F2', mid: '#FFE4E6', floor: '#E11D48', accent: '#FB7185' },
  { id: 'coastal_cream', name: 'Coastal Cream', top: '#FFFBEB', mid: '#FEF3C7', floor: '#D97706', accent: '#F59E0B' },
  { id: 'ocean_teal', name: 'Deep Ocean', top: '#E0F7FA', mid: '#BAE6FD', floor: '#0F766E', accent: '#0284C7' },
];

export interface GardenFlowerDef {
  id: string;
  name: string;
  petalColor: string;
  centerColor: string;
  stemColor: string;
  rewardCoins: number;
}

export const GARDEN_FLOWERS: GardenFlowerDef[] = [
  { id: 'lavender_sprig', name: 'Wild Lavender', petalColor: '#A78BFA', centerColor: '#FEF08A', stemColor: '#15803D', rewardCoins: 24 },
  { id: 'seafoam_lotus', name: 'Seafoam Lotus', petalColor: '#2DD4BF', centerColor: '#FDE047', stemColor: '#0F766E', rewardCoins: 30 },
  { id: 'sunlit_sunflower', name: 'Sunlit Blossom', petalColor: '#FBBF24', centerColor: '#92400E', stemColor: '#16A34A', rewardCoins: 28 },
  { id: 'coral_hibiscus', name: 'Coral Hibiscus', petalColor: '#FB7185', centerColor: '#FEF08A', stemColor: '#15803D', rewardCoins: 32 },
  { id: 'starlight_lily', name: 'Starlight Lily', petalColor: '#E0F2FE', centerColor: '#38BDF8', stemColor: '#0D9488', rewardCoins: 36 },
];

export interface GardenDecorDef {
  id: string;
  name: string;
  subtitle: string;
  unlockCost: number;
  accent: string;
}

export const GARDEN_DECOR: GardenDecorDef[] = [
  { id: 'timber_bench', name: 'Cedar Garden Bench', subtitle: 'Resting spot by the water', unlockCost: 0, accent: '#92400E' },
  { id: 'stone_lantern', name: 'Moss Stone Lantern', subtitle: 'Warm glow at sunset & night', unlockCost: 0, accent: '#64748B' },
  { id: 'marble_birdbath', name: 'Coastal Birdbath', subtitle: 'Attracts songbirds & ripples', unlockCost: 110, accent: '#0284C7' },
  { id: 'fairy_pergola', name: 'Vine Pergola Arch', subtitle: 'Framed floral canopy', unlockCost: 160, accent: '#059669' },
  { id: 'bamboo_chime', name: 'Bamboo Wind Chime', subtitle: 'Gentle breeze melody', unlockCost: 140, accent: '#D97706' },
];

export interface GardenSanctuaryDef {
  id: string;
  name: string;
  subtitle: string;
  unlockCost: number;
  imageUrl: string;
}

export const GARDEN_SANCTUARIES: GardenSanctuaryDef[] = [
  {
    id: 'waterfall_garden',
    name: 'Waterfall Flower Sanctuary',
    subtitle: 'Lush botanical stream, footbridge & sunlit stone terrace',
    unlockCost: 0,
    imageUrl: '/src/assets/images/peaceful_garden_sanctuary_1795350069605.jpg',
  },
  {
    id: 'dream_island',
    name: 'Dream Island Lagoon',
    subtitle: 'Crystal turquoise tide, lantern paths & flower coves',
    unlockCost: 0,
    imageUrl: '/src/assets/images/dream_island_sanctuary_1795350069153.jpg',
  },
  {
    id: 'emerald_terrace',
    name: 'Emerald Garden Terrace',
    subtitle: 'Sunlit pergola courtyard with tiered fountain',
    unlockCost: 180,
    imageUrl: '/src/assets/images/coastal_emerald_garden_1795346856008.jpg',
  },
];

export interface RoomThemeDef {
  id: string;
  name: string;
  unlockCost: number;
  unlockLevel: number;
  wallFrom: string;
  wallTo: string;
  floorColor: string;
  trimColor: string;
}

export const ROOM_THEMES: RoomThemeDef[] = [
  {
    id: 'ocean_breeze',
    name: 'Coastal Teal Suite',
    unlockCost: 0,
    unlockLevel: 1,
    wallFrom: '#DDF4F3',
    wallTo: '#F4FAFB',
    floorColor: '#DCEEEF',
    trimColor: '#0F766E',
  },
  {
    id: 'malibu_blush',
    name: 'Rose Coral Accent',
    unlockCost: 0,
    unlockLevel: 1,
    wallFrom: '#FFE8EF',
    wallTo: '#FFF7FA',
    floorColor: '#FCEBF1',
    trimColor: '#E0218A',
  },
  {
    id: 'champagne_gala',
    name: 'Warm Oak Villa',
    unlockCost: 450,
    unlockLevel: 5,
    wallFrom: '#FEF3C7',
    wallTo: '#FFFBEB',
    floorColor: '#FDE68A',
    trimColor: '#D97706',
  },
  {
    id: 'starlight_penthouse',
    name: 'Deep Ocean Penthouse',
    unlockCost: 750,
    unlockLevel: 9,
    wallFrom: '#0F2933',
    wallTo: '#134E4A',
    floorColor: '#083344',
    trimColor: '#2DD4BF',
  },
];
