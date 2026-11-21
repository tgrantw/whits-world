import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

type ExhibitId = 'monkeys' | 'aquarium' | 'savanna' | 'sanctuary' | 'arctic' | 'farm';

interface ExhibitAnimalSpot {
  id: string;
  animal: ExhibitAnimalKind;
  /** Center position inside the full-bleed exhibit clearing (phone default) */
  xPct: number;
  yPct: number;
  /** Optional perspective refinement for iPad Portrait (4:3 vertical) */
  tabletPortraitPos?: { xPct: number; yPct: number };
  /** Optional perspective refinement for iPad Landscape (4:3 horizontal) */
  landscapePos?: { xPct: number; yPct: number };
  sizeFactor: number;
}

interface ZooExhibitStage {
  id: string;
  backdrop: ExhibitId;
  badgeColor: string;
  /** Always matches spots[0].animal so the selector icon ALWAYS appears in the round! */
  badgeAnimal: ExhibitAnimalKind;
  spots: ExhibitAnimalSpot[];
}

const ZOO_EXHIBITS: ZooExhibitStage[] = [
  {
    id: 'monkeys',
    backdrop: 'monkeys',
    badgeColor: '#A9DA9B',
    badgeAnimal: 'monkey',
    spots: [
      // Monkey grounded on the sunlit grassy right foreground meadow bank
      {
        id: 'mk-monkey',
        animal: 'monkey',
        xPct: 72,
        yPct: 81,
        tabletPortraitPos: { xPct: 72, yPct: 84 },
        landscapePos: { xPct: 58, yPct: 78 },
        sizeFactor: 0.98,
      },
      // Toucan cleanly perched ON top of the left tree branch across phone, iPad portrait & landscape
      {
        id: 'mk-toucan',
        animal: 'toucan',
        xPct: 28,
        yPct: 14,
        tabletPortraitPos: { xPct: 29, yPct: 14 },
        landscapePos: { xPct: 21, yPct: 7 },
        sizeFactor: 0.92,
      },
      // Gorilla standing squarely in the open sunlit meadow in front of the bushes
      {
        id: 'mk-gorilla',
        animal: 'gorilla',
        xPct: 30,
        yPct: 83,
        tabletPortraitPos: { xPct: 30, yPct: 86 },
        landscapePos: { xPct: 24, yPct: 80 },
        sizeFactor: 1.04,
      },
      // Frog nestled along the lower sunlit grass clearing near the stream bank
      {
        id: 'mk-frog',
        animal: 'frog',
        xPct: 51,
        yPct: 89,
        tabletPortraitPos: { xPct: 51, yPct: 90 },
        landscapePos: { xPct: 41, yPct: 86 },
        sizeFactor: 0.84,
      },
    ],
  },
  {
    id: 'aquarium',
    backdrop: 'aquarium',
    badgeColor: '#9EDEEF',
    badgeAnimal: 'whale',
    spots: [
      { id: 'aq-whale', animal: 'whale', xPct: 28, yPct: 29, sizeFactor: 1.06 },
      { id: 'aq-turtle', animal: 'turtle', xPct: 74, yPct: 30, sizeFactor: 0.98 },
      { id: 'aq-octopus', animal: 'octopus', xPct: 74, yPct: 73, sizeFactor: 1.0 },
      { id: 'aq-clownfish', animal: 'clownfish', xPct: 26, yPct: 74, sizeFactor: 0.92 },
    ],
  },
  {
    id: 'savanna',
    backdrop: 'savanna',
    badgeColor: '#F5DF98',
    badgeAnimal: 'giraffe',
    spots: [
      { id: 'sv-giraffe', animal: 'giraffe', xPct: 24, yPct: 34, sizeFactor: 1.1 },
      { id: 'sv-zebra', animal: 'zebra', xPct: 74, yPct: 32, sizeFactor: 0.96 },
      { id: 'sv-elephant', animal: 'elephant', xPct: 74, yPct: 74, sizeFactor: 1.06 },
      { id: 'sv-lion', animal: 'lion', xPct: 28, yPct: 75, sizeFactor: 0.98 },
    ],
  },
  {
    id: 'sanctuary',
    backdrop: 'sanctuary',
    badgeColor: '#BCE2C4',
    badgeAnimal: 'panda',
    spots: [
      { id: 'sn-panda', animal: 'panda', xPct: 26, yPct: 32, sizeFactor: 0.98 },
      { id: 'sn-flamingo', animal: 'flamingo', xPct: 75, yPct: 32, sizeFactor: 1.04 },
      { id: 'sn-hippo', animal: 'hippo', xPct: 73, yPct: 75, sizeFactor: 1.04 },
      { id: 'sn-tiger', animal: 'tiger', xPct: 28, yPct: 75, sizeFactor: 0.98 },
    ],
  },
  {
    id: 'arctic',
    backdrop: 'arctic',
    badgeColor: '#C5E4F4',
    badgeAnimal: 'penguin',
    spots: [
      // Penguin standing cheerfully on the sunlit right foreground snow / ice floe
      {
        id: 'ar-penguin',
        animal: 'penguin',
        xPct: 74,
        yPct: 89,
        tabletPortraitPos: { xPct: 74, yPct: 87 },
        landscapePos: { xPct: 48, yPct: 79 },
        sizeFactor: 0.94,
      },
      // Seal resting right atop the left flat snow shelf in the lagoon
      {
        id: 'ar-seal',
        animal: 'seal',
        xPct: 25,
        yPct: 64,
        tabletPortraitPos: { xPct: 26, yPct: 63 },
        landscapePos: { xPct: 22, yPct: 46 },
        sizeFactor: 0.96,
      },
      // Polar Bear sitting cozily on the sunlit left foreground ice floe / snowbank
      {
        id: 'ar-polarbear',
        animal: 'polarbear',
        xPct: 26,
        yPct: 90,
        tabletPortraitPos: { xPct: 27, yPct: 88 },
        landscapePos: { xPct: 22, yPct: 78 },
        sizeFactor: 1.02,
      },
      // Puffin perched on the right snow shelf overlooking the sparkling lagoon
      {
        id: 'ar-puffin',
        animal: 'puffin',
        xPct: 76,
        yPct: 64,
        tabletPortraitPos: { xPct: 75, yPct: 63 },
        landscapePos: { xPct: 50, yPct: 47 },
        sizeFactor: 0.88,
      },
    ],
  },
  {
    id: 'farm',
    backdrop: 'farm',
    badgeColor: '#F5DB9A',
    badgeAnimal: 'cow',
    spots: [
      // Cow standing solidly on the open sunlit meadow IN FRONT of the fence
      {
        id: 'fm-cow',
        animal: 'cow',
        xPct: 30,
        yPct: 91,
        tabletPortraitPos: { xPct: 30, yPct: 89 },
        landscapePos: { xPct: 21, yPct: 80 },
        sizeFactor: 1.0,
      },
      // Sheep grazing on the green pasture right in front of the cozy red barn
      {
        id: 'fm-sheep',
        animal: 'sheep',
        xPct: 26,
        yPct: 65,
        tabletPortraitPos: { xPct: 26, yPct: 64 },
        landscapePos: { xPct: 22, yPct: 49 },
        sizeFactor: 0.92,
      },
      // Duck splashing right beside the right farm stream edge
      {
        id: 'fm-duck',
        animal: 'duck',
        xPct: 77,
        yPct: 91,
        tabletPortraitPos: { xPct: 76, yPct: 89 },
        landscapePos: { xPct: 48, yPct: 80 },
        sizeFactor: 0.88,
      },
      // Happy Pig trotting on the sunny green hillside meadow behind the fence
      {
        id: 'fm-pig',
        animal: 'pig',
        xPct: 74,
        yPct: 64,
        tabletPortraitPos: { xPct: 74, yPct: 63 },
        landscapePos: { xPct: 48, yPct: 46 },
        sizeFactor: 0.94,
      },
    ],
  },
  /* Rounds 7–10: "Visiting Friends" casts across habitats for endless replayability */
  {
    id: 'clearing-visitors',
    backdrop: 'monkeys',
    badgeColor: '#F6CC9D',
    badgeAnimal: 'tiger',
    spots: [
      // Tiger visiting the sunny right meadow bank
      {
        id: 'cv-tiger',
        animal: 'tiger',
        xPct: 71,
        yPct: 80,
        tabletPortraitPos: { xPct: 71, yPct: 84 },
        landscapePos: { xPct: 57, yPct: 78 },
        sizeFactor: 1.0,
      },
      // Toucan greeting visitors from the left tree branch
      {
        id: 'cv-toucan',
        animal: 'toucan',
        xPct: 28,
        yPct: 14,
        tabletPortraitPos: { xPct: 29, yPct: 14 },
        landscapePos: { xPct: 21, yPct: 7 },
        sizeFactor: 0.92,
      },
      // Baby elephant standing in the open sunlit meadow
      {
        id: 'cv-elephant',
        animal: 'elephant',
        xPct: 31,
        yPct: 82,
        tabletPortraitPos: { xPct: 31, yPct: 86 },
        landscapePos: { xPct: 25, yPct: 80 },
        sizeFactor: 1.06,
      },
      // Panda snacking near the lower sunlit stream edge
      {
        id: 'cv-panda',
        animal: 'panda',
        xPct: 52,
        yPct: 88,
        tabletPortraitPos: { xPct: 52, yPct: 90 },
        landscapePos: { xPct: 42, yPct: 86 },
        sizeFactor: 0.92,
      },
    ],
  },
  {
    id: 'aquarium-party',
    backdrop: 'aquarium',
    badgeColor: '#B5D9F8',
    badgeAnimal: 'octopus',
    spots: [
      { id: 'ap-octopus', animal: 'octopus', xPct: 28, yPct: 34, sizeFactor: 1.02 },
      { id: 'ap-clownfish', animal: 'clownfish', xPct: 72, yPct: 26, sizeFactor: 0.94 },
      { id: 'ap-whale', animal: 'whale', xPct: 68, yPct: 74, sizeFactor: 1.08 },
      { id: 'ap-turtle', animal: 'turtle', xPct: 26, yPct: 72, sizeFactor: 0.98 },
    ],
  },
  {
    id: 'savanna-oasis',
    backdrop: 'savanna',
    badgeColor: '#F5C98E',
    badgeAnimal: 'lion',
    spots: [
      { id: 'so-lion', animal: 'lion', xPct: 72, yPct: 34, sizeFactor: 1.0 },
      { id: 'so-hippo', animal: 'hippo', xPct: 28, yPct: 76, sizeFactor: 1.04 },
      { id: 'so-giraffe', animal: 'giraffe', xPct: 26, yPct: 32, sizeFactor: 1.1 },
      { id: 'so-monkey', animal: 'monkey', xPct: 73, yPct: 74, sizeFactor: 0.94 },
    ],
  },
  {
    id: 'sanctuary-picnic',
    backdrop: 'sanctuary',
    badgeColor: '#F5C7DA',
    badgeAnimal: 'flamingo',
    spots: [
      { id: 'sp-flamingo', animal: 'flamingo', xPct: 28, yPct: 34, sizeFactor: 1.04 },
      { id: 'sp-zebra', animal: 'zebra', xPct: 73, yPct: 34, sizeFactor: 0.98 },
      { id: 'sp-gorilla', animal: 'gorilla', xPct: 71, yPct: 76, sizeFactor: 1.02 },
      { id: 'sp-frog', animal: 'frog', xPct: 30, yPct: 78, sizeFactor: 0.88 },
    ],
  },
];

