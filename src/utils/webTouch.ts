import { Platform, ViewStyle } from 'react-native';

// Shared across all instant-tap game targets on Web so the browser's delayed
// synthetic `click` (~300ms after touchend) never double-fires a tap or ghost-clicks
// a newly revealed element in the same spot.
let lastInstantTouchAt = 0;

export function markWebTouchHandled(): void {
  lastInstantTouchAt = Date.now();
}

export function wasRecentWebTouch(windowMs = 550): boolean {
  return Platform.OS === 'web' && Date.now() - lastInstantTouchAt < windowMs;
}

/**
 * Toddler-proof 0ms web touch handler for non-scrolling game targets
 * (matching cards, xylophone keys, drop slots, podiums, puzzle cells, animals).
 *
 * Why this fixes dropped tablet taps:
 * - Fires immediately on `touchstart` instead of waiting for `touchend` + `click`,
 *   so finger wiggle, shrink-on-press transforms, or a resting palm on the tablet
 *   bezel can NEVER cancel the tap.
 * - Supports rapid multi-finger tapping (e.g. two-handed xylophone drumming or fast
 *   card flipping) because `touchstart` is never throttled by `lastInstantTouchAt`.
 * - Deduplicates the browser's trailing synthetic `click` (`onPress`) cleanly while
 *   keeping desktop mouse clicks working normally.
 */
export function makeInstantTapProps(
  onActivate?: () => void,
  disabled = false
): {
  onPress: () => void;
  webProps: Record<string, unknown>;
  webStyle: ViewStyle | null;
} {
  const onPress = () => {
    if (disabled || !onActivate) return;
    if (wasRecentWebTouch()) return;
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
    },
    webStyle: {
      cursor: disabled ? 'default' : 'pointer',
      touchAction: 'manipulation',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
    } as unknown as ViewStyle,
  };
}
