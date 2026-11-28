import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { STORYBOOK_ANIMALS, STORYBOOK_ASSETS } from '../assets/assetMap';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { Difficulty, getAnimalDisplayName } from '../theme';
import { ExhibitAnimalKind } from '../components/ZooExhibitAnimals';

const GOAL_ANIMALS: ExhibitAnimalKind[] = ['lion', 'elephant', 'giraffe', 'panda'];
const GOALS_TO_WIN = 4;
const INK = '#5C4432';

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

interface ActiveGesture {
  mode: 'touch' | 'pointer';
  id: number;
  kind: DragKind;
  start: { x: number; y: number };
  last: { x: number; y: number };
  maxTravel: number;
  samples: { x: number; y: number; t: number }[];
}

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface CanvasRipple {
  x: number;
  y: number;
  age: number;
  duration: number;
}

interface CanvasBanner {
  x: number;
  y: number;
  age: number;
  duration: number;
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

function buildBumpers(
  difficulty: Difficulty,
  isTablet: boolean,
  targetGoalBaseXPct: number,
  targetGoalIdx: number
): BumperSpec[] {
  const rPx = isTablet ? 32 : 23;
  if (difficulty === 1) return [];
  if (difficulty === 2) {
    let xPct = 50;
    if (targetGoalBaseXPct < 35) xPct = 58;
    else if (targetGoalBaseXPct > 65) xPct = 42;
    else xPct = targetGoalIdx % 2 === 0 ? 31 : 69;
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

function getWebAssetUri(asset: unknown): string | null {
  if (!asset) return null;
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'object' && asset !== null) {
    const obj = asset as { uri?: string; default?: string };
    if (typeof obj.uri === 'string') return obj.uri;
    if (typeof obj.default === 'string') return obj.default;
  }
  return null;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawCornerFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pennantColor: string,
  flipX: boolean
) {
  const dir = flipX ? -1 : 1;
  ctx.save();
  // Ground shadow
  ctx.fillStyle = 'rgba(38, 68, 30, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pennant
  ctx.fillStyle = pennantColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.quadraticCurveTo(x + dir * 7, y - 24, x + dir * 14, y - 17);
  ctx.quadraticCurveTo(x + dir * 7, y - 13, x, y - 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bamboo pole
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 23);
  ctx.stroke();

  ctx.strokeStyle = '#E4B878';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 23);
  ctx.stroke();

  // Top finial
  ctx.fillStyle = '#F8D86A';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(x, y - 23, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawJungleGoal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  goalW: number,
  goalH: number,
  active: boolean,
  locked: boolean
) {
  ctx.save();
  const x0 = cx - goalW / 2;
  const y0 = cy - goalH / 2;
  const sx = goalW / 160;
  const sy = goalH / 110;
  ctx.translate(x0, y0);
  ctx.scale(sx, sy);

  // Aim-lock glow frame
  if (locked) {
    roundedRectPath(ctx, -6, -6, 172, 118, 26);
    ctx.fillStyle = 'rgba(255, 232, 118, 0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 240, 150, 0.92)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // Soft grass shadow
  ctx.fillStyle = 'rgba(38, 72, 32, 0.26)';
  ctx.beginPath();
  ctx.ellipse(80, 95, 70, 12.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Active target golden glow
  if (active) {
    ctx.fillStyle = 'rgba(255, 224, 102, 0.44)';
    ctx.beginPath();
    ctx.ellipse(80, 91, 76, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Net backdrop
  ctx.fillStyle = 'rgba(255, 249, 236, 0.30)';
  ctx.beginPath();
  ctx.moveTo(21, 92);
  ctx.lineTo(32, 34);
  ctx.quadraticCurveTo(80, 22, 128, 34);
  ctx.lineTo(139, 92);
  ctx.closePath();
  ctx.fill();

  // Rear support frame
  ctx.strokeStyle = 'rgba(92, 68, 50, 0.34)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(29, 90);
  ctx.lineTo(35, 37);
  ctx.quadraticCurveTo(80, 25, 125, 37);
  ctx.lineTo(131, 90);
  ctx.stroke();

  // Rope netting grid
  const drawNetLines = (stroke: string, lw: number) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(42, 29); ctx.lineTo(38, 91);
    ctx.moveTo(58, 24); ctx.lineTo(56, 91);
    ctx.moveTo(80, 22); ctx.lineTo(80, 91);
    ctx.moveTo(102, 24); ctx.lineTo(104, 91);
    ctx.moveTo(118, 29); ctx.lineTo(122, 91);
    ctx.moveTo(27, 48); ctx.quadraticCurveTo(80, 39, 133, 48);
    ctx.moveTo(25, 63); ctx.quadraticCurveTo(80, 55, 135, 63);
    ctx.moveTo(23, 78); ctx.quadraticCurveTo(80, 71, 137, 78);
    ctx.stroke();
  };
  drawNetLines('rgba(92, 68, 50, 0.24)', 2.4);
  drawNetLines('rgba(255, 250, 236, 0.68)', 1.4);

  // Carved wooden frame (ink contour + warm fill)
  ctx.beginPath();
  ctx.moveTo(18, 94);
  ctx.lineTo(20, 28);
  ctx.quadraticCurveTo(80, 9, 140, 28);
  ctx.lineTo(142, 94);
  ctx.strokeStyle = '#5E412B';
  ctx.lineWidth = 15.5;
  ctx.stroke();

  ctx.strokeStyle = active ? '#F4C654' : '#D29A58';
  ctx.lineWidth = 10.5;
  ctx.stroke();

  // Crossbar sunlight highlight
  ctx.beginPath();
  ctx.moveTo(25, 26);
  ctx.quadraticCurveTo(80, 9.5, 135, 26);
  ctx.strokeStyle = active ? 'rgba(255,247,220,0.88)' : 'rgba(255,247,220,0.62)';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Corner green leaves & blossoms
  const drawLeaf = (x: number, y: number, flip: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);
    ctx.fillStyle = '#66A554';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -12, 0, -20);
    ctx.quadraticCurveTo(12, -13, 0, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = active ? '#FFE672' : '#F6A4BA';
    ctx.beginPath();
    ctx.arc(0, -6, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  drawLeaf(18, 28, 1);
  drawLeaf(142, 28, -1);

  ctx.restore();
}

function drawTargetArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  bobOffset: number,
  isTablet: boolean
) {
  const s = isTablet ? 1.0 : 0.8;
  ctx.save();
  ctx.translate(cx, topY + bobOffset);
  ctx.scale(s, s);
  ctx.fillStyle = '#FFE066';
  ctx.strokeStyle = '#6A4822';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(-11, -2);
  ctx.lineTo(-4, -2);
  ctx.lineTo(-4, -12);
  ctx.lineTo(4, -12);
  ctx.lineTo(4, -2);
  ctx.lineTo(11, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMushroomBumper(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rPx: number,
  scale: number
) {
  const sz = rPx * 2.15;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale * (sz / 100), scale * (sz / 100));
  ctx.translate(-50, -50);

  // Shadow
  ctx.fillStyle = 'rgba(44, 78, 38, 0.24)';
  ctx.beginPath();
  ctx.ellipse(50, 87, 30, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.fillStyle = '#F5E6C8';
  ctx.strokeStyle = '#6A4D38';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(38, 56);
  ctx.lineTo(34, 83);
  ctx.quadraticCurveTo(50, 91, 66, 83);
  ctx.lineTo(62, 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cap
  ctx.fillStyle = '#DF7258';
  ctx.beginPath();
  ctx.moveTo(11, 56);
  ctx.bezierCurveTo(11, 23, 30, 11, 50, 11);
  ctx.bezierCurveTo(70, 11, 89, 23, 89, 56);
  ctx.bezierCurveTo(72, 64, 28, 64, 11, 56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cream spots
  ctx.fillStyle = 'rgba(255, 247, 228, 0.92)';
  [
    { x: 34, y: 35, r: 7.5 },
    { x: 59, y: 29, r: 9 },
    { x: 72, y: 46, r: 5.5 },
    { x: 26, y: 48, r: 4.8 },
  ].forEach((sp) => {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Jungle Ball Pass (100% Single-Canvas 2D Renderer on Web):
 * - Renders the ENTIRE pitch, goals, animals, stars, mushrooms, Whit, aim guide,
 *   confetti, shadow, trail, and soccer ball onto ONE opaque HTML5 <canvas> cleared
 *   cleanly every frame — mathematically eliminating Android/iPad GPU compositor
 *   tile corruption ("glitchy colors") and ghosted multi-ball trails!
 * - Direct non-passive touch listeners on the canvas for silky-smooth tap, swipe,
 *   slingshot, and direct dribble controls at a calm, joyful toddler pace.
 */
export const BallPassGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundSeed, setRoundSeed] = useState(0);
  const [goalsScored, setGoalsScored] = useState(0);
  const [targetGoalIdx, setTargetGoalIdx] = useState(1);
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

  const ballRadius = isTablet ? 36 : 26;

  // Refs synced for the 60fps single-canvas physics + draw loop (ZERO React re-renders!)
  const fieldRef = useRef(fieldSize);
  fieldRef.current = fieldSize;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;
  const isTabletRef = useRef(isTablet);
  isTabletRef.current = isTablet;
  const isTabletLandscapeRef = useRef(isTabletLandscape);
  isTabletLandscapeRef.current = isTabletLandscape;
  const ballRadiusRef = useRef(ballRadius);
  ballRadiusRef.current = ballRadius;
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
  const roundSeedRef = useRef(roundSeed);
  roundSeedRef.current = roundSeed;
  const targetGoalIdxRef = useRef(targetGoalIdx);
  targetGoalIdxRef.current = targetGoalIdx;

  const starsRef = useRef<PathStar[]>(buildStars(activeGoal.baseXPct, activeGoal.yPct));
  const aimRef = useRef<AimVisual | null>(null);
  const particlesRef = useRef<CanvasParticle[]>([]);
  const ripplesRef = useRef<CanvasRipple[]>([]);
  const bannerRef = useRef<CanvasBanner | null>(null);
  const boingScaleRef = useRef<Record<string, number>>({});
  const celebratingGoalRef = useRef<{ id: number; until: number } | null>(null);
  const whitCheerUntilRef = useRef<number>(0);

  const physRef = useRef({
    x: fieldSize.w * 0.5,
    y: fieldSize.h * 0.7,
    vx: 0,
    vy: 0,
    rot: 0,
    phase: 'ready' as BallPhase,
    time: 0,
    swayTime: 0,
    goalSwayOffsetPx: 0,
    kickScale: 1,
    flightTime: 0,
    returnStartX: fieldSize.w * 0.5,
    returnStartY: fieldSize.h * 0.7,
    returnT: 0,
    trail: [] as { x: number; y: number }[],
    trailTick: 0,
    lastOtherGoalHitAt: 0,
    lastBumperBoingAt: 0,
  });

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Preload hand-painted storybook PNGs into HTMLImageElement cache for 2D canvas drawing
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const entries: [string, unknown][] = [
      ['bgClearing', STORYBOOK_ASSETS.bgClearing],
      ['jungleBall', STORYBOOK_ASSETS.jungleBall],
      ['whitIdle', STORYBOOK_ASSETS.whitIdle],
      ['whitCheer', STORYBOOK_ASSETS.whitCheer],
      ['lion', STORYBOOK_ANIMALS.lion],
      ['elephant', STORYBOOK_ANIMALS.elephant],
      ['giraffe', STORYBOOK_ANIMALS.giraffe],
      ['panda', STORYBOOK_ANIMALS.panda],
    ];
    entries.forEach(([key, asset]) => {
      if (imgCacheRef.current[key]) return;
      const uri = getWebAssetUri(asset);
      if (!uri) return;
      const img = new window.Image();
      img.src = uri;
      imgCacheRef.current[key] = img;
    });
  }, []);

  const spawnBurst = useCallback((x: number, y: number, count: number) => {
    const palette = ['#FFE066', '#FF8E6E', '#7EE081', '#7AD8F5', '#FFF8DC', '#F59AC0'];
    const list = particlesRef.current;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = 90 + Math.random() * 190;
      list.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 5 + Math.random() * 5.5,
        color: palette[i % palette.length],
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
      });
    }
    if (list.length > 90) {
      particlesRef.current = list.slice(-90);
    }
  }, []);

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
      const nextGoals = buildGoals(nextDiff, roundSeedRef.current);
      const currIdx = targetGoalIdxRef.current;
      const nextIdx =
        nextGoals.length <= 1
          ? 0
          : (currIdx + 1 + Math.floor(Math.random() * (nextGoals.length - 1))) %
            nextGoals.length;
      const g = nextGoals[nextIdx];
      celebratingGoalRef.current = null;
      bannerRef.current = null;
      setTargetGoalIdx(nextIdx);
      starsRef.current = buildStars(g.baseXPct, g.yPct);
      resetBallToWhit();

      if (nextScored >= GOALS_TO_WIN) {
        setTimeout(() => {
          soundEngine.playWin();
          addStar(1);
          whitCheerUntilRef.current = performance.now() + 3000;
          setWon(true);
        }, 380);
      }
    },
    [addStar, resetBallToWhit]
  );

  const startFreshGame = useCallback(
    (nextDiff: Difficulty, nextSeed: number) => {
      clearTimers();
      const nextGoals = buildGoals(nextDiff, nextSeed);
      const startIdx = nextGoals.length > 1 ? 1 : 0;
      setDifficulty(nextDiff);
      setRoundSeed(nextSeed);
      setGoalsScored(0);
      setTargetGoalIdx(startIdx);
      starsRef.current = buildStars(
        nextGoals[startIdx].baseXPct,
        nextGoals[startIdx].yPct
      );
      celebratingGoalRef.current = null;
      bannerRef.current = null;
      aimRef.current = null;
      particlesRef.current = [];
      ripplesRef.current = [];
      whitCheerUntilRef.current = 0;
      setWon(false);
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

  const collectTouchedStars = useCallback((bx: number, by: number) => {
    const f = fieldRef.current;
    const r = ballRadiusRef.current;
    starsRef.current.forEach((st, idx) => {
      if (st.collected) return;
      const sx = (st.xPct / 100) * f.w;
      const sy = (st.yPct / 100) * f.h;
      if (Math.hypot(bx - sx, by - sy) < r + 30) {
        st.collected = true;
        soundEngine.playStarCollect(idx);
        spawnBurst(sx, sy, 10);
      }
    });
  }, [spawnBurst]);

  const triggerGoalScored = useCallback(
    (goalX: number, goalY: number) => {
      const p = physRef.current;
      if (p.phase === 'scored' || wonRef.current) return;
      p.phase = 'scored';
      p.vx = 0;
      p.vy = 0;
      p.x = goalX + (isTabletRef.current ? 34 : 24);
      p.y = goalY + (isTabletRef.current ? 14 : 10);
      p.trail = [];
      p.kickScale = 0.84;

      const animal = activeGoalRef.current.animal;
      const goalId = activeGoalRef.current.id;

      soundEngine.playGoalCheer();
      soundEngine.speakWord(`Goal! ${getAnimalDisplayName(animal)}!`);
      setTimeout(() => soundEngine.playAnimalSound(animal), 160);
      collectSticker(animal);

      aimRef.current = null;
      spawnBurst(goalX, goalY, 26);
      bannerRef.current = { x: goalX, y: goalY - 26, age: 0, duration: 0.9 };
      celebratingGoalRef.current = { id: goalId, until: performance.now() + 920 };
      whitCheerUntilRef.current = performance.now() + 950;

      const nextScored = goalsScoredRef.current + 1;
      setGoalsScored(nextScored);

      clearTimers();
      advanceTimerRef.current = setTimeout(() => {
        advanceTarget(nextScored);
      }, 900);
    },
    [advanceTarget, clearTimers, collectSticker, spawnBurst]
  );

  const triggerFriendlyPassBack = useCallback(
    (other: GoalSpec, gx: number, gy: number) => {
      const p = physRef.current;
      const now = Date.now();
      if (now - p.lastOtherGoalHitAt < 500) return;
      p.lastOtherGoalHitAt = now;
      soundEngine.playAnimalSound(other.animal);
      spawnBurst(gx, gy, 12);
      celebratingGoalRef.current = { id: other.id, until: performance.now() + 500 };
      beginSmoothReturn(false);
    },
    [beginSmoothReturn, spawnBurst]
  );

  const checkGoalCollisions = useCallback(
    (bx: number, by: number): boolean => {
      const diff = diffRef.current;
      const tab = isTabletRef.current;
      const target = activeGoalRef.current;
      const targetPos = getGoalCenter(target);
      const targetHitR = diff === 1 ? (tab ? 96 : 82) : tab ? 78 : 66;

      if (Math.hypot(bx - targetPos.x, by - targetPos.y) < targetHitR) {
        triggerGoalScored(targetPos.x, targetPos.y);
        return true;
      }

      const otherHitR = tab ? 62 : 50;
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
    [getGoalCenter, triggerFriendlyPassBack, triggerGoalScored]
  );

  const kickBallAlong = useCallback(
    (dirX: number, dirY: number, speedOverride?: number) => {
      const p = physRef.current;
      if (p.phase === 'scored' || wonRef.current) return;

      soundEngine.unlock();
      soundEngine.playKick();

      let dx = dirX;
      let dy = dirY;
      if (Math.hypot(dx, dy) < 6) {
        const tp = getGoalCenter(activeGoalRef.current);
        dx = tp.x - p.x;
        dy = tp.y - p.y;
      }

      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / len;
      const ny = Math.min(-0.34, dy / len);
      const norm = Math.hypot(nx, ny);

      const tab = isTabletRef.current;
      const baseSpeed = tab ? 460 : 380;
      const minSpeed = tab ? 400 : 330;
      const maxSpeed = tab ? 560 : 460;
      const speed = speedOverride
        ? Math.max(minSpeed, Math.min(maxSpeed, speedOverride))
        : baseSpeed;

      p.vx = (nx / norm) * speed;
      p.vy = (ny / norm) * speed;
      p.phase = 'flying';
      p.flightTime = 0;
      p.kickScale = 1.18;
      p.trail = [{ x: p.x, y: p.y }];
      p.trailTick = 0;
    },
    [getGoalCenter]
  );

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

  // =========================================================================
  // SINGLE OPAQUE HTML5 <canvas> ELEMENT & 60FPS PHYSICS + RENDER LOOP
  // =========================================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  const handleCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    setCanvasEl((prev) => (prev === el ? prev : el));
  }, []);

  const loopFnsRef = useRef({
    beginSmoothReturn,
    checkGoalCollisions,
    collectTouchedStars,
    spawnBurst,
  });
  loopFnsRef.current = {
    beginSmoothReturn,
    checkGoalCollisions,
    collectTouchedStars,
    spawnBurst,
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let rafId = 0;
    let lastTs = performance.now();

    const renderFrame = (ctx: CanvasRenderingContext2D, w: number, h: number, now: number, dt: number) => {
      const p = physRef.current;
      const diff = diffRef.current;
      const tab = isTabletRef.current;
      const r = ballRadiusRef.current;
      const imgs = imgCacheRef.current;

      // 1. OPAQUE BASE FILL (100% clears every single pixel — ZERO ghost balls ever!)
      ctx.fillStyle = '#7DB55B';
      ctx.fillRect(0, 0, w, h);

      // Soft watercolor jungle clearing surround
      const bgImg = imgs.bgClearing;
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.42;
        const scale = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
        const dw = bgImg.naturalWidth * scale;
        const dh = bgImg.naturalHeight * scale;
        ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.restore();
      }

      // 2. Mowed Green Soccer Pitch (10 crisp alternating stripes)
      const padX = Math.max(14, Math.min(44, Math.round(w * (tab ? 0.05 : 0.04))));
      const apronPadX = tab ? 12 : 8;
      const apronTop = Math.max(8, Math.round(h * 0.11));
      const apronBot = h - Math.max(8, Math.round(h * 0.025));
      const apronH = Math.max(160, apronBot - apronTop);
      const apronLeft = Math.max(4, padX - apronPadX);
      const apronW = Math.max(200, w - apronLeft * 2);
      const apronR = tab ? 22 : 16;

      // Soft turf frame shadow
      ctx.save();
      roundedRectPath(ctx, apronLeft, apronTop + 4, apronW, apronH, apronR);
      ctx.fillStyle = 'rgba(34, 68, 28, 0.24)';
      ctx.fill();

      // Clipped mowed stripes inside rounded apron
      roundedRectPath(ctx, apronLeft, apronTop, apronW, apronH, apronR);
      ctx.clip();
      const stripeCount = 10;
      const stripeH = apronH / stripeCount;
      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#A3D670' : '#8CC360';
        ctx.fillRect(apronLeft, apronTop + i * stripeH, apronW, stripeH + 1);
      }
      ctx.restore();

      // Subtle apron border
      roundedRectPath(ctx, apronLeft, apronTop, apronW, apronH, apronR);
      ctx.strokeStyle = 'rgba(64, 96, 46, 0.34)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Crisp Chalk Pitch Lines
      const lineTop = Math.max(24, Math.round(h * 0.155));
      const lineBot = h - Math.max(16, Math.round(h * 0.042));
      const pitchH = Math.max(160, lineBot - lineTop);
      const pitchW = Math.max(180, w - padX * 2);
      const midY = Math.round(h * 0.5);
      const kickY = Math.round(h * 0.7);
      const chalkW = tab ? 3.5 : 2.5;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 251, 238, 0.88)';
      ctx.fillStyle = 'rgba(255, 251, 238, 0.88)';
      ctx.lineWidth = chalkW;

      // Outer touchline
      ctx.strokeRect(padX, lineTop, pitchW, pitchH);

      // Halfway line
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + pitchW, midY);
      ctx.stroke();

      // Center circle + center dot
      const centerR = Math.round(Math.min(pitchW * 0.14, pitchH * 0.125));
      ctx.beginPath();
      ctx.arc(w * 0.5, midY, centerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w * 0.5, midY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Upper attacking box & 6-yard box
      const topBoxH = Math.round(pitchH * (diff === 1 ? 0.22 : 0.23));
      const topBoxW =
        diff === 1
          ? Math.round(pitchW * 0.54)
          : Math.round(pitchW * (w < 560 ? 0.94 : 0.86));
      ctx.strokeRect(w * 0.5 - topBoxW / 2, lineTop, topBoxW, topBoxH);

      const topSixH = Math.round(pitchH * 0.095);
      const topSixW = Math.round(pitchW * 0.26);
      ctx.strokeRect(w * 0.5 - topSixW / 2, lineTop, topSixW, topSixH);

      // Lower box & keeper box around Whit
      const botBoxTop = Math.min(lineBot - 32, Math.round(h * 0.755));
      const botBoxH = Math.max(28, lineBot - botBoxTop);
      const botBoxW = Math.round(pitchW * 0.52);
      ctx.strokeRect(w * 0.5 - botBoxW / 2, botBoxTop, botBoxW, botBoxH);

      const botSixH = Math.max(18, Math.round(botBoxH * 0.48));
      const botSixW = Math.round(pitchW * 0.28);
      ctx.strokeRect(w * 0.5 - botSixW / 2, lineBot - botSixH, botSixW, botSixH);

      // Kick spot marker (50%, 70%)
      ctx.fillStyle = 'rgba(255, 251, 230, 0.24)';
      ctx.beginPath();
      ctx.arc(w * 0.5, kickY, tab ? 20 : 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 251, 238, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 251, 238, 0.9)';
      ctx.beginPath();
      ctx.arc(w * 0.5, kickY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Corner flags
      drawCornerFlag(ctx, padX, lineTop, '#E6734E', false);
      drawCornerFlag(ctx, w - padX, lineTop, '#F6CF58', true);
      drawCornerFlag(ctx, padX, lineBot, '#F6CF58', false);
      drawCornerFlag(ctx, w - padX, lineBot, '#E6734E', true);

      // 4. Tap Ripples
      const nextRipples: CanvasRipple[] = [];
      for (const rip of ripplesRef.current) {
        rip.age += dt;
        if (rip.age < rip.duration) {
          const t = rip.age / rip.duration;
          ctx.save();
          ctx.globalAlpha = 0.85 * (1 - t);
          ctx.strokeStyle = '#FFF4B8';
          ctx.fillStyle = 'rgba(255, 244, 180, 0.22)';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, 12 + t * 38, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          nextRipples.push(rip);
        }
      }
      ripplesRef.current = nextRipples;

      // 5. Aim Guide Dots & Slingshot Band
      const aim = aimRef.current;
      if (aim) {
        const dx = aim.toX - aim.fromX;
        const dy = aim.toY - aim.fromY;
        const dist = Math.hypot(dx, dy);
        if (dist >= 14) {
          const lockedTarget = aim.lockedGoalId === activeGoalRef.current.id;
          ctx.save();
          if (aim.isSlingshot) {
            [0.25, 0.55, 0.85].forEach((t) => {
              const sx = aim.fromX + (aim.anchorX - aim.fromX) * t;
              const sy = aim.fromY + (aim.anchorY - aim.fromY) * t;
              ctx.fillStyle = '#FFE27A';
              ctx.strokeStyle = '#6A4822';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(sx, sy, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          }

          const dotCount = 7;
          for (let i = 0; i < dotCount; i++) {
            const t = (i + 1) / (dotCount + 0.6);
            const x = aim.fromX + dx * t;
            const y = aim.fromY + dy * t;
            const dotR = 6 - i * 0.3;
            ctx.globalAlpha = 0.95 - i * 0.06;
            ctx.fillStyle = lockedTarget ? '#FFE066' : '#FFFBEA';
            ctx.strokeStyle = lockedTarget ? '#6A4822' : 'rgba(54, 90, 42, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Tip ring + arrow
          const ang = Math.atan2(dy, dx);
          ctx.globalAlpha = 1;
          ctx.translate(aim.toX, aim.toY);
          ctx.rotate(ang);
          ctx.fillStyle = lockedTarget
            ? 'rgba(255, 224, 102, 0.58)'
            : 'rgba(255, 249, 224, 0.45)';
          ctx.strokeStyle = lockedTarget ? '#FFE066' : '#FFFBEA';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#6A4822';
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-4, -6);
          ctx.lineTo(-4, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 6. Goals & Hand-Painted Zoo Animals
      const goalW = diff === 1 ? (tab ? 196 : 152) : tab ? 146 : 108;
      const goalH = Math.round(goalW * 0.68);
      const animalSz = diff === 1 ? (tab ? 114 : 84) : tab ? 86 : 64;
      const celeb = celebratingGoalRef.current;

      goalsRef.current.forEach((g, idx) => {
        const isTarget = g.id === activeGoalRef.current.id;
        const isLocked = aim?.lockedGoalId === g.id;
        const isCeleb = Boolean(celeb && celeb.id === g.id && now < celeb.until);
        const cx = (g.baseXPct / 100) * w + (isTarget ? p.goalSwayOffsetPx : 0);
        const cy = (g.yPct / 100) * h;

        drawJungleGoal(ctx, cx, cy, goalW, goalH, isTarget || isLocked, isLocked);

        if (isTarget && !wonRef.current) {
          const bob = Math.sin(p.time * 6) * 5;
          drawTargetArrow(ctx, cx, cy - goalH / 2 - 14, bob, tab);
        }

        // Draw animated animal inside the goal
        const animalImg = imgs[g.animal];
        if (animalImg && animalImg.complete && animalImg.naturalWidth > 0) {
          const hopY = isCeleb
            ? -Math.abs(Math.sin(p.time * 14)) * 18
            : isTarget
            ? -Math.abs(Math.sin(p.time * 4.5 + idx)) * 7
            : Math.sin(p.time * 2.4 + idx * 1.7) * 2;
          const breathScale = isCeleb
            ? 1.08
            : 1 + Math.sin(p.time * 2.8 + idx) * 0.025;
          const drawSz = animalSz * breathScale;
          const ax = cx - drawSz / 2;
          const ay = cy + goalH * 0.5 - drawSz + 10 + hopY;
          ctx.drawImage(animalImg, ax, ay, drawSz, drawSz);
        }
      });

      // 7. Collectible Path Stars
      starsRef.current.forEach((st, idx) => {
        if (st.collected) return;
        const sx = (st.xPct / 100) * w;
        const sy = (st.yPct / 100) * h + Math.sin(p.time * 3.4 + idx * 1.4) * 3;
        const outerR = tab ? 18 : 13.5;
        ctx.save();
        ctx.fillStyle = 'rgba(38, 72, 32, 0.22)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + outerR + 1, outerR * 0.65, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();

        drawStarShape(ctx, sx, sy, outerR, outerR * 0.48);
        ctx.fillStyle = '#FAD968';
        ctx.strokeStyle = '#7D5938';
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // 8. Bouncy Mushroom Bumpers
      bumpersRef.current.forEach((bmp) => {
        const bx = (bmp.xPct / 100) * w;
        const by = (bmp.yPct / 100) * h;
        const currScale = boingScaleRef.current[bmp.id] ?? 1;
        const relaxed = currScale + (1 - currScale) * Math.min(1, dt * 10);
        boingScaleRef.current[bmp.id] = Math.abs(relaxed - 1) < 0.005 ? 1 : relaxed;
        drawMushroomBumper(ctx, bx, by, bmp.rPx, relaxed);
      });

      // 9. Whit the Gorilla Kicker
      const whitSize = isTabletLandscapeRef.current ? 132 : tab ? 124 : 96;
      const isWhitCheering = now < whitCheerUntilRef.current;
      const whitImg = isWhitCheering ? imgs.whitCheer || imgs.whitIdle : imgs.whitIdle;
      if (whitImg && whitImg.complete && whitImg.naturalWidth > 0) {
        const whitBob = isWhitCheering
          ? -Math.abs(Math.sin(p.time * 12)) * 10
          : Math.sin(p.time * 2.5) * 2.5;
        const wx = w * 0.5 - whitSize / 2;
        const wy = h * 0.77 + whitBob;
        ctx.drawImage(whitImg, wx, wy, whitSize, whitSize);
      }

      // 10. Soft Comet Trail (while flying)
      if (p.phase === 'flying') {
        p.trail.forEach((pt, idx) => {
          const trR = Math.max(5, r * (0.62 - idx * 0.11));
          ctx.save();
          ctx.globalAlpha = Math.max(0.1, 0.42 - idx * 0.09);
          ctx.fillStyle = '#FFF7D6';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, trR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 11. Inviting Ready / Dragging Golden Halo
      if (p.phase === 'ready' || p.phase === 'dragging') {
        const pulse = (Math.sin(p.time * 3.6) + 1) * 0.5;
        const haloR =
          p.phase === 'dragging'
            ? r + 15
            : (r + 12) * (0.96 + pulse * 0.12);
        ctx.save();
        ctx.globalAlpha = p.phase === 'dragging' ? 0.95 : 0.35 + pulse * 0.42;
        ctx.fillStyle =
          p.phase === 'dragging'
            ? 'rgba(255, 232, 120, 0.28)'
            : 'rgba(255, 245, 190, 0.16)';
        ctx.strokeStyle = p.phase === 'dragging' ? '#FFE066' : 'rgba(255, 245, 190, 0.92)';
        ctx.lineWidth = p.phase === 'dragging' ? 4 : 3.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 12. Ball Ground Shadow (non-rotating)
      ctx.save();
      ctx.fillStyle = 'rgba(34, 68, 32, 0.28)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + r * 0.86, r * 0.78, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 13. THE SINGLE CRISP ROTATING WATERCOLOR SOCCER BALL
      const ballImg = imgs.jungleBall;
      const drawBallR = r * p.kickScale;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      if (ballImg && ballImg.complete && ballImg.naturalWidth > 0) {
        ctx.drawImage(ballImg, -drawBallR, -drawBallR, drawBallR * 2, drawBallR * 2);
      } else {
        ctx.fillStyle = '#FFF7E4';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, drawBallR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 14. Confetti Sparkle Particles
      const alive: CanvasParticle[] = [];
      for (const pt of particlesRef.current) {
        pt.life += dt;
        if (pt.life < pt.maxLife) {
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += 260 * dt;
          const alpha = 1 - pt.life / pt.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * (0.5 + 0.5 * alpha), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          alive.push(pt);
        }
      }
      particlesRef.current = alive;

      // 15. Floating "⭐ GOAL! ⭐" Banner
      const ban = bannerRef.current;
      if (ban) {
        ban.age += dt;
        if (ban.age < ban.duration) {
          const t = ban.age / ban.duration;
          const alpha = t < 0.15 ? t / 0.15 : t > 0.72 ? (1 - t) / 0.28 : 1;
          const bx = Math.max(82, Math.min(w - 82, ban.x));
          const by = Math.max(26, ban.y - Math.min(1, t * 4) * 14);
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          roundedRectPath(ctx, bx - 68, by - 18, 136, 36, 18);
          ctx.fillStyle = '#FFF5C4';
          ctx.fill();
          ctx.strokeStyle = '#5C3D20';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.fillStyle = '#5C3D20';
          ctx.font = '900 16px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐ GOAL! ⭐', bx, by + 1);
          ctx.restore();
        } else {
          bannerRef.current = null;
        }
      }
    };

    const step = (now: number) => {
      const dt = Math.min(0.032, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const p = physRef.current;
      const f = fieldRef.current;
      const r = ballRadiusRef.current;
      const diff = diffRef.current;
      const g = activeGoalRef.current;
      const fns = loopFnsRef.current;

      p.time += dt;

      if (diff === 3 && !wonRef.current) {
        p.swayTime += dt;
        const maxSway = Math.min(68, f.w * 0.1);
        p.goalSwayOffsetPx = Math.sin(p.swayTime * 1.15) * maxSway;
      } else {
        p.goalSwayOffsetPx = 0;
      }

      const restScale = p.phase === 'scored' ? 0.84 : p.phase === 'dragging' ? 1.1 : 1;
      if (Math.abs(p.kickScale - restScale) > 0.004) {
        p.kickScale += (restScale - p.kickScale) * Math.min(1, dt * 12);
      } else {
        p.kickScale = restScale;
      }

      if (p.phase === 'flying') {
        p.flightTime += dt;
        const goalX = (g.baseXPct / 100) * f.w + p.goalSwayOffsetPx;
        const goalY = (g.yPct / 100) * f.h;

        const toGoalX = goalX - p.x;
        const toGoalY = goalY - p.y;
        const distToGoal = Math.hypot(toGoalX, toGoalY);
        const speed = Math.hypot(p.vx, p.vy);

        if (speed > 60 && p.vy < 0 && distToGoal > 10) {
          const dirDot = (p.vx * toGoalX + p.vy * toGoalY) / (speed * distToGoal);
          const assistThreshold = diff === 1 ? 0.28 : diff === 2 ? 0.56 : 0.68;
          if (dirDot > assistThreshold) {
            const steerStrength = diff === 1 ? 6.5 : diff === 2 ? 4.2 : 2.8;
            const desiredVx = (toGoalX / distToGoal) * speed;
            const desiredVy = (toGoalY / distToGoal) * speed;
            p.vx += (desiredVx - p.vx) * Math.min(1, steerStrength * dt);
            p.vy += (desiredVy - p.vy) * Math.min(1, steerStrength * dt);
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const friction = Math.pow(0.992, dt * 60);
        p.vx *= friction;
        p.vy *= friction;
        p.rot += (p.vx * 0.62 + Math.abs(p.vy) * 0.42) * dt;

        p.trailTick += dt;
        if (p.trailTick >= 0.04) {
          p.trailTick = 0;
          p.trail = [{ x: p.x, y: p.y }, ...p.trail].slice(0, 4);
        }

        const pad = r + 8;
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

        for (const bmp of bumpersRef.current) {
          const bx = (bmp.xPct / 100) * f.w;
          const by = (bmp.yPct / 100) * f.h;
          const dx = p.x - bx;
          const dy = p.y - by;
          const dist = Math.hypot(dx, dy);
          const minDist = r + bmp.rPx;
          if (dist < minDist && dist > 0.1) {
            const nx = dx / dist;
            const ny = dy / dist;
            p.x = bx + nx * (minDist + 3);
            p.y = by + ny * (minDist + 3);
            const dot = p.vx * nx + p.vy * ny;
            p.vx = (p.vx - 2 * dot * nx) * 1.02;
            p.vy = (p.vy - 2 * dot * ny) * 1.02;

            if (p.vy > -80 && dy > 0) {
              const side = dx >= 0 ? 1 : -1;
              p.vx = side * Math.max(210, Math.abs(p.vx) + 110);
              p.vy = -300;
            }
            const spd = Math.hypot(p.vx, p.vy);
            if (spd < 310) {
              p.vx = (p.vx / Math.max(1, spd)) * 330;
              p.vy = (p.vy / Math.max(1, spd)) * 330;
            }
            p.kickScale = 1.16;
            boingScaleRef.current[bmp.id] = 0.72;
            fns.spawnBurst(bx, by, 8);
            soundEngine.playBoing();
          }
        }

        fns.collectTouchedStars(p.x, p.y);

        const hitGoal = fns.checkGoalCollisions(p.x, p.y);
        if (!hitGoal && p.phase === 'flying') {
          const currSpeed = Math.hypot(p.vx, p.vy);
          const returningDown =
            (p.vy > 70 && p.y > f.h * 0.44) ||
            (hitTopWall && p.flightTime > 0.55);
          const fellBelowKickLine =
            p.flightTime > 0.25 && p.vy > 0 && p.y > f.h * 0.8;
          if (
            currSpeed < 90 ||
            fellBelowKickLine ||
            p.flightTime > 2.7 ||
            returningDown
          ) {
            fns.beginSmoothReturn(true);
          }
        }
      } else if (p.phase === 'returning') {
        p.returnT = Math.min(1, p.returnT + dt / 0.5);
        const ease = 1 - Math.pow(1 - p.returnT, 3);
        const targetX = f.w * 0.5;
        const targetY = f.h * 0.7;
        const prevX = p.x;
        const prevY = p.y;
        p.x = p.returnStartX + (targetX - p.returnStartX) * ease;
        p.y = p.returnStartY + (targetY - p.returnStartY) * ease;
        p.rot += Math.hypot(p.x - prevX, p.y - prevY) * 1.05;
        if (p.returnT >= 1) {
          p.x = targetX;
          p.y = targetY;
          p.phase = 'ready';
        }
      }

      // Draw frame cleanly onto single opaque 2D canvas
      const canvas = canvasRef.current;
      if (canvas && f.w > 0 && f.h > 0) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const targetW = Math.round(f.w * dpr);
        const targetH = Math.round(f.h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderFrame(ctx, f.w, f.h, now, dt);
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // =========================================================================
  // DIRECT NON-PASSIVE TOUCH & POINTER ENGINE ON THE SINGLE <canvas>
  // =========================================================================
  const gestureRef = useRef<ActiveGesture | null>(null);
  const lastTouchAtRef = useRef(0);
  const winCleanupRef = useRef<(() => void) | null>(null);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  const getLocalCoords = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect?.();
    if (rect) {
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    return { x: clientX, y: clientY };
  }, []);

  const startGesture = useCallback(
    (mode: 'touch' | 'pointer', id: number, pt: { x: number; y: number }): boolean => {
      if (wonRef.current) return false;
      const p = physRef.current;
      if (p.phase === 'scored') return false;
      if (p.phase === 'flying' && p.vy < 40) return false;

      soundEngine.unlock();
      const f = fieldRef.current;
      const homeX = f.w * 0.5;
      const homeY = f.h * 0.7;

      if (p.phase === 'returning' || p.phase === 'flying') {
        p.x = homeX;
        p.y = homeY;
        p.vx = 0;
        p.vy = 0;
        p.trail = [];
        p.phase = 'ready';
      }

      const grabR = ballRadiusRef.current * 2.4;
      const nearBall = Math.hypot(pt.x - p.x, pt.y - p.y) <= grabR;
      const now = performance.now();

      const kind: DragKind = nearBall ? 'pending_ball' : 'aim';
      if (nearBall) {
        p.phase = 'dragging';
        p.kickScale = 1.1;
        soundEngine.playPop();
      } else {
        ripplesRef.current.push({ x: pt.x, y: pt.y, age: 0, duration: 0.36 });
      }

      gestureRef.current = {
        mode,
        id,
        kind,
        start: pt,
        last: pt,
        maxTravel: 0,
        samples: [{ x: pt.x, y: pt.y, t: now }],
      };

      if (!nearBall && pt.y < p.y - 12) {
        aimRef.current = {
          fromX: p.x,
          fromY: p.y,
          toX: pt.x,
          toY: pt.y,
          isSlingshot: false,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: findAimedGoalId(p.x, p.y, pt.x, pt.y),
        };
      } else {
        aimRef.current = null;
      }
      return true;
    },
    [findAimedGoalId]
  );

  const moveGesture = useCallback(
    (pt: { x: number; y: number }) => {
      const g = gestureRef.current;
      if (!g) return;
      const p = physRef.current;
      if (p.phase === 'scored' || p.phase === 'returning') {
        gestureRef.current = null;
        aimRef.current = null;
        return;
      }
      if (g.kind !== 'aim' && p.phase !== 'dragging') {
        gestureRef.current = null;
        aimRef.current = null;
        return;
      }

      const f = fieldRef.current;
      const r = ballRadiusRef.current;
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

      if (g.kind === 'pending_ball' && travel >= 14) {
        g.kind =
          swipeDy >= 10 && swipeDy > Math.abs(swipeDx) * 0.55
            ? 'slingshot'
            : 'dribble';
      }

      if (g.kind === 'slingshot') {
        const pullDist = Math.min(40, Math.hypot(swipeDx, swipeDy));
        const pullAngle = Math.atan2(Math.max(10, swipeDy), swipeDx);
        p.x = homeX + Math.cos(pullAngle) * pullDist;
        p.y = homeY + Math.sin(pullAngle) * pullDist;
        p.kickScale = 1.06 + (pullDist / 40) * 0.08;

        const aimLen = Math.min(f.h * 0.48, 120 + pullDist * 4.2);
        const toX = Math.max(20, Math.min(f.w - 20, homeX - Math.cos(pullAngle) * aimLen));
        const toY = Math.max(24, Math.min(homeY - 36, homeY - Math.sin(pullAngle) * aimLen));
        aimRef.current = {
          fromX: homeX,
          fromY: homeY,
          toX,
          toY,
          isSlingshot: true,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: findAimedGoalId(homeX, homeY, toX, toY),
        };
      } else if (g.kind === 'dribble') {
        const pad = r + 10;
        p.x = Math.max(pad, Math.min(f.w - pad, p.x + stepDx));
        p.y = Math.max(pad, Math.min(f.h * 0.76, p.y + stepDy));
        p.rot += stepDx * 1.0 - stepDy * 0.45;
        p.kickScale = 1.1;

        collectTouchedStars(p.x, p.y);

        for (const bmp of bumpersRef.current) {
          const bx = (bmp.xPct / 100) * f.w;
          const by = (bmp.yPct / 100) * f.h;
          const dx = p.x - bx;
          const dy = p.y - by;
          const dist = Math.hypot(dx, dy);
          const minDist = r + bmp.rPx;
          if (dist < minDist && dist > 0.1) {
            p.x = bx + (dx / dist) * (minDist + 2);
            p.y = by + (dy / dist) * (minDist + 2);
            const nowMs = Date.now();
            if (nowMs - p.lastBumperBoingAt > 320) {
              p.lastBumperBoingAt = nowMs;
              boingScaleRef.current[bmp.id] = 0.76;
              soundEngine.playBoing();
            }
          }
        }

        if (checkGoalCollisions(p.x, p.y)) {
          gestureRef.current = null;
          cleanupWinListeners();
          aimRef.current = null;
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
          const guideLen = isTabletRef.current ? 160 : 120;
          const toX = Math.max(20, Math.min(f.w - 20, p.x + (ux / uNorm) * guideLen));
          const toY = Math.max(20, p.y + (uy / uNorm) * guideLen);
          aimRef.current = {
            fromX: p.x,
            fromY: p.y,
            toX,
            toY,
            isSlingshot: false,
            anchorX: p.x,
            anchorY: p.y,
            lockedGoalId: findAimedGoalId(p.x, p.y, toX, toY),
          };
        } else {
          aimRef.current = null;
        }
      } else if (g.kind === 'aim') {
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
        aimRef.current = {
          fromX: p.x,
          fromY: p.y,
          toX,
          toY,
          isSlingshot: isSling,
          anchorX: p.x,
          anchorY: p.y,
          lockedGoalId: findAimedGoalId(p.x, p.y, toX, toY),
        };
      }

      g.last = pt;
    },
    [checkGoalCollisions, cleanupWinListeners, collectTouchedStars, findAimedGoalId]
  );

  const endGesture = useCallback(
    (endPt?: { x: number; y: number }) => {
      const g = gestureRef.current;
      if (!g) return;
      gestureRef.current = null;
      cleanupWinListeners();
      aimRef.current = null;

      const p = physRef.current;
      if (p.phase === 'scored' || p.phase === 'returning' || wonRef.current) return;

      const tab = isTabletRef.current;
      const pt = endPt || g.last;
      const swipeDx = pt.x - g.start.x;
      const swipeDy = pt.y - g.start.y;

      if (g.maxTravel < 22 || g.kind === 'pending_ball') {
        if (g.kind !== 'aim') {
          const tp = getGoalCenter(activeGoalRef.current);
          kickBallAlong(tp.x - p.x, tp.y - p.y);
          return;
        }
        const tapGoalR = tab ? 98 : 78;
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

      if (g.kind === 'slingshot') {
        const pullDist = Math.min(40, Math.hypot(swipeDx, swipeDy));
        const power = (tab ? 410 : 340) + (pullDist / 40) * (tab ? 140 : 110);
        kickBallAlong(-swipeDx, -Math.max(10, swipeDy), power);
        return;
      }

      if (g.kind === 'dribble') {
        const oldest = g.samples[0];
        const newest = g.samples[g.samples.length - 1];
        const dtSec = Math.max(0.016, (newest.t - oldest.t) / 1000);
        const recentDx = newest.x - oldest.x;
        const recentDy = newest.y - oldest.y;
        const recentSpeed = Math.hypot(recentDx, recentDy) / dtSec;

        if (recentSpeed > 180 && recentDy < 60) {
          const launchSpeed = Math.min(
            tab ? 550 : 450,
            Math.max(tab ? 410 : 340, recentSpeed * 0.42)
          );
          kickBallAlong(recentDx, Math.min(-40, recentDy), launchSpeed);
        } else if (swipeDy < -24) {
          kickBallAlong(swipeDx, swipeDy, tab ? 440 : 365);
        } else {
          const tp = getGoalCenter(activeGoalRef.current);
          kickBallAlong(tp.x - p.x, tp.y - p.y, tab ? 430 : 355);
        }
        return;
      }

      const oldest = g.samples[0];
      const newest = g.samples[g.samples.length - 1];
      const dtSec = Math.max(0.016, (newest.t - oldest.t) / 1000);
      const flickSpeed = Math.hypot(newest.x - oldest.x, newest.y - oldest.y) / dtSec;
      const launchSpeed = Math.min(
        tab ? 550 : 450,
        Math.max(tab ? 410 : 340, flickSpeed * 0.42)
      );

      if (swipeDy < -12) {
        kickBallAlong(swipeDx, swipeDy, launchSpeed);
      } else if (swipeDy > 26) {
        kickBallAlong(-swipeDx, -swipeDy, launchSpeed);
      } else {
        kickBallAlong(pt.x - p.x, Math.min(-40, pt.y - p.y), launchSpeed);
      }
    },
    [cleanupWinListeners, getGoalCenter, kickBallAlong]
  );

  const gestureFnsRef = useRef({ startGesture, moveGesture, endGesture });
  gestureFnsRef.current = { startGesture, moveGesture, endGesture };

  const attachWinListeners = useCallback(
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
        const onMove = (ev: TouchEvent) => {
          const t = findTouch(ev.touches) || findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          gestureFnsRef.current.moveGesture(getLocalCoords(t.clientX, t.clientY));
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          lastTouchAtRef.current = Date.now();
          gestureFnsRef.current.endGesture(getLocalCoords(t.clientX, t.clientY));
        };
        const onCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          lastTouchAtRef.current = Date.now();
          gestureFnsRef.current.endGesture(
            t ? getLocalCoords(t.clientX, t.clientY) : undefined
          );
        };
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd, { passive: false });
        window.addEventListener('touchcancel', onCancel);
        winCleanupRef.current = () => {
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onEnd);
          window.removeEventListener('touchcancel', onCancel);
        };
      } else {
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          gestureFnsRef.current.moveGesture(getLocalCoords(ev.clientX, ev.clientY));
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          gestureFnsRef.current.endGesture(getLocalCoords(ev.clientX, ev.clientY));
        };
        const onCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          gestureFnsRef.current.endGesture(undefined);
        };
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
        winCleanupRef.current = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onCancel);
        };
      }
    },
    [cleanupWinListeners, getLocalCoords]
  );

  // Direct non-passive DOM touchstart & pointerdown on the single <canvas>
  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasEl) return;

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      lastTouchAtRef.current = Date.now();

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
          if (curr.maxTravel >= 16 || newDist > oldDist) {
            return;
          }
        }
        gestureRef.current = null;
        cleanupWinListeners();
      }

      const pt = getLocalCoords(t.clientX, t.clientY);
      if (gestureFnsRef.current.startGesture('touch', t.identifier, pt)) {
        attachWinListeners('touch', t.identifier);
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - lastTouchAtRef.current < 700) return;
      if (gestureRef.current) return;
      ev.preventDefault();
      const pt = getLocalCoords(ev.clientX, ev.clientY);
      if (gestureFnsRef.current.startGesture('pointer', ev.pointerId, pt)) {
        attachWinListeners('pointer', ev.pointerId);
      }
    };

    canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    return () => {
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, [attachWinListeners, canvasEl, cleanupWinListeners, getLocalCoords]);

  return (
    <View style={styles.container}>
      <GameHeader
        totalSteps={GOALS_TO_WIN}
        completedSteps={goalsScored}
        difficulty={difficulty}
        onDifficultyChange={(d) => startFreshGame(d, roundSeed)}
      />

      <View
        style={styles.field}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 100 && h > 100) {
            setFieldSize((prev) =>
              Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1
                ? prev
                : { w, h }
            );
          }
        }}
      >
        {Platform.OS === 'web' ? (
          <canvas
            ref={handleCanvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          />
        ) : (
          <View style={styles.nativeFallback}>
            <Image
              source={STORYBOOK_ASSETS.jungleBall}
              style={{ width: 72, height: 72 }}
            />
            <Text style={styles.nativeFallbackText}>Jungle Ball Pass</Text>
          </View>
        )}
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
    backgroundColor: '#7DB55B',
  },
  field: {
    flex: 1,
    width: '100%',
    backgroundColor: '#7DB55B',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  nativeFallbackText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF9EC',
  },
});
