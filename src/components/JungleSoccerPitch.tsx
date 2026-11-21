import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { Difficulty } from '../theme';

const INK = '#5C4432';

/**
 * Full-bleed sunlit jungle clearing surround behind the header & soccer field.
 * Uses pure Image + View layers (zero full-screen SVG!) to guarantee silky-smooth,
 * glitch-free GPU compositing on both iPad Safari and Android tablet Chrome.
 */
export const JungleClearingBackdrop: React.FC = React.memo(() => (
  <View style={[StyleSheet.absoluteFill, styles.clearingBase]} pointerEvents="none">
    <Image
      source={STORYBOOK_ASSETS.bgClearing}
      style={{ width: '100%', height: '100%', opacity: 0.45 }}
      resizeMode="cover"
    />
    {/* Warm sunlit meadow green wash */}
    <View style={styles.clearingTint} />
    {/* Soft darker jungle canopy ribbon along the very top */}
    <View style={styles.canopyBar} />
  </View>
));

/** Tiny lightweight bamboo corner flag (small 26px SVG, zero gradients/ClipPath) */
const CornerFlagIcon: React.FC<{
  left: number;
  top: number;
  pennantColor: string;
  flipX?: boolean;
}> = ({ left, top, pennantColor, flipX = false }) => {
  const dir = flipX ? -1 : 1;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: left - 14, top: top - 24 }}
    >
      <Svg width={28} height={28} viewBox="-14 -24 28 28">
        <Ellipse cx="0" cy="1" rx="5.5" ry="2.2" fill="rgba(38, 68, 30, 0.28)" />
        <Path
          d={`M 0 -20 Q ${dir * 6} -22 ${dir * 12} -16 Q ${dir * 6} -13 0 -11 Z`}
          fill={pennantColor}
          stroke={INK}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <Line x1="0" y1="0" x2="0" y2="-21" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
        <Line x1="0" y1="0" x2="0" y2="-21" stroke="#E4B878" strokeWidth="1.6" strokeLinecap="round" />
        <Circle cx="0" cy="-21" r="2" fill="#F8D86A" stroke={INK} strokeWidth="1" />
      </Svg>
    </View>
  );
};

interface JungleSoccerPitchProps {
  width: number;
  height: number;
  difficulty: Difficulty;
  isTablet: boolean;
}

/**
 * Pure-View Storybook Jungle Soccer Pitch (ZERO full-screen SVG!).
 * Eliminates Android Chrome / Mali / Skia full-screen SVG GPU tile glitches while
 * rendering crisp mowed grass stripes, chalk touchlines, center circle (50%, 50%),
 * penalty boxes, kick spot (50%, 70%), and bamboo corner flags.
 */
