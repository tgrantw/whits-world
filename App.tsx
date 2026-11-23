import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { JungleBackground } from './src/components/JungleBackground';
import { ParentalGateModal } from './src/components/ParentalGateModal';
import { PaywallModal } from './src/components/PaywallModal';
import { StarJarModal } from './src/components/StarJarModal';
import { AppProvider, useApp } from './src/context/AppContext';
import { AnimalPeekabooGame } from './src/games/AnimalPeekabooGame';
import { ArcticCatchGame } from './src/games/ArcticCatchGame';
import { BabyMatchGame } from './src/games/BabyMatchGame';
import { BallPassGame } from './src/games/BallPassGame';
import { BubblePopGame } from './src/games/BubblePopGame';
import { JungleJigsawGame } from './src/games/JungleJigsawGame';
import { JungleMusicGame } from './src/games/JungleMusicGame';
import { JunglePicnicGame } from './src/games/JunglePicnicGame';
import { ShapeSorterGame } from './src/games/ShapeSorterGame';
import { SizeSorterGame } from './src/games/SizeSorterGame';
import { ZooColoringGame } from './src/games/ZooColoringGame';
import { HomeScreen } from './src/screens/HomeScreen';

const RootNavigator: React.FC = () => {
  const {
    activeGame,
    parentGateVisible,
    closeParentGate,
    onParentGatePassed,
  } = useApp();

  // Improve mobile browser feel: prevent pull-to-refresh bounce and accidental text selection
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = "Whit's World — Jungle Puzzles";
      document.body.style.overscrollBehavior = 'none';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      document.body.style.backgroundColor = '#EBF8E5';
    }
  }, []);

  const renderScreen = () => {
    switch (activeGame) {
      case 'shape-sorter':
        return <ShapeSorterGame />;
      case 'jungle-jigsaw':
        return <JungleJigsawGame />;
      case 'bubble-pop':
        return <BubblePopGame />;
      case 'ball-pass':
        return <BallPassGame />;
      case 'animal-peekaboo':
        return <AnimalPeekabooGame />;
      case 'size-sorter':
        return <SizeSorterGame />;
      case 'baby-match':
        return <BabyMatchGame />;
      case 'jungle-music':
        return <JungleMusicGame />;
      case 'arctic-catch':
        return <ArcticCatchGame />;
      case 'jungle-picnic':
        return <JunglePicnicGame />;
      case 'zoo-coloring':
        return <ZooColoringGame />;
      default:
        return <HomeScreen />;
    }
  };

  const content = (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.screenHost}>{renderScreen()}</View>
      <ParentalGateModal
        visible={parentGateVisible}
        onClose={closeParentGate}
        onPassed={onParentGatePassed}
      />
      <PaywallModal />
      <StarJarModal />
    </SafeAreaView>
  );

  if (activeGame === 'ball-pass') {
    return <View style={styles.ballPassRoot}>{content}</View>;
  }

  return (
    <JungleBackground variant={activeGame ? 'clearing' : 'home'}>
      {content}
    </JungleBackground>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  ballPassRoot: {
    flex: 1,
    backgroundColor: '#7DB55B',
  },
  safeArea: {
    flex: 1,
  },
  screenHost: {
    flex: 1,
  },
});
