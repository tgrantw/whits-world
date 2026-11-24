import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import { WhitMascot, WhitMood } from '../components/WhitMascot';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';
import { makeInstantTapProps } from '../utils/webTouch';

const INK = '#4A3525';
const ROUNDS_TO_WIN = 6;

interface ColorEntry {
  id: string;
  name: string;
  hex: string;
  lightHex: string;
  borderHex: string;
  itemName: string;
  noteFreq: number;
}

const COLOR_POOL: ColorEntry[] = [
  {
    id: 'red',
    name: 'Red',
    hex: '#E51A1A',
    lightHex: '#FFD6D6',
    borderHex: '#A60F0F',
    itemName: 'Apple',
    noteFreq: 261.63,
  },
  {
    id: 'blue',
    name: 'Blue',
    hex: '#1578E8',
    lightHex: '#CFE7FF',
    borderHex: '#0C4F9E',
    itemName: 'Balloon',
    noteFreq: 392.0,
  },
  {
    id: 'yellow',
    name: 'Yellow',
    hex: '#FFE01B',
    lightHex: '#FFF6B8',
    borderHex: '#B89400',
    itemName: 'Sun',
    noteFreq: 329.63,
  },
  {
    id: 'green',
    name: 'Green',
    hex: '#1FA838',
    lightHex: '#CDF5D4',
    borderHex: '#126E22',
    itemName: 'Leaf',
    noteFreq: 349.23,
  },
  {
    id: 'orange',
    name: 'Orange',
    hex: '#FF7A00',
    lightHex: '#FFE0C2',
    borderHex: '#BA5500',
    itemName: 'Orange',
    noteFreq: 293.66,
  },
  {
    id: 'purple',
    name: 'Purple',
    hex: '#7E2CE0',
    lightHex: '#E6D4FF',
    borderHex: '#51149C',
    itemName: 'Grapes',
    noteFreq: 440.0,
  },
  {
    id: 'pink',
    name: 'Pink',
    hex: '#FF4FA3',
    lightHex: '#FFD4E9',
    borderHex: '#B8216B',
    itemName: 'Flower',
    noteFreq: 493.88,
  },
  {
    id: 'brown',
    name: 'Brown',
    hex: '#7A431D',
    lightHex: '#E8D2C0',
    borderHex: '#4A250C',
    itemName: 'Bear',
    noteFreq: 523.25,
  },
];

interface ColorRound {
  target: ColorEntry;
  choices: ColorEntry[];
}

function getPoolForDifficulty(difficulty: Difficulty): ColorEntry[] {
  if (difficulty === 1) return COLOR_POOL.slice(0, 4); // Red, Blue, Yellow, Green
  if (difficulty === 2) return COLOR_POOL.slice(0, 6); // + Orange, Purple
  return COLOR_POOL; // All 8 (+ Pink, Brown)
}

function buildRound(difficulty: Difficulty, prevTargetId?: string): ColorRound {
  const pool = getPoolForDifficulty(difficulty);
  const choiceCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
  const candidates = pool.filter((c) => c.id !== prevTargetId);
  const target = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];

  const distractors = pool
    .filter((c) => c.id !== target.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, choiceCount - 1);

  const choices = [target, ...distractors].sort(() => Math.random() - 0.5);
  return { target, choices };
}

