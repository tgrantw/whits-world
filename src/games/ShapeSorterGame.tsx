import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  title: string;
  emoji: string;
  backdrop: ExhibitId;
  badgeColor: string;
  /** Always matches spots[0].animal so the selector icon ALWAYS appears in the round! */
  badgeAnimal: ExhibitAnimalKind;
  spots: ExhibitAnimalSpot[];
}

const SOLVED_EXHIBITS_KEY = 'whits_world_solved_exhibits_v1';

const ANIMAL_LABELS: Record<ExhibitAnimalKind, string> = {
  monkey: 'Monkey',
  toucan: 'Toucan',
  gorilla: 'Gorilla',
  frog: 'Frog',
  whale: 'Whale',
  turtle: 'Turtle',
  octopus: 'Octopus',
  clownfish: 'Clownfish',
  giraffe: 'Giraffe',
  zebra: 'Zebra',
  elephant: 'Elephant',
  lion: 'Lion',
  panda: 'Panda',
  flamingo: 'Flamingo',
  hippo: 'Hippo',
  tiger: 'Tiger',
  penguin: 'Penguin',
  seal: 'Seal',
  polarbear: 'Polar Bear',
  puffin: 'Puffin',
  cow: 'Cow',
  sheep: 'Sheep',
  duck: 'Duck',
  pig: 'Pig',
};

const WATER_ANIMALS = new Set<ExhibitAnimalKind>([
  'whale',
  'turtle',
  'octopus',
  'clownfish',
  'penguin',
  'seal',
  'duck',
  'frog',
  'hippo',
]);

const BIRD_ANIMALS = new Set<ExhibitAnimalKind>(['toucan', 'flamingo', 'puffin']);

