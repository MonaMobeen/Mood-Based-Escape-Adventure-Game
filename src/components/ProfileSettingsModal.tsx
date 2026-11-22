import { useState } from 'react';
import { BarChart3, Crown, Heart, PlayCircle, RotateCcw, Sparkles, Star, Volume2, VolumeX, X } from 'lucide-react';
import { getAnalyticsSummary, loadAnalytics, resetAnalytics } from '../game/analytics';
import { soundEngine } from '../game/audio';
import { BOUTIQUE_ITEMS } from '../game/catalog';
import { getPlayerLevelFromXp, getTotalStars, type FavoriteWorldId, type PlayerSaveData } from '../game/profile';

interface ProfileSettingsModalProps {
  open: boolean;
  save: PlayerSaveData;
  onClose: () => void;
  onUpdateProfile: (name: string, badge: PlayerSaveData['avatarBadge'], favoriteWorld?: FavoriteWorldId) => void;
  onUpdateSettings: (next: PlayerSaveData['settings']) => void;
  onReplayRoomTutorial: () => void;
  onReplayRunTutorial: () => void;
  onRestoreBackup?: () => boolean;
  onResetSave: () => void;
}

const BADGES: Array<{ id: PlayerSaveData['avatarBadge']; label: string }> = [
  { id: 'crown', label: 'Crown' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' },
  { id: 'butterfly', label: 'Sparkle' },
];

const FAVORITE_WORLDS: Array<{ id: FavoriteWorldId; label: string }> = [
  { id: 'peaceful', label: 'Peaceful' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'satisfying', label: 'Satisfying' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'fashion', label: 'Fashion' },
];

export function ProfileSettingsModal({
  open,
  save,
  onClose,
  onUpdateProfile,
  onUpdateSettings,
  onReplayRoomTutorial,
  onReplayRunTutorial,
  onRestoreBackup,
  onResetSave,
}: ProfileSettingsModalProps) {
  const [, setAnalyticsTick] = useState(0);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  if (!open) return null;

  const levelInfo = getPlayerLevelFromXp(save.xp);
  const totalStars = getTotalStars(save);
  const analytics = loadAnalytics();
  const summary = getAnalyticsSummary(analytics);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2933]/60 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 text-[#0F2933]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Profile & Settings</h2>
            <p className="text-xs text-[#356370]">
              Level {levelInfo.level} · {totalStars} Stars · Auto-saved locally
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile h-10 w-10 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] flex items-center justify-center"
            aria-label="Close Profile and Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Name */}
        <div className="bg-white border border-[#CBE5E8] rounded-xl p-4 space-y-3">
          <label className="block text-xs font-bold text-[#164E63]">
            Player Name
            <input
              type="text"
              maxLength={22}
              value={save.playerName}
              onChange={(e) => onUpdateProfile(e.target.value, save.avatarBadge, save.favoriteWorld)}
              className="mt-1.5 w-full px-3 py-2 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] text-sm font-semibold text-[#0F2933]"
            />
          </label>

          <div>
            <span className="block text-xs font-bold text-[#164E63] mb-1.5">Avatar Emblem</span>
            <div className="grid grid-cols-4 gap-2">
              {BADGES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onUpdateProfile(save.playerName, b.id, save.favoriteWorld)}
                  className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 ${
                    save.avatarBadge === b.id
                      ? 'border-[#0D9488] bg-[#E6F6F8] text-[#0F766E]'
                      : 'border-[#CBE5E8] bg-white text-[#356370]'
                  }`}
                >
                  {b.id === 'crown' && <Crown className="w-3.5 h-3.5" />}
                  {b.id === 'heart' && <Heart className="w-3.5 h-3.5" />}
                  {b.id === 'star' && <Star className="w-3.5 h-3.5" />}
                  {b.id === 'butterfly' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-[#164E63] mb-1.5">Favorite World</span>
            <div className="grid grid-cols-5 gap-1.5">
              {FAVORITE_WORLDS.map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => onUpdateProfile(save.playerName, save.avatarBadge, fw.id)}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-semibold ${
                    (save.favoriteWorld ?? 'peaceful') === fw.id
                      ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46]'
                      : 'border-[#CBE5E8] bg-white text-[#356370]'
                  }`}
                >
                  {fw.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Hidden Objects</div>
            <div className="font-mono-num text-base font-bold text-[#0F766E]">{save.hiddenObjectsFoundTotal}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Items Sorted</div>
            <div className="font-mono-num text-base font-bold text-[#0D9488]">{save.itemsOrganizedTotal}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Best Run</div>
            <div className="font-mono-num text-base font-bold">{save.bestRunScore.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Smart Puzzles</div>
            <div className="font-mono-num text-base font-bold text-[#0284C7]">{save.smartPuzzlesSolved}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Flora Collected</div>
            <div className="font-mono-num text-base font-bold text-[#059669]">{save.peacefulWorld?.flowersCollected ?? 0}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Saved Looks</div>
            <div className="font-mono-num text-base font-bold text-[#7C3AED]">{save.savedLooks.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#CBE5E8]">
            <div className="text-[11px] text-[#356370]">Boutique Gear</div>
            <div className="font-mono-num text-base font-bold">{save.unlockedBoutiqueIds.length}/{BOUTIQUE_ITEMS.length}</div>
          </div>
        </div>

        {/* Privacy-Conscious Local Analytics & Insights */}
        <div className="bg-white border border-[#CBE5E8] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#164E63] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#0284C7]" />
              <span>Player Insights & Quality Telemetry (Local Only)</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                resetAnalytics();
                setAnalyticsTick((t) => t + 1);
              }}
              className="text-[11px] font-semibold text-[#356370] hover:text-[#0F2933] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#F4FAFB] border border-[#CBE5E8]">
              <div className="text-[10px] text-[#356370]">Sessions</div>
              <div className="font-mono-num text-sm font-bold">{analytics.sessionsCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-[#F4FAFB] border border-[#CBE5E8]">
              <div className="text-[10px] text-[#356370]">Win Rate</div>
              <div className="font-mono-num text-sm font-bold text-[#0F766E]">{summary.winRatePct}%</div>
            </div>
            <div className="p-2 rounded-lg bg-[#F4FAFB] border border-[#CBE5E8]">
              <div className="text-[10px] text-[#356370]">Top Mode</div>
              <div className="text-xs font-bold truncate">{summary.topMode}</div>
            </div>
            <div className="p-2 rounded-lg bg-[#F4FAFB] border border-[#CBE5E8]">
              <div className="text-[10px] text-[#356370]">Errors</div>
              <div className="font-mono-num text-sm font-bold text-[#0284C7]">{analytics.runtimeErrors}</div>
            </div>
          </div>
          <p className="text-[11px] text-[#356370]">
            No personal data leaves your device. Difficulty focus: <span className="font-semibold text-[#0F2933]">{summary.bottleneckMode}</span> · Opt-in Showcases: <span className="font-mono-num font-semibold">{analytics.rewardedAdOptIns}</span>
          </p>
        </div>

        {/* Sound & Accessibility */}
        <div className="bg-white border border-[#CBE5E8] rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-[#164E63]">Audio & Accessibility</h3>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              {save.settings.sfxEnabled ? <Volume2 className="w-4 h-4 text-[#0D9488]" /> : <VolumeX className="w-4 h-4" />}
              Sound Effects
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ ...save.settings, sfxEnabled: !save.settings.sfxEnabled })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                save.settings.sfxEnabled ? 'bg-[#0F766E] text-white' : 'bg-[#E6F6F8] text-[#356370]'
              }`}
            >
              {save.settings.sfxEnabled ? 'On' : 'Muted'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Background Music Synth</span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ ...save.settings, musicEnabled: !save.settings.musicEnabled })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                save.settings.musicEnabled ? 'bg-[#0F766E] text-white' : 'bg-[#E6F6F8] text-[#356370]'
              }`}
            >
              {save.settings.musicEnabled ? 'Playing' : 'Off'}
            </button>
          </div>

          <label className="flex items-center justify-between gap-4 text-xs text-[#356370]">
            <span>Music Volume</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={save.settings.musicVolume}
              onChange={(e) =>
                onUpdateSettings({ ...save.settings, musicVolume: parseFloat(e.target.value) })
              }
              className="accent-[#0D9488]"
            />
          </label>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#065F46]">Global No Pressure Mode</div>
              <div className="text-[11px] text-[#356370]">Pauses countdowns & uses Relaxed Exploration runner</div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...save.settings,
                  noPressureMode: !save.settings.noPressureMode,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                save.settings.noPressureMode ? 'bg-[#059669] text-white' : 'bg-[#E6F6F8] text-[#356370]'
              }`}
            >
              {save.settings.noPressureMode ? 'Active' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nature Ambience Sound</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...save.settings,
                    ambienceMode: save.settings.ambienceMode === 'rain' ? 'ocean' : 'rain',
                  })
                }
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#E0F2FE] text-[#0369A1]"
              >
                {save.settings.ambienceMode === 'rain' ? 'Soft Rain' : 'Ocean Breeze'}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...save.settings,
                    ambienceEnabled: !save.settings.ambienceEnabled,
                  })
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                  save.settings.ambienceEnabled ? 'bg-[#0F766E] text-white' : 'bg-[#E6F6F8] text-[#356370]'
                }`}
              >
                {save.settings.ambienceEnabled ? 'Playing' : 'Off'}
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 text-xs text-[#356370]">
            <span>Ambience Volume</span>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={save.settings.ambienceVolume}
              onChange={(e) =>
                onUpdateSettings({ ...save.settings, ambienceVolume: parseFloat(e.target.value) })
              }
              className="accent-[#0D9488]"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">High-Contrast Hints</span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...save.settings,
                  highContrastHints: !save.settings.highContrastHints,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                save.settings.highContrastHints ? 'bg-[#0284C7] text-white' : 'bg-[#E6F6F8] text-[#356370]'
              }`}
            >
              {save.settings.highContrastHints ? 'Enabled' : 'Standard'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Reduced Motion</span>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...save.settings,
                  reducedMotion: !save.settings.reducedMotion,
                })
              }
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                save.settings.reducedMotion ? 'bg-[#0284C7] text-white' : 'bg-[#E6F6F8] text-[#356370]'
              }`}
            >
              {save.settings.reducedMotion ? 'Reduced' : 'Full'}
            </button>
          </div>
        </div>

        {/* Interactive Tutorials Replay */}
        <div className="bg-white border border-[#CBE5E8] rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-[#164E63]">Interactive Tutorials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                onClose();
                onReplayRoomTutorial();
              }}
              className="btn-tactile py-2.5 px-3 rounded-xl bg-[#E6F6F8] hover:bg-[#D8EFF2] border border-[#CBE5E8] text-xs font-semibold text-[#0F766E] flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>Replay Room Search Preview</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                onClose();
                onReplayRunTutorial();
              }}
              className="btn-tactile py-2.5 px-3 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-semibold text-[#0284C7] flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 shrink-0" />
              <span>Replay Running Game Preview</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          {backupNotice && (
            <div className="text-xs font-semibold text-[#0F766E] bg-[#E6F6F8] border border-[#CBE5E8] rounded-xl px-3 py-2 text-center">
              {backupNotice}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {onRestoreBackup && (
                <button
                  type="button"
                  onClick={() => {
                    const restored = onRestoreBackup();
                    setBackupNotice(
                      restored ? 'Restored your local save backup!' : 'No previous backup found yet.'
                    );
                  }}
                  className="text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  Restore Save Backup
                </button>
              )}
              <button
                type="button"
                onClick={onResetSave}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Reset Local Progress
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-tactile px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
