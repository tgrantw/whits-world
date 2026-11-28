import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { SoundIcon } from '../components/JungleArt';
import { TactileButton } from '../components/TactileButton';
import { WhitMascot } from '../components/WhitMascot';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

type TraceTopic = 'letters' | 'numbers';
type Pt = [number, number];

interface GlyphSpec {
  id: string;
  label: string;
  word: string;
  promptPhrase: string;
  celebratePhrase: string;
  animal?: ExhibitAnimalKind;
  emoji: string;
  strokes: Pt[][];
}

interface TraceSparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  age: number;
  maxAge: number;
}

const TRACE_COLORS = [
  { id: 'rainbow', label: 'Rainbow', hex: '#FF4FA3', isRainbow: true },
  { id: 'red', label: 'Red', hex: '#E51A1A', isRainbow: false },
  { id: 'orange', label: 'Orange', hex: '#FF7A00', isRainbow: false },
  { id: 'green', label: 'Green', hex: '#1FA838', isRainbow: false },
  { id: 'blue', label: 'Blue', hex: '#1578E8', isRainbow: false },
  { id: 'purple', label: 'Purple', hex: '#7E2CE0', isRainbow: false },
];

const RAINBOW_STOPS = [
  '#E51A1A',
  '#FF7A00',
  '#FFD000',
  '#1FA838',
  '#1578E8',
  '#7E2CE0',
  '#FF4FA3',
];

function arcPts(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
  steps = 22
): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const rad = ((startDeg + (endDeg - startDeg) * t) * Math.PI) / 180;
    out.push([cx + Math.cos(rad) * rx, cy + Math.sin(rad) * ry]);
  }
  return out;
}

function resampleStroke(raw: Pt[], spacing = 2.4): Pt[] {
  if (raw.length < 2) return raw;
  const out: Pt[] = [raw[0]];
  let carry = 0;
  for (let i = 1; i < raw.length; i++) {
    const [x0, y0] = raw[i - 1];
    const [x1, y1] = raw[i];
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    if (segLen < 0.01) continue;
    let dist = spacing - carry;
    while (dist <= segLen) {
      const f = dist / segLen;
      out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
      dist += spacing;
    }
    carry = segLen - (dist - spacing);
  }
  const last = raw[raw.length - 1];
  const prev = out[out.length - 1];
  if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > 0.5) {
    out.push(last);
  }
  return out;
}

function getRainbowHex(frac: number): string {
  const clamped = ((frac % 1) + 1) % 1;
  const idx = Math.floor(clamped * (RAINBOW_STOPS.length - 1));
  return RAINBOW_STOPS[idx % RAINBOW_STOPS.length];
}

