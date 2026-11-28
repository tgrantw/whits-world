import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import {
  DraggablePiece,
  DropAttempt,
  isPointNearRect,
  MeasurableNode,
  measureNodeRect,
} from '../components/DraggablePiece';
import { GameHeader } from '../components/GameHeader';
import {
  PICNIC_TREATS,
  PicnicTreatId,
  PicnicTreatMeta,
  PicnicTreatSvg,
} from '../components/PicnicTreats';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import { WhitMascot, WhitMood } from '../components/WhitMascot';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

interface PicnicGuest {
  animal: ExhibitAnimalKind;
  name: string;
  favoriteTreat: PicnicTreatId;
  badgeColor: string;
}

const PICNIC_GUESTS: PicnicGuest[] = [
  { animal: 'monkey', name: 'Monkey', favoriteTreat: 'banana', badgeColor: '#F3D7A6' },
  { animal: 'penguin', name: 'Penguin', favoriteTreat: 'fish', badgeColor: '#C5E4F4' },
  { animal: 'cow', name: 'Cow', favoriteTreat: 'watermelon', badgeColor: '#F5DB9A' },
  { animal: 'panda', name: 'Panda', favoriteTreat: 'bamboo', badgeColor: '#C5E6CA' },
  { animal: 'polarbear', name: 'Polar Bear', favoriteTreat: 'fish', badgeColor: '#D2E9F6' },
  { animal: 'pig', name: 'Pig', favoriteTreat: 'watermelon', badgeColor: '#F8D4DA' },
  { animal: 'elephant', name: 'Elephant', favoriteTreat: 'watermelon', badgeColor: '#C7E2F2' },
  { animal: 'toucan', name: 'Toucan', favoriteTreat: 'berries', badgeColor: '#F8DF9B' },
  { animal: 'whale', name: 'Whale', favoriteTreat: 'fish', badgeColor: '#B3E3F5' },
  { animal: 'giraffe', name: 'Giraffe', favoriteTreat: 'bamboo', badgeColor: '#F6E1A8' },
  { animal: 'lion', name: 'Lion', favoriteTreat: 'cupcake', badgeColor: '#F6CB9F' },
  { animal: 'frog', name: 'Frog', favoriteTreat: 'fish', badgeColor: '#BBE4B7' },
];

const WHIT_FAVORITES: PicnicTreatId[] = ['banana', 'watermelon', 'berries', 'cupcake'];

interface PicnicOrder {
  whitCraving: PicnicTreatId | null;
  guestCraving: PicnicTreatId | null;
}

function getGoalCount(difficulty: Difficulty): number {
  if (difficulty === 1) return 5;
  if (difficulty === 2) return 6;
  return 7;
}

function pickRandomTreat(exclude: PicnicTreatId[] = [], preferred?: PicnicTreatId[]): PicnicTreatId {
  const pool = (preferred && preferred.length > 0 ? preferred : PICNIC_TREATS.map((t) => t.id)).filter(
    (id) => !exclude.includes(id)
  );
  const finalPool = pool.length > 0 ? pool : PICNIC_TREATS.map((t) => t.id).filter((id) => !exclude.includes(id));
  return finalPool[Math.floor(Math.random() * finalPool.length)] || 'banana';
}

function buildNextOrder(
  difficulty: Difficulty,
  guest: PicnicGuest,
  stepIndex: number,
  prevTreat?: PicnicTreatId
): PicnicOrder {
  const allIds = PICNIC_TREATS.map((t) => t.id);

  if (difficulty === 3) {
    // Gentle Hard mode: both Whit and his visiting friend each crave a different snack!
    const whitTreat = pickRandomTreat(prevTreat ? [prevTreat] : [], WHIT_FAVORITES);
    const guestPreferred: PicnicTreatId[] =
      guest.favoriteTreat !== whitTreat
        ? [guest.favoriteTreat, ...allIds.filter((id) => id !== whitTreat && id !== guest.favoriteTreat)]
        : allIds.filter((id) => id !== whitTreat);
    const guestTreat =
      Math.random() < 0.65 && guest.favoriteTreat !== whitTreat
        ? guest.favoriteTreat
        : pickRandomTreat([whitTreat], guestPreferred);
    return { whitCraving: whitTreat, guestCraving: guestTreat };
  }

  // Easy & Med: one clearly highlighted hungry friend at a time!
  const feedWhitTurn = stepIndex % 2 === 0;
  if (feedWhitTurn) {
    const treat = pickRandomTreat(prevTreat ? [prevTreat] : [], WHIT_FAVORITES);
    return { whitCraving: treat, guestCraving: null };
  }
  const guestTreat =
    guest.favoriteTreat !== prevTreat && Math.random() < 0.7
      ? guest.favoriteTreat
      : pickRandomTreat(prevTreat ? [prevTreat] : []);
  return { whitCraving: null, guestCraving: guestTreat };
}

