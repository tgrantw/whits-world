import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
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

interface FloatingPop {
  id: number;
  x: number;
  y: number;
  kind: 'fish' | 'gold' | 'snow';
}

const INK = '#4A3525';

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

/** Hand-painted watercolor & gouache smiling arctic fish */
const ArcticFishSvg: React.FC<{
  kind: 'fishBlue' | 'fishCoral' | 'fishGold';
  size: number;
}> = ({ kind, size }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const palette =
    kind === 'fishBlue'
      ? {
          top: '#84D4EC',
          mid: '#56B0D2',
          belly: '#ECF9FF',
          fin: '#EE8B6B',
          glow: 'rgba(132, 212, 236, 0.3)',
        }
      : kind === 'fishCoral'
      ? {
          top: '#F5A17E',
          mid: '#E07554',
          belly: '#FFF5E0',
          fin: '#F8D459',
          glow: 'rgba(245, 161, 126, 0.3)',
        }
      : {
          top: '#FFE985',
          mid: '#F2BC3C',
          belly: '#FFFBE4',
          fin: '#F48C56',
          glow: 'rgba(255, 226, 98, 0.56)',
        };

  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <LinearGradient id={`fishBody-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.top} />
          <Stop offset="0.62" stopColor={palette.mid} />
          <Stop offset="1" stopColor={palette.belly} />
        </LinearGradient>
      </Defs>

      {/* Soft sunlit halo behind the fish (extra warm for golden fish) */}
      <Circle cx="44" cy="44" r={kind === 'fishGold' ? 39 : 34} fill={palette.glow} />

      {/* Cute tail fin */}
      <Path
        d="M 22 44 L 8 30 Q 12 44 8 58 Z"
        fill={palette.fin}
        stroke={INK}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Dorsal fin */}
      <Path
        d="M 38 26 Q 48 14 58 26 Z"
        fill={palette.fin}
        stroke={INK}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* Plump storybook fish body */}
      <Path
        d="M 20 44 C 24 25 56 21 74 41 C 77 44 77 46 74 49 C 56 67 24 63 20 44 Z"
        fill={`url(#fishBody-${uid})`}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Soft painted belly highlight */}
      <Ellipse cx="48" cy="36" rx="14" ry="4.8" fill="#FFFFFF" opacity="0.34" />

      {/* Delicate scale arcs */}
      <Path
        d="M 38 40 Q 42 44 38 48 M 46 39 Q 50 44 46 49"
        stroke="rgba(255, 255, 255, 0.52)"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Side pectoral fin */}
      <Path
        d="M 44 49 Q 36 58 46 61 Q 53 55 44 49 Z"
        fill={palette.fin}
        stroke={INK}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Happy eye + rosy cheek + tiny smile */}
      <Circle cx="61" cy="41" r="4.2" fill={INK} />
      <Circle cx="62.4" cy="39.5" r="1.5" fill="#FFFFFF" />
      <Ellipse cx="57" cy="47.5" rx="3.4" ry="2" fill="#F4939E" opacity="0.72" />
      <Path
        d="M 65 48 Q 68.5 50 71 47.5"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Golden star sparkles for bonus golden fish */}
      {kind === 'fishGold' && (
        <G>
          <Path
            d="M 18 17 L 20 22 L 25 24 L 20 26 L 18 31 L 16 26 L 11 24 L 16 22 Z"
            fill="#FFFDF0"
            stroke="#C98A1A"
            strokeWidth="1.2"
          />
          <Circle cx="72" cy="22" r="3" fill="#FFFDF0" opacity="0.92" />
        </G>
      )}
    </Svg>
  );
};

