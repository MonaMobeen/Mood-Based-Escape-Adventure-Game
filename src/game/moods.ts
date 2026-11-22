import type { PlayableModeRoute } from '../components/ModesHub';

export type MoodId =
  | 'tired'
  | 'bored'
  | 'relax'
  | 'adventure'
  | 'creative'
  | 'satisfying'
  | 'explore';

export interface MoodRecommendation {
  id: MoodId;
  promptLabel: string;
  recommendedTitle: string;
  worldNumber: 1 | 2 | 3 | 4 | 5;
  worldName: string;
  targetMode: PlayableModeRoute;
  headline: string;
  reason: string;
  accent: string;
  softBg: string;
  previewImage: string;
}

export const MOOD_WELCOME_PROMPT =
  'Welcome to your little escape. How are you feeling today?';

export const MOOD_RECOMMENDATIONS: MoodRecommendation[] = [
  {
    id: 'tired',
    promptLabel: "I'm feeling tired.",
    recommendedTitle: 'Peaceful Garden',
    worldNumber: 1,
    worldName: 'Peaceful World',
    targetMode: 'peaceful_garden',
    headline: 'A quiet, sunlit sanctuary awaits.',
    reason:
      'Plant flowers at your own pace beside gentle waterfalls and drifting butterflies — zero timers, zero scores required.',
    accent: '#059669',
    softBg: '#ECFDF5',
    previewImage: '/src/assets/images/peaceful_garden_sanctuary_1795350069605.jpg',
  },
  {
    id: 'bored',
    promptLabel: "I'm bored.",
    recommendedTitle: 'Hidden Object Hunt',
    worldNumber: 2,
    worldName: 'Discovery World',
    targetMode: 'messy_room',
    headline: 'Ready for a lively visual treasure hunt?',
    reason:
      'Zoom across 8 illustrated coastal & fantasy rooms, peek inside cabinets, and uncover sparkling keepsakes.',
    accent: '#0284C7',
    softBg: '#F0F9FF',
    previewImage: '/src/assets/images/beach_house_cove_1795350070022.jpg',
  },
  {
    id: 'relax',
    promptLabel: 'I want to relax.',
    recommendedTitle: 'Peaceful World',
    worldNumber: 1,
    worldName: 'Peaceful World',
    targetMode: 'peaceful_world',
    headline: 'Unwind with rain, sunset, or starry fireflies.',
    reason:
      'Switch ambient weather between Morning, Rainy Afternoon, Sunset, and Starry Night while tending blooming flower beds.',
    accent: '#0D9488',
    softBg: '#F0FDFA',
    previewImage: '/src/assets/images/peaceful_garden_sanctuary_1795350069605.jpg',
  },
  {
    id: 'adventure',
    promptLabel: 'I want an adventure.',
    recommendedTitle: 'Running Adventure',
    worldNumber: 4,
    worldName: 'Adventure World',
    targetMode: 'running',
    headline: 'Dash across 6 scenic worlds!',
    reason:
      'Master the crisp JUMP → SLIDE → ROLL sequence from Ocean-Side Road to Dreamy Nighttime—or switch to Relaxed Exploration.',
    accent: '#0F766E',
    softBg: '#E6F6F8',
    previewImage: '/src/assets/images/ocean_resort_backdrop_1795344043826.jpg',
  },
  {
    id: 'creative',
    promptLabel: 'I want to be creative.',
    recommendedTitle: 'Fashion Studio',
    worldNumber: 5,
    worldName: 'Creative Fashion World',
    targetMode: 'fashion_studio',
    headline: 'Design your signature palette & look.',
    reason:
      'Experiment with outfits, hairstyles, floral crowns, and curated color palettes in free-play studio lighting.',
    accent: '#7C3AED',
    softBg: '#F5F3FF',
    previewImage: '/src/assets/images/coastal_dressing_wing_1795346856719.jpg',
  },
  {
    id: 'satisfying',
    promptLabel: 'I want something satisfying.',
    recommendedTitle: 'Room Makeover',
    worldNumber: 3,
    worldName: 'Satisfying World',
    targetMode: 'dream_room',
    headline: 'Turn clutter into calm, sparkling order.',
    reason:
      'Enjoy 8 tactile makeover activities from wardrobe sorting and flower arranging to full messy-room transformations.',
    accent: '#D97706',
    softBg: '#FFFBEB',
    previewImage: '/src/assets/images/coastal_suite_bedroom_1795346857128.jpg',
  },
  {
    id: 'explore',
    promptLabel: 'I want to explore something new.',
    recommendedTitle: 'Dream Island',
    worldNumber: 1,
    worldName: 'Peaceful World · Dream Island',
    targetMode: 'dream_island',
    headline: 'Set sail for turquoise Dream Island.',
    reason:
      'Wander luminous crystal coves, collect rare island blossoms for your studio, and discover hidden sanctuary details.',
    accent: '#0E7490',
    softBg: '#ECFEFF',
    previewImage: '/src/assets/images/dream_island_sanctuary_1795350069153.jpg',
  },
];
