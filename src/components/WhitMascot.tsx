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
import Svg, { Ellipse, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { useOptionalApp } from '../context/AppContext';
import { soundEngine } from '../services/sound';
import { makeInstantTapProps } from '../utils/webTouch';
import {
  WhitAccessoryId,
  WhitAccessoryOverlay,
  WhitPoseKey,
} from './WhitAccessories';

export type WhitMood = 'idle' | 'wave' | 'happy' | 'cheer' | 'encourage' | 'trot';

export interface WhitMascotProps {
  mood?: WhitMood;
  size?: number;
  interactive?: boolean;
  onPress?: () => void;
  /** Optional explicit accessory override; defaults to current persisted Whit accessory */
  accessory?: WhitAccessoryId;
  /** If true, tapping Whit also cycles to his next unlocked hat/prop */
  cycleAccessoryOnTap?: boolean;
  /** Optional soft shadow ellipse beneath Whit's feet (defaults true) */
  showShadow?: boolean;
  /** Skip the brief crouch beat when leaping directly into cheer from a run/trot */
  skipIntroCrouch?: boolean;
}

const WHIT_FRAME_SOURCES: Record<WhitPoseKey, ReturnType<typeof require>> = {
  idle: STORYBOOK_ASSETS.whitIdle,
  blink: STORYBOOK_ASSETS.whitBlink,
  cheer: STORYBOOK_ASSETS.whitCheer,
  clap: STORYBOOK_ASSETS.whitClap,
  dance: STORYBOOK_ASSETS.whitDance,
  step: STORYBOOK_ASSETS.whitStep,
  trot: STORYBOOK_ASSETS.whitTrot,
};

const WHIT_FRAME_KEYS: WhitPoseKey[] = [
  'idle',
  'blink',
  'cheer',
  'clap',
  'dance',
  'step',
  'trot',
];

let framesPreloaded = false;

/**
 * Eagerly preload all seven Whit watercolor pose PNGs so pose swaps have zero flicker
 * during celebration dances, loading skips, blinks, and taps.
 */
export function preloadWhitFrames(): void {
  if (framesPreloaded) return;
  framesPreloaded = true;

  for (const key of WHIT_FRAME_KEYS) {
    const src = WHIT_FRAME_SOURCES[key];
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
      // Stacked pre-mounted Images below also keep all frames decoded in memory
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
  kind?: 'star' | 'note';
}> = ({ size, color, progress, startX, startY, driftX, riseY, kind = 'star' }) => {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, riseY],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, driftX, driftX * 0.75],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.18, 0.78, 1],
    outputRange: [0, 1, 0.95, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.25, 0.8, 1],
    outputRange: [0.35, 1.15, 0.95, 0.4],
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
        zIndex: 20,
      }}
    >
      {kind === 'note' ? (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path
            d="M 12 24 C 12 26.5 9.5 28 7 27.2 C 4.8 26.5 4.2 24.1 5.6 22.3 C 6.8 20.8 9.2 20.6 10.6 21.5 L 10.6 9.5 L 25 6.5 L 25 19.5 C 25 22 22.5 23.5 20 22.7 C 17.8 22 17.2 19.6 18.6 17.8 C 19.8 16.3 22.1 16.1 23.5 17 L 23.5 10.4 L 12 12.8 Z"
            fill={color}
            stroke="#5A3A1E"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path
            d="M 16 2 L 20.1 10.6 L 29.5 11.9 L 22.6 18.5 L 24.3 27.9 L 16 23.4 L 7.7 27.9 L 9.4 18.5 L 2.5 11.9 L 11.9 10.6 Z"
            fill={color}
            stroke="#A86E18"
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </Animated.View>
  );
};

interface ChoreoState {
  pose: WhitPoseKey;
  flipX: boolean;
}

