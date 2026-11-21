import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

export type WhitAccessoryId =
  | 'none'
  | 'flower'
  | 'sunhat'
  | 'party'
  | 'crown'
  | 'shades'
  | 'bowtie'
  | 'butterfly'
  | 'captain'
  | 'rainbow';

export interface WhitAccessoryMeta {
  id: WhitAccessoryId;
  label: string;
  starsRequired: number;
  cardBg: string;
  cardBorder: string;
}

export const WHIT_ACCESSORIES: WhitAccessoryMeta[] = [
  {
    id: 'none',
    label: 'Natural Whit',
    starsRequired: 0,
    cardBg: '#F4EDE0',
    cardBorder: '#CBB99B',
  },
  {
    id: 'flower',
    label: 'Jungle Flower',
    starsRequired: 0,
    cardBg: '#FDE6EE',
    cardBorder: '#DF8AA8',
  },
  {
    id: 'sunhat',
    label: 'Safari Sun Hat',
    starsRequired: 1,
    cardBg: '#FBF1D2',
    cardBorder: '#D4A857',
  },
  {
    id: 'party',
    label: 'Party Hat',
    starsRequired: 2,
    cardBg: '#E6F4FD',
    cardBorder: '#74B6DF',
  },
  {
    id: 'crown',
    label: 'Golden Crown',
    starsRequired: 4,
    cardBg: '#FFF3C4',
    cardBorder: '#DBA22B',
  },
  {
    id: 'shades',
    label: 'Star Shades',
    starsRequired: 6,
    cardBg: '#EFE5FB',
    cardBorder: '#9F80CF',
  },
  {
    id: 'bowtie',
    label: 'Polka Bowtie',
    starsRequired: 9,
    cardBg: '#FDE4E0',
    cardBorder: '#DC7A6E',
  },
  {
    id: 'butterfly',
    label: 'Nose Butterfly',
    starsRequired: 13,
    cardBg: '#FFF1D9',
    cardBorder: '#E09A48',
  },
  {
    id: 'captain',
    label: 'Captain Hat',
    starsRequired: 18,
    cardBg: '#E3F2FA',
    cardBorder: '#5C9BC4',
  },
  {
    id: 'rainbow',
    label: 'Rainbow Crown',
    starsRequired: 24,
    cardBg: '#F6EAFB',
    cardBorder: '#BA85D9',
  },
];

export function isAccessoryUnlocked(
  id: WhitAccessoryId,
  starsEarned: number
): boolean {
  const meta = WHIT_ACCESSORIES.find((a) => a.id === id);
  return meta ? starsEarned >= meta.starsRequired : true;
}

const INK = '#5E4028';

