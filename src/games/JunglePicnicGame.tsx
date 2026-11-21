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
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import {
  DraggablePiece,
  DropAttempt,
  isPointNearRect,
  MeasurableNode,
  measureNodeRect,
} from '../components/DraggablePiece';
import { GameHeader } from '../components/GameHeader';
import {
  PICNIC_TREATS,
  PicnicTreatId,
  PicnicTreatMeta,
  PicnicTreatSvg,
} from '../components/PicnicTreats';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import { WhitMascot, WhitMood } from '../components/WhitMascot';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS } from '../theme';

interface PicnicGuest {
  animal: ExhibitAnimalKind;
  name: string;
  favoriteTreat: PicnicTreatId;
  badgeColor: string;
}

const PICNIC_GUESTS: PicnicGuest[] = [
  { animal: 'monkey', name: 'Monkey', favoriteTreat: 'banana', badgeColor: '#F3D7A6' },
  { animal: 'penguin', name: 'Penguin', favoriteTreat: 'fish', badgeColor: '#C5E4F4' },
  { animal: 'cow', name: 'Cow', favoriteTreat: 'watermelon', badgeColor: '#F5DB9A' },
  { animal: 'panda', name: 'Panda', favoriteTreat: 'bamboo', badgeColor: '#C5E6CA' },
  { animal: 'polarbear', name: 'Polar Bear', favoriteTreat: 'fish', badgeColor: '#D2E9F6' },
  { animal: 'pig', name: 'Pig', favoriteTreat: 'watermelon', badgeColor: '#F8D4DA' },
  { animal: 'elephant', name: 'Elephant', favoriteTreat: 'watermelon', badgeColor: '#C7E2F2' },
  { animal: 'toucan', name: 'Toucan', favoriteTreat: 'berries', badgeColor: '#F8DF9B' },
  { animal: 'whale', name: 'Whale', favoriteTreat: 'fish', badgeColor: '#B3E3F5' },
  { animal: 'giraffe', name: 'Giraffe', favoriteTreat: 'bamboo', badgeColor: '#F6E1A8' },
  { animal: 'lion', name: 'Lion', favoriteTreat: 'cupcake', badgeColor: '#F6CB9F' },
  { animal: 'frog', name: 'Frog', favoriteTreat: 'fish', badgeColor: '#BBE4B7' },
];

const TREATS_PER_STAR = 5;

/** Warm hand-painted cream & terracotta gingham storybook picnic blanket */
const PicnicBlanketSvg: React.FC<{ width: number; height: number }> = ({
  width,
  height,
}) => (
  <Svg width={width} height={height} viewBox="0 0 420 150" preserveAspectRatio="none">
    {/* Soft grass ground shadow */}
    <Ellipse cx="210" cy="128" rx="198" ry="18" fill="rgba(54, 88, 42, 0.24)" />
    {/* Perspective trapezoid picnic cloth */}
    <Path
      d="M 52 24 L 368 24 L 404 122 Q 210 138 16 122 Z"
      fill="#FFF6E5"
      stroke="#A85C3A"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Soft terracotta gingham stripes (horizontal) */}
    <Path d="M 44 46 H 376 L 383 62 H 37 Z" fill="rgba(223, 114, 72, 0.24)" />
    <Path d="M 31 82 H 389 L 396 98 H 24 Z" fill="rgba(223, 114, 72, 0.24)" />
    {/* Soft terracotta gingham stripes (vertical perspective bands) */}
    <Path d="M 102 25 L 78 124 L 112 126 L 130 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    <Path d="M 188 25 L 182 128 L 218 128 L 214 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    <Path d="M 276 25 L 288 126 L 322 124 L 304 25 Z" fill="rgba(223, 114, 72, 0.2)" />
    {/* Warm cream fringe dots along bottom edge */}
    <Rect x="54" y="22" width="312" height="5" rx="2.5" fill="rgba(255, 252, 240, 0.65)" />
  </Svg>
);

