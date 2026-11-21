import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
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
import { WhitMascot, WhitMood } from '../components/WhitMascot';
import { SnapBurst } from '../components/SnapBurst';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { Difficulty } from '../theme';

const GOAL_ANIMALS: ExhibitAnimalKind[] = ['lion', 'elephant', 'giraffe', 'panda'];
const GOALS_TO_WIN = 4;

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

function buildBumpers(difficulty: Difficulty, isTablet: boolean): BumperSpec[] {
  const rPx = isTablet ? 34 : 25;
  if (difficulty === 1) return [];
  if (difficulty === 2) {
    return [{ id: 'mush-center', xPct: 50, yPct: 50, rPx }];
  }
  return [
    { id: 'mush-left', xPct: 33, yPct: 47, rPx },
    { id: 'mush-right', xPct: 67, yPct: 52, rPx },
  ];
}

function buildStars(targetXPct: number, targetYPct: number): PathStar[] {
  const startX = 50;
  const startY = 70;
  return [0.35, 0.62].map((t, i) => ({
    id: `star-${i}-${Date.now()}`,
    xPct: startX + (targetXPct - startX) * t,
    yPct: startY + (targetYPct - startY) * t,
    collected: false,
  }));
}

/** Crisp circular Warm Watercolor & Gouache jungle soccer ball (zero square shadow box!) */
const WatercolorJungleBall: React.FC<{ size: number }> = ({ size }) => (
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
);

