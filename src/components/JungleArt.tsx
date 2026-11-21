import React, { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const INK = '#2C2017';

/* -------------------------------------------------------------------------- */
/*                     WOODEN ZOO ENTRANCE SIGNPOST SVG                       */
/* -------------------------------------------------------------------------- */

export const WoodenSignpostSvg: React.FC<{ width?: number; height?: number }> = ({
  width = 270,
  height = 74,
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <Svg width={width} height={height} viewBox="0 0 280 78">
      <Defs>
        <LinearGradient id={`signWood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F0BC76" />
          <Stop offset="0.45" stopColor="#D18E47" />
          <Stop offset="1" stopColor="#9A5C22" />
        </LinearGradient>
        <LinearGradient id={`signInner-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DDA05A" />
          <Stop offset="1" stopColor="#B87330" />
        </LinearGradient>
        <LinearGradient id={`signLeaf-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#85EE75" />
          <Stop offset="1" stopColor="#26853A" />
        </LinearGradient>
        <RadialGradient id={`rivet-${uid}`} cx="35%" cy="30%" r="65%">
          <Stop offset="0" stopColor="#FFF5B8" />
          <Stop offset="0.6" stopColor="#FFD23F" />
          <Stop offset="1" stopColor="#B87A0A" />
        </RadialGradient>
      </Defs>

      {/* Soft ground drop shadow */}
      <Rect x="16" y="16" width="248" height="58" rx="22" fill="#3D220D" opacity="0.26" />

      {/* Main carved wooden plank */}
      <Rect
        x="14"
        y="9"
        width="252"
        height="58"
        rx="22"
        fill={`url(#signWood-${uid})`}
        stroke="#593315"
        strokeWidth="4.5"
      />
      {/* Inset routed wood panel */}
      <Rect
        x="22"
        y="16"
        width="236"
        height="44"
        rx="15"
        fill={`url(#signInner-${uid})`}
        stroke="#8B5120"
        strokeWidth="1.8"
        opacity="0.7"
      />
      {/* Top sunlit bevel */}
      <Path
        d="M 38 14.5 L 242 14.5"
        stroke="#FFF0C8"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      {/* Carved wood grain curves */}
      <Path d="M 40 54 Q 100 49 156 55" stroke="#7A481B" strokeWidth="2.2" opacity="0.35" fill="none" />
      <Path d="M 184 52 Q 214 57 244 51" stroke="#7A481B" strokeWidth="2.2" opacity="0.35" fill="none" />

      {/* Brass corner rivets */}
      <Circle cx="30" cy="24" r="4.8" fill={`url(#rivet-${uid})`} stroke="#593315" strokeWidth="2" />
      <Circle cx="250" cy="24" r="4.8" fill={`url(#rivet-${uid})`} stroke="#593315" strokeWidth="2" />
      <Circle cx="30" cy="52" r="4.8" fill={`url(#rivet-${uid})`} stroke="#593315" strokeWidth="2" />
      <Circle cx="250" cy="52" r="4.8" fill={`url(#rivet-${uid})`} stroke="#593315" strokeWidth="2" />

      {/* Sprouting tropical leaves & flower accents on corners */}
      <Path
        d="M 18 18 Q -1 1 6 31 Q 17 33 18 18 Z"
        fill={`url(#signLeaf-${uid})`}
        stroke="#1C5729"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Path
        d="M 262 18 Q 281 1 274 31 Q 263 33 262 18 Z"
        fill={`url(#signLeaf-${uid})`}
        stroke="#1C5729"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Circle cx="13" cy="21" r="4" fill="#FF799B" stroke="#8C1E42" strokeWidth="1.4" />
      <Circle cx="267" cy="21" r="4" fill="#FF799B" stroke="#8C1E42" strokeWidth="1.4" />
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                 JUNGLE WOODEN PUZZLE CUTOUTS (GAME 1)                      */
/* -------------------------------------------------------------------------- */

export type JungleCutoutKind = 'banana' | 'paw' | 'leaf' | 'parrot' | 'lionHead';

interface JungleCutoutSvgProps {
  kind: JungleCutoutKind;
  size?: number;
  /** True renders a recessed carved-wood slot depression */
  recessed?: boolean;
}

/**
 * Safari/WebKit-safe SVG cutouts: all <Defs> are strictly hoisted to the top of <Svg>.
 */
export const JungleCutoutSvg: React.FC<JungleCutoutSvgProps> = ({
  kind,
  size = 86,
  recessed = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const recFill = '#B6834B';
  const recStroke = '#7C4F20';

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`cb-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF59D" />
          <Stop offset="0.5" stopColor="#FFD23F" />
          <Stop offset="1" stopColor="#EA9508" />
        </LinearGradient>
        <RadialGradient id={`cp-${uid}`} cx="40%" cy="35%" r="65%">
          <Stop offset="0" stopColor="#A6724D" />
          <Stop offset="0.6" stopColor="#7C4D2D" />
          <Stop offset="1" stopColor="#52301A" />
        </RadialGradient>
        <LinearGradient id={`cl-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8AF078" />
          <Stop offset="0.52" stopColor="#3CB854" />
          <Stop offset="1" stopColor="#1B7530" />
        </LinearGradient>
        <LinearGradient id={`cpar-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF7563" />
          <Stop offset="0.55" stopColor="#EE403C" />
          <Stop offset="1" stopColor="#BF2428" />
        </LinearGradient>
        <RadialGradient id={`clm-${uid}`} cx="42%" cy="32%" r="65%">
          <Stop offset="0" stopColor="#FFA240" />
          <Stop offset="0.6" stopColor="#E67A1F" />
          <Stop offset="1" stopColor="#B8520E" />
        </RadialGradient>
        <RadialGradient id={`clf-${uid}`} cx="38%" cy="32%" r="68%">
          <Stop offset="0" stopColor="#FFEA94" />
          <Stop offset="0.6" stopColor="#FFCA52" />
          <Stop offset="1" stopColor="#EC9E24" />
        </RadialGradient>
      </Defs>

      {kind === 'banana' && (
        <G>
          {!recessed && (
            <Path
              d="M 22 77 C 36 96 80 84 88 33 C 90 24 80 19 74 25 C 67 49 49 67 26 65 C 18 65 17 71 22 77 Z"
              fill="#3D220D"
              opacity="0.16"
            />
          )}
          <Path
            d="M 20 74 C 34 94 78 82 86 30 C 88 21 78 16 72 22 C 65 46 47 64 24 62 C 16 62 15 68 20 74 Z"
            fill={recessed ? recFill : `url(#cb-${uid})`}
            stroke={recessed ? recStroke : INK}
            strokeWidth={recessed ? 3.5 : 4.2}
            strokeLinejoin="round"
            strokeDasharray={recessed ? '6 5' : undefined}
          />
          {!recessed && (
            <G>
              <Rect x="72" y="13" width="10" height="12" rx="4" fill="#6D411E" stroke={INK} strokeWidth="3.2" />
              <Path d="M 35 73 Q 64 68 76 37" stroke="#FFFCE0" strokeWidth="4.5" strokeLinecap="round" opacity="0.78" fill="none" />
              <Circle cx="52" cy="64" r="3" fill={INK} />
              <Circle cx="64" cy="56" r="3" fill={INK} />
              <Circle cx="53" cy="63" r="1" fill="#FFFFFF" />
              <Circle cx="65" cy="55" r="1" fill="#FFFFFF" />
              <Path d="M 55 70 Q 62 72 66 64" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            </G>
          )}
        </G>
      )}

      {kind === 'paw' && (
        <G>
          <Circle cx="24" cy="40" r="11" fill={recessed ? recFill : `url(#cp-${uid})`} stroke={recessed ? recStroke : INK} strokeWidth="3.8" />
          <Circle cx="42" cy="24" r="11.5" fill={recessed ? recFill : `url(#cp-${uid})`} stroke={recessed ? recStroke : INK} strokeWidth="3.8" />
          <Circle cx="62" cy="26" r="11.5" fill={recessed ? recFill : `url(#cp-${uid})`} stroke={recessed ? recStroke : INK} strokeWidth="3.8" />
          <Circle cx="79" cy="43" r="10.5" fill={recessed ? recFill : `url(#cp-${uid})`} stroke={recessed ? recStroke : INK} strokeWidth="3.8" />
          <Path
            d="M 26 68 C 24 50 40 42 52 44 C 66 44 78 52 76 70 C 74 84 62 88 50 86 C 38 88 28 82 26 68 Z"
            fill={recessed ? recFill : `url(#cp-${uid})`}
            stroke={recessed ? recStroke : INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          {!recessed && (
            <G>
              <Ellipse cx="50" cy="68" rx="15" ry="11" fill="#F0C69C" opacity="0.9" />
              <Ellipse cx="47" cy="64" rx="7" ry="4" fill="#FFF3E0" opacity="0.45" />
              <Circle cx="24" cy="40" r="4" fill="#F0C69C" opacity="0.85" />
              <Circle cx="42" cy="24" r="4.8" fill="#F0C69C" opacity="0.85" />
              <Circle cx="62" cy="26" r="4.8" fill="#F0C69C" opacity="0.85" />
              <Circle cx="79" cy="43" r="4" fill="#F0C69C" opacity="0.85" />
            </G>
          )}
        </G>
      )}

      {kind === 'leaf' && (
        <G>
          <Path
            d="M 18 82 C 14 36 48 12 86 16 C 86 56 62 86 18 82 Z"
            fill={recessed ? recFill : `url(#cl-${uid})`}
            stroke={recessed ? recStroke : INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
            strokeDasharray={recessed ? '6 5' : undefined}
          />
          {!recessed && (
            <G>
              <Path d="M 18 82 Q 52 50 82 20" stroke="#DEFCDA" strokeWidth="4.2" strokeLinecap="round" fill="none" />
              <Path d="M 38 62 L 32 42" stroke="#DEFCDA" strokeWidth="3.2" strokeLinecap="round" opacity="0.82" />
              <Path d="M 56 46 L 48 28" stroke="#DEFCDA" strokeWidth="3.2" strokeLinecap="round" opacity="0.82" />
              <Path d="M 52 52 L 70 54" stroke="#DEFCDA" strokeWidth="3.2" strokeLinecap="round" opacity="0.82" />
              <Circle cx="31" cy="29" r="4.5" fill="#B3F0FF" opacity="0.8" />
              <Circle cx="29.5" cy="27.5" r="1.6" fill="#FFFFFF" />
            </G>
          )}
        </G>
      )}

      {kind === 'parrot' && (
        <G>
          <Path
            d="M 30 88 L 40 62 C 26 48 30 22 52 20 C 70 18 80 34 78 52 C 76 70 58 84 30 88 Z"
            fill={recessed ? recFill : `url(#cpar-${uid})`}
            stroke={recessed ? recStroke : INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
            strokeDasharray={recessed ? '6 5' : undefined}
          />
          {!recessed && (
            <G>
              <Path d="M 42 52 Q 66 44 64 68 Q 48 74 42 52 Z" fill="#2EB5FF" stroke={INK} strokeWidth="3.2" />
              <Path d="M 46 56 Q 60 52 58 64" stroke="#FFD952" strokeWidth="4.2" strokeLinecap="round" fill="none" />
              <Path d="M 70 30 Q 89 30 86 46 Q 76 44 70 42 Z" fill="#FFD54F" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />
              <Circle cx="58" cy="34" r="9.5" fill="#FFFFFF" stroke={INK} strokeWidth="2.6" />
              <Circle cx="60" cy="34" r="4.6" fill={INK} />
              <Circle cx="61.6" cy="32.4" r="1.7" fill="#FFFFFF" />
            </G>
          )}
        </G>
      )}

      {kind === 'lionHead' && (
        <G>
          <Circle
            cx="50"
            cy="52"
            r="38"
            fill={recessed ? recFill : `url(#clm-${uid})`}
            stroke={recessed ? recStroke : INK}
            strokeWidth="4.2"
            strokeDasharray={recessed ? '6 5' : undefined}
          />
          {!recessed && (
            <G>
              <Circle cx="26" cy="28" r="9" fill="#F5AF32" stroke={INK} strokeWidth="3.5" />
              <Circle cx="74" cy="28" r="9" fill="#F5AF32" stroke={INK} strokeWidth="3.5" />
              <Circle cx="50" cy="54" r="27" fill={`url(#clf-${uid})`} stroke={INK} strokeWidth="3.6" />
              <Ellipse cx="35" cy="60" rx="4.5" ry="2.8" fill="#FF8A80" opacity="0.45" />
              <Ellipse cx="65" cy="60" rx="4.5" ry="2.8" fill="#FF8A80" opacity="0.45" />
              <Circle cx="40" cy="50" r="4.4" fill={INK} />
              <Circle cx="60" cy="50" r="4.4" fill={INK} />
              <Circle cx="41.4" cy="48.5" r="1.6" fill="#FFFFFF" />
              <Circle cx="61.4" cy="48.5" r="1.6" fill="#FFFFFF" />
              <Polygon points="44,57 56,57 50,64" fill="#6D411E" />
              <Path d="M 42 68 Q 50 75 58 68" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            </G>
          )}
        </G>
      )}
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                     STORYBOOK JUNGLE TREATS (GAME 3)                       */
/* -------------------------------------------------------------------------- */

export type ZooTreatKind =
  | 'banana'
  | 'strawberry'
  | 'bamboo'
  | 'mango'
  | 'blueberry'
  | 'watermelon'
  | 'pineapple';

export const ZooTreatSvg: React.FC<{ item: ZooTreatKind; size?: number }> = ({
  item,
  size = 76,
}) => {
  const uid = useId().replace(/:/g, '');

  if (item === 'banana') {
    return <JungleCutoutSvg kind="banana" size={size} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`ts-${uid}`} cx="38%" cy="32%" r="65%">
          <Stop offset="0" stopColor="#FF8888" />
          <Stop offset="0.55" stopColor="#F24444" />
          <Stop offset="1" stopColor="#B81B25" />
        </RadialGradient>
        <LinearGradient id={`tb-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8CF27A" />
          <Stop offset="0.55" stopColor="#43B856" />
          <Stop offset="1" stopColor="#237A34" />
        </LinearGradient>
        <RadialGradient id={`tm-${uid}`} cx="36%" cy="32%" r="68%">
          <Stop offset="0" stopColor="#FFDC6E" />
          <Stop offset="0.5" stopColor="#FF8836" />
          <Stop offset="1" stopColor="#DA4C1A" />
        </RadialGradient>
        <RadialGradient id={`tbl-${uid}`} cx="35%" cy="30%" r="65%">
          <Stop offset="0" stopColor="#8AE0FF" />
          <Stop offset="0.55" stopColor="#2B98F0" />
          <Stop offset="1" stopColor="#1458A3" />
        </RadialGradient>
        <RadialGradient id={`tpi-${uid}`} cx="40%" cy="35%" r="65%">
          <Stop offset="0" stopColor="#FFF28E" />
          <Stop offset="0.6" stopColor="#FFC72C" />
          <Stop offset="1" stopColor="#DA8B00" />
        </RadialGradient>
      </Defs>

      {item === 'strawberry' && (
        <G>
          <Path
            d="M 50 89 C 22 82 14 52 22 33 C 28 20 40 22 50 26 C 60 22 72 20 78 33 C 86 52 78 82 50 89 Z"
            fill={`url(#ts-${uid})`}
            stroke={INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          <Path
            d="M 28 28 Q 50 8 72 28 Q 57 34 50 24 Q 43 34 28 28 Z"
            fill="#46C263"
            stroke="#1C5B2E"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <Ellipse cx="34" cy="46" rx="5.5" ry="10" fill="#FFFFFF" opacity="0.4" transform="rotate(-18 34 46)" />
          <Circle cx="42" cy="46" r="2.8" fill="#FFE082" />
          <Circle cx="56" cy="42" r="2.8" fill="#FFE082" />
          <Circle cx="65" cy="54" r="2.8" fill="#FFE082" />
          <Circle cx="46" cy="64" r="2.8" fill="#FFE082" />
          <Circle cx="58" cy="70" r="2.8" fill="#FFE082" />
        </G>
      )}

      {item === 'bamboo' && (
        <G>
          <Rect x="42" y="14" width="16" height="72" rx="7" fill={`url(#tb-${uid})`} stroke={INK} strokeWidth="4" />
          <Line x1="40" y1="38" x2="60" y2="38" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
          <Line x1="40" y1="62" x2="60" y2="62" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
          <Path d="M 58 36 Q 86 16 86 42 Q 72 48 58 36 Z" fill="#6BE06B" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <Path d="M 42 54 Q 14 36 16 62 Q 30 66 42 54 Z" fill="#52CC5C" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        </G>
      )}

      {item === 'mango' && (
        <G>
          <Path
            d="M 56 18 C 82 22 86 56 70 78 C 56 94 28 90 20 72 C 14 52 28 16 56 18 Z"
            fill={`url(#tm-${uid})`}
            stroke={INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          <Path d="M 52 19 Q 70 6 78 19 Q 64 26 52 19 Z" fill="#46C263" stroke="#1C5B2E" strokeWidth="3.2" />
          <Ellipse cx="38" cy="46" rx="7" ry="13" fill="#FFF2B2" opacity="0.52" transform="rotate(14 38 46)" />
        </G>
      )}

      {item === 'blueberry' && (
        <G>
          <Path d="M 48 34 Q 62 12 78 22 Q 64 38 48 34 Z" fill="#46C263" stroke="#1C5B2E" strokeWidth="3.2" />
          <Circle cx="37" cy="58" r="24" fill={`url(#tbl-${uid})`} stroke={INK} strokeWidth="4" />
          <Circle cx="64" cy="61" r="22" fill={`url(#tbl-${uid})`} stroke={INK} strokeWidth="4" />
          <Circle cx="30" cy="50" r="5.8" fill="#E1F5FE" opacity="0.78" />
          <Circle cx="58" cy="53" r="5" fill="#E1F5FE" opacity="0.78" />
        </G>
      )}

      {item === 'watermelon' && (
        <G>
          <Path
            d="M 14 48 A 36 36 0 0 0 86 48 Z"
            fill="#35A849"
            stroke={INK}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          <Path
            d="M 21 48 A 29 29 0 0 0 79 48 Z"
            fill="#F24B4B"
            stroke="#FFF3E0"
            strokeWidth="3.5"
          />
          <Circle cx="39" cy="57" r="2.8" fill={INK} />
          <Circle cx="50" cy="64" r="2.8" fill={INK} />
          <Circle cx="61" cy="57" r="2.8" fill={INK} />
        </G>
      )}

      {item === 'pineapple' && (
        <G>
          <Path d="M 50 10 L 39 36 L 61 36 Z" fill="#3AA84C" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <Path d="M 30 18 L 41 38 L 52 34 Z" fill="#5ED46B" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
          <Path d="M 70 18 L 59 38 L 48 34 Z" fill="#5ED46B" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
          <Ellipse cx="50" cy="62" rx="27" ry="29" fill={`url(#tpi-${uid})`} stroke={INK} strokeWidth="4.2" />
          <Line x1="34" y1="45" x2="66" y2="79" stroke="#C47800" strokeWidth="2.6" opacity="0.6" />
          <Line x1="66" y1="45" x2="34" y2="79" stroke="#C47800" strokeWidth="2.6" opacity="0.6" />
          <Ellipse cx="38" cy="52" rx="5.5" ry="10" fill="#FFFFFF" opacity="0.4" />
        </G>
      )}
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                COLOR-CODED WOODEN ZOO CRATE / BOWL (GAME 3)                */
/* -------------------------------------------------------------------------- */

interface ZooCrateSvgProps {
  color: string;
  darkColor: string;
  size?: number;
  highlighted?: boolean;
}

export const ZooCrateSvg: React.FC<ZooCrateSvgProps> = ({
  color,
  darkColor,
  size = 104,
  highlighted = false,
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 120 102">
      <Defs>
        <LinearGradient id={`crWood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor={darkColor} />
        </LinearGradient>
      </Defs>
      {/* Ground shadow */}
      <Ellipse cx="60" cy="95" rx="46" ry="6" fill="#2C2017" opacity="0.22" />
      {/* Crate back interior lip */}
      <Rect x="16" y="20" width="88" height="18" rx="8" fill={darkColor} stroke={INK} strokeWidth="3.8" />
      {/* Main rounded wooden zoo feeding crate */}
      <Path
        d="M 12 30 L 108 30 L 100 88 Q 98 95 88 95 L 32 95 Q 22 95 20 88 Z"
        fill={`url(#crWood-${uid})`}
        stroke={highlighted ? '#FFD952' : INK}
        strokeWidth={highlighted ? 5 : 4}
        strokeLinejoin="round"
      />
      {/* Top painted rail + sunlit rim */}
      <Rect x="8" y="26" width="104" height="16" rx="8" fill={color} stroke={INK} strokeWidth="3.8" />
      <Line x1="18" y1="30" x2="102" y2="30" stroke="#FFFFFF" strokeWidth="2.2" opacity="0.45" strokeLinecap="round" />
      {/* Wood slats */}
      <Line x1="20" y1="58" x2="100" y2="58" stroke="rgba(44,32,23,0.32)" strokeWidth="3.5" />
      <Line x1="23" y1="76" x2="97" y2="76" stroke="rgba(44,32,23,0.32)" strokeWidth="3.5" />
      {/* Corner pegs */}
      <Circle cx="20" cy="34" r="3.4" fill="#FFF8DC" stroke={INK} strokeWidth="1.6" />
      <Circle cx="100" cy="34" r="3.4" fill="#FFF8DC" stroke={INK} strokeWidth="1.6" />
      {/* Cute emblem badge in center */}
      <Circle cx="60" cy="66" r="15" fill="#FFFDF5" stroke={INK} strokeWidth="3" />
      <Circle cx="60" cy="66" r="8" fill={color} />
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/*              RUSTLING JUNGLE BUSH COVER (GAME 4 PEEK-A-BOO)                */
/* -------------------------------------------------------------------------- */

export const JungleBushCoverSvg: React.FC<{ size?: number }> = ({
  size = 96,
}) => {
  const uid = useId().replace(/:/g, '');
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <Defs>
        <RadialGradient id={`bsh-${uid}`} cx="38%" cy="28%" r="72%">
          <Stop offset="0" stopColor="#8BF27F" />
          <Stop offset="0.55" stopColor="#3CB854" />
          <Stop offset="1" stopColor="#1D7530" />
        </RadialGradient>
        <LinearGradient id={`gate-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E6AE68" />
          <Stop offset="1" stopColor="#B87633" />
        </LinearGradient>
      </Defs>
      {/* Cute wooden zoo gate slats peeking behind bush */}
      <Rect x="18" y="18" width="14" height="74" rx="6" fill={`url(#gate-${uid})`} stroke={INK} strokeWidth="3.5" />
      <Rect x="78" y="18" width="14" height="74" rx="6" fill={`url(#gate-${uid})`} stroke={INK} strokeWidth="3.5" />
      <Rect x="14" y="34" width="82" height="12" rx="5" fill="#EAB472" stroke={INK} strokeWidth="3.2" />

      {/* Lush puffy leafy bush */}
      <Circle cx="34" cy="60" r="24" fill={`url(#bsh-${uid})`} stroke="#1A5425" strokeWidth="3.8" />
      <Circle cx="76" cy="60" r="24" fill={`url(#bsh-${uid})`} stroke="#1A5425" strokeWidth="3.8" />
      <Circle cx="55" cy="46" r="26" fill={`url(#bsh-${uid})`} stroke="#1A5425" strokeWidth="3.8" />
      <Ellipse cx="55" cy="70" rx="38" ry="22" fill={`url(#bsh-${uid})`} stroke="#1A5425" strokeWidth="3.8" />

      {/* Sunlit leaf highlights */}
      <Ellipse cx="44" cy="36" rx="10" ry="5.5" fill="#CEFDC2" opacity="0.7" />
      <Ellipse cx="72" cy="52" rx="7.5" ry="4.5" fill="#CEFDC2" opacity="0.58" />

      {/* Cheerful tropical hibiscus flower */}
      <Circle cx="76" cy="36" r="7" fill="#FF6F91" stroke={INK} strokeWidth="2.4" />
      <Circle cx="85" cy="43" r="7" fill="#FF6F91" stroke={INK} strokeWidth="2.4" />
      <Circle cx="74" cy="48" r="7" fill="#FF6F91" stroke={INK} strokeWidth="2.4" />
      <Circle cx="78" cy="42" r="4.6" fill="#FFD952" />

      {/* Golden mystery sparkle */}
      <Path d="M 32 76 L 35 68 L 38 76 L 46 79 L 38 82 L 35 90 L 32 82 L 24 79 Z" fill="#FFE066" />
    </Svg>
  );
};

/* -------------------------------------------------------------------------- */
/*                         CHUNKY STORYBOOK UI ICONS                          */
/* -------------------------------------------------------------------------- */

export const HomeIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path
      d="M 4 15 L 16 4 L 28 15 L 25 15 L 25 27 Q 25 28 23 28 L 19 28 L 19 20 L 13 20 L 13 28 L 9 28 Q 7 28 7 27 L 7 15 Z"
      fill={color}
      stroke={INK}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SoundIcon: React.FC<{
  muted: boolean;
  size?: number;
  color?: string;
}> = ({ muted, size = 24, color = '#593315' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path
      d="M 5 12 L 11 12 L 18 6 L 18 26 L 11 20 L 5 20 Z"
      fill={color}
      strokeLinejoin="round"
    />
    {muted ? (
      <G>
        <Line x1="22" y1="11" x2="29" y2="21" stroke="#D93636" strokeWidth="3.4" strokeLinecap="round" />
        <Line x1="29" y1="11" x2="22" y2="21" stroke="#D93636" strokeWidth="3.4" strokeLinecap="round" />
      </G>
    ) : (
      <G>
        <Path d="M 22 11 Q 26 16 22 21" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        <Path d="M 25.5 8 Q 31 16 25.5 24" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      </G>
    )}
  </Svg>
);

export const LockIcon: React.FC<{
  unlocked?: boolean;
  size?: number;
  color?: string;
}> = ({ unlocked = false, size = 22, color = '#7A4800' }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    {unlocked ? (
      <Path
        d="M 10 14 L 10 10 C 10 6 21 5 22 9"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    ) : (
      <Path
        d="M 10 14 L 10 10 C 10 6 22 6 22 10 L 22 14"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    )}
    <Rect x="7" y="14" width="18" height="14" rx="4.5" fill={color} stroke={INK} strokeWidth="1.8" />
    <Circle cx="16" cy="21" r="2.6" fill="#FFFDF5" />
  </Svg>
);

export const StarIcon: React.FC<{
  size?: number;
  color?: string;
  filled?: boolean;
}> = ({ size = 26, color = '#FFD23F', filled = true }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Polygon
      points="16,2.5 20.2,11.2 29.8,12.4 22.6,19 24.6,28.6 16,23.8 7.4,28.6 9.4,19 2.2,12.4 11.8,11.2"
      fill={filled ? color : 'rgba(109, 76, 61, 0.16)'}
      stroke={filled ? '#9C6200' : 'rgba(109, 76, 61, 0.32)'}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlayNextIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 34,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Polygon
      points="8,5 27,16 8,27"
      fill={color}
      stroke={INK}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CrownIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#FFD23F',
}) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path
      d="M 4 24 L 6 10 L 12 16 L 16 7 L 20 16 L 26 10 L 28 24 Z"
      fill={color}
      stroke={INK}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <Circle cx="6" cy="9" r="2.4" fill="#FF7043" />
    <Circle cx="16" cy="6" r="2.6" fill="#F25757" />
    <Circle cx="26" cy="9" r="2.4" fill="#38B6FF" />
  </Svg>
);
