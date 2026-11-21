import React, { useId } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { Difficulty } from '../theme';

const INK = '#5C4432';

/**
 * Full-bleed sunlit watercolor jungle clearing surround behind the header & soccer field.
 * Lets the hand-painted `bg-clearing.png` show softly through layered botanical canopy
 * and dappled golden sunbeams.
 */
export const JungleClearingBackdrop: React.FC = () => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={STORYBOOK_ASSETS.bgClearing}
        style={{ width: '100%', height: '100%', opacity: 0.56 }}
        resizeMode="cover"
      />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id={`clearWash-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CBE5B4" stopOpacity="0.62" />
            <Stop offset="0.26" stopColor="#94C56D" stopOpacity="0.72" />
            <Stop offset="0.72" stopColor="#6FA850" stopOpacity="0.82" />
            <Stop offset="1" stopColor="#558C3E" stopOpacity="0.9" />
          </LinearGradient>
          <RadialGradient id={`sunGlow-${uid}`} cx="50%" cy="14%" r="60%">
            <Stop offset="0" stopColor="#FFF9D4" stopOpacity="0.48" />
            <Stop offset="0.55" stopColor="#F0F5BA" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#94C56D" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`sunRay-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFBE0" stopOpacity="0.32" />
            <Stop offset="1" stopColor="#FFFBE0" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Warm meadow wash tying clearing to the pitch */}
        <Rect x="0" y="0" width="800" height="600" fill={`url(#clearWash-${uid})`} />
        <Rect x="0" y="0" width="800" height="600" fill={`url(#sunGlow-${uid})`} />

        {/* Soft slanting golden sunlight beams from the jungle canopy */}
        <Path d="M 110 0 L 225 0 L 340 420 L 180 420 Z" fill={`url(#sunRay-${uid})`} />
        <Path d="M 520 0 L 645 0 L 560 400 L 420 400 Z" fill={`url(#sunRay-${uid})`} />

        {/* Layered watercolor jungle canopy along the top edge */}
        <Path
          d="M -20 76 C 28 32 94 26 146 60 C 202 18 278 24 328 58 C 386 18 462 20 516 56 C 570 22 646 20 698 58 C 744 26 788 32 820 68 L 820 -10 L -20 -10 Z"
          fill="#649D4D"
          opacity="0.62"
        />
        <Path
          d="M -20 54 C 38 16 108 16 162 46 C 222 10 296 14 352 44 C 410 10 486 12 542 44 C 598 14 670 12 724 44 C 764 20 796 24 820 48 L 820 -10 L -20 -10 Z"
          fill="#4A803E"
          opacity="0.78"
        />
        <Path
          d="M -20 34 C 48 6 116 8 176 30 C 240 2 316 6 376 28 C 436 2 512 4 574 28 C 632 6 704 4 758 28 C 786 14 806 16 820 30 L 820 -10 L -20 -10 Z"
          fill="#396832"
          opacity="0.74"
        />

        {/* Delicate hanging storybook vines at top corners */}
        <Path
          d="M 48 34 Q 58 74 44 114"
          stroke="#4E7C3B"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
        <Path
          d="M 52 64 Q 70 58 66 74 Q 52 74 52 64 Z"
          fill="#74B059"
          stroke={INK}
          strokeWidth="1.4"
          opacity="0.75"
        />
        <Path
          d="M 46 92 Q 28 88 32 104 Q 46 102 46 92 Z"
          fill="#649E4D"
          stroke={INK}
          strokeWidth="1.4"
          opacity="0.75"
        />

        <Path
          d="M 754 32 Q 742 74 758 112"
          stroke="#4E7C3B"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.65"
        />
        <Path
          d="M 748 62 Q 730 56 734 72 Q 748 72 748 62 Z"
          fill="#74B059"
          stroke={INK}
          strokeWidth="1.4"
          opacity="0.75"
        />
        <Path
          d="M 754 90 Q 772 86 768 102 Q 754 100 754 90 Z"
          fill="#649E4D"
          stroke={INK}
          strokeWidth="1.4"
          opacity="0.75"
        />
      </Svg>
    </View>
  );
};