/** Playful frosty snowball for Hard mode (never punishes, just makes buddy wiggle & giggle!) */
const PlayfulSnowballSvg: React.FC<{ size: number }> = ({ size }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Defs>
        <RadialGradient id={`snow-${uid}`} cx="36%" cy="32%" r="68%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.65" stopColor="#E4F4FC" />
          <Stop offset="1" stopColor="#B6DCEB" />
        </RadialGradient>
      </Defs>
      <Circle cx="40" cy="40" r="34" fill="rgba(182, 224, 245, 0.34)" />
      <Circle
        cx="40"
        cy="40"
        r="24"
        fill={`url(#snow-${uid})`}
        stroke="#5A7A8C"
        strokeWidth="2.8"
      />
      {/* Cute mischievous frosty face */}
      <Circle cx="32.5" cy="38" r="2.7" fill="#3B5566" />
      <Circle cx="47.5" cy="38" r="2.7" fill="#3B5566" />
      <Path
        d="M 35 45 Q 40 49 45 45"
        stroke="#3B5566"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx="28" cy="43" rx="3" ry="1.8" fill="#F29DB0" opacity="0.7" />
      <Ellipse cx="52" cy="43" rx="3" ry="1.8" fill="#F29DB0" opacity="0.7" />
      {/* Frosty highlight */}
      <Ellipse cx="32" cy="27" rx="7" ry="3.5" fill="#FFFFFF" opacity="0.85" transform="rotate(-22 32 27)" />
    </Svg>
  );
};

/** Sculpted watercolor ice floe sled with gentle aqua water ripples */
const IceFloeSledSvg: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <Svg width={width} height={height} viewBox="0 0 210 76">
      <Defs>
        <LinearGradient id={`iceTop-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5F6FC" />
        </LinearGradient>
        <LinearGradient id={`iceSide-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A9DBEC" />
          <Stop offset="1" stopColor="#77B9D1" />
        </LinearGradient>
      </Defs>

      {/* Shimmering aqua water reflection & side wake ripples */}
      <Ellipse cx="105" cy="60" rx="96" ry="13" fill="rgba(42, 114, 148, 0.24)" />
      <Path
        d="M 12 58 Q 34 65 56 60 M 154 60 Q 176 65 198 58"
        stroke="rgba(255, 255, 255, 0.62)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Chunky glacier-blue ice floe side wall */}
      <Path
        d="M 18 32 L 26 52 Q 105 66 184 52 L 192 32 Z"
        fill={`url(#iceSide-${uid})`}
        stroke={INK}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Crisp snow-white faceted ice floe deck */}
      <Path
        d="M 16 32 Q 36 16 105 16 Q 174 16 194 32 Q 172 48 105 49 Q 38 48 16 32 Z"
        fill={`url(#iceTop-${uid})`}
        stroke={INK}
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Subtle crystalline facet highlight lines */}
      <Path
        d="M 46 28 Q 76 22 108 24 M 134 25 Q 158 26 172 31"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.9"
        fill="none"
      />
      <Path
        d="M 60 47 L 58 55 M 148 47 L 150 55"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

