export type Difficulty = 1 | 2 | 3;

export type GameCategory = 'learn' | 'puzzles' | 'action';

export type CategoryFilter = 'all' | GameCategory;

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
  | 'jungle-picnic'
  | 'zoo-coloring'
  | 'color-match'
  | 'number-count'
  | 'letter-safari'
  | 'color-line-match'
  | 'number-line-match'
  | 'letter-line-match';

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  benefit: string;
  category: GameCategory;
  isFree: boolean;
  plaqueBg: string;
  plaqueInner: string;
  plaqueBorder: string;
  accent: string;
  leafTint: string;
}

export const GAME_CATEGORIES: {
  id: CategoryFilter;
  label: string;
  emoji: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  {
    id: 'all',
    label: 'All',
    emoji: '🌟',
    activeBg: '#FFE066',
    activeBorder: '#8C5B32',
  },
  {
    id: 'learn',
    label: 'Learn',
    emoji: '🎨',
    activeBg: '#CFE7FF',
    activeBorder: '#1578E8',
  },
  {
    id: 'puzzles',
    label: 'Puzzles',
    emoji: '🧩',
    activeBg: '#FFD8EA',
    activeBorder: '#B8216B',
  },
  {
    id: 'action',
    label: 'Play & Music',
    emoji: '🎵',
    activeBg: '#CDF5D4',
    activeBorder: '#1FA838',
  },
];

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

/**
 * 17 Total Zoo Games:
 * - 6 Signature Forever-Free Starter Games (spanning Learn, Puzzles & Action)
 * - 11 Full Zoo Pack Games ($4.99 one-time unlock, each offering 1 Free Sample Round per day!)
 * Interleaved thoughtfully so top rows highlight both Free favorites and Daily Free Try showcases.
 */
