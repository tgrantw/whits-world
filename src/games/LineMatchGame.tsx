import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';
import { markWebTouchHandled } from '../utils/webTouch';

export type LineMatchTopic = 'colors' | 'numbers' | 'letters';

const INK = '#4A3525';

interface MatchPairSpec {
  id: string;
  leftMain: string;
  leftSub?: string;
  lineColor: string;
  textColor: string;
  pillBg: string;
  pillBorder: string;
  speakLeft: string;
  speakMatch: string;
  animalSound?: ExhibitAnimalKind;
  rightKind: 'color-art' | 'count-group' | 'letter-art';
  colorArtId?: string;
  countNum?: number;
  countAnimal?: ExhibitAnimalKind;
  letterChar?: string;
  letterWord?: string;
  letterAnimal?: ExhibitAnimalKind;
  noteFreq: number;
}

const COLOR_PAIRS: MatchPairSpec[] = [
  {
    id: 'red',
    leftMain: 'RED',
    lineColor: '#E54B42',
    textColor: '#D63830',
    pillBg: '#FFF4F3',
    pillBorder: '#C7423B',
    speakLeft: 'Red',
    speakMatch: 'Red! Red Apple!',
    rightKind: 'color-art',
    colorArtId: 'red',
    noteFreq: 261.63,
  },
  {
    id: 'blue',
    leftMain: 'BLUE',
    lineColor: '#3A9ED4',
    textColor: '#217EB0',
    pillBg: '#F0FAFF',
    pillBorder: '#2979A6',
    speakLeft: 'Blue',
    speakMatch: 'Blue! Blue Whale!',
    animalSound: 'whale',
    rightKind: 'color-art',
    colorArtId: 'blue',
    noteFreq: 392.0,
  },
  {
    id: 'green',
    leftMain: 'GREEN',
    lineColor: '#4BA850',
    textColor: '#2F8A34',
    pillBg: '#F1FBF0',
    pillBorder: '#347D38',
    speakLeft: 'Green',
    speakMatch: 'Green! Green Frog!',
    animalSound: 'frog',
    rightKind: 'color-art',
    colorArtId: 'green',
    noteFreq: 349.23,
  },
  {
    id: 'yellow',
    leftMain: 'YELLOW',
    lineColor: '#E8B31A',
    textColor: '#C48E00',
    pillBg: '#FFFBE6',
    pillBorder: '#BA8710',
    speakLeft: 'Yellow',
    speakMatch: 'Yellow! Yellow Sun!',
    rightKind: 'color-art',
    colorArtId: 'yellow',
    noteFreq: 329.63,
  },
  {
    id: 'orange',
    leftMain: 'ORANGE',
    lineColor: '#EE8324',
    textColor: '#D1680F',
    pillBg: '#FFF5EB',
    pillBorder: '#BA5D12',
    speakLeft: 'Orange',
    speakMatch: 'Orange! Juicy Orange!',
    rightKind: 'color-art',
    colorArtId: 'orange',
    noteFreq: 293.66,
  },
  {
    id: 'purple',
    leftMain: 'PURPLE',
    lineColor: '#8F62CC',
    textColor: '#6D41AD',
    pillBg: '#F7F2FF',
    pillBorder: '#673FA1',
    speakLeft: 'Purple',
    speakMatch: 'Purple! Purple Grapes!',
    rightKind: 'color-art',
    colorArtId: 'purple',
    noteFreq: 440.0,
  },
  {
    id: 'pink',
    leftMain: 'PINK',
    lineColor: '#EA6F9C',
    textColor: '#C94476',
    pillBg: '#FFF2F7',
    pillBorder: '#B3436D',
    speakLeft: 'Pink',
    speakMatch: 'Pink! Pink Flamingo!',
    animalSound: 'flamingo',
    rightKind: 'color-art',
    colorArtId: 'pink',
    noteFreq: 493.88,
  },
  {
    id: 'brown',
    leftMain: 'BROWN',
    lineColor: '#96613D',
    textColor: '#754626',
    pillBg: '#FAF3ED',
    pillBorder: '#6E4224',
    speakLeft: 'Brown',
    speakMatch: 'Brown! Brown Monkey!',
    animalSound: 'monkey',
    rightKind: 'color-art',
    colorArtId: 'brown',
    noteFreq: 523.25,
  },
];

const NUM_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const NUM_ANIMALS: { kind: ExhibitAnimalKind; singular: string; plural: string }[] = [
  { kind: 'lion', singular: 'Lion', plural: 'Lions' },
  { kind: 'duck', singular: 'Duck', plural: 'Ducks' },
  { kind: 'frog', singular: 'Frog', plural: 'Frogs' },
  { kind: 'penguin', singular: 'Penguin', plural: 'Penguins' },
  { kind: 'monkey', singular: 'Monkey', plural: 'Monkeys' },
  { kind: 'turtle', singular: 'Turtle', plural: 'Turtles' },
  { kind: 'panda', singular: 'Panda', plural: 'Pandas' },
  { kind: 'elephant', singular: 'Elephant', plural: 'Elephants' },
];
const ROW_STYLES = [
  { line: '#E54B42', text: '#B53028', bg: '#FFF2F1', border: '#C7423B', freq: 261.63 },
  { line: '#3A9ED4', text: '#1D6E9C', bg: '#EEF9FF', border: '#2A7CA8', freq: 329.63 },
  { line: '#4BA850', text: '#2B7D30', bg: '#EFFBEF', border: '#347D38', freq: 392.0 },
  { line: '#8F62CC', text: '#60389C', bg: '#F5EFFF', border: '#6A44A3', freq: 440.0 },
  { line: '#EE8324', text: '#BD5A0B', bg: '#FFF4E8', border: '#BA5D12', freq: 493.88 },
  { line: '#EA6F9C', text: '#B53B68', bg: '#FFF0F6', border: '#B3436D', freq: 523.25 },
];

