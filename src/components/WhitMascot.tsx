import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { useOptionalApp } from '../context/AppContext';
import { soundEngine } from '../services/sound';
import { makeInstantTapProps } from '../utils/webTouch';
import { WhitAccessoryId, WhitAccessoryOverlay } from './WhitAccessories';

export type WhitMood = 'idle' | 'wave' | 'happy' | 'cheer' | 'encourage';

export interface WhitMascotProps {
  mood?: WhitMood;
  size?: number;
  interactive?: boolean;
  onPress?: () => void;
  /** Optional explicit accessory override; defaults to current persisted Whit accessory */
  accessory?: WhitAccessoryId;
  /** If true, tapping Whit also cycles to his next unlocked hat/prop */
  cycleAccessoryOnTap?: boolean;
}

type WhitFrame = 'idle' | 'blink' | 'cheer';

const WHIT_FRAMES = [
  STORYBOOK_ASSETS.whitIdle,
  STORYBOOK_ASSETS.whitBlink,
  STORYBOOK_ASSETS.whitCheer,
];

let framesPreloaded = false;

/**
 * Eagerly preload all three Whit expression PNGs so frame swaps have zero flicker
 * on Expo Web and iOS.
 */
function preloadWhitFrames(): void {
  if (framesPreloaded) return;
  framesPreloaded = true;

  for (const src of WHIT_FRAMES) {
    try {
      const resolved = Image.resolveAssetSource?.(src);
      const uri =
        resolved?.uri ??
        (typeof src === 'string'
          ? src
          : typeof src === 'object' && src !== null && 'uri' in src
          ? (src as { uri?: string }).uri
          : undefined);
      if (!uri) continue;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Image) {
        const img = new window.Image();
        img.src = uri;
      } else if (typeof Image.prefetch === 'function') {
        Image.prefetch(uri).catch(() => {});
      }
    } catch {
      // Ignore non-URI static handles; stacked pre-mounted Images below also keep frames decoded
    }
  }
}

const FloatingStar: React.FC<{
  size: number;
  color: string;
  progress: Animated.Value;
  startX: number;
  startY: number;
  driftX: number;
  riseY: number;
}> = ({ size, color, progress, startX, startY, driftX, riseY }) => {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, riseY],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, driftX, driftX * 0.7],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.18, 0.78, 1],
    outputRange: [0, 1, 0.95, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0.35, 1.12, 0.95, 0.4],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '22deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }, { rotate }],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path
          d="M 16 2 L 20.1 10.6 L 29.5 11.9 L 22.6 18.5 L 24.3 27.9 L 16 23.4 L 7.7 27.9 L 9.4 18.5 L 2.5 11.9 L 11.9 10.6 Z"
          fill={color}
          stroke="#A86E18"
          strokeWidth="2.1"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
};

/**
 * Reusable animated Whit the Gorilla Mascot (`<WhitMascot />`):
 * - Continuous foot-anchored idle squash-and-stretch breathing (`scaleY` 1.0->1.04, `scaleX` 1.0->0.98)
 *   plus a gentle 2-degree rock.
 * - Randomized natural eye blinks every 3–5 seconds (150ms `whit-blink.png` swap).
 * - Tap interaction: playful spring jump, quick 3-degree wiggle, cheerful sound, and
 *   `whit-cheer.png` for 900ms before landing smoothly back in idle.
 * - Celebration mode (`mood="cheer"`): two excited spring bounces in `whit-cheer.png`
 *   with floating golden stars.
 * - Preloads and stacks all 3 PNG frames for zero-flicker swaps on Expo Web and iOS.
 */
