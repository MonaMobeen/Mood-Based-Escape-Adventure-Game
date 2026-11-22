import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Compass,
  Crown,
  Gift,
  Heart,
  Home,
  Map as MapIcon,
  Settings,
  Sparkles,
  Star,
} from 'lucide-react';
import { GameHud } from './components/GameHud';
import { GameModals } from './components/GameModals';
import { LevelMapView } from './components/LevelMapView';
import { ModesHub, type PlayableModeRoute } from './components/ModesHub';
import { MoodWelcomeView } from './components/MoodWelcomeView';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { RewardsHub } from './components/RewardsHub';
import { TitleScreen } from './components/TitleScreen';
import { DreamRoomMode } from './components/modes/DreamRoomMode';
import { FashionStudioMode } from './components/modes/FashionStudioMode';
import { MakeoverMode } from './components/modes/MakeoverMode';
import { MessyRoomSearchMode } from './components/modes/MessyRoomSearchMode';
import { MysteryMode } from './components/modes/MysteryMode';
import { PeacefulWorldMode } from './components/modes/PeacefulWorldMode';
import { ShoppingMode } from './components/modes/ShoppingMode';
import { SmartOrganizerMode } from './components/modes/SmartOrganizerMode';
import {
  RoomSearchTutorialModal,
  RunningTutorialModal,
} from './components/tutorials/InteractiveTutorials';
import {
  trackLevelOutcome,
  trackModeLaunch,
  trackRuntimeError,
  trackSessionStart,
} from './game/analytics';
import { soundEngine } from './game/audio';
import { DEFAULT_STYLE, STAGES } from './game/constants';
import { RunwayGameEngine } from './game/engine';
import type { SearchRoomLocationId, SearchSubMode } from './game/hiddenObjects';
import type { GameLevelDef } from './game/levels';
import {
  createInitialSave,
  getPlayerLevelFromXp,
  getTodayKey,
  getWeekKey,
  loadPlayerSave,
  restoreBackupSave,
  savePlayerData,
  type PlayerSaveData,
  type StoreBundleDef,
} from './game/profile';
import type { AdventureExperienceMode, GameState, HudSnapshot } from './game/types';

