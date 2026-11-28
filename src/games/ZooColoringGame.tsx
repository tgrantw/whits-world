import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS, STORYBOOK_COLORING_PAGES } from '../assets/assetMap';
import { GameHeader } from '../components/GameHeader';
import { SnapBurst } from '../components/SnapBurst';
import { TactileButton } from '../components/TactileButton';
import {
  ExhibitAnimalKind,
  ZooExhibitAnimalSvg,
} from '../components/ZooExhibitAnimals';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { soundEngine } from '../services/sound';
import { COLORS } from '../theme';

const INK = '#4A3525';
const PAPER_WHITE = '#FFFDF7';
const MASK_SIZE = 640;
const MASTERPIECE_GOAL = 8;
const SAVED_PAGES_KEY = 'whits_world_colored_pages_v3';
const SAVED_ARTWORK_KEY = 'whits_world_coloring_art_v3';

type ToolMode = 'fill' | 'draw' | 'stamp';
type BrushSizeKey = 'sm' | 'md' | 'lg';
type StampKind =
  | 'star'
  | 'heart'
  | 'flower'
  | 'butterfly'
  | 'rainbow'
  | 'sun'
  | 'crown'
  | 'paw';

interface CrayonColor {
  id: string;
  name: string;
  hex: string;
  border: string;
  noteFreq: number;
  isRainbow?: boolean;
}

const CRAYONS: CrayonColor[] = [
  { id: 'red', name: 'Red', hex: '#E51A1A', border: '#A60F0F', noteFreq: 261.63 },
  { id: 'orange', name: 'Orange', hex: '#FF7A00', border: '#BA5500', noteFreq: 293.66 },
  { id: 'yellow', name: 'Yellow', hex: '#FFE01B', border: '#B89400', noteFreq: 329.63 },
  { id: 'green', name: 'Green', hex: '#1FA838', border: '#126E22', noteFreq: 349.23 },
  { id: 'blue', name: 'Blue', hex: '#1578E8', border: '#0C4F9E', noteFreq: 392.0 },
  { id: 'purple', name: 'Purple', hex: '#7E2CE0', border: '#51149C', noteFreq: 440.0 },
  { id: 'pink', name: 'Pink', hex: '#FF4FA3', border: '#B8216B', noteFreq: 493.88 },
  { id: 'brown', name: 'Brown', hex: '#7A431D', border: '#4A250C', noteFreq: 523.25 },
  { id: 'white', name: 'White', hex: '#FFFDF7', border: '#A8957E', noteFreq: 587.33 },
  {
    id: 'rainbow',
    name: 'Rainbow',
    hex: 'rainbow',
    border: '#7C4DFF',
    noteFreq: 659.25,
    isRainbow: true,
  },
];

const RAINBOW_CYCLE = [
  '#E51A1A',
  '#FF7A00',
  '#FFE01B',
  '#1FA838',
  '#1578E8',
  '#7E2CE0',
  '#FF4FA3',
];

const BRUSH_SIZES: { key: BrushSizeKey; label: string; width: number; dotPx: number }[] = [
  { key: 'sm', label: 'Small crayon', width: 16, dotPx: 12 },
  { key: 'md', label: 'Medium crayon', width: 30, dotPx: 19 },
  { key: 'lg', label: 'Big crayon', width: 48, dotPx: 26 },
];

const STAMPS: { kind: StampKind; name: string }[] = [
  { kind: 'star', name: 'Star' },
  { kind: 'heart', name: 'Heart' },
  { kind: 'flower', name: 'Flower' },
  { kind: 'butterfly', name: 'Butterfly' },
  { kind: 'rainbow', name: 'Rainbow' },
  { kind: 'sun', name: 'Sun' },
  { kind: 'crown', name: 'Crown' },
  { kind: 'paw', name: 'Paw' },
];

interface ColoringPageSpec {
  id: string;
  title: string;
  animal: ExhibitAnimalKind;
  badgeColor: string;
  backdrop: typeof STORYBOOK_ASSETS.bgClearing;
  lineArt: typeof STORYBOOK_COLORING_PAGES.lion;
  skyColor: string;
  groundColor: string;
  magicPalette: string[];
}

const COLORING_PAGES: ColoringPageSpec[] = [
  {
    id: 'lion',
    title: 'Sunny Lion',
    animal: 'lion',
    badgeColor: '#FFE08A',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    lineArt: STORYBOOK_COLORING_PAGES.lion,
    skyColor: '#B5E6FF',
    groundColor: '#5CC962',
    magicPalette: ['#FF9C2A', '#FFD84D', '#FF7A00', '#FFE899', '#FF4FA3', '#FFE01B'],
  },
  {
    id: 'elephant',
    title: 'Happy Elephant',
    animal: 'elephant',
    badgeColor: '#C5E3FA',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    lineArt: STORYBOOK_COLORING_PAGES.elephant,
    skyColor: '#C2EBFF',
    groundColor: '#5DC964',
    magicPalette: ['#8EC6E8', '#FFB3D1', '#56B8E8', '#3BB852', '#FFE066', '#9DD4F5'],
  },
  {
    id: 'whale',
    title: 'Splashy Whale',
    animal: 'whale',
    badgeColor: '#ACE3F4',
    backdrop: STORYBOOK_ASSETS.bgAquarium,
    lineArt: STORYBOOK_COLORING_PAGES.whale,
    skyColor: '#CDEEFF',
    groundColor: '#3BAEE0',
    magicPalette: ['#3A9CE8', '#8FD9FF', '#FFE047', '#FF6BA8', '#5AD198', '#A57BFF'],
  },
  {
    id: 'penguin',
    title: 'Little Penguin',
    animal: 'penguin',
    badgeColor: '#CBEBF7',
    backdrop: STORYBOOK_ASSETS.bgArctic,
    lineArt: STORYBOOK_COLORING_PAGES.penguin,
    skyColor: '#C4E7FF',
    groundColor: '#DDF4FF',
    magicPalette: ['#4A7EC2', '#FF6B4A', '#FFE047', '#E51A1A', '#1FA838', '#FF9933'],
  },
  {
    id: 'giraffe',
    title: 'Tall Giraffe',
    animal: 'giraffe',
    badgeColor: '#FDE0A6',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    lineArt: STORYBOOK_COLORING_PAGES.giraffe,
    skyColor: '#BCEAFF',
    groundColor: '#5DC964',
    magicPalette: ['#FFD94A', '#C97A34', '#FF9829', '#42BD5A', '#FFE98A', '#E88B38'],
  },
  {
    id: 'gorilla',
    title: 'Whit the Gorilla',
    animal: 'gorilla',
    badgeColor: '#C9E8B8',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    lineArt: STORYBOOK_COLORING_PAGES.gorilla,
    skyColor: '#BCEAFF',
    groundColor: '#5DC964',
    magicPalette: ['#8A6B54', '#D6B89A', '#FFE03B', '#3BB852', '#FF66A6', '#FF9633'],
  },
  {
    id: 'monkey',
    title: 'Playful Monkey',
    animal: 'monkey',
    badgeColor: '#F7D2A2',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    lineArt: STORYBOOK_COLORING_PAGES.monkey,
    skyColor: '#BCEAFF',
    groundColor: '#5DC964',
    magicPalette: ['#B8733B', '#F7D4A6', '#FFE03B', '#3BB852', '#FF5FA2', '#FF8F2B'],
  },
  {
    id: 'frog',
    title: 'Bouncy Frog',
    animal: 'frog',
    badgeColor: '#C4EBB9',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    lineArt: STORYBOOK_COLORING_PAGES.frog,
    skyColor: '#C2EBFF',
    groundColor: '#56C3E8',
    magicPalette: ['#4CC25A', '#FFF0A6', '#33A84C', '#FF72AE', '#FFE03B', '#8AD86A'],
  },
  {
    id: 'panda',
    title: 'Sweet Panda',
    animal: 'panda',
    badgeColor: '#D6EAD0',
    backdrop: STORYBOOK_ASSETS.bgSanctuary,
    lineArt: STORYBOOK_COLORING_PAGES.panda,
    skyColor: '#C2EBFF',
    groundColor: '#66CC6A',
    magicPalette: ['#4C4A54', '#FFFDF5', '#42B854', '#8CD964', '#FF77AA', '#FFE047'],
  },
  {
    id: 'turtle',
    title: 'Rainbow Turtle',
    animal: 'turtle',
    badgeColor: '#B8E8DF',
    backdrop: STORYBOOK_ASSETS.bgAquarium,
    lineArt: STORYBOOK_COLORING_PAGES.turtle,
    skyColor: '#B8ECFF',
    groundColor: '#F5D68E',
    magicPalette: ['#4CC25A', '#FF7A00', '#FFE01B', '#1578E8', '#9C5BE8', '#FF4FA3'],
  },
];

