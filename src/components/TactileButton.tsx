import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { markWebTouchHandled, wasRecentWebTouch } from '../utils/webTouch';

interface TactileButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  bounceScale?: number;
}

interface WebTouch {
  identifier: number;
  clientX: number;
  clientY: number;
}

interface WebTouchEvent {
  changedTouches?: ArrayLike<WebTouch>;
  touches?: ArrayLike<WebTouch>;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

const TOUCH_TAP_SLOP_PX = 30;

/**
 * Playful spring-bounce button wrapper inspired by Sago Mini / Khan Academy Kids.
 *
 * iPad / Android tablet reliability notes:
 * - Wraps children in `pointerEvents="none"` so animated SVGs/animals inside buttons
 *   never steal or shift the touch target mid-tap.
 * - On Web, tracks touchstart -> touchend directly with generous 30px toddler tap slop
 *   so browsers never drop taps when a finger wiggles or the button squishes, while
 *   still allowing ScrollView drags (>30px) to scroll naturally.
 * - Shares `markWebTouchHandled()` with `webTouch.ts` so transitioning between screens
 *   never lets a browser's trailing synthetic `click` ghost-tap the newly mounted game.
 */
export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  bounceScale = 0.93,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const touchRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const animateIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: bounceScale,
      friction: 6,
      tension: 260,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [scale, bounceScale]);

  const animateOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    // Deduplicate trailing synthetic click after any direct web touch tap
    if (wasRecentWebTouch(550)) {
      return;
    }
    onPress?.();
  }, [disabled, onPress]);

  const webTouchProps =
    Platform.OS === 'web'
      ? ({
          onTouchStart: (e: WebTouchEvent) => {
            if (disabled) return;
            const t = e.changedTouches?.[0];
            if (!t) return;
            // If a previous touch on this button is still active, keep tracking it;
            // otherwise replace any stale state cleanly.
            const prev = touchRef.current;
            if (prev && e.touches) {
              let stillDown = false;
              for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === prev.id) {
                  stillDown = true;
                  break;
                }
              }
              if (stillDown) return;
            }
            touchRef.current = {
              id: t.identifier,
              startX: t.clientX,
              startY: t.clientY,
              moved: false,
            };
            animateIn();
          },
          onTouchMove: (e: WebTouchEvent) => {
            const st = touchRef.current;
            if (!st || !e.touches) return;
            for (let i = 0; i < e.touches.length; i++) {
              const t = e.touches[i];
              if (t.identifier === st.id) {
                if (
                  Math.hypot(t.clientX - st.startX, t.clientY - st.startY) >
                  TOUCH_TAP_SLOP_PX
                ) {
                  st.moved = true;
                  animateOut();
                }
                break;
              }
            }
          },
          onTouchEnd: (e: WebTouchEvent) => {
            const st = touchRef.current;
            if (!st) return;

            // Only finish if our tracked finger was lifted
            let matchedTouch: WebTouch | null = null;
            const list = e.changedTouches;
            if (list) {
              for (let i = 0; i < list.length; i++) {
                if (list[i].identifier === st.id) {
                  matchedTouch = list[i];
                  break;
                }
              }
            }
            if (!matchedTouch) return;

            touchRef.current = null;
            animateOut();
            if (st.moved || disabled) return;

            if (
              Math.hypot(
                matchedTouch.clientX - st.startX,
                matchedTouch.clientY - st.startY
              ) > TOUCH_TAP_SLOP_PX
            ) {
              return;
            }

            e.stopPropagation?.();
            markWebTouchHandled();
            onPress?.();
          },
          onTouchCancel: () => {
            touchRef.current = null;
            animateOut();
          },
        } as Record<string, unknown>)
      : {};

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        Platform.OS === 'web'
          ? ({
              cursor: disabled ? 'default' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            } as unknown as ViewStyle)
          : null,
        style,
      ]}
      {...webTouchProps}
    >
      <Animated.View
        pointerEvents="none"
        style={{ transform: [{ scale }], width: '100%' }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
};
