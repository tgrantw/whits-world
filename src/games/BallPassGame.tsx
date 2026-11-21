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
  Rect,
  Stop,
} from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
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

/** Soft painterly wooden jungle goal arch with leafy storybook vines */
const JungleGoalArchSvg: React.FC<{
  width: number;
  height: number;
  active: boolean;
}> = ({ width, height, active }) => (
  <Svg width={width} height={height} viewBox="0 0 160 110">
    <Ellipse cx="80" cy="95" rx="68" ry="13" fill="rgba(42, 78, 38, 0.2)" />
    {active && (
      <Ellipse
        cx="80"
        cy="91"
        rx="74"
        ry="18"
        fill="rgba(255, 232, 130, 0.54)"
      />
    )}
    <Path
      d="M 22 92 L 26 30 Q 80 12 134 30 L 138 92 Z"
      fill="rgba(255, 249, 236, 0.30)"
    />
    <Path
      d="M 46 24 L 44 90 M 80 18 L 80 90 M 114 24 L 116 90 M 24 52 Q 80 42 136 52 M 23 72 Q 80 64 137 72"
      stroke="rgba(106, 77, 56, 0.22)"
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M 18 95 L 20 30 Q 80 7 140 30 L 142 95"
      fill="none"
      stroke="#6B4D36"
      strokeWidth="15"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.78"
    />
    <Path
      d="M 18 95 L 20 30 Q 80 7 140 30 L 142 95"
      fill="none"
      stroke={active ? '#F6CF65' : '#D4A167'}
      strokeWidth="10.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M 24 29 Q 80 10 136 29"
      fill="none"
      stroke="#FFF4D4"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.58"
    />
    <Path
      d="M 16 28 Q 4 14 22 10 Q 32 18 16 28 Z"
      fill="#6DA85B"
      stroke="#5C4432"
      strokeWidth="2"
    />
    <Path
      d="M 144 28 Q 156 14 138 10 Q 128 18 144 28 Z"
      fill="#7EB869"
      stroke="#5C4432"
      strokeWidth="2"
    />
  </Svg>
);

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
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

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

  // Unified Swipe/Flick OR Tap input across the full clearing!
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);
  const fieldNodeRef = useRef<React.ComponentRef<typeof View> | null>(null);

  const getLocalCoords = (clientX: number, clientY: number) => {
    if (Platform.OS === 'web' && fieldNodeRef.current) {
      const el = fieldNodeRef.current as unknown as {
        getBoundingClientRect?: () => DOMRect;
      };
      const rect = el.getBoundingClientRect?.();
      if (rect) {
        return { x: clientX - rect.left, y: clientY - rect.top };
      }
    }
    return { x: clientX, y: clientY };
  };

  const webFieldProps =
    Platform.OS === 'web'
      ? ({
          onPointerDown: (e: {
            clientX: number;
            clientY: number;
            preventDefault?: () => void;
          }) => {
            e.preventDefault?.();
            soundEngine.unlock();
            const pt = getLocalCoords(e.clientX, e.clientY);
            gestureStartRef.current = pt;
            setAimPreview(pt);
          },
          onPointerMove: (e: { clientX: number; clientY: number }) => {
            if (!gestureStartRef.current) return;
            const pt = getLocalCoords(e.clientX, e.clientY);
            setAimPreview(pt);
          },
          onPointerUp: (e: { clientX: number; clientY: number }) => {
            const start = gestureStartRef.current;
            gestureStartRef.current = null;
            setAimPreview(null);
            if (!start) return;
            const end = getLocalCoords(e.clientX, e.clientY);
            const swipeDx = end.x - start.x;
            const swipeDy = end.y - start.y;
            if (Math.hypot(swipeDx, swipeDy) > 22 && swipeDy < -10) {
              // Flicked upward — kick in swipe direction!
              kickBallToward(
                physRef.current.x + swipeDx * 3,
                physRef.current.y + swipeDy * 3
              );
            } else {
              // Simple toddler tap — kick straight toward where they tapped!
              kickBallToward(end.x, end.y);
            }
          },
        } as Record<string, unknown>)
      : {};

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        soundEngine.unlock();
        gestureStartRef.current = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY,
        };
      },
      onPanResponderRelease: (evt, g) => {
        const start = gestureStartRef.current;
        gestureStartRef.current = null;
        if (!start) return;
        if (Math.hypot(g.dx, g.dy) > 22 && g.dy < -10) {
          kickBallToward(
            physRef.current.x + g.dx * 3,
            physRef.current.y + g.dy * 3
          );
        } else {
          kickBallToward(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        }
      },
    })
  ).current;

  const goalW = difficulty === 1 ? (isTablet ? 190 : 148) : isTablet ? 142 : 104;
  const goalH = Math.round(goalW * 0.68);
  const animalSz = difficulty === 1 ? (isTablet ? 114 : 84) : isTablet ? 86 : 64;
  const whitSize = isTabletLandscape ? 132 : isTablet ? 124 : 96;

  return (
    <View style={styles.container}>
      {/* Full-bleed Painterly Sunlit Jungle Clearing Meadow Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgClearing}
          style={{ width: '100%', height: '100%', opacity: 0.42 }}
          resizeMode="cover"
        />
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={`pitch-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D6EBC6" stopOpacity="0.82" />
              <Stop offset="0.22" stopColor="#B6DC8F" stopOpacity="0.86" />
              <Stop offset="0.62" stopColor="#93C46E" stopOpacity="0.90" />
              <Stop offset="1" stopColor="#72A856" stopOpacity="0.94" />
            </LinearGradient>
            <RadialGradient id={`clearing-${uid}`} cx="50%" cy="52%" r="54%">
              <Stop offset="0" stopColor="#E6F2B3" stopOpacity="0.72" />
              <Stop offset="0.58" stopColor="#B6DC85" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#72A856" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`dappleA-${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF8D2" stopOpacity="0.42" />
              <Stop offset="1" stopColor="#FFF8D2" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width="800" height="600" fill={`url(#pitch-${uid})`} />
          {/* Soft sunlit clearing oval & dappled watercolor sun pools */}
          <Ellipse cx="400" cy="330" rx="350" ry="235" fill={`url(#clearing-${uid})`} />
          <Ellipse cx="210" cy="240" rx="115" ry="64" fill={`url(#dappleA-${uid})`} />
          <Ellipse cx="600" cy="390" rx="130" ry="74" fill={`url(#dappleA-${uid})`} />
          <Ellipse cx="400" cy="450" rx="165" ry="62" fill={`url(#dappleA-${uid})`} />

          {/* Soft storybook chalk-cream meadow rings */}
          <Ellipse
            cx="400"
            cy="332"
            rx="270"
            ry="180"
            fill="none"
            stroke="rgba(255, 250, 236, 0.36)"
            strokeWidth="4.5"
            strokeDasharray="16 14"
          />
          <Circle
            cx="400"
            cy="332"
            r="56"
            fill="none"
            stroke="rgba(255, 250, 236, 0.3)"
            strokeWidth="3.5"
          />

          {/* Subtle painterly grass tufts dotting the meadow */}
          <Path d="M 140 310 Q 144 298 148 310 M 148 310 Q 154 300 158 310" stroke="#5A8F46" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.42" />
          <Path d="M 642 292 Q 646 280 650 292 M 650 292 Q 656 282 660 292" stroke="#5A8F46" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.42" />
          <Path d="M 244 452 Q 248 440 252 452 M 252 452 Q 258 442 262 452" stroke="#4D803B" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.4" />
          <Path d="M 548 474 Q 552 462 556 474 M 556 474 Q 562 464 566 474" stroke="#4D803B" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.4" />

          {/* Soft scalloped watercolor canopy edge along top */}
          <Path
            d="M -20 64 C 30 22 96 18 144 50 C 194 12 270 16 318 50 C 374 14 452 14 504 50 C 556 16 632 14 686 50 C 734 18 784 26 820 60 L 820 -10 L -20 -10 Z"
            fill="#5D924E"
            opacity="0.72"
          />
          <Path
            d="M -20 44 C 40 10 112 10 164 38 C 224 4 294 8 348 36 C 406 4 484 6 538 36 C 594 8 666 6 720 36 C 760 14 794 20 820 42 L 820 -10 L -20 -10 Z"
            fill="#487B40"
            opacity="0.82"
          />

          {/* Soft wildflowers dotting the edges */}
          <Circle cx="54" cy="480" r="7.5" fill="#F8DB74" opacity="0.88" />
          <Circle cx="54" cy="480" r="3" fill="#DF7A52" opacity="0.88" />
          <Circle cx="744" cy="462" r="8.5" fill="#F4A0B6" opacity="0.88" />
          <Circle cx="744" cy="462" r="3.5" fill="#F8DB74" opacity="0.88" />
          <Circle cx="86" cy="240" r="6.5" fill="#FFF9EC" opacity="0.82" />
          <Circle cx="722" cy="252" r="6.5" fill="#FFF9EC" opacity="0.82" />
        </Svg>
      </View>

      <GameHeader
        totalSteps={GOALS_TO_WIN}
        completedSteps={goalsScored}
        difficulty={difficulty}
        onDifficultyChange={(d) => startFreshGame(d, roundSeed)}
      />

      {/* Full-bleed Interactive Play Field */}
      <View
        ref={fieldNodeRef}
        style={styles.field}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 100 && h > 100) {
            setFieldSize({ w, h });
          }
        }}
        {...(Platform.OS === 'web' ? webFieldProps : nativePan.panHandlers)}
      >
        {/* Subtle aim guide line while swiping or tapping */}
        {aimPreview && !physRef.current.moving && (
          <Svg
            width={fieldSize.w}
            height={fieldSize.h}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Path
              d={`M ${ballRender.x} ${ballRender.y} L ${aimPreview.x} ${aimPreview.y}`}
              stroke="rgba(255, 250, 236, 0.72)"
              strokeWidth="5.5"
              strokeDasharray="10 10"
              strokeLinecap="round"
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
              <Svg width={sz} height={sz} viewBox="0 0 36 36">
                <Path
                  d="M18 3 L22.4 12.2 L32.5 13.6 L25.1 20.6 L26.9 30.6 L18 25.8 L9.1 30.6 L10.9 20.6 L3.5 13.6 L13.6 12.2 Z"
                  fill="#FAD968"
                  stroke="#7D5938"
                  strokeWidth="2"
                  strokeLinejoin="round"
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
