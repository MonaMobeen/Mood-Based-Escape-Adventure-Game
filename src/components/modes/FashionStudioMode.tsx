import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Award, Camera, Check, Download, Sparkles, Star, Trash2 } from 'lucide-react';
import { BOUTIQUE_ITEMS, FASHION_PALETTES } from '../../game/catalog';
import { HAIR_META, OUTFIT_META, SIDEKICK_META } from '../../game/constants';
import { renderHeroCharacter } from '../../game/renderer';
import { soundEngine } from '../../game/audio';
import type { PlayerSaveData, SavedLook } from '../../game/profile';
import type { CharacterStyle, HairStyleId, OutfitId, SidekickId } from '../../game/types';

interface FashionStudioModeProps {
  save: PlayerSaveData;
  onExit: () => void;
  onApplyLook: (
    style: CharacterStyle,
    accessoryId: string | null,
    bagId: string | null,
    shoesId: string | null
  ) => void;
  onSaveLook: (look: SavedLook) => void;
  onDeleteLook: (id: string) => void;
  onSnapshotReward: (coins: number, xp: number) => void;
  onChallengeComplete?: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
  }) => void;
}

const OUTFIT_IDS: OutfitId[] = ['malibu_skater', 'pop_star', 'starlight_gown'];
const HAIR_IDS: HairStyleId[] = ['blonde_wave', 'brunette_sleek', 'rose_curl'];
const SIDEKICK_IDS: SidekickId[] = ['puppy', 'cockatoo', 'none'];

type StudioPose = 'strut' | 'leap' | 'pose';
type StudioBackdrop = 'cove' | 'terrace' | 'gala';

const BACKDROPS: Array<{ id: StudioBackdrop; label: string; top: string; mid: string; floor: string; accent: string }> = [
  { id: 'cove', label: 'Emerald Cove', top: '#E0F7FA', mid: '#CCFBF1', floor: '#0F766E', accent: '#0D9488' },
  { id: 'terrace', label: 'Resort Terrace', top: '#FEF3C7', mid: '#BAE6FD', floor: '#0284C7', accent: '#0369A1' },
  { id: 'gala', label: 'Evening Gala', top: '#0F2933', mid: '#134E4A', floor: '#0B1F27', accent: '#2DD4BF' },
];

const STYLING_BRIEFS: Array<{
  id: string;
  title: string;
  targetOutfit: OutfitId;
  targetHair: HairStyleId;
  preferredBackdrop: StudioBackdrop;
  preferredPose: StudioPose;
  hint: string;
}> = [
  {
    id: 'surf_premiere',
    title: 'Malibu Surf Premiere',
    targetOutfit: 'malibu_skater',
    targetHair: 'blonde_wave',
    preferredBackdrop: 'cove',
    preferredPose: 'leap',
    hint: 'Pair Malibu Skater with Blonde Wave in Emerald Cove + Leap pose.',
  },
  {
    id: 'pop_encore',
    title: 'Ocean Pop Encore',
    targetOutfit: 'pop_star',
    targetHair: 'rose_curl',
    preferredBackdrop: 'terrace',
    preferredPose: 'strut',
    hint: 'Pair Pop Star Encore with Seafoam Curl on Resort Terrace + Strut pose.',
  },
  {
    id: 'emerald_gala',
    title: 'Emerald Gala Night',
    targetOutfit: 'starlight_gown',
    targetHair: 'brunette_sleek',
    preferredBackdrop: 'gala',
    preferredPose: 'pose',
    hint: 'Pair Starlight Gala with Espresso Sleek on Evening Gala + Pose.',
  },
];