function loadSavedSolvedExhibits(): string[] {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SOLVED_EXHIBITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveSolvedExhibits(ids: string[]): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOLVED_EXHIBITS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

const ZOO_EXHIBITS: ZooExhibitStage[] = [
  {
    id: 'monkeys',
    title: 'Jungle Clearing',
    emoji: '🌴',
    backdrop: 'monkeys',
    badgeColor: '#A9DA9B',
    badgeAnimal: 'monkey',
    spots: [
      {
        id: 'mk-monkey',
        animal: 'monkey',
        xPct: 72,
        yPct: 81,
        tabletPortraitPos: { xPct: 72, yPct: 84 },
        landscapePos: { xPct: 58, yPct: 78 },
        sizeFactor: 0.98,
      },
      {
        id: 'mk-toucan',
        animal: 'toucan',
        xPct: 28,
        yPct: 14,
        tabletPortraitPos: { xPct: 29, yPct: 14 },
        landscapePos: { xPct: 21, yPct: 11 },
        sizeFactor: 0.92,
      },
      {
        id: 'mk-gorilla',
        animal: 'gorilla',
        xPct: 30,
        yPct: 83,
        tabletPortraitPos: { xPct: 30, yPct: 86 },
        landscapePos: { xPct: 24, yPct: 80 },
        sizeFactor: 1.04,
      },
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
    title: 'Ocean Aquarium',
    emoji: '🐳',
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
    title: 'Sunny Savanna',
    emoji: '🦒',
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
    title: 'Bamboo Sanctuary',
    emoji: '🐼',
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
    title: 'Arctic Lagoon',
    emoji: '🐧',
    backdrop: 'arctic',
    badgeColor: '#C5E4F4',
    badgeAnimal: 'penguin',
    spots: [
      {
        id: 'ar-penguin',
        animal: 'penguin',
        xPct: 74,
        yPct: 89,
        tabletPortraitPos: { xPct: 74, yPct: 87 },
        landscapePos: { xPct: 48, yPct: 79 },
        sizeFactor: 0.94,
      },
      {
        id: 'ar-seal',
        animal: 'seal',
        xPct: 25,
        yPct: 64,
        tabletPortraitPos: { xPct: 26, yPct: 63 },
        landscapePos: { xPct: 22, yPct: 46 },
        sizeFactor: 0.96,
      },
      {
        id: 'ar-polarbear',
        animal: 'polarbear',
        xPct: 26,
        yPct: 90,
        tabletPortraitPos: { xPct: 27, yPct: 88 },
        landscapePos: { xPct: 22, yPct: 78 },
        sizeFactor: 1.02,
      },
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
    title: 'Happy Farm',
    emoji: '🐄',
    backdrop: 'farm',
    badgeColor: '#F5DB9A',
    badgeAnimal: 'cow',
    spots: [
      {
        id: 'fm-cow',
        animal: 'cow',
        xPct: 30,
        yPct: 91,
        tabletPortraitPos: { xPct: 30, yPct: 89 },
        landscapePos: { xPct: 21, yPct: 80 },
        sizeFactor: 1.0,
      },
      {
        id: 'fm-sheep',
        animal: 'sheep',
        xPct: 26,
        yPct: 65,
        tabletPortraitPos: { xPct: 26, yPct: 64 },
        landscapePos: { xPct: 22, yPct: 49 },
        sizeFactor: 0.92,
      },
      {
        id: 'fm-duck',
        animal: 'duck',
        xPct: 77,
        yPct: 91,
        tabletPortraitPos: { xPct: 76, yPct: 89 },
        landscapePos: { xPct: 48, yPct: 80 },
        sizeFactor: 0.88,
      },
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
    title: 'Jungle Visitors',
    emoji: '🐯',
    backdrop: 'monkeys',
    badgeColor: '#F6CC9D',
    badgeAnimal: 'tiger',
    spots: [
      {
        id: 'cv-tiger',
        animal: 'tiger',
        xPct: 71,
        yPct: 80,
        tabletPortraitPos: { xPct: 71, yPct: 84 },
        landscapePos: { xPct: 57, yPct: 78 },
        sizeFactor: 1.0,
      },
      {
        id: 'cv-toucan',
        animal: 'toucan',
        xPct: 28,
        yPct: 14,
        tabletPortraitPos: { xPct: 29, yPct: 14 },
        landscapePos: { xPct: 21, yPct: 11 },
        sizeFactor: 0.92,
      },
      {
        id: 'cv-elephant',
        animal: 'elephant',
        xPct: 31,
        yPct: 82,
        tabletPortraitPos: { xPct: 31, yPct: 86 },
        landscapePos: { xPct: 25, yPct: 80 },
        sizeFactor: 1.06,
      },
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
    title: 'Reef Party',
    emoji: '🐙',
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
    title: 'Savanna Oasis',
    emoji: '🦁',
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
    title: 'Sanctuary Picnic',
    emoji: '🦩',
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
  const shouldMirror =
    loopVariant % 2 === 1 &&
    exhibit.backdrop !== 'monkeys' &&
    exhibit.backdrop !== 'farm';

  const mapped = exhibit.spots.map((spot) =>
    shouldMirror ? { ...spot, xPct: 100 - spot.xPct } : spot
  );

  if (difficulty === 1) {
    if (loopVariant % 2 === 1) {
      return [mapped[1], mapped[3]];
    }
    return [mapped[0], mapped[2]];
  }
  if (difficulty === 2) {
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

interface AmbientParticleSpec {
  leftPct: number;
  topPct: number;
  size: number;
  color: string;
  borderColor?: string;
  dx: number;
  dy: number;
  duration: number;
  isPetal?: boolean;
}

function getHabitatParticles(exhibit: ExhibitId): AmbientParticleSpec[] {
  switch (exhibit) {
    case 'aquarium':
      return [
        { leftPct: 14, topPct: 82, size: 15, color: 'rgba(225,252,255,0.48)', borderColor: '#FFFFFF', dx: 10, dy: -190, duration: 4800 },
        { leftPct: 24, topPct: 74, size: 10, color: 'rgba(225,252,255,0.42)', borderColor: '#FFFFFF', dx: -8, dy: -165, duration: 4100 },
        { leftPct: 68, topPct: 84, size: 14, color: 'rgba(225,252,255,0.45)', borderColor: '#FFFFFF', dx: -12, dy: -180, duration: 5200 },
        { leftPct: 84, topPct: 76, size: 11, color: 'rgba(225,252,255,0.40)', borderColor: '#FFFFFF', dx: 8, dy: -155, duration: 4400 },
        { leftPct: 48, topPct: 88, size: 9, color: 'rgba(225,252,255,0.40)', borderColor: '#FFFFFF', dx: 6, dy: -140, duration: 3900 },
      ];
    case 'arctic':
      return [
        { leftPct: 12, topPct: 8, size: 9, color: 'rgba(255,255,255,0.88)', dx: 20, dy: 210, duration: 6400 },
        { leftPct: 28, topPct: 16, size: 7, color: 'rgba(255,255,255,0.82)', dx: -16, dy: 190, duration: 5800 },
        { leftPct: 46, topPct: 6, size: 10, color: 'rgba(255,255,255,0.9)', dx: 18, dy: 230, duration: 7000 },
        { leftPct: 66, topPct: 14, size: 8, color: 'rgba(255,255,255,0.84)', dx: -20, dy: 200, duration: 6200 },
        { leftPct: 84, topPct: 10, size: 9, color: 'rgba(255,255,255,0.86)', dx: 14, dy: 220, duration: 6600 },
      ];
    case 'monkeys':
      return [
        { leftPct: 18, topPct: 30, size: 10, color: 'rgba(255, 244, 168, 0.78)', dx: 24, dy: -36, duration: 5200 },
        { leftPct: 42, topPct: 44, size: 8, color: 'rgba(255, 248, 190, 0.75)', dx: -22, dy: -28, duration: 4700 },
        { leftPct: 72, topPct: 32, size: 12, color: 'rgba(130, 194, 98, 0.72)', dx: -28, dy: 80, duration: 6200, isPetal: true },
        { leftPct: 84, topPct: 22, size: 10, color: 'rgba(255, 240, 150, 0.76)', dx: -18, dy: 34, duration: 5400 },
      ];
    case 'savanna':
      return [
        { leftPct: 16, topPct: 36, size: 9, color: 'rgba(255, 244, 186, 0.72)', dx: 42, dy: -16, duration: 6200 },
        { leftPct: 44, topPct: 24, size: 7, color: 'rgba(255, 238, 165, 0.68)', dx: 36, dy: -12, duration: 5500 },
        { leftPct: 68, topPct: 42, size: 10, color: 'rgba(255, 246, 196, 0.7)', dx: 48, dy: -18, duration: 6800 },
        { leftPct: 30, topPct: 58, size: 8, color: 'rgba(255, 240, 175, 0.66)', dx: 32, dy: -10, duration: 5800 },
      ];
    case 'sanctuary':
      return [
        { leftPct: 15, topPct: 14, size: 12, color: 'rgba(252, 198, 214, 0.86)', dx: 32, dy: 140, duration: 6000, isPetal: true },
        { leftPct: 40, topPct: 10, size: 11, color: 'rgba(255, 234, 178, 0.85)', dx: -26, dy: 155, duration: 6600, isPetal: true },
        { leftPct: 65, topPct: 16, size: 12, color: 'rgba(252, 198, 214, 0.84)', dx: 28, dy: 145, duration: 5800, isPetal: true },
        { leftPct: 86, topPct: 12, size: 10, color: 'rgba(202, 236, 186, 0.84)', dx: -24, dy: 135, duration: 6200, isPetal: true },
      ];
    case 'farm':
    default:
      return [
        { leftPct: 20, topPct: 28, size: 9, color: 'rgba(255, 252, 236, 0.85)', dx: 44, dy: -22, duration: 5800 },
        { leftPct: 50, topPct: 22, size: 8, color: 'rgba(255, 246, 194, 0.8)', dx: 38, dy: -14, duration: 5200 },
        { leftPct: 76, topPct: 34, size: 10, color: 'rgba(255, 252, 236, 0.82)', dx: 40, dy: -20, duration: 6400 },
        { leftPct: 36, topPct: 48, size: 7, color: 'rgba(255, 248, 212, 0.78)', dx: 34, dy: -12, duration: 5400 },
      ];
  }
}

/** Single GPU-accelerated pure-View ambient particle (zero SVG!) */
const AmbientParticle: React.FC<{ spec: AmbientParticleSpec; delayMs: number }> =
  React.memo(({ spec, delayMs }) => {
    const prog = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      prog.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(prog, {
            toValue: 1,
            duration: spec.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(prog, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [delayMs, prog, spec.duration]);

    const tx = prog.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, spec.dx * 0.6, spec.dx],
    });
    const ty = prog.interpolate({
      inputRange: [0, 1],
      outputRange: [0, spec.dy],
    });
    const opacity = prog.interpolate({
      inputRange: [0, 0.16, 0.82, 1],
      outputRange: [0, 0.9, 0.82, 0],
    });

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          width: spec.size,
          height: spec.isPetal ? spec.size * 0.68 : spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
          borderWidth: spec.borderColor ? 1.6 : 0,
          borderColor: spec.borderColor || 'transparent',
          opacity,
          transform: [{ translateX: tx }, { translateY: ty }],
        }}
      />
    );
  });

/**
 * Full-bleed edge-to-edge living Zoo Exhibit scenery for ALL 6 worlds!
 * Pure Image + GPU-accelerated View particles (zero full-screen SVGs).
 */
const FullBleedExhibitBackdrop: React.FC<{ exhibit: ExhibitId }> = React.memo(
  ({ exhibit }) => {
    const particles = useMemo(() => getHabitatParticles(exhibit), [exhibit]);
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={EXHIBIT_BACKDROP_MAP[exhibit]}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {particles.map((spec, idx) => (
          <AmbientParticle
            key={`${exhibit}-${idx}`}
            spec={spec}
            delayMs={idx * 650}
          />
        ))}
      </View>
    );
  }
);

/** Interactive scenery surprise burst when tapping open background in any habitat */
const HabitatSurpriseBurst: React.FC<{
  x: number;
  y: number;
  exhibit: ExhibitId;
}> = React.memo(({ x, y, exhibit }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const palette: Record<ExhibitId, string[]> = {
    monkeys: ['#8BD46E', '#FFE27A', '#A8E07E'],
    aquarium: ['#B8F2FF', '#FFFFFF', '#7FD8F2'],
    savanna: ['#FFE484', '#FFB966', '#FFF3B8'],
    sanctuary: ['#FBC2D4', '#FFF0B8', '#BCE8A8'],
    arctic: ['#FFFFFF', '#CBEFFF', '#E6F8FF'],
    farm: ['#FFF7D6', '#FFE074', '#FFFFFF'],
  };
  const colors = palette[exhibit];
  const dirs = [
    { dx: -34, dy: -28 },
    { dx: 0, dy: -44 },
    { dx: 34, dy: -26 },
    { dx: -26, dy: 14 },
    { dx: 26, dy: 14 },
  ];

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x, top: y, zIndex: 18 }}
    >
      {/* Expanding soft habitat ripple */}
      <Animated.View
        style={{
          position: 'absolute',
          left: -22,
          top: -22,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 2.5,
          borderColor: colors[0],
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.85] }),
            },
          ],
        }}
      />
      {/* Playful habitat droplets / petals / sparkles */}
      {dirs.map((d, idx) => {
        const sz = idx === 1 ? 13 : 10;
        const isBubble = exhibit === 'aquarium';
        return (
          <Animated.View
            key={idx}
            style={{
              position: 'absolute',
              left: -sz / 2,
              top: -sz / 2,
              width: sz,
              height: sz,
              borderRadius: sz / 2,
              backgroundColor: isBubble ? 'rgba(225,252,255,0.55)' : colors[idx % colors.length],
              borderWidth: isBubble ? 1.8 : 0,
              borderColor: '#FFFFFF',
              opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, d.dx],
                  }),
                },
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, d.dy],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.4, 1.15, 0.6],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
});

