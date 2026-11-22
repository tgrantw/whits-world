import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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

type ToolMode = 'fill' | 'draw';

interface CrayonColor {
  id: string;
  name: string;
  hex: string;
  border: string;
  noteFreq: number;
  isRainbow?: boolean;
}

const CRAYONS: CrayonColor[] = [
  { id: 'red', name: 'Red', hex: '#E85A50', border: '#A8322B', noteFreq: 261.63 },
  { id: 'orange', name: 'Orange', hex: '#F39237', border: '#B55D16', noteFreq: 293.66 },
  { id: 'yellow', name: 'Yellow', hex: '#FAD44A', border: '#B89116', noteFreq: 329.63 },
  { id: 'green', name: 'Green', hex: '#5BB55E', border: '#327A36', noteFreq: 349.23 },
  { id: 'blue', name: 'Blue', hex: '#4DAAD8', border: '#257098', noteFreq: 392.0 },
  { id: 'purple', name: 'Purple', hex: '#9B74D4', border: '#64429E', noteFreq: 440.0 },
  { id: 'pink', name: 'Pink', hex: '#F082A8', border: '#B2496E', noteFreq: 493.88 },
  { id: 'brown', name: 'Brown', hex: '#9C6844', border: '#663E23', noteFreq: 523.25 },
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
  '#E85A50',
  '#F39237',
  '#FAD44A',
  '#5BB55E',
  '#4DAAD8',
  '#9B74D4',
  '#F082A8',
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
  shapes: ShapeSpec[];
}

interface ColoringPageSpec {
  id: string;
  title: string;
  animal: ExhibitAnimalKind;
  badgeColor: string;
  backdrop: typeof STORYBOOK_ASSETS.bgClearing;
  regions: ColoringRegion[];
  /** Fixed charming facial details drawn on top of fills & strokes */
  renderFaceOverlay: () => React.ReactNode;
}

interface DrawStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