/** Woven wooden arctic fish basket that visually fills with colorful fish tails! */
const FishBasketSvg: React.FC<{
  width: number;
  height: number;
  caughtCount: number;
}> = ({ width, height, caughtCount }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const visibleFishes = Math.min(caughtCount, 5);
  const tailSpecs = [
    { x: 30, y: 20, rot: -22, fill: '#6CC4DF', fin: '#EE8B6B' },
    { x: 54, y: 17, rot: 4, fill: '#E88360', fin: '#F8D459' },
    { x: 78, y: 20, rot: 22, fill: '#F7CE54', fin: '#EE8B6B' },
    { x: 42, y: 15, rot: -10, fill: '#5CB2D4', fin: '#F8D459' },
    { x: 66, y: 15, rot: 12, fill: '#EC8766', fin: '#7ACAE3' },
  ];

  return (
    <Svg width={width} height={height} viewBox="0 0 108 66">
      <Defs>
        <LinearGradient id={`bask-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E6B676" />
          <Stop offset="0.6" stopColor="#CE9252" />
          <Stop offset="1" stopColor="#B07237" />
        </LinearGradient>
      </Defs>

      {/* Dark basket interior cavity */}
      <Ellipse cx="54" cy="24" rx="41" ry="10" fill="#6E4624" stroke={INK} strokeWidth="2.6" />

      {/* Caught colorful fish peeking happily out of the basket */}
      {tailSpecs.slice(0, visibleFishes).map((f, idx) => (
        <G key={idx} transform={`translate(${f.x}, ${f.y}) rotate(${f.rot})`}>
          <Path
            d="M -9 7 C -9 -6 9 -6 9 7 Z"
            fill={f.fill}
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Path
            d="M 0 -5 L -7 -13 L 7 -13 Z"
            fill={f.fin}
            stroke={INK}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </G>
      ))}

      {/* Woven wooden basket body */}
      <Path
        d="M 14 25 L 24 56 Q 54 64 84 56 L 94 25 Q 54 34 14 25 Z"
        fill={`url(#bask-${uid})`}
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Woven wood slats & crosshatch details */}
      <Path
        d="M 19 37 Q 54 45 89 37 M 22 48 Q 54 55 86 48 M 36 30 L 40 58 M 54 31 L 54 60 M 72 30 L 68 58"
        stroke="rgba(90, 54, 24, 0.36)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Cozy curved wooden rim */}
      <Path
        d="M 11 24 Q 54 35 97 24"
        fill="none"
        stroke={INK}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <Path
        d="M 11 24 Q 54 35 97 24"
        fill="none"
        stroke="#F4D39B"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

/** Floating "+1" golden star pop or silly snow puff on catch */
const CatchPopEffect: React.FC<{ pop: FloatingPop }> = ({ pop }) => {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(prog, {
      toValue: 1,
      duration: 720,
      useNativeDriver: true,
    }).start();
  }, [prog]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: pop.x - 26,
        top: pop.y - 36,
        opacity: prog.interpolate({
          inputRange: [0, 0.2, 0.78, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateY: prog.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -56],
            }),
          },
          {
            scale: prog.interpolate({
              inputRange: [0, 0.25, 1],
              outputRange: [0.55, 1.18, 0.96],
            }),
          },
        ],
        zIndex: 55,
      }}
    >
      {pop.kind === 'snow' ? (
        <View style={styles.snowGigglePill}>
          <Text style={styles.snowGiggleText}>Brrr!</Text>
        </View>
      ) : (
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Path
            d="M26 5 L31.2 17.5 L44.5 19.2 L34.6 28.4 L37.1 41.8 L26 35.4 L14.9 41.8 L17.4 28.4 L7.5 19.2 L20.8 17.5 Z"
            fill={pop.kind === 'gold' ? '#FFE169' : '#FFF4B2'}
            stroke="#8C5B20"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </Animated.View>
  );
};

/**
 * Arctic Catch (Paid Tier — Snowy Arctic Bay):
 * - Full-bleed pastel watercolor Arctic Bay (`bg-arctic.png`) with shimmering waves & falling snow.
 * - Choose Penguin, Polar Bear, Seal, or Puffin riding a sculpted ice floe with a wooden fish basket!
 * - Slide anywhere OR tap anywhere to glide across the icy bay and catch smiling fish & golden stars!
 * - Zero frustration, tactile splash chimes, growing basket of fish tails, and Easy | Med | Hard scaling.
 */