export const GAMES: GameMeta[] = [
  {
    id: 'zoo-coloring',
    title: 'Zoo Coloring',
    subtitle: 'Paint cute animals!',
    benefit: 'Creative art, crayons & stickers',
    category: 'puzzles',
    isFree: true,
    plaqueBg: '#F7C9DA',
    plaqueInner: '#FFF5F9',
    plaqueBorder: '#A84E73',
    accent: '#D15B89',
    leafTint: '#E8A530',
  },
  {
    id: 'shape-sorter',
    title: 'Zoo Exhibits',
    subtitle: 'Match animal shapes!',
    benefit: 'Spatial shapes across 6 habitats',
    category: 'puzzles',
    isFree: true,
    plaqueBg: '#F1D49E',
    plaqueInner: '#FFF8E8',
    plaqueBorder: '#8C5B32',
    accent: '#D9862B',
    leafTint: '#5E9F57',
  },
  {
    id: 'color-match',
    title: 'Color Safari',
    subtitle: 'Find bright colors!',
    benefit: 'Color recognition & voice prompts',
    category: 'learn',
    isFree: true,
    plaqueBg: '#FBE0A2',
    plaqueInner: '#FFFBF0',
    plaqueBorder: '#B36F1E',
    accent: '#E08624',
    leafTint: '#5BB55E',
  },
  {
    id: 'jungle-music',
    title: 'Zoo Band',
    subtitle: 'Jungle xylophone!',
    benefit: 'Nursery melodies & rhythm play',
    category: 'action',
    isFree: false,
    plaqueBg: '#F7DF95',
    plaqueInner: '#FFFCEE',
    plaqueBorder: '#A8701D',
    accent: '#D99426',
    leafTint: '#E8A530',
  },
  {
    id: 'color-line-match',
    title: 'Color Match',
    subtitle: 'Draw lines to colors!',
    benefit: 'Fine-motor line drawing & color words',
    category: 'learn',
    isFree: true,
    plaqueBg: '#FAD1B8',
    plaqueInner: '#FFF8F2',
    plaqueBorder: '#B3532B',
    accent: '#D96436',
    leafTint: '#5BB55E',
  },
  {
    id: 'bubble-pop',
    title: 'Bubble Pop',
    subtitle: 'Aquarium splash!',
    benefit: 'Hand-eye coordination & sea friends',
    category: 'action',
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
    benefit: 'Aim, kick & bouncy soccer physics',
    category: 'action',
    isFree: false,
    plaqueBg: '#F5BBA0',
    plaqueInner: '#FFF4ED',
    plaqueBorder: '#B05232',
    accent: '#D96B43',
    leafTint: '#599852',
  },
  {
    id: 'number-count',
    title: 'Zoo Counting',
    subtitle: 'Count 1 to 10!',
    benefit: '1-to-1 counting & number sense',
    category: 'learn',
    isFree: true,
    plaqueBg: '#BDE7CE',
    plaqueInner: '#F2FCF6',
    plaqueBorder: '#2E7D5B',
    accent: '#35946B',
    leafTint: '#4DAAD8',
  },
  {
    id: 'letter-safari',
    title: 'ABC Safari',
    subtitle: 'Learn A to Z!',
    benefit: 'Phonics A–Z quiz & talking sound board',
    category: 'learn',
    isFree: false,
    plaqueBg: '#D4D6FA',
    plaqueInner: '#F5F6FF',
    plaqueBorder: '#4F54A8',
    accent: '#5E64C4',
    leafTint: '#F082A8',
  },
  {
    id: 'jungle-picnic',
    title: 'Feed Whit',
    subtitle: 'Picnic snack match!',
    benefit: 'Sharing, cravings & pretend play',
    category: 'action',
    isFree: false,
    plaqueBg: '#F6CFA3',
    plaqueInner: '#FFF8ED',
    plaqueBorder: '#A9612C',
    accent: '#C96D2E',
    leafTint: '#E8A530',
  },
  {
    id: 'jungle-jigsaw',
    title: 'Zoo Jigsaw',
    subtitle: 'Build zoo animals!',
    benefit: '24 animal puzzles across 6 worlds',
    category: 'puzzles',
    isFree: false,
    plaqueBg: '#B7DFAA',
    plaqueInner: '#F3FAEE',
    plaqueBorder: '#437A42',
    accent: '#3E7A42',
    leafTint: '#4A8E4B',
  },
  {
    id: 'animal-peekaboo',
    title: 'Bush Peek-a-Boo',
    subtitle: 'Who is hiding?',
    benefit: 'Visual memory & surprise pairs',
    category: 'action',
    isFree: false,
    plaqueBg: '#B6DEF2',
    plaqueInner: '#F2FAFE',
    plaqueBorder: '#33759B',
    accent: '#4290BD',
    leafTint: '#56A962',
  },
  {
    id: 'number-line-match',
    title: 'Number Match',
    subtitle: 'Draw lines to count!',
    benefit: 'Connect numerals 1–8 to animal groups',
    category: 'learn',
    isFree: false,
    plaqueBg: '#BCE8DF',
    plaqueInner: '#F1FBF9',
    plaqueBorder: '#287D72',
    accent: '#309689',
    leafTint: '#E8A530',
  },
  {
    id: 'letter-line-match',
    title: 'Letter Match',
    subtitle: 'Draw lines A to Z!',
    benefit: 'Connect uppercase/lowercase to words',
    category: 'learn',
    isFree: false,
    plaqueBg: '#E6CBF7',
    plaqueInner: '#FAF4FF',
    plaqueBorder: '#7544A6',
    accent: '#8D58C4',
    leafTint: '#4DAAD8',
  },
  {
    id: 'baby-match',
    title: 'Mama & Baby',
    subtitle: 'Snuggle the babies!',
    benefit: 'Gentle empathy & nursery matching',
    category: 'puzzles',
    isFree: false,
    plaqueBg: '#F4C1D2',
    plaqueInner: '#FFF4F8',
    plaqueBorder: '#A64B6B',
    accent: '#D6648B',
    leafTint: '#E37396',
  },
  {
    id: 'size-sorter',
    title: 'Zoo Parade',
    subtitle: 'Little to giant!',
    benefit: 'Early math size ordering (tiny to big)',
    category: 'puzzles',
    isFree: false,
    plaqueBg: '#D8C8F2',
    plaqueInner: '#F8F4FF',
    plaqueBorder: '#6B4F9E',
    accent: '#8263BA',
    leafTint: '#9677CC',
  },
  {
    id: 'arctic-catch',
    title: 'Arctic Catch',
    subtitle: 'Slide & catch fish!',
    benefit: 'Smooth tracking in the snowy bay',
    category: 'action',
    isFree: false,
    plaqueBg: '#B3E3DC',
    plaqueInner: '#F0FBF9',
    plaqueBorder: '#2C7F78',
    accent: '#2F948B',
    leafTint: '#4DAAD8',
  },
];

export const ANIMAL_DISPLAY_NAMES: Record<string, string> = {
  monkey: 'Monkey',
  toucan: 'Toucan',
  gorilla: 'Gorilla',
  frog: 'Frog',
  whale: 'Whale',
  turtle: 'Turtle',
  octopus: 'Octopus',
  clownfish: 'Clownfish',
  giraffe: 'Giraffe',
  zebra: 'Zebra',
  elephant: 'Elephant',
  lion: 'Lion',
  panda: 'Panda',
  flamingo: 'Flamingo',
  hippo: 'Hippo',
  tiger: 'Tiger',
  penguin: 'Penguin',
  seal: 'Seal',
  polarbear: 'Polar Bear',
  puffin: 'Puffin',
  cow: 'Cow',
  sheep: 'Sheep',
  duck: 'Duck',
  pig: 'Pig',
};

export function getAnimalDisplayName(animal: string): string {
  return ANIMAL_DISPLAY_NAMES[animal] || animal.charAt(0).toUpperCase() + animal.slice(1);
}

export const FREE_GAMES_COUNT = GAMES.filter((g) => g.isFree).length;
export const PAID_GAMES_COUNT = GAMES.filter((g) => !g.isFree).length;

export const UNLOCK_PRICE_DISPLAY = '$4.99';
export const UNLOCK_PRODUCT_ID = 'whits_world_unlock_all_lifetime';
