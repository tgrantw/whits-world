import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';
import { makeInstantTapProps } from '../utils/webTouch';

const ROUNDS_TO_WIN = 5;

const NUMBER_WORDS: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
};

const COUNT_NOTES = [
  261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25,
];

interface CountAnimalSpec {
  kind: ExhibitAnimalKind;
  singular: string;
  plural: string;
  backdrop: ImageSourcePropType;
}

const COUNT_ANIMALS: CountAnimalSpec[] = [
  { kind: 'monkey', singular: 'Monkey', plural: 'Monkeys', backdrop: STORYBOOK_ASSETS.bgClearing },
  { kind: 'elephant', singular: 'Elephant', plural: 'Elephants', backdrop: STORYBOOK_ASSETS.bgSavanna },
  { kind: 'penguin', singular: 'Penguin', plural: 'Penguins', backdrop: STORYBOOK_ASSETS.bgArctic },
  { kind: 'lion', singular: 'Lion', plural: 'Lions', backdrop: STORYBOOK_ASSETS.bgSavanna },
  { kind: 'frog', singular: 'Frog', plural: 'Frogs', backdrop: STORYBOOK_ASSETS.bgClearing },
  { kind: 'turtle', singular: 'Turtle', plural: 'Turtles', backdrop: STORYBOOK_ASSETS.bgAquarium },
  { kind: 'duck', singular: 'Duck', plural: 'Ducks', backdrop: STORYBOOK_ASSETS.bgFarm },
  { kind: 'panda', singular: 'Panda', plural: 'Pandas', backdrop: STORYBOOK_ASSETS.bgSanctuary },
];

const NUM_COLORS = [
  { bg: '#FFE4E1', border: '#C94A42', text: '#A6322B', dot: '#E85A50' },
  { bg: '#DEF4FF', border: '#2D7DA8', text: '#1F6085', dot: '#4DAAD8' },
  { bg: '#E3F7DF', border: '#38823D', text: '#28642C', dot: '#5BB55E' },
  { bg: '#FFF3CC', border: '#BA8516', text: '#8C6009', dot: '#E8A530' },
  { bg: '#F0E6FF', border: '#6C47A6', text: '#523285', dot: '#9B74D4' },
];

interface CountRound {
  count: number;
  choices: number[];
  animal: CountAnimalSpec;
}

function buildCountRound(
  difficulty: Difficulty,
  prevCount?: number,
  prevAnimal?: ExhibitAnimalKind
): CountRound {
  const maxN = difficulty === 1 ? 5 : difficulty === 2 ? 7 : 10;
  const choiceCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;

  const numCandidates: number[] = [];
  for (let n = 1; n <= maxN; n++) {
    if (n !== prevCount) numCandidates.push(n);
  }
  const count = numCandidates[Math.floor(Math.random() * numCandidates.length)] || 2;

  const animalCandidates = COUNT_ANIMALS.filter((a) => a.kind !== prevAnimal);
  const animal =
    animalCandidates[Math.floor(Math.random() * animalCandidates.length)] || COUNT_ANIMALS[0];

  const distractorPool: number[] = [];
  for (let n = 1; n <= maxN; n++) {
    if (n !== count) distractorPool.push(n);
  }
  // Prefer nearby numbers slightly so it builds true number recognition while staying distinct
  distractorPool.sort(() => Math.random() - 0.5);
  const choices = [count, ...distractorPool.slice(0, choiceCount - 1)].sort((a, b) => a - b);

  return { count, choices, animal };
}

