import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Flower2,
  Map as MapIcon,
  Palette,
  Play,
  Search,
  Sparkles,
  Trees,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { HAIR_META, OUTFIT_META, SIDEKICK_META, STAGES } from '../game/constants';
import { renderHeroCharacter } from '../game/renderer';
import type {
  AdventureExperienceMode,
  CharacterStyle,
  HairStyleId,
  OutfitId,
  SidekickId,
} from '../game/types';

const BACKDROP_URL = '/src/assets/images/peaceful_garden_sanctuary_1795350069605.jpg';

interface TitleScreenProps {
  style: CharacterStyle;
  bestScore: number;
  muted: boolean;
  highestLevel: number;
  flowersCollected: number;
  noPressureMode: boolean;
  onChangeStyle: (next: CharacterStyle) => void;
  onStart: (mode: AdventureExperienceMode, stageIndex: number) => void;
  onOpenPeaceful: () => void;
  onOpenMessySearch: () => void;
  onOpenDreamRoom: () => void;
  onOpenFashionStudio: () => void;
  onOpenMoodGuide: () => void;
  onOpenMap: () => void;
  onToggleMute: () => void;
}

const OUTFIT_IDS: OutfitId[] = ['malibu_skater', 'pop_star', 'starlight_gown'];
const HAIR_IDS: HairStyleId[] = ['blonde_wave', 'brunette_sleek', 'rose_curl'];
const SIDEKICK_IDS: SidekickId[] = ['puppy', 'cockatoo', 'none'];

