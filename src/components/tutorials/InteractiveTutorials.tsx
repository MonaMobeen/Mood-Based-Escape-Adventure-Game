import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Plus, SkipForward, Sparkles, Wand2 } from 'lucide-react';
import { soundEngine } from '../../game/audio';
import { renderBarbieCharacter } from '../../game/renderer';
import type { CharacterStyle } from '../../game/types';
import { HiddenObjectGraphic } from '../HiddenObjectGraphic';

interface RoomSearchTutorialModalProps {
  open: boolean;
  onComplete: (earnedWelcomeCoins: number) => void;
  onSkip: () => void;
}

const DEMO_COMB = {
  name: 'Aqua Styling Comb',
  shape: 'comb' as const,
  primaryColor: '#0D9488',
  accentColor: '#CCFBF1',
};

const DEMO_CUSHION = {
  shape: 'pillow' as const,
  primaryColor: '#0284C7',
  accentColor: '#E0F2FE',
};

const DEMO_DECOYS = [
  { id: 'd1', name: 'Gold Necklace', shape: 'necklace' as const, primaryColor: '#F59E0B', accentColor: '#FEF3C7', x: 18, y: 34 },
  { id: 'd2', name: 'Aqua Handbag', shape: 'handbag' as const, primaryColor: '#06B6D4', accentColor: '#FFFFFF', x: 78, y: 36 },
  { id: 'd3', name: 'Teal Hairbrush', shape: 'hairbrush' as const, primaryColor: '#0F766E', accentColor: '#CCFBF1', x: 24, y: 74 },
  { id: 'd4', name: 'Seafoam Perfume', shape: 'perfume' as const, primaryColor: '#0284C7', accentColor: '#F0F9FF', x: 76, y: 72 },
];

