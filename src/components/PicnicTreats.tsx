import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

export type PicnicTreatId =
  | 'banana'
  | 'watermelon'
  | 'bamboo'
  | 'berries'
  | 'fish'
  | 'cupcake';

export interface PicnicTreatMeta {
  id: PicnicTreatId;
  label: string;
  lovedBy: string[];
  accentColor: string;
}

export const PICNIC_TREATS: PicnicTreatMeta[] = [
  {
    id: 'banana',
    label: 'Banana',
    lovedBy: ['gorilla', 'monkey', 'pig'],
    accentColor: '#F6CF4C',
  },
  {
    id: 'watermelon',
    label: 'Watermelon',
    lovedBy: ['elephant', 'hippo', 'gorilla', 'pig', 'cow'],
    accentColor: '#EA6B68',
  },
  {
    id: 'bamboo',
    label: 'Bamboo',
    lovedBy: ['panda', 'giraffe', 'cow', 'sheep'],
    accentColor: '#6EB363',
  },
  {
    id: 'berries',
    label: 'Berries',
    lovedBy: ['toucan', 'giraffe', 'monkey', 'polarbear', 'duck', 'sheep'],
    accentColor: '#E36B8E',
  },
  {
    id: 'fish',
    label: 'Fish Treat',
    lovedBy: ['whale', 'frog', 'lion', 'penguin', 'polarbear', 'seal', 'puffin'],
    accentColor: '#56B2DC',
  },
  {
    id: 'cupcake',
    label: 'Star Cupcake',
    lovedBy: [
      'gorilla',
      'monkey',
      'panda',
      'elephant',
      'toucan',
      'whale',
      'lion',
      'frog',
      'giraffe',
      'penguin',
      'polarbear',
      'cow',
      'pig',
      'duck',
      'sheep',
      'seal',
      'puffin',
    ],
    accentColor: '#F09BB8',
  },
];

const INK = '#5E4028';

