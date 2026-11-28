import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  isAccessoryUnlocked,
  WHIT_ACCESSORIES,
  WhitAccessoryId,
} from '../components/WhitAccessories';
import { purchaseService, PurchaseResult } from '../services/purchases';
import { soundEngine } from '../services/sound';
import {
  Difficulty,
  FREE_GAMES_COUNT,
  GameId,
  GAMES,
  PAID_GAMES_COUNT,
} from '../theme';

export interface ParentStats {
  totalLaunches: number;
  roundsWon: number;
  byGame: Partial<Record<GameId, number>>;
}

interface DailySampleRecord {
  date: string;
  used: GameId[];
}

interface AppContextValue {
  isUnlocked: boolean;
  isMuted: boolean;
  starsEarned: number;
  whitAccessory: WhitAccessoryId;
  collectedStickers: string[];
  starJarVisible: boolean;
  hasNewAccessory: boolean;
  latestUnlockedAccessory: WhitAccessoryId | null;
  latestCollectedSticker: string | null;
  isPurchasing: boolean;
  activeGame: GameId | null;
  isSampleSession: boolean;
  parentGateVisible: boolean;
  paywallVisible: boolean;
  pendingLockedGame: GameId | null;
  statusMessage: string | null;
  defaultDifficulty: Difficulty;
  parentStats: ParentStats;
  bedtimeMinutes: number | null;
  bedtimeSecondsLeft: number | null;
  bedtimeReached: boolean;
  toggleMute: () => void;
  addStar: (count?: number) => void;
  collectSticker: (animal: string) => void;
  clearCelebrationUnlocks: () => void;
  setWhitAccessory: (id: WhitAccessoryId) => void;
  cycleWhitAccessory: () => void;
  openStarJar: () => void;
  closeStarJar: () => void;
  canPlayFreeSample: (id: GameId) => boolean;
  completeSampleSession: () => void;
  openGame: (id: GameId, isFree: boolean) => void;
  launchPendingLockedGame: () => void;
  goHome: () => void;
  openParentGate: (forLockedGame?: GameId | null) => void;
  closeParentGate: () => void;
  onParentGatePassed: () => void;
  closePaywall: () => void;
  handlePurchaseUnlockAll: () => Promise<PurchaseResult>;
  handleRestorePurchases: () => Promise<PurchaseResult>;
  handleSetPreviewUnlocked: (unlocked: boolean) => Promise<void>;
  getSavedDifficulty: (gameId: GameId) => Difficulty;
  saveGameDifficulty: (gameId: GameId, diff: Difficulty) => void;
  setAgePresetDifficulty: (diff: Difficulty) => void;
  startBedtimeTimer: (minutes: number | null) => void;
  snoozeBedtime: (extraMinutes?: number) => void;
  dismissBedtime: () => void;
  clearStatusMessage: () => void;
}

const STARS_KEY = 'whits_world_stars_v1';
const ACCESSORY_KEY = 'whits_world_whit_accessory_v1';
const STICKERS_KEY = 'whits_world_stickers_v1';
const DAILY_SAMPLES_KEY = 'whits_world_daily_samples_v1';
const DEFAULT_DIFF_KEY = 'whits_world_default_diff_v1';
const GAME_DIFFS_KEY = 'whits_world_game_diffs_v1';
const PARENT_STATS_KEY = 'whits_world_parent_stats_v1';

function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readJsonStorage<T>(key: string, fallback: T): T {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function writeJsonStorage(key: string, value: unknown): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors in private browsing
    }
  }
}

function readStoredStickers(): string[] {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STICKERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.includes('gorilla') ? parsed : ['gorilla', ...parsed];
        }
      }
    } catch {
      return ['gorilla'];
    }
  }
  return ['gorilla'];
}

function writeStoredStickers(list: string[]): void {
  writeJsonStorage(STICKERS_KEY, list);
}

