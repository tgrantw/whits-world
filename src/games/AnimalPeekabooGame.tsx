import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { JungleBushCoverSvg, StarIcon } from '../components/JungleArt';
import { SnapBurst } from '../components/SnapBurst';
import { ZooAnimalKind, ZooAnimalSvg } from '../components/ZooAnimalsArt';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty, getAnimalDisplayName } from '../theme';
import { makeInstantTapProps } from '../utils/webTouch';

interface PeekCard {
  uid: string;
  animal: ZooAnimalKind;
}

interface PeekRoundPool {
  animals: ZooAnimalKind[];
  backdrop: ImageSourcePropType;
}

const ANIMAL_POOLS: PeekRoundPool[] = [
  {
    animals: ['monkey', 'toucan', 'gorilla', 'frog'],
    backdrop: STORYBOOK_ASSETS.bgClearing,
  },
  {
    animals: ['penguin', 'polarbear', 'seal', 'puffin'],
    backdrop: STORYBOOK_ASSETS.bgArctic,
  },
  {
    animals: ['cow', 'pig', 'duck', 'sheep'],
    backdrop: STORYBOOK_ASSETS.bgFarm,
  },
  {
    animals: ['giraffe', 'elephant', 'zebra', 'lion'],
    backdrop: STORYBOOK_ASSETS.bgSavanna,
  },
  {
    animals: ['panda', 'hippo', 'tiger', 'flamingo'],
    backdrop: STORYBOOK_ASSETS.bgSanctuary,
  },
];

function getRoundPool(roundIdx: number): PeekRoundPool {
  return ANIMAL_POOLS[roundIdx % ANIMAL_POOLS.length];
}

function getRoundAnimals(roundIdx: number, difficulty: Difficulty): ZooAnimalKind[] {
  const pool = getRoundPool(roundIdx).animals;
  const pairCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  return pool.slice(0, pairCount);
}

