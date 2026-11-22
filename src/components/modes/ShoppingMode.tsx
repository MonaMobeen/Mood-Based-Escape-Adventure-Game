import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingBag, Tag } from 'lucide-react';
import { BOUTIQUE_ITEMS, type BoutiqueItemDef } from '../../game/catalog';
import { soundEngine } from '../../game/audio';
import type { GameLevelDef } from '../../game/levels';
import type { PlayerSaveData } from '../../game/profile';

interface ShoppingModeProps {
  save: PlayerSaveData;
  levelDef?: GameLevelDef;
  onExit: () => void;
  onUnlockBoutiqueItem: (item: BoutiqueItemDef, finalPrice: number) => void;
  onComplete: (result: {
    won: boolean;
    stars: number;
    coinsEarned: number;
    creditsEarned: number;
    xpEarned: number;
  }) => void;
}

export function ShoppingMode({
  save,
  levelDef,
  onExit,
  onUnlockBoutiqueItem,
  onComplete,
}: ShoppingModeProps) {
  const budgetCap = levelDef?.budgetCap ?? 480;
  const requiredTags = useMemo<Array<'Beach' | 'Pop' | 'Gala' | 'Cozy'>>(() => {
    const seed = levelDef?.levelNumber ?? save.shoppingTripsCompleted;
    const sets: Array<Array<'Beach' | 'Pop' | 'Gala' | 'Cozy'>> = [
      ['Beach', 'Pop', 'Gala'],
      ['Gala', 'Cozy', 'Beach'],
      ['Pop', 'Cozy', 'Gala'],
    ];
    return sets[seed % sets.length];
  }, [levelDef?.levelNumber, save.shoppingTripsCompleted]);

  // Apply flash sale discount on 3 items
  const pricedCatalog = useMemo(() => {
    return BOUTIQUE_ITEMS.map((item, idx) => {
      const onSale = (idx + (levelDef?.levelNumber ?? 1)) % 3 === 0;
      const effectivePrice = onSale ? Math.round(item.price * 0.75) : item.price;
      return { ...item, onSale, effectivePrice };
    });
  }, [levelDef?.levelNumber]);

  const [cartIds, setCartIds] = useState<string[]>([]);
  const [checkedOut, setCheckedOut] = useState<{
    won: boolean;
    spent: number;
    styleTotal: number;
    unlockedNow: number;
    skippedDueToCoins: number;
  } | null>(null);

  const cartItems = pricedCatalog.filter((it) => cartIds.includes(it.id));
  const cartTotal = cartItems.reduce((sum, it) => sum + it.effectivePrice, 0);
  const cartStyle = cartItems.reduce((sum, it) => sum + it.styleScore, 0);

  const coveredTags = requiredTags.filter((tag) => cartItems.some((it) => it.tag === tag));
  const canAffordWallet = save.coins >= cartTotal;

  const toggleCart = (id: string) => {
    if (checkedOut) return;
    soundEngine.playPickup();
    setCartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || checkedOut) return;
    const withinBudget = cartTotal <= budgetCap;
    const allTagsMet = coveredTags.length === requiredTags.length;
    const won = withinBudget && allTagsMet;

    let unlockedNow = 0;
    let skippedDueToCoins = 0;

    if (won) {
      soundEngine.playStageClear();
      let remainingWallet = save.coins;
      for (const item of cartItems) {
        if (!save.unlockedBoutiqueIds.includes(item.id)) {
          if (remainingWallet >= item.effectivePrice) {
            remainingWallet -= item.effectivePrice;
            unlockedNow++;
            onUnlockBoutiqueItem(item, item.effectivePrice);
          } else {
            skippedDueToCoins++;
          }
        }
      }
      const stars = budgetCap - cartTotal >= 75 ? 3 : budgetCap - cartTotal >= 25 ? 2 : 1;
      onComplete({
        won: true,
        stars,
        coinsEarned: 110 + stars * 30,
        creditsEarned: 22 + stars * 5,
        xpEarned: 65 + stars * 15,
      });
    } else {
      soundEngine.playWrongPlace();
      onComplete({
        won: false,
        stars: 0,
        coinsEarned: 25,
        creditsEarned: 5,
        xpEarned: 15,
      });
    }

    setCheckedOut({
      won,
      spent: cartTotal,
      styleTotal: cartStyle,
      unlockedNow,
      skippedDueToCoins,
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F4FAFB] pb-10 pt-4 sm:pt-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header & Budget Bar */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onExit}
                className="btn-tactile h-11 w-11 rounded-xl bg-[#E6F6F8] text-[#0F2933] flex items-center justify-center"
                aria-label="Exit Shopping Adventure"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0F2933]">
                  Coastal Shopping Adventure
                </h2>
                <p className="text-xs text-[#356370]">
                  Complete the 3-tag shopping list while staying under the {budgetCap} Coin budget cap!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#356370]">Cart / Budget</div>
                <div
                  className={`font-mono-num text-base font-bold ${
                    cartTotal > budgetCap ? 'text-rose-600' : 'text-[#0F766E]'
                  }`}
                >
                  {cartTotal} / {budgetCap}
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#CBE5E8]">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#164E63]">Shopping List:</span>
              {requiredTags.map((tag) => {
                const met = coveredTags.includes(tag);
                return (
                  <span
                    key={tag}
                    className={`font-semibold ${met ? 'text-emerald-700' : 'text-[#356370]'}`}
                  >
                    {met ? '✓ ' : '○ '}
                    {tag}
                  </span>
                );
              })}
            </div>
            <div className="text-xs font-medium text-[#164E63]">
              Your Coins: <span className="font-mono-num font-bold">{save.coins}</span>
            </div>
          </div>
        </div>

        {/* Boutique Shelves */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pricedCatalog.map((item) => {
            const inCart = cartIds.includes(item.id);
            const owned = save.unlockedBoutiqueIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCart(item.id)}
                className={`btn-tactile p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                  inCart
                    ? 'border-[#0D9488] bg-[#E6F6F8]'
                    : 'border-[#CBE5E8] bg-white hover:bg-[#F4FAFB]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-[#356370]">
                      {item.tag} · {item.slot}
                    </div>
                    <h3 className="text-sm font-bold text-[#0F2933] mt-0.5">{item.name}</h3>
                  </div>
                  <span
                    className="w-6 h-6 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: item.color }}
                  />
                </div>

                <p className="text-xs text-[#356370]">{item.description}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#CBE5E8]">
                  <div className="flex items-center gap-1.5">
                    {item.onSale && <Tag className="w-3.5 h-3.5 text-[#0284C7]" />}
                    <span className="font-mono-num text-sm font-bold text-[#0F766E]">
                      {item.effectivePrice} Coins
                    </span>
                    {item.onSale && (
                      <span className="font-mono-num text-[11px] line-through text-[#6B939D]">
                        {item.price}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#0F2933]">
                    {inCart ? 'In Bag ✓' : owned ? 'Owned (+Style)' : 'Add'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sticky Checkout Bar */}
        <div className="bg-white border border-[#CBE5E8] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="text-xs sm:text-sm text-[#164E63]">
            <span className="font-semibold text-[#0F2933]">{cartItems.length} items</span> · Style Score{' '}
            <span className="font-mono-num font-bold text-[#0F766E]">{cartStyle}</span>
            {!canAffordWallet && (
              <span className="text-rose-600 font-semibold ml-2">
                (Tip: You can still finish the budget mission even if wallet coins are low—owned items stay free!)
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={cartItems.length === 0 || !!checkedOut}
            onClick={handleCheckout}
            className="btn-tactile px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] disabled:opacity-45 text-white font-semibold text-sm flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Complete Checkout</span>
          </button>
        </div>
      </div>

      {checkedOut && (
        <div className="fixed inset-0 z-40 bg-[#0F2933]/55 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 space-y-4 text-center">
            <CheckCircle2 className={`w-10 h-10 mx-auto ${checkedOut.won ? 'text-emerald-600' : 'text-rose-500'}`} />
            <h3 className="font-display text-3xl font-bold text-[#0F2933]">
              {checkedOut.won ? 'Smart Shopper!' : 'Missed the Brief!'}
            </h3>
            <p className="text-sm text-[#356370]">
              {checkedOut.won
                ? checkedOut.unlockedNow > 0
                  ? `You stayed within budget (${checkedOut.spent}/${budgetCap} Coins) and unlocked ${checkedOut.unlockedNow} new boutique piece${checkedOut.unlockedNow > 1 ? 's' : ''}!`
                  : checkedOut.skippedDueToCoins > 0
                  ? `Budget brief passed (${checkedOut.spent}/${budgetCap} Coins)! Earn a few more wallet Coins to permanently own the unpurchased pieces.`
                  : `Smart styling! You stayed within budget (${checkedOut.spent}/${budgetCap} Coins) with your wardrobe collection.`
                : `Make sure you stay under ${budgetCap} Coins and include all 3 required style tags (${requiredTags.join(', ')}).`}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setCartIds([]);
                  setCheckedOut(null);
                }}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
              >
                Shop Again
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