export function FashionStudioMode({
  save,
  onExit,
  onApplyLook,
  onSaveLook,
  onDeleteLook,
  onSnapshotReward,
  onChallengeComplete,
}: FashionStudioModeProps) {
  const [style, setStyle] = useState<CharacterStyle>(save.style);
  const [accessoryId, setAccessoryId] = useState<string | null>(save.equippedAccessory);
  const [bagId, setBagId] = useState<string | null>(save.equippedBag);
  const [shoesId, setShoesId] = useState<string | null>(save.equippedShoes ?? null);
  const [pose, setPose] = useState<StudioPose>('strut');
  const [backdrop, setBackdrop] = useState<StudioBackdrop>('cove');
  const [paletteId, setPaletteId] = useState<string>(FASHION_PALETTES[0].id);
  const [lookName, setLookName] = useState('Emerald Signature');
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [briefIndex, setBriefIndex] = useState(0);
  const [submittedBriefId, setSubmittedBriefId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const styleRef = useRef(style);
  const accRef = useRef(accessoryId);
  const bagRef = useRef(bagId);
  const shoesRef = useRef(shoesId);
  const poseRef = useRef(pose);
  const backdropRef = useRef(backdrop);
  const paletteRef = useRef(paletteId);

  useEffect(() => {
    styleRef.current = style;
  }, [style]);
  useEffect(() => {
    accRef.current = accessoryId;
  }, [accessoryId]);
  useEffect(() => {
    bagRef.current = bagId;
  }, [bagId]);
  useEffect(() => {
    shoesRef.current = shoesId;
  }, [shoesId]);
  useEffect(() => {
    poseRef.current = pose;
  }, [pose]);
  useEffect(() => {
    backdropRef.current = backdrop;
  }, [backdrop]);
  useEffect(() => {
    paletteRef.current = paletteId;
  }, [paletteId]);

  useEffect(() => {
    const canvas = canvasRef.current;
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
      const w = 260;
      const h = 220;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bd = BACKDROPS.find((b) => b.id === backdropRef.current) || BACKDROPS[0];
      const pal = FASHION_PALETTES.find((p) => p.id === paletteRef.current);
      const usePal = backdropRef.current !== 'gala' && pal;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, usePal ? pal.top : bd.top);
      bgGrad.addColorStop(0.72, usePal ? pal.mid : bd.mid);
      bgGrad.addColorStop(1, usePal ? pal.floor : bd.floor);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (backdropRef.current === 'gala') {
        ctx.fillStyle = 'rgba(204, 251, 241, 0.65)';
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.arc((i * 47) % w, (i * 29) % 130, i % 2 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Coastal runway pedestal
      ctx.fillStyle = backdropRef.current === 'gala' ? 'rgba(45, 212, 191, 0.22)' : '#F4FAFB';
      ctx.beginPath();
      ctx.ellipse(130, 186, 78, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = bd.accent;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      renderHeroCharacter(
        ctx,
        {
          x: 111,
          y: 82,
          vy: 0,
          width: 38,
          height: 92,
          grounded: true,
          sliding: false,
          twirling: false,
          twirlTimer: 0,
          glamFeverTimer: 0.5,
          invulnTimer: 0,
          hitFlashTimer: 0,
          squashX: 1,
          squashY: 1,
          runCycle: t * 0.9,
          style: styleRef.current,
          activeOutfit: styleRef.current.outfit,
          accessoryId: accRef.current,
          bagId: bagRef.current,
          shoesId: shoesRef.current,
          studioPose: poseRef.current,
        },
        t
      );

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hasGardenCrown = (save.peacefulWorld?.flowersCollected ?? 0) >= 3;
  const unlockedAccessories = BOUTIQUE_ITEMS.filter(
    (b) =>
      b.slot === 'accessory' &&
      (save.unlockedBoutiqueIds.includes(b.id) || (b.id === 'acc_flower_crown' && hasGardenCrown))
  );
  const unlockedBags = BOUTIQUE_ITEMS.filter(
    (b) => b.slot === 'bag' && save.unlockedBoutiqueIds.includes(b.id)
  );
  const unlockedShoes = BOUTIQUE_ITEMS.filter(
    (b) => b.slot === 'shoes' && save.unlockedBoutiqueIds.includes(b.id)
  );

  const activeBrief = STYLING_BRIEFS[briefIndex % STYLING_BRIEFS.length];
  const briefMatches =
    (style.outfit === activeBrief.targetOutfit ? 1 : 0) +
    (style.hair === activeBrief.targetHair ? 1 : 0) +
    (backdrop === activeBrief.preferredBackdrop ? 1 : 0) +
    (pose === activeBrief.preferredPose ? 1 : 0);

  const styleScore =
    55 +
    (accessoryId ? 15 : 0) +
    (bagId ? 12 : 0) +
    (shoesId ? 10 : 0) +
    (style.sidekick !== 'none' ? 8 : 0);

  const handleSaveLook = () => {
    soundEngine.playShutter();
    soundEngine.playCrown();
    if (canvasRef.current) {
      try {
        setCapturedPhotoUrl(canvasRef.current.toDataURL('image/png'));
      } catch {
        // Ignore export restriction
      }
    }
    onApplyLook(style, accessoryId, bagId, shoesId);
    onSaveLook({
      id: `look_${Date.now()}`,
      name: lookName.trim() || 'Coastal Look',
      style,
      accessoryId,
      bagId,
      shoesId,
      score: styleScore,
      createdAt: Date.now(),
    });
    onSnapshotReward(45, 25);
    setSnapshotToast('Snapshot captured, look saved & equipped! +45 Coins · +25 XP');
  };

  const handleSubmitBrief = () => {
    if (submittedBriefId === activeBrief.id) {
      setSubmittedBriefId(null);
      setBriefIndex((i) => (i + 1) % STYLING_BRIEFS.length);
      return;
    }
    const stars = briefMatches >= 4 ? 3 : briefMatches >= 2 ? 2 : 1;
    const coinsEarned = 65 + stars * 25;
    const creditsEarned = 10 + stars * 5;
    const xpEarned = 35 + stars * 15;
    soundEngine.playVictory();
    onApplyLook(style, accessoryId, bagId, shoesId);
    setSubmittedBriefId(activeBrief.id);
    setSnapshotToast(
      `Styling Challenge "${activeBrief.title}" scored ${stars}/3 Stars! +${coinsEarned} Coins · +${creditsEarned} Credits`
    );
    onChallengeComplete?.({
      won: true,
      stars,
      coinsEarned,
      creditsEarned,
      xpEarned,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-10 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="btn-tactile h-11 w-11 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
              aria-label="Exit Fashion Studio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-bold text-[#7C3AED]">World 5 · Creative Fashion World</div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2933]">
                Creative Fashion Studio
              </h2>
              <p className="text-xs text-[#356370]">
                Free-play styling, color palettes, botanical crowns & runway snapshots — zero timer pressure
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#356370]">Style Harmony</div>
            <div className="font-mono-num text-lg font-bold text-[#7C3AED]">{styleScore}/100</div>
          </div>
        </div>

        {snapshotToast && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold">
            {snapshotToast}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Live Stage Preview */}
          <div className="lg:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-5 flex flex-col items-center justify-between gap-4 shadow-sm">
            <div className="w-full rounded-xl border border-[#CBE5E8] overflow-hidden flex flex-col items-center bg-[#F4FAFB]">
              <canvas ref={canvasRef} className="w-[260px] h-[220px] block" />
              <div className="w-full px-3 py-2 bg-white border-t border-[#CBE5E8] text-center">
                <div className="text-xs font-medium text-[#164E63]">
                  {OUTFIT_META[style.outfit].label} · {HAIR_META[style.hair].label}
                </div>
                {(accessoryId || bagId || shoesId) && (
                  <div className="text-[11px] text-[#0F766E] font-semibold mt-0.5">
                    {[
                      BOUTIQUE_ITEMS.find((b) => b.id === accessoryId)?.name,
                      BOUTIQUE_ITEMS.find((b) => b.id === bagId)?.name,
                      BOUTIQUE_ITEMS.find((b) => b.id === shoesId)?.name,
                    ]
                      .filter(Boolean)
                      .join(' + ')}
                  </div>
                )}
              </div>
            </div>

            {/* Pose & Backdrop Controls */}
            <div className="w-full grid grid-cols-2 gap-2.5">
              <div>
                <span className="block text-[11px] font-bold text-[#164E63] mb-1">Runway Pose</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['strut', 'leap', 'pose'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPose(p)}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold capitalize ${
                        pose === p
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F766E]'
                          : 'border-[#CBE5E8] bg-white text-[#356370]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-[#164E63] mb-1">Backdrop</span>
                <div className="grid grid-cols-3 gap-1">
                  {BACKDROPS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBackdrop(b.id)}
                      className={`py-1.5 rounded-lg border text-[11px] font-semibold ${
                        backdrop === b.id
                          ? 'border-[#0284C7] bg-[#E0F2FE] text-[#0369A1]'
                          : 'border-[#CBE5E8] bg-white text-[#356370]'
                      }`}
                    >
                      {b.label.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full space-y-2.5">
              <input
                type="text"
                value={lookName}
                maxLength={28}
                onChange={(e) => setLookName(e.target.value)}
                placeholder="Name your outfit look..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] text-sm font-medium text-[#0F2933] focus:outline-2 focus:outline-[#0D9488]"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCorrectPlace(1);
                    onApplyLook(style, accessoryId, bagId, shoesId);
                    setSnapshotToast('Look equipped for Running Adventure!');
                  }}
                  className="btn-tactile py-2.5 px-3 rounded-xl bg-white border border-[#CBE5E8] hover:bg-[#E6F6F8] text-xs font-semibold text-[#0F2933] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#0D9488]" />
                  <span>Equip Now</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveLook}
                  className="btn-tactile py-2.5 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snapshot & Save</span>
                </button>
              </div>
            </div>

            {capturedPhotoUrl && (
              <div className="w-full p-2.5 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={capturedPhotoUrl}
                    alt={lookName || 'Studio Snapshot'}
                    className="w-12 h-10 object-cover rounded-lg border border-white shadow-sm shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0F2933] truncate">{lookName}</div>
                    <div className="text-[10px] text-[#356370]">Studio Polaroid Ready</div>
                  </div>
                </div>
                <a
                  href={capturedPhotoUrl}
                  download={`${(lookName || 'coastal-look').toLowerCase().replace(/\s+/g, '-')}.png`}
                  className="btn-tactile px-2.5 py-1.5 rounded-lg bg-[#0284C7] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PNG</span>
                </a>
              </div>
            )}
          </div>

          {/* Wardrobe Customization */}
          <div className="lg:col-span-7 bg-white border border-[#CBE5E8] rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <span className="block text-xs font-bold text-[#164E63] mb-2">Signature Outfits</span>
              <div className="grid grid-cols-3 gap-2">
                {OUTFIT_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStyle({ ...style, outfit: id })}
                    className={`btn-tactile p-3 rounded-xl border text-left transition-all ${
                      style.outfit === id
                        ? 'border-[#0D9488] bg-[#E6F6F8]'
                        : 'border-[#CBE5E8] bg-[#F4FAFB]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#0F2933]">{OUTFIT_META[id].label}</div>
                    <div className="text-[11px] text-[#0284C7] mt-0.5">{OUTFIT_META[id].perk}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#164E63] mb-2">
                Color Combination Palettes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FASHION_PALETTES.map((pal) => {
                  const active = paletteId === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playCutePop();
                        setPaletteId(pal.id);
                      }}
                      className={`btn-tactile p-2 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-[#7C3AED] bg-[#F5F3FF] ring-1 ring-[#7C3AED]'
                          : 'border-[#CBE5E8] bg-[#F4FAFB]'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.top }} />
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.accent }} />
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.floor }} />
                      </div>
                      <div className="text-[11px] font-bold text-[#0F2933] truncate">{pal.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-[#164E63] mb-2">Hair Shade</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {HAIR_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStyle({ ...style, hair: id })}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 ${
                        style.hair === id
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]'
                          : 'border-[#CBE5E8] bg-white text-[#356370]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/15"
                        style={{ backgroundColor: HAIR_META[id].base }}
                      />
                      <span>{HAIR_META[id].label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#164E63] mb-2">Sidekick</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SIDEKICK_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStyle({ ...style, sidekick: id })}
                      className={`p-2 rounded-xl border text-xs font-semibold ${
                        style.sidekick === id
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]'
                          : 'border-[#CBE5E8] bg-white text-[#356370]'
                      }`}
                    >
                      {SIDEKICK_META[id].label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Styling Challenge Brief */}
            <div className="p-3.5 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">
                  <Award className="w-4 h-4" />
                  <span>Styling Challenge · {activeBrief.title}</span>
                  <span className="font-mono-num text-[#0284C7]">({briefMatches}/4 Matched)</span>
                </div>
                <p className="text-xs text-[#164E63]">{activeBrief.hint}</p>
              </div>
              <button
                type="button"
                onClick={handleSubmitBrief}
                className="btn-tactile px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{submittedBriefId === activeBrief.id ? 'Next Brief →' : 'Submit Challenge'}</span>
              </button>
            </div>

            {/* Boutique Accessories, Bags & Shoes */}
            <div className="pt-2 border-t border-[#CBE5E8] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#164E63]">Unlocked Boutique Pieces</span>
                <span className="text-[11px] text-[#356370]">Unlock more in Shopping Adventure</span>
              </div>

              {unlockedAccessories.length === 0 && unlockedBags.length === 0 && unlockedShoes.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#F4FAFB] border border-[#CBE5E8] text-xs text-[#356370]">
                  Visit Shopping Adventure to unlock Coral Shades, Pearl Tiaras, Coastal Clutches, and Aqua Skates!
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unlockedAccessories.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccessoryId(accessoryId === acc.id ? null : acc.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                        accessoryId === acc.id
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F766E]'
                          : 'border-[#CBE5E8] bg-white text-[#0F2933]'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                  {unlockedBags.map((bag) => (
                    <button
                      key={bag.id}
                      type="button"
                      onClick={() => setBagId(bagId === bag.id ? null : bag.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                        bagId === bag.id
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F766E]'
                          : 'border-[#CBE5E8] bg-white text-[#0F2933]'
                      }`}
                    >
                      {bag.name}
                    </button>
                  ))}
                  {unlockedShoes.map((shoe) => (
                    <button
                      key={shoe.id}
                      type="button"
                      onClick={() => setShoesId(shoesId === shoe.id ? null : shoe.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold ${
                        shoesId === shoe.id
                          ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F766E]'
                          : 'border-[#CBE5E8] bg-white text-[#0F2933]'
                      }`}
                    >
                      {shoe.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Closet Collection */}
            {save.savedLooks.length > 0 && (
              <div className="pt-2 border-t border-[#CBE5E8]">
                <span className="block text-xs font-bold text-[#164E63] mb-2">
                  Saved Closet Looks ({save.savedLooks.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {save.savedLooks.map((look) => (
                    <div
                      key={look.id}
                      className="p-2.5 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setStyle(look.style);
                          setAccessoryId(look.accessoryId);
                          setBagId(look.bagId);
                          setShoesId(look.shoesId ?? null);
                          onApplyLook(look.style, look.accessoryId, look.bagId, look.shoesId ?? null);
                        }}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className="text-xs font-bold text-[#0F2933] truncate flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#0D9488] shrink-0" />
                          <span>{look.name}</span>
                        </div>
                        <div className="text-[11px] text-[#356370]">
                          {OUTFIT_META[look.style.outfit].label} · {look.score} pts
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLook(look.id)}
                        className="p-1.5 text-[#4B7480] hover:text-rose-600"
                        aria-label={`Delete ${look.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
