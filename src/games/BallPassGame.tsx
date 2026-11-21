import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import {
  JungleClearingBackdrop,
  JungleGoalArchSvg,
  JungleSoccerPitch,
} from '../components/JungleSoccerPitch';
import { SnapBurst } from '../components/SnapBurst';
import { WhitMascot, WhitMood } from '../components/WhitMascot';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

const GOAL_ANIMALS: ExhibitAnimalKind[] = ['lion', 'elephant', 'giraffe', 'panda'];
const GOALS_TO_WIN = 4;

type BallPhase = 'ready' | 'dragging' | 'flying' | 'returning' | 'scored';
type DragKind = 'pending_ball' | 'dribble' | 'slingshot' | 'aim';

interface GoalSpec {
  id: number;
  baseXPct: number;
  yPct: number;
  animal: ExhibitAnimalKind;
}

interface BumperSpec {
  id: string;
  xPct: number;
  yPct: number;
  rPx: number;
}

interface PathStar {
  id: string;
  xPct: number;
  yPct: number;
  collected: boolean;
}

interface TrailPoint {
  x: number;
  y: number;
}

interface AimVisual {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isSlingshot: boolean;
  anchorX: number;
  anchorY: number;
  lockedGoalId: number | null;
}

function buildGoals(difficulty: Difficulty, roundSeed: number): GoalSpec[] {
  const rot = (offset: number) =>
    GOAL_ANIMALS[(roundSeed + offset) % GOAL_ANIMALS.length];
  if (difficulty === 1) {
    return [{ id: 0, baseXPct: 50, yPct: 18, animal: rot(0) }];
  }
  return [
    { id: 0, baseXPct: 20, yPct: 22, animal: rot(0) },
    { id: 1, baseXPct: 50, yPct: 15, animal: rot(1) },
    { id: 2, baseXPct: 80, yPct: 22, animal: rot(2) },
  ];
}

/**
 * Place bouncy mushroom bumpers so they NEVER dead-block the straight lane to
 * the waving target animal, while staying fun for bank shots & boings!
 */
function buildBumpers(
  difficulty: Difficulty,
  isTablet: boolean,
  targetGoalBaseXPct: number,
  targetGoalIdx: number
): BumperSpec[] {
  const rPx = isTablet ? 33 : 24;
  if (difficulty === 1) return [];
  if (difficulty === 2) {
    // Keep the lane to the waving animal cleanly open!
    let xPct = 50;
    if (targetGoalBaseXPct < 35) {
      xPct = 58;
    } else if (targetGoalBaseXPct > 65) {
      xPct = 42;
    } else {
      xPct = targetGoalIdx % 2 === 0 ? 31 : 69;
    }
    return [{ id: 'mush-mid', xPct, yPct: 49, rPx }];
  }
  return [
    { id: 'mush-left', xPct: 31, yPct: 48, rPx },
    { id: 'mush-right', xPct: 69, yPct: 48, rPx },
  ];
}

function buildStars(targetXPct: number, targetYPct: number): PathStar[] {
  const startX = 50;
  const startY = 70;
  return [0.34, 0.62].map((t, i) => ({
    id: `star-${i}-${Date.now()}`,
    xPct: startX + (targetXPct - startX) * t,
    yPct: startY + (targetYPct - startY) * t,
    collected: false,
  }));
}

/** Crisp circular Warm Watercolor & Gouache jungle soccer ball */
const WatercolorJungleBall: React.FC<{ size: number }> = React.memo(({ size }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
    }}
  >
    <Image
      source={STORYBOOK_ASSETS.jungleBall}
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  </View>
));

/** Soft gouache-shaded spotted storybook jungle mushroom bumper (zero SVG gradients) */
const MushroomBumperSvg: React.FC<{ size: number; boingTick: number }> = React.memo(
  ({ size, boingTick }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (!boingTick) return;
      scale.setValue(0.74);
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 240,
        useNativeDriver: true,
      }).start();
    }, [boingTick, scale]);

    return (
      <Animated.View style={{ transform: [{ scale }] }} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Ellipse cx="50" cy="87" rx="30" ry="8.5" fill="rgba(44, 78, 38, 0.24)" />
          <Path
            d="M 38 56 L 34 83 Q 50 91 66 83 L 62 56 Z"
            fill="#F5E6C8"
            stroke="#6A4D38"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Path
            d="M 11 56 C 11 23 30 11 50 11 C 70 11 89 23 89 56 C 72 64 28 64 11 56 Z"
            fill="#DF7258"
            stroke="#6A4D38"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Ellipse
            cx="36"
            cy="24"
            rx="14"
            ry="6"
            fill="#FFE8D6"
            opacity="0.38"
            transform="rotate(-18 36 24)"
          />
          <Circle cx="34" cy="35" r="7.5" fill="#FFF7E4" opacity="0.92" />
          <Circle cx="59" cy="29" r="9" fill="#FFF7E4" opacity="0.92" />
          <Circle cx="72" cy="46" r="5.5" fill="#FFF7E4" opacity="0.88" />
          <Circle cx="26" cy="48" r="4.8" fill="#FFF7E4" opacity="0.88" />
        </Svg>
      </Animated.View>
    );
  }
);

/** Bouncing golden pointer above the active target animal's goal */
const TargetGoalPointer: React.FC<{ isTablet: boolean }> = React.memo(({ isTablet }) => {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -7,
          duration: 480,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 480,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const sz = isTablet ? 30 : 24;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: isTablet ? -26 : -21,
        transform: [{ translateY: bob }],
        zIndex: 20,
      }}
    >
      <Svg width={sz} height={sz} viewBox="0 0 32 32">
        <Path
          d="M 16 27 L 5 12 Q 4 10 6.5 10 L 12 10 L 12 4.5 Q 12 3 13.5 3 L 18.5 3 Q 20 3 20 4.5 L 20 10 L 25.5 10 Q 28 10 27 12 Z"
          fill="#FFE066"
          stroke="#6A4822"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
});

/** Zoo animal standing by its goal: idle breathing, calling double-hop, or celebrate */
const GoalAnimal: React.FC<{
  animal: ExhibitAnimalKind;
  size: number;
  seed: number;
  isTarget: boolean;
  isCelebrating: boolean;
}> = React.memo(({ animal, size, seed, isTarget, isCelebrating }) => {
  const animState = isCelebrating ? 'celebrate' : isTarget ? 'calling' : 'idle';
  return (
    <View pointerEvents="none">
      <AnimatedZooAnimal
        state={animState}
        size={size}
        seed={seed}
        weight={getAnimalWeight(animal)}
      >
        <ZooExhibitAnimalSvg
          animal={animal}
          size={size}
          highlighted={isTarget || isCelebrating}
        />
      </AnimatedZooAnimal>
    </View>
  );
});

/** Soft expanding golden touch ripple on the grass */
const TapRipple: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tapRipple,
        {
          left: x - 28,
          top: y - 28,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1.8] }),
            },
          ],
        },
      ]}
    />
  );
};

/** Floating celebratory "GOAL!" pill badge when scoring */
const GoalBannerPop: React.FC<{ x: number; y: number; fieldW: number }> = ({
  x,
  y,
  fieldW,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 1,
        friction: 4.5,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.delay(340),
      Animated.timing(fade, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [anim, fade]);

  const clampedX = Math.max(76, Math.min(fieldW - 76, x));
  const clampedY = Math.max(24, y - 34);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.goalBanner,
        {
          left: clampedX - 66,
          top: clampedY,
          opacity: fade,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [18, -12],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.goalBannerText}>⭐ GOAL! ⭐</Text>
    </Animated.View>
  );
};