/** Crisp flat-SVG storybook artwork for each color (zero gradients/clipPaths for tablet safety) */
const ColorObjectSvg: React.FC<{ color: ColorEntry; size: number }> = React.memo(
  ({ color, size }) => {
    const renderArt = () => {
      switch (color.id) {
        case 'red':
          return (
            <G>
              {/* Red Apple */}
              <Path
                d="M 50 28 C 34 22 18 36 20 56 C 22 76 38 88 50 84 C 62 88 78 76 80 56 C 82 36 66 22 50 28 Z"
                fill={color.hex}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 50 28 Q 52 14 58 10" fill="none" stroke={INK} strokeWidth="4.2" strokeLinecap="round" />
              <Path d="M 52 22 Q 66 12 72 22 Q 62 30 52 22 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <Ellipse cx="35" cy="46" rx="5.5" ry="10" fill="rgba(255,255,255,0.42)" />
            </G>
          );
        case 'blue':
          return (
            <G>
              {/* Blue Balloon */}
              <Path d="M 50 76 Q 44 86 54 94" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
              <Path d="M 44 74 L 56 74 L 50 66 Z" fill={color.hex} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <Ellipse cx="50" cy="42" rx="28" ry="32" fill={color.hex} stroke={INK} strokeWidth="4" />
              <Ellipse cx="38" cy="30" rx="6" ry="11" fill="rgba(255,255,255,0.45)" />
            </G>
          );
        case 'yellow':
          return (
            <G>
              {/* Happy Yellow Sun */}
              <Path
                d="M 50 8 L 50 18 M 50 82 L 50 92 M 8 50 L 18 50 M 82 50 L 92 50 M 20 20 L 28 28 M 72 72 L 80 80 M 80 20 L 72 28 M 28 72 L 20 80"
                stroke={color.hex}
                strokeWidth="7"
                strokeLinecap="round"
              />
              <Circle cx="50" cy="50" r="26" fill={color.hex} stroke={INK} strokeWidth="4" />
              <Circle cx="41" cy="46" r="3.4" fill={INK} />
              <Circle cx="59" cy="46" r="3.4" fill={INK} />
              <Path d="M 41 56 Q 50 64 59 56" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
            </G>
          );
        case 'green':
          return (
            <G>
              {/* Jungle Leaf */}
              <Path
                d="M 18 76 C 18 34 48 16 84 18 C 82 58 60 84 18 76 Z"
                fill={color.hex}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <Path d="M 14 82 Q 46 54 74 28" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
              <Path d="M 42 56 L 38 38 M 56 44 L 68 48" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
            </G>
          );
        case 'orange':
          return (
            <G>
              {/* Juicy Orange */}
              <Circle cx="50" cy="54" r="30" fill={color.hex} stroke={INK} strokeWidth="4" />
              <Path d="M 50 24 Q 52 14 58 12" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 50 22 Q 36 10 30 22 Q 40 30 50 22 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <Ellipse cx="36" cy="44" rx="5.5" ry="9" fill="rgba(255,255,255,0.42)" />
              <Circle cx="62" cy="64" r="2.2" fill={color.borderHex} />
              <Circle cx="56" cy="72" r="2.2" fill={color.borderHex} />
              <Circle cx="68" cy="56" r="2.2" fill={color.borderHex} />
            </G>
          );
        case 'purple':
          return (
            <G>
              {/* Purple Grapes */}
              <Path d="M 50 18 Q 52 10 60 10" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <Path d="M 50 20 Q 34 10 28 22 Q 38 30 50 20 Z" fill="#5BB55E" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <Circle cx="36" cy="38" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
              <Circle cx="64" cy="38" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
              <Circle cx="50" cy="36" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
              <Circle cx="42" cy="56" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
              <Circle cx="58" cy="56" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
              <Circle cx="50" cy="74" r="12" fill={color.hex} stroke={INK} strokeWidth="3.4" />
            </G>
          );
        case 'pink':
          return (
            <G>
              {/* Pink Daisy Flower */}
              <Circle cx="50" cy="24" r="16" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="75" cy="42" r="16" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="66" cy="70" r="16" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="34" cy="70" r="16" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="25" cy="42" r="16" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="50" cy="50" r="15" fill="#FAD44A" stroke={INK} strokeWidth="3.6" />
              <Circle cx="45" cy="48" r="2.2" fill={INK} />
              <Circle cx="55" cy="48" r="2.2" fill={INK} />
              <Path d="M 45 54 Q 50 58 55 54" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            </G>
          );
        default:
          return (
            <G>
              {/* Brown Teddy Bear Paw */}
              <Ellipse cx="50" cy="64" rx="23" ry="19" fill={color.hex} stroke={INK} strokeWidth="4" />
              <Circle cx="24" cy="40" r="10.5" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="41" cy="26" r="11" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="59" cy="26" r="11" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Circle cx="76" cy="40" r="10.5" fill={color.hex} stroke={INK} strokeWidth="3.6" />
              <Ellipse cx="50" cy="65" rx="11" ry="8" fill="#E3B97E" />
            </G>
          );
      }
    };

    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {renderArt()}
      </Svg>
    );
  }
);

