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
import { GameId } from '../theme';

interface AppContextValue {
  isUnlocked: boolean;
  isMuted: boolean;
  starsEarned: number;
  whitAccessory: WhitAccessoryId;
  collectedStickers: string[];
  starJarVisible: boolean;
  hasNewAccessory: boolean;
  isPurchasing: boolean;
  activeGame: GameId | null;
  parentGateVisible: boolean;
  paywallVisible: boolean;
  pendingLockedGame: GameId | null;
  statusMessage: string | null;
  toggleMute: () => void;
  addStar: (count?: number) => void;
  collectSticker: (animal: string) => void;
  setWhitAccessory: (id: WhitAccessoryId) => void;
  cycleWhitAccessory: () => void;
  openStarJar: () => void;
  closeStarJar: () => void;
  openGame: (id: GameId, isFree: boolean) => void;
  goHome: () => void;
  openParentGate: (forLockedGame?: GameId | null) => void;
  closeParentGate: () => void;
  onParentGatePassed: () => void;
  closePaywall: () => void;
  handlePurchaseUnlockAll: () => Promise<PurchaseResult>;
  handleRestorePurchases: () => Promise<PurchaseResult>;
  handleSetPreviewUnlocked: (unlocked: boolean) => Promise<void>;
  clearStatusMessage: () => void;
}

const STARS_KEY = 'whits_world_stars_v1';
const ACCESSORY_KEY = 'whits_world_whit_accessory_v1';
const STICKERS_KEY = 'whits_world_stickers_v1';

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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STICKERS_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  }
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
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [parentGateVisible, setParentGateVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [pendingLockedGame, setPendingLockedGame] = useState<GameId | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    purchaseService.getEntitlements().then((ent) => {
      setIsUnlocked(ent.unlockAll);
    });
  }, []);

  const toggleMute = useCallback(() => {
    const next = !soundEngine.isMuted();
    soundEngine.setMuted(next);
    setIsMuted(next);
    if (!next) {
      soundEngine.unlock();
      soundEngine.playPop();
    }
  }, []);

  const addStar = useCallback((count = 1) => {
    setStarsEarned((prev) => {
      const next = prev + count;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STARS_KEY, String(next));
        } catch {
          // Ignore storage error
        }
      }
      // Flag a joyful sparkle on the Star Jar whenever a new hat/prop unlocks
      const unlockedNew = WHIT_ACCESSORIES.some(
        (a) => a.starsRequired > prev && a.starsRequired <= next
      );
      if (unlockedNew) {
        setHasNewAccessory(true);
      }
      return next;
    });
  }, []);

  const collectSticker = useCallback((animal: string) => {
    if (!animal) return;
    setCollectedStickers((prev) => {
      if (prev.includes(animal)) return prev;
      const next = [...prev, animal];
      writeStoredStickers(next);
      setHasNewAccessory(true);
      return next;
    });
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
    // Prevent ghost-click or accidental rapid double-tap on top-left Home button from opening Star Jar
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

  const openGame = useCallback(
    (id: GameId, isFree: boolean) => {
      soundEngine.unlock();
      if (isFree || isUnlocked) {
        soundEngine.playPop();
        setActiveGame(id);
      } else {
        openParentGate(id);
      }
    },
    [isUnlocked, openParentGate]
  );

  const goHome = useCallback(() => {
    lastGoHomeAtRef.current = Date.now();
    soundEngine.playCardFlip();
    setActiveGame(null);
  }, []);

  const handlePurchaseUnlockAll = useCallback(async () => {
    setIsPurchasing(true);
    setStatusMessage(null);
    try {
      const res = await purchaseService.purchaseUnlockAll();
      setIsUnlocked(res.unlocked);
      setStatusMessage(res.message);
      if (res.unlocked) {
        soundEngine.playWin();
      }
      return res;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    setIsPurchasing(true);
    setStatusMessage(null);
    try {
      const res = await purchaseService.restorePurchases();
      setIsUnlocked(res.unlocked);
      setStatusMessage(res.message);
      if (res.unlocked) {
        soundEngine.playMatch();
      }
      return res;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  const handleSetPreviewUnlocked = useCallback(async (unlocked: boolean) => {
    const ent = await purchaseService.setLocalPreviewUnlocked(unlocked);
    setIsUnlocked(ent.unlockAll);
    setStatusMessage(
      unlocked
        ? 'Preview Mode: All 6 games unlocked!'
        : 'Preview Mode: Free Tier active (3 games locked).'
    );
    if (unlocked) {
      soundEngine.playSnap();
    } else {
      soundEngine.playCardFlip();
    }
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
        isPurchasing,
        activeGame,
        parentGateVisible,
        paywallVisible,
        pendingLockedGame,
        statusMessage,
        toggleMute,
        addStar,
        collectSticker,
        setWhitAccessory,
        cycleWhitAccessory,
        openStarJar,
        closeStarJar,
        openGame,
        goHome,
        openParentGate,
        closeParentGate,
        onParentGatePassed,
        closePaywall,
        handlePurchaseUnlockAll,
        handleRestorePurchases,
        handleSetPreviewUnlocked,
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