interface HistoryEntry {
  kind: 'fill' | 'stroke';
  regionId?: string;
  prevColor?: string;
  strokeId?: string;
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
        shapes: [{ kind: 'circle', cx: 266, cy: 52, r: 28 }],
      },
      {
        id: 'grass',
        label: 'Grass',
        cx: 160,
        cy: 292,
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
        shapes: [{ kind: 'ellipse', cx: 160, cy: 228, rx: 64, ry: 54 }],
      },
      {
        id: 'belly',
        label: 'Belly',
        cx: 160,
        cy: 234,
        shapes: [{ kind: 'ellipse', cx: 160, cy: 234, rx: 36, ry: 34 }],
      },
      {
        id: 'paws',
        label: 'Paws',
        cx: 160,
        cy: 274,
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
        shapes: [{ kind: 'circle', cx: 160, cy: 126, r: 52 }],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        {/* Sun rays */}
        <Path
          d="M 266 14 L 266 6 M 298 52 L 306 52 M 234 52 L 226 52 M 290 28 L 296 22 M 242 28 L 236 22 M 290 76 L 296 82"
          stroke={INK}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Cute eyes */}
        <Circle cx="141" cy="118" r="6.5" fill={INK} />
        <Circle cx="179" cy="118" r="6.5" fill={INK} />
        <Circle cx="143" cy="115.5" r="2.2" fill="#FFFFFF" />
        <Circle cx="181" cy="115.5" r="2.2" fill="#FFFFFF" />
        {/* Triangle nose & happy smile */}
        <Path d="M 151 130 Q 160 125 169 130 L 160 140 Z" fill={INK} />
        <Path
          d="M 160 140 L 160 147 M 146 147 Q 153 155 160 147 Q 167 155 174 147"
          fill="none"
          stroke={INK}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Whiskers */}
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
        shapes: [{ kind: 'ellipse', cx: 160, cy: 224, rx: 68, ry: 56 }],
      },
      {
        id: 'belly',
        label: 'Tummy',
        cx: 160,
        cy: 230,
        shapes: [{ kind: 'ellipse', cx: 160, cy: 230, rx: 38, ry: 34 }],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
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
        {/* Rosy cheeks */}
        <Circle cx="122" cy="134" r="7" fill="rgba(240, 130, 168, 0.35)" />
        <Circle cx="198" cy="134" r="7" fill="rgba(240, 130, 168, 0.35)" />
        {/* Trunk creases */}
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
        shapes: [
          { kind: 'path', d: 'M 156 108 Q 148 74 126 62 Q 112 56 118 44 Q 134 36 154 64 Q 160 40 176 40 Q 192 44 184 62 Q 168 74 164 108 Z' },
        ],
      },
      {
        id: 'wave',
        label: 'Ocean Wave',
        cx: 160,
        cy: 280,
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
        {/* Happy wide whale smile */}
        <Path
          d="M 48 204 Q 78 216 108 202"
          fill="none"
          stroke={INK}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Belly stripe lines */}
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
        shapes: [{ kind: 'ellipse', cx: 160, cy: 204, rx: 44, ry: 52 }],
      },
      {
        id: 'scarf',
        label: 'Cozy Scarf',
        cx: 160,
        cy: 146,
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
        shapes: [
          { kind: 'path', d: 'M 144 114 Q 160 106 176 114 L 160 134 Z' },
        ],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
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
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'horns',
        label: 'Horns',
        cx: 138,
        cy: 42,
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
        shapes: [{ kind: 'ellipse', cx: 138, cy: 92, rx: 42, ry: 34 }],
      },
      {
        id: 'muzzle',
        label: 'Snout',
        cx: 138,
        cy: 112,
        shapes: [{ kind: 'ellipse', cx: 138, cy: 112, rx: 28, ry: 18 }],
      },
    ],
    renderFaceOverlay: () => (
      <G pointerEvents="none">
        {/* Horn stalks */}
        <Path d="M 122 52 L 126 62 M 156 52 L 152 62" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <Circle cx="122" cy="84" r="6" fill={INK} />
        <Circle cx="154" cy="84" r="6" fill={INK} />
        <Circle cx="124" cy="82" r="2" fill="#FFFFFF" />
        <Circle cx="156" cy="82" r="2" fill="#FFFFFF" />
        {/* Nostrils & smile */}
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
        shapes: [
          { kind: 'path', d: 'M 8 276 Q 160 264 312 276 L 312 312 L 8 312 Z' },
        ],
      },
      {
        id: 'left-arm',
        label: 'Left Arm',
        cx: 76,
        cy: 192,
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
        shapes: [{ kind: 'ellipse', cx: 160, cy: 218, rx: 64, ry: 58 }],
      },
      {
        id: 'chest',
        label: 'Belly',
        cx: 160,
        cy: 222,
        shapes: [{ kind: 'ellipse', cx: 160, cy: 222, rx: 38, ry: 36 }],
      },
      {
        id: 'feet',
        label: 'Feet',
        cx: 160,
        cy: 274,
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
        shapes: [{ kind: 'circle', cx: 160, cy: 112, r: 54 }],
      },
      {
        id: 'face',
        label: 'Face',
        cx: 160,
        cy: 124,
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
        {/* Gorilla nose & warm smile */}
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

/** Tactile storybook crayon button */
const CrayonButton: React.FC<{
  crayon: CrayonColor;
  active: boolean;
  size: number;
  onPress: () => void;
}> = React.memo(({ crayon, active, size, onPress }) => (
  <TactileButton
    onPress={onPress}
    accessibilityLabel={`${crayon.name} crayon`}
    style={{ width: size }}
  >
    <View
      style={[
        styles.crayonSwatch,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: active ? COLORS.woodDark : crayon.border,
          backgroundColor: crayon.isRainbow ? '#FFF8E2' : crayon.hex,
        },
        active && styles.crayonSwatchActive,
      ]}
    >
      {crayon.isRainbow ? (
        <Text style={{ fontSize: Math.round(size * 0.54) }}>🌈</Text>
      ) : (
        <View
          style={{
            width: Math.round(size * 0.34),
            height: Math.round(size * 0.16),
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.45)',
            position: 'absolute',
            top: Math.round(size * 0.16),
          }}
        />
      )}
    </View>
  </TactileButton>
));

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
      Animated.delay(1400),
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
 * Zoo Coloring (Free Tier):
 * - 6 chunky storybook coloring pages (Lion, Elephant, Whale, Penguin, Giraffe, Whit!)
 * - Two toddler-friendly modes: instant Tap-to-Fill (0ms touchstart!) + Freehand Crayon Draw
 *   (with outlines layered cleanly on top so scribbles always look neat!)
 * - 10 vibrant crayons including a 🌈 Magic Rainbow Crayon + spoken color names
 * - Tablet top page selector so resting wrists never switch pages accidentally
 * - Zero SVG ClipPaths or RadialGradients for rock-solid Android & iPad rendering
 */
