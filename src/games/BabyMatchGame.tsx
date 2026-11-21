import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import {
  DraggablePiece,
  DropAttempt,
  isPointNearRect,
  MeasurableNode,
  measureNodeRect,
} from '../components/DraggablePiece';
import { GameHeader } from '../components/GameHeader';
import { GorillaMood } from '../components/GorillaMascot';
import { StarIcon } from '../components/JungleArt';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

interface NurserySet {
  animals: ExhibitAnimalKind[];
  cushionBg: string[];
}

const NURSERY_SETS: NurserySet[] = [
  {
    animals: ['elephant', 'giraffe', 'monkey', 'lion'],
    cushionBg: ['#DDF6FF', '#FFF3C4', '#DCFAD8', '#FFE4D6'],
  },
  {
    animals: ['panda', 'whale', 'hippo', 'tiger'],
    cushionBg: ['#DCFAD8', '#DDF6FF', '#EFE2FF', '#FFE6CC'],
  },
  {
    animals: ['zebra', 'turtle', 'gorilla', 'flamingo'],
    cushionBg: ['#F2F6FF', '#D9FAF0', '#E4F5DC', '#FFE3F0'],
  },
];

const HeartSvg: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Path
      d="M 20 35 C 18 33 5 24 5 14 C 5 8.5 9.5 5 14.5 5 C 17.5 5 19.3 6.8 20 8.5 C 20.7 6.8 22.5 5 25.5 5 C 30.5 5 35 8.5 35 14 C 35 24 22 33 20 35 Z"
      fill="#FF5C8D"
      stroke="#9E1E4A"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <Path
      d="M 11 13 C 11 10.5 13 9 15 9"
      stroke="#FFD6E4"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const SnuggleHeartPop: React.FC<{ size: number }> = ({ size }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 150,
      useNativeDriver: true,
    }).start();
  }, [scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <HeartSvg size={size} />
    </Animated.View>
  );
};

/**
 * Mama & Baby Zoo Nursery (Paid Tier):
 * Reunite tiny baby zoo animals with their big smiling Mamas on cozy leafy cushions!
 * - Supports pointer-captured drag-and-drop AND tap-baby -> tap-mama.
 * - Difficulty Adjuster: Easy (2 pairs), Medium (3 pairs), Challenge (4 pairs).
 */
