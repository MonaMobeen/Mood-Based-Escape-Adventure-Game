import { useMemo, useState } from 'react';
import {
  Clock,
  Compass,
  Crown,
  Eye,
  Flower2,
  Heart,
  Layers,
  Palmtree,
  Play,
  Search,
  ShoppingBag,
  Sparkles,
  Trees,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import type { SearchSubMode } from '../game/hiddenObjects';
import type { LevelModeType } from '../game/levels';

export type PlayableModeRoute =
  | LevelModeType
  | 'fashion_studio'
  | SearchSubMode
  | 'peaceful_garden'
  | 'peaceful_world'
  | 'dream_island';

type ModeCategoryFilter = 'all' | 'peaceful' | 'search' | 'action' | 'room' | 'style';

interface ModesHubProps {
  onSelectMode: (mode: PlayableModeRoute) => void;
}

const MODE_CARDS: Array<{
  id: PlayableModeRoute;
  category: Exclude<ModeCategoryFilter, 'all'>;
  title: string;
  subtitle: string;
  rewardHint: string;
  tagLabel: string;
  cta: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  icon: typeof Sparkles;
}> = [
  {
    id: 'peaceful_garden',
    category: 'peaceful',
    title: 'Peaceful Garden',
    subtitle: 'Plant seeds, water blooms & watch butterflies in a zero-pressure waterfall garden.',
    rewardHint: 'Flora · Coins · XP',
    tagLabel: 'Relaxing',
    cta: 'Enter World',
    accent: '#10B981',
    badgeBg: 'bg-[#065F46]/40 border border-[#059669]/40',
    badgeText: 'text-[#34D399]',
    icon: Flower2,
  },
  {
    id: 'peaceful_world',
    category: 'peaceful',
    title: 'Peaceful World',
    subtitle: 'Explore morning lake, rainy cabin, sunset beach, and starlight island with sound mixer.',
    rewardHint: '4 Weather Moods',
    tagLabel: 'Atmosphere',
    cta: 'Enter World',
    accent: '#0D9488',
    badgeBg: 'bg-[#115E59]/40 border border-[#0F766E]/40',
    badgeText: 'text-[#2DD4BF]',
    icon: Trees,
  },
  {
    id: 'fashion_studio',
    category: 'style',
    title: 'Fashion Studio',
    subtitle: 'Mix & match clothes, customize colors, and create outfits with your personalized style wardrobe.',
    rewardHint: '5 Palettes · Snapshots',
    tagLabel: 'Creative',
    cta: 'Enter World',
    accent: '#8B5CF6',
    badgeBg: 'bg-[#581C87]/40 border border-[#7C3AED]/40',
    badgeText: 'text-[#C4B5FD]',
    icon: Sparkles,
  },
  {
    id: 'dream_island',
    category: 'peaceful',
    title: 'Dream Island',
    subtitle: 'Discover waterfall caves, secret beaches, and sky islands with your discovery journal.',
    rewardHint: 'Island Flora · Crown',
    tagLabel: 'Adventure',
    cta: 'Enter World',
    accent: '#06B6D4',
    badgeBg: 'bg-[#164E63]/40 border border-[#0891B2]/40',
    badgeText: 'text-[#22D3EE]',
    icon: Palmtree,
  },
  {
    id: 'dream_room',
    category: 'room',
    title: 'Room Makeover',
    subtitle: 'Tidy up messy rooms, arrange clothes and books, and watch satisfying transformations.',
    rewardHint: '8 Activities · Themes',
    tagLabel: 'Satisfying',
    cta: 'Enter World',
    accent: '#F59E0B',
    badgeBg: 'bg-[#78350F]/40 border border-[#D97706]/40',
    badgeText: 'text-[#FCD34D]',
    icon: Sparkles,
  },
  {
    id: 'messy_room',
    category: 'search',
    title: 'Hidden Object Hunt',
    subtitle: 'Uncover missing items in detailed rooms with interactive drawers and clues.',
    rewardHint: '8 Locations · Hints',
    tagLabel: 'Discovery',
    cta: 'Enter World',
    accent: '#0284C7',
    badgeBg: 'bg-[#075985]/40 border border-[#0284C7]/40',
    badgeText: 'text-[#38BDF8]',
    icon: Search,
  },
  {
    id: 'running',
    category: 'action',
    title: 'Running Adventure',
    subtitle: 'Dash across 6 scenic worlds using JUMP → SLIDE → ROLL in Adventure or Relaxed mode.',
    rewardHint: '6 Biomes · Best Score',
    tagLabel: 'Action',
    cta: 'Enter World',
    accent: '#14B8A6',
    badgeBg: 'bg-[#134E4A]/40 border border-[#14B8A6]/40',
    badgeText: 'text-[#5EEAD4]',
    icon: Play,
  },
];

const FILTERS: Array<{ id: ModeCategoryFilter; label: string }> = [
  { id: 'all', label: 'All Worlds' },
  { id: 'peaceful', label: 'Peaceful World' },
  { id: 'search', label: 'Discovery World' },
  { id: 'room', label: 'Satisfying World' },
  { id: 'action', label: 'Adventure World' },
  { id: 'style', label: 'Fashion World' },
];

export function ModesHub({ onSelectMode }: ModesHubProps) {
  const [filter, setFilter] = useState<ModeCategoryFilter>('all');

  const visibleCards = useMemo(
    () => (filter === 'all' ? MODE_CARDS : MODE_CARDS.filter((c) => c.category === filter)),
    [filter]
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070B12] text-[#F3F4F6] pb-24 pt-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6 py-4">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111C2E] border border-[#1E293B] text-xs font-semibold text-[#2DD4BF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WORLD HUB</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Choose Your Little World
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-xl">
            Select an experience and step into your little happiness. All progress and rewards carry across every world.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  setFilter(tab.id);
                }}
                className={`btn-tactile px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#0F766E] text-white shadow-lg shadow-[#0F766E]/30 border border-[#14B8A6]/50'
                    : 'bg-[#111827]/80 text-[#94A3B8] hover:text-white hover:bg-[#1F2937] border border-[#1F2937]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Glassmorphic Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative bg-gradient-to-br from-[#111827]/90 via-[#0F172A]/80 to-[#111827]/90 backdrop-blur-md border border-[#1F2937] hover:border-[#0D9488]/60 rounded-3xl p-6 shadow-xl shadow-black/40 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
                      style={{ backgroundColor: card.accent }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${card.badgeBg} ${card.badgeText}`}>
                      {card.tagLabel}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#2DD4BF] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#1F2937]/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    {card.rewardHint}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      onSelectMode(card.id);
                    }}
                    className="btn-tactile inline-flex items-center gap-1.5 text-xs font-bold text-[#2DD4BF] hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-[#134E4A]/30"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
