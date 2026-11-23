import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { soundEngine } from '../services/sound';
import { makeInstantTapProps } from '../utils/webTouch';

export type ZooAnimalAnimState =
  | 'idle'
  | 'dragging'
  | 'calling'
  | 'celebrate'
  | 'static';

export type ZooAnimalWeight = 'light' | 'medium' | 'heavy';

export interface AnimatedZooAnimalProps {
  children?: React.ReactNode;
  /** Optional direct image source when not wrapping custom children */
  source?: ImageSourcePropType;
  /** Optional pixel size (also used to anchor squash-and-stretch near the animal's feet) */
  size?: number;
  state?: ZooAnimalAnimState;
  /** Seed for staggering phase & slightly varying loop duration so animals never sync robotically */
  seed?: number;
  weight?: ZooAnimalWeight;
  /** Optional tap handler — when provided (and not static/dragging), plays a spring hop + soft pop */
  onTap?: () => void;
  /** Set true if onTap plays its own custom animal sound */
  silentTap?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LIGHT_ANIMALS = new Set([
  'toucan',
  'frog',
  'monkey',
  'flamingo',
  'clownfish',
  'turtle',
  'puffin',
  'duck',
]);

const HEAVY_ANIMALS = new Set([
  'elephant',
  'panda',
  'lion',
  'hippo',
  'whale',
  'gorilla',
  'polarbear',
  'seal',
  'cow',
]);

/** Natural weight preset for each Whit's World animal */
export function getAnimalWeight(animal: string): ZooAnimalWeight {
  if (LIGHT_ANIMALS.has(animal)) return 'light';
  if (HEAVY_ANIMALS.has(animal)) return 'heavy';
  return 'medium';
}

function getTimingForWeight(weight: ZooAnimalWeight, seed: number): {
  breathHalfMs: number;
  swayHalfMs: number;
  swayDeg: number;
  stretchY: number;
  squashX: number;
  phaseDelayMs: number;
} {
  // Deterministic 0..1 jitter from seed (works with any positive/negative/float seed)
  const raw = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
  const jitter = raw - Math.floor(raw);

  // Full loop durations across 2.4s – 3.4s, tuned by weight
  let fullMs: number;
  let swayDeg: number;
  let stretchY: number;
  let squashX: number;

  if (weight === 'light') {
    fullMs = 2400 + jitter * 340; // 2.40s – 2.74s (quicker, bouncier)
    swayDeg = 2.0;
    stretchY = 1.038;
    squashX = 0.983;
  } else if (weight === 'heavy') {
    fullMs = 3060 + jitter * 340; // 3.06s – 3.40s (slower, steadier)
    swayDeg = 1.5;
    stretchY = 1.03;
    squashX = 0.988;
  } else {
    fullMs = 2720 + jitter * 340; // 2.72s – 3.06s
    swayDeg = 1.75;
    stretchY = 1.035;
    squashX = 0.985;
  }

  return {
    breathHalfMs: Math.round(fullMs / 2),
    swayHalfMs: Math.round((fullMs * 1.18) / 2),
    swayDeg,
    stretchY,
    squashX,
    phaseDelayMs: Math.round(jitter * 950),
  };
}

/**
 * Reusable animated zoo animal wrapper modeled after `<WhitMascot />`:
 * - Uses React Native's built-in `Animated` API (100% Expo Web & iOS safe).
 * - Keeps all motion transforms on an INNER `<Animated.View>` separate from outer
 *   drag/PanResponder wrappers so touch & drag hitboxes never drift or fight.
 * - Supports `'idle'`, `'dragging'`, `'calling'`, `'celebrate'`, and `'static'` states,
 *   weight-tuned staggered breathing, and playful tap-hop feedback.
 */
export const AnimatedZooAnimal: React.FC<AnimatedZooAnimalProps> = ({
  children,
  source,
  size,
  state = 'idle',
  seed = 1,
  weight = 'medium',
  onTap,
  silentTap = false,
  style,
}) => {
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current; // normalized -1..1 or degrees via map
  const tapHopY = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;

  const timing = getTimingForWeight(weight, seed);
  const footPivotY = (size ?? 100) * 0.44;
  const hopBase = Math.max(10, Math.round((size ?? 96) * 0.14));

  useEffect(() => {
    scaleX.stopAnimation();
    scaleY.stopAnimation();
    translateY.stopAnimation();
    rotateAnim.stopAnimation();

    if (state === 'static') {
      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      rotateAnim.setValue(0);
      return;
    }

    if (state === 'dragging') {
      // Pause idle sway cleanly and lift smoothly to 1.12x with a subtle 3deg tilt
      const liftAnim = Animated.parallel([
        Animated.spring(scaleX, {
          toValue: 1.12,
          friction: 5.5,
          tension: 210,
          useNativeDriver: true,
        }),
        Animated.spring(scaleY, {
          toValue: 1.12,
          friction: 5.5,
          tension: 210,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: -6,
          friction: 6,
          tension: 190,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 3,
          friction: 6,
          tension: 180,
          useNativeDriver: true,
        }),
      ]);
      liftAnim.start();
      return () => liftAnim.stop();
    }

    if (state === 'calling') {
      // Playful rhythmic double-hop + slight wiggle to draw a 3-year-old's eye
      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      rotateAnim.setValue(0);

      const callHop = -Math.round(hopBase * (weight === 'light' ? 1.15 : 0.95));
      const loop = Animated.loop(
        Animated.sequence([
          // Hop 1
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: callHop,
              duration: 185,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleY, {
              toValue: 1.07,
              duration: 185,
              useNativeDriver: true,
            }),
            Animated.timing(scaleX, {
              toValue: 0.95,
              duration: 185,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -4.5,
              duration: 185,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: 170,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleY, {
              toValue: 0.94,
              duration: 170,
              useNativeDriver: true,
            }),
            Animated.timing(scaleX, {
              toValue: 1.05,
              duration: 170,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 3.5,
              duration: 170,
              useNativeDriver: true,
            }),
          ]),
          // Hop 2
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: callHop * 1.08,
              duration: 195,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleY, {
              toValue: 1.08,
              duration: 195,
              useNativeDriver: true,
            }),
            Animated.timing(scaleX, {
              toValue: 0.94,
              duration: 195,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 4.5,
              duration: 195,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              friction: 5.2,
              tension: 180,
              useNativeDriver: true,
            }),
            Animated.spring(scaleY, {
              toValue: 1,
              friction: 5.5,
              tension: 180,
              useNativeDriver: true,
            }),
            Animated.spring(scaleX, {
              toValue: 1,
              friction: 5.5,
              tension: 180,
              useNativeDriver: true,
            }),
            Animated.spring(rotateAnim, {
              toValue: 0,
              friction: 5.5,
              tension: 180,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(520),
        ])
      );
      loop.start();
      return () => loop.stop();
    }

    if (state === 'celebrate') {
      // Two joyful spring bounces with a slight squash on landing
      scaleX.setValue(1);
      scaleY.setValue(1);
      translateY.setValue(0);
      rotateAnim.setValue(0);

      const bounceH = -Math.round(hopBase * (weight === 'heavy' ? 1.05 : 1.25));
      const celeb = Animated.sequence([
        // Bounce 1 up
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: bounceH,
            friction: 4.6,
            tension: 220,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.08,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleX, {
            toValue: 0.94,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -4,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Landing 1 squash
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 145,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.91,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(scaleX, {
            toValue: 1.08,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 3.5,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
        // Bounce 2 up
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: bounceH * 1.12,
            friction: 4.4,
            tension: 230,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1.09,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleX, {
            toValue: 0.93,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 4,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Landing 2 squash -> spring settle
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.92,
            duration: 105,
            useNativeDriver: true,
          }),
          Animated.timing(scaleX, {
            toValue: 1.07,
            duration: 105,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -2,
            duration: 115,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scaleY, {
            toValue: 1,
            friction: 5,
            tension: 170,
            useNativeDriver: true,
          }),
          Animated.spring(scaleX, {
            toValue: 1,
            friction: 5,
            tension: 170,
            useNativeDriver: true,
          }),
          Animated.spring(rotateAnim, {
            toValue: 0,
            friction: 5,
            tension: 170,
            useNativeDriver: true,
          }),
        ]),
      ]);

      celeb.start();
      return () => celeb.stop();
    }

    // Default `'idle'`: smoothly reset from drag/bounce, then staggered breathing & sway
    let cancelled = false;
    let breathLoop: Animated.CompositeAnimation | null = null;
    let swayLoop: Animated.CompositeAnimation | null = null;

    const resetAnim = Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1,
        friction: 6,
        tension: 165,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        friction: 6,
        tension: 165,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 165,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        friction: 6,
        tension: 165,
        useNativeDriver: true,
      }),
    ]);

    resetAnim.start();

    const startTimer = setTimeout(() => {
      if (cancelled) return;
      const swayDir = seed % 2 === 0 ? 1 : -1;

      breathLoop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleY, {
              toValue: timing.stretchY,
              duration: timing.breathHalfMs,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scaleX, {
              toValue: timing.squashX,
              duration: timing.breathHalfMs,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleY, {
              toValue: 1,
              duration: timing.breathHalfMs,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scaleX, {
              toValue: 1,
              duration: timing.breathHalfMs,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      swayLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: timing.swayDeg * swayDir,
            duration: timing.swayHalfMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -timing.swayDeg * swayDir,
            duration: timing.swayHalfMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      breathLoop.start();
      swayLoop.start();
    }, timing.phaseDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      resetAnim.stop();
      breathLoop?.stop();
      swayLoop?.stop();
    };
  }, [
    state,
    seed,
    weight,
    hopBase,
    timing.breathHalfMs,
    timing.swayHalfMs,
    timing.swayDeg,
    timing.stretchY,
    timing.squashX,
    timing.phaseDelayMs,
    scaleX,
    scaleY,
    translateY,
    rotateAnim,
  ]);

  const handleTap = useCallback(() => {
    if (state === 'static' || state === 'dragging') return;
    soundEngine.unlock();
    if (!silentTap) {
      soundEngine.playPop();
    }

    tapHopY.stopAnimation();
    tapScale.stopAnimation();
    tapHopY.setValue(0);
    tapScale.setValue(1);

    const quickHop = -Math.max(10, Math.round(hopBase * 0.9));
    Animated.parallel([
      Animated.sequence([
        Animated.spring(tapHopY, {
          toValue: quickHop,
          friction: 4.5,
          tension: 240,
          useNativeDriver: true,
        }),
        Animated.spring(tapHopY, {
          toValue: 0,
          friction: 5.2,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(tapScale, {
          toValue: 1.09,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.spring(tapScale, {
          toValue: 1,
          friction: 5,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onTap?.();
  }, [state, hopBase, tapHopY, tapScale, onTap, silentTap]);

  const rotateDeg = rotateAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const content =
    children ??
    (source ? (
      <Image
        source={source}
        style={{ width: size ?? 96, height: size ?? 96 }}
        resizeMode="contain"
      />
    ) : null);

  // Separate inner Animated.View keeps breathing/sway completely isolated from any outer drag container
  const animatedInner = (
    <Animated.View
      style={[
        styles.inner,
        style,
        state === 'static'
          ? null
          : {
              transform: [
                { translateY },
                { translateY: tapHopY },
                { scale: tapScale },
                // Anchor breathing squash-and-stretch + sway near the animal's feet
                { translateY: footPivotY },
                { rotate: rotateDeg },
                { scaleX },
                { scaleY },
                { translateY: -footPivotY },
              ],
            },
      ]}
    >
      {content}
    </Animated.View>
  );

  // Only wrap in Pressable when onTap is explicitly supplied (so drag containers never fight Pressable)
  if (onTap && state !== 'static' && state !== 'dragging') {
    const tap = makeInstantTapProps(handleTap);
    return (
      <Pressable
        onPress={tap.onPress}
        accessibilityRole="button"
        style={[styles.outer, tap.webStyle]}
        {...tap.webProps}
      >
        <View pointerEvents="none" style={styles.outer}>
          {animatedInner}
        </View>
      </Pressable>
    );
  }

  return <View style={styles.outer}>{animatedInner}</View>;
};

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