function getExhibitSpots(
  exhibit: ZooExhibitStage,
  difficulty: Difficulty,
  loopVariant = 0
): ExhibitAnimalSpot[] {
  // On subsequent loops through the 10 exhibits, rotate animal subsets & gently mirror symmetrical scenes
  const shouldMirror =
    loopVariant % 2 === 1 &&
    exhibit.backdrop !== 'monkeys' &&
    exhibit.backdrop !== 'farm';

  const mapped = exhibit.spots.map((spot) =>
    shouldMirror ? { ...spot, xPct: 100 - spot.xPct } : spot
  );

  if (difficulty === 1) {
    // Rotate diagonally balanced pairs across loops so Easy stays fresh
    if (loopVariant % 2 === 1) {
      return [mapped[1], mapped[3]];
    }
    return [mapped[0], mapped[2]];
  }
  if (difficulty === 2) {
    // Rotate which 3 of 4 animals appear across loops
    const skipIdx = (3 - (loopVariant % 4) + 4) % 4;
    return mapped.filter((_, idx) => idx !== skipIdx);
  }
  return mapped;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const EXHIBIT_BACKDROP_MAP: Record<ExhibitId, typeof STORYBOOK_ASSETS.bgClearing> = {
  monkeys: STORYBOOK_ASSETS.bgClearing,
  aquarium: STORYBOOK_ASSETS.bgAquarium,
  savanna: STORYBOOK_ASSETS.bgSavanna,
  sanctuary: STORYBOOK_ASSETS.bgSanctuary,
  arctic: STORYBOOK_ASSETS.bgArctic,
  farm: STORYBOOK_ASSETS.bgFarm,
};

/**
 * Full-bleed edge-to-edge storybook Zoo Exhibit scenery (NO cramped wooden picture frame!):
 * Renders Warm Watercolor & Gouache painted PNG backdrops for all 6 worlds
 * with subtle animated rising bubbles in the Aquarium and soft drifting snow in the Arctic.
 */
const FullBleedExhibitBackdrop: React.FC<{ exhibit: ExhibitId }> = ({
  exhibit,
}) => {
  const ambientB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (exhibit !== 'aquarium' && exhibit !== 'arctic') return;
    ambientB.setValue(0);
    const loopB = Animated.loop(
      Animated.timing(ambientB, {
        toValue: 1,
        duration: exhibit === 'arctic' ? 6800 : 4600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loopB.start();
    return () => {
      loopB.stop();
    };
  }, [ambientB, exhibit]);

  const riseY = ambientB.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -180],
  });
  const bubbleOpacity = ambientB.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.78, 0.7, 0],
  });
  const snowY = ambientB.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 220],
  });
  const snowX = ambientB.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-10, 12, -8],
  });
  const snowOpacity = ambientB.interpolate({
    inputRange: [0, 0.18, 0.82, 1],
    outputRange: [0, 0.85, 0.75, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={EXHIBIT_BACKDROP_MAP[exhibit]}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      {exhibit === 'aquarium' && (
        <Animated.View
          style={[
            styles.bubbleColA,
            { opacity: bubbleOpacity, transform: [{ translateY: riseY }] },
          ]}
        >
          <Svg width="40" height="80" viewBox="0 0 40 80">
            <Circle
              cx="14"
              cy="60"
              r="8"
              fill="rgba(225,252,255,0.45)"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <Circle
              cx="26"
              cy="34"
              r="5.5"
              fill="rgba(225,252,255,0.45)"
              stroke="#FFFFFF"
              strokeWidth="1.8"
            />
          </Svg>
        </Animated.View>
      )}
      {exhibit === 'arctic' && (
        <Animated.View
          style={{
            position: 'absolute',
            top: '14%',
            left: '10%',
            right: '10%',
            height: 180,
            opacity: snowOpacity,
            transform: [{ translateY: snowY }, { translateX: snowX }],
          }}
        >
          <Svg width="100%" height="180" viewBox="0 0 320 180">
            <Circle cx="36" cy="28" r="4.5" fill="#FFFFFF" opacity="0.9" />
            <Circle cx="94" cy="76" r="3.5" fill="#FFFFFF" opacity="0.82" />
            <Circle cx="158" cy="22" r="5" fill="#FFFFFF" opacity="0.92" />
            <Circle cx="218" cy="88" r="3.8" fill="#FFFFFF" opacity="0.84" />
            <Circle cx="276" cy="40" r="4.8" fill="#FFFFFF" opacity="0.88" />
            <Circle cx="62" cy="140" r="3.2" fill="#FFFFFF" opacity="0.78" />
            <Circle cx="186" cy="144" r="4.2" fill="#FFFFFF" opacity="0.85" />
            <Circle cx="254" cy="134" r="3.4" fill="#FFFFFF" opacity="0.76" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

/** Soft golden shimmer pulsing around the matching silhouette while dragging on Easy & Med */
const PulsingSilhouetteHalo: React.FC<{
  active: boolean;
  size: number;
  children: React.ReactNode;
}> = ({ active, size, children }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.58],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.12],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: Math.round(size * 0.94),
            height: Math.round(size * 0.94),
            borderRadius: Math.round(size * 0.47),
            backgroundColor: '#FFE57F',
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
      )}
      {children}
    </View>
  );
};

