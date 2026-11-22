import { useMemo, useState } from 'react';
import { ArrowLeft, Sparkles, Star } from 'lucide-react';
import { soundEngine } from '../../game/audio';
import type { GameLevelDef } from '../../game/levels';
import type { OutfitId, HairStyleId } from '../../game/types';

interface MakeoverModeProps {
  levelDef?: GameLevelDef;
  completedCount: number;
  onExit: () => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
  }) => void;
}

interface MakeoverBrief {
  event: string;
  vibe: string;
  targetLip: string;
  targetEye: string;
  targetHair: HairStyleId;
  targetOutfit: OutfitId;
}

const BRIEFS: MakeoverBrief[] = [
  {
    event: 'Malibu Beach Premiere',
    vibe: 'Sun-kissed peach glow & sporty boardwalk skates',
    targetLip: 'Coral Shimmer',
    targetEye: 'Ocean Aqua',
    targetHair: 'blonde_wave',
    targetOutfit: 'malibu_skater',
  },
  {
    event: 'Pop-Star Concert Encore',
    vibe: 'Bold magenta spotlight glam & electric stage energy',
    targetLip: 'Hot Berry',
    targetEye: 'Violet Spark',
    targetHair: 'rose_curl',
    targetOutfit: 'pop_star',
  },
  {
    event: 'Starlight Gala Red Carpet',
    vibe: 'Champagne satin elegance & classic espresso sleek hair',
    targetLip: 'Rose Velvet',
    targetEye: 'Champagne Gold',
    targetHair: 'brunette_sleek',
    targetOutfit: 'starlight_gown',
  },
];

const LIP_SHADES = [
  { label: 'Coral Shimmer', color: '#FB7185' },
  { label: 'Hot Berry', color: '#E0218A' },
  { label: 'Rose Velvet', color: '#BE185D' },
];

const EYE_SHADES = [
  { label: 'Ocean Aqua', color: '#00B4D8' },
  { label: 'Violet Spark', color: '#9D4EDD' },
  { label: 'Champagne Gold', color: '#F59E0B' },
];