/** Small storybook 5-petal wildflower for the meadow apron outside the touchlines */
const Wildflower: React.FC<{
  cx: number;
  cy: number;
  r: number;
  petal: string;
  center: string;
}> = ({ cx, cy, r, petal, center }) => {
  const offset = r * 0.68;
  const pr = r * 0.56;
  return (
    <G opacity={0.9}>
      <Circle cx={cx} cy={cy - offset} r={pr} fill={petal} />
      <Circle cx={cx + offset * 0.95} cy={cy - offset * 0.31} r={pr} fill={petal} />
      <Circle cx={cx + offset * 0.59} cy={cy + offset * 0.81} r={pr} fill={petal} />
      <Circle cx={cx - offset * 0.59} cy={cy + offset * 0.81} r={pr} fill={petal} />
      <Circle cx={cx - offset * 0.95} cy={cy - offset * 0.31} r={pr} fill={petal} />
      <Circle cx={cx} cy={cy} r={r * 0.42} fill={center} stroke={INK} strokeWidth="0.9" />
    </G>
  );
};

/** Storybook bamboo corner flag planted at each corner of the soccer pitch */
const CornerFlag: React.FC<{
  x: number;
  y: number;
  scale: number;
  pennantColor: string;
  flipX?: boolean;
}> = ({ x, y, scale, pennantColor, flipX = false }) => {
  const poleH = 22 * scale;
  const dir = flipX ? -1 : 1;
  return (
    <G>
      {/* Ground grass shadow */}
      <Ellipse cx={x} cy={y + 1.5} rx={6 * scale} ry={2.4 * scale} fill="rgba(38, 68, 30, 0.32)" />
      {/* Tiny base grass blades */}
      <Path
        d={`M ${x - 3.5 * scale} ${y + 1} Q ${x - 5 * scale} ${y - 3.5 * scale} ${x - 1.5 * scale} ${y + 1} M ${x + 1.5 * scale} ${y + 1} Q ${x + 4.5 * scale} ${y - 3 * scale} ${x + 3.5 * scale} ${y + 1}`}
        stroke="#467A39"
        strokeWidth={1.3 * scale}
        strokeLinecap="round"
        fill="none"
      />
      {/* Fluttering storybook pennant */}
      <Path
        d={`M ${x} ${y - poleH + 1} Q ${x + dir * 7 * scale} ${y - poleH - 1.5 * scale} ${x + dir * 14 * scale} ${y - poleH + 4.2 * scale} Q ${x + dir * 7 * scale} ${y - poleH + 7 * scale} ${x} ${y - poleH + 9.2 * scale} Z`}
        fill={pennantColor}
        stroke={INK}
        strokeWidth={1.3 * scale}
        strokeLinejoin="round"
      />
      {/* Pennant sunny stripe accent */}
      <Path
        d={`M ${x + dir * 2 * scale} ${y - poleH + 4.2 * scale} L ${x + dir * 9.5 * scale} ${y - poleH + 4.5 * scale}`}
        stroke="rgba(255, 250, 232, 0.65)"
        strokeWidth={1.3 * scale}
        strokeLinecap="round"
      />
      {/* Bamboo flag pole */}
      <Line
        x1={x}
        y1={y}
        x2={x}
        y2={y - poleH}
        stroke={INK}
        strokeWidth={3.6 * scale}
        strokeLinecap="round"
      />
      <Line
        x1={x}
        y1={y}
        x2={x}
        y2={y - poleH}
        stroke="#E4B878"
        strokeWidth={2 * scale}
        strokeLinecap="round"
      />
      {/* Cute wooden finial dot */}
      <Circle
        cx={x}
        cy={y - poleH}
        r={2.1 * scale}
        fill="#F8D86A"
        stroke={INK}
        strokeWidth={1 * scale}
      />
    </G>
  );
};

/** Hand-painted tropical corner leaf spray framing the outer meadow bank */
const CornerFoliage: React.FC<{
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
  flipY?: boolean;
}> = ({ x, y, scale, flipX = false, flipY = false }) => {
  const sx = (flipX ? -1 : 1) * scale;
  const sy = (flipY ? -1 : 1) * scale;
  return (
    <G transform={`translate(${x}, ${y}) scale(${sx}, ${sy})`} opacity={0.9}>
      {/* Broad deeper jungle leaf */}
      <Path
        d="M -6 -6 C 18 -14 44 -2 54 16 C 32 24 8 18 -6 -6 Z"
        fill="#4D8642"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M 0 -2 Q 24 4 46 13" stroke="#79B45F" strokeWidth="1.4" fill="none" opacity="0.7" />
      {/* Mid sunlit tropical frond */}
      <Path
        d="M -8 2 C 8 24 24 44 12 60 C -4 48 -14 26 -8 2 Z"
        fill="#5F9A4D"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M -4 8 Q 4 28 9 50" stroke="#90C770" strokeWidth="1.3" fill="none" opacity="0.7" />
      {/* Bright small accent sprout */}
      <Path
        d="M 2 2 C 18 8 32 22 28 34 C 14 30 4 18 2 2 Z"
        fill="#7EB960"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </G>
  );
};

