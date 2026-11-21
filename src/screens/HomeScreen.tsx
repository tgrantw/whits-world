import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { WhitMascot } from '../components/WhitMascot';
import {
  CrownIcon,
  FullscreenIcon,
  JungleBushCoverSvg,
  LockIcon,
  SoundIcon,
  StarIcon,
  WoodenSignpostSvg,
} from '../components/JungleArt';
import { PicnicTreatSvg } from '../components/PicnicTreats';
import { MiniStarJarIcon } from '../components/StarJarModal';
import { TactileButton } from '../components/TactileButton';
import { ZooAnimalSvg } from '../components/ZooAnimalsArt';
import { ZooExhibitAnimalSvg } from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, GameId, GAMES, UNLOCK_PRICE_DISPLAY } from '../theme';

/** Lightweight ambient firefly/sunlit sparkle drifting gently upward in the upper sky */
const SkyFirefly: React.FC<{
  leftPct: number;
  startTop: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}> = ({ leftPct, startTop, size, duration, delay, drift }) => {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(prog, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
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
    outputRange: [0, -78],
  });
  const translateX = prog.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, drift, -drift * 0.6],
  });
  const opacity = prog.interpolate({
    inputRange: [0, 0.22, 0.72, 1],
    outputRange: [0, 0.85, 0.75, 0],
  });
  const scale = prog.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.65, 1.15, 0.7],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: startTop,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#FFF7C2',
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
};

/** Storybook watercolor-palette butterfly fluttering softly across the upper canopy */
const CanopyButterfly: React.FC<{
  top: number;
  color: string;
  accent: string;
  duration: number;
  delay: number;
  reverse?: boolean;
}> = ({ top, color, accent, duration, delay, reverse = false }) => {
  const glide = useRef(new Animated.Value(0)).current;
  const flap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glideLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(glide, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glide, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const flapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flap, {
          toValue: 1,
          duration: 210,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flap, {
          toValue: 0,
          duration: 210,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    glideLoop.start();
    flapLoop.start();
    return () => {
      glideLoop.stop();
      flapLoop.stop();
    };
  }, [glide, flap, duration, delay]);

  const translateX = glide.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [360, -48] : [-48, 360],
  });
  const translateY = glide.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -18, 8, -14, 4],
  });
  const opacity = glide.interpolate({
    inputRange: [0, 0.08, 0.9, 1],
    outputRange: [0, 0.92, 0.92, 0],
  });
  const wingScaleX = flap.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.55],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity,
        transform: [
          { translateX },
          { translateY },
          { rotate: reverse ? '-12deg' : '12deg' },
          { scaleX: wingScaleX },
        ],
      }}
    >
      <Svg width={26} height={22} viewBox="0 0 36 30">
        <Ellipse cx="11" cy="12" rx="9" ry="7" fill={color} stroke="#5A3F2B" strokeWidth="1.6" />
        <Ellipse cx="25" cy="12" rx="9" ry="7" fill={color} stroke="#5A3F2B" strokeWidth="1.6" />
        <Ellipse cx="13" cy="20" rx="6" ry="5" fill={accent} stroke="#5A3F2B" strokeWidth="1.4" />
        <Ellipse cx="23" cy="20" rx="6" ry="5" fill={accent} stroke="#5A3F2B" strokeWidth="1.4" />
        <Ellipse cx="18" cy="15" rx="2.1" ry="8" fill="#5A3F2B" />
      </Svg>
    </Animated.View>
  );
};

