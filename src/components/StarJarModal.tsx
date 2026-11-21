import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS } from '../theme';
import { AnimatedZooAnimal, getAnimalWeight } from './AnimatedZooAnimal';
import { LockIcon, StarIcon } from './JungleArt';
import { SnapBurst } from './SnapBurst';
import { TactileButton } from './TactileButton';
import {
  isAccessoryUnlocked,
  WHIT_ACCESSORIES,
  WhitAccessoryId,
  WhitAccessorySvg,
} from './WhitAccessories';
import { WhitMascot } from './WhitMascot';
import { ExhibitAnimalKind, ZooExhibitAnimalSvg } from './ZooExhibitAnimals';

const JAR_STAR_SLOTS = [
  { x: 34, y: 76, r: 0.94 },
  { x: 56, y: 80, r: 1.02 },
  { x: 45, y: 68, r: 0.88 },
  { x: 67, y: 70, r: 0.86 },
  { x: 29, y: 60, r: 0.85 },
  { x: 52, y: 57, r: 0.96 },
  { x: 69, y: 56, r: 0.82 },
  { x: 38, y: 46, r: 0.9 },
  { x: 59, y: 45, r: 0.86 },
  { x: 48, y: 36, r: 0.92 },
  { x: 28, y: 43, r: 0.78 },
  { x: 70, y: 42, r: 0.78 },
  { x: 37, y: 33, r: 0.82 },
  { x: 61, y: 33, r: 0.82 },
];

interface StickerHabitatGroup {
  id: string;
  title: string;
  bg: string;
  border: string;
  titleColor: string;
  animals: { kind: ExhibitAnimalKind; label: string }[];
}

const STICKER_HABITATS: StickerHabitatGroup[] = [
  {
    id: 'clearing',
    title: 'Jungle Clearing',
    bg: '#EFF8E8',
    border: '#C5E2B7',
    titleColor: '#3B6F3A',
    animals: [
      { kind: 'gorilla', label: 'Whit' },
      { kind: 'monkey', label: 'Monkey' },
      { kind: 'toucan', label: 'Toucan' },
      { kind: 'frog', label: 'Frog' },
    ],
  },
  {
    id: 'aquarium',
    title: 'Ocean Reef',
    bg: '#EAF7FC',
    border: '#B5DFEE',
    titleColor: '#2B6E8C',
    animals: [
      { kind: 'whale', label: 'Whale' },
      { kind: 'turtle', label: 'Turtle' },
      { kind: 'octopus', label: 'Octopus' },
      { kind: 'clownfish', label: 'Clownfish' },
    ],
  },
  {
    id: 'savanna',
    title: 'Sunlit Savanna',
    bg: '#FDF5DF',
    border: '#E9D396',
    titleColor: '#8F641B',
    animals: [
      { kind: 'giraffe', label: 'Giraffe' },
      { kind: 'elephant', label: 'Elephant' },
      { kind: 'lion', label: 'Lion' },
      { kind: 'zebra', label: 'Zebra' },
    ],
  },
  {
    id: 'sanctuary',
    title: 'Bamboo Sanctuary',
    bg: '#F7EEF9',
    border: '#D9C2E3',
    titleColor: '#6B4882',
    animals: [
      { kind: 'panda', label: 'Panda' },
      { kind: 'tiger', label: 'Tiger' },
      { kind: 'hippo', label: 'Hippo' },
      { kind: 'flamingo', label: 'Flamingo' },
    ],
  },
  {
    id: 'arctic',
    title: 'Snowy Arctic',
    bg: '#EAF5FB',
    border: '#B5D7EB',
    titleColor: '#2B6180',
    animals: [
      { kind: 'penguin', label: 'Penguin' },
      { kind: 'polarbear', label: 'Polar Bear' },
      { kind: 'seal', label: 'Seal' },
      { kind: 'puffin', label: 'Puffin' },
    ],
  },
  {
    id: 'farm',
    title: 'Sunny Farm',
    bg: '#FBF4E1',
    border: '#E8CFA0',
    titleColor: '#8B5E22',
    animals: [
      { kind: 'cow', label: 'Cow' },
      { kind: 'pig', label: 'Pig' },
      { kind: 'duck', label: 'Duck' },
      { kind: 'sheep', label: 'Sheep' },
    ],
  },
];