export const JungleSoccerPitch: React.FC<JungleSoccerPitchProps> = React.memo(
  ({ width, height, difficulty, isTablet }) => {
    const w = Math.max(240, width);
    const h = Math.max(300, height);

    const padX = Math.max(14, Math.min(44, Math.round(w * (isTablet ? 0.05 : 0.04))));
    const apronPadX = isTablet ? 12 : 8;
    const apronTop = Math.max(8, Math.round(h * 0.11));
    const apronBot = h - Math.max(8, Math.round(h * 0.025));
    const apronH = Math.max(160, apronBot - apronTop);
    const apronLeft = Math.max(4, padX - apronPadX);
    const apronW = Math.max(200, w - apronLeft * 2);

    const lineTop = Math.max(24, Math.round(h * 0.155));
    const lineBot = h - Math.max(16, Math.round(h * 0.042));
    const pitchH = Math.max(160, lineBot - lineTop);
    const pitchW = Math.max(180, w - padX * 2);

    const midY = Math.round(h * 0.5);
    const kickY = Math.round(h * 0.7);
    const chalkW = isTablet ? 3.5 : 2.5;
    const chalkColor = 'rgba(255, 251, 238, 0.88)';

    const centerDiameter = Math.round(Math.min(pitchW * 0.28, pitchH * 0.25));
    const topBoxH = Math.round(pitchH * (difficulty === 1 ? 0.22 : 0.23));
    const topBoxW =
      difficulty === 1
        ? Math.round(pitchW * 0.54)
        : Math.round(pitchW * (w < 560 ? 0.94 : 0.86));
    const topSixH = Math.round(pitchH * 0.095);
    const topSixW = Math.round(pitchW * 0.26);

    const botBoxTop = Math.min(lineBot - 32, Math.round(h * 0.755));
    const botBoxH = Math.max(28, lineBot - botBoxTop);
    const botBoxW = Math.round(pitchW * 0.52);
    const botSixH = Math.max(18, Math.round(botBoxH * 0.48));
    const botSixW = Math.round(pitchW * 0.28);

    const stripeCount = 10;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Mowed turf apron with 10 alternating clover-green bands (pure View, zero SVG!) */}
        <View
          style={[
            styles.pitchApron,
            {
              left: apronLeft,
              top: apronTop,
              width: apronW,
              height: apronH,
              borderRadius: isTablet ? 24 : 16,
            },
          ]}
        >
          {Array.from({ length: stripeCount }).map((_, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                backgroundColor: idx % 2 === 0 ? '#A3D670' : '#8CC360',
              }}
            />
          ))}
        </View>

        {/* Outer chalk touchline rectangle */}
        <View
          style={[
            styles.chalkRect,
            {
              left: padX,
              top: lineTop,
              width: pitchW,
              height: pitchH,
              borderWidth: chalkW,
              borderColor: chalkColor,
            },
          ]}
        />

        {/* Halfway line */}
        <View
          style={{
            position: 'absolute',
            left: padX,
            top: midY - chalkW / 2,
            width: pitchW,
            height: chalkW,
            backgroundColor: chalkColor,
          }}
        />

        {/* Center circle */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - centerDiameter / 2,
            top: midY - centerDiameter / 2,
            width: centerDiameter,
            height: centerDiameter,
            borderRadius: centerDiameter / 2,
            borderWidth: chalkW,
            borderColor: chalkColor,
          }}
        />

        {/* Center kick-off spot */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - 5,
            top: midY - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: chalkColor,
          }}
        />

        {/* Upper attacking penalty box */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - topBoxW / 2,
            top: lineTop,
            width: topBoxW,
            height: topBoxH,
            borderLeftWidth: chalkW,
            borderRightWidth: chalkW,
            borderBottomWidth: chalkW,
            borderColor: chalkColor,
          }}
        />

        {/* Upper 6-yard goal box */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - topSixW / 2,
            top: lineTop,
            width: topSixW,
            height: topSixH,
            borderLeftWidth: chalkW * 0.9,
            borderRightWidth: chalkW * 0.9,
            borderBottomWidth: chalkW * 0.9,
            borderColor: chalkColor,
            opacity: 0.9,
          }}
        />

        {/* Lower penalty box framing Whit */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - botBoxW / 2,
            top: botBoxTop,
            width: botBoxW,
            height: botBoxH,
            borderLeftWidth: chalkW,
            borderRightWidth: chalkW,
            borderTopWidth: chalkW,
            borderColor: chalkColor,
          }}
        />

        {/* Lower inner keeper box */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - botSixW / 2,
            top: lineBot - botSixH,
            width: botSixW,
            height: botSixH,
            borderLeftWidth: chalkW * 0.85,
            borderRightWidth: chalkW * 0.85,
            borderTopWidth: chalkW * 0.85,
            borderColor: chalkColor,
            opacity: 0.78,
          }}
        />

        {/* Ball starting kick-spot ring at (50%, 70%) */}
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - (isTablet ? 20 : 15),
            top: kickY - (isTablet ? 20 : 15),
            width: isTablet ? 40 : 30,
            height: isTablet ? 40 : 30,
            borderRadius: isTablet ? 20 : 15,
            backgroundColor: 'rgba(255, 251, 230, 0.22)',
            borderWidth: 1.8,
            borderColor: 'rgba(255, 251, 238, 0.5)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: w * 0.5 - 4.5,
            top: kickY - 4.5,
            width: 9,
            height: 9,
            borderRadius: 4.5,
            backgroundColor: chalkColor,
          }}
        />

        {/* Four Storybook Bamboo Corner Flags */}
        <CornerFlagIcon left={padX} top={lineTop} pennantColor="#E6734E" />
        <CornerFlagIcon left={w - padX} top={lineTop} pennantColor="#F6CF58" flipX />
        <CornerFlagIcon left={padX} top={lineBot} pennantColor="#F6CF58" />
        <CornerFlagIcon left={w - padX} top={lineBot} pennantColor="#E6734E" flipX />
      </View>
    );
  }
);

