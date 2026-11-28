import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { GameHeader } from '../components/GameHeader';
import { StarIcon } from '../components/JungleArt';
import { SnapBurst } from '../components/SnapBurst';
import { StoryIcon, StoryIconName } from '../components/StorybookIcons';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty, getAnimalDisplayName } from '../theme';
import { makeInstantTapProps } from '../utils/webTouch';

interface BandBar {
  index: number;
  animal: ExhibitAnimalKind;
  noteLabel: string;
  freq: number;
  color: string;
  darkColor: string;
  heightPct: number;
}

const BAND_BARS: BandBar[] = [
  { index: 0, animal: 'frog', noteLabel: 'C', freq: 523.25, color: '#E86C62', darkColor: '#AC3F38', heightPct: 100 }, // C5
  { index: 1, animal: 'toucan', noteLabel: 'D', freq: 587.33, color: '#EF964C', darkColor: '#B56322', heightPct: 94 }, // D5
  { index: 2, animal: 'monkey', noteLabel: 'E', freq: 659.25, color: '#F5CF54', darkColor: '#B58918', heightPct: 88 }, // E5
  { index: 3, animal: 'lion', noteLabel: 'G', freq: 783.99, color: '#5CB86E', darkColor: '#2E7E40', heightPct: 82 }, // G5
  { index: 4, animal: 'elephant', noteLabel: 'A', freq: 880.0, color: '#56B2E2', darkColor: '#2575A3', heightPct: 76 }, // A5
  { index: 5, animal: 'giraffe', noteLabel: 'C', freq: 1046.5, color: '#9E7FD8', darkColor: '#66499E', heightPct: 70 }, // C6
];

type SongId = 'twinkle' | 'rowboat' | 'lamb' | 'free';

interface SongSpec {
  id: SongId;
  title: string;
  icon?: StoryIconName;
  badgeColor: string;
  notesByDiff: Record<Difficulty, number[]>;
}

const SONGBOOK: SongSpec[] = [
  {
    id: 'twinkle',
    title: 'Twinkle',
    icon: 'star',
    badgeColor: '#F6CF58',
    notesByDiff: {
      1: [0, 0, 3, 3, 4],
      2: [0, 0, 3, 3, 4, 4, 3],
      3: [0, 0, 3, 3, 4, 4, 3, 2, 2, 1, 1, 0],
    },
  },
  {
    id: 'rowboat',
    title: 'Row Boat',
    badgeColor: '#8ED6EE',
    notesByDiff: {
      1: [0, 0, 0, 1, 2],
      2: [0, 0, 0, 1, 2, 2, 1, 2],
      3: [0, 0, 0, 1, 2, 2, 1, 2, 3, 5],
    },
  },
  {
    id: 'lamb',
    title: 'Little Lamb',
    badgeColor: '#F5BBD0',
    notesByDiff: {
      1: [2, 1, 0, 1, 2],
      2: [2, 1, 0, 1, 2, 2, 2],
      3: [2, 1, 0, 1, 2, 2, 2, 1, 1, 2],
    },
  },
  {
    id: 'free',
    title: 'Free Jam',
    badgeColor: '#B4DFAA',
    notesByDiff: {
      1: [],
      2: [],
      3: [],
    },
  },
];

const MusicNoteIcon: React.FC<{ size: number; color?: string }> = ({
  size,
  color = '#FFFDF5',
}) => (
  <Svg width={size} height={size} viewBox="0 0 36 36">
    <Path
      d="M 14 25 L 14 9 L 29 6 L 29 22"
      stroke={color}
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M 14 25 C 14 28 11 30 8.5 29 C 6 28 6 24.5 8.5 23.5 C 11 22.5 14 23 14 25 Z"
      fill={color}
    />
    <Path
      d="M 29 22 C 29 25 26 27 23.5 26 C 21 25 21 21.5 23.5 20.5 C 26 19.5 29 20 29 22 Z"
      fill={color}
    />
  </Svg>
);