export function MakeoverMode({
  levelDef,
  completedCount,
  onExit,
  onComplete,
}: MakeoverModeProps) {
  const brief = useMemo(
    () => BRIEFS[((levelDef?.levelNumber ?? completedCount) % BRIEFS.length)],
    [completedCount, levelDef?.levelNumber]
  );

  const [skincarePrepped, setSkincarePrepped] = useState(false);
  const [lip, setLip] = useState(LIP_SHADES[0].label);
  const [eye, setEye] = useState(EYE_SHADES[0].label);
  const [hair, setHair] = useState<HairStyleId>('blonde_wave');
  const [outfit, setOutfit] = useState<OutfitId>('malibu_skater');
  const [result, setResult] = useState<{ score: number; stars: number } | null>(null);

  const lipColor = LIP_SHADES.find((l) => l.label === lip)?.color || '#E0218A';
  const eyeColor = EYE_SHADES.find((e) => e.label === eye)?.color || '#00B4D8';

  const handleReveal = () => {
    let score = skincarePrepped ? 25 : 10;
    if (lip === brief.targetLip) score += 20;
    if (eye === brief.targetEye) score += 20;
    if (hair === brief.targetHair) score += 17;
    if (outfit === brief.targetOutfit) score += 18;

    const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
    const won = stars >= 1;
    if (won) soundEngine.playVictory();
    else soundEngine.playWrongPlace();

    setResult({ score, stars });
    onComplete({
      won,
      stars,
      coinsEarned: won ? 95 + score : 30,
      creditsEarned: won ? 18 + stars * 5 : 4,
      xpEarned: won ? 60 + stars * 15 : 15,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-10 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="btn-tactile h-11 w-11 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
              aria-label="Exit Makeover"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2933]">
                Makeover Studio: {brief.event}
              </h2>
              <p className="text-xs text-[#356370]">Brief: {brief.vibe}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Interactive Stylized Portrait Canvas */}
          <div className="md:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm">
            <svg viewBox="0 0 200 220" className="w-48 h-52">
              <defs>
                <radialGradient id="faceGlow" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor={skincarePrepped ? '#F0FDFA' : '#E0F2FE'} />
                  <stop offset="100%" stopColor="#CCFBF1" />
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="200" height="220" rx="20" fill="url(#faceGlow)" />
              {/* Hair back */}
              <path
                d="M45 95 C40 40, 160 40, 155 95 L165 165 L35 165 Z"
                fill={hair === 'blonde_wave' ? '#F7D060' : hair === 'brunette_sleek' ? '#4A2C23' : '#2DD4BF'}
              />
              {/* Outfit neckline */}
              <path
                d="M48 168 L152 168 L168 220 L32 220 Z"
                fill={outfit === 'malibu_skater' ? '#0D9488' : outfit === 'pop_star' ? '#0284C7' : '#14B8A6'}
              />
              {/* Face */}
              <ellipse cx="100" cy="108" rx="40" ry="48" fill="#FCDAC4" />
              {/* Eyeshadow */}
              <ellipse cx="83" cy="96" rx="10" ry="5" fill={eyeColor} opacity="0.65" />
              <ellipse cx="117" cy="96" rx="10" ry="5" fill={eyeColor} opacity="0.65" />
              {/* Eyes */}
              <circle cx="83" cy="98" r="3.5" fill="#0F2933" />
              <circle cx="117" cy="98" r="3.5" fill="#0F2933" />
              {/* Dewy Blush */}
              {skincarePrepped && (
                <>
                  <ellipse cx="74" cy="114" rx="8" ry="4.5" fill="#FB7185" opacity="0.45" />
                  <ellipse cx="126" cy="114" rx="8" ry="4.5" fill="#FB7185" opacity="0.45" />
                </>
              )}
              {/* Lips */}
              <path d="M88 130 Q100 139 112 130 Q100 125 88 130 Z" fill={lipColor} />
            </svg>

            <button
              type="button"
              onClick={() => {
                soundEngine.playHeart();
                setSkincarePrepped(true);
              }}
              className={`btn-tactile w-full py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                skincarePrepped
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-[#E6F6F8] border-[#CBE5E8] text-[#0F766E]'
              }`}
            >
              {skincarePrepped ? 'Step 1: Dewy Skincare Applied ✓' : 'Step 1: Tap to Prep Dewy Skincare (+15 pts)'}
            </button>
          </div>

          {/* Makeup & Styling Controls */}
          <div className="md:col-span-7 bg-white border border-[#CBE5E8] rounded-2xl p-5 space-y-4 shadow-sm">
            <div>
              <span className="block text-xs font-bold text-[#164E63] mb-2">Step 2: Lip Gloss Shade</span>
              <div className="grid grid-cols-3 gap-2">
                {LIP_SHADES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setLip(s.label)}
                    className={`btn-tactile p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      lip === s.label ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]' : 'border-[#CBE5E8] bg-white text-[#164E63]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-[#164E63] mb-2">Step 3: Eye Shimmer</span>
              <div className="grid grid-cols-3 gap-2">
                {EYE_SHADES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setEye(s.label)}
                    className={`btn-tactile p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      eye === s.label ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]' : 'border-[#CBE5E8] bg-white text-[#164E63]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-bold text-[#164E63] mb-2">Step 4: Hair</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['blonde_wave', 'brunette_sleek', 'rose_curl'] as HairStyleId[]).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHair(h)}
                      className={`btn-tactile py-2 px-2 rounded-xl border text-xs font-semibold ${
                        hair === h ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]' : 'border-[#CBE5E8] bg-white text-[#164E63]'
                      }`}
                    >
                      {h === 'blonde_wave' ? 'Blonde' : h === 'brunette_sleek' ? 'Espresso' : 'Seafoam'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#164E63] mb-2">Step 5: Outfit</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['malibu_skater', 'pop_star', 'starlight_gown'] as OutfitId[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOutfit(o)}
                      className={`btn-tactile py-2 px-2 rounded-xl border text-xs font-semibold ${
                        outfit === o ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F2933]' : 'border-[#CBE5E8] bg-white text-[#164E63]'
                      }`}
                    >
                      {o === 'malibu_skater' ? 'Skater' : o === 'pop_star' ? 'Ocean' : 'Gown'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReveal}
              className="btn-tactile w-full py-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Reveal Makeover & Score</span>
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-display text-3xl font-bold text-[#0F2933]">Makeover Reveal!</h3>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-7 h-7 ${s <= result.stars ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBE5E8]'}`}
                />
              ))}
            </div>
            <div className="font-mono-num text-2xl font-bold text-[#0F766E]">{result.score}/100 Match</div>
            <p className="text-xs text-[#356370]">
              Ideal Brief: {brief.targetLip} · {brief.targetEye} · {brief.targetHair.replace('_', ' ')}
            </p>
            <button
              type="button"
              onClick={onExit}
              className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