/** Standalone warm storybook illustration of each accessory (used on Whit AND in Toybox buttons) */
export const WhitAccessorySvg: React.FC<{
  accessory: WhitAccessoryId;
  size: number;
}> = ({ accessory, size }) => {
  switch (accessory) {
    case 'flower':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path
            d="M 46 60 Q 18 52 14 70 Q 32 76 48 66 Z"
            fill="#66A95C"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Path
            d="M 56 62 Q 82 54 88 72 Q 70 80 54 68 Z"
            fill="#78B86A"
            stroke={INK}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <Circle cx="50" cy="30" r="18" fill="#F27FA2" stroke={INK} strokeWidth="2.8" />
          <Circle cx="70" cy="44" r="18" fill="#F692B1" stroke={INK} strokeWidth="2.8" />
          <Circle cx="62" cy="66" r="17" fill="#EC7298" stroke={INK} strokeWidth="2.8" />
          <Circle cx="38" cy="66" r="17" fill="#F27FA2" stroke={INK} strokeWidth="2.8" />
          <Circle cx="30" cy="44" r="18" fill="#F692B1" stroke={INK} strokeWidth="2.8" />
          <Circle cx="50" cy="50" r="12" fill="#F9D65C" stroke={INK} strokeWidth="2.6" />
          <Circle cx="46" cy="47" r="3" fill="#FFF7CC" />
        </Svg>
      );

    case 'sunhat':
      return (
        <Svg width={size} height={size} viewBox="0 0 120 90">
          <Defs>
            <LinearGradient id="strawGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FCE7A6" />
              <Stop offset="1" stopColor="#DFB362" />
            </LinearGradient>
          </Defs>
          <Ellipse
            cx="60"
            cy="58"
            rx="54"
            ry="18"
            fill="url(#strawGrad)"
            stroke={INK}
            strokeWidth="3.2"
          />
          <Path
            d="M 28 54 C 28 24, 92 24, 92 54 Z"
            fill="#F6D887"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <Path
            d="M 29 50 Q 60 60 91 50 L 92 57 Q 60 67 28 57 Z"
            fill="#5EA35B"
            stroke={INK}
            strokeWidth="2.5"
          />
          <Path
            d="M 80 51 Q 96 34 102 46 Q 94 56 80 54 Z"
            fill="#7EC46D"
            stroke={INK}
            strokeWidth="2.4"
          />
          <Path
            d="M 42 36 Q 58 29 74 36"
            stroke="#FFF9E0"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </Svg>
      );

    case 'party':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="partyGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#6EC7EE" />
              <Stop offset="1" stopColor="#4A9AD0" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 50 18 L 82 82 Q 50 92 18 82 Z"
            fill="url(#partyGrad)"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <Circle cx="50" cy="46" r="6" fill="#FFE066" />
          <Circle cx="36" cy="68" r="6.5" fill="#F68DA8" />
          <Circle cx="64" cy="66" r="6.5" fill="#9AE088" />
          <Circle cx="51" cy="76" r="5" fill="#FFF7D6" />
          <Circle cx="50" cy="17" r="11" fill="#F8D459" stroke={INK} strokeWidth="2.8" />
          <Circle cx="46" cy="14" r="3.5" fill="#FFF9DC" />
        </Svg>
      );

    case 'crown':
      return (
        <Svg width={size} height={size} viewBox="0 0 110 86">
          <Defs>
            <LinearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFE67A" />
              <Stop offset="1" stopColor="#E6A62B" />
            </LinearGradient>
          </Defs>
          <Path
            d="M 16 68 L 10 26 L 36 46 L 55 16 L 74 46 L 100 26 L 94 68 Q 55 78 16 68 Z"
            fill="url(#crownGold)"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <Circle cx="10" cy="24" r="6" fill="#FFE885" stroke={INK} strokeWidth="2.5" />
          <Circle cx="55" cy="14" r="7" fill="#FFE885" stroke={INK} strokeWidth="2.5" />
          <Circle cx="100" cy="24" r="6" fill="#FFE885" stroke={INK} strokeWidth="2.5" />
          <Circle cx="55" cy="54" r="7.5" fill="#E8667A" stroke={INK} strokeWidth="2.2" />
          <Circle cx="32" cy="57" r="5.5" fill="#5CB568" stroke={INK} strokeWidth="2" />
          <Circle cx="78" cy="57" r="5.5" fill="#54B2DC" stroke={INK} strokeWidth="2" />
        </Svg>
      );

    case 'shades':
      return (
        <Svg width={size} height={size} viewBox="0 0 130 66">
          <Path
            d="M 12 28 Q 65 20 118 28"
            stroke={INK}
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <G transform="translate(8, 2)">
            <Polygon
              points="28,4 35,19 52,21 39,33 42,50 28,42 14,50 17,33 4,21 21,19"
              fill="#F8D24C"
              stroke={INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Polygon
              points="28,12 32,22 43,23 35,31 37,42 28,37 19,42 21,31 13,23 24,22"
              fill="#46375E"
            />
            <Path
              d="M 22 21 L 28 17"
              stroke="#FFF8D4"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </G>
          <G transform="translate(66, 2)">
            <Polygon
              points="28,4 35,19 52,21 39,33 42,50 28,42 14,50 17,33 4,21 21,19"
              fill="#F8D24C"
              stroke={INK}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Polygon
              points="28,12 32,22 43,23 35,31 37,42 28,37 19,42 21,31 13,23 24,22"
              fill="#46375E"
            />
            <Path
              d="M 22 21 L 28 17"
              stroke="#FFF8D4"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </G>
        </Svg>
      );

    case 'bowtie':
      return (
        <Svg width={size} height={size} viewBox="0 0 110 70">
          {/* Left wing */}
          <Path
            d="M 52 35 L 14 14 Q 8 35 14 56 Z"
            fill="#E5665B"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Right wing */}
          <Path
            d="M 58 35 L 96 14 Q 102 35 96 56 Z"
            fill="#E5665B"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Cute cream polka dots */}
          <Circle cx="24" cy="28" r="4" fill="#FFF4D4" />
          <Circle cx="30" cy="43" r="3.5" fill="#FFF4D4" />
          <Circle cx="86" cy="28" r="4" fill="#FFF4D4" />
          <Circle cx="80" cy="43" r="3.5" fill="#FFF4D4" />
          {/* Center knot */}
          <Rect
            x="45"
            y="24"
            width="20"
            height="22"
            rx="8"
            fill="#F08074"
            stroke={INK}
            strokeWidth="3.2"
          />
        </Svg>
      );

    case 'butterfly':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 84">
          {/* Upper wings */}
          <Ellipse
            cx="30"
            cy="34"
            rx="22"
            ry="18"
            transform="rotate(-22 30 34)"
            fill="#F9C74F"
            stroke={INK}
            strokeWidth="3"
          />
          <Ellipse
            cx="70"
            cy="34"
            rx="22"
            ry="18"
            transform="rotate(22 70 34)"
            fill="#F9C74F"
            stroke={INK}
            strokeWidth="3"
          />
          {/* Lower wings */}
          <Ellipse
            cx="34"
            cy="58"
            rx="15"
            ry="13"
            transform="rotate(14 34 58)"
            fill="#F28482"
            stroke={INK}
            strokeWidth="2.8"
          />
          <Ellipse
            cx="66"
            cy="58"
            rx="15"
            ry="13"
            transform="rotate(-14 66 58)"
            fill="#F28482"
            stroke={INK}
            strokeWidth="2.8"
          />
          {/* Wing spots */}
          <Circle cx="26" cy="31" r="5.5" fill="#FFF7D4" />
          <Circle cx="74" cy="31" r="5.5" fill="#FFF7D4" />
          {/* Body & antennae */}
          <Rect x="46" y="28" width="8" height="34" rx="4" fill={INK} />
          <Path d="M 48 28 Q 40 12 34 15" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Path d="M 52 28 Q 60 12 66 15" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Circle cx="34" cy="15" r="2.8" fill="#F9C74F" stroke={INK} strokeWidth="1.5" />
          <Circle cx="66" cy="15" r="2.8" fill="#F9C74F" stroke={INK} strokeWidth="1.5" />
        </Svg>
      );

    case 'captain':
      return (
        <Svg width={size} height={size} viewBox="0 0 120 88">
          {/* Dark ocean brim */}
          <Ellipse
            cx="60"
            cy="64"
            rx="46"
            ry="12"
            fill="#345B82"
            stroke={INK}
            strokeWidth="3.2"
          />
          {/* Crisp sailor white crown */}
          <Path
            d="M 18 46 Q 14 22 60 18 Q 106 22 102 46 L 92 60 Q 60 66 28 60 Z"
            fill="#FFFDF6"
            stroke={INK}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Navy ribbon band */}
          <Path
            d="M 27 52 Q 60 59 93 52 L 92 61 Q 60 68 28 61 Z"
            fill="#3E74A8"
            stroke={INK}
            strokeWidth="2.4"
          />
          {/* Golden star-anchor emblem */}
          <Circle cx="60" cy="37" r="10" fill="#F6CA4D" stroke={INK} strokeWidth="2.4" />
          <Path
            d="M 60 30 V 43 M 55 34 H 65 M 55 40 Q 60 45 65 40"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case 'rainbow':
      return (
        <Svg width={size} height={size} viewBox="0 0 124 84">
          {/* Storybook pastel rainbow arcs */}
          <Path
            d="M 18 64 A 44 44 0 0 1 106 64"
            stroke="#EA6B66"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 26 64 A 36 36 0 0 1 98 64"
            stroke="#F6B84C"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 34 64 A 28 28 0 0 1 90 64"
            stroke="#6DC273"
            strokeWidth="8.5"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 42 64 A 20 20 0 0 1 82 64"
            stroke="#62B8E8"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fluffy left & right clouds */}
          <G fill="#FFFDF8" stroke={INK} strokeWidth="2.4">
            <Circle cx="18" cy="64" r="10" />
            <Circle cx="28" cy="62" r="9" />
            <Circle cx="106" cy="64" r="10" />
            <Circle cx="96" cy="62" r="9" />
          </G>
          {/* Little golden sparkle star at top */}
          <Polygon
            points="62,6 64.5,12 71,12.5 66,16.8 67.5,23 62,19.6 56.5,23 58,16.8 53,12.5 59.5,12"
            fill="#FFE266"
            stroke={INK}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'none':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 80 80">
          <Rect
            x="16"
            y="16"
            width="48"
            height="48"
            rx="24"
            fill="#FFF7E6"
            stroke="#C7B293"
            strokeWidth="3"
            strokeDasharray="6 5"
          />
          <Path
            d="M 30 46 Q 40 55 50 46"
            stroke="#8C6A4A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx="33" cy="36" r="3" fill="#8C6A4A" />
          <Circle cx="47" cy="36" r="3" fill="#8C6A4A" />
        </Svg>
      );
  }
};