/** Floating coral hearts & stars rising happily after a yummy bite */
const FloatingYumHearts: React.FC<{ burstKey: number; size: number }> = ({
  burstKey,
  size,
}) => {
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    prog.setValue(0);
    Animated.timing(prog, {
      toValue: 1,
      duration: 950,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [burstKey, prog]);

  const riseY = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -Math.round(size * 0.55)],
  });
  const opacity = prog.interpolate({
    inputRange: [0, 0.2, 0.78, 1],
    outputRange: [0, 1, 0.95, 0],
  });
  const scale = prog.interpolate({
    inputRange: [0, 0.28, 1],
    outputRange: [0.4, 1.15, 0.85],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.heartsFloat,
        {
          opacity,
          transform: [{ translateY: riseY }, { scale }],
        },
      ]}
    >
      <Svg width={72} height={46} viewBox="0 0 72 46">
        <Path
          d="M 22 36 C 12 28, 6 21, 6 14 C 6 9, 10 5, 15 5 C 18 5, 20.5 6.8, 22 9 C 23.5 6.8, 26 5, 29 5 C 34 5, 38 9, 38 14 C 38 21, 32 28, 22 36 Z"
          fill="#EC6A84"
          stroke="#7A3646"
          strokeWidth="2.2"
        />
        <Path
          d="M 52 28 C 45 22, 41 17, 41 12 C 41 8.5, 44 6, 47.5 6 C 49.5 6, 51 7.2, 52 8.8 C 53 7.2, 54.5 6, 56.5 6 C 60 6, 63 8.5, 63 12 C 63 17, 59 22, 52 28 Z"
          fill="#F79AB0"
          stroke="#7A3646"
          strokeWidth="2"
        />
      </Svg>
    </Animated.View>
  );
};

/** Soft pulsing thought bubble showing a hungry friend's favorite treat (zero reading!) */
const CravingBubble: React.FC<{ treat: PicnicTreatId; size: number }> = ({
  treat,
  size,
}) => {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cravingBubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
        },
      ]}
    >
      <PicnicTreatSvg treat={treat} size={Math.round(size * 0.72)} />
      <View style={styles.cravingDotLg} />
      <View style={styles.cravingDotSm} />
    </Animated.View>
  );
};

/**
 * Whit's Jungle Picnic (Free Tier Open-Ended Toybox):
 * Zero rules, zero failing, infinite pretend play!
 * - Drag or tap 6 storybook treats to feed Whit and any of 8 visiting zoo friends
 * - Silly chomping reactions, floating hearts, favorite-snack cheer dances & animal voices
 * - Every 5 treats shared drops +1 glowing star into Whit's Star Jar without interrupting play!
 */