function createDeck(animals: ZooAnimalKind[]): PeekCard[] {
  const deck: PeekCard[] = [];
  animals.forEach((animal) => {
    deck.push({ uid: `${animal}-a`, animal });
    deck.push({ uid: `${animal}-b`, animal });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

interface BushCardProps {
  card: PeekCard;
  seed: number;
  size: number;
  isRevealed: boolean;
  isMatched: boolean;
  isCelebratingPair: boolean;
  onPress: () => void;
}

const BushCard: React.FC<BushCardProps> = ({
  card,
  seed,
  size,
  isRevealed,
  isMatched,
  isCelebratingPair,
  onPress,
}) => {
  const rustleAnim = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  const triggerBounce = useCallback(() => {
    popScale.setValue(0.88);
    Animated.spring(popScale, {
      toValue: 1,
      friction: 4.5,
      tension: 190,
      useNativeDriver: true,
    }).start();
  }, [popScale]);

  useEffect(() => {
    if (isRevealed) {
      popScale.setValue(0.78);
      Animated.spring(popScale, {
        toValue: 1,
        friction: 4.8,
        tension: 175,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.sequence([
        Animated.timing(rustleAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(rustleAnim, {
          toValue: -1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(rustleAnim, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isRevealed, popScale, rustleAnim]);

  const rotate = rustleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  const radius = size >= 150 ? 34 : size >= 115 ? 26 : 22;

  const handleActivate = useCallback(() => {
    if (isMatched) {
      triggerBounce();
    }
    onPress();
  }, [isMatched, onPress, triggerBounce]);

  const tap = makeInstantTapProps(handleActivate);

  return (
    <Pressable
      onPress={tap.onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={
        isRevealed ? `Zoo animal ${card.animal}` : 'Rustling jungle bush'
      }
      style={[
        styles.cardBase,
        { width: size, height: size, borderRadius: radius },
        isRevealed ? styles.cardRevealed : styles.cardBush,
        isMatched && styles.cardMatched,
        tap.webStyle,
      ]}
      {...tap.webProps}
    >
      {/* pointerEvents="none" guarantees inner SVGs & animations NEVER steal tablet touches */}
      <Animated.View
        pointerEvents="none"
        style={{
          transform: [{ scale: popScale }, { rotate }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isRevealed ? (
          <View style={[styles.animalFace, { borderRadius: radius - 7 }]}>
            <AnimatedZooAnimal
              state={isCelebratingPair ? 'celebrate' : 'idle'}
              size={size - 14}
              seed={seed}
              weight={getAnimalWeight(card.animal)}
            >
              <ZooAnimalSvg animal={card.animal} size={size - 14} />
            </AnimatedZooAnimal>
            {isMatched && (
              <View style={styles.matchStar} pointerEvents="none">
                <StarIcon size={size >= 150 ? 26 : 20} />
              </View>
            )}
          </View>
        ) : (
          <JungleBushCoverSvg size={size - 12} />
        )}
      </Animated.View>
      {isMatched && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SnapBurst size={Math.round(size * 0.9)} />
        </View>
      )}
    </Pressable>
  );
};

/**
 * Jungle Bush Peek-a-Boo (Paid Tier):
 * Frameless rustling jungle bushes set directly in the full-bleed meadow!
 * - Instant 0ms `touchstart` flipping on tablets (zero dropped taps from wiggle or palm rest)
 * - Fast toddler-friendly mismatch skip: tapping a new bush while two non-matching cards are open
 *   immediately flips the mismatch closed and reveals the newly tapped bush!
 * - Defaults to Medium (2 — 3x2) with labeled Easy | Med | Hard toggle.
 */
export const AnimalPeekabooGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [roundIdx, setRoundIdx] = useState(0);
  const [deck, setDeck] = useState<PeekCard[]>(() =>
    createDeck(getRoundAnimals(0, 2))
  );
  const [flippedUids, setFlippedUids] = useState<string[]>([]);
  const [matchedAnimals, setMatchedAnimals] = useState<ZooAnimalKind[]>([]);
  const [celebratingAnimal, setCelebratingAnimal] = useState<ZooAnimalKind | null>(
    null
  );
  const [won, setWon] = useState(false);

  // Refs keep rapid two-finger or back-to-back toddler taps 100% consistent without stale closures
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const flippedRef = useRef<string[]>(flippedUids);
  flippedRef.current = flippedUids;
  const matchedRef = useRef<ZooAnimalKind[]>(matchedAnimals);
  matchedRef.current = matchedAnimals;
  const matchLockRef = useRef(false);
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCardTimers = useCallback(() => {
    if (mismatchTimerRef.current) {
      clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
    if (matchTimerRef.current) {
      clearTimeout(matchTimerRef.current);
      matchTimerRef.current = null;
    }
    if (celebrateTimerRef.current) {
      clearTimeout(celebrateTimerRef.current);
      celebrateTimerRef.current = null;
    }
    matchLockRef.current = false;
  }, []);

  useEffect(() => () => clearCardTimers(), [clearCardTimers]);

  const currentPool = getRoundPool(roundIdx);
  const animalsInRound = getRoundAnimals(roundIdx, difficulty);

  const loadRound = useCallback(
    (idx: number, nextDiff: Difficulty = difficulty) => {
      clearCardTimers();
      const animals = getRoundAnimals(idx, nextDiff);
      const nextDeck = createDeck(animals);
      deckRef.current = nextDeck;
      flippedRef.current = [];
      matchedRef.current = [];
      setRoundIdx(idx);
      setDeck(nextDeck);
      setFlippedUids([]);
      setMatchedAnimals([]);
      setCelebratingAnimal(null);
      setWon(false);
    },
    [clearCardTimers, difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      setDifficulty(nextDiff);
      loadRound(roundIdx, nextDiff);
    },
    [roundIdx, loadRound]
  );

  useEffect(() => {
    if (
      matchedAnimals.length === animalsInRound.length &&
      animalsInRound.length > 0
    ) {
      const t = setTimeout(() => {
        soundEngine.playWin();
        addStar(1);
        setWon(true);
      }, 720);
      return () => clearTimeout(t);
    }
  }, [matchedAnimals.length, animalsInRound.length, addStar]);

  const handleCardPress = useCallback(
    (card: PeekCard) => {
      // Matched card: playful animal sound anytime!
      if (matchedRef.current.includes(card.animal)) {
        soundEngine.unlock();
        soundEngine.playAnimalSound(card.animal);
        return;
      }

      // Brief 280ms lock only while a confirmed matching pair is snapping in
      if (matchLockRef.current) return;

      let currentFlipped = flippedRef.current;

      // If 2 non-matching cards are currently waiting to flip back and the child taps
      // a fresh hidden bush, immediately close the old pair and open the new bush!
      if (mismatchTimerRef.current) {
        if (currentFlipped.includes(card.uid)) return;
        clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
        currentFlipped = [];
      }

      if (currentFlipped.includes(card.uid)) return;

      soundEngine.unlock();
      soundEngine.playCardFlip();

      const nextFlipped = [...currentFlipped, card.uid];
      flippedRef.current = nextFlipped;
      setFlippedUids(nextFlipped);

      if (nextFlipped.length === 2) {
        const first = deckRef.current.find((c) => c.uid === nextFlipped[0]);
        const second = deckRef.current.find((c) => c.uid === nextFlipped[1]);

        if (first && second && first.animal === second.animal) {
          matchLockRef.current = true;
          matchTimerRef.current = setTimeout(() => {
            matchTimerRef.current = null;
            matchLockRef.current = false;
            soundEngine.playMatch();
            soundEngine.playAnimalSound(first.animal);
            soundEngine.speakWord(
              `Peek-a-boo! ${getAnimalDisplayName(first.animal)}!`
            );
            collectSticker(first.animal);
            const nextMatched = matchedRef.current.includes(first.animal)
              ? matchedRef.current
              : [...matchedRef.current, first.animal];
            matchedRef.current = nextMatched;
            flippedRef.current = [];
            setMatchedAnimals(nextMatched);
            setCelebratingAnimal(first.animal);
            setFlippedUids([]);
            if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
            celebrateTimerRef.current = setTimeout(() => {
              setCelebratingAnimal((prev) =>
                prev === first.animal ? null : prev
              );
            }, 950);
          }, 260);
        } else {
          mismatchTimerRef.current = setTimeout(() => {
            mismatchTimerRef.current = null;
            soundEngine.playGentleBounce();
            flippedRef.current = [];
            setFlippedUids([]);
          }, 950);
        }
      }
    },
    [collectSticker]
  );

  const count = deck.length;
  const cardSize = isTabletLandscape
    ? count === 4
      ? 200
      : count === 6
      ? 180
      : 158
    : isTablet
    ? count === 4
      ? 192
      : count === 6
      ? 168
      : 144
    : count === 4
    ? 144
    : count === 6
    ? 110
    : 98;

  const gap = isTablet ? (count === 8 ? 20 : 26) : count === 8 ? 12 : 16;
  const cols = count === 4 ? 2 : count === 6 ? 3 : isTablet ? 4 : 2;
  const gridMaxWidth = cardSize * cols + gap * (cols - 1) + 24;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={currentPool.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      <GameHeader
        totalSteps={animalsInRound.length}
        completedSteps={matchedAnimals.length}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      <View
        style={[
          styles.playArea,
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
            : null,
        ]}
      >
        <View style={[styles.grid, { gap, maxWidth: gridMaxWidth }]}>
          {deck.map((card, idx) => {
            const isMatched = matchedAnimals.includes(card.animal);
            const isRevealed = isMatched || flippedUids.includes(card.uid);

            return (
              <BushCard
                key={`${roundIdx}-${difficulty}-${card.uid}`}
                card={card}
                seed={idx + 1}
                size={cardSize}
                isRevealed={isRevealed}
                isMatched={isMatched}
                isCelebratingPair={celebratingAnimal === card.animal}
                onPress={() => handleCardPress(card)}
              />
            );
          })}
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => loadRound(roundIdx + 1)}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingBottom: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  cardBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderBottomWidth: 7,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 11,
    elevation: 6,
    position: 'relative',
  },
  cardBush: {
    backgroundColor: '#C5E4B7',
    borderColor: '#3C7240',
  },
  cardRevealed: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.woodDark,
  },
  cardMatched: {
    borderColor: COLORS.sunGold,
    backgroundColor: '#FFF7D6',
  },
  animalFace: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  matchStar: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
