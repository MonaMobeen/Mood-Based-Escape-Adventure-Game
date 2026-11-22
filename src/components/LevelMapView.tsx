import { useState } from 'react';
import { Lock, Play, Sparkles, Star } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { CHAPTERS, getChapterLevels, getLevelDef, type GameLevelDef, type LevelModeType } from '../game/levels';
import { getTotalStars, type PlayerSaveData } from '../game/profile';

interface LevelMapViewProps {
  save: PlayerSaveData;
  onLaunchLevel: (level: GameLevelDef) => void;
}

const MODE_LABELS: Record<LevelModeType, string> = {
  messy_room: 'Messy Search',
  closet_hunt: 'Closet Hunt',
  jewelry_hunt: 'Jewelry Hunt',
  makeup_mystery: 'Makeup Hunt',
  memory_challenge: 'Memory Search',
  dream_room: 'Dream Room',
  running: 'Runway Dash',
  smart_organizer: 'Smart Organizer',
  makeover: 'Makeover',
  shopping: 'Shopping',
  mystery: 'Mystery Hunt',
};

export function LevelMapView({ save, onLaunchLevel }: LevelMapViewProps) {
  const currentChapterDefault = Math.min(
    8,
    Math.max(1, Math.ceil(save.highestUnlockedLevel / 30))
  );
  const [selectedChapterId, setSelectedChapterId] = useState(currentChapterDefault);
  const [previewLevel, setPreviewLevel] = useState<GameLevelDef>(() =>
    getLevelDef(save.highestUnlockedLevel)
  );

  const chapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];
  const levels = getChapterLevels(chapter.id);
  const totalStars = getTotalStars(save);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-20 pt-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4 py-2">
        {/* World Header */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#0D9488]">
              240-Level Campaign · 8 Coastal Worlds
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2933]">
              Chapter {chapter.id}: {chapter.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#356370] mt-0.5">{chapter.subtitle}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className="text-xs text-[#356370]">Total Stars</div>
              <div className="font-mono-num text-lg font-bold text-[#D97706] flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                <span>{totalStars}/720</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#356370]">Progress</div>
              <div className="font-mono-num text-lg font-bold text-[#0F766E]">
                Lv.{save.highestUnlockedLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CHAPTERS.map((ch) => {
            const active = ch.id === chapter.id;
            const unlocked = save.highestUnlockedLevel >= ch.startLevel;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  setSelectedChapterId(ch.id);
                }}
                className={`btn-tactile px-3.5 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#0F766E] border-[#0F766E] text-white shadow-sm'
                    : unlocked
                    ? 'bg-white border-[#CBE5E8] text-[#0F2933] hover:bg-[#E6F6F8]'
                    : 'bg-[#F4FAFB] border-[#D8EFF2] text-[#6B939D]'
                }`}
              >
                {ch.id}. {ch.name.split(' ')[0]} ({ch.startLevel}–{ch.endLevel})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Winding Level Path */}
          <div
            className="lg:col-span-7 rounded-2xl border border-[#CBE5E8] p-4 sm:p-5 shadow-sm"
            style={{ backgroundColor: chapter.bgTint }}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {levels.map((lvl, idx) => {
                const earnedStars = save.levelStars[lvl.levelNumber] || 0;
                const isUnlocked = lvl.levelNumber <= save.highestUnlockedLevel;
                const isCurrent = lvl.levelNumber === save.highestUnlockedLevel;
                const isSelected = previewLevel.levelNumber === lvl.levelNumber;

                const row = Math.floor(idx / 5);
                const stagger = row % 2 === 1 ? 'sm:translate-y-2' : '';

                return (
                  <button
                    key={lvl.levelNumber}
                    type="button"
                    onClick={() => {
                      soundEngine.playCutePop();
                      setPreviewLevel(lvl);
                    }}
                    className={`btn-tactile min-h-[72px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${stagger} ${
                      isSelected ? 'ring-2 ring-[#0284C7]/45 scale-[1.03]' : ''
                    } ${
                      isCurrent
                        ? 'bg-[#0F766E] border-[#0B534D] text-white shadow-md'
                        : isUnlocked
                        ? 'bg-white border-[#CBE5E8] text-[#0F2933] hover:border-[#0D9488]'
                        : 'bg-white/65 border-[#D8EFF2] text-[#6B939D]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {!isUnlocked && <Lock className="w-3 h-3" />}
                      <span className="font-mono-num text-sm font-bold">{lvl.levelNumber}</span>
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate max-w-full ${
                        isCurrent ? 'text-white/90' : 'text-[#356370]'
                      }`}
                    >
                      {MODE_LABELS[lvl.mode]}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= earnedStars
                              ? 'text-[#F59E0B] fill-[#F59E0B]'
                              : isCurrent
                              ? 'text-white/40'
                              : 'text-[#CBE5E8]'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Level Briefing Card */}
          <div className="lg:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-4 lg:sticky lg:top-20">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#0D9488]">
                <span>Level {previewLevel.levelNumber} · {MODE_LABELS[previewLevel.mode]}</span>
                <span>{previewLevel.modifierLabel}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#0F2933] mt-1">
                {previewLevel.title}
              </h3>
              <p className="text-sm text-[#356370] mt-1.5 leading-relaxed">
                {previewLevel.objectiveText}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#CBE5E8] text-center">
              <div>
                <div className="text-[11px] text-[#356370]">Coins</div>
                <div className="font-mono-num text-sm font-bold text-[#D97706]">
                  +{previewLevel.rewardCoins}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#356370]">Credits</div>
                <div className="font-mono-num text-sm font-bold text-[#0F766E]">
                  +{previewLevel.rewardCredits}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#356370]">XP</div>
                <div className="font-mono-num text-sm font-bold text-[#0284C7]">
                  +{previewLevel.rewardXp}
                </div>
              </div>
            </div>

            {previewLevel.levelNumber <= save.highestUnlockedLevel ? (
              <button
                type="button"
                onClick={() => onLaunchLevel(previewLevel)}
                className="btn-tactile w-full py-3.5 px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play Level {previewLevel.levelNumber}</span>
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] text-center text-xs font-semibold text-[#356370] flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Complete Level {previewLevel.levelNumber - 1} to unlock</span>
              </div>
            )}

            <div className="text-xs text-[#356370] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
              <span>Earn stars to unlock Ocean Treasure Chests in Rewards!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
