import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

const INK = '#4A3525';

export type StoryIconName =
  // UI & Actions
  | 'speaker'
  | 'star'
  | 'sparkle'
  | 'gift'
  | 'lock'
  | 'camera'
  | 'magicWand'
  | 'bucket'
  | 'crayon'
  | 'undo'
  | 'party'
  | 'moon'
  | 'check'
  | 'close'
  | 'play'
  | 'flip'
  | 'minus'
  | 'plus'
  | 'trash'
  | 'medal'
  | 'target'
  // Categories & Habitats
  | 'palette'
  | 'numbers'
  | 'abc'
  | 'puzzle'
  | 'music'
  | 'sprout'
  | 'leaf'
  | 'tree'
  | 'snowflake'
  | 'fish'
  | 'tractor'
  | 'lion'
  // Illustrated Vocabulary & Stamps
  | 'apple'
  | 'banana'
  | 'icecream'
  | 'jellyfish'
  | 'kite'
  | 'nest'
  | 'crown'
  | 'rainbow'
  | 'umbrella'
  | 'xylophone'
  | 'yoyo'
  | 'sun'
  | 'heart'
  | 'flower'
  | 'butterfly'
  | 'paw';

interface StoryIconProps {
  name: StoryIconName;
  size?: number;
  /** Optional tint override for utility glyphs (check, close, play, undo, plus, minus, flip) */
  color?: string;
}

/**
 * Hand-crafted Storybook flat-SVG icon library replacing all OS emojis & glyphs across Whit's World.
 * Uses warm #4A3525 ink outlines and zero <ClipPath>/<RadialGradient> for flawless cross-platform rendering.
 */
