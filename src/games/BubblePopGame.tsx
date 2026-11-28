import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
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
import { StarIcon } from '../components/JungleArt';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty, getAnimalDisplayName } from '../theme';

const SEA_FRIENDS: ExhibitAnimalKind[] = [
  'whale',
  'turtle',
  'octopus',
  'clownfish',
  'frog',
];

const BUBBLE_SLOTS_6 = [
  { xPct: 20, yPct: 28 },
  { xPct: 50, yPct: 24 },
  { xPct: 80, yPct: 30 },
  { xPct: 24, yPct: 72 },
  { xPct: 54, yPct: 68 },
  { xPct: 81, yPct: 73 },
];

const BUBBLE_SLOTS_8 = [
  { xPct: 16, yPct: 26 },
  { xPct: 39, yPct: 24 },
  { xPct: 62, yPct: 28 },
  { xPct: 84, yPct: 25 },
  { xPct: 18, yPct: 72 },
  { xPct: 41, yPct: 70 },
  { xPct: 64, yPct: 74 },
  { xPct: 84, yPct: 70 },
];

type BubbleSpecialKind = 'normal' | 'rainbow' | 'golden' | 'mini';

interface BubbleItem {
  uid: string;
  slotIndex: number;
  animal: ExhibitAnimalKind;
  xPct: number;
  yPct: number;
  tint: string;
  rimTint: string;
  phase: number;
  special: BubbleSpecialKind;
}

const BUBBLE_PALETTES = [
  { tint: '#DDFBFF', rimTint: '#8FE8FF' },
  { tint: '#E8F4FF', rimTint: '#A9D6FF' },
  { tint: '#F6E8FF', rimTint: '#DEB8FF' },
  { tint: '#E2FFF4', rimTint: '#8FF0CC' },
  { tint: '#FFF0F7', rimTint: '#FFBDE0' },
];

function buildBubbles(
  difficulty: Difficulty,
  targetAnimal: ExhibitAnimalKind,
  roundSeed: number
): BubbleItem[] {
  const slots = difficulty === 3 ? BUBBLE_SLOTS_8 : BUBBLE_SLOTS_6;
  const targetCount = difficulty === 1 ? slots.length : difficulty === 2 ? 3 : 4;
  const otherAnimals = SEA_FRIENDS.filter((a) => a !== targetAnimal);

  const animals: ExhibitAnimalKind[] = [];
  if (difficulty === 1) {
    for (let i = 0; i < slots.length; i++) {
      animals.push(SEA_FRIENDS[(i + roundSeed) % SEA_FRIENDS.length]);
    }
  } else {
    for (let i = 0; i < targetCount; i++) {
      animals.push(targetAnimal);
    }
    for (let i = targetCount; i < slots.length; i++) {
      animals.push(otherAnimals[(i + roundSeed) % otherAnimals.length]);
    }
    for (let i = animals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [animals[i], animals[j]] = [animals[j], animals[i]];
    }
  }

  // Place one Giant Rainbow Surprise Bubble on slot 1 (center-top) or slot 4 so kids discover it right away!
  const rainbowSlot = roundSeed % 2 === 0 ? 1 : 4;
  // Place one Golden Star Surprise Bubble on another slot (always matching target on Med/Hard)
  const goldenSlot = roundSeed % 2 === 0 ? 5 : 2;

  return slots.map((slot, idx) => {
    const pal = BUBBLE_PALETTES[idx % BUBBLE_PALETTES.length];
    let special: BubbleSpecialKind = 'normal';
    let animal = animals[idx];

    if (idx === rainbowSlot) {
      special = 'rainbow';
      animal = difficulty === 1 ? animal : targetAnimal;
    } else if (idx === goldenSlot && difficulty >= 2) {
      special = 'golden';
      animal = targetAnimal;
    }

    return {
      uid: `b-${roundSeed}-${difficulty}-${idx}-${Date.now()}`,
      slotIndex: idx,
      animal,
      xPct: slot.xPct,
      yPct: slot.yPct,
      tint: pal.tint,
      rimTint: pal.rimTint,
      phase: idx * 320,
      special,
    };
  });
}

