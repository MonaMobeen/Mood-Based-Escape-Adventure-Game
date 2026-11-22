import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lamp,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import {
  ROOM_ITEMS,
  ROOM_THEMES,
  STORAGE_ZONES,
  type ItemCategory,
  type RoomItemDef,
  type StorageZoneId,
} from '../../game/catalog';
import { soundEngine } from '../../game/audio';
import type { GameLevelDef } from '../../game/levels';
import type { PlayerSaveData } from '../../game/profile';
import { RoomItemGraphic } from '../RoomItemGraphic';

interface DreamRoomModeProps {
  save: PlayerSaveData;
  levelDef?: GameLevelDef;
  onExit: () => void;
  onSelectTheme: (themeId: string) => void;
  onUnlockTheme: (themeId: string, cost: number) => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
    itemsSorted: number;
    mistakesCount?: number;
    categoryUpdates: Record<ItemCategory, { correct: number; mistakes: number }>;
  }) => void;
}

interface ActiveRoomItem {
  uid: string;
  def: RoomItemDef;
  placed: boolean;
  placedZone?: StorageZoneId;
}

type LightingMood = 'morning' | 'golden' | 'evening';

export interface SatisfyingActivityDef {
  id: string;
  label: string;
  subtitle: string;
  preferredCategories?: ItemCategory[];
}

export const SATISFYING_ACTIVITIES: SatisfyingActivityDef[] = [
  { id: 'messy_makeover', label: 'Messy Room Makeover', subtitle: 'Sort all mixed treasures into tidy zones' },
  { id: 'organize_wardrobe', label: 'Organize a Wardrobe', subtitle: 'Hang gowns, shoes & coastal totes', preferredCategories: ['wardrobe'] },
  { id: 'arrange_bookshelf', label: 'Arrange a Bookshelf', subtitle: 'Place journals, pens, plushies & keepsakes', preferredCategories: ['study', 'decor'] },
  { id: 'makeup_collection', label: 'Organize a Makeup Collection', subtitle: 'Line up perfumes, lipsticks & palettes', preferredCategories: ['beauty'] },
  { id: 'decorate_bedroom', label: 'Decorate a Bedroom', subtitle: 'Style lamps, cushions & wall frames', preferredCategories: ['decor', 'wardrobe'] },
  { id: 'arrange_flowers', label: 'Arrange Flowers', subtitle: 'Pair botanical planters & sunlit decor', preferredCategories: ['decor', 'study'] },
  { id: 'organize_kitchen', label: 'Organize a Kitchen', subtitle: 'Tidy mugs, keepsake tins & sunlit counters', preferredCategories: ['study', 'decor'] },
  { id: 'transform_garden', label: 'Clean & Transform a Garden', subtitle: 'Refresh outdoor cushions, lanterns & planters', preferredCategories: ['decor', 'beauty'] },
];

function pickItems(count: number, activity?: SatisfyingActivityDef): ActiveRoomItem[] {
  const list: ActiveRoomItem[] = [];
  const preferred = activity?.preferredCategories;
  const primary = preferred
    ? ROOM_ITEMS.filter((it) => preferred.includes(it.category))
    : ROOM_ITEMS;
  const secondary = preferred
    ? ROOM_ITEMS.filter((it) => !preferred.includes(it.category))
    : [];
  const pool = [...[...primary].sort(() => Math.random() - 0.5), ...[...secondary].sort(() => Math.random() - 0.5)];
  for (let i = 0; i < count; i++) {
    const def = pool[i % pool.length];
    list.push({
      uid: `room_${i}_${def.id}_${Math.random().toString(36).slice(2, 6)}`,
      def,
      placed: false,
    });
  }
  return list;
}

