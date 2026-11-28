import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  ZooAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import {
  DraggablePiece,
  DropAttempt,
  isPointNearRect,
  MeasurableNode,
  measureNodeRect,
} from '../components/DraggablePiece';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty, getAnimalDisplayName } from '../theme';
import { makeInstantTapProps } from '../utils/webTouch';

type SizeTier = 'tiny' | 'small' | 'medium' | 'big';

const TIER_LABELS: Record<SizeTier, string> = {
  tiny: 'Tiny',
  small: 'Small',
  medium: 'Medium',
  big: 'Big',
};

interface ParadeAnimal {
  tier: SizeTier;
  animal: ExhibitAnimalKind;
  svgSize: number;
  podiumHeight: number;
  dots: number;
}

interface ParadeRound {
  backdrop: ImageSourcePropType;
  animals: ParadeAnimal[];
}

const PARADE_SETS: ParadeRound[] = [
  {
    backdrop: STORYBOOK_ASSETS.bgClearing,
    animals: [
      { tier: 'tiny', animal: 'frog', svgSize: 48, podiumHeight: 24, dots: 1 },
      { tier: 'small', animal: 'toucan', svgSize: 66, podiumHeight: 38, dots: 2 },
      { tier: 'medium', animal: 'monkey', svgSize: 86, podiumHeight: 54, dots: 3 },
      { tier: 'big', animal: 'elephant', svgSize: 108, podiumHeight: 72, dots: 4 },
    ],
  },
  {
    backdrop: STORYBOOK_ASSETS.bgArctic,
    animals: [
      { tier: 'tiny', animal: 'puffin', svgSize: 48, podiumHeight: 24, dots: 1 },
      { tier: 'small', animal: 'penguin', svgSize: 66, podiumHeight: 38, dots: 2 },
      { tier: 'medium', animal: 'seal', svgSize: 86, podiumHeight: 54, dots: 3 },
      { tier: 'big', animal: 'polarbear', svgSize: 108, podiumHeight: 72, dots: 4 },
    ],
  },
  {
    backdrop: STORYBOOK_ASSETS.bgFarm,
    animals: [
      { tier: 'tiny', animal: 'duck', svgSize: 48, podiumHeight: 24, dots: 1 },
      { tier: 'small', animal: 'pig', svgSize: 66, podiumHeight: 38, dots: 2 },
      { tier: 'medium', animal: 'sheep', svgSize: 86, podiumHeight: 54, dots: 3 },
      { tier: 'big', animal: 'cow', svgSize: 108, podiumHeight: 72, dots: 4 },
    ],
  },
  {
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    animals: [
      { tier: 'tiny', animal: 'clownfish', svgSize: 48, podiumHeight: 24, dots: 1 },
      { tier: 'small', animal: 'panda', svgSize: 66, podiumHeight: 38, dots: 2 },
      { tier: 'medium', animal: 'zebra', svgSize: 86, podiumHeight: 54, dots: 3 },
      { tier: 'big', animal: 'giraffe', svgSize: 108, podiumHeight: 72, dots: 4 },
    ],
  },
  {
    backdrop: STORYBOOK_ASSETS.bgSanctuary,
    animals: [
      { tier: 'tiny', animal: 'frog', svgSize: 48, podiumHeight: 24, dots: 1 },
      { tier: 'small', animal: 'monkey', svgSize: 66, podiumHeight: 38, dots: 2 },
      { tier: 'medium', animal: 'lion', svgSize: 86, podiumHeight: 54, dots: 3 },
      { tier: 'big', animal: 'hippo', svgSize: 108, podiumHeight: 72, dots: 4 },
    ],
  },
];

function getActiveRound(setIdx: number): ParadeRound {
  return PARADE_SETS[setIdx % PARADE_SETS.length];
}

