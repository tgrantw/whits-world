import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { STORYBOOK_ANIMALS, STORYBOOK_ASSETS } from '../assets/assetMap';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

const ARCTIC_BUDDIES: { kind: ExhibitAnimalKind; label: string }[] = [
  { kind: 'penguin', label: 'Penguin' },
  { kind: 'polarbear', label: 'Polar Bear' },
  { kind: 'seal', label: 'Seal' },
  { kind: 'puffin', label: 'Puffin' },
];

type FallingKind = 'fishBlue' | 'fishCoral' | 'fishGold' | 'snowball';

interface FallingItem {
  id: number;
  kind: FallingKind;
  x: number;
  baseX: number;
  y: number;
  vy: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  rot: number;
  size: number;
}

interface SnowFlake {
  xPct: number;
  yPct: number;
  r: number;
  speedPct: number;
  phase: number;
}

interface CanvasBurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  age: number;
  maxAge: number;
}

interface CanvasPopBadge {
  x: number;
  y: number;
  kind: 'fish' | 'gold' | 'snow';
  age: number;
  duration: number;
}

const INK = '#4A3525';

function getWebAssetUri(asset: unknown): string | null {
  if (!asset) return null;
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'number') {
    const resolved = Image.resolveAssetSource?.(asset);
    if (resolved?.uri) return resolved.uri;
  }
  if (typeof asset === 'object') {
    const obj = asset as { uri?: string; default?: string };
    if (typeof obj.uri === 'string') return obj.uri;
    if (typeof obj.default === 'string') return obj.default;
  }
  return null;
}

function getDifficultyConfig(difficulty: Difficulty) {
  if (difficulty === 1) {
    return {
      goalCount: 6,
      minVy: 86,
      maxVy: 112,
      spawnInterval: 1.55,
      swayAmp: 12,
      snowballChance: 0,
      goldChance: 0.24,
      maxConcurrent: 3,
    };
  }
  if (difficulty === 2) {
    return {
      goalCount: 8,
      minVy: 120,
      maxVy: 156,
      spawnInterval: 1.22,
      swayAmp: 24,
      snowballChance: 0,
      goldChance: 0.22,
      maxConcurrent: 4,
    };
  }
  return {
    goalCount: 10,
    minVy: 156,
    maxVy: 198,
    spawnInterval: 0.96,
    swayAmp: 34,
    snowballChance: 0.18,
    goldChance: 0.2,
    maxConcurrent: 5,
  };
}

function drawCoverBackdrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  w: number,
  h: number
) {
  if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;
    let drawW = w;
    let drawH = h;
    let ox = 0;
    let oy = 0;
    if (boxRatio > imgRatio) {
      drawW = w;
      drawH = w / imgRatio;
      oy = (h - drawH) * 0.5;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      ox = (w - drawW) * 0.5;
    }
    ctx.drawImage(img, ox, oy, drawW, drawH);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#CBEBF7');
    sky.addColorStop(0.58, '#EAF7FC');
    sky.addColorStop(1, '#79C0DB');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
  }

  // Soft upper sky readability veil
  const veil = ctx.createLinearGradient(0, 0, 0, h);
  veil.addColorStop(0, 'rgba(215, 239, 248, 0.44)');
  veil.addColorStop(0.24, 'rgba(245, 250, 252, 0.08)');
  veil.addColorStop(0.65, 'rgba(125, 198, 223, 0.04)');
  veil.addColorStop(1, 'rgba(75, 159, 194, 0.26)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, w, h);
}

function drawStarPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawArcticFish(
  ctx: CanvasRenderingContext2D,
  kind: 'fishBlue' | 'fishCoral' | 'fishGold',
  cx: number,
  cy: number,
  size: number,
  rotDeg: number
) {
  const palette =
    kind === 'fishBlue'
      ? {
          top: '#84D4EC',
          mid: '#56B0D2',
          belly: '#ECF9FF',
          fin: '#EE8B6B',
          glow: 'rgba(132, 212, 236, 0.30)',
        }
      : kind === 'fishCoral'
      ? {
          top: '#F5A17E',
          mid: '#E07554',
          belly: '#FFF5E0',
          fin: '#F8D459',
          glow: 'rgba(245, 161, 126, 0.30)',
        }
      : {
          top: '#FFE985',
          mid: '#F2BC3C',
          belly: '#FFFBE4',
          fin: '#F48C56',
          glow: 'rgba(255, 226, 98, 0.56)',
        };

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg * Math.PI) / 180);
  const s = size / 88;
  ctx.scale(s, s);
  ctx.translate(-44, -44);

  // Soft sunlit halo behind the fish
  ctx.fillStyle = palette.glow;
  ctx.beginPath();
  ctx.arc(44, 44, kind === 'fishGold' ? 39 : 34, 0, Math.PI * 2);
  ctx.fill();

  // Tail fin
  ctx.fillStyle = palette.fin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(22, 44);
  ctx.lineTo(8, 30);
  ctx.quadraticCurveTo(12, 44, 8, 58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dorsal fin
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(38, 26);
  ctx.quadraticCurveTo(48, 14, 58, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Plump storybook fish body
  const bodyGrad = ctx.createLinearGradient(0, 22, 0, 66);
  bodyGrad.addColorStop(0, palette.top);
  bodyGrad.addColorStop(0.62, palette.mid);
  bodyGrad.addColorStop(1, palette.belly);
  ctx.fillStyle = bodyGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 44);
  ctx.bezierCurveTo(24, 25, 56, 21, 74, 41);
  ctx.bezierCurveTo(77, 44, 77, 46, 74, 49);
  ctx.bezierCurveTo(56, 67, 24, 63, 20, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Soft belly sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
  ctx.beginPath();
  ctx.ellipse(48, 36, 14, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Delicate scale arcs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(38, 40);
  ctx.quadraticCurveTo(42, 44, 38, 48);
  ctx.moveTo(46, 39);
  ctx.quadraticCurveTo(50, 44, 46, 49);
  ctx.stroke();

  // Side pectoral fin
  ctx.fillStyle = palette.fin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(44, 49);
  ctx.quadraticCurveTo(36, 58, 46, 61);
  ctx.quadraticCurveTo(53, 55, 44, 49);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Happy eye + rosy cheek + tiny smile
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(61, 41, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(62.4, 39.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(244, 147, 158, 0.72)';
  ctx.beginPath();
  ctx.ellipse(57, 47.5, 3.4, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(65, 48);
  ctx.quadraticCurveTo(68.5, 50, 71, 47.5);
  ctx.stroke();

  if (kind === 'fishGold') {
    ctx.fillStyle = '#FFFDF0';
    ctx.strokeStyle = '#C98A1A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(18, 17);
    ctx.lineTo(20, 22);
    ctx.lineTo(25, 24);
    ctx.lineTo(20, 26);
    ctx.lineTo(18, 31);
    ctx.lineTo(16, 26);
    ctx.lineTo(11, 24);
    ctx.lineTo(16, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 253, 240, 0.92)';
    ctx.beginPath();
    ctx.arc(72, 22, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayfulSnowball(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotDeg: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotDeg * Math.PI) / 180);
  const s = size / 80;
  ctx.scale(s, s);
  ctx.translate(-40, -40);

  ctx.fillStyle = 'rgba(182, 224, 245, 0.34)';
  ctx.beginPath();
  ctx.arc(40, 40, 34, 0, Math.PI * 2);
  ctx.fill();

  const snowGrad = ctx.createLinearGradient(22, 18, 58, 62);
  snowGrad.addColorStop(0, '#FFFFFF');
  snowGrad.addColorStop(0.65, '#E4F4FC');
  snowGrad.addColorStop(1, '#B6DCEB');
  ctx.fillStyle = snowGrad;
  ctx.strokeStyle = '#5A7A8C';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(40, 40, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mischievous frosty face
  ctx.fillStyle = '#3B5566';
  ctx.beginPath();
  ctx.arc(32.5, 38, 2.7, 0, Math.PI * 2);
  ctx.arc(47.5, 38, 2.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3B5566';
  ctx.lineWidth = 2.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(35, 45);
  ctx.quadraticCurveTo(40, 49, 45, 45);
  ctx.stroke();

  ctx.fillStyle = 'rgba(242, 157, 176, 0.70)';
  ctx.beginPath();
  ctx.ellipse(28, 43, 3, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(52, 43, 3, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.ellipse(32, 27, 7, 3.5, (-22 * Math.PI) / 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawIceFloeSled(
  ctx: CanvasRenderingContext2D,
  sledW: number,
  sledH: number
) {
  ctx.save();
  const sx = sledW / 210;
  const sy = sledH / 76;
  ctx.scale(sx, sy);
  ctx.translate(-105, -38);

  // Shimmering aqua water reflection & side wake ripples
  ctx.fillStyle = 'rgba(42, 114, 148, 0.24)';
  ctx.beginPath();
  ctx.ellipse(105, 60, 96, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(12, 58);
  ctx.quadraticCurveTo(34, 65, 56, 60);
  ctx.moveTo(154, 60);
  ctx.quadraticCurveTo(176, 65, 198, 58);
  ctx.stroke();

  // Glacier-blue side wall
  const sideGrad = ctx.createLinearGradient(0, 32, 0, 62);
  sideGrad.addColorStop(0, '#A9DBEC');
  sideGrad.addColorStop(1, '#77B9D1');
  ctx.fillStyle = sideGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(18, 32);
  ctx.lineTo(26, 52);
  ctx.quadraticCurveTo(105, 66, 184, 52);
  ctx.lineTo(192, 32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Snow-white faceted ice floe deck
  const topGrad = ctx.createLinearGradient(0, 16, 0, 49);
  topGrad.addColorStop(0, '#FFFFFF');
  topGrad.addColorStop(1, '#E5F6FC');
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.moveTo(16, 32);
  ctx.quadraticCurveTo(36, 16, 105, 16);
  ctx.quadraticCurveTo(174, 16, 194, 32);
  ctx.quadraticCurveTo(172, 48, 105, 49);
  ctx.quadraticCurveTo(38, 48, 16, 32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crystalline facet highlight lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(46, 28);
  ctx.quadraticCurveTo(76, 22, 108, 24);
  ctx.moveTo(134, 25);
  ctx.quadraticCurveTo(158, 26, 172, 31);
  ctx.stroke();

  ctx.restore();
}

function drawFishBasket(
  ctx: CanvasRenderingContext2D,
  basketW: number,
  basketH: number,
  caughtCount: number
) {
  const visibleFishes = Math.min(caughtCount, 5);
  const tailSpecs = [
    { x: 30, y: 20, rot: -22, fill: '#6CC4DF', fin: '#EE8B6B' },
    { x: 54, y: 17, rot: 4, fill: '#E88360', fin: '#F8D459' },
    { x: 78, y: 20, rot: 22, fill: '#F7CE54', fin: '#EE8B6B' },
    { x: 42, y: 15, rot: -10, fill: '#5CB2D4', fin: '#F8D459' },
    { x: 66, y: 15, rot: 12, fill: '#EC8766', fin: '#7ACAE3' },
  ];

  ctx.save();
  const sx = basketW / 108;
  const sy = basketH / 66;
  ctx.scale(sx, sy);
  ctx.translate(-54, -33);

  // Dark basket interior cavity
  ctx.fillStyle = '#6E4624';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(54, 24, 41, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Caught colorful fish peeking happily out of the basket
  for (let i = 0; i < visibleFishes; i++) {
    const f = tailSpecs[i];
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate((f.rot * Math.PI) / 180);

    ctx.fillStyle = f.fill;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-9, 7);
    ctx.bezierCurveTo(-9, -6, 9, -6, 9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = f.fin;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-7, -13);
    ctx.lineTo(7, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Woven wooden basket body
  const baskGrad = ctx.createLinearGradient(0, 25, 0, 62);
  baskGrad.addColorStop(0, '#E6B676');
  baskGrad.addColorStop(0.6, '#CE9252');
  baskGrad.addColorStop(1, '#B07237');
  ctx.fillStyle = baskGrad;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(14, 25);
  ctx.lineTo(24, 56);
  ctx.quadraticCurveTo(54, 64, 84, 56);
  ctx.lineTo(94, 25);
  ctx.quadraticCurveTo(54, 34, 14, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Woven wood slats & crosshatch details
  ctx.strokeStyle = 'rgba(90, 54, 24, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(19, 37);
  ctx.quadraticCurveTo(54, 45, 89, 37);
  ctx.moveTo(22, 48);
  ctx.quadraticCurveTo(54, 55, 86, 48);
  ctx.moveTo(36, 30);
  ctx.lineTo(40, 58);
  ctx.moveTo(54, 31);
  ctx.lineTo(54, 60);
  ctx.moveTo(72, 30);
  ctx.lineTo(68, 58);
  ctx.stroke();

  // Cozy curved wooden rim
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(11, 24);
  ctx.quadraticCurveTo(54, 35, 97, 24);
  ctx.stroke();

  ctx.strokeStyle = '#F4D39B';
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(11, 24);
  ctx.quadraticCurveTo(54, 35, 97, 24);
  ctx.stroke();

  ctx.restore();
}

/**
 * Arctic Catch (60fps Single-Canvas 2D Renderer on Web):
 * - Renders the entire Snowy Arctic Bay, snowflakes, glacial water ripples,
 *   falling smiling fish & playful snowballs, gliding ice floe, animated buddy,
 *   filling wooden fish basket, and sparkle bursts onto a single 60fps HTML5 <canvas>
 *   with ZERO per-frame React state updates or SVG RadialGradients!
 * - Direct non-passive touch & pointer sliding/tapping for 0ms tablet responsiveness.
 */
export const ArcticCatchGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [buddyIdx, setBuddyIdx] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [won, setWon] = useState(false);

  const [fieldSize, setFieldSize] = useState({
    w: Math.max(320, width),
    h: Math.max(420, height - 96),
  });

  const cfg = getDifficultyConfig(difficulty);
  const activeBuddy = ARCTIC_BUDDIES[buddyIdx % ARCTIC_BUDDIES.length];

  // Preload hand-painted storybook PNGs into HTMLImageElement cache for 2D canvas drawing
  const imgCacheRef = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const entries: [string, unknown][] = [
      ['bgArctic', STORYBOOK_ASSETS.bgArctic],
      ['penguin', STORYBOOK_ANIMALS.penguin],
      ['polarbear', STORYBOOK_ANIMALS.polarbear],
      ['seal', STORYBOOK_ANIMALS.seal],
      ['puffin', STORYBOOK_ANIMALS.puffin],
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

  // Live 60fps simulation state (mutated inside rAF — ZERO React re-renders!)
  const simRef = useRef({
    catcherX: Math.max(320, width) * 0.5,
    targetX: Math.max(320, width) * 0.5,
    catcherVx: 0,
    items: [] as FallingItem[],
    nextItemId: 1,
    spawnTimer: 0.35,
    lastSpawnXFrac: 0.5,
    flakes: Array.from({ length: 16 }, (_, i): SnowFlake => ({
      xPct: ((i * 37 + 11) % 94) + 3,
      yPct: (i * 19) % 100,
      r: 2.2 + (i % 3) * 1.15,
      speedPct: 4.5 + (i % 4) * 1.4,
      phase: i * 0.9,
    })),
    particles: [] as CanvasBurstParticle[],
    pops: [] as CanvasPopBadge[],
    catchBounceT: 99,
    snowWiggleT: 99,
    elapsed: 0,
  });

  const fieldRef = useRef(fieldSize);
  fieldRef.current = fieldSize;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;
  const wonRef = useRef(won);
  wonRef.current = won;
  const caughtRef = useRef(caughtCount);
  caughtRef.current = caughtCount;
  const buddyRef = useRef(activeBuddy);
  buddyRef.current = activeBuddy;
  const isTabletRef = useRef(isTablet);
  isTabletRef.current = isTablet;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const handleCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    setCanvasEl(el);
  }, []);

  const spawnCatchSparkles = useCallback((x: number, y: number, isGold: boolean) => {
    const palette = isGold
      ? ['#FFE566', '#FFF8C4', '#FFB732', '#FFFFFF', '#FF9466']
      : ['#FFF4B2', '#8BE0F8', '#FFB396', '#FFFFFF', '#FFE066'];
    const count = isGold ? 16 : 11;
    const list = simRef.current.particles;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const spd = 85 + Math.random() * 165;
      list.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 35,
        r: 3.5 + Math.random() * 4,
        color: palette[i % palette.length],
        age: 0,
        maxAge: 0.46 + Math.random() * 0.25,
      });
    }
    if (list.length > 80) {
      simRef.current.particles = list.slice(-80);
    }
  }, []);

  const resetRound = useCallback((nextDiff: Difficulty, nextBuddyIdx: number) => {
    const f = fieldRef.current;
    setDifficulty(nextDiff);
    setBuddyIdx(nextBuddyIdx % ARCTIC_BUDDIES.length);
    setCaughtCount(0);
    caughtRef.current = 0;
    setWon(false);
    wonRef.current = false;

    const s = simRef.current;
    s.catcherX = f.w * 0.5;
    s.targetX = f.w * 0.5;
    s.catcherVx = 0;
    s.items = [];
    s.particles = [];
    s.pops = [];
    s.spawnTimer = 0.35;
    s.catchBounceT = 99;
    s.snowWiggleT = 99;
  }, []);

  // Keep catcher inside bounds when screen resizes
  useEffect(() => {
    const pad = isTablet ? 86 : 64;
    simRef.current.catcherX = Math.max(
      pad,
      Math.min(fieldSize.w - pad, simRef.current.catcherX)
    );
    simRef.current.targetX = Math.max(
      pad,
      Math.min(fieldSize.w - pad, simRef.current.targetX)
    );
  }, [fieldSize.w, isTablet]);

  // Direct non-passive touch & pointer engine on the single <canvas>
  const activeSlideRef = useRef<{ mode: 'touch' | 'pointer'; id: number } | null>(null);
  const lastTouchEndRef = useRef<number>(0);
  const winCleanupRef = useRef<(() => void) | null>(null);

  const getLocalX = useCallback((clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect?.();
    if (rect) {
      return clientX - rect.left;
    }
    return clientX;
  }, []);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  const beginWebSlide = useCallback(
    (mode: 'touch' | 'pointer', id: number, clientX: number) => {
      soundEngine.unlock();
      activeSlideRef.current = { mode, id };
      simRef.current.targetX = getLocalX(clientX);

      cleanupWinListeners();
      if (typeof window === 'undefined') return;

      const endSlide = () => {
        const st = activeSlideRef.current;
        if (!st || st.mode !== mode || st.id !== id) return;
        activeSlideRef.current = null;
        cleanupWinListeners();
        if (mode === 'touch') {
          lastTouchEndRef.current = Date.now();
        }
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
          simRef.current.targetX = getLocalX(t.clientX);
        };
        const onWinTouchEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          simRef.current.targetX = getLocalX(t.clientX);
          endSlide();
        };
        const onWinTouchCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (t) simRef.current.targetX = getLocalX(t.clientX);
          endSlide();
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
          simRef.current.targetX = getLocalX(ev.clientX);
        };
        const onWinPointerUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          simRef.current.targetX = getLocalX(ev.clientX);
          endSlide();
        };
        const onWinPointerCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          endSlide();
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
    [cleanupWinListeners, getLocalX]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasEl) return;

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      beginWebSlide('touch', t.identifier, t.clientX);
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - lastTouchEndRef.current < 500) return;
      ev.preventDefault();
      beginWebSlide('pointer', ev.pointerId, ev.clientX);
    };

    canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    return () => {
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, [beginWebSlide, canvasEl]);

  // 60fps simulation + single-canvas draw loop (ZERO React re-renders per frame!)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const s = simRef.current;
      const f = fieldRef.current;
      const tab = isTabletRef.current;
      const curCfg = getDifficultyConfig(diffRef.current);
      s.elapsed += dt;
      s.catchBounceT += dt;
      s.snowWiggleT += dt;

      // Ambient gentle snow drift
      for (let i = 0; i < s.flakes.length; i++) {
        const fl = s.flakes[i];
        fl.yPct += fl.speedPct * dt;
        if (fl.yPct > 104) fl.yPct = -4;
      }

      const edgePad = tab ? 86 : 64;
      const clampedTarget = Math.max(edgePad, Math.min(f.w - edgePad, s.targetX));
      const dx = clampedTarget - s.catcherX;
      const glideRate = activeSlideRef.current ? 22 : 14;
      const glideFactor = Math.min(1, dt * glideRate);
      const prevX = s.catcherX;
      s.catcherX += dx * glideFactor;
      s.catcherVx = (s.catcherX - prevX) / dt;
      const tiltDeg = Math.max(-8, Math.min(8, s.catcherVx * 0.011));

      const catcherY = f.h * 0.78;
      const waterLineY = f.h * 0.72;

      if (!wonRef.current) {
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.items.length < curCfg.maxConcurrent) {
          s.spawnTimer = curCfg.spawnInterval * (0.85 + Math.random() * 0.32);

          let xFrac = 0.14 + Math.random() * 0.72;
          if (Math.abs(xFrac - s.lastSpawnXFrac) < 0.2) {
            xFrac =
              s.lastSpawnXFrac > 0.5
                ? 0.18 + Math.random() * 0.24
                : 0.58 + Math.random() * 0.24;
          }
          s.lastSpawnXFrac = xFrac;

          const roll = Math.random();
          let kind: FallingKind;
          if (roll < curCfg.snowballChance) {
            kind = 'snowball';
          } else if (roll < curCfg.snowballChance + curCfg.goldChance) {
            kind = 'fishGold';
          } else if (Math.random() < 0.52) {
            kind = 'fishBlue';
          } else {
            kind = 'fishCoral';
          }

          const itemSize =
            kind === 'snowball' ? (tab ? 60 : 48) : tab ? 82 : 64;
          const baseX = xFrac * f.w;
          s.items.push({
            id: s.nextItemId++,
            kind,
            x: baseX,
            baseX,
            y: -itemSize * 0.4,
            vy: curCfg.minVy + Math.random() * (curCfg.maxVy - curCfg.minVy),
            swayAmp: curCfg.swayAmp * (0.65 + Math.random() * 0.5),
            swaySpeed: 1.5 + Math.random() * 1.1,
            phase: Math.random() * Math.PI * 2,
            rot: 0,
            size: itemSize,
          });
        }

        const catchHalfW = tab ? 84 : 64;
        const catchTop = catcherY - (tab ? 58 : 44);
        const catchBot = catcherY + (tab ? 30 : 24);
        const surviving: FallingItem[] = [];

        for (let i = 0; i < s.items.length; i++) {
          const item = s.items[i];
          const ny = item.y + item.vy * dt;
          const swayOffset =
            Math.sin(s.elapsed * item.swaySpeed + item.phase) * item.swayAmp;
          const nx = Math.max(
            item.size * 0.55,
            Math.min(f.w - item.size * 0.55, item.baseX + swayOffset)
          );
          const nrot = Math.cos(s.elapsed * item.swaySpeed + item.phase) * 10;

          const inX = Math.abs(nx - s.catcherX) <= catchHalfW + item.size * 0.24;
          const inY = ny >= catchTop && ny <= catchBot;

          if (inX && inY) {
            if (item.kind === 'snowball') {
              soundEngine.playBoing();
              soundEngine.speakWord('Brrr!');
              s.snowWiggleT = 0;
              s.pops.push({
                x: nx,
                y: catcherY - 34,
                kind: 'snow',
                age: 0,
                duration: 0.72,
              });
            } else {
              const nextCaught = caughtRef.current + 1;
              caughtRef.current = nextCaught;
              setCaughtCount(nextCaught);
              s.catchBounceT = 0;
              spawnCatchSparkles(nx, catcherY - 18, item.kind === 'fishGold');
              s.pops.push({
                x: nx,
                y: catcherY - 30,
                kind: item.kind === 'fishGold' ? 'gold' : 'fish',
                age: 0,
                duration: 0.72,
              });

              if (item.kind === 'fishGold') {
                soundEngine.playStarCollect(nextCaught);
                soundEngine.playAnimalSound(buddyRef.current.kind);
                soundEngine.speakWord('Golden Fish!');
              } else {
                soundEngine.playWaterSplash(nextCaught);
                if (nextCaught % 3 === 0) {
                  soundEngine.playAnimalSound(buddyRef.current.kind);
                }
              }

              if (nextCaught >= curCfg.goalCount) {
                wonRef.current = true;
                collectSticker(buddyRef.current.kind);
                setTimeout(() => {
                  soundEngine.playWin();
                  addStar(1);
                  setWon(true);
                }, 460);
              }
            }
            continue;
          }

          if (ny < f.h + item.size) {
            item.x = nx;
            item.y = ny;
            item.rot = nrot;
            surviving.push(item);
          }
        }
        s.items = surviving;
      }

      // Advance burst particles & floating pop badges
      const nextParticles: CanvasBurstParticle[] = [];
      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];
        p.age += dt;
        if (p.age < p.maxAge) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 260 * dt;
          nextParticles.push(p);
        }
      }
      s.particles = nextParticles;

      const nextPops: CanvasPopBadge[] = [];
      for (let i = 0; i < s.pops.length; i++) {
        const pop = s.pops[i];
        pop.age += dt;
        if (pop.age < pop.duration) {
          nextPops.push(pop);
        }
      }
      s.pops = nextPops;

      // Render frame onto single opaque 2D canvas
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

          // 1. Painterly Snowy Arctic Bay backdrop
          drawCoverBackdrop(ctx, imgCacheRef.current.bgArctic, f.w, f.h);

          // 2. Softly drifting snowflakes
          ctx.fillStyle = 'rgba(255, 255, 255, 0.76)';
          for (let i = 0; i < s.flakes.length; i++) {
            const fl = s.flakes[i];
            const fx =
              (fl.xPct / 100) * f.w +
              Math.sin(fl.yPct * 0.08 + fl.phase) * 14;
            const fy = (fl.yPct / 100) * f.h;
            ctx.beginPath();
            ctx.arc(fx, fy, fl.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. Shimmering glacial bay foreground water band
          const waterGrad = ctx.createLinearGradient(0, waterLineY - 12, 0, f.h);
          waterGrad.addColorStop(0, 'rgba(148, 213, 234, 0.54)');
          waterGrad.addColorStop(0.45, 'rgba(105, 185, 214, 0.78)');
          waterGrad.addColorStop(1, 'rgba(75, 155, 192, 0.92)');
          ctx.fillStyle = waterGrad;
          ctx.beginPath();
          ctx.moveTo(0, waterLineY);
          ctx.quadraticCurveTo(f.w * 0.25, waterLineY - 12, f.w * 0.5, waterLineY);
          ctx.quadraticCurveTo(f.w * 0.75, waterLineY + 12, f.w, waterLineY);
          ctx.lineTo(f.w, f.h);
          ctx.lineTo(0, f.h);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.74)';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, waterLineY);
          ctx.quadraticCurveTo(f.w * 0.25, waterLineY - 12, f.w * 0.5, waterLineY);
          ctx.quadraticCurveTo(f.w * 0.75, waterLineY + 12, f.w, waterLineY);
          ctx.stroke();

          // Sparkling sunlit water ripple highlights
          ctx.strokeStyle = 'rgba(255, 252, 234, 0.52)';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(f.w * 0.14, waterLineY + 26);
          ctx.quadraticCurveTo(f.w * 0.22, waterLineY + 20, f.w * 0.3, waterLineY + 26);
          ctx.moveTo(f.w * 0.64, waterLineY + 34);
          ctx.quadraticCurveTo(f.w * 0.74, waterLineY + 28, f.w * 0.84, waterLineY + 34);
          ctx.moveTo(f.w * 0.36, f.h - 24);
          ctx.quadraticCurveTo(f.w * 0.5, f.h - 32, f.w * 0.64, f.h - 24);
          ctx.stroke();

          // 4. Landing shimmer reflections below each falling fish
          for (let i = 0; i < s.items.length; i++) {
            const item = s.items[i];
            if (item.kind === 'snowball') continue;
            const closeness = Math.max(0, Math.min(1, item.y / catcherY));
            ctx.save();
            ctx.globalAlpha = 0.25 + closeness * 0.6;
            ctx.fillStyle =
              item.kind === 'fishGold'
                ? 'rgba(255, 238, 134, 0.54)'
                : 'rgba(255, 255, 255, 0.38)';
            ctx.beginPath();
            ctx.ellipse(
              item.x,
              catcherY + 14,
              12 + closeness * 16,
              4 + closeness * 4,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
          }

          // 5. Falling Storybook Arctic Fish & Playful Snowballs
          for (let i = 0; i < s.items.length; i++) {
            const item = s.items[i];
            if (item.kind === 'snowball') {
              drawPlayfulSnowball(ctx, item.x, item.y, item.size, item.rot);
            } else {
              drawArcticFish(ctx, item.kind, item.x, item.y, item.size, item.rot);
            }
          }

          // 6. Gliding Ice Floe + Smiling Arctic Buddy + Filling Wooden Fish Basket
          const sledW = tab ? 186 : 144;
          const sledH = Math.round(sledW * 0.36);
          const animalSz = tab ? 110 : 86;
          const basketW = tab ? 92 : 72;
          const basketH = Math.round(basketW * 0.61);

          // Damped spring bounce on fish catch + playful snow wiggle
          let bounceScale = 1;
          if (s.catchBounceT < 0.42) {
            const u = s.catchBounceT / 0.42;
            bounceScale = 1 + Math.sin(u * Math.PI * 2.5) * Math.exp(-u * 3.5) * 0.16;
          }
          let wiggleDeg = 0;
          if (s.snowWiggleT < 0.36) {
            const u = s.snowWiggleT / 0.36;
            wiggleDeg = Math.sin(u * Math.PI * 4) * (1 - u) * 11;
          }
          const idleBobY = Math.sin(s.elapsed * 2.8) * 2.5;

          ctx.save();
          ctx.translate(s.catcherX, catcherY);
          ctx.rotate(((tiltDeg + wiggleDeg) * Math.PI) / 180);
          ctx.scale(bounceScale, bounceScale);

          // Ice Floe Sled centered around (0, sledH * 0.18)
          ctx.save();
          ctx.translate(0, sledH * 0.18);
          drawIceFloeSled(ctx, sledW, sledH);
          ctx.restore();

          // Smiling Arctic Buddy standing proudly on the ice floe
          const buddyImg = imgCacheRef.current[buddyRef.current.kind];
          if (buddyImg && buddyImg.complete && buddyImg.naturalWidth > 0) {
            ctx.drawImage(
              buddyImg,
              -animalSz * 0.5,
              -animalSz * 0.78 + idleBobY,
              animalSz,
              animalSz
            );
          }

          // Woven Wooden Fish Basket mounted at the front of the ice floe
          ctx.save();
          ctx.translate(0, sledH * 0.12);
          drawFishBasket(ctx, basketW, basketH, caughtRef.current);
          ctx.restore();

          ctx.restore();

          // 7. Catch Sparkle Burst particles
          for (let i = 0; i < s.particles.length; i++) {
            const p = s.particles[i];
            const alpha = Math.max(0, 1 - p.age / p.maxAge);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.strokeStyle = 'rgba(74, 53, 37, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // 8. Floating Star / "Brrr!" Snow Giggle Pops
          for (let i = 0; i < s.pops.length; i++) {
            const pop = s.pops[i];
            const u = pop.age / pop.duration;
            const alpha =
              u < 0.2 ? u / 0.2 : u > 0.78 ? Math.max(0, (1 - u) / 0.22) : 1;
            const py = pop.y - u * 54;
            const sc = u < 0.25 ? 0.55 + (u / 0.25) * 0.63 : 1.18 - ((u - 0.25) / 0.75) * 0.22;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(pop.x, py);
            ctx.scale(sc, sc);

            if (pop.kind === 'snow') {
              ctx.fillStyle = '#EAF7FD';
              ctx.strokeStyle = '#4E7D96';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.roundRect?.(-28, -13, 56, 26, 13);
              if (!ctx.roundRect) {
                ctx.rect(-28, -13, 56, 26);
              }
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#2F5C75';
              ctx.font = '900 13px system-ui, -apple-system, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Brrr!', 0, 1);
            } else {
              drawStarPolygon(ctx, 0, 0, 21, 9.5);
              ctx.fillStyle = pop.kind === 'gold' ? '#FFE169' : '#FFF4B2';
              ctx.strokeStyle = '#8C5B20';
              ctx.lineWidth = 2.4;
              ctx.lineJoin = 'round';
              ctx.fill();
              ctx.stroke();
            }

            ctx.restore();
          }
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [addStar, collectSticker, spawnCatchSparkles]);

  return (
    <View style={styles.container}>
      <View
        style={StyleSheet.absoluteFill}
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
              cursor: 'pointer',
            }}
          />
        ) : (
          <View style={styles.nativeFallback}>
            <Image
              source={STORYBOOK_ASSETS.bgArctic}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <Text style={styles.nativeFallbackText}>Arctic Catch</Text>
          </View>
        )}
      </View>

      <GameHeader
        totalSteps={cfg.goalCount}
        completedSteps={caughtCount}
        difficulty={difficulty}
        onDifficultyChange={(d) => resetRound(d, buddyIdx)}
      />

      {/* Compact Frosted Arctic Buddy Switcher Pill (outside canvas so buddy taps never collide with bay sliding) */}
      <View style={styles.buddyBarWrap} pointerEvents="box-none">
        <View style={[styles.buddyPill, isTablet && styles.buddyPillTablet]}>
          {ARCTIC_BUDDIES.map((b, idx) => {
            const selected = idx === buddyIdx % ARCTIC_BUDDIES.length;
            return (
              <TactileButton
                key={b.kind}
                onPress={() => {
                  soundEngine.unlock();
                  soundEngine.playAnimalSound(b.kind);
                  soundEngine.speakWord(b.label);
                  setBuddyIdx(idx);
                }}
                accessibilityLabel={`Play as ${b.label}`}
                style={{ width: isTablet ? 48 : 38 }}
              >
                <View
                  style={[
                    styles.buddyChip,
                    isTablet && styles.buddyChipTablet,
                    selected && styles.buddyChipActive,
                  ]}
                >
                  <ZooExhibitAnimalSvg
                    animal={b.kind}
                    size={isTablet ? 38 : 30}
                    highlighted={selected}
                  />
                </View>
              </TactileButton>
            );
          })}
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => resetRound(difficulty, buddyIdx + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CBEBF7',
  },
  buddyBarWrap: {
    marginTop: 4,
    alignItems: 'center',
    zIndex: 35,
  },
  buddyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 250, 240, 0.88)',
    borderRadius: 999,
    borderWidth: 2.4,
    borderColor: 'rgba(74, 53, 37, 0.24)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#2B4C5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  buddyPillTablet: {
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  buddyChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(214, 240, 250, 0.5)',
  },
  buddyChipTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buddyChipActive: {
    backgroundColor: '#FFF5CC',
    borderColor: COLORS.riverBorder,
    transform: [{ scale: 1.06 }],
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeFallbackText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
});
