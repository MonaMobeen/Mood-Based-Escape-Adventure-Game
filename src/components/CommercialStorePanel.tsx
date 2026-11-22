import { useEffect, useState } from 'react';
import { CheckCircle2, Coins, Crown, PlayCircle, ShieldCheck, Sparkles, Tag, Wand2, X } from 'lucide-react';
import { trackBundleUnlock, trackRewardedAdOptIn, trackStoreView } from '../game/analytics';
import { soundEngine } from '../game/audio';
import { STORE_BUNDLES, type PlayerSaveData, type StoreBundleDef } from '../game/profile';

interface CommercialStorePanelProps {
  save: PlayerSaveData;
  onClaimRewardedBonus: (rewardType: 'coins' | 'credits' | 'hints') => void;
  onUnlockBundle: (bundle: StoreBundleDef, method: 'credits' | 'iap_preview') => void;
  onToggleShowcaseBreaks: (enabled: boolean) => void;
}

export function CommercialStorePanel({
  save,
  onClaimRewardedBonus,
  onUnlockBundle,
  onToggleShowcaseBreaks,
}: CommercialStorePanelProps) {
  const [adStatus, setAdStatus] = useState<'idle' | 'watching' | 'ready'>('idle');
  const [adSecondsLeft, setAdSecondsLeft] = useState(5);
  const [selectedReward, setSelectedReward] = useState<'coins' | 'credits' | 'hints'>('coins');
  const [toast, setToast] = useState<string | null>(null);

  // Parental Gate state for simulated Store SKU checkout
  const [gateBundle, setGateBundle] = useState<StoreBundleDef | null>(null);
  const [gateMath, setGateMath] = useState<{ a: number; b: number }>({ a: 6, b: 8 });
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    trackStoreView();
  }, []);

  useEffect(() => {
    if (adStatus !== 'watching') return;
    if (adSecondsLeft <= 0) {
      setAdStatus('ready');
      return;
    }
    const timer = window.setTimeout(() => {
      setAdSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [adStatus, adSecondsLeft]);

  const remainingAdsToday = Math.max(0, 5 - save.commercial.adsWatchedToday);

  const startRewardedPreview = (reward: 'coins' | 'credits' | 'hints') => {
    if (remainingAdsToday <= 0 || adStatus === 'watching') return;
    soundEngine.unlock();
    soundEngine.playCutePop();
    setSelectedReward(reward);
    setAdSecondsLeft(5);
    setAdStatus('watching');
    setToast(null);
  };

  const claimRewardedPreview = () => {
    trackRewardedAdOptIn();
    soundEngine.playVictory();
    onClaimRewardedBonus(selectedReward);
    setAdStatus('idle');
    setToast(
      selectedReward === 'coins'
        ? 'Rewarded Showcase Bonus: +120 Coins added!'
        : selectedReward === 'credits'
        ? 'Rewarded Showcase Bonus: +25 Credits added!'
        : 'Rewarded Showcase Bonus: +2 Search Hints added!'
    );
  };

  const openParentalGate = (bundle: StoreBundleDef) => {
    const a = 4 + Math.floor(Math.random() * 6);
    const b = 3 + Math.floor(Math.random() * 7);
    setGateMath({ a, b });
    setGateInput('');
    setGateError(null);
    setGateBundle(bundle);
  };

  const submitParentalGate = () => {
    if (!gateBundle) return;
    const parsed = parseInt(gateInput.trim(), 10);
    if (parsed !== gateMath.a * gateMath.b) {
      soundEngine.playGentleWrong();
      setGateError('Please verify the multiplication answer to continue.');
      return;
    }
    soundEngine.playCrown();
    trackBundleUnlock();
    onUnlockBundle(gateBundle, 'iap_preview');
    setToast(`Unlocked ${gateBundle.name} (Play Billing Sandbox Preview)!`);
    setGateBundle(null);
  };

  return (
    <div className="space-y-4">
      {/* Optional Rewarded Showcase Bonus */}
      <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#0284C7] flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4" />
              <span>100% Opt-In Rewarded Showcase</span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#0F2933] mt-0.5">
              Optional Sponsor Bonus Vault
            </h3>
          </div>
          <span className="font-mono-num text-xs font-semibold text-[#164E63]">
            {remainingAdsToday} / 5 Left Today
          </span>
        </div>

        <p className="text-xs text-[#356370]">
          Never forced—watch a quick 5-second coastal showcase clip whenever you want extra Coins, Credits, or Search Hints.
        </p>

        {adStatus === 'idle' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={remainingAdsToday <= 0}
              onClick={() => startRewardedPreview('coins')}
              className="btn-tactile p-3 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#E6F6F8] disabled:opacity-45 text-left flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-bold text-[#0F2933]">+120 Coins</div>
                <div className="text-[11px] text-[#356370]">5s Showcase</div>
              </div>
              <Coins className="w-4 h-4 text-[#D97706] shrink-0" />
            </button>

            <button
              type="button"
              disabled={remainingAdsToday <= 0}
              onClick={() => startRewardedPreview('credits')}
              className="btn-tactile p-3 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#E6F6F8] disabled:opacity-45 text-left flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-bold text-[#0F2933]">+25 Credits</div>
                <div className="text-[11px] text-[#356370]">5s Showcase</div>
              </div>
              <Sparkles className="w-4 h-4 text-[#0D9488] shrink-0" />
            </button>

            <button
              type="button"
              disabled={remainingAdsToday <= 0}
              onClick={() => startRewardedPreview('hints')}
              className="btn-tactile p-3 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] hover:bg-[#E6F6F8] disabled:opacity-45 text-left flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-bold text-[#0F2933]">+2 Search Hints</div>
                <div className="text-[11px] text-[#356370]">5s Showcase</div>
              </div>
              <Wand2 className="w-4 h-4 text-[#0284C7] shrink-0" />
            </button>
          </div>
        )}

        {adStatus === 'watching' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#0284C7] text-white space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Coastal Resort Showcase Preview</span>
              <span className="font-mono-num">{adSecondsLeft}s remaining</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-[#2DD4BF] transition-all duration-700"
                style={{ width: `${((5 - adSecondsLeft) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {adStatus === 'ready' && (
          <button
            type="button"
            onClick={claimRewardedPreview}
            className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Claim{' '}
              {selectedReward === 'coins'
                ? '+120 Coins'
                : selectedReward === 'credits'
                ? '+25 Credits'
                : '+2 Search Hints'}
            </span>
          </button>
        )}
      </div>

      {/* Coastal Boutique & VIP Store Packs */}
      <div className="bg-white border border-[#CBE5E8] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#0F766E] flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>Coastal Boutique & VIP Passes</span>
            </div>
            <h3 className="font-display text-xl font-bold text-[#0F2933] mt-0.5">
              Fair Packs & Ad-Free Upgrades
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {save.commercial.vipPass && (
              <span className="px-2.5 py-1 rounded-full bg-[#0F766E] text-white font-semibold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                VIP Active (+25% Coins)
              </span>
            )}
            {save.commercial.adFree && !save.commercial.vipPass && (
              <span className="px-2.5 py-1 rounded-full bg-[#0284C7] text-white font-semibold">
                Ad-Free Active
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STORE_BUNDLES.map((bundle) => {
            const owned = save.commercial.ownedBundles.includes(bundle.id);
            const canAffordCredits = save.credits >= bundle.creditsCost;
            return (
              <div
                key={bundle.id}
                className="rounded-2xl border border-[#CBE5E8] bg-[#F4FAFB] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: bundle.accent }}
                    >
                      {bundle.badge}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#0F2933]">
                      {bundle.usdDisplay}
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-[#0F2933]">{bundle.name}</h4>
                  <p className="text-xs text-[#356370] leading-relaxed">{bundle.subtitle}</p>
                </div>

                {owned ? (
                  <div className="py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
                    Unlocked ✓
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled={!canAffordCredits}
                      onClick={() => {
                        soundEngine.playCrown();
                        trackBundleUnlock();
                        onUnlockBundle(bundle, 'credits');
                        setToast(`Unlocked ${bundle.name} using ${bundle.creditsCost} Credits!`);
                      }}
                      className="btn-tactile w-full py-2 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] disabled:opacity-45 text-white text-xs font-semibold"
                    >
                      Unlock · {bundle.creditsCost} Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => openParentalGate(bundle)}
                      className="btn-tactile w-full py-2 px-3 rounded-xl bg-white border border-[#CBE5E8] hover:bg-[#E6F6F8] text-[#0F2933] text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Store Preview ({bundle.usdDisplay})</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Post-Run Showcase Breaks Toggle */}
        {!save.commercial.adFree && (
          <div className="pt-2 border-t border-[#CBE5E8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#356370]">
            <span>
              Optional Post-Run Showcase Breaks (skippable anytime, max once per 4 runs)
            </span>
            <button
              type="button"
              onClick={() => onToggleShowcaseBreaks(!save.commercial.interstitialOptIn)}
              className={`px-3 py-1.5 rounded-lg font-semibold ${
                save.commercial.interstitialOptIn
                  ? 'bg-[#0284C7] text-white'
                  : 'bg-[#E6F6F8] text-[#164E63]'
              }`}
            >
              {save.commercial.interstitialOptIn ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        )}

        {toast && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 text-center">
            {toast}
          </div>
        )}
      </div>

      {/* Parental Gate Modal */}
      {gateBundle && (
        <div className="fixed inset-0 z-50 bg-[#0F2933]/65 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-5 shadow-xl space-y-4 text-[#0F2933]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0284C7] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Parental Gate Verification</span>
              </div>
              <button
                type="button"
                onClick={() => setGateBundle(null)}
                aria-label="Close parental gate"
                className="h-8 w-8 rounded-lg bg-white border border-[#CBE5E8] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-display text-lg font-bold">Ask a Parent to Continue</h4>
              <p className="text-xs text-[#356370] mt-1">
                Confirm this sandbox preview for <span className="font-semibold text-[#0F2933]">{gateBundle.name}</span> ({gateBundle.sku}) by solving:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#CBE5E8] text-center">
              <div className="font-mono-num text-xl font-bold text-[#0F766E]">
                {gateMath.a} × {gateMath.b} = ?
              </div>
              <input
                type="number"
                inputMode="numeric"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="Enter answer"
                className="mt-2.5 w-full px-3 py-2 rounded-xl border border-[#CBE5E8] bg-[#F4FAFB] text-center font-mono-num text-sm font-bold text-[#0F2933]"
              />
            </div>

            {gateError && (
              <div className="text-xs font-semibold text-rose-700 text-center">{gateError}</div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGateBundle(null)}
                className="flex-1 py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-xs font-semibold text-[#356370]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitParentalGate}
                className="btn-tactile flex-1 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-semibold"
              >
                Verify & Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
