import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
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

const INK = '#4A3525';
const ROUNDS_TO_WIN = 5;

type LetterMode = 'play' | 'board';

interface LetterItem {
  letter: string;
  word: string;
  animal?: ExhibitAnimalKind;
  bg: string;
  border: string;
  text: string;
  starter?: boolean;
}

const TILE_PALETTES = [
  { bg: '#FFE5E2', border: '#C94A42', text: '#A6322B' },
  { bg: '#FFECD6', border: '#C76B1C', text: '#A1510D' },
  { bg: '#FFF5CC', border: '#BA8516', text: '#8C6009' },
  { bg: '#E1F7DE', border: '#38823D', text: '#28642C' },
  { bg: '#DEF4FF', border: '#2D7DA8', text: '#1F6085' },
  { bg: '#EFE5FF', border: '#6C47A6', text: '#523285' },
  { bg: '#FFE3EE', border: '#B5476F', text: '#8F3153' },
];

const RAW_ALPHABET: {
  letter: string;
  word: string;
  animal?: ExhibitAnimalKind;
  starter?: boolean;
}[] = [
  { letter: 'A', word: 'Apple', starter: true },
  { letter: 'B', word: 'Banana', starter: true },
  { letter: 'C', word: 'Cow', animal: 'cow', starter: true },
  { letter: 'D', word: 'Duck', animal: 'duck', starter: true },
  { letter: 'E', word: 'Elephant', animal: 'elephant', starter: true },
  { letter: 'F', word: 'Frog', animal: 'frog', starter: true },
  { letter: 'G', word: 'Giraffe', animal: 'giraffe', starter: true },
  { letter: 'H', word: 'Hippo', animal: 'hippo', starter: true },
  { letter: 'I', word: 'Ice Cream' },
  { letter: 'J', word: 'Jellyfish' },
  { letter: 'K', word: 'Kite' },
  { letter: 'L', word: 'Lion', animal: 'lion', starter: true },
  { letter: 'M', word: 'Monkey', animal: 'monkey', starter: true },
  { letter: 'N', word: 'Nest' },
  { letter: 'O', word: 'Octopus', animal: 'octopus', starter: true },
  { letter: 'P', word: 'Panda', animal: 'panda', starter: true },
  { letter: 'Q', word: 'Queen Crown' },
  { letter: 'R', word: 'Rainbow', starter: true },
  { letter: 'S', word: 'Sheep', animal: 'sheep', starter: true },
  { letter: 'T', word: 'Tiger', animal: 'tiger', starter: true },
  { letter: 'U', word: 'Umbrella' },
  { letter: 'V', word: 'Vine' },
  { letter: 'W', word: 'Whale', animal: 'whale', starter: true },
  { letter: 'X', word: 'Xylophone' },
  { letter: 'Y', word: 'Yo-Yo' },
  { letter: 'Z', word: 'Zebra', animal: 'zebra', starter: true },
];

const ALPHABET: LetterItem[] = RAW_ALPHABET.map((item, idx) => {
  const pal = TILE_PALETTES[idx % TILE_PALETTES.length];
  return { ...item, ...pal };
});

const NOTE_SCALE = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];

interface LetterRound {
  target: LetterItem;
  choices: LetterItem[];
}

function buildLetterRound(difficulty: Difficulty, prevLetter?: string): LetterRound {
  const pool = difficulty === 1 ? ALPHABET.filter((a) => a.starter) : ALPHABET;
  const choiceCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const candidates = pool.filter((a) => a.letter !== prevLetter);
  const target = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];

  const distractors = pool
    .filter((a) => a.letter !== target.letter)
    .sort(() => Math.random() - 0.5)
    .slice(0, choiceCount - 1);

  const choices = [target, ...distractors].sort(() => Math.random() - 0.5);
  return { target, choices };
}