/** Joyful celebrate bounce on snap -> staggered gentle idle breathing + animal sound & hop on tap */
const LivingExhibitAnimal: React.FC<{
  animal: ExhibitAnimalKind;
  size: number;
  seed: number;
  onAnimalTap?: () => void;
}> = ({ animal, size, seed, onAnimalTap }) => {
  const [animState, setAnimState] = useState<'celebrate' | 'idle'>('celebrate');

  useEffect(() => {
    setAnimState('celebrate');
    const t = setTimeout(() => {
      setAnimState('idle');
    }, 980);
    return () => clearTimeout(t);
  }, [animal]);

  return (
    <AnimatedZooAnimal
      state={animState}
      size={size}
      seed={seed}
      weight={getAnimalWeight(animal)}
      silentTap
      onTap={() => {
        soundEngine.playAnimalSound(animal);
        onAnimalTap?.();
      }}
    >
      <ZooExhibitAnimalSvg animal={animal} size={size} />
    </AnimatedZooAnimal>
  );
};

/**
 * Zoo Exhibits (Free Tier — Full-Bleed Immersive Storybook Scenes):
 * - Edge-to-edge animated exhibit backdrops (NO cramped brown picture frame!)
 * - Unified translucent animal silhouettes kept completely static (`state="static"`)
 *   with a soft golden shimmer while dragging on Easy & Med
 * - Tray animals breathe with staggered seeds, lift cleanly on drag, and celebrate + vocalize on snap!
 * - Defaults to Medium (2) with clearly labeled Easy | Med | Hard toggle.
 */
