import { Platform, ViewStyle } from 'react-native';

// Shared module-level timestamp across all web touch handlers so:
// 1. A touchstart tap never double-fires via trailing pointerdown/click (~300ms later).
// 2. Navigating from HomeScreen (TactileButton) into a game never ghost-clicks a card underneath.
let lastInstantTouchAt = 0;

export function markWebTouchHandled(): void {
  lastInstantTouchAt = Date.now();
}

export function wasRecentWebTouch(windowMs = 550): boolean {
  return Platform.OS === 'web' && Date.now() - lastInstantTouchAt < windowMs;
}

/**
 * Toddler-proof 0ms web touch handler for non-scrolling game targets
 * (color cards, number cards, countable animals, letter blocks, matching cards,
 * xylophone keys, drop slots, podiums, puzzle cells, animals).
 *
 * Tablet reliability guarantees:
 * - Fires at 0ms on `touchstart` (no waiting for touchend/click, so toddler finger
 *   wiggles, shrink transforms, or resting palms on the bezel NEVER drop taps).
 * - Mouse/stylus fires at 0ms on `pointerdown` (ignoring `pointerType === 'touch'`
 *   so Android Chrome never double-fires pointerdown + touchstart!).
 * - Uses `touchAction: 'none'` by default so mobile browsers never hesitate waiting for
 *   double-tap zoom or pan gestures. Pass `allowScroll: true` only inside ScrollViews.
 */
export function makeInstantTapProps(
  onActivate?: () => void,
  disabled = false,
  options?: { allowScroll?: boolean }
): {
  onPress: () => void;
  webProps: Record<string, unknown>;
  webStyle: ViewStyle | null;
} {
  const onPress = () => {
    if (disabled || !onActivate) return;
    if (wasRecentWebTouch(600)) return;
    onActivate();
  };

  if (Platform.OS !== 'web') {
    return { onPress, webProps: {}, webStyle: null };
  }

  return {
    onPress,
    webProps: {
      onTouchStart: (e: { stopPropagation?: () => void }) => {
        if (disabled || !onActivate) return;
        e.stopPropagation?.();
        markWebTouchHandled();
        onActivate();
      },
      onPointerDown: (e: {
        pointerType?: string;
        stopPropagation?: () => void;
      }) => {
        if (disabled || !onActivate) return;
        if (e.pointerType === 'touch') return;
        if (wasRecentWebTouch(600)) return;
        e.stopPropagation?.();
        markWebTouchHandled();
        onActivate();
      },
    },
    webStyle: {
      cursor: disabled ? 'default' : 'pointer',
      touchAction: options?.allowScroll ? 'manipulation' : 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
    } as unknown as ViewStyle,
  };
}