/** Storybook artwork for every letter A–Z (bundled animals + crisp zero-gradient flat SVGs) */
const LetterArtwork: React.FC<{ item: LetterItem; size: number }> = React.memo(
  ({ item, size }) => {
    if (item.animal) {
      return <ZooExhibitAnimalSvg animal={item.animal} size={size} />;
    }

    const renderIcon = () => {
      switch (item.letter) {
        case 'A': // Apple
          return (
            <G>
              <Path
                d="M 50 28 C 34 22 18 36 20 56 C 22 76 38 88 50 84 C 62 88 78 76 80 56 C 82 36 66 22 50 28 Z"
                fill="#E85A50"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 50 28 Q 52 14 58 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 52 22 Q 66 12 72 22 Q 62 30 52 22 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" />
              <Ellipse cx="35" cy="46" rx="5" ry="9" fill="rgba(255,255,255,0.42)" />
            </G>
          );
        case 'B': // Banana
          return (
            <G>
              <Path
                d="M 22 74 C 46 84 78 68 82 34 C 84 22 74 16 68 22 C 64 46 46 62 24 62 C 16 62 14 70 22 74 Z"
                fill="#FAD44A"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 74 18 L 80 12" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
            </G>
          );
        case 'I': // Ice Cream
          return (
            <G>
              <Path d="M 32 52 L 68 52 L 50 92 Z" fill="#E3B97E" stroke={INK} strokeWidth="3.8" strokeLinejoin="round" />
              <Circle cx="38" cy="44" r="14" fill="#F082A8" stroke={INK} strokeWidth="3.6" />
              <Circle cx="62" cy="44" r="14" fill="#FAD44A" stroke={INK} strokeWidth="3.6" />
              <Circle cx="50" cy="30" r="15" fill="#FFFDF7" stroke={INK} strokeWidth="3.6" />
              <Circle cx="50" cy="14" r="6" fill="#E85A50" stroke={INK} strokeWidth="3" />
            </G>
          );
        case 'J': // Jellyfish
          return (
            <G>
              <Path
                d="M 22 50 C 22 22 78 22 78 50 Z"
                fill="#F082A8"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path
                d="M 30 50 Q 26 68 32 82 M 43 50 Q 47 70 42 86 M 57 50 Q 53 70 58 86 M 70 50 Q 74 68 68 82"
                fill="none"
                stroke="#9B74D4"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              <Circle cx="41" cy="38" r="3.4" fill={INK} />
              <Circle cx="59" cy="38" r="3.4" fill={INK} />
              <Path d="M 44 45 Q 50 50 56 45" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
            </G>
          );
        case 'K': // Kite
          return (
            <G>
              <Path d="M 50 78 Q 38 88 54 94" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
              <Path d="M 50 12 L 80 42 L 50 78 L 20 42 Z" fill="#4DAAD8" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
              <Path d="M 50 12 L 80 42 L 50 42 Z" fill="#FAD44A" />
              <Path d="M 50 42 L 20 42 L 50 78 Z" fill="#F082A8" />
              <Path d="M 50 12 L 80 42 L 50 78 L 20 42 Z M 50 12 L 50 78 M 20 42 L 80 42" fill="none" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
            </G>
          );
        case 'N': // Bird Nest with Eggs
          return (
            <G>
              <Ellipse cx="38" cy="46" rx="11" ry="14" fill="#9EDEEF" stroke={INK} strokeWidth="3.4" />
              <Ellipse cx="62" cy="46" rx="11" ry="14" fill="#FFF3B8" stroke={INK} strokeWidth="3.4" />
              <Ellipse cx="50" cy="44" rx="11" ry="14" fill="#FFD4E5" stroke={INK} strokeWidth="3.4" />
              <Path
                d="M 16 54 Q 50 64 84 54 C 82 78 68 86 50 86 C 32 86 18 78 16 54 Z"
                fill="#9C6844"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 26 66 Q 50 74 74 66 M 32 76 Q 50 82 68 76" fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
            </G>
          );
        case 'Q': // Queen Crown
          return (
            <G>
              <Path
                d="M 16 74 L 14 32 L 36 52 L 50 22 L 64 52 L 86 32 L 84 74 Z"
                fill="#FAD44A"
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Circle cx="50" cy="58" r="6" fill="#E85A50" stroke={INK} strokeWidth="2.4" />
              <Circle cx="30" cy="62" r="4.5" fill="#4DAAD8" stroke={INK} strokeWidth="2.2" />
              <Circle cx="70" cy="62" r="4.5" fill="#5BB55E" stroke={INK} strokeWidth="2.2" />
            </G>
          );
        case 'R': // Rainbow
          return (
            <G>
              <Path d="M 14 70 A 36 36 0 0 1 86 70" fill="none" stroke="#E85A50" strokeWidth="10" strokeLinecap="round" />
              <Path d="M 23 70 A 27 27 0 0 1 77 70" fill="none" stroke="#FAD44A" strokeWidth="9.5" strokeLinecap="round" />
              <Path d="M 32 70 A 18 18 0 0 1 68 70" fill="none" stroke="#4DAAD8" strokeWidth="9" strokeLinecap="round" />
              <Circle cx="20" cy="74" r="12" fill="#FFFDF7" stroke={INK} strokeWidth="3.4" />
              <Circle cx="80" cy="74" r="12" fill="#FFFDF7" stroke={INK} strokeWidth="3.4" />
            </G>
          );
        case 'U': // Umbrella
          return (
            <G>
              <Path d="M 50 18 L 50 76 Q 50 88 38 86 Q 32 84 34 78" fill="none" stroke={INK} strokeWidth="4.4" strokeLinecap="round" />
              <Path d="M 14 54 C 14 24 86 24 86 54 Q 74 48 62 54 Q 50 48 38 54 Q 26 48 14 54 Z" fill="#9B74D4" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            </G>
          );
        case 'V': // Vine
          return (
            <G>
              <Path d="M 24 84 Q 50 54 76 18" fill="none" stroke="#38823D" strokeWidth="5.5" strokeLinecap="round" />
              <Path d="M 40 66 Q 16 58 20 38 Q 40 42 40 66 Z" fill="#5BB55E" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
              <Path d="M 56 46 Q 82 46 80 68 Q 58 66 56 46 Z" fill="#5BB55E" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
              <Path d="M 66 30 Q 50 14 68 12 Q 80 22 66 30 Z" fill="#7AD472" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
            </G>
          );
        case 'X': // Xylophone
          return (
            <G>
              <Rect x="16" y="22" width="14" height="58" rx="6" fill="#E85A50" stroke={INK} strokeWidth="3.4" />
              <Rect x="34" y="28" width="14" height="52" rx="6" fill="#FAD44A" stroke={INK} strokeWidth="3.4" />
              <Rect x="52" y="34" width="14" height="46" rx="6" fill="#5BB55E" stroke={INK} strokeWidth="3.4" />
              <Rect x="70" y="40" width="14" height="40" rx="6" fill="#4DAAD8" stroke={INK} strokeWidth="3.4" />
            </G>
          );
        default: // Y — Yo-Yo
          return (
            <G>
              <Path d="M 50 10 L 50 32" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
              <Circle cx="50" cy="58" r="28" fill="#F39237" stroke={INK} strokeWidth="4" />
              <Circle cx="50" cy="58" r="16" fill="#FAD44A" stroke={INK} strokeWidth="3.4" />
              <Circle cx="50" cy="58" r="6" fill="#E85A50" stroke={INK} strokeWidth="2.8" />
            </G>
          );
      }
    };

    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderIcon()}
      </Svg>
    );
  }
);

