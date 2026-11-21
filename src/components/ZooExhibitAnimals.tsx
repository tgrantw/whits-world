import React, { useId } from 'react';
import { Image, ImageStyle, Platform, View } from 'react-native';
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
import { STORYBOOK_ANIMALS } from '../assets/assetMap';

export type ExhibitAnimalKind =
  // Primate Jungle Exhibit
  | 'monkey'
  | 'gorilla'
  | 'toucan'
  | 'frog'
  // Zoo Aquarium Exhibit
  | 'whale'
  | 'turtle'
  | 'octopus'
  | 'clownfish'
  // African Savanna Exhibit
  | 'giraffe'
  | 'elephant'
  | 'zebra'
  | 'lion'
  // Bamboo & River Sanctuary Exhibit
  | 'panda'
  | 'hippo'
  | 'tiger'
  | 'flamingo'
  // Snowy Arctic Exhibit
  | 'penguin'
  | 'polarbear'
  | 'seal'
  | 'puffin'
  // Sunny Farm Exhibit
  | 'cow'
  | 'pig'
  | 'duck'
  | 'sheep';

interface ZooExhibitAnimalSvgProps {
  animal: ExhibitAnimalKind;
  size: number;
  /** True renders the exact carved recessed silhouette shape (no circle/box!) */
  silhouette?: boolean;
  /** Optional custom dark tint for the silhouette (matches exhibit lighting) */
  silhouetteColor?: string;
  /** Golden shape-hugging highlight glow when hovered or selected */
  highlighted?: boolean;
  /** Subtle warm cream die-cut contour rim for tactile tray pieces */
  stickerRim?: boolean;
}

const INK = '#4A3525';
const SIL_SOLID = '#261C14';

/**
 * 16 full-body, unmistakably shaped storybook Zoo & Aquarium animals.
 * - Uses bundled Warm Watercolor & Gouache PNGs from `STORYBOOK_ANIMALS` where available
 *   (Batch 1: monkey, toucan, gorilla) with pixel-perfect unified translucent silhouettes!
 * - Gracefully falls back to matching warm-brown SVG art for remaining Batch 2+ animals.
 */