/** Soft gouache-shaded spotted storybook jungle mushroom bumper */
const MushroomBumperSvg: React.FC<{ size: number; boinged: boolean }> = ({
  size,
  boinged,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!boinged) return;
    scale.setValue(0.76);
    Animated.spring(scale, {
      toValue: 1,
      friction: 3.2,
      tension: 220,
      useNativeDriver: true,
    }).start();
  }, [boinged, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={`cap-${uid}`} cx="36%" cy="28%" r="72%">
            <Stop offset="0" stopColor="#F5A082" />
            <Stop offset="0.58" stopColor="#DF7258" />
            <Stop offset="1" stopColor="#BC553F" />
          </RadialGradient>
          <LinearGradient id={`stem-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFF8E8" />
            <Stop offset="0.65" stopColor="#F3E2C0" />
            <Stop offset="1" stopColor="#DFC79C" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="50" cy="87" rx="30" ry="8.5" fill="rgba(44, 78, 38, 0.24)" />
        {/* Plump cream gouache mushroom stem */}
        <Path
          d="M 38 56 L 34 83 Q 50 91 66 83 L 62 56 Z"
          fill={`url(#stem-${uid})`}
          stroke="#6A4D38"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
        {/* Bouncy spotted terracotta-coral mushroom cap */}
        <Path
          d="M 11 56 C 11 23 30 11 50 11 C 70 11 89 23 89 56 C 72 64 28 64 11 56 Z"
          fill={`url(#cap-${uid})`}
          stroke="#6A4D38"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <Ellipse cx="36" cy="24" rx="14" ry="6" fill="#FFE8D6" opacity="0.35" transform="rotate(-18 36 24)" />
        <Circle cx="34" cy="35" r="7.5" fill="#FFF7E4" opacity="0.92" />
        <Circle cx="59" cy="29" r="9" fill="#FFF7E4" opacity="0.92" />
        <Circle cx="72" cy="46" r="5.5" fill="#FFF7E4" opacity="0.88" />
        <Circle cx="26" cy="48" r="4.8" fill="#FFF7E4" opacity="0.88" />
      </Svg>
    </Animated.View>
  );
};

/** Zoo animal standing by its goal: idle breathing, calling double-hop, or goal celebrate */
const GoalAnimal: React.FC<{
  animal: ExhibitAnimalKind;
  size: number;
  seed: number;
  isTarget: boolean;
  isCelebrating: boolean;
}> = ({ animal, size, seed, isTarget, isCelebrating }) => {
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
};

/**
 * Jungle Ball Pass (Paid Tier — Replaces "Feed the Zoo"):
 * - Full-bleed sunlit jungle clearing with Whit the Gorilla at the bottom & bouncy soccer ball.
 * - Friendly zoo animals (lion, elephant, giraffe, panda) stand by wooden jungle goals.
 * - Swipe/flick the ball OR simply tap toward the waving target animal to kick!
 * - Toddler-friendly rolling physics, bouncy mushroom bumpers, golden stars & magnetic aim-assist.
 * - Defaults to Medium (2) difficulty with labeled Easy | Med | Hard toggle.
 */
export const BallPassGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundSeed, setRoundSeed] = useState(0);
  const [goalsScored, setGoalsScored] = useState(0);
  const [targetGoalIdx, setTargetGoalIdx] = useState(0);
  const [celebratingGoalId, setCelebratingGoalId] = useState<number | null>(null);
  const [mascotMood, setMascotMood] = useState<WhitMood>('wave');
  const [won, setWon] = useState(false);

  const [fieldSize, setFieldSize] = useState({
    w: Math.max(320, width),
    h: Math.max(420, height - 96),
  });

  const goals = buildGoals(difficulty, roundSeed);
  const activeGoal = goals[targetGoalIdx % goals.length] || goals[0];
  const bumpers = buildBumpers(difficulty, isTablet);

  const [stars, setStars] = useState<PathStar[]>(() =>
    buildStars(activeGoal.baseXPct, activeGoal.yPct)
  );
  const [boingBumperId, setBoingBumperId] = useState<{
    id: string;
    tick: number;
  } | null>(null);
  const [burstPos, setBurstPos] = useState<{
    x: number;
    y: number;
    tick: number;
  } | null>(null);

  // Physics state stored in refs for 60fps requestAnimationFrame loop, synced to UI state
  const ballStartX = fieldSize.w * 0.5;
  const ballStartY = fieldSize.h * 0.70;
  const ballRadius = isTablet ? 32 : 24;

  const physRef = useRef({
    x: ballStartX,
    y: ballStartY,
    vx: 0,
    vy: 0,
    rot: 0,
    moving: false,
    scored: false,
    swayTime: 0,
    goalSwayOffsetPx: 0,
  });

  const [ballRender, setBallRender] = useState({
    x: ballStartX,
    y: ballStartY,
    rot: 0,
    swayOffsetPx: 0,
  });

  const [aimPreview, setAimPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const starsRef = useRef(stars);
  starsRef.current = stars;
  const fieldRef = useRef(fieldSize);
  fieldRef.current = fieldSize;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;
  const activeGoalRef = useRef(activeGoal);
  activeGoalRef.current = activeGoal;
  const bumpersRef = useRef(bumpers);
  bumpersRef.current = bumpers;
  const wonRef = useRef(won);
  wonRef.current = won;
  const goalsScoredRef = useRef(goalsScored);
  goalsScoredRef.current = goalsScored;

  const resetBallToWhit = useCallback(() => {
    const f = fieldRef.current;
    physRef.current.x = f.w * 0.5;
    physRef.current.y = f.h * 0.70;
    physRef.current.vx = 0;
    physRef.current.vy = 0;
    physRef.current.moving = false;
    physRef.current.scored = false;
    setBallRender((prev) => ({
      ...prev,
      x: f.w * 0.5,
      y: f.h * 0.70,
    }));
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
      setTargetGoalIdx(nextIdx);
      setStars(buildStars(g.baseXPct, g.yPct));
      resetBallToWhit();

      if (nextScored >= GOALS_TO_WIN) {
        setTimeout(() => {
          soundEngine.playWin();
          addStar(1);
          setMascotMood('cheer');
          setWon(true);
        }, 420);
      }
    },
    [roundSeed, targetGoalIdx, resetBallToWhit, addStar]
  );

  const startFreshGame = useCallback(
    (nextDiff: Difficulty, nextSeed: number) => {
      const nextGoals = buildGoals(nextDiff, nextSeed);
      const startIdx = nextGoals.length > 1 ? 1 : 0;
      setDifficulty(nextDiff);
      setRoundSeed(nextSeed);
      setGoalsScored(0);
      setCelebratingGoalId(null);
      setTargetGoalIdx(startIdx);
      setStars(
        buildStars(nextGoals[startIdx].baseXPct, nextGoals[startIdx].yPct)
      );
      setWon(false);
      setMascotMood('wave');
      physRef.current.swayTime = 0;
      physRef.current.goalSwayOffsetPx = 0;
      resetBallToWhit();
    },
    [resetBallToWhit]
  );

  // Sync ball start position whenever field resizes while idle
  useEffect(() => {
    if (!physRef.current.moving) {
      resetBallToWhit();
    }
  }, [fieldSize.w, fieldSize.h, resetBallToWhit]);

  // 60fps smooth toddler-friendly rolling, bouncing & aim-assist physics loop
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
        const maxSway = Math.min(72, f.w * 0.11);
        p.goalSwayOffsetPx = Math.sin(p.swayTime * 1.45) * maxSway;
      } else {
        p.goalSwayOffsetPx = 0;
      }

      if (p.moving && !p.scored) {
        const goalX = (g.baseXPct / 100) * f.w + p.goalSwayOffsetPx;
        const goalY = (g.yPct / 100) * f.h;

        // Forgiving toddler magnetic aim-assist:
        // If moving generally upward toward the target goal, gently curve into the goal!
        const toGoalX = goalX - p.x;
        const toGoalY = goalY - p.y;
        const distToGoal = Math.hypot(toGoalX, toGoalY);
        const speed = Math.hypot(p.vx, p.vy);

        if (speed > 40 && p.vy < 0 && distToGoal > 12) {
          const dirDot =
            (p.vx * toGoalX + p.vy * toGoalY) / (speed * distToGoal);
          const assistThreshold = diff === 1 ? 0.35 : diff === 2 ? 0.62 : 0.72;
          if (dirDot > assistThreshold) {
            const steerStrength = diff === 1 ? 7.5 : diff === 2 ? 4.8 : 3.2;
            const desiredVx = (toGoalX / distToGoal) * speed;
            const desiredVy = (toGoalY / distToGoal) * speed;
            p.vx += (desiredVx - p.vx) * Math.min(1, steerStrength * dt);
            p.vy += (desiredVy - p.vy) * Math.min(1, steerStrength * dt);
          }
        }

        // Integrate position & gentle grass friction
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const friction = Math.pow(0.985, dt * 60);
        p.vx *= friction;
        p.vy *= friction;
        p.rot += (p.vx * 0.6 + Math.abs(p.vy) * 0.35) * dt;

        // Soft elastic bounds on left/right/top edges
        const pad = ballRadius + 10;
        if (p.x < pad) {
          p.x = pad;
          p.vx = Math.abs(p.vx) * 0.78;
          soundEngine.playPop();
        } else if (p.x > f.w - pad) {
          p.x = f.w - pad;
          p.vx = -Math.abs(p.vx) * 0.78;
          soundEngine.playPop();
        }
        if (p.y < pad) {
          p.y = pad;
          p.vy = Math.abs(p.vy) * 0.72;
          soundEngine.playPop();
        }

        // Bouncy Jungle Mushroom Bumper collisions!
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
            p.x = bx + nx * (minDist + 2);
            p.y = by + ny * (minDist + 2);
            const dot = p.vx * nx + p.vy * ny;
            p.vx = (p.vx - 2 * dot * nx) * 1.06;
            p.vy = (p.vy - 2 * dot * ny) * 1.06;
            // Keep a playful bounce speed
            const spd = Math.hypot(p.vx, p.vy);
            if (spd < 360) {
              p.vx = nx * 380;
              p.vy = ny * 380;
            }
            soundEngine.playBoing();
            setBoingBumperId({ id: bmp.id, tick: Date.now() });
          }
        }

        // Collect golden path stars as the ball rolls over them!
        let starsChanged = false;
        const updatedStars = starsRef.current.map((st, idx) => {
          if (st.collected) return st;
          const sx = (st.xPct / 100) * f.w;
          const sy = (st.yPct / 100) * f.h;
          if (Math.hypot(p.x - sx, p.y - sy) < ballRadius + 28) {
            starsChanged = true;
            soundEngine.playStarCollect(idx);
            return { ...st, collected: true };
          }
          return st;
        });
        if (starsChanged) {
          starsRef.current = updatedStars;
          setStars(updatedStars);
        }

        // Check Goal Scored! Generous toddler goal hitbox
        const goalHitR = diff === 1 ? 82 : 66;
        if (distToGoal < goalHitR) {
          p.scored = true;
          p.moving = false;
          p.x = goalX;
          p.y = goalY + 12;
          soundEngine.playMatch();
          collectSticker(activeGoalRef.current.animal);
          setBurstPos({ x: goalX, y: goalY, tick: Date.now() });
          setCelebratingGoalId(activeGoalRef.current.id);
          const nextScored = goalsScoredRef.current + 1;
          setGoalsScored(nextScored);
          setMascotMood('cheer');
          setTimeout(() => {
            if (nextScored < GOALS_TO_WIN) {
              setMascotMood('wave');
            }
            advanceTarget(nextScored);
          }, 900);
        } else if (
          Math.hypot(p.vx, p.vy) < 42 ||
          p.y > f.h - ballRadius
        ) {
          // Ball gently rolled to a stop — roll smoothly back to Whit with zero failure sound!
          p.moving = false;
          soundEngine.playGentleBounce();
          setMascotMood('encourage');
          setTimeout(() => {
            setMascotMood('wave');
            resetBallToWhit();
          }, 320);
        }
      }

      setBallRender({
        x: p.x,
        y: p.y,
        rot: p.rot,
        swayOffsetPx: p.goalSwayOffsetPx,
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [ballRadius, advanceTarget, resetBallToWhit]);

  const kickBallToward = useCallback((targetX: number, targetY: number) => {
    const p = physRef.current;
    if (p.moving || p.scored || wonRef.current) return;
    soundEngine.unlock();
    soundEngine.playKick();

    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    // Ensure every kick travels joyfully upward across the clearing
    const nx = dx / len;
    const ny = Math.min(-0.32, dy / len);
    const norm = Math.hypot(nx, ny);
    const kickSpeed = isTablet ? 760 : 620;

    p.vx = (nx / norm) * kickSpeed;
    p.vy = (ny / norm) * kickSpeed;
    p.moving = true;
    setMascotMood('happy');
  }, [isTablet]);

  // Unified Drag/Aim, Flick/Swipe, Slingshot, OR Tap input across the full clearing!
  // Uses direct non-passive DOM touchstart/touchmove + window listeners on Web so iPad Safari
  // NEVER steals drags for page scrolling or cancels mid-swipe.
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
  const webDragRef = useRef<{
    mode: 'touch' | 'pointer';
    id: number;
    start: { x: number; y: number };
    last: { x: number; y: number };
  } | null>(null);
  const lastTouchEndRef = useRef<number>(0);
  const winCleanupRef = useRef<(() => void) | null>(null);
  const kickBallRef = useRef(kickBallToward);
  kickBallRef.current = kickBallToward;
  const fieldNodeRef = useRef<React.ComponentRef<typeof View> | null>(null);

  const getFieldDomEl = useCallback(() => {
    if (Platform.OS !== 'web' || !fieldNodeRef.current) return null;
    const raw = fieldNodeRef.current as unknown as {
      addEventListener?: HTMLElement['addEventListener'];
      removeEventListener?: HTMLElement['removeEventListener'];
      getBoundingClientRect?: () => DOMRect;
      getNode?: () => HTMLElement;
    };
    if (typeof raw.getBoundingClientRect === 'function') return raw;
    if (typeof raw.getNode === 'function') return raw.getNode();
    return null;
  }, []);

  const getLocalCoords = useCallback(
    (clientX: number, clientY: number) => {
      const el = getFieldDomEl();
      const rect = el?.getBoundingClientRect?.();
      if (rect) {
        return { x: clientX - rect.left, y: clientY - rect.top };
      }
      return { x: clientX, y: clientY };
    },
    [getFieldDomEl]
  );

  const resolveAimTarget = useCallback(
    (start: { x: number; y: number }, curr: { x: number; y: number }) => {
      const p = physRef.current;
      const f = fieldRef.current;
      const swipeDx = curr.x - start.x;
      const swipeDy = curr.y - start.y;
      const dist = Math.hypot(swipeDx, swipeDy);

      let tx = curr.x;
      let ty = curr.y;

      if (dist > 18) {
        if (swipeDy < -10) {
          // Upward drag or flick: aim along drag vector from the ball
          tx = p.x + swipeDx * 1.8;
          ty = p.y + swipeDy * 1.8;
        } else if (swipeDy > 22) {
          // Slingshot pull-back downward: launch upward in opposite direction
          tx = p.x - swipeDx * 1.8;
          ty = p.y - swipeDy * 1.8;
        } else {
          tx = curr.x;
          ty = Math.min(curr.y, p.y - 60);
        }
      }

      return {
        x: Math.max(16, Math.min(f.w - 16, tx)),
        y: Math.max(16, Math.min(f.h - 16, ty)),
      };
    },
    []
  );

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  const beginWebAim = useCallback(
    (mode: 'touch' | 'pointer', id: number, clientX: number, clientY: number) => {
      soundEngine.unlock();
      const start = getLocalCoords(clientX, clientY);
      webDragRef.current = { mode, id, start, last: start };
      setAimPreview(resolveAimTarget(start, start));

      cleanupWinListeners();
      if (typeof window === 'undefined') return;

      const finishAim = (cx: number, cy: number) => {
        const st = webDragRef.current;
        if (!st || st.mode !== mode || st.id !== id) return;
        webDragRef.current = null;
        cleanupWinListeners();
        setAimPreview(null);
        if (mode === 'touch') {
          lastTouchEndRef.current = Date.now();
        }
        const end =
          Number.isFinite(cx) && Number.isFinite(cy)
            ? getLocalCoords(cx, cy)
            : st.last;
        const target = resolveAimTarget(st.start, end);
        kickBallRef.current(target.x, target.y);
      };

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
          const st = webDragRef.current;
          if (!st) return;
          const pt = getLocalCoords(t.clientX, t.clientY);
          st.last = pt;
          setAimPreview(resolveAimTarget(st.start, pt));
        };
        const onWinTouchEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          finishAim(t.clientX, t.clientY);
        };
        const onWinTouchCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          finishAim(t ? t.clientX : NaN, t ? t.clientY : NaN);
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
          const st = webDragRef.current;
          if (!st) return;
          const pt = getLocalCoords(ev.clientX, ev.clientY);
          st.last = pt;
          setAimPreview(resolveAimTarget(st.start, pt));
        };
        const onWinPointerUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          finishAim(ev.clientX, ev.clientY);
        };
        const onWinPointerCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          finishAim(NaN, NaN);
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
    [cleanupWinListeners, getLocalCoords, resolveAimTarget]
  );

  // Direct non-passive touchstart listener for iPad / iPhone Safari
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const domEl = getFieldDomEl();
    if (!domEl || typeof domEl.addEventListener !== 'function') return;

    const onDomTouchStart = (ev: TouchEvent) => {
      if (webDragRef.current) return;
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      beginWebAim('touch', t.identifier, t.clientX, t.clientY);
    };

    domEl.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      domEl.removeEventListener?.('touchstart', onDomTouchStart);
    };
  }, [beginWebAim, getFieldDomEl]);

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
            // Touch input is handled directly by our non-passive DOM touchstart listener
            if (e.pointerType === 'touch') return;
            if (Date.now() - lastTouchEndRef.current < 500) return;
            if (webDragRef.current) return;
            e.preventDefault?.();
            beginWebAim('pointer', e.pointerId, e.clientX, e.clientY);
          },
        } as Record<string, unknown>)
      : {};

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        soundEngine.unlock();
        const pt = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        gestureStartRef.current = pt;
        setAimPreview(pt);
      },
      onPanResponderMove: (evt) => {
        const start = gestureStartRef.current;
        if (!start) return;
        const curr = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        setAimPreview(resolveAimTarget(start, curr));
      },
      onPanResponderRelease: (evt) => {
        const start = gestureStartRef.current;
        gestureStartRef.current = null;
        setAimPreview(null);
        if (!start) return;
        const end = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
        const target = resolveAimTarget(start, end);
        kickBallRef.current(target.x, target.y);
      },
    })
  ).current;

  const goalW = difficulty === 1 ? (isTablet ? 190 : 148) : isTablet ? 142 : 104;
  const goalH = Math.round(goalW * 0.68);
  const animalSz = difficulty === 1 ? (isTablet ? 114 : 84) : isTablet ? 86 : 64;
  const whitSize = isTabletLandscape ? 132 : isTablet ? 124 : 96;

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
        ref={fieldNodeRef}
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
        {/* Responsive Storybook Jungle Soccer Pitch (mowed stripes, chalk lines & corner flags) */}
        <JungleSoccerPitch
          width={fieldSize.w}
          height={fieldSize.h}
          difficulty={difficulty}
          isTablet={isTablet}
        />

        {/* Subtle chalk aim guide line & target ring while swiping or tapping */}
        {aimPreview && !physRef.current.moving && (
          <Svg
            width={fieldSize.w}
            height={fieldSize.h}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Path
              d={`M ${ballRender.x} ${ballRender.y} L ${aimPreview.x} ${aimPreview.y}`}
              stroke="rgba(42, 76, 32, 0.24)"
              strokeWidth="7.5"
              strokeDasharray="10 10"
              strokeLinecap="round"
            />
            <Path
              d={`M ${ballRender.x} ${ballRender.y} L ${aimPreview.x} ${aimPreview.y}`}
              stroke="rgba(255, 251, 238, 0.86)"
              strokeWidth="5"
              strokeDasharray="10 10"
              strokeLinecap="round"
            />
            <Circle
              cx={aimPreview.x}
              cy={aimPreview.y}
              r={10}
              fill="rgba(255, 244, 180, 0.42)"
              stroke="rgba(255, 251, 238, 0.9)"
              strokeWidth="2.5"
            />
          </Svg>
        )}

        {/* Wooden Jungle Goals & Animated Zoo Animals */}
        {goals.map((g, idx) => {
          const isTarget = idx === targetGoalIdx % goals.length;
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
              <JungleGoalArchSvg width={goalW} height={goalH} active={isTarget} />
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
          const sz = isTablet ? 38 : 28;
          return (
            <View
              key={st.id}
              pointerEvents="none"
              style={[
                styles.starAnchor,
                { left: sx - sz / 2, top: sy - sz / 2 },
              ]}
            >
              <Svg width={sz} height={sz} viewBox="0 0 36 38">
                <Ellipse cx="18" cy="33.5" rx="10" ry="3.2" fill="rgba(38, 72, 32, 0.24)" />
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

        {/* Bouncy Jungle Mushroom Bumpers (Med: 1, Hard: 2) */}
        {bumpers.map((bmp) => {
          const bx = (bmp.xPct / 100) * fieldSize.w;
          const by = (bmp.yPct / 100) * fieldSize.h;
          const sz = bmp.rPx * 2.15;
          return (
            <View
              key={bmp.id}
              pointerEvents="none"
              style={[
                styles.bumperAnchor,
                { left: bx - sz / 2, top: by - sz / 2 },
              ]}
            >
              <MushroomBumperSvg
                size={sz}
                boinged={boingBumperId?.id === bmp.id}
              />
            </View>
          );
        })}

        {/* Goal Confetti Burst */}
        {burstPos && (
          <View
            key={burstPos.tick}
            pointerEvents="none"
            style={[
              styles.burstAnchor,
              { left: burstPos.x, top: burstPos.y },
            ]}
          >
            <SnapBurst size={isTablet ? 150 : 120} />
          </View>
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

        {/* Crisp Circular Watercolor Rolling Soccer Ball (zero square shadow box!) */}
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
              transform: [{ rotate: `${Math.round(ballRender.rot)}deg` }],
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
  },
  goalAnimalPos: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starAnchor: {
    position: 'absolute',
  },
  bumperAnchor: {
    position: 'absolute',
  },
  burstAnchor: {
    position: 'absolute',
    zIndex: 60,
  },
  whitAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
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