export const WhitMascot: React.FC<WhitMascotProps> = ({
  mood = 'idle',
  size = 154,
  interactive = true,
  onPress,
  accessory,
  cycleAccessoryOnTap = false,
}) => {
  const app = useOptionalApp();
  const resolvedAccessory: WhitAccessoryId =
    accessory ?? app?.whitAccessory ?? 'none';

  // Foot-anchored breathing squash-and-stretch
  const breathScaleY = useRef(new Animated.Value(1)).current;
  const breathScaleX = useRef(new Animated.Value(1)).current;
  // Gentle 2-degree idle rock
  const rockAnim = useRef(new Animated.Value(0)).current;
  // Jump translateY & quick 3-degree wiggle (shared by tap & celebration bounces)
  const jumpY = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  // Floating celebration stars (3 staggered tracks)
  const starA = useRef(new Animated.Value(0)).current;
  const starB = useRef(new Animated.Value(0)).current;
  const starC = useRef(new Animated.Value(0)).current;

  const [isBlinking, setIsBlinking] = useState(false);
  const [tapCheering, setTapCheering] = useState(false);

  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkScheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preloadWhitFrames();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (blinkScheduleRef.current) clearTimeout(blinkScheduleRef.current);
      if (blinkEndRef.current) clearTimeout(blinkEndRef.current);
    };
  }, []);

  const isCheering = mood === 'cheer' || tapCheering;

  // 1. Continuous soft idle breathing (scaleY 1.0->1.04, scaleX 1.0->0.98) + gentle ±2deg rock
  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathScaleY, {
            toValue: 1.04,
            duration: 1350,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathScaleX, {
            toValue: 0.98,
            duration: 1350,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(breathScaleY, {
            toValue: 1,
            duration: 1350,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathScaleX, {
            toValue: 1,
            duration: 1350,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const rockLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rockAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rockAnim, {
          toValue: -1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    breathLoop.start();
    rockLoop.start();

    return () => {
      breathLoop.stop();
      rockLoop.stop();
    };
  }, [breathScaleX, breathScaleY, rockAnim]);

  // 2. Natural randomized blinking every 3–5 seconds for 150ms
  useEffect(() => {
    if (isCheering) {
      setIsBlinking(false);
      if (blinkScheduleRef.current) clearTimeout(blinkScheduleRef.current);
      if (blinkEndRef.current) clearTimeout(blinkEndRef.current);
      return;
    }

    let cancelled = false;
    const scheduleNextBlink = () => {
      const delayMs = 3000 + Math.random() * 2000;
      blinkScheduleRef.current = setTimeout(() => {
        if (cancelled) return;
        setIsBlinking(true);
        blinkEndRef.current = setTimeout(() => {
          if (cancelled) return;
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150);
      }, delayMs);
    };

    scheduleNextBlink();
    return () => {
      cancelled = true;
      if (blinkScheduleRef.current) clearTimeout(blinkScheduleRef.current);
      if (blinkEndRef.current) clearTimeout(blinkEndRef.current);
    };
  }, [isCheering]);

  // Helper: trigger floating stars animation
  const runFloatingStars = useCallback(
    (loop: boolean) => {
      starA.setValue(0);
      starB.setValue(0);
      starC.setValue(0);

      const makeTrack = (val: Animated.Value, delay: number) => {
        const seq = Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 950,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]);
        return loop ? Animated.loop(seq) : seq;
      };

      const anim = Animated.parallel([
        makeTrack(starA, 0),
        makeTrack(starB, 220),
        makeTrack(starC, 420),
      ]);
      anim.start();
      return anim;
    },
    [starA, starB, starC]
  );

  // 3. Celebration mode (`mood="cheer"`): two excited spring bounces + floating stars
  useEffect(() => {
    if (mood !== 'cheer') {
      if (!tapCheering) {
        jumpY.setValue(0);
        wiggleAnim.setValue(0);
      }
      return;
    }

    const hopHeight = -Math.max(16, Math.round(size * 0.14));
    jumpY.setValue(0);
    wiggleAnim.setValue(0);

    const cheerBounces = Animated.sequence([
      // Bounce 1
      Animated.spring(jumpY, {
        toValue: hopHeight,
        friction: 4.5,
        tension: 210,
        useNativeDriver: true,
      }),
      Animated.spring(jumpY, {
        toValue: 0,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
      // Bounce 2
      Animated.spring(jumpY, {
        toValue: hopHeight * 1.08,
        friction: 4.2,
        tension: 220,
        useNativeDriver: true,
      }),
      Animated.spring(jumpY, {
        toValue: 0,
        friction: 5,
        tension: 170,
        useNativeDriver: true,
      }),
    ]);

    const cheerWiggle = Animated.sequence([
      Animated.timing(wiggleAnim, {
        toValue: -1,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnim, {
        toValue: -0.7,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnim, {
        toValue: 0.7,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]);

    cheerBounces.start();
    cheerWiggle.start();
    const starAnim = runFloatingStars(true);

    return () => {
      cheerBounces.stop();
      cheerWiggle.stop();
      starAnim.stop();
    };
  }, [mood, size, jumpY, wiggleAnim, tapCheering, runFloatingStars]);

  // 4. Tap interaction: playful spring jump + quick 3-degree wiggle + cheerful sound + 900ms whit-cheer.png
  const handlePress = useCallback(() => {
    if (!interactive) return;
    soundEngine.unlock();
    soundEngine.playGorillaGiggle();

    setTapCheering(true);
    setIsBlinking(false);

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      setTapCheering(false);
    }, 900);

    const hopHeight = -Math.max(18, Math.round(size * 0.15));
    jumpY.stopAnimation();
    wiggleAnim.stopAnimation();
    jumpY.setValue(0);
    wiggleAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(jumpY, {
          toValue: hopHeight,
          friction: 4.5,
          tension: 230,
          useNativeDriver: true,
        }),
        Animated.spring(jumpY, {
          toValue: 0,
          friction: 5.2,
          tension: 165,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(wiggleAnim, {
          toValue: -1,
          duration: 85,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 1,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -0.6,
          duration: 105,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    runFloatingStars(false);
    if (cycleAccessoryOnTap) {
      app?.cycleWhitAccessory();
    }
    onPress?.();
  }, [
    interactive,
    onPress,
    size,
    jumpY,
    wiggleAnim,
    runFloatingStars,
    cycleAccessoryOnTap,
    app,
  ]);

  const activeFrame: WhitFrame = isCheering
    ? 'cheer'
    : isBlinking
    ? 'blink'
    : 'idle';

  // Anchor squash-and-stretch and gentle rock near Whit's feet (bottom center)
  const footPivotY = size * 0.44;
  const rockDeg = rockAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const wiggleDeg = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const starSz = Math.max(18, Math.round(size * 0.16));

  const tap = makeInstantTapProps(interactive ? handlePress : undefined, !interactive);

  return (
    <Pressable
      onPress={tap.onPress}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : 'image'}
      accessibilityLabel="Whit the Gorilla"
      style={[styles.pressWrap, tap.webStyle]}
      {...tap.webProps}
    >
      <View
        pointerEvents="none"
        style={[styles.stage, { width: size, height: size }]}
      >
        {/* Floating celebration / giggle stars */}
        {isCheering && (
          <>
            <FloatingStar
              size={starSz}
              color="#FFD952"
              progress={starA}
              startX={size * 0.06}
              startY={size * 0.24}
              driftX={-10}
              riseY={-size * 0.28}
            />
            <FloatingStar
              size={Math.round(starSz * 1.15)}
              color="#FFB74D"
              progress={starB}
              startX={size * 0.78}
              startY={size * 0.18}
              driftX={12}
              riseY={-size * 0.3}
            />
            <FloatingStar
              size={Math.round(starSz * 0.85)}
              color="#FFF08A"
              progress={starC}
              startX={size * 0.44}
              startY={size * 0.06}
              driftX={-5}
              riseY={-size * 0.24}
            />
          </>
        )}

        <Animated.View
          style={{
            width: size,
            height: size,
            transform: [
              { translateY: jumpY },
              // Foot-anchored pivot for squash-and-stretch + 2° idle rock + 3° tap wiggle
              { translateY: footPivotY },
              { rotate: rockDeg },
              { rotate: wiggleDeg },
              { scaleX: breathScaleX },
              { scaleY: breathScaleY },
              { translateY: -footPivotY },
            ],
          }}
        >
          {/* Stack all 3 preloaded PNG frames and toggle opacity for zero-flicker frame swaps */}
          <Image
            source={STORYBOOK_ASSETS.whitIdle}
            fadeDuration={0}
            style={[
              styles.frameImg,
              { width: size, height: size, opacity: activeFrame === 'idle' ? 1 : 0 },
            ]}
            resizeMode="contain"
          />
          <Image
            source={STORYBOOK_ASSETS.whitBlink}
            fadeDuration={0}
            style={[
              styles.frameImg,
              { width: size, height: size, opacity: activeFrame === 'blink' ? 1 : 0 },
            ]}
            resizeMode="contain"
          />
          <Image
            source={STORYBOOK_ASSETS.whitCheer}
            fadeDuration={0}
            style={[
              styles.frameImg,
              { width: size, height: size, opacity: activeFrame === 'cheer' ? 1 : 0 },
            ]}
            resizeMode="contain"
          />
          <WhitAccessoryOverlay
            accessory={resolvedAccessory}
            mascotSize={size}
            isCheering={isCheering}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  frameImg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