/** Tiny translucent ambient reef bubble gently rising through the sunlit water */
const AmbientSeaBubble: React.FC<{
  leftPct: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}> = ({ leftPct, size, duration, delay, drift }) => {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(prog, {
          toValue: 1,
          duration,
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
  }, [prog, duration, delay]);

  const translateY = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [24, -520],
  });
  const translateX = prog.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0, drift, -drift * 0.8, drift * 0.4],
  });
  const opacity = prog.interpolate({
    inputRange: [0, 0.14, 0.82, 1],
    outputRange: [0, 0.52, 0.44, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        bottom: 24,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.75)',
        backgroundColor: 'rgba(222, 251, 255, 0.32)',
        opacity,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
};

interface FloatingBubbleProps {
  bubble: BubbleItem;
  size: number;
  speedMs: number;
  highlighted: boolean;
  onPop: (b: BubbleItem) => boolean;
}

const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  bubble,
  size,
  speedMs,
  highlighted,
  onPop,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bobAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.28)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [popping, setPopping] = useState(false);

  const isRainbow = bubble.special === 'rainbow';
  const isGolden = bubble.special === 'golden';
  const isMini = bubble.special === 'mini';

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: isMini ? 4.4 : 5,
      tension: isMini ? 160 : 120,
      useNativeDriver: true,
    }).start();

    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, {
            toValue: 1,
            duration: isMini ? Math.round(speedMs * 0.72) : speedMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bobAnim, {
            toValue: 0,
            duration: isMini ? Math.round(speedMs * 0.72) : speedMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }, bubble.phase % 700);

    let shimmerLoop: Animated.CompositeAnimation | null = null;
    if (isRainbow || isGolden) {
      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
    }

    return () => {
      clearTimeout(timer);
      loop?.stop();
      shimmerLoop?.stop();
    };
  }, [bobAnim, scaleAnim, shimmerAnim, speedMs, bubble.phase, isRainbow, isGolden, isMini]);

  const translateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -13],
  });
  const translateX = bobAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-6, 7, -6],
  });
  const wobbleRotate = wobbleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const specialPulse = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  const poppedRef = useRef(false);
  const lastTriggerRef = useRef(0);

  const triggerPop = () => {
    if (poppedRef.current || popping) return;
    const now = Date.now();
    if (now - lastTriggerRef.current < 220) return;
    lastTriggerRef.current = now;

    soundEngine.unlock();
    const accepted = onPop(bubble);
    if (accepted) {
      poppedRef.current = true;
      setPopping(true);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: isRainbow ? 1.48 : 1.34,
          duration: 210,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.1,
          duration: 210,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const webBubbleTouchProps =
    Platform.OS === 'web'
      ? ({
          onTouchStart: (e: { stopPropagation?: () => void }) => {
            e.stopPropagation?.();
            triggerPop();
          },
          onPointerDown: (e: {
            pointerType?: string;
            preventDefault?: () => void;
            stopPropagation?: () => void;
          }) => {
            if (e.pointerType === 'touch') return;
            e.preventDefault?.();
            e.stopPropagation?.();
            triggerPop();
          },
        } as Record<string, unknown>)
      : {};

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [
            { translateY },
            { translateX },
            { scale: scaleAnim },
            { scale: isRainbow || isGolden ? specialPulse : 1 },
            { rotate: wobbleRotate },
          ],
        }}
      >
        <Pressable
          onPressIn={Platform.OS !== 'web' ? triggerPop : undefined}
          onPress={Platform.OS !== 'web' ? triggerPop : undefined}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel={
            isRainbow
              ? `Pop giant rainbow ${bubble.animal} bubble`
              : isGolden
              ? `Pop golden star ${bubble.animal} bubble`
              : isMini
              ? 'Pop mini rainbow bubble'
              : `Pop ${bubble.animal} bubble`
          }
          style={[
            {
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
            },
            Platform.OS === 'web'
              ? ({
                  cursor: 'pointer',
                  touchAction: 'none',
                  WebkitTapHighlightColor: 'transparent',
                } as unknown as object)
              : null,
          ]}
          {...webBubbleTouchProps}
        >
          {/* Pearlescent / Rainbow / Golden Watercolor Bubble */}
          <Svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Defs>
              <RadialGradient id={`bub-${uid}`} cx="34%" cy="28%" r="68%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.94" />
                <Stop
                  offset="0.42"
                  stopColor={
                    isGolden ? '#FFF3B0' : isRainbow ? '#FFE6FA' : bubble.tint
                  }
                  stopOpacity={isGolden ? '0.62' : '0.48'}
                />
                <Stop
                  offset="0.78"
                  stopColor={
                    isGolden ? '#FFD452' : isRainbow ? '#9CEBFF' : bubble.rimTint
                  }
                  stopOpacity={isGolden ? '0.52' : '0.46'}
                />
                <Stop
                  offset="0.94"
                  stopColor={isRainbow ? '#FFE08A' : '#FFE8B5'}
                  stopOpacity="0.62"
                />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.94" />
              </RadialGradient>
              <LinearGradient id={`rim-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <Stop
                  offset="0"
                  stopColor={isRainbow ? '#FF9CC2' : isGolden ? '#FFF399' : '#FFFFFF'}
                  stopOpacity="0.96"
                />
                <Stop
                  offset="0.35"
                  stopColor={isRainbow ? '#FFE37A' : isGolden ? '#F6C23B' : '#BCEEFF'}
                  stopOpacity="0.94"
                />
                <Stop
                  offset="0.68"
                  stopColor={isRainbow ? '#8CEBC1' : isGolden ? '#FFE680' : '#FFD4E9'}
                  stopOpacity="0.94"
                />
                <Stop
                  offset="1"
                  stopColor={isRainbow ? '#98C7FF' : isGolden ? '#E8A530' : '#FFF0B8'}
                  stopOpacity="0.96"
                />
              </LinearGradient>
            </Defs>

            {(highlighted || isRainbow || isGolden) && (
              <Circle
                cx="60"
                cy="60"
                r="57.5"
                fill="none"
                stroke={isGolden ? '#FFE066' : isRainbow ? `url(#rim-${uid})` : '#FFE375'}
                strokeWidth={isRainbow || isGolden ? 5 : 4.5}
                opacity="0.92"
              />
            )}

            <Circle
              cx="60"
              cy="60"
              r="53"
              fill={`url(#bub-${uid})`}
              stroke={highlighted ? '#FFE066' : `url(#rim-${uid})`}
              strokeWidth={isRainbow || isGolden ? 4.8 : highlighted ? 5 : 3.5}
            />
            {/* Glossy curved upper crescent highlight */}
            <Path
              d="M 27 42 Q 36 21 59 19"
              stroke="#FFFFFF"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.92"
            />
            <Circle cx="23" cy="54" r="4" fill="#FFFFFF" opacity="0.86" />
            {/* Warm lower rainbow bounce arc */}
            <Path
              d="M 74 96 Q 90 88 97 72"
              stroke={isRainbow ? '#FFB3DA' : '#FFF2C2'}
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.72"
            />
          </Svg>

          {/* Mini surprise bubble shows a twinkling star; normal/special show living sea friend */}
          {isMini ? (
            <View pointerEvents="none">
              <StarIcon size={Math.round(size * 0.46)} color="#FFE066" />
            </View>
          ) : (
            <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <AnimatedZooAnimal
                state={popping ? 'celebrate' : 'idle'}
                size={Math.round(size * 0.64)}
                seed={bubble.slotIndex + 3}
                weight={getAnimalWeight(bubble.animal)}
              >
                <ZooExhibitAnimalSvg
                  animal={bubble.animal}
                  size={Math.round(size * 0.64)}
                />
              </AnimatedZooAnimal>
              {isGolden && (
                <View style={styles.goldenBadge}>
                  <StarIcon size={Math.round(size * 0.24)} color="#FFD94A" />
                </View>
              )}
              {isRainbow && (
                <View style={styles.rainbowSparkleBadge}>
                  <StarIcon size={Math.round(size * 0.22)} color="#FF96C5" />
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Joyful splash & golden star burst when popped */}
      {popping && (
        <View style={styles.popStarBurst} pointerEvents="none">
          <SnapBurst size={Math.round(size * (isRainbow ? 1.35 : 1.1))} />
        </View>
      )}
    </View>
  );
};

/**
 * Bubble Pop Aquarium (Free Tier):
 * Tap shimmering rainbow watercolor bubbles floating in Whit's living Zoo Aquarium!
 * Includes Giant Rainbow Surprise Bubbles (split into 3 poppable mini-bubbles!)
 * and Golden Star Surprise Bubbles (+1 bonus Star Jar star & sparkle shower!).
 */
export const BubblePopGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetAnimal, setTargetAnimal] = useState<ExhibitAnimalKind>('whale');
  const [poppedCount, setPoppedCount] = useState(0);
  const [goldenBonusAwarded, setGoldenBonusAwarded] = useState(false);
  const [bubbles, setBubbles] = useState<BubbleItem[]>(() =>
    buildBubbles(2, 'whale', 0)
  );
  const [hintActive, setHintActive] = useState(false);
  const [won, setWon] = useState(false);

  const goalCount = difficulty === 1 ? 5 : difficulty === 2 ? 6 : 7;
  const speedMs = difficulty === 1 ? 2600 : difficulty === 2 ? 2000 : 1450;

  const startRound = useCallback(
    (nextRound: number, nextDiff: Difficulty = difficulty) => {
      const nextTarget = SEA_FRIENDS[nextRound % SEA_FRIENDS.length];
      setRoundIdx(nextRound);
      setTargetAnimal(nextTarget);
      setPoppedCount(0);
      setGoldenBonusAwarded(false);
      setBubbles(buildBubbles(nextDiff, nextTarget, nextRound));
      setHintActive(false);
      setWon(false);
    },
    [difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      setDifficulty(nextDiff);
      startRound(roundIdx, nextDiff);
    },
    [roundIdx, startRound]
  );

  useEffect(() => {
    if (poppedCount >= goalCount && !won) {
      const t = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setWon(true);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [poppedCount, goalCount, won, addStar]);

  // Speak warm guiding prompt when a Med/Hard target animal round starts (or Easy round 0)
  useEffect(() => {
    if (won) return;
    const t = setTimeout(() => {
      if (difficulty > 1) {
        soundEngine.speakWord(`Pop the ${getAnimalDisplayName(targetAnimal)} bubbles!`);
      } else if (roundIdx === 0) {
        soundEngine.speakWord('Pop the bubbles!');
      }
    }, 240);
    return () => clearTimeout(t);
  }, [difficulty, roundIdx, targetAnimal, won]);

  const handlePortholeTap = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playAnimalSound(targetAnimal);
    soundEngine.speakWord(`Pop the ${getAnimalDisplayName(targetAnimal)} bubbles!`);
    setHintActive(true);
    setTimeout(() => setHintActive(false), 1200);
  }, [targetAnimal]);

  const handlePopBubble = useCallback(
    (bubble: BubbleItem): boolean => {
      if (won) return false;

      // Special Rainbow, Golden, and Mini split bubbles ALWAYS pop joyfully!
      const isSpecial = bubble.special !== 'normal';
      const isMatch =
        isSpecial || difficulty === 1 || bubble.animal === targetAnimal;

      if (!isMatch) {
        soundEngine.playGentleBounce();
        soundEngine.speakWord(`Pop the ${getAnimalDisplayName(targetAnimal)} bubbles!`);
        setHintActive(true);
        setTimeout(() => {
          setHintActive(false);
        }, 1050);
        return false;
      }

      // Mini bubbles give joyful bonus pops without rushing the round prematurely
      const isMini = bubble.special === 'mini';
      const nextCount = isMini ? poppedCount : poppedCount + 1;

      if (bubble.special === 'rainbow') {
        soundEngine.playMatch();
        soundEngine.speakWord('Rainbow bubble!');
        collectSticker(bubble.animal);
      } else if (bubble.special === 'golden') {
        soundEngine.playStarCollect(4);
        soundEngine.speakWord('Golden star!');
        collectSticker(bubble.animal);
        if (!goldenBonusAwarded) {
          setGoldenBonusAwarded(true);
          addStar(1);
        }
      } else if (isMini) {
        soundEngine.playBubblePop(7 + Math.floor(Math.random() * 2));
      } else {
        soundEngine.playBubblePop(nextCount);
        collectSticker(bubble.animal);
        if (nextCount === 1 || nextCount % 2 === 0 || nextCount >= goalCount) {
          setTimeout(() => soundEngine.playAnimalSound(bubble.animal), 90);
        }
      }

      if (!isMini) {
        setPoppedCount(nextCount);
      }
      setHintActive(false);

      setTimeout(() => {
        setBubbles((prev) => {
          const remaining = prev.filter((item) => item.uid !== bubble.uid);

          // Giant Rainbow Bubble splits into 3 playful poppable mini-bubbles!
          if (bubble.special === 'rainbow' && nextCount < goalCount) {
            const offsets = [
              { dx: -13, dy: -9 },
              { dx: 13, dy: -7 },
              { dx: 0, dy: 12 },
            ];
            const minis: BubbleItem[] = offsets.map((off, i) => {
              const pal = BUBBLE_PALETTES[(i + 2) % BUBBLE_PALETTES.length];
              return {
                uid: `mini-${Date.now()}-${i}-${Math.random()}`,
                slotIndex: bubble.slotIndex,
                animal: bubble.animal,
                xPct: Math.max(12, Math.min(88, bubble.xPct + off.dx)),
                yPct: Math.max(16, Math.min(84, bubble.yPct + off.dy)),
                tint: pal.tint,
                rimTint: pal.rimTint,
                phase: i * 240,
                special: 'mini',
              };
            });
            return [...remaining, ...minis];
          }

          if (isMini || nextCount >= goalCount) return remaining;

          const hasTarget = remaining.some(
            (r) => r.special !== 'mini' && r.animal === targetAnimal
          );
          const nextAnimal =
            difficulty === 1
              ? SEA_FRIENDS[Math.floor(Math.random() * SEA_FRIENDS.length)]
              : !hasTarget || Math.random() < 0.68
              ? targetAnimal
              : SEA_FRIENDS.filter((a) => a !== targetAnimal)[
                  Math.floor(Math.random() * (SEA_FRIENDS.length - 1))
                ];
          const pal =
            BUBBLE_PALETTES[Math.floor(Math.random() * BUBBLE_PALETTES.length)];
          const hasGolden = remaining.some((r) => r.special === 'golden');
          const spawnGolden =
            !goldenBonusAwarded &&
            !hasGolden &&
            nextCount === Math.floor(goalCount / 2);

          return [
            ...remaining,
            {
              ...bubble,
              uid: `b-respawn-${bubble.slotIndex}-${Date.now()}-${Math.random()}`,
              animal: spawnGolden ? targetAnimal : nextAnimal,
              tint: pal.tint,
              rimTint: pal.rimTint,
              special: spawnGolden ? 'golden' : 'normal',
            },
          ];
        });
      }, 220);

      return true;
    },
    [
      won,
      difficulty,
      targetAnimal,
      poppedCount,
      goalCount,
      collectSticker,
      goldenBonusAwarded,
      addStar,
    ]
  );

  const tankW = Math.min(980, width - 24);
  const tankH = Math.max(320, height - (difficulty > 1 ? 196 : 120));

  const baseBubbleSize =
    difficulty === 3
      ? isTabletLandscape
        ? 124
        : isTablet
        ? 112
        : 84
      : isTabletLandscape
      ? 144
      : isTablet
      ? 134
      : 100;

  return (
    <View style={styles.container}>
      {/* Full-bleed edge-to-edge Warm Watercolor & Gouache Underwater Aquarium */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgAquarium}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {/* Soft seamless sunlit underwater shimmer fading smoothly from top */}
        <Svg
          width="100%"
          height={210}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={styles.waterSunbeam}
        >
          <Defs>
            <LinearGradient id="waterTopSun" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFBE0" stopOpacity="0.22" />
              <Stop offset="0.55" stopColor="#FFFBE0" stopOpacity="0.08" />
              <Stop offset="1" stopColor="#FFFBE0" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path d="M 0 0 H 100 V 100 H 0 Z" fill="url(#waterTopSun)" />
        </Svg>
        <AmbientSeaBubble leftPct={10} size={10} duration={7600} delay={0} drift={9} />
        <AmbientSeaBubble leftPct={28} size={7} duration={9200} delay={1600} drift={-8} />
        <AmbientSeaBubble leftPct={47} size={12} duration={8400} delay={2900} drift={11} />
        <AmbientSeaBubble leftPct={69} size={8} duration={7900} delay={900} drift={-10} />
        <AmbientSeaBubble leftPct={88} size={11} duration={8800} delay={2100} drift={7} />
      </View>

      <GameHeader
        totalSteps={goalCount}
        completedSteps={Math.min(poppedCount, goalCount)}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      <View style={styles.stageWrap}>
        {/* Tappable Warm Storybook Aquarium Porthole for Med & Hard */}
        {difficulty > 1 && (
          <TactileButton
            onPress={handlePortholeTap}
            accessibilityLabel={`Find ${targetAnimal} bubbles`}
            bounceScale={0.95}
          >
            <View
              style={[
                styles.targetPorthole,
                isTablet && styles.targetPortholeTablet,
                hintActive && styles.targetPortholeGlow,
              ]}
            >
              <View style={styles.portholeGloss} pointerEvents="none" />
              <View style={styles.portholeGlass}>
                <AnimatedZooAnimal
                  state={hintActive ? 'calling' : 'idle'}
                  size={isTablet ? 58 : 44}
                  seed={19}
                  weight={getAnimalWeight(targetAnimal)}
                >
                  <ZooExhibitAnimalSvg
                    animal={targetAnimal}
                    size={isTablet ? 58 : 44}
                  />
                </AnimatedZooAnimal>
              </View>
              <View style={styles.portholeStarsCol}>
                <StarIcon size={isTablet ? 24 : 19} color="#F4C542" />
              </View>
            </View>
          </TactileButton>
        )}

        {/* Full-bleed Interactive Bubble Field */}
        <View
          style={[
            styles.bubbleField,
            { width: tankW, height: tankH },
            Platform.OS === 'web'
              ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
              : null,
          ]}
        >
          {bubbles.map((b) => {
            const bSize =
              b.special === 'rainbow'
                ? Math.round(baseBubbleSize * 1.16)
                : b.special === 'mini'
                ? Math.round(baseBubbleSize * 0.56)
                : baseBubbleSize;
            const left = Math.round((b.xPct / 100) * tankW - bSize / 2);
            const top = Math.round((b.yPct / 100) * tankH - bSize / 2);
            const isHighlighted =
              hintActive &&
              (b.special !== 'normal' ||
                difficulty === 1 ||
                b.animal === targetAnimal);

            return (
              <View
                key={b.uid}
                style={[
                  styles.bubbleAnchor,
                  {
                    left,
                    top,
                    width: bSize,
                    height: bSize,
                    zIndex: b.special === 'mini' ? 25 : b.special === 'rainbow' ? 18 : 10,
                  },
                ]}
              >
                <FloatingBubble
                  bubble={b}
                  size={bSize}
                  speedMs={speedMs}
                  highlighted={isHighlighted}
                  onPop={handlePopBubble}
                />
              </View>
            );
          })}
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startRound(roundIdx + 1)}
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
  waterSunbeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  stageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetPorthole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(248, 229, 189, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 48, 0.45)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(116, 76, 38, 0.5)',
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#235975',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  portholeGloss: {
    position: 'absolute',
    top: 3,
    left: 16,
    right: 16,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 252, 240, 0.48)',
  },
  targetPortholeTablet: {
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  targetPortholeGlow: {
    backgroundColor: '#FFF0A8',
    borderColor: COLORS.sunBorder,
  },
  portholeGlass: {
    backgroundColor: '#D5F8FF',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: 'rgba(54, 148, 186, 0.65)',
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portholeStarsCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleField: {
    position: 'relative',
  },
  bubbleAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
  },
  rainbowSparkleBadge: {
    position: 'absolute',
    top: -6,
    left: -4,
  },
  popStarBurst: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
});
