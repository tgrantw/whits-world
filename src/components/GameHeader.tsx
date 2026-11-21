import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, Difficulty } from '../theme';
import { GorillaMood } from './GorillaMascot';
import { HomeIcon, SoundIcon, StarIcon } from './JungleArt';
import { TactileButton } from './TactileButton';

interface GameHeaderProps {
  totalSteps: number;
  completedSteps: number;
  /** Kept optional for compatibility with game state, no longer cluttered into top bar */
  mascotMood?: GorillaMood;
  onMascotPress?: () => void;
  /** Standardized 3-level difficulty adjuster (1=Easy, 2=Med, 3=Hard) */
  difficulty?: Difficulty;
  onDifficultyChange?: (next: Difficulty) => void;
  /** Optional inline scene/animal switcher slot cleanly integrated inside the single top bar */
  extraCenterSlot?: React.ReactNode;
}

const DIFF_META: {
  level: Difficulty;
  shortLabel: string;
  a11yLabel: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    level: 1,
    shortLabel: 'Easy',
    a11yLabel: 'Easy difficulty',
    activeBg: '#5EA85C',
    activeBorder: '#346E36',
    activeText: '#FFFDF7',
  },
  {
    level: 2,
    shortLabel: 'Med',
    a11yLabel: 'Medium difficulty',
    activeBg: '#F4C542',
    activeBorder: '#A87018',
    activeText: '#4A3525',
  },
  {
    level: 3,
    shortLabel: 'Hard',
    a11yLabel: 'Hard difficulty',
    activeBg: '#DF7248',
    activeBorder: '#9C4222',
    activeText: '#FFFDF7',
  },
];

/**
 * Clean, uncluttered single top bar across all Whit's World games:
 * - Generous horizontal safe-area padding so right-side audio button is never clipped
 * - Warm wooden Home button on left
 * - Stars + clearly labeled "Difficulty: Easy | Med | Hard" toggle in center
 * - Clean Audio toggle on right (no cluttered tiny mascot icon)
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  totalSteps,
  completedSteps,
  difficulty,
  onDifficultyChange,
}) => {
  const { goHome, isMuted, toggleMute } = useApp();
  const { isTablet } = useResponsive();

  const btnSize = isTablet ? 58 : 46;
  const starSize = isTablet
    ? totalSteps > 5
      ? 22
      : 26
    : totalSteps > 5
    ? 15
    : 18;

  return (
    <View style={[styles.header, isTablet && styles.headerTablet]}>
      {/* Left: Warm Terracotta Home Button */}
      <TactileButton
        onPress={goHome}
        accessibilityLabel="Back to Home"
        style={{ width: btnSize }}
      >
        <View
          style={[
            styles.homeBtn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: isTablet ? 20 : 16,
            },
          ]}
        >
          <HomeIcon size={isTablet ? 28 : 22} color="#FFF9EC" />
        </View>
      </TactileButton>

      {/* Center: Single Unified Translucent Top Pill (Stars + Labeled Difficulty) */}
      <View
        style={[
          styles.unifiedBar,
          isTablet ? styles.unifiedBarTablet : styles.unifiedBarPhone,
        ]}
      >
        {/* Star Progress */}
        <View style={[styles.starsRow, isTablet && { gap: 5 }]}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <StarIcon key={i} size={starSize} filled={i < completedSteps} />
          ))}
        </View>

        {difficulty !== undefined && onDifficultyChange && (
          <View style={[styles.diffGroup, isTablet && { gap: 7 }]}>
              <Text
                style={[
                  styles.diffLabel,
                  isTablet && styles.diffLabelTablet,
                ]}
              >
                Difficulty:
              </Text>
              <View style={[styles.diffTrack, isTablet && styles.diffTrackTablet]}>
                {DIFF_META.map((item) => {
                  const active = difficulty === item.level;
                  return (
                    <TactileButton
                      key={item.level}
                      onPress={() => {
                        if (difficulty !== item.level) {
                          soundEngine.playPop();
                          onDifficultyChange(item.level);
                        }
                      }}
                      accessibilityLabel={item.a11yLabel}
                      style={{ minWidth: isTablet ? 58 : 42 }}
                    >
                      <View
                        style={[
                          styles.diffBtn,
                          isTablet && styles.diffBtnTablet,
                          active
                            ? {
                                backgroundColor: item.activeBg,
                                borderColor: item.activeBorder,
                              }
                            : styles.diffBtnInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffBtnText,
                            isTablet && styles.diffBtnTextTablet,
                            {
                              color: active ? item.activeText : COLORS.inkMuted,
                            },
                          ]}
                        >
                          {item.shortLabel}
                        </Text>
                      </View>
                    </TactileButton>
                  );
                })}
              </View>
            </View>
        )}
      </View>

      {/* Right: Clean Unclipped Audio Mute Button */}
      <TactileButton
        onPress={toggleMute}
        accessibilityLabel={isMuted ? 'Unmute sound' : 'Mute sound'}
        style={{ width: btnSize }}
      >
        <View
          style={[
            styles.muteBtn,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: isTablet ? 20 : 16,
            },
          ]}
        >
          <SoundIcon
            muted={isMuted}
            size={isTablet ? 26 : 21}
            color={COLORS.woodDark}
          />
        </View>
      </TactileButton>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    width: '100%',
    maxWidth: 1220,
    alignSelf: 'center',
    zIndex: 40,
    gap: 8,
  },
  headerTablet: {
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 16,
  },
  homeBtn: {
    backgroundColor: COLORS.papaya,
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  unifiedBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  unifiedBarPhone: {
    flex: 1,
  },
  unifiedBarTablet: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    flexWrap: 'nowrap',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  diffGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  diffLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  diffLabelTablet: {
    fontSize: 14,
  },
  diffTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(227, 185, 126, 0.34)',
    padding: 3,
    borderRadius: 14,
  },
  diffTrackTablet: {
    gap: 6,
    padding: 4,
    borderRadius: 17,
  },
  diffBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffBtnTablet: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  diffBtnInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  diffBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  diffBtnTextTablet: {
    fontSize: 14,
  },
  muteBtn: {
    backgroundColor: COLORS.cream,
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 5,
  },
});
