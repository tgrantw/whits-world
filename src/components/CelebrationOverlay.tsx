import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useOptionalApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, GAMES, getAnimalDisplayName } from '../theme';
import { CrownIcon, HomeIcon, PlayNextIcon, StarIcon } from './JungleArt';
import { SnapBurst } from './SnapBurst';
import { TactileButton } from './TactileButton';
import { WHIT_ACCESSORIES, WhitAccessorySvg } from './WhitAccessories';
import { WhitMascot } from './WhitMascot';
import { ExhibitAnimalKind, ZooExhibitAnimalSvg } from './ZooExhibitAnimals';

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
  const app = useOptionalApp();
  const { isTablet, height: screenH } = useResponsive();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.75)).current;
  const playPulse = useRef(new Animated.Value(1)).current;
  const [equipBurstTick, setEquipBurstTick] = useState<number | null>(null);

  const isSampleComplete = Boolean(
    app && app.isSampleSession && !app.isUnlocked && app.activeGame
  );
  const sampleGameMeta = useMemo(
    () =>
      app?.activeGame ? GAMES.find((g) => g.id === app.activeGame) ?? null : null,
    [app?.activeGame]
  );

  const unlockedHatMeta = useMemo(() => {
    if (!app?.latestUnlockedAccessory) return null;
    return (
      WHIT_ACCESSORIES.find((a) => a.id === app.latestUnlockedAccessory) ?? null
    );
  }, [app?.latestUnlockedAccessory]);

  const newStickerKind = app?.latestCollectedSticker as ExhibitAnimalKind | null;
  const wearingUnlockedHat =
    Boolean(unlockedHatMeta) && app?.whitAccessory === unlockedHatMeta?.id;

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
    if (!visible) {
      setEquipBurstTick(null);
      return;
    }

    if (isSampleComplete && app) {
      app.completeSampleSession();
    }

    // Warm neural voice celebration cheer right after the xylophone win chime sparkles
    const praiseTimer = setTimeout(() => {
      if (unlockedHatMeta) {
        soundEngine.speakWord('New hat unlocked!');
      } else if (newStickerKind) {
        soundEngine.speakWord('New friend found!');
      } else {
        soundEngine.speakWord(
          (app?.starsEarned ?? 0) % 2 === 1 ? 'Amazing job!' : 'You earned a star!'
        );
      }
    }, 360);

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
          toValue: 1.06,
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
      clearTimeout(praiseTimer);
      pulseLoop.stop();
      confettiLoops.forEach((l) => l.stop());
    };
  }, [
    visible,
    isSampleComplete,
    app,
    unlockedHatMeta,
    newStickerKind,
    backdropOpacity,
    cardScale,
    playPulse,
    fallAnims,
    confettiPieces,
  ]);

  if (!visible) return null;

  const sideStar = isTablet ? 52 : 42;
  const midStar = isTablet ? 72 : 58;
  const homeBtnSize = isTablet ? 92 : 76;
  const nextBtnW = isTablet ? 148 : 118;
  const nextBtnH = isTablet ? 98 : 82;

  const handleAskGrownUp = () => {
    if (!app) return;
    const lockedId = app.activeGame;
    app.goHome();
    if (lockedId) {
      app.openParentGate(lockedId);
    } else {
      app.openParentGate(null);
    }
  };

  const handleWearNewHat = () => {
    if (!app || !unlockedHatMeta) return;
    soundEngine.unlock();
    app.setWhitAccessory(unlockedHatMeta.id);
    soundEngine.playGorillaGiggle();
    soundEngine.speakWord(unlockedHatMeta.label);
    setEquipBurstTick(Date.now());
  };

  const handlePlayNext = () => {
    app?.clearCelebrationUnlocks();
    onPlayAgain();
  };

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
          (isSampleComplete || unlockedHatMeta || newStickerKind) &&
            (isTablet ? { maxWidth: 500 } : { maxWidth: 372 }),
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

          <View style={styles.whitWrap}>
            <WhitMascot mood="cheer" size={isTablet ? 186 : 148} interactive />
            {equipBurstTick && (
              <View style={styles.burstCenter} pointerEvents="none">
                <SnapBurst key={equipBurstTick} size={isTablet ? 168 : 132} />
              </View>
            )}
          </View>

          {/* Joyful Hat and/or Zoo Sticker Discovery Callouts */}
          {!isSampleComplete && unlockedHatMeta && (
            <View style={styles.unlockRewardCard}>
              <View style={styles.unlockRewardArt}>
                <WhitAccessorySvg
                  accessory={unlockedHatMeta.id}
                  size={isTablet ? 48 : 40}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.unlockRewardEyebrow}>🎁 NEW SURPRISE!</Text>
                <Text style={styles.unlockRewardTitle} numberOfLines={1}>
                  {unlockedHatMeta.label}
                </Text>
              </View>
              <TactileButton
                onPress={handleWearNewHat}
                accessibilityLabel={`Put ${unlockedHatMeta.label} on Whit`}
              >
                <View
                  style={[
                    styles.wearBtn,
                    wearingUnlockedHat && styles.wearBtnEquipped,
                  ]}
                >
                  <Text
                    style={[
                      styles.wearBtnText,
                      wearingUnlockedHat && { color: '#195428' },
                    ]}
                  >
                    {wearingUnlockedHat ? '✓ On!' : 'Wear It!'}
                  </Text>
                </View>
              </TactileButton>
            </View>
          )}

          {!isSampleComplete && newStickerKind && (
            <View style={styles.stickerRewardCard}>
              <ZooExhibitAnimalSvg
                animal={newStickerKind}
                size={isTablet ? 44 : 36}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.stickerRewardEyebrow}>
                  🌟 NEW ZOO STICKER!
                </Text>
                <Text style={styles.unlockRewardTitle} numberOfLines={1}>
                  {getAnimalDisplayName(newStickerKind)} Joined Your Album!
                </Text>
              </View>
            </View>
          )}

          {isSampleComplete && sampleGameMeta && (
            <View style={styles.sampleCopyBox}>
              <Text style={[styles.sampleHeadline, isTablet && { fontSize: 22 }]}>
                Loved {sampleGameMeta.title}?
              </Text>
              <Text style={[styles.sampleSub, isTablet && { fontSize: 15 }]}>
                Ask a grown-up to unlock {sampleGameMeta.title} & all {GAMES.length} zoo games forever!
              </Text>
            </View>
          )}

          <View style={[styles.actions, isTablet && { gap: 22, marginTop: 14 }]}>
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
                    borderRadius: isTablet ? 30 : 26,
                  },
                ]}
              >
                <HomeIcon size={isTablet ? 40 : 32} color="#FFFDF5" />
              </View>
            </TactileButton>

            {isSampleComplete ? (
              <Animated.View style={{ flex: 1, transform: [{ scale: playPulse }] }}>
                <TactileButton
                  onPress={handleAskGrownUp}
                  accessibilityLabel={`Ask a grown-up to unlock ${sampleGameMeta?.title || 'all games'}`}
                >
                  <View
                    style={[
                      styles.unlockSampleBtn,
                      {
                        height: homeBtnSize,
                        borderRadius: isTablet ? 30 : 26,
                      },
                    ]}
                  >
                    <CrownIcon size={isTablet ? 26 : 22} color="#FFE578" />
                    <Text
                      style={[
                        styles.unlockSampleBtnText,
                        isTablet && { fontSize: 19 },
                      ]}
                    >
                      Ask Grown-Up
                    </Text>
                  </View>
                </TactileButton>
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: playPulse }] }}>
                <TactileButton
                  onPress={handlePlayNext}
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
            )}
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
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  plaqueInnerTablet: {
    borderRadius: 36,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  whitWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF5CC',
    borderRadius: 20,
    borderWidth: 2.2,
    borderColor: '#DDA428',
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginTop: 6,
    width: '100%',
  },
  unlockRewardArt: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EBD394',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockRewardEyebrow: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#9C6200',
    letterSpacing: 0.6,
  },
  unlockRewardTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  wearBtn: {
    backgroundColor: COLORS.emerald,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E5E2B',
    borderBottomWidth: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  wearBtnEquipped: {
    backgroundColor: '#E0F5E4',
    borderColor: COLORS.emerald,
  },
  wearBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stickerRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EAF8EE',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8CD19A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    width: '100%',
  },
  stickerRewardEyebrow: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLORS.jungleDeep,
    letterSpacing: 0.6,
  },
  sampleCopyBox: {
    backgroundColor: '#FFF3CC',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0B046',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 6,
    alignItems: 'center',
    width: '100%',
  },
  sampleHeadline: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.woodDark,
    textAlign: 'center',
    marginBottom: 3,
  },
  sampleSub: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
    width: '100%',
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
  unlockSampleBtn: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.emerald,
    borderWidth: 3.5,
    borderColor: '#195428',
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockSampleBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
