import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Flame, Search, Sparkles } from 'lucide-react';
import { ROOM_ITEMS, type RoomItemDef } from '../../game/catalog';
import { soundEngine } from '../../game/audio';
import type { GameLevelDef } from '../../game/levels';
import { RoomItemGraphic } from '../RoomItemGraphic';

interface MysteryModeProps {
  levelDef?: GameLevelDef;
  solvedCount: number;
  noPressure?: boolean;
  onExit: () => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
    mistakesCount?: number;
  }) => void;
}

interface ScatteredObject {
  uid: string;
  def: RoomItemDef;
  xPct: number;
  yPct: number;
  rotate: number;
  isTarget: boolean;
  found: boolean;
}

export function MysteryMode({
  levelDef,
  solvedCount,
  noPressure = false,
  onExit,
  onComplete,
}: MysteryModeProps) {
  const targetCount = Math.min(7, 4 + Math.floor((levelDef?.levelNumber ?? solvedCount * 10) / 40));
  const [seed, setSeed] = useState(0);

  const board = useMemo<ScatteredObject[]>(() => {
    const shuffled = [...ROOM_ITEMS].sort(() => Math.random() - 0.5).slice(0, 16);
    return shuffled.map((def, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const jitterX = (Math.random() - 0.5) * 7;
      const jitterY = (Math.random() - 0.5) * 5;
      return {
        uid: `mys_${seed}_${idx}_${def.id}`,
        def,
        xPct: 12 + col * 24 + jitterX,
        yPct: 16 + row * 21 + jitterY,
        rotate: Math.round((Math.random() - 0.5) * 24),
        isTarget: idx < targetCount,
        found: false,
      };
    });
  }, [seed, targetCount]);

  const [objects, setObjects] = useState<ScatteredObject[]>(board);
  useEffect(() => {
    setObjects(board);
  }, [board]);

  const [timeLeft, setTimeLeft] = useState(45);
  const [hintUid, setHintUid] = useState<string | null>(null);
  const [hintsLeft, setHintsLeft] = useState(2);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [burstSpot, setBurstSpot] = useState<{ xPct: number; yPct: number; label: string } | null>(null);
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (done !== null || noPressure) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setDone(false);
          soundEngine.playHit();
          onComplete({ won: false, stars: 0, coinsEarned: 25, creditsEarned: 5, xpEarned: 15, mistakesCount: mistakes });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [done, mistakes, noPressure, onComplete]);

  const targets = objects.filter((o) => o.isTarget);
  const foundCount = targets.filter((o) => o.found).length;

  const handleTapObject = (obj: ScatteredObject) => {
    if (done !== null || obj.found) return;
    if (obj.isTarget) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      soundEngine.playShimmerDiscover();
      setBurstSpot({
        xPct: obj.xPct,
        yPct: obj.yPct,
        label: nextStreak >= 2 ? `Found! ${nextStreak}x` : 'Found!',
      });
      window.setTimeout(() => setBurstSpot(null), 850);

      const next = objects.map((o) => (o.uid === obj.uid ? { ...o, found: true } : o));
      setObjects(next);
      setHintUid(null);
      if (next.filter((o) => o.isTarget && o.found).length === targetCount) {
        setDone(true);
        soundEngine.playVictory();
        const stars = timeLeft >= 20 ? 3 : timeLeft >= 10 ? 2 : 1;
        onComplete({
          won: true,
          stars,
          coinsEarned: 100 + timeLeft * 3 + nextStreak * 5,
          creditsEarned: 20 + stars * 4,
          xpEarned: 65 + stars * 15,
          mistakesCount: mistakes,
        });
      }
    } else {
      soundEngine.playGentleWrong();
      setStreak(0);
      setMistakes((m) => m + 1);
      setTimeLeft((t) => Math.max(1, t - 3));
    }
  };

  const handleUseHint = () => {
    if (hintsLeft <= 0 || done !== null) return;
    const unfound = targets.find((t) => !t.found);
    if (!unfound) return;
    soundEngine.playAssistantHint();
    setHintsLeft((h) => h - 1);
    setHintUid(unfound.uid);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-10 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="btn-tactile h-11 w-11 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
              aria-label="Exit Mystery Mission"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2933]">
                Coastal Mystery Hunt
              </h2>
              <p className="text-xs text-[#356370]">
                Inspect the sunlit coastal lounge and find all {targetCount} keepsakes (-3s per decoy)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {streak >= 2 && (
              <div className="px-2.5 py-1.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs font-bold text-[#B45309] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{streak}x</span>
              </div>
            )}
            <button
              type="button"
              disabled={hintsLeft <= 0}
              onClick={handleUseHint}
              className="btn-tactile h-11 px-3.5 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] text-[#0284C7] text-xs font-bold flex items-center gap-1.5 disabled:opacity-45"
            >
              <Search className="w-4 h-4" />
              <span>Hint ({hintsLeft})</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0F766E]" />
              <span className="font-mono-num text-sm font-bold text-[#0F2933]">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Target Clue Strip */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#164E63]">
            Missing Keepsakes ({foundCount}/{targetCount}):
          </span>
          {targets.map((t) => (
            <div
              key={t.uid}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                t.found
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 line-through opacity-70'
                  : 'bg-[#F4FAFB] border-[#CBE5E8] text-[#0F2933]'
              }`}
            >
              <RoomItemGraphic item={t.def} className="w-5 h-5" />
              <span>{t.def.name}</span>
            </div>
          ))}
        </div>

        {/* Architectural Coastal Lounge Scene Board */}
        <div className="relative w-full h-[390px] sm:h-[440px] rounded-2xl border-2 border-[#CBE5E8] overflow-hidden shadow-md bg-[#E0F2FE]">
          <svg viewBox="0 0 1000 500" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="mysWall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DDF2EF" />
                <stop offset="100%" stopColor="#BAE6FD" />
              </linearGradient>
              <linearGradient id="mysFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E4C7A6" />
                <stop offset="100%" stopColor="#C19A72" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="1000" height="320" fill="url(#mysWall)" />
            <rect x="0" y="320" width="1000" height="180" fill="url(#mysFloor)" />
            <rect x="330" y="35" width="340" height="205" rx="18" fill="#E0F7FA" stroke="#FFFFFF" strokeWidth="8" />
            <rect x="330" y="175" width="340" height="65" fill="#0D9488" opacity="0.55" />
            <rect x="65" y="140" width="185" height="180" rx="12" fill="#F4FAFB" stroke="#99D3D9" strokeWidth="4" />
            <rect x="750" y="125" width="190" height="195" rx="12" fill="#F4FAFB" stroke="#99D3D9" strokeWidth="4" />
            <ellipse cx="500" cy="410" rx="280" ry="62" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="4" />
          </svg>

          {burstSpot && (
            <div
              style={{ left: `${burstSpot.xPct}%`, top: `${burstSpot.yPct}%` }}
              className="absolute z-30 pointer-events-none animate-sparkle-bloom px-2.5 py-1 rounded-lg bg-[#0F766E] text-white text-xs font-bold shadow-md"
            >
              {burstSpot.label}
            </div>
          )}

          {objects.map((obj) => (
            <button
              key={obj.uid}
              type="button"
              onClick={() => handleTapObject(obj)}
              style={{
                left: `${obj.xPct}%`,
                top: `${obj.yPct}%`,
                transform: `translate(-50%, -50%) rotate(${obj.rotate}deg)`,
              }}
              aria-label={obj.def.name}
              className={`absolute p-2 rounded-2xl transition-all ${
                obj.found
                  ? 'opacity-0 scale-125 pointer-events-none'
                  : hintUid === obj.uid
                  ? 'bg-white/95 ring-4 ring-[#06B6D4] shadow-lg scale-110 z-20'
                  : 'hover:scale-110 active:scale-95 bg-white/85 border border-[#CBE5E8] shadow-[0_4px_10px_rgba(15,41,51,0.14)]'
              }`}
            >
              <RoomItemGraphic item={obj.def} className="w-11 h-11 sm:w-12 sm:h-12" />
            </button>
          ))}
        </div>
      </div>

      {done !== null && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <Sparkles className="w-9 h-9 text-[#0D9488] mx-auto" />
            <h3 className="font-display text-3xl font-bold text-[#0F2933]">
              {done ? 'Mystery Solved!' : 'Time Expired!'}
            </h3>
            <p className="text-sm text-[#356370]">
              Found {foundCount} of {targetCount} Dreamhouse keepsakes.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSeed((s) => s + 1);
                  setTimeLeft(45);
                  setHintsLeft(2);
                  setStreak(0);
                  setMistakes(0);
                  setHintUid(null);
                  setDone(null);
                }}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
              >
                New Mystery
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