const TOTAL_STICKER_COUNT = STICKER_HABITATS.reduce(
  (sum, group) => sum + group.animals.length,
  0
);

/** Compact storybook glass mason jar icon for the Home Screen top-left button */
export const MiniStarJarIcon: React.FC<{
  starsEarned: number;
  size?: number;
}> = ({ starsEarned, size = 34 }) => {
  const visibleCount = Math.min(Math.max(starsEarned, 0), 7);
  const glowOpacity = Math.min(0.68, 0.14 + visibleCount * 0.08);

  return (
    <Svg width={size} height={size} viewBox="0 0 80 86">
      <Defs>
        <RadialGradient id="miniJarGlow" cx="50%" cy="62%" r="48%">
          <Stop offset="0" stopColor="#FFE97D" stopOpacity={glowOpacity} />
          <Stop offset="1" stopColor="#FFE97D" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="miniJarGlass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.82" />
          <Stop offset="0.5" stopColor="#DDF6FA" stopOpacity="0.48" />
          <Stop offset="1" stopColor="#B8E8F2" stopOpacity="0.58" />
        </LinearGradient>
      </Defs>

      <Rect
        x="24"
        y="4"
        width="32"
        height="11"
        rx="4"
        fill="#D69E5E"
        stroke="#6B4728"
        strokeWidth="3"
      />
      <Rect
        x="21"
        y="13"
        width="38"
        height="8"
        rx="3.5"
        fill="#EBF9FC"
        stroke="#6B4728"
        strokeWidth="2.8"
      />
      <Path
        d="M 22 21 Q 12 25 12 38 L 12 68 Q 12 80 24 80 L 56 80 Q 68 80 68 68 L 68 38 Q 68 25 58 21 Z"
        fill="url(#miniJarGlass)"
        stroke="#6B4728"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <Circle cx="40" cy="56" r="24" fill="url(#miniJarGlow)" />

      {visibleCount === 0 ? (
        <Path
          d="M 40 44 L 43 51 L 51 52 L 45 57 L 46.5 65 L 40 61 L 33.5 65 L 35 57 L 29 52 L 37 51 Z"
          fill="#FFE898"
          stroke="#C68A1E"
          strokeWidth="2"
          opacity="0.55"
        />
      ) : (
        JAR_STAR_SLOTS.slice(0, visibleCount).map((s, idx) => {
          const sx = s.x * 0.8 + 4;
          const sy = s.y * 0.86 + 3;
          return (
            <Path
              key={idx}
              d={`M ${sx} ${sy - 7} L ${sx + 2.2} ${sy - 2} L ${sx + 7.5} ${sy - 1.5} L ${sx + 3.4} ${sy + 2} L ${sx + 4.5} ${sy + 7} L ${sx} ${sy + 4.2} L ${sx - 4.5} ${sy + 7} L ${sx - 3.4} ${sy + 2} L ${sx - 7.5} ${sy - 1.5} L ${sx - 2.2} ${sy - 2} Z`}
              fill="#FFD94D"
              stroke="#B57514"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          );
        })
      )}

      <Path
        d="M 20 34 Q 18 50 20 66"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
    </Svg>
  );
};