const LETTER_POOL: {
  letter: string;
  word: string;
  animal?: ExhibitAnimalKind;
}[] = [
  { letter: 'A', word: 'Apple' },
  { letter: 'B', word: 'Banana' },
  { letter: 'C', word: 'Cow', animal: 'cow' },
  { letter: 'D', word: 'Duck', animal: 'duck' },
  { letter: 'E', word: 'Elephant', animal: 'elephant' },
  { letter: 'F', word: 'Frog', animal: 'frog' },
  { letter: 'G', word: 'Giraffe', animal: 'giraffe' },
  { letter: 'H', word: 'Hippo', animal: 'hippo' },
  { letter: 'K', word: 'Kite' },
  { letter: 'L', word: 'Lion', animal: 'lion' },
  { letter: 'M', word: 'Monkey', animal: 'monkey' },
  { letter: 'O', word: 'Octopus', animal: 'octopus' },
  { letter: 'P', word: 'Panda', animal: 'panda' },
  { letter: 'R', word: 'Rainbow' },
  { letter: 'S', word: 'Sheep', animal: 'sheep' },
  { letter: 'T', word: 'Tiger', animal: 'tiger' },
  { letter: 'W', word: 'Whale', animal: 'whale' },
  { letter: 'Z', word: 'Zebra', animal: 'zebra' },
];

function shuffleDifferent<T extends { id: string }>(items: T[]): T[] {
  if (items.length <= 1) return [...items];
  for (let attempt = 0; attempt < 12; attempt++) {
    const copy = [...items].sort(() => Math.random() - 0.5);
    const allSame = copy.every((c, i) => c.id === items[i].id);
    if (!allSame) return copy;
  }
  return [...items.slice(1), items[0]];
}

interface BoardRound {
  leftItems: MatchPairSpec[];
  rightItems: MatchPairSpec[];
}

function buildBoardRound(
  topic: LineMatchTopic,
  difficulty: Difficulty,
  seed: number
): BoardRound {
  const pairCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  let picked: MatchPairSpec[] = [];

  if (topic === 'colors') {
    const pool =
      difficulty === 1
        ? COLOR_PAIRS.slice(0, 4)
        : difficulty === 2
        ? COLOR_PAIRS.slice(0, 6)
        : COLOR_PAIRS;
    picked = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);
  } else if (topic === 'numbers') {
    const maxN = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
    const nums: number[] = [];
    for (let n = 1; n <= maxN; n++) nums.push(n);
    const chosenNums = nums
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount)
      .sort((a, b) => a - b);
    const shuffledAnimals = [...NUM_ANIMALS].sort(() => Math.random() - 0.5);

    picked = chosenNums.map((n, idx) => {
      const st = ROW_STYLES[(idx + seed) % ROW_STYLES.length];
      const an = shuffledAnimals[idx % shuffledAnimals.length];
      const label = n === 1 ? an.singular : an.plural;
      return {
        id: `num-${n}`,
        leftMain: String(n),
        leftSub: NUM_WORDS[n],
        lineColor: st.line,
        textColor: st.text,
        pillBg: st.bg,
        pillBorder: st.border,
        speakLeft: NUM_WORDS[n] || String(n),
        speakMatch: `${NUM_WORDS[n] || n}! ${n} ${label}!`,
        animalSound: an.kind,
        rightKind: 'count-group',
        countNum: n,
        countAnimal: an.kind,
        noteFreq: st.freq,
      };
    });
  } else {
    const chosen = [...LETTER_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);
    picked = chosen.map((entry, idx) => {
      const st = ROW_STYLES[(idx + seed) % ROW_STYLES.length];
      return {
        id: `let-${entry.letter}`,
        leftMain: entry.letter,
        leftSub: entry.letter.toLowerCase(),
        lineColor: st.line,
        textColor: st.text,
        pillBg: st.bg,
        pillBorder: st.border,
        speakLeft: entry.letter,
        speakMatch: `${entry.letter}! ${entry.letter} is for ${entry.word}!`,
        animalSound: entry.animal,
        rightKind: 'letter-art',
        letterChar: entry.letter,
        letterWord: entry.word,
        letterAnimal: entry.animal,
        noteFreq: st.freq,
      };
    });
  }

  return {
    leftItems: picked,
    rightItems: shuffleDifferent(picked),
  };
}