export function DreamRoomMode({
  save,
  levelDef,
  onExit,
  onSelectTheme,
  onUnlockTheme,
  onComplete,
}: DreamRoomModeProps) {
  const noPressure = Boolean(save.settings.noPressureMode);
  const itemCount = levelDef?.itemCount ?? 8;
  const totalTime = levelDef?.timeLimitSec ?? 65;
  const zoneCap = levelDef?.limitedCapacity ?? 99;

  const [activityId, setActivityId] = useState<string>(SATISFYING_ACTIVITIES[0].id);
  const activeActivity = useMemo(
    () => SATISFYING_ACTIVITIES.find((a) => a.id === activityId) || SATISFYING_ACTIVITIES[0],
    [activityId]
  );

  const [items, setItems] = useState<ActiveRoomItem[]>(() => pickItems(itemCount));
  const [zoneCounts, setZoneCounts] = useState<Record<StorageZoneId, number>>({
    closet: 0,
    vanity: 0,
    shelves: 0,
    storage_box: 0,
  });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverZone, setHoverZone] = useState<StorageZoneId | null>(null);

  // Interactive Living Room States
  const [lightingMood, setLightingMood] = useState<LightingMood>('morning');
  const [wardrobeOpen, setWardrobeOpen] = useState(true);
  const [mirrorShimmerKey, setMirrorShimmerKey] = useState(0);
  const [vanitySprayActive, setVanitySprayActive] = useState(false);
  const [readingNookBounced, setReadingNookBounced] = useState(false);
  const [secretBonusFound, setSecretBonusFound] = useState(false);
  const [zoneSparkle, setZoneSparkle] = useState<StorageZoneId | null>(null);
  const [fairyLightsOn, setFairyLightsOn] = useState(true);
  const [seafoamRug, setSeafoamRug] = useState(true);
  const reducedMotion = save.settings.reducedMotion;

  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [paused, setPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [coinsRun, setCoinsRun] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [finished, setFinished] = useState<'won' | 'lost' | null>(null);
  const [showThemes, setShowThemes] = useState(false);

  const catStatsRef = useRef<Record<ItemCategory, { correct: number; mistakes: number }>>({
    wardrobe: { correct: 0, mistakes: 0 },
    beauty: { correct: 0, mistakes: 0 },
    study: { correct: 0, mistakes: 0 },
    decor: { correct: 0, mistakes: 0 },
  });

  const zoneRefs = useRef<Record<StorageZoneId, HTMLButtonElement | null>>({
    closet: null,
    vanity: null,
    shelves: null,
    storage_box: null,
  });

  const activeTheme = useMemo(
    () => ROOM_THEMES.find((t) => t.id === save.activeRoomTheme) || ROOM_THEMES[0],
    [save.activeRoomTheme]
  );

  const isDarkTheme = activeTheme.id === 'starlight_penthouse';
  const hasNeonMirror = save.unlockedBoutiqueIds.includes('dec_neon_mirror');
  const hasCanopyDrape = save.unlockedBoutiqueIds.includes('dec_palm_canopy');
  const hasDiscoGlobe = save.unlockedBoutiqueIds.includes('dec_disco_globe');

  const remainingItems = useMemo(() => items.filter((i) => !i.placed), [items]);
  const sortedCount = items.length - remainingItems.length;

  const placedByZone = useMemo(() => {
    const map: Record<StorageZoneId, ActiveRoomItem[]> = {
      closet: [],
      vanity: [],
      shelves: [],
      storage_box: [],
    };
    items.forEach((it) => {
      if (it.placed && it.placedZone) {
        map[it.placedZone].push(it);
      }
    });
    return map;
  }, [items]);

  // Countdown timer (paused in No Pressure Mode)
  useEffect(() => {
    if (paused || finished || noPressure) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setFinished('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [paused, finished, noPressure]);

  const finishGame = useCallback(
    (won: boolean, finalCoins: number, totalSorted: number) => {
      setFinished(won ? 'won' : 'lost');
      if (won) {
        soundEngine.playStageClear();
      } else {
        soundEngine.playHit();
      }
      const accuracy = totalSorted / Math.max(1, totalSorted + mistakes);
      const stars = !won ? 0 : accuracy >= 0.9 && timeLeft >= totalTime * 0.25 ? 3 : accuracy >= 0.72 ? 2 : 1;
      const baseCoins = levelDef ? levelDef.rewardCoins : 75;
      const baseCredits = levelDef ? levelDef.rewardCredits : 18;
      const baseXp = levelDef ? levelDef.rewardXp : 55;

      onComplete({
        won,
        stars,
        coinsEarned: won ? baseCoins + finalCoins + timeLeft * 2 : Math.round(finalCoins * 0.5),
        creditsEarned: won ? baseCredits + stars * 4 : 5,
        xpEarned: won ? baseXp + stars * 15 : 15,
        itemsSorted: totalSorted,
        mistakesCount: mistakes,
        categoryUpdates: catStatsRef.current,
      });
    },
    [levelDef, mistakes, onComplete, timeLeft, totalTime]
  );

  const attemptPlace = useCallback(
    (uid: string, zoneId: StorageZoneId) => {
      if (paused || finished) return;
      const targetItem = items.find((i) => i.uid === uid && !i.placed);
      if (!targetItem) return;

      const isOverflowAllowed =
        zoneId === 'storage_box' && zoneCounts[targetItem.def.targetZone] >= zoneCap;
      const isCorrect = targetItem.def.targetZone === zoneId || isOverflowAllowed;

      if (isCorrect && zoneCounts[zoneId] < zoneCap) {
        const nextStreak = streak + 1;
        const gain = 12 + Math.min(20, nextStreak * 3);
        const nextCoins = coinsRun + gain;
        const nextSorted = sortedCount + 1;

        catStatsRef.current[targetItem.def.category].correct += 1;
        soundEngine.playCorrectPlace(nextStreak);

        setZoneSparkle(zoneId);
        window.setTimeout(() => setZoneSparkle((cur) => (cur === zoneId ? null : cur)), 650);

        setItems((prev) =>
          prev.map((it) => (it.uid === uid ? { ...it, placed: true, placedZone: zoneId } : it))
        );
        setZoneCounts((prev) => ({ ...prev, [zoneId]: prev[zoneId] + 1 }));
        setStreak(nextStreak);
        setCoinsRun(nextCoins);
        setSelectedUid(null);
        setFeedback({
          text: `${targetItem.def.name} organized! +${gain} Coins${nextStreak >= 3 ? ` · ${nextStreak}x Streak` : ''}`,
          ok: true,
        });

        if (nextSorted >= items.length) {
          finishGame(true, nextCoins, nextSorted);
        }
      } else {
        catStatsRef.current[targetItem.def.category].mistakes += 1;
        soundEngine.playWrongPlace();
        setStreak(0);
        setMistakes((m) => m + 1);
        if (!noPressure) {
          setTimeLeft((t) => Math.max(1, t - 2));
        }
        const rightZone = STORAGE_ZONES.find((z) => z.id === targetItem.def.targetZone);
        setFeedback({
          text:
            zoneCounts[zoneId] >= zoneCap
              ? 'That bin is full — place extras in Deco Storage Trunk.'
              : `${targetItem.def.name} belongs in ${rightZone?.label || 'another zone'}${noPressure ? '' : ' (-2s)'}`,
          ok: false,
        });
      }
    },
    [coinsRun, finishGame, finished, items, noPressure, paused, sortedCount, streak, zoneCap, zoneCounts]
  );

  // Global pointer listeners for smooth mobile & desktop drag-and-drop
  useEffect(() => {
    if (!draggingUid) return;

    const findZoneUnderPoint = (x: number, y: number): StorageZoneId | null => {
      for (const z of STORAGE_ZONES) {
        const el = zoneRefs.current[z.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return z.id;
        }
      }
      return null;
    };

    const onMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
      setHoverZone(findZoneUnderPoint(e.clientX, e.clientY));
    };

    const onUp = (e: PointerEvent) => {
      const dropZone = findZoneUnderPoint(e.clientX, e.clientY);
      if (dropZone) {
        attemptPlace(draggingUid, dropZone);
      }
      setDraggingUid(null);
      setHoverZone(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [attemptPlace, draggingUid]);

  const handleRestart = (nextActivity?: SatisfyingActivityDef) => {
    const act = nextActivity ?? activeActivity;
    setItems(pickItems(itemCount, act));
    setZoneCounts({ closet: 0, vanity: 0, shelves: 0, storage_box: 0 });
    setSelectedUid(null);
    setTimeLeft(totalTime);
    setStreak(0);
    setMistakes(0);
    setCoinsRun(0);
    setFeedback(null);
    setFinished(null);
    setPaused(false);
    setSecretBonusFound(false);
  };

  const cycleLighting = () => {
    soundEngine.playLampToggle();
    setLightingMood((prev) =>
      prev === 'morning' ? 'golden' : prev === 'golden' ? 'evening' : 'morning'
    );
  };

  const triggerMirrorShimmer = () => {
    soundEngine.playMirrorChime();
    setMirrorShimmerKey((k) => k + 1);
    setFeedback({ text: 'Mirrors polished to a diamond gleam!', ok: true });
  };

  const triggerVanityPerfume = () => {
    soundEngine.playShimmerDiscover();
    setVanitySprayActive(true);
    window.setTimeout(() => setVanitySprayActive(false), 900);
    setFeedback({ text: 'Rose-petal mist fills your Dream Room!', ok: true });
  };

  const triggerReadingNook = () => {
    soundEngine.playCutePop();
    setReadingNookBounced(true);
    window.setTimeout(() => setReadingNookBounced(false), 380);
    if (!secretBonusFound) {
      setSecretBonusFound(true);
      setCoinsRun((c) => c + 15);
      soundEngine.playCrown();
      setFeedback({ text: 'Cozy Corner Surprise · +15 Bonus Coins tucked behind the cushion!', ok: true });
    } else {
      setFeedback({ text: 'Fluffed the velvet cushions in your reading nook.', ok: true });
    }
  };

  const draggingItem = draggingUid ? items.find((i) => i.uid === draggingUid) : null;
  const selectedItem = selectedUid ? items.find((i) => i.uid === selectedUid) : null;

  return (
    <div
      className="relative w-full h-full overflow-y-auto pb-10 pt-4 sm:pt-6 px-4 sm:px-6 transition-colors duration-500"
      style={{
        background: `linear-gradient(180deg, ${activeTheme.wallFrom} 0%, ${activeTheme.wallTo} 58%, ${activeTheme.floorColor} 100%)`,
      }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Refined Studio Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 border border-[#CBE5E8] rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                onExit();
              }}
              className="btn-tactile h-11 w-11 shrink-0 rounded-xl bg-[#E6F6F8] hover:bg-[#D8EFF2] text-[#0F2933] flex items-center justify-center transition-colors"
              aria-label="Exit Dream Room"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#D97706]">World 3 · Satisfying World</div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F2933] truncate">
                {levelDef ? levelDef.title : activeActivity.label}
              </h2>
              <p className="text-xs text-[#356370] truncate">
                {levelDef
                  ? levelDef.objectiveText
                  : activeActivity.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={cycleLighting}
              className="btn-tactile h-10 px-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#B45309] flex items-center gap-1.5 whitespace-nowrap"
            >
              {lightingMood === 'evening' ? <Lamp className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>
                {lightingMood === 'morning' ? 'Morning' : lightingMood === 'golden' ? 'Golden Hour' : 'Evening'}
              </span>
            </button>

            <div className="px-2.5 py-1.5 font-mono-num text-sm font-bold text-[#0F2933] flex items-center gap-1.5">
              <Clock className={`w-4 h-4 ${noPressure ? 'text-[#059669]' : timeLeft <= 12 ? 'text-rose-600' : 'text-[#0284C7]'}`} />
              <span className={!noPressure && timeLeft <= 12 ? 'text-rose-600' : ''}>
                {noPressure ? 'Cozy' : `${timeLeft}s`}
              </span>
            </div>

            <span aria-hidden="true" className="text-[#94C4CA]">·</span>

            <div className="font-mono-num text-sm font-bold text-[#0F766E] pr-1">
              {sortedCount}/{items.length}
            </div>

            {!levelDef && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playLampToggle();
                    setFairyLightsOn((f) => !f);
                    setSeafoamRug((r) => !r);
                  }}
                  className="btn-tactile h-10 px-3 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] text-xs font-semibold text-[#0E7490] hover:bg-[#CFFAFE] whitespace-nowrap"
                >
                  {fairyLightsOn ? 'Garland On' : 'Garland Off'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    setShowThemes((v) => !v);
                  }}
                  className="btn-tactile h-10 px-3 rounded-xl bg-white border border-[#CBE5E8] text-xs font-semibold text-[#0F2933] hover:bg-[#E6F6F8] whitespace-nowrap"
                >
                  Room Themes
                </button>
              </>
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
        </div>

        {/* 8 Satisfying Activity Switcher */}
        {!levelDef && (
          <div className="bg-white/95 border border-[#CBE5E8] rounded-2xl p-3 shadow-sm">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold text-[#164E63]">
                8 Satisfying Transformation Activities
              </span>
              <span className="text-[11px] font-semibold text-[#059669]">
                Flora from Peaceful World: {save.peacefulWorld?.flowersCollected ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {SATISFYING_ACTIVITIES.map((act) => {
                const active = act.id === activityId;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setActivityId(act.id);
                      handleRestart(act);
                    }}
                    className={`btn-tactile px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#D97706] border-[#D97706] text-white shadow-sm'
                        : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E] hover:bg-[#FEF3C7]'
                    }`}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Room Theme Selector Drawer */}
        {showThemes && (
          <div className="bg-white/95 border border-[#CBE5E8] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#0F2933]">Dream Room Themes</span>
              <span className="text-xs text-[#356370]">Unlock with Coins to restyle the suite</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ROOM_THEMES.map((theme) => {
                const unlocked = save.unlockedRoomThemes.includes(theme.id);
                const active = save.activeRoomTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      if (unlocked) {
                        soundEngine.playCutePop();
                        onSelectTheme(theme.id);
                      } else if (save.coins >= theme.unlockCost) {
                        soundEngine.playWardrobeBox();
                        onUnlockTheme(theme.id, theme.unlockCost);
                      } else {
                        soundEngine.playGentleWrong();
                      }
                    }}
                    className={`btn-tactile p-3 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-[#0D9488] bg-[#E6F6F8]'
                        : 'border-[#CBE5E8] bg-white hover:bg-[#F4FAFB]'
                    }`}
                  >
                    <div
                      className="h-6 w-full rounded-md mb-2 border border-black/10"
                      style={{ background: `linear-gradient(90deg, ${theme.wallFrom}, ${theme.floorColor})` }}
                    />
                    <div className="text-xs font-bold text-[#0F2933] truncate">{theme.name}</div>
                    <div className="text-[11px] font-medium text-[#0F766E] mt-0.5">
                      {active ? 'Equipped' : unlocked ? 'Tap to Equip' : `${theme.unlockCost} Coins`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Living Animated Dream Room Architectural Diorama */}
        <div
          className="relative rounded-3xl border border-[#CBE5E8] overflow-hidden shadow-md h-56 sm:h-68 transition-all duration-500"
          style={{
            background: `linear-gradient(180deg, ${activeTheme.wallFrom} 0%, ${activeTheme.wallTo} 68%, ${activeTheme.floorColor} 100%)`,
          }}
        >
          {/* Ambient Lighting Mood Layer */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500 z-10"
            style={{
              background:
                lightingMood === 'golden'
                  ? 'radial-gradient(circle at 48% 20%, rgba(253,224,71,0.22), rgba(251,146,60,0.12) 60%, transparent)'
                  : lightingMood === 'evening'
                  ? 'radial-gradient(circle at 82% 45%, rgba(254,240,138,0.24), rgba(15,41,51,0.32) 75%)'
                  : 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.28), transparent 70%)',
            }}
          />

          {/* Warm Oak / Polished Floor Strip */}
          <div
            className="absolute inset-x-0 bottom-0 h-14 border-t border-black/10"
            style={{
              background: isDarkTheme
                ? 'linear-gradient(180deg, #0F2933 0%, #091C24 100%)'
                : 'linear-gradient(180deg, #C7A07D 0%, #A97F5A 100%)',
            }}
          />

          {/* Woven Coastal Floor Rug */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-2 w-60 sm:w-80 h-8 rounded-full border border-white/50 pointer-events-none transition-colors duration-300"
            style={{
              background: seafoamRug
                ? 'radial-gradient(ellipse at center, #CCFBF1 0%, #99F6E4 100%)'
                : 'radial-gradient(ellipse at center, #FEF3C7 0%, #E7D5B8 100%)',
            }}
          />

          {/* Interactive Wardrobe Left Wing */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playDrawerSlide();
              setWardrobeOpen((o) => !o);
            }}
            className="absolute left-3 sm:left-5 bottom-8 w-28 sm:w-36 h-40 sm:h-48 rounded-t-2xl bg-[#F4FAFB]/95 border-2 border-[#0D9488]/60 shadow-sm overflow-hidden text-left group z-10 cursor-pointer"
            aria-label="Toggle Wardrobe Doors"
          >
            <div className="px-2 py-1 text-[10px] font-bold text-[#164E63] bg-[#E6F6F8] border-b border-[#CBE5E8] flex items-center justify-between">
              <span>Wardrobe</span>
              <span className="text-[#0F766E]">{wardrobeOpen ? 'Open' : 'Slide'}</span>
            </div>
            {wardrobeOpen ? (
              <div className="relative h-full bg-gradient-to-b from-[#134E4A] to-[#0F2933] p-2">
                <div className="h-1 w-full bg-[#F59E0B] rounded-full mb-2" />
                <div className="flex items-start gap-1.5">
                  <div className="w-5 h-16 rounded-b-lg bg-[#2DD4BF] shadow-sm" />
                  <div className="w-5 h-20 rounded-b-lg bg-[#BAE6FD] shadow-sm" />
                  <div className="w-5 h-14 rounded-b-lg bg-[#0284C7] shadow-sm" />
                  {placedByZone.closet.slice(0, 2).map((p) => (
                    <RoomItemGraphic key={p.uid} item={p.def} className="w-6 h-6" />
                  ))}
                </div>
              </div>
            ) : (
              <div
                key={`mirror-${mirrorShimmerKey}`}
                className="relative h-full bg-gradient-to-br from-[#F0FDFA] via-[#CBE5E8] to-[#E0F2FE] flex items-center justify-center overflow-hidden"
              >
                <div className={`absolute inset-y-0 w-10 bg-white/40 ${reducedMotion ? '' : 'animate-shimmer-sweep'}`} />
                <span className="text-[10px] font-semibold text-[#164E63]">Mirrored Door</span>
              </div>
            )}
          </button>

          {/* Center Window + Ocean Horizon Waves & Animated Swaying Sheer Curtains */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-48 sm:w-64 h-36 sm:h-40 rounded-2xl bg-gradient-to-b from-[#BAE6FD] to-[#E0F7FA] border-4 border-white shadow-inner overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-11 bg-gradient-to-b from-[#06B6D4]/75 to-[#0F766E]/80" />
            <div className="absolute left-6 bottom-6 w-14 h-0.5 rounded-full bg-white/75" />
            <div className="absolute right-8 bottom-3 w-16 h-0.5 rounded-full bg-white/70" />
            {fairyLightsOn && (
              <div className="absolute inset-x-3 top-2 flex items-center justify-between pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full bg-[#FEF08A] shadow-[0_0_8px_rgba(253,224,71,0.8)] ${
                      reducedMotion ? '' : 'animate-bulb-pulse'
                    }`}
                    style={{ animationDelay: `${dot * 0.25}s` }}
                  />
                ))}
              </div>
            )}
            <div
              className={`absolute left-0 top-0 bottom-0 w-9 bg-white/65 border-r border-white/80 ${
                reducedMotion ? '' : 'animate-curtain-sway'
              }`}
            />
            <div
              className={`absolute right-0 top-0 bottom-0 w-9 bg-white/65 border-l border-white/80 ${
                reducedMotion ? '' : 'animate-curtain-sway'
              }`}
              style={{ animationDelay: '1.2s' }}
            />
            {hasCanopyDrape && (
              <div className="absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-[#2DD4BF]/45 to-transparent rounded-b-full" />
            )}
            {hasDiscoGlobe && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 top-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#99F6E4] via-[#FFFFFF] to-[#0284C7] border border-white shadow-md ${
                  reducedMotion ? '' : 'animate-bulb-pulse'
                }`}
              />
            )}
          </div>

          {/* Animated Potted Plant */}
          <div className="hidden sm:block absolute left-[24%] bottom-9 z-10 pointer-events-none">
            <div className={`${reducedMotion ? '' : 'animate-plant-sway'} flex flex-col items-center`}>
              <svg viewBox="0 0 48 56" className="w-11 h-14 drop-shadow-sm">
                <path d="M24 30 C12 12, 8 20, 18 32" fill="#10B981" stroke="#134E4A" strokeWidth="1.2" />
                <path d="M24 30 C36 12, 40 20, 30 32" fill="#059669" stroke="#134E4A" strokeWidth="1.2" />
                <path d="M24 30 C20 6, 28 6, 24 30" fill="#34D399" stroke="#134E4A" strokeWidth="1.2" />
                <path d="M14 32 L34 32 L31 50 L17 50 Z" fill="#E6F6F8" stroke="#0F766E" strokeWidth="1.4" />
              </svg>
            </div>
          </div>

          {/* Interactive Cozy Reading Corner Cushion (Center-Bottom) */}
          <button
            type="button"
            onClick={triggerReadingNook}
            className={`absolute left-1/2 -translate-x-1/2 bottom-6 z-10 px-4 py-2 rounded-2xl bg-[#F4FAFB]/95 border border-[#CBE5E8] shadow-md flex items-center gap-2 transition-transform duration-200 cursor-pointer hover:scale-105 ${
              readingNookBounced ? 'scale-110 -translate-y-1' : ''
            }`}
            aria-label="Cozy Reading Corner"
          >
            <div className="w-7 h-5 rounded-lg bg-[#0D9488] border border-[#0F2933]/35" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-[#0F2933]">Reading Nook</div>
              <div className="text-[10px] text-[#356370]">
                {secretBonusFound ? 'Cozy cushions' : 'Tap to fluff (+Coins!)'}
              </div>
            </div>
          </button>

          {/* Interactive Coastal Vanity & Mirror (Right Wing) */}
          <div className="absolute right-3 sm:right-5 bottom-8 w-32 sm:w-44 h-40 sm:h-48 flex flex-col justify-end z-10">
            <button
              type="button"
              onClick={triggerMirrorShimmer}
              className={`relative mx-auto w-24 sm:w-32 h-24 sm:h-28 rounded-t-xl border-4 overflow-hidden shadow-md cursor-pointer ${
                hasNeonMirror ? 'border-[#FBBF24] shadow-[0_0_16px_rgba(251,191,36,0.5)]' : 'border-white'
              } bg-gradient-to-br from-[#F0FDFA] via-[#CBE5E8] to-[#E0F2FE]`}
              aria-label="Polish Vanity Mirror"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={`vl_${i}`}
                  className="absolute left-1 w-2 h-2 rounded-full bg-[#FEF08A] animate-bulb-pulse"
                  style={{ top: 10 + i * 26 }}
                />
              ))}
              {[0, 1, 2].map((i) => (
                <span
                  key={`vr_${i}`}
                  className="absolute right-1 w-2 h-2 rounded-full bg-[#FEF08A] animate-bulb-pulse"
                  style={{ top: 10 + i * 26, animationDelay: '0.4s' }}
                />
              ))}
              <div
                key={mirrorShimmerKey}
                className="absolute inset-y-0 w-10 bg-white/55 animate-shimmer-sweep pointer-events-none"
              />
              <span className="relative text-[10px] font-semibold text-[#164E63]">Tap Mirror</span>
            </button>

            <div className="h-14 rounded-xl bg-[#F4FAFB] border border-[#CBE5E8] shadow-sm px-2.5 flex items-center justify-between">
              <button
                type="button"
                onClick={triggerVanityPerfume}
                className="relative flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E6F6F8] hover:bg-[#D8EFF2] text-[10px] font-bold text-[#0F766E] cursor-pointer"
                aria-label="Spritz Ocean Mist"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spritz</span>
                {vanitySprayActive && (
                  <span className="absolute -top-5 left-2 text-[11px] font-bold text-[#0284C7] animate-sparkle-bloom pointer-events-none">
                    Mist!
                  </span>
                )}
              </button>
              <div className="flex items-center -space-x-1">
                {placedByZone.vanity.slice(0, 2).map((p) => (
                  <RoomItemGraphic key={p.uid} item={p.def} className="w-6 h-6" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{feedback.text}</span>
            {streak >= 2 && feedback.ok && (
              <span className="font-mono-num text-[#0F766E]">{streak}x Streak</span>
            )}
          </div>
        )}

        {/* Interactive Furniture Drop Zones */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STORAGE_ZONES.map((zone) => {
            const isHovered = hoverZone === zone.id;
            const isSparkling = zoneSparkle === zone.id;
            const count = zoneCounts[zone.id];
            const isFull = count >= zoneCap;
            const placedHere = placedByZone[zone.id];

            return (
              <button
                key={zone.id}
                ref={(el) => {
                  zoneRefs.current[zone.id] = el;
                }}
                type="button"
                onClick={() => {
                  if (selectedUid) {
                    attemptPlace(selectedUid, zone.id);
                  }
                }}
                className={`btn-tactile relative min-h-[128px] p-3.5 rounded-2xl border-2 text-left transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                  isHovered
                    ? 'scale-[1.03] border-[#0D9488] shadow-lg'
                    : isSparkling
                    ? 'border-[#F59E0B] shadow-md'
                    : selectedUid && !isFull
                    ? 'border-dashed border-[#0D9488]/75 hover:border-[#0D9488]'
                    : 'border-[#CBE5E8] bg-white/95'
                }`}
                style={{ backgroundColor: isHovered ? '#E6F6F8' : zone.bgTint }}
              >
                {isSparkling && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-shimmer-sweep pointer-events-none" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-[#0F2933]">{zone.label}</span>
                  <span
                    className="font-mono-num text-xs font-bold px-2 py-0.5 rounded-md bg-white/90 border border-black/5"
                    style={{ color: zone.accent }}
                  >
                    {zoneCap < 99 ? `${count}/${zoneCap}` : count}
                  </span>
                </div>

                <div className="text-xs text-[#356370] mt-0.5">{zone.subtitle}</div>

                {placedHere.length > 0 ? (
                  <div className="mt-2 flex items-center gap-1 overflow-hidden">
                    {placedHere.slice(-4).map((it) => (
                      <RoomItemGraphic key={it.uid} item={it.def} className="w-7 h-7 shrink-0" />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] font-semibold" style={{ color: zone.accent }}>
                    {isFull
                      ? 'Zone Full'
                      : selectedItem
                      ? `Tap to store ${selectedItem.def.name}`
                      : 'Drag or tap to place'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Messy Room Tray */}
        <div className="bg-white/95 border border-[#CBE5E8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#0F2933]">
              Items Around the Suite ({remainingItems.length} left)
            </span>
            <span className="text-xs text-[#356370]">Drag onto a furniture zone or tap to select</span>
          </div>

          {remainingItems.length === 0 ? (
            <div className="py-8 text-center text-sm font-semibold text-[#0F766E] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Spotless Dream Room! Every treasure is in its place.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {remainingItems.map((item) => {
                const isSelected = selectedUid === item.uid;
                const isDragging = draggingUid === item.uid;
                return (
                  <button
                    key={item.uid}
                    type="button"
                    onPointerDown={(e) => {
                      soundEngine.unlock();
                      soundEngine.playPickup();
                      setSelectedUid(item.uid);
                      setDraggingUid(item.uid);
                      setDragPos({ x: e.clientX, y: e.clientY });
                    }}
                    className={`touch-none select-none min-h-[100px] p-2.5 rounded-xl border transition-all duration-150 flex flex-col items-center justify-center gap-1.5 hover:-translate-y-0.5 ${
                      isDragging
                        ? 'opacity-35 scale-95 border-[#0D9488]'
                        : isSelected
                        ? 'border-[#0D9488] bg-[#E6F6F8] ring-2 ring-[#0D9488]/30 shadow-sm'
                        : 'border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#E6F6F8]'
                    }`}
                  >
                    <RoomItemGraphic item={item.def} className="w-12 h-12 pointer-events-none" />
                    <span className="text-xs font-semibold text-[#0F2933] text-center leading-tight line-clamp-2">
                      {item.def.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Drag Ghost */}
      {draggingItem && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-[#0D9488] rounded-2xl p-2.5 shadow-2xl flex flex-col items-center scale-105"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <RoomItemGraphic item={draggingItem.def} className="w-12 h-12" />
          <span className="text-[11px] font-bold text-[#0F2933] mt-0.5">{draggingItem.def.name}</span>
        </div>
      )}

      {/* Pause Overlay */}
      {paused && !finished && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 space-y-4 text-center shadow-xl">
            <h3 className="font-display text-2xl font-bold text-[#0F2933]">Room Paused</h3>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
              >
                Resume Organizing
              </button>
              <button
                type="button"
                onClick={() => handleRestart()}
                className="btn-tactile w-full py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-[#0F2933] font-semibold text-sm"
              >
                Restart
              </button>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 rounded-xl text-[#356370] font-medium text-sm"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Screen */}
      {finished && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="text-center">
              <p className="text-xs font-semibold text-[#0284C7]">
                {finished === 'won' ? 'Dream Room Complete' : 'Time Up'}
              </p>
              <h3 className="font-display text-3xl font-bold text-[#0F2933] mt-0.5">
                {finished === 'won' ? 'Spotless Style!' : 'Almost Tidy!'}
              </h3>
              {finished === 'won' && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-6 h-6 ${
                        sortedCount / Math.max(1, sortedCount + mistakes) >= (s === 3 ? 0.9 : s === 2 ? 0.72 : 0)
                          ? 'text-[#F59E0B] fill-[#F59E0B]'
                          : 'text-[#CBE5E8]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#CBE5E8] text-center">
              <div>
                <div className="text-xs text-[#356370]">Before</div>
                <div className="font-mono-num text-sm font-bold text-[#D97706]">{items.length} Messy</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">After</div>
                <div className="font-mono-num text-sm font-bold text-[#059669]">{sortedCount} Tidy!</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Bonus Coins</div>
                <div className="font-mono-num text-base font-bold text-[#0F766E]">+{coinsRun}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleRestart()}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Another Room</span>
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
