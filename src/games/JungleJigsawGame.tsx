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
import {
  AnimatedZooAnimal,
  getAnimalWeight,
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
import { TactileButton } from '../components/TactileButton';
import {
  getZooAnimalBackdrop,
  ZooAnimalKind,
  ZooAnimalSvg,
} from '../components/ZooAnimalsArt';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';

/** All 24 storybook zoo, aquarium, arctic & farm animals interleaved across all 6 watercolor worlds */
const JIGSAW_ANIMALS: ZooAnimalKind[] = [
  'gorilla',
  'giraffe',
  'whale',
  'penguin',
  'cow',
  'panda',
  'polarbear',
  'pig',
  'toucan',
  'elephant',
  'turtle',
  'seal',
  'duck',
  'tiger',
  'puffin',
  'sheep',
  'monkey',
  'lion',
  'octopus',
  'flamingo',
  'frog',
  'zebra',
  'clownfish',
  'hippo',
];

function getGridConfig(difficulty: Difficulty): {
  gridSize: 2 | 3;
  rows: number[][];
  prePlaced: number[];
  piecesToPlace: number[];
} {
  if (difficulty === 1) {
    return {
      gridSize: 2,
      rows: [
        [0, 1],
        [2, 3],
      ],
      prePlaced: [0, 3],
      piecesToPlace: [1, 2],
    };
  }
  if (difficulty === 2) {
    return {
      gridSize: 2,
      rows: [
        [0, 1],
        [2, 3],
      ],
      prePlaced: [],
      piecesToPlace: [0, 1, 2, 3],
    };
  }
  return {
    gridSize: 3,
    rows: [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ],
    prePlaced: [0, 2, 6],
    piecesToPlace: [1, 3, 4, 5, 7, 8],
  };
}

function shuffleIndices(indices: number[]): number[] {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Soft pulsing golden shimmer overlay on the matching jigsaw cell while dragging on Easy/Med */
const PulsingTileShimmer: React.FC<{ active: boolean }> = ({ active }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  if (!active) return null;

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.92],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.cellShimmerOverlay, { opacity }]}
    />
  );
};

/**
 * Zoo Jigsaw (Free Tier):
 * Warm watercolor storybook zoo animals paired with matching habitat backdrops,
 * magnetic golden drag shimmer, soft watercolor wooden dock, and per-animal voice celebrations.
 */
