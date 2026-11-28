import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS } from '../theme';
import { StarIcon } from './JungleArt';
import { SnapBurst } from './SnapBurst';
import { preloadWhitFrames, WhitMascot } from './WhitMascot';

interface WhitLoadingScreenProps {
  onComplete: () => void;
}

const STEP_STARS = [0.16, 0.36, 0.56, 0.76, 0.96];

const JungleLeafSvg: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Path
      d="M 7 31 C 9 14 21 7 34 7 C 33 21 25 32 10 33 Z"
      fill={color}
      stroke="#365A2B"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <Path
      d="M 8 32 Q 19 21 31 10"
      stroke="#365A2B"
      strokeWidth="1.8"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const DustPuffSvg: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size * 0.65} viewBox="0 0 46 30">
    <Circle cx="13" cy="18" r="8" fill="#FFF7DF" opacity="0.88" />
    <Circle cx="24" cy="14" r="10" fill="#FFFDF4" opacity="0.92" />
    <Circle cx="34" cy="19" r="7" fill="#FFF5D6" opacity="0.85" />
    <Ellipse cx="23" cy="22" rx="14" ry="5" fill="#FFFDF4" opacity="0.86" />
  </Svg>
);

/**
 * Sunlit Storybook Launch / Loading Animation starring Whit the Gorilla:
 * - Whit (wearing the child's saved hat!) skips happily across a golden jungle trail
 *   using his rhythmic `step` <-> `trot` watercolor walk cycle, kicking up soft dust puffs
 *   and lighting up 5 golden stepping-stone stars as the jungle vine progress bar fills.
 * - On arrival (100%), Whit leaps into his celebratory star-jump (`whit-cheer`) with a
 *   sparkle burst, then cross-fades seamlessly into Whit's World Home Screen!
 */