function resolveDomElement(node: unknown): HTMLElement | null {
  if (!node) return null;
  const raw = node as {
    addEventListener?: HTMLElement['addEventListener'];
    getBoundingClientRect?: () => DOMRect;
    getNode?: () => HTMLElement;
  };
  if (typeof raw.getBoundingClientRect === 'function') {
    return raw as unknown as HTMLElement;
  }
  if (typeof raw.getNode === 'function') {
    return raw.getNode();
  }
  return null;
}

/**
 * Jungle Ball Pass:
 * - Super-responsive multi-modal toddler touch controls:
 *   1. Grab & dribble/push the ball straight across the grass — or flick it!
 *   2. Pull the ball back like a slingshot and let go!
 *   3. Simply tap any waving animal or swipe anywhere on the field!
 * - Zero dead time: rapid re-kicks, instant return interruption, multi-touch palm handoff.
 * - Every animal reacts playfully; waving target animal triggers full GOAL celebration!
 */
export const BallPassGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundSeed, setRoundSeed] = useState(0);
  const [goalsScored, setGoalsScored] = useState(0);
  const [targetGoalIdx, setTargetGoalIdx] = useState(1);
  const [celebratingGoalId, setCelebratingGoalId] = useState<number | null>(null);
  const [mascotMood, setMascotMood] = useState<WhitMood>('wave');
  const [won, setWon] = useState(false);

  const [fieldSize, setFieldSize] = useState({
    w: Math.max(320, width),
    h: Math.max(420, height - 96),
  });

  const goals = useMemo(() => buildGoals(difficulty, roundSeed), [difficulty, roundSeed]);
  const activeGoal = goals[targetGoalIdx % goals.length] || goals[0];
  const bumpers = useMemo(
    () => buildBumpers(difficulty, isTablet, activeGoal.baseXPct, targetGoalIdx),
    [difficulty, isTablet, activeGoal.baseXPct, targetGoalIdx]
  );

  const [stars, setStars] = useState<PathStar[]>(() =>
    buildStars(activeGoal.baseXPct, activeGoal.yPct)
  );
  const [boingMap, setBoingMap] = useState<Record<string, number>>({});
  const [burstPos, setBurstPos] = useState<{
    x: number;
    y: number;
    tick: number;
    isGoal: boolean;
  } | null>(null);
  const [tapRipple, setTapRipple] = useState<{
    x: number;
    y: number;
    tick: number;
  } | null>(null);

  const ballStartX = fieldSize.w * 0.5;
  const ballStartY = fieldSize.h * 0.7;
  const ballRadius = isTablet ? 36 : 26;

  // Breathing halo when ball is ready to invite touch
  const readyPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(readyPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(readyPulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [readyPulse]);

  // Physics ref driven at 60fps
  const physRef = useRef({
    x: ballStartX,
    y: ballStartY,
    vx: 0,
    vy: 0,
    rot: 0,
    phase: 'ready' as BallPhase,
    swayTime: 0,
    goalSwayOffsetPx: 0,
    kickScale: 1,
    flightTime: 0,
    returnStartX: ballStartX,
    returnStartY: ballStartY,
    returnT: 0,
    trail: [] as TrailPoint[],
    trailTick: 0,
    lastOtherGoalHitAt: 0,
  });

  const [ballRender, setBallRender] = useState({
    x: ballStartX,
    y: ballStartY,
    rot: 0,
    swayOffsetPx: 0,
    scale: 1,
    phase: 'ready' as BallPhase,
    trail: [] as TrailPoint[],
  });

  const [aimVisual, setAimVisual] = useState<AimVisual | null>(null);
  const aimRef = useRef<AimVisual | null>(null);
  const aimDirtyRef = useRef(false);

  const setAimBuffered = useCallback((next: AimVisual | null) => {
    aimRef.current = next;
    aimDirtyRef.current = true;
  }, []);

  const starsRef = useRef(stars);
  starsRef.current = stars;
  const fieldRef = useRef(fieldSize);
  fieldRef.current = fieldSize;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;
  const goalsRef = useRef(goals);
  goalsRef.current = goals;
  const activeGoalRef = useRef(activeGoal);
  activeGoalRef.current = activeGoal;
  const bumpersRef = useRef(bumpers);
  bumpersRef.current = bumpers;
  const wonRef = useRef(won);
  wonRef.current = won;
  const goalsScoredRef = useRef(goalsScored);
  goalsScoredRef.current = goalsScored;
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonTargetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (nonTargetTimerRef.current) {
      clearTimeout(nonTargetTimerRef.current);
      nonTargetTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const getGoalCenter = useCallback((g: GoalSpec) => {
    const f = fieldRef.current;
    const isTarget = g.id === activeGoalRef.current.id;
    return {
      x: (g.baseXPct / 100) * f.w + (isTarget ? physRef.current.goalSwayOffsetPx : 0),
      y: (g.yPct / 100) * f.h,
    };
  }, []);

  const resetBallToWhit = useCallback(() => {
    const f = fieldRef.current;
    const p = physRef.current;
    p.x = f.w * 0.5;
    p.y = f.h * 0.7;
    p.vx = 0;
    p.vy = 0;
    p.phase = 'ready';
    p.kickScale = 1;
    p.flightTime = 0;
    p.trail = [];
    setBallRender((prev) => ({
      ...prev,
      x: p.x,
      y: p.y,
      scale: 1,
      phase: 'ready',
      trail: [],
    }));
  }, []);

  const beginSmoothReturn = useCallback((playSoftBounce = false) => {
    const p = physRef.current;
    if (p.phase === 'scored' || p.phase === 'returning' || p.phase === 'ready') return;
    p.phase = 'returning';
    p.returnStartX = p.x;
    p.returnStartY = p.y;
    p.returnT = 0;
    p.vx = 0;
    p.vy = 0;
    p.trail = [];
    if (playSoftBounce) {
      soundEngine.playGentleBounce();
    }
  }, []);

  const advanceTarget = useCallback(
    (nextScored: number, nextDiff: Difficulty = diffRef.current) => {
      const nextGoals = buildGoals(nextDiff, roundSeed);
      const nextIdx =
        nextGoals.length <= 1
          ? 0
          : (targetGoalIdx + 1 + Math.floor(Math.random() * (nextGoals.length - 1))) %
            nextGoals.length;
      const g = nextGoals[nextIdx];
      setCelebratingGoalId(null);
      setBurstPos(null);
      setTargetGoalIdx(nextIdx);
      setStars(buildStars(g.baseXPct, g.yPct));
      resetBallToWhit();

      if (nextScored >= GOALS_TO_WIN) {
        setTimeout(() => {
          soundEngine.playWin();
          addStar(1);
          setMascotMood('cheer');
          setWon(true);
        }, 380);
      }
    },
    [roundSeed, targetGoalIdx, resetBallToWhit, addStar]
  );

  const startFreshGame = useCallback(
    (nextDiff: Difficulty, nextSeed: number) => {
      clearTimers();
      const nextGoals = buildGoals(nextDiff, nextSeed);
      const startIdx = nextGoals.length > 1 ? 1 : 0;
      setDifficulty(nextDiff);
      setRoundSeed(nextSeed);
      setGoalsScored(0);
      setCelebratingGoalId(null);
      setBurstPos(null);
      setTargetGoalIdx(startIdx);
      setStars(buildStars(nextGoals[startIdx].baseXPct, nextGoals[startIdx].yPct));
      setWon(false);
      setMascotMood('wave');
      aimRef.current = null;
      aimDirtyRef.current = false;
      setAimVisual(null);
      physRef.current.swayTime = 0;
      physRef.current.goalSwayOffsetPx = 0;
      resetBallToWhit();
    },
    [clearTimers, resetBallToWhit]
  );

  useEffect(() => {
    if (physRef.current.phase === 'ready') {
      resetBallToWhit();
    }
  }, [fieldSize.w, fieldSize.h, resetBallToWhit]);

  /** Collect any golden path stars touched by the ball */
  const collectTouchedStars = useCallback(
    (bx: number, by: number) => {
      const f = fieldRef.current;
      let changed = false;
      const updated = starsRef.current.map((st, idx) => {
        if (st.collected) return st;
        const sx = (st.xPct / 100) * f.w;
        const sy = (st.yPct / 100) * f.h;
        if (Math.hypot(bx - sx, by - sy) < ballRadius + 30) {
          changed = true;
          soundEngine.playStarCollect(idx);
          return { ...st, collected: true };
        }
        return st;
      });
      if (changed) {
        starsRef.current = updated;
        setStars(updated);
      }
    },
    [ballRadius]
  );

  /** Trigger full goal celebration on the active target goal */
  const triggerGoalScored = useCallback(
    (goalX: number, goalY: number) => {
      const p = physRef.current;
      if (p.phase === 'scored' || wonRef.current) return;
      p.phase = 'scored';
      p.vx = 0;
      p.vy = 0;
      p.x = goalX + (isTablet ? 34 : 24);
      p.y = goalY + (isTablet ? 14 : 10);
      p.trail = [];
      p.kickScale = 0.84;

      const animal = activeGoalRef.current.animal;
      const goalId = activeGoalRef.current.id;

      soundEngine.playGoalCheer();
      setTimeout(() => soundEngine.playAnimalSound(animal), 160);
      collectSticker(animal);

      aimRef.current = null;
      aimDirtyRef.current = false;
      setAimVisual(null);
      setBurstPos({ x: goalX, y: goalY, tick: Date.now(), isGoal: true });
      setCelebratingGoalId(goalId);
      const nextScored = goalsScoredRef.current + 1;
      setGoalsScored(nextScored);
      setMascotMood('cheer');

      clearTimers();
      advanceTimerRef.current = setTimeout(() => {
        if (nextScored < GOALS_TO_WIN) {
          setMascotMood('wave');
        }
        advanceTarget(nextScored);
      }, 880);
    },
    [advanceTarget, clearTimers, collectSticker, isTablet]
  );

  /** Playful catch & pass-back when kicking to a non-target animal */
  const triggerFriendlyPassBack = useCallback(
    (other: GoalSpec, gx: number, gy: number) => {
      const p = physRef.current;
      const now = Date.now();
      if (now - p.lastOtherGoalHitAt < 500) return;
      p.lastOtherGoalHitAt = now;
      soundEngine.playAnimalSound(other.animal);
      setBurstPos({ x: gx, y: gy, tick: now, isGoal: false });
      setCelebratingGoalId(other.id);
      if (nonTargetTimerRef.current) clearTimeout(nonTargetTimerRef.current);
      nonTargetTimerRef.current = setTimeout(() => {
        setCelebratingGoalId((prev) => (prev === other.id ? null : prev));
      }, 480);
      beginSmoothReturn(false);
    },
    [beginSmoothReturn]
  );

  /** Check goal collisions (used both in flight AND while dribbling!) */
  const checkGoalCollisions = useCallback(
    (bx: number, by: number): boolean => {
      const diff = diffRef.current;
      const target = activeGoalRef.current;
      const targetPos = getGoalCenter(target);
      const targetHitR = diff === 1 ? (isTablet ? 96 : 82) : isTablet ? 78 : 66;

      if (Math.hypot(bx - targetPos.x, by - targetPos.y) < targetHitR) {
        triggerGoalScored(targetPos.x, targetPos.y);
        return true;
      }

      // Check non-target animals so every goal feels alive!
      const otherHitR = isTablet ? 62 : 50;
      for (const g of goalsRef.current) {
        if (g.id === target.id) continue;
        const pos = getGoalCenter(g);
        if (Math.hypot(bx - pos.x, by - pos.y) < otherHitR) {
          triggerFriendlyPassBack(g, pos.x, pos.y);
          return true;
        }
      }
      return false;
    },
    [getGoalCenter, isTablet, triggerFriendlyPassBack, triggerGoalScored]
  );

  const kickBallAlong = useCallback(
    (dirX: number, dirY: number, speedOverride?: number) => {
      const p = physRef.current;
      if (p.phase === 'scored' || wonRef.current) return;

      soundEngine.unlock();
      soundEngine.playKick();

      let dx = dirX;
      let dy = dirY;
      const rawLen = Math.hypot(dx, dy);

      if (rawLen < 6) {
        // Default gentle pass straight toward the waving animal
        const tp = getGoalCenter(activeGoalRef.current);
        dx = tp.x - p.x;
        dy = tp.y - p.y;
      }

      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / len;
      // Ensure kicks always travel forward/upfield joyfully
      const ny = Math.min(-0.34, dy / len);
      const norm = Math.hypot(nx, ny);

      const baseSpeed = isTablet ? 470 : 390;
      const minSpeed = isTablet ? 400 : 330;
      const maxSpeed = isTablet ? 600 : 490;
      const speed = speedOverride
        ? Math.max(minSpeed, Math.min(maxSpeed, speedOverride))
        : baseSpeed;

      p.vx = (nx / norm) * speed;
      p.vy = (ny / norm) * speed;
      p.phase = 'flying';
      p.flightTime = 0;
      p.kickScale = 1.2;
      p.trail = [{ x: p.x, y: p.y }];
      p.trailTick = 0;
      setMascotMood('happy');
    },
    [getGoalCenter, isTablet]
  );

  /** Find which goal (if any) a ray from (fromX, fromY) -> (toX, toY) is aimed near */
  const findAimedGoalId = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number): number | null => {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const len = Math.hypot(dx, dy);
      if (len < 8 || dy > -10) return null;
      const ux = dx / len;
      const uy = dy / len;

      let bestId: number | null = null;
      let bestDot = 0.91;
      for (const g of goalsRef.current) {
        const pos = getGoalCenter(g);
        const gx = pos.x - fromX;
        const gy = pos.y - fromY;
        const gLen = Math.hypot(gx, gy);
        if (gLen < 1) continue;
        const dot = (ux * gx + uy * gy) / gLen;
        if (dot > bestDot) {
          bestDot = dot;
          bestId = g.id;
        }
      }
      return bestId;
    },
    [getGoalCenter]
  );

  // 60fps smooth physics, aim-assist, comet trail, & calm smooth return loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const p = physRef.current;
      const f = fieldRef.current;
      const diff = diffRef.current;
      const g = activeGoalRef.current;

      // Hard mode: gently sway the target goal left & right
      if (diff === 3 && !wonRef.current) {
        p.swayTime += dt;
        const maxSway = Math.min(68, f.w * 0.1);
        p.goalSwayOffsetPx = Math.sin(p.swayTime * 1.2) * maxSway;
      } else {
        p.goalSwayOffsetPx = 0;
      }

      // Smoothly relax kick squash/pop scale back to resting scale
      const restScale = p.phase === 'scored' ? 0.84 : 1;
      if (Math.abs(p.kickScale - restScale) > 0.005) {
        p.kickScale += (restScale - p.kickScale) * Math.min(1, dt * 12);
      } else {
        p.kickScale = restScale;
      }

      if (p.phase === 'flying') {
        p.flightTime += dt;
        const goalX = (g.baseXPct / 100) * f.w + p.goalSwayOffsetPx;
        const goalY = (g.yPct / 100) * f.h;

        // Generous magnetic aim-assist toward the target goal when heading upward
        const toGoalX = goalX - p.x;
        const toGoalY = goalY - p.y;
        const distToGoal = Math.hypot(toGoalX, toGoalY);
        const speed = Math.hypot(p.vx, p.vy);

        if (speed > 60 && p.vy < 0 && distToGoal > 10) {
          const dirDot = (p.vx * toGoalX + p.vy * toGoalY) / (speed * distToGoal);
          const assistThreshold = diff === 1 ? 0.28 : diff === 2 ? 0.56 : 0.68;
          if (dirDot > assistThreshold) {
            const steerStrength = diff === 1 ? 6.8 : diff === 2 ? 4.4 : 2.9;
            const desiredVx = (toGoalX / distToGoal) * speed;
            const desiredVy = (toGoalY / distToGoal) * speed;
            p.vx += (desiredVx - p.vx) * Math.min(1, steerStrength * dt);
            p.vy += (desiredVy - p.vy) * Math.min(1, steerStrength * dt);
          }
        }

        // Integrate position & gentle grass friction so calm kicks glide into the net
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const friction = Math.pow(0.992, dt * 60);
        p.vx *= friction;
        p.vy *= friction;
        p.rot += (p.vx * 0.65 + Math.abs(p.vy) * 0.45) * dt;

        // Soft comet trail sampling
        p.trailTick += dt;
        if (p.trailTick >= 0.036) {
          p.trailTick = 0;
          p.trail = [{ x: p.x, y: p.y }, ...p.trail].slice(0, 5);
        }

        // Elastic side & top bounds
        const pad = ballRadius + 8;
        let hitTopWall = false;
        if (p.x < pad) {
          p.x = pad;
          p.vx = Math.abs(p.vx) * 0.82;
          soundEngine.playPop();
        } else if (p.x > f.w - pad) {
          p.x = f.w - pad;
          p.vx = -Math.abs(p.vx) * 0.82;
          soundEngine.playPop();
        }
        if (p.y < pad) {
          p.y = pad;
          p.vy = Math.abs(p.vy) * 0.68;
          hitTopWall = true;
          soundEngine.playPop();
        }

        // Bouncy Mushroom Bumper collisions (playful gentle pinball bounce!)
        for (const bmp of bumpersRef.current) {
          const bx = (bmp.xPct / 100) * f.w;
          const by = (bmp.yPct / 100) * f.h;
          const dx = p.x - bx;
          const dy = p.y - by;
          const dist = Math.hypot(dx, dy);
          const minDist = ballRadius + bmp.rPx;
          if (dist < minDist && dist > 0.1) {
            const nx = dx / dist;
            const ny = dy / dist;
            p.x = bx + nx * (minDist + 3);
            p.y = by + ny * (minDist + 3);
            const dot = p.vx * nx + p.vy * ny;
            p.vx = (p.vx - 2 * dot * nx) * 1.02;
            p.vy = (p.vy - 2 * dot * ny) * 1.02;

            if (p.vy > -90 && dy > 0) {
              const side = dx >= 0 ? 1 : -1;
              p.vx = side * Math.max(220, Math.abs(p.vx) + 120);
              p.vy = -310;
            }
            const spd = Math.hypot(p.vx, p.vy);
            if (spd < 320) {
              p.vx = (p.vx / Math.max(1, spd)) * 340;
              p.vy = (p.vy / Math.max(1, spd)) * 340;
            }
            p.kickScale = 1.18;
            soundEngine.playBoing();
            setBoingMap((prev) => ({ ...prev, [bmp.id]: Date.now() }));
          }
        }

        // Collect golden path stars
        collectTouchedStars(p.x, p.y);

        // Check goal collisions (active target OR friendly neighbor!)
        const hitGoal = checkGoalCollisions(p.x, p.y);
        if (!hitGoal && p.phase === 'flying') {
          const currSpeed = Math.hypot(p.vx, p.vy);
          const returningDown =
            (p.vy > 70 && p.y > f.h * 0.44) ||
            (hitTopWall && p.flightTime > 0.55);
          if (
            currSpeed < 95 ||
            p.y > f.h * 0.78 ||
            p.flightTime > 2.6 ||
            returningDown
          ) {
            setMascotMood('encourage');
            setTimeout(() => setMascotMood('wave'), 380);
            beginSmoothReturn(true);
          }
        }
      } else if (p.phase === 'returning') {
        // Smooth, calm 0.52s ease-out roll back to Whit's feet
        p.returnT = Math.min(1, p.returnT + dt / 0.52);
        const ease = 1 - Math.pow(1 - p.returnT, 3);
        const targetX = f.w * 0.5;
        const targetY = f.h * 0.7;
        const prevX = p.x;
        const prevY = p.y;
        p.x = p.returnStartX + (targetX - p.returnStartX) * ease;
        p.y = p.returnStartY + (targetY - p.returnStartY) * ease;
        p.rot += Math.hypot(p.x - prevX, p.y - prevY) * 1.1;
        if (p.returnT >= 1) {
          p.x = targetX;
          p.y = targetY;
          p.phase = 'ready';
        }
      }

      if (aimDirtyRef.current) {
        aimDirtyRef.current = false;
        setAimVisual(aimRef.current);
      }

      setBallRender((prev) => {
        if (
          prev.phase === p.phase &&
          prev.trail.length === p.trail.length &&
          Math.abs(prev.x - p.x) < 0.25 &&
          Math.abs(prev.y - p.y) < 0.25 &&
          Math.abs(prev.rot - p.rot) < 0.5 &&
          Math.abs(prev.scale - p.kickScale) < 0.008 &&
          Math.abs(prev.swayOffsetPx - p.goalSwayOffsetPx) < 0.25
        ) {
          return prev;
        }
        return {
          x: p.x,
          y: p.y,
          rot: p.rot,
          swayOffsetPx: p.goalSwayOffsetPx,
          scale: p.kickScale,
          phase: p.phase,
          trail: p.trail,
        };
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [ballRadius, beginSmoothReturn, checkGoalCollisions, collectTouchedStars]);

  // =========================================================================
  // UNIFIED MULTI-MODAL TOUCH ENGINE (Direct Dribble/Flick + Slingshot + Tap)
  // =========================================================================
  interface ActiveGesture {
    mode: 'touch' | 'pointer' | 'native';
    id: number;
    kind: DragKind;
    start: { x: number; y: number };
    last: { x: number; y: number };
    maxTravel: number;
    startedAt: number;
    hasDribbledUp: boolean;
    samples: { x: number; y: number; t: number }[];
  }

  const gestureRef = useRef<ActiveGesture | null>(null);
  const lastTouchEndRef = useRef<number>(0);
  const winCleanupRef = useRef<(() => void) | null>(null);
  const fieldDomRef = useRef<HTMLElement | null>(null);
  const [fieldDomNode, setFieldDomNode] = useState<HTMLElement | null>(null);

  const handleFieldRef = useCallback((node: React.ComponentRef<typeof View> | null) => {
    if (Platform.OS !== 'web') return;
    const el = resolveDomElement(node);
    fieldDomRef.current = el;
    setFieldDomNode((prev) => (prev === el ? prev : el));
  }, []);

  const getLocalCoords = useCallback((clientX: number, clientY: number) => {
    const rect = fieldDomRef.current?.getBoundingClientRect?.();
    if (rect) {
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    return { x: clientX, y: clientY };
  }, []);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  const startGesture = useCallback(
    (
      mode: 'touch' | 'pointer' | 'native',
      id: number,
      pt: { x: number; y: number }
    ): boolean => {
      if (wonRef.current) return false;
      const p = physRef.current;
      if (p.phase === 'scored') return false;

      soundEngine.unlock();
      const f = fieldRef.current;
      const grabR = ballRadius * 3.1;
      const distToCurrentBall = Math.hypot(pt.x - p.x, pt.y - p.y);
      const homeX = f.w * 0.5;
      const homeY = f.h * 0.7;

      // Never swallow a touch when returning or bouncing back!
      if (p.phase === 'returning') {
        p.x = homeX;
        p.y = homeY;
        p.vx = 0;
        p.vy = 0;
        p.phase = 'ready';
      } else if (p.phase === 'flying') {
        if (distToCurrentBall <= grabR) {
          // Live mid-field catch / re-kick!
          p.vx = 0;
          p.vy = 0;
          p.trail = [];
        } else if (p.vy > 0 || p.flightTime > 0.55) {
          // Ball already missed or slowed — snap ready immediately!
          p.x = homeX;
          p.y = homeY;
          p.vx = 0;
          p.vy = 0;
          p.trail = [];
          p.phase = 'ready';
        } else {
          // Ball is actively zooming upward right after a kick; don't yank it mid-shot
          return false;
        }
      }

      const nearBall = Math.hypot(pt.x - p.x, pt.y - p.y) <= grabR;
      const now = performance.now();

      const kind: DragKind = nearBall ? 'pending_ball' : 'aim';
      if (nearBall) {
        p.phase = 'dragging';
        p.kickScale = 1.12;
        soundEngine.playPop();
      } else {
        setTapRipple({ x: pt.x, y: pt.y, tick: Date.now() });
      }

      gestureRef.current = {
        mode,
        id,
        kind,
        start: pt,
        last: pt,
        maxTravel: 0,
        startedAt: now,
        hasDribbledUp: false,
        samples: [{ x: pt.x, y: pt.y, t: now }],
      };

      // Preview aim immediately for non-ball touches pointing upfield
      if (!nearBall && pt.y < p.y - 12) {
        const locked = findAimedGoalId(p.x, p.y, pt.x, pt.y);
        setAimBuffered({
          fromX: p.x,
          fromY: p.y,
          toX: pt.x,
          toY: pt.y,
          isSlingshot: false,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: locked,
        });
      } else {
        setAimBuffered(null);
      }
      return true;
    },
    [ballRadius, findAimedGoalId, setAimBuffered]
  );

  const moveGesture = useCallback(
    (pt: { x: number; y: number }) => {
      const g = gestureRef.current;
      if (!g) return;
      const p = physRef.current;
      if (p.phase === 'scored' || p.phase === 'returning') {
        gestureRef.current = null;
        setAimBuffered(null);
        return;
      }
      if (g.kind !== 'aim' && p.phase !== 'dragging') {
        gestureRef.current = null;
        setAimBuffered(null);
        return;
      }

      const f = fieldRef.current;
      const homeX = f.w * 0.5;
      const homeY = f.h * 0.7;
      const now = performance.now();

      const travel = Math.hypot(pt.x - g.start.x, pt.y - g.start.y);
      if (travel > g.maxTravel) g.maxTravel = travel;
      g.samples.push({ x: pt.x, y: pt.y, t: now });
      const cutoff = now - 120;
      while (g.samples.length > 2 && g.samples[0].t < cutoff) {
        g.samples.shift();
      }

      const swipeDx = pt.x - g.start.x;
      const swipeDy = pt.y - g.start.y;
      const stepDx = pt.x - g.last.x;
      const stepDy = pt.y - g.last.y;

      // Lock ball gesture cleanly once finger moves > 14px so it NEVER flips back & forth!
      if (g.kind === 'pending_ball' && travel >= 14) {
        if (swipeDy > 14 && Math.abs(p.y - homeY) < 40) {
          g.kind = 'slingshot';
        } else {
          g.kind = 'dribble';
        }
      }

      if (g.kind === 'slingshot') {
        const pullDist = Math.min(48, Math.hypot(swipeDx, swipeDy));
        const pullAngle = Math.atan2(Math.max(10, swipeDy), swipeDx);
        p.x = homeX + Math.cos(pullAngle) * pullDist;
        p.y = homeY + Math.sin(pullAngle) * pullDist;
        p.kickScale = 1.06 + (pullDist / 48) * 0.1;

        const aimLen = Math.min(f.h * 0.48, 120 + pullDist * 3.8);
        const toX = Math.max(20, Math.min(f.w - 20, homeX - Math.cos(pullAngle) * aimLen));
        const toY = Math.max(24, Math.min(homeY - 36, homeY - Math.sin(pullAngle) * aimLen));
        setAimBuffered({
          fromX: homeX,
          fromY: homeY,
          toX,
          toY,
          isSlingshot: true,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: findAimedGoalId(homeX, homeY, toX, toY),
        });
      } else if (g.kind === 'dribble') {
        // Delta movement keeps the ball silky-smooth with ZERO teleport on initial grab!
        const pad = ballRadius + 10;
        const nextX = Math.max(pad, Math.min(f.w - pad, p.x + stepDx));
        const nextY = Math.max(pad, Math.min(f.h * 0.78, p.y + stepDy));
        p.x = nextX;
        p.y = nextY;
        p.rot += stepDx * 1.1 - stepDy * 0.5;
        p.kickScale = 1.1;

        collectTouchedStars(p.x, p.y);

        for (const bmp of bumpersRef.current) {
          const bx = (bmp.xPct / 100) * f.w;
          const by = (bmp.yPct / 100) * f.h;
          const dx = p.x - bx;
          const dy = p.y - by;
          const dist = Math.hypot(dx, dy);
          const minDist = ballRadius + bmp.rPx;
          if (dist < minDist && dist > 0.1) {
            p.x = bx + (dx / dist) * (minDist + 2);
            p.y = by + (dy / dist) * (minDist + 2);
            soundEngine.playBoing();
            setBoingMap((prev) => ({ ...prev, [bmp.id]: Date.now() }));
          }
        }

        if (checkGoalCollisions(p.x, p.y)) {
          gestureRef.current = null;
          cleanupWinListeners();
          setAimBuffered(null);
          return;
        }

        const oldest = g.samples[0] || g.start;
        const dirDx = pt.x - oldest.x;
        const dirDy = pt.y - oldest.y;
        const dirLen = Math.hypot(dirDx, dirDy);
        if (dirLen > 12 && dirDy < 12) {
          const ux = dirDx / dirLen;
          const uy = Math.min(-0.35, dirDy / dirLen);
          const uNorm = Math.hypot(ux, uy);
          const guideLen = isTablet ? 165 : 125;
          const toX = Math.max(20, Math.min(f.w - 20, p.x + (ux / uNorm) * guideLen));
          const toY = Math.max(20, p.y + (uy / uNorm) * guideLen);
          setAimBuffered({
            fromX: p.x,
            fromY: p.y,
            toX,
            toY,
            isSlingshot: false,
            anchorX: p.x,
            anchorY: p.y,
            lockedGoalId: findAimedGoalId(p.x, p.y, toX, toY),
          });
        } else {
          setAimBuffered(null);
        }
      } else if (g.kind === 'aim') {
        // Field-wide tap / swipe aim
        let toX = pt.x;
        let toY = pt.y;
        let isSling = false;
        if (travel > 22) {
          if (swipeDy < -12) {
            const len = Math.max(1, Math.hypot(swipeDx, swipeDy));
            const guideLen = Math.min(f.h * 0.52, Math.max(150, len * 1.9));
            toX = Math.max(20, Math.min(f.w - 20, p.x + (swipeDx / len) * guideLen));
            toY = Math.max(20, p.y + (swipeDy / len) * guideLen);
          } else if (swipeDy > 26) {
            isSling = true;
            const len = Math.max(1, Math.hypot(swipeDx, swipeDy));
            const guideLen = Math.min(f.h * 0.52, Math.max(150, len * 2.1));
            toX = Math.max(20, Math.min(f.w - 20, p.x - (swipeDx / len) * guideLen));
            toY = Math.max(20, p.y - (swipeDy / len) * guideLen);
          }
        }
        setAimBuffered({
          fromX: p.x,
          fromY: p.y,
          toX,
          toY,
          isSlingshot: isSling,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: findAimedGoalId(p.x, p.y, toX, toY),
        });
      }

      g.last = pt;
    },
    [
      ballRadius,
      checkGoalCollisions,
      cleanupWinListeners,
      collectTouchedStars,
      findAimedGoalId,
      isTablet,
      setAimBuffered,
    ]
  );

  const endGesture = useCallback(
    (endPt?: { x: number; y: number }) => {
      const g = gestureRef.current;
      if (!g) return;
      gestureRef.current = null;
      cleanupWinListeners();
      setAimBuffered(null);
      setAimVisual(null);

      const p = physRef.current;
      if (p.phase === 'scored' || p.phase === 'returning' || wonRef.current) return;

      const f = fieldRef.current;
      const homeX = f.w * 0.5;
      const homeY = f.h * 0.7;
      const pt = endPt || g.last;
      const swipeDx = pt.x - g.start.x;
      const swipeDy = pt.y - g.start.y;

      // 1. Short Tap (either on the ball OR anywhere on the field!)
      if (g.maxTravel < 22 || g.kind === 'pending_ball') {
        if (g.kind !== 'aim') {
          const tp = getGoalCenter(activeGoalRef.current);
          kickBallAlong(tp.x - p.x, tp.y - p.y);
          return;
        }
        const tapGoalR = isTablet ? 98 : 78;
        for (const goal of goalsRef.current) {
          const gp = getGoalCenter(goal);
          if (Math.hypot(pt.x - gp.x, pt.y - gp.y) <= tapGoalR) {
            kickBallAlong(gp.x - p.x, gp.y - p.y);
            return;
          }
        }
        if (pt.y > p.y - 16) {
          const tp = getGoalCenter(activeGoalRef.current);
          kickBallAlong(tp.x - p.x, tp.y - p.y);
          return;
        }
        kickBallAlong(pt.x - p.x, pt.y - p.y);
        return;
      }

      // 2. Slingshot Release (calm, toddler-friendly power curve)
      if (g.kind === 'slingshot') {
        const pullDist = Math.min(48, Math.hypot(swipeDx, swipeDy));
        const power = (isTablet ? 410 : 340) + (pullDist / 48) * (isTablet ? 175 : 140);
        p.x = homeX;
        p.y = homeY;
        kickBallAlong(-swipeDx, -Math.max(10, swipeDy), power);
        return;
      }

      // 3. Direct Dribble / Flick Release (gentle rolling momentum)
      if (g.kind === 'dribble') {
        const oldest = g.samples[0];
        const newest = g.samples[g.samples.length - 1];
        const dtSec = Math.max(0.016, (newest.t - oldest.t) / 1000);
        const recentDx = newest.x - oldest.x;
        const recentDy = newest.y - oldest.y;
        const recentSpeed = Math.hypot(recentDx, recentDy) / dtSec;

        if (recentSpeed > 180 && recentDy < 60) {
          const launchSpeed = Math.min(
            isTablet ? 590 : 480,
            Math.max(isTablet ? 420 : 340, recentSpeed * 0.45)
          );
          kickBallAlong(recentDx, Math.min(-40, recentDy), launchSpeed);
        } else if (swipeDy < -24) {
          kickBallAlong(swipeDx, swipeDy, isTablet ? 450 : 370);
        } else {
          const tp = getGoalCenter(activeGoalRef.current);
          kickBallAlong(tp.x - p.x, tp.y - p.y, isTablet ? 440 : 360);
        }
        return;
      }

      // 4. Field-wide Swipe Release
      const oldest = g.samples[0];
      const newest = g.samples[g.samples.length - 1];
      const dtSec = Math.max(0.016, (newest.t - oldest.t) / 1000);
      const flickSpeed = Math.hypot(newest.x - oldest.x, newest.y - oldest.y) / dtSec;
      const launchSpeed = Math.min(
        isTablet ? 580 : 475,
        Math.max(isTablet ? 420 : 340, flickSpeed * 0.45)
      );

      if (swipeDy < -12) {
        kickBallAlong(swipeDx, swipeDy, launchSpeed);
      } else if (swipeDy > 26) {
        kickBallAlong(-swipeDx, -swipeDy, launchSpeed);
      } else {
        kickBallAlong(pt.x - p.x, Math.min(-40, pt.y - p.y), launchSpeed);
      }
    },
    [cleanupWinListeners, getGoalCenter, isTablet, kickBallAlong, setAimBuffered]
  );

  const attachWebWindowListeners = useCallback(
    (mode: 'touch' | 'pointer', id: number) => {
      cleanupWinListeners();
      if (typeof window === 'undefined') return;

      if (mode === 'touch') {
        const findTouch = (list: TouchList) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].identifier === id) return list[i];
          }
          return null;
        };
        const onWinTouchMove = (ev: TouchEvent) => {
          const t = findTouch(ev.touches) || findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          moveGesture(getLocalCoords(t.clientX, t.clientY));
        };
        const onWinTouchEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          lastTouchEndRef.current = Date.now();
          endGesture(getLocalCoords(t.clientX, t.clientY));
        };
        const onWinTouchCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          lastTouchEndRef.current = Date.now();
          endGesture(t ? getLocalCoords(t.clientX, t.clientY) : undefined);
        };
        window.addEventListener('touchmove', onWinTouchMove, { passive: false });
        window.addEventListener('touchend', onWinTouchEnd, { passive: false });
        window.addEventListener('touchcancel', onWinTouchCancel);
        winCleanupRef.current = () => {
          window.removeEventListener('touchmove', onWinTouchMove);
          window.removeEventListener('touchend', onWinTouchEnd);
          window.removeEventListener('touchcancel', onWinTouchCancel);
        };
      } else {
        const onWinPointerMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          moveGesture(getLocalCoords(ev.clientX, ev.clientY));
        };
        const onWinPointerUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          endGesture(getLocalCoords(ev.clientX, ev.clientY));
        };
        const onWinPointerCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          endGesture(undefined);
        };
        window.addEventListener('pointermove', onWinPointerMove, { passive: false });
        window.addEventListener('pointerup', onWinPointerUp);
        window.addEventListener('pointercancel', onWinPointerCancel);
        winCleanupRef.current = () => {
          window.removeEventListener('pointermove', onWinPointerMove);
          window.removeEventListener('pointerup', onWinPointerUp);
          window.removeEventListener('pointercancel', onWinPointerCancel);
        };
      }
    },
    [cleanupWinListeners, endGesture, getLocalCoords, moveGesture]
  );

  // Direct non-passive DOM touchstart listener for iPad Safari & Android Chrome
  // Includes smart multi-touch palm handoff so a thumb holding the tablet bezel never blocks kicks!
  useEffect(() => {
    if (Platform.OS !== 'web' || !fieldDomNode) return;

    const onDomTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      lastTouchEndRef.current = Date.now();

      const curr = gestureRef.current;
      if (curr && curr.mode === 'touch') {
        let oldStillDown = false;
        for (let i = 0; i < ev.touches.length; i++) {
          if (ev.touches[i].identifier === curr.id) {
            oldStillDown = true;
            break;
          }
        }
        if (oldStillDown) {
          const p = physRef.current;
          const newPt = getLocalCoords(t.clientX, t.clientY);
          const oldDist = Math.hypot(curr.last.x - p.x, curr.last.y - p.y);
          const newDist = Math.hypot(newPt.x - p.x, newPt.y - p.y);
          const oldStationary = curr.maxTravel < 16;
          if (!oldStationary || newDist > oldDist) {
            return;
          }
        }
        gestureRef.current = null;
        cleanupWinListeners();
      }

      const pt = getLocalCoords(t.clientX, t.clientY);
      if (startGesture('touch', t.identifier, pt)) {
        attachWebWindowListeners('touch', t.identifier);
      }
    };

    fieldDomNode.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      fieldDomNode.removeEventListener('touchstart', onDomTouchStart);
    };
  }, [
    attachWebWindowListeners,
    cleanupWinListeners,
    fieldDomNode,
    getLocalCoords,
    startGesture,
  ]);

  const webFieldProps =
    Platform.OS === 'web'
      ? ({
          onPointerDown: (e: {
            pointerId: number;
            pointerType?: string;
            clientX: number;
            clientY: number;
            preventDefault?: () => void;
          }) => {
            if (e.pointerType === 'touch') return;
            if (Date.now() - lastTouchEndRef.current < 700) return;
            if (gestureRef.current) return;
            e.preventDefault?.();
            const pt = getLocalCoords(e.clientX, e.clientY);
            if (startGesture('pointer', e.pointerId, pt)) {
              attachWebWindowListeners('pointer', e.pointerId);
            }
          },
        } as Record<string, unknown>)
      : {};

  const startGestureRef = useRef(startGesture);
  startGestureRef.current = startGesture;
  const moveGestureRef = useRef(moveGesture);
  moveGestureRef.current = moveGesture;
  const endGestureRef = useRef(endGesture);
  endGestureRef.current = endGesture;

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        startGestureRef.current('native', 0, {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        });
      },
      onPanResponderMove: (evt) => {
        moveGestureRef.current({
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        });
      },
      onPanResponderRelease: (evt) => {
        endGestureRef.current({
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        });
      },
      onPanResponderTerminate: () => {
        endGestureRef.current(undefined);
      },
    })
  ).current;

  const goalW = difficulty === 1 ? (isTablet ? 196 : 152) : isTablet ? 146 : 108;
  const goalH = Math.round(goalW * 0.68);
  const animalSz = difficulty === 1 ? (isTablet ? 116 : 86) : isTablet ? 88 : 66;
  const whitSize = isTabletLandscape ? 132 : isTablet ? 124 : 96;

  // Lightweight pure-View dotted aim arrow (60fps friendly, zero SVG canvas churn!)
  const renderAimDots = () => {
    if (!aimVisual) return null;
    const { fromX, fromY, toX, toY, isSlingshot, anchorX, anchorY, lockedGoalId } =
      aimVisual;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.hypot(dx, dy);
    if (dist < 14) return null;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const isLockedTarget = lockedGoalId === activeGoal.id;
    const dotCount = 7;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Elastic pullback dots between kick spot and pulled ball in slingshot mode */}
        {isSlingshot &&
          [0.25, 0.55, 0.85].map((t, i) => {
            const sx = fromX + (anchorX - fromX) * t;
            const sy = fromY + (anchorY - fromY) * t;
            return (
              <View
                key={`sling-${i}`}
                style={[
                  styles.slingDot,
                  { left: sx - 5, top: sy - 5 },
                ]}
              />
            );
          })}

        {/* Bright forward aim dots */}
        {Array.from({ length: dotCount }).map((_, idx) => {
          const t = (idx + 1) / (dotCount + 0.6);
          const x = fromX + dx * t;
          const y = fromY + dy * t;
          const size = 12 - idx * 0.6;
          return (
            <View
              key={`aim-${idx}`}
              style={[
                styles.aimDot,
                isLockedTarget && styles.aimDotLocked,
                {
                  left: x - size / 2,
                  top: y - size / 2,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  opacity: 0.95 - idx * 0.06,
                },
              ]}
            />
          );
        })}

        {/* Target ring + directional chevron at aim tip */}
        <View
          style={[
            styles.aimTipRing,
            isLockedTarget && styles.aimTipRingLocked,
            {
              left: toX - 16,
              top: toY - 16,
              transform: [{ rotate: `${Math.round(angleDeg)}deg` }],
            },
          ]}
        >
          <View style={styles.aimTipArrow} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Full-bleed Painterly Sunlit Jungle Clearing Surround */}
      <JungleClearingBackdrop />

      <GameHeader
        totalSteps={GOALS_TO_WIN}
        completedSteps={goalsScored}
        difficulty={difficulty}
        onDifficultyChange={(d) => startFreshGame(d, roundSeed)}
      />

      {/* Full-bleed Interactive Play Field */}
      <View
        ref={handleFieldRef}
        style={[
          styles.field,
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
            : null,
        ]}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 100 && h > 100) {
            setFieldSize({ w, h });
          }
        }}
        {...(Platform.OS === 'web' ? webFieldProps : nativePan.panHandlers)}
      >
        {/* Responsive Storybook Jungle Soccer Pitch */}
        <JungleSoccerPitch
          width={fieldSize.w}
          height={fieldSize.h}
          difficulty={difficulty}
          isTablet={isTablet}
        />

        {/* Lightweight dotted aim guide */}
        {renderAimDots()}

        {/* Soft expanding touch ripple */}
        {tapRipple && (
          <TapRipple key={tapRipple.tick} x={tapRipple.x} y={tapRipple.y} />
        )}

        {/* Wooden Jungle Goals & Animated Zoo Animals */}
        {goals.map((g, idx) => {
          const isTarget = idx === targetGoalIdx % goals.length;
          const isAimLocked = aimVisual?.lockedGoalId === g.id;
          const sway = isTarget ? ballRender.swayOffsetPx : 0;
          const cx = (g.baseXPct / 100) * fieldSize.w + sway;
          const cy = (g.yPct / 100) * fieldSize.h;

          return (
            <View
              key={`${difficulty}-${g.id}`}
              pointerEvents="none"
              style={[
                styles.goalAnchor,
                {
                  left: cx - goalW / 2,
                  top: cy - goalH / 2,
                  width: goalW,
                  height: goalH + 20,
                },
              ]}
            >
              {isTarget && !won && <TargetGoalPointer isTablet={isTablet} />}
              {isAimLocked && (
                <View
                  style={[
                    styles.goalLockHalo,
                    {
                      width: goalW + 18,
                      height: goalH + 16,
                      borderRadius: 28,
                    },
                  ]}
                />
              )}
              <JungleGoalArchSvg
                width={goalW}
                height={goalH}
                active={isTarget || isAimLocked}
              />
              <View style={styles.goalAnimalPos}>
                <GoalAnimal
                  animal={g.animal}
                  size={animalSz}
                  seed={idx + 1}
                  isTarget={isTarget}
                  isCelebrating={celebratingGoalId === g.id}
                />
              </View>
            </View>
          );
        })}

        {/* Collectible Soft Honey-Gold Path Stars */}
        {stars.map((st) => {
          if (st.collected) return null;
          const sx = (st.xPct / 100) * fieldSize.w;
          const sy = (st.yPct / 100) * fieldSize.h;
          const sz = isTablet ? 40 : 30;
          return (
            <View
              key={st.id}
              pointerEvents="none"
              style={[styles.starAnchor, { left: sx - sz / 2, top: sy - sz / 2 }]}
            >
              <Svg width={sz} height={sz} viewBox="0 0 36 38">
                <Ellipse
                  cx="18"
                  cy="33.5"
                  rx="10"
                  ry="3.2"
                  fill="rgba(38, 72, 32, 0.24)"
                />
                <Path
                  d="M18 3 L22.4 12.2 L32.5 13.6 L25.1 20.6 L26.9 30.6 L18 25.8 L9.1 30.6 L10.9 20.6 L3.5 13.6 L13.6 12.2 Z"
                  fill="#FAD968"
                  stroke="#7D5938"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <Path
                  d="M18 7.5 L20.4 12.8 L26 13.6 L22 17.5"
                  fill="none"
                  stroke="#FFF7D4"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </Svg>
            </View>
          );
        })}

        {/* Bouncy Jungle Mushroom Bumpers */}
        {bumpers.map((bmp) => {
          const bx = (bmp.xPct / 100) * fieldSize.w;
          const by = (bmp.yPct / 100) * fieldSize.h;
          const sz = bmp.rPx * 2.15;
          return (
            <View
              key={bmp.id}
              pointerEvents="none"
              style={[styles.bumperAnchor, { left: bx - sz / 2, top: by - sz / 2 }]}
            >
              <MushroomBumperSvg size={sz} boingTick={boingMap[bmp.id] || 0} />
            </View>
          );
        })}

        {/* Goal Confetti Burst & Floating GOAL! Banner */}
        {burstPos && (
          <>
            <View
              key={`burst-${burstPos.tick}`}
              pointerEvents="none"
              style={[styles.burstAnchor, { left: burstPos.x, top: burstPos.y }]}
            >
              <SnapBurst
                size={burstPos.isGoal ? (isTablet ? 164 : 128) : isTablet ? 96 : 74}
              />
            </View>
            {burstPos.isGoal && (
              <GoalBannerPop
                key={`banner-${burstPos.tick}`}
                x={burstPos.x}
                y={burstPos.y}
                fieldW={fieldSize.w}
              />
            )}
          </>
        )}

        {/* Whit the Gorilla Kicker standing cleanly behind the ball at bottom center */}
        <View
          pointerEvents="none"
          style={[
            styles.whitAnchor,
            {
              left: fieldSize.w * 0.5 - whitSize / 2,
              top: fieldSize.h * 0.77,
            },
          ]}
        >
          <WhitMascot mood={mascotMood} size={whitSize} interactive={false} />
        </View>

        {/* Soft comet motion trail when ball is flying */}
        {ballRender.phase === 'flying' &&
          ballRender.trail.map((pt, idx) => {
            const sz = Math.max(10, ballRadius * (1.25 - idx * 0.2));
            return (
              <View
                key={`trail-${idx}`}
                pointerEvents="none"
                style={[
                  styles.trailDot,
                  {
                    left: pt.x - sz / 2,
                    top: pt.y - sz / 2,
                    width: sz,
                    height: sz,
                    borderRadius: sz / 2,
                    opacity: Math.max(0.12, 0.44 - idx * 0.08),
                  },
                ]}
              />
            );
          })}

        {/* Inviting pulsing golden ring when ready, and solid bright ring when grabbed */}
        {ballRender.phase === 'ready' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ballHalo,
              {
                left: ballRender.x - (ballRadius + 13),
                top: ballRender.y - (ballRadius + 13),
                width: (ballRadius + 13) * 2,
                height: (ballRadius + 13) * 2,
                borderRadius: ballRadius + 13,
                opacity: readyPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.32, 0.78],
                }),
                transform: [
                  {
                    scale: readyPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1.1],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
        {ballRender.phase === 'dragging' && (
          <View
            pointerEvents="none"
            style={[
              styles.ballHalo,
              styles.ballHaloActive,
              {
                left: ballRender.x - (ballRadius + 15),
                top: ballRender.y - (ballRadius + 15),
                width: (ballRadius + 15) * 2,
                height: (ballRadius + 15) * 2,
                borderRadius: ballRadius + 15,
              },
            ]}
          />
        )}

        {/* Separate non-rotating soft dark-green ground shadow directly under the ball */}
        <View
          pointerEvents="none"
          style={[
            styles.ballGroundShadow,
            {
              left: ballRender.x - ballRadius * 0.78,
              top: ballRender.y + ballRadius * 0.68,
              width: ballRadius * 1.56,
              height: Math.round(ballRadius * 0.44),
              borderRadius: ballRadius,
            },
          ]}
        />

        {/* Crisp Circular Watercolor Rolling Soccer Ball */}
        <View
          pointerEvents="none"
          style={[
            styles.ballAnchor,
            {
              left: ballRender.x - ballRadius,
              top: ballRender.y - ballRadius,
              width: ballRadius * 2,
              height: ballRadius * 2,
              borderRadius: ballRadius,
              transform: [
                { scale: ballRender.scale },
                { rotate: `${Math.round(ballRender.rot)}deg` },
              ],
            },
          ]}
        >
          <WatercolorJungleBall size={ballRadius * 2} />
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startFreshGame(difficulty, roundSeed + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  goalAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  goalLockHalo: {
    position: 'absolute',
    top: -8,
    backgroundColor: 'rgba(255, 232, 118, 0.28)',
    borderWidth: 3,
    borderColor: 'rgba(255, 240, 150, 0.9)',
  },
  goalAnimalPos: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starAnchor: {
    position: 'absolute',
    zIndex: 14,
  },
  bumperAnchor: {
    position: 'absolute',
    zIndex: 15,
  },
  burstAnchor: {
    position: 'absolute',
    zIndex: 60,
  },
  goalBanner: {
    position: 'absolute',
    width: 132,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFF5C4',
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 65,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  goalBannerText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.woodDark,
    letterSpacing: 0.6,
  },
  whitAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  tapRipple: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3.5,
    borderColor: '#FFF4B8',
    backgroundColor: 'rgba(255, 244, 180, 0.24)',
    zIndex: 19,
  },
  slingDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFE27A',
    borderWidth: 2,
    borderColor: '#6A4822',
    zIndex: 20,
  },
  aimDot: {
    position: 'absolute',
    backgroundColor: '#FFFBEA',
    borderWidth: 2,
    borderColor: 'rgba(54, 90, 42, 0.55)',
    zIndex: 20,
  },
  aimDotLocked: {
    backgroundColor: '#FFE066',
    borderColor: '#6A4822',
  },
  aimTipRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 249, 224, 0.45)',
    borderWidth: 3,
    borderColor: '#FFFBEA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 21,
  },
  aimTipRingLocked: {
    backgroundColor: 'rgba(255, 224, 102, 0.55)',
    borderColor: '#FFE066',
  },
  aimTipArrow: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#6A4822',
  },
  trailDot: {
    position: 'absolute',
    backgroundColor: '#FFF7D6',
    zIndex: 21,
  },
  ballHalo: {
    position: 'absolute',
    borderWidth: 3.5,
    borderColor: 'rgba(255, 245, 190, 0.92)',
    backgroundColor: 'rgba(255, 245, 190, 0.16)',
    zIndex: 23,
  },
  ballHaloActive: {
    borderWidth: 4,
    borderColor: '#FFE066',
    backgroundColor: 'rgba(255, 232, 120, 0.28)',
  },
  ballGroundShadow: {
    position: 'absolute',
    zIndex: 22,
    backgroundColor: 'rgba(34, 68, 32, 0.28)',
  },
  ballAnchor: {
    position: 'absolute',
    zIndex: 25,
    overflow: 'hidden',
  },
});
