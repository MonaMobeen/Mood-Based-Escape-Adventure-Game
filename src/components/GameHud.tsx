import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Pause,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { OUTFIT_META } from '../game/constants';
import type { HudSnapshot, UnifiedActionKind } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onPerformAction: (action: UnifiedActionKind) => void;
  onMoveSteer: (dir: -1 | 0 | 1) => void;
}

const SEQUENCE_STEPS: Array<{
  id: UnifiedActionKind;
  label: string;
  keyHint: string;
  activeBg: string;
  activeBorder: string;
  idleAccent: string;
}> = [
  {
    id: 'jump',
    label: 'JUMP',
    keyHint: 'Leap',
    activeBg: 'bg-[#0F766E] text-white border-[#0B534D]',
    activeBorder: 'ring-2 ring-[#2DD4BF]',
    idleAccent: 'text-[#0F766E]',
  },
  {
    id: 'slide',
    label: 'SLIDE',
    keyHint: 'Duck',
    activeBg: 'bg-[#0284C7] text-white border-[#0369A1]',
    activeBorder: 'ring-2 ring-[#38BDF8]',
    idleAccent: 'text-[#0284C7]',
  },
  {
    id: 'roll',
    label: 'ROLL',
    keyHint: 'Dash',
    activeBg: 'bg-[#0891B2] text-white border-[#0E7490]',
    activeBorder: 'ring-2 ring-[#22D3EE]',
    idleAccent: 'text-[#0891B2]',
  },
];