interface DrawStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

interface PlacedStamp {
  id: string;
  kind: StampKind;
  x: number; // 0..MASK_SIZE
  y: number; // 0..MASK_SIZE
  size: number;
}

interface SavedArtworkState {
  fillsByPage: Record<string, Record<string, string>>;
  strokesByPage: Record<string, DrawStroke[]>;
  stampsByPage: Record<string, PlacedStamp[]>;
}

type HistoryEntry =
  | { type: 'fill'; regionKey: string; prevColor: string | undefined }
  | { type: 'stroke'; strokeId: string }
  | { type: 'stamp'; stampId: string }
  | {
      type: 'clear';
      prevFills: Record<string, string>;
      prevStrokes: DrawStroke[];
      prevStamps: PlacedStamp[];
    };

interface RegionMeta {
  id: number;
  key: string;
  pixelCount: number;
  cx: number;
  cy: number;
  minY: number;
  maxY: number;
  isSky: boolean;
}

interface PageRegionMap {
  labels: Int16Array; // exact interior region ID per pixel (0 = ink barrier)
  fillLabels: Int16Array; // 1px dilated under-ink region ID for zero white halo!
  regions: RegionMeta[];
  img: HTMLImageElement;
}

const regionMapCache = new Map<string, PageRegionMap>();

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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [255, 253, 247];
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildRegionMapFromImage(img: HTMLImageElement): PageRegionMap {
  const w = MASK_SIZE;
  const h = MASK_SIZE;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  if (!ctx) {
    return {
      labels: new Int16Array(w * h),
      fillLabels: new Int16Array(w * h),
      regions: [],
      img,
    };
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Build crisp 1px-closed ink barrier so no fill ever leaks across anti-aliased outlines
  const rawInk = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] >= 95) {
      rawInk[i] = 1;
    }
  }
  const barrier = new Uint8Array(rawInk);
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      if (rawInk[idx]) {
        barrier[idx - 1] = 1;
        barrier[idx + 1] = 1;
        barrier[idx - w] = 1;
        barrier[idx + w] = 1;
      }
    }
  }

  const labels = new Int16Array(w * h);
  const queue = new Int32Array(w * h);
  const regions: RegionMeta[] = [];
  let nextId = 1;

  for (let start = 0; start < w * h; start++) {
    if (barrier[start] || labels[start] !== 0) continue;
    const rid = nextId++;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = rid;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    let minY = h;
    let maxY = 0;

    while (head < tail) {
      const idx = queue[head++];
      const y = (idx / w) | 0;
      const x = idx - y * w;
      count++;
      sumX += x;
      sumY += y;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (x > 0) {
        const n = idx - 1;
        if (!barrier[n] && labels[n] === 0) {
          labels[n] = rid;
          queue[tail++] = n;
        }
      }
      if (x + 1 < w) {
        const n = idx + 1;
        if (!barrier[n] && labels[n] === 0) {
          labels[n] = rid;
          queue[tail++] = n;
        }
      }
      if (y > 0) {
        const n = idx - w;
        if (!barrier[n] && labels[n] === 0) {
          labels[n] = rid;
          queue[tail++] = n;
        }
      }
      if (y + 1 < h) {
        const n = idx + w;
        if (!barrier[n] && labels[n] === 0) {
          labels[n] = rid;
          queue[tail++] = n;
        }
      }
    }

    if (count >= 160) {
      regions.push({
        id: rid,
        key: `r${rid}`,
        pixelCount: count,
        cx: sumX / count,
        cy: sumY / count,
        minY,
        maxY,
        isSky: false,
      });
    }
  }

  // Mark top-corner background region as sky
  const topLeftId = labels[4 * w + 4] || labels[4 * w + (w - 5)];
  for (const r of regions) {
    if (r.id === topLeftId || (r.minY <= 6 && r.pixelCount > 24000)) {
      r.isSky = true;
    }
  }

  // Dilate region IDs 2px underneath the thick 7px ink lines for ZERO white anti-alias fringe!
  let curFill = new Int16Array(labels);
  for (let pass = 0; pass < 2; pass++) {
    const nextFill = new Int16Array(curFill);
    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = row + x;
        if (curFill[idx] !== 0) continue;
        const n =
          curFill[idx - 1] ||
          curFill[idx + 1] ||
          curFill[idx - w] ||
          curFill[idx + w];
        if (n) nextFill[idx] = n;
      }
    }
    curFill = nextFill;
  }

  return { labels, fillLabels: curFill, regions, img };
}

function loadSavedCompletedPages(): string[] {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(SAVED_PAGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
  }
  return [];
}

function saveCompletedPages(ids: string[]): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SAVED_PAGES_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage errors
    }
  }
}

function loadSavedArtwork(): SavedArtworkState {
  const empty: SavedArtworkState = {
    fillsByPage: {},
    strokesByPage: {},
    stampsByPage: {},
  };
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(SAVED_ARTWORK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            fillsByPage: parsed.fillsByPage || {},
            strokesByPage: parsed.strokesByPage || {},
            stampsByPage: parsed.stampsByPage || {},
          };
        }
      }
    } catch {
      return empty;
    }
  }
  return empty;
}

function saveArtworkState(art: SavedArtworkState): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SAVED_ARTWORK_KEY, JSON.stringify(art));
    } catch {
      // Ignore storage quota errors
    }
  }
}