/** Chunky color tile with instant 0ms tablet touch + gentle wiggle on miss */
const ColorChoiceCard: React.FC<{
  color: ColorEntry;
  size: number;
  hintGlow: boolean;
  wiggleTick: number;
  celebrating: boolean;
  onChoose: () => void;
}> = React.memo(({ color, size, hintGlow, wiggleTick, celebrating, onChoose }) => {
  const wiggle = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (wiggleTick === 0) return;
    Animated.sequence([
      Animated.timing(wiggle, { toValue: -1, duration: 75, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -0.6, duration: 65, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 65, useNativeDriver: true }),
    ]).start();
  }, [wiggle, wiggleTick]);

  useEffect(() => {
    if (!celebrating) return;
    pop.setValue(0.86);
    Animated.spring(pop, {
      toValue: 1.07,
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
      accessibilityLabel={`${color.name} ${color.itemName}`}
      style={[tap.webStyle]}
      {...tap.webProps}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.choiceCard,
          {
            width: size,
            height: Math.round(size * 1.04),
            borderRadius: size >= 160 ? 34 : 26,
            backgroundColor: color.lightHex,
            borderColor: hintGlow || celebrating ? COLORS.sunGold : color.borderHex,
            borderWidth: hintGlow || celebrating ? 5 : 4,
            transform: [{ rotate }, { scale: pop }],
          },
        ]}
      >
        {/* Solid color paint banner at top for unmistakable color identification */}
        <View
          style={[
            styles.colorRibbon,
            {
              backgroundColor: color.hex,
              borderColor: color.borderHex,
            },
          ]}
        >
          <Text
            style={[
              styles.colorRibbonText,
              {
                fontSize: size >= 165 ? 22 : size >= 135 ? 18 : 15,
                color: color.id === 'yellow' ? INK : '#FFFDF7',
              },
            ]}
          >
            {color.name}
          </Text>
        </View>

        <View style={styles.choiceArtWrap}>
          <ColorObjectSvg color={color} size={Math.round(size * 0.58)} />
        </View>

        {celebrating && (
          <View style={styles.burstCenter}>
            <SnapBurst size={Math.round(size * 1.05)} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
});

/**
 * Rainbow Color Safari (Free Tier):
 * Helps toddlers learn to recognize, hear, and match 4–8 vibrant colors!
 * - Spoken voice prompt ("Find Blue!") + large color swatch banner
 * - Zero-frustration teaching feedback (tapping another color gently names it!)
 * - Instant 0ms tablet touch via makeInstantTapProps
 */
export const ColorSafariGame: React.FC = () => {
  const { addStar, goHome } = useApp();
  const { isTablet, isTabletLandscape } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<ColorRound>(() => buildRound(1));
  const [misses, setMisses] = useState(0);
  const [wiggleMap, setWiggleMap] = useState<Record<string, number>>({});
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<WhitMood>('wave');
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

  // Speak the target color warmly whenever a new round starts
  useEffect(() => {
    if (won) return;
    const t = setTimeout(() => {
      soundEngine.speakWord(`Find ${round.target.name}!`);
    }, 220);
    return () => clearTimeout(t);
  }, [round, won]);

  const startFresh = useCallback(
    (nextDiff: Difficulty) => {
      clearNextTimer();
      lockRef.current = false;
      setDifficulty(nextDiff);
      setScore(0);
      setMisses(0);
      setCelebratingId(null);
      setFeedbackText(null);
      setMascotMood('wave');
      setWon(false);
      setRound(buildRound(nextDiff));
    },
    [clearNextTimer]
  );

  const handleReplayPrompt = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playNote(round.target.noteFreq);
    soundEngine.speakWord(`Find ${round.target.name}!`);
  }, [round.target]);

  const handleChoice = useCallback(
    (chosen: ColorEntry) => {
      if (lockRef.current || won) return;
      soundEngine.unlock();

      if (chosen.id === round.target.id) {
        lockRef.current = true;
        soundEngine.playMatch();
        soundEngine.speakWord(`Yes! ${chosen.name}!`);
        setCelebratingId(chosen.id);
        setMascotMood('cheer');
        setFeedbackText(`⭐ Yes! ${chosen.name}! ⭐`);

        const nextScore = score + 1;
        setScore(nextScore);

        clearNextTimer();
        nextTimerRef.current = setTimeout(() => {
          lockRef.current = false;
          setCelebratingId(null);
          setFeedbackText(null);
          if (nextScore >= ROUNDS_TO_WIN) {
            soundEngine.playWin();
            addStar(1);
            setWon(true);
          } else {
            setMisses(0);
            setMascotMood('idle');
            setRound(buildRound(difficulty, round.target.id));
          }
        }, 950);
      } else {
        soundEngine.playGentleBounce();
        soundEngine.speakWord(`That's ${chosen.name}! Find ${round.target.name}!`);
        setMisses((m) => m + 1);
        setWiggleMap((prev) => ({ ...prev, [chosen.id]: Date.now() }));
        setMascotMood('encourage');
        setFeedbackText(`That's ${chosen.name}! Try ${round.target.name}!`);
      }
    },
    [addStar, clearNextTimer, difficulty, round.target, score, won]
  );

  const choiceCount = round.choices.length;
  const cardSize = isTabletLandscape
    ? choiceCount === 2
      ? 215
      : choiceCount === 3
      ? 192
      : 168
    : isTablet
    ? choiceCount === 2
      ? 210
      : choiceCount === 3
      ? 182
      : 164
    : choiceCount === 2
    ? 152
    : choiceCount === 3
    ? 112
    : 142;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={STORYBOOK_ASSETS.bgSavanna}
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
          isTabletLandscape && styles.playAreaLandscape,
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
            : null,
        ]}
      >
        {/* Prompt Banner with Whit + Color Swatch Pill */}
        <View style={styles.promptRow}>
          <WhitMascot
            mood={mascotMood}
            size={isTablet ? 116 : 86}
            interactive
          />

          <TactileButton
            onPress={handleReplayPrompt}
            accessibilityLabel={`Hear prompt: Find ${round.target.name}`}
          >
            <View
              style={[
                styles.promptCard,
                isTablet && styles.promptCardTablet,
                { borderColor: round.target.borderHex },
              ]}
            >
              <View
                style={[
                  styles.swatchCircle,
                  {
                    width: isTablet ? 52 : 40,
                    height: isTablet ? 52 : 40,
                    borderRadius: isTablet ? 26 : 20,
                    backgroundColor: round.target.hex,
                    borderColor: round.target.borderHex,
                  },
                ]}
              >
                <View style={styles.swatchShine} />
              </View>
              <View>
                <Text style={[styles.promptSmall, isTablet && { fontSize: 14 }]}>
                  🔊 Tap the color
                </Text>
                <Text
                  style={[
                    styles.promptWord,
                    isTablet && { fontSize: 32 },
                    { color: round.target.borderHex },
                  ]}
                >
                  {round.target.name}!
                </Text>
              </View>
            </View>
          </TactileButton>
        </View>

        {/* Encouraging caption */}
        <View style={styles.feedbackSlot}>
          {feedbackText && (
            <View style={styles.feedbackPill}>
              <Text style={styles.feedbackText}>{feedbackText}</Text>
            </View>
          )}
        </View>

        {/* Chunky Color Choice Cards */}
        <View
          style={[
            styles.choicesRow,
            isTablet && { gap: 22 },
            !isTablet && choiceCount === 4 && { maxWidth: 330 },
          ]}
        >
          {round.choices.map((c) => (
            <ColorChoiceCard
              key={`${round.target.id}-${c.id}`}
              color={c}
              size={cardSize}
              hintGlow={misses >= 2 && c.id === round.target.id}
              wiggleTick={wiggleMap[c.id] || 0}
              celebrating={celebratingId === c.id}
              onChoose={() => handleChoice(c)}
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
    paddingBottom: 20,
  },
  playAreaLandscape: {
    paddingHorizontal: 28,
    paddingBottom: 22,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 253, 245, 0.96)',
    borderRadius: 28,
    borderWidth: 4,
    borderBottomWidth: 7,
    paddingVertical: 10,
    paddingHorizontal: 18,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  promptCardTablet: {
    borderRadius: 34,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 16,
  },
  swatchCircle: {
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  swatchShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 12,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  promptSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  promptWord: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.4,
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
    gap: 14,
    width: '100%',
    maxWidth: 820,
  },
  choiceCard: {
    borderBottomWidth: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  colorRibbon: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
  colorRibbonText: {
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  choiceArtWrap: {
    flex: 1,
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
});