export function TitleScreen({
  style,
  bestScore,
  muted,
  highestLevel,
  flowersCollected,
  noPressureMode,
  onChangeStyle,
  onStart,
  onOpenPeaceful,
  onOpenMessySearch,
  onOpenDreamRoom,
  onOpenFashionStudio,
  onOpenMoodGuide,
  onOpenMap,
  onToggleMute,
}: TitleScreenProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const styleRef = useRef<CharacterStyle>(style);
  const [adventureMode, setAdventureMode] = useState<AdventureExperienceMode>(
    noPressureMode ? 'relaxed' : 'adventure'
  );
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);

  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  useEffect(() => {
    if (noPressureMode) {
      setAdventureMode('relaxed');
    }
  }, [noPressureMode]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = 180;
      const h = 156;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(13, 148, 136, 0.14)';
      ctx.beginPath();
      ctx.ellipse(96, 136, 52, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      renderHeroCharacter(
        ctx,
        {
          x: 78,
          y: 36,
          vy: 0,
          width: 38,
          height: 92,
          grounded: true,
          sliding: false,
          twirling: false,
          twirlTimer: 0,
          glamFeverTimer: 0,
          invulnTimer: 0,
          hitFlashTimer: 0,
          squashX: 1,
          squashY: 1,
          runCycle: t * 1.1,
          style: styleRef.current,
          activeOutfit: styleRef.current.outfit,
        },
        t
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const selectedOutfit = OUTFIT_META[style.outfit];

  return (
    <div className="relative w-full h-full overflow-y-auto bg-[#E6F6F8]">
      {/* Sanctuary Backdrop */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#ECFDF5] via-[#E0F2FE] to-[#F4FAFB] pointer-events-none">
        <img
          src={BACKDROP_URL}
          alt="Sunlit waterfall sanctuary and peaceful botanical pathway"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Measured contrast scrim for crisp readability */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(100deg, rgba(244, 250, 251, 0.96) 0%, rgba(244, 250, 251, 0.91) 52%, rgba(244, 250, 251, 0.62) 80%, rgba(15, 41, 51, 0.16) 100%)',
        }}
      />

      {/* Top-Right Quick Actions */}
      <div className="fixed top-14 right-3 sm:right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playCutePop();
            onOpenMoodGuide();
          }}
          className="btn-tactile h-11 px-3.5 rounded-xl bg-white/95 hover:bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shadow-sm text-xs font-semibold flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-[#059669]" />
          <span className="hidden sm:inline">Mood Check-In</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.playCutePop();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="btn-tactile h-11 w-11 flex items-center justify-center rounded-xl bg-white/95 text-[#0F2933] border border-[#CBE5E8] shadow-sm hover:bg-[#E6F6F8]"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-full w-full max-w-6xl mx-auto px-4 sm:px-8 pt-14 pb-20 flex flex-col justify-between gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start pt-2">
          {/* Left Column: Little Escape Hero + 5 World Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#059669]">
                <Compass className="w-4 h-4 shrink-0" />
                <span>Your World · Your Mood · Your Little Happiness</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-[#0F766E]">Level {highestLevel}/240</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-[#059669] inline-flex items-center gap-1">
                  <Flower2 className="w-3.5 h-3.5" />
                  {flowersCollected} Flora
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.04] text-[#0F2933]">
                <span className="text-[#0F766E]">Little Escape</span>
              </h1>

              <p className="text-sm text-[#164E63] leading-relaxed max-w-xl">
                Step away into five calming and creative worlds: tend tranquil sanctuaries, search 8 cozy rooms, enjoy 8 satisfying makeovers, run 6 vibrant biomes, and design your style studio.
              </p>
            </div>

            {/* 5 Interconnected World Portals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* World 1: Peaceful World */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  onOpenPeaceful();
                }}
                className="btn-tactile text-left p-3.5 rounded-2xl bg-[#ECFDF5]/95 hover:bg-[#D1FAE5]/95 border border-[#6EE7B7] shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                  <Trees className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#059669]">World 1 · No Pressure</div>
                  <div className="font-display text-base font-bold text-[#0F2933]">Peaceful World</div>
                  <div className="text-xs text-[#164E63] line-clamp-1">
                    Garden, rain & firefly sanctuaries
                  </div>
                </div>
              </button>

              {/* World 2: Discovery World */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  onOpenMessySearch();
                }}
                className="btn-tactile text-left p-3.5 rounded-2xl bg-[#F0F9FF]/95 hover:bg-[#E0F2FE]/95 border border-[#7DD3FC] shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#0284C7]">World 2 · 8 Rooms</div>
                  <div className="font-display text-base font-bold text-[#0F2933]">Discovery World</div>
                  <div className="text-xs text-[#164E63] line-clamp-1">
                    Beach House, Library, Island & more
                  </div>
                </div>
              </button>

              {/* World 3: Satisfying World */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  onOpenDreamRoom();
                }}
                className="btn-tactile text-left p-3.5 rounded-2xl bg-[#FFFBEB]/95 hover:bg-[#FEF3C7]/95 border border-[#FCD34D] shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#B45309]">World 3 · 8 Activities</div>
                  <div className="font-display text-base font-bold text-[#0F2933]">Satisfying World</div>
                  <div className="text-xs text-[#78350F] line-clamp-1">
                    Room makeovers, wardrobe & flowers
                  </div>
                </div>
              </button>

              {/* World 5: Creative Fashion World */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  onOpenFashionStudio();
                }}
                className="btn-tactile text-left p-3.5 rounded-2xl bg-[#F5F3FF]/95 hover:bg-[#EDE9FE]/95 border border-[#C4B5FD] shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#6D28D9]">World 5 · Free Play</div>
                  <div className="font-display text-base font-bold text-[#0F2933]">Creative Fashion</div>
                  <div className="text-xs text-[#4C1D95] line-clamp-1">
                    Color palettes, crowns & snapshots
                  </div>
                </div>
              </button>
            </div>

            {/* World 4: Adventure World Runner Launcher */}
            <div className="bg-white/95 border border-[#CBE5E8] rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-[#0F766E]">
                    World 4 · Adventure World {bestScore > 0 ? `· Best ${bestScore.toLocaleString()} pts` : ''}
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#0F2933]">
                    Running Adventure (JUMP → SLIDE → ROLL)
                  </h2>
                </div>

                {/* Adventure vs Relaxed Exploration Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#E6F6F8]">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setAdventureMode('adventure');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      adventureMode === 'adventure'
                        ? 'bg-[#0F766E] text-white shadow-sm'
                        : 'text-[#356370]'
                    }`}
                  >
                    Adventure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setAdventureMode('relaxed');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      adventureMode === 'relaxed'
                        ? 'bg-[#059669] text-white shadow-sm'
                        : 'text-[#356370]'
                    }`}
                  >
                    Relaxed Mode
                  </button>
                </div>
              </div>

              {/* 6 Scenic Locations Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {STAGES.map((st, idx) => {
                  const active = selectedStageIdx === idx;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playCutePop();
                        setSelectedStageIdx(idx);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        active
                          ? 'border-[#0F766E] bg-[#E6F6F8] text-[#0F766E]'
                          : 'border-[#CBE5E8] bg-[#F4FAFB] text-[#356370]'
                      }`}
                    >
                      {idx + 1}. {st.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    onStart(adventureMode, selectedStageIdx);
                  }}
                  className="btn-tactile flex-1 min-w-[200px] h-11 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-display font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {adventureMode === 'relaxed'
                      ? `Explore ${STAGES[selectedStageIdx].name}`
                      : `Run ${STAGES[selectedStageIdx].name}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    onOpenMap();
                  }}
                  className="btn-tactile h-11 px-4 rounded-xl bg-white hover:bg-[#E6F6F8] text-[#0F766E] border border-[#CBE5E8] font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <MapIcon className="w-4 h-4" />
                  <span>240 Level Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Look Studio Card (Preserved) */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 border border-[#CBE5E8] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0F2933]">Character Look Studio</h2>
                <span className="text-xs font-semibold text-[#0284C7] truncate max-w-[180px]">
                  {selectedOutfit.perk}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3.5 items-center">
                <div className="shrink-0 w-[180px] h-[156px] rounded-xl bg-gradient-to-b from-[#F0FDFA] to-[#E0F2FE] border border-[#CBE5E8] flex items-end justify-center overflow-hidden">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-[180px] h-[156px] block"
                    aria-label="Live character style preview"
                  />
                </div>

                <div className="flex-1 w-full space-y-2.5 min-w-0">
                  <div>
                    <span className="block text-xs font-semibold text-[#164E63] mb-1">Outfit</span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#E6F6F8] rounded-lg">
                      {OUTFIT_IDS.map((id) => {
                        const active = style.outfit === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              soundEngine.playCutePop();
                              onChangeStyle({ ...style, outfit: id });
                            }}
                            className={`px-2 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap truncate ${
                              active
                                ? 'bg-white text-[#0F766E] shadow-sm'
                                : 'text-[#356370] hover:text-[#0F2933]'
                            }`}
                          >
                            {OUTFIT_META[id].label.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#164E63] mb-1">Hair</span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#E6F6F8] rounded-lg">
                      {HAIR_IDS.map((id) => {
                        const active = style.hair === id;
                        const meta = HAIR_META[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              soundEngine.playCutePop();
                              onChangeStyle({ ...style, hair: id });
                            }}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap truncate ${
                              active
                                ? 'bg-white text-[#0F2933] shadow-sm font-semibold'
                                : 'text-[#356370] hover:text-[#0F2933]'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15"
                              style={{ backgroundColor: meta.base }}
                              aria-hidden="true"
                            />
                            <span className="truncate">{meta.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#164E63] mb-1">Sidekick</span>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[#E6F6F8] rounded-lg">
                      {SIDEKICK_IDS.map((id) => {
                        const active = style.sidekick === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              soundEngine.playCutePop();
                              onChangeStyle({ ...style, sidekick: id });
                            }}
                            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate ${
                              active
                                ? 'bg-white text-[#0F2933] shadow-sm font-semibold'
                                : 'text-[#356370] hover:text-[#0F2933]'
                            }`}
                          >
                            {SIDEKICK_META[id].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs font-medium text-[#164E63]">
          Controls: Tap JUMP → SLIDE → ROLL sequence or Swipe · Keys W / S / Shift · A / D Move · Esc Pause
        </div>
      </div>
    </div>
  );
}
