export const ANALYTICS_STORAGE_KEY = 'barbie_coastal_analytics_v1';

export interface AnalyticsState {
  sessionsCount: number;
  modeLaunches: Record<string, number>;
  levelAttempts: number;
  levelWins: number;
  levelFails: number;
  mistakesByMode: Record<string, number>;
  rewardedAdOptIns: number;
  storeViews: number;
  bundleUnlocks: number;
  runtimeErrors: number;
  lastUpdated: number;
}

const DEFAULT_ANALYTICS: AnalyticsState = {
  sessionsCount: 0,
  modeLaunches: {},
  levelAttempts: 0,
  levelWins: 0,
  levelFails: 0,
  mistakesByMode: {},
  rewardedAdOptIns: 0,
  storeViews: 0,
  bundleUnlocks: 0,
  runtimeErrors: 0,
  lastUpdated: Date.now(),
};

export function loadAnalytics(): AnalyticsState {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ANALYTICS };
    const parsed = JSON.parse(raw) as Partial<AnalyticsState>;
    return {
      ...DEFAULT_ANALYTICS,
      ...parsed,
      modeLaunches: { ...(parsed.modeLaunches || {}) },
      mistakesByMode: { ...(parsed.mistakesByMode || {}) },
    };
  } catch {
    return { ...DEFAULT_ANALYTICS };
  }
}

function saveAnalytics(state: AnalyticsState): void {
  try {
    state.lastUpdated = Date.now();
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function trackSessionStart(): void {
  const s = loadAnalytics();
  s.sessionsCount += 1;
  saveAnalytics(s);
}

export function trackModeLaunch(mode: string): void {
  const s = loadAnalytics();
  s.modeLaunches[mode] = (s.modeLaunches[mode] || 0) + 1;
  saveAnalytics(s);
}

export function trackLevelOutcome(mode: string, won: boolean, mistakesCount = 0): void {
  const s = loadAnalytics();
  s.levelAttempts += 1;
  if (won) s.levelWins += 1;
  else s.levelFails += 1;
  if (mistakesCount > 0) {
    s.mistakesByMode[mode] = (s.mistakesByMode[mode] || 0) + mistakesCount;
  }
  saveAnalytics(s);
}

export function trackRewardedAdOptIn(): void {
  const s = loadAnalytics();
  s.rewardedAdOptIns += 1;
  saveAnalytics(s);
}

export function trackStoreView(): void {
  const s = loadAnalytics();
  s.storeViews += 1;
  saveAnalytics(s);
}

export function trackBundleUnlock(): void {
  const s = loadAnalytics();
  s.bundleUnlocks += 1;
  saveAnalytics(s);
}

export function trackRuntimeError(): void {
  const s = loadAnalytics();
  s.runtimeErrors += 1;
  saveAnalytics(s);
}

export function resetAnalytics(): void {
  saveAnalytics({ ...DEFAULT_ANALYTICS, lastUpdated: Date.now() });
}

export function getAnalyticsSummary(state: AnalyticsState): {
  winRatePct: number;
  topMode: string;
  bottleneckMode: string;
} {
  const winRatePct =
    state.levelAttempts > 0 ? Math.round((state.levelWins / state.levelAttempts) * 100) : 100;

  let topMode = 'None yet';
  let topCount = 0;
  for (const [m, count] of Object.entries(state.modeLaunches)) {
    if (count > topCount) {
      topCount = count;
      topMode = m;
    }
  }

  let bottleneckMode = 'Balanced';
  let worstMistakes = 0;
  for (const [m, mCount] of Object.entries(state.mistakesByMode)) {
    if (mCount > worstMistakes) {
      worstMistakes = mCount;
      bottleneckMode = m;
    }
  }

  return { winRatePct, topMode, bottleneckMode };
}
