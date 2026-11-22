import { useState } from 'react';
import {
  ArrowLeft,
  CloudRain,
  Droplets,
  Flower2,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Sunset,
  Trees,
} from 'lucide-react';
import { soundEngine } from '../../game/audio';
import {
  GARDEN_DECOR,
  GARDEN_FLOWERS,
  GARDEN_SANCTUARIES,
  type GardenFlowerDef,
} from '../../game/catalog';
import type {
  PeacefulFlowerBed,
  PeacefulWeatherId,
  PeacefulWorldSave,
  PlayerSaveData,
} from '../../game/profile';

interface PeacefulWorldModeProps {
  save: PlayerSaveData;
  initialSanctuary?: string;
  onExit: () => void;
  onUpdatePeacefulWorld: (
    nextPeaceful: PeacefulWorldSave,
    reward?: { coins: number; xp: number; unlockCrown?: boolean }
  ) => void;
  onSpendCoinsForSanctuaryOrDecor: (
    coinsCost: number,
    nextPeaceful: PeacefulWorldSave
  ) => void;
}

const WEATHER_OPTIONS: Array<{
  id: PeacefulWeatherId;
  label: string;
  icon: typeof Sun;
  tint: string;
}> = [
  { id: 'morning', label: 'Morning', icon: Sun, tint: 'rgba(254, 249, 195, 0.14)' },
  { id: 'rain', label: 'Rainy Afternoon', icon: CloudRain, tint: 'rgba(14, 116, 144, 0.34)' },
  { id: 'sunset', label: 'Sunset', icon: Sunset, tint: 'rgba(245, 158, 11, 0.28)' },
  { id: 'night', label: 'Starry Night', icon: Moon, tint: 'rgba(15, 23, 42, 0.56)' },
];

const BED_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7];

