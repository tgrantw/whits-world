import React, { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { STORYBOOK_ANIMALS, STORYBOOK_ASSETS } from '../assets/assetMap';

export type ZooAnimalKind =
  | 'gorilla'
  | 'giraffe'
  | 'elephant'
  | 'toucan'
  | 'monkey'
  | 'zebra'
  | 'hippo'
  | 'tiger'
  | 'panda'
  | 'frog'
  | 'lion'
  | 'flamingo'
  | 'whale'
  | 'turtle'
  | 'octopus'
  | 'clownfish'
  | 'penguin'
  | 'polarbear'
  | 'seal'
  | 'puffin'
  | 'cow'
  | 'pig'
  | 'duck'
  | 'sheep';

export function getZooAnimalBackdrop(animal: ZooAnimalKind) {
  switch (animal) {
    case 'whale':
    case 'turtle':
    case 'octopus':
    case 'clownfish':
      return STORYBOOK_ASSETS.bgAquarium;
    case 'giraffe':
    case 'elephant':
    case 'lion':
    case 'zebra':
      return STORYBOOK_ASSETS.bgSavanna;
    case 'panda':
    case 'tiger':
    case 'hippo':
    case 'flamingo':
      return STORYBOOK_ASSETS.bgSanctuary;
    case 'penguin':
    case 'polarbear':
    case 'seal':
    case 'puffin':
      return STORYBOOK_ASSETS.bgArctic;
    case 'cow':
    case 'pig':
    case 'duck':
    case 'sheep':
      return STORYBOOK_ASSETS.bgFarm;
    case 'gorilla':
    case 'monkey':
    case 'toucan':
    case 'frog':
    default:
      return STORYBOOK_ASSETS.bgClearing;
  }
}

interface ZooAnimalSvgProps {
  animal: ZooAnimalKind;
  size: number;
  /** Optional 2x2 jigsaw slice: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right */
  quadrant?: 0 | 1 | 2 | 3;
  /** Optional NxN jigsaw slicing (2 or 3) paired with tileIndex (0 .. gridSize*gridSize - 1) */
  gridSize?: 2 | 3;
  tileIndex?: number;
  /** Faint ghost preview underneath a jigsaw tray */
  faded?: boolean;
  /** Soft wooden-tinted silhouette for Zoo Parade size pedestals */
  silhouette?: boolean;
  /** Set false for transparent character-only rendering (e.g. Zoo Parade pedestals) */
  withBackdrop?: boolean;
}

const INK = '#4A3525';

const BACKDROPS: Record<
  ZooAnimalKind,
  { top: string; mid: string; hillBack: string; hillFront: string }
> = {
  gorilla: { top: '#CBEBD6', mid: '#F6FBE9', hillBack: '#97CB82', hillFront: '#63A358' },
  giraffe: { top: '#D4EEFA', mid: '#FFF7DF', hillBack: '#C4DA7C', hillFront: '#88B454' },
  elephant: { top: '#CBE8F7', mid: '#F4FAFD', hillBack: '#9FD086', hillFront: '#6BA65F' },
  toucan: { top: '#CDEEE8', mid: '#F6FBE8', hillBack: '#8AC47A', hillFront: '#589953' },
  monkey: { top: '#FBECC3', mid: '#FFFBF0', hillBack: '#A4CF7B', hillFront: '#6DA85B' },
  zebra: { top: '#D3EEFB', mid: '#F6FBEE', hillBack: '#AAD482', hillFront: '#73AC5E' },
  hippo: { top: '#CFEFF7', mid: '#F2FAFE', hillBack: '#92CFE8', hillFront: '#61AACC' },
  tiger: { top: '#FCEAC6', mid: '#FFF9EA', hillBack: '#B1D47C', hillFront: '#78AD5B' },
  panda: { top: '#D2F0DA', mid: '#F6FBEE', hillBack: '#95CB82', hillFront: '#62A35C' },
  frog: { top: '#D0F2E6', mid: '#F5FBEB', hillBack: '#86C99B', hillFront: '#569D73' },
  lion: { top: '#FCECC2', mid: '#FFF8E4', hillBack: '#C8D87B', hillFront: '#93B452' },
  flamingo: { top: '#F8DFEB', mid: '#FFF6FA', hillBack: '#A3D2B2', hillFront: '#6BAA87' },
  whale: { top: '#B6EAF7', mid: '#E4F9FE', hillBack: '#72C6DE', hillFront: '#469DB8' },
  turtle: { top: '#BEEFF4', mid: '#E8FBF9', hillBack: '#6EC8C7', hillFront: '#439FA3' },
  octopus: { top: '#CBE8FA', mid: '#EDF7FF', hillBack: '#7BBBE0', hillFront: '#4E94BF' },
  clownfish: { top: '#B9ECFA', mid: '#E7FAFF', hillBack: '#74C7DF', hillFront: '#4BA0BC' },
  // Snowy Arctic
  penguin: { top: '#CBE6F5', mid: '#F7F3EA', hillBack: '#B6D9EA', hillFront: '#89BCD6' },
  polarbear: { top: '#CFE8F7', mid: '#FAF5EB', hillBack: '#BCDCEB', hillFront: '#8FBFD8' },
  seal: { top: '#C4E4F2', mid: '#F2F8FB', hillBack: '#A6D1E6', hillFront: '#7AB1CC' },
  puffin: { top: '#CBE7F4', mid: '#F9F3E8', hillBack: '#B2D5E6', hillFront: '#84B7D1' },
  // Sunny Farm
  cow: { top: '#FCEBC7', mid: '#FFF9EA', hillBack: '#B6D884', hillFront: '#7EAD5A' },
  pig: { top: '#FCE8CD', mid: '#FFF7EC', hillBack: '#B9D986', hillFront: '#84B05D' },
  duck: { top: '#D5EEF7', mid: '#F8FBEC', hillBack: '#AAD486', hillFront: '#72A861' },
  sheep: { top: '#FBECC9', mid: '#FFF9EC', hillBack: '#B7D987', hillFront: '#7FA95B' },
};

/**
 * Premium Warm Watercolor & Gouache Zoo Animal Portraits:
 * - Uses bundled transparent PNG illustrations from `STORYBOOK_ANIMALS` for all 24 animals
 * - Supports seamless pixel-accurate 2x2 and 3x3 jigsaw slicing over habitat-matched watercolor backdrops,
 *   faint ghost previews, Peek-a-Boo reveals, and character-only transparent rendering!
 */
export const ZooAnimalSvg: React.FC<ZooAnimalSvgProps> = ({
  animal,
  size,
  quadrant,
  gridSize,
  tileIndex,
  faded = false,
  silhouette = false,
  withBackdrop = true,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bg = BACKDROPS[animal];

  const pngSource = STORYBOOK_ANIMALS[animal];
  if (pngSource) {
    const sliceGrid = gridSize ?? (quadrant !== undefined ? 2 : 1);
    const sliceIdx =
      gridSize && tileIndex !== undefined
        ? tileIndex
        : quadrant !== undefined
        ? quadrant
        : 0;
    const col = sliceIdx % sliceGrid;
    const row = Math.floor(sliceIdx / sliceGrid);
    const fullSize = size * sliceGrid;
    const pad = Math.round(fullSize * 0.08);

    return (
      <View
        style={{
          width: size,
          height: size,
          overflow: 'hidden',
          opacity: silhouette ? 0.28 : faded ? 0.26 : 1,
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: fullSize,
            height: fullSize,
            left: -col * size,
            top: -row * size,
            backgroundColor: withBackdrop ? bg.mid : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {withBackdrop && (
            <Image
              source={getZooAnimalBackdrop(animal)}
              style={{
                position: 'absolute',
                width: fullSize,
                height: fullSize,
                opacity: 0.78,
              }}
              resizeMode="cover"
            />
          )}
          <Image
            source={pngSource}
            style={{
              width: fullSize - pad * 2,
              height: fullSize - pad * 2,
            }}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  let viewBox = '0 0 200 200';
  if (gridSize && tileIndex !== undefined) {
    const step = 200 / gridSize;
    const col = tileIndex % gridSize;
    const row = Math.floor(tileIndex / gridSize);
    viewBox = `${(col * step).toFixed(3)} ${(row * step).toFixed(3)} ${step.toFixed(3)} ${step.toFixed(3)}`;
  } else if (quadrant !== undefined) {
    viewBox =
      quadrant === 0
        ? '0 0 100 100'
        : quadrant === 1
        ? '100 0 100 100'
        : quadrant === 2
        ? '0 100 100 100'
        : '100 100 100 100';
  }

  const renderDefs = () => (
    <Defs>
      <LinearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={bg.top} />
        <Stop offset="1" stopColor={bg.mid} />
      </LinearGradient>
      <RadialGradient id={`sun-${uid}`} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#FFFDE0" stopOpacity="1" />
        <Stop offset="0.6" stopColor="#FFE169" stopOpacity="0.85" />
        <Stop offset="1" stopColor="#FFE169" stopOpacity="0" />
      </RadialGradient>

      {/* Gorilla */}
      <RadialGradient id={`gFur-${uid}`} cx="38%" cy="28%" r="70%">
        <Stop offset="0" stopColor="#727F96" />
        <Stop offset="0.55" stopColor="#414A5C" />
        <Stop offset="1" stopColor="#252B36" />
      </RadialGradient>
      <LinearGradient id={`gTan-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFEBD4" />
        <Stop offset="0.65" stopColor="#E9BA8D" />
        <Stop offset="1" stopColor="#D19866" />
      </LinearGradient>

      {/* Giraffe */}
      <LinearGradient id={`girFur-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE98A" />
        <Stop offset="0.58" stopColor="#FFC145" />
        <Stop offset="1" stopColor="#EB931E" />
      </LinearGradient>
      <LinearGradient id={`girMuz-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF9E6" />
        <Stop offset="1" stopColor="#F2D49B" />
      </LinearGradient>

      {/* Elephant */}
      <RadialGradient id={`elSkin-${uid}`} cx="36%" cy="28%" r="70%">
        <Stop offset="0" stopColor="#CFE2EE" />
        <Stop offset="0.58" stopColor="#94B0C2" />
        <Stop offset="1" stopColor="#6D8A9E" />
      </RadialGradient>
      <LinearGradient id={`elPink-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFD9E6" />
        <Stop offset="1" stopColor="#F294B4" />
      </LinearGradient>

      {/* Toucan */}
      <LinearGradient id={`tcBody-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#4F6570" />
        <Stop offset="1" stopColor="#1B2329" />
      </LinearGradient>
      <LinearGradient id={`tcBeak-${uid}`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#FFA726" />
        <Stop offset="0.55" stopColor="#FF5722" />
        <Stop offset="1" stopColor="#FFD952" />
      </LinearGradient>
      <LinearGradient id={`tcChest-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF58A" />
        <Stop offset="1" stopColor="#FFAD1A" />
      </LinearGradient>

      {/* Monkey */}
      <RadialGradient id={`mkFur-${uid}`} cx="38%" cy="30%" r="68%">
        <Stop offset="0" stopColor="#C47C41" />
        <Stop offset="0.6" stopColor="#8E5022" />
        <Stop offset="1" stopColor="#5F3212" />
      </RadialGradient>
      <LinearGradient id={`mkFace-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE9C7" />
        <Stop offset="1" stopColor="#EDB57B" />
      </LinearGradient>

      {/* Zebra */}
      <LinearGradient id={`zbBody-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#E1EAF0" />
      </LinearGradient>

      {/* Hippo */}
      <RadialGradient id={`hpSkin-${uid}`} cx="36%" cy="28%" r="70%">
        <Stop offset="0" stopColor="#D2C0F0" />
        <Stop offset="0.6" stopColor="#9A82C9" />
        <Stop offset="1" stopColor="#7259A3" />
      </RadialGradient>
      <LinearGradient id={`hpSnout-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#E1D4F7" />
        <Stop offset="1" stopColor="#AE97D9" />
      </LinearGradient>

      {/* Tiger */}
      <RadialGradient id={`tgFur-${uid}`} cx="38%" cy="28%" r="68%">
        <Stop offset="0" stopColor="#FFC259" />
        <Stop offset="0.58" stopColor="#FF8826" />
        <Stop offset="1" stopColor="#D95B12" />
      </RadialGradient>

      {/* Panda */}
      <RadialGradient id={`pdWhite-${uid}`} cx="38%" cy="28%" r="70%">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="0.68" stopColor="#F7F5ED" />
        <Stop offset="1" stopColor="#DFD9CB" />
      </RadialGradient>

      {/* Frog */}
      <RadialGradient id={`frGreen-${uid}`} cx="38%" cy="28%" r="70%">
        <Stop offset="0" stopColor="#91F073" />
        <Stop offset="0.58" stopColor="#4BC252" />
        <Stop offset="1" stopColor="#268735" />
      </RadialGradient>
    </Defs>
  );

  const renderBackdrop = () => {
    if (!withBackdrop) return null;
    return (
      <G>
        <Rect x="0" y="0" width="200" height="200" fill={`url(#bg-${uid})`} />
        <Circle cx="36" cy="34" r="34" fill={`url(#sun-${uid})`} />
        <Circle cx="36" cy="34" r="16" fill="#FFF7B2" />
        <G opacity="0.78">
          <Ellipse cx="152" cy="36" rx="28" ry="12" fill="#FFFFFF" />
          <Circle cx="142" cy="30" r="12" fill="#FFFFFF" />
          <Circle cx="160" cy="30" r="11" fill="#FFFFFF" />
        </G>
        <Path
          d="M 0 148 Q 76 126 150 144 Q 180 150 200 140 L 200 200 L 0 200 Z"
          fill={bg.hillBack}
        />
        <Path
          d="M 0 166 Q 100 146 200 168 L 200 200 L 0 200 Z"
          fill={bg.hillFront}
        />
      </G>
    );
  };

  const renderAnimal = () => {
    switch (animal) {
      case 'gorilla':
        return (
          <G>
            {renderBackdrop()}
            {withBackdrop && (
              <Path
                d="M 144 0 Q 200 12 200 62 Q 156 54 144 0 Z"
                fill="#3BA14A"
                opacity="0.55"
              />
            )}
            <Circle cx="44" cy="90" r="19" fill={`url(#gFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="44" cy="90" r="10.5" fill={`url(#gTan-${uid})`} />
            <Circle cx="156" cy="90" r="19" fill={`url(#gFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="156" cy="90" r="10.5" fill={`url(#gTan-${uid})`} />
            <Ellipse cx="100" cy="176" rx="64" ry="44" fill={`url(#gFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="180" rx="38" ry="30" fill={`url(#gTan-${uid})`} />
            <Path d="M 64 148 Q 100 166 136 148 Q 126 164 100 168 Q 74 164 64 148 Z" fill="#46C263" stroke="#1C5B2B" strokeWidth="3.5" />
            <Circle cx="100" cy="92" r="56" fill={`url(#gFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 74 52 Q 94 42 112 46" stroke="#8F9DB5" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.45" />
            <Path d="M 100 35 Q 119 14 132 30 Q 116 44 100 35 Z" fill="#63D471" stroke="#1C5B2B" strokeWidth="3.5" strokeLinejoin="round" />
            <Circle cx="80" cy="88" r="25" fill={`url(#gTan-${uid})`} />
            <Circle cx="120" cy="88" r="25" fill={`url(#gTan-${uid})`} />
            <Ellipse cx="100" cy="112" rx="41" ry="30" fill={`url(#gTan-${uid})`} />
            <Ellipse cx="63" cy="110" rx="9" ry="5.5" fill="#FF8585" opacity="0.55" />
            <Ellipse cx="137" cy="110" rx="9" ry="5.5" fill="#FF8585" opacity="0.55" />
            <Circle cx="81" cy="89" r="9.8" fill={INK} />
            <Circle cx="84.5" cy="85" r="3.6" fill="#FFFFFF" />
            <Circle cx="77.5" cy="92" r="1.7" fill="#FFFFFF" />
            <Circle cx="119" cy="89" r="9.8" fill={INK} />
            <Circle cx="122.5" cy="85" r="3.6" fill="#FFFFFF" />
            <Circle cx="115.5" cy="92" r="1.7" fill="#FFFFFF" />
            <Ellipse cx="94" cy="107" rx="3.6" ry="2.5" fill="#6D442B" />
            <Ellipse cx="106" cy="107" rx="3.6" ry="2.5" fill="#6D442B" />
            <Path d="M 79 120 Q 100 138 121 120" stroke="#4A2E1E" strokeWidth="5" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'giraffe':
        return (
          <G>
            {renderBackdrop()}
            <Path d="M 74 114 L 64 200 L 136 200 L 126 114 Z" fill={`url(#girFur-${uid})`} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <Circle cx="86" cy="156" r="10.5" fill="#C46B1E" opacity="0.9" />
            <Circle cx="115" cy="176" r="12" fill="#C46B1E" opacity="0.9" />
            <Circle cx="84" cy="186" r="7.5" fill="#C46B1E" opacity="0.9" />
            <Path d="M 80 50 L 72 24" stroke={INK} strokeWidth="9" strokeLinecap="round" />
            <Path d="M 80 50 L 72 24" stroke="#FFC145" strokeWidth="4" strokeLinecap="round" />
            <Circle cx="72" cy="22" r="9.5" fill="#A6551B" stroke={INK} strokeWidth="4" />
            <Path d="M 120 50 L 128 24" stroke={INK} strokeWidth="9" strokeLinecap="round" />
            <Path d="M 120 50 L 128 24" stroke="#FFC145" strokeWidth="4" strokeLinecap="round" />
            <Circle cx="128" cy="22" r="9.5" fill="#A6551B" stroke={INK} strokeWidth="4" />
            <Ellipse cx="44" cy="68" rx="22" ry="12" fill={`url(#girFur-${uid})`} stroke={INK} strokeWidth="4.2" transform="rotate(-18 44 68)" />
            <Ellipse cx="46" cy="69" rx="12" ry="6" fill="#FFB0BE" transform="rotate(-18 46 69)" />
            <Ellipse cx="156" cy="68" rx="22" ry="12" fill={`url(#girFur-${uid})`} stroke={INK} strokeWidth="4.2" transform="rotate(18 156 68)" />
            <Ellipse cx="154" cy="69" rx="12" ry="6" fill="#FFB0BE" transform="rotate(18 154 69)" />
            <Ellipse cx="100" cy="86" rx="46" ry="44" fill={`url(#girFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="100" cy="54" r="9" fill="#C46B1E" opacity="0.88" />
            <Ellipse cx="80" cy="58" rx="9" ry="4.5" fill="#FFF9DC" opacity="0.65" />
            <Ellipse cx="100" cy="112" rx="34" ry="24" fill={`url(#girMuz-${uid})`} stroke={INK} strokeWidth="4" />
            <Ellipse cx="68" cy="100" rx="8.5" ry="5" fill="#FF8A80" opacity="0.55" />
            <Ellipse cx="132" cy="100" rx="8.5" ry="5" fill="#FF8A80" opacity="0.55" />
            <Circle cx="80" cy="82" r="8.8" fill={INK} />
            <Circle cx="83" cy="78.5" r="3.3" fill="#FFFFFF" />
            <Circle cx="120" cy="82" r="8.8" fill={INK} />
            <Circle cx="123" cy="78.5" r="3.3" fill="#FFFFFF" />
            <Circle cx="89" cy="106" r="3.5" fill="#7D4A1F" />
            <Circle cx="111" cy="106" r="3.5" fill="#7D4A1F" />
            <Path d="M 85 119 Q 100 131 115 119" stroke="#6B3D18" strokeWidth="4.4" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'elephant':
        return (
          <G>
            {renderBackdrop()}
            <Ellipse cx="40" cy="96" rx="34" ry="45" fill={`url(#elSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="42" cy="98" rx="22" ry="30" fill={`url(#elPink-${uid})`} />
            <Ellipse cx="160" cy="96" rx="34" ry="45" fill={`url(#elSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="158" cy="98" rx="22" ry="30" fill={`url(#elPink-${uid})`} />
            <Ellipse cx="100" cy="172" rx="56" ry="40" fill={`url(#elSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="178" rx="34" ry="24" fill="#E3EFF7" opacity="0.72" />
            <Circle cx="100" cy="90" r="50" fill={`url(#elSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="86" cy="56" rx="16" ry="7" fill="#EFF7FC" opacity="0.6" />
            <Path d="M 96 40 Q 102 22 110 40" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
            <Circle cx="79" cy="82" r="9" fill={INK} />
            <Circle cx="82" cy="78.5" r="3.3" fill="#FFFFFF" />
            <Circle cx="121" cy="82" r="9" fill={INK} />
            <Circle cx="124" cy="78.5" r="3.3" fill="#FFFFFF" />
            <Ellipse cx="63" cy="98" rx="8.5" ry="5" fill="#F48FB1" opacity="0.65" />
            <Ellipse cx="137" cy="98" rx="8.5" ry="5" fill="#F48FB1" opacity="0.65" />
            <Path d="M 93 96 Q 91 142 118 146 Q 134 148 131 132" stroke={INK} strokeWidth="28" strokeLinecap="round" fill="none" />
            <Path d="M 93 96 Q 91 142 118 146 Q 134 148 131 132" stroke={`url(#elSkin-${uid})`} strokeWidth="19" strokeLinecap="round" fill="none" />
            <Circle cx="147" cy="118" r="6" fill="#4FC3F7" stroke="#157BBF" strokeWidth="2.5" />
            <Circle cx="158" cy="104" r="4" fill="#81D4FA" stroke="#157BBF" strokeWidth="2" />
          </G>
        );

      case 'toucan':
        return (
          <G>
            {renderBackdrop()}
            <Path d="M 10 170 Q 100 158 190 172" stroke="#5E3616" strokeWidth="16" strokeLinecap="round" fill="none" />
            <Path d="M 10 170 Q 100 158 190 172" stroke="#BC7A3D" strokeWidth="9" strokeLinecap="round" fill="none" />
            <Path d="M 48 145 L 22 184 L 54 182 Z" fill="#263238" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <Ellipse cx="82" cy="126" rx="44" ry="48" fill={`url(#tcBody-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="92" cy="116" rx="28" ry="33" fill={`url(#tcChest-${uid})`} />
            <Path d="M 44 120 Q 52 152 78 150" stroke="#78909C" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.55" />
            <Circle cx="84" cy="74" r="35" fill={`url(#tcBody-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 108 56 Q 182 54 186 96 Q 148 102 108 94 Z" fill={`url(#tcBeak-${uid})`} stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
            <Path d="M 118 65 Q 152 64 170 74" stroke="#FFF6D1" strokeWidth="4" strokeLinecap="round" opacity="0.7" fill="none" />
            <Path d="M 108 82 Q 146 84 180 91" stroke={INK} strokeWidth="3.5" fill="none" />
            <Circle cx="92" cy="72" r="16.5" fill="#4FC3F7" stroke={INK} strokeWidth="3.5" />
            <Circle cx="94" cy="72" r="8.5" fill={INK} />
            <Circle cx="96.5" cy="69" r="3.2" fill="#FFFFFF" />
            <Circle cx="72" cy="164" r="6" fill="#FF8A65" stroke={INK} strokeWidth="3" />
            <Circle cx="92" cy="164" r="6" fill="#FF8A65" stroke={INK} strokeWidth="3" />
          </G>
        );

      case 'monkey':
        return (
          <G>
            {renderBackdrop()}
            <Path d="M 144 166 Q 186 154 178 122 Q 172 104 158 114" stroke={INK} strokeWidth="15" strokeLinecap="round" fill="none" />
            <Path d="M 144 166 Q 186 154 178 122 Q 172 104 158 114" stroke="#A35E28" strokeWidth="8" strokeLinecap="round" fill="none" />
            <Circle cx="42" cy="92" r="23" fill={`url(#mkFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="42" cy="92" r="13.5" fill={`url(#mkFace-${uid})`} />
            <Circle cx="158" cy="92" r="23" fill={`url(#mkFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="158" cy="92" r="13.5" fill={`url(#mkFace-${uid})`} />
            <Ellipse cx="100" cy="174" rx="48" ry="38" fill={`url(#mkFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="178" rx="28" ry="24" fill={`url(#mkFace-${uid})`} />
            <Circle cx="100" cy="92" r="52" fill={`url(#mkFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 94 42 Q 106 20 118 38" stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none" />
            <Circle cx="81" cy="84" r="24" fill={`url(#mkFace-${uid})`} />
            <Circle cx="119" cy="84" r="24" fill={`url(#mkFace-${uid})`} />
            <Ellipse cx="100" cy="112" rx="40" ry="29" fill={`url(#mkFace-${uid})`} />
            <Ellipse cx="65" cy="108" rx="8.5" ry="5" fill="#FF8585" opacity="0.55" />
            <Ellipse cx="135" cy="108" rx="8.5" ry="5" fill="#FF8585" opacity="0.55" />
            <Circle cx="81" cy="84" r="9" fill={INK} />
            <Circle cx="84" cy="80.5" r="3.3" fill="#FFFFFF" />
            <Circle cx="119" cy="84" r="9" fill={INK} />
            <Circle cx="122" cy="80.5" r="3.3" fill="#FFFFFF" />
            <Circle cx="94" cy="104" r="3" fill="#6D442B" />
            <Circle cx="106" cy="104" r="3" fill="#6D442B" />
            <Path d="M 78 117 Q 100 137 122 117" stroke="#5D351A" strokeWidth="4.8" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'zebra':
        return (
          <G>
            {renderBackdrop()}
            <Path d="M 84 42 L 92 22 L 100 38 L 108 20 L 116 42 Z" fill="#313942" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <Ellipse cx="58" cy="54" rx="14" ry="22" fill="#FFFFFF" stroke={INK} strokeWidth="4.2" transform="rotate(-24 58 54)" />
            <Ellipse cx="58" cy="55" rx="7" ry="12" fill="#FFB8C6" transform="rotate(-24 58 55)" />
            <Ellipse cx="142" cy="54" rx="14" ry="22" fill="#FFFFFF" stroke={INK} strokeWidth="4.2" transform="rotate(24 142 54)" />
            <Ellipse cx="142" cy="55" rx="7" ry="12" fill="#FFB8C6" transform="rotate(24 142 55)" />
            <Path d="M 70 128 L 62 200 L 138 200 L 130 128 Z" fill={`url(#zbBody-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 68 158 L 94 164 L 66 172 Z" fill="#313942" />
            <Path d="M 134 166 L 106 174 L 136 184 Z" fill="#313942" />
            <Ellipse cx="100" cy="94" rx="48" ry="48" fill={`url(#zbBody-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 55 82 L 76 86 L 54 94 Z" fill="#313942" />
            <Path d="M 145 82 L 124 86 L 146 94 Z" fill="#313942" />
            <Path d="M 94 46 L 100 66 L 106 46 Z" fill="#313942" />
            <Ellipse cx="100" cy="118" rx="34" ry="24" fill="#525D69" stroke={INK} strokeWidth="4" />
            <Ellipse cx="96" cy="108" rx="14" ry="5" fill="#7D8A99" opacity="0.5" />
            <Circle cx="79" cy="86" r="8.5" fill={INK} />
            <Circle cx="82" cy="82.5" r="3.2" fill="#FFFFFF" />
            <Circle cx="121" cy="86" r="8.5" fill={INK} />
            <Circle cx="124" cy="82.5" r="3.2" fill="#FFFFFF" />
            <Ellipse cx="64" cy="104" rx="7.5" ry="4.5" fill="#FF9AA2" opacity="0.65" />
            <Ellipse cx="136" cy="104" rx="7.5" ry="4.5" fill="#FF9AA2" opacity="0.65" />
            <Circle cx="88" cy="114" r="3.8" fill="#23282E" />
            <Circle cx="112" cy="114" r="3.8" fill="#23282E" />
            <Path d="M 86 127 Q 100 137 114 127" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'hippo':
        return (
          <G>
            {renderBackdrop()}
            <Circle cx="62" cy="52" r="14" fill={`url(#hpSkin-${uid})`} stroke={INK} strokeWidth="4.2" />
            <Circle cx="62" cy="52" r="7" fill="#F8BBD0" />
            <Circle cx="138" cy="52" r="14" fill={`url(#hpSkin-${uid})`} stroke={INK} strokeWidth="4.2" />
            <Circle cx="138" cy="52" r="7" fill="#F8BBD0" />
            <Ellipse cx="100" cy="168" rx="60" ry="42" fill={`url(#hpSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="100" cy="86" r="46" fill={`url(#hpSkin-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="84" cy="58" rx="14" ry="6" fill="#EFE8FC" opacity="0.6" />
            <Circle cx="80" cy="78" r="8.4" fill={INK} />
            <Circle cx="83" cy="75" r="3" fill="#FFFFFF" />
            <Circle cx="120" cy="78" r="8.4" fill={INK} />
            <Circle cx="123" cy="75" r="3" fill="#FFFFFF" />
            <Ellipse cx="100" cy="116" rx="48" ry="31" fill={`url(#hpSnout-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="88" cy="100" rx="16" ry="5" fill="#F6F0FF" opacity="0.6" />
            <Ellipse cx="62" cy="116" rx="8" ry="5" fill="#F48FB1" opacity="0.6" />
            <Ellipse cx="138" cy="116" rx="8" ry="5" fill="#F48FB1" opacity="0.6" />
            <Ellipse cx="82" cy="108" rx="5.5" ry="4" fill="#594385" />
            <Ellipse cx="118" cy="108" rx="5.5" ry="4" fill="#594385" />
            <Path d="M 76 125 Q 100 144 124 125" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <Rect x="82" y="131" width="9" height="9" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
            <Rect x="109" y="131" width="9" height="9" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
          </G>
        );

      case 'tiger':
        return (
          <G>
            {renderBackdrop()}
            <Circle cx="54" cy="56" r="18" fill={`url(#tgFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="54" cy="56" r="9.5" fill="#FFE6C4" />
            <Circle cx="146" cy="56" r="18" fill={`url(#tgFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="146" cy="56" r="9.5" fill="#FFE6C4" />
            <Ellipse cx="100" cy="174" rx="52" ry="38" fill={`url(#tgFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="178" rx="30" ry="26" fill="#FFF3DC" />
            <Circle cx="100" cy="96" r="52" fill={`url(#tgFur-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Path d="M 92 46 L 100 66 L 108 46 Z" fill="#3B2314" />
            <Path d="M 78 50 L 85 66 L 89 48 Z" fill="#3B2314" />
            <Path d="M 122 50 L 115 66 L 111 48 Z" fill="#3B2314" />
            <Path d="M 50 90 L 68 95 L 50 102 Z" fill="#3B2314" />
            <Path d="M 150 90 L 132 95 L 150 102 Z" fill="#3B2314" />
            <Ellipse cx="86" cy="116" rx="20" ry="16" fill="#FFF4DE" />
            <Ellipse cx="114" cy="116" rx="20" ry="16" fill="#FFF4DE" />
            <Circle cx="80" cy="88" r="8.8" fill={INK} />
            <Circle cx="83" cy="84.5" r="3.2" fill="#FFFFFF" />
            <Circle cx="120" cy="88" r="8.8" fill={INK} />
            <Circle cx="123" cy="84.5" r="3.2" fill="#FFFFFF" />
            <Ellipse cx="64" cy="108" rx="8" ry="4.5" fill="#FF7E7E" opacity="0.55" />
            <Ellipse cx="136" cy="108" rx="8" ry="4.5" fill="#FF7E7E" opacity="0.55" />
            <Polygon points="90,104 110,104 100,116" fill="#F06292" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
            <Path d="M 86 122 Q 100 134 114 122" stroke={INK} strokeWidth="4.2" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'panda':
        return (
          <G>
            {renderBackdrop()}
            {withBackdrop && (
              <G opacity="0.78">
                <Rect x="166" y="18" width="12" height="144" rx="6" fill="#4EB857" stroke="#1E5D2D" strokeWidth="3" />
                <Path d="M 166 54 Q 140 38 144 64 Q 158 68 166 54 Z" fill="#6CD471" stroke="#1E5D2D" strokeWidth="2.5" />
              </G>
            )}
            <Circle cx="54" cy="54" r="19" fill="#2F3540" stroke={INK} strokeWidth="4.5" />
            <Circle cx="146" cy="54" r="19" fill="#2F3540" stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="174" rx="54" ry="38" fill="#2F3540" stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="178" rx="34" ry="26" fill={`url(#pdWhite-${uid})`} />
            <Ellipse cx="100" cy="96" rx="54" ry="49" fill={`url(#pdWhite-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="76" cy="92" rx="18" ry="15" fill="#2F3540" transform="rotate(-18 76 92)" />
            <Ellipse cx="124" cy="92" rx="18" ry="15" fill="#2F3540" transform="rotate(18 124 92)" />
            <Circle cx="78" cy="90" r="6.8" fill="#FFFFFF" />
            <Circle cx="79.5" cy="90" r="4.2" fill={INK} />
            <Circle cx="81" cy="88" r="1.6" fill="#FFFFFF" />
            <Circle cx="122" cy="90" r="6.8" fill="#FFFFFF" />
            <Circle cx="120.5" cy="90" r="4.2" fill={INK} />
            <Circle cx="122" cy="88" r="1.6" fill="#FFFFFF" />
            <Ellipse cx="62" cy="110" rx="9" ry="5.5" fill="#FF8DA1" opacity="0.65" />
            <Ellipse cx="138" cy="110" rx="9" ry="5.5" fill="#FF8DA1" opacity="0.65" />
            <Ellipse cx="100" cy="108" rx="9" ry="6" fill="#2F3540" />
            <Path d="M 86 121 Q 100 133 114 121" stroke={INK} strokeWidth="4.2" strokeLinecap="round" fill="none" />
          </G>
        );

      case 'frog':
        return (
          <G>
            {renderBackdrop()}
            <Ellipse cx="52" cy="154" rx="22" ry="15" fill={`url(#frGreen-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="148" cy="154" rx="22" ry="15" fill={`url(#frGreen-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="68" cy="64" r="24" fill={`url(#frGreen-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Circle cx="132" cy="64" r="24" fill={`url(#frGreen-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="118" rx="64" ry="48" fill={`url(#frGreen-${uid})`} stroke={INK} strokeWidth="4.5" />
            <Ellipse cx="100" cy="134" rx="42" ry="26" fill="#DFF7C6" />
            <Circle cx="68" cy="64" r="14" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
            <Circle cx="132" cy="64" r="14" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
            <Circle cx="70" cy="64" r="7.5" fill={INK} />
            <Circle cx="134" cy="64" r="7.5" fill={INK} />
            <Circle cx="72.5" cy="61" r="2.8" fill="#FFFFFF" />
            <Circle cx="136.5" cy="61" r="2.8" fill="#FFFFFF" />
            <Ellipse cx="54" cy="112" rx="10" ry="6" fill="#FF8A80" opacity="0.6" />
            <Ellipse cx="146" cy="112" rx="10" ry="6" fill="#FF8A80" opacity="0.6" />
            <Path d="M 66 112 Q 100 138 134 112" stroke="#185223" strokeWidth="5" strokeLinecap="round" fill="none" />
          </G>
        );
    }
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      opacity={silhouette ? 0.28 : faded ? 0.26 : 1}
    >
      {renderDefs()}
      {renderAnimal()}
    </Svg>
  );
};