export const ArcticCatchGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, width, height } = useResponsive();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [buddyIdx, setBuddyIdx] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [won, setWon] = useState(false);
  const [catchingAnim, setCatchingAnim] = useState(false);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number; tick: number } | null>(null);
  const [pops, setPops] = useState<FloatingPop[]>([]);

  const [fieldSize, setFieldSize] = useState({
    w: Math.max(320, width),
    h: Math.max(420, height - 96),
  });

  const cfg = getDifficultyConfig(difficulty);
  const activeBuddy = ARCTIC_BUDDIES[buddyIdx % ARCTIC_BUDDIES.length];

  const catchBounce = useRef(new Animated.Value(1)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;

  // Live 60fps simulation refs
  const simRef = useRef({
    catcherX: Math.max(320, width) * 0.5,
    targetX: Math.max(320, width) * 0.5,
    catcherVx: 0,
    items: [] as FallingItem[],
    nextItemId: 1,
    spawnTimer: 0.35,
    lastSpawnXFrac: 0.5,
    flakes: Array.from({ length: 12 }, (_, i): SnowFlake => ({
      xPct: ((i * 37 + 11) % 94) + 3,
      yPct: (i * 19) % 100,
      r: 2.2 + (i % 3) * 1.1,
      speedPct: 4.5 + (i % 4) * 1.4,
      phase: i * 0.9,
    })),
    elapsed: 0,
  });

  const [frame, setFrame] = useState<{
    catcherX: number;
    tiltDeg: number;
    items: FallingItem[];
    flakes: SnowFlake[];
  }>(() => ({
    catcherX: Math.max(320, width) * 0.5,
    tiltDeg: 0,
    items: [],
    flakes: simRef.current.flakes,
  }));

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

  const triggerCatchBounce = useCallback(() => {
    setCatchingAnim(true);
    catchBounce.setValue(0.86);
    Animated.spring(catchBounce, {
      toValue: 1,
      friction: 3.4,
      tension: 210,
      useNativeDriver: true,
    }).start();
    setTimeout(() => setCatchingAnim(false), 380);
  }, [catchBounce]);

  const triggerSnowWiggle = useCallback(() => {
    wiggleAnim.setValue(0);
    Animated.sequence([
      Animated.timing(wiggleAnim, { toValue: -1, duration: 75, useNativeDriver: true }),
      Animated.timing(wiggleAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(wiggleAnim, { toValue: -0.7, duration: 85, useNativeDriver: true }),
      Animated.timing(wiggleAnim, { toValue: 0, duration: 85, useNativeDriver: true }),
    ]).start();
  }, [wiggleAnim]);

  const pushPop = useCallback((x: number, y: number, kind: 'fish' | 'gold' | 'snow') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setPops((prev) => [...prev.slice(-4), { id, x, y, kind }]);
    setTimeout(() => {
      setPops((prev) => prev.filter((p) => p.id !== id));
    }, 760);
  }, []);

  const resetRound = useCallback(
    (nextDiff: Difficulty, nextBuddyIdx: number) => {
      const f = fieldRef.current;
      setDifficulty(nextDiff);
      setBuddyIdx(nextBuddyIdx % ARCTIC_BUDDIES.length);
      setCaughtCount(0);
      caughtRef.current = 0;
      setWon(false);
      wonRef.current = false;
      setBurstPos(null);
      setPops([]);

      simRef.current.catcherX = f.w * 0.5;
      simRef.current.targetX = f.w * 0.5;
      simRef.current.catcherVx = 0;
      simRef.current.items = [];
      simRef.current.spawnTimer = 0.35;
    },
    []
  );

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

  // 60fps smooth gliding, falling fish, snowflake drift & toddler-friendly catch detection
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;

      const s = simRef.current;
      const f = fieldRef.current;
      const curCfg = getDifficultyConfig(diffRef.current);
      s.elapsed += dt;

      // Ambient gentle snow drift
      const nextFlakes = s.flakes.map((fl) => {
        let ny = fl.yPct + fl.speedPct * dt;
        if (ny > 104) ny = -4;
        return { ...fl, yPct: ny };
      });
      s.flakes = nextFlakes;

      const edgePad = isTablet ? 86 : 64;
      const clampedTarget = Math.max(edgePad, Math.min(f.w - edgePad, s.targetX));
      const dx = clampedTarget - s.catcherX;
      // Snappy finger tracking while sliding, smooth glide on tap
      const glideRate = activeSlideRef.current ? 22 : 14;
      const glideFactor = Math.min(1, dt * glideRate);
      const prevX = s.catcherX;
      s.catcherX += dx * glideFactor;
      s.catcherVx = (s.catcherX - prevX) / dt;
      const tiltDeg = Math.max(-8, Math.min(8, s.catcherVx * 0.011));

      if (!wonRef.current) {
        // Spawn new falling arctic treats
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.items.length < curCfg.maxConcurrent) {
          s.spawnTimer = curCfg.spawnInterval * (0.85 + Math.random() * 0.32);

          // Pick a well-spaced x fraction so treats spread pleasantly across the bay
          let xFrac = 0.14 + Math.random() * 0.72;
          if (Math.abs(xFrac - s.lastSpawnXFrac) < 0.2) {
            xFrac = s.lastSpawnXFrac > 0.5 ? 0.18 + Math.random() * 0.24 : 0.58 + Math.random() * 0.24;
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
            kind === 'snowball'
              ? isTablet
                ? 60
                : 48
              : isTablet
              ? 82
              : 64;

          const baseX = xFrac * f.w;
          s.items.push({
            id: s.nextItemId++,
            kind,
            x: baseX,
            baseX,
            y: -itemSize * 0.4,
            vy:
              curCfg.minVy +
              Math.random() * (curCfg.maxVy - curCfg.minVy),
            swayAmp: curCfg.swayAmp * (0.65 + Math.random() * 0.5),
            swaySpeed: 1.5 + Math.random() * 1.1,
            phase: Math.random() * Math.PI * 2,
            rot: 0,
            size: itemSize,
          });
        }

        // Advance falling items & check generous basket catch zone
        const catcherY = f.h * 0.78;
        const catchHalfW = isTablet ? 84 : 64;
        const catchTop = catcherY - (isTablet ? 58 : 44);
        const catchBot = catcherY + (isTablet ? 30 : 24);

        const surviving: FallingItem[] = [];

        for (const item of s.items) {
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
              triggerSnowWiggle();
              pushPop(nx, catcherY - 34, 'snow');
            } else {
              const nextCaught = caughtRef.current + 1;
              caughtRef.current = nextCaught;
              setCaughtCount(nextCaught);
              triggerCatchBounce();
              setBurstPos({ x: nx, y: catcherY - 18, tick: Date.now() });
              pushPop(
                nx,
                catcherY - 30,
                item.kind === 'fishGold' ? 'gold' : 'fish'
              );

              if (item.kind === 'fishGold') {
                soundEngine.playStarCollect(nextCaught);
                soundEngine.playAnimalSound(buddyRef.current.kind);
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
            surviving.push({
              ...item,
              x: nx,
              y: ny,
              rot: nrot,
            });
          }
        }
        s.items = surviving;
      }

      setFrame({
        catcherX: s.catcherX,
        tiltDeg,
        items: s.items,
        flakes: s.flakes,
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [
    isTablet,
    addStar,
    collectSticker,
    triggerCatchBounce,
    triggerSnowWiggle,
    pushPop,
  ]);

  // Unified Drag OR Tap anywhere on the bay to glide smoothly!
  // Uses direct non-passive DOM touchstart/touchmove + window listeners on Web so iPad Safari
  // NEVER steals drags for page scrolling or fires pointercancel mid-slide.
  const fieldNodeRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const activeSlideRef = useRef<{ mode: 'touch' | 'pointer'; id: number } | null>(null);
  const lastTouchEndRef = useRef<number>(0);
  const winCleanupRef = useRef<(() => void) | null>(null);

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

  const getLocalX = useCallback(
    (clientX: number) => {
      const el = getFieldDomEl();
      const rect = el?.getBoundingClientRect?.();
      if (rect) {
        return clientX - rect.left;
      }
      return clientX;
    },
    [getFieldDomEl]
  );

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

  // Direct non-passive touchstart listener on the bay for iPad / iPhone Safari
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const domEl = getFieldDomEl();
    if (!domEl || typeof domEl.addEventListener !== 'function') return;

    const onDomTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      beginWebSlide('touch', t.identifier, t.clientX);
    };

    domEl.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      domEl.removeEventListener?.('touchstart', onDomTouchStart);
    };
  }, [beginWebSlide, getFieldDomEl]);

  const webFieldProps =
    Platform.OS === 'web'
      ? ({
          onPointerDown: (e: {
            pointerId: number;
            pointerType?: string;
            clientX: number;
            preventDefault?: () => void;
          }) => {
            // Touch input is handled directly by our non-passive DOM touchstart listener
            if (e.pointerType === 'touch') return;
            if (Date.now() - lastTouchEndRef.current < 500) return;
            e.preventDefault?.();
            beginWebSlide('pointer', e.pointerId, e.clientX);
          },
        } as Record<string, unknown>)
      : {};

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        soundEngine.unlock();
        simRef.current.targetX = evt.nativeEvent.locationX;
      },
      onPanResponderMove: (evt) => {
        simRef.current.targetX = evt.nativeEvent.locationX;
      },
    })
  ).current;

  const sledW = isTablet ? 186 : 144;
  const sledH = Math.round(sledW * 0.36);
  const animalSz = isTablet ? 106 : 82;
  const basketW = isTablet ? 92 : 72;
  const basketH = Math.round(basketW * 0.61);
  const catcherY = fieldSize.h * 0.78;
  const waterLineY = fieldSize.h * 0.72;

  const wiggleRotate = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return (
    <View style={styles.container}>
      {/* Full-bleed Painterly Snowy Arctic Bay Backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgArctic}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Soft upper sky readability veil behind header */}
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={`arcticTop-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#D7EFF8" stopOpacity="0.46" />
              <Stop offset="0.24" stopColor="#F5FAFC" stopOpacity="0.08" />
              <Stop offset="0.65" stopColor="#7DC6DF" stopOpacity="0.04" />
              <Stop offset="1" stopColor="#4B9FC2" stopOpacity="0.28" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="800" height="600" fill={`url(#arcticTop-${uid})`} />
        </Svg>
      </View>

      <GameHeader
        totalSteps={cfg.goalCount}
        completedSteps={caughtCount}
        difficulty={difficulty}
        onDifficultyChange={(d) => resetRound(d, buddyIdx)}
      />

      {/* Host wraps the draggable bay and the floating buddy switcher as siblings so buddy taps never collide with bay dragging */}
      <View style={styles.fieldHost}>
        {/* Interactive Arctic Bay Play Field */}
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
        {/* Ambient drifting snowflakes & shimmering icy foreground bay waves */}
        <Svg
          width={fieldSize.w}
          height={fieldSize.h}
          viewBox={`0 0 ${fieldSize.w} ${fieldSize.h}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={`bayWater-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#94D5EA" stopOpacity="0.52" />
              <Stop offset="0.45" stopColor="#69B9D6" stopOpacity="0.78" />
              <Stop offset="1" stopColor="#4B9BC0" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Softly drifting snowflakes */}
          {frame.flakes.map((fl, i) => {
            const fx =
              (fl.xPct / 100) * fieldSize.w +
              Math.sin(fl.yPct * 0.08 + fl.phase) * 14;
            const fy = (fl.yPct / 100) * fieldSize.h;
            return (
              <Circle
                key={i}
                cx={fx}
                cy={fy}
                r={fl.r}
                fill="#FFFFFF"
                opacity={0.72}
              />
            );
          })}

          {/* Shimmering glacial bay foreground water band where the ice floe glides */}
          <Path
            d={`M 0 ${waterLineY} Q ${fieldSize.w * 0.25} ${waterLineY - 12} ${fieldSize.w * 0.5} ${waterLineY} T ${fieldSize.w} ${waterLineY} L ${fieldSize.w} ${fieldSize.h} L 0 ${fieldSize.h} Z`}
            fill={`url(#bayWater-${uid})`}
          />
          <Path
            d={`M 0 ${waterLineY} Q ${fieldSize.w * 0.25} ${waterLineY - 12} ${fieldSize.w * 0.5} ${waterLineY} T ${fieldSize.w} ${waterLineY}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.72)"
            strokeWidth="3"
          />

          {/* Sparkling sunlit water ripple highlights */}
          <Path
            d={`M ${fieldSize.w * 0.14} ${waterLineY + 26} Q ${fieldSize.w * 0.22} ${waterLineY + 20} ${fieldSize.w * 0.3} ${waterLineY + 26}`}
            stroke="rgba(255, 252, 234, 0.52)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M ${fieldSize.w * 0.64} ${waterLineY + 34} Q ${fieldSize.w * 0.74} ${waterLineY + 28} ${fieldSize.w * 0.84} ${waterLineY + 34}`}
            stroke="rgba(255, 252, 234, 0.48)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M ${fieldSize.w * 0.36} ${fieldSize.h - 24} Q ${fieldSize.w * 0.5} ${fieldSize.h - 32} ${fieldSize.w * 0.64} ${fieldSize.h - 24}`}
            stroke="rgba(255, 255, 255, 0.38)"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Subtle landing shimmer reflections on the water below each falling fish */}
          {frame.items.map((item) => {
            if (item.kind === 'snowball') return null;
            const closeness = Math.max(0, Math.min(1, item.y / catcherY));
            return (
              <Ellipse
                key={`ref-${item.id}`}
                cx={item.x}
                cy={catcherY + 14}
                rx={12 + closeness * 16}
                ry={4 + closeness * 4}
                fill={
                  item.kind === 'fishGold'
                    ? 'rgba(255, 238, 134, 0.48)'
                    : 'rgba(255, 255, 255, 0.34)'
                }
                opacity={0.25 + closeness * 0.6}
              />
            );
          })}
        </Svg>

        {/* Falling Storybook Arctic Fish & Playful Snowballs */}
        {frame.items.map((item) => (
          <View
            key={item.id}
            pointerEvents="none"
            style={[
              styles.fallingItem,
              {
                left: item.x - item.size / 2,
                top: item.y - item.size / 2,
                width: item.size,
                height: item.size,
                transform: [{ rotate: `${Math.round(item.rot)}deg` }],
              },
            ]}
          >
            {item.kind === 'snowball' ? (
              <PlayfulSnowballSvg size={item.size} />
            ) : (
              <ArcticFishSvg kind={item.kind} size={item.size} />
            )}
          </View>
        ))}

        {/* Catch Sparkle Burst */}
        {burstPos && (
          <View
            key={burstPos.tick}
            pointerEvents="none"
            style={[
              styles.burstAnchor,
              { left: burstPos.x, top: burstPos.y },
            ]}
          >
            <SnapBurst size={isTablet ? 136 : 108} />
          </View>
        )}

        {/* Floating Star / Snow Giggle Pops */}
        {pops.map((pop) => (
          <CatchPopEffect key={pop.id} pop={pop} />
        ))}

        {/* Gliding Ice Floe + Smiling Arctic Buddy + Filling Wooden Fish Basket */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.catcherWrap,
            {
              left: frame.catcherX - sledW / 2,
              top: catcherY - animalSz * 0.72,
              width: sledW,
              transform: [
                { rotate: `${frame.tiltDeg.toFixed(1)}deg` },
                { rotate: wiggleRotate },
                { scale: catchBounce },
              ],
            },
          ]}
        >
          {/* Smiling Arctic Buddy standing proudly on the ice floe */}
          <View style={{ marginBottom: -Math.round(sledH * 0.42), zIndex: 2 }}>
            <AnimatedZooAnimal
              state={catchingAnim ? 'celebrate' : 'idle'}
              size={animalSz}
              seed={buddyIdx + 1}
              weight={getAnimalWeight(activeBuddy.kind)}
            >
              <ZooExhibitAnimalSvg
                animal={activeBuddy.kind}
                size={animalSz}
                highlighted={catchingAnim}
              />
            </AnimatedZooAnimal>
          </View>

          {/* Sculpted Watercolor Ice Floe Sled */}
          <IceFloeSledSvg width={sledW} height={sledH} />

          {/* Woven Wooden Fish Basket mounted at the front of the ice floe */}
          <View
            style={{
              position: 'absolute',
              bottom: Math.round(sledH * 0.16),
              alignSelf: 'center',
              zIndex: 4,
            }}
          >
            <FishBasketSvg
              width={basketW}
              height={basketH}
              caughtCount={caughtCount}
            />
          </View>
        </Animated.View>
        </View>

        {/* Compact Frosted Arctic Buddy Switcher Pill (sibling outside field so buddy taps never collide with dragging) */}
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
  },
  fieldHost: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  field: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  buddyBarWrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
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
  fallingItem: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catcherWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 26,
  },
  burstAnchor: {
    position: 'absolute',
    zIndex: 50,
  },
  snowGigglePill: {
    backgroundColor: '#EAF7FD',
    borderRadius: 14,
    borderWidth: 2.2,
    borderColor: '#4E7D96',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  snowGiggleText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2F5C75',
  },
});
