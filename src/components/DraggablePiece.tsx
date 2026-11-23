import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { soundEngine } from '../services/sound';
import { markWebTouchHandled } from '../utils/webTouch';

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type MeasurableNode = React.ComponentRef<typeof View> | null;

/**
 * Reliable cross-platform DOM / Native rect measurement.
 * Handles direct DOM elements, Animated.View wrappers, and native Views.
 */
export function measureNodeRect(
  node: MeasurableNode
): Promise<WindowRect | null> {
  return new Promise((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }

    if (Platform.OS === 'web') {
      const candidate = node as unknown as {
        getBoundingClientRect?: () => DOMRect;
        getNode?: () => { getBoundingClientRect?: () => DOMRect };
      };
      const domEl =
        typeof candidate.getBoundingClientRect === 'function'
          ? candidate
          : typeof candidate.getNode === 'function'
          ? candidate.getNode()
          : null;

      if (domEl && typeof domEl.getBoundingClientRect === 'function') {
        const r = domEl.getBoundingClientRect();
        if (r.width > 0 || r.height > 0) {
          resolve({ x: r.left, y: r.top, width: r.width, height: r.height });
          return;
        }
      }
    }

    const nativeNode = node as unknown as {
      measureInWindow?: (
        cb: (x: number, y: number, width: number, height: number) => void
      ) => void;
    };
    if (typeof nativeNode.measureInWindow === 'function') {
      nativeNode.measureInWindow((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Generous, toddler-forgiving hit test:
 * Checks whether a point falls within the target rectangle expanded by `padding`.
 */
export function isPointNearRect(
  point: { x: number; y: number },
  rect: WindowRect,
  padding = 54
): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
  return (
    point.x >= rect.x - padding &&
    point.x <= rect.x + rect.width + padding &&
    point.y >= rect.y - padding &&
    point.y <= rect.y + rect.height + padding
  );
}

export interface DropAttempt {
  fingerX: number;
  fingerY: number;
  pieceCenterX: number;
  pieceCenterY: number;
}

interface DraggablePieceProps {
  children: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Scale multiplier applied by DraggablePiece while dragging (set to 1 when child animates its own lift) */
  dragScale?: number;
  /** Return true if the piece matched a valid drop target. */
  onDrop: (attempt: DropAttempt) => Promise<boolean> | boolean;
  /** Optional live drag callback to highlight targets under the piece. */
  onDragMove?: (attempt: DropAttempt) => void;
  /** Optional callback notifying when drag starts (true) or ends (false). */
  onDragStateChange?: (isDragging: boolean) => void;
  /** Optional callback when piece is tapped (supports tap-to-select & hint). */
  onTap?: () => void;
  /** Optional callback when drag ends without matching. */
  onGentleReturn?: () => void;
}

interface WebPointerEvent {
  pointerId: number;
  clientX: number;
  clientY: number;
  preventDefault?: () => void;
  stopPropagation?: () => void;
  currentTarget?: {
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
    getBoundingClientRect?: () => DOMRect;
  };
}

/**
 * Bulletproof toddler drag-and-drop piece for iPad Safari, iPhone Safari, Desktop & Native:
 * - On Web: uses Pointer Events + window-level move/up/cancel tracking + non-passive
 *   touchmove scroll lock so fast or bumpy toddler drags NEVER lose tracking or scroll iPad Safari.
 * - On Native iOS/Android: uses React Native `PanResponder`.
 * - Wraps children in `pointerEvents="none"` so inner SVG paths never steal touches.
 */
export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  children,
  disabled = false,
  selected = false,
  style,
  dragScale = 1.15,
  onDrop,
  onDragMove,
  onDragStateChange,
  onTap,
  onGentleReturn,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const containerRef = useRef<MeasurableNode>(null);
  const [dragging, setDragging] = useState(false);

  const pointerStateRef = useRef<{
    active: boolean;
    mode: 'touch' | 'pointer';
    id: number;
    startX: number;
    startY: number;
    startCenterX: number;
    startCenterY: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const lastTouchEndRef = useRef<number>(0);
  const windowCleanupRef = useRef<(() => void) | null>(null);

  const callbacksRef = useRef({
    disabled,
    dragScale,
    onDrop,
    onDragMove,
    onDragStateChange,
    onTap,
    onGentleReturn,
  });
  callbacksRef.current = {
    disabled,
    dragScale,
    onDrop,
    onDragMove,
    onDragStateChange,
    onTap,
    onGentleReturn,
  };

  const cleanupWindowListeners = useCallback(() => {
    if (windowCleanupRef.current) {
      windowCleanupRef.current();
      windowCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupWindowListeners();
    };
  }, [cleanupWindowListeners]);

  const springBack = useCallback(() => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 105,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 165,
        useNativeDriver: false,
      }),
      Animated.spring(tilt, {
        toValue: 0,
        friction: 6,
        tension: 160,
        useNativeDriver: false,
      }),
    ]).start();
  }, [pan, scale, tilt]);

  /* ---------------- WEB TOUCH + POINTER DRAG (iPhone/iPad Safari & Desktop) ---------------- */
  const finishWebDrag = useCallback(
    async (
      mode: 'touch' | 'pointer',
      id: number,
      clientX: number,
      clientY: number,
      cancelled: boolean
    ) => {
      const st = pointerStateRef.current;
      if (!st || !st.active || st.mode !== mode || st.id !== id) return;

      pointerStateRef.current = null;
      cleanupWindowListeners();
      setDragging(false);
      callbacksRef.current.onDragStateChange?.(false);

      if (mode === 'touch') {
        lastTouchEndRef.current = Date.now();
        markWebTouchHandled();
      }

      const endX = Number.isFinite(clientX) ? clientX : st.lastX;
      const endY = Number.isFinite(clientY) ? clientY : st.lastY;
      const dx = endX - st.startX;
      const dy = endY - st.startY;
      const movedDist = Math.hypot(dx, dy);

      if (movedDist < 16) {
        springBack();
        if (!cancelled) {
          callbacksRef.current.onTap?.();
        }
        return;
      }

      // Even if iOS/Android fired touchcancel after the child dragged onto a target,
      // check the drop position so the toddler's effort is rewarded!
      const matched = await callbacksRef.current.onDrop({
        fingerX: endX,
        fingerY: endY,
        pieceCenterX: st.startCenterX + dx,
        pieceCenterY: st.startCenterY + dy,
      });

      if (!matched) {
        if (!cancelled && movedDist < 30 && callbacksRef.current.onTap) {
          // Slightly wiggly toddler tap that didn't reach a target -> treat as helpful tap-to-select!
          springBack();
          callbacksRef.current.onTap();
          return;
        }
        if (!cancelled) {
          soundEngine.playGentleBounce();
          callbacksRef.current.onGentleReturn?.();
        }
        springBack();
      } else {
        pan.setValue({ x: 0, y: 0 });
        scale.setValue(1);
        tilt.setValue(0);
      }
    },
    [cleanupWindowListeners, pan, scale, tilt, springBack]
  );

  const beginWebDrag = useCallback(
    (
      mode: 'touch' | 'pointer',
      id: number,
      clientX: number,
      clientY: number,
      rect?: DOMRect
    ) => {
      soundEngine.unlock();
      soundEngine.playPop();

      const startCenterX = rect ? rect.left + rect.width / 2 : clientX;
      const startCenterY = rect ? rect.top + rect.height / 2 : clientY;

      pointerStateRef.current = {
        active: true,
        mode,
        id,
        startX: clientX,
        startY: clientY,
        startCenterX,
        startCenterY,
        lastX: clientX,
        lastY: clientY,
      };

      setDragging(true);
      callbacksRef.current.onDragStateChange?.(true);
      if (callbacksRef.current.dragScale !== 1) {
        Animated.spring(scale, {
          toValue: callbacksRef.current.dragScale,
          friction: 5.5,
          tension: 210,
          useNativeDriver: false,
        }).start();
      }

      cleanupWindowListeners();
      if (typeof window === 'undefined') return;

      const updateDragPosition = (cx: number, cy: number) => {
        const st = pointerStateRef.current;
        if (!st || !st.active || st.mode !== mode || st.id !== id) return;
        const dx = cx - st.startX;
        const dy = cy - st.startY;
        const stepDx = cx - st.lastX;
        st.lastX = cx;
        st.lastY = cy;
        pan.setValue({ x: dx, y: dy });
        if (callbacksRef.current.dragScale !== 1) {
          const clampedTilt = Math.max(-8, Math.min(8, stepDx * 0.55));
          tilt.setValue(clampedTilt);
        }
        callbacksRef.current.onDragMove?.({
          fingerX: cx,
          fingerY: cy,
          pieceCenterX: st.startCenterX + dx,
          pieceCenterY: st.startCenterY + dy,
        });
      };

      if (mode === 'touch') {
        const findTouch = (list: TouchList) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].identifier === id) return list[i];
          }
          return null;
        };

        const onWinTouchMove = (ev: TouchEvent) => {
          const t = findTouch(ev.touches) || findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          updateDragPosition(t.clientX, t.clientY);
        };

        const onWinTouchEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          finishWebDrag('touch', id, t.clientX, t.clientY, false);
        };

        const onWinTouchCancel = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          const cx = t ? t.clientX : pointerStateRef.current?.lastX ?? clientX;
          const cy = t ? t.clientY : pointerStateRef.current?.lastY ?? clientY;
          finishWebDrag('touch', id, cx, cy, true);
        };

        window.addEventListener('touchmove', onWinTouchMove, { passive: false });
        window.addEventListener('touchend', onWinTouchEnd, { passive: false });
        window.addEventListener('touchcancel', onWinTouchCancel);

        windowCleanupRef.current = () => {
          window.removeEventListener('touchmove', onWinTouchMove);
          window.removeEventListener('touchend', onWinTouchEnd);
          window.removeEventListener('touchcancel', onWinTouchCancel);
        };
      } else {
        const onWinPointerMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          updateDragPosition(ev.clientX, ev.clientY);
        };

        const onWinPointerUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          finishWebDrag('pointer', id, ev.clientX, ev.clientY, false);
        };

        const onWinPointerCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          finishWebDrag('pointer', id, ev.clientX, ev.clientY, true);
        };

        window.addEventListener('pointermove', onWinPointerMove, { passive: false });
        window.addEventListener('pointerup', onWinPointerUp);
        window.addEventListener('pointercancel', onWinPointerCancel);

        windowCleanupRef.current = () => {
          window.removeEventListener('pointermove', onWinPointerMove);
          window.removeEventListener('pointerup', onWinPointerUp);
          window.removeEventListener('pointercancel', onWinPointerCancel);
        };
      }
    },
    [cleanupWindowListeners, finishWebDrag, pan, scale, tilt]
  );

  // Attach direct non-passive DOM touchstart listener so iPhone/iPad Safari NEVER
  // steals the touch for page scrolling, rubber-banding, or long-press callouts.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const raw = containerRef.current as unknown as {
      addEventListener?: HTMLElement['addEventListener'];
      removeEventListener?: HTMLElement['removeEventListener'];
      getBoundingClientRect?: () => DOMRect;
      getNode?: () => HTMLElement;
    } | null;
    const domEl =
      raw && typeof raw.addEventListener === 'function'
        ? raw
        : raw && typeof raw.getNode === 'function'
        ? raw.getNode()
        : null;
    if (!domEl || typeof domEl.addEventListener !== 'function') return;

    const onDomTouchStart = (ev: TouchEvent) => {
      if (callbacksRef.current.disabled) return;
      const active = pointerStateRef.current;
      if (active?.active) {
        if (active.mode === 'touch') {
          let stillDown = false;
          for (let i = 0; i < ev.touches.length; i++) {
            if (ev.touches[i].identifier === active.id) {
              stillDown = true;
              break;
            }
          }
          if (stillDown) return;
          // Stale touch vanished without touchend — clean up and allow new drag!
          pointerStateRef.current = null;
          cleanupWindowListeners();
        } else {
          return;
        }
      }
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      ev.stopPropagation();
      const rect = domEl.getBoundingClientRect?.();
      beginWebDrag('touch', t.identifier, t.clientX, t.clientY, rect);
    };

    domEl.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      domEl.removeEventListener?.('touchstart', onDomTouchStart);
    };
  }, [beginWebDrag]);

  const handlePointerDown = useCallback(
    (e: WebPointerEvent & { pointerType?: string }) => {
      if (callbacksRef.current.disabled) return;
      // Touch input is handled directly by our non-passive DOM touchstart listener above
      if (e.pointerType === 'touch') return;
      if (Date.now() - lastTouchEndRef.current < 500) return;
      if (pointerStateRef.current?.active) return;

      e.preventDefault?.();
      e.stopPropagation?.();
      const rect = e.currentTarget?.getBoundingClientRect?.();
      beginWebDrag('pointer', e.pointerId, e.clientX, e.clientY, rect);
    },
    [beginWebDrag]
  );

  /* ---------------- NATIVE PANRESPONDER (iOS / Android Native) ---------------- */
  const nativeStartRectRef = useRef<WindowRect | null>(null);
  const nativeLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panResponder = useMemo(() => {
    if (Platform.OS === 'web') return null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !callbacksRef.current.disabled,
      onMoveShouldSetPanResponder: () => !callbacksRef.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        soundEngine.unlock();
        soundEngine.playPop();
        setDragging(true);
        callbacksRef.current.onDragStateChange?.(true);
        nativeLastPosRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
        measureNodeRect(containerRef.current).then((rect) => {
          nativeStartRectRef.current = rect;
        });
        if (callbacksRef.current.dragScale !== 1) {
          Animated.spring(scale, {
            toValue: callbacksRef.current.dragScale,
            friction: 5.5,
            tension: 210,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderMove: (evt, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
        if (callbacksRef.current.dragScale !== 1) {
          const clampedTilt = Math.max(-8, Math.min(8, gesture.vx * 9));
          tilt.setValue(clampedTilt);
        }
        const fx = evt.nativeEvent.pageX || gesture.moveX;
        const fy = evt.nativeEvent.pageY || gesture.moveY;
        nativeLastPosRef.current = { x: fx, y: fy };

        const startRect = nativeStartRectRef.current;
        const pieceCenterX = startRect
          ? startRect.x + startRect.width / 2 + gesture.dx
          : fx;
        const pieceCenterY = startRect
          ? startRect.y + startRect.height / 2 + gesture.dy
          : fy;

        callbacksRef.current.onDragMove?.({
          fingerX: fx,
          fingerY: fy,
          pieceCenterX,
          pieceCenterY,
        });
      },
      onPanResponderRelease: async (evt, gesture) => {
        setDragging(false);
        callbacksRef.current.onDragStateChange?.(false);
        const movedDist = Math.hypot(gesture.dx, gesture.dy);
        if (movedDist < 12) {
          springBack();
          callbacksRef.current.onTap?.();
          return;
        }

        const fx =
          evt.nativeEvent.pageX ||
          gesture.moveX ||
          nativeLastPosRef.current.x;
        const fy =
          evt.nativeEvent.pageY ||
          gesture.moveY ||
          nativeLastPosRef.current.y;
        const startRect = nativeStartRectRef.current;
        const pieceCenterX = startRect
          ? startRect.x + startRect.width / 2 + gesture.dx
          : fx;
        const pieceCenterY = startRect
          ? startRect.y + startRect.height / 2 + gesture.dy
          : fy;

        const matched = await callbacksRef.current.onDrop({
          fingerX: fx,
          fingerY: fy,
          pieceCenterX,
          pieceCenterY,
        });

        if (!matched) {
          soundEngine.playGentleBounce();
          callbacksRef.current.onGentleReturn?.();
          springBack();
        } else {
          pan.setValue({ x: 0, y: 0 });
          scale.setValue(1);
          tilt.setValue(0);
        }
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        callbacksRef.current.onDragStateChange?.(false);
        springBack();
      },
    });
  }, [pan, scale, tilt, springBack]);

  const webProps =
    Platform.OS === 'web'
      ? ({
          onPointerDown: handlePointerDown,
        } as Record<string, unknown>)
      : panResponder
      ? panResponder.panHandlers
      : {};

  const webDragStyle =
    Platform.OS === 'web'
      ? ({
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
          ...(dragging
            ? { filter: 'drop-shadow(0px 14px 12px rgba(74, 53, 37, 0.34))' }
            : null),
        } as unknown as ViewStyle)
      : null;

  const rotate = tilt.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <Animated.View
      ref={containerRef}
      {...webProps}
      style={[
        styles.piece,
        style,
        webDragStyle,
        selected && styles.selectedGlow,
        dragging && (Platform.OS === 'web' ? styles.draggingWeb : styles.dragging),
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale },
            { rotate },
          ],
        },
      ]}
    >
      {/* Prevent SVG/Image children from intercepting Safari/iPad touch events */}
      <View pointerEvents="none" style={styles.innerWrap}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  innerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedGlow: {
    borderRadius: 28,
    shadowColor: '#E8A530',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  draggingWeb: {
    zIndex: 9999,
    elevation: 24,
  },
  dragging: {
    zIndex: 9999,
    elevation: 24,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
  },
});