/** Soft hand-drawn meadow grass tuft */
const GrassTuft: React.FC<{ x: number; y: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  scale = 1,
  opacity = 0.48,
}) => (
  <Path
    d={`M ${x - 6 * scale} ${y} Q ${x - 8 * scale} ${y - 7 * scale} ${x - 2 * scale} ${y} M ${x - 1 * scale} ${y} Q ${x + 0.5 * scale} ${y - 9.5 * scale} ${x + 3 * scale} ${y} M ${x + 2 * scale} ${y} Q ${x + 7 * scale} ${y - 6.5 * scale} ${x + 7.5 * scale} ${y}`}
    stroke="#4C823C"
    strokeWidth={1.8 * scale}
    strokeLinecap="round"
    fill="none"
    opacity={opacity}
  />
);

interface JungleSoccerPitchProps {
  width: number;
  height: number;
  difficulty: Difficulty;
  isTablet: boolean;
}

/**
 * Responsive Warm Watercolor & Gouache Storybook Jungle Soccer Pitch.
 * Automatically aligns mowed turf stripes, chalk touchlines, penalty boxes,
 * center circle (50%, 50%), kick spot (50%, 70%), bamboo corner flags,
 * wildflowers, and botanical corner foliage to the active field dimensions.
 */
export const JungleSoccerPitch: React.FC<JungleSoccerPitchProps> = ({
  width,
  height,
  difficulty,
  isTablet,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const w = Math.max(240, width);
  const h = Math.max(300, height);

  // Pitch bounds: generous enough on phones so side goals at 20%/80% sit cleanly inside
  const padX = Math.max(14, Math.min(48, w * (isTablet ? 0.055 : 0.042)));
  const persp = isTablet ? Math.min(26, w * 0.025) : Math.min(8, w * 0.015);

  const lineTop = Math.max(26, h * 0.16);
  const lineBot = h - Math.max(18, h * 0.045);
  const pitchH = Math.max(160, lineBot - lineTop);

  // Subtle perspective horizontal mapper for any y along the pitch
  const leftAt = (y: number) => {
    const t = Math.max(-0.15, Math.min(1.15, (y - lineTop) / pitchH));
    return padX + persp * (1 - t);
  };
  const rightAt = (y: number) => w - leftAt(y);
  const px = (fracX: number, y: number) => {
    const l = leftAt(y);
    return l + fracX * (rightAt(y) - l);
  };

  // Mowed turf apron extends neatly outside the chalk touchlines
  const apronPadX = isTablet ? 14 : 9;
  const apronPadTop = isTablet ? 24 : 18;
  const apronPadBot = isTablet ? 12 : 9;
  const apronTop = Math.max(6, lineTop - apronPadTop);
  const apronBot = Math.min(h - 4, lineBot + apronPadBot);
  const aTLx = Math.max(4, leftAt(apronTop) - apronPadX);
  const aTRx = Math.min(w - 4, rightAt(apronTop) + apronPadX);
  const aBLx = Math.max(4, leftAt(apronBot) - apronPadX);
  const aBRx = Math.min(w - 4, rightAt(apronBot) + apronPadX);

  // Softly rounded trapezoid path for the mowed turf apron
  const rCorner = isTablet ? 22 : 16;
  const apronPath = [
    `M ${aTLx + rCorner} ${apronTop}`,
    `L ${aTRx - rCorner} ${apronTop}`,
    `Q ${aTRx} ${apronTop} ${aTRx + 1} ${apronTop + rCorner}`,
    `L ${aBRx} ${apronBot - rCorner}`,
    `Q ${aBRx} ${apronBot} ${aBRx - rCorner} ${apronBot}`,
    `L ${aBLx + rCorner} ${apronBot}`,
    `Q ${aBLx} ${apronBot} ${aBLx} ${apronBot - rCorner}`,
    `L ${aTLx - 1} ${apronTop + rCorner}`,
    `Q ${aTLx} ${apronTop} ${aTLx + rCorner} ${apronTop}`,
    'Z',
  ].join(' ');

  // 10 alternating horizontal mowed grass bands spanning the turf apron
  const stripeCount = 10;
  const apronH = apronBot - apronTop;
  const stripeH = apronH / stripeCount;

  // Key pitch landmarks aligned directly with BallPassGame physics coordinates!
  const midY = h * 0.5; // Halfway line + center circle (matches Med bumper at 50%)
  const kickY = h * 0.7; // Kick-off / penalty spot (matches ballStartY at 70%)
  const midW = rightAt(midY) - leftAt(midY);
  const centerRx = Math.min(midW * 0.165, pitchH * 0.135);
  const centerRy = centerRx * 0.85;

  // Upper attacking penalty box (adapts cleanly for 1 center goal vs 3 goals on phone/tablet)
  const topBoxY = lineTop + pitchH * (difficulty === 1 ? 0.22 : 0.235);
  const fullWidthTopZone = difficulty > 1 && w < 560;
  const topBoxLFrac = difficulty === 1 ? 0.23 : 0.065;
  const topBoxRFrac = 1 - topBoxLFrac;
  const topSixY = lineTop + pitchH * 0.095;
  const topSixLFrac = difficulty === 1 ? 0.36 : 0.37;
  const topSixRFrac = 1 - topSixLFrac;
  const topArcSpan = Math.min(midW * 0.135, pitchH * 0.105);
  const topArcDepth = Math.min(26, topArcSpan * 0.44);

  // Lower kicking box framing Whit (77%) with a smooth circular D-arc gently cradling the ball
  const botBoxY = Math.min(lineBot - 24, h * 0.755);
  const botBoxLFrac = 0.24;
  const botBoxRFrac = 0.76;
  const botSixY = lineBot - Math.max(18, (lineBot - botBoxY) * 0.46);
  const botArcSpan = Math.min(midW * 0.155, pitchH * 0.115);
  const botArcCtrlLift = Math.min(isTablet ? 44 : 34, botArcSpan * 0.54);

  // Corner arc radius & chalk stroke thickness
  const cArc = isTablet ? 18 : 13;
  const chalkW = isTablet ? 3.4 : 2.7;
  const chalkColor = 'rgba(255, 251, 238, 0.88)';
  const chalkShadow = 'rgba(42, 76, 32, 0.22)';

  const tlX = leftAt(lineTop);
  const trX = rightAt(lineTop);
  const blX = leftAt(lineBot);
  const brX = rightAt(lineBot);

  const flagScale = isTablet ? 1.1 : 0.86;
  const leafScale = isTablet ? 0.92 : 0.68;

  // Combined chalk markings path helper (drawn twice: subtle shadow + crisp warm chalk)
  const renderChalkLines = (stroke: string, strokeWidth: number, offsetY = 0) => (
    <G transform={offsetY ? `translate(0, ${offsetY})` : undefined}>
      {/* Outer touchlines & goal lines */}
      <Path
        d={`M ${tlX} ${lineTop} L ${trX} ${lineTop} L ${brX} ${lineBot} L ${blX} ${lineBot} Z`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Halfway line */}
      <Line
        x1={leftAt(midY)}
        y1={midY}
        x2={rightAt(midY)}
        y2={midY}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Center circle */}
      <Ellipse
        cx={w * 0.5}
        cy={midY}
        rx={centerRx}
        ry={centerRy}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />

      {/* Upper attacking penalty box (full-width attacking third line on narrow phones with 3 goals) */}
      {fullWidthTopZone ? (
        <Line
          x1={leftAt(topBoxY)}
          y1={topBoxY}
          x2={rightAt(topBoxY)}
          y2={topBoxY}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : (
        <Path
          d={`M ${px(topBoxLFrac, lineTop)} ${lineTop} L ${px(topBoxLFrac, topBoxY)} ${topBoxY} L ${px(topBoxRFrac, topBoxY)} ${topBoxY} L ${px(topBoxRFrac, lineTop)} ${lineTop}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}

      {/* Upper 6-yard center goal box */}
      <Path
        d={`M ${px(topSixLFrac, lineTop)} ${lineTop} L ${px(topSixLFrac, topSixY)} ${topSixY} L ${px(topSixRFrac, topSixY)} ${topSixY} L ${px(topSixRFrac, lineTop)} ${lineTop}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.9}
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* Upper penalty D-arc */}
      <Path
        d={`M ${w * 0.5 - topArcSpan} ${topBoxY} Q ${w * 0.5} ${topBoxY + topArcDepth} ${w * 0.5 + topArcSpan} ${topBoxY}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Lower penalty box around Whit */}
      <Path
        d={`M ${px(botBoxLFrac, lineBot)} ${lineBot} L ${px(botBoxLFrac, botBoxY)} ${botBoxY} L ${px(botBoxRFrac, botBoxY)} ${botBoxY} L ${px(botBoxRFrac, lineBot)} ${lineBot}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Lower inner keeper box */}
      <Path
        d={`M ${px(0.36, lineBot)} ${lineBot} L ${px(0.36, botSixY)} ${botSixY} L ${px(0.64, botSixY)} ${botSixY} L ${px(0.64, lineBot)} ${lineBot}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.85}
        strokeLinejoin="round"
        opacity={0.78}
      />

      {/* Lower smooth penalty D-arc gently cradling Whit's kick spot */}
      <Path
        d={`M ${w * 0.5 - botArcSpan} ${botBoxY} Q ${w * 0.5} ${botBoxY - botArcCtrlLift} ${w * 0.5 + botArcSpan} ${botBoxY}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Four perspective-aligned corner quarter-circle arcs */}
      <Path
        d={`M ${tlX + cArc} ${lineTop} Q ${tlX + cArc * 0.82} ${lineTop + cArc * 0.82} ${leftAt(lineTop + cArc)} ${lineTop + cArc}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.9}
      />
      <Path
        d={`M ${trX - cArc} ${lineTop} Q ${trX - cArc * 0.82} ${lineTop + cArc * 0.82} ${rightAt(lineTop + cArc)} ${lineTop + cArc}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.9}
      />
      <Path
        d={`M ${blX + cArc} ${lineBot} Q ${blX + cArc * 0.82} ${lineBot - cArc * 0.82} ${leftAt(lineBot - cArc)} ${lineBot - cArc}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.9}
      />
      <Path
        d={`M ${brX - cArc} ${lineBot} Q ${brX - cArc * 0.82} ${lineBot - cArc * 0.82} ${rightAt(lineBot - cArc)} ${lineBot - cArc}`}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.9}
      />
    </G>
  );

  return (
    <Svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <ClipPath id={`pitchClip-${uid}`}>
          <Path d={apronPath} />
        </ClipPath>

        {/* Warm painterly vertical sunlight wash over the mowed stripes */}
        <LinearGradient id={`turfLight-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF9D6" stopOpacity="0.18" />
          <Stop offset="0.45" stopColor="#FFF9D6" stopOpacity="0.02" />
          <Stop offset="0.82" stopColor="#3B6E30" stopOpacity="0.06" />
          <Stop offset="1" stopColor="#2F5D28" stopOpacity="0.14" />
        </LinearGradient>

        {/* Soft watercolor sun-dapple pools */}
        <RadialGradient id={`sunPool-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFAD4" stopOpacity="0.28" />
          <Stop offset="0.65" stopColor="#EBF5B5" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#EBF5B5" stopOpacity="0" />
        </RadialGradient>

        {/* Subtle warm sandy-earth scuff around the kick spot & goal mouths */}
        <RadialGradient id={`wornTurf-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#D6CE86" stopOpacity="0.34" />
          <Stop offset="0.65" stopColor="#B8CA72" stopOpacity="0.14" />
          <Stop offset="1" stopColor="#94C564" stopOpacity="0" />
        </RadialGradient>

        {/* Soft glowing chalk halo under the ball's starting kick spot */}
        <RadialGradient id={`kickHalo-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFFBE6" stopOpacity="0.46" />
          <Stop offset="0.65" stopColor="#FFFBE6" stopOpacity="0.16" />
          <Stop offset="1" stopColor="#FFFBE6" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Soft deep-meadow shadow framing the mowed soccer pitch */}
      <G transform="translate(0, 5)">
        <Path d={apronPath} fill="rgba(34, 68, 28, 0.24)" />
      </G>

      {/* Rich mossy meadow rim around the turf bed */}
      <Path
        d={apronPath}
        fill="#66A04B"
        stroke="rgba(74, 53, 37, 0.28)"
        strokeWidth="2.4"
      />

      {/* Clipped alternating watercolor mowed grass stripes & sun dapples */}
      <G clipPath={`url(#pitchClip-${uid})`}>
        {Array.from({ length: stripeCount }, (_, idx) => {
          const y0 = apronTop + idx * stripeH;
          const isLight = idx % 2 === 0;
          return (
            <Rect
              key={`stripe-${idx}`}
              x={0}
              y={y0 - 0.5}
              width={w}
              height={stripeH + 1}
              fill={isLight ? '#A3D670' : '#89C05E'}
            />
          );
        })}

        {/* Symmetric 5-column stadium mow sheen (bright sunlit center lane from Whit to center goal) */}
        <Rect x={0} y={apronTop} width={w * 0.2} height={apronH} fill="rgba(255, 252, 224, 0.045)" />
        <Rect x={w * 0.2} y={apronTop} width={w * 0.2} height={apronH} fill="rgba(44, 84, 34, 0.035)" />
        <Rect x={w * 0.4} y={apronTop} width={w * 0.2} height={apronH} fill="rgba(255, 252, 224, 0.055)" />
        <Rect x={w * 0.6} y={apronTop} width={w * 0.2} height={apronH} fill="rgba(44, 84, 34, 0.035)" />
        <Rect x={w * 0.8} y={apronTop} width={w * 0.2} height={apronH} fill="rgba(255, 252, 224, 0.045)" />

        {/* Vertical watercolor sunlit-to-shaded turf depth */}
        <Rect x={0} y={apronTop} width={w} height={apronH} fill={`url(#turfLight-${uid})`} />

        {/* Soft dappled golden jungle sun pools */}
        <Ellipse cx={w * 0.26} cy={h * 0.34} rx={w * 0.18} ry={h * 0.11} fill={`url(#sunPool-${uid})`} />
        <Ellipse cx={w * 0.74} cy={h * 0.58} rx={w * 0.2} ry={h * 0.12} fill={`url(#sunPool-${uid})`} />
        <Ellipse cx={w * 0.5} cy={h * 0.72} rx={w * 0.24} ry={h * 0.11} fill={`url(#sunPool-${uid})`} />

        {/* Beloved lived-in warm turf scuffs in goal mouths & at Whit's kick spot */}
        <Ellipse cx={w * 0.5} cy={kickY} rx={isTablet ? 44 : 32} ry={isTablet ? 20 : 14} fill={`url(#wornTurf-${uid})`} />
        <Ellipse cx={w * 0.5} cy={lineTop + 14} rx={isTablet ? 52 : 36} ry={isTablet ? 20 : 14} fill={`url(#wornTurf-${uid})`} />
        {difficulty > 1 && (
          <>
            <Ellipse cx={w * 0.2} cy={h * 0.24} rx={isTablet ? 40 : 28} ry={isTablet ? 16 : 12} fill={`url(#wornTurf-${uid})`} />
            <Ellipse cx={w * 0.8} cy={h * 0.24} rx={isTablet ? 40 : 28} ry={isTablet ? 16 : 12} fill={`url(#wornTurf-${uid})`} />
          </>
        )}

        {/* Inner sunlit bevel highlight along top & left turf edge */}
        <Path
          d={apronPath}
          fill="none"
          stroke="rgba(255, 250, 224, 0.28)"
          strokeWidth="4"
        />
      </G>

      {/* Crisp Storybook Chalk Markings (shadow underlay + warm cream chalk) */}
      {renderChalkLines(chalkShadow, chalkW + 1.4, 1.4)}
      {renderChalkLines(chalkColor, chalkW, 0)}

      {/* Center kick-off spot */}
      <Ellipse cx={w * 0.5} cy={midY + 1} rx={6} ry={5} fill={chalkShadow} />
      <Ellipse cx={w * 0.5} cy={midY} rx={5.2} ry={4.3} fill={chalkColor} />

      {/* Top penalty spot (on Easy where the center box is classic size) */}
      {difficulty === 1 && (
        <Ellipse
          cx={w * 0.5}
          cy={lineTop + pitchH * 0.16}
          rx={4.2}
          ry={3.4}
          fill={chalkColor}
          opacity={0.85}
        />
      )}

      {/* Ball starting kick-spot marker directly under the soccer ball (50%, 70%) */}
      <Ellipse
        cx={w * 0.5}
        cy={kickY}
        rx={isTablet ? 26 : 20}
        ry={isTablet ? 18 : 14}
        fill={`url(#kickHalo-${uid})`}
      />
      <Ellipse
        cx={w * 0.5}
        cy={kickY}
        rx={isTablet ? 16 : 12}
        ry={isTablet ? 11 : 8.5}
        fill="none"
        stroke="rgba(255, 251, 238, 0.45)"
        strokeWidth={1.8}
        strokeDasharray="4 4"
      />
      <Ellipse cx={w * 0.5} cy={kickY + 1} rx={5.5} ry={4.4} fill={chalkShadow} />
      <Ellipse cx={w * 0.5} cy={kickY} rx={4.8} ry={3.8} fill={chalkColor} />

      {/* Four Storybook Bamboo Corner Flags */}
      <CornerFlag x={tlX} y={lineTop} scale={flagScale} pennantColor="#E6734E" />
      <CornerFlag x={trX} y={lineTop} scale={flagScale} pennantColor="#F6CF58" flipX />
      <CornerFlag x={blX} y={lineBot} scale={flagScale} pennantColor="#F6CF58" />
      <CornerFlag x={brX} y={lineBot} scale={flagScale} pennantColor="#E6734E" flipX />

      {/* Subtle hand-drawn meadow grass tufts along the sideline aprons */}
      <GrassTuft x={Math.max(8, leftAt(h * 0.36) - 6)} y={h * 0.36} scale={isTablet ? 1 : 0.8} />
      <GrassTuft x={Math.min(w - 8, rightAt(h * 0.38) + 6)} y={h * 0.38} scale={isTablet ? 1 : 0.8} />
      <GrassTuft x={Math.max(8, leftAt(h * 0.64) - 6)} y={h * 0.64} scale={isTablet ? 1.05 : 0.82} />
      <GrassTuft x={Math.min(w - 8, rightAt(h * 0.66) + 6)} y={h * 0.66} scale={isTablet ? 1.05 : 0.82} />
      <GrassTuft x={w * 0.22} y={apronTop + 10} scale={0.85} opacity={0.36} />
      <GrassTuft x={w * 0.78} y={apronTop + 10} scale={0.85} opacity={0.36} />

      {/* Lush Tropical Corner Leaf Sprays framing the outer clearing without clipping at the header */}
      <CornerFoliage x={-6} y={Math.max(12, apronTop - 8)} scale={leafScale * 0.85} />
      <CornerFoliage x={w + 6} y={Math.max(12, apronTop - 8)} scale={leafScale * 0.85} flipX />
      <CornerFoliage x={-4} y={h + 6} scale={leafScale} flipY />
      <CornerFoliage x={w + 4} y={h + 6} scale={leafScale} flipX flipY />

      {/* Cheerful Storybook Wildflowers tucked along the outer meadow edges */}
      <Wildflower
        cx={Math.max(11, aBLx * 0.6 + 6)}
        cy={h * 0.84}
        r={isTablet ? 6.5 : 5}
        petal="#FCE07A"
        center="#DF7248"
      />
      <Wildflower
        cx={Math.min(w - 11, w - aBLx * 0.6 - 6)}
        cy={h * 0.82}
        r={isTablet ? 7 : 5.2}
        petal="#F6A6BC"
        center="#F8D459"
      />
      <Wildflower
        cx={Math.max(12, aTLx * 0.7 + 4)}
        cy={h * 0.28}
        r={isTablet ? 5.6 : 4.2}
        petal="#FFF8E6"
        center="#F3B844"
      />
      <Wildflower
        cx={Math.min(w - 12, w - aTLx * 0.7 - 4)}
        cy={h * 0.3}
        r={isTablet ? 5.8 : 4.4}
        petal="#FFF8E6"
        center="#E67A54"
      />
      {isTablet && (
        <>
          <Wildflower
            cx={Math.max(14, leftAt(h * 0.54) - 18)}
            cy={h * 0.54}
            r={5.5}
            petal="#F7B2C4"
            center="#F8D459"
          />
          <Wildflower
            cx={Math.min(w - 14, rightAt(h * 0.52) + 18)}
            cy={h * 0.52}
            r={5.5}
            petal="#FCE07A"
            center="#DF7248"
          />
        </>
      )}
    </Svg>
  );
};

/**
 * Hand-painted 3D wooden & bamboo storybook jungle soccer goal with diamond rope
 * netting, corner twine lashings, leafy vines, and warm golden target glow.
 */
export const JungleGoalArchSvg: React.FC<{
  width: number;
  height: number;
  active: boolean;
}> = ({ width, height, active }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <Svg width={width} height={height} viewBox="0 0 160 110">
      <Defs>
        <LinearGradient id={`netShade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2F5928" stopOpacity="0.22" />
          <Stop offset="0.55" stopColor="#FFF9EC" stopOpacity="0.26" />
          <Stop offset="1" stopColor="#FFF9EC" stopOpacity="0.38" />
        </LinearGradient>
        <RadialGradient id={`goalGlow-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFE97D" stopOpacity="0.78" />
          <Stop offset="0.65" stopColor="#FFD95E" stopOpacity="0.34" />
          <Stop offset="1" stopColor="#FFD95E" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`postWood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={active ? '#FCE07C' : '#E5B475'} />
          <Stop offset="0.55" stopColor={active ? '#F2BE4B' : '#CE9454'} />
          <Stop offset="1" stopColor={active ? '#D99A2E' : '#B1763C'} />
        </LinearGradient>
      </Defs>

      {/* Soft grass shadow beneath the goal base */}
      <Ellipse cx="80" cy="95" rx="70" ry="12.5" fill="rgba(38, 72, 32, 0.26)" />

      {/* Warm sunlit golden target glow when this goal is the active target */}
      {active && (
        <Ellipse cx="80" cy="91" rx="78" ry="20" fill={`url(#goalGlow-${uid})`} />
      )}

      {/* 3D recessed goal net cavity (back rail slightly higher & inset for depth) */}
      <Path
        d="M 21 92 L 32 34 Q 80 22 128 34 L 139 92 Z"
        fill={`url(#netShade-${uid})`}
      />

      {/* Rear wooden support frame (depth silhouette) */}
      <Path
        d="M 29 90 L 35 37 Q 80 25 125 37 L 131 90"
        fill="none"
        stroke="rgba(92, 68, 50, 0.34)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top depth struts connecting front posts to rear net rail */}
      <Line x1="20" y1="28" x2="35" y2="37" stroke="rgba(92, 68, 50, 0.42)" strokeWidth="3.2" strokeLinecap="round" />
      <Line x1="140" y1="28" x2="125" y2="37" stroke="rgba(92, 68, 50, 0.42)" strokeWidth="3.2" strokeLinecap="round" />

      {/* Hand-woven cream rope netting (curved vertical & horizontal + subtle diagonal weave) */}
      <Path
        d="M 42 29 L 38 91 M 58 24 L 56 91 M 80 22 L 80 91 M 102 24 L 104 91 M 118 29 L 122 91 M 27 48 Q 80 39 133 48 M 25 63 Q 80 55 135 63 M 23 78 Q 80 71 137 78"
        stroke="rgba(92, 68, 50, 0.24)"
        strokeWidth="2.4"
        fill="none"
      />
      <Path
        d="M 42 29 L 38 91 M 58 24 L 56 91 M 80 22 L 80 91 M 102 24 L 104 91 M 118 29 L 122 91 M 27 48 Q 80 39 133 48 M 25 63 Q 80 55 135 63 M 23 78 Q 80 71 137 78"
        stroke="rgba(255, 250, 236, 0.66)"
        strokeWidth="1.4"
        fill="none"
      />
      {/* Subtle side-net diagonals */}
      <Path
        d="M 22 44 L 33 52 M 21 62 L 32 70 M 138 44 L 127 52 M 139 62 L 128 70"
        stroke="rgba(255, 250, 236, 0.56)"
        strokeWidth="1.4"
        fill="none"
      />

      {/* Base ground timber pegs */}
      <Ellipse cx="18" cy="95" rx="7.5" ry="3.4" fill="#5D422E" opacity="0.65" />
      <Ellipse cx="142" cy="95" rx="7.5" ry="3.4" fill="#5D422E" opacity="0.65" />

      {/* Front Carved Timber / Bamboo Goal Frame (outer ink contour + warm wood fill) */}
      <Path
        d="M 18 94 L 20 28 Q 80 9 140 28 L 142 94"
        fill="none"
        stroke="#5E412B"
        strokeWidth="15.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 18 94 L 20 28 Q 80 9 140 28 L 142 94"
        fill="none"
        stroke={`url(#postWood-${uid})`}
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sunlit wood specular highlight along crossbar & inner edge */}
      <Path
        d="M 25 26 Q 80 9.5 135 26"
        fill="none"
        stroke="#FFF7DC"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity={active ? 0.85 : 0.62}
      />

      {/* Bamboo joint notches along vertical posts */}
      <Path
        d="M 15 52 L 24 52 M 14.5 74 L 23.5 74 M 136 52 L 145 52 M 136.5 74 L 145.5 74"
        stroke="#7D5636"
        strokeWidth="2.1"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Woven twine rope lashings binding the upper corners */}
      <Path
        d="M 15 31 L 25 23 M 16 35 L 27 27"
        stroke="#F6E5C0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <Path
        d="M 145 31 L 135 23 M 144 35 L 133 27"
        stroke="#F6E5C0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Lush leafy jungle vine clusters & tiny blossoms on both goal corners */}
      <Path
        d="M 18 28 Q 3 16 18 8 Q 30 15 18 28 Z"
        fill="#66A554"
        stroke={INK}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <Path
        d="M 24 22 Q 20 7 35 9 Q 36 20 24 22 Z"
        fill="#82BC68"
        stroke={INK}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <Circle cx="18" cy="22" r="3.4" fill={active ? '#FFE672' : '#F6A4BA'} stroke={INK} strokeWidth="1.2" />

      <Path
        d="M 142 28 Q 157 16 142 8 Q 130 15 142 28 Z"
        fill="#66A554"
        stroke={INK}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <Path
        d="M 136 22 Q 140 7 125 9 Q 124 20 136 22 Z"
        fill="#82BC68"
        stroke={INK}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <Circle cx="142" cy="22" r="3.4" fill={active ? '#FFE672' : '#F8D459'} stroke={INK} strokeWidth="1.2" />
    </Svg>
  );
};
