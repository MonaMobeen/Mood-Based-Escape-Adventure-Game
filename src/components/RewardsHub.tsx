import { useState } from 'react';
import { Award, Calendar, Compass, Gift, Sparkles, Star, Trophy } from 'lucide-react';
import { soundEngine } from '../game/audio';
import {
  ACHIEVEMENTS,
  CHEST_MILESTONES,
  SEASONAL_TIERS,
  getPlayerLevelFromXp,
  getTodayKey,
  getTotalStars,
  type PlayerSaveData,
  type StoreBundleDef,
} from '../game/profile';
import { CommercialStorePanel } from './CommercialStorePanel';

interface RewardsHubProps {
  save: PlayerSaveData;
  onClaimDailyLogin: (coins: number, credits: number, xp: number) => void;
  onSpinReward: (coins: number, credits: number, xp: number, usedBonus: boolean) => void;
  onClaimChest: (starsThreshold: number, coins: number, credits: number, xp: number) => void;
  onClaimMission: (missionId: string) => void;
  onClaimWeeklyChallenge: () => void;
  onClaimSeasonalTier: (tier: number, coins: number, credits: number) => void;
  onClaimAchievement: (achId: string, credits: number) => void;
  onClaimRewardedBonus: (rewardType: 'coins' | 'credits' | 'hints') => void;
  onUnlockBundle: (bundle: StoreBundleDef, method: 'credits' | 'iap_preview') => void;
  onToggleShowcaseBreaks: (enabled: boolean) => void;
}

const WHEEL_SLICES = [
  { label: '150 Coins', coins: 150, credits: 0, xp: 20, color: '#0D9488' },
  { label: '40 Credits', coins: 0, credits: 40, xp: 25, color: '#0284C7' },
  { label: '250 Coins', coins: 250, credits: 10, xp: 35, color: '#F59E0B' },
  { label: '80 XP', coins: 60, credits: 10, xp: 80, color: '#0F766E' },
  { label: 'Jackpot!', coins: 400, credits: 65, xp: 90, color: '#06B6D4' },
  { label: '100 Coins', coins: 100, credits: 15, xp: 20, color: '#14B8A6' },
];

