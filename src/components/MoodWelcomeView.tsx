import { useState } from 'react';
import { ArrowRight, Compass, RefreshCw, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../game/audio';
import {
  MOOD_RECOMMENDATIONS,
  MOOD_WELCOME_PROMPT,
  type MoodId,
} from '../game/moods';
import type { PlayableModeRoute } from './ModesHub';

interface MoodWelcomeViewProps {
  onLaunchRecommended: (mode: PlayableModeRoute) => void;
  onExploreWorlds: () => void;
  onDismiss: () => void;
}

export function MoodWelcomeView({
  onLaunchRecommended,
  onExploreWorlds,
  onDismiss,
}: MoodWelcomeViewProps) {
  const [selectedMoodId, setSelectedMoodId] = useState<MoodId | null>(null);

  const selectedRec = selectedMoodId
    ? MOOD_RECOMMENDATIONS.find((m) => m.id === selectedMoodId) ?? null
    : null;

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-br from-[#ECFDF5] via-[#F4FAFB] to-[#E0F2FE] overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white/95 border border-[#CBE5E8] rounded-3xl p-5 sm:p-8 shadow-xl space-y-6 my-auto">
        {/* Top Row: Calm Little Escape Header + Skip */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Little Escape · Optional Mood Guide</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0F2933] leading-tight">
              {MOOD_WELCOME_PROMPT}
            </h1>
            <p className="text-xs sm:text-sm text-[#356370]">
              Pick how you feel right now for a gentle activity suggestion, or skip straight to all 5 worlds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              onDismiss();
            }}
            className="btn-tactile shrink-0 h-10 px-3.5 rounded-xl bg-[#F4FAFB] hover:bg-[#E6F6F8] border border-[#CBE5E8] text-xs font-semibold text-[#164E63] flex items-center gap-1.5"
          >
            <span>Skip</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7 Mood Option Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {MOOD_RECOMMENDATIONS.map((mood) => {
            const active = selectedMoodId === mood.id;
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  setSelectedMoodId(mood.id);
                }}
                className={`btn-tactile text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                  active
                    ? 'shadow-md ring-2 ring-[#0D9488]/30'
                    : 'bg-[#F4FAFB] hover:bg-[#E6F6F8] border-[#CBE5E8]'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: mood.softBg,
                        borderColor: mood.accent,
                      }
                    : undefined
                }
              >
                <div className="text-sm font-bold text-[#0F2933]">{mood.promptLabel}</div>
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span style={{ color: mood.accent }}>{mood.recommendedTitle}</span>
                  <span className="text-[#4B7480]">World {mood.worldNumber}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recommendation Detail Card */}
        {selectedRec ? (
          <div
            className="rounded-2xl border p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-all"
            style={{
              backgroundColor: selectedRec.softBg,
              borderColor: `${selectedRec.accent}55`,
            }}
          >
            <div className="md:col-span-4 aspect-[16/10] rounded-xl overflow-hidden border border-white shadow-sm bg-white">
              <img
                src={selectedRec.previewImage}
                alt={selectedRec.recommendedTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-8 space-y-3">
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: selectedRec.accent }}
                >
                  Suggested for you · {selectedRec.worldName}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F2933] mt-0.5">
                  {selectedRec.headline}
                </h2>
                <p className="text-xs sm:text-sm text-[#164E63] mt-1 leading-relaxed">
                  {selectedRec.reason}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    onLaunchRecommended(selectedRec.targetMode);
                  }}
                  className="btn-tactile h-11 px-5 rounded-xl text-white font-display font-bold text-sm flex items-center gap-2 shadow-sm"
                  style={{ backgroundColor: selectedRec.accent }}
                >
                  <span>Play {selectedRec.recommendedTitle}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    setSelectedMoodId(null);
                  }}
                  className="btn-tactile h-11 px-4 rounded-xl bg-white border border-[#CBE5E8] text-xs font-semibold text-[#0F2933] flex items-center gap-1.5 hover:bg-[#F4FAFB]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Choose Another Mood</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCutePop();
                    onExploreWorlds();
                  }}
                  className="btn-tactile h-11 px-4 rounded-xl bg-white/80 text-xs font-semibold text-[#164E63] flex items-center gap-1.5 hover:bg-white"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore All 5 Worlds</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#CBE5E8]">
            <p className="text-xs text-[#356370]">
              Your coins, stars, flower keepsakes, and outfits stay connected across every world.
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                onExploreWorlds();
              }}
              className="btn-tactile h-10 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All 5 Worlds</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