/** Crisp flat-SVG pictures for non-animal color & letter targets (zero gradients/clipPaths) */
const FlatPictureSvg: React.FC<{ kind: string; size: number }> = React.memo(
  ({ kind, size }) => {
    const draw = () => {
      switch (kind) {
        case 'red':
        case 'A':
          return (
            <G>
              <Path
                d="M 50 28 C 34 22 18 36 20 56 C 22 76 38 88 50 84 C 62 88 78 76 80 56 C 82 36 66 22 50 28 Z"
                fill="#E85A50"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 50 28 Q 52 14 58 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 52 22 Q 66 12 72 22 Q 62 30 52 22 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" />
              <Ellipse cx="35" cy="46" rx="5.5" ry="9.5" fill="rgba(255,255,255,0.42)" />
            </G>
          );
        case 'yellow':
          return (
            <G>
              <Path
                d="M 50 8 L 50 18 M 50 82 L 50 92 M 8 50 L 18 50 M 82 50 L 92 50 M 20 20 L 28 28 M 72 72 L 80 80 M 80 20 L 72 28 M 28 72 L 20 80"
                stroke="#FAD44A"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <Circle cx="50" cy="50" r="25" fill="#FAD44A" stroke={INK} strokeWidth="4" />
              <Circle cx="41" cy="46" r="3.4" fill={INK} />
              <Circle cx="59" cy="46" r="3.4" fill={INK} />
              <Path d="M 41 56 Q 50 64 59 56" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
            </G>
          );
        case 'orange':
          return (
            <G>
              <Circle cx="50" cy="54" r="29" fill="#F39237" stroke={INK} strokeWidth="4" />
              <Path d="M 50 25 Q 52 14 58 12" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 50 23 Q 36 11 30 23 Q 40 31 50 23 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" />
              <Ellipse cx="36" cy="44" rx="5" ry="9" fill="rgba(255,255,255,0.42)" />
            </G>
          );
        case 'purple':
          return (
            <G>
              <Path d="M 50 18 Q 52 10 60 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 50 20 Q 34 10 28 22 Q 38 30 50 20 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" />
              <Circle cx="36" cy="38" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
              <Circle cx="64" cy="38" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
              <Circle cx="50" cy="36" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
              <Circle cx="42" cy="56" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
              <Circle cx="58" cy="56" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
              <Circle cx="50" cy="74" r="12" fill="#9B74D4" stroke={INK} strokeWidth="3.4" />
            </G>
          );
        case 'B':
          return (
            <G>
              <Path
                d="M 22 74 C 46 84 78 68 82 34 C 84 22 74 16 68 22 C 64 46 46 62 24 62 C 16 62 14 70 22 74 Z"
                fill="#FAD44A"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 74 18 L 80 12" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
            </G>
          );
        case 'K':
          return (
            <G>
              <Path d="M 50 78 Q 38 88 54 94" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
              <Path d="M 50 12 L 80 42 L 50 78 L 20 42 Z" fill="#4DAAD8" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <Path d="M 50 12 L 80 42 L 50 42 Z" fill="#FAD44A" />
              <Path d="M 50 42 L 20 42 L 50 78 Z" fill="#F082A8" />
              <Path d="M 50 12 L 80 42 L 50 78 L 20 42 Z M 50 12 L 50 78 M 20 42 L 80 42" fill="none" stroke={INK} strokeWidth="3.2" />
            </G>
          );
        default:
          return (
            <G>
              <Path d="M 14 70 A 36 36 0 0 1 86 70" fill="none" stroke="#E85A50" strokeWidth="10" strokeLinecap="round" />
              <Path d="M 23 70 A 27 27 0 0 1 77 70" fill="none" stroke="#FAD44A" strokeWidth="9.5" strokeLinecap="round" />
              <Path d="M 32 70 A 18 18 0 0 1 68 70" fill="none" stroke="#4DAAD8" strokeWidth="9" strokeLinecap="round" />
              <Circle cx="20" cy="74" r="12" fill="#FFFDF7" stroke={INK} strokeWidth="3.4" />
              <Circle cx="80" cy="74" r="12" fill="#FFFDF7" stroke={INK} strokeWidth="3.4" />
            </G>
          );
      }
    };

    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {draw()}
      </Svg>
    );
  }
);

/** Renders the right-hand picture for Color, Number, or Letter matching */
const RightPictureContent: React.FC<{
  item: MatchPairSpec;
  cardH: number;
  isTablet: boolean;
}> = React.memo(({ item, cardH, isTablet }) => {
  if (item.rightKind === 'color-art') {
    const picSz = Math.round(cardH * 0.76);
    if (item.colorArtId === 'blue') {
      return <ZooExhibitAnimalSvg animal="whale" size={picSz} />;
    }
    if (item.colorArtId === 'green') {
      return <ZooExhibitAnimalSvg animal="frog" size={picSz} />;
    }
    if (item.colorArtId === 'pink') {
      return <ZooExhibitAnimalSvg animal="flamingo" size={picSz} />;
    }
    if (item.colorArtId === 'brown') {
      return <ZooExhibitAnimalSvg animal="monkey" size={picSz} />;
    }
    return <FlatPictureSvg kind={item.colorArtId || 'red'} size={picSz} />;
  }

  if (item.rightKind === 'count-group') {
    const n = item.countNum || 1;
    const animal = item.countAnimal || 'duck';
    const iconSz =
      n === 1
        ? Math.round(cardH * 0.72)
        : n <= 3
        ? Math.round(cardH * 0.5)
        : n <= 6
        ? Math.round(cardH * 0.38)
        : Math.round(cardH * 0.32);
    return (
      <View style={styles.countCluster}>
        {Array.from({ length: n }, (_, i) => (
          <ZooExhibitAnimalSvg key={i} animal={animal} size={iconSz} />
        ))}
      </View>
    );
  }

  const picSz = Math.round(cardH * 0.64);
  return (
    <View style={styles.letterPicCol}>
      {item.letterAnimal ? (
        <ZooExhibitAnimalSvg animal={item.letterAnimal} size={picSz} />
      ) : (
        <FlatPictureSvg kind={item.letterChar || 'A'} size={picSz} />
      )}
      <Text
        style={[
          styles.letterPicWord,
          { fontSize: isTablet ? 14 : 11.5 },
        ]}
        numberOfLines={1}
      >
        {item.letterWord}
      </Text>
    </View>
  );
});