function readStoredStars(): number {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const val = parseInt(window.localStorage.getItem(STARS_KEY) || '0', 10);
      return Number.isFinite(val) && val >= 0 ? val : 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

function readStoredAccessory(): WhitAccessoryId {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const val = window.localStorage.getItem(ACCESSORY_KEY) as WhitAccessoryId | null;
      if (val && WHIT_ACCESSORIES.some((a) => a.id === val)) {
        return val;
      }
    } catch {
      return 'none';
    }
  }
  return 'none';
}

function writeStoredAccessory(id: WhitAccessoryId): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ACCESSORY_KEY, id);
    } catch {
      // Ignore storage errors
    }
  }
}

function readDailySamples(): DailySampleRecord {
  const today = todayStamp();
  const saved = readJsonStorage<DailySampleRecord | null>(DAILY_SAMPLES_KEY, null);
  if (saved && saved.date === today && Array.isArray(saved.used)) {
    return saved;
  }
  return { date: today, used: [] };
}

function readDefaultDifficulty(): Difficulty {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = parseInt(window.localStorage.getItem(DEFAULT_DIFF_KEY) || '1', 10);
      if (raw === 1 || raw === 2 || raw === 3) return raw;
    } catch {
      return 1;
    }
  }
  return 1;
}

function readGameDifficulties(): Partial<Record<GameId, Difficulty>> {
  return readJsonStorage<Partial<Record<GameId, Difficulty>>>(GAME_DIFFS_KEY, {});
}