function getActiveSet(setIdx: number, difficulty: Difficulty): ParadeAnimal[] {
  const full = getActiveRound(setIdx).animals;
  if (difficulty === 1) {
    return [
      { ...full[0], svgSize: 58, podiumHeight: 30, dots: 1 },
      { ...full[3], svgSize: 112, podiumHeight: 68, dots: 2 },
    ];
  }
  if (difficulty === 2) {
    return [
      { ...full[0], svgSize: 56, podiumHeight: 28, dots: 1 },
      { ...full[2], svgSize: 82, podiumHeight: 48, dots: 2 },
      { ...full[3], svgSize: 108, podiumHeight: 68, dots: 3 },
    ];
  }
  return full;
}

function shuffledTiersFor(set: ParadeAnimal[]): SizeTier[] {
  const tiers = set.map((s) => s.tier);
  if (tiers.length === 2) return [tiers[1], tiers[0]];
  if (tiers.length === 3) {
    const orders: SizeTier[][] = [
      [tiers[2], tiers[0], tiers[1]],
      [tiers[1], tiers[2], tiers[0]],
      [tiers[2], tiers[1], tiers[0]],
    ];
    return orders[Math.floor(Math.random() * orders.length)];
  }
  const orders4: SizeTier[][] = [
    [tiers[2], tiers[0], tiers[3], tiers[1]],
    [tiers[3], tiers[1], tiers[0], tiers[2]],
    [tiers[1], tiers[3], tiers[2], tiers[0]],
  ];
  return orders4[Math.floor(Math.random() * orders4.length)];
}

function weightForSizeTier(tier: SizeTier): ZooAnimalWeight {
  if (tier === 'tiny' || tier === 'small') return 'light';
  if (tier === 'big') return 'heavy';
  return 'medium';
}

/**
 * Zoo Parade (Paid Tier):
 * Stepped wooden parade podiums sit naturally in the full-bleed jungle meadow
 * with weight-appropriate animal breathing, clean drag lift, celebrate hops & Med (2) default.
 */