interface BoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
  dotX: number;
  dotY: number;
}

interface ActiveLine {
  mode: 'touch' | 'pointer';
  id: number;
  startSide: 'left' | 'right';
  pairId: string;
  color: string;
  dotX: number;
  dotY: number;
  touchStartX: number;
  touchStartY: number;
  points: { x: number; y: number }[];
  maxFingerDist: number;
}

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

const TOPIC_META: {
  id: LineMatchTopic;
  label: string;
  backdrop: ImageSourcePropType;
}[] = [
  { id: 'colors', label: '🎨 Colors', backdrop: STORYBOOK_ASSETS.bgSavanna },
  { id: 'numbers', label: '🔢 Numbers', backdrop: STORYBOOK_ASSETS.bgClearing },
  { id: 'letters', label: '🔤 Letters', backdrop: STORYBOOK_ASSETS.bgSanctuary },
];

interface LineMatchGameProps {
  initialTopic: LineMatchTopic;
}

/**
 * Draw-a-Line Matching Game (Colors, Numbers, and Letters — Free Tier):
 * - Zero-React-render HTML5 <canvas> line overlay for locked 60fps tablet dragging
 * - Full-play-area non-passive touchstart/touchmove + generous 36px hitboxes + palm safety
 * - Auto-snaps the instant the child's finger reaches the matching card (left->right OR right->left)
 * - Fixed tap-to-connect fallback works from anywhere on any card!
 */