function readParentStats(): ParentStats {
  const saved = readJsonStorage<Partial<ParentStats>>(PARENT_STATS_KEY, {});
  return {
    totalLaunches: typeof saved.totalLaunches === 'number' ? saved.totalLaunches : 0,
    roundsWon: typeof saved.roundsWon === 'number' ? saved.roundsWon : readStoredStars(),
    byGame: saved.byGame && typeof saved.byGame === 'object' ? saved.byGame : {},
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted());
  const [starsEarned, setStarsEarned] = useState(readStoredStars);
  const [whitAccessory, setWhitAccessoryState] =
    useState<WhitAccessoryId>(readStoredAccessory);
  const [collectedStickers, setCollectedStickers] =
    useState<string[]>(readStoredStickers);
  const [starJarVisible, setStarJarVisible] = useState(false);
  const [hasNewAccessory, setHasNewAccessory] = useState(false);
  const [latestUnlockedAccessory, setLatestUnlockedAccessory] =
    useState<WhitAccessoryId | null>(null);
  const [latestCollectedSticker, setLatestCollectedSticker] =
    useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [isSampleSession, setIsSampleSession] = useState(false);
  const [dailySamples, setDailySamples] =
    useState<DailySampleRecord>(readDailySamples);
  const [defaultDifficulty, setDefaultDifficulty] =
    useState<Difficulty>(readDefaultDifficulty);
  const [gameDifficulties, setGameDifficulties] =
    useState<Partial<Record<GameId, Difficulty>>>(readGameDifficulties);
  const [parentStats, setParentStats] = useState<ParentStats>(readParentStats);

  const [bedtimeMinutes, setBedtimeMinutes] = useState<number | null>(null);
  const [bedtimeSecondsLeft, setBedtimeSecondsLeft] = useState<number | null>(null);
  const [bedtimeReached, setBedtimeReached] = useState(false);

  const [parentGateVisible, setParentGateVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [pendingLockedGame, setPendingLockedGame] = useState<GameId | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sampleStartedAtRef = useRef<number>(0);
  const activeGameRef = useRef<GameId | null>(null);
  activeGameRef.current = activeGame;
  const isSampleRef = useRef<boolean>(false);
  isSampleRef.current = isSampleSession;

  useEffect(() => {
    purchaseService.getEntitlements().then((ent) => {
      setIsUnlocked(ent.unlockAll);
    });
  }, []);

  // Gentle Calm / Bedtime countdown timer
  useEffect(() => {
    if (bedtimeSecondsLeft === null || bedtimeSecondsLeft <= 0 || bedtimeReached) {
      return;
    }
    const id = setInterval(() => {
      setBedtimeSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setBedtimeReached(true);
          soundEngine.playBedtimeLullaby();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [bedtimeReached, bedtimeSecondsLeft]);

  const markSampleUsedFor = useCallback((gameId: GameId) => {
    const today = todayStamp();
    setDailySamples((prev) => {
      const baseUsed = prev.date === today ? prev.used : [];
      if (baseUsed.includes(gameId)) {
        return prev.date === today ? prev : { date: today, used: baseUsed };
      }
      const next: DailySampleRecord = {
        date: today,
        used: [...baseUsed, gameId],
      };
      writeJsonStorage(DAILY_SAMPLES_KEY, next);
      return next;
    });
  }, []);

  const canPlayFreeSample = useCallback(
    (id: GameId): boolean => {
      const meta = GAMES.find((g) => g.id === id);
      if (!meta || meta.isFree || isUnlocked) return false;
      const today = todayStamp();
      const usedToday = dailySamples.date === today ? dailySamples.used : [];
      return !usedToday.includes(id);
    },
    [dailySamples, isUnlocked]
  );

  const completeSampleSession = useCallback(() => {
    if (isSampleRef.current && activeGameRef.current) {
      markSampleUsedFor(activeGameRef.current);
    }
  }, [markSampleUsedFor]);

  const toggleMute = useCallback(() => {
    const next = !soundEngine.isMuted();
    soundEngine.setMuted(next);
    setIsMuted(next);
    if (!next) {
      soundEngine.unlock();
      soundEngine.playPop();
    }
  }, []);

  const addStar = useCallback(
    (count = 1) => {
      // Completing a puzzle/round in a Free Sample session marks today's sample used
      if (isSampleRef.current && activeGameRef.current) {
        markSampleUsedFor(activeGameRef.current);
      }

      setParentStats((prev) => {
        const next: ParentStats = {
          ...prev,
          roundsWon: prev.roundsWon + count,
        };
        writeJsonStorage(PARENT_STATS_KEY, next);
        return next;
      });

      setStarsEarned((prev) => {
        const next = prev + count;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(STARS_KEY, String(next));
          } catch {
            // Ignore storage error
          }
        }
        const newlyUnlocked = WHIT_ACCESSORIES.find(
          (a) => a.starsRequired > prev && a.starsRequired <= next
        );
        if (newlyUnlocked) {
          setHasNewAccessory(true);
          setLatestUnlockedAccessory(newlyUnlocked.id);
        }
        return next;
      });
    },
    [markSampleUsedFor]
  );

  const collectSticker = useCallback((animal: string) => {
    if (!animal) return;
    setCollectedStickers((prev) => {
      if (prev.includes(animal)) return prev;
      const next = [...prev, animal];
      writeStoredStickers(next);
      setHasNewAccessory(true);
      setLatestCollectedSticker(animal);
      return next;
    });
  }, []);

  const clearCelebrationUnlocks = useCallback(() => {
    setLatestUnlockedAccessory(null);
    setLatestCollectedSticker(null);
  }, []);

  const setWhitAccessory = useCallback(
    (id: WhitAccessoryId) => {
      if (!isAccessoryUnlocked(id, starsEarned)) return;
      setWhitAccessoryState(id);
      writeStoredAccessory(id);
    },
    [starsEarned]
  );

  const cycleWhitAccessory = useCallback(() => {
    const unlockedIds = WHIT_ACCESSORIES.filter((a) =>
      isAccessoryUnlocked(a.id, starsEarned)
    ).map((a) => a.id);
    if (unlockedIds.length <= 1) return;

    setWhitAccessoryState((prev) => {
      const curIdx = unlockedIds.indexOf(prev);
      const nextId = unlockedIds[(curIdx + 1) % unlockedIds.length];
      writeStoredAccessory(nextId);
      return nextId;
    });
  }, [starsEarned]);

  const lastGoHomeAtRef = useRef<number>(0);

  const openStarJar = useCallback(() => {
    if (Date.now() - lastGoHomeAtRef.current < 400) return;
    soundEngine.unlock();
    soundEngine.playStarCollect(2);
    setHasNewAccessory(false);
    setStarJarVisible(true);
  }, []);

  const closeStarJar = useCallback(() => {
    soundEngine.playCardFlip();
    setStarJarVisible(false);
  }, []);

  const openParentGate = useCallback((forLockedGame: GameId | null = null) => {
    soundEngine.unlock();
    soundEngine.playCardFlip();
    setPendingLockedGame(forLockedGame);
    setStatusMessage(null);
    setParentGateVisible(true);
  }, []);

  const closeParentGate = useCallback(() => {
    setParentGateVisible(false);
    setPendingLockedGame(null);
  }, []);

  const onParentGatePassed = useCallback(() => {
    setParentGateVisible(false);
    setPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    setPendingLockedGame(null);
    setStatusMessage(null);
  }, []);

  const recordGameLaunch = useCallback((id: GameId) => {
    setParentStats((prev) => {
      const next: ParentStats = {
        ...prev,
        totalLaunches: prev.totalLaunches + 1,
        byGame: {
          ...prev.byGame,
          [id]: (prev.byGame[id] || 0) + 1,
        },
      };
      writeJsonStorage(PARENT_STATS_KEY, next);
      return next;
    });
  }, []);

  const openGame = useCallback(
    (id: GameId, isFree: boolean) => {
      soundEngine.unlock();
      if (isFree || isUnlocked) {
        soundEngine.playPop();
        setIsSampleSession(false);
        setLatestUnlockedAccessory(null);
        setLatestCollectedSticker(null);
        setActiveGame(id);
        recordGameLaunch(id);
      } else if (canPlayFreeSample(id)) {
        // 1 Joyful Daily Free Sample Round on any locked Full-Pack game!
        soundEngine.playStarCollect(1);
        sampleStartedAtRef.current = Date.now();
        setIsSampleSession(true);
        setLatestUnlockedAccessory(null);
        setLatestCollectedSticker(null);
        setActiveGame(id);
        recordGameLaunch(id);
      } else {
        openParentGate(id);
      }
    },
    [canPlayFreeSample, isUnlocked, openParentGate, recordGameLaunch]
  );

  const launchPendingLockedGame = useCallback(() => {
    if (!pendingLockedGame || !isUnlocked) return;
    const target = pendingLockedGame;
    soundEngine.playPop();
    setPaywallVisible(false);
    setPendingLockedGame(null);
    setStatusMessage(null);
    setIsSampleSession(false);
    setLatestUnlockedAccessory(null);
    setLatestCollectedSticker(null);
    setActiveGame(target);
    recordGameLaunch(target);
  }, [isUnlocked, pendingLockedGame, recordGameLaunch]);

  const goHome = useCallback(() => {
    lastGoHomeAtRef.current = Date.now();
    // If child played a Free Sample for at least 6 seconds (e.g. Free Jam / Sound Board),
    // count today's sample as enjoyed; accidental <6s exits preserve their Free Try!
    if (
      isSampleRef.current &&
      activeGameRef.current &&
      Date.now() - sampleStartedAtRef.current >= 6000
    ) {
      markSampleUsedFor(activeGameRef.current);
    }
    soundEngine.playCardFlip();
    setIsSampleSession(false);
    setLatestUnlockedAccessory(null);
    setLatestCollectedSticker(null);
    setActiveGame(null);
  }, [markSampleUsedFor]);

  const handlePurchaseUnlockAll = useCallback(async () => {
    setIsPurchasing(true);
    setStatusMessage(null);
    try {
      const res = await purchaseService.purchaseUnlockAll();
      setIsUnlocked(res.unlocked);
      setStatusMessage(res.message);
      if (res.unlocked) {
        soundEngine.playWin();
        setIsSampleSession(false);
        if (pendingLockedGame) {
          const target = pendingLockedGame;
          setTimeout(() => {
            setPaywallVisible(false);
            setPendingLockedGame(null);
            setStatusMessage(null);
            setActiveGame(target);
            recordGameLaunch(target);
          }, 650);
        }
      }
      return res;
    } finally {
      setIsPurchasing(false);
    }
  }, [pendingLockedGame, recordGameLaunch]);

  const handleRestorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    setStatusMessage(null);
    try {
      const res = await purchaseService.restorePurchases();
      setIsUnlocked(res.unlocked);
      setStatusMessage(res.message);
      if (res.unlocked) {
        soundEngine.playMatch();
        setIsSampleSession(false);
      }
      return res;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const handleSetPreviewUnlocked = useCallback(async (unlocked: boolean) => {
    const ent = await purchaseService.setLocalPreviewUnlocked(unlocked);
    setIsUnlocked(ent.unlockAll);
    if (unlocked) {
      setIsSampleSession(false);
    }
    setStatusMessage(
      unlocked
        ? `Preview Mode: All ${GAMES.length} zoo games unlocked!`
        : `Preview Mode: Starter Pack active (${FREE_GAMES_COUNT} free + ${PAID_GAMES_COUNT} Full Pack).`
    );
    if (unlocked) {
      soundEngine.playSnap();
    } else {
      soundEngine.playCardFlip();
    }
  }, []);

  const getSavedDifficulty = useCallback(
    (gameId: GameId): Difficulty => {
      return gameDifficulties[gameId] ?? defaultDifficulty;
    },
    [defaultDifficulty, gameDifficulties]
  );

  const saveGameDifficulty = useCallback((gameId: GameId, diff: Difficulty) => {
    setGameDifficulties((prev) => {
      if (prev[gameId] === diff) return prev;
      const next = { ...prev, [gameId]: diff };
      writeJsonStorage(GAME_DIFFS_KEY, next);
      return next;
    });
  }, []);

  const setAgePresetDifficulty = useCallback((diff: Difficulty) => {
    soundEngine.playPop();
    setDefaultDifficulty(diff);
    setGameDifficulties({});
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DEFAULT_DIFF_KEY, String(diff));
        window.localStorage.removeItem(GAME_DIFFS_KEY);
      } catch {
        // Ignore storage error
      }
    }
  }, []);

  const startBedtimeTimer = useCallback((minutes: number | null) => {
    soundEngine.playPop();
    setBedtimeReached(false);
    setBedtimeMinutes(minutes);
    setBedtimeSecondsLeft(minutes !== null ? minutes * 60 : null);
  }, []);

  const snoozeBedtime = useCallback((extraMinutes = 5) => {
    soundEngine.playSnap();
    setBedtimeReached(false);
    setBedtimeMinutes(extraMinutes);
    setBedtimeSecondsLeft(extraMinutes * 60);
  }, []);

  const dismissBedtime = useCallback(() => {
    soundEngine.playCardFlip();
    setBedtimeReached(false);
    setBedtimeMinutes(null);
    setBedtimeSecondsLeft(null);
  }, []);

  const clearStatusMessage = useCallback(() => setStatusMessage(null), []);

  return (
    <AppContext.Provider
      value={{
        isUnlocked,
        isMuted,
        starsEarned,
        whitAccessory,
        collectedStickers,
        starJarVisible,
        hasNewAccessory,
        latestUnlockedAccessory,
        latestCollectedSticker,
        isPurchasing,
        activeGame,
        isSampleSession,
        parentGateVisible,
        paywallVisible,
        pendingLockedGame,
        statusMessage,
        defaultDifficulty,
        parentStats,
        bedtimeMinutes,
        bedtimeSecondsLeft,
        bedtimeReached,
        toggleMute,
        addStar,
        collectSticker,
        clearCelebrationUnlocks,
        setWhitAccessory,
        cycleWhitAccessory,
        openStarJar,
        closeStarJar,
        canPlayFreeSample,
        completeSampleSession,
        openGame,
        launchPendingLockedGame,
        goHome,
        openParentGate,
        closeParentGate,
        onParentGatePassed,
        closePaywall,
        handlePurchaseUnlockAll,
        handleRestorePurchases,
        handleSetPreviewUnlocked,
        getSavedDifficulty,
        saveGameDifficulty,
        setAgePresetDifficulty,
        startBedtimeTimer,
        snoozeBedtime,
        dismissBedtime,
        clearStatusMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}

export function useOptionalApp(): AppContextValue | null {
  return useContext(AppContext);
}