interface XylophoneBarButtonProps {
  bar: BandBar;
  barWidth: number;
  maxBarHeight: number;
  animalSize: number;
  isDemoLit: boolean;
  isTargetNext: boolean;
  pressedTick: number | null;
  musicianBurstTick: number | null;
  onTapBar: (bar: BandBar) => void;
  onTapAnimal: (bar: BandBar) => void;
}

const XylophoneBarButton: React.FC<XylophoneBarButtonProps> = ({
  bar,
  barWidth,
  maxBarHeight,
  animalSize,
  isDemoLit,
  isTargetNext,
  pressedTick,
  musicianBurstTick,
  onTapBar,
  onTapAnimal,
}) => {
  const hopAnim = useRef(new Animated.Value(0)).current;
  const starPulse = useRef(new Animated.Value(1)).current;
  const [celebrating, setCelebrating] = useState(false);

  const isPressedPop = pressedTick !== null;

  useEffect(() => {
    if (isDemoLit || pressedTick || musicianBurstTick) {
      hopAnim.setValue(0);
      Animated.sequence([
        Animated.spring(hopAnim, {
          toValue: -16,
          friction: 4,
          tension: 210,
          useNativeDriver: true,
        }),
        Animated.spring(hopAnim, {
          toValue: 0,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDemoLit, pressedTick, musicianBurstTick, hopAnim]);

  useEffect(() => {
    if (!musicianBurstTick) return;
    setCelebrating(true);
    const t = setTimeout(() => setCelebrating(false), 750);
    return () => clearTimeout(t);
  }, [musicianBurstTick]);

  useEffect(() => {
    if (!isTargetNext) {
      starPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, {
          toValue: 1.25,
          duration: 460,
          useNativeDriver: true,
        }),
        Animated.timing(starPulse, {
          toValue: 0.94,
          duration: 460,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isTargetNext, starPulse]);

  const barH = Math.round((bar.heightPct / 100) * maxBarHeight);
  const animalTap = makeInstantTapProps(() => onTapAnimal(bar));
  const barTap = makeInstantTapProps(() => onTapBar(bar));

  return (
    <View style={styles.barColumn}>
      {/* Tappable Living Zoo Musician perched above each xylophone bar */}
      <Pressable
        onPress={animalTap.onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Tap ${bar.animal} band musician`}
        style={[styles.musicianWrap, animalTap.webStyle]}
        {...animalTap.webProps}
      >
        <Animated.View
          pointerEvents="none"
          style={{ transform: [{ translateY: hopAnim }] }}
        >
          <AnimatedZooAnimal
            state={celebrating ? 'celebrate' : isTargetNext ? 'calling' : 'idle'}
            size={animalSize}
            seed={bar.index + 5}
            weight={getAnimalWeight(bar.animal)}
            silentTap
          >
            <ZooExhibitAnimalSvg animal={bar.animal} size={animalSize} />
          </AnimatedZooAnimal>
        </Animated.View>
        {musicianBurstTick && (
          <View style={styles.musicianBurst} pointerEvents="none">
            <SnapBurst key={musicianBurstTick} size={Math.round(animalSize * 1.15)} />
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={barTap.onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Play ${bar.animal} xylophone note`}
        style={[
          styles.xyloBar,
          {
            width: barWidth,
            height: barH,
            backgroundColor: bar.color,
            borderColor: isDemoLit || isTargetNext ? '#FFFDF5' : bar.darkColor,
            borderBottomColor: bar.darkColor,
          },
          (isDemoLit || isPressedPop) && styles.xyloBarLit,
          isTargetNext && styles.xyloBarTarget,
          barTap.webStyle,
        ]}
        {...barTap.webProps}
      >
        <View style={styles.woodPin} pointerEvents="none" />

        {isTargetNext ? (
          <Animated.View
            style={{ transform: [{ scale: starPulse }] }}
            pointerEvents="none"
          >
            <StarIcon size={barWidth >= 82 ? 34 : 26} color="#FFFDF5" />
          </Animated.View>
        ) : (
          <Text
            style={[
              styles.barNoteLabel,
              { fontSize: barWidth >= 82 ? 18 : 13 },
            ]}
            pointerEvents="none"
          >
            {bar.noteLabel}
          </Text>
        )}

        <View style={styles.woodPin} pointerEvents="none" />
      </Pressable>
    </View>
  );
};

/**
 * Zoo Band Jungle Xylophone (Paid Tier):
 * - 3 Beloved Follow-the-Light Nursery Melodies (Twinkle Twinkle, Row Your Boat, Little Lamb)
 *   plus open-ended Free Jam creative mode!
 * - Tappable living animal musicians perched on every bar (custom animal voices + chord + sticker!)
 * - Warm resonant marimba notes with zero fail states.
 */
export const JungleMusicGame: React.FC = () => {
  const { addStar, collectSticker, goHome } = useApp();
  const { isTablet, isTabletLandscape, width } = useResponsive();

  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [songId, setSongId] = useState<SongId>('twinkle');
  const [stepIdx, setStepIdx] = useState(0);
  const [demoLitBar, setDemoLitBar] = useState<number | null>(null);
  const [pressedBar, setPressedBar] = useState<{ index: number; tick: number } | null>(
    null
  );
  const [musicianBursts, setMusicianBursts] = useState<Record<number, number>>({});
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [won, setWon] = useState(false);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const isFreeJam = songId === 'free';
  const currentSongSpec =
    SONGBOOK.find((s) => s.id === songId) ?? SONGBOOK[0];
  const currentSong = currentSongSpec.notesByDiff[difficulty];

  // Show all 6 rainbow bars in Free Jam, Hard, or when a song uses bar 5
  const maxSongBar = currentSong.reduce((m, idx) => Math.max(m, idx), 0);
  const barCount =
    isFreeJam || difficulty === 3 || maxSongBar >= 5
      ? 6
      : difficulty === 1
      ? 5
      : 5;
  const activeBars = BAND_BARS.slice(0, barCount);
  const expectedBar =
    !isFreeJam && stepIdx < currentSong.length ? currentSong[stepIdx] : null;

  const clearDemoTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const playSongDemo = useCallback(
    (song: number[], diff: Difficulty) => {
      clearDemoTimers();
      if (song.length === 0) {
        setIsPlayingDemo(false);
        return;
      }
      setIsPlayingDemo(true);
      setDemoLitBar(null);
      const stepDelay = diff === 3 ? 380 : 450;

      song.forEach((barIdx, i) => {
        const startT = setTimeout(() => {
          const bar = BAND_BARS[barIdx];
          if (bar) {
            setDemoLitBar(barIdx);
            soundEngine.playNote(bar.freq);
          }
        }, 280 + i * stepDelay);

        const endT = setTimeout(() => {
          setDemoLitBar((prev) => (prev === barIdx ? null : prev));
        }, 280 + i * stepDelay + 300);

        timersRef.current.push(startT, endT);
      });

      const doneT = setTimeout(() => {
        setDemoLitBar(null);
        setIsPlayingDemo(false);
      }, 280 + song.length * stepDelay + 140);
      timersRef.current.push(doneT);
    },
    [clearDemoTimers]
  );

  useEffect(() => {
    if (!isFreeJam) {
      playSongDemo(currentSong, difficulty);
    } else {
      clearDemoTimers();
      setIsPlayingDemo(false);
      setDemoLitBar(null);
    }
    return () => clearDemoTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, difficulty]);

  const selectSong = useCallback(
    (nextId: SongId, nextDiff: Difficulty = difficulty) => {
      clearDemoTimers();
      setSongId(nextId);
      setStepIdx(0);
      setWon(false);
      setDemoLitBar(null);
      if (nextDiff !== difficulty) {
        setDifficulty(nextDiff);
      }
    },
    [clearDemoTimers, difficulty]
  );

  const handleDifficultyChange = useCallback(
    (nextDiff: Difficulty) => {
      selectSong(songId, nextDiff);
    },
    [selectSong, songId]
  );

  const handleTapAnimal = useCallback(
    (bar: BandBar) => {
      soundEngine.unlock();
      soundEngine.playAnimalSound(bar.animal);
      soundEngine.speakWord(getAnimalDisplayName(bar.animal));
      setTimeout(() => soundEngine.playNote(bar.freq), 90);
      collectSticker(bar.animal);
      setMusicianBursts((prev) => ({ ...prev, [bar.index]: Date.now() }));
    },
    [collectSticker]
  );

  const handleBarTap = useCallback(
    (bar: BandBar) => {
      if (won) return;
      soundEngine.unlock();
      soundEngine.playNote(bar.freq);
      setPressedBar({ index: bar.index, tick: Date.now() });
      setTimeout(() => {
        setPressedBar((prev) => (prev?.index === bar.index ? null : prev));
      }, 260);

      if (isFreeJam) {
        setMusicianBursts((prev) => ({ ...prev, [bar.index]: Date.now() }));
        collectSticker(bar.animal);
        return;
      }

      if (isPlayingDemo) return;

      if (expectedBar === bar.index) {
        const nextStep = stepIdx + 1;
        setStepIdx(nextStep);
        setMusicianBursts((prev) => ({ ...prev, [bar.index]: Date.now() }));
        collectSticker(bar.animal);

        if (nextStep >= currentSong.length) {
          setTimeout(() => {
            soundEngine.playWin();
            addStar(1);
            setWon(true);
          }, 420);
        }
      }
    },
    [
      won,
      isFreeJam,
      isPlayingDemo,
      expectedBar,
      stepIdx,
      currentSong.length,
      addStar,
      collectSticker,
    ]
  );

  const handleNextSong = () => {
    const melodySongs: SongId[] = ['twinkle', 'rowboat', 'lamb'];
    const cur = melodySongs.indexOf(songId);
    const next = melodySongs[(cur + 1) % melodySongs.length];
    selectSong(next);
  };

  const stageW = isTabletLandscape
    ? Math.min(920, width - 80)
    : isTablet
    ? Math.min(720, width - 60)
    : Math.min(440, width - 20);
  const gap = isTablet ? (barCount === 6 ? 12 : 16) : barCount === 6 ? 6 : 8;
  const barWidth = Math.floor(
    (stageW - (isTablet ? 44 : 24) - gap * (barCount - 1)) / barCount
  );
  const maxBarHeight = isTabletLandscape ? 236 : isTablet ? 250 : 186;
  const animalSize = Math.min(isTablet ? 92 : 62, barWidth + 8);

  return (
    <View style={styles.container}>
      <GameHeader
        totalSteps={isFreeJam ? 0 : currentSong.length}
        completedSteps={isFreeJam ? 0 : stepIdx}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
      />

      <View style={styles.playArea}>
        {/* Songbook Pill Bar + Replay Melody Button */}
        <View style={styles.songbookRow}>
          {!isFreeJam && (
            <TactileButton
              onPress={() => {
                soundEngine.unlock();
                playSongDemo(currentSong, difficulty);
              }}
              accessibilityLabel="Listen to melody again"
              style={{ width: isTablet ? 64 : 52 }}
            >
              <View
                style={[
                  styles.replayBtn,
                  {
                    width: isTablet ? 64 : 52,
                    height: isTablet ? 48 : 42,
                    borderRadius: 18,
                  },
                  isPlayingDemo && styles.replayBtnPlaying,
                ]}
              >
                <MusicNoteIcon size={isTablet ? 28 : 22} />
              </View>
            </TactileButton>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.songPillsScroll}
          >
            {SONGBOOK.map((song) => {
              const active = song.id === songId;
              return (
                <TactileButton
                  key={song.id}
                  onPress={() => {
                    soundEngine.unlock();
                    soundEngine.playPop();
                    const spokenSong =
                      song.id === 'twinkle'
                        ? 'Twinkle Twinkle!'
                        : song.id === 'rowboat'
                        ? 'Row Your Boat!'
                        : song.id === 'lamb'
                        ? 'Little Lamb!'
                        : 'Free Jam!';
                    soundEngine.speakWord(spokenSong);
                    selectSong(song.id);
                  }}
                  accessibilityLabel={`Select ${song.title} mode`}
                >
                  <View
                    style={[
                      styles.songPill,
                      isTablet && styles.songPillTablet,
                      { flexDirection: 'row', alignItems: 'center', gap: 5 },
                      active && {
                        backgroundColor: song.badgeColor,
                        borderColor: COLORS.woodDark,
                      },
                    ]}
                  >
                    {song.icon && <StoryIcon name={song.icon} size={isTablet ? 16 : 14} />}
                    <Text
                      style={[
                        styles.songPillText,
                        isTablet && styles.songPillTextTablet,
                        active && styles.songPillTextActive,
                      ]}
                    >
                      {song.title}
                    </Text>
                  </View>
                </TactileButton>
              );
            })}
          </ScrollView>
        </View>

        {/* Open-Air Carved Wooden Xylophone sitting right in the jungle clearing */}
        <View style={[styles.xyloOpen, { width: stageW }]}>
          <View style={[styles.rail, styles.railTop]} />
          <View style={[styles.rail, styles.railBottom]} />

          <View style={[styles.barsRow, { gap }]}>
            {activeBars.map((bar) => (
              <XylophoneBarButton
                key={`${difficulty}-${songId}-${bar.index}`}
                bar={bar}
                barWidth={barWidth}
                maxBarHeight={maxBarHeight}
                animalSize={animalSize}
                isDemoLit={demoLitBar === bar.index}
                isTargetNext={!isFreeJam && !isPlayingDemo && expectedBar === bar.index}
                pressedTick={pressedBar?.index === bar.index ? pressedBar.tick : null}
                musicianBurstTick={musicianBursts[bar.index] ?? null}
                onTapBar={handleBarTap}
                onTapAnimal={handleTapAnimal}
              />
            ))}
          </View>
        </View>
      </View>

      <CelebrationOverlay
        visible={won}
        onPlayAgain={handleNextSong}
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
    gap: 18,
    paddingHorizontal: 10,
    paddingBottom: 22,
  },
  songbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.84)',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 48, 0.28)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    shadowColor: '#5C3D20',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  songPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 2,
  },
  songPill: {
    backgroundColor: 'rgba(246, 235, 212, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 48, 0.26)',
    borderBottomWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songPillTablet: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  songPillText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  songPillTextTablet: {
    fontSize: 14.5,
  },
  songPillTextActive: {
    color: COLORS.woodDark,
  },
  replayBtn: {
    backgroundColor: COLORS.riverBlue,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  replayBtnPlaying: {
    backgroundColor: COLORS.sunGold,
  },
  xyloOpen: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C9955A',
    borderWidth: 2,
    borderColor: 'rgba(94, 64, 40, 0.5)',
  },
  railTop: {
    bottom: '34%',
  },
  railBottom: {
    bottom: 24,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 2,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  musicianWrap: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  musicianBurst: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  xyloBar: {
    borderRadius: 22,
    borderWidth: 3,
    borderBottomWidth: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  xyloBarLit: {
    transform: [{ scale: 1.07 }, { translateY: -6 }],
    shadowOpacity: 0.36,
  },
  xyloBarTarget: {
    borderWidth: 4.5,
    shadowColor: '#E8A530',
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  xyloBarPressed: {
    transform: [{ translateY: 3 }, { scale: 0.96 }],
  },
  barNoteLabel: {
    fontWeight: '900',
    color: 'rgba(255, 253, 245, 0.85)',
  },
  woodPin: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: 'rgba(255, 249, 236, 0.8)',
    borderWidth: 1.8,
    borderColor: 'rgba(74, 53, 37, 0.38)',
  },
});