export function GameHud({
  hud,
  muted,
  onPause,
  onToggleMute,
  onPerformAction,
  onMoveSteer,
}: GameHudProps) {
  const stageProgress = hud.endlessMode
    ? 1
    : Math.min(1, hud.stageDistance / Math.max(1, hud.stageTargetDistance));
  const outfitMeta = OUTFIT_META[hud.activeOutfit];
  const twirlReady = hud.twirlReadyRatio >= 0.999;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Status Clusters (Solid coastal cards — no backdrop-blur over canvas) */}
      <div className="flex items-start justify-between gap-2.5 sm:gap-4">
        {/* Top-Left: Poise Hearts + Stage & Mission */}
        <div className="bg-[#F4FAFB]/95 border border-[#CBE5E8] rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm max-w-[215px] sm:max-w-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-0.5 sm:gap-1"
              aria-label={`Poise ${hud.hearts} of ${hud.maxHearts}`}
            >
              {Array.from({ length: hud.maxHearts }).map((_, idx) => {
                const filled = idx < hud.hearts;
                return (
                  <svg
                    key={idx}
                    viewBox="0 0 24 24"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 ${
                      filled ? 'text-[#0D9488] scale-100' : 'text-[#CBE5E8] scale-90'
                    }`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                );
              })}
            </div>
            <span className="font-mono-num text-[11px] sm:text-xs font-bold text-[#0F2933]">
              {hud.hearts}/{hud.maxHearts}
            </span>
            <span aria-hidden="true" className="text-[#94C4CA]">·</span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#164E63] truncate">
              {outfitMeta.label}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#164E63]">
              <span className="truncate">
                {hud.endlessMode
                  ? 'Endless Encore'
                  : `${hud.adventureMode === 'relaxed' ? 'Relaxed · ' : ''}Stage ${hud.stageIndex + 1} · ${hud.stageName}`}
              </span>
              {!hud.endlessMode && (
                <span className="font-mono-num shrink-0">
                  {hud.stageDistance}/{hud.stageTargetDistance}m
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#D8EFF2] overflow-hidden">
              <div
                className="h-full bg-[#0D9488] transition-transform duration-150 origin-left"
                style={{ transform: `scaleX(${stageProgress})` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#CBE5E8] text-[11px] font-semibold">
              <span className={hud.runMission.completed ? 'text-[#0F766E]' : 'text-[#356370] truncate'}>
                {hud.runMission.completed ? 'Mission Complete (+250)' : hud.runMission.label}
              </span>
              <span className="font-mono-num text-[#0284C7] shrink-0">
                {hud.runMission.progress}/{hud.runMission.target}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Score / Combo + Mute & Pause */}
        <div className="flex items-start gap-2">
          <div className="bg-[#F4FAFB]/95 border border-[#CBE5E8] rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-sm text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-[11px] font-semibold text-[#356370]">Score</span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#0F2933]">
                {hud.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#356370]">
              <span>Best</span>
              <span className="font-mono-num font-semibold text-[#0F2933]">
                {hud.bestScore.toLocaleString()}
              </span>
              {hud.combo > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num font-bold text-[#0D9488]">
                    {hud.combo}x
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="btn-tactile h-11 w-11 flex items-center justify-center rounded-xl bg-[#F4FAFB]/95 border border-[#CBE5E8] text-[#0F2933] shadow-sm hover:bg-[#E6F6F8] focus-visible:outline-2 focus-visible:outline-[#0D9488]"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause game"
              className="btn-tactile h-11 w-11 flex items-center justify-center rounded-xl bg-[#F4FAFB]/95 border border-[#CBE5E8] text-[#0F2933] shadow-sm hover:bg-[#E6F6F8] focus-visible:outline-2 focus-visible:outline-[#0D9488]"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Perimeter: Compact Steer Pads + Coordinated JUMP -> SLIDE -> ROLL Sequence Dock */}
      <div className="flex items-end justify-between pointer-events-auto pb-0.5 gap-2 sm:gap-3">
        {/* Left / Right Subtle Steer Pads */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label="Move left"
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveSteer(-1);
            }}
            onPointerUp={() => onMoveSteer(0)}
            onPointerLeave={() => onMoveSteer(0)}
            onPointerCancel={() => onMoveSteer(0)}
            className="btn-tactile h-12 w-10 sm:w-12 rounded-xl bg-[#F4FAFB]/95 border border-[#CBE5E8] text-[#0F2933] flex items-center justify-center shadow-sm hover:bg-[#E6F6F8]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Move right"
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveSteer(1);
            }}
            onPointerUp={() => onMoveSteer(0)}
            onPointerLeave={() => onMoveSteer(0)}
            onPointerCancel={() => onMoveSteer(0)}
            className="btn-tactile h-12 w-10 sm:w-12 rounded-xl bg-[#F4FAFB]/95 border border-[#CBE5E8] text-[#0F2933] flex items-center justify-center shadow-sm hover:bg-[#E6F6F8]"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Coordinated Horizontal Action Sequence: JUMP -> SLIDE -> ROLL */}
        <div className="flex flex-col items-end gap-1.5 min-w-0">
          {hud.isStumbling && (
            <div className="px-3 py-1 rounded-lg bg-[#0F2933] text-[#2DD4BF] text-xs font-bold shadow-sm">
              Steady on the boardwalk...
            </div>
          )}

          {hud.glamFeverTimer > 0 && !hud.isStumbling && (
            <div className="px-2.5 py-0.5 rounded-lg bg-[#0F766E] text-white font-display text-[11px] font-bold tracking-wide shadow-sm">
              Ocean Fever · {hud.glamFeverTimer.toFixed(1)}s
            </div>
          )}

          <div
            role="group"
            aria-label="Action sequence: Jump, Slide, Roll"
            className="bg-[#F4FAFB]/95 border border-[#CBE5E8] rounded-2xl p-1 sm:p-1.5 shadow-lg flex items-center gap-0.5 sm:gap-1.5"
          >
            {SEQUENCE_STEPS.map((step, index) => {
              const isRecommended = hud.actionWindowActive && hud.recommendedAction === step.id;
              const isRoll = step.id === 'roll';
              const rollUnavailable = isRoll && !twirlReady;

              return (
                <div key={step.id} className="flex items-center gap-0.5 sm:gap-1.5">
                  <button
                    type="button"
                    disabled={hud.isStumbling}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onPerformAction(step.id);
                    }}
                    aria-label={`${step.label}${isRecommended ? ' (Recommended now)' : ''}`}
                    className={`btn-tactile relative overflow-hidden w-[74px] sm:w-[96px] h-[52px] sm:h-[56px] rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all select-none ${
                      isRecommended
                        ? `${step.activeBg} ${step.activeBorder} sequence-active-glow scale-[1.03]`
                        : 'bg-white hover:bg-[#E6F6F8] border-[#CBE5E8] text-[#0F2933]'
                    } ${hud.isStumbling ? 'opacity-55' : ''}`}
                  >
                    {/* Roll recharge fill indicator along bottom edge */}
                    {isRoll && rollUnavailable && (
                      <div
                        className="absolute inset-x-0 bottom-0 h-1 bg-[#0891B2]/35 origin-left"
                        style={{ transform: `scaleX(${hud.twirlReadyRatio})` }}
                      />
                    )}

                    <div className="flex items-center gap-1">
                      {step.id === 'jump' && (
                        <ArrowUp
                          className={`w-4 h-4 shrink-0 ${
                            isRecommended ? 'text-white' : step.idleAccent
                          }`}
                        />
                      )}
                      {step.id === 'slide' && (
                        <ArrowDown
                          className={`w-4 h-4 shrink-0 ${
                            isRecommended ? 'text-white' : step.idleAccent
                          }`}
                        />
                      )}
                      {step.id === 'roll' && (
                        <RotateCw
                          className={`w-4 h-4 shrink-0 ${
                            isRecommended
                              ? 'text-white'
                              : rollUnavailable
                              ? 'text-[#6B939D]'
                              : step.idleAccent
                          }`}
                        />
                      )}
                      <span className="font-display text-xs sm:text-sm font-extrabold tracking-wide leading-none">
                        {step.label}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold leading-none ${
                        isRecommended
                          ? 'text-white/95'
                          : rollUnavailable
                          ? 'text-[#6B939D]'
                          : 'text-[#356370]'
                      }`}
                    >
                      {isRecommended
                        ? 'TAP NOW'
                        : isRoll && rollUnavailable
                        ? `${Math.round(hud.twirlReadyRatio * 100)}%`
                        : step.keyHint}
                    </span>
                  </button>

                  {index < SEQUENCE_STEPS.length - 1 && (
                    <ChevronRight
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                        hud.actionWindowActive &&
                        SEQUENCE_STEPS[index + 1].id === hud.recommendedAction
                          ? 'text-[#0284C7] scale-110'
                          : 'text-[#7AAAB3]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