export function RoomSearchTutorialModal({
  open,
  onComplete,
  onSkip,
}: RoomSearchTutorialModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [zoomed, setZoomed] = useState(false);
  const [cushionMoved, setCushionMoved] = useState(false);
  const [hintGlow, setHintGlow] = useState(false);
  const [combFound, setCombFound] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setZoomed(false);
      setCushionMoved(false);
      setHintGlow(false);
      setCombFound(false);
      setNudge(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2933]/65 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-5 shadow-xl space-y-4 text-[#0F2933]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#0D9488]">
              Room Search Preview · Step {step} of 4
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              {step === 1 && '1. Check Your Target Object'}
              {step === 2 && '2. Zoom & Move Clutter Aside'}
              {step === 3 && '3. Find the Aqua Comb'}
              {step === 4 && 'Mission Complete!'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              onSkip();
            }}
            className="btn-tactile px-3 py-1.5 rounded-xl bg-white border border-[#CBE5E8] text-xs font-semibold text-[#356370] hover:text-[#0F2933] flex items-center gap-1 shrink-0"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Friendly 1-line guidance */}
        <p className="text-xs sm:text-sm text-[#164E63]">
          {step === 1 && 'Each mission shows the exact object to find at the bottom. Let’s look for the Aqua Styling Comb!'}
          {step === 2 && 'Tap the + Zoom button to inspect closer, then tap the Coastal Pillow in the center to move it aside.'}
          {step === 3 && 'Now tap the Aqua Styling Comb! Need help anytime? Tap the Hint button to glow its hiding spot.'}
          {step === 4 && 'Sparkle! You found it and earned +50 Welcome Coins. Ready to explore the coastal bedroom!'}
        </p>

        {/* Target Card Preview */}
        <div className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 ${
          step === 1 ? 'bg-[#E6F6F8] border-[#0D9488] ring-2 ring-[#0D9488]/25' : 'bg-white border-[#CBE5E8]'
        }`}>
          <div className="flex items-center gap-2.5">
            <HiddenObjectGraphic item={DEMO_COMB} className="w-9 h-9" />
            <div>
              <div className="text-[11px] font-semibold text-[#356370]">Target Mission</div>
              <div className="text-sm font-bold text-[#0F2933]">{DEMO_COMB.name}</div>
            </div>
          </div>

          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                setStep(2);
              }}
              className="btn-tactile px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold"
            >
              Got It!
            </button>
          ) : step === 3 ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playAssistantHint();
                setHintGlow(true);
                setNudge('Assistant Clue: Check the center bed area!');
              }}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-[#0284C7] text-white text-xs font-semibold flex items-center gap-1"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Try Hint</span>
            </button>
          ) : null}
        </div>

        {/* Interactive Mini Practice Room */}
        <div className="relative h-56 sm:h-64 rounded-2xl border-2 border-[#CBE5E8] bg-gradient-to-b from-[#CCFBF1] to-[#E0F2FE] overflow-hidden">
          <div
            className="w-full h-full relative transition-transform duration-300"
            style={{ transform: `scale(${zoomed ? 1.22 : 1})` }}
          >
            {/* Bed silhouette */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-32 rounded-2xl bg-[#F4FAFB]/90 border-2 border-[#0D9488]" />

            {/* Decoys */}
            {DEMO_DECOYS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  soundEngine.playGentleWrong();
                  setNudge(`That's ${d.name} — look for the Aqua Styling Comb!`);
                }}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:scale-110 transition-transform"
              >
                <HiddenObjectGraphic item={d} className="w-11 h-11" />
              </button>
            ))}

            {/* Hint Halo */}
            {hintGlow && !combFound && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-4 border-[#0284C7] bg-[#06B6D4]/20 animate-pulse pointer-events-none" />
            )}

            {/* Target Comb */}
            {!combFound && (
              <button
                type="button"
                onClick={() => {
                  if (step < 3 && !cushionMoved) {
                    setNudge('First move the Coastal Pillow aside!');
                    return;
                  }
                  soundEngine.playMagicDiscover();
                  setCombFound(true);
                  setNudge(null);
                  setStep(4);
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl hover:scale-110 transition-transform z-10"
                aria-label="Aqua Styling Comb"
              >
                <HiddenObjectGraphic item={DEMO_COMB} className="w-12 h-12" />
              </button>
            )}

            {/* Movable Pillow Cover */}
            <button
              type="button"
              onClick={() => {
                if (cushionMoved) return;
                soundEngine.playClutterMove();
                setCushionMoved(true);
                setNudge('Nice! You uncovered the Aqua Styling Comb underneath!');
                if (step === 2) setStep(3);
              }}
              style={{
                left: cushionMoved ? '64%' : '51%',
                top: cushionMoved ? '44%' : '50%',
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all duration-300 z-20 ${
                step === 2 && !cushionMoved ? 'ring-4 ring-[#0D9488] bg-white/75 animate-pulse' : ''
              }`}
              aria-label="Coastal Pillow"
            >
              <HiddenObjectGraphic item={DEMO_CUSHION} className="w-14 h-14" />
            </button>

            {combFound && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-30">
                <div className="px-4 py-2 rounded-full bg-[#0F766E] text-white font-bold text-sm flex items-center gap-1.5 shadow-md">
                  <Sparkles className="w-4 h-4" />
                  <span>Found Aqua Comb! +50 Coins</span>
                </div>
              </div>
            )}
          </div>

          {/* Mini Zoom Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              setZoomed((z) => !z);
            }}
            className={`absolute right-2.5 bottom-2.5 z-30 h-9 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1 shadow-sm ${
              step === 2 && !zoomed
                ? 'bg-[#0F766E] border-[#0F766E] text-white animate-pulse'
                : 'bg-white border-[#CBE5E8] text-[#0F2933]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{zoomed ? '1.2x' : 'Zoom'}</span>
          </button>
        </div>

        {nudge && (
          <div className="text-xs font-semibold text-[#0F766E] text-center">{nudge}</div>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playCrown();
              onComplete(50);
            }}
            className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claim +50 Coins & Start Searching</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface RunningTutorialModalProps {
  open: boolean;
  style: CharacterStyle;
  onComplete: (earnedWelcomeCoins: number) => void;
  onSkip: () => void;
}

export function RunningTutorialModal({
  open,
  style,
  onComplete,
  onSkip,
}: RunningTutorialModalProps) {
  const [step, setStep] = useState<'jump' | 'slide' | 'roll' | 'done'>('jump');
  const [actionTick, setActionTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stepRef = useRef(step);
  const animStateRef = useRef({ yOffset: 0, vy: 0, sliding: 0, twirling: 0, obsX: 340 });

  useEffect(() => {
    stepRef.current = step;
    animStateRef.current.obsX = 330;
  }, [step]);

  useEffect(() => {
    if (open) {
      setStep('jump');
      animStateRef.current = { yOffset: 0, vy: 0, sliding: 0, twirling: 0, obsX: 330 };
    }
  }, [open]);

  // Animated Mini-Runway Canvas Demo
  useEffect(() => {
    if (!open) return;
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
      const w = 440;
      const h = 190;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Coastal Sky & Boardwalk
      const grad = ctx.createLinearGradient(0, 0, 0, 150);
      grad.addColorStop(0, '#CCFBF1');
      grad.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, 150);
      ctx.fillStyle = '#E8D5B7';
      ctx.fillRect(0, 150, w, 40);
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(0, 150, w, 4);

      const st = animStateRef.current;
      if (st.obsX > 220) {
        st.obsX -= 110 * dt;
      }

      if (st.yOffset < 0 || st.vy < 0) {
        st.vy += 1200 * dt;
        st.yOffset += st.vy * dt;
        if (st.yOffset >= 0) {
          st.yOffset = 0;
          st.vy = 0;
        }
      }
      if (st.sliding > 0) st.sliding = Math.max(0, st.sliding - dt);
      if (st.twirling > 0) st.twirling = Math.max(0, st.twirling - dt);

      // Draw Demo Obstacle / Gems per step
      if (stepRef.current === 'jump') {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(st.obsX, 114, 6, 36);
        ctx.fillRect(st.obsX + 34, 114, 6, 36);
        ctx.strokeStyle = '#0F766E';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(st.obsX + 3, 122);
        ctx.quadraticCurveTo(st.obsX + 20, 136, st.obsX + 37, 122);
        ctx.stroke();
      } else if (stepRef.current === 'slide') {
        ctx.fillStyle = '#0F2933';
        ctx.fillRect(st.obsX - 10, 62, 56, 26);
        ctx.fillStyle = '#2DD4BF';
        ctx.fillRect(st.obsX - 2, 84, 40, 6);
      } else if (stepRef.current === 'roll') {
        [0, 1, 2].forEach((i) => {
          const dx = st.obsX + i * 26;
          const dy = 112 + Math.sin(t * 5 + i) * 6;
          ctx.fillStyle = '#0284C7';
          ctx.beginPath();
          ctx.moveTo(dx, dy - 10);
          ctx.lineTo(dx + 9, dy);
          ctx.lineTo(dx, dy + 10);
          ctx.lineTo(dx - 9, dy);
          ctx.closePath();
          ctx.fill();
        });
      }

      const barbieHeight = st.sliding > 0 ? 50 : 92;
      renderBarbieCharacter(
        ctx,
        {
          x: 92,
          y: 150 - barbieHeight + st.yOffset,
          vy: st.vy,
          width: 38,
          height: barbieHeight,
          grounded: st.yOffset >= 0,
          sliding: st.sliding > 0,
          twirling: st.twirling > 0,
          twirlTimer: st.twirling,
          glamFeverTimer: stepRef.current === 'done' ? 1 : 0,
          invulnTimer: 0,
          hitFlashTimer: 0,
          squashX: 1,
          squashY: 1,
          runCycle: t * 1.4,
          style,
          activeOutfit: style.outfit,
        },
        t
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, style, actionTick]);

  if (!open) return null;

  const triggerPracticeStep = (action: 'jump' | 'slide' | 'roll') => {
    if (action !== step) return;
    if (action === 'jump') {
      soundEngine.playJump(false);
      animStateRef.current.vy = -470;
      animStateRef.current.yOffset = -1;
      setActionTick((a) => a + 1);
      window.setTimeout(() => setStep('slide'), 620);
    } else if (action === 'slide') {
      soundEngine.playSlide();
      animStateRef.current.sliding = 0.6;
      setActionTick((a) => a + 1);
      window.setTimeout(() => setStep('roll'), 620);
    } else if (action === 'roll') {
      soundEngine.playTwirl();
      animStateRef.current.twirling = 0.65;
      setActionTick((a) => a + 1);
      window.setTimeout(() => {
        soundEngine.playVictory();
        setStep('done');
      }, 650);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2933]/65 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-5 shadow-xl space-y-4 text-[#0F2933]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#0284C7]">Action Sequence Preview</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              {step === 'jump' && '1. Tap JUMP Over the Barrier'}
              {step === 'slide' && '2. Tap SLIDE Under the Light'}
              {step === 'roll' && '3. Tap ROLL Through Hazards'}
              {step === 'done' && 'Ready for the Boardwalk!'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              onSkip();
            }}
            className="btn-tactile px-3 py-1.5 rounded-xl bg-white border border-[#CBE5E8] text-xs font-semibold text-[#356370] flex items-center gap-1"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#164E63]">
          {step === 'jump' && 'JUMP → SLIDE → ROLL stay visible together at the bottom right. Tap JUMP when a barrier approaches!'}
          {step === 'slide' && 'When a studio light appears overhead, SLIDE highlights in the sequence — tap SLIDE in time to duck cleanly!'}
          {step === 'roll' && 'Tap ROLL to tuck into a high-speed dash that shatters obstacles and sweeps nearby gems!'}
          {step === 'done' && 'Great timing! You earned +50 Welcome Coins. Step onto Emerald Cove Boardwalk!'}
        </p>

        <div className="rounded-2xl overflow-hidden border-2 border-[#CBE5E8] bg-[#E6F6F8]">
          <canvas ref={canvasRef} className="w-full h-44 block" />
        </div>

        {step !== 'done' ? (
          <div className="bg-white border border-[#CBE5E8] rounded-2xl p-2 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5">
            {(
              [
                { id: 'jump', label: 'JUMP', activeCls: 'bg-[#0F766E] text-white border-[#0B534D]' },
                { id: 'slide', label: 'SLIDE', activeCls: 'bg-[#0284C7] text-white border-[#0369A1]' },
                { id: 'roll', label: 'ROLL', activeCls: 'bg-[#0891B2] text-white border-[#0E7490]' },
              ] as const
            ).map((btn, idx) => {
              const active = step === btn.id;
              return (
                <div key={btn.id} className="contents">
                  <button
                    type="button"
                    onClick={() => triggerPracticeStep(btn.id)}
                    className={`btn-tactile h-12 rounded-xl border-2 font-display text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      active
                        ? `${btn.activeCls} sequence-active-glow`
                        : 'bg-[#F4FAFB] border-[#CBE5E8] text-[#356370]'
                    }`}
                  >
                    {btn.id === 'jump' && <ArrowUp className="w-4 h-4" />}
                    {btn.id === 'slide' && <ArrowDown className="w-4 h-4" />}
                    {btn.id === 'roll' && <Sparkles className="w-4 h-4" />}
                    <span>{btn.label}</span>
                  </button>
                  {idx < 2 && (
                    <span aria-hidden="true" className="text-xs font-bold text-[#7AAAB3] px-0.5">
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(50)}
            className="btn-tactile w-full py-3.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claim +50 Coins & Start Running!</span>
          </button>
        )}
      </div>
    </div>
  );
}