/** Warm hand-painted cream & terracotta gingham storybook picnic blanket */
const PicnicBlanketSvg: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <Svg width={width} height={height} viewBox="0 0 420 150" preserveAspectRatio="none">
    {/* Soft grass ground shadow */}
    <Ellipse cx="210" cy="128" rx="198" ry="18" fill="rgba(54, 88, 42, 0.24)" />
    {/* Perspective trapezoid picnic cloth */}
    <Path
      d="M 52 24 L 368 24 L 404 122 Q 210 138 16 122 Z"
      fill="#FFF6E5"
      stroke="#A85C3A"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Soft terracotta gingham stripes (horizontal) */}
    <Path d="M 44 46 H 376 L 383 62 H 37 Z" fill="rgba(223, 114, 72, 0.24)" />
    <Path d="M 31 82 H 389 L 396 98 H 24 Z" fill="rgba(223, 114, 72, 0.24)" />
    {/* Soft terracotta gingham stripes (vertical perspective bands) */}
    <Path d="M 102 25 L 78 124 L 112 126 L 130 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    <Path d="M 188 25 L 182 128 L 218 128 L 214 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    <Path d="M 276 25 L 288 126 L 322 124 L 304 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    {/* Warm cream highlight along back edge */}
    <Rect x="54" y="22" width="312" height="5" rx="2.5" fill="rgba(255, 252, 240, 0.65)" />
  </Svg>
);

/** Floating coral hearts rising happily after a yummy bite */
const FloatingYumHearts: React.FC<{ burstKey: number; size: number }> = ({
  burstKey,
  size,
}) => {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    prog.setValue(0);
    Animated.timing(prog, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burstKey, prog]);

  const riseY = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -Math.round(size * 0.55)],
  });
  const opacity = prog.interpolate({
    inputRange: [0, 0.2, 0.78, 1],
    outputRange: [0, 1, 0.95, 0],
  });
  const scale = prog.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0.4, 1.15, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heartsFloat,
        {
          opacity,
          transform: [{ translateY: riseY }, { scale }],
        },
      ]}
    >
      <Svg width={72} height={46} viewBox="0 0 72 46">
        <Path
          d="M 22 36 C 12 28, 6 21, 6 14 C 6 9, 10 5, 15 5 C 18 5, 20.5 6.8, 22 9 C 23.5 6.8, 26 5, 29 5 C 34 5, 38 9, 38 14 C 38 21, 32 28, 22 36 Z"
          fill="#EC6A84"
          stroke="#7A3646"
          strokeWidth="2.2"
        />
        <Path
          d="M 52 28 C 45 22, 41 17, 41 12 C 41 8.5, 44 6, 47.5 6 C 49.5 6, 51 7.2, 52 8.8 C 53 7.2, 54.5 6, 56.5 6 C 60 6, 63 8.5, 63 12 C 63 17, 59 22, 52 28 Z"
          fill="#F79AB0"
          stroke="#7A3646"
          strokeWidth="2"
        />
      </Svg>
    </Animated.View>
  );
};