export const JunglePicnicGame: React.FC = () => {
  const { addStar, collectSticker } = useApp();
  const { isTablet, isTabletLandscape, width } = useResponsive();

  const [guestIdx, setGuestIdx] = useState(0);
  const [treatsFedInCycle, setTreatsFedInCycle] = useState(0);
  const [whitMood, setWhitMood] = useState<WhitMood>('wave');
  const [guestState, setGuestState] = useState<'idle' | 'calling' | 'celebrate'>('idle');
  const [hoverTarget, setHoverTarget] = useState<'whit' | 'guest' | null>(null);
  const [whitBurstKey, setWhitBurstKey] = useState<number | null>(null);
  const [guestBurstKey, setGuestBurstKey] = useState<number | null>(null);
  const [starBannerKey, setStarBannerKey] = useState<number | null>(null);
  const [tapFeedCounter, setTapFeedCounter] = useState(0);

  const whitRef = useRef<MeasurableNode>(null);
  const guestRef = useRef<MeasurableNode>(null);
  const whitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guest = PICNIC_GUESTS[guestIdx % PICNIC_GUESTS.length];
  const hitPadding = isTablet ? 74 : 56;

  useEffect(() => {
    return () => {
      if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    };
  }, []);

  const feedTarget = useCallback(
    (target: 'whit' | 'guest', treat: PicnicTreatMeta) => {
      soundEngine.unlock();
      soundEngine.playMunch();

      const recipientAnimal = target === 'whit' ? 'gorilla' : guest.animal;
      const isFavorite = treat.lovedBy.includes(recipientAnimal);
      const isPartyCupcake = treat.id === 'cupcake';

      collectSticker(recipientAnimal);

      if (target === 'whit' || isPartyCupcake) {
        setWhitMood('cheer');
        setWhitBurstKey(Date.now());
        if (whitTimerRef.current) clearTimeout(whitTimerRef.current);
        whitTimerRef.current = setTimeout(() => setWhitMood('wave'), 1150);
      }

      if (target === 'guest' || isPartyCupcake) {
        setGuestState('celebrate');
        setGuestBurstKey(Date.now() + 1);
        if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
        guestTimerRef.current = setTimeout(() => setGuestState('idle'), 1150);
      }

      setTimeout(() => {
        if (isFavorite || isPartyCupcake) {
          soundEngine.playYumSparkle();
        }
        soundEngine.playAnimalSound(recipientAnimal);
      }, 240);

      setTreatsFedInCycle((prev) => {
        const next = prev + 1;
        if (next >= TREATS_PER_STAR) {
          setTimeout(() => {
            soundEngine.playWin();
            addStar(1);
            setStarBannerKey(Date.now());
            setWhitMood('cheer');
            setGuestState('celebrate');
          }, 340);
          setTimeout(() => {
            setTreatsFedInCycle(0);
          }, 1200);
          return TREATS_PER_STAR;
        }
        return next;
      });
    },
    [guest.animal, collectSticker, addStar]
  );

  const handleDragMove = useCallback(
    async (attempt: DropAttempt) => {
      const [wRect, gRect] = await Promise.all([
        measureNodeRect(whitRef.current),
        measureNodeRect(guestRef.current),
      ]);

      const nearWhit =
        wRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, wRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            wRect,
            hitPadding
          ));
      const nearGuest =
        gRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, gRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            gRect,
            hitPadding
          ));

      if (nearWhit) {
        setHoverTarget('whit');
      } else if (nearGuest) {
        setHoverTarget('guest');
      } else {
        setHoverTarget(null);
      }
    },
    [hitPadding]
  );

  const handleDropTreat = useCallback(
    async (treat: PicnicTreatMeta, attempt: DropAttempt): Promise<boolean> => {
      setHoverTarget(null);
      const [wRect, gRect] = await Promise.all([
        measureNodeRect(whitRef.current),
        measureNodeRect(guestRef.current),
      ]);

      const hitWhit =
        wRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, wRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            wRect,
            hitPadding
          ));
      const hitGuest =
        gRect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, gRect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            gRect,
            hitPadding
          ));

      if (hitWhit) {
        feedTarget('whit', treat);
        return false; // return treat neatly back to the infinite picnic basket!
      }
      if (hitGuest) {
        feedTarget('guest', treat);
        return false;
      }
      return false;
    },
    [hitPadding, feedTarget]
  );

  // 1-tap treat support so 2-year-olds who tap instead of drag get instant picnic delight!
  const handleTapTreat = useCallback(
    (treat: PicnicTreatMeta) => {
      const guestLoves = treat.lovedBy.includes(guest.animal);
      const whitLoves = treat.lovedBy.includes('gorilla');
      let target: 'whit' | 'guest';
      if (guestLoves && !whitLoves) {
        target = 'guest';
      } else if (whitLoves && !guestLoves) {
        target = 'whit';
      } else {
        target = tapFeedCounter % 2 === 0 ? 'whit' : 'guest';
      }
      setTapFeedCounter((c) => c + 1);
      feedTarget(target, treat);
    },
    [guest.animal, tapFeedCounter, feedTarget]
  );

  const handleSelectGuest = (idx: number) => {
    const nextGuest = PICNIC_GUESTS[idx % PICNIC_GUESTS.length];
    soundEngine.unlock();
    soundEngine.playPop();
    setTimeout(() => soundEngine.playAnimalSound(nextGuest.animal), 100);
    setGuestIdx(idx);
    collectSticker(nextGuest.animal);
    setGuestState('celebrate');
    if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    guestTimerRef.current = setTimeout(() => setGuestState('idle'), 850);
  };

  const whitSize = isTabletLandscape ? 196 : isTablet ? 186 : 144;
  const guestSize = isTabletLandscape ? 168 : isTablet ? 160 : 124;
  const blanketW = isTabletLandscape
    ? Math.min(540, width * 0.56)
    : isTablet
    ? Math.min(560, width - 80)
    : Math.min(370, width - 20);
  const blanketH = isTablet ? 136 : 104;
  const treatSize = isTablet ? 74 : 56;
  const cravingSize = isTablet ? 52 : 42;

  return (
    <View style={styles.container}>
      {/* Full-bleed Warm Watercolor Jungle Clearing */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgClearing}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Top Bar: Home + 5-Treat Yum Star Progress + Mute (no difficulty needed in open-ended mode!) */}
      <GameHeader
        totalSteps={TREATS_PER_STAR}
        completedSteps={treatsFedInCycle}
      />

      <View
        style={[
          styles.playArea,
          isTabletLandscape && styles.playAreaLandscape,
        ]}
      >
        {/* Picnic Meadow Stage */}
        <View style={styles.picnicStageCol}>
          <View style={[styles.meadowStage, { width: blanketW }]}>
            {/* Checkered Storybook Picnic Blanket */}
            <View
              style={[
                styles.blanketWrap,
                { width: blanketW, height: blanketH },
              ]}
              pointerEvents="none"
            >
              <PicnicBlanketSvg width={blanketW} height={blanketH} />
            </View>

            {/* Whit & Visiting Zoo Friend sitting side-by-side on the blanket */}
            <View style={styles.friendsRow}>
              {/* Whit the Gorilla */}
              <View
                ref={(node) => {
                  whitRef.current = node;
                }}
                style={[
                  styles.friendSpot,
                  hoverTarget === 'whit' && styles.friendSpotHover,
                ]}
              >
                <View style={styles.cravingAnchorLeft}>
                  <CravingBubble treat="banana" size={cravingSize} />
                </View>

                <WhitMascot
                  mood={whitMood}
                  size={whitSize}
                  interactive
                  cycleAccessoryOnTap
                />

                {whitBurstKey && (
                  <>
                    <FloatingYumHearts burstKey={whitBurstKey} size={whitSize} />
                    <View style={styles.burstCenter} pointerEvents="none">
                      <SnapBurst
                        key={whitBurstKey}
                        size={isTablet ? 160 : 124}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Visiting Zoo Friend */}
              <View
                ref={(node) => {
                  guestRef.current = node;
                }}
                style={[
                  styles.friendSpot,
                  hoverTarget === 'guest' && styles.friendSpotHover,
                ]}
              >
                <View style={styles.cravingAnchorRight}>
                  <CravingBubble
                    treat={guest.favoriteTreat}
                    size={cravingSize}
                  />
                </View>

                <AnimatedZooAnimal
                  state={hoverTarget === 'guest' ? 'calling' : guestState}
                  size={guestSize}
                  seed={guestIdx + 3}
                  weight={getAnimalWeight(guest.animal)}
                  silentTap
                  onTap={() => {
                    soundEngine.playAnimalSound(guest.animal);
                    setGuestBurstKey(Date.now());
                  }}
                >
                  <ZooExhibitAnimalSvg animal={guest.animal} size={guestSize} />
                </AnimatedZooAnimal>

                {guestBurstKey && (
                  <>
                    <FloatingYumHearts
                      burstKey={guestBurstKey}
                      size={guestSize}
                    />
                    <View style={styles.burstCenter} pointerEvents="none">
                      <SnapBurst
                        key={guestBurstKey}
                        size={isTablet ? 148 : 114}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Celebratory +1 Star Jar chime banner every 5 snacks */}
            {starBannerKey && (
              <View style={styles.starToastWrap} pointerEvents="none">
                <SnapBurst key={starBannerKey} size={isTablet ? 200 : 160} />
              </View>
            )}
          </View>

          {/* Scrollable Visiting Friends Ribbon */}
          <View
            style={[
              styles.guestPickerShell,
              isTabletLandscape && { maxWidth: blanketW },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.guestPickerRow}
            >
              {PICNIC_GUESTS.map((g, idx) => {
                const active = idx === guestIdx % PICNIC_GUESTS.length;
                const tabSz = isTablet ? 52 : 42;
                return (
                  <TactileButton
                    key={g.animal}
                    onPress={() => handleSelectGuest(idx)}
                    accessibilityLabel={`Invite ${g.name} to picnic`}
                    style={{ width: tabSz }}
                  >
                    <View
                      style={[
                        styles.guestTab,
                        {
                          width: tabSz,
                          height: tabSz,
                          borderRadius: tabSz / 2,
                          backgroundColor: g.badgeColor,
                        },
                        active && styles.guestTabActive,
                      ]}
                    >
                      <ZooExhibitAnimalSvg
                        animal={g.animal}
                        size={isTablet ? 40 : 32}
                      />
                    </View>
                  </TactileButton>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Soft Watercolor Picnic Basket Treat Dock (Drag OR Tap to feed!) */}
        <View
          style={[
            styles.basketDock,
            isTablet && styles.basketDockTablet,
            isTabletLandscape && styles.basketDockLandscape,
          ]}
        >
          <View style={styles.basketGloss} pointerEvents="none" />
          <View style={styles.basketHeaderRow}>
            <Text style={[styles.basketTitle, isTablet && { fontSize: 14 }]}>
              Drag or tap a treat to feed!
            </Text>
          </View>
          <View
            style={[
              styles.treatsGrid,
              isTablet && !isTabletLandscape && { maxWidth: 580 },
              isTabletLandscape && styles.treatsGridLandscape,
            ]}
          >
            {PICNIC_TREATS.map((treat) => (
              <View
                key={treat.id}
                style={[
                  styles.treatSlot,
                  {
                    width: treatSize + (isTablet ? 16 : 12),
                    height: treatSize + (isTablet ? 16 : 12),
                  },
                ]}
              >
                <DraggablePiece
                  dragScale={1.16}
                  onDragMove={handleDragMove}
                  onDrop={(attempt) => handleDropTreat(treat, attempt)}
                  onTap={() => handleTapTreat(treat)}
                >
                  <View
                    style={[
                      styles.treatPill,
                      {
                        width: treatSize + 8,
                        height: treatSize + 8,
                        borderRadius: (treatSize + 8) / 2,
                      },
                    ]}
                  >
                    <PicnicTreatSvg treat={treat.id} size={treatSize} />
                  </View>
                </DraggablePiece>
              </View>
            ))}
          </View>
        </View>
      </View>
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
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 12,
    paddingBottom: 16,
    overflow: 'visible',
  },
  playAreaLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 26,
    paddingBottom: 18,
  },
  picnicStageCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  meadowStage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 28,
    paddingBottom: 18,
    position: 'relative',
    overflow: 'visible',
  },
  blanketWrap: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 5,
    overflow: 'visible',
  },
  friendSpot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    padding: 6,
    borderRadius: 999,
    overflow: 'visible',
  },
  friendSpotHover: {
    backgroundColor: 'rgba(255, 240, 160, 0.36)',
    transform: [{ scale: 1.05 }],
  },
  cravingAnchorLeft: {
    position: 'absolute',
    top: -16,
    left: -6,
    zIndex: 15,
  },
  cravingAnchorRight: {
    position: 'absolute',
    top: -18,
    right: -4,
    zIndex: 15,
  },
  cravingBubble: {
    backgroundColor: 'rgba(255, 252, 242, 0.94)',
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 48, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  cravingDotLg: {
    position: 'absolute',
    bottom: -6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 252, 242, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(138, 92, 48, 0.28)',
  },
  cravingDotSm: {
    position: 'absolute',
    bottom: -12,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 252, 242, 0.94)',
  },
  heartsFloat: {
    position: 'absolute',
    top: -6,
    zIndex: 25,
  },
  burstCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  starToastWrap: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  guestPickerShell: {
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.62)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  guestPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  guestTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
  },
  guestTabActive: {
    borderColor: COLORS.woodDark,
    borderWidth: 3.5,
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  /* Softly shaded watercolor Picnic Basket Treat Dock */
  basketDock: {
    width: '96%',
    maxWidth: 520,
    backgroundColor: 'rgba(246, 221, 174, 0.9)',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.36)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 48, 0.44)',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  basketDockTablet: {
    maxWidth: 640,
    borderRadius: 42,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  basketDockLandscape: {
    width: 318,
    maxWidth: 318,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  basketGloss: {
    position: 'absolute',
    top: 3,
    left: 24,
    right: 24,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.42)',
  },
  basketHeaderRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  basketTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.woodDark,
    opacity: 0.84,
  },
  treatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 276,
    gap: 10,
    overflow: 'visible',
  },
  treatsGridLandscape: {
    maxWidth: 300,
    gap: 12,
  },
  treatSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  treatPill: {
    backgroundColor: 'rgba(255, 252, 244, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
});
