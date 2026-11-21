import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SnapBurstProps {
  /** Increment or pass unique key to play burst animation */
  size?: number;
}

const PARTICLES = [
  { angle: -90, dist: 46, kind: 'star', color: '#F8D459' },
  { angle: -40, dist: 44, kind: 'leaf', color: '#64B257' },
  { angle: 12, dist: 48, kind: 'star', color: '#F59B42' },
  { angle: 62, dist: 42, kind: 'leaf', color: '#7CC966' },
  { angle: 125, dist: 46, kind: 'star', color: '#F8D459' },
  { angle: 172, dist: 44, kind: 'leaf', color: '#539A4A' },
  { angle: 222, dist: 48, kind: 'star', color: '#F48FB1' },
  { angle: -135, dist: 42, kind: 'leaf', color: '#7CC966' },
] as const;

/**
 * Tactile Sago-Mini-style radial leaf & golden star burst
 * played right over a piece/target when it snaps or scores!
 */
export const SnapBurst: React.FC<SnapBurstProps> = ({ size = 110 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.72, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  const scaleFactor = size / 110;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 },
      ]}
    >
      {PARTICLES.map((p, idx) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist * scaleFactor;
        const ty = Math.sin(rad) * p.dist * scaleFactor;

        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, tx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, ty],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.25, 1],
          outputRange: [0.3, 1.15, 0.45],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', idx % 2 === 0 ? '48deg' : '-48deg'],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
              },
            ]}
          >
            {p.kind === 'star' ? (
              <Svg width="18" height="18" viewBox="0 0 24 24">
                <Path
                  d="M12 2 L14.9 8.2 L21.6 9 L16.6 13.7 L17.9 20.4 L12 17.1 L6.1 20.4 L7.4 13.7 L2.4 9 L9.1 8.2 Z"
                  fill={p.color}
                  stroke="#4A3525"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <Svg width="18" height="18" viewBox="0 0 24 24">
                <Path
                  d="M 4 18 C 5 8 13 4 20 4 C 19 12 14 19 4 18 Z"
                  fill={p.color}
                  stroke="#4A3525"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 80,
  },
  particle: {
    position: 'absolute',
  },
});
