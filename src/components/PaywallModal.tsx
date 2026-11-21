import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, UNLOCK_PRICE_DISPLAY, UNLOCK_PRODUCT_ID } from '../theme';
import { CrownIcon, JungleBushCoverSvg, StarIcon } from './JungleArt';
import { TactileButton } from './TactileButton';
import { WhitMascot } from './WhitMascot';
import { ZooExhibitAnimalSvg } from './ZooExhibitAnimals';

interface ShowcaseGame {
  id: string;
  title: string;
  benefit: string;
  bg: string;
  border: string;
  accent: string;
}

const SHOWCASE_GAMES: ShowcaseGame[] = [
  {
    id: 'ball-pass',
    title: 'Jungle Ball Pass',
    benefit: 'Aim, kick & score goals',
    bg: '#FCE3D4',
    border: '#D98E6B',
    accent: '#C45B35',
  },
  {
    id: 'animal-peekaboo',
    title: 'Bush Peek-a-Boo',
    benefit: 'Memory & surprise play',
    bg: '#DDF1FB',
    border: '#7AB8D9',
    accent: '#2D779E',
  },
  {
    id: 'size-sorter',
    title: 'Zoo Parade',
    benefit: 'Little-to-giant sorting',
    bg: '#EAE1FA',
    border: '#A78ED6',
    accent: '#684AA1',
  },
  {
    id: 'baby-match',
    title: 'Mama & Baby',
    benefit: 'Matching & gentle care',
    bg: '#FCE2EC',
    border: '#DC8EAC',
    accent: '#B0466D',
  },
  {
    id: 'jungle-music',
    title: 'Zoo Band',
    benefit: 'Rhythm & xylophone play',
    bg: '#FCF0C8',
    border: '#D9B159',
    accent: '#A16E16',
  },
  {
    id: 'arctic-catch',
    title: 'Arctic Catch',
    benefit: 'Glide & catch fish',
    bg: '#DDF5F1',
    border: '#6EBDB4',
    accent: '#237A72',
  },
];

const ShowcaseArt: React.FC<{ id: string }> = ({ id }) => {
  switch (id) {
    case 'ball-pass':
      return (
        <View style={styles.artRow}>
          <ZooExhibitAnimalSvg animal="lion" size={44} />
          <View style={styles.miniBallClip}>
            <Image
              source={STORYBOOK_ASSETS.jungleBall}
              style={{ width: 26, height: 26 }}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    case 'animal-peekaboo':
      return (
        <View style={styles.artStack}>
          <View style={{ marginBottom: -12 }}>
            <ZooExhibitAnimalSvg animal="monkey" size={34} />
          </View>
          <JungleBushCoverSvg size={44} />
        </View>
      );
    case 'size-sorter':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="frog" size={28} />
          <ZooExhibitAnimalSvg animal="elephant" size={44} />
        </View>
      );
    case 'baby-match':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="giraffe" size={46} />
          <ZooExhibitAnimalSvg animal="panda" size={30} />
        </View>
      );
    case 'arctic-catch':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="penguin" size={42} />
          <ZooExhibitAnimalSvg animal="seal" size={34} />
        </View>
      );
    case 'jungle-music':
    default:
      return (
        <View style={styles.artStack}>
          <ZooExhibitAnimalSvg animal="toucan" size={36} />
          <View style={styles.xyloMiniRow}>
            {['#DF5D56', '#DF7248', '#F2C34C', '#56A962', '#4DAAD8'].map(
              (c, i) => (
                <View
                  key={i}
                  style={{
                    width: 8,
                    height: 15 - i * 1.5,
                    borderRadius: 3,
                    backgroundColor: c,
                  }}
                />
              )
            )}
          </View>
        </View>
      );
  }
};

const PARENT_PROMISES = [
  'One-time purchase · No subscriptions',
  '100% ad-free & no data tracking',
  'Works offline for flights & car rides',
  'iPad & iPhone · Family Sharing',
];

/**
 * Parent-Only Upgrade Showcase & Testing Hub Modal.
 * Only reachable after passing the Parental Gate.
 * - Visual storybook showcase of all 5 unlockable zoo games
 * - Clear parent trust signals (one-time purchase, offline, ad-free, Family Sharing)
 * - App Store compliant "Restore Purchases" button + local browser preview toggle
 */