export const ShapeSorterGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [stageIdx, setStageIdx] = useState(0);
  const [solvedExhibits, setSolvedExhibits] = useState<string[]>([]);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [burstMap, setBurstMap] = useState<Record<string, number>>({});
  const [trayItems, setTrayItems] = useState<ExhibitAnimalSpot[]>(() =>
    shuffle(getExhibitSpots(ZOO_EXHIBITS[0], 2, 0))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [hintSlotId, setHintSlotId] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const slotRefs = useRef<Record<string, MeasurableNode>>({});

  const currentExhibit = ZOO_EXHIBITS[stageIdx % ZOO_EXHIBITS.length];
  const loopVariant = Math.floor(stageIdx / ZOO_EXHIBITS.length);
  const activeSpots = getExhibitSpots(currentExhibit, difficulty, loopVariant);
  const hitPadding = isTablet ? 76 : 58;

  const startStage = useCallback(
    (nextIdx: number, nextDiff: Difficulty = difficulty) => {
      const ex = ZOO_EXHIBITS[nextIdx % ZOO_EXHIBITS.length];
      const nextLoop = Math.floor(nextIdx / ZOO_EXHIBITS.length);
      setStageIdx(nextIdx);
      setPlacedIds([]);
      setBurstMap({});
      setTrayItems(shuffle(getExhibitSpots(ex, nextDiff, nextLoop)));
      setSelectedId(null);
      setDraggingId(null);
      setHoveredSlotId(null);
      setHintSlotId(null);
      setWon(false);
    },
    [difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      setDifficulty(nextDiff);
      startStage(stageIdx, nextDiff);
    },
    [stageIdx, startStage]
  );

  useEffect(() => {
    if (placedIds.length === activeSpots.length && activeSpots.length > 0) {
      setSolvedExhibits((prev) =>
        prev.includes(currentExhibit.id) ? prev : [...prev, currentExhibit.id]
      );
      const t = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setWon(true);
      }, 680);
      return () => clearTimeout(t);
    }
  }, [placedIds.length, activeSpots.length, addStar, currentExhibit.id]);

  const placeItem = useCallback(
    (itemId: string) => {
      const spot = currentExhibit.spots.find((s) => s.id === itemId);
      soundEngine.playSnap();
      if (spot) {
        collectSticker(spot.animal);
        setTimeout(() => soundEngine.playAnimalSound(spot.animal), 110);
      }
      setSelectedId(null);
      setDraggingId(null);
      setHintSlotId(null);
      setHoveredSlotId(null);
      setPlacedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      setBurstMap((prev) => ({ ...prev, [itemId]: Date.now() }));
    },
    [currentExhibit, collectSticker]
  );

  const handleDragMove = useCallback(
    async (itemId: string, attempt: DropAttempt) => {
      const rect = await measureNodeRect(slotRefs.current[itemId]);
      if (
        rect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            rect,
            hitPadding
          ))
      ) {
        setHoveredSlotId(itemId);
      } else {
        setHoveredSlotId((prev) => (prev === itemId ? null : prev));
      }
    },
    [hitPadding]
  );

  const handleDrop = useCallback(
    async (itemId: string, attempt: DropAttempt): Promise<boolean> => {
      setHoveredSlotId(null);
      setSelectedId(null);
      const rect = await measureNodeRect(slotRefs.current[itemId]);
      if (!rect) return false;

      const hit =
        isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
        isPointNearRect(
          { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
          rect,
          hitPadding
        );

      if (hit) {
        placeItem(itemId);
        return true;
      }
      return false;
    },
    [hitPadding, placeItem]
  );

  const handleSlotTap = useCallback(
    (slotId: string) => {
      if (placedIds.includes(slotId)) return;
      if (selectedId === slotId) {
        placeItem(slotId);
      } else if (selectedId) {
        soundEngine.playGentleBounce();
        setHintSlotId(selectedId);
        setTimeout(() => {
          setHintSlotId((prev) => (prev === selectedId ? null : prev));
        }, 900);
      }
    },
    [placedIds, selectedId, placeItem]
  );

  const handlePieceTap = useCallback((itemId: string) => {
    setSelectedId((prev) => (prev === itemId ? null : itemId));
    setHintSlotId(itemId);
    setTimeout(() => {
      setHintSlotId((prev) => (prev === itemId ? null : prev));
    }, 1100);
  }, []);

  const stageW = isTabletLandscape
    ? Math.min(720, Math.round(width * 0.64))
    : Math.min(680, width - 24);
  const stageH = isTabletLandscape
    ? Math.min(500, Math.max(340, height - 180))
    : isTablet
    ? Math.min(610, Math.max(360, height - 335))
    : Math.min(460, Math.max(300, height - 295));

  const baseSpotSize = isTablet ? 136 : 94;
  const trayAnimalSize = isTablet ? 114 : 80;
  const traySlotSize = isTablet ? 124 : 86;

  const renderExhibitPicker = () => (
    <View
      style={[
        styles.scenePickerShell,
        isTabletLandscape && { maxWidth: stageW },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scenePickerRow}
      >
        {ZOO_EXHIBITS.map((ex, idx) => {
          const active = idx === stageIdx % ZOO_EXHIBITS.length;
          const solved = solvedExhibits.includes(ex.id);
          const tabSz = isTablet ? 52 : 42;
          return (
            <TactileButton
              key={ex.id}
              onPress={() => {
                soundEngine.playPop();
                startStage(idx);
              }}
              accessibilityLabel={`Switch to ${ex.id} exhibit`}
              style={{ width: tabSz }}
            >
              <View
                style={[
                  styles.sceneDotTab,
                  {
                    width: tabSz,
                    height: tabSz,
                    borderRadius: tabSz / 2,
                    backgroundColor: ex.badgeColor,
                  },
                  active && styles.sceneDotTabActive,
                ]}
              >
                <ZooExhibitAnimalSvg
                  animal={ex.badgeAnimal}
                  size={isTablet ? 40 : 32}
                />
                {solved && (
                  <View style={styles.solvedDot}>
                    <Text style={styles.solvedDotText}>✓</Text>
                  </View>
                )}
              </View>
            </TactileButton>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOpenStage = () => (
    <View style={[styles.openStage, { width: stageW, height: stageH }]}>
      {activeSpots.map((spot, idx) => {
        const isPlaced = placedIds.includes(spot.id);
        const isDragShimmer =
          !isPlaced && draggingId === spot.id && difficulty <= 2;
        const isHighlighted =
          hoveredSlotId === spot.id ||
          hintSlotId === spot.id ||
          selectedId === spot.id ||
          isDragShimmer;
        const animalPx = Math.round(baseSpotSize * spot.sizeFactor);
        const resolvedPos =
          isTabletLandscape && spot.landscapePos
            ? spot.landscapePos
            : isTablet && !isTabletLandscape && spot.tabletPortraitPos
            ? spot.tabletPortraitPos
            : spot;
        const left = Math.round((resolvedPos.xPct / 100) * stageW - animalPx / 2);
        const top = Math.round((resolvedPos.yPct / 100) * stageH - animalPx / 2);

        return (
          <Pressable
            key={spot.id}
            onPress={isPlaced ? undefined : () => handleSlotTap(spot.id)}
            accessibilityRole="button"
            accessibilityLabel={
              isPlaced ? `Tap ${spot.animal}` : `Match ${spot.animal} shape`
            }
            style={[
              styles.spotAnchor,
              { left, top, width: animalPx, height: animalPx },
            ]}
          >
            <View
              ref={(node) => {
                slotRefs.current[spot.id] = node;
              }}
              style={[
                styles.shapeSpot,
                { width: animalPx, height: animalPx },
                isHighlighted && !isPlaced && styles.shapeSpotPulse,
              ]}
            >
              {isPlaced ? (
                <LivingExhibitAnimal
                  animal={spot.animal}
                  size={animalPx}
                  seed={idx + 1}
                  onAnimalTap={() =>
                    setBurstMap((prev) => ({ ...prev, [spot.id]: Date.now() }))
                  }
                />
              ) : (
                <PulsingSilhouetteHalo active={isDragShimmer} size={animalPx}>
                  <AnimatedZooAnimal state="static" size={animalPx}>
                    <ZooExhibitAnimalSvg
                      animal={spot.animal}
                      size={animalPx}
                      silhouette
                      highlighted={isHighlighted}
                    />
                  </AnimatedZooAnimal>
                </PulsingSilhouetteHalo>
              )}
              {burstMap[spot.id] && (
                <SnapBurst key={burstMap[spot.id]} size={isTablet ? 130 : 100} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderCurvedDock = () => (
    <View
      style={[
        styles.woodenDock,
        isTablet && styles.woodenDockTablet,
        isTabletLandscape && styles.woodenDockLandscape,
      ]}
    >
      {/* Subtle sunlit watercolor wood highlight along the upper lip */}
      <View style={styles.woodenDockGloss} pointerEvents="none" />
      {trayItems.map((item, idx) => {
        const isPlaced = placedIds.includes(item.id);
        const isSelected = selectedId === item.id;
        const isDragging = draggingId === item.id;
        return (
          <View
            key={`${stageIdx}-${difficulty}-${item.id}`}
            style={[
              styles.dockSlot,
              { width: traySlotSize, height: traySlotSize },
            ]}
          >
            {!isPlaced && (
              <DraggablePiece
                selected={isSelected}
                dragScale={1}
                onDragStateChange={(active) =>
                  setDraggingId((prev) =>
                    active ? item.id : prev === item.id ? null : prev
                  )
                }
                onDragMove={(a) => handleDragMove(item.id, a)}
                onDrop={(a) => handleDrop(item.id, a)}
                onTap={() => handlePieceTap(item.id)}
              >
                <View style={styles.dieCutPieceWrap}>
                  <AnimatedZooAnimal
                    state={isDragging ? 'dragging' : 'idle'}
                    size={trayAnimalSize}
                    seed={idx + 11}
                    weight={getAnimalWeight(item.animal)}
                  >
                    <ZooExhibitAnimalSvg
                      animal={item.animal}
                      size={trayAnimalSize}
                      stickerRim
                      highlighted={isSelected}
                    />
                  </AnimatedZooAnimal>
                </View>
              </DraggablePiece>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Full-bleed edge-to-edge living Zoo Exhibit backdrop */}
      <FullBleedExhibitBackdrop exhibit={currentExhibit.backdrop} />

      <GameHeader
        totalSteps={activeSpots.length}
        completedSteps={placedIds.length}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      {isTabletLandscape ? (
        <View style={styles.playAreaLandscape}>
          <View style={styles.landscapeLeft}>
            {renderOpenStage()}
            {renderExhibitPicker()}
          </View>
          <View style={styles.landscapeRight}>{renderCurvedDock()}</View>
        </View>
      ) : (
        <View style={styles.playArea}>
          {renderOpenStage()}
          {renderCurvedDock()}
          {renderExhibitPicker()}
        </View>
      )}

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startStage(stageIdx + 1)}
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
  kelpLeft: {
    position: 'absolute',
    left: 14,
    bottom: -10,
  },
  bubbleColA: {
    position: 'absolute',
    left: '18%',
    bottom: 24,
  },
  savannaCloud: {
    position: 'absolute',
    top: 72,
    right: '14%',
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 14,
    overflow: 'visible',
  },
  playAreaLandscape: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    overflow: 'visible',
  },
  landscapeLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  landscapeRight: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    overflow: 'visible',
  },
  openStage: {
    position: 'relative',
    zIndex: 10,
  },
  spotAnchor: {
    position: 'absolute',
  },
  shapeSpot: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shapeSpotPulse: {
    transform: [{ scale: 1.07 }],
  },
  /* Softly shaded watercolor-style curved wooden dock (warm, organic, zero harsh border) */
  woodenDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '96%',
    maxWidth: 520,
    backgroundColor: 'rgba(246, 221, 174, 0.88)',
    borderRadius: 46,
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 50, 0.34)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(138, 92, 50, 0.44)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 104,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  woodenDockGloss: {
    position: 'absolute',
    top: 4,
    left: 22,
    right: 22,
    height: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 250, 236, 0.48)',
  },
  woodenDockTablet: {
    maxWidth: 680,
    borderRadius: 52,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  woodenDockLandscape: {
    width: 300,
    minHeight: 330,
    borderRadius: 52,
    paddingVertical: 20,
    paddingHorizontal: 14,
    gap: 12,
  },
  dockSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  dieCutPieceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenePickerShell: {
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.54)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  scenePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sceneDotTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },
  sceneDotTabActive: {
    borderColor: COLORS.woodDark,
    borderWidth: 3.5,
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  solvedDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLORS.emerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solvedDotText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
