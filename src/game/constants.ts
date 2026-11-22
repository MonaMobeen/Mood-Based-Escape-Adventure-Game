import type { CharacterStyle, HairStyleId, OutfitId, SidekickId, StageConfig } from './types';

export const OUTFIT_META: Record<
  OutfitId,
  {
    label: string;
    perk: string;
    primary: string;
    secondary: string;
    trim: string;
    speedBonus: number;
    magnetRadius: number;
    gravityScale: number;
    extraMaxHearts: number;
  }
> = {
  malibu_skater: {
    label: 'Coastal Skater',
    perk: '+12% Glide Speed',
    primary: '#0D9488',
    secondary: '#0284C7',
    trim: '#FDE047',
    speedBonus: 1.12,
    magnetRadius: 88,
    gravityScale: 1.0,
    extraMaxHearts: 0,
  },
  pop_star: {
    label: 'Ocean Pop',
    perk: 'Wide Gem Aura',
    primary: '#0284C7',
    secondary: '#0F766E',
    trim: '#F8FAFC',
    speedBonus: 1.03,
    magnetRadius: 178,
    gravityScale: 0.98,
    extraMaxHearts: 0,
  },
  starlight_gown: {
    label: 'Seafoam Gown',
    perk: 'Graceful Float +1 Heart',
    primary: '#14B8A6',
    secondary: '#FDE68A',
    trim: '#FFFFFF',
    speedBonus: 1.0,
    magnetRadius: 108,
    gravityScale: 0.84,
    extraMaxHearts: 1,
  },
};

export const HAIR_META: Record<
  HairStyleId,
  {
    label: string;
    base: string;
    highlight: string;
    shadow: string;
  }
> = {
  blonde_wave: {
    label: 'Sunlit Blonde',
    base: '#F7D060',
    highlight: '#FFF4BC',
    shadow: '#C68D24',
  },
  brunette_sleek: {
    label: 'Espresso Silk',
    base: '#4A2C23',
    highlight: '#784D40',
    shadow: '#271510',
  },
  rose_curl: {
    label: 'Coral Pearl',
    base: '#E8799A',
    highlight: '#FFD1E1',
    shadow: '#B8476B',
  },
};

export const SIDEKICK_META: Record<
  SidekickId,
  {
    label: string;
  }
> = {
  none: { label: 'Solo Icon' },
  puppy: { label: 'Taffy Pup' },
  cockatoo: { label: 'Coco Bird' },
};

export const DEFAULT_STYLE: CharacterStyle = {
  outfit: 'malibu_skater',
  hair: 'blonde_wave',
  sidekick: 'puppy',
};

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: 'Ocean-Side Boardwalk',
    subtitle: 'Sea-green waves, sunlit palms, and gentle coastal breeze',
    biome: 'ocean_road',
    targetDistance: 720,
    baseSpeed: 405,
    skyTop: '#CBEFF5',
    skyMid: '#E6FBF9',
    skyBottom: '#FEF6E4',
    sunColor: '#FCD34D',
    oceanColor: '#0EA5E9',
    groundTop: '#E8C597',
    groundTrim: '#0D9488',
    groundBody: '#9F744C',
    accentColor: '#0F766E',
    isEvening: false,
  },
  {
    id: 2,
    name: 'Colorful Harbor City',
    subtitle: 'Sunlit promenades, artisan cafes, and lively coastal rooftops',
    biome: 'colorful_city',
    targetDistance: 900,
    baseSpeed: 440,
    skyTop: '#BAE6FD',
    skyMid: '#E0F2FE',
    skyBottom: '#FEF3C7',
    sunColor: '#FDE68A',
    oceanColor: '#0284C7',
    groundTop: '#E2E8F0',
    groundTrim: '#0284C7',
    groundBody: '#64748B',
    accentColor: '#0284C7',
    isEvening: false,
  },
  {
    id: 3,
    name: 'Magical Emerald Forest',
    subtitle: 'Mossy woodland paths, glowing ferns, and dappled canopy light',
    biome: 'magical_forest',
    targetDistance: 1050,
    baseSpeed: 465,
    skyTop: '#D1FAE5',
    skyMid: '#ECFDF5',
    skyBottom: '#FEF9C3',
    sunColor: '#FDE047',
    oceanColor: '#059669',
    groundTop: '#A7F3D0',
    groundTrim: '#059669',
    groundBody: '#57534E',
    accentColor: '#047857',
    isEvening: false,
  },
  {
    id: 4,
    name: 'Fantasy Lagoon Island',
    subtitle: 'Crystal turquoise shores, wooden piers, and tropical blossoms',
    biome: 'fantasy_island',
    targetDistance: 1180,
    baseSpeed: 485,
    skyTop: '#A5F3FC',
    skyMid: '#CCFBF1',
    skyBottom: '#FFFBEB',
    sunColor: '#FBBF24',
    oceanColor: '#06B6D4',
    groundTop: '#FDE68A',
    groundTrim: '#0D9488',
    groundBody: '#B45309',
    accentColor: '#0891B2',
    isEvening: false,
  },
  {
    id: 5,
    name: 'Sunlit Mountain Trail',
    subtitle: 'Crisp alpine ridges, misty peaks, and pine-scented stone paths',
    biome: 'mountain_trail',
    targetDistance: 1300,
    baseSpeed: 505,
    skyTop: '#E0E7FF',
    skyMid: '#E0F2FE',
    skyBottom: '#F8FAFC',
    sunColor: '#FEF08A',
    oceanColor: '#4F46E5',
    groundTop: '#CBD5E1',
    groundTrim: '#475569',
    groundBody: '#334155',
    accentColor: '#4338CA',
    isEvening: false,
  },
  {
    id: 6,
    name: 'Dreamy Starlight Night',
    subtitle: 'Lantern-lit waterfront beneath twinkling stars and gentle aurora',
    biome: 'dreamy_night',
    targetDistance: 1450,
    baseSpeed: 525,
    skyTop: '#061A23',
    skyMid: '#0D3B49',
    skyBottom: '#115E59',
    sunColor: '#FDE68A',
    oceanColor: '#083344',
    groundTop: '#0F766E',
    groundTrim: '#FCD34D',
    groundBody: '#093E3A',
    accentColor: '#2DD4BF',
    isEvening: true,
  },
];

export const PHYSICS = {
  gravity: 2150,
  jumpVelocity: -790,
  doubleJumpVelocity: -700,
  coyoteTime: 0.115,
  jumpBufferTime: 0.125,
  slideDuration: 0.56,
  twirlDuration: 0.44,
  twirlCooldown: 3.0,
  glamFeverDuration: 6.5,
  invulnDuration: 1.35,
  comboTimeout: 2.6,
};