/** Cute flat-SVG storybook sticker stamps */
function renderStampGraphic(kind: StampKind): React.ReactNode {
  switch (kind) {
    case 'star':
      return (
        <G>
          <Path
            d="M 0 -20 L 5.8 -7 L 20 -5.6 L 9.2 3.8 L 12.2 18 L 0 11 L -12.2 18 L -9.2 3.8 L -20 -5.6 L -5.8 -7 Z"
            fill="#FAD44A"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Circle cx="-4.5" cy="-3" r="1.8" fill={INK} />
          <Circle cx="4.5" cy="-3" r="1.8" fill={INK} />
          <Path
            d="M -3.5 3 Q 0 6.5 3.5 3"
            fill="none"
            stroke={INK}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
      );
    case 'heart':
      return (
        <G>
          <Path
            d="M 0 16 C -16 6 -22 -4 -18 -13 C -14 -20 -4 -19 0 -11 C 4 -19 14 -20 18 -13 C 22 -4 16 6 0 16 Z"
            fill="#F06A94"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Ellipse cx="-7" cy="-9" rx="3.2" ry="2" fill="rgba(255,255,255,0.6)" />
        </G>
      );
    case 'flower':
      return (
        <G>
          <Circle cx="0" cy="-12" r="8" fill="#F082A8" stroke={INK} strokeWidth="2.4" />
          <Circle cx="11.5" cy="-3.5" r="8" fill="#F082A8" stroke={INK} strokeWidth="2.4" />
          <Circle cx="7" cy="10" r="8" fill="#F082A8" stroke={INK} strokeWidth="2.4" />
          <Circle cx="-7" cy="10" r="8" fill="#F082A8" stroke={INK} strokeWidth="2.4" />
          <Circle cx="-11.5" cy="-3.5" r="8" fill="#F082A8" stroke={INK} strokeWidth="2.4" />
          <Circle cx="0" cy="0" r="8" fill="#FAD44A" stroke={INK} strokeWidth="2.4" />
        </G>
      );
    case 'butterfly':
      return (
        <G>
          <Ellipse cx="-11" cy="-6" rx="10" ry="9" fill="#4DAAD8" stroke={INK} strokeWidth="2.4" />
          <Ellipse cx="11" cy="-6" rx="10" ry="9" fill="#4DAAD8" stroke={INK} strokeWidth="2.4" />
          <Ellipse cx="-8" cy="8" rx="7.5" ry="7" fill="#9B74D4" stroke={INK} strokeWidth="2.4" />
          <Ellipse cx="8" cy="8" rx="7.5" ry="7" fill="#9B74D4" stroke={INK} strokeWidth="2.4" />
          <Circle cx="-11" cy="-6" r="3" fill="#FAD44A" />
          <Circle cx="11" cy="-6" r="3" fill="#FAD44A" />
          <Ellipse cx="0" cy="2" rx="3.5" ry="12" fill={INK} />
          <Path
            d="M -1 -10 Q -6 -18 -10 -16 M 1 -10 Q 6 -18 10 -16"
            fill="none"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </G>
      );
    case 'rainbow':
      return (
        <G>
          <Path d="M -18 8 A 18 18 0 0 1 18 8" fill="none" stroke="#E51A1A" strokeWidth="6" strokeLinecap="round" />
          <Path d="M -13 8 A 13 13 0 0 1 13 8" fill="none" stroke="#FFE01B" strokeWidth="5.5" strokeLinecap="round" />
          <Path d="M -8 8 A 8 8 0 0 1 8 8" fill="none" stroke="#1578E8" strokeWidth="5" strokeLinecap="round" />
          <Circle cx="-16" cy="10" r="6" fill="#FFFDF7" stroke={INK} strokeWidth="2.2" />
          <Circle cx="16" cy="10" r="6" fill="#FFFDF7" stroke={INK} strokeWidth="2.2" />
        </G>
      );
    case 'sun':
      return (
        <G>
          <Path
            d="M 0 -20 L 0 -15 M 0 15 L 0 20 M -20 0 L -15 0 M 15 0 L 20 0 M -14 -14 L -10.5 -10.5 M 10.5 10.5 L 14 14 M 14 -14 L 10.5 -10.5 M -10.5 10.5 L -14 14"
            stroke="#FF7A00"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <Circle cx="0" cy="0" r="12" fill="#FFE01B" stroke={INK} strokeWidth="2.6" />
          <Circle cx="-4" cy="-2" r="1.7" fill={INK} />
          <Circle cx="4" cy="-2" r="1.7" fill={INK} />
          <Path d="M -4 3.5 Q 0 7 4 3.5" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Path
            d="M -18 12 L -19 -8 L -7 2 L 0 -14 L 7 2 L 19 -8 L 18 12 Z"
            fill="#FAD44A"
            stroke={INK}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <Circle cx="0" cy="4" r="3" fill="#E51A1A" />
          <Circle cx="-10" cy="6" r="2.2" fill="#1578E8" />
          <Circle cx="10" cy="6" r="2.2" fill="#1FA838" />
        </G>
      );
    case 'paw':
      return (
        <G>
          <Ellipse cx="0" cy="6" rx="10" ry="8.5" fill="#9C6844" stroke={INK} strokeWidth="2.4" />
          <Circle cx="-12" cy="-5" r="4.6" fill="#9C6844" stroke={INK} strokeWidth="2.2" />
          <Circle cx="-4.2" cy="-12" r="4.8" fill="#9C6844" stroke={INK} strokeWidth="2.2" />
          <Circle cx="4.2" cy="-12" r="4.8" fill="#9C6844" stroke={INK} strokeWidth="2.2" />
          <Circle cx="12" cy="-5" r="4.6" fill="#9C6844" stroke={INK} strokeWidth="2.2" />
        </G>
      );
  }
}