export const ZooExhibitAnimalSvg: React.FC<ZooExhibitAnimalSvgProps> = ({
  animal,
  size,
  silhouette = false,
  highlighted = false,
  stickerRim = false,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const pngSource = STORYBOOK_ANIMALS[animal];
  if (pngSource) {
    // IMPORTANT: On react-native-web, passing `filter` on `<Image>` applies it to BOTH
    // the outer container div AND the inner background div (squaring opacity!).
    // Applying `filter` ONLY on single `<View>` wrappers keeps silhouettes crisp & unmistakable.
    if (Platform.OS === 'web') {
      if (silhouette) {
        return (
          <View
            style={
              {
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                filter: highlighted
                  ? 'drop-shadow(0px 0px 5px rgba(255, 224, 96, 1)) drop-shadow(0px 0px 14px rgba(255, 210, 64, 0.96))'
                  : 'drop-shadow(0px 0px 4px rgba(255, 250, 232, 1)) drop-shadow(0px 0px 10px rgba(255, 245, 204, 0.94))',
              } as unknown as ImageStyle
            }
          >
            <View
              style={
                {
                  width: size,
                  height: size,
                  opacity: highlighted ? 0.44 : 0.36,
                  filter: 'brightness(0) saturate(0)',
                } as unknown as ImageStyle
              }
            >
              <Image
                source={pngSource}
                style={{ width: size, height: size }}
                resizeMode="contain"
              />
            </View>
          </View>
        );
      }

      const outerShadow = highlighted
        ? 'drop-shadow(0px 0px 9px rgba(255, 222, 92, 0.95))'
        : stickerRim
        ? 'drop-shadow(0px 5px 6px rgba(74, 53, 37, 0.28))'
        : undefined;

      return (
        <View
          style={
            {
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
              ...(outerShadow ? { filter: outerShadow } : null),
            } as unknown as ImageStyle
          }
        >
          <Image
            source={pngSource}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={pngSource}
          style={{
            width: size,
            height: size,
            opacity: silhouette ? (highlighted ? 0.44 : 0.34) : 1,
            tintColor: silhouette ? SIL_SOLID : undefined,
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const silhouetteColor = SIL_SOLID;

  const fillOrSil = (normalFill: string) =>
    silhouette ? SIL_SOLID : normalFill;

  const strokeOrSil = (normalStroke = INK, width = 4.0) =>
    silhouette
      ? {
          stroke: 'none',
          strokeWidth: 0,
          strokeLinejoin: 'round' as const,
          strokeLinecap: 'round' as const,
        }
      : {
          stroke: normalStroke,
          strokeWidth: width,
          strokeLinejoin: 'round' as const,
          strokeLinecap: 'round' as const,
        };

  /** Renders the animal's exact silhouette shape as a background aura (for die-cut rim, cutout glow ring, or golden highlight) */
  const renderAnimalBody = (auraMode: 'none' | 'rim' | 'glow' | 'silRing') => {
    const isAura = auraMode !== 'none';
    const auraStroke =
      auraMode === 'glow'
        ? '#FFE37A'
        : auraMode === 'silRing'
        ? '#FFF9E8'
        : '#FFF9EC';
    const auraWidth =
      auraMode === 'glow' ? 14 : auraMode === 'silRing' ? 9 : 11;
    const auraProps = {
      fill: auraStroke,
      stroke: auraStroke,
      strokeWidth: auraWidth,
      strokeLinejoin: 'round' as const,
      strokeLinecap: 'round' as const,
    };

    const s = (normalFill: string, sw = 4.0) =>
      isAura
        ? auraProps
        : {
            fill: fillOrSil(normalFill),
            ...strokeOrSil(INK, sw),
          };

    switch (animal) {
      /* ======================== PRIMATE JUNGLE EXHIBIT ======================== */
      case 'monkey':
        return (
          <G>
            {/* Long curly tail — signature monkey silhouette! */}
            <Path
              d="M 116 122 C 154 128 168 88 150 62 C 138 46 120 56 128 70"
              fill="none"
              stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#7D441B'}
              strokeWidth={isAura ? auraWidth + 6 : 12}
              strokeLinecap="round"
            />
            {!isAura && !silhouette && (
              <Path
                d="M 116 122 C 154 128 168 88 150 62 C 138 46 120 56 128 70"
                fill="none"
                stroke={INK}
                strokeWidth="3.2"
                strokeLinecap="round"
                opacity="0.35"
              />
            )}
            {/* Raised playful arms */}
            <Path
              d="M 60 88 C 34 74 26 48 40 38 C 48 34 56 44 52 56 L 64 76 Z"
              {...s(`url(#mkFur-${uid})`)}
            />
            <Path
              d="M 106 88 C 128 76 136 52 124 42 C 116 36 108 46 112 58 L 100 76 Z"
              {...s(`url(#mkFur-${uid})`)}
            />
            {/* Feet */}
            <Ellipse cx="64" cy="148" rx="15" ry="10" {...s(`url(#mkFur-${uid})`)} />
            <Ellipse cx="102" cy="148" rx="15" ry="10" {...s(`url(#mkFur-${uid})`)} />
            {/* Chubby body */}
            <Ellipse cx="83" cy="116" rx="30" ry="34" {...s(`url(#mkFur-${uid})`)} />
            {/* Big round monkey ears */}
            <Circle cx="46" cy="56" r="14" {...s(`url(#mkFur-${uid})`)} />
            <Circle cx="120" cy="56" r="14" {...s(`url(#mkFur-${uid})`)} />
            {/* Head */}
            <Circle cx="83" cy="60" r="32" {...s(`url(#mkFur-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="83" cy="120" rx="19" ry="22" fill={`url(#mkTan-${uid})`} />
                <Circle cx="46" cy="56" r="7.5" fill={`url(#mkTan-${uid})`} />
                <Circle cx="120" cy="56" r="7.5" fill={`url(#mkTan-${uid})`} />
                <Circle cx="72" cy="54" r="15" fill={`url(#mkTan-${uid})`} />
                <Circle cx="94" cy="54" r="15" fill={`url(#mkTan-${uid})`} />
                <Ellipse cx="83" cy="70" rx="22" ry="15" fill={`url(#mkTan-${uid})`} />
                <Circle cx="72" cy="54" r="5" fill={INK} />
                <Circle cx="94" cy="54" r="5" fill={INK} />
                <Circle cx="73.8" cy="52" r="1.9" fill="#FFFFFF" />
                <Circle cx="95.8" cy="52" r="1.9" fill="#FFFFFF" />
                <Ellipse cx="62" cy="66" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.55" />
                <Ellipse cx="104" cy="66" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.55" />
                <Circle cx="79" cy="66" r="2" fill={INK} />
                <Circle cx="87" cy="66" r="2" fill={INK} />
                <Path d="M 73 74 Q 83 82 93 74" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'gorilla':
        return (
          <G>
            {/* Big broad seated gorilla silhouette */}
            <Ellipse cx="50" cy="144" rx="22" ry="14" {...s(`url(#gFur-${uid})`)} />
            <Ellipse cx="130" cy="144" rx="22" ry="14" {...s(`url(#gFur-${uid})`)} />
            {/* Broad chunky arms resting outward */}
            <Path
              d="M 48 78 C 20 88 18 134 38 148 C 52 152 60 132 58 112 Z"
              {...s(`url(#gFur-${uid})`)}
            />
            <Path
              d="M 132 78 C 160 88 162 134 142 148 C 128 152 120 132 122 112 Z"
              {...s(`url(#gFur-${uid})`)}
            />
            {/* Barrel chest */}
            <Ellipse cx="90" cy="112" rx="46" ry="42" {...s(`url(#gFur-${uid})`)} />
            {/* Ears + domed gorilla head */}
            <Circle cx="52" cy="60" r="11" {...s(`url(#gFur-${uid})`)} />
            <Circle cx="128" cy="60" r="11" {...s(`url(#gFur-${uid})`)} />
            <Path
              d="M 54 64 C 54 30 72 22 90 22 C 108 22 126 30 126 64 C 126 84 110 94 90 94 C 70 94 54 84 54 64 Z"
              {...s(`url(#gFur-${uid})`)}
            />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="90" cy="116" rx="28" ry="26" fill={`url(#gTan-${uid})`} opacity="0.92" />
                <Ellipse cx="90" cy="66" rx="26" ry="21" fill={`url(#gTan-${uid})`} />
                <Path d="M 67 52 Q 90 44 113 52" stroke="#2D3442" strokeWidth="6" strokeLinecap="round" fill="none" />
                <Circle cx="78" cy="60" r="5.2" fill={INK} />
                <Circle cx="102" cy="60" r="5.2" fill={INK} />
                <Circle cx="79.8" cy="58" r="2" fill="#FFFFFF" />
                <Circle cx="103.8" cy="58" r="2" fill="#FFFFFF" />
                <Ellipse cx="68" cy="70" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.5" />
                <Ellipse cx="112" cy="70" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.5" />
                <Circle cx="85" cy="70" r="2.2" fill={INK} />
                <Circle cx="95" cy="70" r="2.2" fill={INK} />
                <Path d="M 79 79 Q 90 87 101 79" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'toucan':
        return (
          <G>
            {/* Long angled tropical tail */}
            <Path d="M 52 122 L 16 158 L 38 164 L 74 134 Z" {...s(`url(#tcBody-${uid})`)} />
            {/* Huge iconic curved toucan beak */}
            <Path
              d="M 96 42 C 138 34 168 48 164 78 C 142 84 118 82 94 74 Z"
              {...s(`url(#tcBeak-${uid})`)}
            />
            {/* Sleek perched bird body */}
            <Path
              d="M 62 42 C 92 32 114 54 112 94 C 110 128 84 146 56 142 C 38 136 38 106 46 80 C 48 60 52 46 62 42 Z"
              {...s(`url(#tcBody-${uid})`)}
            />
            {/* Little perch claws */}
            <Path d="M 68 142 L 64 156 M 74 142 L 76 156 M 88 140 L 86 154" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#E6911C'} strokeWidth={isAura ? 10 : 5} strokeLinecap="round" />
            {!isAura && !silhouette && (
              <G>
                <Path d="M 72 52 C 98 52 108 74 102 104 C 86 112 68 104 66 84 Z" fill={`url(#tcChest-${uid})`} />
                <Path d="M 48 92 Q 72 86 78 120 Q 52 128 48 92 Z" fill="#3B4D59" stroke={INK} strokeWidth="3" />
                <Path d="M 148 54 C 160 58 165 66 164 78 L 146 78 Z" fill={INK} />
                <Circle cx="82" cy="58" r="10.5" fill="#46D6FF" stroke={INK} strokeWidth="2.6" />
                <Circle cx="84" cy="58" r="5" fill={INK} />
                <Circle cx="85.8" cy="56" r="2" fill="#FFFFFF" />
              </G>
            )}
          </G>
        );

      case 'frog':
        return (
          <G>
            {/* Big folded frog hind legs + webbed feet */}
            <Ellipse cx="40" cy="134" rx="28" ry="20" {...s(`url(#frGreen-${uid})`)} />
            <Ellipse cx="140" cy="134" rx="28" ry="20" {...s(`url(#frGreen-${uid})`)} />
            {/* Front feet */}
            <Ellipse cx="68" cy="150" rx="14" ry="8" {...s(`url(#frGreen-${uid})`)} />
            <Ellipse cx="112" cy="150" rx="14" ry="8" {...s(`url(#frGreen-${uid})`)} />
            {/* Big bulging frog eyes on top */}
            <Circle cx="62" cy="54" r="22" {...s(`url(#frGreen-${uid})`)} />
            <Circle cx="118" cy="54" r="22" {...s(`url(#frGreen-${uid})`)} />
            {/* Wide squatting frog body */}
            <Ellipse cx="90" cy="108" rx="56" ry="44" {...s(`url(#frGreen-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="90" cy="124" rx="36" ry="24" fill="#DFF7C6" />
                <Circle cx="62" cy="54" r="13" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
                <Circle cx="118" cy="54" r="13" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
                <Circle cx="64" cy="54" r="6.5" fill={INK} />
                <Circle cx="120" cy="54" r="6.5" fill={INK} />
                <Circle cx="66" cy="51.5" r="2.5" fill="#FFFFFF" />
                <Circle cx="122" cy="51.5" r="2.5" fill="#FFFFFF" />
                <Ellipse cx="48" cy="96" rx="8.5" ry="5" fill="#FF8A80" opacity="0.6" />
                <Ellipse cx="132" cy="96" rx="8.5" ry="5" fill="#FF8A80" opacity="0.6" />
                <Path d="M 60 96 Q 90 120 120 96" stroke="#185223" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      /* ======================== ZOO AQUARIUM EXHIBIT ======================== */
      case 'whale':
        return (
          <G>
            {/* Playful water spout on top */}
            <Path
              d="M 64 56 Q 58 28 38 28 M 64 56 Q 70 26 90 28"
              fill="none"
              stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#9CEBFF'}
              strokeWidth={isAura ? 12 : 7}
              strokeLinecap="round"
            />
            {/* Big iconic whale body + sweeping tail fluke */}
            <Path
              d="M 22 106 C 20 66 56 48 92 56 C 122 62 132 94 146 98 C 152 80 168 72 172 82 C 174 92 162 102 158 106 C 166 112 172 124 166 130 C 156 134 146 122 140 116 C 120 134 94 142 64 142 C 36 142 22 128 22 106 Z"
              {...s(`url(#whBlue-${uid})`)}
            />
            {/* Side flipper */}
            <Path
              d="M 76 118 Q 88 148 108 138 Q 98 122 86 114 Z"
              {...s(`url(#whBlue-${uid})`)}
            />
            {!isAura && !silhouette && (
              <G>
                <Path d="M 24 114 Q 64 116 96 138 Q 46 144 24 114 Z" fill="#DDF6FF" />
                <Line x1="42" y1="122" x2="48" y2="136" stroke="#85C7E8" strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="58" y1="122" x2="64" y2="138" stroke="#85C7E8" strokeWidth="2.5" strokeLinecap="round" />
                <Circle cx="52" cy="96" r="6" fill={INK} />
                <Circle cx="54" cy="94" r="2.2" fill="#FFFFFF" />
                <Ellipse cx="68" cy="106" rx="6.5" ry="3.8" fill="#FF8FA3" opacity="0.55" />
                <Path d="M 32 112 Q 46 122 62 114" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'turtle':
        return (
          <G>
            {/* Wide outstretched swimming flippers — unmistakable sea turtle silhouette! */}
            <Path d="M 74 72 C 58 34 38 22 30 34 C 26 48 48 74 68 88 Z" {...s(`url(#trSkin-${uid})`)} />
            <Path d="M 78 122 C 66 154 46 164 38 152 C 36 140 52 122 70 112 Z" {...s(`url(#trSkin-${uid})`)} />
            <Path d="M 122 76 C 142 54 156 56 154 68 C 150 78 136 86 122 88 Z" {...s(`url(#trSkin-${uid})`)} />
            <Path d="M 122 118 C 142 138 156 134 154 122 C 150 114 136 108 122 106 Z" {...s(`url(#trSkin-${uid})`)} />
            {/* Cute extended sea turtle head on left */}
            <Ellipse cx="34" cy="96" rx="22" ry="18" {...s(`url(#trSkin-${uid})`)} />
            {/* Domed patterned oval shell */}
            <Ellipse cx="96" cy="96" rx="46" ry="36" {...s(`url(#trShell-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                {/* Hexagonal shell scutes */}
                <Polygon points="96,72 116,84 116,108 96,120 76,108 76,84" fill="#3B9B4D" stroke="#1E5E2D" strokeWidth="2.8" />
                <Line x1="96" y1="60" x2="96" y2="72" stroke="#1E5E2D" strokeWidth="2.6" />
                <Line x1="96" y1="120" x2="96" y2="132" stroke="#1E5E2D" strokeWidth="2.6" />
                <Line x1="56" y1="84" x2="76" y2="84" stroke="#1E5E2D" strokeWidth="2.6" />
                <Line x1="116" y1="84" x2="136" y2="84" stroke="#1E5E2D" strokeWidth="2.6" />
                <Circle cx="28" cy="92" r="5" fill={INK} />
                <Circle cx="29.8" cy="90" r="1.9" fill="#FFFFFF" />
                <Ellipse cx="36" cy="102" rx="4.5" ry="2.8" fill="#FF8FA3" opacity="0.6" />
                <Path d="M 16 100 Q 24 108 32 104" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'octopus':
        return (
          <G>
            {/* Wavy fanned tentacles — unmistakable octopus silhouette! */}
            <Path d="M 56 104 C 24 114 14 140 28 150 C 40 156 50 132 66 122 Z" {...s(`url(#ocBody-${uid})`)} />
            <Path d="M 72 112 C 56 140 48 164 64 166 C 76 166 80 140 84 122 Z" {...s(`url(#ocBody-${uid})`)} />
            <Path d="M 108 112 C 124 140 132 164 116 166 C 104 166 100 140 96 122 Z" {...s(`url(#ocBody-${uid})`)} />
            <Path d="M 124 104 C 156 114 166 140 152 150 C 140 156 130 132 114 122 Z" {...s(`url(#ocBody-${uid})`)} />
            <Path d="M 88 116 C 84 144 96 166 102 154 C 104 140 98 126 96 116 Z" {...s(`url(#ocBody-${uid})`)} />
            {/* Big bulbous cheerful octopus dome */}
            <Path
              d="M 46 82 C 44 36 66 20 90 20 C 114 20 136 36 134 82 C 134 108 116 122 90 122 C 64 122 46 108 46 82 Z"
              {...s(`url(#ocBody-${uid})`)}
            />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="72" cy="44" rx="10" ry="6" fill="#FFD1E8" opacity="0.45" transform="rotate(-24 72 44)" />
                <Circle cx="74" cy="78" r="10.5" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
                <Circle cx="106" cy="78" r="10.5" fill="#FFFFFF" stroke={INK} strokeWidth="2.8" />
                <Circle cx="75.5" cy="78" r="5.5" fill={INK} />
                <Circle cx="107.5" cy="78" r="5.5" fill={INK} />
                <Circle cx="77.5" cy="75.5" r="2.2" fill="#FFFFFF" />
                <Circle cx="109.5" cy="75.5" r="2.2" fill="#FFFFFF" />
                <Ellipse cx="60" cy="92" rx="6.5" ry="4" fill="#FF5C8A" opacity="0.5" />
                <Ellipse cx="120" cy="92" rx="6.5" ry="4" fill="#FF5C8A" opacity="0.5" />
                <Path d="M 80 96 Q 90 105 100 96" stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <Circle cx="34" cy="142" r="3.5" fill="#FFCCE5" />
                <Circle cx="64" cy="156" r="3.5" fill="#FFCCE5" />
                <Circle cx="116" cy="156" r="3.5" fill="#FFCCE5" />
                <Circle cx="146" cy="142" r="3.5" fill="#FFCCE5" />
              </G>
            )}
          </G>
        );

      case 'clownfish':
        return (
          <G>
            {/* Tall dorsal fin & fanned tail — classic fish silhouette! */}
            <Path d="M 120 90 L 164 56 C 170 86 170 98 164 128 L 120 96 Z" {...s(`url(#cfOrange-${uid})`)} />
            <Path d="M 56 58 Q 88 26 116 62 Z" {...s(`url(#cfOrange-${uid})`)} />
            <Path d="M 74 124 Q 94 148 112 122 Z" {...s(`url(#cfOrange-${uid})`)} />
            {/* Plump teardrop fish body */}
            <Ellipse cx="78" cy="92" rx="56" ry="38" {...s(`url(#cfOrange-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                {/* Classic white clownfish stripes */}
                <Path d="M 58 56 Q 68 92 58 128 Q 70 130 76 128 Q 84 92 76 56 Q 68 54 58 56 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
                <Path d="M 100 60 Q 108 92 100 124 Q 110 122 114 118 Q 120 92 114 66 Q 108 62 100 60 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
                <Circle cx="44" cy="84" r="8.5" fill="#FFFFFF" stroke={INK} strokeWidth="2.6" />
                <Circle cx="42.5" cy="84" r="4.8" fill={INK} />
                <Circle cx="44" cy="82" r="1.8" fill="#FFFFFF" />
                <Path d="M 24 98 Q 34 106 44 100" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      /* ======================== AFRICAN SAVANNA EXHIBIT ======================== */
      case 'giraffe':
        return (
          <G>
            {/* Long slender giraffe legs */}
            <Rect x="62" y="122" width="12" height="46" rx="5" {...s(`url(#girFur-${uid})`)} />
            <Rect x="82" y="124" width="12" height="44" rx="5" {...s(`url(#girFur-${uid})`)} />
            <Rect x="108" y="122" width="12" height="46" rx="5" {...s(`url(#girFur-${uid})`)} />
            {/* Swishing tail */}
            <Path d="M 128 112 Q 148 122 146 144" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#C77A1A'} strokeWidth={isAura ? 10 : 5} strokeLinecap="round" />
            {/* Body */}
            <Ellipse cx="94" cy="116" rx="38" ry="22" {...s(`url(#girFur-${uid})`)} />
            {/* Unmistakable tall slender Giraffe neck! */}
            <Path d="M 60 112 L 50 38 L 74 36 L 86 106 Z" {...s(`url(#girFur-${uid})`)} />
            {/* Ossicones (horns) & ears */}
            <Line x1="56" y1="30" x2="52" y2="14" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : INK} strokeWidth={isAura ? 11 : 4.5} strokeLinecap="round" />
            <Line x1="70" y1="30" x2="74" y2="14" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : INK} strokeWidth={isAura ? 11 : 4.5} strokeLinecap="round" />
            <Circle cx="52" cy="14" r="5.5" {...s('#9E5B1E', 3)} />
            <Circle cx="74" cy="14" r="5.5" {...s('#9E5B1E', 3)} />
            <Ellipse cx="82" cy="34" rx="11" ry="6" {...s(`url(#girFur-${uid})`, 3.4)} />
            {/* Head with snout */}
            <Ellipse cx="56" cy="40" rx="22" ry="15" {...s(`url(#girFur-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="42" cy="44" rx="11" ry="9" fill="#FFF3D1" />
                <Circle cx="56" cy="37" r="4.2" fill={INK} />
                <Circle cx="57.5" cy="35.5" r="1.5" fill="#FFFFFF" />
                <Path d="M 38 48 Q 44 52 50 48" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                {/* Signature brown giraffe spots */}
                <Circle cx="64" cy="64" r="5.5" fill="#B86B1D" />
                <Circle cx="72" cy="84" r="6" fill="#B86B1D" />
                <Circle cx="86" cy="110" r="7.5" fill="#B86B1D" />
                <Circle cx="106" cy="116" r="7" fill="#B86B1D" />
                <Circle cx="118" cy="108" r="5" fill="#B86B1D" />
                <Rect x="62" y="160" width="12" height="8" rx="3" fill="#5D3A1A" />
                <Rect x="82" y="160" width="12" height="8" rx="3" fill="#5D3A1A" />
                <Rect x="108" y="160" width="12" height="8" rx="3" fill="#5D3A1A" />
              </G>
            )}
          </G>
        );

      case 'elephant':
        return (
          <G>
            {/* Chunky elephant legs */}
            <Rect x="54" y="124" width="22" height="38" rx="9" {...s(`url(#elSkin-${uid})`)} />
            <Rect x="106" y="124" width="22" height="38" rx="9" {...s(`url(#elSkin-${uid})`)} />
            {/* Little tail */}
            <Path d="M 142 104 Q 160 112 156 128" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#7593A8'} strokeWidth={isAura ? 10 : 5} strokeLinecap="round" />
            {/* Big round elephant body */}
            <Ellipse cx="96" cy="104" rx="50" ry="38" {...s(`url(#elSkin-${uid})`)} />
            {/* Huge iconic elephant ear */}
            <Ellipse cx="82" cy="76" rx="28" ry="34" {...s(`url(#elSkin-${uid})`)} />
            {/* Head + unmistakable raised curved trunk! */}
            <Circle cx="54" cy="76" r="28" {...s(`url(#elSkin-${uid})`)} />
            <Path
              d="M 32 82 C 12 88 10 120 26 126 C 36 128 42 118 34 112 C 26 108 26 98 42 96 Z"
              {...s(`url(#elSkin-${uid})`)}
            />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="84" cy="78" rx="17" ry="22" fill={`url(#elPink-${uid})`} />
                <Circle cx="46" cy="70" r="5" fill={INK} />
                <Circle cx="47.8" cy="68" r="2" fill="#FFFFFF" />
                <Ellipse cx="54" cy="82" rx="6" ry="3.5" fill="#F294B4" opacity="0.6" />
                <Path d="M 42 90 Q 50 96 58 90" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Cute toenails */}
                <Circle cx="60" cy="158" r="3" fill="#E6F0F5" />
                <Circle cx="70" cy="158" r="3" fill="#E6F0F5" />
                <Circle cx="112" cy="158" r="3" fill="#E6F0F5" />
                <Circle cx="122" cy="158" r="3" fill="#E6F0F5" />
              </G>
            )}
          </G>
        );

      case 'zebra':
        return (
          <G>
            {/* Legs */}
            <Rect x="54" y="118" width="14" height="46" rx="6" {...s('#FFFFFF')} />
            <Rect x="76" y="120" width="14" height="44" rx="6" {...s('#FFFFFF')} />
            <Rect x="114" y="118" width="14" height="46" rx="6" {...s('#FFFFFF')} />
            {/* Tail */}
            <Path d="M 136 98 Q 158 108 154 134" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#2F3640'} strokeWidth={isAura ? 10 : 6} strokeLinecap="round" />
            {/* Body */}
            <Ellipse cx="96" cy="108" rx="44" ry="26" {...s('#FFFFFF')} />
            {/* Spiky mane & neck */}
            <Path d="M 60 100 L 52 52 L 76 54 L 84 96 Z" {...s('#FFFFFF')} />
            {/* Ears + horse-shaped head */}
            <Ellipse cx="68" cy="40" rx="6" ry="12" {...s('#FFFFFF', 3.5)} />
            <Ellipse cx="48" cy="56" rx="26" ry="16" {...s('#FFFFFF')} />
            {!isAura && !silhouette && (
              <G>
                {/* Bold zebra stripes */}
                <Path d="M 74 52 L 86 58 L 80 68 L 70 62 Z" fill="#2F3640" />
                <Path d="M 76 70 L 88 76 L 84 86 L 72 80 Z" fill="#2F3640" />
                <Path d="M 88 84 L 96 84 L 92 126 L 84 126 Z" fill="#2F3640" />
                <Path d="M 106 84 L 114 86 L 110 128 L 102 128 Z" fill="#2F3640" />
                <Path d="M 122 90 L 130 96 L 126 122 L 118 122 Z" fill="#2F3640" />
                <Ellipse cx="30" cy="58" rx="10" ry="11" fill="#46505E" />
                <Circle cx="52" cy="52" r="4.5" fill={INK} />
                <Circle cx="53.6" cy="50.4" r="1.6" fill="#FFFFFF" />
                <Rect x="54" y="156" width="14" height="8" rx="3" fill="#2F3640" />
                <Rect x="76" y="156" width="14" height="8" rx="3" fill="#2F3640" />
                <Rect x="114" y="156" width="14" height="8" rx="3" fill="#2F3640" />
              </G>
            )}
          </G>
        );

      case 'lion':
        return (
          <G>
            {/* Tufted lion tail curled up on right */}
            <Path d="M 124 128 C 154 126 164 98 152 80" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#F0A830'} strokeWidth={isAura ? 12 : 8} strokeLinecap="round" />
            <Circle cx="152" cy="76" r="11" {...s(`url(#lnMane-${uid})`, 3.5)} />
            {/* Seated lion body & paws */}
            <Ellipse cx="88" cy="124" rx="36" ry="30" {...s(`url(#lnFur-${uid})`)} />
            <Ellipse cx="68" cy="148" rx="16" ry="11" {...s(`url(#lnFur-${uid})`)} />
            <Ellipse cx="108" cy="148" rx="16" ry="11" {...s(`url(#lnFur-${uid})`)} />
            {/* Unmistakable huge fluffy scalloped lion mane! */}
            <Circle cx="88" cy="68" r="44" {...s(`url(#lnMane-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Circle cx="62" cy="40" r="10" fill={`url(#lnFur-${uid})`} stroke={INK} strokeWidth="3.2" />
                <Circle cx="114" cy="40" r="10" fill={`url(#lnFur-${uid})`} stroke={INK} strokeWidth="3.2" />
                <Circle cx="88" cy="70" r="30" fill={`url(#lnFur-${uid})`} stroke={INK} strokeWidth="3.6" />
                <Circle cx="76" cy="66" r="4.8" fill={INK} />
                <Circle cx="100" cy="66" r="4.8" fill={INK} />
                <Circle cx="77.8" cy="64" r="1.8" fill="#FFFFFF" />
                <Circle cx="101.8" cy="64" r="1.8" fill="#FFFFFF" />
                <Ellipse cx="66" cy="76" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.5" />
                <Ellipse cx="110" cy="76" rx="5.5" ry="3.2" fill="#FF8A80" opacity="0.5" />
                <Polygon points="82,74 94,74 88,82" fill="#6D411E" />
                <Path d="M 78 86 Q 88 94 98 86" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      /* ======================== BAMBOO & RIVER SANCTUARY ======================== */
      case 'panda':
        return (
          <G>
            {/* Chubby seated panda legs */}
            <Ellipse cx="58" cy="146" rx="20" ry="14" {...s('#2F3540')} />
            <Ellipse cx="122" cy="146" rx="20" ry="14" {...s('#2F3540')} />
            {/* Round body + arms */}
            <Ellipse cx="90" cy="118" rx="42" ry="36" {...s('#FFFFFF')} />
            <Ellipse cx="50" cy="108" rx="14" ry="22" {...s('#2F3540')} />
            <Ellipse cx="130" cy="108" rx="14" ry="22" {...s('#2F3540')} />
            {/* Round bear ears */}
            <Circle cx="56" cy="40" r="15" {...s('#2F3540')} />
            <Circle cx="124" cy="40" r="15" {...s('#2F3540')} />
            {/* Panda head */}
            <Ellipse cx="90" cy="66" rx="38" ry="34" {...s('#FFFFFF')} />
            {!isAura && !silhouette && (
              <G>
                <Ellipse cx="74" cy="64" rx="13" ry="11" fill="#2F3540" transform="rotate(-18 74 64)" />
                <Ellipse cx="106" cy="64" rx="13" ry="11" fill="#2F3540" transform="rotate(18 106 64)" />
                <Circle cx="75" cy="63" r="4.8" fill="#FFFFFF" />
                <Circle cx="105" cy="63" r="4.8" fill="#FFFFFF" />
                <Circle cx="76" cy="63" r="2.8" fill={INK} />
                <Circle cx="104" cy="63" r="2.8" fill={INK} />
                <Ellipse cx="62" cy="76" rx="6" ry="3.8" fill="#FF8DA1" opacity="0.6" />
                <Ellipse cx="118" cy="76" rx="6" ry="3.8" fill="#FF8DA1" opacity="0.6" />
                <Ellipse cx="90" cy="76" rx="7" ry="4.8" fill="#2F3540" />
                <Path d="M 80 84 Q 90 92 100 84" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                {/* Cute bamboo shoot in paw */}
                <Rect x="128" y="76" width="8" height="44" rx="4" fill="#46BE58" stroke="#1E5D2D" strokeWidth="2.5" />
                <Path d="M 136 86 Q 154 74 154 90 Q 144 94 136 86 Z" fill="#76E872" stroke="#1E5D2D" strokeWidth="2" />
              </G>
            )}
          </G>
        );

      case 'hippo':
        return (
          <G>
            {/* Short sturdy hippo legs */}
            <Rect x="54" y="128" width="20" height="28" rx="8" {...s(`url(#hpSkin-${uid})`)} />
            <Rect x="112" y="128" width="20" height="28" rx="8" {...s(`url(#hpSkin-${uid})`)} />
            {/* Wide rounded barrel hippo body */}
            <Ellipse cx="102" cy="108" rx="52" ry="36" {...s(`url(#hpSkin-${uid})`)} />
            {/* Little ears */}
            <Circle cx="52" cy="56" r="9" {...s(`url(#hpSkin-${uid})`)} />
            <Circle cx="76" cy="56" r="9" {...s(`url(#hpSkin-${uid})`)} />
            {/* Huge rounded hippo snout on left! */}
            <Circle cx="62" cy="84" r="28" {...s(`url(#hpSkin-${uid})`)} />
            <Ellipse cx="36" cy="96" rx="24" ry="20" {...s(`url(#hpSnout-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Circle cx="56" cy="76" r="4.8" fill={INK} />
                <Circle cx="57.6" cy="74.2" r="1.8" fill="#FFFFFF" />
                <Ellipse cx="26" cy="92" rx="4.2" ry="3" fill="#4E4266" />
                <Ellipse cx="40" cy="92" rx="4.2" ry="3" fill="#4E4266" />
                <Rect x="24" y="108" width="8" height="8" rx="2.5" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
                <Rect x="40" y="108" width="8" height="8" rx="2.5" fill="#FFFFFF" stroke={INK} strokeWidth="2" />
                <Path d="M 20 106 Q 36 114 52 106" stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'tiger':
        return (
          <G>
            {/* Long curled tiger tail */}
            <Path d="M 134 108 C 162 106 168 74 150 62" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#FF8A2B'} strokeWidth={isAura ? 12 : 9} strokeLinecap="round" />
            {/* Prowling legs */}
            <Rect x="54" y="122" width="16" height="38" rx="7" {...s(`url(#tgFur-${uid})`)} />
            <Rect x="76" y="124" width="16" height="36" rx="7" {...s(`url(#tgFur-${uid})`)} />
            <Rect x="114" y="122" width="16" height="38" rx="7" {...s(`url(#tgFur-${uid})`)} />
            {/* Sleek tiger body */}
            <Ellipse cx="96" cy="110" rx="46" ry="26" {...s(`url(#tgFur-${uid})`)} />
            {/* Round ears + smiling tiger head */}
            <Circle cx="38" cy="56" r="10" {...s(`url(#tgFur-${uid})`)} />
            <Circle cx="72" cy="56" r="10" {...s(`url(#tgFur-${uid})`)} />
            <Circle cx="54" cy="78" r="28" {...s(`url(#tgFur-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                {/* Bold tiger stripes */}
                <Path d="M 88 86 L 96 86 L 92 108 Z" fill="#3B2314" />
                <Path d="M 106 86 L 114 86 L 110 108 Z" fill="#3B2314" />
                <Path d="M 122 92 L 130 94 L 124 112 Z" fill="#3B2314" />
                <Ellipse cx="46" cy="88" rx="11" ry="8" fill="#FFF4DE" />
                <Ellipse cx="62" cy="88" rx="11" ry="8" fill="#FFF4DE" />
                <Circle cx="44" cy="74" r="4.6" fill={INK} />
                <Circle cx="64" cy="74" r="4.6" fill={INK} />
                <Circle cx="45.6" cy="72.4" r="1.6" fill="#FFFFFF" />
                <Circle cx="65.6" cy="72.4" r="1.6" fill="#FFFFFF" />
                <Polygon points="49,82 59,82 54,88" fill="#F06292" />
                <Path d="M 46 92 Q 54 98 62 92" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
              </G>
            )}
          </G>
        );

      case 'flamingo':
        return (
          <G>
            {/* Unmistakable tall Flamingo legs (standing on one leg!) */}
            <Line x1="88" y1="112" x2="88" y2="168" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#F06292'} strokeWidth={isAura ? 10 : 5.5} strokeLinecap="round" />
            <Path d="M 96 112 L 112 136 L 90 140" fill="none" stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#F06292'} strokeWidth={isAura ? 10 : 5.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* Graceful S-curved flamingo neck */}
            <Path
              d="M 74 92 C 58 64 90 42 74 26 C 64 18 52 24 52 34"
              fill="none"
              stroke={isAura ? auraStroke : silhouette ? silhouetteColor : '#FF7EB3'}
              strokeWidth={isAura ? 18 : 13}
              strokeLinecap="round"
            />
            {/* Curved flamingo beak */}
            <Path d="M 52 28 C 36 28 32 42 40 50 C 48 46 52 38 56 34 Z" {...s('#2F3540', 3)} />
            {/* Head */}
            <Circle cx="64" cy="30" r="12" {...s(`url(#flPink-${uid})`)} />
            {/* Plump teardrop bird body */}
            <Ellipse cx="96" cy="98" rx="34" ry="22" {...s(`url(#flPink-${uid})`)} />
            {!isAura && !silhouette && (
              <G>
                <Path d="M 78 92 Q 108 82 126 102 Q 102 114 78 92 Z" fill="#FF9EC7" stroke={INK} strokeWidth="2.8" />
                <Circle cx="62" cy="28" r="3.5" fill={INK} />
                <Circle cx="63" cy="27" r="1.2" fill="#FFFFFF" />
              </G>
            )}
          </G>
        );
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Defs>
        {/* Monkey */}
        <RadialGradient id={`mkFur-${uid}`} cx="38%" cy="30%" r="68%">
          <Stop offset="0" stopColor="#C98144" />
          <Stop offset="0.6" stopColor="#8E5022" />
          <Stop offset="1" stopColor="#5C3010" />
        </RadialGradient>
        <LinearGradient id={`mkTan-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE9C7" />
          <Stop offset="1" stopColor="#EDB57B" />
        </LinearGradient>
        {/* Gorilla */}
        <RadialGradient id={`gFur-${uid}`} cx="38%" cy="28%" r="70%">
          <Stop offset="0" stopColor="#727F96" />
          <Stop offset="0.55" stopColor="#414A5C" />
          <Stop offset="1" stopColor="#252B36" />
        </RadialGradient>
        <LinearGradient id={`gTan-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFEBD4" />
          <Stop offset="1" stopColor="#D19866" />
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
        {/* Frog */}
        <RadialGradient id={`frGreen-${uid}`} cx="40%" cy="30%" r="68%">
          <Stop offset="0" stopColor="#92F07D" />
          <Stop offset="0.58" stopColor="#48BF57" />
          <Stop offset="1" stopColor="#228238" />
        </RadialGradient>
        {/* Whale */}
        <RadialGradient id={`whBlue-${uid}`} cx="36%" cy="30%" r="70%">
          <Stop offset="0" stopColor="#6CD4FF" />
          <Stop offset="0.55" stopColor="#2A9AF0" />
          <Stop offset="1" stopColor="#1660B0" />
        </RadialGradient>
        {/* Sea Turtle */}
        <RadialGradient id={`trShell-${uid}`} cx="40%" cy="35%" r="65%">
          <Stop offset="0" stopColor="#77DE73" />
          <Stop offset="0.6" stopColor="#38A852" />
          <Stop offset="1" stopColor="#1D6E33" />
        </RadialGradient>
        <LinearGradient id={`trSkin-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A6ED85" />
          <Stop offset="1" stopColor="#4FBF63" />
        </LinearGradient>
        {/* Octopus */}
        <RadialGradient id={`ocBody-${uid}`} cx="38%" cy="28%" r="68%">
          <Stop offset="0" stopColor="#FF8AC9" />
          <Stop offset="0.55" stopColor="#D64FA0" />
          <Stop offset="1" stopColor="#942C75" />
        </RadialGradient>
        {/* Clownfish */}
        <LinearGradient id={`cfOrange-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB040" />
          <Stop offset="0.55" stopColor="#FF6B24" />
          <Stop offset="1" stopColor="#D93D14" />
        </LinearGradient>
        {/* Giraffe */}
        <LinearGradient id={`girFur-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE98A" />
          <Stop offset="0.58" stopColor="#FFC145" />
          <Stop offset="1" stopColor="#EB931E" />
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
        {/* Lion */}
        <RadialGradient id={`lnMane-${uid}`} cx="42%" cy="32%" r="65%">
          <Stop offset="0" stopColor="#FFA240" />
          <Stop offset="0.6" stopColor="#E0731A" />
          <Stop offset="1" stopColor="#AD480A" />
        </RadialGradient>
        <RadialGradient id={`lnFur-${uid}`} cx="40%" cy="32%" r="68%">
          <Stop offset="0" stopColor="#FFE98F" />
          <Stop offset="0.6" stopColor="#FFC74A" />
          <Stop offset="1" stopColor="#E69820" />
        </RadialGradient>
        {/* Hippo */}
        <RadialGradient id={`hpSkin-${uid}`} cx="38%" cy="30%" r="68%">
          <Stop offset="0" stopColor="#C8BAE8" />
          <Stop offset="0.58" stopColor="#9384BD" />
          <Stop offset="1" stopColor="#6A5A94" />
        </RadialGradient>
        <LinearGradient id={`hpSnout-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DFD4F7" />
          <Stop offset="1" stopColor="#B1A0D6" />
        </LinearGradient>
        {/* Tiger */}
        <RadialGradient id={`tgFur-${uid}`} cx="38%" cy="30%" r="68%">
          <Stop offset="0" stopColor="#FFC05E" />
          <Stop offset="0.58" stopColor="#FF8826" />
          <Stop offset="1" stopColor="#DB5B12" />
        </RadialGradient>
        {/* Flamingo */}
        <RadialGradient id={`flPink-${uid}`} cx="38%" cy="30%" r="68%">
          <Stop offset="0" stopColor="#FFB0D4" />
          <Stop offset="0.6" stopColor="#FF6CA8" />
          <Stop offset="1" stopColor="#D63E7D" />
        </RadialGradient>
      </Defs>

      {silhouette ? (
        <>
          {/* Subtle glowing outer ring around the unified animal silhouette */}
          <G opacity={highlighted ? 0.86 : 0.48}>
            {renderAnimalBody(highlighted ? 'glow' : 'silRing')}
          </G>
          {/* Single unified translucent recessed cutout (~25% opacity, ZERO internal lines!) */}
          <G opacity={highlighted ? 0.34 : 0.25}>
            {renderAnimalBody('none')}
          </G>
        </>
      ) : (
        <>
          {/* Shaped Golden Glow Aura (when hovered or selected — hugs animal shape) */}
          {highlighted && renderAnimalBody('glow')}
          {/* Shaped Die-Cut Warm Cream Rim (for tray pieces — hugs animal shape, NO box!) */}
          {stickerRim && renderAnimalBody('rim')}
          {/* Primary Full Storybook Illustration */}
          {renderAnimalBody('none')}
        </>
      )}
    </Svg>
  );
};