/** Gentle ambient layer for the Home Screen: sunlit fireflies, butterflies, and swaying canopy leaves */
const HomeAmbientLayer: React.FC = () => {
  const leafSway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(leafSway, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(leafSway, {
          toValue: -1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [leafSway]);

  const leftLeafRot = leafSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3.5deg', '3.5deg'],
  });
  const rightLeafRot = leafSway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['3deg', '-3deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Subtle gently swaying corner jungle fronds */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -6,
          left: -12,
          opacity: 0.72,
          transform: [{ rotate: leftLeafRot }],
        }}
      >
        <Svg width={94} height={74} viewBox="0 0 94 74">
          <Path
            d="M 4 8 Q 48 4 78 36 Q 42 46 4 8 Z"
            fill="#6FA85A"
            stroke="#4A3525"
            strokeWidth="2.2"
          />
          <Path
            d="M 2 24 Q 34 26 52 56 Q 22 58 2 24 Z"
            fill="#88BC6A"
            stroke="#4A3525"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: -6,
          right: -12,
          opacity: 0.72,
          transform: [{ rotate: rightLeafRot }],
        }}
      >
        <Svg width={94} height={74} viewBox="0 0 94 74">
          <Path
            d="M 90 8 Q 46 4 16 36 Q 52 46 90 8 Z"
            fill="#6FA85A"
            stroke="#4A3525"
            strokeWidth="2.2"
          />
          <Path
            d="M 92 24 Q 60 26 42 56 Q 72 58 92 24 Z"
            fill="#88BC6A"
            stroke="#4A3525"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>

      {/* Soft sunlit sparkles / fireflies floating slowly upward in the sky */}
      <SkyFirefly leftPct={16} startTop={150} size={8} duration={4200} delay={0} drift={12} />
      <SkyFirefly leftPct={34} startTop={195} size={6} duration={4800} delay={900} drift={-10} />
      <SkyFirefly leftPct={66} startTop={175} size={9} duration={4500} delay={400} drift={14} />
      <SkyFirefly leftPct={82} startTop={142} size={7} duration={5100} delay={1400} drift={-12} />
      <SkyFirefly leftPct={48} startTop={130} size={6} duration={4400} delay={2000} drift={8} />

      {/* 2 gentle storybook butterflies fluttering across the upper canopy */}
      <CanopyButterfly
        top={74}
        color="#F8D459"
        accent="#F29E56"
        duration={11500}
        delay={200}
      />
      <CanopyButterfly
        top={118}
        color="#F29CB8"
        accent="#FAD9E4"
        duration={13800}
        delay={4200}
        reverse
      />
    </View>
  );
};