/** Cheerful storybook animal name pill that springs in above a matched/tapped animal */
const AnimalNamePill: React.FC<{ label: string }> = React.memo(({ label }) => {
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 190,
        useNativeDriver: true,
      }),
      Animated.delay(750),
      Animated.timing(fade, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, pop]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.namePill,
        {
          opacity: fade,
          transform: [
            {
              translateY: pop.interpolate({
                inputRange: [0, 1],
                outputRange: [12, -10],
              }),
            },
            {
              scale: pop.interpolate({
                inputRange: [0, 1],
                outputRange: [0.65, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.namePillText}>{label}!</Text>
    </Animated.View>
  );
});

/** Soft arrival banner briefly introducing each zoo habitat */
const ExhibitTitleBanner: React.FC<{ title: string; emoji: string }> = React.memo(
  ({ title, emoji }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }),
        Animated.delay(1350),
        Animated.timing(fade, {
          toValue: 0,
          duration: 360,
          useNativeDriver: true,
        }),
      ]).start();
    }, [anim, fade]);

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arrivalBanner,
          {
            opacity: fade,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-14, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.arrivalBannerText}>
          {emoji} {title}
        </Text>
      </Animated.View>
    );
  }
);

/** Soft golden shimmer + magnetic ring around silhouettes when dragging, hinting, or hovering */
const PulsingSilhouetteHalo: React.FC<{
  active: boolean;
  hovered: boolean;
  wiggleTick: number;
  size: number;
  children: React.ReactNode;
}> = ({ active, hovered, wiggleTick, size, children }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active && !hovered) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: hovered ? 360 : 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: hovered ? 360 : 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, hovered, pulse]);

  useEffect(() => {
    if (!wiggleTick) return;
    wiggle.setValue(0);
    Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: 85, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 110, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0.7, duration: 95, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 95, useNativeDriver: true }),
    ]).start();
  }, [wiggle, wiggleTick]);

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: hovered ? [0.46, 0.85] : [0.22, 0.56],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: hovered ? [1.02, 1.18] : [0.96, 1.12],
  });
  const wiggleRot = wiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: wiggleRot }],
      }}
    >
      {(active || hovered) && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: Math.round(size * (hovered ? 1.02 : 0.94)),
            height: Math.round(size * (hovered ? 1.02 : 0.94)),
            borderRadius: Math.round(size * 0.51),
            backgroundColor: hovered ? 'rgba(255, 226, 102, 0.52)' : '#FFE57F',
            borderWidth: hovered ? 3.5 : 0,
            borderColor: '#FFF7C2',
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
      )}
      {children}
    </Animated.View>
  );
};

