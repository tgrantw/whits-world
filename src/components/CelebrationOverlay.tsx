import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS } from '../theme';
import { WhitMascot } from './WhitMascot';
import { HomeIcon, PlayNextIcon, StarIcon } from './JungleArt';
import { TactileButton } from './TactileButton';

interface CelebrationOverlayProps {
  visible: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

interface ConfettiPiece {
  id: number;
  leftPct: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  isStar: boolean;
  drift: number;
}

const CONFETTI_COLORS = [
  '#FFD952',
  '#FF7847',
  '#42BD65',
  '#39B5FF',
  '#F06292',
  '#9B75E8',
];

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  onPlayAgain,
  onHome,
}) => {
  const { isTablet, height: screenH } = useResponsive();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.75)).current;
  const playPulse = useRef(new Animated.Value(1)).current;

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      leftPct: (i * 3.6 + 2) % 94,
      size: 14 + (i % 4) * 5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 7) * 130,
      duration: 2100 + (i % 5) * 300,
      isStar: i % 3 === 0,
      drift: (i % 2 === 0 ? 1 : -1) * (18 + (i % 4) * 10),
    }));
  }, []);

  const fallAnims = useRef(
    confettiPieces.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!visible) return;

    backdropOpacity.setValue(0);
    cardScale.setValue(0.75);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(playPulse, {
          toValue: 1.07,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(playPulse, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const confettiLoops = fallAnims.map((anim, i) => {
      anim.setValue(0);
      const piece = confettiPieces[i];
      return Animated.loop(
        Animated.sequence([
          Animated.delay(piece.delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: piece.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
    });
    confettiLoops.forEach((l) => l.start());

    return () => {
      pulseLoop.stop();
      confettiLoops.forEach((l) => l.stop());
    };
  }, [visible, backdropOpacity, cardScale, playPulse, fallAnims, confettiPieces]);

  if (!visible) return null;

  const sideStar = isTablet ? 52 : 42;
  const midStar = isTablet ? 72 : 58;
  const homeBtnSize = isTablet ? 96 : 80;
  const nextBtnW = isTablet ? 148 : 118;
  const nextBtnH = isTablet ? 98 : 82;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: backdropOpacity }]}
      pointerEvents="auto"
    >
      <View style={styles.confettiLayer} pointerEvents="none">
        {confettiPieces.map((piece, idx) => {
          const anim = fallAnims[idx];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-40, screenH + 60],
          });
          const translateX = anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, piece.drift, -piece.drift * 0.6],
          });
          const rotate = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={piece.id}
              style={{
                position: 'absolute',
                left: `${piece.leftPct}%`,
                top: 0,
                transform: [{ translateY }, { translateX }, { rotate }],
              }}
            >
              {piece.isStar ? (
                <StarIcon size={piece.size + (isTablet ? 10 : 6)} color={piece.color} />
              ) : (
                <View
                  style={{
                    width: piece.size * (isTablet ? 1.25 : 1),
                    height: piece.size * (isTablet ? 0.8 : 0.65),
                    borderRadius: 6,
                    backgroundColor: piece.color,
                    borderWidth: 1.5,
                    borderColor: 'rgba(44,32,23,0.25)',
                  }}
                />
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Carved Wooden Storybook Celebration Plaque */}
      <Animated.View
        style={[
          styles.plaqueOuter,
          isTablet && styles.plaqueOuterTablet,
          { transform: [{ scale: cardScale }] },
        ]}
      >
        <View style={[styles.plaqueInner, isTablet && styles.plaqueInnerTablet]}>
          <View style={styles.starRow}>
            <StarIcon size={sideStar} color="#FFD952" />
            <View style={{ marginTop: isTablet ? -24 : -18 }}>
              <StarIcon size={midStar} color="#FFA726" />
            </View>
            <StarIcon size={sideStar} color="#FFD952" />
          </View>

          <WhitMascot mood="cheer" size={isTablet ? 216 : 172} interactive />

          <View style={[styles.actions, isTablet && { gap: 26, marginTop: 18 }]}>
            <TactileButton
              onPress={onHome}
              accessibilityLabel="Home"
              style={{ width: homeBtnSize }}
            >
              <View
                style={[
                  styles.homeBtn,
                  {
                    width: homeBtnSize,
                    height: homeBtnSize,
                    borderRadius: isTablet ? 32 : 28,
                  },
                ]}
              >
                <HomeIcon size={isTablet ? 42 : 34} color="#FFFDF5" />
              </View>
            </TactileButton>

            <Animated.View style={{ transform: [{ scale: playPulse }] }}>
              <TactileButton
                onPress={onPlayAgain}
                accessibilityLabel="Play next puzzle"
                style={{ width: nextBtnW }}
              >
                <View
                  style={[
                    styles.nextBtn,
                    {
                      width: nextBtnW,
                      height: nextBtnH,
                      borderRadius: isTablet ? 34 : 30,
                    },
                  ]}
                >
                  <PlayNextIcon size={isTablet ? 52 : 42} color="#FFFFFF" />
                </View>
              </TactileButton>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
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
    backgroundColor: 'rgba(22, 50, 28, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  plaqueOuter: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: COLORS.woodLight,
    borderRadius: 38,
    borderWidth: 4.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 10,
    padding: 8,
    shadowColor: '#1B381E',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  plaqueOuterTablet: {
    maxWidth: 460,
    borderRadius: 46,
    padding: 12,
    borderBottomWidth: 12,
  },
  plaqueInner: {
    backgroundColor: COLORS.cream,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#E8C589',
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  plaqueInnerTablet: {
    borderRadius: 36,
    paddingVertical: 30,
    paddingHorizontal: 28,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
  },
  homeBtn: {
    backgroundColor: COLORS.sunGold,
    borderWidth: 3.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    backgroundColor: COLORS.emerald,
    borderWidth: 3.5,
    borderColor: '#195428',
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