// All 26 Uppercase Letters (A-Z) in clear preschool stroke order on normalized 0..100 box (top=14, mid=50, base=86)
const LETTER_GLYPHS: GlyphSpec[] = [
  {
    id: 'A',
    label: 'A',
    word: 'Apple',
    promptPhrase: 'Trace A!',
    celebratePhrase: 'A is for Apple!',
    emoji: '🍎',
    strokes: [
      [[50, 14], [22, 86]],
      [[50, 14], [78, 86]],
      [[32, 60], [68, 60]],
    ],
  },
  {
    id: 'B',
    label: 'B',
    word: 'Banana',
    promptPhrase: 'Trace B!',
    celebratePhrase: 'B is for Banana!',
    emoji: '🍌',
    strokes: [
      [[28, 14], [28, 86]],
      [[28, 14], [52, 14], ...arcPts(52, 32, 22, 18, -90, 90, 16), [28, 50]],
      [[28, 50], [54, 50], ...arcPts(54, 68, 24, 18, -90, 90, 16), [28, 86]],
    ],
  },
  {
    id: 'C',
    label: 'C',
    word: 'Cow',
    promptPhrase: 'Trace C!',
    celebratePhrase: 'C is for Cow!',
    animal: 'cow',
    emoji: '🐄',
    strokes: [arcPts(54, 50, 30, 36, -42, -318, 28)],
  },
  {
    id: 'D',
    label: 'D',
    word: 'Duck',
    promptPhrase: 'Trace D!',
    celebratePhrase: 'D is for Duck!',
    animal: 'duck',
    emoji: '🦆',
    strokes: [
      [[28, 14], [28, 86]],
      [[28, 14], [46, 14], ...arcPts(46, 50, 32, 36, -90, 90, 22), [28, 86]],
    ],
  },
  {
    id: 'E',
    label: 'E',
    word: 'Elephant',
    promptPhrase: 'Trace E!',
    celebratePhrase: 'E is for Elephant!',
    animal: 'elephant',
    emoji: '🐘',
    strokes: [
      [[28, 14], [28, 86]],
      [[28, 14], [74, 14]],
      [[28, 50], [66, 50]],
      [[28, 86], [74, 86]],
    ],
  },
  {
    id: 'F',
    label: 'F',
    word: 'Frog',
    promptPhrase: 'Trace F!',
    celebratePhrase: 'F is for Frog!',
    animal: 'frog',
    emoji: '🐸',
    strokes: [
      [[30, 14], [30, 86]],
      [[30, 14], [74, 14]],
      [[30, 50], [66, 50]],
    ],
  },
  {
    id: 'G',
    label: 'G',
    word: 'Giraffe',
    promptPhrase: 'Trace G!',
    celebratePhrase: 'G is for Giraffe!',
    animal: 'giraffe',
    emoji: '🦒',
    strokes: [
      [...arcPts(52, 50, 30, 36, -38, -356, 30), [54, 52]],
    ],
  },
  {
    id: 'H',
    label: 'H',
    word: 'Hippo',
    promptPhrase: 'Trace H!',
    celebratePhrase: 'H is for Hippo!',
    animal: 'hippo',
    emoji: '🦛',
    strokes: [
      [[26, 14], [26, 86]],
      [[74, 14], [74, 86]],
      [[26, 50], [74, 50]],
    ],
  },
  {
    id: 'I',
    label: 'I',
    word: 'Ice Cream',
    promptPhrase: 'Trace I!',
    celebratePhrase: 'I is for Ice Cream!',
    emoji: '🍦',
    strokes: [
      [[50, 14], [50, 86]],
      [[32, 14], [68, 14]],
      [[32, 86], [68, 86]],
    ],
  },
  {
    id: 'J',
    label: 'J',
    word: 'Jellyfish',
    promptPhrase: 'Trace J!',
    celebratePhrase: 'J is for Jellyfish!',
    emoji: '🪼',
    strokes: [
      [[64, 14], [64, 62], ...arcPts(46, 62, 18, 24, 0, 170, 18)],
      [[38, 14], [76, 14]],
    ],
  },
  {
    id: 'K',
    label: 'K',
    word: 'Kite',
    promptPhrase: 'Trace K!',
    celebratePhrase: 'K is for Kite!',
    emoji: '🪁',
    strokes: [
      [[28, 14], [28, 86]],
      [[74, 14], [28, 52]],
      [[36, 46], [76, 86]],
    ],
  },
  {
    id: 'L',
    label: 'L',
    word: 'Lion',
    promptPhrase: 'Trace L!',
    celebratePhrase: 'L is for Lion!',
    animal: 'lion',
    emoji: '🦁',
    strokes: [
      [[30, 14], [30, 86]],
      [[30, 86], [74, 86]],
    ],
  },
  {
    id: 'M',
    label: 'M',
    word: 'Monkey',
    promptPhrase: 'Trace M!',
    celebratePhrase: 'M is for Monkey!',
    animal: 'monkey',
    emoji: '🐵',
    strokes: [
      [[20, 86], [20, 14]],
      [[20, 14], [50, 56], [80, 14]],
      [[80, 14], [80, 86]],
    ],
  },
  {
    id: 'N',
    label: 'N',
    word: 'Nest',
    promptPhrase: 'Trace N!',
    celebratePhrase: 'N is for Nest!',
    emoji: '🪺',
    strokes: [
      [[24, 86], [24, 14]],
      [[24, 14], [76, 86]],
      [[76, 86], [76, 14]],
    ],
  },
  {
    id: 'O',
    label: 'O',
    word: 'Octopus',
    promptPhrase: 'Trace O!',
    celebratePhrase: 'O is for Octopus!',
    animal: 'octopus',
    emoji: '🐙',
    strokes: [arcPts(50, 50, 30, 36, -90, -450, 32)],
  },
  {
    id: 'P',
    label: 'P',
    word: 'Panda',
    promptPhrase: 'Trace P!',
    celebratePhrase: 'P is for Panda!',
    animal: 'panda',
    emoji: '🐼',
    strokes: [
      [[28, 14], [28, 86]],
      [[28, 14], [52, 14], ...arcPts(52, 34, 24, 20, -90, 90, 18), [28, 54]],
    ],
  },
  {
    id: 'Q',
    label: 'Q',
    word: 'Queen Crown',
    promptPhrase: 'Trace Q!',
    celebratePhrase: 'Q is for Queen Crown!',
    emoji: '👑',
    strokes: [
      arcPts(50, 48, 29, 34, -90, -450, 32),
      [[56, 62], [78, 88]],
    ],
  },
  {
    id: 'R',
    label: 'R',
    word: 'Rainbow',
    promptPhrase: 'Trace R!',
    celebratePhrase: 'R is for Rainbow!',
    emoji: '🌈',
    strokes: [
      [[28, 14], [28, 86]],
      [[28, 14], [52, 14], ...arcPts(52, 33, 22, 19, -90, 90, 18), [28, 52]],
      [[48, 52], [76, 86]],
    ],
  },
  {
    id: 'S',
    label: 'S',
    word: 'Sheep',
    promptPhrase: 'Trace S!',
    celebratePhrase: 'S is for Sheep!',
    animal: 'sheep',
    emoji: '🐑',
    strokes: [
      [
        ...arcPts(50, 32, 23, 18, -28, -265, 18),
        ...arcPts(50, 68, 24, 18, -85, 152, 18),
      ],
    ],
  },
  {
    id: 'T',
    label: 'T',
    word: 'Tiger',
    promptPhrase: 'Trace T!',
    celebratePhrase: 'T is for Tiger!',
    animal: 'tiger',
    emoji: '🐯',
    strokes: [
      [[50, 14], [50, 86]],
      [[20, 14], [80, 14]],
    ],
  },
  {
    id: 'U',
    label: 'U',
    word: 'Umbrella',
    promptPhrase: 'Trace U!',
    celebratePhrase: 'U is for Umbrella!',
    emoji: '☂️',
    strokes: [
      [[24, 14], [24, 58], ...arcPts(50, 58, 26, 28, 180, 0, 20), [76, 14]],
    ],
  },
  {
    id: 'V',
    label: 'V',
    word: 'Vine',
    promptPhrase: 'Trace V!',
    celebratePhrase: 'V is for Vine!',
    emoji: '🌿',
    strokes: [
      [[22, 14], [50, 86], [78, 14]],
    ],
  },
  {
    id: 'W',
    label: 'W',
    word: 'Whale',
    promptPhrase: 'Trace W!',
    celebratePhrase: 'W is for Whale!',
    animal: 'whale',
    emoji: '🐋',
    strokes: [
      [[14, 16], [30, 86], [50, 40], [70, 86], [86, 16]],
    ],
  },
  {
    id: 'X',
    label: 'X',
    word: 'Xylophone',
    promptPhrase: 'Trace X!',
    celebratePhrase: 'X is for Xylophone!',
    emoji: '🎵',
    strokes: [
      [[24, 14], [76, 86]],
      [[76, 14], [24, 86]],
    ],
  },
  {
    id: 'Y',
    label: 'Y',
    word: 'Yo-Yo',
    promptPhrase: 'Trace Y!',
    celebratePhrase: 'Y is for Yo-Yo!',
    emoji: '🪀',
    strokes: [
      [[22, 14], [50, 50]],
      [[78, 14], [50, 50]],
      [[50, 50], [50, 86]],
    ],
  },
  {
    id: 'Z',
    label: 'Z',
    word: 'Zebra',
    promptPhrase: 'Trace Z!',
    celebratePhrase: 'Z is for Zebra!',
    animal: 'zebra',
    emoji: '🦓',
    strokes: [
      [[22, 16], [78, 16], [22, 84], [78, 84]],
    ],
  },
];