/**
 * Animated Whit the Gorilla Mascot (`<WhitMascot />`):
 * - Continuous foot-anchored idle breathing squash-and-stretch + gentle ±2° rock + natural blinking.
 * - Full 7-beat Victory Celebration Dance (`mood="cheer"`): anticipation crouch (`step`) ->
 *   big star-jump (`cheer`) -> happy double-clap (`clap`) -> boogie right (`dance`) ->
 *   rhythm clap (`clap`) -> boogie left (mirrored `dance`) -> star-jump finale (`cheer`)
 *   accompanied by floating stars, musical notes, and a grounded dynamic shadow!
 * - Skipping adventure walk cycle (`mood="trot"`): rhythmic `step` <-> `trot` hops for loading screens!
 * - Playful Home tap reactions: alternates happily among star-jump, happy clap, and victory boogie.
 */
export const WhitMascot: React.FC<WhitMascotProps> = ({
  mood = 'idle',
  size = 154,
  interactive = true,
  onPress,
  accessory,
  cycleAccessoryOnTap = false,
  showShadow = true,
  skipIntroCrouch = false,
}) => {
  const app = useOptionalApp();
  const resolvedAccessory: WhitAccessoryId =
    accessory ?? app?.whitAccessory ?? 'none';

  // Foot-anchored breathing squash-and-stretch
  const breathScaleY = useRef(new Animated.Value(1)).current;
  const breathScaleX = useRef(new Animated.Value(1)).current;
  // Active dance/hop squash-and-stretch impulse
  const actionScaleY = useRef(new Animated.Value(1)).current;
  const actionScaleX = useRef(new Animated.Value(1)).current;
  // Gentle ±2° idle rock
  const rockAnim = useRef(new Animated.Value(0)).current;
  // Jump translateY & playful tilt/wiggle (-1..1 -> -10deg..10deg)
  const jumpY = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  // Floating celebration stars & musical notes (4 staggered tracks)
  const starA = useRef(new Animated.Value(0)).current;
  const starB = useRef(new Animated.Value(0)).current;
  const starC = useRef(new Animated.Value(0)).current;
  const noteD = useRef(new Animated.Value(0)).current;

  const [isBlinking, setIsBlinking] = useState(false);
  const [tapPose, setTapPose] = useState<WhitPoseKey | null>(null);
  const [choreo, setChoreo] = useState<ChoreoState>({ pose: 'idle', flipX: false });

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkScheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    preloadWhitFrames();
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (blinkScheduleRef.current) clearTimeout(blinkScheduleRef.current);
      if (blinkEndRef.current) clearTimeout(blinkEndRef.current);
    };
  }, []);

  const isChoreographed = mood === 'cheer' || mood === 'trot';
  const showSparkles = mood === 'cheer' || tapPose !== null;

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

  // 2. Natural randomized blinking every 3–5 seconds when in calm idle/wave mood
  useEffect(() => {
    if (isChoreographed || tapPose !== null) {
      setIsBlinking(false);
      if (blinkScheduleRef.current) clearTimeout(blinkScheduleRef.current);
      if (blinkEndRef.current) clearTimeout(blinkEndRef.current);
      return;
    }

    let cancelled = false;
    const scheduleNextBlink = () => {
      const delayMs = 2800 + Math.random() * 2200;
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
  }, [isChoreographed, tapPose]);

  // Helper: trigger floating stars & musical notes animation
  const runFloatingStars = useCallback(
    (loop: boolean) => {
      starA.setValue(0);
      starB.setValue(0);
      starC.setValue(0);
      noteD.setValue(0);

      const makeTrack = (val: Animated.Value, delay: number) => {
        const seq = Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1050,
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
        makeTrack(starB, 240),
        makeTrack(starC, 480),
        makeTrack(noteD, 720),
      ]);
      anim.start();
      return anim;
    },
    [starA, starB, starC, noteD]
  );

  // 3. Choreographed 7-Beat Celebration Victory Dance (`mood="cheer"`)
  useEffect(() => {
    if (mood !== 'cheer') return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const hopHeight = -Math.max(20, Math.round(size * 0.16));
    const smallHop = -Math.max(10, Math.round(size * 0.08));

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(t);
    };

    const pulseSquash = (sy: number, sx: number, dur = 120) => {
      Animated.parallel([
        Animated.timing(actionScaleY, {
          toValue: sy,
          duration: dur,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(actionScaleX, {
          toValue: sx,
          duration: dur,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    };

    const springBackScale = () => {
      Animated.parallel([
        Animated.spring(actionScaleY, {
          toValue: 1,
          friction: 5,
          tension: 190,
          useNativeDriver: true,
        }),
        Animated.spring(actionScaleX, {
          toValue: 1,
          friction: 5,
          tension: 190,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const runVictoryCycle = (firstCycle: boolean) => {
      if (cancelled) return;
      const offset = firstCycle && skipIntroCrouch ? -160 : 0;

      if (!(firstCycle && skipIntroCrouch)) {
        // Beat 0: Anticipation squash crouch (`step`)
        setChoreo({ pose: 'step', flipX: false });
        jumpY.setValue(0);
        wiggleAnim.setValue(0);
        pulseSquash(0.9, 1.09, 130);
      }

      // Beat 1: Big Joyful Star-Jump! (`cheer`)
      const startBigJump = () => {
        setChoreo({ pose: 'cheer', flipX: false });
        pulseSquash(1.08, 0.94, 140);
        Animated.sequence([
          Animated.spring(jumpY, {
            toValue: hopHeight,
            friction: 4.4,
            tension: 220,
            useNativeDriver: true,
          }),
          Animated.spring(jumpY, {
            toValue: 0,
            friction: 5,
            tension: 175,
            useNativeDriver: true,
          }),
        ]).start();
        schedule(springBackScale, 200);
      };

      if (firstCycle && skipIntroCrouch) {
        startBigJump();
      } else {
        schedule(startBigJump, 160);
      }

      // Beat 2: Happy Gorilla Double Clap! (`clap`)
      schedule(() => {
        setChoreo({ pose: 'clap', flipX: false });
        Animated.sequence([
          Animated.timing(jumpY, {
            toValue: smallHop,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jumpY, {
            toValue: 0,
            duration: 130,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jumpY, {
            toValue: smallHop,
            duration: 130,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jumpY, {
            toValue: 0,
            duration: 130,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        Animated.sequence([
          Animated.timing(wiggleAnim, { toValue: -0.45, duration: 130, useNativeDriver: true }),
          Animated.timing(wiggleAnim, { toValue: 0.45, duration: 150, useNativeDriver: true }),
          Animated.timing(wiggleAnim, { toValue: -0.35, duration: 130, useNativeDriver: true }),
          Animated.timing(wiggleAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
        ]).start();
      }, 720 + offset);

      // Beat 3: Victory Boogie Right! (`dance`)
      schedule(() => {
        setChoreo({ pose: 'dance', flipX: false });
        pulseSquash(1.05, 0.96, 110);
        Animated.parallel([
          Animated.sequence([
            Animated.spring(jumpY, {
              toValue: smallHop * 1.15,
              friction: 4.8,
              tension: 210,
              useNativeDriver: true,
            }),
            Animated.spring(jumpY, {
              toValue: 0,
              friction: 5.2,
              tension: 180,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(wiggleAnim, {
            toValue: 0.72,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        schedule(springBackScale, 180);
      }, 1360 + offset);

      // Beat 4: Mid-Dance Happy Clap Beat (`clap`)
      schedule(() => {
        setChoreo({ pose: 'clap', flipX: false });
        Animated.parallel([
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(jumpY, { toValue: smallHop * 0.75, duration: 110, useNativeDriver: true }),
            Animated.timing(jumpY, { toValue: 0, duration: 110, useNativeDriver: true }),
          ]),
        ]).start();
      }, 1880 + offset);

      // Beat 5: Victory Boogie Left! (mirrored `dance`)
      schedule(() => {
        setChoreo({ pose: 'dance', flipX: true });
        pulseSquash(1.05, 0.96, 110);
        Animated.parallel([
          Animated.sequence([
            Animated.spring(jumpY, {
              toValue: smallHop * 1.15,
              friction: 4.8,
              tension: 210,
              useNativeDriver: true,
            }),
            Animated.spring(jumpY, {
              toValue: 0,
              friction: 5.2,
              tension: 180,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(wiggleAnim, {
            toValue: -0.72,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
        schedule(springBackScale, 180);
      }, 2180 + offset);

      // Beat 6: Finale Star-Jump & Happy Wiggle! (`cheer`)
      schedule(() => {
        setChoreo({ pose: 'cheer', flipX: false });
        pulseSquash(1.07, 0.95, 130);
        Animated.parallel([
          Animated.sequence([
            Animated.spring(jumpY, {
              toValue: hopHeight * 1.05,
              friction: 4.2,
              tension: 225,
              useNativeDriver: true,
            }),
            Animated.spring(jumpY, {
              toValue: 0,
              friction: 5,
              tension: 170,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(wiggleAnim, { toValue: 0.65, duration: 120, useNativeDriver: true }),
            Animated.timing(wiggleAnim, { toValue: -0.65, duration: 140, useNativeDriver: true }),
            Animated.timing(wiggleAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
          ]),
        ]).start();
        schedule(springBackScale, 210);
      }, 2720 + offset);

      // Loop joyfully after a brief proud beaming beat
      schedule(() => runVictoryCycle(false), 3780 + offset);
    };

    runVictoryCycle(true);
    const starAnim = runFloatingStars(true);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      starAnim.stop();
      actionScaleX.setValue(1);
      actionScaleY.setValue(1);
    };
  }, [mood, size, skipIntroCrouch, jumpY, wiggleAnim, actionScaleX, actionScaleY, runFloatingStars]);

  // 4. Playful Skipping Walk Cycle (`mood="trot"` — used by Loading Screen!)
  useEffect(() => {
    if (mood !== 'trot') return;

    let cancelled = false;
    let stepTick = 0;
    const hopHeight = -Math.max(14, Math.round(size * 0.12));

    const tickStride = () => {
      if (cancelled) return;
      const isAirborne = stepTick % 2 === 1;
      stepTick += 1;

      if (isAirborne) {
        setChoreo({ pose: 'trot', flipX: false });
        Animated.parallel([
          Animated.timing(jumpY, {
            toValue: hopHeight,
            duration: 185,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0.45,
            duration: 185,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(actionScaleY, {
            toValue: 1.05,
            duration: 185,
            useNativeDriver: true,
          }),
          Animated.timing(actionScaleX, {
            toValue: 0.96,
            duration: 185,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setChoreo({ pose: 'step', flipX: false });
        Animated.parallel([
          Animated.timing(jumpY, {
            toValue: 2,
            duration: 175,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: -0.25,
            duration: 175,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(actionScaleY, {
            toValue: 0.92,
            duration: 175,
            useNativeDriver: true,
          }),
          Animated.timing(actionScaleX, {
            toValue: 1.07,
            duration: 175,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    tickStride();
    const intervalId = setInterval(tickStride, 210);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      jumpY.setValue(0);
      wiggleAnim.setValue(0);
      actionScaleX.setValue(1);
      actionScaleY.setValue(1);
    };
  }, [mood, size, jumpY, wiggleAnim, actionScaleX, actionScaleY]);

  // Reset jump & scale cleanly when returning to calm idle/wave mood
  useEffect(() => {
    if (!isChoreographed && tapPose === null) {
      jumpY.setValue(0);
      wiggleAnim.setValue(0);
      actionScaleX.setValue(1);
      actionScaleY.setValue(1);
      setChoreo({ pose: 'idle', flipX: false });
    }
  }, [isChoreographed, tapPose, jumpY, wiggleAnim, actionScaleX, actionScaleY]);

  // 5. Tap interaction: joyful bounce + alternating surprise pose (`cheer`, `clap`, `dance`) + giggle!
  const handlePress = useCallback(() => {
    if (!interactive) return;
    soundEngine.unlock();
    soundEngine.playGorillaGiggle();

    const tapPoses: WhitPoseKey[] = ['cheer', 'clap', 'dance'];
    const chosen = tapPoses[tapCountRef.current % tapPoses.length];
    tapCountRef.current += 1;

    setTapPose(chosen);
    setIsBlinking(false);

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      setTapPose(null);
    }, 920);

    const hopHeight = -Math.max(18, Math.round(size * 0.16));
    jumpY.stopAnimation();
    wiggleAnim.stopAnimation();
    jumpY.setValue(0);
    wiggleAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(jumpY, {
          toValue: hopHeight,
          friction: 4.4,
          tension: 235,
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
          toValue: -0.7,
          duration: 85,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: 0.7,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnim, {
          toValue: -0.45,
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
      soundEngine.speakWord(Math.random() < 0.5 ? 'Hi friend!' : "Let's play!");
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

  const activeFrame: WhitPoseKey = tapPose
    ? tapPose
    : isChoreographed
    ? choreo.pose
    : isBlinking
    ? 'blink'
    : 'idle';

  const flipX = !tapPose && isChoreographed && choreo.flipX;

  // Anchor squash-and-stretch and gentle rock near Whit's feet (bottom center)
  const footPivotY = size * 0.44;
  const rockDeg = rockAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });
  const wiggleDeg = wiggleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-9deg', '9deg'],
  });

  // Dynamic soft ground shadow shrinks gently when Whit leaps up!
  const shadowScaleX = jumpY.interpolate({
    inputRange: [-40, 0, 6],
    outputRange: [0.68, 1, 1.06],
    extrapolate: 'clamp',
  });
  const shadowOpacity = jumpY.interpolate({
    inputRange: [-40, 0, 6],
    outputRange: [0.1, 0.24, 0.28],
    extrapolate: 'clamp',
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
        {/* Soft grounded elliptical shadow beneath Whit's feet */}
        {showShadow && (
          <Animated.View
            style={[
              styles.groundShadow,
              {
                bottom: Math.max(0, size * 0.01),
                opacity: shadowOpacity,
                transform: [{ scaleX: shadowScaleX }],
              },
            ]}
          >
            <Svg
              width={size * 0.54}
              height={Math.max(12, size * 0.095)}
              viewBox="0 0 100 22"
            >
              <Ellipse cx="50" cy="11" rx="46" ry="8.5" fill="#6E5238" />
            </Svg>
          </Animated.View>
        )}

        {/* Floating celebration stars & playful musical notes */}
        {showSparkles && (
          <>
            <FloatingStar
              size={starSz}
              color="#FFD952"
              progress={starA}
              startX={size * 0.04}
              startY={size * 0.24}
              driftX={-12}
              riseY={-size * 0.28}
            />
            <FloatingStar
              size={Math.round(starSz * 1.14)}
              color="#FFB74D"
              progress={starB}
              startX={size * 0.78}
              startY={size * 0.18}
              driftX={14}
              riseY={-size * 0.31}
            />
            <FloatingStar
              size={Math.round(starSz * 0.88)}
              color="#FFF08A"
              progress={starC}
              startX={size * 0.44}
              startY={size * 0.04}
              driftX={-6}
              riseY={-size * 0.24}
            />
            <FloatingStar
              size={Math.round(starSz * 0.96)}
              color="#FF7BA9"
              progress={noteD}
              startX={size * 0.82}
              startY={size * 0.42}
              driftX={16}
              riseY={-size * 0.34}
              kind="note"
            />
          </>
        )}

        <Animated.View
          style={{
            width: size,
            height: size,
            transform: [
              { translateY: jumpY },
              // Foot-anchored pivot for squash-and-stretch + idle rock + dance tilt
              { translateY: footPivotY },
              { rotate: rockDeg },
              { rotate: wiggleDeg },
              { scaleX: breathScaleX },
              { scaleY: breathScaleY },
              { scaleX: actionScaleX },
              { scaleY: actionScaleY },
              { scaleX: flipX ? -1 : 1 },
              { translateY: -footPivotY },
            ],
          }}
        >
          {/* Stack all 7 preloaded PNG frames and toggle opacity for zero-flicker pose swaps */}
          {WHIT_FRAME_KEYS.map((key) => (
            <Image
              key={key}
              source={WHIT_FRAME_SOURCES[key]}
              fadeDuration={0}
              style={[
                styles.frameImg,
                { width: size, height: size, opacity: activeFrame === key ? 1 : 0 },
              ]}
              resizeMode="contain"
            />
          ))}
          <WhitAccessoryOverlay
            accessory={resolvedAccessory}
            mascotSize={size}
            pose={activeFrame}
            isCheering={activeFrame === 'cheer'}
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
  groundShadow: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  frameImg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