export const JungleJigsawGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [animalIdx, setAnimalIdx] = useState(0);
  const [solvedAnimals, setSolvedAnimals] = useState<ZooAnimalKind[]>([]);
  const [placed, setPlaced] = useState<number[]>(() =>
    getGridConfig(2).prePlaced
  );
  const [burstMap, setBurstMap] = useState<Record<number, number>>({});
  const [boardBurstKey, setBoardBurstKey] = useState<number | null>(null);
  const [trayOrder, setTrayOrder] = useState<number[]>(() =>
    shuffleIndices(getGridConfig(2).piecesToPlace)
  );
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [draggingTile, setDraggingTile] = useState<number | null>(null);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [hintTile, setHintTile] = useState<number | null>(null);
  const [won, setWon] = useState(false);

  const slotRefs = useRef<Record<number, MeasurableNode>>({});

  const config = getGridConfig(difficulty);
  const animal = JIGSAW_ANIMALS[animalIdx % JIGSAW_ANIMALS.length];
  const totalCells = config.gridSize * config.gridSize;
  const allComplete = placed.length === totalCells;
  const completedSteps = Math.max(0, placed.length - config.prePlaced.length);
  const totalSteps = config.piecesToPlace.length;

  const isThreeByThree = config.gridSize === 3;
  const tileSize = isThreeByThree
    ? isTabletLandscape
      ? 112
      : isTablet
      ? 116
      : 82
    : isTabletLandscape
    ? 162
    : isTablet
    ? 168
    : 118;

  const trayTileSize = isThreeByThree
    ? isTabletLandscape
      ? 88
      : isTablet
      ? 86
      : 60
    : isTabletLandscape
    ? 114
    : isTablet
    ? 108
    : 76;

  const hitPadding = isTablet ? 70 : 54;

  const loadAnimal = useCallback(
    (idx: number, nextDiff: Difficulty = difficulty) => {
      const cfg = getGridConfig(nextDiff);
      setAnimalIdx(idx);
      setPlaced(cfg.prePlaced);
      setBurstMap({});
      setBoardBurstKey(null);
      setTrayOrder(shuffleIndices(cfg.piecesToPlace));
      setSelectedTile(null);
      setDraggingTile(null);
      setHoveredTile(null);
      setHintTile(null);
      setWon(false);
    },
    [difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      setDifficulty(nextDiff);
      loadAnimal(animalIdx, nextDiff);
    },
    [animalIdx, loadAnimal]
  );

  useEffect(() => {
    if (placed.length === totalCells) {
      setBoardBurstKey(Date.now());
      setSolvedAnimals((prev) => (prev.includes(animal) ? prev : [...prev, animal]));
      collectSticker(animal);
      const voiceTimer = setTimeout(() => {
        soundEngine.playAnimalSound(animal);
      }, 150);
      const winTimer = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setWon(true);
      }, 920);
      return () => {
        clearTimeout(voiceTimer);
        clearTimeout(winTimer);
      };
    }
  }, [placed.length, totalCells, addStar, collectSticker, animal]);

  const snapTile = useCallback((tileIdx: number) => {
    soundEngine.playSnap();
    setSelectedTile(null);
    setDraggingTile(null);
    setHintTile(null);
    setHoveredTile(null);
    setPlaced((prev) => (prev.includes(tileIdx) ? prev : [...prev, tileIdx]));
    setBurstMap((prev) => ({ ...prev, [tileIdx]: Date.now() }));
  }, []);

  const handleDragMove = useCallback(
    async (tileIdx: number, attempt: DropAttempt) => {
      const rect = await measureNodeRect(slotRefs.current[tileIdx]);
      if (
        rect &&
        (isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
          isPointNearRect(
            { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
            rect,
            hitPadding
          ))
      ) {
        setHoveredTile(tileIdx);
      } else {
        setHoveredTile((prev) => (prev === tileIdx ? null : prev));
      }
    },
    [hitPadding]
  );

  const handleDrop = useCallback(
    async (tileIdx: number, attempt: DropAttempt): Promise<boolean> => {
      setHoveredTile(null);
      setSelectedTile(null);
      setDraggingTile(null);
      const rect = await measureNodeRect(slotRefs.current[tileIdx]);
      if (!rect) return false;

      const hit =
        isPointNearRect({ x: attempt.fingerX, y: attempt.fingerY }, rect, hitPadding) ||
        isPointNearRect(
          { x: attempt.pieceCenterX, y: attempt.pieceCenterY },
          rect,
          hitPadding
        );

      if (hit) {
        snapTile(tileIdx);
        return true;
      }
      return false;
    },
    [hitPadding, snapTile]
  );

  const handleCellTap = useCallback(
    (tileIdx: number) => {
      if (allComplete) {
        soundEngine.playAnimalSound(animal);
        setBoardBurstKey(Date.now());
        return;
      }
      if (placed.includes(tileIdx)) return;
      if (selectedTile === tileIdx) {
        snapTile(tileIdx);
      } else if (selectedTile !== null) {
        soundEngine.playGentleBounce();
        setHintTile(selectedTile);
        setTimeout(() => {
          setHintTile((prev) => (prev === selectedTile ? null : prev));
        }, 900);
      }
    },
    [allComplete, animal, placed, selectedTile, snapTile]
  );

  const handlePieceTap = useCallback((tileIdx: number) => {
    setSelectedTile((prev) => (prev === tileIdx ? null : tileIdx));
    setHintTile(tileIdx);
    setTimeout(() => {
      setHintTile((prev) => (prev === tileIdx ? null : prev));
    }, 1100);
  }, []);

  const pickerThumbSize = isTablet ? 46 : 38;
  const pickerTabSize = isTablet ? 54 : 44;
  const boardDimension = tileSize * config.gridSize;

  const renderAnimalPicker = () => (
    <View
      style={[
        styles.animalPickerShell,
        isTabletLandscape && { maxWidth: boardDimension + 48 },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.animalPickerRow}
      >
        {JIGSAW_ANIMALS.map((a, idx) => {
          const active = idx === animalIdx % JIGSAW_ANIMALS.length;
          const solved = solvedAnimals.includes(a);
          return (
            <TactileButton
              key={a}
              onPress={() => {
                soundEngine.playPop();
                loadAnimal(idx);
              }}
              accessibilityLabel={`Play ${a} jigsaw puzzle`}
              style={{ width: pickerTabSize }}
            >
              <View
                style={[
                  styles.animalTab,
                  {
                    width: pickerTabSize,
                    height: pickerTabSize,
                    borderRadius: pickerTabSize / 2,
                  },
                  active && styles.animalTabActive,
                ]}
              >
                <View
                  style={[
                    styles.animalThumbClip,
                    {
                      width: pickerThumbSize,
                      height: pickerThumbSize,
                      borderRadius: pickerThumbSize / 2,
                    },
                  ]}
                >
                  <ZooAnimalSvg animal={a} size={pickerThumbSize} />
                </View>
                {solved && (
                  <View style={styles.solvedDot}>
                    <Text style={styles.solvedDotText}>✓</Text>
                  </View>
                )}
              </View>
            </TactileButton>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderBoard = () => (
    <AnimatedZooAnimal
      state={allComplete ? 'celebrate' : 'static'}
      size={boardDimension}
      seed={animalIdx + 1}
      weight={getAnimalWeight(animal)}
    >
      <View
        style={[
          styles.boardCanvasShadow,
          allComplete && styles.boardCanvasComplete,
        ]}
      >
        <View
          style={[
            styles.gridInner,
            {
              width: boardDimension,
              height: boardDimension,
              borderRadius: isTablet ? 28 : 22,
            },
          ]}
        >
          {config.rows.map((row, rIdx) => (
            <View key={rIdx} style={styles.gridRow}>
              {row.map((tileIdx) => {
                const isPlaced = placed.includes(tileIdx);
                const isDragShimmer =
                  !isPlaced && draggingTile === tileIdx && difficulty <= 2;
                const isGlow =
                  hoveredTile === tileIdx ||
                  hintTile === tileIdx ||
                  selectedTile === tileIdx;

                return (
                  <Pressable
                    key={tileIdx}
                    onPress={() => handleCellTap(tileIdx)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      allComplete
                        ? `Tap completed ${animal}`
                        : `Puzzle tile ${tileIdx + 1}`
                    }
                    style={{ width: tileSize, height: tileSize }}
                  >
                    <View
                      ref={(node) => {
                        slotRefs.current[tileIdx] = node;
                      }}
                      style={[styles.cell, { width: tileSize, height: tileSize }]}
                    >
                      <ZooAnimalSvg
                        animal={animal}
                        size={tileSize}
                        gridSize={config.gridSize}
                        tileIndex={tileIdx}
                        faded={!isPlaced}
                      />
                      {!allComplete && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.cellOverlay,
                            !isPlaced && styles.cellGuideOverlay,
                            isGlow && !isPlaced && styles.cellHighlightOverlay,
                          ]}
                        />
                      )}
                      <PulsingTileShimmer active={isDragShimmer} />
                      {burstMap[tileIdx] && (
                        <SnapBurst
                          key={burstMap[tileIdx]}
                          size={isTablet ? 114 : 88}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Celebratory center sparkle burst when all pieces lock in */}
          {boardBurstKey && allComplete && (
            <View style={styles.centerBurstWrap} pointerEvents="none">
              <SnapBurst key={boardBurstKey} size={isTablet ? 200 : 150} />
            </View>
          )}
        </View>
      </View>
    </AnimatedZooAnimal>
  );

  const renderCurvedDock = () => (
    <View
      style={[
        styles.woodenDock,
        isTablet && styles.woodenDockTablet,
        isTabletLandscape && styles.woodenDockLandscape,
      ]}
    >
      {/* Subtle sunlit watercolor wood sheen along top lip */}
      <View style={styles.woodenDockGloss} pointerEvents="none" />
      {trayOrder.map((tileIdx, idx) => {
        const isPlaced = placed.includes(tileIdx);
        const isSelected = selectedTile === tileIdx;
        const isDragging = draggingTile === tileIdx;
        return (
          <View
            key={`${animal}-${difficulty}-${tileIdx}`}
            style={[
              styles.dockSlot,
              {
                width: trayTileSize + (isTablet ? 14 : 8),
                height: trayTileSize + (isTablet ? 14 : 8),
              },
            ]}
          >
            {!isPlaced && (
              <DraggablePiece
                selected={isSelected}
                dragScale={1}
                onDragStateChange={(active) =>
                  setDraggingTile((prev) =>
                    active ? tileIdx : prev === tileIdx ? null : prev
                  )
                }
                onDragMove={(a) => handleDragMove(tileIdx, a)}
                onDrop={(a) => handleDrop(tileIdx, a)}
                onTap={() => handlePieceTap(tileIdx)}
              >
                <AnimatedZooAnimal
                  state={isDragging ? 'dragging' : 'idle'}
                  size={trayTileSize + 6}
                  seed={idx + 7}
                  weight="medium"
                >
                  <View
                    style={[
                      styles.pieceTile,
                      {
                        width: trayTileSize + 6,
                        height: trayTileSize + 6,
                        borderRadius: isTablet ? 20 : 15,
                      },
                      isSelected && styles.pieceTileSelected,
                    ]}
                  >
                    <ZooAnimalSvg
                      animal={animal}
                      size={trayTileSize}
                      gridSize={config.gridSize}
                      tileIndex={tileIdx}
                    />
                  </View>
                </AnimatedZooAnimal>
              </DraggablePiece>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Full-bleed habitat-matched Warm Watercolor & Gouache backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={getZooAnimalBackdrop(animal)}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.sunlitVeil} />
      </View>

      <GameHeader
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      {isTabletLandscape ? (
        <View style={styles.playAreaLandscape}>
          <View style={styles.landscapeLeftCol}>
            {renderBoard()}
            {renderAnimalPicker()}
          </View>
          <View style={styles.landscapeRightCol}>{renderCurvedDock()}</View>
        </View>
      ) : (
        <View
          style={[
            styles.playArea,
            isTablet && styles.playAreaTabletPortrait,
          ]}
        >
          {renderBoard()}
          {renderCurvedDock()}
          {renderAnimalPicker()}
        </View>
      )}

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => loadAnimal(animalIdx + 1)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sunlitVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 250, 232, 0.14)',
  },
  playArea: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 14,
    paddingBottom: 14,
    overflow: 'visible',
  },
  playAreaTabletPortrait: {
    maxWidth: 760,
    paddingHorizontal: 28,
    paddingBottom: 22,
  },
  playAreaLandscape: {
    flex: 1,
    width: '100%',
    maxWidth: 1140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 28,
    paddingBottom: 18,
    overflow: 'visible',
  },
  landscapeLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 10,
  },
  landscapeRightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    overflow: 'visible',
  },
  animalPickerShell: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: 'rgba(255, 249, 236, 0.54)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  animalPickerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  animalTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(122, 82, 44, 0.28)',
    backgroundColor: 'rgba(255, 249, 236, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
    position: 'relative',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },
  animalTabActive: {
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    backgroundColor: COLORS.sunYellow,
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  animalThumbClip: {
    overflow: 'hidden',
  },
  solvedDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.emerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solvedDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  /* Warm heirloom watercolor paper mat — soft cream glow, zero harsh outline */
  boardCanvasShadow: {
    borderRadius: 32,
    padding: 7,
    backgroundColor: 'rgba(255, 250, 238, 0.88)',
    borderWidth: 2,
    borderColor: 'rgba(176, 134, 82, 0.34)',
    zIndex: 10,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  boardCanvasComplete: {
    borderColor: 'rgba(242, 195, 76, 0.85)',
    backgroundColor: 'rgba(255, 252, 240, 0.96)',
  },
  gridInner: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    position: 'relative',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  cellGuideOverlay: {
    borderWidth: 1.25,
    borderColor: 'rgba(122, 86, 48, 0.22)',
    backgroundColor: 'rgba(255, 249, 234, 0.24)',
  },
  cellHighlightOverlay: {
    borderWidth: 4,
    borderColor: COLORS.sunGold,
    backgroundColor: 'rgba(248, 212, 89, 0.28)',
  },
  cellShimmerOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 10,
    borderWidth: 3.5,
    borderColor: '#FFE173',
    backgroundColor: 'rgba(255, 236, 150, 0.28)',
  },
  centerBurstWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  /* Softly shaded watercolor-style curved wooden dock matching Zoo Exhibits */
  woodenDock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '96%',
    maxWidth: 520,
    backgroundColor: 'rgba(246, 221, 174, 0.88)',
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(156, 108, 60, 0.36)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 48, 0.44)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 100,
    zIndex: 50,
    overflow: 'visible',
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  woodenDockGloss: {
    position: 'absolute',
    top: 3,
    left: 24,
    right: 24,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.42)',
  },
  woodenDockTablet: {
    maxWidth: 660,
    borderRadius: 44,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 16,
  },
  woodenDockLandscape: {
    width: 316,
    maxWidth: 316,
    minHeight: 320,
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 14,
  },
  dockSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pieceTile: {
    overflow: 'hidden',
    backgroundColor: '#FFFDF7',
    borderWidth: 2.5,
    borderColor: 'rgba(138, 92, 46, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 9,
    elevation: 5,
  },
  pieceTileSelected: {
    borderColor: COLORS.sunGold,
    borderWidth: 4,
  },
});