export function PeacefulWorldMode({
  save,
  initialSanctuary,
  onExit,
  onUpdatePeacefulWorld,
  onSpendCoinsForSanctuaryOrDecor,
}: PeacefulWorldModeProps) {
  const peaceful: PeacefulWorldSave = save.peacefulWorld ?? {
    unlockedSanctuaries: ['waterfall_garden', 'dream_island'],
    activeSanctuary: initialSanctuary || 'waterfall_garden',
    weather: 'morning',
    flowersPlanted: [],
    placedDecorIds: ['timber_bench', 'stone_lantern'],
    flowersCollected: 0,
    flowerCollectionIds: [],
  };

  const activeSanctuaryId =
    initialSanctuary && peaceful.unlockedSanctuaries.includes(initialSanctuary)
      ? initialSanctuary
      : peaceful.activeSanctuary;

  const activeSanctuary =
    GARDEN_SANCTUARIES.find((s) => s.id === activeSanctuaryId) || GARDEN_SANCTUARIES[0];
  const weatherMeta =
    WEATHER_OPTIONS.find((w) => w.id === peaceful.weather) || WEATHER_OPTIONS[0];

  const [selectedSeedId, setSelectedSeedId] = useState<string>(GARDEN_FLOWERS[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [bloomBurstSlot, setBloomBurstSlot] = useState<number | null>(null);

  const reducedMotion = save.settings.reducedMotion;

  const showNote = (text: string) => {
    setToast(text);
    window.setTimeout(() => {
      setToast((cur) => (cur === text ? null : cur));
    }, 2600);
  };

  const handleSetWeather = (weather: PeacefulWeatherId) => {
    soundEngine.playCutePop();
    onUpdatePeacefulWorld({ ...peaceful, weather });
  };

  const handleSelectSanctuary = (sanctuaryId: string, unlockCost: number) => {
    const unlocked = peaceful.unlockedSanctuaries.includes(sanctuaryId);
    if (unlocked) {
      soundEngine.playCutePop();
      onUpdatePeacefulWorld({ ...peaceful, activeSanctuary: sanctuaryId });
      return;
    }
    if (save.coins >= unlockCost) {
      soundEngine.playFlowerBloom();
      onSpendCoinsForSanctuaryOrDecor(unlockCost, {
        ...peaceful,
        unlockedSanctuaries: [...peaceful.unlockedSanctuaries, sanctuaryId],
        activeSanctuary: sanctuaryId,
      });
      showNote('New sanctuary unlocked for peaceful exploration!');
    } else {
      soundEngine.playGentleWrong();
      showNote(`Collect ${unlockCost} Coins to open this sanctuary.`);
    }
  };

  const handleToggleDecor = (decorId: string, unlockCost: number) => {
    const isPlaced = peaceful.placedDecorIds.includes(decorId);
    if (isPlaced) {
      soundEngine.playCutePop();
      onUpdatePeacefulWorld({
        ...peaceful,
        placedDecorIds: peaceful.placedDecorIds.filter((id) => id !== decorId),
      });
      return;
    }
    if (unlockCost > 0 && save.coins < unlockCost) {
      soundEngine.playGentleWrong();
      showNote(`Need ${unlockCost} Coins to craft this garden decoration.`);
      return;
    }
    soundEngine.playFlowerBloom();
    if (unlockCost > 0) {
      onSpendCoinsForSanctuaryOrDecor(unlockCost, {
        ...peaceful,
        placedDecorIds: [...peaceful.placedDecorIds, decorId],
      });
    } else {
      onUpdatePeacefulWorld({
        ...peaceful,
        placedDecorIds: [...peaceful.placedDecorIds, decorId],
      });
    }
  };

  const handleBedAction = (slot: number) => {
    soundEngine.unlock();
    const existing = peaceful.flowersPlanted.find((b) => b.slot === slot);

    if (!existing) {
      // Plant selected seed
      soundEngine.playCutePop();
      const nextBeds: PeacefulFlowerBed[] = [
        ...peaceful.flowersPlanted,
        { slot, flowerId: selectedSeedId, growth: 1 },
      ];
      const flower = GARDEN_FLOWERS.find((f) => f.id === selectedSeedId)!;
      onUpdatePeacefulWorld({ ...peaceful, flowersPlanted: nextBeds });
      showNote(`Planted ${flower.name} sprout in bed ${slot + 1}. Tap again to water!`);
      return;
    }

    if (existing.growth < 3) {
      soundEngine.playWaterDrop();
      setRippleKey((k) => k + 1);
      const nextGrowth = (existing.growth + 1) as 2 | 3;
      const nextBeds = peaceful.flowersPlanted.map((b) =>
        b.slot === slot ? { ...b, growth: nextGrowth } : b
      );
      onUpdatePeacefulWorld({ ...peaceful, flowersPlanted: nextBeds });
      if (nextGrowth === 3) {
        const flower = GARDEN_FLOWERS.find((f) => f.id === existing.flowerId);
        showNote(`${flower?.name || 'Flower'} is in full bloom! Tap to collect.`);
      } else {
        showNote('Watered sprout — growing taller...');
      }
      return;
    }

    // Harvest full bloom!
    const flower: GardenFlowerDef =
      GARDEN_FLOWERS.find((f) => f.id === existing.flowerId) || GARDEN_FLOWERS[0];
    soundEngine.playFlowerBloom();
    setBloomBurstSlot(slot);
    window.setTimeout(() => setBloomBurstSlot((c) => (c === slot ? null : c)), 800);

    const nextCollected = peaceful.flowersCollected + 1;
    const nextCollectionIds = peaceful.flowerCollectionIds.includes(flower.id)
      ? peaceful.flowerCollectionIds
      : [...peaceful.flowerCollectionIds, flower.id];
    const nextBeds = peaceful.flowersPlanted.filter((b) => b.slot !== slot);
    const unlockCrown = nextCollected >= 3 && !save.unlockedBoutiqueIds.includes('acc_flower_crown');

    onUpdatePeacefulWorld(
      {
        ...peaceful,
        flowersPlanted: nextBeds,
        flowersCollected: nextCollected,
        flowerCollectionIds: nextCollectionIds,
      },
      { coins: flower.rewardCoins, xp: 18, unlockCrown }
    );

    showNote(
      unlockCrown
        ? `Harvested ${flower.name} (+${flower.rewardCoins} Coins)! Botanical Flower Crown unlocked for Fashion Studio!`
        : `Collected ${flower.name} (+${flower.rewardCoins} Coins · Flora #${nextCollected})`
    );
  };

  return (
    <div className="relative w-full h-full overflow-y-auto bg-gradient-to-b from-[#ECFDF5] via-[#F4FAFB] to-[#E0F2FE] pb-12 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header Bar */}
        <header className="bg-white/95 border border-[#CBE5E8] rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                onExit();
              }}
              className="btn-tactile h-11 w-11 shrink-0 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] flex items-center justify-center"
              aria-label="Back to World Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#059669]">
                <Trees className="w-3.5 h-3.5" />
                <span>World 1 · Peaceful World · No Pressure Sanctuary</span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F2933] truncate">
                {activeSanctuary.name}
              </h2>
            </div>
          </div>

          {/* 4 Environmental Mood Variations */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {WEATHER_OPTIONS.map((w) => {
              const Icon = w.icon;
              const active = peaceful.weather === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSetWeather(w.id)}
                  className={`btn-tactile h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#065F46] border-[#065F46] text-white shadow-sm'
                      : 'bg-white border-[#CBE5E8] text-[#164E63] hover:bg-[#ECFDF5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {toast && (
          <div className="px-4 py-2.5 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {/* Interactive Sanctuary Scene */}
        <section className="relative rounded-3xl overflow-hidden border border-[#A7F3D0] shadow-md bg-[#0F2933] min-h-[340px] sm:min-h-[410px] flex flex-col justify-between">
          <img
            src={activeSanctuary.imageUrl}
            alt={activeSanctuary.name}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
          />

          {/* Weather Atmospheric Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: weatherMeta.tint }}
          />

          {/* Dynamic Morning Birds */}
          {peaceful.weather === 'morning' && !reducedMotion && (
            <div className="absolute inset-x-0 top-6 pointer-events-none overflow-hidden h-20">
              <div className="animate-[pulse_4s_ease-in-out_infinite] flex justify-around opacity-85 text-white/90 text-xs font-bold">
                <span>🕊</span>
                <span className="translate-y-4">🕊</span>
              </div>
            </div>
          )}

          {/* Dynamic Rainy Afternoon Drops */}
          {peaceful.weather === 'rain' && !reducedMotion && (
            <div
              className="absolute inset-0 pointer-events-none opacity-45"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(108deg, transparent, transparent 18px, rgba(224,242,254,0.45) 19px, rgba(224,242,254,0.45) 20px)',
              }}
            />
          )}

          {/* Starry Night Fireflies */}
          {peaceful.weather === 'night' && (
            <div className="absolute inset-0 pointer-events-none">
              {[14, 28, 43, 61, 78, 88].map((leftPct, i) => (
                <span
                  key={leftPct}
                  className={`absolute w-2.5 h-2.5 rounded-full bg-[#FDE047] shadow-[0_0_12px_#FDE047] ${
                    reducedMotion ? '' : 'animate-pulse'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${22 + (i % 3) * 18}%`,
                    animationDelay: `${i * 0.35}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Animated Butterflies & Lake Ripple Button */}
          <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3">
            <div className="bg-white/90 border border-white rounded-2xl px-3.5 py-2 shadow-sm text-xs text-[#0F2933] flex items-center gap-3">
              <span className="font-bold text-[#059669]">
                Flora Collected: <span className="font-mono-num">{peaceful.flowersCollected}</span>
              </span>
              <span className="text-[#94C4CA]">·</span>
              <span className="font-semibold text-[#0F766E]">
                Species {peaceful.flowerCollectionIds.length}/{GARDEN_FLOWERS.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playWaterDrop();
                setRippleKey((k) => k + 1);
                showNote('Gentle ripples shimmer across the sanctuary lake.');
              }}
              className="btn-tactile h-10 px-3.5 rounded-xl bg-white/90 hover:bg-white border border-white text-xs font-semibold text-[#0284C7] flex items-center gap-1.5 shadow-sm"
            >
              <Droplets className="w-4 h-4" />
              <span>Touch Lake ({rippleKey > 0 ? 'Rippling' : 'Calm'})</span>
            </button>
          </div>

          {/* Placed Decor Badges */}
          <div className="relative z-10 px-4 sm:px-5 flex flex-wrap gap-2">
            {peaceful.placedDecorIds.map((decorId) => {
              const dec = GARDEN_DECOR.find((d) => d.id === decorId);
              if (!dec) return null;
              return (
                <div
                  key={decorId}
                  className="px-3 py-1 rounded-xl bg-white/88 border border-white text-[11px] font-bold text-[#0F2933] shadow-sm flex items-center gap-1.5"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: dec.accent }}
                  />
                  <span>{dec.name}</span>
                </div>
              );
            })}
          </div>

          {/* Interactive 8-Bed Flower Terrace */}
          <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-[#064E3B]/85 via-[#064E3B]/55 to-transparent">
            <div className="flex items-center justify-between text-xs text-white font-semibold mb-2.5">
              <span>Interactive Flower Beds (Tap empty bed to plant · Tap sprout to water · Tap bloom to collect)</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BED_SLOTS.map((slot) => {
                const bed = peaceful.flowersPlanted.find((b) => b.slot === slot);
                const flower = bed ? GARDEN_FLOWERS.find((f) => f.id === bed.flowerId) : null;
                const bursting = bloomBurstSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleBedAction(slot)}
                    className={`btn-tactile h-20 rounded-2xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      bed
                        ? 'bg-white/95 border-[#A7F3D0] text-[#0F2933] shadow-sm'
                        : 'bg-[#064E3B]/60 hover:bg-[#065F46]/75 border-white/35 text-white/90'
                    } ${bursting ? 'scale-105 ring-2 ring-[#FDE047]' : ''}`}
                  >
                    {bed && flower ? (
                      <>
                        <div className="relative flex items-center justify-center">
                          <Flower2
                            className={`transition-transform ${
                              bed.growth === 1
                                ? 'w-4 h-4 opacity-75'
                                : bed.growth === 2
                                ? 'w-6 h-6'
                                : 'w-8 h-8 scale-110'
                            }`}
                            style={{ color: bed.growth === 1 ? flower.stemColor : flower.petalColor }}
                          />
                        </div>
                        <span className="text-[10px] font-bold truncate max-w-full">
                          {bed.growth === 1 ? 'Sprout' : bed.growth === 2 ? 'Budding' : 'Harvest!'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-base leading-none">+</span>
                        <span className="text-[10px] font-semibold">Plant</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Controls Grid: Seeds + Decor + Unlockable Sanctuaries */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Flower Seed Selector */}
          <div className="lg:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0F2933]">1. Choose Flower Seed</h3>
              <span className="text-xs font-semibold text-[#059669]">Cross-World Flora</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GARDEN_FLOWERS.map((f) => {
                const selected = selectedSeedId === f.id;
                const discovered = peaceful.flowerCollectionIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setSelectedSeedId(f.id);
                    }}
                    className={`btn-tactile p-2.5 rounded-xl border text-left flex items-center gap-2.5 ${
                      selected
                        ? 'border-[#059669] bg-[#ECFDF5] ring-1 ring-[#059669]'
                        : 'border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#ECFDF5]'
                    }`}
                  >
                    <Flower2 className="w-5 h-5 shrink-0" style={{ color: f.petalColor }} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F2933] truncate">{f.name}</div>
                      <div className="text-[10px] text-[#356370]">
                        +{f.rewardCoins} Coins {discovered ? '· Collected' : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sanctuary Picker */}
          <div className="lg:col-span-4 bg-white border border-[#CBE5E8] rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-display text-base font-bold text-[#0F2933]">2. Peaceful Sanctuaries</h3>
            <div className="space-y-2">
              {GARDEN_SANCTUARIES.map((s) => {
                const unlocked = peaceful.unlockedSanctuaries.includes(s.id);
                const active = activeSanctuary.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSanctuary(s.id, s.unlockCost)}
                    className={`btn-tactile w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 ${
                      active
                        ? 'border-[#0D9488] bg-[#F0FDFA]'
                        : 'border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#E6F6F8]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F2933] truncate">{s.name}</div>
                      <div className="text-[10px] text-[#356370] truncate">{s.subtitle}</div>
                    </div>
                    {!unlocked ? (
                      <span className="text-[11px] font-bold text-[#D97706] flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        {s.unlockCost}
                      </span>
                    ) : active ? (
                      <span className="text-[11px] font-bold text-[#059669] shrink-0">Active</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#0284C7] shrink-0">Visit</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outdoor Decorations */}
          <div className="lg:col-span-3 bg-white border border-[#CBE5E8] rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-display text-base font-bold text-[#0F2933]">3. Garden Decor</h3>
            <div className="space-y-2">
              {GARDEN_DECOR.map((d) => {
                const placed = peaceful.placedDecorIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleToggleDecor(d.id, placed ? 0 : d.unlockCost)}
                    className={`btn-tactile w-full p-2 rounded-xl border text-left flex items-center justify-between gap-2 ${
                      placed
                        ? 'border-[#059669] bg-[#ECFDF5]'
                        : 'border-[#CBE5E8] bg-[#F4FAFB]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#0F2933] truncate">{d.name}</div>
                      <div className="text-[10px] text-[#356370] truncate">{d.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-bold shrink-0 text-[#059669]">
                      {placed ? 'Placed' : d.unlockCost > 0 ? `${d.unlockCost}c` : 'Place'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