/** Warm storybook gouache-palette SVG illustrations for Whit's Jungle Picnic treats */
export const PicnicTreatSvg: React.FC<{
  treat: PicnicTreatId;
  size: number;
}> = ({ treat, size }) => {
  switch (treat) {
    case 'banana':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="banGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFE87A" />
              <Stop offset="1" stopColor="#EEBA36" />
            </LinearGradient>
          </Defs>
          {/* Curved sunny banana */}
          <Path
            d="M 24 72 C 44 82, 78 66, 80 26 C 80 20, 74 16, 70 20 C 66 44, 44 58, 22 56 C 14 56, 14 68, 24 72 Z"
            fill="url(#banGrad)"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Soft banana ridge highlight */}
          <Path
            d="M 32 63 C 50 63, 68 50, 72 30"
            stroke="#FFF8D2"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.82"
          />
          {/* Stem & tip */}
          <Path
            d="M 73 19 L 78 12"
            stroke="#8A5E34"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Circle cx="18" cy="64" r="3" fill={INK} />
        </Svg>
      );

    case 'watermelon':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Green outer rind */}
          <Path
            d="M 12 40 Q 50 94 88 40 L 82 36 Q 50 80 18 36 Z"
            fill="#5CA457"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Cream inner rind */}
          <Path
            d="M 18 38 Q 50 82 82 38 L 77 35 Q 50 72 23 35 Z"
            fill="#F3F7DD"
          />
          {/* Juicy coral-red watermelon flesh */}
          <Path
            d="M 20 38 Q 50 78 80 38 Z"
            fill="#EA6A68"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Soft highlight */}
          <Path
            d="M 30 43 H 68"
            stroke="#FFA3A0"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Cute dark brown seeds */}
          <Ellipse cx="38" cy="50" rx="2.6" ry="4" fill={INK} transform="rotate(-15 38 50)" />
          <Ellipse cx="50" cy="55" rx="2.6" ry="4" fill={INK} />
          <Ellipse cx="62" cy="50" rx="2.6" ry="4" fill={INK} transform="rotate(15 62 50)" />
        </Svg>
      );

    case 'bamboo':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Fresh bamboo stalk segments */}
          <Rect
            x="40"
            y="18"
            width="20"
            height="24"
            rx="6"
            fill="#88C673"
            stroke={INK}
            strokeWidth="3"
          />
          <Rect
            x="40"
            y="40"
            width="20"
            height="24"
            rx="6"
            fill="#75B861"
            stroke={INK}
            strokeWidth="3"
          />
          <Rect
            x="40"
            y="62"
            width="20"
            height="24"
            rx="6"
            fill="#66A953"
            stroke={INK}
            strokeWidth="3"
          />
          {/* Sprouting bamboo leaves */}
          <Path
            d="M 60 36 Q 82 20 86 34 Q 76 46 60 41 Z"
            fill="#98D27D"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Path
            d="M 40 52 Q 18 38 14 52 Q 24 64 40 57 Z"
            fill="#86C46D"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Gloss highlight */}
          <Path
            d="M 46 24 V 78"
            stroke="#DDF5CC"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.65"
          />
        </Svg>
      );

    case 'berries':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Green leafy crown */}
          <Path
            d="M 50 28 Q 34 14 26 26 Q 38 34 50 32 Z"
            fill="#67AA5C"
            stroke={INK}
            strokeWidth="2.6"
          />
          <Path
            d="M 50 28 Q 66 14 74 26 Q 62 34 50 32 Z"
            fill="#78BA6C"
            stroke={INK}
            strokeWidth="2.6"
          />
          {/* Plump strawberry body */}
          <Path
            d="M 28 36 C 24 56, 38 82, 50 84 C 62 82, 76 56, 72 36 C 68 28, 32 28, 28 36 Z"
            fill="#E7657F"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Tiny sunny seeds */}
          <Circle cx="40" cy="46" r="2.2" fill="#FFE694" />
          <Circle cx="52" cy="44" r="2.2" fill="#FFE694" />
          <Circle cx="62" cy="48" r="2.2" fill="#FFE694" />
          <Circle cx="44" cy="59" r="2.2" fill="#FFE694" />
          <Circle cx="56" cy="60" r="2.2" fill="#FFE694" />
          <Circle cx="50" cy="72" r="2.2" fill="#FFE694" />
          {/* Little blueberry buddy beside it */}
          <Circle cx="74" cy="70" r="13" fill="#6398D8" stroke={INK} strokeWidth="2.8" />
          <Circle cx="70" cy="66" r="3.5" fill="#B8D9FA" opacity="0.85" />
        </Svg>
      );

    case 'fish':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Tail fin */}
          <Path
            d="M 68 50 L 88 34 L 84 50 L 88 66 Z"
            fill="#6DC7E8"
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Plump happy fish treat */}
          <Ellipse
            cx="44"
            cy="50"
            rx="28"
            ry="19"
            fill="#7AD2F0"
            stroke={INK}
            strokeWidth="3.2"
          />
          {/* Soft cream belly & stripes */}
          <Path
            d="M 26 56 Q 44 68 62 56"
            stroke="#E8FAFF"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <Circle cx="30" cy="46" r="3.5" fill={INK} />
          <Circle cx="29" cy="45" r="1.2" fill="#FFFFFF" />
          <Path
            d="M 22 54 Q 26 57 31 54"
            stroke={INK}
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case 'cupcake':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* Paper wrapper base */}
          <Path
            d="M 26 56 L 34 84 Q 50 88 66 84 L 74 56 Z"
            fill="#F4C776"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <Path d="M 38 58 L 42 83" stroke="#D9A04C" strokeWidth="2.4" />
          <Path d="M 50 58 V 84" stroke="#D9A04C" strokeWidth="2.4" />
          <Path d="M 62 58 L 58 83" stroke="#D9A04C" strokeWidth="2.4" />
          {/* Fluffy strawberry frosting swirl */}
          <Path
            d="M 22 56 C 18 42, 32 34, 42 36 C 44 24, 60 24, 62 36 C 72 34, 82 44, 78 56 Q 50 64 22 56 Z"
            fill="#F69AB8"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Pastel sprinkles */}
          <Circle cx="36" cy="48" r="2.8" fill="#FFE266" />
          <Circle cx="52" cy="44" r="2.8" fill="#82D9A0" />
          <Circle cx="65" cy="49" r="2.8" fill="#7AC8F5" />
          {/* Golden star topper! */}
          <Polygon
            points="50,10 53.5,19 63,20 56,26 58,35 50,30.5 42,35 44,26 37,20 46.5,19"
            fill="#FFE059"
            stroke={INK}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
};
