import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { WhitMascot } from './WhitMascot';

const TWILIGHT_STARS = [
  { left: '12%', top: '14%', sz: 14 },
  { left: '26%', top: '9%', sz: 10 },
  { left: '46%', top: '12%', sz: 16 },
  { left: '72%', top: '10%', sz: 12 },
  { left: '86%', top: '18%', sz: 15 },
  { left: '18%', top: '76%', sz: 11 },
  { left: '82%', top: '74%', sz: 13 },
];

/** Flat-SVG Crescent Moon + Cozy Sleepy Nightcap (zero gradients/clipPaths) */
const CrescentMoonSvg: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80">
    <Path
      d="M 52 12 C 33 14, 18 30, 20 50 C 22 66, 37 76, 54 72 C 41 68, 34 55, 36 40 C 38 26, 45 18, 52 12 Z"
      fill="#FFE885"
      stroke="#A87E1E"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <Circle cx="60" cy="24" r="3.5" fill="#FFF5BA" />
    <Circle cx="66" cy="40" r="2.4" fill="#FFF5BA" />
  </Svg>
);

const NightcapSvg: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 100 80">
    <Path
      d="M 18 56 C 22 24, 62 10, 86 38 C 72 38, 62 44, 58 56 Z"
      fill="#7B8CE8"
      stroke="#353D78"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <Circle cx="44" cy="36" r="4" fill="#FFF4B8" />
    <Circle cx="60" cy="30" r="3" fill="#FFF4B8" />
    <Path
      d="M 14 54 Q 40 48 64 56 Q 40 66 14 58 Z"
      fill="#FFF9EC"
      stroke="#353D78"
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <Circle cx="86" cy="40" r="9" fill="#FFF9EC" stroke="#353D78" strokeWidth="3" />
  </Svg>
);

/**
 * Gentle "Whit's Calm / Bedtime Timer" Overlay:
 * Helps parents end screen time peacefully without abrupt cutoffs or toddler meltdowns.
 * - Sleepy twilight sky, gentle breathing Whit in a nightcap, and warm goodnight message.
 * - Discreet parent-only 2-second press-and-hold controls to add 5 minutes or turn off.
 */
export const BedtimeModal: React.FC = () => {
  const { bedtimeReached, snoozeBedtime, dismissBedtime } = useApp();
  const { isTablet } = useResponsive();

  const [holdingAction, setHoldingAction] = useState<'snooze' | 'off' | null>(null);
  const holdAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const twinkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bedtimeReached) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0.35,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bedtimeReached, twinkleAnim]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const beginHold = (action: 'snooze' | 'off') => {
    setHoldingAction(action);
    holdAnim.setValue(0);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    holdTimerRef.current = setTimeout(() => {
      setHoldingAction(null);
      holdAnim.setValue(0);
      if (action === 'snooze') {
        snoozeBedtime(5);
      } else {
        dismissBedtime();
      }
    }, 2000);
  };

  const cancelHold = () => {
    setHoldingAction(null);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdAnim.stopAnimation();
    Animated.timing(holdAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  };

  if (!bedtimeReached) return null;

  const holdWidth = holdAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const whitSz = isTablet ? 186 : 148;

  return (
    <Modal visible={bedtimeReached} transparent animationType="fade">
      <View style={styles.skyBackdrop}>
        {/* Twinkling Twilight Stars */}
        {TWILIGHT_STARS.map((st, idx) => (
          <Animated.View
            key={idx}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: st.left as `${number}%`,
              top: st.top as `${number}%`,
              opacity: twinkleAnim,
            }}
          >
            <Svg width={st.sz} height={st.sz} viewBox="0 0 24 24">
              <G>
                <Path
                  d="M 12 2 L 14.5 9.5 L 22 12 L 14.5 14.5 L 12 22 L 9.5 14.5 L 2 12 L 9.5 9.5 Z"
                  fill="#FFF2A6"
                />
              </G>
            </Svg>
          </Animated.View>
        ))}

        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <View style={styles.moonRow}>
            <CrescentMoonSvg size={isTablet ? 64 : 52} />
            <Text style={styles.zzzText}>zZz...</Text>
          </View>

          <View style={styles.whitSleepWrap}>
            <WhitMascot
              mood="idle"
              size={whitSz}
              interactive={false}
              accessory="none"
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -whitSz * 0.14,
                left: whitSz * 0.24,
              }}
            >
              <NightcapSvg size={Math.round(whitSz * 0.56)} />
            </View>
          </View>

          <Text style={[styles.title, isTablet && { fontSize: 28 }]}>
            Night-Night, Little Explorer!
          </Text>
          <Text style={[styles.subtitle, isTablet && { fontSize: 16 }]}>
            Whit and all his zoo friends are getting cozy for rest time. See you next adventure!
          </Text>

          {/* Discreet Child-Proof Parent Hold Controls */}
          <View style={styles.parentSection}>
            <Text style={styles.parentHint}>
              PARENTS: PRESS & HOLD FOR 2 SECONDS
            </Text>
            <View style={styles.parentBtnsRow}>
              <Pressable
                onPressIn={() => beginHold('snooze')}
                onPressOut={cancelHold}
                style={styles.holdBtn}
              >
                {holdingAction === 'snooze' && (
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.holdFill, { width: holdWidth }]}
                  />
                )}
                <Text pointerEvents="none" style={styles.holdBtnText}>
                  +5 More Mins
                </Text>
              </Pressable>

              <Pressable
                onPressIn={() => beginHold('off')}
                onPressOut={cancelHold}
                style={styles.holdBtn}
              >
                {holdingAction === 'off' && (
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.holdFill, { width: holdWidth }]}
                  />
                )}
                <Text pointerEvents="none" style={styles.holdBtnText}>
                  Turn Timer Off
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  skyBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 28, 58, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#242D5C',
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#5260A8',
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#0B0E24',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  cardTablet: {
    maxWidth: 500,
    paddingVertical: 30,
    paddingHorizontal: 30,
  },
  moonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  zzzText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C5CEFF',
    letterSpacing: 1.5,
  },
  whitSleepWrap: {
    position: 'relative',
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#FFF9EC',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#D5DCFF',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  parentSection: {
    width: '100%',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(155, 168, 235, 0.25)',
    paddingTop: 14,
    alignItems: 'center',
  },
  parentHint: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#9BA8EB',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  parentBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  holdBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 206, 255, 0.35)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(125, 216, 138, 0.45)',
  },
  holdBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EEF1FF',
    zIndex: 2,
  },
});