export const StoryIcon: React.FC<StoryIconProps> = React.memo(
  ({ name, size = 18, color }) => {
    const strokeTint = color || INK;

    const renderGlyph = () => {
      switch (name) {
        case 'speaker':
          return (
            <G>
              <Path
                d="M 5 12.5 L 10.5 12.5 L 17.5 6.8 Q 19 5.8 19 7.6 L 19 24.4 Q 19 26.2 17.5 25.2 L 10.5 19.5 L 5 19.5 Q 3.6 19.5 3.6 18 L 3.6 14 Q 3.6 12.5 5 12.5 Z"
                fill="#F7C948"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Path
                d="M 22.2 11.4 Q 25.4 16 22.2 20.6"
                fill="none"
                stroke={INK}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <Path
                d="M 25.4 8.2 Q 30 16 25.4 23.8"
                fill="none"
                stroke="#EA7D2C"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </G>
          );

        case 'star':
          return (
            <G>
              <Path
                d="M 16 3 L 19.8 11 L 28.6 12.1 L 22.1 18.2 L 23.8 27 L 16 22.7 L 8.2 27 L 9.9 18.2 L 3.4 12.1 L 12.2 11 Z"
                fill={color || '#FAD44A'}
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Ellipse
                cx="14.2"
                cy="12.2"
                rx="2.3"
                ry="1.3"
                fill="rgba(255,255,255,0.65)"
              />
            </G>
          );

        case 'sparkle':
          return (
            <G>
              <Path
                d="M 14.5 3.5 C 15.2 10.5 17.5 12.8 24.5 13.5 C 17.5 14.2 15.2 16.5 14.5 23.5 C 13.8 16.5 11.5 14.2 4.5 13.5 C 11.5 12.8 13.8 10.5 14.5 3.5 Z"
                fill="#FFE052"
                stroke={INK}
                strokeWidth="2.1"
                strokeLinejoin="round"
              />
              <Path
                d="M 24.5 18.5 C 24.9 21.8 26 22.9 29 23.3 C 26 23.7 24.9 24.8 24.5 28 C 24.1 24.8 23 23.7 20 23.3 C 23 22.9 24.1 21.8 24.5 18.5 Z"
                fill="#FFA93A"
                stroke={INK}
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <Circle cx="7.5" cy="24" r="2.2" fill="#7CC8F8" stroke={INK} strokeWidth="1.5" />
            </G>
          );

        case 'gift':
          return (
            <G>
              <Rect
                x="5"
                y="13"
                width="22"
                height="15"
                rx="3"
                fill="#FF6B8B"
                stroke={INK}
                strokeWidth="2.2"
              />
              <Rect
                x="3.5"
                y="9.5"
                width="25"
                height="5.5"
                rx="2.2"
                fill="#FF8AA4"
                stroke={INK}
                strokeWidth="2.2"
              />
              <Rect x="13.5" y="9.5" width="5" height="18.5" fill="#FFE047" stroke={INK} strokeWidth="1.9" />
              <Path
                d="M 16 9.5 C 11.5 9.5 8 5.2 11 3.4 C 13.8 1.8 15.8 6.4 16 9.5 Z"
                fill="#FFE047"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <Path
                d="M 16 9.5 C 20.5 9.5 24 5.2 21 3.4 C 18.2 1.8 16.2 6.4 16 9.5 Z"
                fill="#FFE047"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'lock':
          return (
            <G>
              <Path
                d="M 10.5 14 L 10.5 10.2 C 10.5 6.4 21.5 6.4 21.5 10.2 L 21.5 14"
                fill="none"
                stroke={INK}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <Rect
                x="6"
                y="13.5"
                width="20"
                height="14.5"
                rx="4"
                fill="#F7C948"
                stroke={INK}
                strokeWidth="2.3"
              />
              <Circle cx="16" cy="19.8" r="2.2" fill={INK} />
              <Path d="M 16 21.5 L 16 24.4" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            </G>
          );

        case 'camera':
          return (
            <G>
              <Path
                d="M 9.5 9.5 L 11.5 6.5 L 20.5 6.5 L 22.5 9.5 Z"
                fill="#6AB8E8"
                stroke={INK}
                strokeWidth="2.1"
                strokeLinejoin="round"
              />
              <Rect
                x="3.5"
                y="9.5"
                width="25"
                height="17.5"
                rx="4.2"
                fill="#4DAAD8"
                stroke={INK}
                strokeWidth="2.3"
              />
              <Circle cx="16" cy="18.2" r="5.5" fill="#FFFDF7" stroke={INK} strokeWidth="2.2" />
              <Circle cx="16" cy="18.2" r="2.8" fill="#2E6DA4" />
              <Circle cx="14.8" cy="17" r="1.1" fill="#FFFFFF" />
              <Circle cx="24" cy="13.2" r="1.6" fill="#FFE047" />
            </G>
          );

        case 'magicWand':
          return (
            <G>
              <Path
                d="M 5.5 26.5 L 19 13"
                stroke="#8E59D4"
                strokeWidth="4.4"
                strokeLinecap="round"
              />
              <Path
                d="M 5.5 26.5 L 19 13"
                stroke={INK}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.35}
              />
              <Path
                d="M 21 3.5 L 22.8 8.3 L 28 8.8 L 24 12.2 L 25.1 17.3 L 21 14.5 L 16.9 17.3 L 18 12.2 L 14 8.8 L 19.2 8.3 Z"
                fill="#FFE047"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <Circle cx="9" cy="9" r="1.8" fill="#FF75B5" />
              <Circle cx="26.5" cy="22" r="1.8" fill="#63C7FF" />
            </G>
          );

        case 'bucket':
          return (
            <G>
              <Path
                d="M 7.5 14 L 17.5 5 L 26.5 14 L 16.5 24 Q 14.8 25.5 13 24 L 7.5 18.5 Q 6 16.8 7.5 14 Z"
                fill="#E8EEF4"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Path
                d="M 11 10.5 Q 16 3.5 22 9.5"
                fill="none"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Path
                d="M 24.5 15.5 C 28 18 29.5 22 27.5 25 C 26 27.2 22.8 27 22.2 24.5 C 21.8 22.5 23.2 19.5 24.5 15.5 Z"
                fill="#29A8F0"
                stroke={INK}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'crayon':
          return (
            <G>
              <Path
                d="M 21.5 4.8 L 27.2 10.5 L 12.2 25.5 L 5.5 26.5 L 6.5 19.8 Z"
                fill="#F05252"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Path
                d="M 15 11.3 L 20.7 17"
                stroke="#FFE047"
                strokeWidth="4.4"
              />
              <Path
                d="M 17.8 8.5 L 23.5 14.2 M 12.2 14.1 L 17.9 19.8 M 6.5 19.8 L 12.2 25.5"
                stroke={INK}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </G>
          );

        case 'undo':
          return (
            <G>
              <Path
                d="M 12.5 8 L 5.8 14.2 L 12.5 20.4"
                fill="none"
                stroke={strokeTint}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M 7.5 14.2 L 19.5 14.2 C 24.5 14.2 27 17.4 27 21 C 27 24.2 24.4 26.2 20.5 26.2 L 15 26.2"
                fill="none"
                stroke={strokeTint}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </G>
          );

        case 'party':
          return (
            <G>
              <Path
                d="M 5 26.8 L 11.2 10.5 L 21.5 20.8 Z"
                fill="#FAD44A"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Path d="M 9.2 16 L 16 22.8" stroke="#F05A7E" strokeWidth="2.4" />
              <Circle cx="20" cy="8" r="2.2" fill="#FF5A82" />
              <Circle cx="26.5" cy="13" r="2.2" fill="#32B854" />
              <Circle cx="25.5" cy="5.5" r="1.9" fill="#2994F0" />
              <Path
                d="M 15.5 7.5 Q 17 4.2 19.5 4.2 M 22.5 15 Q 25.5 15.5 27.5 18"
                fill="none"
                stroke="#FF8C24"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </G>
          );

        case 'moon':
          return (
            <G>
              <Path
                d="M 21.5 5.2 C 13.5 5 7 11 7 18.2 C 7 24.6 12.4 28.5 18.8 27.6 C 23 27 25.8 24.4 26.8 21.8 C 21 23 15.2 18.8 15.4 12.8 C 15.6 9.5 17.8 6.8 21.5 5.2 Z"
                fill="#FFE05A"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Circle cx="24" cy="9.5" r="1.8" fill="#FFE05A" stroke={INK} strokeWidth="1.4" />
            </G>
          );

        case 'check':
          return (
            <Path
              d="M 6.5 16.5 L 13 23.2 L 25.8 9"
              fill="none"
              stroke={strokeTint}
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );

        case 'close':
          return (
            <G>
              <Line
                x1="8.2"
                y1="8.2"
                x2="23.8"
                y2="23.8"
                stroke={strokeTint}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <Line
                x1="23.8"
                y1="8.2"
                x2="8.2"
                y2="23.8"
                stroke={strokeTint}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </G>
          );

        case 'play':
          return (
            <Path
              d="M 9.5 6.8 L 25.2 16 L 9.5 25.2 Z"
              fill={color || '#FFFFFF'}
              stroke={color ? 'none' : INK}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          );

        case 'flip':
          return (
            <G>
              <Line
                x1="7.5"
                y1="16"
                x2="24.5"
                y2="16"
                stroke={strokeTint}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <Path
                d="M 11.8 10.2 L 5.8 16 L 11.8 21.8"
                fill="none"
                stroke={strokeTint}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M 20.2 10.2 L 26.2 16 L 20.2 21.8"
                fill="none"
                stroke={strokeTint}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'minus':
          return (
            <Line
              x1="7.5"
              y1="16"
              x2="24.5"
              y2="16"
              stroke={strokeTint}
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          );

        case 'plus':
          return (
            <G>
              <Line
                x1="16"
                y1="7.5"
                x2="16"
                y2="24.5"
                stroke={strokeTint}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <Line
                x1="7.5"
                y1="16"
                x2="24.5"
                y2="16"
                stroke={strokeTint}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </G>
          );

        case 'trash':
          return (
            <G>
              <Path
                d="M 8 10.5 L 24 10.5 L 22.4 26.8 Q 22.2 28 20.8 28 L 11.2 28 Q 9.8 28 9.6 26.8 Z"
                fill="#F2D7D5"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Line x1="5.8" y1="10.5" x2="26.2" y2="10.5" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
              <Path d="M 12.2 10.5 L 13 6.8 L 19 6.8 L 19.8 10.5" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Line x1="13.2" y1="14.8" x2="13.5" y2="23.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
              <Line x1="18.8" y1="14.8" x2="18.5" y2="23.5" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            </G>
          );

        case 'medal':
          return (
            <G>
              <Path d="M 10 4 L 15 14 L 11 15 L 6.5 5.5 Z" fill="#E54B4B" stroke={INK} strokeWidth="1.9" strokeLinejoin="round" />
              <Path d="M 22 4 L 17 14 L 21 15 L 25.5 5.5 Z" fill="#3B8AE8" stroke={INK} strokeWidth="1.9" strokeLinejoin="round" />
              <Circle cx="16" cy="20.5" r="8.2" fill="#FAD44A" stroke={INK} strokeWidth="2.3" />
              <Path
                d="M 16 15.2 L 17.5 18.6 L 21.2 19 L 18.4 21.4 L 19.2 25 L 16 23.1 L 12.8 25 L 13.6 21.4 L 10.8 19 L 14.5 18.6 Z"
                fill="#FFF4BE"
                stroke={INK}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'target':
          return (
            <G>
              <Circle cx="16" cy="16" r="12" fill="#F05252" stroke={INK} strokeWidth="2.2" />
              <Circle cx="16" cy="16" r="7.6" fill="#FFFDF7" stroke={INK} strokeWidth="1.8" />
              <Circle cx="16" cy="16" r="3.6" fill="#F05252" />
              <Line x1="25.5" y1="6.5" x2="17.2" y2="14.8" stroke="#FFE047" strokeWidth="2.6" strokeLinecap="round" />
              <Circle cx="25.5" cy="6.5" r="2" fill="#FFE047" stroke={INK} strokeWidth="1.4" />
            </G>
          );

        case 'palette':
          return (
            <G>
              <Path
                d="M 16 4.5 C 9 4.5 4 9.8 4 16.4 C 4 22.8 9.2 27.5 15.8 27.5 C 18.6 27.5 20.2 26 20 24 C 19.8 22.2 21 21 22.8 21 L 24.4 21 C 27.2 21 28.5 18.8 28.5 15.8 C 28.5 9.2 23 4.5 16 4.5 Z"
                fill="#F0C78A"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Circle cx="10.5" cy="12" r="2.3" fill="#E53935" />
              <Circle cx="16.5" cy="9.5" r="2.3" fill="#FFE01B" />
              <Circle cx="22.5" cy="12.2" r="2.3" fill="#2994F0" />
              <Circle cx="9.8" cy="18.2" r="2.3" fill="#2BB84A" />
              <Circle cx="15.8" cy="22.2" r="2.2" fill="#FFFDF7" stroke={INK} strokeWidth="1.5" />
            </G>
          );

        case 'numbers':
          return (
            <G>
              <Rect x="4" y="4.5" width="11.5" height="11.5" rx="3" fill="#5CB8FF" stroke={INK} strokeWidth="2" />
              <Rect x="16.5" y="4.5" width="11.5" height="11.5" rx="3" fill="#FF8AA4" stroke={INK} strokeWidth="2" />
              <Rect x="4" y="16.5" width="11.5" height="11.5" rx="3" fill="#FFE052" stroke={INK} strokeWidth="2" />
              <Rect x="16.5" y="16.5" width="11.5" height="11.5" rx="3" fill="#6CD47A" stroke={INK} strokeWidth="2" />
              {/* Stylized 1, 2, 3 dots/strokes */}
              <Path d="M 9.8 7.5 L 9.8 13" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              <Circle cx="20.4" cy="10.2" r="1.4" fill={INK} />
              <Circle cx="24.2" cy="10.2" r="1.4" fill={INK} />
              <Circle cx="8" cy="22.2" r="1.3" fill={INK} />
              <Circle cx="11.6" cy="20.2" r="1.3" fill={INK} />
              <Circle cx="11.6" cy="24.2" r="1.3" fill={INK} />
              <Path d="M 20.5 22.2 L 24 22.2 M 22.2 20.5 L 22.2 24" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            </G>
          );

        case 'abc':
          return (
            <G>
              <Rect x="4.5" y="5" width="23" height="22" rx="5.5" fill="#FFE26A" stroke={INK} strokeWidth="2.3" />
              <Path
                d="M 10.5 22 L 16 9.5 L 21.5 22 M 12.6 17.8 L 19.4 17.8"
                fill="none"
                stroke="#E53935"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'puzzle':
          return (
            <Path
              d="M 6.5 9.5 L 13 9.5 C 12.5 5.8 19.5 5.8 19 9.5 L 24.5 9.5 L 24.5 14.5 C 28.5 14 28.5 21 24.5 20.5 L 24.5 26 L 6.5 26 L 6.5 20 C 10 20.5 10 14.5 6.5 15 Z"
              fill="#62C86E"
              stroke={INK}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          );

        case 'music':
          return (
            <G>
              <Path
                d="M 12 22.5 L 12 8.5 L 25.5 5.5 L 25.5 19.5"
                fill="none"
                stroke={INK}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path d="M 12 12.2 L 25.5 9.2" stroke="#F59E2D" strokeWidth="2.6" strokeLinecap="round" />
              <Ellipse cx="9.2" cy="23.2" rx="4.2" ry="3.2" fill="#FF6B9C" stroke={INK} strokeWidth="2.1" />
              <Ellipse cx="22.8" cy="20.2" rx="4.2" ry="3.2" fill="#4DAAD8" stroke={INK} strokeWidth="2.1" />
            </G>
          );

        case 'sprout':
          return (
            <G>
              <Path d="M 16 27 L 16 14" stroke="#4D9E3F" strokeWidth="2.8" strokeLinecap="round" />
              <Path d="M 16 18 C 9 18 5.5 13 7 8.2 C 12 8.2 16 11.5 16 18 Z" fill="#7AD45E" stroke={INK} strokeWidth="2.1" strokeLinejoin="round" />
              <Path d="M 16 15.5 C 23 15.5 26.5 10.5 25 5.8 C 20 5.8 16 9 16 15.5 Z" fill="#52BA4A" stroke={INK} strokeWidth="2.1" strokeLinejoin="round" />
              <Path d="M 9 27 Q 16 24.8 23 27" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
            </G>
          );

        case 'leaf':
          return (
            <G>
              <Path
                d="M 6.5 25.5 C 6 14 14 5.5 26 5.5 C 26 17.5 17.8 26 6.5 25.5 Z"
                fill="#52BA52"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Path
                d="M 6.5 25.5 Q 15 16.5 23 8.5"
                fill="none"
                stroke={INK}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </G>
          );

        case 'tree':
          return (
            <G>
              <Rect x="13.2" y="19" width="5.6" height="9" rx="1.5" fill="#9E6538" stroke={INK} strokeWidth="2.1" />
              <Path
                d="M 16 4 C 10.5 4 7.5 8 8.5 12 C 5.2 13 4.8 18 8 20.2 C 10.8 21.8 21.2 21.8 24 20.2 C 27.2 18 26.8 13 23.5 12 C 24.5 8 21.5 4 16 4 Z"
                fill="#4BB854"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
            </G>
          );

        case 'snowflake':
          return (
            <G stroke="#3DA5E8" strokeWidth="2.6" strokeLinecap="round">
              <Line x1="16" y1="4" x2="16" y2="28" />
              <Line x1="5.6" y1="10" x2="26.4" y2="22" />
              <Line x1="26.4" y1="10" x2="5.6" y2="22" />
              <Circle cx="16" cy="16" r="3.2" fill="#E3F5FF" stroke={INK} strokeWidth="1.8" />
            </G>
          );

        case 'fish':
          return (
            <G>
              <Path d="M 10.5 16 L 4.2 10.2 L 5.6 16 L 4.2 21.8 Z" fill="#FF8C2A" stroke={INK} strokeWidth="2.1" strokeLinejoin="round" />
              <Path
                d="M 10 16 C 12.5 9.2 22.5 9.2 27.5 16 C 22.5 22.8 12.5 22.8 10 16 Z"
                fill="#FF8C2A"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Path d="M 16.5 10.8 Q 18.5 16 16.5 21.2" fill="none" stroke="#FFFDF7" strokeWidth="2.8" />
              <Circle cx="22.5" cy="14.6" r="1.6" fill={INK} />
            </G>
          );

        case 'tractor':
          return (
            <G>
              <Path d="M 10 10 L 18 10 L 19 16 L 26.5 16 L 26.5 22 L 8 22 L 8 15 L 10 15 Z" fill="#E53935" stroke={INK} strokeWidth="2.1" strokeLinejoin="round" />
              <Rect x="11.5" y="11.5" width="4.8" height="4.2" rx="1" fill="#BCE8FF" />
              <Line x1="23.5" y1="16" x2="23.5" y2="10.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
              <Circle cx="11" cy="23" r="4.6" fill="#4A3525" stroke={INK} strokeWidth="1.8" />
              <Circle cx="11" cy="23" r="1.9" fill="#FFE047" />
              <Circle cx="23.8" cy="24.2" r="3.4" fill="#4A3525" stroke={INK} strokeWidth="1.8" />
              <Circle cx="23.8" cy="24.2" r="1.4" fill="#FFE047" />
            </G>
          );

        case 'lion':
          return (
            <G>
              <Circle cx="16" cy="16" r="11.5" fill="#F2942A" stroke={INK} strokeWidth="2.2" />
              <Circle cx="9" cy="9.5" r="3" fill="#FFD452" stroke={INK} strokeWidth="1.9" />
              <Circle cx="23" cy="9.5" r="3" fill="#FFD452" stroke={INK} strokeWidth="1.9" />
              <Circle cx="16" cy="16.5" r="7.6" fill="#FFD85C" stroke={INK} strokeWidth="2" />
              <Circle cx="13.2" cy="15" r="1.4" fill={INK} />
              <Circle cx="18.8" cy="15" r="1.4" fill={INK} />
              <Path d="M 14.4 17.8 L 17.6 17.8 L 16 19.6 Z" fill={INK} />
              <Path d="M 13.5 20.6 Q 16 22.5 18.5 20.6" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
            </G>
          );

        case 'apple':
          return (
            <G>
              <Path d="M 16 9.5 Q 17 5.5 19.5 4.8" fill="none" stroke={INK} strokeWidth="2.3" strokeLinecap="round" />
              <Path d="M 16.5 9 C 20 6 23.5 6.8 24 9.5 C 21 11 18.2 10.6 16.5 9 Z" fill="#52BA4A" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
              <Path
                d="M 16 10.8 C 11.2 8.5 6 12 6.5 18.2 C 7 24.5 11.4 28 14.5 27.2 Q 16 26.8 17.5 27.2 C 20.6 28 25 24.5 25.5 18.2 C 26 12 20.8 8.5 16 10.8 Z"
                fill="#EE3E3E"
                stroke={INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <Ellipse cx="11.2" cy="15.4" rx="1.8" ry="3" fill="rgba(255,255,255,0.45)" />
            </G>
          );

        case 'banana':
          return (
            <G>
              <Path
                d="M 7 22.5 C 14.5 27.5 25.5 22.5 26 8.2 C 23.8 7.5 22.2 8.6 21.4 10.6 C 19.5 16.8 14 19.5 7 19.2 Z"
                fill="#FFE03B"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Path d="M 24.4 6.2 L 27.5 7.8 L 26.4 9.8 L 23.4 8.2 Z" fill="#8C5B32" stroke={INK} strokeWidth="1.6" />
            </G>
          );

        case 'icecream':
          return (
            <G>
              <Path d="M 10.5 16 L 16 28.5 L 21.5 16 Z" fill="#E6AD65" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Circle cx="12.2" cy="13.5" r="4.8" fill="#FF85B3" stroke={INK} strokeWidth="2" />
              <Circle cx="19.8" cy="13.5" r="4.8" fill="#FFF1B8" stroke={INK} strokeWidth="2" />
              <Circle cx="16" cy="9.5" r="5.2" fill="#8AE0A4" stroke={INK} strokeWidth="2" />
              <Circle cx="16" cy="4.4" r="2" fill="#E53935" stroke={INK} strokeWidth="1.4" />
            </G>
          );

        case 'jellyfish':
          return (
            <G>
              <Path d="M 9.5 19 Q 8.5 24 10.2 27.5 M 14 19.5 Q 15 24.5 13.8 28 M 18.5 19.5 Q 17.5 24.5 19 28 M 22.8 19 Q 24 24 22.2 27.5" fill="none" stroke="#C06BFF" strokeWidth="2.4" strokeLinecap="round" />
              <Path d="M 6.5 18 C 6.5 9.5 25.5 9.5 25.5 18 C 23 19.8 19.5 19.5 16 19.5 C 12.5 19.5 9 19.8 6.5 18 Z" fill="#D594FF" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Circle cx="13" cy="14.5" r="1.3" fill={INK} />
              <Circle cx="19" cy="14.5" r="1.3" fill={INK} />
            </G>
          );

        case 'kite':
          return (
            <G>
              <Path d="M 16 4 L 25.5 14 L 16 24 L 6.5 14 Z" fill="#FF7547" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Path d="M 16 4 L 25.5 14 L 16 14 Z" fill="#FFE047" />
              <Path d="M 16 14 L 6.5 14 L 16 24 Z" fill="#4DAAD8" />
              <Path d="M 16 4 L 25.5 14 L 16 24 L 6.5 14 Z M 16 4 L 16 24 M 6.5 14 L 25.5 14" fill="none" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
              <Path d="M 16 24 Q 19 27.5 24.5 27.8" fill="none" stroke={INK} strokeWidth="2.1" strokeLinecap="round" />
            </G>
          );

        case 'nest':
          return (
            <G>
              <Ellipse cx="12.5" cy="14.5" rx="3.8" ry="4.8" fill="#8CD8FF" stroke={INK} strokeWidth="1.9" />
              <Ellipse cx="19.5" cy="14.5" rx="3.8" ry="4.8" fill="#A6E8FF" stroke={INK} strokeWidth="1.9" />
              <Path d="M 5 16.5 C 5 24.5 10 27.5 16 27.5 C 22 27.5 27 24.5 27 16.5 C 23 19.2 9 19.2 5 16.5 Z" fill="#B57B45" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Path d="M 8 21.5 Q 16 24 24 21.5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            </G>
          );

        case 'crown':
          return (
            <G>
              <Path
                d="M 4.5 24.5 L 4 11 L 11.5 17.2 L 16 7 L 20.5 17.2 L 28 11 L 27.5 24.5 Z"
                fill="#FAD44A"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Circle cx="16" cy="19.2" r="2.2" fill="#E51A1A" />
              <Circle cx="9.6" cy="20.4" r="1.7" fill="#1578E8" />
              <Circle cx="22.4" cy="20.4" r="1.7" fill="#1FA838" />
            </G>
          );

        case 'rainbow':
          return (
            <G>
              <Path d="M 4.5 22.5 A 11.5 11.5 0 0 1 27.5 22.5" fill="none" stroke="#E53935" strokeWidth="3.6" strokeLinecap="round" />
              <Path d="M 8 22.5 A 8 8 0 0 1 24 22.5" fill="none" stroke="#FFE01B" strokeWidth="3.4" strokeLinecap="round" />
              <Path d="M 11.5 22.5 A 4.5 4.5 0 0 1 20.5 22.5" fill="none" stroke="#1E88E5" strokeWidth="3.2" strokeLinecap="round" />
              <Circle cx="6.2" cy="23.5" r="3.6" fill="#FFFDF7" stroke={INK} strokeWidth="1.9" />
              <Circle cx="25.8" cy="23.5" r="3.6" fill="#FFFDF7" stroke={INK} strokeWidth="1.9" />
            </G>
          );

        case 'umbrella':
          return (
            <G>
              <Path d="M 16 17 L 16 25 C 16 27.5 19.5 27.5 20 25.5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
              <Path d="M 4.5 17 C 4.5 9.5 10 5.5 16 5.5 C 22 5.5 27.5 9.5 27.5 17 Q 23.5 15 20 17 Q 16 15 12 17 Q 8.5 15 4.5 17 Z" fill="#9B6BFF" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
              <Line x1="16" y1="3.8" x2="16" y2="5.5" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            </G>
          );

        case 'xylophone':
          return (
            <G>
              <Rect x="4.5" y="7" width="4.4" height="19" rx="2" fill="#E53935" stroke={INK} strokeWidth="1.8" />
              <Rect x="10.5" y="9" width="4.4" height="17" rx="2" fill="#FF9800" stroke={INK} strokeWidth="1.8" />
              <Rect x="16.5" y="11" width="4.4" height="15" rx="2" fill="#FFE01B" stroke={INK} strokeWidth="1.8" />
              <Rect x="22.5" y="13" width="4.4" height="13" rx="2" fill="#2994F0" stroke={INK} strokeWidth="1.8" />
            </G>
          );

        case 'yoyo':
          return (
            <G>
              <Path d="M 22 5.5 Q 25 11 20 14" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
              <Circle cx="15" cy="18.5" r="9.5" fill="#FF5C8A" stroke={INK} strokeWidth="2.3" />
              <Circle cx="15" cy="18.5" r="4.8" fill="#FFE047" stroke={INK} strokeWidth="1.9" />
              <Circle cx="15" cy="18.5" r="1.8" fill={INK} />
            </G>
          );

        case 'sun':
          return (
            <G>
              <Path
                d="M 16 3.5 L 16 6.5 M 16 25.5 L 16 28.5 M 3.5 16 L 6.5 16 M 25.5 16 L 28.5 16 M 7.2 7.2 L 9.4 9.4 M 22.6 22.6 L 24.8 24.8 M 24.8 7.2 L 22.6 9.4 M 9.4 22.6 L 7.2 24.8"
                stroke="#FF8C1A"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <Circle cx="16" cy="16" r="7.5" fill="#FFE02E" stroke={INK} strokeWidth="2.2" />
              <Circle cx="13.5" cy="15" r="1.2" fill={INK} />
              <Circle cx="18.5" cy="15" r="1.2" fill={INK} />
              <Path d="M 13.5 18 Q 16 20.2 18.5 18" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
            </G>
          );

        case 'heart':
          return (
            <G>
              <Path
                d="M 16 27 C 6 20.5 2.8 14.5 5.2 9.2 C 7.5 4.8 13.5 5.2 16 10.2 C 18.5 5.2 24.5 4.8 26.8 9.2 C 29.2 14.5 26 20.5 16 27 Z"
                fill="#F06A94"
                stroke={INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Ellipse cx="11.2" cy="11.4" rx="2.4" ry="1.4" fill="rgba(255,255,255,0.6)" />
            </G>
          );

        case 'flower':
          return (
            <G>
              <Circle cx="16" cy="8.5" r="5" fill="#F082A8" stroke={INK} strokeWidth="2" />
              <Circle cx="23.2" cy="13.8" r="5" fill="#F082A8" stroke={INK} strokeWidth="2" />
              <Circle cx="20.4" cy="22.2" r="5" fill="#F082A8" stroke={INK} strokeWidth="2" />
              <Circle cx="11.6" cy="22.2" r="5" fill="#F082A8" stroke={INK} strokeWidth="2" />
              <Circle cx="8.8" cy="13.8" r="5" fill="#F082A8" stroke={INK} strokeWidth="2" />
              <Circle cx="16" cy="16" r="5" fill="#FAD44A" stroke={INK} strokeWidth="2" />
            </G>
          );

        case 'butterfly':
          return (
            <G>
              <Ellipse cx="9.6" cy="12.5" rx="6.2" ry="5.6" fill="#4DAAD8" stroke={INK} strokeWidth="2" />
              <Ellipse cx="22.4" cy="12.5" rx="6.2" ry="5.6" fill="#4DAAD8" stroke={INK} strokeWidth="2" />
              <Ellipse cx="11.2" cy="21" rx="4.8" ry="4.4" fill="#9B74D4" stroke={INK} strokeWidth="2" />
              <Ellipse cx="20.8" cy="21" rx="4.8" ry="4.4" fill="#9B74D4" stroke={INK} strokeWidth="2" />
              <Ellipse cx="16" cy="17" rx="2.3" ry="7.6" fill={INK} />
              <Path d="M 15 9.5 Q 12 4.5 9.5 5.5 M 17 9.5 Q 20 4.5 22.5 5.5" fill="none" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />
            </G>
          );

        case 'paw':
          return (
            <G>
              <Ellipse cx="16" cy="20" rx="6.6" ry="5.5" fill="#9C6844" stroke={INK} strokeWidth="2.1" />
              <Circle cx="8.4" cy="13" r="3" fill="#9C6844" stroke={INK} strokeWidth="1.9" />
              <Circle cx="13.4" cy="8.8" r="3.1" fill="#9C6844" stroke={INK} strokeWidth="1.9" />
              <Circle cx="18.6" cy="8.8" r="3.1" fill="#9C6844" stroke={INK} strokeWidth="1.9" />
              <Circle cx="23.6" cy="13" r="3" fill="#9C6844" stroke={INK} strokeWidth="1.9" />
            </G>
          );
      }
    };

    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {renderGlyph()}
      </Svg>
    );
  }
);