type HubTab = 'home' | 'map' | 'modes' | 'rewards';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  bestScore: 0,
  distance: 0,
  stageDistance: 0,
  stageTargetDistance: STAGES[0].targetDistance,
  stageIndex: 0,
  stageName: STAGES[0].name,
  endlessMode: false,
  adventureMode: 'adventure',
  hearts: 3,
  maxHearts: 3,
  combo: 0,
  comboTimerRatio: 0,
  twirlReadyRatio: 1,
  glamFeverTimer: 0,
  activeOutfit: DEFAULT_STYLE.outfit,
  diamondsCollected: 0,
  crownsCollected: 0,
  obstaclesCleared: 0,
  perfectCount: 0,
  secondWindUsed: false,
  runMission: {
    id: 'gems_12',
    label: 'Collect 12 Aqua Gems',
    kind: 'diamonds',
    target: 12,
    progress: 0,
    completed: false,
  },
  recommendedAction: 'jump',
  actionWindowActive: false,
  isStumbling: false,
};

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(): void {
    trackRuntimeError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#F4FAFB] flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-white border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4 shadow-md">
            <h1 className="font-display text-2xl font-bold text-[#0F2933]">
              Coastal Studio Reset Needed
            </h1>
            <p className="text-xs text-[#356370]">
              Something unexpected paused the scene. Your progress and coins are safely saved.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RunwayGameEngine | null>(null);
  const canvasSwipeRef = useRef<{ x: number; y: number } | null>(null);

  const [save, setSave] = useState<PlayerSaveData>(() => loadPlayerSave());
  const [hubTab, setHubTab] = useState<HubTab>('home');
  const [activeMode, setActiveMode] = useState<PlayableModeRoute | null>(null);
  const [activeLevel, setActiveLevel] = useState<GameLevelDef | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const [moodWelcomeOpen, setMoodWelcomeOpen] = useState(true);
  const [activeTutorial, setActiveTutorial] = useState<'room_search' | 'running' | null>(null);
  const [pendingLaunchAfterTutorial, setPendingLaunchAfterTutorial] = useState<{
    mode: PlayableModeRoute;
    levelDef?: GameLevelDef;
    adventureMode?: AdventureExperienceMode;
    stageIndex?: number;
  } | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    bestScore: loadPlayerSave().bestRunScore,
  }));
  const [lastRunReward, setLastRunReward] = useState<{
    coins: number;
    credits: number;
    xp: number;
  } | null>(null);
  const [showcaseOpen, setShowcaseOpen] = useState(false);

  const gameStateRef = useRef<GameState>(gameState);
  const activeModeRef = useRef<PlayableModeRoute | null>(activeMode);
  const activeLevelRef = useRef<GameLevelDef | undefined>(activeLevel);
  const hudRef = useRef<HudSnapshot>(hud);
  const saveRef = useRef<PlayerSaveData>(save);
  const runRewardGrantedRef = useRef(false);

  useEffect(() => {
    trackSessionStart();
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);
  useEffect(() => {
    activeLevelRef.current = activeLevel;
  }, [activeLevel]);
  useEffect(() => {
    hudRef.current = hud;
  }, [hud]);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Persist save automatically whenever state changes
  useEffect(() => {
    savePlayerData(save);
    soundEngine.setMuted(!save.settings.sfxEnabled);
    soundEngine.setMusicConfig(save.settings.musicEnabled, save.settings.musicVolume);
    const activeAmbience =
      activeMode === 'peaceful_garden' ||
      activeMode === 'peaceful_world' ||
      activeMode === 'dream_island'
        ? save.peacefulWorld?.weather === 'rain'
          ? 'rain'
          : 'ocean'
        : save.settings.ambienceMode ?? 'ocean';
    soundEngine.setAmbienceConfig(
      save.settings.ambienceEnabled,
      save.settings.ambienceVolume,
      activeAmbience
    );
  }, [save, activeMode]);

  const updateMissionProgress = useCallback(
    (missionId: string, delta: number) => {
      setSave((prev) => ({
        ...prev,
        dailyMissions: prev.dailyMissions.map((m) =>
          m.id === missionId ? { ...m, current: m.current + delta } : m
        ),
      }));
    },
    []
  );

  const grantLevelCompletion = useCallback(
    (
      levelDef: GameLevelDef | undefined,
      won: boolean,
      stars: number,
      coins: number,
      credits: number,
      xp: number,
      modeTag?: string,
      mistakesCount = 0
    ) => {
      trackLevelOutcome(modeTag ?? activeModeRef.current ?? 'level', won, mistakesCount);
      setSave((prev) => {
        const nextStars = { ...prev.levelStars };
        let nextUnlocked = prev.highestUnlockedLevel;
        if (levelDef && won && stars > 0) {
          nextStars[levelDef.levelNumber] = Math.max(nextStars[levelDef.levelNumber] || 0, stars);
          if (levelDef.levelNumber >= nextUnlocked && nextUnlocked < 240) {
            nextUnlocked = levelDef.levelNumber + 1;
          }
        }
        const earnedCoins = won && prev.commercial.vipPass ? Math.round(coins * 1.25) : coins;
        const currentWeekKey = getWeekKey();
        const weeklyBase =
          prev.weeklyChallenge.weekKey === currentWeekKey
            ? prev.weeklyChallenge
            : { ...prev.weeklyChallenge, weekKey: currentWeekKey, current: 0, claimed: false };

        return {
          ...prev,
          coins: prev.coins + earnedCoins,
          credits: prev.credits + credits,
          xp: prev.xp + xp,
          levelStars: nextStars,
          highestUnlockedLevel: nextUnlocked,
          weeklyChallenge: won
            ? { ...weeklyBase, current: weeklyBase.current + 1 }
            : weeklyBase,
          seasonalEvent: {
            ...prev.seasonalEvent,
            tokens: prev.seasonalEvent.tokens + (won ? 8 : 3),
          },
        };
      });
    },
    []
  );

  // Grant rewards cleanly when Running Adventure finishes a stage/run
  const handleRunStateTransition = useCallback(
    (next: GameState) => {
      setGameState(next);
      if (
        (next === 'STAGE_CLEAR' || next === 'VICTORY' || next === 'GAME_OVER') &&
        !runRewardGrantedRef.current
      ) {
        runRewardGrantedRef.current = true;
        const snap = hudRef.current;
        const baseCoins = Math.max(20, Math.round(snap.diamondsCollected * 4 + snap.crownsCollected * 15 + snap.distance * 0.12));
        const vipActive = saveRef.current.commercial.vipPass;
        const displayCoins = vipActive ? Math.round(baseCoins * 1.25) : baseCoins;
        const credits = Math.max(6, Math.round(snap.crownsCollected * 3 + (next === 'VICTORY' ? 35 : next === 'STAGE_CLEAR' ? 18 : 6)));
        const xp = Math.max(18, Math.round(snap.distance * 0.1 + (next === 'STAGE_CLEAR' || next === 'VICTORY' ? 40 : 12)));

        setLastRunReward({ coins: displayCoins, credits, xp });

        const wonRun = next === 'STAGE_CLEAR' || next === 'VICTORY';
        trackLevelOutcome('running', wonRun, next === 'GAME_OVER' ? 1 : 0);

        const lvl = activeLevelRef.current;
        const wonLevel =
          lvl &&
          (wonRun ||
            snap.distance >= lvl.targetDistance ||
            snap.score >= lvl.targetScore);

        const willShowShowcase =
          !saveRef.current.settings.noPressureMode &&
          !saveRef.current.commercial.adFree &&
          saveRef.current.commercial.interstitialOptIn &&
          saveRef.current.commercial.runsSinceShowcase + 1 >= 4;

        if (willShowShowcase) {
          setShowcaseOpen(true);
        }

        setSave((prev) => {
          const nextStars = { ...prev.levelStars };
          let nextUnlocked = prev.highestUnlockedLevel;
          if (lvl && wonLevel) {
            const stars = snap.score >= lvl.targetScore * 1.35 ? 3 : snap.score >= lvl.targetScore ? 2 : 1;
            nextStars[lvl.levelNumber] = Math.max(nextStars[lvl.levelNumber] || 0, stars);
            if (lvl.levelNumber >= nextUnlocked && nextUnlocked < 240) {
              nextUnlocked = lvl.levelNumber + 1;
            }
          }
          const earnedCoins = prev.commercial.vipPass ? Math.round(baseCoins * 1.25) : baseCoins;
          const nextRunsSince = prev.commercial.runsSinceShowcase + 1;
          const resetShowcaseCounter =
            !prev.commercial.adFree && prev.commercial.interstitialOptIn && nextRunsSince >= 4;
          const currentWeekKey = getWeekKey();
          const weeklyBase =
            prev.weeklyChallenge.weekKey === currentWeekKey
              ? prev.weeklyChallenge
              : { ...prev.weeklyChallenge, weekKey: currentWeekKey, current: 0, claimed: false };

          return {
            ...prev,
            coins: prev.coins + earnedCoins,
            credits: prev.credits + credits,
            xp: prev.xp + xp,
            bestRunScore: Math.max(prev.bestRunScore, snap.bestScore, snap.score),
            runsCompleted: prev.runsCompleted + 1,
            totalRunDistance: prev.totalRunDistance + snap.distance,
            levelStars: nextStars,
            highestUnlockedLevel: nextUnlocked,
            weeklyChallenge:
              wonRun || wonLevel
                ? { ...weeklyBase, current: weeklyBase.current + 1 }
                : weeklyBase,
            seasonalEvent: {
              ...prev.seasonalEvent,
              tokens: prev.seasonalEvent.tokens + (wonRun ? 8 : 3),
            },
            commercial: {
              ...prev.commercial,
              runsSinceShowcase: resetShowcaseCounter ? 0 : nextRunsSince,
            },
            dailyMissions: prev.dailyMissions.map((m) =>
              m.id === 'run_400' ? { ...m, current: m.current + snap.distance } : m
            ),
          };
        });
      }
    },
    []
  );

  // Mount isolated 60fps canvas simulation once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new RunwayGameEngine(canvas, save.style, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onStateChange: handleRunStateTransition,
    });
    engineRef.current = engine;
    engine.startLoop();

    const handleResize = () => engine.resize();
    const handleBlur = () => engine.clearHeldKeys();

    window.addEventListener('resize', handleResize);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', handleBlur);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync character customization & boutique accessories/bags to engine
  useEffect(() => {
    engineRef.current?.setStyle(save.style);
  }, [save.style]);

  useEffect(() => {
    engineRef.current?.setEquipments(
      save.equippedAccessory,
      save.equippedBag,
      save.equippedShoes ?? null
    );
  }, [save.equippedAccessory, save.equippedBag, save.equippedShoes]);

  const handleStartRun = useCallback(
    (modeOverride?: AdventureExperienceMode, stageIndex = 0) => {
      runRewardGrantedRef.current = false;
      setLastRunReward(null);
      setActiveMode('running');
      const resolvedMode: AdventureExperienceMode =
        modeOverride ?? (saveRef.current.settings.noPressureMode ? 'relaxed' : 'adventure');
      engineRef.current?.startNewRun(resolvedMode, stageIndex);
    },
    []
  );

  const handlePause = useCallback(() => {
    if (gameStateRef.current === 'PLAYING') {
      engineRef.current?.setGameState('PAUSED');
      setGameState('PAUSED');
    } else if (gameStateRef.current === 'PAUSED') {
      engineRef.current?.setGameState('PLAYING');
      setGameState('PLAYING');
    }
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setGameState('PLAYING');
    setGameState('PLAYING');
  }, []);

  const handleNextStage = useCallback(() => {
    runRewardGrantedRef.current = false;
    setLastRunReward(null);
    engineRef.current?.advanceToNextStage();
  }, []);

  const handleEndlessEncore = useCallback(() => {
    runRewardGrantedRef.current = false;
    setLastRunReward(null);
    engineRef.current?.startEndlessEncore();
  }, []);

  const handleSecondWind = useCallback(() => {
    if (saveRef.current.coins < 40) return;
    if (engineRef.current?.continueSecondWind()) {
      runRewardGrantedRef.current = false;
      setLastRunReward(null);
      setSave((prev) => ({ ...prev, coins: Math.max(0, prev.coins - 40) }));
    }
  }, []);

  const handleExitToHub = useCallback(() => {
    engineRef.current?.setGameState('TITLE_MENU');
    setGameState('TITLE_MENU');
    setActiveMode(null);
    setActiveLevel(undefined);
  }, []);

  const handleToggleMute = useCallback(() => {
    setSave((prev) => ({
      ...prev,
      settings: { ...prev.settings, sfxEnabled: !prev.settings.sfxEnabled },
    }));
  }, []);

  const isSearchModeRoute = (mode: PlayableModeRoute): boolean =>
    mode === 'messy_room' ||
    mode === 'closet_hunt' ||
    mode === 'jewelry_hunt' ||
    mode === 'makeup_mystery' ||
    mode === 'room_organize' ||
    mode === 'memory_challenge' ||
    mode === 'time_challenge';

  const executeLaunchImmediate = useCallback(
    (
      mode: PlayableModeRoute,
      levelDef?: GameLevelDef,
      adventureMode?: AdventureExperienceMode,
      stageIndex = 0
    ) => {
      trackModeLaunch(mode);
      setMoodWelcomeOpen(false);
      setActiveLevel(levelDef);
      if (mode === 'running') {
        handleStartRun(adventureMode, stageIndex);
      } else {
        setActiveMode(mode);
      }
    },
    [handleStartRun]
  );

  const handleLaunchMode = useCallback(
    (
      mode: PlayableModeRoute,
      levelDef?: GameLevelDef,
      adventureMode?: AdventureExperienceMode,
      stageIndex = 0
    ) => {
      soundEngine.unlock();
      if (isSearchModeRoute(mode) && !save.tutorialsCompleted.roomSearch) {
        setPendingLaunchAfterTutorial({ mode, levelDef, adventureMode, stageIndex });
        setActiveTutorial('room_search');
        return;
      }
      if (mode === 'running' && !save.tutorialsCompleted.running) {
        setPendingLaunchAfterTutorial({ mode, levelDef, adventureMode, stageIndex });
        setActiveTutorial('running');
        return;
      }
      executeLaunchImmediate(mode, levelDef, adventureMode, stageIndex);
    },
    [executeLaunchImmediate, save.tutorialsCompleted.roomSearch, save.tutorialsCompleted.running]
  );

  // Global keyboard shortcuts & gameplay input routing for Running Adventure
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (profileOpen || activeTutorial) return;
      const state = gameStateRef.current;
      const mode = activeModeRef.current;

      if (e.code === 'KeyM' && document.activeElement?.tagName !== 'INPUT') {
        handleToggleMute();
        return;
      }

      if (mode === null && hubTab === 'home' && state === 'TITLE_MENU') {
        if (e.code === 'Enter' || e.code === 'Space') {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== 'BUTTON' && activeTag !== 'INPUT') {
            e.preventDefault();
            handleLaunchMode('running');
          }
        }
        return;
      }

      if (mode === 'running') {
        if (state === 'PLAYING') {
          if (e.code === 'Escape' || e.code === 'KeyP') {
            e.preventDefault();
            handlePause();
            return;
          }
          if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
          }
          engineRef.current?.handleKeyDown(e.code);
          return;
        }
        if (state === 'PAUSED' && (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Space')) {
          e.preventDefault();
          handleResume();
          return;
        }
        if (state === 'STAGE_CLEAR' && (e.code === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          handleNextStage();
          return;
        }
        if ((state === 'GAME_OVER' || state === 'VICTORY') && (e.code === 'Enter' || e.code === 'Space')) {
          e.preventDefault();
          handleStartRun();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTutorial, handleLaunchMode, handleNextStage, handlePause, handleResume, handleStartRun, handleToggleMute, hubTab, profileOpen]);

  const isRunningActive = activeMode === 'running';
  const showHubChrome = activeMode === null;
  const levelInfo = getPlayerLevelFromXp(save.xp);
  const muted = !save.settings.sfxEnabled;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#F4FAFB]">
      {/* Isolated 60fps Canvas Container (always mounted for zero-latency Running Adventure) */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          onPointerDown={(e) => {
            canvasSwipeRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const start = canvasSwipeRef.current;
            canvasSwipeRef.current = null;
            if (!isRunningActive || gameStateRef.current !== 'PLAYING') return;
            if (!start) {
              engineRef.current?.performAction('jump');
              return;
            }
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.abs(dy) > 32 && Math.abs(dy) > Math.abs(dx)) {
              if (dy < 0) {
                engineRef.current?.performAction('jump');
              } else {
                engineRef.current?.performAction('slide');
              }
            } else if (dx > 40) {
              engineRef.current?.performAction('roll');
            } else {
              engineRef.current?.performAction('jump');
            }
          }}
          onPointerCancel={() => {
            canvasSwipeRef.current = null;
          }}
        />
      </div>

      {/* Compact Top Mobile/Desktop Status Bar (Hub Views Only, 48px height) */}
      {showHubChrome && (
        <header className="fixed top-0 inset-x-0 z-30 h-12 px-3 sm:px-6 bg-[#F4FAFB]/95 border-b border-[#CBE5E8] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playCutePop();
              setProfileOpen(true);
            }}
            className="btn-tactile flex items-center gap-2 min-w-0 py-0.5 pr-2 rounded-xl hover:bg-[#E6F6F8] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shrink-0">
              {save.avatarBadge === 'crown' && <Crown className="w-4 h-4" />}
              {save.avatarBadge === 'heart' && <Heart className="w-4 h-4" />}
              {save.avatarBadge === 'star' && <Star className="w-4 h-4" />}
              {save.avatarBadge === 'butterfly' && <Sparkles className="w-4 h-4" />}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-[#0F2933] truncate max-w-[115px] sm:max-w-[165px] flex items-center gap-1.5">
                <span className="truncate">{save.playerName}</span>
                {save.commercial.vipPass && (
                  <span className="text-[10px] font-extrabold text-[#0284C7] shrink-0">
                    VIP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#356370]">
                <span>Lv.{levelInfo.level}</span>
                <div className="w-10 h-1.5 rounded-full bg-[#D8EFF2] overflow-hidden">
                  <div
                    className="h-full bg-[#0D9488]"
                    style={{
                      width: `${Math.min(100, (levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playCutePop();
                setSave((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    noPressureMode: !prev.settings.noPressureMode,
                  },
                }));
              }}
              className={`btn-tactile h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-colors whitespace-nowrap ${
                save.settings.noPressureMode
                  ? 'bg-[#059669] border-[#059669] text-white'
                  : 'bg-white border-[#CBE5E8] text-[#164E63] hover:bg-[#ECFDF5]'
              }`}
              title="Toggle Global No Pressure Mode (pauses timers & enables Relaxed Exploration)"
            >
              {save.settings.noPressureMode ? 'No Pressure: On' : 'No Pressure'}
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2933]">
              <span>
                <span className="font-mono-num font-bold text-[#D97706]">
                  {save.coins.toLocaleString()}
                </span>{' '}
                Coins
              </span>
              <span aria-hidden="true" className="text-[#94C4CA] hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                <span className="font-mono-num font-bold text-[#0F766E]">
                  {save.credits.toLocaleString()}
                </span>{' '}
                Cr
              </span>
            </div>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile and settings"
              className="btn-tactile h-10 w-10 rounded-xl bg-[#E6F6F8] border border-[#CBE5E8] text-[#0F2933] flex items-center justify-center hover:bg-[#D8EFF2]"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Optional Skippable Mood Welcome Experience */}
      {showHubChrome && moodWelcomeOpen && !profileOpen && !activeTutorial && (
        <MoodWelcomeView
          onLaunchRecommended={(targetMode) => {
            setMoodWelcomeOpen(false);
            handleLaunchMode(targetMode);
          }}
          onExploreWorlds={() => {
            setMoodWelcomeOpen(false);
            setHubTab('home');
          }}
          onDismiss={() => setMoodWelcomeOpen(false)}
        />
      )}

      {/* Hub Screens */}
      {showHubChrome && (
        <div key={hubTab} className="relative z-20 w-full h-full view-enter">
          {hubTab === 'home' && (
            <TitleScreen
              style={save.style}
              bestScore={Math.max(save.bestRunScore, hud.bestScore)}
              muted={muted}
              highestLevel={save.highestUnlockedLevel}
              flowersCollected={save.peacefulWorld?.flowersCollected ?? 0}
              noPressureMode={Boolean(save.settings.noPressureMode)}
              onChangeStyle={(nextStyle) => setSave((prev) => ({ ...prev, style: nextStyle }))}
              onStart={(advMode, stageIdx) =>
                handleLaunchMode('running', undefined, advMode, stageIdx)
              }
              onOpenPeaceful={() => handleLaunchMode('peaceful_world')}
              onOpenMessySearch={() => handleLaunchMode('messy_room')}
              onOpenDreamRoom={() => handleLaunchMode('dream_room')}
              onOpenFashionStudio={() => handleLaunchMode('fashion_studio')}
              onOpenMoodGuide={() => setMoodWelcomeOpen(true)}
              onOpenMap={() => setHubTab('map')}
              onToggleMute={handleToggleMute}
            />
          )}

          {hubTab === 'map' && (
            <LevelMapView
              save={save}
              onLaunchLevel={(lvl) => handleLaunchMode(lvl.mode, lvl)}
            />
          )}

          {hubTab === 'modes' && (
            <ModesHub onSelectMode={(mode) => handleLaunchMode(mode)} />
          )}

          {hubTab === 'rewards' && (
            <RewardsHub
              save={save}
              onClaimDailyLogin={(coins, credits, xp) =>
                setSave((prev) => ({
                  ...prev,
                  coins: prev.coins + coins,
                  credits: prev.credits + credits,
                  xp: prev.xp + xp,
                  dailyClaimedToday: true,
                  lastLoginDate: getTodayKey(),
                }))
              }
              onSpinReward={(coins, credits, xp, usedBonus) =>
                setSave((prev) => ({
                  ...prev,
                  coins: prev.coins + coins,
                  credits: prev.credits + credits,
                  xp: prev.xp + xp,
                  lastSpinDate: getTodayKey(),
                  bonusSpins: usedBonus ? Math.max(0, prev.bonusSpins - 1) : prev.bonusSpins,
                }))
              }
              onClaimChest={(starsThreshold, coins, credits, xp) =>
                setSave((prev) => ({
                  ...prev,
                  coins: prev.coins + coins,
                  credits: prev.credits + credits,
                  xp: prev.xp + xp,
                  claimedChests: [...prev.claimedChests, starsThreshold],
                }))
              }
              onClaimMission={(missionId) =>
                setSave((prev) => {
                  const target = prev.dailyMissions.find((m) => m.id === missionId);
                  if (!target || target.claimed) return prev;
                  return {
                    ...prev,
                    coins: prev.coins + target.rewardCoins,
                    credits: prev.credits + target.rewardCredits,
                    xp: prev.xp + 40,
                    dailyMissions: prev.dailyMissions.map((m) =>
                      m.id === missionId ? { ...m, claimed: true } : m
                    ),
                  };
                })
              }
              onClaimWeeklyChallenge={() =>
                setSave((prev) => {
                  if (prev.weeklyChallenge.claimed || prev.weeklyChallenge.current < prev.weeklyChallenge.target) {
                    return prev;
                  }
                  return {
                    ...prev,
                    coins: prev.coins + prev.weeklyChallenge.rewardCoins,
                    credits: prev.credits + prev.weeklyChallenge.rewardCredits,
                    xp: prev.xp + 120,
                    weeklyChallenge: { ...prev.weeklyChallenge, claimed: true },
                  };
                })
              }
              onClaimSeasonalTier={(tier, coins, credits) =>
                setSave((prev) => {
                  if (prev.seasonalEvent.claimedTiers.includes(tier)) return prev;
                  return {
                    ...prev,
                    coins: prev.coins + coins,
                    credits: prev.credits + credits,
                    xp: prev.xp + 60,
                    seasonalEvent: {
                      ...prev.seasonalEvent,
                      claimedTiers: [...prev.seasonalEvent.claimedTiers, tier],
                    },
                  };
                })
              }
              onClaimAchievement={(achId, credits) =>
                setSave((prev) => ({
                  ...prev,
                  credits: prev.credits + credits,
                  xp: prev.xp + 50,
                  claimedAchievements: [...prev.claimedAchievements, achId],
                }))
              }
              onClaimRewardedBonus={(rewardType) =>
                setSave((prev) => {
                  const today = getTodayKey();
                  const countToday = prev.commercial.lastAdDate === today ? prev.commercial.adsWatchedToday : 0;
                  if (countToday >= 5) return prev;
                  return {
                    ...prev,
                    coins: prev.coins + (rewardType === 'coins' ? 120 : 0),
                    credits: prev.credits + (rewardType === 'credits' ? 25 : 0),
                    hintsBalance: prev.hintsBalance + (rewardType === 'hints' ? 2 : 0),
                    xp: prev.xp + 20,
                    commercial: {
                      ...prev.commercial,
                      lastAdDate: today,
                      adsWatchedToday: countToday + 1,
                    },
                  };
                })
              }
              onUnlockBundle={(bundle: StoreBundleDef, method) =>
                setSave((prev) => {
                  if (prev.commercial.ownedBundles.includes(bundle.id)) return prev;
                  if (method === 'credits' && prev.credits < bundle.creditsCost) return prev;
                  const nextCredits =
                    method === 'credits'
                      ? prev.credits - bundle.creditsCost + bundle.grantCredits
                      : prev.credits + bundle.grantCredits;
                  return {
                    ...prev,
                    coins: prev.coins + bundle.grantCoins,
                    credits: nextCredits,
                    hintsBalance: prev.hintsBalance + bundle.grantHints,
                    commercial: {
                      ...prev.commercial,
                      adFree: prev.commercial.adFree || Boolean(bundle.grantAdFree),
                      vipPass: prev.commercial.vipPass || Boolean(bundle.grantVip),
                      ownedBundles: [...prev.commercial.ownedBundles, bundle.id],
                    },
                  };
                })
              }
              onToggleShowcaseBreaks={(enabled) =>
                setSave((prev) => ({
                  ...prev,
                  commercial: { ...prev.commercial, interstitialOptIn: enabled },
                }))
              }
            />
          )}
        </div>
      )}

      {/* World 1: Peaceful World Routes */}
      {(activeMode === 'peaceful_garden' ||
        activeMode === 'peaceful_world' ||
        activeMode === 'dream_island') && (
        <div className="relative z-20 w-full h-full">
          <PeacefulWorldMode
            save={save}
            initialSanctuary={activeMode === 'dream_island' ? 'dream_island' : undefined}
            onExit={handleExitToHub}
            onUpdatePeacefulWorld={(nextPeaceful, reward) =>
              setSave((prev) => ({
                ...prev,
                coins: prev.coins + (reward?.coins ?? 0),
                xp: prev.xp + (reward?.xp ?? 0),
                unlockedBoutiqueIds:
                  reward?.unlockCrown && !prev.unlockedBoutiqueIds.includes('acc_flower_crown')
                    ? [...prev.unlockedBoutiqueIds, 'acc_flower_crown']
                    : prev.unlockedBoutiqueIds,
                peacefulWorld: nextPeaceful,
              }))
            }
            onSpendCoinsForSanctuaryOrDecor={(coinsCost, nextPeaceful) =>
              setSave((prev) =>
                prev.coins >= coinsCost
                  ? {
                      ...prev,
                      coins: prev.coins - coinsCost,
                      peacefulWorld: nextPeaceful,
                    }
                  : prev
              )
            }
          />
        </div>
      )}

      {/* Active Mode Views (Non-Running Modes) */}
      {(activeMode === 'messy_room' ||
        activeMode === 'closet_hunt' ||
        activeMode === 'jewelry_hunt' ||
        activeMode === 'makeup_mystery' ||
        activeMode === 'room_organize' ||
        activeMode === 'memory_challenge' ||
        activeMode === 'time_challenge') && (
        <div className="relative z-20 w-full h-full">
          <MessyRoomSearchMode
            save={save}
            subMode={activeMode as SearchSubMode}
            levelDef={activeLevel}
            onExit={handleExitToHub}
            onUseHint={() => {
              if (save.hintsBalance <= 0) return false;
              setSave((prev) => ({
                ...prev,
                hintsBalance: Math.max(0, prev.hintsBalance - 1),
              }));
              return true;
            }}
            onBuyHintsWithCredits={(count, costCredits) =>
              setSave((prev) =>
                prev.credits >= costCredits
                  ? {
                      ...prev,
                      credits: prev.credits - costCredits,
                      hintsBalance: prev.hintsBalance + count,
                    }
                  : prev
              )
            }
            onSelectSearchRoom={(roomId: SearchRoomLocationId) =>
              setSave((prev) => ({ ...prev, activeSearchRoom: roomId }))
            }
            onUnlockSearchRoom={(roomId: SearchRoomLocationId, cost: number) =>
              setSave((prev) =>
                prev.coins >= cost
                  ? {
                      ...prev,
                      coins: prev.coins - cost,
                      unlockedSearchRooms: prev.unlockedSearchRooms.includes(roomId)
                        ? prev.unlockedSearchRooms
                        : [...prev.unlockedSearchRooms, roomId],
                      activeSearchRoom: roomId,
                    }
                  : prev
              )
            }
            onMysteryBoxReward={(reward) =>
              setSave((prev) => ({
                ...prev,
                coins: prev.coins + reward.coins,
                credits: prev.credits + reward.credits,
                hintsBalance: prev.hintsBalance + reward.hints,
              }))
            }
            onComplete={(res) => {
              setSave((prev) => ({
                ...prev,
                hiddenObjectsFoundTotal: prev.hiddenObjectsFoundTotal + res.foundCount,
                searchLevelsCleared: prev.searchLevelsCleared + (res.won ? 1 : 0),
                hintsBalance: res.won && res.stars === 3 ? prev.hintsBalance + 1 : prev.hintsBalance,
                dailyMissions: prev.dailyMissions.map((m) =>
                  m.id === 'search_8' ? { ...m, current: m.current + res.foundCount } : m
                ),
              }));
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                activeMode,
                res.mistakesCount ?? 0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'dream_room' && (
        <div className="relative z-20 w-full h-full">
          <DreamRoomMode
            save={save}
            levelDef={activeLevel}
            onExit={handleExitToHub}
            onSelectTheme={(themeId) =>
              setSave((prev) => ({ ...prev, activeRoomTheme: themeId }))
            }
            onUnlockTheme={(themeId, cost) =>
              setSave((prev) =>
                prev.coins >= cost
                  ? {
                      ...prev,
                      coins: prev.coins - cost,
                      unlockedRoomThemes: [...prev.unlockedRoomThemes, themeId],
                      activeRoomTheme: themeId,
                    }
                  : prev
              )
            }
            onComplete={(res) => {
              setSave((prev) => {
                const updatedCats = { ...prev.categoryStats };
                (['wardrobe', 'beauty', 'study', 'decor'] as const).forEach((cat) => {
                  updatedCats[cat] = {
                    correct: updatedCats[cat].correct + res.categoryUpdates[cat].correct,
                    mistakes: updatedCats[cat].mistakes + res.categoryUpdates[cat].mistakes,
                  };
                });
                return {
                  ...prev,
                  itemsOrganizedTotal: prev.itemsOrganizedTotal + res.itemsSorted,
                  categoryStats: updatedCats,
                  dailyMissions: prev.dailyMissions.map((m) =>
                    m.id === 'sort_12' ? { ...m, current: m.current + res.itemsSorted } : m
                  ),
                };
              });
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'dream_room',
                res.mistakesCount ?? 0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'smart_organizer' && (
        <div className="relative z-20 w-full h-full">
          <SmartOrganizerMode
            save={save}
            levelDef={activeLevel}
            onExit={handleExitToHub}
            onComplete={(res) => {
              if (res.won) {
                setSave((prev) => ({
                  ...prev,
                  smartPuzzlesSolved: prev.smartPuzzlesSolved + 1,
                }));
                updateMissionProgress('smart_1', 1);
              }
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'smart_organizer',
                res.mistakesCount ?? 0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'fashion_studio' && (
        <div className="relative z-20 w-full h-full">
          <FashionStudioMode
            save={save}
            onExit={handleExitToHub}
            onApplyLook={(style, accessoryId, bagId, shoesId) =>
              setSave((prev) => ({
                ...prev,
                style,
                equippedAccessory: accessoryId,
                equippedBag: bagId,
                equippedShoes: shoesId,
              }))
            }
            onSaveLook={(look) => {
              updateMissionProgress('style_1', 1);
              setSave((prev) => ({
                ...prev,
                savedLooks: [look, ...prev.savedLooks].slice(0, 12),
              }));
            }}
            onDeleteLook={(id) =>
              setSave((prev) => ({
                ...prev,
                savedLooks: prev.savedLooks.filter((l) => l.id !== id),
              }))
            }
            onSnapshotReward={(coins, xp) =>
              setSave((prev) => ({
                ...prev,
                coins: prev.coins + coins,
                xp: prev.xp + xp,
              }))
            }
            onChallengeComplete={(res) => {
              updateMissionProgress('style_1', 1);
              grantLevelCompletion(
                undefined,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'fashion_studio',
                0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'shopping' && (
        <div className="relative z-20 w-full h-full">
          <ShoppingMode
            save={save}
            levelDef={activeLevel}
            onExit={handleExitToHub}
            onUnlockBoutiqueItem={(item, pricePaid) =>
              setSave((prev) => ({
                ...prev,
                coins: Math.max(0, prev.coins - pricePaid),
                unlockedBoutiqueIds: prev.unlockedBoutiqueIds.includes(item.id)
                  ? prev.unlockedBoutiqueIds
                  : [...prev.unlockedBoutiqueIds, item.id],
              }))
            }
            onComplete={(res) => {
              if (res.won) {
                setSave((prev) => ({
                  ...prev,
                  shoppingTripsCompleted: prev.shoppingTripsCompleted + 1,
                }));
              }
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'shopping',
                0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'makeover' && (
        <div className="relative z-20 w-full h-full">
          <MakeoverMode
            levelDef={activeLevel}
            completedCount={save.makeoversCompleted}
            onExit={handleExitToHub}
            onComplete={(res) => {
              if (res.won) {
                setSave((prev) => ({
                  ...prev,
                  makeoversCompleted: prev.makeoversCompleted + 1,
                }));
                updateMissionProgress('style_1', 1);
              }
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'makeover',
                0
              );
            }}
          />
        </div>
      )}

      {activeMode === 'mystery' && (
        <div className="relative z-20 w-full h-full">
          <MysteryMode
            levelDef={activeLevel}
            solvedCount={save.mysteriesSolved}
            noPressure={Boolean(save.settings.noPressureMode)}
            onExit={handleExitToHub}
            onComplete={(res) => {
              if (res.won) {
                setSave((prev) => ({
                  ...prev,
                  mysteriesSolved: prev.mysteriesSolved + 1,
                }));
              }
              grantLevelCompletion(
                activeLevel,
                res.won,
                res.stars,
                res.coinsEarned,
                res.creditsEarned,
                res.xpEarned,
                'mystery',
                res.mistakesCount ?? 0
              );
            }}
          />
        </div>
      )}

      {/* Running Adventure HUD & Modals */}
      {isRunningActive && gameState !== 'TITLE_MENU' && (
        <GameHud
          hud={hud}
          muted={muted}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          onPerformAction={(action) => engineRef.current?.performAction(action)}
          onMoveSteer={(dir) => engineRef.current?.setTouchMoveDir(dir)}
        />
      )}

      {isRunningActive && (
        <GameModals
          gameState={gameState}
          hud={hud}
          coins={save.coins}
          lastReward={lastRunReward}
          onResume={handleResume}
          onNextStage={handleNextStage}
          onEndlessEncore={handleEndlessEncore}
          onSecondWind={handleSecondWind}
          onRestart={handleStartRun}
          onBackToTitle={handleExitToHub}
        />
      )}

      {/* Optional Skippable Post-Run Coastal Showcase Modal */}
      {showcaseOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F2933]/65 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#F4FAFB] border border-[#CBE5E8] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coastal Spotlight</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-[#0F2933]">
              Emerald Tide Festival Live
            </h3>
            <p className="text-xs text-[#356370] leading-relaxed">
              Check the Rewards Store for Ocean Club VIP (+25% bonus coins) or Ad-Free Coastal Pass.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowcaseOpen(false)}
                className="btn-tactile w-full py-3 rounded-xl bg-[#0F766E] text-white font-semibold text-sm"
              >
                Skip & Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowcaseOpen(false);
                  handleExitToHub();
                  setHubTab('rewards');
                }}
                className="btn-tactile w-full py-2.5 rounded-xl bg-white border border-[#CBE5E8] text-[#0F766E] font-semibold text-xs"
              >
                Remove Breaks (Store)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Mobile Thumb Tab Bar (Hub Views Only, 52px height) */}
      {showHubChrome && (
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-0 inset-x-0 z-30 h-[52px] bg-[#F4FAFB]/95 border-t border-[#CBE5E8] grid grid-cols-4 items-center px-2"
        >
          {(
            [
              { id: 'home', label: 'Home', icon: Home },
              { id: 'map', label: '240 Map', icon: MapIcon },
              { id: 'modes', label: 'Modes', icon: Compass },
              { id: 'rewards', label: 'Rewards', icon: Gift },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = hubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundEngine.playCutePop();
                  setHubTab(tab.id);
                }}
                className={`relative h-11 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                  active ? 'text-[#0F766E] font-bold' : 'text-[#356370] hover:text-[#0F2933]'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 w-7 h-0.5 rounded-full bg-[#0F766E]"
                  />
                )}
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[11px] leading-none">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Interactive First-Time & Replay Tutorials */}
      <RoomSearchTutorialModal
        open={activeTutorial === 'room_search'}
        onComplete={(welcomeCoins) => {
          const isFirstTime = !save.tutorialsCompleted.roomSearch;
          setSave((prev) => ({
            ...prev,
            coins: prev.coins + (isFirstTime ? welcomeCoins : 0),
            xp: prev.xp + (isFirstTime ? 25 : 0),
            tutorialsCompleted: { ...prev.tutorialsCompleted, roomSearch: true },
          }));
          setActiveTutorial(null);
          if (pendingLaunchAfterTutorial) {
            executeLaunchImmediate(
              pendingLaunchAfterTutorial.mode,
              pendingLaunchAfterTutorial.levelDef,
              pendingLaunchAfterTutorial.adventureMode,
              pendingLaunchAfterTutorial.stageIndex ?? 0
            );
            setPendingLaunchAfterTutorial(null);
          }
        }}
        onSkip={() => {
          setSave((prev) => ({
            ...prev,
            tutorialsCompleted: { ...prev.tutorialsCompleted, roomSearch: true },
          }));
          setActiveTutorial(null);
          if (pendingLaunchAfterTutorial) {
            executeLaunchImmediate(
              pendingLaunchAfterTutorial.mode,
              pendingLaunchAfterTutorial.levelDef,
              pendingLaunchAfterTutorial.adventureMode,
              pendingLaunchAfterTutorial.stageIndex ?? 0
            );
            setPendingLaunchAfterTutorial(null);
          }
        }}
      />

      <RunningTutorialModal
        open={activeTutorial === 'running'}
        style={save.style}
        onComplete={(welcomeCoins) => {
          const isFirstTime = !save.tutorialsCompleted.running;
          setSave((prev) => ({
            ...prev,
            coins: prev.coins + (isFirstTime ? welcomeCoins : 0),
            xp: prev.xp + (isFirstTime ? 25 : 0),
            tutorialsCompleted: { ...prev.tutorialsCompleted, running: true },
          }));
          setActiveTutorial(null);
          if (pendingLaunchAfterTutorial) {
            executeLaunchImmediate(
              pendingLaunchAfterTutorial.mode,
              pendingLaunchAfterTutorial.levelDef,
              pendingLaunchAfterTutorial.adventureMode,
              pendingLaunchAfterTutorial.stageIndex ?? 0
            );
            setPendingLaunchAfterTutorial(null);
          }
        }}
        onSkip={() => {
          setSave((prev) => ({
            ...prev,
            tutorialsCompleted: { ...prev.tutorialsCompleted, running: true },
          }));
          setActiveTutorial(null);
          if (pendingLaunchAfterTutorial) {
            executeLaunchImmediate(
              pendingLaunchAfterTutorial.mode,
              pendingLaunchAfterTutorial.levelDef,
              pendingLaunchAfterTutorial.adventureMode,
              pendingLaunchAfterTutorial.stageIndex ?? 0
            );
            setPendingLaunchAfterTutorial(null);
          }
        }}
      />

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        open={profileOpen}
        save={save}
        onClose={() => setProfileOpen(false)}
        onUpdateProfile={(playerName, avatarBadge, favoriteWorld) =>
          setSave((prev) => ({
            ...prev,
            playerName,
            avatarBadge,
            favoriteWorld: favoriteWorld ?? prev.favoriteWorld,
          }))
        }
        onUpdateSettings={(settings) => setSave((prev) => ({ ...prev, settings }))}
        onReplayRoomTutorial={() => {
          setPendingLaunchAfterTutorial(null);
          setActiveTutorial('room_search');
        }}
        onReplayRunTutorial={() => {
          setPendingLaunchAfterTutorial(null);
          setActiveTutorial('running');
        }}
        onRestoreBackup={() => {
          const restored = restoreBackupSave();
          if (restored) {
            setSave(restored);
            return true;
          }
          return false;
        }}
        onResetSave={() => {
          const fresh = createInitialSave();
          setSave(fresh);
          setProfileOpen(false);
        }}
      />
    </main>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppInner />
    </AppErrorBoundary>
  );
}