/** Glowing thought bubble showing the exact snack a hungry friend is craving (zero reading!) */
const CravingBubble: React.FC<{
  treat: PicnicTreatId;
  size: number;
  wiggleTick: number;
  side: 'left' | 'right';
}> = ({ treat, size, wiggleTick, side }) => {
  const bob = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    if (!wiggleTick) return;
    wiggle.setValue(0);
    Animated.sequence([
      Animated.timing(wiggle, { toValue: -1, duration: 75, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: 85, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -0.6, duration: 80, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [wiggleTick, wiggle]);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cravingBubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    >
      <PicnicTreatSvg treat={treat} size={Math.round(size * 0.72)} />
      <View
        style={[
          styles.cravingDotLg,
          side === 'right' ? { left: 8, right: undefined } : null,
        ]}
      />
      <View
        style={[
          styles.cravingDotSm,
          side === 'right' ? { left: 3, right: undefined } : null,
        ]}
      />
    </Animated.View>
  );
};

/**
 * Feed Whit — Gamified Jungle Picnic (Free Tier Selectable Game):
 * - Gentle, toddler-friendly snack-order matching game on a sunlit jungle picnic blanket!
 * - Whit and visiting zoo friends show a glowing picture bubble of the snack they're craving.
 * - Drag the matching snack to the hungry friend OR simply tap it in the basket!
 * - Gentle Easy | Med | Hard difficulty (never punishing; soft golden hint if needed).
 * - Completing the picnic fills the star bar, drops +1 Star into Whit's Star Jar, and celebrates!
 */
export const JunglePicnicGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [guestIdx, setGuestIdx] = useState(0);
  const [ordersCompleted, setOrdersCompleted] = useState(0);
  const [order, setOrder] = useState<PicnicOrder>(() =>
    buildNextOrder(2, PICNIC_GUESTS[0], 0)
  );
  const [whitMood, setWhitMood] = useState<WhitMood>('wave');
  const [guestState, setGuestState] = useState<'idle' | 'calling' | 'celebrate'>('idle');
  const [hoverTarget, setHoverTarget] = useState<'whit' | 'guest' | null>(null);
  const [whitBurstKey, setWhitBurstKey] = useState<number | null>(null);
  const [guestBurstKey, setGuestBurstKey] = useState<number | null>(null);
  const [wiggleTick, setWiggleTick] = useState(0);
  const [hintActive, setHintActive] = useState(false);
  const [won, setWon] = useState(false);

  const whitRef = useRef<MeasurableNode>(null);
  const guestRef = useRef<MeasurableNode>(null);
  const whitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextOrderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guest = PICNIC_GUESTS[guestIdx % PICNIC_GUESTS.length];
  const goalCount = getGoalCount(difficulty);
  const hitPadding = isTablet ? 80 : 60;

  // On Easy, show 4 treats (always containing the active craving); on Med/Hard show all 6 treats
  const visibleTreats = useMemo<PicnicTreatMeta[]>(() => {
    if (difficulty > 1) return PICNIC_TREATS;
    const needed = [order.whitCraving, order.guestCraving].filter(Boolean) as PicnicTreatId[];
    const selected: PicnicTreatMeta[] = [];
    for (const id of needed) {
      const found = PICNIC_TREATS.find((t) => t.id === id);
      if (found && !selected.some((s) => s.id === found.id)) {
        selected.push(found);
      }
    }
    for (const t of PICNIC_TREATS) {
      if (selected.length >= 4) break;
      if (!selected.some((s) => s.id === t.id)) {
        selected.push(t);
      }
    }
    return PICNIC_TREATS.filter((t) => selected.some((s) => s.id === t.id));
  }, [difficulty, order.whitCraving, order.guestCraving]);

  // Softly highlight the needed treat after 5.5s so young toddlers never get stuck
  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintActive(false);
    if (won) return;
    hintTimerRef.current = setTimeout(() => {
      setHintActive(true);
    }, 5500);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [order, won]);

  useEffect(() => {
    return () => {
      if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
      if (nextOrderTimerRef.current) clearTimeout(nextOrderTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const startFreshGame = useCallback(
    (nextDiff: Difficulty, nextGuestIdx: number) => {
      if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
      if (nextOrderTimerRef.current) clearTimeout(nextOrderTimerRef.current);

      const safeGuestIdx = nextGuestIdx % PICNIC_GUESTS.length;
      const nextGuest = PICNIC_GUESTS[safeGuestIdx];
      setDifficulty(nextDiff);
      setGuestIdx(safeGuestIdx);
      setOrdersCompleted(0);
      setOrder(buildNextOrder(nextDiff, nextGuest, 0));
      setWhitMood('wave');
      setGuestState('idle');
      setHoverTarget(null);
      setHintActive(false);
      setWon(false);
    },
    []
  );

  const completeMatchedFeed = useCallback(
    (target: 'whit' | 'guest', treat: PicnicTreatMeta) => {
      if (won) return;
      soundEngine.unlock();
      soundEngine.playMunch();
      setHintActive(false);

      const recipientAnimal = target === 'whit' ? 'gorilla' : guest.animal;
      collectSticker(recipientAnimal);

      if (target === 'whit') {
        setWhitMood('cheer');
        setWhitBurstKey(Date.now());
        if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
        whitTimerRef.current = setTimeout(() => setWhitMood('wave'), 1050);
      } else {
        setGuestState('celebrate');
        setGuestBurstKey(Date.now() + 1);
        if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
        guestTimerRef.current = setTimeout(() => setGuestState('idle'), 1050);
      }

      setTimeout(() => {
        soundEngine.playYumSparkle();
        soundEngine.playAnimalSound(recipientAnimal);
        soundEngine.speakWord(`Yum! ${treat.label}!`);
      }, 210);

      const nextCompleted = ordersCompleted + 1;
      setOrdersCompleted(nextCompleted);

      // Clear the fulfilled craving immediately so it feels crisp and responsive
      const remainingOrder: PicnicOrder =
        target === 'whit'
          ? { whitCraving: null, guestCraving: order.guestCraving }
          : { whitCraving: order.whitCraving, guestCraving: null };
      setOrder(remainingOrder);

      if (nextCompleted >= goalCount) {
        if (nextOrderTimerRef.current) clearTimeout(nextOrderTimerRef.current);
        nextOrderTimerRef.current = setTimeout(() => {
          soundEngine.playWin();
          addStar(1);
          setWhitMood('cheer');
          setGuestState('celebrate');
          setWon(true);
        }, 560);
        return;
      }

      // If all active cravings in this turn are satisfied, serve up the next yummy craving!
      if (!remainingOrder.whitCraving && !remainingOrder.guestCraving) {
        if (nextOrderTimerRef.current) clearTimeout(nextOrderTimerRef.current);
        nextOrderTimerRef.current = setTimeout(() => {
          // Rotate to a fresh smiling zoo friend every 2 snacks to keep it exciting!
          const shouldRotateGuest = nextCompleted % 2 === 0;
          const nextGIdx = shouldRotateGuest
            ? (guestIdx + 1) % PICNIC_GUESTS.length
            : guestIdx;
          const nextGuestObj = PICNIC_GUESTS[nextGIdx];
          if (shouldRotateGuest) {
            setGuestIdx(nextGIdx);
          }
          setOrder(buildNextOrder(difficulty, nextGuestObj, nextCompleted, treat.id));
        }, 640);
      }
    },
    [won, guest.animal, collectSticker, ordersCompleted, order.guestCraving, order.whitCraving, goalCount, addStar, guestIdx, difficulty]
  );

  /** Gentle, zero-punishment nibble when a child feeds a non-craved snack */
  const playGentleNudge = useCallback((target: 'whit' | 'guest') => {
    soundEngine.unlock();
    soundEngine.playGentleBounce();
    setWiggleTick((t) => t + 1);
    setHintActive(true);
    if (target === 'whit') {
      setWhitMood('encourage');
      if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
      whitTimerRef.current = setTimeout(() => setWhitMood('wave'), 700);
    } else {
      setGuestState('calling');
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
      guestTimerRef.current = setTimeout(() => setGuestState('idle'), 700);
    }
  }, []);

  const handleAttemptFeed = useCallback(
    (target: 'whit' | 'guest', treat: PicnicTreatMeta) => {
      if (won) return;

      // Exact match to the targeted friend!
      if (target === 'whit' && order.whitCraving === treat.id) {
        completeMatchedFeed('whit', treat);
        return;
      }
      if (target === 'guest' && order.guestCraving === treat.id) {
        completeMatchedFeed('guest', treat);
        return;
      }

      // Extra-forgiving Easy & Med helper: if the child picked the exact craved treat
      // but dropped it on the friend sitting right next to them, share it happily!
      if (difficulty <= 2) {
        if (order.whitCraving === treat.id) {
          completeMatchedFeed('whit', treat);
          return;
        }
        if (order.guestCraving === treat.id) {
          completeMatchedFeed('guest', treat);
          return;
        }
      }

      // Gentle friendly reminder wiggle (never harsh!)
      playGentleNudge(target);
    },
    [won, order.whitCraving, order.guestCraving, difficulty, completeMatchedFeed, playGentleNudge]
  );

  const handleDragMove = useCallback(
    async (attempt: DropAttempt) => {
      const [wRect, gRect] = await Promise.all([
        measureNodeRect(whitRef.current),
        measureNodeRect(guestRef.current),
      ]);

      const nearWhit =
        wRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, wRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            wRect,
            hitPadding
          ));
      const nearGuest =
        gRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, gRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            gRect,
            hitPadding
          ));

      if (nearWhit) {
        setHoverTarget('whit');
      } else if (nearGuest) {
        setHoverTarget('guest');
      } else {
        setHoverTarget(null);
      }
    },
    [hitPadding]
  );

  const handleDropTreat = useCallback(
    async (treat: PicnicTreatMeta, attempt: DropAttempt): Promise<boolean> => {
      setHoverTarget(null);
      const [wRect, gRect] = await Promise.all([
        measureNodeRect(whitRef.current),
        measureNodeRect(guestRef.current),
      ]);

      const hitWhit =
        wRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, wRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            wRect,
            hitPadding
          ));
      const hitGuest =
        gRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, gRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            gRect,
            hitPadding
          ));

      if (hitWhit) {
        handleAttemptFeed('whit', treat);
        return false;
      }
      if (hitGuest) {
        handleAttemptFeed('guest', treat);
        return false;
      }
      return false;
    },
    [hitPadding, handleAttemptFeed]
  );

  // 1-tap treat feeding so young toddlers who tap instead of drag can always succeed!
  const handleTapTreat = useCallback(
    (treat: PicnicTreatMeta) => {
      if (won) return;
      if (order.whitCraving === treat.id) {
        completeMatchedFeed('whit', treat);
      } else if (order.guestCraving === treat.id) {
        completeMatchedFeed('guest', treat);
      } else {
        const hungryTarget = order.whitCraving ? 'whit' : 'guest';
        playGentleNudge(hungryTarget);
      }
    },
    [won, order.whitCraving, order.guestCraving, completeMatchedFeed, playGentleNudge]
  );

  const handleSelectGuest = (idx: number) => {
    const nextGuest = PICNIC_GUESTS[idx % PICNIC_GUESTS.length];
    soundEngine.unlock();
    soundEngine.playPop();
    soundEngine.speakWord(nextGuest.name);
    setTimeout(() => soundEngine.playAnimalSound(nextGuest.animal), 100);
    setGuestIdx(idx);
    collectSticker(nextGuest.animal);
    setGuestState('celebrate');
    if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    guestTimerRef.current = setTimeout(() => setGuestState('idle'), 850);
  };

  const whitSize = isTabletLandscape ? 196 : isTablet ? 186 : 144;
  const guestSize = isTabletLandscape ? 168 : isTablet ? 160 : 124;
  const blanketW = isTabletLandscape
    ? Math.min(540, width * 0.56)
    : isTablet
    ? Math.min(560, width - 80)
    : Math.min(370, width - 20);
  const blanketH = isTablet ? 136 : 104;
  const treatSize = isTablet ? 74 : 56;
  const cravingSize = isTablet ? 60 : 48;

  const whitHungry = Boolean(order.whitCraving);
  const guestHungry = Boolean(order.guestCraving);

  return (
    <View style={styles.container}>
      {/* Full-bleed Warm Watercolor Jungle Clearing */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgClearing}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Top Bar: Home + Picnic Order Stars + Easy/Med/Hard + Audio */}
      <GameHeader
        totalSteps={goalCount}
        completedSteps={ordersCompleted}
        difficulty={difficulty}
        onDifficultyChange={(d) => startFreshGame(d, guestIdx)}
      />

      <View
        style={[
          styles.playArea,
          isTabletLandscape && styles.playAreaLandscape,
        ]}
      >
        {/* Picnic Meadow Stage */}
        <View style={styles.picnicStageCol}>
          <View style={[styles.meadowStage, { width: blanketW }]}>
            {/* Checkered Storybook Picnic Blanket */}
            <View
              style={[
                styles.blanketWrap,
                { width: blanketW, height: blanketH },
              ]}
              pointerEvents="none"
            >
              <PicnicBlanketSvg width={blanketW} height={blanketH} />
            </View>

            {/* Whit & Visiting Zoo Friend sitting side-by-side on the blanket */}
            <View style={styles.friendsRow}>
              {/* Whit the Gorilla */}
              <View
                ref={(node) => {
                  whitRef.current = node;
                }}
                style={[
                  styles.friendSpot,
                  whitHungry && styles.friendSpotHungry,
                  hoverTarget === 'whit' && styles.friendSpotHover,
                ]}
              >
                {order.whitCraving && (
                  <View style={styles.cravingAnchorLeft}>
                    <CravingBubble
                      treat={order.whitCraving}
                      size={cravingSize}
                      wiggleTick={wiggleTick}
                      side="left"
                    />
                  </View>
                )}

                <WhitMascot
                  mood={hoverTarget === 'whit' ? 'happy' : whitMood}
                  size={whitSize}
                  interactive
                  cycleAccessoryOnTap
                />

                {whitBurstKey && (
                  <>
                    <FloatingYumHearts burstKey={whitBurstKey} size={whitSize} />
                    <View style={styles.burstCenter} pointerEvents="none">
                      <SnapBurst
                        key={whitBurstKey}
                        size={isTablet ? 160 : 124}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Visiting Zoo Friend */}
              <View
                ref={(node) => {
                  guestRef.current = node;
                }}
                style={[
                  styles.friendSpot,
                  guestHungry && styles.friendSpotHungry,
                  hoverTarget === 'guest' && styles.friendSpotHover,
                ]}
              >
                {order.guestCraving && (
                  <View style={styles.cravingAnchorRight}>
                    <CravingBubble
                      treat={order.guestCraving}
                      size={cravingSize}
                      wiggleTick={wiggleTick}
                      side="right"
                    />
                  </View>
                )}

                <AnimatedZooAnimal
                  state={
                    hoverTarget === 'guest'
                      ? 'calling'
                      : guestState !== 'idle'
                      ? guestState
                      : guestHungry
                      ? 'calling'
                      : 'idle'
                  }
                  size={guestSize}
                  seed={guestIdx + 3}
                  weight={getAnimalWeight(guest.animal)}
                  silentTap
                  onTap={() => {
                    soundEngine.playAnimalSound(guest.animal);
                    setGuestBurstKey(Date.now());
                  }}
                >
                  <ZooExhibitAnimalSvg
                    animal={guest.animal}
                    size={guestSize}
                    highlighted={guestHungry}
                  />
                </AnimatedZooAnimal>

                {guestBurstKey && (
                  <>
                    <FloatingYumHearts
                      burstKey={guestBurstKey}
                      size={guestSize}
                    />
                    <View style={styles.burstCenter} pointerEvents="none">
                      <SnapBurst
                        key={guestBurstKey}
                        size={isTablet ? 148 : 114}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Scrollable Visiting Friends Ribbon (lets kids invite any friend anytime!) */}
          <View
            style={[
              styles.guestPickerShell,
              isTabletLandscape && { maxWidth: blanketW },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.guestPickerRow}
            >
              {PICNIC_GUESTS.map((g, idx) => {
                const active = idx === guestIdx % PICNIC_GUESTS.length;
                const tabSz = isTablet ? 52 : 42;
                return (
                  <TactileButton
                    key={g.animal}
                    onPress={() => handleSelectGuest(idx)}
                    accessibilityLabel={`Invite ${g.name} to picnic`}
                    style={{ width: tabSz }}
                  >
                    <View
                      style={[
                        styles.guestTab,
                        {
                          width: tabSz,
                          height: tabSz,
                          borderRadius: tabSz / 2,
                          backgroundColor: g.badgeColor,
                        },
                        active && styles.guestTabActive,
                      ]}
                    >
                      <ZooExhibitAnimalSvg
                        animal={g.animal}
                        size={isTablet ? 40 : 32}
                      />
                    </View>
                  </TactileButton>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Soft Watercolor Picnic Basket Treat Dock (Drag OR Tap the matching snack!) */}
        <View
          style={[
            styles.basketDock,
            isTablet && styles.basketDockTablet,
            isTabletLandscape && styles.basketDockLandscape,
          ]}
        >
          <View style={styles.basketGloss} pointerEvents="none" />
          <View style={styles.basketHeaderRow}>
            <Text style={[styles.basketTitle, isTablet && { fontSize: 14 }]}>
              Match the snack bubble — drag or tap!
            </Text>
          </View>
          <View
            style={[
              styles.treatsGrid,
              isTablet && !isTabletLandscape && { maxWidth: 580 },
              isTabletLandscape && styles.treatsGridLandscape,
            ]}
          >
            {visibleTreats.map((treat) => {
              const isHinted =
                hintActive &&
                (order.whitCraving === treat.id || order.guestCraving === treat.id);
              return (
                <View
                  key={treat.id}
                  style={[
                    styles.treatSlot,
                    {
                      width: treatSize + (isTablet ? 16 : 12),
                      height: treatSize + (isTablet ? 16 : 12),
                    },
                  ]}
                >
                  <DraggablePiece
                    dragScale={1.16}
                    onDragMove={handleDragMove}
                    onDrop={(attempt) => handleDropTreat(treat, attempt)}
                    onTap={() => handleTapTreat(treat)}
                  >
                    <View
                      style={[
                        styles.treatPill,
                        {
                          width: treatSize + 8,
                          height: treatSize + 8,
                          borderRadius: (treatSize + 8) / 2,
                        },
                        isHinted && styles.treatPillHint,
                      ]}
                    >
                      <PicnicTreatSvg treat={treat.id} size={treatSize} />
                    </View>
                  </DraggablePiece>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startFreshGame(difficulty, guestIdx + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 12,
    paddingBottom: 16,
    overflow: 'visible',
  },
  playAreaLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 26,
    paddingBottom: 18,
  },
  picnicStageCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  meadowStage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 34,
    paddingBottom: 18,
    position: 'relative',
    overflow: 'visible',
  },
  blanketWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 5,
    overflow: 'visible',
  },
  friendSpot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    padding: 6,
    borderRadius: 999,
    overflow: 'visible',
  },
  friendSpotHungry: {
    backgroundColor: 'rgba(255, 245, 190, 0.28)',
  },
  friendSpotHover: {
    backgroundColor: 'rgba(255, 236, 140, 0.5)',
    transform: [{ scale: 1.05 }],
  },
  cravingAnchorLeft: {
    position: 'absolute',
    top: -22,
    left: -8,
    zIndex: 15,
  },
  cravingAnchorRight: {
    position: 'absolute',
    top: -22,
    right: -6,
    zIndex: 15,
  },
  cravingBubble: {
    backgroundColor: '#FFFDF5',
    borderWidth: 3,
    borderColor: '#E8A530',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8C5B18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },
  cravingDotLg: {
    position: 'absolute',
    bottom: -7,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFDF5',
    borderWidth: 2,
    borderColor: '#E8A530',
  },
  cravingDotSm: {
    position: 'absolute',
    bottom: -14,
    right: 3,
    width: 5.5,
    height: 5.5,
    borderRadius: 2.75,
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#E8A530',
  },
  heartsFloat: {
    position: 'absolute',
    top: -6,
    zIndex: 25,
  },
  burstCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  guestPickerShell: {
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.62)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  guestPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  guestTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  guestTabActive: {
    borderColor: COLORS.woodDark,
    borderWidth: 3.5,
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  /* Softly shaded watercolor Picnic Basket Treat Dock */
  basketDock: {
    width: '96%',
    maxWidth: 520,
    backgroundColor: 'rgba(246, 221, 174, 0.92)',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.36)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 48, 0.44)',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  basketDockTablet: {
    maxWidth: 640,
    borderRadius: 42,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  basketDockLandscape: {
    width: 318,
    maxWidth: 318,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  basketGloss: {
    position: 'absolute',
    top: 3,
    left: 24,
    right: 24,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.42)',
  },
  basketHeaderRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  basketTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.woodDark,
    opacity: 0.88,
  },
  treatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 276,
    gap: 10,
    overflow: 'visible',
  },
  treatsGridLandscape: {
    maxWidth: 300,
    gap: 12,
  },
  treatSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  treatPill: {
    backgroundColor: 'rgba(255, 252, 244, 0.94)',
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  treatPillHint: {
    backgroundColor: '#FFF7CE',
    borderColor: '#E8A530',
    borderWidth: 3.5,
    shadowColor: '#E8A530',
    shadowOpacity: 0.42,
    shadowRadius: 10,
    transform: [{ scale: 1.07 }],
  },
});