// All 10 Preschool Numbers (1-10)
const NUMBER_GLYPHS: GlyphSpec[] = [
  {
    id: '1',
    label: '1',
    word: 'One',
    promptPhrase: 'Trace 1!',
    celebratePhrase: 'One',
    animal: 'lion',
    emoji: '⭐',
    strokes: [
      [[38, 26], [52, 14], [52, 86]],
      [[34, 86], [70, 86]],
    ],
  },
  {
    id: '2',
    label: '2',
    word: 'Two',
    promptPhrase: 'Trace 2!',
    celebratePhrase: 'Two',
    animal: 'duck',
    emoji: '⭐⭐',
    strokes: [
      [...arcPts(50, 34, 24, 20, -165, 38, 20), [24, 86], [78, 86]],
    ],
  },
  {
    id: '3',
    label: '3',
    word: 'Three',
    promptPhrase: 'Trace 3!',
    celebratePhrase: 'Three',
    animal: 'frog',
    emoji: '⭐⭐⭐',
    strokes: [
      [
        ...arcPts(48, 32, 23, 18, -155, 92, 18),
        ...arcPts(49, 68, 25, 18, -88, 160, 18),
      ],
    ],
  },
  {
    id: '4',
    label: '4',
    word: 'Four',
    promptPhrase: 'Trace 4!',
    celebratePhrase: 'Four',
    animal: 'elephant',
    emoji: '4️⃣',
    strokes: [
      [[58, 14], [22, 62], [78, 62]],
      [[60, 14], [60, 86]],
    ],
  },
  {
    id: '5',
    label: '5',
    word: 'Five',
    promptPhrase: 'Trace 5!',
    celebratePhrase: 'Five',
    animal: 'monkey',
    emoji: '5️⃣',
    strokes: [
      [[72, 14], [32, 14]],
      [[32, 14], [28, 48], ...arcPts(48, 66, 25, 20, -135, 155, 20)],
    ],
  },
  {
    id: '6',
    label: '6',
    word: 'Six',
    promptPhrase: 'Trace 6!',
    celebratePhrase: 'Six',
    animal: 'penguin',
    emoji: '6️⃣',
    strokes: [
      [
        ...arcPts(56, 36, 26, 22, -45, -180, 14),
        [27, 64],
        ...arcPts(50, 66, 23, 20, 180, -180, 24),
      ],
    ],
  },
  {
    id: '7',
    label: '7',
    word: 'Seven',
    promptPhrase: 'Trace 7!',
    celebratePhrase: 'Seven',
    animal: 'giraffe',
    emoji: '7️⃣',
    strokes: [
      [[24, 16], [76, 16], [40, 86]],
    ],
  },
  {
    id: '8',
    label: '8',
    word: 'Eight',
    promptPhrase: 'Trace 8!',
    celebratePhrase: 'Eight',
    animal: 'octopus',
    emoji: '8️⃣',
    strokes: [
      [
        ...arcPts(50, 32, 21, 18, -90, -270, 16),
        ...arcPts(50, 68, 24, 18, -90, 90, 16),
        ...arcPts(50, 68, 24, 18, 90, 270, 16),
        ...arcPts(50, 32, 21, 18, 90, -90, 16),
      ],
    ],
  },
  {
    id: '9',
    label: '9',
    word: 'Nine',
    promptPhrase: 'Trace 9!',
    celebratePhrase: 'Nine',
    animal: 'panda',
    emoji: '9️⃣',
    strokes: [
      [
        ...arcPts(50, 34, 23, 20, 0, -360, 24),
        [73, 34],
        [68, 66],
        ...arcPts(48, 68, 22, 18, 0, 140, 14),
      ],
    ],
  },
  {
    id: '10',
    label: '10',
    word: 'Ten',
    promptPhrase: 'Trace 10!',
    celebratePhrase: 'Ten',
    animal: 'whale',
    emoji: '🔟',
    strokes: [
      [[18, 28], [28, 16], [28, 84]],
      arcPts(66, 50, 21, 34, -90, -450, 28),
    ],
  },
];

function getGoalCount(difficulty: Difficulty): number {
  if (difficulty === 1) return 3;
  if (difficulty === 2) return 4;
  return 5;
}

function getTolerancePx(difficulty: Difficulty, glyphBox: number): number {
  if (difficulty === 1) return Math.max(40, glyphBox * 0.2);
  if (difficulty === 2) return Math.max(32, glyphBox * 0.155);
  return Math.max(25, glyphBox * 0.12);
}

