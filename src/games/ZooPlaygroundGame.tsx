import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Path, Polygon } from 'react-native-svg';
import { STORYBOOK_ANIMALS, STORYBOOK_ASSETS } from '../assets/assetMap';
import {
  AnimatedZooAnimal,
  getAnimalWeight,
} from '../components/AnimatedZooAnimal';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import { WhitMascot } from '../components/WhitMascot';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS, getAnimalDisplayName } from '../theme';

type HabitatId = 'clearing' | 'arctic' | 'aquarium' | 'farm';
type ToyPropId =
  | 'sun'
  | 'rainbow'
  | 'ball'
  | 'watermelon'
  | 'banana'
  | 'balloon'
  | 'butterfly'
  | 'star';

interface PlacedItem {
  uid: string;
  kind: 'animal' | 'prop';
  id: string; // ExhibitAnimalKind | ToyPropId
  xPct: number; // 0..100
  yPct: number; // 0..100
  scale: number; // 0.7..1.55
  flipX: boolean;
}

interface SavedPlaygroundState {
  habitat: HabitatId;
  items: PlacedItem[];
}

const STORAGE_KEY = 'whits_world_playground_v1';

const HABITATS: {
  id: HabitatId;
  label: string;
  emoji: string;
  spoken: string;
  asset: ReturnType<typeof require>;
  bgTint: string;
}[] = [
  {
    id: 'clearing',
    label: 'Clearing',
    emoji: '🌿',
    spoken: 'Sunny Clearing!',
    asset: STORYBOOK_ASSETS.bgClearing,
    bgTint: '#8BC36A',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    emoji: '❄️',
    spoken: 'Snowy Arctic!',
    asset: STORYBOOK_ASSETS.bgArctic,
    bgTint: '#A6DCEF',
  },
  {
    id: 'aquarium',
    label: 'Reef',
    emoji: '🐠',
    spoken: 'Coral Reef!',
    asset: STORYBOOK_ASSETS.bgAquarium,
    bgTint: '#6AC4DC',
  },
  {
    id: 'farm',
    label: 'Farm',
    emoji: '🚜',
    spoken: 'Sunny Farm!',
    asset: STORYBOOK_ASSETS.bgFarm,
    bgTint: '#A8CF7A',
  },
];

const ALL_ZOO_ANIMALS: ExhibitAnimalKind[] = [
  'gorilla',
  'lion',
  'elephant',
  'monkey',
  'duck',
  'penguin',
  'giraffe',
  'zebra',
  'panda',
  'hippo',
  'tiger',
  'flamingo',
  'toucan',
  'frog',
  'whale',
  'turtle',
  'octopus',
  'clownfish',
  'polarbear',
  'seal',
  'puffin',
  'cow',
  'sheep',
  'pig',
];

// Always available from Star 0 so every child can immediately build a lively zoo!
const STARTER_ANIMALS: ExhibitAnimalKind[] = [
  'gorilla',
  'lion',
  'elephant',
  'monkey',
  'duck',
  'penguin',
];

const TOY_PROPS: { id: ToyPropId; label: string; spoken: string }[] = [
  { id: 'sun', label: 'Sunshine', spoken: 'Sunshine!' },
  { id: 'rainbow', label: 'Rainbow', spoken: 'Rainbow' },
  { id: 'ball', label: 'Ball', spoken: 'Jungle Ball!' },
  { id: 'watermelon', label: 'Watermelon', spoken: 'Watermelon' },
  { id: 'banana', label: 'Banana', spoken: 'Banana' },
  { id: 'balloon', label: 'Balloon', spoken: 'Party Balloon!' },
  { id: 'butterfly', label: 'Butterfly', spoken: 'Butterfly' },
  { id: 'star', label: 'Star', spoken: 'Gold Star!' },
];

const DEFAULT_ITEMS: PlacedItem[] = [
  { uid: 'init-whit', kind: 'animal', id: 'gorilla', xPct: 48, yPct: 62, scale: 1.15, flipX: false },
  { uid: 'init-lion', kind: 'animal', id: 'lion', xPct: 24, yPct: 68, scale: 1.0, flipX: false },
  { uid: 'init-elephant', kind: 'animal', id: 'elephant', xPct: 74, yPct: 66, scale: 1.05, flipX: true },
  { uid: 'init-sun', kind: 'prop', id: 'sun', xPct: 82, yPct: 20, scale: 1.0, flipX: false },
];

function loadSavedPlayground(): SavedPlaygroundState {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedPlaygroundState>;
        if (
          parsed &&
          parsed.habitat &&
          Array.isArray(parsed.items) &&
          parsed.items.length > 0
        ) {
          return {
            habitat: parsed.habitat,
            items: parsed.items.slice(0, 18),
          };
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return { habitat: 'clearing', items: DEFAULT_ITEMS };
}

function savePlayground(state: SavedPlaygroundState): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }
}