export const BabyMatchGame: React.FC = () => {
  const { addStar, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [setIdx, setSetIdx] = useState(0);
  const [matched, setMatched] = useState<ExhibitAnimalKind[]>([]);
  const [babyOrder, setBabyOrder] = useState<ExhibitAnimalKind[]>(() =>
    shuffle(NURSERY_SETS[0].animals.slice(0, 3))
  );
  const [selectedBaby, setSelectedBaby] = useState<ExhibitAnimalKind | null>(null);
  const [hoveredMama, setHoveredMama] = useState<ExhibitAnimalKind | null>(null);
  const [hintMama, setHintMama] = useState<ExhibitAnimalKind | null>(null);
  const [mascotMood, setMascotMood] = useState<GorillaMood>('idle');
  const [won, setWon] = useState(false);

  const mamaRefs = useRef<Record<string, MeasurableNode>>({});

  const currentSet = NURSERY_SETS[setIdx % NURSERY_SETS.length];
  const pairCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const activeAnimals = currentSet.animals.slice(0, pairCount);
  const hitPadding = isTablet ? 74 : 54;

  const loadSet = useCallback(
    (nextIdx: number, nextDiff: Difficulty = difficulty) => {
      const nextSet = NURSERY_SETS[nextIdx % NURSERY_SETS.length];
      const cnt = nextDiff === 1 ? 2 : nextDiff === 2 ? 3 : 4;
      setSetIdx(nextIdx);
      setMatched([]);
      setBabyOrder(shuffle(nextSet.animals.slice(0, cnt)));
      setSelectedBaby(null);
      setHoveredMama(null);
      setHintMama(null);
      setMascotMood('idle');
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
    if (matched.length === activeAnimals.length && activeAnimals.length > 0) {
      const t = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setMascotMood('cheer');
        setWon(true);
      }, 480);
      return () => clearTimeout(t);
    }
  }, [matched.length, activeAnimals.length, addStar]);

  const reuniteBaby = useCallback((animal: ExhibitAnimalKind) => {
    soundEngine.playMatch();
    setSelectedBaby(null);
    setHoveredMama(null);
    setHintMama(null);
    setMatched((prev) => (prev.includes(animal) ? prev : [...prev, animal]));
    setMascotMood('happy');
    setTimeout(() => setMascotMood('idle'), 850);
  }, []);

  const handleDragMove = useCallback(
    async (animal: ExhibitAnimalKind, attempt: DropAttempt) => {
      const rect = await measureNodeRect(mamaRefs.current[animal]);
      if (
        rect &&
        (isPointNearRect(
          { x: attempt.fingerX, y: attempt.fingerY },
          rect,
          hitPadding
        ) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            rect,
            hitPadding
          ))
      ) {
        setHoveredMama(animal);
      } else {
        setHoveredMama((prev) => (prev === animal ? null : prev));
      }
    },
    [hitPadding]
  );

  const handleDrop = useCallback(
    async (animal: ExhibitAnimalKind, attempt: DropAttempt): Promise<boolean> => {
      setHoveredMama(null);
      setSelectedBaby(null);
      const rect = await measureNodeRect(mamaRefs.current[animal]);
      if (!rect) return false;
      const hit =
        isPointNearRect(
          { x: attempt.fingerX, y: attempt.fingerY },
          rect,
          hitPadding
        ) ||
        isPointNearRect(
          { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
          rect,
          hitPadding
        );
      if (hit) {
        reuniteBaby(animal);
        return true;
      }
      return false;
    },
    [hitPadding, reuniteBaby]
  );

  const handleBabyTap = useCallback((animal: ExhibitAnimalKind) => {
    setSelectedBaby((prev) => (prev === animal ? null : animal));
    setHintMama(animal);
    setMascotMood('encourage');
    setTimeout(() => {
      setHintMama((prev) => (prev === animal ? null : prev));
      setMascotMood('idle');
    }, 1100);
  }, []);

  const handleMamaTap = useCallback(
    (animal: ExhibitAnimalKind) => {
      if (matched.includes(animal)) return;
      if (selectedBaby === animal) {
        reuniteBaby(animal);
      } else if (selectedBaby) {
        soundEngine.playGentleBounce();
        setHintMama(selectedBaby);
        setMascotMood('encourage');
        setTimeout(() => {
          setHintMama((prev) => (prev === selectedBaby ? null : prev));
          setMascotMood('idle');
        }, 900);
      }
    },
    [matched, selectedBaby, reuniteBaby]
  );

  const triggerHint = useCallback(() => {
    const next = activeAnimals.find((a) => !matched.includes(a));
    if (!next) return;
    setHintMama(next);
    setMascotMood('encourage');
    setTimeout(() => {
      setHintMama((prev) => (prev === next ? null : prev));
      setMascotMood('idle');
    }, 1200);
  }, [activeAnimals, matched]);

  const isFour = pairCount === 4;
  const mamaSize = isFour
    ? isTabletLandscape
      ? 122
      : isTablet
      ? 110
      : 76
    : isTabletLandscape
    ? 148
    : isTablet
    ? 136
    : 98;
  const babySize = Math.round(mamaSize * 0.64);
  const babyTrayTile = babySize + (isTablet ? 26 : 16);

  return (
    <View style={styles.container}>
      <GameHeader
        totalSteps={activeAnimals.length}
        completedSteps={matched.length}
        mascotMood={mascotMood}
        onMascotPress={triggerHint}
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
        {/* Frameless Leafy Meadow Mama Cushions */}
        <View style={[styles.nurseryRow, isTablet && { gap: 18 }]}>
          {activeAnimals.map((animal, idx) => {
            const isReunited = matched.includes(animal);
            const isGlow =
              hoveredMama === animal ||
              hintMama === animal ||
              selectedBaby === animal;

            return (
              <Pressable
                key={animal}
                onPress={() => handleMamaTap(animal)}
                accessibilityRole="button"
                accessibilityLabel={`Mama ${animal}`}
                style={{ flex: 1 }}
              >
                <View
                  ref={(node) => {
                    mamaRefs.current[animal] = node;
                  }}
                  style={[
                    styles.mamaCushion,
                    {
                      backgroundColor: currentSet.cushionBg[idx % currentSet.cushionBg.length],
                      borderRadius: isTablet ? 34 : 24,
                    },
                    isGlow && styles.mamaCushionGlow,
                    isReunited && styles.mamaCushionReunited,
                  ]}
                >
                  <View style={styles.mamaPairRow}>
                    <ZooExhibitAnimalSvg animal={animal} size={mamaSize} />
                    {isReunited && (
                      <View style={styles.snuggledBaby}>
                        <ZooExhibitAnimalSvg
                          animal={animal}
                          size={Math.round(babySize * 0.92)}
                        />
                      </View>
                    )}
                  </View>

                  {isReunited && (
                    <View style={styles.heartBadge} pointerEvents="none">
                      <SnuggleHeartPop size={isTablet ? 34 : 26} />
                    </View>
                  )}
                  {isReunited && (
                    <View style={styles.starCorner} pointerEvents="none">
                      <StarIcon size={isTablet ? 24 : 18} color="#F4C542" />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Warm Curved Wooden Nursery Shelf — babies sit directly on the dock (NO white cards!) */}
        <View
          style={[
            styles.babyDock,
            isTablet && styles.babyDockTablet,
          ]}
        >
          {babyOrder.map((animal) => {
            const isReunited = matched.includes(animal);
            const isSelected = selectedBaby === animal;
            return (
              <View
                key={`${setIdx}-${difficulty}-${animal}`}
                style={[
                  styles.traySlot,
                  { width: babyTrayTile, height: babyTrayTile },
                ]}
              >
                {!isReunited && (
                  <DraggablePiece
                    selected={isSelected}
                    onDragMove={(a) => handleDragMove(animal, a)}
                    onDrop={(a) => handleDrop(animal, a)}
                    onTap={() => handleBabyTap(animal)}
                  >
                    <View style={styles.babyPieceWrap}>
                      <ZooExhibitAnimalSvg
                        animal={animal}
                        size={babySize}
                        stickerRim
                        highlighted={isSelected}
                      />
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
    maxWidth: 820,
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  playAreaLandscape: {
    maxWidth: 1020,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  nurseryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    gap: 10,
    zIndex: 10,
  },
  mamaCushion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderWidth: 3.5,
    borderColor: 'rgba(74, 53, 37, 0.24)',
    borderBottomWidth: 7,
    position: 'relative',
    minHeight: 152,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  mamaCushionGlow: {
    borderColor: COLORS.sunGold,
    backgroundColor: '#FFF3B0',
    transform: [{ scale: 1.05 }],
  },
  mamaCushionReunited: {
    borderColor: COLORS.hibiscus,
    borderWidth: 4,
  },
  mamaPairRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  snuggledBaby: {
    marginLeft: -22,
    marginBottom: -4,
  },
  heartBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
  },
  starCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  babyDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(232, 193, 134, 0.92)',
    borderRadius: 40,
    borderWidth: 3.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 112,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  babyDockTablet: {
    borderRadius: 46,
    paddingVertical: 18,
    paddingHorizontal: 22,
    minHeight: 150,
  },
  traySlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  babyPieceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 8,
    elevation: 6,
  },
});