/** Chunky wooden letter block with instant 0ms tablet touch */
const LetterChoiceTile: React.FC<{
  item: LetterItem;
  size: number;
  hintGlow: boolean;
  wiggleTick: number;
  celebrating: boolean;
  onChoose: () => void;
}> = React.memo(({ item, size, hintGlow, wiggleTick, celebrating, onChoose }) => {
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

  const tap = makeInstantTapProps(onChoose);

  return (
    <Pressable
      onPress={tap.onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Letter ${item.letter}`}
      style={[tap.webStyle]}
      {...tap.webProps}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.letterTile,
          {
            width: size,
            height: size,
            borderRadius: size >= 130 ? 30 : 22,
            backgroundColor: celebrating ? '#FFF4BE' : item.bg,
            borderColor: hintGlow || celebrating ? COLORS.sunGold : item.border,
            borderWidth: hintGlow || celebrating ? 5 : 4,
            transform: [{ rotate }, { scale: pop }],
          },
        ]}
      >
        <Text
          style={[
            styles.letterGlyph,
            {
              fontSize: size >= 145 ? 74 : size >= 115 ? 58 : 48,
              color: item.text,
            },
          ]}
        >
          {item.letter}
        </Text>
        <Text
          style={[
            styles.lowercaseHint,
            { fontSize: size >= 130 ? 22 : 17, color: item.border },
          ]}
        >
          {item.letter.toLowerCase()}
        </Text>

        {celebrating && (
          <View style={styles.burstCenter}>
            <SnapBurst size={Math.round(size * 1.15)} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

/**
 * ABC Animal Safari (Free Tier):
 * Helps toddlers identify uppercase & lowercase letters A–Z with animal & nature friends!
 * - Mode 1 (`Find Letter`): Playful matching rounds (Easy shows target letter + 2 choices,
 *   Med shows target letter + 3 choices, Hard hides letter for phonics challenge + 4 choices!)
 * - Mode 2 (`ABC Board`): Interactive 26-letter A–Z Sound Board with instant 0ms tap-to-hear!
 */
export const LetterSafariGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [mode, setMode] = useState<LetterMode>('play');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<LetterRound>(() => buildLetterRound(1));
  const [misses, setMisses] = useState(0);
  const [wiggleMap, setWiggleMap] = useState<Record<string, number>>({});
  const [celebratingLetter, setCelebratingLetter] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  // Interactive ABC Sound Board state
  const [boardSelected, setBoardSelected] = useState<LetterItem>(ALPHABET[11]); // L for Lion!
  const [boardBurstTick, setBoardBurstTick] = useState(0);

  const lockRef = useRef(false);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNextTimer = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearNextTimer(), [clearNextTimer]);

  // Speak letter prompt warmly on each Play-mode round
  useEffect(() => {
    if (won || mode !== 'play') return;
    const t = setTimeout(() => {
      soundEngine.speakWord(
        `Find ${round.target.letter}! ${round.target.letter} is for ${round.target.word}!`
      );
    }, 240);
    return () => clearTimeout(t);
  }, [mode, round, won]);

  const startFresh = useCallback(
    (nextDiff: Difficulty) => {
      clearNextTimer();
      lockRef.current = false;
      setDifficulty(nextDiff);
      setScore(0);
      setMisses(0);
      setCelebratingLetter(null);
      setFeedbackText(null);
      setWon(false);
      setRound(buildLetterRound(nextDiff));
    },
    [clearNextTimer]
  );

  const handleReplayPrompt = useCallback(() => {
    soundEngine.unlock();
    if (round.target.animal) {
      soundEngine.playAnimalSound(round.target.animal);
    } else {
      soundEngine.playPop();
    }
    soundEngine.speakWord(
      `Find ${round.target.letter}! ${round.target.letter} is for ${round.target.word}!`
    );
  }, [round.target]);

  const handleChooseLetter = useCallback(
    (chosen: LetterItem) => {
      if (lockRef.current || won) return;
      soundEngine.unlock();

      if (chosen.letter === round.target.letter) {
        lockRef.current = true;
        soundEngine.playMatch();
        if (chosen.animal) {
          setTimeout(() => soundEngine.playAnimalSound(chosen.animal!), 180);
          collectSticker(chosen.animal);
        }
        soundEngine.speakWord(`${chosen.letter}! ${chosen.letter} is for ${chosen.word}!`);
        setCelebratingLetter(chosen.letter);
        setFeedbackText(`⭐ ${chosen.letter} is for ${chosen.word}! ⭐`);

        const nextScore = score + 1;
        setScore(nextScore);

        clearNextTimer();
        nextTimerRef.current = setTimeout(() => {
          lockRef.current = false;
          setCelebratingLetter(null);
          setFeedbackText(null);
          if (nextScore >= ROUNDS_TO_WIN) {
            soundEngine.playWin();
            addStar(1);
            setWon(true);
          } else {
            setMisses(0);
            setRound(buildLetterRound(difficulty, round.target.letter));
          }
        }, 1050);
      } else {
        soundEngine.playGentleBounce();
        soundEngine.speakWord(`That's ${chosen.letter}! Find ${round.target.letter}!`);
        setMisses((m) => m + 1);
        setWiggleMap((prev) => ({ ...prev, [chosen.letter]: Date.now() }));
        setFeedbackText(`That's ${chosen.letter}! Find ${round.target.letter}!`);
      }
    },
    [addStar, clearNextTimer, collectSticker, difficulty, round.target, score, won]
  );

  const handleBoardTap = useCallback((item: LetterItem, idx: number) => {
    soundEngine.unlock();
    if (item.animal) {
      soundEngine.playAnimalSound(item.animal);
    } else {
      soundEngine.playNote(NOTE_SCALE[idx % NOTE_SCALE.length]);
    }
    soundEngine.speakWord(`${item.letter}! ${item.letter} is for ${item.word}!`);
    setBoardSelected(item);
    setBoardBurstTick(Date.now());
  }, []);

  const choiceCount = round.choices.length;
  const tileSize = isTabletLandscape
    ? choiceCount === 2
      ? 178
      : choiceCount === 3
      ? 160
      : 144
    : isTablet
    ? choiceCount <= 3
      ? 154
      : 132
    : choiceCount === 2
    ? 140
    : choiceCount === 3
    ? 104
    : 82;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgClearing}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.veil} />
      </View>

      <GameHeader
        totalSteps={ROUNDS_TO_WIN}
        completedSteps={score}
        difficulty={mode === 'play' ? difficulty : undefined}
        onDifficultyChange={mode === 'play' ? startFresh : undefined}
      />

      {/* Mode Switcher Pill (Find Letter | ABC Sound Board) */}
      <View style={styles.modeBarWrap}>
        <View style={styles.modeBar}>
          <TactileButton
            onPress={() => {
              soundEngine.playPop();
              setMode('play');
            }}
            accessibilityLabel="Find the Letter game mode"
          >
            <View style={[styles.modePill, mode === 'play' && styles.modePillActive]}>
              <Text style={[styles.modePillText, mode === 'play' && styles.modePillTextActive]}>
                🎯 Find Letter
              </Text>
            </View>
          </TactileButton>

          <TactileButton
            onPress={() => {
              soundEngine.playPop();
              soundEngine.speakWord('ABC Sound Board!');
              setMode('board');
            }}
            accessibilityLabel="ABC Sound Board explore mode"
          >
            <View style={[styles.modePill, mode === 'board' && styles.modePillActive]}>
              <Text style={[styles.modePillText, mode === 'board' && styles.modePillTextActive]}>
                🔤 ABC Board
              </Text>
            </View>
          </TactileButton>
        </View>
      </View>

      {mode === 'play' ? (
        <View
          style={[
            styles.playArea,
            Platform.OS === 'web'
              ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
              : null,
          ]}
        >
          {/* Target Letter + Animal Card */}
          <TactileButton
            onPress={handleReplayPrompt}
            accessibilityLabel={`Hear prompt: ${round.target.letter} is for ${round.target.word}`}
          >
            <View
              style={[
                styles.spotlightCard,
                isTablet && styles.spotlightCardTablet,
                { borderColor: round.target.border },
              ]}
            >
              <View
                style={[
                  styles.targetLetterBadge,
                  {
                    width: isTablet ? 116 : 86,
                    height: isTablet ? 116 : 86,
                    borderRadius: isTablet ? 28 : 22,
                    backgroundColor: round.target.bg,
                    borderColor: round.target.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.targetLetterGlyph,
                    {
                      fontSize: isTablet ? 64 : 48,
                      color: round.target.text,
                    },
                  ]}
                >
                  {difficulty === 3 && !celebratingLetter ? '?' : round.target.letter}
                </Text>
              </View>

              <LetterArtwork item={round.target} size={isTablet ? 124 : 90} />

              <View style={styles.spotlightCopy}>
                <Text style={[styles.spotlightSub, isTablet && { fontSize: 15 }]}>
                  🔊 Tap the letter!
                </Text>
                <Text
                  style={[
                    styles.spotlightWord,
                    isTablet && { fontSize: 28 },
                    { color: round.target.text },
                  ]}
                >
                  {round.target.word}
                </Text>
              </View>
            </View>
          </TactileButton>

          {/* Warm Teaching Caption */}
          <View style={styles.feedbackSlot}>
            {feedbackText && (
              <View style={styles.feedbackPill}>
                <Text style={styles.feedbackText}>{feedbackText}</Text>
              </View>
            )}
          </View>

          {/* Big Wooden Letter Blocks */}
          <View style={[styles.choicesRow, isTablet && { gap: 20 }]}>
            {round.choices.map((item) => (
              <LetterChoiceTile
                key={`${round.target.letter}-${item.letter}`}
                item={item}
                size={tileSize}
                hintGlow={misses >= 2 && item.letter === round.target.letter}
                wiggleTick={wiggleMap[item.letter] || 0}
                celebrating={celebratingLetter === item.letter}
                onChoose={() => handleChooseLetter(item)}
              />
            ))}
          </View>
        </View>
      ) : (
        /* Interactive A–Z ABC Sound Board */
        <View style={styles.boardArea}>
          <TactileButton
            onPress={() => {
              const idx = ALPHABET.findIndex((a) => a.letter === boardSelected.letter);
              handleBoardTap(boardSelected, Math.max(0, idx));
            }}
            accessibilityLabel={`Hear ${boardSelected.letter} is for ${boardSelected.word}`}
          >
            <View
              style={[
                styles.boardSpotlight,
                isTablet && styles.boardSpotlightTablet,
                {
                  backgroundColor: boardSelected.bg,
                  borderColor: boardSelected.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.boardBigLetter,
                  { fontSize: isTablet ? 62 : 46, color: boardSelected.text },
                ]}
              >
                {boardSelected.letter}
                {boardSelected.letter.toLowerCase()}
              </Text>
              <LetterArtwork item={boardSelected} size={isTablet ? 90 : 68} />
              <Text
                style={[
                  styles.boardWord,
                  { fontSize: isTablet ? 28 : 21, color: boardSelected.text },
                ]}
              >
                🔊 {boardSelected.word}!
              </Text>
              {boardBurstTick > 0 && (
                <View style={styles.boardBurstWrap} pointerEvents="none">
                  <SnapBurst key={boardBurstTick} size={isTablet ? 110 : 86} />
                </View>
              )}
            </View>
          </TactileButton>

          <ScrollView
            style={styles.boardScroll}
            contentContainerStyle={[
              styles.boardGrid,
              isTabletLandscape && styles.boardGridLandscape,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {ALPHABET.map((item, idx) => {
              const active = boardSelected.letter === item.letter;
              const sz = isTabletLandscape ? 76 : isTablet ? 74 : 58;
              const tap = makeInstantTapProps(() => handleBoardTap(item, idx));
              return (
                <Pressable
                  key={item.letter}
                  onPress={tap.onPress}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Letter ${item.letter} for ${item.word}`}
                  style={[tap.webStyle]}
                  {...tap.webProps}
                >
                  <View
                    pointerEvents="none"
                    style={[
                      styles.abcKey,
                      {
                        width: sz,
                        height: sz,
                        borderRadius: isTablet ? 20 : 15,
                        backgroundColor: active ? '#FFF4BE' : item.bg,
                        borderColor: active ? COLORS.woodDark : item.border,
                        borderWidth: active ? 4 : 3,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.abcKeyText,
                        { fontSize: isTablet ? 34 : 26, color: item.text },
                      ]}
                    >
                      {item.letter}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

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
  modeBarWrap: {
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 4,
    zIndex: 10,
  },
  modeBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 249, 236, 0.88)',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: 'rgba(138, 92, 50, 0.36)',
    padding: 4,
    gap: 6,
  },
  modePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  modePillActive: {
    backgroundColor: COLORS.sunYellow,
    borderWidth: 2,
    borderColor: COLORS.woodDark,
  },
  modePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  modePillTextActive: {
    color: COLORS.woodDark,
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  spotlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 253, 245, 0.96)',
    borderRadius: 34,
    borderWidth: 4,
    borderBottomWidth: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    maxWidth: '96%',
  },
  spotlightCardTablet: {
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 22,
  },
  targetLetterBadge: {
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetLetterGlyph: {
    fontWeight: '900',
  },
  spotlightCopy: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
  },
  spotlightSub: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  spotlightWord: {
    fontSize: 22,
    fontWeight: '900',
  },
  feedbackSlot: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackPill: {
    backgroundColor: '#FFF4BE',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  choicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 760,
  },
  letterTile: {
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  letterGlyph: {
    fontWeight: '900',
    lineHeight: 76,
  },
  lowercaseHint: {
    fontWeight: '800',
    marginTop: -6,
    opacity: 0.78,
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
  boardArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 10,
  },
  boardSpotlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderRadius: 30,
    borderWidth: 4,
    borderBottomWidth: 7,
    paddingVertical: 8,
    paddingHorizontal: 20,
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  boardSpotlightTablet: {
    borderRadius: 34,
    paddingVertical: 10,
    paddingHorizontal: 30,
    gap: 22,
  },
  boardBigLetter: {
    fontWeight: '900',
  },
  boardWord: {
    fontWeight: '900',
  },
  boardBurstWrap: {
    position: 'absolute',
    right: 8,
    top: -6,
  },
  boardScroll: {
    flex: 1,
    width: '100%',
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 20,
    maxWidth: 680,
    alignSelf: 'center',
  },
  boardGridLandscape: {
    maxWidth: 880,
    gap: 10,
  },
  abcKey: {
    borderBottomWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  abcKeyText: {
    fontWeight: '900',
  },
});