/**
 * Hand-painted wooden & bamboo storybook jungle soccer goal with rope netting,
 * corner twine lashings, and leafy vines. Uses flat/translucent colors (zero
 * SVG RadialGradients or ClipPaths) for rock-solid Android & iPad GPU rendering.
 */
export const JungleGoalArchSvg: React.FC<{
  width: number;
  height: number;
  active: boolean;
}> = React.memo(({ width, height, active }) => (
  <Svg width={width} height={height} viewBox="0 0 160 110">
    {/* Soft grass shadow beneath the goal base */}
    <Ellipse cx="80" cy="95" rx="70" ry="12.5" fill="rgba(38, 72, 32, 0.26)" />

    {/* Warm golden target glow when this goal is active */}
    {active && (
      <Ellipse cx="80" cy="91" rx="76" ry="18" fill="rgba(255, 224, 102, 0.42)" />
    )}

    {/* 3D recessed goal net cavity */}
    <Path
      d="M 21 92 L 32 34 Q 80 22 128 34 L 139 92 Z"
      fill="rgba(255, 249, 236, 0.30)"
    />

    {/* Rear wooden support frame */}
    <Path
      d="M 29 90 L 35 37 Q 80 25 125 37 L 131 90"
      fill="none"
      stroke="rgba(92, 68, 50, 0.34)"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="20" y1="28" x2="35" y2="37" stroke="rgba(92, 68, 50, 0.42)" strokeWidth="3.2" strokeLinecap="round" />
    <Line x1="140" y1="28" x2="125" y2="37" stroke="rgba(92, 68, 50, 0.42)" strokeWidth="3.2" strokeLinecap="round" />

    {/* Hand-woven cream rope netting */}
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

    {/* Base ground timber pegs */}
    <Ellipse cx="18" cy="95" rx="7.5" ry="3.4" fill="#5D422E" opacity="0.65" />
    <Ellipse cx="142" cy="95" rx="7.5" ry="3.4" fill="#5D422E" opacity="0.65" />

    {/* Front Carved Timber / Bamboo Goal Frame */}
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
      stroke={active ? '#F4C654' : '#D29A58'}
      strokeWidth="10.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Sunlit wood specular highlight */}
    <Path
      d="M 25 26 Q 80 9.5 135 26"
      fill="none"
      stroke="#FFF7DC"
      strokeWidth="2.8"
      strokeLinecap="round"
      opacity={active ? 0.88 : 0.62}
    />

    {/* Bamboo joint notches */}
    <Path
      d="M 15 52 L 24 52 M 14.5 74 L 23.5 74 M 136 52 L 145 52 M 136.5 74 L 145.5 74"
      stroke="#7D5636"
      strokeWidth="2.1"
      strokeLinecap="round"
      opacity="0.55"
    />

    {/* Woven twine rope lashings */}
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

    {/* Leafy jungle vine clusters on both goal corners */}
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
));

const styles = StyleSheet.create({
  clearingBase: {
    backgroundColor: '#7DB55B',
  },
  clearingTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(116, 174, 82, 0.42)',
  },
  canopyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: 'rgba(54, 102, 46, 0.34)',
  },
  pitchApron: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(64, 96, 46, 0.34)',
    shadowColor: '#22441C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  chalkRect: {
    position: 'absolute',
  },
});
