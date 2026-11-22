import { ArrowRight, Crown, Heart, Home, Play, RotateCcw } from 'lucide-react';
import { STAGES } from '../game/constants';
import type { GameState, HudSnapshot } from '../game/types';

interface GameModalsProps {
  gameState: GameState;
  hud: HudSnapshot;
  coins?: number;
  lastReward?: { coins: number; credits: number; xp: number } | null;
  onResume: () => void;
  onNextStage: () => void;
  onEndlessEncore: () => void;
  onSecondWind?: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

export function GameModals({
  gameState,
  hud,
  coins = 0,
  lastReward,
  onResume,
  onNextStage,
  onEndlessEncore,
  onSecondWind,
  onRestart,
  onBackToTitle,
}: GameModalsProps) {
  if (gameState === 'TITLE_MENU' || gameState === 'PLAYING') {
    return null;
  }

  const nextStage = STAGES[Math.min(hud.stageIndex + 1, STAGES.length - 1)];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-6 bg-[#0F2933]/60">
      <div className="w-full max-w-md bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 sm:p-7 shadow-xl text-[#0F2933] transition-transform duration-200">
        {gameState === 'PAUSED' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#0D9488]">Paused</p>
              <h2 className="font-display text-3xl font-bold text-[#0F2933] mt-0.5">
                Cabana Break
              </h2>
              <p className="text-sm text-[#356370] mt-1">
                Catch your breath before stepping back onto {hud.stageName}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#CBE5E8] text-sm">
              <div>
                <div className="text-xs text-[#356370]">Current Score</div>
                <div className="font-mono-num text-lg font-bold">{hud.score.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[#356370]">Distance</div>
                <div className="font-mono-num text-lg font-bold">{hud.distance.toLocaleString()}m</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="btn-tactile w-full py-3 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Runway</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl bg-white border border-[#CBE5E8] hover:bg-[#E6F6F8] text-[#0F2933] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Run</span>
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl text-[#356370] hover:text-[#0F2933] font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Back to Coastal Hub</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'STAGE_CLEAR' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#0284C7]">
                Stage {hud.stageIndex + 1} Complete
              </p>
              <h2 className="font-display text-3xl font-bold text-[#0F2933] mt-0.5">
                Showstopper!
              </h2>
              <p className="text-sm text-[#356370] mt-1">
                Next up: <span className="font-semibold text-[#0F2933]">{nextStage.name}</span> — {nextStage.subtitle}
              </p>
            </div>

            <RunStatsGrid hud={hud} lastReward={lastReward} />

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onNextStage}
                className="btn-tactile w-full py-3 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Continue to Stage {hud.stageIndex + 2}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl text-[#356370] hover:text-[#0F2933] font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Back to Coastal Hub</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'VICTORY' && (
          <div className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D97706]">
                <Crown className="w-4 h-4" />
                <span>Grand Runway Finale</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-[#0F2933] mt-0.5">
                World Runner Icon
              </h2>
              <p className="text-sm text-[#356370] mt-1">
                You explored all six scenic Adventure World routes with rhythm, poise, and style!
              </p>
            </div>

            <RunStatsGrid hud={hud} lastReward={lastReward} />

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onEndlessEncore}
                className="btn-tactile w-full py-3 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Continue Endless Encore</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl bg-white border border-[#CBE5E8] hover:bg-[#E6F6F8] text-[#0F2933] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl text-[#356370] hover:text-[#0F2933] font-medium text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Back to Coastal Hub</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#0284C7]">Runway Curtain Call</p>
              <h2 className="font-display text-3xl font-bold text-[#0F2933] mt-0.5">
                What a Performance!
              </h2>
              <p className="text-sm text-[#356370] mt-1">
                Dust off your kicks and dash the Emerald Cove boardwalk again.
              </p>
            </div>

            <RunStatsGrid hud={hud} lastReward={lastReward} />

            <div className="flex flex-col gap-2.5">
              {!hud.secondWindUsed && onSecondWind && coins >= 40 && (
                <button
                  type="button"
                  onClick={onSecondWind}
                  className="btn-tactile w-full py-3 px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Second Wind Continue (40 Coins)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onRestart}
                className="btn-tactile w-full py-3 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="btn-tactile w-full py-2.5 px-5 rounded-xl bg-white border border-[#CBE5E8] hover:bg-[#E6F6F8] text-[#0F2933] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Back to Coastal Hub</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RunStatsGrid({
  hud,
  lastReward,
}: {
  hud: HudSnapshot;
  lastReward?: { coins: number; credits: number; xp: number } | null;
}) {
  return (
    <div className="space-y-2.5 py-3.5 border-y border-[#CBE5E8] text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-[#356370]">Final Score</div>
          <div className="font-mono-num text-xl font-bold text-[#0F766E]">
            {hud.score.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#356370]">Best Score</div>
          <div className="font-mono-num text-xl font-bold text-[#0F2933]">
            {hud.bestScore.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#356370]">Gems · Crowns</div>
          <div className="font-mono-num font-semibold text-[#0F2933]">
            {hud.diamondsCollected} · {hud.crownsCollected}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#356370]">Distance · Perfects</div>
          <div className="font-mono-num font-semibold text-[#0F2933]">
            {hud.distance}m · {hud.perfectCount}
          </div>
        </div>
      </div>
      {lastReward && (
        <div className="pt-2 border-t border-[#CBE5E8] flex items-center justify-between text-xs font-semibold text-[#164E63]">
          <span>Run Rewards Earned</span>
          <span className="font-mono-num text-[#0F766E]">
            +{lastReward.coins} Coins · +{lastReward.credits} Credits · +{lastReward.xp} XP
          </span>
        </div>
      )}
    </div>
  );
}