export function RewardsHub({
  save,
  onClaimDailyLogin,
  onSpinReward,
  onClaimChest,
  onClaimMission,
  onClaimWeeklyChallenge,
  onClaimSeasonalTier,
  onClaimAchievement,
  onClaimRewardedBonus,
  onUnlockBundle,
  onToggleShowcaseBreaks,
}: RewardsHubProps) {
  const [wheelAngle, setWheelAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinToast, setSpinToast] = useState<string | null>(null);

  const today = getTodayKey();
  const canFreeSpinToday = save.lastSpinDate !== today;
  const totalSpinsAvailable = (canFreeSpinToday ? 1 : 0) + save.bonusSpins;
  const totalStars = getTotalStars(save);
  const levelInfo = getPlayerLevelFromXp(save.xp);

  const handleSpin = () => {
    if (spinning || totalSpinsAvailable <= 0) return;
    soundEngine.unlock();
    setSpinning(true);
    setSpinToast(null);

    const winIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const sliceDeg = 360 / WHEEL_SLICES.length;
    const targetDeg = wheelAngle + 1440 + (360 - (winIndex * sliceDeg + sliceDeg / 2));
    setWheelAngle(targetDeg);

    let tickCount = 0;
    const ticker = window.setInterval(() => {
      soundEngine.playWheelTick();
      tickCount++;
      if (tickCount > 14) clearInterval(ticker);
    }, 160);

    window.setTimeout(() => {
      clearInterval(ticker);
      setSpinning(false);
      const prize = WHEEL_SLICES[winIndex];
      soundEngine.playVictory();
      onSpinReward(prize.coins, prize.credits, prize.xp, !canFreeSpinToday);
      setSpinToast(`Wheel Prize: ${prize.label} (+${prize.coins} Coins, +${prize.credits} Credits, +${prize.xp} XP)!`);
    }, 2600);
  };

  const playerScoreRank = save.bestRunScore + save.xp * 3 + totalStars * 60;
  const leaderboard = [
    { name: 'Chelsea Cove', pts: 14200 },
    { name: 'Skipper Wave', pts: 9800 },
    { name: 'Brooklyn Tide', pts: 6400 },
    { name: 'Ken Marina', pts: 3900 },
    { name: `${save.playerName} (You)`, pts: playerScoreRank, isMe: true },
  ].sort((a, b) => b.pts - a.pts);

  const weeklyDone = save.weeklyChallenge.current >= save.weeklyChallenge.target;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-20 pt-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-5 py-2">
        {/* Seasonal Event Banner */}
        <div className="bg-gradient-to-r from-[#0F766E] via-[#0D9488] to-[#0284C7] text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold opacity-95 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Seasonal Event · Emerald Tide Festival</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mt-0.5">
                Coastal Rewards, Wheel & Boutique
              </h2>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                Player Level {levelInfo.level} · Earn Emerald Tokens across runs and room levels to unlock festival vaults!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/15 rounded-xl px-4 py-2 text-right">
                <div className="text-[11px] opacity-90">Tide Tokens</div>
                <div className="font-mono-num text-lg font-bold">{save.seasonalEvent.tokens}</div>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-2 text-right">
                <div className="text-[11px] opacity-90">Login Streak</div>
                <div className="font-mono-num text-lg font-bold">{save.loginStreak} / 7</div>
              </div>
            </div>
          </div>

          {/* Seasonal Tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SEASONAL_TIERS.map((tier) => {
              const unlocked = save.seasonalEvent.tokens >= tier.tokens;
              const claimed = save.seasonalEvent.claimedTiers.includes(tier.tier);
              return (
                <div
                  key={tier.tier}
                  className="bg-white/12 border border-white/25 rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold">{tier.label}</div>
                    <div className="font-mono-num text-[11px] opacity-90">
                      {Math.min(save.seasonalEvent.tokens, tier.tokens)}/{tier.tokens} Tokens
                    </div>
                  </div>
                  {claimed ? (
                    <span className="text-xs font-bold text-[#99F6E4]">Claimed ✓</span>
                  ) : unlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playVictory();
                        onClaimSeasonalTier(tier.tier, tier.coins, tier.credits);
                      }}
                      className="btn-tactile px-3 py-1.5 rounded-lg bg-white text-[#0F766E] text-xs font-bold"
                    >
                      Claim +{tier.coins}
                    </button>
                  ) : (
                    <span className="font-mono-num text-[11px] opacity-85">
                      +{tier.coins} C / +{tier.credits} Cr
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fair Commercial Store & Opt-In Rewarded Showcase */}
        <CommercialStorePanel
          save={save}
          onClaimRewardedBonus={onClaimRewardedBonus}
          onUnlockBundle={onUnlockBundle}
          onToggleShowcaseBreaks={onToggleShowcaseBreaks}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Spin the Wheel */}
          <div className="lg:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#0F2933]">Emerald Prize Wheel</h3>
              <span className="font-mono-num text-xs font-bold text-[#0D9488]">
                {totalSpinsAvailable} Spin{totalSpinsAvailable === 1 ? '' : 's'}
              </span>
            </div>

            <div className="relative w-56 h-56 flex items-center justify-center">
              <div className="absolute -top-2 z-20 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#0F2933]" />
              <svg
                viewBox="0 0 200 200"
                className="w-52 h-52 transition-transform duration-[2500ms] ease-out"
                style={{ transform: `rotate(${wheelAngle}deg)` }}
              >
                {WHEEL_SLICES.map((slice, i) => {
                  const angle = (360 / WHEEL_SLICES.length) * i - 90;
                  const nextAngle = angle + 360 / WHEEL_SLICES.length;
                  const r = 95;
                  const x1 = 100 + r * Math.cos((angle * Math.PI) / 180);
                  const y1 = 100 + r * Math.sin((angle * Math.PI) / 180);
                  const x2 = 100 + r * Math.cos((nextAngle * Math.PI) / 180);
                  const y2 = 100 + r * Math.sin((nextAngle * Math.PI) / 180);
                  const mid = ((angle + nextAngle) / 2) * (Math.PI / 180);
                  return (
                    <g key={slice.label}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                        fill={slice.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x={100 + 58 * Math.cos(mid)}
                        y={100 + 58 * Math.sin(mid)}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(angle + nextAngle) / 2 + 90}, ${100 + 58 * Math.cos(mid)}, ${100 + 58 * Math.sin(mid)})`}
                      >
                        {slice.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="18" fill="#FFFFFF" stroke="#0F2933" strokeWidth="3" />
              </svg>
            </div>

            {spinToast && (
              <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center">
                {spinToast}
              </div>
            )}

            <button
              type="button"
              disabled={spinning || totalSpinsAvailable <= 0}
              onClick={handleSpin}
              className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] disabled:opacity-45 text-white font-semibold text-sm transition-colors"
            >
              {spinning ? 'Spinning...' : totalSpinsAvailable > 0 ? 'Spin the Wheel' : 'Come Back Tomorrow'}
            </button>
          </div>

          {/* Daily Login + Treasure Chests + Weekly Challenge */}
          <div className="lg:col-span-7 space-y-4">
            {/* Weekly Coastal Challenge */}
            <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0284C7]" />
                  <h3 className="font-display text-lg font-bold text-[#0F2933]">Weekly Coastal Challenge</h3>
                </div>
                {save.weeklyChallenge.claimed ? (
                  <span className="text-xs font-semibold text-emerald-700">Weekly Claimed ✓</span>
                ) : weeklyDone ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playVictory();
                      onClaimWeeklyChallenge();
                    }}
                    className="btn-tactile px-4 py-1.5 rounded-xl bg-[#0284C7] text-white text-xs font-semibold"
                  >
                    Claim +{save.weeklyChallenge.rewardCoins} C / +{save.weeklyChallenge.rewardCredits} Cr
                  </button>
                ) : (
                  <span className="font-mono-num text-xs font-semibold text-[#0284C7]">
                    {Math.min(save.weeklyChallenge.current, save.weeklyChallenge.target)}/{save.weeklyChallenge.target}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#356370]">{save.weeklyChallenge.title}</p>
              <div className="h-2 w-full rounded-full bg-[#E6F6F8] overflow-hidden">
                <div
                  className="h-full bg-[#0284C7] transition-all duration-200"
                  style={{
                    width: `${Math.min(100, (save.weeklyChallenge.current / save.weeklyChallenge.target) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* 7-Day Daily Streak */}
            <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0D9488]" />
                  <h3 className="font-display text-lg font-bold text-[#0F2933]">Daily Login Rewards</h3>
                </div>
                {!save.dailyClaimedToday ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCrown();
                      onClaimDailyLogin(100 + save.loginStreak * 30, 20 + save.loginStreak * 5, 50);
                    }}
                    className="btn-tactile px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold"
                  >
                    Claim Day {save.loginStreak}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700">Claimed Today ✓</span>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const passed = day < save.loginStreak || (day === save.loginStreak && save.dailyClaimedToday);
                  const current = day === save.loginStreak && !save.dailyClaimedToday;
                  return (
                    <div
                      key={day}
                      className={`p-2 rounded-xl border text-center ${
                        current
                          ? 'border-[#0D9488] bg-[#E6F6F8]'
                          : passed
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-[#CBE5E8] bg-[#F4FAFB]'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-[#356370]">D{day}</div>
                      <div className="font-mono-num text-xs font-bold text-[#0F2933] mt-0.5">
                        {100 + day * 30}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Star Treasure Chests */}
            <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#D97706]" />
                  <h3 className="font-display text-lg font-bold text-[#0F2933]">Ocean Treasure Chests</h3>
                </div>
                <span className="font-mono-num text-xs font-bold text-[#D97706]">{totalStars} Stars</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CHEST_MILESTONES.map((chest) => {
                  const claimed = save.claimedChests.includes(chest.stars);
                  const ready = totalStars >= chest.stars && !claimed;
                  return (
                    <button
                      key={chest.stars}
                      type="button"
                      disabled={!ready}
                      onClick={() => {
                        soundEngine.playVictory();
                        onClaimChest(chest.stars, chest.coins, chest.credits, chest.xp);
                      }}
                      className={`btn-tactile p-3 rounded-xl border text-left transition-all ${
                        ready
                          ? 'border-[#F59E0B] bg-[#FFFBEB] hover:scale-[1.02]'
                          : claimed
                          ? 'border-emerald-200 bg-emerald-50 opacity-75'
                          : 'border-[#CBE5E8] bg-[#F4FAFB]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#0F2933]">{chest.label}</div>
                      <div className="font-mono-num text-[11px] text-[#D97706] mt-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{chest.stars} Stars</span>
                      </div>
                      <div className="text-[11px] font-semibold mt-1.5 text-[#0F766E]">
                        {claimed ? 'Opened ✓' : ready ? 'Tap to Open!' : `+${chest.coins} Coins`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Missions & Weekly Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-display text-xl font-bold text-[#0F2933]">Daily Missions</h3>
            <div className="space-y-2.5">
              {save.dailyMissions.map((m) => {
                const done = m.current >= m.target;
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-[#0F2933]">{m.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-[#D8EFF2] overflow-hidden max-w-[180px]">
                          <div
                            className="h-full bg-[#0D9488]"
                            style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono-num text-[11px] text-[#356370]">
                          {Math.min(m.current, m.target)}/{m.target}
                        </span>
                      </div>
                    </div>

                    {m.claimed ? (
                      <span className="text-xs font-semibold text-emerald-700 shrink-0">Claimed ✓</span>
                    ) : done ? (
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playCrown();
                          onClaimMission(m.id);
                        }}
                        className="btn-tactile px-3.5 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-semibold shrink-0"
                      >
                        Claim +{m.rewardCoins}
                      </button>
                    ) : (
                      <span className="font-mono-num text-xs font-semibold text-[#356370] shrink-0">
                        +{m.rewardCoins} C / +{m.rewardCredits} Cr
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              <h3 className="font-display text-xl font-bold text-[#0F2933]">Weekly Coastal Leaderboard</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.name}
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                    entry.isMe
                      ? 'border-[#0D9488] bg-[#E6F6F8] font-bold text-[#0F2933]'
                      : 'border-[#CBE5E8] bg-[#F4FAFB] text-[#164E63]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-num w-5 text-[#0F766E] font-bold">#{idx + 1}</span>
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-mono-num font-bold">{entry.pts.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-display text-xl font-bold text-[#0F2933]">Achievement Badges</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = ach.check(save);
              const claimed = save.claimedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
                    claimed
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : unlocked
                      ? 'border-[#0D9488] bg-[#E6F6F8]'
                      : 'border-[#CBE5E8] bg-[#F4FAFB]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#0F2933]">{ach.title}</div>
                    <p className="text-[11px] text-[#356370] mt-0.5">{ach.description}</p>
                  </div>
                  {claimed ? (
                    <span className="text-[11px] font-semibold text-emerald-700">Badge Earned ✓</span>
                  ) : unlocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playCrown();
                        onClaimAchievement(ach.id, ach.rewardCredits);
                      }}
                      className="btn-tactile w-full py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-semibold"
                    >
                      Claim +{ach.rewardCredits} Credits
                    </button>
                  ) : (
                    <span className="font-mono-num text-[11px] text-[#4B7480]">
                      Reward: +{ach.rewardCredits} Credits
                    </span>
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