/**
 * Anchors the chosen accessory directly onto Whit's head/face/neck inside WhitMascot's
 * animated body container so hats, glasses, bowties, and butterflies move seamlessly with Whit!
 */
export const WhitAccessoryOverlay: React.FC<{
  accessory: WhitAccessoryId;
  mascotSize: number;
  isCheering?: boolean;
}> = ({ accessory, mascotSize, isCheering = false }) => {
  const popScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (accessory === 'none') return;
    popScale.setValue(0.35);
    Animated.spring(popScale, {
      toValue: 1,
      friction: 4.6,
      tension: 190,
      useNativeDriver: true,
    }).start();
  }, [accessory, popScale]);

  if (accessory === 'none') return null;

  const headCenterX = isCheering ? mascotSize * 0.5 : mascotSize * 0.47;

  let width = mascotSize * 0.42;
  let top = mascotSize * 0.02;
  let left = headCenterX - width / 2;
  let rotate = '0deg';

  switch (accessory) {
    case 'flower':
      width = mascotSize * 0.24;
      top = isCheering ? mascotSize * 0.06 : mascotSize * 0.07;
      left = headCenterX + mascotSize * 0.05;
      rotate = '14deg';
      break;
    case 'sunhat':
      width = mascotSize * 0.48;
      top = isCheering ? -mascotSize * 0.16 : -mascotSize * 0.14;
      left = headCenterX - width / 2;
      rotate = '-5deg';
      break;
    case 'party':
      width = mascotSize * 0.34;
      top = isCheering ? -mascotSize * 0.12 : -mascotSize * 0.1;
      left = headCenterX - width / 2 + mascotSize * 0.01;
      rotate = '7deg';
      break;
    case 'crown':
      width = mascotSize * 0.36;
      top = isCheering ? -mascotSize * 0.06 : -mascotSize * 0.04;
      left = headCenterX - width / 2;
      rotate = '-4deg';
      break;
    case 'shades':
      width = mascotSize * 0.36;
      top = isCheering ? mascotSize * 0.12 : mascotSize * 0.14;
      left = headCenterX - width / 2;
      rotate = '-2deg';
      break;
    case 'bowtie':
      width = mascotSize * 0.28;
      top = isCheering ? mascotSize * 0.37 : mascotSize * 0.39;
      left = headCenterX - width / 2;
      rotate = '-2deg';
      break;
    case 'butterfly':
      width = mascotSize * 0.22;
      top = isCheering ? mascotSize * 0.2 : mascotSize * 0.22;
      left = headCenterX - width / 2 + mascotSize * 0.04;
      rotate = '12deg';
      break;
    case 'captain':
      width = mascotSize * 0.44;
      top = isCheering ? -mascotSize * 0.14 : -mascotSize * 0.12;
      left = headCenterX - width / 2;
      rotate = '-5deg';
      break;
    case 'rainbow':
      width = mascotSize * 0.56;
      top = isCheering ? -mascotSize * 0.22 : -mascotSize * 0.2;
      left = headCenterX - width / 2;
      rotate = '0deg';
      break;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlayWrap,
        {
          left,
          top,
          width,
          height: width,
          transform: [{ scale: popScale }, { rotate }],
        },
      ]}
    >
      <WhitAccessorySvg accessory={accessory} size={width} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
});