export const SizeSorterGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [setIdx, setSetIdx] = useState(0);
  const [placed, setPlaced] = useState<SizeTier[]>([]);
  const [burstMap, setBurstMap] = useState<Record<string, number>>({});
  const [trayOrder, setTrayOrder] = useState<SizeTier[]>(() =>
    shuffledTiersFor(getActiveSet(0, 2))
  );
  const [selectedTier, setSelectedTier] = useState<SizeTier | null>(null);
  const [draggingTier, setDraggingTier] = useState<SizeTier | null>(null);
  const [justPlacedTier, setJustPlacedTier] = useState<SizeTier | null>(null);
  const [hoveredTier, setHoveredTier] = useState<SizeTier | null>(null);
  const [hintTier, setHintTier] = useState<SizeTier | null>(null);
  const [won, setWon] = useState(false);

  const slotRefs = useRef<Record<string, MeasurableNode>>({});

  const currentRound = getActiveRound(setIdx);
  const currentSet = getActiveSet(setIdx, difficulty);
  const allPlaced = placed.length === currentSet.length && currentSet.length > 0;
  const hitPadding = isTablet ? 72 : 52;
  const isFour = currentSet.length === 4;
  const sizeMult = isFour
    ? isTabletLandscape
      ? 1.24
      : isTablet
      ? 1.16
      : 0.84
    : isTabletLandscape
    ? 1.38
    : isTablet
    ? 1.3
    : 1;

  const loadSet = useCallback(
    (idx: number, nextDiff: Difficulty = difficulty) => {
      const nextSet = getActiveSet(idx, nextDiff);
      setSetIdx(idx);
      setPlaced([]);
      setBurstMap({});
      setTrayOrder(shuffledTiersFor(nextSet));
      setSelectedTier(null);
      setDraggingTier(null);
      setJustPlacedTier(null);
      setHoveredTier(null);
      setHintTier(null);
      setWon(false);
    },
    [difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      setDifficulty(nextDiff);
      loadSet(setIdx, nextDiff);
    },
    [setIdx, loadSet]
  );

  useEffect(() => {
    if (allPlaced) {
      const t = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setWon(true);
      }, 780);
      return () => clearTimeout(t);
    }
  }, [allPlaced, addStar]);

  const placeTier = useCallback(
    (tier: SizeTier) => {
      soundEngine.playSnap();
      const matchedSlot = currentSet.find((s) => s.tier === tier);
      if (matchedSlot) {
        soundEngine.playAnimalSound(matchedSlot.animal);
        soundEngine.speakWord(
          `${TIER_LABELS[tier]} ${getAnimalDisplayName(matchedSlot.animal)}!`
        );
        collectSticker(matchedSlot.animal);
      }
      setSelectedTier(null);
      setDraggingTier(null);
      setHintTier(null);
      setHoveredTier(null);
      setPlaced((prev) => (prev.includes(tier) ? prev : [...prev, tier]));
      setJustPlacedTier(tier);
      setTimeout(() => {
        setJustPlacedTier((prev) => (prev === tier ? null : prev));
      }, 950);
      setBurstMap((prev) => ({ ...prev, [tier]: Date.now() }));
    },
    [currentSet, collectSticker]
  );

  const handleDragMove = useCallback(
    async (tier: SizeTier, attempt: DropAttempt) => {
      const rect = await measureNodeRect(slotRefs.current[tier]);
      if (
        rect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            rect,
            hitPadding
          ))
      ) {
        setHoveredTier(tier);
      } else {
        setHoveredTier((prev) => (prev === tier ? null : prev));
      }
    },
    [hitPadding]
  );

  const handleDrop = useCallback(
    async (tier: SizeTier, attempt: DropAttempt): Promise<boolean> => {
      setHoveredTier(null);
      setSelectedTier(null);
      const rect = await measureNodeRect(slotRefs.current[tier]);
      if (!rect) return false;
      const hit =
        isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
        isPointNearRect(
          { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
          rect,
          hitPadding
        );
      if (hit) {
        placeTier(tier);
        return true;
      }
      return false;
    },
    [hitPadding, placeTier]
  );

  const handleAnimalTap = useCallback((tier: SizeTier) => {
    setSelectedTier((prev) => (prev === tier ? null : tier));
    setHintTier(tier);
    setTimeout(() => {
      setHintTier((prev) => (prev === tier ? null : prev));
    }, 1100);
  }, []);

  const handlePodiumTap = useCallback(
    (tier: SizeTier) => {
      if (placed.includes(tier)) return;
      if (selectedTier === tier) {
        placeTier(tier);
      } else if (selectedTier) {
        soundEngine.playGentleBounce();
        setHintTier(selectedTier);
        setTimeout(() => {
          setHintTier((prev) => (prev === selectedTier ? null : prev));
        }, 900);
      }
    },
    [placed, selectedTier, placeTier]
  );

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={currentRound.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <GameHeader
        totalSteps={currentSet.length}
        completedSteps={placed.length}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      <View
        style={[
          styles.playArea,
          isTabletLandscape
            ? styles.playAreaLandscape
            : isTablet
            ? styles.playAreaTablet
            : null,
        ]}
      >
        {/* Open-air Stepped Wooden Parade Podiums (NO boxy picture frame!) */}
        <View style={[styles.podiumsRow, isTablet && { gap: isFour ? 14 : 22 }]}>
          {currentSet.map((slot, idx) => {
            const isPlaced = placed.includes(slot.tier);
            const isGlow =
              hoveredTier === slot.tier ||
              hintTier === slot.tier ||
              selectedTier === slot.tier;
            const animalPx = Math.round(slot.svgSize * sizeMult);
            const podH = Math.round(slot.podiumHeight * sizeMult);
            const podiumWeight = weightForSizeTier(slot.tier);

            const podiumTap = makeInstantTapProps(() => {
              if (isPlaced) {
                soundEngine.unlock();
                soundEngine.playAnimalSound(slot.animal);
                return;
              }
              handlePodiumTap(slot.tier);
            });

            return (
              <Pressable
                key={slot.tier}
                onPress={podiumTap.onPress}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${slot.tier} podium`}
                style={[{ flex: 1 }, podiumTap.webStyle]}
                {...podiumTap.webProps}
              >
                <View
                  ref={(node) => {
                    slotRefs.current[slot.tier] = node;
                  }}
                  pointerEvents="none"
                  style={[styles.column, isGlow && styles.columnHighlight]}
                >
                  <View
                    style={[
                      styles.itemSpot,
                      { minHeight: Math.round(112 * sizeMult) },
                    ]}
                  >
                    {isPlaced ? (
                      <AnimatedZooAnimal
                        state={
                          allPlaced || justPlacedTier === slot.tier
                            ? 'celebrate'
                            : 'idle'
                        }
                        size={animalPx}
                        seed={idx + 1}
                        weight={podiumWeight}
                      >
                        <ZooExhibitAnimalSvg
                          animal={slot.animal}
                          size={animalPx}
                        />
                      </AnimatedZooAnimal>
                    ) : (
                      <AnimatedZooAnimal state="static" size={animalPx}>
                        <ZooExhibitAnimalSvg
                          animal={slot.animal}
                          size={animalPx}
                          silhouette
                          highlighted={isGlow}
                        />
                      </AnimatedZooAnimal>
                    )}
                    {burstMap[slot.tier] && (
                      <SnapBurst key={burstMap[slot.tier]} size={isTablet ? 120 : 96} />
                    )}
                  </View>

                  <View
                    style={[
                      styles.podium,
                      {
                        height: podH,
                        borderRadius: isTablet ? 20 : 14,
                      },
                      isPlaced && styles.podiumFilled,
                    ]}
                  >
                    <View style={styles.podiumRail} />
                    <View style={[styles.podiumStars, isFour && { gap: 4 }]}>
                      {Array.from({ length: slot.dots }, (_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            isTablet && {
                              width: isFour ? 10 : 12,
                              height: isFour ? 10 : 12,
                              borderRadius: 6,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Curved Warm Wooden Shelf for Draggable Animals (NO white cards!) */}
        <View style={[styles.woodenDock, isTablet && styles.woodenDockTablet]}>
          {trayOrder.map((tier, idx) => {
            const slot = currentSet.find((s) => s.tier === tier);
            if (!slot) return null;
            const isPlaced = placed.includes(tier);
            const isSelected = selectedTier === tier;
            const isDragging = draggingTier === tier;
            const animalPx = Math.round(slot.svgSize * sizeMult);

            return (
              <View
                key={`${setIdx}-${difficulty}-${tier}`}
                style={[
                  styles.traySlot,
                  { height: Math.round(112 * sizeMult) },
                ]}
              >
                {!isPlaced && (
                  <DraggablePiece
                    selected={isSelected}
                    dragScale={1}
                    onDragStateChange={(active) =>
                      setDraggingTier((prev) =>
                        active ? tier : prev === tier ? null : prev
                      )
                    }
                    onDragMove={(a) => handleDragMove(tier, a)}
                    onDrop={(a) => handleDrop(tier, a)}
                    onTap={() => handleAnimalTap(tier)}
                  >
                    <View style={styles.animalStand}>
                      <AnimatedZooAnimal
                        state={isDragging ? 'dragging' : 'idle'}
                        size={animalPx}
                        seed={idx + 11}
                        weight={weightForSizeTier(tier)}
                      >
                        <ZooExhibitAnimalSvg
                          animal={slot.animal}
                          size={animalPx}
                          stickerRim
                          highlighted={isSelected}
                        />
                      </AnimatedZooAnimal>
                    </View>
                  </DraggablePiece>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => loadSet(setIdx + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playArea: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 14,
    paddingBottom: 18,
    overflow: 'visible',
  },
  playAreaTablet: {
    maxWidth: 800,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  playAreaLandscape: {
    maxWidth: 980,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  podiumsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
    zIndex: 10,
  },
  column: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  columnHighlight: {
    transform: [{ scale: 1.05 }],
  },
  itemSpot: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    position: 'relative',
  },
  podium: {
    width: '92%',
    backgroundColor: COLORS.woodMid,
    borderWidth: 3.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  podiumFilled: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.jungleDark,
  },
  podiumRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255, 249, 236, 0.44)',
  },
  podiumStars: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFF9EC',
    borderWidth: 1.5,
    borderColor: COLORS.woodDark,
  },
  woodenDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 221, 174, 0.88)',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.36)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 48, 0.44)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    minHeight: 130,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  woodenDockTablet: {
    borderRadius: 46,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 168,
  },
  traySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  animalStand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
