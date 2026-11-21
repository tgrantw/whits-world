import { ImageSourcePropType } from 'react-native';

/**
 * Centralized static asset registry for Whit's World storybook PNG illustrations.
 * Bundled locally via static `require()` calls (100% offline & App Store ready).
 *
 * Complete Warm Watercolor & Gouache Illustration Set (34 Bundled PNGs):
 * - 7 Backdrops: bg-home.png, bg-clearing.png, bg-aquarium.png, bg-savanna.png,
 *                bg-sanctuary.png, bg-arctic.png, bg-farm.png
 * - Mascot Frames: whit-idle.png, whit-blink.png, whit-cheer.png
 * - Props: jungle-ball.png
 * - All 24 Animals: monkey, toucan, gorilla, frog, lion, elephant, giraffe,
 *                   panda, zebra, hippo, tiger, flamingo, whale, octopus,
 *                   turtle, clownfish, penguin, polarbear, seal, puffin,
 *                   cow, pig, duck, sheep
 */

export const STORYBOOK_ASSETS = {
  whitIdle: require('../../assets/images/whit-idle.png') as ImageSourcePropType,
  whitBlink: require('../../assets/images/whit-blink.png') as ImageSourcePropType,
  whitCheer: require('../../assets/images/whit-cheer.png') as ImageSourcePropType,
  jungleBall: require('../../assets/images/jungle-ball.png') as ImageSourcePropType,
  bgHome: require('../../assets/images/bg-home.png') as ImageSourcePropType,
  bgClearing: require('../../assets/images/bg-clearing.png') as ImageSourcePropType,
  bgAquarium: require('../../assets/images/bg-aquarium.png') as ImageSourcePropType,
  bgSavanna: require('../../assets/images/bg-savanna.png') as ImageSourcePropType,
  bgSanctuary: require('../../assets/images/bg-sanctuary.png') as ImageSourcePropType,
  bgArctic: require('../../assets/images/bg-arctic.png') as ImageSourcePropType,
  bgFarm: require('../../assets/images/bg-farm.png') as ImageSourcePropType,
};

export const STORYBOOK_ANIMALS: Partial<Record<string, ImageSourcePropType>> = {
  monkey: require('../../assets/images/monkey.png') as ImageSourcePropType,
  toucan: require('../../assets/images/toucan.png') as ImageSourcePropType,
  gorilla: require('../../assets/images/whit-idle.png') as ImageSourcePropType,
  frog: require('../../assets/images/frog.png') as ImageSourcePropType,
  lion: require('../../assets/images/lion.png') as ImageSourcePropType,
  elephant: require('../../assets/images/elephant.png') as ImageSourcePropType,
  giraffe: require('../../assets/images/giraffe.png') as ImageSourcePropType,
  panda: require('../../assets/images/panda.png') as ImageSourcePropType,
  zebra: require('../../assets/images/zebra.png') as ImageSourcePropType,
  hippo: require('../../assets/images/hippo.png') as ImageSourcePropType,
  tiger: require('../../assets/images/tiger.png') as ImageSourcePropType,
  flamingo: require('../../assets/images/flamingo.png') as ImageSourcePropType,
  whale: require('../../assets/images/whale.png') as ImageSourcePropType,
  octopus: require('../../assets/images/octopus.png') as ImageSourcePropType,
  turtle: require('../../assets/images/turtle.png') as ImageSourcePropType,
  clownfish: require('../../assets/images/clownfish.png') as ImageSourcePropType,
  // Snowy Arctic
  penguin: require('../../assets/images/penguin.png') as ImageSourcePropType,
  polarbear: require('../../assets/images/polarbear.png') as ImageSourcePropType,
  seal: require('../../assets/images/seal.png') as ImageSourcePropType,
  puffin: require('../../assets/images/puffin.png') as ImageSourcePropType,
  // Sunny Farm
  cow: require('../../assets/images/cow.png') as ImageSourcePropType,
  pig: require('../../assets/images/pig.png') as ImageSourcePropType,
  duck: require('../../assets/images/duck.png') as ImageSourcePropType,
  sheep: require('../../assets/images/sheep.png') as ImageSourcePropType,
};