export const LineMatchGame: React.FC<LineMatchGameProps> = ({ initialTopic }) => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [topic, setTopic] = useState<LineMatchTopic>(initialTopic);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundSeed, setRoundSeed] = useState(0);
  const [board, setBoard] = useState<BoardRound>(() =>
    buildBoardRound(initialTopic, 2, 0)
  );
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [selectedStart, setSelectedStart] = useState<{
    side: 'left' | 'right';
    id: string;
  } | null>(null);
  const [activeCardHighlight, setActiveCardHighlight] = useState<{
    side: 'left' | 'right';
    id: string;
  } | null>(null);
  const [burstId, setBurstId] = useState<{ id: string; tick: number } | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const [outerSize, setOuterSize] = useState({ w: 820, h: 480 });
  const outerDomRef = useRef<HTMLElement | null>(null);
  const [outerDomNode, setOuterDomNode] = useState<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const leftCardNodes = useRef<Record<string, HTMLElement | null>>({});
  const rightCardNodes = useRef<Record<string, HTMLElement | null>>({});
  const rectsRef = useRef<{
    left: Record<string, BoxRect>;
    right: Record<string, BoxRect>;
  }>({ left: {}, right: {} });

  const activeLineRef = useRef<ActiveLine | null>(null);
  const matchedRef = useRef<string[]>(matchedIds);
  matchedRef.current = matchedIds;
  const selectedRef = useRef(selectedStart);
  selectedRef.current = selectedStart;
  const boardRef = useRef(board);
  boardRef.current = board;
  const wonRef = useRef(won);
  wonRef.current = won;
  const isTabletRef = useRef(isTablet);
  isTabletRef.current = isTablet;
  const lastTouchAtRef = useRef(0);
  const winCleanupRef = useRef<(() => void) | null>(null);

  const handleOuterRef = useCallback((node: React.ComponentRef<typeof View> | null) => {
    if (Platform.OS !== 'web') return;
    const el = resolveDomElement(node);
    outerDomRef.current = el;
    setOuterDomNode((prev) => (prev === el ? prev : el));
  }, []);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  // Fast 2D <canvas> renderer for matched curved ribbons + live dragged crayon line
  // Runs directly in touchmove with ZERO React re-renders!
  const redrawCanvas = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    const outerEl = outerDomRef.current;
    if (!canvas || !outerEl) return;

    const bRect = outerEl.getBoundingClientRect();
    const w = Math.round(bRect.width);
    const h = Math.round(bRect.height);
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const tab = isTabletRef.current;
    const { left, right } = rectsRef.current;

    // 1. Draw all matched permanent curved ribbons
    for (const id of matchedRef.current) {
      const l = left[id];
      const r = right[id];
      const pair = boardRef.current.leftItems.find((p) => p.id === id);
      if (!l || !r || !pair) continue;

      const x1 = l.dotX;
      const y1 = l.dotY;
      const x2 = r.dotX;
      const y2 = r.dotY;
      const ctrl = Math.max(40, Math.abs(x2 - x1) * 0.44);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + ctrl, y1, x2 - ctrl, y2, x2, y2);
      ctx.strokeStyle = '#FFFDF7';
      ctx.lineWidth = tab ? 16 : 13;
      ctx.stroke();

      ctx.strokeStyle = pair.lineColor;
      ctx.lineWidth = tab ? 10 : 8;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw active live crayon trail while child drags
    const line = activeLineRef.current;
    if (line && line.points.length >= 2) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }

      ctx.strokeStyle = 'rgba(255, 253, 247, 0.9)';
      ctx.lineWidth = tab ? 17 : 14;
      ctx.stroke();

      ctx.strokeStyle = line.color;
      ctx.lineWidth = tab ? 11 : 8.5;
      ctx.stroke();

      const tip = line.points[line.points.length - 1];
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tab ? 12 : 10, 0, Math.PI * 2);
      ctx.fillStyle = line.color;
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#FFFDF7';
      ctx.stroke();
      ctx.restore();
    }
  }, []);

  const measureAllCards = useCallback(() => {
    if (Platform.OS !== 'web' || !outerDomRef.current) return;
    const bRect = outerDomRef.current.getBoundingClientRect();
    if (bRect.width <= 0 || bRect.height <= 0) return;

    const nextLeft: Record<string, BoxRect> = {};
    const nextRight: Record<string, BoxRect> = {};

    for (const item of boardRef.current.leftItems) {
      const el = leftCardNodes.current[item.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      nextLeft[item.id] = {
        x: r.left - bRect.left,
        y: r.top - bRect.top,
        w: r.width,
        h: r.height,
        dotX: r.right - bRect.left,
        dotY: r.top - bRect.top + r.height / 2,
      };
    }

    for (const item of boardRef.current.rightItems) {
      const el = rightCardNodes.current[item.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      nextRight[item.id] = {
        x: r.left - bRect.left,
        y: r.top - bRect.top,
        w: r.width,
        h: r.height,
        dotX: r.left - bRect.left,
        dotY: r.top - bRect.top + r.height / 2,
      };
    }

    rectsRef.current = { left: nextLeft, right: nextRight };
    redrawCanvas();
  }, [redrawCanvas]);

  // Sync if user opens a different card from Home screen
  useEffect(() => {
    cleanupWinListeners();
    activeLineRef.current = null;
    setActiveCardHighlight(null);
    setTopic(initialTopic);
    setMatchedIds([]);
    setSelectedStart(null);
    setFeedbackText(null);
    setWon(false);
    setRoundSeed(0);
    setBoard(buildBoardRound(initialTopic, difficulty, 0));
  }, [cleanupWinListeners, initialTopic]);

  useEffect(() => {
    const t1 = setTimeout(measureAllCards, 40);
    const t2 = setTimeout(measureAllCards, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [board, outerSize.w, outerSize.h, matchedIds, measureAllCards, topic, difficulty]);

  const startNewBoard = useCallback(
    (nextTopic: LineMatchTopic, nextDiff: Difficulty, nextSeed: number) => {
      cleanupWinListeners();
      activeLineRef.current = null;
      setActiveCardHighlight(null);
      setTopic(nextTopic);
      setDifficulty(nextDiff);
      setRoundSeed(nextSeed);
      setMatchedIds([]);
      setSelectedStart(null);
      setBurstId(null);
      setFeedbackText(null);
      setWon(false);
      setBoard(buildBoardRound(nextTopic, nextDiff, nextSeed));
      requestAnimationFrame(() => measureAllCards());
    },
    [cleanupWinListeners, measureAllCards]
  );

  const completePair = useCallback(
    (pair: MatchPairSpec) => {
      if (matchedRef.current.includes(pair.id)) return;
      soundEngine.unlock();
      soundEngine.playMatch();
      if (pair.animalSound) {
        setTimeout(() => soundEngine.playAnimalSound(pair.animalSound!), 180);
        collectSticker(pair.animalSound);
      }
      soundEngine.speakWord(pair.speakMatch);

      const nextMatched = [...matchedRef.current, pair.id];
      matchedRef.current = nextMatched;
      setMatchedIds(nextMatched);
      setSelectedStart(null);
      setActiveCardHighlight(null);
      setBurstId({ id: pair.id, tick: Date.now() });
      setFeedbackText(`⭐ ${pair.speakMatch} ⭐`);
      redrawCanvas();

      if (nextMatched.length >= boardRef.current.leftItems.length) {
        setTimeout(() => {
          soundEngine.playWin();
          addStar(1);
          setWon(true);
        }, 680);
      }
    },
    [addStar, collectSticker, redrawCanvas]
  );

  /** Generous toddler-friendly nearest-card hit test */
  const findCardAtLocalPoint = useCallback(
    (
      lx: number,
      ly: number,
      sideFilter?: 'left' | 'right',
      pad = 34
    ): { side: 'left' | 'right'; id: string; rect: BoxRect } | null => {
      let best: { side: 'left' | 'right'; id: string; rect: BoxRect; dist: number } | null =
        null;

      const scan = (side: 'left' | 'right') => {
        const map = rectsRef.current[side];
        for (const [id, r] of Object.entries(map)) {
          if (
            lx >= r.x - pad &&
            lx <= r.x + r.w + pad &&
            ly >= r.y - pad &&
            ly <= r.y + r.h + pad
          ) {
            const cx = r.x + r.w / 2;
            const cy = r.y + r.h / 2;
            const dist = Math.hypot(lx - cx, ly - cy);
            if (!best || dist < best.dist) {
              best = { side, id, rect: r, dist };
            }
          }
        }
      };

      if (sideFilter) {
        scan(sideFilter);
      } else {
        scan('left');
        scan('right');
      }
      return best;
    },
    []
  );

  const getLocalOuterPt = useCallback((clientX: number, clientY: number) => {
    const rect = outerDomRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    };
  }, []);

  const startDrawFrom = useCallback(
    (mode: 'touch' | 'pointer', id: number, clientX: number, clientY: number): boolean => {
      if (wonRef.current) return false;
      measureAllCards();
      const pt = getLocalOuterPt(clientX, clientY);
      const hitPad = isTabletRef.current ? 36 : 26;
      const hit = findCardAtLocalPoint(pt.x, pt.y, undefined, hitPad);
      if (!hit) return false;

      const pair = boardRef.current.leftItems.find((p) => p.id === hit.id);
      if (!pair) return false;

      // Already matched: playful replay!
      if (matchedRef.current.includes(hit.id)) {
        soundEngine.unlock();
        soundEngine.playNote(pair.noteFreq);
        soundEngine.speakWord(pair.speakMatch);
        return false;
      }

      soundEngine.unlock();
      soundEngine.playNote(pair.noteFreq);

      // Tap-to-connect: if the toddler already tapped the opposite side, check immediately!
      const prevSel = selectedRef.current;
      if (prevSel && prevSel.side !== hit.side) {
        if (prevSel.id === hit.id) {
          completePair(pair);
          return false;
        }
        // Tapped a non-matching card on the opposite side -> warm gentle feedback & keep first selected!
        const selPair = boardRef.current.leftItems.find((p) => p.id === prevSel.id);
        soundEngine.playGentleBounce();
        if (selPair) {
          setFeedbackText(`Try again! Match ${selPair.leftMain}!`);
          soundEngine.speakWord(`Try again! Match ${selPair.speakLeft}!`);
        }
        return false;
      }

      if (hit.side === 'left') {
        soundEngine.speakWord(pair.speakLeft);
      } else if (pair.rightKind === 'letter-art' && pair.letterWord) {
        soundEngine.speakWord(pair.letterWord);
      }

      const line: ActiveLine = {
        mode,
        id,
        startSide: hit.side,
        pairId: hit.id,
        color: pair.lineColor,
        dotX: hit.rect.dotX,
        dotY: hit.rect.dotY,
        touchStartX: pt.x,
        touchStartY: pt.y,
        points: [{ x: hit.rect.dotX, y: hit.rect.dotY }],
        maxFingerDist: 0,
      };
      activeLineRef.current = line;
      setActiveCardHighlight({ side: hit.side, id: hit.id });
      redrawCanvas();
      return true;
    },
    [completePair, findCardAtLocalPoint, getLocalOuterPt, measureAllCards, redrawCanvas]
  );

  const moveDrawTo = useCallback(
    (clientX: number, clientY: number) => {
      const line = activeLineRef.current;
      if (!line) return;
      const pt = getLocalOuterPt(clientX, clientY);
      const last = line.points[line.points.length - 1];
      const step = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (step < 4) return;

      // Track finger travel from ACTUAL touch landing point (fixes tap-to-connect!)
      const fingerTravel = Math.hypot(
        pt.x - line.touchStartX,
        pt.y - line.touchStartY
      );
      if (fingerTravel > line.maxFingerDist) {
        line.maxFingerDist = fingerTravel;
      }

      // Only append points once finger moves a tiny bit so pure taps stay super crisp
      if (line.maxFingerDist >= 10) {
        line.points.push(pt);
      }

      // Instant auto-snap! As soon as finger glides into the matching card on the opposite side, connect!
      const targetSide = line.startSide === 'left' ? 'right' : 'left';
      const snapPad = isTabletRef.current ? 30 : 22;
      const targetHit = findCardAtLocalPoint(pt.x, pt.y, targetSide, snapPad);
      if (targetHit && targetHit.id === line.pairId) {
        const pair = boardRef.current.leftItems.find((p) => p.id === line.pairId);
        activeLineRef.current = null;
        cleanupWinListeners();
        if (pair) {
          completePair(pair);
        } else {
          redrawCanvas();
        }
        return;
      }

      // ZERO React setState here -> 60fps butter-smooth canvas paint!
      redrawCanvas();
    },
    [cleanupWinListeners, completePair, findCardAtLocalPoint, getLocalOuterPt, redrawCanvas]
  );

  const endDrawAt = useCallback(
    (clientX?: number, clientY?: number) => {
      const line = activeLineRef.current;
      activeLineRef.current = null;
      setActiveCardHighlight(null);
      cleanupWinListeners();
      redrawCanvas();
      if (!line) return;

      const pt =
        clientX !== undefined && clientY !== undefined
          ? getLocalOuterPt(clientX, clientY)
          : line.points[line.points.length - 1];

      const targetSide = line.startSide === 'left' ? 'right' : 'left';
      const dropPad = isTabletRef.current ? 38 : 28;
      const targetHit = findCardAtLocalPoint(pt.x, pt.y, targetSide, dropPad);

      if (targetHit) {
        if (targetHit.id === line.pairId) {
          const pair = boardRef.current.leftItems.find((p) => p.id === line.pairId);
          if (pair) completePair(pair);
          return;
        }
        const startPair = boardRef.current.leftItems.find((p) => p.id === line.pairId);
        soundEngine.playGentleBounce();
        if (startPair) {
          setFeedbackText(`Try again! Match ${startPair.leftMain}!`);
          soundEngine.speakWord(`Try again! Match ${startPair.speakLeft}!`);
        }
        return;
      }

      // Forgiving tap (<32px finger travel) -> select this card for effortless tap-to-connect!
      if (line.maxFingerDist < 32) {
        setSelectedStart((prev) =>
          prev && prev.side === line.startSide && prev.id === line.pairId
            ? null
            : { side: line.startSide, id: line.pairId }
        );
      }
    },
    [cleanupWinListeners, completePair, findCardAtLocalPoint, getLocalOuterPt, redrawCanvas]
  );

  const handlersRef = useRef({ startDrawFrom, moveDrawTo, endDrawAt });
  handlersRef.current = { startDrawFrom, moveDrawTo, endDrawAt };

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
          handlersRef.current.moveDrawTo(t.clientX, t.clientY);
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          lastTouchAtRef.current = Date.now();
          markWebTouchHandled();
          handlersRef.current.endDrawAt(t.clientX, t.clientY);
        };
        const onCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t && activeLineRef.current?.id === id) {
            lastTouchAtRef.current = Date.now();
            handlersRef.current.endDrawAt();
          } else if (t) {
            lastTouchAtRef.current = Date.now();
            handlersRef.current.endDrawAt(t.clientX, t.clientY);
          }
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
          handlersRef.current.moveDrawTo(ev.clientX, ev.clientY);
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          handlersRef.current.endDrawAt(ev.clientX, ev.clientY);
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
    [cleanupWinListeners]
  );

  // Direct non-passive DOM touchstart + pointerdown covering the FULL boardOuter play area!
  useEffect(() => {
    if (Platform.OS !== 'web' || !outerDomNode) return;

    const onTouchStart = (ev: TouchEvent) => {
      // Multi-touch palm safety: if we are already actively dragging a line with a finger
      // that is still on screen, ignore stray second fingers touching elsewhere!
      const curr = activeLineRef.current;
      if (curr && curr.mode === 'touch') {
        let oldStillDown = false;
        for (let i = 0; i < ev.touches.length; i++) {
          if (ev.touches[i].identifier === curr.id) {
            oldStillDown = true;
            break;
          }
        }
        if (oldStillDown && curr.maxFingerDist >= 12) {
          return;
        }
        // Otherwise recover from any stale touch cleanly
        activeLineRef.current = null;
        cleanupWinListeners();
      }

      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      lastTouchAtRef.current = Date.now();
      markWebTouchHandled();
      if (handlersRef.current.startDrawFrom('touch', t.identifier, t.clientX, t.clientY)) {
        attachWinListeners('touch', t.identifier);
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - lastTouchAtRef.current < 700) return;
      ev.preventDefault();
      if (handlersRef.current.startDrawFrom('pointer', ev.pointerId, ev.clientX, ev.clientY)) {
        attachWinListeners('pointer', ev.pointerId);
      }
    };

    outerDomNode.addEventListener('touchstart', onTouchStart, { passive: false });
    outerDomNode.addEventListener('pointerdown', onPointerDown);
    return () => {
      outerDomNode.removeEventListener('touchstart', onTouchStart);
      outerDomNode.removeEventListener('pointerdown', onPointerDown);
    };
  }, [attachWinListeners, cleanupWinListeners, outerDomNode]);

  const activeTopicMeta =
    TOPIC_META.find((t) => t.id === topic) || TOPIC_META[0];
  const pairCount = board.leftItems.length;

  const cardH = useMemo(() => {
    const availH = Math.max(300, height - (isTablet ? 215 : 225));
    const maxPerRow = Math.floor((availH - (pairCount - 1) * 14) / pairCount);
    return Math.min(isTablet ? 132 : 106, Math.max(72, maxPerRow));
  }, [height, isTablet, pairCount]);

  const cardW = useMemo(() => {
    if (isTabletLandscape) return Math.min(240, Math.round(width * 0.25));
    if (isTablet) return Math.min(220, Math.round(width * 0.3));
    return Math.min(138, Math.round(width * 0.36));
  }, [isTablet, isTabletLandscape, width]);

  const boardMaxW = isTabletLandscape ? 820 : isTablet ? 680 : 374;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={activeTopicMeta.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.veil} />
      </View>

      <GameHeader
        totalSteps={pairCount}
        completedSteps={matchedIds.length}
        difficulty={difficulty}
        onDifficultyChange={(d) => startNewBoard(topic, d, roundSeed + 1)}
      />

      {/* Quick Topic Switcher (Colors | Numbers | Letters) */}
      <View style={styles.topicBarWrap}>
        <View style={styles.topicBar}>
          {TOPIC_META.map((tm) => {
            const active = tm.id === topic;
            return (
              <TactileButton
                key={tm.id}
                onPress={() => {
                  soundEngine.playPop();
                  startNewBoard(tm.id, difficulty, 0);
                }}
                accessibilityLabel={`Switch to ${tm.label} line matching`}
              >
                <View style={[styles.topicPill, active && styles.topicPillActive]}>
                  <Text
                    style={[
                      styles.topicPillText,
                      active && styles.topicPillTextActive,
                    ]}
                  >
                    {tm.label}
                  </Text>
                </View>
              </TactileButton>
            );
          })}
        </View>
      </View>

      {/* Brief encouraging instruction / celebration pill */}
      <View style={styles.captionWrap}>
        <View style={styles.captionPill}>
          <Text style={styles.captionText}>
            {feedbackText ||
              (topic === 'colors'
                ? '🖍️ Draw a line or tap to match each color!'
                : topic === 'numbers'
                ? '🖍️ Draw a line or tap to match each number!'
                : '🖍️ Draw a line or tap to match each letter!')}
          </Text>
        </View>
      </View>

      {/* Full-Area Interactive Draw-a-Line Board + Zero-Re-Render 2D <canvas> Overlay */}
      <View
        ref={handleOuterRef}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w > 100 && h > 100) {
            setOuterSize({ w, h });
          }
        }}
        style={[
          styles.boardOuter,
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
            : null,
        ]}
      >
        <View style={[styles.boardStage, { maxWidth: boardMaxW }]}>
          {/* Left Column: Color Words / Numbers / Letters */}
          <View style={[styles.col, { gap: isTablet ? 16 : 12 }]}>
            {board.leftItems.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected =
                (selectedStart?.side === 'left' && selectedStart.id === item.id) ||
                (activeCardHighlight?.side === 'left' &&
                  activeCardHighlight.id === item.id);

              return (
                <View
                  key={item.id}
                  ref={(node) => {
                    leftCardNodes.current[item.id] = resolveDomElement(node);
                  }}
                  style={[
                    styles.matchCard,
                    {
                      width: cardW,
                      height: cardH,
                      backgroundColor: isMatched ? '#FFF9DC' : item.pillBg,
                      borderColor:
                        isMatched || isSelected ? item.lineColor : item.pillBorder,
                      borderWidth: isSelected ? 5 : 3.8,
                      transform: [{ scale: isSelected ? 1.04 : 1 }],
                    },
                  ]}
                >
                  <View pointerEvents="none" style={styles.leftTextWrap}>
                    {topic === 'colors' ? (
                      <Text
                        style={[
                          styles.colorWordText,
                          {
                            fontSize:
                              cardW >= 200
                                ? item.leftMain.length >= 6
                                  ? 30
                                  : 34
                                : item.leftMain.length >= 6
                                ? 21
                                : 25,
                            color: item.textColor,
                          },
                        ]}
                      >
                        {item.leftMain}
                      </Text>
                    ) : (
                      <View style={styles.symbolStack}>
                        <Text
                          style={[
                            styles.bigSymbolText,
                            {
                              fontSize: cardH >= 110 ? 54 : 42,
                              color: item.textColor,
                            },
                          ]}
                        >
                          {item.leftMain}
                        </Text>
                        {item.leftSub && (
                          <Text
                            style={[
                              styles.subSymbolText,
                              {
                                fontSize: cardH >= 110 ? 20 : 15,
                                color: item.textColor,
                              },
                            ]}
                          >
                            {item.leftSub}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  <View
                    pointerEvents="none"
                    style={[
                      styles.connectorDot,
                      styles.connectorDotRight,
                      {
                        backgroundColor: item.lineColor,
                        borderColor: isSelected ? COLORS.sunYellow : '#FFFDF7',
                        transform: [{ scale: isSelected ? 1.25 : 1 }],
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Right Column: Shuffled Storybook Pictures */}
          <View style={[styles.col, { gap: isTablet ? 16 : 12 }]}>
            {board.rightItems.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected =
                (selectedStart?.side === 'right' && selectedStart.id === item.id) ||
                (activeCardHighlight?.side === 'right' &&
                  activeCardHighlight.id === item.id);

              return (
                <View
                  key={item.id}
                  ref={(node) => {
                    rightCardNodes.current[item.id] = resolveDomElement(node);
                  }}
                  style={[
                    styles.matchCard,
                    {
                      width: cardW,
                      height: cardH,
                      backgroundColor: isMatched ? '#FFF9DC' : '#FFFDF7',
                      borderColor:
                        isMatched || isSelected
                          ? item.lineColor
                          : 'rgba(138, 92, 50, 0.45)',
                      borderWidth: isSelected || isMatched ? 4.5 : 3.5,
                      transform: [{ scale: isSelected ? 1.04 : 1 }],
                    },
                  ]}
                >
                  <View
                    pointerEvents="none"
                    style={[
                      styles.connectorDot,
                      styles.connectorDotLeft,
                      {
                        backgroundColor: isMatched ? item.lineColor : '#E8C07D',
                        borderColor: isSelected ? COLORS.sunYellow : '#FFFDF7',
                        transform: [{ scale: isSelected ? 1.25 : 1 }],
                      },
                    ]}
                  />

                  <View pointerEvents="none" style={styles.rightPicWrap}>
                    <RightPictureContent
                      item={item}
                      cardH={cardH}
                      isTablet={isTablet}
                    />
                  </View>

                  {burstId && burstId.id === item.id && (
                    <View style={styles.burstOverlay} pointerEvents="none">
                      <SnapBurst key={burstId.tick} size={Math.round(cardH * 1.15)} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Zero-React-render 2D <canvas> overlay for instant 60fps crayon lines & matched ribbons */}
        {Platform.OS === 'web' && (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 12,
            }}
          />
        )}
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startNewBoard(topic, difficulty, roundSeed + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 250, 236, 0.22)',
  },
  topicBarWrap: {
    alignItems: 'center',
    paddingTop: 2,
    zIndex: 10,
  },
  topicBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 249, 236, 0.9)',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: 'rgba(138, 92, 50, 0.36)',
    padding: 4,
    gap: 5,
  },
  topicPill: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 999,
  },
  topicPillActive: {
    backgroundColor: COLORS.sunYellow,
    borderWidth: 2,
    borderColor: COLORS.woodDark,
  },
  topicPillText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  topicPillTextActive: {
    color: COLORS.woodDark,
  },
  captionWrap: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  captionPill: {
    backgroundColor: 'rgba(255, 252, 238, 0.94)',
    borderRadius: 999,
    borderWidth: 2.2,
    borderColor: 'rgba(138, 92, 50, 0.34)',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  captionText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.woodDark,
    textAlign: 'center',
  },
  boardOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingBottom: 16,
    position: 'relative',
  },
  boardStage: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    position: 'relative',
  },
  col: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  matchCard: {
    borderRadius: 26,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  leftTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  colorWordText: {
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  symbolStack: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
  },
  bigSymbolText: {
    fontWeight: '900',
  },
  subSymbolText: {
    fontWeight: '800',
    opacity: 0.85,
  },
  rightPicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 10,
  },
  countCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    maxWidth: '90%',
  },
  letterPicCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterPicWord: {
    fontWeight: '800',
    color: COLORS.inkMuted,
    marginTop: 1,
  },
  connectorDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3.5,
    top: '50%',
    marginTop: -12,
    zIndex: 8,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  connectorDotRight: {
    right: -13,
  },
  connectorDotLeft: {
    left: -13,
  },
  burstOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
