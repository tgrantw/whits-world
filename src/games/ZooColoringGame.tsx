import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
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
const CANVAS_VB = 320;
const SAVED_PAGES_KEY = 'whits_world_colored_pages_v1';
const SAVED_ARTWORK_KEY = 'whits_world_coloring_art_v2';

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
  { key: 'sm', label: 'Small crayon', width: 11, dotPx: 12 },
  { key: 'md', label: 'Medium crayon', width: 20, dotPx: 19 },
  { key: 'lg', label: 'Big crayon', width: 32, dotPx: 26 },
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

type ShapeSpec =
  | { kind: 'path'; d: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

interface ColoringRegion {
  id: string;
  label: string;
  cx: number;
  cy: number;
  /** Natural storybook color used when tapping the Magic Wand */
  defaultColor: string;
  shapes: ShapeSpec[];
}

interface ColoringPageSpec {
  id: string;
  title: string;
  animal: ExhibitAnimalKind;
  badgeColor: string;
  backdrop: typeof STORYBOOK_ASSETS.bgClearing;
  regions: ColoringRegion[];
  /** Fixed charming facial details drawn on top of fills, outlines & strokes */
  renderFaceOverlay: () => React.ReactNode;
}

interface DrawStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

interface PlacedStamp {
  id: string;
  kind: StampKind;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface HistoryEntry {
  kind: 'fill' | 'stroke' | 'stamp' | 'clear';
  regionId?: string;
  prevColor?: string;
  strokeId?: string;
  stampId?: string;
  prevFills?: Record<string, string>;
  prevStrokes?: DrawStroke[];
  prevStamps?: PlacedStamp[];
}

interface SavedArtworkState {
  fillsByPage: Record<string, Record<string, string>>;
  strokesByPage: Record<string, DrawStroke[]>;
  stampsByPage: Record<string, PlacedStamp[]>;
}

const COLORING_PAGES: ColoringPageSpec[] = [
  {
    id: 'lion',
    title: 'Sunny Lion',
    animal: 'lion',
    badgeColor: '#F5DF98',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    regions: [
      {
        id: 'sun',
        label: 'Sun',
        cx: 266,
        cy: 52,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'circle', cx: 266, cy: 52, r: 28 }],
      },
      {
        id: 'grass',
        label: 'Grass',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          {
            kind: 'path',
            d: 'M 8 278 Q 85 262 160 272 Q 235 282 312 270 L 312 312 L 8 312 Z',
          },
        ],
      },
      {
        id: 'tail',
        label: 'Tail Tuft',
        cx: 264,
        cy: 214,
        defaultColor: '#F39237',
        shapes: [
          {
            kind: 'path',
            d: 'M 222 232 Q 256 236 266 206 Q 278 188 260 182 Q 244 186 248 206 Q 240 222 218 220 Z',
          },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 228,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 228, rx: 64, ry: 54 }],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 160,
        cy: 234,
        defaultColor: '#F39237',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 234, rx: 36, ry: 34 }],
      },
      {
        id: 'paws',
        label: 'Paws',
        cx: 160,
        cy: 274,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'ellipse', cx: 122, cy: 274, rx: 24, ry: 15 },
          { kind: 'ellipse', cx: 198, cy: 274, rx: 24, ry: 15 },
        ],
      },
      {
        id: 'mane',
        label: 'Mane',
        cx: 160,
        cy: 124,
        defaultColor: '#F39237',
        shapes: [
          {
            kind: 'path',
            d: 'M 160 44 C 178 44 188 58 204 54 C 222 50 232 68 232 84 C 248 92 252 112 242 126 C 252 142 244 162 228 168 C 224 186 206 196 190 190 C 178 204 142 204 130 190 C 114 196 96 186 92 168 C 76 162 68 142 78 126 C 68 112 72 92 88 84 C 88 68 98 50 116 54 C 132 58 142 44 160 44 Z',
          },
        ],
      },
      {
        id: 'ears',
        label: 'Ears',
        cx: 160,
        cy: 78,
        defaultColor: '#FAD44A',
        shapes: [
          { kind: 'circle', cx: 112, cy: 78, r: 17 },
          { kind: 'circle', cx: 208, cy: 78, r: 17 },
        ],
      },
      {
        id: 'face',
        label: 'Face',
        cx: 160,
        cy: 126,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'circle', cx: 160, cy: 126, r: 52 }],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Path
          d="M 266 14 L 266 6 M 298 52 L 306 52 M 234 52 L 226 52 M 290 28 L 296 22 M 242 28 L 236 22 M 290 76 L 296 82"
          stroke={INK}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <Circle cx="141" cy="118" r="6.5" fill={INK} />
        <Circle cx="179" cy="118" r="6.5" fill={INK} />
        <Circle cx="143" cy="115.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="181" cy="115.5" r="2.2" fill="#FFFFFF" />
        <Path d="M 151 130 Q 160 125 169 130 L 160 140 Z" fill={INK} />
        <Path
          d="M 160 140 L 160 147 M 146 147 Q 153 155 160 147 Q 167 155 174 147"
          fill="none"
          stroke={INK}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 122 134 L 136 136 M 120 143 L 136 142 M 198 134 L 184 136 M 200 143 L 184 142"
          stroke={INK}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  {
    id: 'elephant',
    title: 'Happy Elephant',
    animal: 'elephant',
    badgeColor: '#B6DEF2',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    regions: [
      {
        id: 'splash',
        label: 'Water Drops',
        cx: 266,
        cy: 78,
        defaultColor: '#4DAAD8',
        shapes: [
          { kind: 'path', d: 'M 252 46 Q 266 64 252 74 Q 238 64 252 46 Z' },
          { kind: 'path', d: 'M 284 68 Q 298 86 284 96 Q 270 86 284 68 Z' },
        ],
      },
      {
        id: 'ground',
        label: 'Meadow',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          {
            kind: 'path',
            d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z',
          },
        ],
      },
      {
        id: 'left-ear',
        label: 'Left Ear',
        cx: 74,
        cy: 122,
        defaultColor: '#F082A8',
        shapes: [
          {
            kind: 'path',
            d: 'M 116 84 C 74 64 34 90 36 136 C 38 176 76 188 110 162 Z',
          },
        ],
      },
      {
        id: 'right-ear',
        label: 'Right Ear',
        cx: 246,
        cy: 122,
        defaultColor: '#F082A8',
        shapes: [
          {
            kind: 'path',
            d: 'M 204 84 C 246 64 286 90 284 136 C 282 176 244 188 210 162 Z',
          },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 224,
        defaultColor: '#4DAAD8',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 224, rx: 68, ry: 56 }],
      },
      {
        id: 'belly',
        label: 'Tummy',
        cx: 160,
        cy: 230,
        defaultColor: '#9B74D4',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 230, rx: 38, ry: 34 }],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
        defaultColor: '#9B74D4',
        shapes: [
          { kind: 'ellipse', cx: 118, cy: 274, rx: 24, ry: 16 },
          { kind: 'ellipse', cx: 202, cy: 274, rx: 24, ry: 16 },
        ],
      },
      {
        id: 'head',
        label: 'Head & Trunk',
        cx: 160,
        cy: 126,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 102 124 C 102 82 128 60 160 60 C 192 60 218 82 218 124 C 218 148 202 168 184 174 C 194 186 218 182 232 160 C 240 148 254 156 248 172 C 234 206 184 214 166 182 C 130 184 102 160 102 124 Z',
          },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="138" cy="116" r="6.5" fill={INK} />
        <Circle cx="182" cy="116" r="6.5" fill={INK} />
        <Circle cx="140" cy="113.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="184" cy="113.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="122" cy="134" r="7" fill="rgba(240, 130, 168, 0.35)" />
        <Circle cx="198" cy="134" r="7" fill="rgba(240, 130, 168, 0.35)" />
        <Path
          d="M 192 178 Q 202 174 206 180 M 214 176 Q 222 170 226 176"
          stroke={INK}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    ),
  },
  {
    id: 'whale',
    title: 'Splashy Whale',
    animal: 'whale',
    badgeColor: '#9EDEEF',
    backdrop: STORYBOOK_ASSETS.bgAquarium,
    regions: [
      {
        id: 'spout',
        label: 'Water Spout',
        cx: 158,
        cy: 64,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 156 108 Q 148 74 126 62 Q 112 56 118 44 Q 134 36 154 64 Q 160 40 176 40 Q 192 44 184 62 Q 168 74 164 108 Z',
          },
        ],
      },
      {
        id: 'wave',
        label: 'Ocean Wave',
        cx: 160,
        cy: 280,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 8 266 Q 58 244 108 266 Q 158 286 210 264 Q 262 244 312 266 L 312 312 L 8 312 Z',
          },
        ],
      },
      {
        id: 'tail',
        label: 'Tail Fin',
        cx: 266,
        cy: 150,
        defaultColor: '#9B74D4',
        shapes: [
          {
            kind: 'path',
            d: 'M 232 184 C 254 174 268 158 266 138 C 252 126 244 106 260 100 C 276 96 286 116 284 134 C 300 124 312 138 302 154 C 292 170 272 192 238 206 Z',
          },
        ],
      },
      {
        id: 'body',
        label: 'Whale Body',
        cx: 146,
        cy: 184,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 42 198 C 40 130 96 102 162 106 C 218 110 250 146 250 194 C 250 236 208 258 148 258 C 86 258 44 238 42 198 Z',
          },
        ],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 118,
        cy: 230,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 52 214 Q 112 216 176 212 C 170 244 136 256 102 254 C 72 252 54 236 52 214 Z',
          },
        ],
      },
      {
        id: 'flipper',
        label: 'Flipper',
        cx: 196,
        cy: 224,
        defaultColor: '#9B74D4',
        shapes: [
          {
            kind: 'path',
            d: 'M 176 206 Q 212 204 224 226 Q 214 246 184 236 Q 170 226 176 206 Z',
          },
        ],
      },
      {
        id: 'bubbles',
        label: 'Bubbles',
        cx: 62,
        cy: 94,
        defaultColor: '#F082A8',
        shapes: [
          { kind: 'circle', cx: 64, cy: 84, r: 16 },
          { kind: 'circle', cx: 44, cy: 116, r: 11 },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="94" cy="176" r="7" fill={INK} />
        <Circle cx="96.5" cy="173.5" r="2.4" fill="#FFFFFF" />
        <Circle cx="112" cy="190" r="8" fill="rgba(240, 130, 168, 0.35)" />
        <Path
          d="M 48 204 Q 78 216 108 202"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Path
          d="M 80 224 L 78 248 M 106 222 L 106 252 M 134 220 L 136 248"
          stroke={INK}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  {
    id: 'penguin',
    title: 'Little Penguin',
    animal: 'penguin',
    badgeColor: '#C5E4F4',
    backdrop: STORYBOOK_ASSETS.bgArctic,
    regions: [
      {
        id: 'ice',
        label: 'Snow Hill',
        cx: 160,
        cy: 288,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 8 274 Q 160 256 312 274 L 312 312 L 8 312 Z',
          },
        ],
      },
      {
        id: 'left-wing',
        label: 'Left Wing',
        cx: 74,
        cy: 186,
        defaultColor: '#9B74D4',
        shapes: [
          {
            kind: 'path',
            d: 'M 102 150 C 66 156 50 192 64 224 C 78 232 98 214 104 190 Z',
          },
        ],
      },
      {
        id: 'right-wing',
        label: 'Right Wing',
        cx: 246,
        cy: 186,
        defaultColor: '#9B74D4',
        shapes: [
          {
            kind: 'path',
            d: 'M 218 150 C 254 156 270 192 256 224 C 242 232 222 214 216 190 Z',
          },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 166,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 160 54 C 204 54 226 88 226 150 C 226 224 208 268 160 268 C 112 268 94 224 94 150 C 94 88 116 54 160 54 Z',
          },
        ],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 160,
        cy: 204,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 204, rx: 44, ry: 52 }],
      },
      {
        id: 'scarf',
        label: 'Cozy Scarf',
        cx: 160,
        cy: 146,
        defaultColor: '#E85A50',
        shapes: [
          {
            kind: 'path',
            d: 'M 104 138 Q 160 156 216 138 L 214 156 Q 160 172 106 156 Z',
          },
          {
            kind: 'path',
            d: 'M 184 152 L 204 150 L 212 192 L 188 190 Z',
          },
        ],
      },
      {
        id: 'beak',
        label: 'Beak',
        cx: 160,
        cy: 120,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'path', d: 'M 144 114 Q 160 106 176 114 L 160 134 Z' },
        ],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'ellipse', cx: 126, cy: 274, rx: 24, ry: 13 },
          { kind: 'ellipse', cx: 194, cy: 274, rx: 24, ry: 13 },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="138" cy="100" r="6.5" fill={INK} />
        <Circle cx="182" cy="100" r="6.5" fill={INK} />
        <Circle cx="140" cy="97.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="184" cy="97.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="122" cy="114" r="6.5" fill="rgba(240, 130, 168, 0.38)" />
        <Circle cx="198" cy="114" r="6.5" fill="rgba(240, 130, 168, 0.38)" />
      </G>
    ),
  },
  {
    id: 'giraffe',
    title: 'Tall Giraffe',
    animal: 'giraffe',
    badgeColor: '#F6CC9D',
    backdrop: STORYBOOK_ASSETS.bgSavanna,
    regions: [
      {
        id: 'leaves',
        label: 'Tree Leaves',
        cx: 266,
        cy: 64,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'circle', cx: 260, cy: 52, r: 24 },
          { kind: 'circle', cx: 286, cy: 70, r: 22 },
          { kind: 'circle', cx: 246, cy: 76, r: 18 },
        ],
      },
      {
        id: 'ground',
        label: 'Grass',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'horns',
        label: 'Horns',
        cx: 138,
        cy: 42,
        defaultColor: '#9C6844',
        shapes: [
          { kind: 'circle', cx: 120, cy: 40, r: 12 },
          { kind: 'circle', cx: 158, cy: 40, r: 12 },
        ],
      },
      {
        id: 'ears',
        label: 'Ears',
        cx: 138,
        cy: 76,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'ellipse', cx: 88, cy: 76, rx: 18, ry: 10 },
          { kind: 'ellipse', cx: 188, cy: 76, rx: 18, ry: 10 },
        ],
      },
      {
        id: 'neck-body',
        label: 'Neck & Body',
        cx: 146,
        cy: 196,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 118 118 L 158 118 L 170 184 C 216 184 236 206 236 236 C 236 264 214 278 164 278 C 110 278 96 258 96 230 C 96 206 106 194 116 186 Z',
          },
        ],
      },
      {
        id: 'spots',
        label: 'Giraffe Spots',
        cx: 164,
        cy: 224,
        defaultColor: '#9C6844',
        shapes: [
          { kind: 'circle', cx: 140, cy: 156, r: 13 },
          { kind: 'circle', cx: 146, cy: 214, r: 17 },
          { kind: 'circle', cx: 192, cy: 220, r: 16 },
          { kind: 'circle', cx: 172, cy: 252, r: 13 },
        ],
      },
      {
        id: 'head',
        label: 'Head',
        cx: 138,
        cy: 92,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'ellipse', cx: 138, cy: 92, rx: 42, ry: 34 }],
      },
      {
        id: 'muzzle',
        label: 'Snout',
        cx: 138,
        cy: 112,
        defaultColor: '#F39237',
        shapes: [{ kind: 'ellipse', cx: 138, cy: 112, rx: 28, ry: 18 }],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Path
          d="M 122 52 L 126 62 M 156 52 L 152 62"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <Circle cx="122" cy="84" r="6" fill={INK} />
        <Circle cx="154" cy="84" r="6" fill={INK} />
        <Circle cx="124" cy="82" r="2" fill="#FFFFFF" />
        <Circle cx="156" cy="82" r="2" fill="#FFFFFF" />
        <Circle cx="129" cy="108" r="2.6" fill={INK} />
        <Circle cx="147" cy="108" r="2.6" fill={INK} />
        <Path
          d="M 126 118 Q 138 126 150 118"
          fill="none"
          stroke={INK}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  {
    id: 'whit',
    title: 'Whit the Gorilla',
    animal: 'gorilla',
    badgeColor: '#A9DA9B',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    regions: [
      {
        id: 'banana',
        label: 'Banana',
        cx: 266,
        cy: 112,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 250 76 C 276 86 290 118 278 148 C 266 156 254 150 256 138 C 264 118 258 98 242 86 Z',
          },
        ],
      },
      {
        id: 'ground',
        label: 'Jungle Grass',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'left-arm',
        label: 'Left Arm',
        cx: 76,
        cy: 192,
        defaultColor: '#9C6844',
        shapes: [
          {
            kind: 'path',
            d: 'M 102 162 C 62 168 48 206 62 240 C 78 248 98 232 104 204 Z',
          },
        ],
      },
      {
        id: 'right-arm',
        label: 'Right Arm',
        cx: 242,
        cy: 174,
        defaultColor: '#9C6844',
        shapes: [
          {
            kind: 'path',
            d: 'M 212 166 C 242 150 262 158 260 184 C 256 206 232 214 214 202 Z',
          },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 218,
        defaultColor: '#9C6844',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 218, rx: 64, ry: 58 }],
      },
      {
        id: 'chest',
        label: 'Belly',
        cx: 160,
        cy: 222,
        defaultColor: '#F39237',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 222, rx: 38, ry: 36 }],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'ellipse', cx: 122, cy: 274, rx: 24, ry: 15 },
          { kind: 'ellipse', cx: 198, cy: 274, rx: 24, ry: 15 },
        ],
      },
      {
        id: 'ears',
        label: 'Ears',
        cx: 160,
        cy: 112,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'circle', cx: 100, cy: 112, r: 16 },
          { kind: 'circle', cx: 220, cy: 112, r: 16 },
        ],
      },
      {
        id: 'head',
        label: 'Head',
        cx: 160,
        cy: 112,
        defaultColor: '#9C6844',
        shapes: [{ kind: 'circle', cx: 160, cy: 112, r: 54 }],
      },
      {
        id: 'face',
        label: 'Face',
        cx: 160,
        cy: 124,
        defaultColor: '#F39237',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 124, rx: 38, ry: 30 }],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="143" cy="112" r="6.5" fill={INK} />
        <Circle cx="177" cy="112" r="6.5" fill={INK} />
        <Circle cx="145" cy="109.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="179" cy="109.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="128" cy="126" r="6.5" fill="rgba(240, 130, 168, 0.35)" />
        <Circle cx="192" cy="126" r="6.5" fill="rgba(240, 130, 168, 0.35)" />
        <Circle cx="154" cy="124" r="2.4" fill={INK} />
        <Circle cx="166" cy="124" r="2.4" fill={INK} />
        <Path
          d="M 142 135 Q 160 148 178 135"
          fill="none"
          stroke={INK}
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  // === NEW PAGE 7: PLAYFUL MONKEY ===
  {
    id: 'monkey',
    title: 'Playful Monkey',
    animal: 'monkey',
    badgeColor: '#F3C78F',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    regions: [
      {
        id: 'leaf',
        label: 'Jungle Leaf',
        cx: 54,
        cy: 56,
        defaultColor: '#5BB55E',
        shapes: [
          {
            kind: 'path',
            d: 'M 22 46 Q 58 20 88 54 Q 60 88 22 46 Z',
          },
        ],
      },
      {
        id: 'banana',
        label: 'Banana',
        cx: 268,
        cy: 74,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 254 38 C 282 52 292 84 274 108 C 262 114 252 106 258 94 C 266 78 262 58 246 48 Z',
          },
        ],
      },
      {
        id: 'grass',
        label: 'Grass',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'tail',
        label: 'Curly Tail',
        cx: 256,
        cy: 204,
        defaultColor: '#9C6844',
        shapes: [
          {
            kind: 'path',
            d: 'M 212 238 C 254 246 290 218 282 182 C 276 158 250 156 244 176 C 242 188 256 196 264 188 C 270 202 252 222 214 220 Z',
          },
        ],
      },
      {
        id: 'ears',
        label: 'Big Ears',
        cx: 160,
        cy: 112,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'circle', cx: 96, cy: 112, r: 22 },
          { kind: 'circle', cx: 224, cy: 112, r: 22 },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 224,
        defaultColor: '#9C6844',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 224, rx: 56, ry: 52 }],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 160,
        cy: 228,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 228, rx: 32, ry: 32 }],
      },
      {
        id: 'paws',
        label: 'Paws',
        cx: 160,
        cy: 274,
        defaultColor: '#F39237',
        shapes: [
          { kind: 'ellipse', cx: 124, cy: 274, rx: 22, ry: 14 },
          { kind: 'ellipse', cx: 196, cy: 274, rx: 22, ry: 14 },
        ],
      },
      {
        id: 'head',
        label: 'Head',
        cx: 160,
        cy: 114,
        defaultColor: '#9C6844',
        shapes: [{ kind: 'circle', cx: 160, cy: 114, r: 52 }],
      },
      {
        id: 'face',
        label: 'Face',
        cx: 160,
        cy: 126,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 160 100 C 174 88 196 96 196 116 C 196 122 194 128 198 134 C 202 150 184 162 160 162 C 136 162 118 150 122 134 C 126 128 124 122 124 116 C 124 96 146 88 160 100 Z',
          },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        {/* Hair tuft */}
        <Path
          d="M 156 62 Q 160 44 170 56 Q 178 48 174 64"
          fill="none"
          stroke={INK}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="142" cy="116" r="6.5" fill={INK} />
        <Circle cx="178" cy="116" r="6.5" fill={INK} />
        <Circle cx="144" cy="113.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="180" cy="113.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="130" cy="134" r="6.5" fill="rgba(240, 130, 168, 0.4)" />
        <Circle cx="190" cy="134" r="6.5" fill="rgba(240, 130, 168, 0.4)" />
        <Circle cx="155" cy="130" r="2.2" fill={INK} />
        <Circle cx="165" cy="130" r="2.2" fill={INK} />
        <Path
          d="M 142 142 Q 160 156 178 142"
          fill="none"
          stroke={INK}
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  // === NEW PAGE 8: BOUNCY FROG ===
  {
    id: 'frog',
    title: 'Bouncy Frog',
    animal: 'frog',
    badgeColor: '#A8E29B',
    backdrop: STORYBOOK_ASSETS.bgClearing,
    regions: [
      {
        id: 'pond',
        label: 'Pond Water',
        cx: 160,
        cy: 292,
        defaultColor: '#4DAAD8',
        shapes: [
          { kind: 'path', d: 'M 8 264 Q 160 256 312 264 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'lilypad',
        label: 'Lily Pad',
        cx: 160,
        cy: 266,
        defaultColor: '#5BB55E',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 266, rx: 120, ry: 26 }],
      },
      {
        id: 'flower',
        label: 'Lotus Flower',
        cx: 58,
        cy: 234,
        defaultColor: '#F082A8',
        shapes: [
          {
            kind: 'path',
            d: 'M 58 206 C 68 220 74 236 58 248 C 42 236 48 220 58 206 Z',
          },
          {
            kind: 'path',
            d: 'M 32 222 C 48 224 60 236 54 248 C 36 248 28 236 32 222 Z',
          },
          {
            kind: 'path',
            d: 'M 84 222 C 68 224 56 236 62 248 C 80 248 88 236 84 222 Z',
          },
        ],
      },
      {
        id: 'left-leg',
        label: 'Left Leg',
        cx: 88,
        cy: 226,
        defaultColor: '#5BB55E',
        shapes: [{ kind: 'ellipse', cx: 92, cy: 228, rx: 32, ry: 26 }],
      },
      {
        id: 'right-leg',
        label: 'Right Leg',
        cx: 232,
        cy: 226,
        defaultColor: '#5BB55E',
        shapes: [{ kind: 'ellipse', cx: 228, cy: 228, rx: 32, ry: 26 }],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 160,
        cy: 204,
        defaultColor: '#5BB55E',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 204, rx: 66, ry: 52 }],
      },
      {
        id: 'belly',
        label: 'Tummy',
        cx: 160,
        cy: 212,
        defaultColor: '#FAD44A',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 212, rx: 42, ry: 34 }],
      },
      {
        id: 'head',
        label: 'Frog Head',
        cx: 160,
        cy: 134,
        defaultColor: '#5BB55E',
        shapes: [{ kind: 'ellipse', cx: 160, cy: 134, rx: 66, ry: 44 }],
      },
      {
        id: 'eyes',
        label: 'Pop-up Eyes',
        cx: 160,
        cy: 86,
        defaultColor: '#FAD44A',
        shapes: [
          { kind: 'circle', cx: 120, cy: 88, r: 25 },
          { kind: 'circle', cx: 200, cy: 88, r: 25 },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="120" cy="88" r="14" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
        <Circle cx="200" cy="88" r="14" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
        <Circle cx="122" cy="88" r="7.5" fill={INK} />
        <Circle cx="198" cy="88" r="7.5" fill={INK} />
        <Circle cx="124.5" cy="85" r="2.6" fill="#FFFFFF" />
        <Circle cx="200.5" cy="85" r="2.6" fill="#FFFFFF" />
        <Circle cx="112" cy="140" r="8.5" fill="rgba(240, 130, 168, 0.4)" />
        <Circle cx="208" cy="140" r="8.5" fill="rgba(240, 130, 168, 0.4)" />
        <Circle cx="152" cy="124" r="2.4" fill={INK} />
        <Circle cx="168" cy="124" r="2.4" fill={INK} />
        <Path
          d="M 122 142 Q 160 166 198 142"
          fill="none"
          stroke={INK}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      </G>
    ),
  },
  // === NEW PAGE 9: SWEET PANDA ===
  {
    id: 'panda',
    title: 'Sweet Panda',
    animal: 'panda',
    badgeColor: '#C9E6C5',
    backdrop: STORYBOOK_ASSETS.bgSanctuary,
    regions: [
      {
        id: 'bamboo',
        label: 'Bamboo',
        cx: 274,
        cy: 138,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'path', d: 'M 268 38 L 284 38 L 284 268 L 268 268 Z' },
          { kind: 'path', d: 'M 268 78 Q 240 60 232 82 Q 248 96 268 86 Z' },
          { kind: 'path', d: 'M 284 114 Q 308 98 312 118 Q 298 130 284 122 Z' },
        ],
      },
      {
        id: 'meadow',
        label: 'Meadow',
        cx: 160,
        cy: 292,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'ears',
        label: 'Panda Ears',
        cx: 152,
        cy: 68,
        defaultColor: '#9B74D4',
        shapes: [
          { kind: 'circle', cx: 102, cy: 70, r: 22 },
          { kind: 'circle', cx: 202, cy: 70, r: 22 },
        ],
      },
      {
        id: 'arms',
        label: 'Panda Arms',
        cx: 152,
        cy: 204,
        defaultColor: '#9B74D4',
        shapes: [
          { kind: 'ellipse', cx: 88, cy: 204, rx: 26, ry: 34 },
          { kind: 'ellipse', cx: 216, cy: 204, rx: 26, ry: 34 },
        ],
      },
      {
        id: 'body',
        label: 'Body',
        cx: 152,
        cy: 222,
        defaultColor: '#FFFDF7',
        shapes: [{ kind: 'ellipse', cx: 152, cy: 222, rx: 60, ry: 54 }],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 152,
        cy: 228,
        defaultColor: '#F082A8',
        shapes: [{ kind: 'ellipse', cx: 152, cy: 228, rx: 34, ry: 32 }],
      },
      {
        id: 'paws',
        label: 'Paws',
        cx: 152,
        cy: 274,
        defaultColor: '#9B74D4',
        shapes: [
          { kind: 'ellipse', cx: 114, cy: 274, rx: 24, ry: 16 },
          { kind: 'ellipse', cx: 190, cy: 274, rx: 24, ry: 16 },
        ],
      },
      {
        id: 'head',
        label: 'Head',
        cx: 152,
        cy: 120,
        defaultColor: '#FFFDF7',
        shapes: [{ kind: 'circle', cx: 152, cy: 120, r: 54 }],
      },
      {
        id: 'patches',
        label: 'Eye Patches',
        cx: 152,
        cy: 118,
        defaultColor: '#9B74D4',
        shapes: [
          { kind: 'ellipse', cx: 128, cy: 118, rx: 17, ry: 20 },
          { kind: 'ellipse', cx: 176, cy: 118, rx: 17, ry: 20 },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="130" cy="116" r="7.5" fill={INK} stroke="#FFFFFF" strokeWidth="2.4" />
        <Circle cx="174" cy="116" r="7.5" fill={INK} stroke="#FFFFFF" strokeWidth="2.4" />
        <Circle cx="132" cy="113.5" r="2.4" fill="#FFFFFF" />
        <Circle cx="176" cy="113.5" r="2.4" fill="#FFFFFF" />
        <Circle cx="114" cy="136" r="7" fill="rgba(240, 130, 168, 0.45)" />
        <Circle cx="190" cy="136" r="7" fill="rgba(240, 130, 168, 0.45)" />
        <Ellipse cx="152" cy="134" rx="9" ry="6" fill={INK} />
        <Path
          d="M 152 140 L 152 146 M 139 147 Q 145 154 152 146 Q 159 154 165 147"
          fill="none"
          stroke={INK}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    ),
  },
  // === NEW PAGE 10: RAINBOW TURTLE (Chunky Mosaic Shell!) ===
  {
    id: 'turtle',
    title: 'Rainbow Turtle',
    animal: 'turtle',
    badgeColor: '#96DFD0',
    backdrop: STORYBOOK_ASSETS.bgAquarium,
    regions: [
      {
        id: 'bubbles',
        label: 'Bubbles',
        cx: 60,
        cy: 76,
        defaultColor: '#4DAAD8',
        shapes: [
          { kind: 'circle', cx: 66, cy: 62, r: 16 },
          { kind: 'circle', cx: 44, cy: 96, r: 12 },
          { kind: 'circle', cx: 88, cy: 92, r: 9 },
        ],
      },
      {
        id: 'sand',
        label: 'Ocean Floor',
        cx: 160,
        cy: 288,
        defaultColor: '#FAD44A',
        shapes: [
          { kind: 'path', d: 'M 8 268 Q 160 254 312 268 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'head',
        label: 'Turtle Head',
        cx: 262,
        cy: 176,
        defaultColor: '#5BB55E',
        shapes: [
          {
            kind: 'path',
            d: 'M 218 192 C 232 162 252 144 274 148 C 298 152 308 176 296 198 C 284 218 256 222 222 214 Z',
          },
        ],
      },
      {
        id: 'flippers',
        label: 'Flippers',
        cx: 152,
        cy: 248,
        defaultColor: '#5BB55E',
        shapes: [
          { kind: 'ellipse', cx: 92, cy: 248, rx: 28, ry: 17 },
          { kind: 'ellipse', cx: 204, cy: 248, rx: 32, ry: 18 },
          { kind: 'path', d: 'M 54 206 Q 28 214 38 228 Q 52 232 62 220 Z' },
        ],
      },
      {
        id: 'shell-rim',
        label: 'Shell Rim',
        cx: 146,
        cy: 224,
        defaultColor: '#FAD44A',
        shapes: [
          {
            kind: 'path',
            d: 'M 52 212 Q 146 204 236 212 Q 240 232 222 236 Q 146 244 64 236 Q 48 232 52 212 Z',
          },
        ],
      },
      {
        id: 'shell-left',
        label: 'Left Shell',
        cx: 86,
        cy: 182,
        defaultColor: '#E85A50',
        shapes: [
          {
            kind: 'path',
            d: 'M 56 210 C 56 164 82 134 114 128 L 116 208 Z',
          },
        ],
      },
      {
        id: 'shell-right',
        label: 'Right Shell',
        cx: 204,
        cy: 182,
        defaultColor: '#9B74D4',
        shapes: [
          {
            kind: 'path',
            d: 'M 232 210 C 232 164 206 134 174 128 L 172 208 Z',
          },
        ],
      },
      {
        id: 'shell-center',
        label: 'Center Shell',
        cx: 144,
        cy: 184,
        defaultColor: '#4DAAD8',
        shapes: [
          {
            kind: 'path',
            d: 'M 114 156 L 174 156 L 174 208 L 114 208 Z',
          },
        ],
      },
      {
        id: 'shell-top',
        label: 'Top Shell',
        cx: 144,
        cy: 132,
        defaultColor: '#F39237',
        shapes: [
          {
            kind: 'path',
            d: 'M 114 128 Q 144 108 174 128 L 174 156 L 114 156 Z',
          },
        ],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        <Circle cx="272" cy="172" r="6.5" fill={INK} />
        <Circle cx="274.2" cy="169.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="282" cy="188" r="6.5" fill="rgba(240, 130, 168, 0.45)" />
        <Path
          d="M 254 194 Q 272 206 288 194"
          fill="none"
          stroke={INK}
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </G>
    ),
  },
];

function loadSavedCompletedPages(): string[] {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveCompletedPages(ids: string[]): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_PAGES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

function loadSavedArtwork(): SavedArtworkState {
  const empty: SavedArtworkState = {
    fillsByPage: {},
    strokesByPage: {},
    stampsByPage: {},
  };
  if (Platform.OS !== 'web' || typeof window === 'undefined') return empty;
  try {
    const raw = window.localStorage.getItem(SAVED_ARTWORK_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SavedArtworkState>;
    return {
      fillsByPage: parsed.fillsByPage && typeof parsed.fillsByPage === 'object' ? parsed.fillsByPage : {},
      strokesByPage: parsed.strokesByPage && typeof parsed.strokesByPage === 'object' ? parsed.strokesByPage : {},
      stampsByPage: parsed.stampsByPage && typeof parsed.stampsByPage === 'object' ? parsed.stampsByPage : {},
    };
  } catch {
    return empty;
  }
}

function saveArtworkState(art: SavedArtworkState): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVED_ARTWORK_KEY, JSON.stringify(art));
  } catch {
    // Ignore quota errors
  }
}

function buildStrokePathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${(p.x + 0.2).toFixed(1)} ${(p.y + 0.2).toFixed(1)}`;
  }
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }
  return d;
}

function resolveDomElement(node: unknown): HTMLElement | null {
  if (!node) return null;
  const raw = node as {
    addEventListener?: HTMLElement['addEventListener'];
    getBoundingClientRect?: () => DOMRect;
    getNode?: () => HTMLElement;
  };
  if (typeof raw.getBoundingClientRect === 'function') {
    return raw as unknown as HTMLElement;
  }
  if (typeof raw.getNode === 'function') {
    return raw.getNode();
  }
  return null;
}

/** Crisp zero-gradient storybook SVG sticker artwork (centered at 0,0 in ~48x48 space) */
function renderStampGraphic(kind: StampKind) {
  switch (kind) {
    case 'star':
      return (
        <G>
          <Path
            d="M 0 -20 L 5.8 -6.6 L 20 -5.2 L 9.2 4.2 L 12.4 18.4 L 0 11 L -12.4 18.4 L -9.2 4.2 L -20 -5.2 L -5.8 -6.6 Z"
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
          <Path d="M -18 8 A 18 18 0 0 1 18 8" fill="none" stroke="#E85A50" strokeWidth="6" strokeLinecap="round" />
          <Path d="M -13 8 A 13 13 0 0 1 13 8" fill="none" stroke="#FAD44A" strokeWidth="5.5" strokeLinecap="round" />
          <Path d="M -8 8 A 8 8 0 0 1 8 8" fill="none" stroke="#4DAAD8" strokeWidth="5" strokeLinecap="round" />
          <Circle cx="-16" cy="10" r="6" fill="#FFFDF7" stroke={INK} strokeWidth="2.2" />
          <Circle cx="16" cy="10" r="6" fill="#FFFDF7" stroke={INK} strokeWidth="2.2" />
        </G>
      );
    case 'sun':
      return (
        <G>
          <Path
            d="M 0 -20 L 0 -15 M 0 15 L 0 20 M -20 0 L -15 0 M 15 0 L 20 0 M -14 -14 L -10.5 -10.5 M 10.5 10.5 L 14 14 M 14 -14 L 10.5 -10.5 M -10.5 10.5 L -14 14"
            stroke="#F39237"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <Circle cx="0" cy="0" r="12" fill="#FAD44A" stroke={INK} strokeWidth="2.6" />
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
          <Circle cx="0" cy="4" r="3" fill="#E85A50" />
          <Circle cx="-10" cy="6" r="2.2" fill="#4DAAD8" />
          <Circle cx="10" cy="6" r="2.2" fill="#5BB55E" />
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
          {/* Active glow pill behind selected crayon */}
          {active && (
            <Path
              d="M 8 50 L 8 18 L 22 2 L 36 18 L 36 50 Z"
              fill="#FFF4BE"
              stroke={COLORS.woodDark}
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
          )}
          {/* Wax tip */}
          <Path
            d="M 11 19 L 20 5 Q 22 3 24 5 L 33 19 Z"
            fill={crayon.isRainbow ? '#E85A50' : crayon.hex}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Crayon body */}
          {crayon.isRainbow ? (
            <G>
              <Path d="M 10 19 L 34 19 L 34 27 L 10 27 Z" fill="#F39237" />
              <Path d="M 10 27 L 34 27 L 34 35 L 10 35 Z" fill="#FAD44A" />
              <Path d="M 10 35 L 34 35 L 34 42 L 10 42 Z" fill="#5BB55E" />
              <Path d="M 10 42 L 34 42 L 34 49 L 10 49 Z" fill="#4DAAD8" />
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
              {/* Paper wrapper band */}
              <Path
                d="M 11 26 L 33 26 L 33 41 L 11 41 Z"
                fill="rgba(255,253,247,0.42)"
              />
              <Path d="M 11 26 L 33 26 M 11 41 L 33 41" stroke={INK} strokeWidth="2.2" />
              <Ellipse cx="22" cy="33.5" rx="6" ry="3.5" fill={INK} opacity={0.28} />
            </G>
          )}
          {/* Specular shine on left edge */}
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

/** Floating celebratory "Masterpiece!" banner when all regions on a page are colored */
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
            {
              scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
            },
            {
              translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.masterpieceText}>⭐ {title} Masterpiece! ⭐</Text>
    </Animated.View>
  );
});

/**
 * Zoo Coloring 2.0 (Free Tier):
 * - 10 chunky storybook coloring pages across all zoo habitats
 * - Three toddler-friendly modes:
 *   1. 🪣 Tap & Slide-to-Fill (0ms touchstart + drag finger across shapes!)
 *   2. 🖍️ Crayon Draw with Small/Med/Big sizes & crisp outlines layered ABOVE strokes
 *   3. ⭐ Storybook Sticker Stamps (8 crisp SVG stickers!)
 * - 🪄 Magic Wand (colors next blank spot in its storybook color, or rainbow sparkle!)
 * - Auto-saves all artwork to localStorage + undoable Clear button
 * - Musical crayon notes + Hear Animal button for interactive animal bounce & sound
 * - Zero SVG ClipPaths or Gradients for rock-solid Android & iPad rendering
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

  const rainbowIdxRef = useRef(0);
  const pageCelebrateAnim = useRef(new Animated.Value(1)).current;

  const page = COLORING_PAGES[pageIdx % COLORING_PAGES.length];
  const currentFills = fillsByPage[page.id] || {};
  const currentStrokes = strokesByPage[page.id] || [];
  const currentStamps = stampsByPage[page.id] || [];
  const currentHistory = historyByPage[page.id] || [];
  const selectedCrayon =
    CRAYONS.find((c) => c.id === selectedCrayonId) || CRAYONS[2];
  const activeBrushWidth =
    BRUSH_SIZES.find((b) => b.key === brushSizeKey)?.width ?? 20;

  // Persist artwork gently whenever fills, strokes, or stamps change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveArtworkState({ fillsByPage, strokesByPage, stampsByPage });
    }, 280);
    return () => clearTimeout(timer);
  }, [fillsByPage, strokesByPage, stampsByPage]);

  const coloredRegionCount = useMemo(
    () =>
      page.regions.filter(
        (r) => Boolean(currentFills[r.id]) && currentFills[r.id] !== PAPER_WHITE
      ).length,
    [currentFills, page.regions]
  );

  // Larger, immersive coloring paper on tablets while keeping zero overflow on phones
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
    if (selectedCrayon.isRainbow) {
      const hex = RAINBOW_CYCLE[rainbowIdxRef.current % RAINBOW_CYCLE.length];
      rainbowIdxRef.current += 1;
      return hex;
    }
    return selectedCrayon.hex;
  }, [selectedCrayon]);

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

  const fillRegion = useCallback(
    (region: ColoringRegion, overrideColor?: string, silentNote = false) => {
      soundEngine.unlock();
      const color = overrideColor ?? nextActiveColor();
      if (!silentNote) {
        soundEngine.playNote(selectedCrayon.noteFreq);
      }

      const scale = canvasSize / CANVAS_VB;
      setBurstPos({
        x: region.cx * scale,
        y: region.cy * scale,
        tick: Date.now(),
      });

      setFillsByPage((prev) => {
        const pageMap = prev[page.id] || {};
        const prevColor = pageMap[region.id];
        const nextPageMap = { ...pageMap, [region.id]: color };

        setHistoryByPage((hPrev) => ({
          ...hPrev,
          [page.id]: [
            ...(hPrev[page.id] || []),
            { kind: 'fill' as const, regionId: region.id, prevColor },
          ].slice(-36),
        }));

        const allColored = page.regions.every(
          (r) => Boolean(nextPageMap[r.id]) && nextPageMap[r.id] !== PAPER_WHITE
        );
        if (allColored && !celebratedThisVisit[page.id]) {
          setTimeout(() => triggerPageMasterpiece(page), 180);
        }

        return { ...prev, [page.id]: nextPageMap };
      });
    },
    [
      canvasSize,
      celebratedThisVisit,
      nextActiveColor,
      page,
      selectedCrayon.noteFreq,
      triggerPageMasterpiece,
    ]
  );

  const placeStampAt = useCallback(
    (vbPt: { x: number; y: number }) => {
      soundEngine.unlock();
      soundEngine.playStamp();
      const stampId = `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const rotation = Math.round((Math.random() - 0.5) * 26);
      const scaleVal = isTablet ? 0.96 : 0.92;

      const newStamp: PlacedStamp = {
        id: stampId,
        kind: selectedStamp,
        x: vbPt.x,
        y: vbPt.y,
        rotation,
        scale: scaleVal,
      };

      const scale = canvasSize / CANVAS_VB;
      setBurstPos({
        x: vbPt.x * scale,
        y: vbPt.y * scale,
        tick: Date.now(),
      });

      setStampsByPage((prev) => ({
        ...prev,
        [page.id]: [...(prev[page.id] || []), newStamp].slice(-28),
      }));
      setHistoryByPage((prev) => ({
        ...prev,
        [page.id]: [
          ...(prev[page.id] || []),
          { kind: 'stamp' as const, stampId },
        ].slice(-36),
      }));
    },
    [canvasSize, isTablet, page.id, selectedStamp]
  );

  const handleMagicWand = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playMagicWand();
    const pageMap = fillsByPage[page.id] || {};
    const nextBlank = page.regions.find(
      (r) => !pageMap[r.id] || pageMap[r.id] === PAPER_WHITE
    );
    if (nextBlank) {
      fillRegion(nextBlank, nextBlank.defaultColor, true);
      return;
    }
    // Page already full! Give a playful rainbow sparkle celebration + animal sound!
    const pick = page.regions[Math.floor(Math.random() * page.regions.length)];
    const funHex = RAINBOW_CYCLE[rainbowIdxRef.current % RAINBOW_CYCLE.length];
    rainbowIdxRef.current += 1;
    fillRegion(pick, funHex, true);
    bouncePageJoyfully();
    setTimeout(() => soundEngine.playAnimalSound(page.animal), 180);
  }, [bouncePageJoyfully, fillRegion, fillsByPage, page]);

  const handleHearAnimal = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playAnimalSound(page.animal);
    soundEngine.speakWord(page.title);
    bouncePageJoyfully();
    const scale = canvasSize / CANVAS_VB;
    setBurstPos({
      x: 160 * scale,
      y: 120 * scale,
      tick: Date.now(),
    });
  }, [bouncePageJoyfully, canvasSize, page.animal, page.title]);

  const handleUndo = useCallback(() => {
    soundEngine.playCardFlip();
    const list = historyByPage[page.id] || [];
    if (list.length === 0) return;
    const last = list[list.length - 1];
    setHistoryByPage((prev) => ({
      ...prev,
      [page.id]: list.slice(0, -1),
    }));

    if (last.kind === 'fill' && last.regionId) {
      setFillsByPage((prev) => {
        const pageMap = { ...(prev[page.id] || {}) };
        if (last.prevColor) {
          pageMap[last.regionId!] = last.prevColor;
        } else {
          delete pageMap[last.regionId!];
        }
        return { ...prev, [page.id]: pageMap };
      });
    } else if (last.kind === 'stroke' && last.strokeId) {
      setStrokesByPage((prev) => ({
        ...prev,
        [page.id]: (prev[page.id] || []).filter((s) => s.id !== last.strokeId),
      }));
    } else if (last.kind === 'stamp' && last.stampId) {
      setStampsByPage((prev) => ({
        ...prev,
        [page.id]: (prev[page.id] || []).filter((s) => s.id !== last.stampId),
      }));
    } else if (last.kind === 'clear') {
      setFillsByPage((prev) => ({ ...prev, [page.id]: last.prevFills || {} }));
      setStrokesByPage((prev) => ({ ...prev, [page.id]: last.prevStrokes || [] }));
      setStampsByPage((prev) => ({ ...prev, [page.id]: last.prevStamps || [] }));
    }
  }, [historyByPage, page.id]);

  const handleClearPage = useCallback(() => {
    const prevFills = fillsByPage[page.id] || {};
    const prevStrokes = strokesByPage[page.id] || [];
    const prevStamps = stampsByPage[page.id] || [];
    const hasAnything =
      Object.keys(prevFills).length > 0 ||
      prevStrokes.length > 0 ||
      prevStamps.length > 0;
    if (!hasAnything) return;

    soundEngine.playGentleBounce();
    setHistoryByPage((prev) => ({
      ...prev,
      [page.id]: [
        ...(prev[page.id] || []),
        {
          kind: 'clear' as const,
          prevFills: { ...prevFills },
          prevStrokes: [...prevStrokes],
          prevStamps: [...prevStamps],
        },
      ].slice(-36),
    }));
    setFillsByPage((prev) => ({ ...prev, [page.id]: {} }));
    setStrokesByPage((prev) => ({ ...prev, [page.id]: [] }));
    setStampsByPage((prev) => ({ ...prev, [page.id]: [] }));
    setCelebratedThisVisit((prev) => ({ ...prev, [page.id]: false }));
  }, [fillsByPage, page.id, stampsByPage, strokesByPage]);

  // =========================================================================
  // DIRECT NON-PASSIVE DOM TOUCH ENGINE
  // - Tap & Slide-to-Paint in Fill mode
  // - Smooth Crayon Strokes in Draw mode
  // - Instant Sticker Stamping in Stamp mode
  // =========================================================================
  const canvasDomRef = useRef<HTMLElement | null>(null);
  const [canvasDomNode, setCanvasDomNode] = useState<HTMLElement | null>(null);
  const lastTouchAtRef = useRef(0);
  const winCleanupRef = useRef<(() => void) | null>(null);

  const drawingRef = useRef<{
    active: boolean;
    mode: 'touch' | 'pointer' | 'native';
    id: number;
    strokeId: string;
    lastPt: { x: number; y: number };
    distSinceHue: number;
  } | null>(null);

  const fillSlideRef = useRef<{
    mode: 'touch' | 'pointer';
    id: number;
    lastRegionId: string | null;
  } | null>(null);

  const [savedToast, setSavedToast] = useState(false);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCanvasRef = useCallback((node: React.ComponentRef<typeof View> | null) => {
    if (Platform.OS !== 'web') return;
    const el = resolveDomElement(node);
    canvasDomRef.current = el;
    setCanvasDomNode((prev) => (prev === el ? prev : el));
  }, []);

  const handleSaveArtwork = useCallback(async () => {
    soundEngine.unlock();
    soundEngine.playStarCollect(3);
    soundEngine.speakWord('Picture saved!');
    bouncePageJoyfully();
    setSavedToast(true);
    if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    saveToastTimerRef.current = setTimeout(() => setSavedToast(false), 2300);

    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const svgEl = canvasDomRef.current?.querySelector('svg');
    if (!svgEl) return;

    try {
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', '900');
      clone.setAttribute('height', '900');
      const svgXml = new XMLSerializer().serializeToString(clone);
      const svgUrl =
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG load failed'));
        img.src = svgUrl;
      });

      const outW = 1024;
      const outH = 1136;
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Warm storybook cream & wood keepsake frame
      ctx.fillStyle = '#E3B97E';
      ctx.fillRect(0, 0, outW, outH);
      ctx.strokeStyle = '#8C5B32';
      ctx.lineWidth = 18;
      ctx.strokeRect(9, 9, outW - 18, outH - 18);

      // Inner white coloring paper
      const pad = 62;
      const artSz = outW - pad * 2;
      ctx.fillStyle = '#FFFDF8';
      ctx.fillRect(pad, pad, artSz, artSz);
      ctx.strokeStyle = '#C68C52';
      ctx.lineWidth = 6;
      ctx.strokeRect(pad, pad, artSz, artSz);

      ctx.drawImage(img, pad, pad, artSz, artSz);

      // Signature footer
      ctx.fillStyle = '#4A3525';
      ctx.font = '900 38px system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(page.title, pad, outH - 64);

      ctx.fillStyle = '#7A542E';
      ctx.font = '800 26px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText("★ Painted in Whit's World", outW - pad, outH - 64);

      const fileName = `whits-world-${page.id}.png`;
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), 'image/png')
      );
      if (!blob) return;

      // On iPad/iPhone Safari, offer native Share/Save-to-Photos sheet; everywhere else download PNG cleanly
      const isAppleTouch =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const navShare = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (isAppleTouch && typeof navShare.share === 'function' && typeof navShare.canShare === 'function') {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navShare.canShare({ files: [file] })) {
          try {
            await navShare.share({
              files: [file],
              title: `${page.title} — Whit's World`,
            });
            return;
          } catch {
            // User dismissed share sheet or fallback to download
          }
        }
      }

      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
    } catch {
      // Ignore export error safely
    }
  }, [bouncePageJoyfully, page.id, page.title]);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cleanupWinListeners();
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    },
    [cleanupWinListeners]
  );

  const clientToViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = canvasDomRef.current?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: CANVAS_VB / 2, y: CANVAS_VB / 2 };
    }
    const x = ((clientX - rect.left) / rect.width) * CANVAS_VB;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_VB;
    return {
      x: Math.max(6, Math.min(CANVAS_VB - 6, x)),
      y: Math.max(6, Math.min(CANVAS_VB - 6, y)),
    };
  }, []);

  const findRegionFromClientPoint = useCallback(
    (clientX: number, clientY: number, allowFallback = true): ColoringRegion | null => {
      if (typeof document !== 'undefined') {
        let el = document.elementFromPoint(clientX, clientY) as Element | null;
        let depth = 0;
        while (el && depth < 8) {
          const idAttr = el.getAttribute?.('id') || '';
          if (idAttr.startsWith('fill-region-')) {
            const rid = idAttr.replace('fill-region-', '');
            const found = page.regions.find((r) => r.id === rid);
            if (found) return found;
          }
          el = el.parentElement;
          depth++;
        }
      }
      if (!allowFallback) return null;
      const vb = clientToViewBox(clientX, clientY);
      let best: ColoringRegion | null = null;
      let bestDist = 52;
      for (const r of page.regions) {
        const d = Math.hypot(vb.x - r.cx, vb.y - r.cy);
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      return best;
    },
    [clientToViewBox, page.regions]
  );

  const startStrokeAt = useCallback(
    (mode: 'touch' | 'pointer' | 'native', id: number, vbPt: { x: number; y: number }) => {
      soundEngine.unlock();
      const color = nextActiveColor();
      const strokeId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newStroke: DrawStroke = {
        id: strokeId,
        color,
        width: activeBrushWidth,
        points: [vbPt],
      };

      drawingRef.current = {
        active: true,
        mode,
        id,
        strokeId,
        lastPt: vbPt,
        distSinceHue: 0,
      };

      setStrokesByPage((prev) => ({
        ...prev,
        [page.id]: [...(prev[page.id] || []), newStroke],
      }));
      setHistoryByPage((prev) => ({
        ...prev,
        [page.id]: [
          ...(prev[page.id] || []),
          { kind: 'stroke' as const, strokeId },
        ].slice(-36),
      }));
    },
    [activeBrushWidth, nextActiveColor, page.id]
  );

  const extendStrokeTo = useCallback(
    (vbPt: { x: number; y: number }) => {
      const dr = drawingRef.current;
      if (!dr || !dr.active) return;
      const stepDist = Math.hypot(vbPt.x - dr.lastPt.x, vbPt.y - dr.lastPt.y);
      if (stepDist < 2.5) return;

      if (selectedCrayon.isRainbow && dr.distSinceHue + stepDist >= 24) {
        const prevPt = dr.lastPt;
        const nextColor = nextActiveColor();
        const nextId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        dr.strokeId = nextId;
        dr.lastPt = vbPt;
        dr.distSinceHue = 0;

        setStrokesByPage((prev) => ({
          ...prev,
          [page.id]: [
            ...(prev[page.id] || []),
            {
              id: nextId,
              color: nextColor,
              width: activeBrushWidth,
              points: [prevPt, vbPt],
            },
          ],
        }));
        setHistoryByPage((prev) => ({
          ...prev,
          [page.id]: [
            ...(prev[page.id] || []),
            { kind: 'stroke' as const, strokeId: nextId },
          ].slice(-36),
        }));
        return;
      }

      dr.lastPt = vbPt;
      dr.distSinceHue += stepDist;
      const targetId = dr.strokeId;

      setStrokesByPage((prev) => {
        const list = prev[page.id] || [];
        if (list.length === 0) return prev;
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx === -1) return prev;
        const nextList = [...list];
        nextList[idx] = {
          ...nextList[idx],
          points: [...nextList[idx].points, vbPt],
        };
        return { ...prev, [page.id]: nextList };
      });
    },
    [activeBrushWidth, nextActiveColor, page.id, selectedCrayon.isRainbow]
  );

  const finishInteraction = useCallback(() => {
    drawingRef.current = null;
    fillSlideRef.current = null;
    cleanupWinListeners();
  }, [cleanupWinListeners]);

  const handlersRef = useRef({
    tool,
    fillRegion,
    placeStampAt,
    findRegionFromClientPoint,
    clientToViewBox,
    startStrokeAt,
    extendStrokeTo,
    finishInteraction,
  });
  handlersRef.current = {
    tool,
    fillRegion,
    placeStampAt,
    findRegionFromClientPoint,
    clientToViewBox,
    startStrokeAt,
    extendStrokeTo,
    finishInteraction,
  };

  const attachWindowDragListeners = useCallback(
    (mode: 'touch' | 'pointer', id: number, action: 'draw' | 'fill-slide') => {
      cleanupWinListeners();
      if (typeof window === 'undefined') return;

      const handleMoveCoords = (clientX: number, clientY: number) => {
        const h = handlersRef.current;
        if (action === 'draw') {
          h.extendStrokeTo(h.clientToViewBox(clientX, clientY));
        } else {
          const slide = fillSlideRef.current;
          if (!slide) return;
          const region = h.findRegionFromClientPoint(clientX, clientY, false);
          if (region && region.id !== slide.lastRegionId) {
            slide.lastRegionId = region.id;
            h.fillRegion(region);
          }
        }
      };

      if (mode === 'touch') {
        const findTouch = (list: TouchList) => {
          for (let i = 0; i < list.length; i++) {
            if (list[i].identifier === id) return list[i];
          }
          return null;
        };
        const onMove = (ev: TouchEvent) => {
          const t = findTouch(ev.touches) || findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          handleMoveCoords(t.clientX, t.clientY);
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          lastTouchAtRef.current = Date.now();
          handlersRef.current.finishInteraction();
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
          handleMoveCoords(ev.clientX, ev.clientY);
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          handlersRef.current.finishInteraction();
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
    [cleanupWinListeners]
  );

  // Direct non-passive DOM touchstart listener for instant tablet response
  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasDomNode) return;

    const onDomTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      lastTouchAtRef.current = Date.now();

      const h = handlersRef.current;
      if (h.tool === 'stamp') {
        h.placeStampAt(h.clientToViewBox(t.clientX, t.clientY));
        return;
      }
      if (h.tool === 'fill') {
        const region = h.findRegionFromClientPoint(t.clientX, t.clientY, true);
        if (region) {
          h.fillRegion(region);
        }
        fillSlideRef.current = {
          mode: 'touch',
          id: t.identifier,
          lastRegionId: region?.id ?? null,
        };
        attachWindowDragListeners('touch', t.identifier, 'fill-slide');
        return;
      }

      const vbPt = h.clientToViewBox(t.clientX, t.clientY);
      h.startStrokeAt('touch', t.identifier, vbPt);
      attachWindowDragListeners('touch', t.identifier, 'draw');
    };

    canvasDomNode.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      canvasDomNode.removeEventListener('touchstart', onDomTouchStart);
    };
  }, [attachWindowDragListeners, canvasDomNode]);

  const webCanvasProps =
    Platform.OS === 'web'
      ? ({
          onPointerDown: (e: {
            pointerId: number;
            pointerType?: string;
            clientX: number;
            clientY: number;
            preventDefault?: () => void;
          }) => {
            if (e.pointerType === 'touch') return;
            if (Date.now() - lastTouchAtRef.current < 700) return;
            e.preventDefault?.();

            const h = handlersRef.current;
            if (h.tool === 'stamp') {
              h.placeStampAt(h.clientToViewBox(e.clientX, e.clientY));
              return;
            }
            if (h.tool === 'fill') {
              const region = h.findRegionFromClientPoint(e.clientX, e.clientY, true);
              if (region) {
                h.fillRegion(region);
              }
              fillSlideRef.current = {
                mode: 'pointer',
                id: e.pointerId,
                lastRegionId: region?.id ?? null,
              };
              attachWindowDragListeners('pointer', e.pointerId, 'fill-slide');
              return;
            }
            const vbPt = h.clientToViewBox(e.clientX, e.clientY);
            h.startStrokeAt('pointer', e.pointerId, vbPt);
            attachWindowDragListeners('pointer', e.pointerId, 'draw');
          },
        } as Record<string, unknown>)
      : {};

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => handlersRef.current.tool !== 'fill',
      onMoveShouldSetPanResponder: () => handlersRef.current.tool === 'draw',
      onPanResponderGrant: (evt) => {
        const x = (evt.nativeEvent.locationX / Math.max(1, canvasSize)) * CANVAS_VB;
        const y = (evt.nativeEvent.locationY / Math.max(1, canvasSize)) * CANVAS_VB;
        if (handlersRef.current.tool === 'stamp') {
          handlersRef.current.placeStampAt({ x, y });
        } else {
          handlersRef.current.startStrokeAt('native', 0, { x, y });
        }
      },
      onPanResponderMove: (evt) => {
        if (handlersRef.current.tool !== 'draw') return;
        const x = (evt.nativeEvent.locationX / Math.max(1, canvasSize)) * CANVAS_VB;
        const y = (evt.nativeEvent.locationY / Math.max(1, canvasSize)) * CANVAS_VB;
        handlersRef.current.extendStrokeTo({ x, y });
      },
      onPanResponderRelease: () => handlersRef.current.finishInteraction(),
      onPanResponderTerminate: () => handlersRef.current.finishInteraction(),
    })
  ).current;

  const renderShapePrimitive = (
    shape: ShapeSpec,
    key: string,
    props: {
      id?: string;
      fill: string;
      stroke: string;
      strokeWidth: number;
      onPress?: () => void;
    }
  ) => {
    if (shape.kind === 'path') {
      return (
        <Path
          key={key}
          id={props.id}
          d={shape.d}
          fill={props.fill}
          stroke={props.stroke}
          strokeWidth={props.strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          onPress={props.onPress}
        />
      );
    }
    if (shape.kind === 'circle') {
      return (
        <Circle
          key={key}
          id={props.id}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill={props.fill}
          stroke={props.stroke}
          strokeWidth={props.strokeWidth}
          onPress={props.onPress}
        />
      );
    }
    return (
      <Ellipse
        key={key}
        id={props.id}
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        fill={props.fill}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        onPress={props.onPress}
      />
    );
  };

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
          const done = completedPages.includes(pg.id);
          const tabSz = isTablet ? 52 : 42;
          return (
            <TactileButton
              key={pg.id}
              onPress={() => {
                soundEngine.unlock();
                soundEngine.playAnimalSound(pg.animal);
                soundEngine.speakWord(pg.title);
                setPageIdx(idx);
                setBurstPos(null);
                setMasterpieceTick(0);
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
                  size={isTablet ? 40 : 32}
                />
                {done && (
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
          {
            transform: [{ scale: pageCelebrateAnim }],
          },
        ]}
      >
        <View
          ref={handleCanvasRef}
          style={[
            styles.paperInner,
            { width: canvasSize, height: canvasSize },
            Platform.OS === 'web'
              ? ({ touchAction: 'none', userSelect: 'none' } as unknown as object)
              : null,
          ]}
          {...(Platform.OS === 'web' ? webCanvasProps : nativePan.panHandlers)}
        >
          <Svg
            width={canvasSize}
            height={canvasSize}
            viewBox={`0 0 ${CANVAS_VB} ${CANVAS_VB}`}
          >
            {/* Layer 1: Tappable fillable regions with clean occluded storybook outlines */}
            <G>
              {page.regions.map((region) => {
                const fillColor = currentFills[region.id] || PAPER_WHITE;
                return (
                  <G key={region.id} id={`fill-region-${region.id}`}>
                    {region.shapes.map((shape, sIdx) =>
                      renderShapePrimitive(shape, `${region.id}-${sIdx}`, {
                        id: `fill-region-${region.id}`,
                        fill: fillColor,
                        stroke: INK,
                        strokeWidth: 4.5,
                        onPress:
                          Platform.OS !== 'web' && tool === 'fill'
                            ? () => fillRegion(region)
                            : undefined,
                      })
                    )}
                  </G>
                );
              })}
            </G>

            {/* Layer 2: Soft translucent waxy crayon strokes letting crisp outlines show through */}
            <G pointerEvents="none">
              {currentStrokes.map((st) => (
                <Path
                  key={st.id}
                  d={buildStrokePathD(st.points)}
                  fill="none"
                  stroke={st.color}
                  strokeWidth={st.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              ))}
            </G>

            {/* Layer 3: Adorable facial details & highlights always sharp on top */}
            {page.renderFaceOverlay()}

            {/* Layer 4: Placed storybook sticker stamps */}
            <G pointerEvents="none">
              {currentStamps.map((st) => (
                <G
                  key={st.id}
                  transform={`translate(${st.x.toFixed(1)}, ${st.y.toFixed(1)}) rotate(${st.rotation}) scale(${st.scale})`}
                >
                  {renderStampGraphic(st.kind)}
                </G>
              ))}
            </G>
          </Svg>

          {/* Sparkle pop when filling or stamping */}
          {burstPos && (
            <View
              key={burstPos.tick}
              pointerEvents="none"
              style={{ position: 'absolute', left: burstPos.x, top: burstPos.y, zIndex: 20 }}
            >
              <SnapBurst size={isTablet ? 96 : 74} />
            </View>
          )}

          {/* Celebratory Masterpiece Banner */}
          {masterpieceTick > 0 && (
            <MasterpieceBanner key={masterpieceTick} title={page.title} />
          )}
        </View>

        {/* Interactive Hear Animal Badge floating cleanly on paper frame (outside canvas touch listener) */}
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

      {/* Row 2: Action Tools (Magic Wand | Save Art | Undo | Clear) + Brush Sizes when in Draw mode */}
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

      {/* Row 3: Either 8 SVG Sticker Stamps (Stamp mode) or 10 SVG Crayons (Fill / Draw) */}
      {tool === 'stamp' ? (
        <View
          style={[
            styles.stampsGrid,
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
      {/* Full-bleed habitat-matched storybook backdrop */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={page.backdrop}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View style={styles.sunlitVeil} />
      </View>

      <GameHeader
        totalSteps={page.regions.length}
        completedSteps={coloredRegionCount}
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
    top: 15,
    left: 15,
    zIndex: 25,
  },
  hearAnimalPill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 249, 232, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.38)',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  hearAnimalText: {
    fontSize: 12,
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
    maxWidth: 320,
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
    maxWidth: 440,
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