export const WhitLoadingScreen: React.FC<WhitLoadingScreenProps> = ({
  onComplete,
}) => {
  const { isTablet, width } = useResponsive();
  const [arrived, setArrived] = useState(false);
  const [litStars, setLitStars] = useState(0);
  const [burstTick, setBurstTick] = useState<number | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const plaqueScale = useRef(new Animated.Value(0.86)).current;
  const puffAnim = useRef(new Animated.Value(0)).current;
  const leafFloat = useRef(new Animated.Value(0)).current;

  const finishedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const trackWidth = Math.min(isTablet ? 460 : 320, Math.max(240, width - 56));
  const whitSize = isTablet ? 168 : 132;
  const travelSpan = Math.max(120, trackWidth - whitSize * 0.65);

  const floatingLeaves = useMemo(
    () => [
      { leftPct: 10, topPct: 14, size: 32, color: '#78C45E', dir: 1 },
      { leftPct: 84, topPct: 18, size: 28, color: '#9BD66A', dir: -1 },
      { leftPct: 18, topPct: 76, size: 26, color: '#63B353', dir: 1 },
      { leftPct: 82, topPct: 74, size: 30, color: '#8CCB61', dir: -1 },
    ],
    []
  );

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const triggerExit = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearAllTimers();
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  }, [clearAllTimers, onComplete, overlayOpacity]);

  const triggerArrivalFinale = useCallback(() => {
    if (finishedRef.current) return;
    setLitStars(STEP_STARS.length);
    setArrived(true);
    setBurstTick(Date.now());
    const t = setTimeout(triggerExit, 520);
    timersRef.current.push(t);
  }, [triggerExit]);

  useEffect(() => {
    preloadWhitFrames();

    // Gentle plaque pop-in
    Animated.spring(plaqueScale, {
      toValue: 1,
      friction: 5.5,
      tension: 120,
      useNativeDriver: true,
    }).start();

    // Ambient drifting jungle leaves
    const leafLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(leafFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(leafFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    leafLoop.start();

    // Repeating playful dust puff behind Whit's skipping feet
    const puffLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(puffAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(puffAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    puffLoop.start();

    // Sync stepping-stone stars lighting up as Whit trots past each milestone
    const runDuration = 1580;
    STEP_STARS.forEach((frac, idx) => {
      const t = setTimeout(() => {
        setLitStars((prev) => Math.max(prev, idx + 1));
      }, Math.round(runDuration * frac));
      timersRef.current.push(t);
    });

    // Main journey across the jungle trail
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: runDuration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        puffLoop.stop();
        triggerArrivalFinale();
      }
    });

    return () => {
      clearAllTimers();
      leafLoop.stop();
      puffLoop.stop();
    };
  }, [
    clearAllTimers,
    leafFloat,
    plaqueScale,
    progressAnim,
    puffAnim,
    triggerArrivalFinale,
  ]);

  // Allow impatient kids or grown-ups to tap anywhere after 450ms to jump straight into Home!
  const handleTapSkip = useCallback(() => {
    if (finishedRef.current) return;
    if (Date.now() - mountedAtRef.current < 450) return;
    clearAllTimers();
    progressAnim.stopAnimation();
    progressAnim.setValue(1);
    if (!arrived) {
      setLitStars(STEP_STARS.length);
      setArrived(true);
      setBurstTick(Date.now());
      const t = setTimeout(triggerExit, 220);
      timersRef.current.push(t);
    } else {
      triggerExit();
    }
  }, [arrived, clearAllTimers, progressAnim, triggerExit]);

  const whitTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-travelSpan * 0.5, travelSpan * 0.5],
  });

  const barFillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, trackWidth - 10],
  });

  const puffOpacity = puffAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.85, 0],
  });
  const puffScale = puffAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1.25],
  });
  const puffDriftX = puffAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, -54],
  });

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="auto"
      accessibilityLabel="Loading Whit's World"
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleTapSkip}
        accessibilityRole="button"
        accessibilityLabel="Tap to enter Whit's World"
      >
        {/* Full-bleed Painterly Jungle Backdrop */}
        <Image
          source={STORYBOOK_ASSETS.bgHome}
          style={styles.bgFull}
          resizeMode="cover"
        />
        <View style={styles.sunlitVeil} pointerEvents="none" />

        {/* Ambient Drifting Storybook Leaves */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {floatingLeaves.map((leaf, i) => {
            const ty = leafFloat.interpolate({
              inputRange: [0, 1],
              outputRange: [0, leaf.dir * 12],
            });
            const rot = leafFloat.interpolate({
              inputRange: [0, 1],
              outputRange: [
                `${leaf.dir * -12}deg`,
                `${leaf.dir * 14}deg`,
              ],
            });
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${leaf.leftPct}%`,
                  top: `${leaf.topPct}%`,
                  opacity: 0.78,
                  transform: [{ translateY: ty }, { rotate: rot }],
                }}
              >
                <JungleLeafSvg size={leaf.size} color={leaf.color} />
              </Animated.View>
            );
          })}
        </View>

        {/* Centered Welcome Stage */}
        <View style={styles.centerStage} pointerEvents="none">
          {/* Carved Wooden Storybook Title Sign */}
          <Animated.View
            style={[
              styles.titlePlaque,
              isTablet && styles.titlePlaqueTablet,
              { transform: [{ scale: plaqueScale }] },
            ]}
          >
            <View style={styles.rivetLeft} />
            <Text style={[styles.titleText, isTablet && styles.titleTextTablet]}>
              Whit’s World
            </Text>
            <View style={styles.rivetRight} />
          </Animated.View>

          {/* Animated Whit Skipping Along the Jungle Trail */}
          <View
            style={[
              styles.trailStage,
              { width: trackWidth, height: whitSize + 24 },
            ]}
          >
            <Animated.View
              style={[
                styles.runnerAnchor,
                {
                  width: whitSize,
                  height: whitSize,
                  transform: [{ translateX: whitTranslateX }],
                },
              ]}
            >
              {/* Soft Dust Puff Kicked Up While Skipping */}
              {!arrived && (
                <Animated.View
                  style={[
                    styles.dustPuff,
                    {
                      opacity: puffOpacity,
                      transform: [
                        { translateX: puffDriftX },
                        { scale: puffScale },
                      ],
                    },
                  ]}
                >
                  <DustPuffSvg size={isTablet ? 44 : 36} />
                </Animated.View>
              )}

              <WhitMascot
                mood={arrived ? 'cheer' : 'trot'}
                size={whitSize}
                interactive={false}
                showShadow
                skipIntroCrouch
              />

              {burstTick && (
                <View style={styles.burstCenter}>
                  <SnapBurst key={burstTick} size={isTablet ? 168 : 132} />
                </View>
              )}
            </Animated.View>
          </View>

          {/* Wooden Jungle Vine Progress Bar + 5 Stepping-Stone Stars */}
          <View style={[styles.barOuter, { width: trackWidth }]}>
            <Animated.View
              style={[
                styles.barFill,
                { width: barFillWidth },
              ]}
            >
              <View style={styles.barGloss} />
            </Animated.View>

            <View style={styles.starsOverlay}>
              {STEP_STARS.map((_, idx) => (
                <StarIcon
                  key={idx}
                  size={isTablet ? 24 : 20}
                  filled={idx < litStars}
                  color="#FFD952"
                />
              ))}
            </View>
          </View>

          {/* Warm Loading Caption Pill */}
          <View style={styles.captionPill}>
            <Text style={[styles.captionText, isTablet && { fontSize: 18 }]}>
              {arrived ? '✨ Let’s Play! ✨' : 'Waking up the zoo friends...'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2000,
    backgroundColor: '#EBF8E5',
    ...(Platform.OS === 'web'
      ? ({ userSelect: 'none', touchAction: 'manipulation' } as unknown as object)
      : null),
  },
  bgFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  sunlitVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 250, 232, 0.42)',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titlePlaque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#B57235',
    borderRadius: 26,
    borderWidth: 4,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 8,
    paddingHorizontal: 26,
    paddingVertical: 11,
    marginBottom: 18,
    shadowColor: '#2B1B0E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 10,
  },
  titlePlaqueTablet: {
    borderRadius: 32,
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginBottom: 26,
  },
  rivetLeft: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3D299',
    borderWidth: 2,
    borderColor: COLORS.woodDark,
  },
  rivetRight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3D299',
    borderWidth: 2,
    borderColor: COLORS.woodDark,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFDF5',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(54, 32, 12, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  titleTextTablet: {
    fontSize: 38,
  },
  trailStage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -4,
    overflow: 'visible',
  },
  runnerAnchor: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dustPuff: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    zIndex: 1,
  },
  burstCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  barOuter: {
    height: 34,
    borderRadius: 999,
    backgroundColor: '#F7E7C4',
    borderWidth: 3.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 6,
    padding: 3,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2B1B0E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#56B85C',
    overflow: 'hidden',
  },
  barGloss: {
    position: 'absolute',
    top: 3,
    left: 8,
    right: 8,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },
  starsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
  },
  captionPill: {
    marginTop: 18,
    backgroundColor: 'rgba(255, 251, 238, 0.92)',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: '#D9B67A',
    paddingHorizontal: 20,
    paddingVertical: 7,
    shadowColor: '#3B2818',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  captionText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
    letterSpacing: 0.2,
  },
});
