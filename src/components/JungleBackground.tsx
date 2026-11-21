import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';

interface JungleBackgroundProps {
  children: React.ReactNode;
  variant?: 'home' | 'clearing';
}

/**
 * Full-bleed Warm Watercolor & Gouache storybook backdrop (`bg-home.png` / `bg-clearing.png`)
 * with subtle living firefly glow particles floating gently above the painted artwork.
 */
export const JungleBackground: React.FC<JungleBackgroundProps> = ({
  children,
  variant = 'home',
}) => {
  const fireflyA = useRef(new Animated.Value(0)).current;
  const fireflyB = useRef(new Animated.Value(0)).current;
  const fireflyC = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireflyA, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(fireflyA, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(fireflyB, {
            toValue: 1,
            duration: 3800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(fireflyB, {
            toValue: 0,
            duration: 3800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(1700),
          Animated.timing(fireflyC, {
            toValue: 1,
            duration: 2900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(fireflyC, {
            toValue: 0,
            duration: 2900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [fireflyA, fireflyB, fireflyC]);

  const bgSource =
    variant === 'home'
      ? STORYBOOK_ASSETS.bgHome
      : STORYBOOK_ASSETS.bgClearing;

  return (
    <View style={styles.root}>
      {/* Full-bleed edge-to-edge painted watercolor backdrop */}
      <Image
        source={bgSource}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Subtle warm sunlit shimmer fireflies */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.firefly,
          { left: '16%', top: '24%' },
          {
            opacity: fireflyA.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.85, 0.2],
            }),
            transform: [
              {
                translateY: fireflyA.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, -16],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="18" height="18" viewBox="0 0 18 18">
          <Circle cx="9" cy="9" r="8" fill="#FFF7B2" opacity="0.45" />
          <Circle cx="9" cy="9" r="3.5" fill="#FFFDE8" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.firefly,
          { right: '18%', top: '20%' },
          {
            opacity: fireflyB.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.15, 0.8, 0.15],
            }),
            transform: [
              {
                translateY: fireflyB.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, -14],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="16" height="16" viewBox="0 0 16 16">
          <Circle cx="8" cy="8" r="7" fill="#FFF7B2" opacity="0.42" />
          <Circle cx="8" cy="8" r="3" fill="#FFFDE8" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.firefly,
          { left: '54%', top: '16%' },
          {
            opacity: fireflyC.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.15, 0.78, 0.15],
            }),
            transform: [
              {
                translateY: fireflyC.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, -12],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width="15" height="15" viewBox="0 0 15 15">
          <Circle cx="7.5" cy="7.5" r="6.5" fill="#FFF7B2" opacity="0.4" />
          <Circle cx="7.5" cy="7.5" r="2.8" fill="#FFFDE8" />
        </Svg>
      </Animated.View>

      {/* Active App Screen Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#DDEED1',
    position: 'relative',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  firefly: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    zIndex: 5,
  },
});