export const ZooColoringGame: React.FC = () => {
  const { addStar, collectSticker } = useApp();
  const { isTablet, isTabletLandscape, width, height } = useResponsive();

  const [pageIdx, setPageIdx] = useState(0);
  const [tool, setTool] = useState<ToolMode>('fill');
  const [selectedCrayonId, setSelectedCrayonId] = useState<string>('yellow');
  const [fillsByPage, setFillsByPage] = useState<Record<string, Record<string, string>>>({});
  const [strokesByPage, setStrokesByPage] = useState<Record<string, DrawStroke[]>>({});
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
  const currentHistory = historyByPage[page.id] || [];
  const selectedCrayon =
    CRAYONS.find((c) => c.id === selectedCrayonId) || CRAYONS[2];

  const coloredRegionCount = useMemo(
    () =>
      page.regions.filter(
        (r) => Boolean(currentFills[r.id]) && currentFills[r.id] !== PAPER_WHITE
      ).length,
    [currentFills, page.regions]
  );

  // Canvas dimensions adapted cleanly to tablet landscape, tablet portrait, and phone
  const canvasSize = useMemo(() => {
    if (isTabletLandscape) {
      return Math.min(450, Math.max(300, Math.min(height - 196, width - 360)));
    }
    if (isTablet) {
      return Math.min(460, Math.max(300, Math.min(width - 64, height - 375)));
    }
    return Math.min(340, Math.max(244, Math.min(width - 36, height - 340)));
  }, [height, isTablet, isTabletLandscape, width]);

  const nextActiveColor = useCallback(() => {
    if (selectedCrayon.isRainbow) {
      const hex = RAINBOW_CYCLE[rainbowIdxRef.current % RAINBOW_CYCLE.length];
      rainbowIdxRef.current += 1;
      return hex;
    }
    return selectedCrayon.hex;
  }, [selectedCrayon]);

  const triggerPageMasterpiece = useCallback(
    (p: ColoringPageSpec) => {
      setCelebratedThisVisit((prev) => ({ ...prev, [p.id]: true }));
      setMasterpieceTick(Date.now());
      soundEngine.playWin();
      setTimeout(() => soundEngine.playAnimalSound(p.animal), 280);
      addStar(1);
      collectSticker(p.animal);

      setCompletedPages((prev) => {
        if (prev.includes(p.id)) return prev;
        const next = [...prev, p.id];
        saveCompletedPages(next);
        return next;
      });

      pageCelebrateAnim.setValue(0.95);
      Animated.spring(pageCelebrateAnim, {
        toValue: 1,
        friction: 3.6,
        tension: 180,
        useNativeDriver: true,
      }).start();
    },
    [addStar, collectSticker, pageCelebrateAnim]
  );

  const fillRegion = useCallback(
    (region: ColoringRegion) => {
      soundEngine.unlock();
      const color = nextActiveColor();
      soundEngine.playPop();

      const scale = canvasSize / CANVAS_VB;
      setBurstPos({
        x: region.cx * scale,
        y: region.cy * scale,
        tick: Date.now(),
      });

      const prevColor = (fillsByPage[page.id] || {})[region.id];
      const nextPageMap = { ...(fillsByPage[page.id] || {}), [region.id]: color };
      setFillsByPage((prev) => ({ ...prev, [page.id]: nextPageMap }));

      const entry: HistoryEntry = { kind: 'fill', regionId: region.id, prevColor };
      setHistoryByPage((hPrev) => ({
        ...hPrev,
        [page.id]: [...(hPrev[page.id] || []), entry].slice(-30),
      }));

      // Check if every region on this page now has color!
      const allColored = page.regions.every(
        (r) => Boolean(nextPageMap[r.id]) && nextPageMap[r.id] !== PAPER_WHITE
      );
      if (allColored && !celebratedThisVisit[page.id]) {
        setTimeout(() => triggerPageMasterpiece(page), 180);
      }
    },
    [canvasSize, celebratedThisVisit, fillsByPage, nextActiveColor, page, triggerPageMasterpiece]
  );

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
    }
  }, [historyByPage, page.id]);

  const handleClearPage = useCallback(() => {
    soundEngine.playGentleBounce();
    setFillsByPage((prev) => ({ ...prev, [page.id]: {} }));
    setStrokesByPage((prev) => ({ ...prev, [page.id]: [] }));
    setHistoryByPage((prev) => ({ ...prev, [page.id]: [] }));
    setCelebratedThisVisit((prev) => ({ ...prev, [page.id]: false }));
  }, [page.id]);

  // =========================================================================
  // DIRECT NON-PASSIVE DOM TOUCH ENGINE (Instant Tap-to-Fill + Smooth Drawing)
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

  const handleCanvasRef = useCallback((node: React.ComponentRef<typeof View> | null) => {
    if (Platform.OS !== 'web') return;
    const el = resolveDomElement(node);
    canvasDomRef.current = el;
    setCanvasDomNode((prev) => (prev === el ? prev : el));
  }, []);

  const cleanupWinListeners = useCallback(() => {
    if (winCleanupRef.current) {
      winCleanupRef.current();
      winCleanupRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupWinListeners(), [cleanupWinListeners]);

  const clientToViewBox = useCallback((clientX: number, clientY: number) => {
    const rect = canvasDomRef.current?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: CANVAS_VB / 2, y: CANVAS_VB / 2 };
    }
    const x = ((clientX - rect.left) / rect.width) * CANVAS_VB;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_VB;
    return {
      x: Math.max(4, Math.min(CANVAS_VB - 4, x)),
      y: Math.max(4, Math.min(CANVAS_VB - 4, y)),
    };
  }, []);

  const findRegionFromClientPoint = useCallback(
    (clientX: number, clientY: number): ColoringRegion | null => {
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
      // Fallback: nearest region center within generous radius if toddler tapped on a border line
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
        width: isTablet ? 20 : 18,
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
      const startEntry: HistoryEntry = { kind: 'stroke', strokeId };
      setHistoryByPage((prev) => ({
        ...prev,
        [page.id]: [...(prev[page.id] || []), startEntry].slice(-30),
      }));
    },
    [isTablet, nextActiveColor, page.id]
  );

  const extendStrokeTo = useCallback(
    (vbPt: { x: number; y: number }) => {
      const dr = drawingRef.current;
      if (!dr || !dr.active) return;
      const stepDist = Math.hypot(vbPt.x - dr.lastPt.x, vbPt.y - dr.lastPt.y);
      if (stepDist < 2.5) return;

      // In Rainbow mode, smoothly transition hue every ~24 viewBox units!
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
              width: isTablet ? 20 : 18,
              points: [prevPt, vbPt],
            },
          ],
        }));
        const segEntry: HistoryEntry = { kind: 'stroke', strokeId: nextId };
        setHistoryByPage((prev) => ({
          ...prev,
          [page.id]: [...(prev[page.id] || []), segEntry].slice(-30),
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
    [isTablet, nextActiveColor, page.id, selectedCrayon.isRainbow]
  );

  const finishStroke = useCallback(() => {
    drawingRef.current = null;
    cleanupWinListeners();
  }, [cleanupWinListeners]);

  const handlersRef = useRef({
    tool,
    fillRegion,
    findRegionFromClientPoint,
    clientToViewBox,
    startStrokeAt,
    extendStrokeTo,
    finishStroke,
  });
  handlersRef.current = {
    tool,
    fillRegion,
    findRegionFromClientPoint,
    clientToViewBox,
    startStrokeAt,
    extendStrokeTo,
    finishStroke,
  };

  const attachDrawWindowListeners = useCallback(
    (mode: 'touch' | 'pointer', id: number) => {
      cleanupWinListeners();
      if (typeof window === 'undefined') return;

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
          handlersRef.current.extendStrokeTo(
            handlersRef.current.clientToViewBox(t.clientX, t.clientY)
          );
        };
        const onEnd = (ev: TouchEvent) => {
          const t = findTouch(ev.changedTouches);
          if (!t) return;
          if (ev.cancelable) ev.preventDefault();
          lastTouchAtRef.current = Date.now();
          handlersRef.current.finishStroke();
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
          handlersRef.current.extendStrokeTo(
            handlersRef.current.clientToViewBox(ev.clientX, ev.clientY)
          );
        };
        const onUp = (ev: PointerEvent) => {
          if (ev.pointerId !== id) return;
          handlersRef.current.finishStroke();
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

  // Direct non-passive DOM touchstart listener for instant iPad/Android response
  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasDomNode) return;

    const onDomTouchStart = (ev: TouchEvent) => {
      const t = ev.changedTouches[0];
      if (!t) return;
      if (ev.cancelable) ev.preventDefault();
      lastTouchAtRef.current = Date.now();

      const h = handlersRef.current;
      if (h.tool === 'fill') {
        const region = h.findRegionFromClientPoint(t.clientX, t.clientY);
        if (region) {
          h.fillRegion(region);
        }
        return;
      }

      const vbPt = h.clientToViewBox(t.clientX, t.clientY);
      h.startStrokeAt('touch', t.identifier, vbPt);
      attachDrawWindowListeners('touch', t.identifier);
    };

    canvasDomNode.addEventListener('touchstart', onDomTouchStart, { passive: false });
    return () => {
      canvasDomNode.removeEventListener('touchstart', onDomTouchStart);
    };
  }, [attachDrawWindowListeners, canvasDomNode]);

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
            if (h.tool === 'fill') {
              const region = h.findRegionFromClientPoint(e.clientX, e.clientY);
              if (region) {
                h.fillRegion(region);
              }
              return;
            }
            const vbPt = h.clientToViewBox(e.clientX, e.clientY);
            h.startStrokeAt('pointer', e.pointerId, vbPt);
            attachDrawWindowListeners('pointer', e.pointerId);
          },
        } as Record<string, unknown>)
      : {};

  const nativePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => handlersRef.current.tool === 'draw',
      onMoveShouldSetPanResponder: () => handlersRef.current.tool === 'draw',
      onPanResponderGrant: (evt) => {
        const x = (evt.nativeEvent.locationX / Math.max(1, canvasSize)) * CANVAS_VB;
        const y = (evt.nativeEvent.locationY / Math.max(1, canvasSize)) * CANVAS_VB;
        handlersRef.current.startStrokeAt('native', 0, { x, y });
      },
      onPanResponderMove: (evt) => {
        const x = (evt.nativeEvent.locationX / Math.max(1, canvasSize)) * CANVAS_VB;
        const y = (evt.nativeEvent.locationY / Math.max(1, canvasSize)) * CANVAS_VB;
        handlersRef.current.extendStrokeTo({ x, y });
      },
      onPanResponderRelease: () => handlersRef.current.finishStroke(),
      onPanResponderTerminate: () => handlersRef.current.finishStroke(),
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
                soundEngine.playPop();
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
          {/* Layer 1: Tappable fillable regions */}
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

          {/* Layer 2: Translucent waxy crayon strokes letting crisp outlines show through */}
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
                opacity={0.72}
              />
            ))}
          </G>

          {/* Layer 3: Adorable facial details & highlights always sharp on top */}
          {page.renderFaceOverlay()}
        </Svg>

        {/* Sparkle pop when filling a region */}
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
    </Animated.View>
  );

  const crayonSize = isTabletLandscape ? 48 : isTablet ? 46 : 36;

  const renderPaletteAndTools = () => (
    <View
      style={[
        styles.paletteDock,
        isTablet && styles.paletteDockTablet,
        isTabletLandscape && styles.paletteDockLandscape,
      ]}
    >
      {/* Tool mode switcher + Undo & Clear */}
      <View
        style={[
          styles.toolsRow,
          isTabletLandscape && styles.toolsRowLandscape,
        ]}
      >
        <TactileButton
          onPress={() => {
            soundEngine.playPop();
            setTool('fill');
          }}
          accessibilityLabel="Tap to Fill mode"
        >
          <View
            style={[
              styles.toolPill,
              tool === 'fill' && styles.toolPillActive,
            ]}
          >
            <Text style={[styles.toolText, tool === 'fill' && styles.toolTextActive]}>
              🪣 Fill
            </Text>
          </View>
        </TactileButton>

        <TactileButton
          onPress={() => {
            soundEngine.playPop();
            setTool('draw');
          }}
          accessibilityLabel="Crayon Draw mode"
        >
          <View
            style={[
              styles.toolPill,
              tool === 'draw' && styles.toolPillActive,
            ]}
          >
            <Text style={[styles.toolText, tool === 'draw' && styles.toolTextActive]}>
              🖍️ Draw
            </Text>
          </View>
        </TactileButton>

        <TactileButton
          onPress={handleUndo}
          accessibilityLabel="Undo last color"
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
      </View>

      {/* Crayon Color Swatches */}
      <View
        style={[
          styles.crayonsGrid,
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
    paddingHorizontal: 24,
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
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  playAreaTabletPortrait: {
    maxWidth: 760,
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  playAreaLandscape: {
    flex: 1,
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  landscapeLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperFrame: {
    padding: 10,
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
  masterpieceBanner: {
    position: 'absolute',
    top: 12,
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
    backgroundColor: 'rgba(248, 228, 186, 0.92)',
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(138, 92, 50, 0.34)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(138, 92, 50, 0.44)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    alignItems: 'center',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  paletteDockTablet: {
    maxWidth: 680,
    borderRadius: 38,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
  },
  paletteDockLandscape: {
    width: 306,
    borderRadius: 38,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 14,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  toolsRowLandscape: {
    gap: 7,
  },
  toolPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 236, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.3)',
  },
  toolPillActive: {
    backgroundColor: COLORS.sunYellow,
    borderColor: COLORS.woodDark,
    borderWidth: 2.5,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  toolTextActive: {
    color: COLORS.woodDark,
  },
  iconToolBtn: {
    width: 38,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 250, 236, 0.88)',
    borderWidth: 2,
    borderColor: 'rgba(122, 82, 44, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconToolText: {
    fontSize: 17,
  },
  crayonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  crayonsGridLandscape: {
    gap: 12,
  },
  crayonSwatch: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4A3525',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  crayonSwatchActive: {
    borderWidth: 4,
    transform: [{ scale: 1.15 }, { translateY: -3 }],
    shadowOpacity: 0.3,
  },
  pagePickerShell: {
    maxWidth: '96%',
    backgroundColor: 'rgba(255, 249, 236, 0.58)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 15,
  },
  pagePickerShellLandscape: {
    maxWidth: 680,
  },
  pagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pageTab: {
    borderWidth: 2.5,
    borderColor: 'rgba(74, 53, 37, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
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