export const PaywallModal: React.FC = () => {
  const {
    paywallVisible,
    closePaywall,
    isUnlocked,
    isPurchasing,
    starsEarned,
    statusMessage,
    handlePurchaseUnlockAll,
    handleRestorePurchases,
    handleSetPreviewUnlocked,
  } = useApp();
  const { isTablet } = useResponsive();

  return (
    <Modal
      visible={paywallVisible}
      transparent
      animationType="slide"
      onRequestClose={closePaywall}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, isTablet && styles.sheetTablet]}>
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.topLeftGroup}>
              <View style={styles.parentTag}>
                <CrownIcon size={16} color="#D48A18" />
                <Text style={styles.parentTagText}>PARENT CORNER</Text>
              </View>
              {starsEarned > 0 && (
                <View style={styles.starsEarnedTag}>
                  <StarIcon size={14} color={COLORS.sunGold} />
                  <Text style={styles.starsEarnedText}>
                    {starsEarned} {starsEarned === 1 ? 'star' : 'stars'} earned
                  </Text>
                </View>
              )}
            </View>
            <TactileButton
              onPress={closePaywall}
              accessibilityLabel="Close parent paywall"
            >
              <View style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </View>
            </TactileButton>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Warm Hero Card */}
            <View style={styles.heroCard}>
              <WhitMascot
                mood={isUnlocked ? 'cheer' : 'idle'}
                size={isTablet ? 104 : 88}
                interactive={false}
              />
              <View style={styles.heroCopy}>
                <Text style={[styles.title, isTablet && styles.titleTablet]}>
                  {isUnlocked
                    ? 'All 10 Zoo Games Unlocked!'
                    : 'Unlock All of Whit’s World'}
                </Text>
                <Text style={styles.priceSubtitle}>
                  {isUnlocked
                    ? 'Thank you for supporting calm, ad-free play.'
                    : `All 6 extra games • ${UNLOCK_PRICE_DISPLAY} once, keep forever`}
                </Text>
              </View>
            </View>

            {/* Parent Trust Promise Pills */}
            <View style={styles.promiseGrid}>
              {PARENT_PROMISES.map((promise, idx) => (
                <View key={idx} style={styles.promisePill}>
                  <Text style={styles.promiseCheck}>✓</Text>
                  <Text style={styles.promiseText}>{promise}</Text>
                </View>
              ))}
            </View>

            {/* Visual 6-Game Storybook Showcase */}
            <Text style={styles.sectionHeading}>
              INCLUDED IN THE FULL ZOO PACK
            </Text>
            <View style={styles.showcaseGrid}>
              {SHOWCASE_GAMES.map((game) => (
                <View
                  key={game.id}
                  style={[
                    styles.showcaseCard,
                    isTablet && styles.showcaseCardTablet,
                    { backgroundColor: game.bg, borderColor: game.border },
                  ]}
                >
                  <View style={styles.showcaseArtBox}>
                    <ShowcaseArt id={game.id} />
                  </View>
                  <View style={styles.showcaseCopy}>
                    <Text style={styles.showcaseTitle}>{game.title}</Text>
                    <Text style={[styles.showcaseBenefit, { color: game.accent }]}>
                      {game.benefit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Local Preview / Dev Toggle for immediate browser testing */}
            <View style={styles.devBox}>
              <View style={styles.devTextCol}>
                <Text style={styles.devTitle}>Browser Preview Toggle</Text>
                <Text style={styles.devSubtitle}>
                  Test Free Tier vs Unlocked All locally ({UNLOCK_PRODUCT_ID})
                </Text>
              </View>
              <Switch
                value={isUnlocked}
                onValueChange={handleSetPreviewUnlocked}
                trackColor={{ false: '#CBD8C9', true: '#7DD88A' }}
                thumbColor={isUnlocked ? COLORS.jungleDeep : '#FFFFFF'}
              />
            </View>
          </ScrollView>

          {/* Pinned Bottom Purchase Footer — always visible above the fold on iPhone & iPad */}
          <View style={styles.stickyFooter}>
            {statusMessage && (
              <View style={styles.statusBanner}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}

            {!isUnlocked ? (
              <View style={styles.ctaWrap}>
                <TactileButton
                  onPress={handlePurchaseUnlockAll}
                  disabled={isPurchasing}
                  accessibilityLabel={`Unlock All 10 Games — ${UNLOCK_PRICE_DISPLAY}`}
                >
                  <View
                    style={[
                      styles.buyBtn,
                      isPurchasing && { opacity: 0.7 },
                    ]}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.buyBtnInner}>
                        <CrownIcon size={20} color="#FFE578" />
                        <Text style={styles.buyBtnText}>
                          Unlock All 10 Games — {UNLOCK_PRICE_DISPLAY}
                        </Text>
                      </View>
                    )}
                  </View>
                </TactileButton>
                <View style={styles.footerMetaRow}>
                  <Text style={styles.ctaMicroCopy}>
                    Pay once · Never billed again
                  </Text>
                  <Text style={styles.footerDot}>•</Text>
                  <TactileButton
                    onPress={handleRestorePurchases}
                    disabled={isPurchasing}
                    accessibilityLabel="Restore Purchases"
                  >
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                  </TactileButton>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.unlockedPill}>
                  <Text style={styles.unlockedPillText}>
                    ✓ Full Jungle Adventure Active
                  </Text>
                </View>
                <TactileButton
                  onPress={handleRestorePurchases}
                  disabled={isPurchasing}
                  accessibilityLabel="Restore Purchases"
                >
                  <View style={styles.restoreBtn}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                  </View>
                </TactileButton>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: COLORS.cream,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#DEC9A4',
    padding: 18,
    shadowColor: '#3A2818',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetTablet: {
    maxWidth: 580,
    padding: 24,
    borderRadius: 34,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  parentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1C7',
    borderWidth: 1.5,
    borderColor: '#EBD08A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  parentTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#8B5A00',
    letterSpacing: 0.7,
  },
  starsEarnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF8EA',
    borderWidth: 1.2,
    borderColor: '#C4E3BC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  starsEarnedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.jungleDark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE6D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.woodDark,
  },
  scrollContent: {
    paddingBottom: 6,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3FAEE',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#CFE8C6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 3,
  },
  titleTablet: {
    fontSize: 23,
  },
  priceSubtitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.jungleDeep,
    lineHeight: 18,
  },
  promiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  promisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E8DCC6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: '48.5%',
  },
  promiseCheck: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.emerald,
  },
  promiseText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 15,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.inkMuted,
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 2,
  },
  showcaseGrid: {
    gap: 8,
    marginBottom: 14,
  },
  showcaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  showcaseCardTablet: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  showcaseArtBox: {
    width: 78,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 253, 247, 0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  miniBallClip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginLeft: -4,
  },
  artStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  xyloMiniRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: -4,
  },
  showcaseCopy: {
    flex: 1,
  },
  showcaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 2,
  },
  showcaseBenefit: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  statusBanner: {
    backgroundColor: '#E5F7E7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#8FD698',
    padding: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.jungleDark,
    textAlign: 'center',
  },
  stickyFooter: {
    borderTopWidth: 1.5,
    borderTopColor: '#EAE0CD',
    paddingTop: 12,
    marginTop: 6,
  },
  ctaWrap: {
    marginBottom: 2,
  },
  buyBtn: {
    backgroundColor: COLORS.emerald,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: COLORS.emeraldBorder,
    borderBottomWidth: 6,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    shadowColor: '#25592D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  buyBtnPressed: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 3,
  },
  buyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerDot: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  ctaMicroCopy: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
    textAlign: 'center',
  },
  unlockedPill: {
    backgroundColor: '#E2F6E6',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.emerald,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  unlockedPillText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.jungleDark,
  },
  restoreBtn: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.inkMuted,
    textDecorationLine: 'underline',
  },
  devBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F3ECE0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DFD3BC',
    padding: 11,
  },
  devTextCol: {
    flex: 1,
  },
  devTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.woodDark,
    marginBottom: 2,
  },
  devSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.inkMuted,
  },
});