/** Placed living exhibit animal: celebrates on snap & victory party, plus playful habitat tap reactions! */
const LivingExhibitAnimal: React.FC<{
  animal: ExhibitAnimalKind;
  size: number;
  seed: number;
  partyMode: boolean;
  onAnimalTap?: () => void;
}> = ({ animal, size, seed, partyMode, onAnimalTap }) => {
  const [animState, setAnimState] = useState<'celebrate' | 'idle'>('celebrate');
  const extraMove = useRef(new Animated.Value(0)).current;
  const [waterTick, setWaterTick] = useState(0);

  useEffect(() => {
    setAnimState('celebrate');
    const t = setTimeout(() => {
      setAnimState('idle');
    }, 980);
    return () => clearTimeout(t);
  }, [animal]);

  const triggerPlayfulMove = () => {
    if (WATER_ANIMALS.has(animal)) {
      setWaterTick(Date.now());
    }
    const lift = BIRD_ANIMALS.has(animal) ? -22 : -12;
    extraMove.setValue(0);
    Animated.sequence([
      Animated.timing(extraMove, {
        toValue: lift,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(extraMove, {
        toValue: 0,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={{ transform: [{ translateY: extraMove }] }}>
      <AnimatedZooAnimal
        state={partyMode ? 'celebrate' : animState}
        size={size}
        seed={seed}
        weight={getAnimalWeight(animal)}
        silentTap
        onTap={() => {
          triggerPlayfulMove();
          soundEngine.playAnimalSound(animal);
          setTimeout(() => soundEngine.speakWord(ANIMAL_LABELS[animal]), 180);
          onAnimalTap?.();
        }}
      >
        <ZooExhibitAnimalSvg animal={animal} size={size} />
      </AnimatedZooAnimal>
      {waterTick > 0 && (
        <HabitatSurpriseBurst
          key={waterTick}
          x={size * 0.5}
          y={size * 0.28}
          exhibit="aquarium"
        />
      )}
    </Animated.View>
  );
};

/**
 * Zoo Exhibits (Full-Bleed Living Storybook Habitats):
 * - All 6 worlds have ambient pure-View motion & tappable background surprises!
 * - "Who Lives Here?" silhouette clue tap + forgiving magnetic hover snap!
 * - Spoken animal names + playful name pills + persistent Zoo Passport progress!
 * - Synchronized victory animal chorus before CelebrationOverlay!
 */
export const ShapeSorterGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [stageIdx, setStageIdx] = useState(0);
  const [solvedExhibits, setSolvedExhibits] = useState<string[]>(() =>
    loadSavedSolvedExhibits()
  );
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [burstMap, setBurstMap] = useState<Record<string, number>>({});
  const [namePillMap, setNamePillMap] = useState<Record<string, number>>({});
  const [wiggleMap, setWiggleMap] = useState<Record<string, number>>({});
  const [trayItems, setTrayItems] = useState<ExhibitAnimalSpot[]>(() =>
    shuffle(getExhibitSpots(ZOO_EXHIBITS[0], 2, 0))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clueItemId, setClueItemId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [hintSlotId, setHintSlotId] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState(false);
  const [won, setWon] = useState(false);
  const [bannerTick, setBannerTick] = useState(1);
  const [surpriseBurst, setSurpriseBurst] = useState<{
    x: number;
    y: number;
    tick: number;
  } | null>(null);

  const slotRefs = useRef<Record<string, MeasurableNode>>({});
  const stageNodeRef = useRef<MeasurableNode>(null);
  const clueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentExhibit = ZOO_EXHIBITS[stageIdx % ZOO_EXHIBITS.length];
  const loopVariant = Math.floor(stageIdx / ZOO_EXHIBITS.length);
  const activeSpots = getExhibitSpots(currentExhibit, difficulty, loopVariant);
  const hitPadding =
    difficulty <= 2 ? (isTablet ? 86 : 66) : isTablet ? 74 : 56;

  useEffect(() => {
    return () => {
      if (clueTimerRef.current) clearTimeout(clueTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const startStage = useCallback(
    (nextIdx: number, nextDiff: Difficulty = difficulty) => {
      const ex = ZOO_EXHIBITS[nextIdx % ZOO_EXHIBITS.length];
      const nextLoop = Math.floor(nextIdx / ZOO_EXHIBITS.length);
      setStageIdx(nextIdx);
      setPlacedIds([]);
      setBurstMap({});
      setNamePillMap({});
      setWiggleMap({});
      setTrayItems(shuffle(getExhibitSpots(ex, nextDiff, nextLoop)));
      setSelectedId(null);
      setClueItemId(null);
      setDraggingId(null);
      setHoveredSlotId(null);
      setHintSlotId(null);
      setPartyMode(false);
      setWon(false);
      setSurpriseBurst(null);
      setBannerTick((t) => t + 1);
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

  // Synchronized Victory Chorus before CelebrationOverlay!
  useEffect(() => {
    if (placedIds.length === activeSpots.length && activeSpots.length > 0) {
      setPartyMode(true);

      let completedAllNow = false;
      setSolvedExhibits((prev) => {
        if (prev.includes(currentExhibit.id)) return prev;
        const next = [...prev, currentExhibit.id];
        saveSolvedExhibits(next);
        if (next.length === ZOO_EXHIBITS.length) {
          completedAllNow = true;
        }
        return next;
      });

      // Sparkle burst across all placed animals during the victory chorus!
      const chorusTimer = setTimeout(() => {
        const now = Date.now();
        const bursts: Record<string, number> = {};
        activeSpots.forEach((sp, i) => {
          bursts[sp.id] = now + i;
        });
        setBurstMap(bursts);
        soundEngine.playMatch();
      }, 360);

      const winTimer = setTimeout(() => {
        soundEngine.playWin();
        addStar(completedAllNow ? 2 : 1);
        setWon(true);
      }, 1520);

      return () => {
        clearTimeout(chorusTimer);
        clearTimeout(winTimer);
      };
    }
  }, [placedIds.length, activeSpots.length, addStar, currentExhibit.id]);

  const placeItem = useCallback(
    (itemId: string) => {
      const spot = currentExhibit.spots.find((s) => s.id === itemId);
      soundEngine.playSnap();
      if (spot) {
        collectSticker(spot.animal);
        setTimeout(() => soundEngine.playAnimalSound(spot.animal), 100);
        setTimeout(() => soundEngine.speakWord(ANIMAL_LABELS[spot.animal]), 320);
      }
      setSelectedId(null);
      setClueItemId(null);
      setDraggingId(null);
      setHintSlotId(null);
      setHoveredSlotId(null);
      setPlacedIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
      const now = Date.now();
      setBurstMap((prev) => ({ ...prev, [itemId]: now }));
      setNamePillMap((prev) => ({ ...prev, [itemId]: now }));
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

  /**
   * "Who Lives Here?" interactive silhouette tap:
   * - If the matching animal is already selected -> snaps it right in!
   * - If NO animal is selected yet -> wiggles the shadow, plays that animal's sound,
   *   and bounces the matching animal in the wooden dock as a playful clue!
   */
  const handleSlotTap = useCallback(
    (slotId: string) => {
      if (placedIds.includes(slotId)) return;
      soundEngine.unlock();

      if (selectedId === slotId) {
        placeItem(slotId);
        return;
      }

      if (selectedId) {
        soundEngine.playGentleBounce();
        setHintSlotId(selectedId);
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        hintTimerRef.current = setTimeout(() => {
          setHintSlotId((prev) => (prev === selectedId ? null : prev));
        }, 1200);
        return;
      }

      const spot = activeSpots.find((s) => s.id === slotId);
      if (spot) {
        soundEngine.playAnimalSound(spot.animal);
        setWiggleMap((prev) => ({ ...prev, [slotId]: Date.now() }));
        setClueItemId(slotId);
        if (clueTimerRef.current) clearTimeout(clueTimerRef.current);
        clueTimerRef.current = setTimeout(() => {
          setClueItemId((prev) => (prev === slotId ? null : prev));
        }, 1500);
      }
    },
    [activeSpots, placedIds, placeItem, selectedId]
  );

  const handlePieceTap = useCallback(
    (itemId: string) => {
      soundEngine.unlock();
      const spot = activeSpots.find((s) => s.id === itemId);
      if (spot) {
        soundEngine.playAnimalSound(spot.animal);
      }
      setClueItemId(null);
      setSelectedId((prev) => {
        const next = prev === itemId ? null : itemId;
        if (next) {
          setHintSlotId(next);
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          if (difficulty > 1) {
            hintTimerRef.current = setTimeout(() => {
              setHintSlotId((cur) => (cur === next ? null : cur));
            }, 1800);
          }
        } else {
          setHintSlotId(null);
        }
        return next;
      });
    },
    [activeSpots, difficulty]
  );

  const stageW = isTabletLandscape
    ? Math.min(720, Math.round(width * 0.64))
    : Math.min(680, width - 24);
  const stageH = isTabletLandscape
    ? Math.min(480, Math.max(320, height - 220))
    : isTablet
    ? Math.min(610, Math.max(360, height - 335))
    : Math.min(460, Math.max(300, height - 295));

  const baseSpotSize = isTablet ? 136 : 94;
  const trayAnimalSize = isTablet ? 114 : 80;
  const traySlotSize = isTablet ? 124 : 86;

  /** Playful habitat scenery surprise when tapping anywhere on open background */
  const handleStageBackdropTap = useCallback(
    (evt: {
      nativeEvent: {
        locationX?: number;
        locationY?: number;
        pageX?: number;
        pageY?: number;
      };
    }) => {
      soundEngine.unlock();
      const ne = evt.nativeEvent;
      let localX = typeof ne.locationX === 'number' ? ne.locationX : stageW * 0.5;
      let localY = typeof ne.locationY === 'number' ? ne.locationY : stageH * 0.5;

      if (
        Platform.OS === 'web' &&
        typeof ne.pageX === 'number' &&
        typeof ne.pageY === 'number' &&
        stageNodeRef.current
      ) {
        const raw = stageNodeRef.current as unknown as {
          getBoundingClientRect?: () => DOMRect;
          getNode?: () => HTMLElement;
        };
        const domEl =
          typeof raw.getBoundingClientRect === 'function'
            ? raw
            : typeof raw.getNode === 'function'
            ? raw.getNode()
            : null;
        const rect = domEl?.getBoundingClientRect?.();
        if (rect) {
          localX = ne.pageX - rect.left;
          localY = ne.pageY - rect.top;
        }
      }

      switch (currentExhibit.backdrop) {
        case 'aquarium':
          soundEngine.playBubblePop(Math.floor(Math.random() * 5));
          break;
        case 'arctic':
          soundEngine.playWaterSplash(Math.floor(Math.random() * 5));
          break;
        case 'sanctuary':
          soundEngine.playYumSparkle();
          break;
        case 'savanna':
          soundEngine.playStarCollect(Math.floor(Math.random() * 3));
          break;
        case 'farm':
          soundEngine.playCardFlip();
          break;
        default:
          soundEngine.playPop();
          break;
      }

      setSurpriseBurst({ x: localX, y: localY, tick: Date.now() });
    },
    [currentExhibit.backdrop, stageH, stageW]
  );

  const renderExhibitPicker = () => (
    <View
      style={[
        styles.scenePickerShell,
        isTabletLandscape && styles.scenePickerShellLandscape,
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
              accessibilityLabel={`Switch to ${ex.title}`}
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
        {/* Compact Zoo Passport progress badge */}
        <View style={styles.passportPill}>
          <Text style={styles.passportText}>
            🏅 {solvedExhibits.length}/{ZOO_EXHIBITS.length}
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderOpenStage = () => (
    <View
      ref={stageNodeRef}
      style={[styles.openStage, { width: stageW, height: stageH }]}
    >
      {/* Tappable habitat background behind animal spots for playful scenery surprises */}
      <Pressable
        onPress={handleStageBackdropTap}
        style={StyleSheet.absoluteFill}
        accessibilityLabel={`Explore ${currentExhibit.title}`}
      />

      {/* Scenery tap surprise burst */}
      {surpriseBurst && (
        <HabitatSurpriseBurst
          key={surpriseBurst.tick}
          x={surpriseBurst.x}
          y={surpriseBurst.y}
          exhibit={currentExhibit.backdrop}
        />
      )}

      {/* Brief habitat arrival pill */}
      <ExhibitTitleBanner
        key={`${currentExhibit.id}-${bannerTick}`}
        title={currentExhibit.title}
        emoji={currentExhibit.emoji}
      />

      {/* Victory chorus badge before CelebrationOverlay */}
      {partyMode && !won && (
        <View style={styles.partyBanner} pointerEvents="none">
          <Text style={styles.partyBannerText}>
            ✨ {currentExhibit.title} Complete! ✨
          </Text>
        </View>
      )}

      {activeSpots.map((spot, idx) => {
        const isPlaced = placedIds.includes(spot.id);
        const isDragShimmer =
          !isPlaced && draggingId === spot.id && difficulty <= 2;
        const isHovered = !isPlaced && hoveredSlotId === spot.id;
        const isSelectedEasy = !isPlaced && selectedId === spot.id && difficulty === 1;
        const isHighlighted =
          isHovered ||
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
              isPlaced
                ? `Tap ${ANIMAL_LABELS[spot.animal]}`
                : `Match ${ANIMAL_LABELS[spot.animal]} shape`
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
                  partyMode={partyMode}
                  onAnimalTap={() => {
                    const now = Date.now();
                    setBurstMap((prev) => ({ ...prev, [spot.id]: now }));
                    setNamePillMap((prev) => ({ ...prev, [spot.id]: now }));
                  }}
                />
              ) : (
                <PulsingSilhouetteHalo
                  active={isDragShimmer || isSelectedEasy}
                  hovered={isHovered}
                  wiggleTick={wiggleMap[spot.id] || 0}
                  size={animalPx}
                >
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
              {namePillMap[spot.id] && (
                <AnimalNamePill
                  key={namePillMap[spot.id]}
                  label={ANIMAL_LABELS[spot.animal]}
                />
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
      <View style={styles.woodenDockGloss} pointerEvents="none" />
      {trayItems.map((item, idx) => {
        const isPlaced = placedIds.includes(item.id);
        const isSelected = selectedId === item.id;
        const isClued = clueItemId === item.id;
        const isDragging = draggingId === item.id;
        return (
          <View
            key={`${stageIdx}-${difficulty}-${item.id}`}
            style={[
              styles.dockSlot,
              { width: traySlotSize, height: traySlotSize },
              isClued && styles.dockSlotClue,
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
                    state={isDragging ? 'dragging' : isClued ? 'calling' : 'idle'}
                    size={trayAnimalSize}
                    seed={idx + 11}
                    weight={getAnimalWeight(item.animal)}
                  >
                    <ZooExhibitAnimalSvg
                      animal={item.animal}
                      size={trayAnimalSize}
                      stickerRim
                      highlighted={isSelected || isClued}
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
        <>
          <View style={styles.landscapePickerWrap}>{renderExhibitPicker()}</View>
          <View style={styles.playAreaLandscape}>
            <View style={styles.landscapeLeft}>{renderOpenStage()}</View>
            <View style={styles.landscapeRight}>{renderCurvedDock()}</View>
          </View>
        </>
      ) : (
        <View style={styles.playArea}>
          {isTablet && renderExhibitPicker()}
          {renderOpenStage()}
          {renderCurvedDock()}
          {!isTablet && renderExhibitPicker()}
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
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 14,
    overflow: 'visible',
  },
  landscapePickerWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 2,
    zIndex: 20,
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
  arrivalBanner: {
    position: 'absolute',
    top: 4,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -108,
    width: 216,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  arrivalBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  partyBanner: {
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -130,
    width: 260,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FFF5C2',
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  partyBannerText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.woodDark,
    textAlign: 'center',
  },
  namePill: {
    position: 'absolute',
    top: -16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFF7D6',
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    zIndex: 40,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  namePillText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.woodDark,
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
    borderRadius: 28,
  },
  dockSlotClue: {
    backgroundColor: 'rgba(255, 234, 118, 0.42)',
    borderWidth: 3,
    borderColor: '#FFE066',
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
  scenePickerShellLandscape: {
    maxWidth: 880,
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
  passportPill: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 248, 224, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.34)',
    marginLeft: 2,
  },
  passportText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.woodDark,
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
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
