export type Difficulty = 1 | 2 | 3;

export type GameId =
  | 'shape-sorter'
  | 'jungle-jigsaw'
  | 'bubble-pop'
  | 'ball-pass'
  | 'animal-peekaboo'
  | 'size-sorter'
  | 'baby-match'
  | 'jungle-music'
  | 'arctic-catch'
  | 'jungle-picnic';

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  isFree: boolean;
  plaqueBg: string;
  plaqueInner: string;
  plaqueBorder: string;
  accent: string;
  leafTint: string;
}

export const COLORS = {
  // Warm Storybook Jungle Palette (Sago Mini / Pok Pok inspired)
  skyTop: '#CBEBD6',
  skyMid: '#EEF8DE',
  skyBottom: '#FFF6D6',
  meadowLight: '#C5DF9B',
  meadowMid: '#7DB25F',
  jungleDeep: '#3E7342',
  jungleLeaf: '#599852',
  jungleDark: '#2B5430',

  // Warm Sunlit Cream, Terracotta & Carved Wood
  cream: '#FFF9EC',
  warmCard: '#FDF3DF',
  woodPale: '#F5E2BD',
  woodLight: '#E3B97E',
  woodMid: '#C68C52',
  woodBorder: '#8C5B32',
  woodDark: '#4A3525',
  inkOutline: '#4A3525',

  // Cohesive Warm Preschool Accents
  sunYellow: '#F8D459',
  sunGold: '#E8A530',
  sunBorder: '#A86E18',
  papaya: '#DF7248',
  papayaBorder: '#A84A27',
  berryRed: '#DF5D56',
  berryBorder: '#A63A35',
  riverBlue: '#4DAAD8',
  riverBorder: '#2A759E',
  hibiscus: '#E37396',
  hibiscusBorder: '#A64264',
  grape: '#9677CC',
  grapeBorder: '#634796',
  emerald: '#56A962',
  emeraldBorder: '#347440',

  // Text & Parent UI
  ink: '#4A3525',
  inkMuted: '#7A6554',
  white: '#FFFFFF',
  overlay: 'rgba(38, 48, 34, 0.56)',
};

export const GAMES: GameMeta[] = [
  {
    id: 'shape-sorter',
    title: 'Zoo Exhibits',
    subtitle: 'Match animal shapes!',
    isFree: true,
    plaqueBg: '#F1D49E',
    plaqueInner: '#FFF8E8',
    plaqueBorder: '#8C5B32',
    accent: '#D9862B',
    leafTint: '#5E9F57',
  },
  {
    id: 'jungle-jigsaw',
    title: 'Zoo Jigsaw',
    subtitle: 'Build zoo animals!',
    isFree: true,
    plaqueBg: '#B7DFAA',
    plaqueInner: '#F3FAEE',
    plaqueBorder: '#437A42',
    accent: '#3E7A42',
    leafTint: '#4A8E4B',
  },
  {
    id: 'bubble-pop',
    title: 'Bubble Pop',
    subtitle: 'Aquarium splash!',
    isFree: true,
    plaqueBg: '#A6DFEA',
    plaqueInner: '#EFFBFD',
    plaqueBorder: '#2C7B99',
    accent: '#3593B5',
    leafTint: '#4DAAD8',
  },
  {
    id: 'ball-pass',
    title: 'Jungle Ball Pass',
    subtitle: 'Kick & score goals!',
    isFree: false,
    plaqueBg: '#F5BBA0',
    plaqueInner: '#FFF4ED',
    plaqueBorder: '#B05232',
    accent: '#D96B43',
    leafTint: '#599852',
  },
  {
    id: 'animal-peekaboo',
    title: 'Bush Peek-a-Boo',
    subtitle: 'Who is hiding?',
    isFree: false,
    plaqueBg: '#B6DEF2',
    plaqueInner: '#F2FAFE',
    plaqueBorder: '#33759B',
    accent: '#4290BD',
    leafTint: '#56A962',
  },
  {
    id: 'size-sorter',
    title: 'Zoo Parade',
    subtitle: 'Little to giant!',
    isFree: false,
    plaqueBg: '#D8C8F2',
    plaqueInner: '#F8F4FF',
    plaqueBorder: '#6B4F9E',
    accent: '#8263BA',
    leafTint: '#9677CC',
  },
  {
    id: 'baby-match',
    title: 'Mama & Baby',
    subtitle: 'Snuggle the babies!',
    isFree: false,
    plaqueBg: '#F4C1D2',
    plaqueInner: '#FFF4F8',
    plaqueBorder: '#A64B6B',
    accent: '#D6648B',
    leafTint: '#E37396',
  },
  {
    id: 'jungle-music',
    title: 'Zoo Band',
    subtitle: 'Jungle xylophone!',
    isFree: false,
    plaqueBg: '#F7DF95',
    plaqueInner: '#FFFCEE',
    plaqueBorder: '#A8701D',
    accent: '#D99426',
    leafTint: '#E8A530',
  },
  {
    id: 'arctic-catch',
    title: 'Arctic Catch',
    subtitle: 'Slide & catch fish!',
    isFree: false,
    plaqueBg: '#B3E3DC',
    plaqueInner: '#F0FBF9',
    plaqueBorder: '#2C7F78',
    accent: '#2F948B',
    leafTint: '#4DAAD8',
  },
];

export const UNLOCK_PRICE_DISPLAY = '$2.99';
export const UNLOCK_PRODUCT_ID = 'whits_world_unlock_all_lifetime';