/** Playful spring entrance for the carved "Whit's World" wooden sign */
const AnimatedSignpost: React.FC<{ width: number; height: number; fontSize?: number }> = ({
  width,
  height,
  fontSize,
}) => {
  const enterScale = useRef(new Animated.Value(0.76)).current;
  const enterY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(enterScale, {
        toValue: 1,
        friction: 4.8,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(enterY, {
        toValue: 0,
        friction: 5.5,
        tension: 130,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterScale, enterY]);

  return (
    <Animated.View
      style={[
        styles.signpostWrap,
        { transform: [{ translateY: enterY }, { scale: enterScale }] },
      ]}
    >
      <WoodenSignpostSvg width={width} height={height} />
      <View style={styles.signTitleOverlay} pointerEvents="none">
        <Text style={[styles.appTitle, fontSize ? { fontSize } : null]}>
          Whit’s World
        </Text>
      </View>
    </Animated.View>
  );
};

const GameCardPreview: React.FC<{ id: GameId; scale?: number }> = ({
  id,
  scale = 1,
}) => {
  const s = (n: number) => Math.round(n * scale);
  switch (id) {
    case 'shape-sorter':
      return (
        <View style={styles.previewRow}>
          <AnimatedZooAnimal size={s(54)} seed={1} weight={getAnimalWeight('toucan')}>
            <ZooExhibitAnimalSvg animal="toucan" size={s(54)} />
          </AnimatedZooAnimal>
          <View style={{ marginTop: s(2) }}>
            <AnimatedZooAnimal size={s(58)} seed={2} weight={getAnimalWeight('monkey')}>
              <ZooExhibitAnimalSvg animal="monkey" size={s(58)} />
            </AnimatedZooAnimal>
          </View>
        </View>
      );
    case 'jungle-jigsaw': {
      const qSize = s(34);
      return (
        <View style={styles.jigsawFrameMini}>
          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <View style={[styles.jigsawMiniPiece, { width: qSize, height: qSize }]}>
                <ZooAnimalSvg animal="giraffe" size={qSize} quadrant={0} />
              </View>
              <View style={[styles.jigsawMiniPiece, { width: qSize, height: qSize }]}>
                <ZooAnimalSvg animal="giraffe" size={qSize} quadrant={1} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <View style={[styles.jigsawMiniPiece, { width: qSize, height: qSize }]}>
                <ZooAnimalSvg animal="giraffe" size={qSize} quadrant={2} />
              </View>
              <View style={[styles.jigsawMiniPiece, { width: qSize, height: qSize }]}>
                <ZooAnimalSvg animal="giraffe" size={qSize} quadrant={3} />
              </View>
            </View>
          </View>
        </View>
      );
    }
    case 'bubble-pop':
      return (
        <View style={styles.previewRow}>
          <View
            style={[
              styles.miniBubble,
              { width: s(54), height: s(54), borderRadius: s(27) },
            ]}
          >
            <AnimatedZooAnimal size={s(40)} seed={3} weight="heavy">
              <ZooExhibitAnimalSvg animal="whale" size={s(40)} />
            </AnimatedZooAnimal>
          </View>
          <View
            style={[
              styles.miniBubble,
              {
                width: s(46),
                height: s(46),
                borderRadius: s(23),
                marginTop: s(16),
              },
            ]}
          >
            <AnimatedZooAnimal size={s(34)} seed={4} weight="light">
              <ZooExhibitAnimalSvg animal="clownfish" size={s(34)} />
            </AnimatedZooAnimal>
          </View>
        </View>
      );
    case 'ball-pass': {
      const ballSz = s(40);
      return (
        <View style={[styles.previewRow, { alignItems: 'flex-end', gap: 6 }]}>
          <AnimatedZooAnimal size={s(54)} seed={5} weight={getAnimalWeight('lion')}>
            <ZooExhibitAnimalSvg animal="lion" size={s(54)} />
          </AnimatedZooAnimal>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: ballSz,
                height: ballSz,
                borderRadius: ballSz / 2,
                overflow: 'hidden',
              }}
            >
              <Image
                source={STORYBOOK_ASSETS.jungleBall}
                style={{ width: ballSz, height: ballSz }}
                resizeMode="cover"
              />
            </View>
            <View
              style={{
                width: Math.round(ballSz * 0.72),
                height: 6,
                borderRadius: 4,
                backgroundColor: 'rgba(60, 88, 48, 0.24)',
                marginTop: -3,
              }}
            />
          </View>
        </View>
      );
    }
    case 'animal-peekaboo':
      return (
        <View style={styles.previewRow}>
          <View style={styles.miniBushWrap}>
            <JungleBushCoverSvg size={s(52)} />
          </View>
          <View
            style={[
              styles.miniZooCard,
              {
                width: s(52),
                height: s(56),
                transform: [{ rotate: '6deg' }],
              },
            ]}
          >
            <AnimatedZooAnimal size={s(48)} seed={6} weight="medium">
              <ZooAnimalSvg animal="zebra" size={s(48)} />
            </AnimatedZooAnimal>
          </View>
        </View>
      );
    case 'size-sorter':
      return (
        <View style={[styles.previewRow, { alignItems: 'flex-end' }]}>
          <AnimatedZooAnimal size={s(30)} seed={7} weight="light">
            <ZooAnimalSvg animal="frog" size={s(30)} withBackdrop={false} />
          </AnimatedZooAnimal>
          <AnimatedZooAnimal size={s(44)} seed={8} weight="medium">
            <ZooAnimalSvg animal="monkey" size={s(44)} withBackdrop={false} />
          </AnimatedZooAnimal>
          <AnimatedZooAnimal size={s(58)} seed={9} weight="heavy">
            <ZooAnimalSvg animal="elephant" size={s(58)} withBackdrop={false} />
          </AnimatedZooAnimal>
        </View>
      );
    case 'baby-match':
      return (
        <View style={[styles.previewRow, { alignItems: 'flex-end' }]}>
          <AnimatedZooAnimal size={s(60)} seed={10} weight="heavy">
            <ZooExhibitAnimalSvg animal="elephant" size={s(60)} />
          </AnimatedZooAnimal>
          <View style={{ marginHorizontal: -s(8), marginBottom: s(26) }}>
            <Svg width={s(24)} height={s(24)} viewBox="0 0 40 40">
              <Path
                d="M 20 35 C 18 33 5 24 5 14 C 5 8.5 9.5 5 14.5 5 C 17.5 5 19.3 6.8 20 8.5 C 20.7 6.8 22.5 5 25.5 5 C 30.5 5 35 8.5 35 14 C 35 24 22 33 20 35 Z"
                fill="#FF5C8D"
                stroke="#9E1E4A"
                strokeWidth="3"
              />
            </Svg>
          </View>
          <AnimatedZooAnimal size={s(38)} seed={11} weight="light">
            <ZooExhibitAnimalSvg animal="elephant" size={s(38)} />
          </AnimatedZooAnimal>
        </View>
      );
    case 'jungle-music':
      return (
        <View style={styles.previewStack}>
          <View style={{ marginBottom: -s(4), zIndex: 2 }}>
            <AnimatedZooAnimal size={s(44)} seed={12} weight="light">
              <ZooExhibitAnimalSvg animal="monkey" size={s(44)} />
            </AnimatedZooAnimal>
          </View>
          <View style={styles.miniXyloRow}>
            {[
              { c: '#F25C5C', h: s(34) },
              { c: '#FF9240', h: s(30) },
              { c: '#FFD952', h: s(26) },
              { c: '#4CC969', h: s(22) },
              { c: '#45B8FF', h: s(18) },
            ].map((b, i) => (
              <View
                key={i}
                style={[
                  styles.miniXyloBar,
                  {
                    width: s(14),
                    height: b.h,
                    backgroundColor: b.c,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      );
    case 'arctic-catch':
      return (
        <View style={[styles.previewRow, { alignItems: 'flex-end', gap: 4 }]}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ marginBottom: -s(6), zIndex: 2 }}>
              <AnimatedZooAnimal size={s(52)} seed={13} weight="medium">
                <ZooExhibitAnimalSvg animal="penguin" size={s(52)} />
              </AnimatedZooAnimal>
            </View>
            <Svg width={s(66)} height={s(18)} viewBox="0 0 66 18">
              <Path
                d="M 4 8 Q 33 2 62 8 L 57 15 Q 33 18 9 15 Z"
                fill="#E8F8FD"
                stroke="#4A3525"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={{ marginBottom: s(18) }}>
            <Svg width={s(38)} height={s(38)} viewBox="0 0 54 54">
              <Path
                d="M 14 27 L 5 18 Q 8 27 5 36 Z"
                fill="#EE8B6B"
                stroke="#4A3525"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Path
                d="M 13 27 C 16 14 36 12 47 25 C 49 27 49 28 47 30 C 36 42 16 40 13 27 Z"
                fill="#6AC4DF"
                stroke="#4A3525"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <Circle cx="38" cy="25" r="2.6" fill="#4A3525" />
              <Circle cx="39" cy="24" r="0.9" fill="#FFFFFF" />
            </Svg>
          </View>
        </View>
      );
  }
};

export const HomeScreen: React.FC = () => {
  const {
    isUnlocked,
    isMuted,
    starsEarned,
    hasNewAccessory,
    toggleMute,
    openGame,
    openParentGate,
    openStarJar,
  } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const canFullscreen =
    Platform.OS === 'web' &&
    typeof document !== 'undefined' &&
    Boolean(document.fullscreenEnabled);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    canFullscreen ? Boolean(document.fullscreenElement) : false
  );

  useEffect(() => {
    if (!canFullscreen) return;
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, [canFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!canFullscreen) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      document.documentElement?.requestFullscreen?.().catch(() => {});
    }
  }, [canFullscreen]);

  const previewScale = isTabletLandscape ? 1.06 : isTablet ? 1.1 : 0.96;
  const mascotSize = isTabletLandscape ? 186 : isTablet ? 184 : 148;
  const signW = isTabletLandscape ? 278 : isTablet ? 310 : 268;
  const signH = isTabletLandscape ? 76 : isTablet ? 84 : 72;

  const renderUnlockBanner = () =>
    !isUnlocked ? (
      <TactileButton
        onPress={() => openParentGate(null)}
        accessibilityLabel={`Unlock all games for ${UNLOCK_PRICE_DISPLAY}`}
        style={[
          styles.unlockWrap,
          isTabletLandscape && { marginTop: 12 },
        ]}
      >
        <View
          style={[
            styles.unlockPlaque,
            isTablet && styles.unlockPlaqueTablet,
            starsEarned >= 3 && { borderColor: COLORS.sunGold, borderWidth: 3 },
          ]}
        >
          <View style={styles.unlockLeft}>
            <View
              style={[
                styles.crownCircle,
                isTablet && { width: 44, height: 44, borderRadius: 22 },
              ]}
            >
              <CrownIcon size={isTablet ? 25 : 22} color="#FFD23F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.unlockTitle,
                  isTablet && { fontSize: 15.5 },
                ]}
              >
                Unlock All 9 Zoo Games ({UNLOCK_PRICE_DISPLAY})
              </Text>
              <Text
                style={[
                  styles.unlockSub,
                  isTablet && { fontSize: 12.5 },
                ]}
              >
                One-time • No subscriptions • Ad-free & offline
              </Text>
            </View>
          </View>
          <View style={styles.unlockLockPill}>
            {starsEarned >= 3 ? (
              <StarIcon size={17} color={COLORS.sunGold} />
            ) : (
              <LockIcon size={16} color={COLORS.woodDark} />
            )}
          </View>
        </View>
      </TactileButton>
    ) : (
      <TactileButton
        onPress={() => openParentGate(null)}
        accessibilityLabel="Open Parent Corner"
        style={[
          styles.footerWrap,
          isTabletLandscape && { marginTop: 12 },
        ]}
      >
        <View style={styles.unlockedFooterPill}>
          <CrownIcon size={19} color="#FFD23F" />
          <Text style={styles.unlockedFooterText}>
            All 9 Zoo Games Unlocked • Parent Corner
          </Text>
        </View>
      </TactileButton>
    );

  const renderGameGrid = () => (
    <View
      style={[
        styles.grid,
        isTabletLandscape
          ? styles.gridTabletLandscape
          : isTablet
          ? styles.gridTablet
          : null,
      ]}
    >
      {GAMES.map((game) => {
        const locked = !game.isFree && !isUnlocked;

        return (
          <TactileButton
            key={game.id}
            onPress={() => openGame(game.id, game.isFree)}
            accessibilityLabel={
              locked ? `${game.title} (Locked)` : `Play ${game.title}`
            }
            style={
              isTabletLandscape
                ? styles.cardColumnTabletLandscape
                : isTablet
                ? styles.cardColumnTablet
                : styles.cardColumnPhone
            }
          >
            <View
              style={[
                styles.plaqueOuter,
                isTablet && styles.plaqueOuterTablet,
                {
                  backgroundColor: game.plaqueBg,
                  borderColor: game.plaqueBorder,
                },
                locked && styles.plaqueLocked,
              ]}
            >
              {/* Brass wooden plaque pins */}
              <View style={[styles.pinDot, styles.pinTL]} />
              <View style={[styles.pinDot, styles.pinTR]} />

              {/* Lock or Sparkle Star Badge */}
              {locked ? (
                <View
                  style={[
                    styles.lockBadge,
                    isTablet && styles.lockBadgeTablet,
                  ]}
                >
                  <LockIcon size={isTablet ? 18 : 15} color="#7A4800" />
                </View>
              ) : !game.isFree ? (
                <View style={styles.unlockedSparkle}>
                  <StarIcon size={isTablet ? 22 : 19} color="#FFD23F" />
                </View>
              ) : null}

              {/* Warm recessed storybook exhibit preview */}
              <View
                style={[
                  styles.plaqueInner,
                  isTabletLandscape
                    ? styles.plaqueInnerLandscape
                    : isTablet
                    ? styles.plaqueInnerTablet
                    : null,
                  { backgroundColor: game.plaqueInner },
                  locked && { opacity: 0.84 },
                ]}
              >
                <GameCardPreview id={game.id} scale={previewScale} />
              </View>

              <Text
                style={[
                  styles.gameTitle,
                  isTabletLandscape
                    ? styles.gameTitleLandscape
                    : isTablet
                    ? styles.gameTitleTablet
                    : null,
                ]}
                numberOfLines={1}
              >
                {game.title}
              </Text>
            </View>
          </TactileButton>
        );
      })}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        isTabletLandscape
          ? styles.containerTabletLandscape
          : isTablet
          ? styles.containerTabletPortrait
          : null,
      ]}
    >
      <HomeAmbientLayer />

      {/* Top Bar: Interactive Glowing Star Jar Toybox + Quiet Parent Corner */}
      <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
        <TactileButton
          onPress={openStarJar}
          accessibilityLabel={`Open Whit's Star Jar (${starsEarned} stars)`}
          style={{ minWidth: isTablet ? 104 : 88 }}
        >
          <View
            style={[
              styles.starPlaque,
              isTablet && styles.starPlaqueTablet,
              hasNewAccessory && styles.starPlaqueGiftGlow,
            ]}
          >
            <MiniStarJarIcon
              starsEarned={starsEarned}
              size={isTablet ? 36 : 30}
            />
            <Text
              style={[
                styles.starCountText,
                isTablet && { fontSize: 22 },
              ]}
            >
              {starsEarned}
            </Text>
            {hasNewAccessory && <View style={styles.newGiftDot} />}
          </View>
        </TactileButton>

        <View style={[styles.parentCorner, isTablet && { gap: 12 }]}>
          {canFullscreen && (
            <TactileButton
              onPress={toggleFullscreen}
              accessibilityLabel={
                isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
              }
              style={{ width: isTablet ? 52 : 44 }}
            >
              <View
                style={[
                  styles.woodenIconPill,
                  isTablet && { width: 52, height: 52, borderRadius: 20 },
                ]}
              >
                <FullscreenIcon
                  active={isFullscreen}
                  size={isTablet ? 24 : 20}
                  color={COLORS.woodDark}
                />
              </View>
            </TactileButton>
          )}

          <TactileButton
            onPress={toggleMute}
            accessibilityLabel={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            style={{ width: isTablet ? 52 : 44 }}
          >
            <View
              style={[
                styles.woodenIconPill,
                isTablet && { width: 52, height: 52, borderRadius: 20 },
              ]}
            >
              <SoundIcon
                muted={isMuted}
                size={isTablet ? 25 : 21}
                color={COLORS.woodDark}
              />
            </View>
          </TactileButton>

          <TactileButton
            onPress={() => openParentGate(null)}
            accessibilityLabel="Parent Corner and Unlock"
            style={{ width: isTablet ? 116 : 96 }}
          >
            <View
              style={[
                styles.parentPlaqueBtn,
                isTablet && { height: 52, borderRadius: 20, paddingHorizontal: 16 },
              ]}
            >
              <LockIcon
                unlocked={isUnlocked}
                size={isTablet ? 20 : 17}
                color={COLORS.woodDark}
              />
              <Text
                style={[
                  styles.parentBtnText,
                  isTablet && { fontSize: 15 },
                ]}
              >
                Parents
              </Text>
            </View>
          </TactileButton>
        </View>
      </View>

      {/* Main Zoo Park Entrance Layout */}
      {isTabletLandscape ? (
        <View style={styles.landscapeBody}>
          {/* Left Hero Column: Sunlit Whit + Carved Entrance Signpost + Unlock */}
          <View style={styles.landscapeHeroCol}>
            <View style={styles.heroGlowWrap}>
              <Svg
                width={236}
                height={236}
                viewBox="0 0 100 100"
                style={styles.sunHaloSvg}
                pointerEvents="none"
              >
                <Defs>
                  <RadialGradient id="whitHaloLand" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FFF7CC" stopOpacity="0.62" />
                    <Stop offset="0.58" stopColor="#FFF2B3" stopOpacity="0.28" />
                    <Stop offset="1" stopColor="#FFF2B3" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="50" cy="50" r="50" fill="url(#whitHaloLand)" />
              </Svg>
              <WhitMascot
                mood="wave"
                size={mascotSize}
                interactive
                cycleAccessoryOnTap
              />
            </View>

            <AnimatedSignpost width={signW} height={signH} fontSize={31} />

            {/* Free Open-Ended Toybox CTA right beneath Whit */}
            <TactileButton
              onPress={() => openGame('jungle-picnic', true)}
              accessibilityLabel="Feed Whit — Open Jungle Picnic"
              style={styles.picnicPillWrap}
            >
              <View style={[styles.picnicPill, styles.picnicPillTablet]}>
                <PicnicTreatSvg treat="banana" size={30} />
                <View style={styles.picnicCopyCol}>
                  <Text style={styles.picnicTitle}>Feed Whit!</Text>
                  <Text style={styles.picnicSub}>Jungle Picnic · Free</Text>
                </View>
                <PicnicTreatSvg treat="cupcake" size={28} />
              </View>
            </TactileButton>

            <View style={styles.landscapeUnlockSlot}>
              {renderUnlockBanner()}
            </View>
          </View>

          {/* Right Zoo Exhibits Grid: 4x2 Centered Storybook Wooden Plaques */}
          <View style={styles.landscapeGridCol}>
            {renderGameGrid()}
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, isTablet && { marginBottom: 16 }]}>
            <View style={styles.heroGlowWrap}>
              <Svg
                width={isTablet ? 236 : 186}
                height={isTablet ? 236 : 186}
                viewBox="0 0 100 100"
                style={styles.sunHaloSvg}
                pointerEvents="none"
              >
                <Defs>
                  <RadialGradient id="whitHaloPort" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FFF7CC" stopOpacity="0.58" />
                    <Stop offset="0.58" stopColor="#FFF2B3" stopOpacity="0.26" />
                    <Stop offset="1" stopColor="#FFF2B3" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="50" cy="50" r="50" fill="url(#whitHaloPort)" />
              </Svg>
              <WhitMascot
                mood="wave"
                size={mascotSize}
                interactive
                cycleAccessoryOnTap
              />
            </View>
            <AnimatedSignpost
              width={signW}
              height={signH}
              fontSize={isTablet ? 31 : undefined}
            />
            <TactileButton
              onPress={() => openGame('jungle-picnic', true)}
              accessibilityLabel="Feed Whit — Open Jungle Picnic"
              style={styles.picnicPillWrap}
            >
              <View style={[styles.picnicPill, isTablet && styles.picnicPillTablet]}>
                <PicnicTreatSvg treat="banana" size={isTablet ? 30 : 26} />
                <View style={styles.picnicCopyCol}>
                  <Text style={[styles.picnicTitle, isTablet && { fontSize: 16 }]}>
                    Feed Whit!
                  </Text>
                  <Text style={styles.picnicSub}>Jungle Picnic · Free</Text>
                </View>
                <PicnicTreatSvg treat="cupcake" size={isTablet ? 28 : 24} />
              </View>
            </TactileButton>
          </View>

          {renderGameGrid()}
          {renderUnlockBanner()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  containerTabletPortrait: {
    maxWidth: 840,
  },
  containerTabletLandscape: {
    maxWidth: 1220,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    zIndex: 40,
  },
  topBarTablet: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 6,
  },
  starPlaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.woodPale,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 6,
    shadowColor: '#3D220D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  starPlaqueTablet: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 26,
    borderWidth: 3.5,
    borderBottomWidth: 7,
  },
  starPlaqueGiftGlow: {
    borderColor: COLORS.sunGold,
    backgroundColor: '#FFF5CC',
  },
  newGiftDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F4C542',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  starCountText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  parentCorner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  woodenIconPill: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentPlaqueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: COLORS.woodPale,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 5,
  },
  parentBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  /* iPad Landscape 2-column full-screen Zoo Park Entrance */
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 16,
    gap: 20,
  },
  landscapeHeroCol: {
    width: '28%',
    minWidth: 268,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeGridCol: {
    flex: 1,
    justifyContent: 'center',
  },
  landscapeUnlockSlot: {
    width: '100%',
    maxWidth: 310,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  scrollContentTablet: {
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  hero: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 14,
  },
  heroGlowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunHaloSvg: {
    position: 'absolute',
  },
  signpostWrap: {
    marginTop: -14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signTitleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFDF5',
    letterSpacing: 0.5,
    textShadowColor: '#593315',
    textShadowOffset: { width: 0, height: 2.5 },
    textShadowRadius: 1,
  },
  picnicPillWrap: {
    marginTop: 10,
    alignSelf: 'center',
  },
  picnicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF6E0',
    borderRadius: 999,
    borderWidth: 2.8,
    borderColor: '#C87849',
    borderBottomWidth: 6,
    borderBottomColor: '#9E562E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#4A2B14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  picnicPillTablet: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 12,
  },
  picnicCopyCol: {
    alignItems: 'center',
  },
  picnicTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  picnicSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A85832',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 14,
  },
  gridTablet: {
    justifyContent: 'center',
    gap: 16,
  },
  gridTabletLandscape: {
    justifyContent: 'center',
    gap: 12,
  },
  cardColumnPhone: {
    width: '47.5%',
  },
  cardColumnTablet: {
    width: '30.5%',
    minWidth: 196,
  },
  cardColumnTabletLandscape: {
    width: '30.8%',
    minWidth: 186,
  },
  plaqueOuter: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 3.5,
    borderBottomWidth: 8,
    padding: 7,
    paddingBottom: 11,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#2B1F14',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  plaqueOuterTablet: {
    borderRadius: 30,
    borderWidth: 3.8,
    borderBottomWidth: 9,
    padding: 8,
    paddingBottom: 12,
  },
  plaqueLocked: {
    opacity: 0.94,
  },
  pinDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(89, 51, 21, 0.36)',
    top: 9,
    zIndex: 4,
  },
  pinTL: { left: 12 },
  pinTR: { right: 12 },
  plaqueInner: {
    width: '100%',
    height: 98,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(89, 51, 21, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    overflow: 'hidden',
  },
  plaqueInnerTablet: {
    height: 126,
    borderRadius: 22,
    marginBottom: 9,
  },
  plaqueInnerLandscape: {
    height: 100,
    borderRadius: 20,
    marginBottom: 7,
  },
  lockBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE066',
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },
  lockBadgeTablet: {
    width: 38,
    height: 38,
    borderRadius: 19,
    top: -7,
    right: -7,
  },
  unlockedSparkle: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  previewRowTight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 2,
  },
  previewStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBubble: {
    backgroundColor: 'rgba(130, 232, 255, 0.38)',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#137EA8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  miniXyloRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  miniXyloBar: {
    borderRadius: 5,
    borderWidth: 1.8,
    borderColor: COLORS.woodDark,
  },
  jigsawFrameMini: {
    backgroundColor: '#D69B57',
    padding: 5,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#7C4B1B',
  },
  jigsawMini: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jigsawMiniPiece: {
    borderRadius: 5,
    overflow: 'hidden',
  },
  miniBushWrap: {
    transform: [{ rotate: '-6deg' }],
  },
  miniZooCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gameTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
  },
  gameTitleTablet: {
    fontSize: 18,
  },
  gameTitleLandscape: {
    fontSize: 16.5,
  },
  unlockWrap: {
    marginTop: 18,
    width: '100%',
  },
  unlockPlaque: {
    backgroundColor: '#FFE899',
    borderRadius: 26,
    borderWidth: 3.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#3D220D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  unlockPlaqueTablet: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  crownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDF5',
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  unlockSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8C5B1A',
    marginTop: 2,
  },
  unlockLockPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD23F',
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerWrap: {
    marginTop: 18,
    alignSelf: 'center',
  },
  unlockedFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.woodPale,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  unlockedFooterText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
});