/** Tappable zoo friend on the meadow that bounces & gets a 1, 2, 3... count badge when tapped */
const CountableAnimal: React.FC<{
  animal: ExhibitAnimalKind;
  size: number;
  countBadge: number | null;
  celebrating: boolean;
  onTap: () => void;
}> = React.memo(({ animal, size, countBadge, celebrating, onTap }) => {
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (countBadge === null && !celebrating) return;
    bounce.setValue(0.8);
    Animated.spring(bounce, {
      toValue: 1,
      friction: 4.2,
      tension: 195,
      useNativeDriver: true,
    }).start();
  }, [bounce, celebrating, countBadge]);

  const tap = makeInstantTapProps(onTap);

  return (
    <Pressable
      onPress={tap.onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        countBadge ? `Counted ${animal} number ${countBadge}` : `Count ${animal}`
      }
      style={[styles.animalBtn, tap.webStyle]}
      {...tap.webProps}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.animalInner,
          { transform: [{ scale: bounce }] },
        ]}
      >
        <ZooExhibitAnimalSvg
          animal={animal}
          size={size}
          highlighted={countBadge !== null || celebrating}
        />
        {countBadge !== null && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{countBadge}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

/** Chunky numeral card with optional visual counting dots underneath */
const NumberChoiceTile: React.FC<{
  num: number;
  paletteIdx: number;
  width: number;
  height: number;
  showDots: boolean;
  hintGlow: boolean;
  wiggleTick: number;
  celebrating: boolean;
  onChoose: () => void;
}> = React.memo(
  ({
    num,
    paletteIdx,
    width,
    height,
    showDots,
    hintGlow,
    wiggleTick,
    celebrating,
    onChoose,
  }) => {
    const wiggle = useRef(new Animated.Value(0)).current;
    const pop = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (wiggleTick === 0) return;
      Animated.sequence([
        Animated.timing(wiggle, { toValue: -1, duration: 70, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -0.5, duration: 60, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, [wiggle, wiggleTick]);

    useEffect(() => {
      if (!celebrating) return;
      pop.setValue(0.84);
      Animated.spring(pop, {
        toValue: 1.08,
        friction: 4,
        tension: 190,
        useNativeDriver: true,
      }).start();
    }, [celebrating, pop]);

    const rotate = wiggle.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-6deg', '0deg', '6deg'],
    });

    const pal = NUM_COLORS[paletteIdx % NUM_COLORS.length];
    const tap = makeInstantTapProps(onChoose);

    return (
      <Pressable
        onPress={tap.onPress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Number ${num}`}
        style={[tap.webStyle]}
        {...tap.webProps}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.numberTile,
            {
              width,
              height,
              borderRadius: width >= 130 ? 28 : 22,
              backgroundColor: celebrating ? '#FFF4BE' : pal.bg,
              borderColor: hintGlow || celebrating ? COLORS.sunGold : pal.border,
              borderWidth: hintGlow || celebrating ? 5 : 4,
              transform: [{ rotate }, { scale: pop }],
            },
          ]}
        >
          <Text
            style={[
              styles.numberGlyph,
              {
                fontSize: width >= 135 ? 60 : width >= 105 ? 48 : 40,
                color: pal.text,
              },
            ]}
          >
            {num}
          </Text>

          {showDots && (
            <View style={styles.dotsWrap}>
              {Array.from({ length: num }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.countDot,
                    {
                      backgroundColor: pal.dot,
                      width: width >= 130 ? 11 : 8,
                      height: width >= 130 ? 11 : 8,
                      borderRadius: 99,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {celebrating && (
            <View style={styles.burstCenter}>
              <SnapBurst size={Math.round(width * 1.15)} />
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

/**
 * Jungle Counting (Free Tier):
 * Helps toddlers learn 1-to-1 counting AND numeral recognition (1–10)!
 * - Tap each zoo friend on the meadow to count out loud ("One! Two! Three!") with numbered badges
 * - Tap the matching big wooden numeral card below (with friendly visual dot patterns on Easy/Med)
 * - Instant 0ms tablet touch + warm spoken encouragement
 */
export const CountingZooGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<CountRound>(() => buildCountRound(1));
  const [countedOrder, setCountedOrder] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [wiggleMap, setWiggleMap] = useState<Record<number, number>>({});
  const [celebratingNum, setCelebratingNum] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  const lockRef = useRef(false);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNextTimer = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearNextTimer(), [clearNextTimer]);

  const animalLabel =
    round.count === 1 ? round.animal.singular : round.animal.plural;

  // Speak the counting prompt warmly on each new round
  useEffect(() => {
    if (won) return;
    const t = setTimeout(() => {
      soundEngine.speakWord(`How many ${round.animal.plural}?`);
    }, 240);
    return () => clearTimeout(t);
  }, [round, won]);

  const startFresh = useCallback(
    (nextDiff: Difficulty) => {
      clearNextTimer();
      lockRef.current = false;
      setDifficulty(nextDiff);
      setScore(0);
      setCountedOrder([]);
      setMisses(0);
      setCelebratingNum(null);
      setFeedbackText(null);
      setWon(false);
      setRound(buildCountRound(nextDiff));
    },
    [clearNextTimer]
  );

  const handleTapAnimal = useCallback(
    (idx: number) => {
      if (lockRef.current || won) return;
      soundEngine.unlock();

      setCountedOrder((prev) => {
        const existingPos = prev.indexOf(idx);
        if (existingPos !== -1) {
          const numVal = existingPos + 1;
          soundEngine.playNote(COUNT_NOTES[(numVal - 1) % COUNT_NOTES.length]);
          soundEngine.speakWord(NUMBER_WORDS[numVal] || String(numVal));
          return prev;
        }
        const next = [...prev, idx];
        const numVal = next.length;
        soundEngine.playNote(COUNT_NOTES[(numVal - 1) % COUNT_NOTES.length]);
        if (numVal === round.count) {
          soundEngine.speakWord(`${NUMBER_WORDS[numVal]}! Tap number ${numVal}!`);
          setFeedbackText(`🎉 ${numVal} ${animalLabel}! Tap ${numVal}!`);
        } else {
          soundEngine.speakWord(NUMBER_WORDS[numVal] || String(numVal));
          setFeedbackText(`${NUMBER_WORDS[numVal]}!`);
        }
        return next;
      });
    },
    [animalLabel, round.count, won]
  );

  const handleChooseNumber = useCallback(
    (num: number) => {
      if (lockRef.current || won) return;
      soundEngine.unlock();

      if (num === round.count) {
        lockRef.current = true;
        soundEngine.playMatch();
        setTimeout(() => soundEngine.playAnimalSound(round.animal.kind), 180);
        soundEngine.speakWord(
          `${NUMBER_WORDS[num] || num}! ${num} ${animalLabel}!`
        );
        collectSticker(round.animal.kind);
        setCelebratingNum(num);
        setFeedbackText(`⭐ ${num} ${animalLabel}! ⭐`);

        // Light up all badges in order!
        setCountedOrder(Array.from({ length: round.count }, (_, i) => i));

        const nextScore = score + 1;
        setScore(nextScore);

        clearNextTimer();
        nextTimerRef.current = setTimeout(() => {
          lockRef.current = false;
          setCelebratingNum(null);
          setFeedbackText(null);
          setCountedOrder([]);
          if (nextScore >= ROUNDS_TO_WIN) {
            soundEngine.playWin();
            addStar(1);
            setWon(true);
          } else {
            setMisses(0);
            setRound(buildCountRound(difficulty, round.count, round.animal.kind));
          }
        }, 1050);
      } else {
        soundEngine.playGentleBounce();
        soundEngine.speakWord(
          `That's ${NUMBER_WORDS[num] || num}! Tap the animals to count!`
        );
        setMisses((m) => m + 1);
        setWiggleMap((prev) => ({ ...prev, [num]: Date.now() }));
        setFeedbackText(`That's ${num}! Tap each friend to count!`);
      }
    },
    [addStar, animalLabel, clearNextTimer, collectSticker, difficulty, round, score, won]
  );

  const allCounted = countedOrder.length === round.count;
  const animalSize =
    round.count <= 3
      ? isTablet
        ? 116
        : 84
      : round.count <= 6
      ? isTablet
        ? 98
        : 70
      : isTablet
      ? 84
      : 58;

  const choiceCount = round.choices.length;
  const tileW = isTabletLandscape
    ? choiceCount === 2
      ? 188
      : choiceCount === 3
      ? 168
      : 148
    : isTablet
    ? choiceCount <= 3
      ? 162
      : 140
    : choiceCount === 2
    ? 144
    : choiceCount === 3
    ? 106
    : 82;
  const tileH = isTablet ? 142 : 112;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={round.animal.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.veil} />
      </View>

      <GameHeader
        totalSteps={ROUNDS_TO_WIN}
        completedSteps={score}
        difficulty={difficulty}
        onDifficultyChange={startFresh}
      />

      <View
        style={[
          styles.playArea,
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
            : null,
        ]}
      >
        {/* Spoken Prompt Pill */}
        <TactileButton
          onPress={() => {
            soundEngine.unlock();
            soundEngine.playAnimalSound(round.animal.kind);
            soundEngine.speakWord(`How many ${round.animal.plural}?`);
          }}
          accessibilityLabel={`Hear prompt: How many ${round.animal.plural}`}
        >
          <View style={[styles.promptPill, isTablet && styles.promptPillTablet]}>
            <Text style={[styles.promptText, isTablet && { fontSize: 22 }]}>
              🔊 How many {round.animal.plural}?
            </Text>
          </View>
        </TactileButton>

        {/* Sunlit Meadow Stage with Tappable Countable Animals */}
        <View
          style={[
            styles.meadowStage,
            isTablet && styles.meadowStageTablet,
            isTabletLandscape && styles.meadowStageLandscape,
          ]}
        >
          <View
            style={[
              styles.animalsGrid,
              round.count > 5 && { maxWidth: isTablet ? 600 : 340 },
            ]}
          >
            {Array.from({ length: round.count }, (_, idx) => {
              const badgeIdx = countedOrder.indexOf(idx);
              return (
                <CountableAnimal
                  key={`${round.animal.kind}-${round.count}-${idx}`}
                  animal={round.animal.kind}
                  size={animalSize}
                  countBadge={badgeIdx !== -1 ? badgeIdx + 1 : null}
                  celebrating={celebratingNum === round.count}
                  onTap={() => handleTapAnimal(idx)}
                />
              );
            })}
          </View>

          <Text style={styles.tapHintText}>
            {feedbackText || 'Tap each friend to count out loud!'}
          </Text>
        </View>

        {/* Big Numeral Cards Dock */}
        <View style={[styles.numbersRow, isTablet && { gap: 18 }]}>
          {round.choices.map((num, idx) => (
            <NumberChoiceTile
              key={`${round.count}-${num}`}
              num={num}
              paletteIdx={idx}
              width={tileW}
              height={tileH}
              showDots={difficulty <= 2}
              hintGlow={(misses >= 2 || allCounted) && num === round.count}
              wiggleTick={wiggleMap[num] || 0}
              celebrating={celebratingNum === num}
              onChoose={() => handleChooseNumber(num)}
            />
          ))}
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={() => startFresh(difficulty)}
        onHome={goHome}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  veil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 250, 236, 0.2)',
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 253, 245, 0.96)',
    borderRadius: 999,
    borderWidth: 3,
    borderBottomWidth: 6,
    borderColor: COLORS.woodBorder,
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  promptPillTablet: {
    paddingVertical: 11,
    paddingHorizontal: 28,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  meadowStage: {
    width: '96%',
    maxWidth: 520,
    minHeight: 200,
    backgroundColor: 'rgba(255, 251, 239, 0.88)',
    borderRadius: 34,
    borderWidth: 3.5,
    borderBottomWidth: 7,
    borderColor: 'rgba(138, 92, 50, 0.42)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  meadowStageTablet: {
    maxWidth: 690,
    minHeight: 250,
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  meadowStageLandscape: {
    maxWidth: 760,
    minHeight: 260,
  },
  animalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  animalBtn: {
    padding: 4,
  },
  animalInner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.sunYellow,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  tapHintText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkMuted,
    textAlign: 'center',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  numberTile: {
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  numberGlyph: {
    fontWeight: '900',
    lineHeight: 62,
  },
  dotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    maxWidth: '88%',
  },
  countDot: {
    borderWidth: 1.5,
    borderColor: COLORS.woodDark,
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
});