function drawStarPath(
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
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Whit's Trace Trail (Pre-Writing Letter A–Z & Number 1–10 Guided Tracing):
 * - 60fps HTML5 2D <canvas> with direct non-passive touch/pointer tracking (0ms tablet latency).
 * - Wide preschool handwriting guidelines, numbered glowing Start Dots, and an animated
 *   Golden Guiding Star showing toddlers which way to trace!
 * - Zero frustration: lifting finger preserves progress, forgiving Easy/Med/Hard hit radii,
 *   vivid Crayon & Rainbow Magic paint, sparkle trail, and neural human voice for every glyph!
 */
export const TraceTrailGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, width, height } = useResponsive();

  const [topic, setTopic] = useState<TraceTopic>('letters');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [glyphIdx, setGlyphIdx] = useState(0);
  const [colorId, setColorId] = useState('rainbow');
  const [tracedThisRound, setTracedThisRound] = useState(0);
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [glyphDone, setGlyphDone] = useState(false);
  const [won, setWon] = useState(false);
  const [canvasSize, setCanvasSize] = useState({
    w: Math.min(540, Math.max(280, width - 48)),
    h: Math.min(400, Math.max(240, height - 300)),
  });

  const glyphs = topic === 'letters' ? LETTER_GLYPHS : NUMBER_GLYPHS;
  const activeGlyph = glyphs[glyphIdx % glyphs.length];
  const goalCount = getGoalCount(difficulty);

  const resampledStrokes = useMemo(
    () => activeGlyph.strokes.map((st) => resampleStroke(st, 2.3)),
    [activeGlyph]
  );

  // Live 60fps tracing refs (zero per-frame React state updates!)
  const traceRef = useRef({
    strokeIdx: 0,
    wpIdx: 0,
    completedStrokes: 0,
    isDragging: false,
    pointerId: -1,
    mode: 'pointer' as 'touch' | 'pointer',
    lastTouchEnd: 0,
    lastPingWp: -10,
    sparkles: [] as TraceSparkle[],
    elapsed: 0,
    glyphDone: false,
  });

  const strokesRef = useRef(resampledStrokes);
  strokesRef.current = resampledStrokes;
  const glyphRef = useRef(activeGlyph);
  glyphRef.current = activeGlyph;
  const sizeRef = useRef(canvasSize);
  sizeRef.current = canvasSize;
  const diffRef = useRef(difficulty);
  diffRef.current = difficulty;
  const colorRef = useRef(
    TRACE_COLORS.find((c) => c.id === colorId) || TRACE_COLORS[0]
  );
  colorRef.current =
    TRACE_COLORS.find((c) => c.id === colorId) || TRACE_COLORS[0];
  const tracedCountRef = useRef(tracedThisRound);
  tracedCountRef.current = tracedThisRound;
  const wonRef = useRef(won);
  wonRef.current = won;
  const topicRef = useRef(topic);
  topicRef.current = topic;

  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer]);

  const resetCurrentGlyphState = useCallback(() => {
    clearAdvanceTimer();
    const tr = traceRef.current;
    tr.strokeIdx = 0;
    tr.wpIdx = 0;
    tr.completedStrokes = 0;
    tr.isDragging = false;
    tr.lastPingWp = -10;
    tr.sparkles = [];
    tr.glyphDone = false;
    setGlyphDone(false);
  }, [clearAdvanceTimer]);

  // Speak prompt whenever glyph or topic changes
  useEffect(() => {
    resetCurrentGlyphState();
    const timer = setTimeout(() => {
      if (!wonRef.current) {
        soundEngine.speakWord(activeGlyph.promptPhrase);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [activeGlyph, resetCurrentGlyphState]);

  const spawnSparkles = useCallback((x: number, y: number, count: number, hex?: string) => {
    const list = traceRef.current.sparkles;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spd = 45 + Math.random() * 145;
      list.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 20,
        r: 3 + Math.random() * 4.5,
        color: hex || RAINBOW_STOPS[i % RAINBOW_STOPS.length],
        age: 0,
        maxAge: 0.42 + Math.random() * 0.28,
      });
    }
    if (list.length > 110) {
      traceRef.current.sparkles = list.slice(-110);
    }
  }, []);

  const getGlyphTransform = useCallback((w: number, h: number) => {
    const padX = Math.max(24, w * 0.08);
    const padY = Math.max(18, h * 0.07);
    const box = Math.min(w - padX * 2, h - padY * 2);
    const ox = (w - box) * 0.5;
    const oy = (h - box) * 0.5;
    return { box, ox, oy };
  }, []);

  const toCanvasPt = useCallback(
    (pt: Pt, w: number, h: number): [number, number] => {
      const { box, ox, oy } = getGlyphTransform(w, h);
      return [ox + (pt[0] / 100) * box, oy + (pt[1] / 100) * box];
    },
    [getGlyphTransform]
  );

  const handleGlyphFinished = useCallback(() => {
    const tr = traceRef.current;
    if (tr.glyphDone) return;
    tr.glyphDone = true;
    tr.isDragging = false;
    setGlyphDone(true);

    const g = glyphRef.current;
    const { w, h } = sizeRef.current;
    spawnSparkles(w * 0.5, h * 0.45, 28);
    soundEngine.playMatch();
    if (g.animal) {
      collectSticker(g.animal);
    }
    soundEngine.speakWord(g.celebratePhrase);

    setCompletedIds((prev) => ({ ...prev, [`${topicRef.current}:${g.id}`]: true }));
    const nextCount = tracedCountRef.current + 1;
    tracedCountRef.current = nextCount;
    setTracedThisRound(nextCount);

    const curGoal = getGoalCount(diffRef.current);
    clearAdvanceTimer();
    if (nextCount >= curGoal) {
      advanceTimerRef.current = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        wonRef.current = true;
        setWon(true);
      }, 1150);
    } else {
      advanceTimerRef.current = setTimeout(() => {
        setGlyphIdx((prev) => prev + 1);
      }, 1500);
    }
  }, [addStar, clearAdvanceTimer, collectSticker, spawnSparkles]);

  // Process a finger position on the 2D tracing slate
  const applyTracePoint = useCallback(
    (lx: number, ly: number) => {
      const tr = traceRef.current;
      if (tr.glyphDone || wonRef.current) return;
      const strokes = strokesRef.current;
      const activeStroke = strokes[tr.strokeIdx];
      if (!activeStroke || activeStroke.length < 2) return;

      const { w, h } = sizeRef.current;
      const { box } = getGlyphTransform(w, h);
      const tol = getTolerancePx(diffRef.current, box);

      // Search a generous forward window along the active stroke so kids smoothly advance curves & corners
      const maxJump = Math.max(8, Math.round(activeStroke.length * 0.24));
      const startScan = Math.max(0, tr.wpIdx);
      const endScan = Math.min(activeStroke.length - 1, tr.wpIdx + maxJump);

      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = startScan; i <= endScan; i++) {
        const [px, py] = toCanvasPt(activeStroke[i], w, h);
        const d = Math.hypot(lx - px, ly - py);
        if (d <= tol && d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      if (bestIdx >= tr.wpIdx) {
        const prevWp = tr.wpIdx;
        tr.wpIdx = bestIdx;

        // Emit joyful sparkles & gentle ascending xylophone chimes as child traces forward!
        if (bestIdx > prevWp) {
          const [sx, sy] = toCanvasPt(activeStroke[bestIdx], w, h);
          const col = colorRef.current;
          const sparkHex = col.isRainbow
            ? getRainbowHex(bestIdx / activeStroke.length)
            : col.hex;
          spawnSparkles(sx, sy, 3, sparkHex);

          if (bestIdx - tr.lastPingWp >= Math.max(5, Math.floor(activeStroke.length / 5))) {
            tr.lastPingWp = bestIdx;
            const noteIdx = Math.min(
              6,
              Math.floor((bestIdx / activeStroke.length) * 6) + 1
            );
            soundEngine.playStarCollect(noteIdx);
          }
        }

        // Auto-complete stroke when child reaches >= 87% of stroke waypoints!
        if (bestIdx >= Math.floor((activeStroke.length - 1) * 0.87)) {
          const [endX, endY] = toCanvasPt(
            activeStroke[activeStroke.length - 1],
            w,
            h
          );
          spawnSparkles(endX, endY, 12);
          soundEngine.playSnap();
          tr.completedStrokes = tr.strokeIdx + 1;
          tr.strokeIdx += 1;
          tr.wpIdx = 0;
          tr.lastPingWp = -10;

          if (tr.strokeIdx >= strokes.length) {
            handleGlyphFinished();
          }
        }
      }
    },
    [getGlyphTransform, handleGlyphFinished, spawnSparkles, toCanvasPt]
  );

  // Canvas mount + direct non-passive touch & pointer listeners (0ms tablet touch!)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const handleCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    setCanvasEl(el);
  }, []);

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

  const beginStrokeInput = useCallback(
    (mode: 'touch' | 'pointer', id: number, clientX: number, clientY: number) => {
      soundEngine.unlock();
      const tr = traceRef.current;
      tr.isDragging = true;
      tr.mode = mode;
      tr.pointerId = id;
      const loc = getLocalCoords(clientX, clientY);
      applyTracePoint(loc.x, loc.y);

      cleanupWinListeners();
      if (typeof window === 'undefined') return;

      const endInput = () => {
        if (tr.mode !== mode || tr.pointerId !== id) return;
        tr.isDragging = false;
        tr.pointerId = -1;
        cleanupWinListeners();
        if (mode === 'touch') {
          tr.lastTouchEnd = Date.now();
        }
      };

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
          const pt = getLocalCoords(t.clientX, t.clientY);
          applyTracePoint(pt.x, pt.y);
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          const pt = getLocalCoords(t.clientX, t.clientY);
          applyTracePoint(pt.x, pt.y);
          endInput();
        };
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd, { passive: false });
        window.addEventListener('touchcancel', onEnd);
        winCleanupRef.current = () => {
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onEnd);
          window.removeEventListener('touchcancel', onEnd);
        };
      } else {
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          const pt = getLocalCoords(ev.clientX, ev.clientY);
          applyTracePoint(pt.x, pt.y);
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          const pt = getLocalCoords(ev.clientX, ev.clientY);
          applyTracePoint(pt.x, pt.y);
          endInput();
        };
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        winCleanupRef.current = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
      }
    },
    [applyTracePoint, cleanupWinListeners, getLocalCoords]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasEl) return;

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      beginStrokeInput('touch', t.identifier, t.clientX, t.clientY);
    };
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - traceRef.current.lastTouchEnd < 500) return;
      ev.preventDefault();
      beginStrokeInput('pointer', ev.pointerId, ev.clientX, ev.clientY);
    };

    canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    return () => {
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, [beginStrokeInput, canvasEl]);

  // 60fps HTML5 2D Canvas Renderer (guidelines, wide tracing grooves, painted crayon strokes, guiding star & sparkles!)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let rafId = 0;
    let lastTs = performance.now();

    const drawStrokePath = (
      ctx: CanvasRenderingContext2D,
      pts: Pt[],
      maxIndex: number,
      w: number,
      h: number
    ) => {
      if (pts.length < 2 || maxIndex < 1) return;
      ctx.beginPath();
      const [sx, sy] = toCanvasPt(pts[0], w, h);
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= maxIndex && i < pts.length; i++) {
        const [px, py] = toCanvasPt(pts[i], w, h);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    const drawPaintedStroke = (
      ctx: CanvasRenderingContext2D,
      pts: Pt[],
      maxIndex: number,
      w: number,
      h: number,
      lineW: number
    ) => {
      if (pts.length < 2 || maxIndex < 1) return;
      const col = colorRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = lineW;

      if (!col.isRainbow) {
        ctx.strokeStyle = col.hex;
        drawStrokePath(ctx, pts, maxIndex, w, h);
        // Glossy crayon highlight down center
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = Math.max(4, lineW * 0.28);
        drawStrokePath(ctx, pts, maxIndex, w, h);
        return;
      }

      // Smooth rainbow paint gradient along waypoints!
      for (let i = 1; i <= maxIndex && i < pts.length; i++) {
        const [x0, y0] = toCanvasPt(pts[i - 1], w, h);
        const [x1, y1] = toCanvasPt(pts[i], w, h);
        ctx.strokeStyle = getRainbowHex((i - 1) / Math.max(1, pts.length - 1));
        ctx.lineWidth = lineW;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.34)';
      ctx.lineWidth = Math.max(4, lineW * 0.25);
      drawStrokePath(ctx, pts, maxIndex, w, h);
    };

    const render = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const tr = traceRef.current;
      tr.elapsed += dt;

      // Update sparkle particles
      const alive: TraceSparkle[] = [];
      for (let i = 0; i < tr.sparkles.length; i++) {
        const sp = tr.sparkles[i];
        sp.age += dt;
        if (sp.age < sp.maxAge) {
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 210 * dt;
          alive.push(sp);
        }
      }
      tr.sparkles = alive;

      const canvas = canvasRef.current;
      const { w, h } = sizeRef.current;
      if (canvas && w > 40 && h > 40) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const tw = Math.round(w * dpr);
        const th = Math.round(h * dpr);
        if (canvas.width !== tw || canvas.height !== th) {
          canvas.width = tw;
          canvas.height = th;
        }
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // 1. Warm Cream Preschool Tracing Slate Background
          ctx.fillStyle = '#FFFDF5';
          ctx.fillRect(0, 0, w, h);

          // 2. Preschool Ruled Handwriting Lines (Sky top, Dashed Belt mid, Grass bottom)
          const { box, oy } = getGlyphTransform(w, h);
          const topLineY = oy + box * 0.14;
          const midLineY = oy + box * 0.5;
          const baseLineY = oy + box * 0.86;

          ctx.save();
          ctx.strokeStyle = 'rgba(116, 178, 224, 0.38)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(18, topLineY);
          ctx.lineTo(w - 18, topLineY);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(218, 165, 92, 0.45)';
          ctx.setLineDash([9, 8]);
          ctx.beginPath();
          ctx.moveTo(18, midLineY);
          ctx.lineTo(w - 18, midLineY);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(94, 176, 98, 0.46)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(18, baseLineY);
          ctx.lineTo(w - 18, baseLineY);
          ctx.stroke();
          ctx.restore();

          const strokes = strokesRef.current;
          const trackW =
            diffRef.current === 1
              ? Math.max(28, box * 0.145)
              : diffRef.current === 2
              ? Math.max(24, box * 0.125)
              : Math.max(20, box * 0.105);

          // 3. Draw Recessed Groove Outline & Cream Channel for ALL Strokes
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          for (let s = 0; s < strokes.length; s++) {
            const pts = strokes[s];
            // Soft warm outline edge
            ctx.strokeStyle = '#DFCBA8';
            ctx.lineWidth = trackW + 6;
            drawStrokePath(ctx, pts, pts.length - 1, w, h);

            // Soft cream recessed groove
            ctx.strokeStyle = '#F6ECDA';
            ctx.lineWidth = trackW;
            drawStrokePath(ctx, pts, pts.length - 1, w, h);

            // Inner dashed preschool guide path
            ctx.save();
            ctx.strokeStyle = s === tr.strokeIdx ? '#B8874B' : 'rgba(184, 135, 75, 0.42)';
            ctx.lineWidth = 3;
            ctx.setLineDash([7, 9]);
            drawStrokePath(ctx, pts, pts.length - 1, w, h);
            ctx.restore();
          }

          // 4. Draw Completed Strokes in Vivid Paint!
          for (let s = 0; s < tr.completedStrokes && s < strokes.length; s++) {
            const pts = strokes[s];
            drawPaintedStroke(ctx, pts, pts.length - 1, w, h, trackW * 0.86);
          }

          // 5. Draw Active Stroke Progress + Glowing Start Dot + Animated Guiding Star!
          if (!tr.glyphDone && tr.strokeIdx < strokes.length) {
            const active = strokes[tr.strokeIdx];
            if (tr.wpIdx > 0) {
              drawPaintedStroke(ctx, active, tr.wpIdx, w, h, trackW * 0.86);
            }

            // Animated Guiding Star smoothly tracing from current waypoint toward stroke end (when idle!)
            const remCount = Math.max(1, active.length - 1 - tr.wpIdx);
            const guidePhase = (tr.elapsed * 0.62) % 1.35;
            if (!tr.isDragging && guidePhase <= 1.0 && remCount > 2) {
              const gIdx = Math.min(
                active.length - 1,
                tr.wpIdx + Math.floor(guidePhase * remCount)
              );
              const [gx, gy] = toCanvasPt(active[gIdx], w, h);
              ctx.save();
              ctx.globalAlpha = 0.85 * (1 - guidePhase * 0.25);
              drawStarPath(ctx, gx, gy, 15, 7);
              ctx.fillStyle = '#FFE052';
              ctx.strokeStyle = '#B36B00';
              ctx.lineWidth = 2.2;
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }

            // Pulsing Numbered Start / Continue Dot right at active[tr.wpIdx]
            const [dotX, dotY] = toCanvasPt(active[tr.wpIdx], w, h);
            const pulse = 1 + Math.sin(tr.elapsed * 5.2) * 0.12;
            const dotR = Math.max(15, trackW * 0.48) * pulse;

            ctx.save();
            ctx.fillStyle = 'rgba(72, 199, 102, 0.25)';
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotR * 1.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2BB84D';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = `900 ${Math.round(dotR * 1.15)}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(tr.strokeIdx + 1), dotX, dotY + 1);
            ctx.restore();
          }

          // 6. Sparkle Particles
          for (let i = 0; i < tr.sparkles.length; i++) {
            const sp = tr.sparkles[i];
            const alpha = Math.max(0, 1 - sp.age / sp.maxAge);
            ctx.save();
            ctx.globalAlpha = alpha;
            drawStarPath(ctx, sp.x, sp.y, sp.r * 1.6, sp.r * 0.72);
            ctx.fillStyle = sp.color;
            ctx.strokeStyle = 'rgba(74, 53, 37, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [getGlyphTransform, toCanvasPt]);

  const handleTopicChange = (next: TraceTopic) => {
    if (next === topic) return;
    soundEngine.unlock();
    soundEngine.playPop();
    setTopic(next);
    setGlyphIdx(0);
    setTracedThisRound(0);
    tracedCountRef.current = 0;
    setWon(false);
    wonRef.current = false;
  };

  const handleDifficultyChange = (nextDiff: Difficulty) => {
    setDifficulty(nextDiff);
    setTracedThisRound(0);
    tracedCountRef.current = 0;
    setWon(false);
    wonRef.current = false;
    resetCurrentGlyphState();
  };

  const handlePlayAgain = () => {
    setWon(false);
    wonRef.current = false;
    setTracedThisRound(0);
    tracedCountRef.current = 0;
    setGlyphIdx((prev) => (prev + 1) % glyphs.length);
  };

  return (
    <View style={styles.container}>
      <GameHeader
        totalSteps={goalCount}
        completedSteps={tracedThisRound}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      {/* Top Topic & Voice Prompt Bar */}
      <View style={[styles.controlRow, isTablet && styles.controlRowTablet]}>
        <View style={styles.topicToggle}>
          <TactileButton
            onPress={() => handleTopicChange('letters')}
            accessibilityLabel="Trace ABC Letters"
          >
            <View
              style={[
                styles.topicPill,
                topic === 'letters' && styles.topicPillActive,
              ]}
            >
              <Text
                style={[
                  styles.topicPillText,
                  topic === 'letters' && styles.topicPillTextActive,
                ]}
              >
                ABC
              </Text>
            </View>
          </TactileButton>
          <TactileButton
            onPress={() => handleTopicChange('numbers')}
            accessibilityLabel="Trace 123 Numbers"
          >
            <View
              style={[
                styles.topicPill,
                topic === 'numbers' && styles.topicPillActiveNum,
              ]}
            >
              <Text
                style={[
                  styles.topicPillText,
                  topic === 'numbers' && styles.topicPillTextActive,
                ]}
              >
                123
              </Text>
            </View>
          </TactileButton>
        </View>

        <TactileButton
          onPress={() => {
            soundEngine.unlock();
            soundEngine.playPop();
            soundEngine.speakWord(activeGlyph.promptPhrase);
          }}
          accessibilityLabel={`Hear prompt: ${activeGlyph.promptPhrase}`}
        >
          <View style={styles.promptPill}>
            <SoundIcon muted={false} size={isTablet ? 22 : 18} color={COLORS.woodDark} />
            <Text style={[styles.promptText, isTablet && { fontSize: 19 }]}>
              Trace {activeGlyph.label}!
            </Text>
            {activeGlyph.animal ? (
              <ZooExhibitAnimalSvg
                animal={activeGlyph.animal}
                size={isTablet ? 32 : 26}
              />
            ) : (
              <Text style={{ fontSize: isTablet ? 22 : 18 }}>{activeGlyph.emoji}</Text>
            )}
          </View>
        </TactileButton>

        <TactileButton
          onPress={() => {
            soundEngine.unlock();
            soundEngine.playCardFlip();
            resetCurrentGlyphState();
          }}
          accessibilityLabel="Reset current trace"
        >
          <View style={styles.resetBtn}>
            <Text style={[styles.resetText, isTablet && { fontSize: 15 }]}>↺</Text>
          </View>
        </TactileButton>
      </View>

      {/* Main Wooden Tracing Slate + Cheering Side Whit + Crayon Bar */}
      <View style={[styles.stageBody, isTablet && styles.stageBodyTablet]}>
        <View style={styles.slateOuter}>
          <View
            style={styles.slateInner}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              if (w > 100 && h > 100) {
                setCanvasSize((prev) =>
                  Math.abs(prev.w - w) < 2 && Math.abs(prev.h - h) < 2
                    ? prev
                    : { w, h }
                );
              }
            }}
          >
            {Platform.OS === 'web' ? (
              <canvas
                ref={handleCanvasRef}
                aria-label={`Trace canvas for ${activeGlyph.label}`}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  cursor: 'crosshair',
                }}
              />
            ) : (
              <View style={styles.nativeFallback}>
                <Text style={styles.nativeGlyph}>{activeGlyph.label}</Text>
              </View>
            )}

            {/* Joyful Completion Banner right inside the slate */}
            {glyphDone && (
              <View style={styles.doneBanner} pointerEvents="none">
                {activeGlyph.animal ? (
                  <ZooExhibitAnimalSvg
                    animal={activeGlyph.animal}
                    size={isTablet ? 44 : 36}
                  />
                ) : (
                  <Text style={{ fontSize: isTablet ? 28 : 24 }}>
                    {activeGlyph.emoji}
                  </Text>
                )}
                <Text style={[styles.doneBannerText, isTablet && { fontSize: 22 }]}>
                  {topic === 'letters'
                    ? `${activeGlyph.label} is for ${activeGlyph.word}!`
                    : `${activeGlyph.label} · ${activeGlyph.word}!`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Side / Bottom Crayon Color Picker + Mini Cheering Whit */}
        <View
          style={[
            styles.sideTools,
            isTablet ? styles.sideToolsTablet : styles.sideToolsPhone,
          ]}
        >
          {isTablet && (
            <View style={styles.miniWhitCard}>
              <WhitMascot
                mood={glyphDone ? 'cheer' : 'idle'}
                size={104}
                interactive
                onPress={() => soundEngine.speakWord(activeGlyph.promptPhrase)}
              />
            </View>
          )}

          <View
            style={[
              styles.crayonPalette,
              isTablet ? styles.crayonPaletteCol : styles.crayonPaletteRow,
            ]}
          >
            {TRACE_COLORS.map((c) => {
              const selected = c.id === colorId;
              return (
                <TactileButton
                  key={c.id}
                  onPress={() => {
                    soundEngine.unlock();
                    soundEngine.playPop();
                    soundEngine.speakWord(c.isRainbow ? 'Rainbow paint!' : c.label);
                    setColorId(c.id);
                  }}
                  accessibilityLabel={`${c.label} tracing paint`}
                >
                  <View
                    style={[
                      styles.colorDot,
                      isTablet && styles.colorDotTablet,
                      {
                        backgroundColor: c.isRainbow ? '#FFF3CC' : c.hex,
                        borderColor: selected ? COLORS.woodDark : 'rgba(74,53,37,0.32)',
                        transform: [{ scale: selected ? 1.14 : 1 }],
                      },
                    ]}
                  >
                    {c.isRainbow ? (
                      <Text style={{ fontSize: isTablet ? 22 : 18 }}>🌈</Text>
                    ) : selected ? (
                      <Text style={styles.dotCheck}>✓</Text>
                    ) : null}
                  </View>
                </TactileButton>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom Quick-Jump Letter / Number Strip */}
      <View style={styles.pickerWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerContent}
        >
          {glyphs.map((g, idx) => {
            const active = idx === glyphIdx % glyphs.length;
            const done = Boolean(completedIds[`${topic}:${g.id}`]);
            return (
              <TactileButton
                key={g.id}
                onPress={() => {
                  soundEngine.unlock();
                  soundEngine.playPop();
                  setGlyphIdx(idx);
                }}
                accessibilityLabel={`Choose ${g.label}`}
              >
                <View
                  style={[
                    styles.glyphChip,
                    isTablet && styles.glyphChipTablet,
                    active && styles.glyphChipActive,
                    done && !active && styles.glyphChipDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.glyphChipText,
                      isTablet && { fontSize: 19 },
                      active && { color: '#FFFFFF' },
                    ]}
                  >
                    {g.label}
                  </Text>
                  {done && (
                    <View style={styles.doneTick}>
                      <Text style={styles.doneTickText}>★</Text>
                    </View>
                  )}
                </View>
              </TactileButton>
            );
          })}
        </ScrollView>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={handlePlayAgain}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 2,
    marginBottom: 8,
    width: '100%',
    maxWidth: 820,
  },
  controlRowTablet: {
    gap: 14,
    marginBottom: 10,
  },
  topicToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    padding: 3,
    gap: 4,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  topicPillActive: {
    backgroundColor: '#5E64C4',
  },
  topicPillActiveNum: {
    backgroundColor: '#2E966C',
  },
  topicPillText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  topicPillTextActive: {
    color: '#FFFFFF',
  },
  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  resetBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.cream,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  stageBody: {
    flex: 1,
    width: '100%',
    maxWidth: 860,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stageBodyTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 28,
  },
  slateOuter: {
    flex: 1,
    width: '100%',
    maxWidth: 580,
    maxHeight: 460,
    minHeight: 240,
    backgroundColor: COLORS.woodLight,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 9,
    padding: 8,
    shadowColor: '#2B1B0E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  slateInner: {
    flex: 1,
    width: '100%',
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#DEC18D',
    backgroundColor: '#FFFDF5',
    position: 'relative',
  },
  doneBanner: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF9ED',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: '#3B9E4E',
    paddingHorizontal: 18,
    paddingVertical: 7,
    shadowColor: '#1E4A24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  doneBannerText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E5E2B',
  },
  sideTools: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sideToolsTablet: {
    width: 132,
  },
  sideToolsPhone: {
    width: '100%',
  },
  miniWhitCard: {
    backgroundColor: 'rgba(255, 250, 236, 0.88)',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#D9B67A',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crayonPalette: {
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    padding: 8,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crayonPaletteCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 118,
  },
  crayonPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  colorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotTablet: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  dotCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  pickerWrap: {
    width: '100%',
    maxWidth: 880,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 6,
  },
  glyphChip: {
    minWidth: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  glyphChipTablet: {
    minWidth: 48,
    height: 48,
    borderRadius: 16,
  },
  glyphChipActive: {
    backgroundColor: '#E07F22',
    borderColor: COLORS.woodDark,
  },
  glyphChipDone: {
    backgroundColor: '#E6F7E8',
    borderColor: '#489E54',
  },
  glyphChipText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  doneTick: {
    position: 'absolute',
    top: -5,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD952',
    borderWidth: 1.5,
    borderColor: '#9C6200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTickText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7A4800',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeGlyph: {
    fontSize: 120,
    fontWeight: '900',
    color: '#D8BE92',
  },
});