/** Large interactive glowing Star Jar inside the Toybox modal */
const BigGlowingStarJar: React.FC<{
  starsEarned: number;
  size: number;
  shakeSignal: number;
  onTap: () => void;
}> = ({ starsEarned, size, shakeSignal, onTap }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [burstKey, setBurstKey] = useState<number | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const runShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (shakeSignal > 0) {
      runShake();
    }
  }, [shakeSignal]);

  const handlePress = () => {
    soundEngine.unlock();
    soundEngine.playStarCollect(Math.min(starsEarned, 5));
    runShake();
    setBurstKey(Date.now());
    onTap();
  };

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-7deg', '7deg'],
  });
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.07],
  });

  const visibleStars = Math.min(starsEarned, JAR_STAR_SLOTS.length);
  const jarH = Math.round(size * 1.15);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Whit's Star Jar with ${starsEarned} stars`}
      style={[styles.bigJarPress, { width: size, height: jarH }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bigJarAura,
          {
            width: size * 1.16,
            height: size * 1.16,
            borderRadius: (size * 1.16) / 2,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={size} height={jarH} viewBox="0 0 100 112">
          <Defs>
            <RadialGradient id="bigJarSun" cx="50%" cy="60%" r="48%">
              <Stop
                offset="0"
                stopColor="#FFE97D"
                stopOpacity={visibleStars > 0 ? Math.min(0.78, 0.36 + visibleStars * 0.03) : 0.25}
              />
              <Stop offset="1" stopColor="#FFE97D" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="bigJarGlass" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.86" />
              <Stop offset="0.45" stopColor="#E4F8FC" stopOpacity="0.52" />
              <Stop offset="1" stopColor="#BFEBF4" stopOpacity="0.62" />
            </LinearGradient>
            <LinearGradient id="corkWood" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#E2AF72" />
              <Stop offset="1" stopColor="#BC8142" />
            </LinearGradient>
          </Defs>

          <Ellipse cx="50" cy="105" rx="34" ry="5.5" fill="rgba(94, 64, 40, 0.16)" />

          <Rect
            x="30"
            y="6"
            width="40"
            height="14"
            rx="5"
            fill="url(#corkWood)"
            stroke="#6B4728"
            strokeWidth="3"
          />
          <Path
            d="M 38 11 H 62"
            stroke="#F7D9A8"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          <Rect
            x="25"
            y="18"
            width="50"
            height="10"
            rx="4.5"
            fill="#F1FBFE"
            stroke="#6B4728"
            strokeWidth="2.8"
          />
          <Path
            d="M 27 25 Q 50 30 73 25"
            stroke="#D98B4C"
            strokeWidth="3.2"
            fill="none"
          />

          <Path
            d="M 27 28 Q 14 33 14 49 L 14 86 Q 14 101 30 101 L 70 101 Q 86 101 86 86 L 86 49 Q 86 33 73 28 Z"
            fill="url(#bigJarGlass)"
            stroke="#6B4728"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          <Circle cx="50" cy="66" r="34" fill="url(#bigJarSun)" />

          {visibleStars === 0 ? (
            <Path
              d="M 50 56 L 54 66 L 65 67.5 L 57 74.5 L 59 85 L 50 79.5 L 41 85 L 43 74.5 L 35 67.5 L 46 66 Z"
              fill="#FFE99B"
              stroke="#C9922A"
              strokeWidth="2.2"
              strokeDasharray="4 3"
              opacity="0.7"
            />
          ) : (
            JAR_STAR_SLOTS.slice(0, visibleStars).map((s, idx) => {
              const r = 8.8 * s.r;
              return (
                <Path
                  key={idx}
                  d={`M ${s.x} ${s.y - r} L ${s.x + r * 0.3} ${s.y - r * 0.3} L ${s.x + r} ${s.y - r * 0.2} L ${s.x + r * 0.46} ${s.y + r * 0.28} L ${s.x + r * 0.62} ${s.y + r * 0.94} L ${s.x} ${s.y + r * 0.56} L ${s.x - r * 0.62} ${s.y + r * 0.94} L ${s.x - r * 0.46} ${s.y + r * 0.28} L ${s.x - r} ${s.y - r * 0.2} L ${s.x - r * 0.3} ${s.y - r * 0.3} Z`}
                  fill={idx % 2 === 0 ? '#FFD94A' : '#FFE678'}
                  stroke="#B57514"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              );
            })
          )}

          <Path
            d="M 24 44 Q 21 64 24 85"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.82"
          />
          <Circle cx="76" cy="48" r="3" fill="#FFFFFF" opacity="0.72" />
        </Svg>
      </Animated.View>

      <View style={styles.jarCountPill}>
        <StarIcon size={16} color={COLORS.sunGold} />
        <Text style={styles.jarCountText}>{starsEarned}</Text>
      </View>

      {burstKey && (
        <View style={styles.jarBurstWrap} pointerEvents="none">
          <SnapBurst key={burstKey} size={size * 0.95} />
        </View>
      )}
    </Pressable>
  );
};

/**
 * Whit's Glowing Star Jar, Extended Dress-Up Toybox (10 looks up to 24 stars)
 * & Living 16-Animal Zoo Sticker Album.
 */
export const StarJarModal: React.FC = () => {
  const {
    starJarVisible,
    closeStarJar,
    starsEarned,
    whitAccessory,
    collectedStickers,
    setWhitAccessory,
  } = useApp();
  const { isTablet } = useResponsive();

  const [activeTab, setActiveTab] = useState<'dressup' | 'stickers'>('dressup');
  const [whitCheering, setWhitCheering] = useState(false);
  const [jarShake, setJarShake] = useState(0);
  const [equipBurstKey, setEquipBurstKey] = useState<number | null>(null);
  const [stickerBurstMap, setStickerBurstMap] = useState<Record<string, number>>(
    {}
  );
  const cheerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cheerTimerRef.current) clearTimeout(cheerTimerRef.current);
    };
  }, []);

  const triggerWhitCheer = () => {
    setWhitCheering(true);
    if (cheerTimerRef.current) clearTimeout(cheerTimerRef.current);
    cheerTimerRef.current = setTimeout(() => setWhitCheering(false), 950);
  };

  const handleSelectAccessory = (id: WhitAccessoryId, unlocked: boolean) => {
    soundEngine.unlock();
    if (!unlocked) {
      soundEngine.playGentleBounce();
      setJarShake((s) => s + 1);
      return;
    }
    setWhitAccessory(id);
    soundEngine.playGorillaGiggle();
    setEquipBurstKey(Date.now());
    triggerWhitCheer();
  };

  const handleStickerTap = (animal: ExhibitAnimalKind, collected: boolean) => {
    soundEngine.unlock();
    if (!collected) {
      soundEngine.playGentleBounce();
      return;
    }
    soundEngine.playAnimalSound(animal);
    setStickerBurstMap((prev) => ({ ...prev, [animal]: Date.now() }));
  };

  const nextUnlock = WHIT_ACCESSORIES.find(
    (a) => a.starsRequired > starsEarned
  );
  const collectedCount = collectedStickers.length;

  return (
    <Modal
      visible={starJarVisible}
      transparent
      animationType="fade"
      onRequestClose={closeStarJar}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, isTablet && styles.sheetTablet]}>
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.titlePill}>
              <StarIcon size={18} color={COLORS.sunGold} />
              <Text style={styles.titlePillText}>Whit’s Toybox</Text>
            </View>
            <Pressable
              onPress={closeStarJar}
              accessibilityRole="button"
              accessibilityLabel="Close Whit's Star Jar"
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Two-Tab Segmented Switch: Dress-Up vs Living Zoo Sticker Album */}
          <View style={styles.tabTrack}>
            <Pressable
              onPress={() => {
                soundEngine.playPop();
                setActiveTab('dressup');
              }}
              accessibilityRole="button"
              accessibilityLabel="Whit's Hats and Star Jar tab"
              style={[
                styles.tabBtn,
                activeTab === 'dressup' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'dressup' && styles.tabTextActive,
                ]}
              >
                ★ Star Jar & Hats
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                soundEngine.playPop();
                setActiveTab('stickers');
              }}
              accessibilityRole="button"
              accessibilityLabel="Zoo Sticker Album tab"
              style={[
                styles.tabBtn,
                activeTab === 'stickers' && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'stickers' && styles.tabTextActive,
                ]}
              >
                Zoo Stickers ({collectedCount}/{TOTAL_STICKER_COUNT})
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'dressup' ? (
              <>
                {/* Interactive Stage: Whit + Glowing Star Jar */}
                <View
                  style={[styles.heroStage, isTablet && styles.heroStageTablet]}
                >
                  <View style={styles.whitStageSpot}>
                    <WhitMascot
                      mood={whitCheering ? 'cheer' : 'wave'}
                      size={isTablet ? 170 : 140}
                      interactive
                      cycleAccessoryOnTap
                    />
                    {equipBurstKey && (
                      <View style={styles.equipBurstWrap} pointerEvents="none">
                        <SnapBurst
                          key={equipBurstKey}
                          size={isTablet ? 160 : 126}
                        />
                      </View>
                    )}
                  </View>

                  <BigGlowingStarJar
                    starsEarned={starsEarned}
                    size={isTablet ? 130 : 106}
                    shakeSignal={jarShake}
                    onTap={triggerWhitCheer}
                  />
                </View>

                {/* Progress Bar for Next Hat Unlock */}
                <View style={styles.progressBar}>
                  {nextUnlock ? (
                    <>
                      <Text style={styles.progressText}>
                        Next surprise in{' '}
                        <Text style={styles.progressStrong}>
                          {nextUnlock.starsRequired - starsEarned}{' '}
                          {nextUnlock.starsRequired - starsEarned === 1
                            ? 'star'
                            : 'stars'}
                        </Text>
                        !
                      </Text>
                      <View style={styles.miniPreviewChip}>
                        <WhitAccessorySvg accessory={nextUnlock.id} size={22} />
                      </View>
                    </>
                  ) : (
                    <Text style={styles.progressText}>
                      All 10 of Whit’s silly hats & props unlocked!
                    </Text>
                  )}
                </View>

                {/* Chunky 10-Look Dress-Up Shelf */}
                <View style={styles.toyboxGrid}>
                  {WHIT_ACCESSORIES.map((item) => {
                    const unlocked = isAccessoryUnlocked(item.id, starsEarned);
                    const selected = whitAccessory === item.id;

                    return (
                      <TactileButton
                        key={item.id}
                        onPress={() => handleSelectAccessory(item.id, unlocked)}
                        accessibilityLabel={
                          unlocked
                            ? `Put ${item.label} on Whit`
                            : `${item.label} unlocks at ${item.starsRequired} stars`
                        }
                        style={[
                          styles.toyCellWrap,
                          isTablet && styles.toyCellWrapTablet,
                        ]}
                      >
                        <View
                          style={[
                            styles.toyCard,
                            {
                              backgroundColor: unlocked
                                ? item.cardBg
                                : 'rgba(232, 224, 208, 0.72)',
                              borderColor: selected
                                ? COLORS.sunGold
                                : unlocked
                                ? item.cardBorder
                                : 'rgba(138, 114, 88, 0.34)',
                            },
                            selected && styles.toyCardSelected,
                            !unlocked && styles.toyCardLocked,
                          ]}
                        >
                          <View
                            style={[
                              styles.toyArtCircle,
                              !unlocked && { opacity: 0.45 },
                            ]}
                          >
                            <WhitAccessorySvg
                              accessory={item.id}
                              size={isTablet ? 52 : 44}
                            />
                          </View>

                          {unlocked ? (
                            <Text style={styles.toyLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                          ) : (
                            <View style={styles.lockCostPill}>
                              <LockIcon size={11} color={COLORS.woodDark} />
                              <StarIcon size={12} color={COLORS.sunGold} />
                              <Text style={styles.lockCostText}>
                                {item.starsRequired}
                              </Text>
                            </View>
                          )}

                          {selected && (
                            <View style={styles.equippedCheck}>
                              <Text style={styles.equippedCheckText}>✓</Text>
                            </View>
                          )}
                        </View>
                      </TactileButton>
                    );
                  })}
                </View>
              </>
            ) : (
              /* Living 24-Animal Zoo Sticker Album across 6 Worlds */
              <View style={styles.albumWrap}>
                <View style={styles.albumBanner}>
                  <StarIcon size={18} color={COLORS.sunGold} />
                  <Text style={styles.albumBannerText}>
                    {collectedCount >= TOTAL_STICKER_COUNT
                      ? 'You collected every friend across all 6 worlds! Tap any animal to hear them!'
                      : `Play games to collect all ${TOTAL_STICKER_COUNT} friends across 6 worlds! Tap collected animals to hear them!`}
                  </Text>
                </View>

                {STICKER_HABITATS.map((group) => (
                  <View
                    key={group.id}
                    style={[
                      styles.habitatSection,
                      { backgroundColor: group.bg, borderColor: group.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.habitatTitle,
                        { color: group.titleColor },
                      ]}
                    >
                      {group.title}
                    </Text>

                    <View style={styles.stickerRow}>
                      {group.animals.map((entry, idx) => {
                        const collected = collectedStickers.includes(entry.kind);
                        const sz = isTablet ? 76 : 58;
                        return (
                          <Pressable
                            key={entry.kind}
                            onPress={() =>
                              handleStickerTap(entry.kind, collected)
                            }
                            accessibilityRole="button"
                            accessibilityLabel={
                              collected
                                ? `Tap ${entry.label} sticker`
                                : `${entry.label} sticker not found yet`
                            }
                            style={({ pressed }) => [
                              styles.stickerSlot,
                              collected && styles.stickerSlotCollected,
                              pressed && { transform: [{ scale: 0.94 }] },
                            ]}
                          >
                            <View style={styles.stickerArtWrap}>
                              {collected ? (
                                <AnimatedZooAnimal
                                  state="idle"
                                  size={sz}
                                  seed={idx + 3}
                                  weight={getAnimalWeight(entry.kind)}
                                  silentTap
                                >
                                  <ZooExhibitAnimalSvg
                                    animal={entry.kind}
                                    size={sz}
                                  />
                                </AnimatedZooAnimal>
                              ) : (
                                <View style={{ opacity: 0.45 }}>
                                  <ZooExhibitAnimalSvg
                                    animal={entry.kind}
                                    size={sz}
                                    silhouette
                                  />
                                </View>
                              )}
                              {stickerBurstMap[entry.kind] && (
                                <View
                                  style={styles.stickerBurstWrap}
                                  pointerEvents="none"
                                >
                                  <SnapBurst
                                    key={stickerBurstMap[entry.kind]}
                                    size={isTablet ? 90 : 72}
                                  />
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.stickerLabel,
                                !collected && styles.stickerLabelLocked,
                              ]}
                              numberOfLines={1}
                            >
                              {collected ? entry.label : '?'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '91%',
    backgroundColor: COLORS.cream,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#DEC9A4',
    padding: 16,
    shadowColor: '#3A2818',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetTablet: {
    maxWidth: 620,
    padding: 22,
    borderRadius: 36,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF2C6',
    borderWidth: 1.5,
    borderColor: '#E8C772',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
  },
  titlePillText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFE6D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#EFE4CE',
    borderRadius: 18,
    padding: 4,
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFDF7',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  tabTextActive: {
    color: COLORS.woodDark,
  },
  scrollContent: {
    paddingBottom: 6,
  },
  heroStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#F3FAEE',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#CFE8C6',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 10,
    overflow: 'visible',
  },
  heroStageTablet: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  whitStageSpot: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  equipBurstWrap: {
    position: 'absolute',
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  bigJarPress: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bigJarAura: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 232, 122, 0.3)',
  },
  jarCountPill: {
    position: 'absolute',
    bottom: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9EC',
    borderWidth: 2,
    borderColor: COLORS.woodBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 3,
  },
  jarCountText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  jarBurstWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7DF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBD494',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.woodDark,
  },
  progressStrong: {
    fontWeight: '900',
    color: '#B5700E',
  },
  miniPreviewChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E5CE8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toyboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  toyCellWrap: {
    width: '31.5%',
  },
  toyCellWrapTablet: {
    width: '23.5%',
  },
  toyCard: {
    borderRadius: 20,
    borderWidth: 2.5,
    borderBottomWidth: 5,
    paddingVertical: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    position: 'relative',
  },
  toyCardSelected: {
    borderWidth: 3.5,
    borderBottomWidth: 6,
    shadowColor: '#C48A18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 8,
    elevation: 5,
  },
  toyCardLocked: {
    borderBottomWidth: 3.5,
  },
  toyArtCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 247, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.woodDark,
    textAlign: 'center',
  },
  lockCostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF9EC',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D6C29E',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lockCostText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  equippedCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.emerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedCheckText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  /* Living 16-Animal Zoo Sticker Album */
  albumWrap: {
    gap: 10,
  },
  albumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7DF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EBD494',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  albumBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.woodDark,
    lineHeight: 17,
  },
  habitatSection: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 10,
  },
  habitatTitle: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  stickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  stickerSlot: {
    flex: 1,
    backgroundColor: 'rgba(255, 253, 247, 0.72)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 114, 88, 0.22)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stickerSlotCollected: {
    backgroundColor: '#FFFDF8',
    borderColor: '#E5C677',
    borderWidth: 2,
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  stickerArtWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerBurstWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  stickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  stickerLabelLocked: {
    color: COLORS.inkMuted,
  },
});