function getWebAssetUri(asset: unknown): string | null {
  if (!asset) return null;
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'number') {
    const resolved = Image.resolveAssetSource?.(asset);
    if (resolved?.uri) return resolved.uri;
  }
  if (typeof asset === 'object') {
    const obj = asset as { uri?: string; default?: string };
    if (typeof obj.uri === 'string') return obj.uri;
    if (typeof obj.default === 'string') return obj.default;
  }
  return null;
}

const INK = '#4A3525';

/** Crisp Flat-SVG Interactive Storybook Toy Props (Zero RadialGradient/ClipPath!) */
const PlaygroundPropSvg: React.FC<{ propId: ToyPropId; size: number }> = ({
  propId,
  size,
}) => {
  switch (propId) {
    case 'sun':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 50 + Math.cos(rad) * 32;
            const y1 = 50 + Math.sin(rad) * 32;
            const x2 = 50 + Math.cos(rad) * 44;
            const y2 = 50 + Math.sin(rad) * 44;
            return (
              <Path
                key={deg}
                d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`}
                stroke="#FFA726"
                strokeWidth="7"
                strokeLinecap="round"
              />
            );
          })}
          <Circle cx="50" cy="50" r="25" fill="#FFE047" stroke={INK} strokeWidth="3.2" />
          <Circle cx="42" cy="46" r="3" fill={INK} />
          <Circle cx="58" cy="46" r="3" fill={INK} />
          <Ellipse cx="36" cy="52" rx="4" ry="2.4" fill="#FF8AA8" opacity="0.7" />
          <Ellipse cx="64" cy="52" rx="4" ry="2.4" fill="#FF8AA8" opacity="0.7" />
          <Path
            d="M 43 55 Q 50 62 57 55"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );
    case 'rainbow':
      return (
        <Svg width={size * 1.2} height={size * 0.85} viewBox="0 0 120 85">
          <Path d="M 14 68 A 46 46 0 0 1 106 68" stroke="#E51A1A" strokeWidth="9" fill="none" strokeLinecap="round" />
          <Path d="M 22 68 A 38 38 0 0 1 98 68" stroke="#FF8C00" strokeWidth="8.5" fill="none" strokeLinecap="round" />
          <Path d="M 30 68 A 30 30 0 0 1 90 68" stroke="#FFE01B" strokeWidth="8" fill="none" strokeLinecap="round" />
          <Path d="M 38 68 A 22 22 0 0 1 82 68" stroke="#1FA838" strokeWidth="7.5" fill="none" strokeLinecap="round" />
          <Path d="M 45 68 A 15 15 0 0 1 75 68" stroke="#1578E8" strokeWidth="7" fill="none" strokeLinecap="round" />
          <Circle cx="18" cy="68" r="11" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
          <Circle cx="29" cy="70" r="9" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
          <Circle cx="102" cy="68" r="11" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
          <Circle cx="91" cy="70" r="9" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        </Svg>
      );
    case 'ball':
      return (
        <Image
          source={STORYBOOK_ASSETS.jungleBall}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      );
    case 'watermelon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M 12 46 Q 50 94 88 46 Z"
            fill="#2E9E44"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <Path
            d="M 18 46 Q 50 85 82 46 Z"
            fill="#E8F9D4"
          />
          <Path
            d="M 22 46 Q 50 80 78 46 Z"
            fill="#F24B5B"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <Ellipse cx="40" cy="56" rx="2.6" ry="4" fill={INK} />
          <Ellipse cx="50" cy="62" rx="2.6" ry="4" fill={INK} />
          <Ellipse cx="60" cy="56" rx="2.6" ry="4" fill={INK} />
        </Svg>
      );
    case 'banana':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M 24 68 C 46 78 76 62 78 24 C 70 24 64 26 62 32 C 56 54 38 60 22 56 Z"
            fill="#FFE03B"
            stroke={INK}
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <Path
            d="M 73 20 L 81 24 L 77 30 L 69 26 Z"
            fill="#7A4C24"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <Path
            d="M 38 62 Q 58 58 68 38"
            stroke="#FFF7B8"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );
    case 'balloon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M 50 66 Q 44 79 52 92"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <Polygon points="44,68 56,68 50,60" fill="#FF4F9A" stroke={INK} strokeWidth="2.4" />
          <Ellipse cx="50" cy="36" rx="25" ry="28" fill="#FF5FA2" stroke={INK} strokeWidth="3.2" />
          <Ellipse cx="40" cy="26" rx="6" ry="11" fill="#FFFFFF" opacity="0.45" transform="rotate(-18 40 26)" />
        </Svg>
      );
    case 'butterfly':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Ellipse cx="31" cy="40" rx="20" ry="16" fill="#FF92C2" stroke={INK} strokeWidth="3" transform="rotate(-18 31 40)" />
          <Ellipse cx="69" cy="40" rx="20" ry="16" fill="#FF92C2" stroke={INK} strokeWidth="3" transform="rotate(18 69 40)" />
          <Ellipse cx="34" cy="61" rx="15" ry="12" fill="#FFE066" stroke={INK} strokeWidth="3" transform="rotate(18 34 61)" />
          <Ellipse cx="66" cy="61" rx="15" ry="12" fill="#FFE066" stroke={INK} strokeWidth="3" transform="rotate(-18 66 61)" />
          <Ellipse cx="50" cy="52" rx="6" ry="19" fill="#5A3D2B" stroke={INK} strokeWidth="2.4" />
          <Path d="M 48 34 Q 40 20 35 22 M 52 34 Q 60 20 65 22" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </Svg>
      );
    case 'star':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M 50 10 L 61 36 L 89 39 L 67 58 L 74 86 L 50 71 L 26 86 L 33 58 L 11 39 L 39 36 Z"
            fill="#FFD94A"
            stroke="#9C6200"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          <Circle cx="43" cy="49" r="3" fill={INK} />
          <Circle cx="57" cy="49" r="3" fill={INK} />
          <Path d="M 44 57 Q 50 62 56 57" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </Svg>
      );
  }
};

interface DraggableStageStickerProps {
  item: PlacedItem;
  stageW: number;
  stageH: number;
  baseSize: number;
  selected: boolean;
  partyActive: boolean;
  burstTick: number | null;
  onSelectAndPlay: (item: PlacedItem) => void;
  onMoveCommit: (uid: string, xPct: number, yPct: number) => void;
}

const DraggableStageSticker: React.FC<DraggableStageStickerProps> = ({
  item,
  stageW,
  stageH,
  baseSize,
  selected,
  partyActive,
  burstTick,
  onSelectAndPlay,
  onMoveCommit,
}) => {
  const nodeRef = useRef<React.ComponentRef<typeof View> | null>(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);

  const itemRef = useRef(item);
  itemRef.current = item;
  const stageRef = useRef({ w: stageW, h: stageH });
  stageRef.current = { w: stageW, h: stageH };
  const onSelectRef = useRef(onSelectAndPlay);
  onSelectRef.current = onSelectAndPlay;
  const onMoveRef = useRef(onMoveCommit);
  onMoveRef.current = onMoveCommit;
  const lastTouchEndRef = useRef(0);

  // Party Time synchronized bouncing dance for ALL placed stickers!
  useEffect(() => {
    if (!partyActive) {
      bounceAnim.setValue(0);
      return;
    }
    const seedDelay = (item.uid.charCodeAt(item.uid.length - 1) % 5) * 90;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(seedDelay),
        Animated.timing(bounceAnim, {
          toValue: -18,
          duration: 210,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 210,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim, item.uid, partyActive]);

  // Single celebratory hop whenever tapped!
  useEffect(() => {
    if (!burstTick) return;
    bounceAnim.setValue(0);
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: -20,
        friction: 4.5,
        tension: 230,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim, burstTick]);

  // Direct non-passive DOM touch & pointer dragging for 0ms iPad/Android tablet smoothness!
  useEffect(() => {
    if (Platform.OS !== 'web' || !nodeRef.current || typeof window === 'undefined') {
      return;
    }
    const raw = nodeRef.current as unknown as HTMLElement & {
      getNode?: () => HTMLElement;
    };
    const domEl =
      typeof raw.addEventListener === 'function'
        ? raw
        : typeof raw.getNode === 'function'
        ? raw.getNode()
        : null;
    if (!domEl) return;

    const startGesture = (
      mode: 'touch' | 'pointer',
      id: number,
      startX: number,
      startY: number
    ) => {
      soundEngine.unlock();
      setDragging(true);
      let curDx = 0;
      let curDy = 0;
      let maxDist = 0;

      const finish = () => {
        setDragging(false);
        dragX.setValue(0);
        dragY.setValue(0);
        if (mode === 'touch') {
          lastTouchEndRef.current = Date.now();
        }

        const st = stageRef.current;
        const cur = itemRef.current;
        if (maxDist < 10) {
          onSelectRef.current(cur);
        } else if (st.w > 40 && st.h > 40) {
          const nextXPct = Math.max(
            6,
            Math.min(94, cur.xPct + (curDx / st.w) * 100)
          );
          const nextYPct = Math.max(
            12,
            Math.min(88, cur.yPct + (curDy / st.h) * 100)
          );
          onMoveRef.current(cur.uid, nextXPct, nextYPct);
        }
      };

      if (mode === 'touch') {
        const findT = (list: TouchList) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].identifier === id) return list[i];
          }
          return null;
        };
        const onMove = (ev: TouchEvent) => {
          const t = findT(ev.touches) || findT(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          curDx = t.clientX - startX;
          curDy = t.clientY - startY;
          maxDist = Math.max(maxDist, Math.hypot(curDx, curDy));
          dragX.setValue(curDx);
          dragY.setValue(curDy);
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findT(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onEnd);
          window.removeEventListener('touchcancel', onEnd);
          finish();
        };
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd, { passive: false });
        window.addEventListener('touchcancel', onEnd);
      } else {
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          curDx = ev.clientX - startX;
          curDy = ev.clientY - startY;
          maxDist = Math.max(maxDist, Math.hypot(curDx, curDy));
          dragX.setValue(curDx);
          dragY.setValue(curDy);
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
          finish();
        };
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
    };

    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      ev.stopPropagation();
      startGesture('touch', t.identifier, t.clientX, t.clientY);
    };
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - lastTouchEndRef.current < 500) return;
      ev.preventDefault();
      ev.stopPropagation();
      startGesture('pointer', ev.pointerId, ev.clientX, ev.clientY);
    };

    domEl.addEventListener('touchstart', onTouchStart, { passive: false });
    domEl.addEventListener('pointerdown', onPointerDown);
    return () => {
      domEl.removeEventListener('touchstart', onTouchStart);
      domEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, [dragX, dragY]);

  const drawSize = Math.round(baseSize * item.scale);
  const left = (item.xPct / 100) * stageW - drawSize / 2;
  const top = (item.yPct / 100) * stageH - drawSize / 2;
  const isWhit = item.kind === 'animal' && item.id === 'gorilla';
  const label =
    item.kind === 'animal'
      ? item.id === 'gorilla'
        ? 'Whit the Gorilla'
        : getAnimalDisplayName(item.id)
      : TOY_PROPS.find((p) => p.id === item.id)?.label || item.id;

  return (
    <Animated.View
      ref={nodeRef}
      accessibilityRole="button"
      accessibilityLabel={`Playground ${label}`}
      style={[
        styles.placedItem,
        {
          left,
          top,
          width: drawSize,
          height: drawSize,
          zIndex: dragging ? 95 : selected ? 60 : Math.round(item.yPct),
          transform: [
            { translateX: dragX },
            { translateY: dragY },
            { translateY: bounceAnim },
            { scale: dragging ? 1.09 : 1 },
          ],
        },
        Platform.OS === 'web'
          ? ({
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
            } as unknown as object)
          : null,
      ]}
    >
      {selected && (
        <View
          pointerEvents="none"
          style={[
            styles.selectionRing,
            {
              width: drawSize + 12,
              height: drawSize + 12,
              borderRadius: (drawSize + 12) / 2,
            },
          ]}
        />
      )}

      <View
        pointerEvents="none"
        style={{
          transform: [{ scaleX: item.flipX ? -1 : 1 }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isWhit ? (
          <WhitMascot
            mood={partyActive ? 'cheer' : 'idle'}
            size={drawSize}
            interactive={false}
            showShadow
          />
        ) : item.kind === 'animal' ? (
          <AnimatedZooAnimal
            state={partyActive || burstTick ? 'celebrate' : 'idle'}
            size={drawSize}
            seed={item.uid.charCodeAt(item.uid.length - 1)}
            weight={getAnimalWeight(item.id as ExhibitAnimalKind)}
          >
            <ZooExhibitAnimalSvg
              animal={item.id as ExhibitAnimalKind}
              size={drawSize}
              highlighted={selected || partyActive}
            />
          </AnimatedZooAnimal>
        ) : (
          <PlaygroundPropSvg propId={item.id as ToyPropId} size={drawSize * 0.84} />
        )}
      </View>

      {burstTick && (
        <View style={styles.stickerBurst} pointerEvents="none">
          <SnapBurst key={burstTick} size={Math.round(drawSize * 1.15)} />
        </View>
      )}
    </Animated.View>
  );
};

/**
 * My Zoo Playground — Open-Ended 4-Habitat Interactive Sticker Sandbox:
 * - Drag & tap Whit + all collected Zoo Stickers + 8 interactive storybook props
 *   across Sunny Clearing, Snowy Arctic, Coral Reef, and Sunny Farm!
 * - Auto-saves layout locally, includes a joyous "🎉 Dance Party!" button that makes
 *   every placed animal dance & sparkle together, plus "📸 Save" framed Zoo Photo export!
 */
export const ZooPlaygroundGame: React.FC = () => {
  const { addStar, collectedStickers } = useApp();
  const { isTablet, width, height } = useResponsive();

  const initial = useMemo(() => loadSavedPlayground(), []);
  const [habitat, setHabitat] = useState<HabitatId>(initial.habitat);
  const [items, setItems] = useState<PlacedItem[]>(initial.items);
  const [trayTab, setTrayTab] = useState<'animals' | 'props'>('animals');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [partyActive, setPartyActive] = useState(false);
  const [partyStarAwarded, setPartyStarAwarded] = useState(false);
  const [burstMap, setBurstMap] = useState<Record<string, number>>({});
  const [savedToast, setSavedToast] = useState(false);

  const [stageSize, setStageSize] = useState({
    w: Math.max(320, width),
    h: Math.max(280, height - 240),
  });

  const partyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Persist custom playground whenever habitat or placed items change
  useEffect(() => {
    savePlayground({ habitat, items });
  }, [habitat, items]);

  const unlockedSet = useMemo(() => {
    const s = new Set<string>(STARTER_ANIMALS);
    collectedStickers.forEach((a) => s.add(a));
    return s;
  }, [collectedStickers]);

  const activeHabitat =
    HABITATS.find((h) => h.id === habitat) || HABITATS[0];
  const selectedItem = items.find((i) => i.uid === selectedUid) || null;
  const baseStickerSize = isTablet ? 116 : 86;

  const triggerBurst = useCallback((uid: string) => {
    setBurstMap((prev) => ({ ...prev, [uid]: Date.now() }));
  }, []);

  const playStickerReaction = useCallback(
    (item: PlacedItem) => {
      setSelectedUid(item.uid);
      triggerBurst(item.uid);

      if (item.kind === 'animal') {
        const animal = item.id as ExhibitAnimalKind;
        if (animal === 'gorilla') {
          soundEngine.playGorillaGiggle();
          soundEngine.speakWord('Whit');
        } else {
          soundEngine.playAnimalSound(animal);
          soundEngine.speakWord(getAnimalDisplayName(animal));
        }
      } else {
        const prop = TOY_PROPS.find((p) => p.id === item.id);
        if (item.id === 'ball') soundEngine.playBoing();
        else if (item.id === 'watermelon' || item.id === 'banana') soundEngine.playMunch();
        else if (item.id === 'balloon') soundEngine.playPop();
        else soundEngine.playStarCollect(3);
        if (prop) soundEngine.speakWord(prop.spoken);
      }
    },
    [triggerBurst]
  );

  const handleMoveCommit = useCallback(
    (uid: string, xPct: number, yPct: number) => {
      soundEngine.playPop();
      setSelectedUid(uid);
      setItems((prev) =>
        prev.map((it) => (it.uid === uid ? { ...it, xPct, yPct } : it))
      );
    },
    []
  );

  const addStickerToStage = (kind: 'animal' | 'prop', id: string) => {
    soundEngine.unlock();
    const uid = `${kind}-${id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const xPct = 20 + Math.round(Math.random() * 60);
    const yPct = kind === 'prop' && (id === 'sun' || id === 'rainbow' || id === 'balloon')
      ? 22 + Math.round(Math.random() * 18)
      : 48 + Math.round(Math.random() * 28);
    const nextItem: PlacedItem = {
      uid,
      kind,
      id,
      xPct,
      yPct,
      scale: id === 'gorilla' ? 1.15 : 1.0,
      flipX: false,
    };

    setItems((prev) => [...prev.slice(-17), nextItem]);
    playStickerReaction(nextItem);
  };

  const handleDanceParty = () => {
    soundEngine.unlock();
    soundEngine.playWin();
    soundEngine.speakWord('Dance party!');
    setPartyActive(true);
    setSelectedUid(null);
    const now = Date.now();
    const allBursts: Record<string, number> = {};
    items.forEach((it, idx) => {
      allBursts[it.uid] = now + idx;
    });
    setBurstMap(allBursts);

    if (!partyStarAwarded && items.length >= 3) {
      setPartyStarAwarded(true);
      addStar(1);
    }

    if (partyTimerRef.current) clearTimeout(partyTimerRef.current);
    partyTimerRef.current = setTimeout(() => {
      setPartyActive(false);
    }, 4200);
  };

  const handleSavePhoto = useCallback(async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    soundEngine.unlock();
    soundEngine.playSnap();

    try {
      const W = 1024;
      const H = 768;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Wooden storybook frame border
      ctx.fillStyle = '#E3B97E';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#7A4F28';
      ctx.lineWidth = 18;
      ctx.strokeRect(9, 9, W - 18, H - 18);

      const pad = 28;
      const footerH = 74;
      const sceneX = pad;
      const sceneY = pad;
      const sceneW = W - pad * 2;
      const sceneH = H - pad - footerH;

      const loadImage = (uri: string): Promise<HTMLImageElement | null> =>
        new Promise((resolve) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = uri;
        });

      ctx.save();
      ctx.beginPath();
      ctx.rect(sceneX, sceneY, sceneW, sceneH);
      ctx.clip();

      // 1. Habitat backdrop
      const bgUri = getWebAssetUri(activeHabitat.asset);
      const bgImg = bgUri ? await loadImage(bgUri) : null;
      if (bgImg) {
        const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
        const boxRatio = sceneW / sceneH;
        let dw = sceneW;
        let dh = sceneH;
        let ox = sceneX;
        let oy = sceneY;
        if (boxRatio > imgRatio) {
          dh = sceneW / imgRatio;
          oy = sceneY + (sceneH - dh) * 0.5;
        } else {
          dw = sceneH * imgRatio;
          ox = sceneX + (sceneW - dw) * 0.5;
        }
        ctx.drawImage(bgImg, ox, oy, dw, dh);
      } else {
        ctx.fillStyle = activeHabitat.bgTint;
        ctx.fillRect(sceneX, sceneY, sceneW, sceneH);
      }

      // 2. Placed animals & props sorted back-to-front by yPct
      const sorted = [...items].sort((a, b) => a.yPct - b.yPct);
      for (const it of sorted) {
        const cx = sceneX + (it.xPct / 100) * sceneW;
        const cy = sceneY + (it.yPct / 100) * sceneH;
        const sz = 132 * it.scale;

        ctx.save();
        ctx.translate(cx, cy);
        if (it.flipX) ctx.scale(-1, 1);

        if (it.kind === 'animal') {
          const asset =
            it.id === 'gorilla'
              ? STORYBOOK_ASSETS.whitCheer
              : STORYBOOK_ANIMALS[it.id];
          const uri = getWebAssetUri(asset);
          const aImg = uri ? await loadImage(uri) : null;
          if (aImg) {
            ctx.drawImage(aImg, -sz / 2, -sz / 2, sz, sz);
          }
        } else if (it.id === 'ball') {
          const uri = getWebAssetUri(STORYBOOK_ASSETS.jungleBall);
          const bImg = uri ? await loadImage(uri) : null;
          if (bImg) ctx.drawImage(bImg, -sz * 0.42, -sz * 0.42, sz * 0.84, sz * 0.84);
        } else {
          const emojiMap: Record<string, string> = {
            sun: '☀️',
            rainbow: '🌈',
            watermelon: '🍉',
            banana: '🍌',
            balloon: '🎈',
            butterfly: '🦋',
            star: '⭐',
          };
          ctx.font = `${Math.round(sz * 0.65)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emojiMap[it.id] || '⭐', 0, 0);
        }
        ctx.restore();
      }
      ctx.restore();

      ctx.strokeStyle = '#C99B5E';
      ctx.lineWidth = 4;
      ctx.strokeRect(sceneX, sceneY, sceneW, sceneH);

      // Postcard Footer Caption
      ctx.fillStyle = '#4A3525';
      ctx.font = '900 30px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`My Zoo Playground · ${activeHabitat.label}`, pad + 8, H - footerH / 2 + 2);

      ctx.fillStyle = '#8C5B32';
      ctx.font = '800 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText("★ Made in Whit's World", W - pad - 8, H - footerH / 2 + 2);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) return;

      const fileName = `whits-world-zoo-${activeHabitat.id}.png`;
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data?: ShareData) => Promise<void>;
      };
      let shared = false;
      if (typeof File !== 'undefined' && nav.share && nav.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (nav.canShare({ files: [file] })) {
            await nav.share({
              title: "My Zoo Playground — Whit's World",
              files: [file],
            });
            shared = true;
          }
        } catch {
          // User canceled share or unsupported; fall back cleanly to PNG download
        }
      }

      if (!shared) {
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);
      }

      soundEngine.playStarCollect(5);
      soundEngine.speakWord('Zoo photo saved!');
      setSavedToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setSavedToast(false), 2600);
    } catch {
      // Ignore export errors gracefully
    }
  }, [activeHabitat, items]);

  return (
    <View style={styles.container}>
      <GameHeader
        totalSteps={0}
        completedSteps={0}
        centerTitle="🌿 My Zoo Playground"
      />

      {/* Top Habitat Switcher + Party Time + Save Photo */}
      <View style={[styles.topControls, isTablet && styles.topControlsTablet]}>
        <View style={styles.habitatRow}>
          {HABITATS.map((h) => {
            const active = h.id === habitat;
            return (
              <TactileButton
                key={h.id}
                onPress={() => {
                  soundEngine.unlock();
                  soundEngine.playPop();
                  soundEngine.speakWord(h.spoken);
                  setHabitat(h.id);
                }}
                accessibilityLabel={`Switch habitat to ${h.label}`}
              >
                <View
                  style={[
                    styles.habPill,
                    isTablet && styles.habPillTablet,
                    active && styles.habPillActive,
                  ]}
                >
                  <Text style={{ fontSize: isTablet ? 16 : 14 }}>{h.emoji}</Text>
                  <Text
                    style={[
                      styles.habPillText,
                      isTablet && { fontSize: 14 },
                      active && styles.habPillTextActive,
                    ]}
                  >
                    {h.label}
                  </Text>
                </View>
              </TactileButton>
            );
          })}
        </View>

        <View style={styles.actionButtons}>
          <TactileButton
            onPress={handleDanceParty}
            accessibilityLabel="Start Zoo Dance Party"
          >
            <View
              style={[
                styles.partyBtn,
                partyActive && styles.partyBtnActive,
              ]}
            >
              <Text style={[styles.partyBtnText, isTablet && { fontSize: 15 }]}>
                🎉 {partyActive ? 'Dancing!' : 'Dance Party!'}
              </Text>
            </View>
          </TactileButton>

          <TactileButton
            onPress={handleSavePhoto}
            accessibilityLabel="Save Zoo Playground Photo"
          >
            <View style={styles.saveBtn}>
              <Text style={[styles.saveBtnText, isTablet && { fontSize: 14 }]}>
                📸 Save
              </Text>
            </View>
          </TactileButton>
        </View>
      </View>

      {/* Living Interactive Zoo Sandbox Stage */}
      <View style={styles.stageOuterWrap}>
        <View
          style={styles.stageFrame}
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            if (w > 120 && h > 120) {
              setStageSize((prev) =>
                Math.abs(prev.w - w) < 2 && Math.abs(prev.h - h) < 2
                  ? prev
                  : { w, h }
              );
            }
          }}
        >
          <Image
            source={activeHabitat.asset}
            style={styles.stageBgImg}
            resizeMode="cover"
          />

          {/* Tap empty backdrop to deselect active sticker */}
          <View
            style={styles.stageTouchCatcher}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => setSelectedUid(null)}
          />

          {items.map((item) => (
            <DraggableStageSticker
              key={item.uid}
              item={item}
              stageW={stageSize.w}
              stageH={stageSize.h}
              baseSize={baseStickerSize}
              selected={item.uid === selectedUid}
              partyActive={partyActive}
              burstTick={burstMap[item.uid] ?? null}
              onSelectAndPlay={playStickerReaction}
              onMoveCommit={handleMoveCommit}
            />
          ))}

          {/* Floating Edit Toolbar for the Currently Selected Sticker */}
          {selectedItem && (
            <View style={styles.editDock}>
              <Text style={styles.editDockLabel}>
                {selectedItem.kind === 'animal'
                  ? selectedItem.id === 'gorilla'
                    ? 'Whit'
                    : getAnimalDisplayName(selectedItem.id)
                  : TOY_PROPS.find((p) => p.id === selectedItem.id)?.label}
              </Text>
              <TactileButton
                onPress={() => {
                  soundEngine.playPop();
                  setItems((prev) =>
                    prev.map((it) =>
                      it.uid === selectedItem.uid
                        ? { ...it, flipX: !it.flipX }
                        : it
                    )
                  );
                }}
                accessibilityLabel="Flip selected sticker"
              >
                <View style={styles.editChip}>
                  <Text style={styles.editChipText}>↔️</Text>
                </View>
              </TactileButton>
              <TactileButton
                onPress={() => {
                  soundEngine.playPop();
                  setItems((prev) =>
                    prev.map((it) =>
                      it.uid === selectedItem.uid
                        ? { ...it, scale: Math.max(0.7, Number((it.scale - 0.2).toFixed(2))) }
                        : it
                    )
                  );
                }}
                accessibilityLabel="Make sticker smaller"
              >
                <View style={styles.editChip}>
                  <Text style={styles.editChipText}>➖</Text>
                </View>
              </TactileButton>
              <TactileButton
                onPress={() => {
                  soundEngine.playPop();
                  setItems((prev) =>
                    prev.map((it) =>
                      it.uid === selectedItem.uid
                        ? { ...it, scale: Math.min(1.55, Number((it.scale + 0.2).toFixed(2))) }
                        : it
                    )
                  );
                }}
                accessibilityLabel="Make sticker bigger"
              >
                <View style={styles.editChip}>
                  <Text style={styles.editChipText}>➕</Text>
                </View>
              </TactileButton>
              <TactileButton
                onPress={() => {
                  soundEngine.playCardFlip();
                  setItems((prev) =>
                    prev.filter((it) => it.uid !== selectedItem.uid)
                  );
                  setSelectedUid(null);
                }}
                accessibilityLabel="Remove selected sticker"
              >
                <View style={[styles.editChip, styles.editChipDanger]}>
                  <Text style={styles.editChipText}>🗑️</Text>
                </View>
              </TactileButton>
            </View>
          )}

          {savedToast && (
            <View style={styles.savedToast} pointerEvents="none">
              <Text style={styles.savedToastText}>📸 Zoo Photo Saved!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Wooden Toybox Drawer (My Zoo Friends + Fun Props) */}
      <View style={[styles.trayOuter, isTablet && styles.trayOuterTablet]}>
        <View style={styles.trayTabs}>
          <TactileButton
            onPress={() => {
              soundEngine.playPop();
              setTrayTab('animals');
            }}
            accessibilityLabel="Zoo Friends tray tab"
          >
            <View
              style={[
                styles.trayTabBtn,
                trayTab === 'animals' && styles.trayTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.trayTabText,
                  trayTab === 'animals' && styles.trayTabTextActive,
                ]}
              >
                🦁 Friends ({unlockedSet.size}/{ALL_ZOO_ANIMALS.length})
              </Text>
            </View>
          </TactileButton>

          <TactileButton
            onPress={() => {
              soundEngine.playPop();
              setTrayTab('props');
            }}
            accessibilityLabel="Fun Toys tray tab"
          >
            <View
              style={[
                styles.trayTabBtn,
                trayTab === 'props' && styles.trayTabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.trayTabText,
                  trayTab === 'props' && styles.trayTabTextActive,
                ]}
              >
                🌈 Toys ({TOY_PROPS.length})
              </Text>
            </View>
          </TactileButton>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trayScroll}
        >
          {trayTab === 'animals'
            ? ALL_ZOO_ANIMALS.map((animal) => {
                const unlocked = unlockedSet.has(animal);
                const label =
                  animal === 'gorilla' ? 'Whit' : getAnimalDisplayName(animal);
                return (
                  <TactileButton
                    key={animal}
                    onPress={() => {
                      if (!unlocked) {
                        soundEngine.playGentleBounce();
                        return;
                      }
                      addStickerToStage('animal', animal);
                    }}
                    accessibilityLabel={
                      unlocked
                        ? `Add ${label} to playground`
                        : `${label} locked — play games to meet`
                    }
                  >
                    <View
                      style={[
                        styles.trayCard,
                        isTablet && styles.trayCardTablet,
                        !unlocked && styles.trayCardLocked,
                      ]}
                    >
                      <View style={{ opacity: unlocked ? 1 : 0.34 }}>
                        <ZooExhibitAnimalSvg
                          animal={animal}
                          size={isTablet ? 52 : 42}
                        />
                      </View>
                      <Text style={styles.trayCardName} numberOfLines={1}>
                        {unlocked ? label : '🔒'}
                      </Text>
                    </View>
                  </TactileButton>
                );
              })
            : TOY_PROPS.map((prop) => (
                <TactileButton
                  key={prop.id}
                  onPress={() => addStickerToStage('prop', prop.id)}
                  accessibilityLabel={`Add ${prop.label} to playground`}
                >
                  <View
                    style={[
                      styles.trayCard,
                      isTablet && styles.trayCardTablet,
                    ]}
                  >
                    <PlaygroundPropSvg
                      propId={prop.id}
                      size={isTablet ? 46 : 38}
                    />
                    <Text style={styles.trayCardName} numberOfLines={1}>
                      {prop.label}
                    </Text>
                  </View>
                </TactileButton>
              ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  topControls: {
    width: '100%',
    maxWidth: 1080,
    paddingHorizontal: 14,
    marginBottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topControlsTablet: {
    paddingHorizontal: 26,
    marginBottom: 8,
  },
  habitatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  habPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    borderRadius: 16,
    borderWidth: 2.2,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  habPillTablet: {
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  habPillActive: {
    backgroundColor: '#56A962',
    borderColor: '#25592C',
  },
  habPillText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  habPillTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyBtn: {
    backgroundColor: '#FFE066',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#9C6200',
    borderBottomWidth: 5,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  partyBtnActive: {
    backgroundColor: '#FF7BA9',
    borderColor: '#9C2654',
  },
  partyBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  saveBtn: {
    backgroundColor: '#EAF8EE',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#2E7D3F',
    borderBottomWidth: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1E5E2B',
  },
  stageOuterWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 1080,
    paddingHorizontal: 14,
  },
  stageFrame: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: COLORS.woodDark,
    borderBottomWidth: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#A7D88A',
    shadowColor: '#2B1B0E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  stageBgImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  stageTouchCatcher: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  placedItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  selectionRing: {
    position: 'absolute',
    borderWidth: 3.5,
    borderStyle: 'dashed',
    borderColor: '#FFE052',
    backgroundColor: 'rgba(255, 248, 210, 0.24)',
  },
  stickerBurst: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  editDock: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 250, 238, 0.96)',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: COLORS.woodDark,
    paddingHorizontal: 14,
    paddingVertical: 6,
    zIndex: 120,
    shadowColor: '#2B1B0E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  editDockLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.woodDark,
    marginRight: 2,
  },
  editChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F7E7C4',
    borderWidth: 2,
    borderColor: COLORS.woodBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editChipDanger: {
    backgroundColor: '#FFE3E1',
    borderColor: '#B83932',
  },
  editChipText: {
    fontSize: 15,
  },
  savedToast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: '#EAF8EE',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: '#2E7D3F',
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 130,
  },
  savedToastText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E5E2B',
  },
  trayOuter: {
    width: '100%',
    maxWidth: 1080,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  trayOuterTablet: {
    paddingHorizontal: 26,
    paddingTop: 10,
    paddingBottom: 10,
  },
  trayTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trayTabBtn: {
    backgroundColor: 'rgba(255, 249, 236, 0.88)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.woodBorder,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  trayTabBtnActive: {
    backgroundColor: '#E3B97E',
    borderColor: COLORS.woodDark,
  },
  trayTabText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: COLORS.inkMuted,
  },
  trayTabTextActive: {
    color: COLORS.woodDark,
  },
  trayScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  trayCard: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    borderWidth: 2.5,
    borderColor: COLORS.woodBorder,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  trayCardTablet: {
    width: 78,
    height: 78,
    borderRadius: 20,
  },
  trayCardLocked: {
    backgroundColor: '#EFE6D5',
    borderColor: '#C5B59B',
  },
  trayCardName: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.woodDark,
    marginTop: 1,
  },
});
