import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { soundEngine } from '../services/sound';
import { COLORS } from '../theme';
import { LockIcon } from './JungleArt';
import { StoryIcon } from './StorybookIcons';
import { TactileButton } from './TactileButton';

interface ParentalGateModalProps {
  visible: boolean;
  onClose: () => void;
  onPassed: () => void;
}

interface MathChallenge {
  a: number;
  b: number;
  answer: number;
  choices: number[];
}

function generateChallenge(): MathChallenge {
  const pairs: [number, number][] = [
    [8, 5],
    [7, 6],
    [9, 4],
    [6, 8],
    [9, 7],
    [8, 7],
    [7, 5],
  ];
  const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
  const answer = a + b;
  const wrong1 = answer + 2;
  const wrong2 = answer - 3;
  const wrong3 = answer + 4;
  const choices = [answer, wrong1, wrong2, wrong3].sort(
    () => Math.random() - 0.5
  );
  return { a, b, answer, choices };
}

/**
 * Apple App Store Kids Category compliant Parental Gate.
 * Requires an adult to either solve a simple arithmetic problem (e.g., 8 + 5)
 * OR press and hold the verification bar for 3 seconds before entering the paywall.
 */
export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  visible,
  onClose,
  onPassed,
}) => {
  const [seed, setSeed] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [holding, setHolding] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const holdAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const challenge = useMemo(() => generateChallenge(), [seed, visible]);

  useEffect(() => {
    if (visible) {
      setHintText(null);
      setHolding(false);
      holdAnim.setValue(0);
    }
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, [visible, holdAnim]);

  const handleAnswer = (choice: number) => {
    if (choice === challenge.answer) {
      soundEngine.playSnap();
      onPassed();
    } else {
      soundEngine.playGentleBounce();
      setHintText('Oops! Try again — parents only.');
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 6,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSeed((s) => s + 1);
      });
    }
  };

  const handleHoldStart = () => {
    setHolding(true);
    holdAnim.setValue(0);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    holdTimerRef.current = setTimeout(() => {
      setHolding(false);
      soundEngine.playSnap();
      onPassed();
    }, 3000);
  };

  const handleHoldEnd = () => {
    setHolding(false);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdAnim.stopAnimation();
    Animated.timing(holdAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const holdWidth = holdAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
        >
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <LockIcon size={18} color="#6D4C3D" />
              <Text style={styles.badgeText}>PARENTS ONLY</Text>
            </View>
            <TactileButton
              onPress={onClose}
              accessibilityLabel="Close parental gate"
            >
              <View style={styles.closeBtn}>
                <StoryIcon name="close" size={16} color={COLORS.woodDark} />
              </View>
            </TactileButton>
          </View>

          <Text style={styles.title}>Ask a Grown-Up</Text>
          <Text style={styles.subtitle}>
            To keep little explorers safe, solve this quick question to open the
            Parent Corner.
          </Text>

          <View style={styles.mathBox}>
            <Text style={styles.mathPrompt}>
              What is {challenge.a} + {challenge.b}?
            </Text>
            <View style={styles.choicesRow}>
              {challenge.choices.map((c) => (
                <TactileButton
                  key={c}
                  onPress={() => handleAnswer(c)}
                  accessibilityLabel={`Answer ${c}`}
                  style={{ flex: 1 }}
                >
                  <View style={styles.choiceBtn}>
                    <Text style={styles.choiceText}>{c}</Text>
                  </View>
                </TactileButton>
              ))}
            </View>
            {hintText && <Text style={styles.hintText}>{hintText}</Text>}
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPressIn={handleHoldStart}
            onPressOut={handleHoldEnd}
            style={styles.holdBtn}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.holdProgress, { width: holdWidth }]}
            />
            <Text pointerEvents="none" style={styles.holdBtnText}>
              {holding
                ? 'Keep holding for 3 seconds...'
                : 'Press & Hold for 3 Seconds'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cream,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#D6E6D2',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3ECD8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D4C3D',
    letterSpacing: 0.7,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.inkMuted,
    marginBottom: 16,
  },
  mathBox: {
    backgroundColor: '#F4FAF2',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4EBD0',
    padding: 16,
    alignItems: 'center',
  },
  mathPrompt: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.jungleDark,
    marginBottom: 14,
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  choiceBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2.5,
    borderColor: '#B8DCB3',
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnPressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2.5,
    backgroundColor: '#E8F7E5',
  },
  choiceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
  },
  hintText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.papayaBorder,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E1EAE0',
  },
  dividerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  holdBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EEF5ED',
    borderWidth: 2,
    borderColor: '#C4DFC0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holdProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#9BE0A4',
  },
  holdBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.jungleDark,
    zIndex: 2,
  },
});