function drawStampOn2dCanvas(
  ctx: CanvasRenderingContext2D,
  stamp: PlacedStamp,
  scaleFactor: number,
  ox: number,
  oy: number
) {
  const emojiMap: Record<StampKind, string> = {
    star: '⭐',
    heart: '💖',
    flower: '🌸',
    butterfly: '🦋',
    rainbow: '🌈',
    sun: '☀️',
    crown: '👑',
    paw: '🐾',
  };
  ctx.save();
  ctx.translate(ox + stamp.x * scaleFactor, oy + stamp.y * scaleFactor);
  ctx.font = `${Math.round(stamp.size * scaleFactor * 0.9)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emojiMap[stamp.kind] || '⭐', 0, 2);
  ctx.restore();
}

/** Tactile storybook SVG Crayon button with pointed wax tip + paper wrapper */
const CrayonButton: React.FC<{
  crayon: CrayonColor;
  active: boolean;
  size: number;
  onPress: () => void;
}> = React.memo(({ crayon, active, size, onPress }) => {
  const w = size;
  const h = Math.round(size * 1.18);
  return (
    <TactileButton
      onPress={onPress}
      accessibilityLabel={`${crayon.name} crayon`}
      style={{ width: w }}
    >
      <View
        style={[
          styles.crayonWrap,
          { width: w, height: h },
          active && styles.crayonWrapActive,
        ]}
      >
        <Svg width={w} height={h} viewBox="0 0 44 52">
          {active && (
            <Path
              d="M 8 50 L 8 18 L 22 2 L 36 18 L 36 50 Z"
              fill="#FFF4BE"
              stroke={COLORS.woodDark}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
          )}
          <Path
            d="M 11 19 L 20 5 Q 22 3 24 5 L 33 19 Z"
            fill={crayon.isRainbow ? '#E51A1A' : crayon.hex}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {crayon.isRainbow ? (
            <G>
              <Path d="M 10 19 L 34 19 L 34 27 L 10 27 Z" fill="#FF7A00" />
              <Path d="M 10 27 L 34 27 L 34 35 L 10 35 Z" fill="#FFE01B" />
              <Path d="M 10 35 L 34 35 L 34 42 L 10 42 Z" fill="#1FA838" />
              <Path d="M 10 42 L 34 42 L 34 49 L 10 49 Z" fill="#1578E8" />
              <Path
                d="M 10 19 L 34 19 L 34 48 Q 34 50 32 50 L 12 50 Q 10 50 10 48 Z"
                fill="none"
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </G>
          ) : (
            <G>
              <Path
                d="M 10 19 L 34 19 L 34 48 Q 34 50 32 50 L 12 50 Q 10 50 10 48 Z"
                fill={crayon.hex}
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <Path
                d="M 11 26 L 33 26 L 33 41 L 11 41 Z"
                fill="rgba(255,253,247,0.42)"
              />
              <Path d="M 11 26 L 33 26 M 11 41 L 33 41" stroke={INK} strokeWidth="2.2" />
              <Ellipse cx="22" cy="33.5" rx="6" ry="3.5" fill={INK} opacity={0.28} />
            </G>
          )}
          <Path
            d="M 14.5 21 L 14.5 46"
            stroke="rgba(255,255,255,0.52)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </TactileButton>
  );
});

const MasterpieceBanner: React.FC<{ title: string }> = React.memo(({ title }) => {
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1,
        friction: 4.8,
        tension: 170,
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      Animated.timing(fade, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, pop]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.masterpieceBanner,
        {
          opacity: fade,
          transform: [
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) },
            { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      <Text style={styles.masterpieceText}>⭐ {title} Masterpiece! ⭐</Text>
    </Animated.View>
  );
});

/**
 * Zoo Coloring 3.0 — Real Published-Style Children's Coloring Book Engine:
 * - 10 crisp 640×640 hand-drawn storybook coloring book line-art pages (zero crude geometric shapes!).
 * - Pixel-exact pre-segmented region map with 2px under-ink expansion for instant 0ms Tap & Slide-to-Fill
 *   with ZERO white halo or bleed!
 * - Freehand Crayon & Rainbow drawing renders UNDER the crisp dark-brown ink lines so toddlers never paint
 *   over the eyes, smiles, or outlines!
 * - 8 Storybook Sticker Stamps, smart Magic Wand auto-color, Undo/Clear, auto-saved local art,
 *   and framed 1024×1136 Postcard PNG Save/Share!
 */
export const ZooColoringGame: React.FC = () => {
  const { addStar, collectSticker } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const initialArt = useMemo(() => loadSavedArtwork(), []);
  const [pageIdx, setPageIdx] = useState(0);
  const [tool, setTool] = useState<ToolMode>('fill');
  const [brushSizeKey, setBrushSizeKey] = useState<BrushSizeKey>('md');
  const [selectedCrayonId, setSelectedCrayonId] = useState<string>('yellow');
  const [selectedStamp, setSelectedStamp] = useState<StampKind>('star');

  const [fillsByPage, setFillsByPage] = useState<Record<string, Record<string, string>>>(
    initialArt.fillsByPage
  );
  const [strokesByPage, setStrokesByPage] = useState<Record<string, DrawStroke[]>>(
    initialArt.strokesByPage
  );
  const [stampsByPage, setStampsByPage] = useState<Record<string, PlacedStamp[]>>(
    initialArt.stampsByPage
  );
  const [historyByPage, setHistoryByPage] = useState<Record<string, HistoryEntry[]>>({});
  const [completedPages, setCompletedPages] = useState<string[]>(() =>
    loadSavedCompletedPages()
  );
  const [celebratedThisVisit, setCelebratedThisVisit] = useState<Record<string, boolean>>({});
  const [masterpieceTick, setMasterpieceTick] = useState(0);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number; tick: number } | null>(
    null
  );
  const [savedToast, setSavedToast] = useState(false);
  const [regionMapReadyTick, setRegionMapReadyTick] = useState(0);

  const rainbowIdxRef = useRef(0);
  const pageCelebrateAnim = useRef(new Animated.Value(1)).current;
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeStrokeRef = useRef<DrawStroke | null>(null);
  const lastSlideRegionRef = useRef<string | null>(null);

  const page = COLORING_PAGES[pageIdx % COLORING_PAGES.length];
  const currentFills = fillsByPage[page.id] || {};
  const currentStrokes = strokesByPage[page.id] || [];
  const currentStamps = stampsByPage[page.id] || [];
  const currentHistory = historyByPage[page.id] || [];
  const selectedCrayon =
    CRAYONS.find((c) => c.id === selectedCrayonId) || CRAYONS[2];
  const activeBrushWidth =
    BRUSH_SIZES.find((b) => b.key === brushSizeKey)?.width ?? 30;

  // Refs synced for direct 0ms DOM canvas event listeners
  const pageRef = useRef(page);
  pageRef.current = page;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const fillsRef = useRef(currentFills);
  fillsRef.current = currentFills;
  const strokesRef = useRef(currentStrokes);
  strokesRef.current = currentStrokes;
  const stampsRef = useRef(currentStamps);
  stampsRef.current = currentStamps;
  const crayonRef = useRef(selectedCrayon);
  crayonRef.current = selectedCrayon;
  const brushWRef = useRef(activeBrushWidth);
  brushWRef.current = activeBrushWidth;
  const stampKindRef = useRef(selectedStamp);
  stampKindRef.current = selectedStamp;
  const celebratedRef = useRef(celebratedThisVisit);
  celebratedRef.current = celebratedThisVisit;

  useEffect(() => {
    return () => {
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    };
  }, []);

  // Persist artwork gently whenever fills, strokes, or stamps change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveArtworkState({ fillsByPage, strokesByPage, stampsByPage });
    }, 280);
    return () => clearTimeout(timer);
  }, [fillsByPage, strokesByPage, stampsByPage]);

  // Load & segment current coloring page PNG once (cached per page ID for 0ms repeat switching!)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (regionMapCache.has(page.id)) {
      setRegionMapReadyTick((t) => t + 1);
      return;
    }
    const uri = getWebAssetUri(page.lineArt);
    if (!uri) return;
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const map = buildRegionMapFromImage(img);
      regionMapCache.set(page.id, map);
      setRegionMapReadyTick((t) => t + 1);
    };
    img.src = uri;
    return () => {
      cancelled = true;
    };
  }, [page.id, page.lineArt]);

  const coloredStepCount = useMemo(() => {
    const filled = Object.values(currentFills).filter(
      (hex) => Boolean(hex) && hex !== PAPER_WHITE
    ).length;
    return Math.min(MASTERPIECE_GOAL, filled + Math.min(3, currentStrokes.length));
  }, [currentFills, currentStrokes.length]);

  const canvasSize = useMemo(() => {
    if (isTabletLandscape) {
      return Math.min(500, Math.max(320, Math.min(height - 210, width - 390)));
    }
    if (isTablet) {
      return Math.min(480, Math.max(300, Math.min(width - 64, height - 385)));
    }
    return Math.min(336, Math.max(232, Math.min(width - 32, height - 356)));
  }, [height, isTablet, isTabletLandscape, width]);

  const nextActiveColor = useCallback(() => {
    const cr = crayonRef.current;
    if (cr.isRainbow) {
      const hex = RAINBOW_CYCLE[rainbowIdxRef.current % RAINBOW_CYCLE.length];
      rainbowIdxRef.current += 1;
      return hex;
    }
    return cr.hex;
  }, []);

  const bouncePageJoyfully = useCallback(() => {
    pageCelebrateAnim.setValue(0.95);
    Animated.spring(pageCelebrateAnim, {
      toValue: 1,
      friction: 3.6,
      tension: 185,
      useNativeDriver: true,
    }).start();
  }, [pageCelebrateAnim]);

  const triggerPageMasterpiece = useCallback(
    (p: ColoringPageSpec) => {
      setCelebratedThisVisit((prev) => ({ ...prev, [p.id]: true }));
      setMasterpieceTick(Date.now());
      soundEngine.playWin();
      setTimeout(() => soundEngine.playAnimalSound(p.animal), 280);
      setTimeout(() => soundEngine.speakWord(`Great job! ${p.title}!`), 620);
      addStar(1);
      collectSticker(p.animal);

      setCompletedPages((prev) => {
        if (prev.includes(p.id)) return prev;
        const next = [...prev, p.id];
        saveCompletedPages(next);
        return next;
      });
      bouncePageJoyfully();
    },
    [addStar, bouncePageJoyfully, collectSticker]
  );

  // Main 2D Canvas Element & Instant Redraw (Fills + Crayon Strokes + Crisp Ink Overlay!)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const handleCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    setCanvasEl(el);
  }, []);

  const redrawCanvas = useCallback(
    (
      fillsOverride?: Record<string, string>,
      strokesOverride?: DrawStroke[],
      liveStroke?: DrawStroke | null
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const curPage = pageRef.current;
      const map = regionMapCache.get(curPage.id);
      const fills = fillsOverride ?? fillsRef.current;
      const strokes = strokesOverride ?? strokesRef.current;

      // 1. Warm paper + pixel-exact region fills (2px under-ink expanded for zero white fringe!)
      const imgData = ctx.createImageData(MASK_SIZE, MASK_SIZE);
      const buf = imgData.data;
      const [pr, pg, pb] = hexToRgb(PAPER_WHITE);

      // Build fast integer color lookup table indexed by region ID
      const colorTable: ([number, number, number] | undefined)[] = [];
      for (const [key, hex] of Object.entries(fills)) {
        if (!hex || hex === PAPER_WHITE) continue;
        const rid = parseInt(key.slice(1), 10);
        if (rid > 0) {
          colorTable[rid] = hexToRgb(hex);
        }
      }

      if (map) {
        const fl = map.fillLabels;
        for (let i = 0; i < MASK_SIZE * MASK_SIZE; i++) {
          const rid = fl[i];
          const c = rid > 0 ? colorTable[rid] : undefined;
          const off = i * 4;
          if (c) {
            buf[off] = c[0];
            buf[off + 1] = c[1];
            buf[off + 2] = c[2];
            buf[off + 3] = 255;
          } else {
            buf[off] = pr;
            buf[off + 1] = pg;
            buf[off + 2] = pb;
            buf[off + 3] = 255;
          }
        }
      } else {
        for (let i = 0; i < MASK_SIZE * MASK_SIZE; i++) {
          const off = i * 4;
          buf[off] = pr;
          buf[off + 1] = pg;
          buf[off + 2] = pb;
          buf[off + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // 2. Smooth Crayon Strokes painted cleanly UNDER the bold storybook ink lines!
      const allStrokes = liveStroke ? [...strokes, liveStroke] : strokes;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let s = 0; s < allStrokes.length; s++) {
        const st = allStrokes[s];
        if (!st.points.length) continue;
        ctx.strokeStyle = st.color;
        ctx.fillStyle = st.color;
        ctx.lineWidth = st.width;
        if (st.points.length === 1) {
          ctx.beginPath();
          ctx.arc(st.points[0].x, st.points[0].y, st.width * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(st.points[0].x, st.points[0].y);
          for (let i = 1; i < st.points.length; i++) {
            ctx.lineTo(st.points[i].x, st.points[i].y);
          }
          ctx.stroke();
        }
      }

      // 3. Razor-Crisp Transparent Warm-Brown Ink Line Art Overlay on Top!
      if (map?.img && map.img.complete) {
        ctx.drawImage(map.img, 0, 0, MASK_SIZE, MASK_SIZE);
      }
    },
    []
  );

  // Keep canvas painted whenever page, fills, strokes, or line-art load finishes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    redrawCanvas(currentFills, currentStrokes, activeStrokeRef.current);
  }, [canvasEl, currentFills, currentStrokes, page.id, redrawCanvas, regionMapReadyTick]);

  const applyRegionFill = useCallback(
    (
      regionKey: string,
      burstX: number,
      burstY: number,
      overrideColor?: string,
      silentNote = false
    ) => {
      const curPage = pageRef.current;
      const color = overrideColor ?? nextActiveColor();
      const prevFills = fillsRef.current;
      const prevColor = prevFills[regionKey];
      if (prevColor === color) return;

      if (!silentNote) {
        soundEngine.playNote(crayonRef.current.noteFreq);
      }

      const nextFills = { ...prevFills, [regionKey]: color };
      fillsRef.current = nextFills;
      redrawCanvas(nextFills, strokesRef.current, null);

      setFillsByPage((prev) => ({
        ...prev,
        [curPage.id]: nextFills,
      }));
      setHistoryByPage((prev) => ({
        ...prev,
        [curPage.id]: [
          ...(prev[curPage.id] || []).slice(-35),
          { type: 'fill', regionKey, prevColor },
        ],
      }));

      setBurstPos({ x: burstX, y: burstY, tick: Date.now() });

      const filledCount = Object.values(nextFills).filter(
        (hex) => Boolean(hex) && hex !== PAPER_WHITE
      ).length;
      if (filledCount >= MASTERPIECE_GOAL && !celebratedRef.current[curPage.id]) {
        triggerPageMasterpiece(curPage);
      }
    },
    [nextActiveColor, redrawCanvas, triggerPageMasterpiece]
  );

  const hitTestRegionAt = useCallback((mx: number, my: number): RegionMeta | null => {
    const map = regionMapCache.get(pageRef.current.id);
    if (!map) return null;
    const xi = Math.max(0, Math.min(MASK_SIZE - 1, Math.round(mx)));
    const yi = Math.max(0, Math.min(MASK_SIZE - 1, Math.round(my)));

    // Try exact pixel first, then tiny 4px spiral in case toddler tapped directly on an ink line!
    let rid = map.labels[yi * MASK_SIZE + xi];
    if (!rid) {
      for (const [dx, dy] of [
        [3, 0],
        [-3, 0],
        [0, 3],
        [0, -3],
        [5, 5],
        [-5, -5],
        [5, -5],
        [-5, 5],
      ]) {
        const nx = Math.max(0, Math.min(MASK_SIZE - 1, xi + dx));
        const ny = Math.max(0, Math.min(MASK_SIZE - 1, yi + dy));
        const cand = map.labels[ny * MASK_SIZE + nx];
        if (cand) {
          rid = cand;
          break;
        }
      }
    }
    if (!rid) return null;
    return map.regions.find((r) => r.id === rid) ?? null;
  }, []);

  // Direct non-passive DOM touch & pointer handlers on the coloring <canvas> (0ms iPad/Android touch!)
  const winCleanupRef = useRef<(() => void) | null>(null);
  const lastTouchEndRef = useRef(0);
  const cleanupWin = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);
  useEffect(() => () => cleanupWin(), [cleanupWin]);

  const getMaskPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { mx: MASK_SIZE * 0.5, my: MASK_SIZE * 0.5, localX: 0, localY: 0 };
    }
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const mx = Math.max(0, Math.min(MASK_SIZE, (localX / rect.width) * MASK_SIZE));
    const my = Math.max(0, Math.min(MASK_SIZE, (localY / rect.height) * MASK_SIZE));
    return { mx, my, localX, localY };
  }, []);

  const placeStampAt = useCallback((mx: number, my: number, localX: number, localY: number) => {
    soundEngine.playPop();
    const curPage = pageRef.current;
    const st: PlacedStamp = {
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kind: stampKindRef.current,
      x: Math.max(48, Math.min(MASK_SIZE - 48, mx)),
      y: Math.max(48, Math.min(MASK_SIZE - 48, my)),
      size: 74,
    };
    setStampsByPage((prev) => ({
      ...prev,
      [curPage.id]: [...(prev[curPage.id] || []), st],
    }));
    setHistoryByPage((prev) => ({
      ...prev,
      [curPage.id]: [
        ...(prev[curPage.id] || []).slice(-35),
        { type: 'stamp', stampId: st.id },
      ],
    }));
    setBurstPos({ x: localX, y: localY, tick: Date.now() });
  }, []);

  const beginCanvasGesture = useCallback(
    (mode: 'touch' | 'pointer', id: number, clientX: number, clientY: number) => {
      soundEngine.unlock();
      const pt = getMaskPoint(clientX, clientY);
      const curTool = toolRef.current;

      if (curTool === 'stamp') {
        placeStampAt(pt.mx, pt.my, pt.localX, pt.localY);
        if (mode === 'touch') lastTouchEndRef.current = Date.now();
        return;
      }

      if (curTool === 'fill') {
        lastSlideRegionRef.current = null;
        const hit = hitTestRegionAt(pt.mx, pt.my);
        if (hit) {
          lastSlideRegionRef.current = hit.key;
          applyRegionFill(hit.key, pt.localX, pt.localY);
        }
      } else if (curTool === 'draw') {
        const strokeColor = nextActiveColor();
        const newStroke: DrawStroke = {
          id: `dr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          color: strokeColor,
          width: brushWRef.current,
          points: [{ x: pt.mx, y: pt.my }],
        };
        activeStrokeRef.current = newStroke;
        soundEngine.playNote(crayonRef.current.noteFreq);
        redrawCanvas(fillsRef.current, strokesRef.current, newStroke);
      }

      cleanupWin();
      if (typeof window === 'undefined') return;

      const onSlidePoint = (cx: number, cy: number) => {
        const p = getMaskPoint(cx, cy);
        if (toolRef.current === 'fill') {
          const hit = hitTestRegionAt(p.mx, p.my);
          if (hit && hit.key !== lastSlideRegionRef.current) {
            lastSlideRegionRef.current = hit.key;
            applyRegionFill(hit.key, p.localX, p.localY);
          }
        } else if (toolRef.current === 'draw' && activeStrokeRef.current) {
          const pts = activeStrokeRef.current.points;
          const last = pts[pts.length - 1];
          if (Math.hypot(p.mx - last.x, p.my - last.y) >= 4) {
            pts.push({ x: p.mx, y: p.my });
            redrawCanvas(fillsRef.current, strokesRef.current, activeStrokeRef.current);
          }
        }
      };

      const finish = () => {
        cleanupWin();
        if (mode === 'touch') lastTouchEndRef.current = Date.now();
        lastSlideRegionRef.current = null;

        if (activeStrokeRef.current) {
          const doneStroke = activeStrokeRef.current;
          activeStrokeRef.current = null;
          const curPage = pageRef.current;
          const nextStrokes = [...strokesRef.current, doneStroke];
          strokesRef.current = nextStrokes;
          setStrokesByPage((prev) => ({
            ...prev,
            [curPage.id]: nextStrokes,
          }));
          setHistoryByPage((prev) => ({
            ...prev,
            [curPage.id]: [
              ...(prev[curPage.id] || []).slice(-35),
              { type: 'stroke', strokeId: doneStroke.id },
            ],
          }));
          redrawCanvas(fillsRef.current, nextStrokes, null);
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
          onSlidePoint(t.clientX, t.clientY);
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findT(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          finish();
        };
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd, { passive: false });
        window.addEventListener('touchcancel', onEnd);
        winCleanupRef.current = () => {
          window.removeEventListener('touchmove', onMove);
          window.removeEventListener('touchend', onEnd);
          window.removeEventListener('touchcancel', onEnd);
        };
      } else {
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          ev.preventDefault?.();
          onSlidePoint(ev.clientX, ev.clientY);
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          finish();
        };
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        winCleanupRef.current = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
      }
    },
    [
      applyRegionFill,
      cleanupWin,
      getMaskPoint,
      hitTestRegionAt,
      nextActiveColor,
      placeStampAt,
      redrawCanvas,
    ]
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasEl) return;
    const onTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      beginCanvasGesture('touch', t.identifier, t.clientX, t.clientY);
    };
    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch') return;
      if (Date.now() - lastTouchEndRef.current < 500) return;
      ev.preventDefault();
      beginCanvasGesture('pointer', ev.pointerId, ev.clientX, ev.clientY);
    };
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasEl.addEventListener('pointerdown', onPointerDown);
    return () => {
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
    };
  }, [beginCanvasGesture, canvasEl]);

  // Smart Magic Wand: colors the next uncolored storybook region harmoniously!
  const handleMagicWand = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playStarCollect(4);
    const map = regionMapCache.get(page.id);
    if (!map || map.regions.length === 0) return;

    const significant = map.regions
      .filter((r) => r.pixelCount >= 320)
      .sort((a, b) => b.pixelCount - a.pixelCount);
    if (significant.length === 0) return;

    const uncolored = significant.filter(
      (r) => !currentFills[r.key] || currentFills[r.key] === PAPER_WHITE
    );
    const target =
      uncolored.length > 0
        ? uncolored[0]
        : significant[Math.floor(Math.random() * significant.length)];

    const nonSceneCount = Object.values(currentFills).filter(
      (c) => c && c !== PAPER_WHITE && c !== page.skyColor && c !== page.groundColor
    ).length;

    let chosenHex = page.magicPalette[nonSceneCount % page.magicPalette.length];
    if (target.isSky) {
      chosenHex = page.skyColor;
    } else if (target.cy > MASK_SIZE * 0.74 && target.pixelCount > 6500) {
      chosenHex = page.groundColor;
    } else if (
      target.cy < MASK_SIZE * 0.25 &&
      (target.cx < MASK_SIZE * 0.26 || target.cx > MASK_SIZE * 0.74) &&
      target.pixelCount < 11500
    ) {
      chosenHex = '#FFE01B';
    }

    const bx = (target.cx / MASK_SIZE) * canvasSize;
    const by = (target.cy / MASK_SIZE) * canvasSize;
    applyRegionFill(target.key, bx, by, chosenHex, true);
  }, [applyRegionFill, canvasSize, currentFills, page]);

  const handleUndo = useCallback(() => {
    const hist = historyByPage[page.id] || [];
    if (hist.length === 0) return;
    soundEngine.playCardFlip();
    const last = hist[hist.length - 1];
    setHistoryByPage((prev) => ({
      ...prev,
      [page.id]: hist.slice(0, -1),
    }));

    if (last.type === 'fill') {
      setFillsByPage((prev) => {
        const copy = { ...(prev[page.id] || {}) };
        if (last.prevColor) copy[last.regionKey] = last.prevColor;
        else delete copy[last.regionKey];
        return { ...prev, [page.id]: copy };
      });
    } else if (last.type === 'stroke') {
      setStrokesByPage((prev) => ({
        ...prev,
        [page.id]: (prev[page.id] || []).filter((s) => s.id !== last.strokeId),
      }));
    } else if (last.type === 'stamp') {
      setStampsByPage((prev) => ({
        ...prev,
        [page.id]: (prev[page.id] || []).filter((s) => s.id !== last.stampId),
      }));
    } else if (last.type === 'clear') {
      setFillsByPage((prev) => ({ ...prev, [page.id]: last.prevFills }));
      setStrokesByPage((prev) => ({ ...prev, [page.id]: last.prevStrokes }));
      setStampsByPage((prev) => ({ ...prev, [page.id]: last.prevStamps }));
    }
  }, [historyByPage, page.id]);

  const handleClearPage = useCallback(() => {
    soundEngine.playCardFlip();
    const prevFills = fillsByPage[page.id] || {};
    const prevStrokes = strokesByPage[page.id] || [];
    const prevStamps = stampsByPage[page.id] || [];
    if (
      Object.keys(prevFills).length === 0 &&
      prevStrokes.length === 0 &&
      prevStamps.length === 0
    ) {
      return;
    }
    setHistoryByPage((prev) => ({
      ...prev,
      [page.id]: [
        ...(prev[page.id] || []).slice(-25),
        { type: 'clear', prevFills, prevStrokes, prevStamps },
      ],
    }));
    setFillsByPage((prev) => ({ ...prev, [page.id]: {} }));
    setStrokesByPage((prev) => ({ ...prev, [page.id]: [] }));
    setStampsByPage((prev) => ({ ...prev, [page.id]: [] }));
    setCelebratedThisVisit((prev) => ({ ...prev, [page.id]: false }));
  }, [fillsByPage, page.id, stampsByPage, strokesByPage]);

  const handleHearAnimal = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playAnimalSound(page.animal);
    soundEngine.speakWord(page.title);
    bouncePageJoyfully();
  }, [bouncePageJoyfully, page]);

  // Framed 1024×1136 Postcard PNG Export (Web Share Sheet / PNG download!)
  const handleSaveArtwork = useCallback(async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !canvasRef.current) {
      return;
    }
    soundEngine.unlock();
    soundEngine.playSnap();

    try {
      const W = 1024;
      const H = 1136;
      const out = document.createElement('canvas');
      out.width = W;
      out.height = H;
      const ctx = out.getContext('2d');
      if (!ctx) return;

      // Carved wooden storybook frame
      ctx.fillStyle = '#E3B97E';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#7A4F28';
      ctx.lineWidth = 22;
      ctx.strokeRect(11, 11, W - 22, H - 22);

      const artPad = 48;
      const artSize = W - artPad * 2;
      ctx.fillStyle = PAPER_WHITE;
      ctx.fillRect(artPad, artPad, artSize, artSize);

      // Composite live coloring canvas (fills + crayon strokes + crisp dark-brown line art)
      ctx.drawImage(canvasRef.current, artPad, artPad, artSize, artSize);

      // Draw placed stamps on top
      const stampScale = artSize / MASK_SIZE;
      for (const st of currentStamps) {
        drawStampOn2dCanvas(ctx, st, stampScale, artPad, artPad);
      }

      ctx.strokeStyle = '#C99B5E';
      ctx.lineWidth = 5;
      ctx.strokeRect(artPad, artPad, artSize, artSize);

      // Warm storybook footer caption
      const footerY = artPad + artSize + 64;
      ctx.fillStyle = '#4A3525';
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(page.title, artPad + 4, footerY);

      ctx.fillStyle = '#8C5B32';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText("★ Painted in Whit's World", W - artPad - 4, footerY);

      const blob: Blob | null = await new Promise((resolve) =>
        out.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) return;

      const fileName = `whits-world-${page.id}.png`;
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
              title: `${page.title} — Whit's World`,
              files: [file],
            });
            shared = true;
          }
        } catch {
          // Fall back to direct PNG download
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
      soundEngine.speakWord('Picture saved!');
      setSavedToast(true);
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
      savedToastTimerRef.current = setTimeout(() => setSavedToast(false), 2600);
    } catch {
      // Ignore export errors gracefully
    }
  }, [currentStamps, page.id, page.title]);

  const renderPagePicker = () => (
    <View
      style={[
        styles.pagePickerShell,
        isTabletLandscape && styles.pagePickerShellLandscape,
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pagePickerRow}
      >
        {COLORING_PAGES.map((pg, idx) => {
          const active = idx === pageIdx % COLORING_PAGES.length;
          const isDone = completedPages.includes(pg.id);
          const tabSz = isTablet ? 52 : 44;
          return (
            <TactileButton
              key={pg.id}
              onPress={() => {
                soundEngine.unlock();
                soundEngine.playAnimalSound(pg.animal);
                soundEngine.speakWord(pg.title);
                setPageIdx(idx);
              }}
              accessibilityLabel={`Color ${pg.title}`}
              style={{ width: tabSz }}
            >
              <View
                style={[
                  styles.pageTab,
                  {
                    width: tabSz,
                    height: tabSz,
                    borderRadius: tabSz / 2,
                    backgroundColor: pg.badgeColor,
                  },
                  active && styles.pageTabActive,
                ]}
              >
                <ZooExhibitAnimalSvg
                  animal={pg.animal}
                  size={Math.round(tabSz * 0.78)}
                  highlighted={active}
                />
                {isDone && (
                  <View style={styles.doneDot}>
                    <Text style={styles.doneDotText}>✓</Text>
                  </View>
                )}
              </View>
            </TactileButton>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCanvas = () => (
    <View style={styles.canvasColumn}>
      <Animated.View
        style={[
          styles.paperFrame,
          { transform: [{ scale: pageCelebrateAnim }] },
        ]}
      >
        <View
          style={[
            styles.paperInner,
            { width: canvasSize, height: canvasSize },
          ]}
        >
          {Platform.OS === 'web' ? (
            <canvas
              ref={handleCanvasRef}
              width={MASK_SIZE}
              height={MASK_SIZE}
              aria-label={`${page.title} coloring canvas`}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                cursor: tool === 'fill' ? 'pointer' : 'crosshair',
              }}
            />
          ) : (
            <Image
              source={page.lineArt}
              style={{ width: canvasSize, height: canvasSize }}
              resizeMode="contain"
            />
          )}

          {/* Crisp SVG Sticker Stamps Layer on top of Line Art */}
          {currentStamps.length > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg
                width={canvasSize}
                height={canvasSize}
                viewBox={`0 0 ${MASK_SIZE} ${MASK_SIZE}`}
              >
                {currentStamps.map((st) => (
                  <G
                    key={st.id}
                    transform={`translate(${st.x}, ${st.y}) scale(${st.size / 42})`}
                  >
                    {renderStampGraphic(st.kind)}
                  </G>
                ))}
              </Svg>
            </View>
          )}

          {/* Sparkle Tap Burst */}
          {burstPos && (
            <View
              key={burstPos.tick}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: burstPos.x - 42,
                top: burstPos.y - 42,
                zIndex: 20,
              }}
            >
              <SnapBurst size={84} />
            </View>
          )}

          {masterpieceTick > 0 && (
            <MasterpieceBanner key={masterpieceTick} title={page.title} />
          )}
        </View>

        {/* Interactive Hear Animal Badge */}
        <View style={styles.hearAnimalWrap}>
          <TactileButton
            onPress={handleHearAnimal}
            accessibilityLabel={`Hear ${page.title}`}
          >
            <View style={styles.hearAnimalPill}>
              <Text style={styles.hearAnimalText}>🔊 {page.title}</Text>
            </View>
          </TactileButton>
        </View>

        {savedToast && (
          <View style={styles.savedToastWrap} pointerEvents="none">
            <View style={styles.savedToastPill}>
              <Text style={styles.savedToastText}>📸 Picture Saved!</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );

  const crayonSize = isTabletLandscape ? 46 : isTablet ? 44 : 36;
  const activeDotColor = selectedCrayon.isRainbow ? '#7E2CE0' : selectedCrayon.hex;

  const renderPaletteAndTools = () => (
    <View
      style={[
        styles.paletteDock,
        isTablet && styles.paletteDockTablet,
        isTabletLandscape && styles.paletteDockLandscape,
      ]}
    >
      {/* Row 1: Primary Mode Switcher (Fill | Draw | Stamp) */}
      <View style={styles.toolsRow}>
        <TactileButton
          onPress={() => {
            soundEngine.playPop();
            soundEngine.speakWord('Fill');
            setTool('fill');
          }}
          accessibilityLabel="Tap to Fill mode"
        >
          <View style={[styles.toolPill, tool === 'fill' && styles.toolPillActive]}>
            <Text style={[styles.toolText, tool === 'fill' && styles.toolTextActive]}>
              🪣 Fill
            </Text>
          </View>
        </TactileButton>

        <TactileButton
          onPress={() => {
            soundEngine.playPop();
            soundEngine.speakWord('Draw');
            setTool('draw');
          }}
          accessibilityLabel="Crayon Draw mode"
        >
          <View style={[styles.toolPill, tool === 'draw' && styles.toolPillActive]}>
            <Text style={[styles.toolText, tool === 'draw' && styles.toolTextActive]}>
              🖍️ Draw
            </Text>
          </View>
        </TactileButton>

        <TactileButton
          onPress={() => {
            soundEngine.playPop();
            soundEngine.speakWord('Stickers');
            setTool('stamp');
          }}
          accessibilityLabel="Sticker Stamp mode"
        >
          <View style={[styles.toolPill, tool === 'stamp' && styles.toolPillActive]}>
            <Text style={[styles.toolText, tool === 'stamp' && styles.toolTextActive]}>
              ⭐ Stamp
            </Text>
          </View>
        </TactileButton>
      </View>

      {/* Row 2: Action Tools (Magic | Save | Undo | Clear) + Brush Sizes */}
      <View style={styles.actionsRow}>
        <TactileButton
          onPress={handleMagicWand}
          accessibilityLabel="Magic color helper"
        >
          <View style={styles.magicBtn}>
            <Text style={styles.magicBtnText}>🪄 Magic</Text>
          </View>
        </TactileButton>

        {Platform.OS === 'web' && (
          <TactileButton
            onPress={handleSaveArtwork}
            accessibilityLabel="Save coloring picture"
          >
            <View style={styles.saveArtBtn}>
              <Text style={styles.saveArtBtnText}>📸 Save</Text>
            </View>
          </TactileButton>
        )}

        <TactileButton
          onPress={handleUndo}
          accessibilityLabel="Undo last step"
          disabled={currentHistory.length === 0}
        >
          <View
            style={[
              styles.iconToolBtn,
              currentHistory.length === 0 && { opacity: 0.45 },
            ]}
          >
            <Text style={styles.iconToolText}>↩️</Text>
          </View>
        </TactileButton>

        <TactileButton
          onPress={handleClearPage}
          accessibilityLabel="Fresh blank page"
        >
          <View style={styles.iconToolBtn}>
            <Text style={styles.iconToolText}>✨</Text>
          </View>
        </TactileButton>

        {tool === 'draw' && (
          <View style={styles.brushGroup}>
            {BRUSH_SIZES.map((b) => {
              const active = brushSizeKey === b.key;
              return (
                <TactileButton
                  key={b.key}
                  onPress={() => {
                    soundEngine.playPop();
                    setBrushSizeKey(b.key);
                  }}
                  accessibilityLabel={b.label}
                >
                  <View
                    style={[
                      styles.brushDotBtn,
                      active && styles.brushDotBtnActive,
                    ]}
                  >
                    <View
                      style={{
                        width: b.dotPx,
                        height: b.dotPx,
                        borderRadius: b.dotPx / 2,
                        backgroundColor:
                          activeDotColor === PAPER_WHITE ? '#C8B8A4' : activeDotColor,
                        borderWidth: 1.8,
                        borderColor: INK,
                      }}
                    />
                  </View>
                </TactileButton>
              );
            })}
          </View>
        )}
      </View>

      {/* Row 3: 8 SVG Sticker Stamps OR 10 Vivid Crayons */}
      {tool === 'stamp' ? (
        <View
          style={[
            styles.stampsGrid,
            isTablet && !isTabletLandscape && styles.stampsGridTablet,
            isTabletLandscape && styles.stampsGridLandscape,
          ]}
        >
          {STAMPS.map((st) => {
            const active = selectedStamp === st.kind;
            const btnSz = isTabletLandscape ? 60 : isTablet ? 56 : 48;
            return (
              <TactileButton
                key={st.kind}
                onPress={() => {
                  soundEngine.unlock();
                  soundEngine.playPop();
                  soundEngine.speakWord(st.name);
                  setSelectedStamp(st.kind);
                }}
                accessibilityLabel={`${st.name} sticker`}
                style={{ width: btnSz }}
              >
                <View
                  style={[
                    styles.stampTile,
                    { width: btnSz, height: btnSz, borderRadius: 18 },
                    active && styles.stampTileActive,
                  ]}
                >
                  <Svg
                    width={Math.round(btnSz * 0.78)}
                    height={Math.round(btnSz * 0.78)}
                    viewBox="-24 -24 48 48"
                  >
                    {renderStampGraphic(st.kind)}
                  </Svg>
                </View>
              </TactileButton>
            );
          })}
        </View>
      ) : (
        <View
          style={[
            styles.crayonsGrid,
            isTablet && !isTabletLandscape && styles.crayonsGridTablet,
            isTabletLandscape && styles.crayonsGridLandscape,
          ]}
        >
          {CRAYONS.map((crayon) => (
            <CrayonButton
              key={crayon.id}
              crayon={crayon}
              active={selectedCrayonId === crayon.id}
              size={crayonSize}
              onPress={() => {
                soundEngine.unlock();
                soundEngine.playNote(crayon.noteFreq);
                soundEngine.speakWord(crayon.name);
                setSelectedCrayonId(crayon.id);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={page.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.sunlitVeil} />
      </View>

      <GameHeader
        totalSteps={MASTERPIECE_GOAL}
        completedSteps={coloredStepCount}
      />

      {isTabletLandscape ? (
        <>
          <View style={styles.landscapePickerWrap}>{renderPagePicker()}</View>
          <View style={styles.playAreaLandscape}>
            <View style={styles.landscapeLeft}>{renderCanvas()}</View>
            <View style={styles.landscapeRight}>{renderPaletteAndTools()}</View>
          </View>
        </>
      ) : (
        <View style={[styles.playArea, isTablet && styles.playAreaTabletPortrait]}>
          {isTablet && renderPagePicker()}
          {renderCanvas()}
          {renderPaletteAndTools()}
          {!isTablet && renderPagePicker()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  sunlitVeil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 250, 232, 0.22)',
  },
  landscapePickerWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 2,
    zIndex: 20,
  },
  playArea: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  playAreaTabletPortrait: {
    maxWidth: 760,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  playAreaLandscape: {
    flex: 1,
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  landscapeLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperFrame: {
    position: 'relative',
    padding: 9,
    borderRadius: 30,
    backgroundColor: '#FFFDF7',
    borderWidth: 3,
    borderColor: 'rgba(138, 92, 50, 0.36)',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  paperInner: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: PAPER_WHITE,
    position: 'relative',
  },
  hearAnimalWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 25,
  },
  hearAnimalPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 249, 232, 0.90)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.36)',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  hearAnimalText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  masterpieceBanner: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFF4BE',
    borderWidth: 3,
    borderColor: COLORS.woodDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  masterpieceText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.woodDark,
    textAlign: 'center',
  },
  paletteDock: {
    width: '98%',
    maxWidth: 520,
    backgroundColor: 'rgba(248, 228, 186, 0.94)',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 50, 0.34)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 50, 0.44)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    alignItems: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  paletteDockTablet: {
    maxWidth: 680,
    borderRadius: 36,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  paletteDockLandscape: {
    width: 328,
    borderRadius: 36,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  toolPill: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.88)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.3)',
  },
  toolPillActive: {
    backgroundColor: COLORS.sunYellow,
    borderColor: COLORS.woodDark,
    borderWidth: 2.5,
  },
  toolText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  toolTextActive: {
    color: COLORS.woodDark,
  },
  magicBtn: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#F6E2FF',
    borderWidth: 2,
    borderColor: '#7E57C2',
  },
  magicBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#512DA8',
  },
  saveArtBtn: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#DFF7E3',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  saveArtBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1B5E20',
  },
  savedToastWrap: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    zIndex: 28,
  },
  savedToastPill: {
    backgroundColor: '#E2F7E5',
    borderRadius: 999,
    borderWidth: 2.2,
    borderColor: '#2E7D32',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  savedToastText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1B5E20',
  },
  iconToolBtn: {
    width: 38,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 250, 236, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToolText: {
    fontSize: 16,
  },
  brushGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 250, 236, 0.72)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(122, 82, 44, 0.25)',
  },
  brushDotBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushDotBtnActive: {
    backgroundColor: '#FFF0A8',
    borderWidth: 2,
    borderColor: COLORS.woodDark,
  },
  crayonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 240,
  },
  crayonsGridTablet: {
    gap: 10,
    maxWidth: 280,
  },
  crayonsGridLandscape: {
    gap: 8,
    maxWidth: 290,
  },
  crayonWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  crayonWrapActive: {
    transform: [{ scale: 1.14 }, { translateY: -5 }],
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    maxWidth: 244,
  },
  stampsGridTablet: {
    gap: 10,
    maxWidth: 280,
  },
  stampsGridLandscape: {
    gap: 10,
    maxWidth: 290,
  },
  stampTile: {
    backgroundColor: 'rgba(255, 253, 247, 0.92)',
    borderWidth: 2.5,
    borderColor: 'rgba(122, 82, 44, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  stampTileActive: {
    backgroundColor: '#FFF4BE',
    borderColor: COLORS.woodDark,
    borderWidth: 3.5,
    transform: [{ scale: 1.09 }, { translateY: -3 }],
  },
  pagePickerShell: {
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.62)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  pagePickerShellLandscape: {
    maxWidth: 780,
  },
  pagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pageTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.84,
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },
  pageTabActive: {
    borderColor: COLORS.woodDark,
    borderWidth: 3.5,
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  doneDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLORS.emerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneDotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
