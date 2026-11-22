import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { STORAGE_ZONES, type StorageZoneId } from '../../game/catalog';
import { soundEngine } from '../../game/audio';
import type { GameLevelDef } from '../../game/levels';
import type { PlayerSaveData } from '../../game/profile';
import {
  generatePersonalizedChallenge,
  type SmartChallengePayload,
} from '../../game/smartOrganizer';
import { RoomItemGraphic } from '../RoomItemGraphic';

interface SmartOrganizerModeProps {
  save: PlayerSaveData;
  levelDef?: GameLevelDef;
  onExit: () => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
    efficiency: number;
    mistakesCount?: number;
  }) => void;
}

export function SmartOrganizerMode({
  save,
  levelDef,
  onExit,
  onComplete,
}: SmartOrganizerModeProps) {
  const [challengeSeed, setChallengeSeed] = useState(0);
  const challenge: SmartChallengePayload = useMemo(
    () => generatePersonalizedChallenge(save, levelDef ? levelDef.levelNumber : save.smartPuzzlesSolved + challengeSeed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challengeSeed, levelDef?.levelNumber]
  );

  // State for Misplaced
  const [misplacedSlots, setMisplacedSlots] = useState(() => challenge.misplacedSlots || []);
  const [selectedMisplacedUid, setSelectedMisplacedUid] = useState<string | null>(null);

  // State for Duplicate
  const [duplicateSlots, setDuplicateSlots] = useState(() => challenge.duplicateSlots || []);

  // State for Outfit Match
  const [pickedMatchIds, setPickedMatchIds] = useState<string[]>([]);

  // State for Limited Space
  const [limitedPlaced, setLimitedPlaced] = useState<Record<string, StorageZoneId>>({});
  const [selectedLimitedIdx, setSelectedLimitedIdx] = useState<number>(0);

  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [doneResult, setDoneResult] = useState<{ won: boolean; efficiency: number; bonusCredits: number } | null>(null);

  const resetWithChallenge = (nextSeed: number) => {
    const next = generatePersonalizedChallenge(save, save.smartPuzzlesSolved + nextSeed);
    setChallengeSeed(nextSeed);
    setMisplacedSlots(next.misplacedSlots || []);
    setSelectedMisplacedUid(null);
    setDuplicateSlots(next.duplicateSlots || []);
    setPickedMatchIds([]);
    setLimitedPlaced({});
    setSelectedLimitedIdx(0);
    setMoves(0);
    setMistakes(0);
    setFeedback(null);
    setDoneResult(null);
  };

  const concludePuzzle = (won: boolean, totalMovesUsed: number, totalMistakes: number) => {
    const efficiency = won
      ? Math.max(45, Math.min(100, Math.round((challenge.parMoves / Math.max(1, totalMovesUsed)) * 100)))
      : 0;
    const bonusCredits = won ? (efficiency >= 90 ? 25 : efficiency >= 75 ? 15 : 8) : 0;
    const stars = !won ? 0 : efficiency >= 88 ? 3 : efficiency >= 68 ? 2 : 1;

    if (won) soundEngine.playVictory();
    else soundEngine.playWrongPlace();

    setDoneResult({ won, efficiency, bonusCredits });
    onComplete({
      won,
      stars,
      coinsEarned: won ? 120 + efficiency : 30,
      creditsEarned: won ? 20 + bonusCredits : 4,
      xpEarned: won ? 75 + stars * 15 : 15,
      efficiency,
      mistakesCount: totalMistakes,
    });
  };

  const registerMove = (wasError: boolean, nextDone: boolean) => {
    const nextMoves = moves + 1;
    const nextMistakes = mistakes + (wasError ? 1 : 0);
    setMoves(nextMoves);
    if (wasError) setMistakes(nextMistakes);

    if (nextDone) {
      concludePuzzle(true, nextMoves, nextMistakes);
    } else if (nextMoves >= challenge.maxMoves) {
      concludePuzzle(false, nextMoves, nextMistakes);
    }
  };

  // Handlers per mode
  const handlePlaceMisplaced = (targetZone: StorageZoneId) => {
    if (!selectedMisplacedUid || doneResult) return;
    const slot = misplacedSlots.find((s) => s.uid === selectedMisplacedUid);
    if (!slot || slot.fixed) return;

    if (slot.item.targetZone === targetZone) {
      soundEngine.playCorrectPlace(2);
      const updated = misplacedSlots.map((s) =>
        s.uid === slot.uid ? { ...s, currentZone: targetZone, fixed: true } : s
      );
      setMisplacedSlots(updated);
      setSelectedMisplacedUid(null);
      setFeedback(`Smart move! ${slot.item.name} returned to its proper spot.`);
      const allFixed = updated.every((s) => s.fixed);
      registerMove(false, allFixed);
    } else {
      soundEngine.playWrongPlace();
      setFeedback(`Not quite — ${slot.item.name} doesn't belong there.`);
      registerMove(true, false);
    }
  };

  const handleBoxDuplicate = (uid: string) => {
    if (doneResult) return;
    const slot = duplicateSlots.find((s) => s.uid === uid);
    if (!slot || slot.boxed) return;

    if (slot.isDuplicate) {
      soundEngine.playCorrectPlace(2);
      const updated = duplicateSlots.map((s) => (s.uid === uid ? { ...s, boxed: true } : s));
      setDuplicateSlots(updated);
      setFeedback(`Duplicate "${slot.item.name}" packed for donation!`);
      const allDone = updated.filter((s) => s.isDuplicate).every((s) => s.boxed);
      registerMove(false, allDone);
    } else {
      soundEngine.playWrongPlace();
      setFeedback(`Wait — "${slot.item.name}" is a unique essential, keep it!`);
      registerMove(true, false);
    }
  };

  const handlePickMatch = (itemId: string) => {
    if (doneResult || !challenge.matchChallenge) return;
    if (pickedMatchIds.includes(itemId)) return;

    if (challenge.matchChallenge.targetItemIds.includes(itemId)) {
      soundEngine.playCorrectPlace(2);
      const nextPicked = [...pickedMatchIds, itemId];
      setPickedMatchIds(nextPicked);
      setFeedback('Perfect outfit pairing!');
      registerMove(false, nextPicked.length === challenge.matchChallenge.targetItemIds.length);
    } else {
      soundEngine.playWrongPlace();
      setFeedback(`That doesn't match the "${challenge.matchChallenge.occasion}" dress code.`);
      registerMove(true, false);
    }
  };

  const handlePlaceLimited = (zoneId: StorageZoneId) => {
    if (doneResult || !challenge.limitedItems) return;
    const item = challenge.limitedItems[selectedLimitedIdx];
    if (!item) return;

    const cap = challenge.zoneCapacity || 3;
    const currentCount = Object.values(limitedPlaced).filter((z) => z === zoneId).length;
    if (currentCount >= cap) {
      soundEngine.playWrongPlace();
      setFeedback('That storage zone is at max capacity! Use Deco Storage Trunk for overflow.');
      registerMove(true, false);
      return;
    }

    const primaryCount = Object.values(limitedPlaced).filter((z) => z === item.targetZone).length;
    const valid = zoneId === item.targetZone || (zoneId === 'storage_box' && primaryCount >= cap);

    if (valid) {
      soundEngine.playCorrectPlace(2);
      const nextPlaced = { ...limitedPlaced, [String(selectedLimitedIdx)]: zoneId };
      setLimitedPlaced(nextPlaced);
      setFeedback(`Packed ${item.name} efficiently!`);
      const nextIdx = selectedLimitedIdx + 1;
      setSelectedLimitedIdx(nextIdx);
      registerMove(false, Object.keys(nextPlaced).length >= challenge.limitedItems.length);
    } else {
      soundEngine.playWrongPlace();
      setFeedback(`${item.name} prefers its main category zone unless that zone is full!`);
      registerMove(true, false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-10 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onExit}
                className="btn-tactile h-11 w-11 shrink-0 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
                aria-label="Exit Smart Organizer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Smart Dream Organizer</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2933] truncate">
                  {challenge.title}
                </h2>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-[#356370]">Moves</div>
              <div className="font-mono-num text-base font-bold text-[#0F2933]">
                {moves}/{challenge.maxMoves}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] text-xs sm:text-sm text-[#164E63]">
            <span className="font-semibold text-[#0F766E]">Personalized Analysis: </span>
            {challenge.aiInsight}
          </div>

          <p className="text-sm font-medium text-[#0F2933]">{challenge.instruction}</p>
        </div>

        {feedback && (
          <div className="px-4 py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-xs sm:text-sm font-semibold text-[#0F2933]">
            {feedback}
          </div>
        )}

        {/* 1. Misplaced Objects Mode */}
        {challenge.type === 'misplaced' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STORAGE_ZONES.map((zone) => {
                const zoneItems = misplacedSlots.filter((s) => s.currentZone === zone.id);
                return (
                  <div
                    key={zone.id}
                    className="p-3 rounded-2xl border border-[#CBE5E8] bg-white space-y-2.5"
                    style={{ backgroundColor: zone.bgTint }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlaceMisplaced(zone.id)}
                      className={`btn-tactile w-full py-2 px-2.5 rounded-xl text-left transition-colors ${
                        selectedMisplacedUid
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-white/90 text-[#0F2933]'
                      }`}
                    >
                      <div className="text-xs font-bold">{zone.label}</div>
                      <div className="text-[11px] opacity-80">
                        {selectedMisplacedUid ? 'Tap to move here' : zone.subtitle}
                      </div>
                    </button>

                    <div className="space-y-2">
                      {zoneItems.map((slot) => {
                        const isSelected = selectedMisplacedUid === slot.uid;
                        return (
                          <button
                            key={slot.uid}
                            type="button"
                            disabled={slot.fixed}
                            onClick={() => setSelectedMisplacedUid(slot.uid)}
                            className={`btn-tactile w-full p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                              slot.fixed
                                ? 'bg-white/80 border-emerald-200 opacity-85'
                                : isSelected
                                ? 'bg-white border-[#0D9488] ring-2 ring-[#0D9488]/30'
                                : 'bg-white border-[#CBE5E8] hover:border-[#0D9488]'
                            }`}
                          >
                            <RoomItemGraphic item={slot.item} className="w-8 h-8 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#0F2933] truncate">
                                {slot.item.name}
                              </div>
                              <div className="text-[10px] font-medium text-[#0D9488]">
                                {slot.fixed ? 'In right place' : 'Misplaced! Tap me'}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Duplicate Audit Mode */}
        {challenge.type === 'duplicate' && (
          <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#356370]">
              <span>Tap duplicate items to box them up</span>
              <span className="font-mono-num text-[#0F766E]">
                {duplicateSlots.filter((s) => s.isDuplicate && s.boxed).length}/3 Found
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {duplicateSlots.map((slot) => (
                <button
                  key={slot.uid}
                  type="button"
                  disabled={slot.boxed}
                  onClick={() => handleBoxDuplicate(slot.uid)}
                  className={`btn-tactile p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    slot.boxed
                      ? 'bg-emerald-50 border-emerald-200 opacity-60'
                      : 'bg-[#F4FAFB] border-[#CBE5E8] hover:border-[#0D9488]'
                  }`}
                >
                  <RoomItemGraphic item={slot.item} className="w-11 h-11" />
                  <span className="text-xs font-semibold text-[#0F2933] text-center">{slot.item.name}</span>
                  <span className="text-[10px] text-[#356370]">
                    {slot.boxed ? 'Boxed' : 'Tap if Duplicate'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Smart Outfit-Accessory Match */}
        {challenge.type === 'outfit_match' && challenge.matchChallenge && (
          <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#CBE5E8]">
              <div>
                <span className="text-xs font-semibold text-[#0D9488]">Occasion</span>
                <div className="text-base font-bold text-[#0F2933]">
                  {challenge.matchChallenge.occasion} · {challenge.matchChallenge.outfitName}
                </div>
              </div>
              <div className="font-mono-num text-sm font-bold text-[#0F766E]">
                {pickedMatchIds.length}/3 Matched
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {challenge.matchChallenge.pool.map((item) => {
                const picked = pickedMatchIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={picked}
                    onClick={() => handlePickMatch(item.id)}
                    className={`btn-tactile p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      picked
                        ? 'bg-[#E6F6F8] border-[#0D9488]'
                        : 'bg-[#F4FAFB] border-[#CBE5E8] hover:border-[#0D9488]'
                    }`}
                  >
                    <RoomItemGraphic item={item} className="w-11 h-11" />
                    <span className="text-xs font-semibold text-[#0F2933] text-center">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Limited Space Packing */}
        {challenge.type === 'limited_space' && challenge.limitedItems && (
          <div className="space-y-4">
            <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 flex items-center justify-between gap-4">
              {challenge.limitedItems[selectedLimitedIdx] ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8]">
                    <RoomItemGraphic item={challenge.limitedItems[selectedLimitedIdx]} className="w-12 h-12" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#0D9488]">
                      Item {selectedLimitedIdx + 1} of {challenge.limitedItems.length}
                    </div>
                    <div className="text-base font-bold text-[#0F2933]">
                      {challenge.limitedItems[selectedLimitedIdx].name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>All items packed!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STORAGE_ZONES.map((zone) => {
                const count = Object.values(limitedPlaced).filter((z) => z === zone.id).length;
                const cap = challenge.zoneCapacity || 3;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handlePlaceLimited(zone.id)}
                    className="btn-tactile p-3.5 rounded-2xl border-2 border-[#CBE5E8] hover:border-[#0D9488] text-left space-y-1 transition-all"
                    style={{ backgroundColor: zone.bgTint }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F2933]">{zone.label}</span>
                      <span className="font-mono-num text-xs font-bold text-[#0F766E]">
                        {count}/{cap}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#356370]">{zone.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      {doneResult && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 space-y-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]">
              <Sparkles className="w-4 h-4" />
              <span>Smart Dream Organizer Report</span>
            </div>
            <h3 className="font-display text-3xl font-bold text-[#0F2933]">
              {doneResult.won ? 'Brilliantly Organized!' : 'Out of Moves!'}
            </h3>
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#CBE5E8]">
              <div>
                <div className="text-xs text-[#356370]">Efficiency</div>
                <div className="font-mono-num text-lg font-bold text-[#0F766E]">{doneResult.efficiency}%</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Mistakes</div>
                <div className="font-mono-num text-lg font-bold text-[#0F2933]">{mistakes}</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Smart Bonus</div>
                <div className="font-mono-num text-lg font-bold text-[#0284C7]">+{doneResult.bonusCredits} Cr</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => resetWithChallenge(challengeSeed + 1)}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Next Smart Challenge</span>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="btn-tactile w-full py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-[#0F2933] font-semibold text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
