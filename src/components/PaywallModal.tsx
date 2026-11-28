import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { STORYBOOK_ASSETS } from '../assets/assetMap';
import { useApp } from '../context/AppContext';
import { useResponsive } from '../hooks/useResponsive';
import {
  COLORS,
  Difficulty,
  FREE_GAMES_COUNT,
  GameId,
  GameMeta,
  GAMES,
  PAID_GAMES_COUNT,
  UNLOCK_PRICE_DISPLAY,
  UNLOCK_PRODUCT_ID,
} from '../theme';
import { CrownIcon, JungleBushCoverSvg, StarIcon } from './JungleArt';
import { PicnicTreatSvg } from './PicnicTreats';
import { TactileButton } from './TactileButton';
import { WhitMascot } from './WhitMascot';
import { ZooAnimalSvg } from './ZooAnimalsArt';
import { ZooExhibitAnimalSvg } from './ZooExhibitAnimals';

const TOTAL_ZOO_FRIENDS = 24;

const STAGE_OPTIONS: { level: Difficulty; label: string; sub: string }[] = [
  { level: 1, label: '🌱 Age 2', sub: 'Easy' },
  { level: 2, label: '🌿 Age 3', sub: 'Med' },
  { level: 3, label: '🌳 Age 4+', sub: 'Hard' },
];

const TIMER_OPTIONS: { mins: number | null; label: string }[] = [
  { mins: null, label: 'Off' },
  { mins: 5, label: '5m' },
  { mins: 10, label: '10m' },
  { mins: 15, label: '15m' },
  { mins: 20, label: '20m' },
];

const PARENT_PROMISES = [
  'One-time purchase · No subscriptions',
  '100% ad-free & no data tracking',
  'Works offline for flights & car rides',
  '1 Free Try per day on locked games',
];

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const ShowcaseArt: React.FC<{ id: GameId }> = ({ id }) => {
  switch (id) {
    case 'ball-pass':
      return (
        <View style={styles.artRow}>
          <ZooExhibitAnimalSvg animal="lion" size={40} />
          <View style={styles.miniBallClip}>
            <Image
              source={STORYBOOK_ASSETS.jungleBall}
              style={{ width: 24, height: 24 }}
              resizeMode="cover"
            />
          </View>
        </View>
      );
    case 'animal-peekaboo':
      return (
        <View style={styles.artStack}>
          <View style={{ marginBottom: -12 }}>
            <ZooExhibitAnimalSvg animal="monkey" size={30} />
          </View>
          <JungleBushCoverSvg size={40} />
        </View>
      );
    case 'size-sorter':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="frog" size={24} />
          <ZooExhibitAnimalSvg animal="elephant" size={40} />
        </View>
      );
    case 'baby-match':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="giraffe" size={42} />
          <ZooExhibitAnimalSvg animal="panda" size={28} />
        </View>
      );
    case 'arctic-catch':
      return (
        <View style={styles.artBottomRow}>
          <ZooExhibitAnimalSvg animal="penguin" size={38} />
          <ZooExhibitAnimalSvg animal="seal" size={30} />
        </View>
      );
    case 'jungle-picnic':
      return (
        <View style={styles.artRow}>
          <PicnicTreatSvg treat="banana" size={26} />
          <ZooExhibitAnimalSvg animal="gorilla" size={38} />
        </View>
      );
    case 'jungle-jigsaw':
      return (
        <View style={styles.artRow}>
          <ZooAnimalSvg animal="giraffe" size={40} />
        </View>
      );
    case 'letter-safari':
      return (
        <View style={styles.artRow}>
          <View style={[styles.miniLetterTile, { backgroundColor: '#FFE5E2', borderColor: '#C94A42' }]}>
            <Text style={[styles.miniLetterText, { color: '#A6322B' }]}>A</Text>
          </View>
          <View style={[styles.miniLetterTile, { backgroundColor: '#E1F7DE', borderColor: '#38823D' }]}>
            <Text style={[styles.miniLetterText, { color: '#28642C' }]}>B</Text>
          </View>
        </View>
      );
    case 'number-line-match':
      return (
        <View style={styles.artRow}>
          <View style={[styles.miniLetterTile, { backgroundColor: '#EEF9FF', borderColor: '#2A7CA8' }]}>
            <Text style={[styles.miniLetterText, { color: '#1D6E9C' }]}>3</Text>
          </View>
          <ZooExhibitAnimalSvg animal="duck" size={30} />
        </View>
      );
    case 'letter-line-match':
      return (
        <View style={styles.artRow}>
          <View style={[styles.miniLetterTile, { backgroundColor: '#F5EFFF', borderColor: '#6A44A3' }]}>
            <Text style={[styles.miniLetterText, { color: '#60389C' }]}>L</Text>
          </View>
          <ZooExhibitAnimalSvg animal="lion" size={32} />
        </View>
      );
    case 'jungle-music':
    default:
      return (
        <View style={styles.artStack}>
          <ZooExhibitAnimalSvg animal="toucan" size={32} />
          <View style={styles.xyloMiniRow}>
            {['#DF5D56', '#DF7248', '#F2C34C', '#56A962', '#4DAAD8'].map(
              (c, i) => (
                <View
                  key={i}
                  style={{
                    width: 7,
                    height: 14 - i * 1.4,
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

/**
 * Parent Corner 2.0 & Full Zoo Pack Showcase Modal.
 * Only reachable after passing the Parental Gate.
 * - Personalized locked-game spotlight + 1-tap launch after unlock
 * - Parent Progress & Learning Snapshot (stars, animals, favorite game, practiced skills)
 * - Child Age Stage selector (persisted default difficulty) + Gentle Whit Bedtime Timer
 * - Visual showcase of all 11 Full Zoo Pack games + Browser Preview Toggle
 */
export const PaywallModal: React.FC = () => {
  const {
    paywallVisible,
    closePaywall,
    isUnlocked,
    isPurchasing,
    starsEarned,
    collectedStickers,
    pendingLockedGame,
    statusMessage,
    defaultDifficulty,
    parentStats,
    bedtimeMinutes,
    bedtimeSecondsLeft,
    handlePurchaseUnlockAll,
    handleRestorePurchases,
    handleSetPreviewUnlocked,
    launchPendingLockedGame,
    setAgePresetDifficulty,
    startBedtimeTimer,
  } = useApp();
  const { isTablet } = useResponsive();

  const pendingMeta: GameMeta | null = useMemo(
    () =>
      pendingLockedGame
        ? GAMES.find((g) => g.id === pendingLockedGame) ?? null
        : null,
    [pendingLockedGame]
  );

  const showcaseGames = useMemo(() => {
    const lockedPool = GAMES.filter((g) => !g.isFree);
    if (!pendingLockedGame) return lockedPool;
    const pinned = lockedPool.filter((g) => g.id === pendingLockedGame);
    const rest = lockedPool.filter((g) => g.id !== pendingLockedGame);
    return [...pinned, ...rest];
  }, [pendingLockedGame]);

  const favoriteGameTitle = useMemo(() => {
    let bestId: GameId | null = null;
    let bestCount = 0;
    for (const [id, count] of Object.entries(parentStats.byGame)) {
      if ((count || 0) > bestCount) {
        bestCount = count || 0;
        bestId = id as GameId;
      }
    }
    if (!bestId) return 'Ready to explore!';
    return GAMES.find((g) => g.id === bestId)?.title || 'Zoo Coloring';
  }, [parentStats.byGame]);

  const skillPills = useMemo(() => {
    const bg = parentStats.byGame;
    return [
      {
        label: '🎨 Colors',
        active: Boolean((bg['color-match'] || 0) + (bg['color-line-match'] || 0) + (bg['zoo-coloring'] || 0) > 0),
      },
      {
        label: '🔢 Counting',
        active: Boolean((bg['number-count'] || 0) + (bg['number-line-match'] || 0) > 0),
      },
      {
        label: '🔤 ABCs',
        active: Boolean((bg['letter-safari'] || 0) + (bg['letter-line-match'] || 0) > 0),
      },
      {
        label: '🧩 Puzzles',
        active: Boolean((bg['shape-sorter'] || 0) + (bg['jungle-jigsaw'] || 0) + (bg['size-sorter'] || 0) + (bg['baby-match'] || 0) > 0),
      },
      {
        label: '🎵 Music & Play',
        active: Boolean((bg['jungle-music'] || 0) + (bg['bubble-pop'] || 0) + (bg['ball-pass'] || 0) + (bg['jungle-picnic'] || 0) + (bg['arctic-catch'] || 0) > 0),
      },
    ];
  }, [parentStats.byGame]);

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
              {bedtimeSecondsLeft !== null && bedtimeSecondsLeft > 0 && (
                <View style={styles.timerLiveTag}>
                  <Text style={styles.timerLiveText}>
                    🌙 {formatCountdown(bedtimeSecondsLeft)} left
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
            {/* Personalized Hero Card */}
            <View style={styles.heroCard}>
              <WhitMascot
                mood={isUnlocked ? 'cheer' : 'wave'}
                size={isTablet ? 96 : 80}
                interactive={false}
              />
              <View style={styles.heroCopy}>
                <Text style={[styles.title, isTablet && styles.titleTablet]}>
                  {isUnlocked
                    ? `All ${GAMES.length} Zoo Games Unlocked!`
                    : pendingMeta
                    ? `Unlock ${pendingMeta.title} + All ${GAMES.length} Games`
                    : 'Unlock All of Whit’s World'}
                </Text>
                <Text style={styles.priceSubtitle}>
                  {isUnlocked
                    ? 'Thank you for supporting calm, ad-free toddler play.'
                    : `${FREE_GAMES_COUNT} Starter Games + ${PAID_GAMES_COUNT} Full-Pack Games • ${UNLOCK_PRICE_DISPLAY} once`}
                </Text>
              </View>
            </View>

            {/* Parent Controls: Child Stage (Difficulty) + Calm Bedtime Timer */}
            <View style={styles.controlsCard}>
              <Text style={styles.cardSectionTitle}>
                CHILD STAGE & CALM SCREEN-TIME TIMER
              </Text>

              <View style={styles.controlBlock}>
                <Text style={styles.controlLabel}>
                  Default Game Difficulty (remembered per game):
                </Text>
                <View style={styles.pillRow}>
                  {STAGE_OPTIONS.map((opt) => {
                    const active = defaultDifficulty === opt.level;
                    return (
                      <TactileButton
                        key={opt.level}
                        onPress={() => setAgePresetDifficulty(opt.level)}
                        accessibilityLabel={`Set stage ${opt.label} (${opt.sub})`}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={[
                            styles.stagePill,
                            active && styles.stagePillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stagePillMain,
                              active && styles.stagePillTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          <Text
                            style={[
                              styles.stagePillSub,
                              active && styles.stagePillTextActive,
                            ]}
                          >
                            {opt.sub}
                          </Text>
                        </View>
                      </TactileButton>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.controlBlock, { marginBottom: 0 }]}>
                <Text style={styles.controlLabel}>
                  Gentle Whit Bedtime Wind-Down Timer:
                </Text>
                <View style={styles.pillRow}>
                  {TIMER_OPTIONS.map((opt) => {
                    const active = bedtimeMinutes === opt.mins;
                    return (
                      <TactileButton
                        key={String(opt.mins)}
                        onPress={() => startBedtimeTimer(opt.mins)}
                        accessibilityLabel={`Bedtime timer ${opt.label}`}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={[
                            styles.timerPill,
                            active && styles.timerPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timerPillText,
                              active && styles.timerPillTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>
                      </TactileButton>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Parent Learning & Progress Snapshot */}
            <View style={styles.snapshotCard}>
              <Text style={styles.cardSectionTitle}>
                EXPLORER LEARNING SNAPSHOT
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{starsEarned}</Text>
                  <Text style={styles.statCaption}>Stars Earned</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {collectedStickers.length}/{TOTAL_ZOO_FRIENDS}
                  </Text>
                  <Text style={styles.statCaption}>Zoo Friends</Text>
                </View>
                <View style={[styles.statBox, { flex: 1.35 }]}>
                  <Text style={styles.statFavorite} numberOfLines={1}>
                    {favoriteGameTitle}
                  </Text>
                  <Text style={styles.statCaption}>Favorite Activity</Text>
                </View>
              </View>

              <View style={styles.skillsWrap}>
                {skillPills.map((sk) => (
                  <View
                    key={sk.label}
                    style={[
                      styles.skillBadge,
                      sk.active && styles.skillBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.skillBadgeText,
                        sk.active && styles.skillBadgeTextActive,
                      ]}
                    >
                      {sk.active ? `✓ ${sk.label}` : sk.label}
                    </Text>
                  </View>
                ))}
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

            {/* Visual 11-Game Full Zoo Pack Showcase */}
            <Text style={styles.sectionHeading}>
              {PAID_GAMES_COUNT} EXTRA GAMES IN THE FULL ZOO PACK
            </Text>
            <View
              style={[
                styles.showcaseGrid,
                isTablet && styles.showcaseGridTablet,
              ]}
            >
              {showcaseGames.map((game) => {
                const isPinned = pendingLockedGame === game.id && !isUnlocked;
                return (
                  <View
                    key={game.id}
                    style={[
                      styles.showcaseCard,
                      isTablet && styles.showcaseCardTablet,
                      {
                        backgroundColor: game.plaqueInner,
                        borderColor: isPinned ? COLORS.sunGold : game.plaqueBorder,
                        borderWidth: isPinned ? 3 : 1.8,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.showcaseArtBox,
                        { backgroundColor: game.plaqueBg },
                      ]}
                    >
                      <ShowcaseArt id={game.id} />
                    </View>
                    <View style={styles.showcaseCopy}>
                      <View style={styles.showcaseTitleRow}>
                        <Text style={styles.showcaseTitle} numberOfLines={1}>
                          {game.title}
                        </Text>
                        {isPinned && (
                          <View style={styles.requestedChip}>
                            <Text style={styles.requestedChipText}>★ Tapped</Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.showcaseBenefit, { color: game.accent }]}
                        numberOfLines={1}
                      >
                        {game.benefit}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Local Preview / Dev Toggle kept visible until payment keys are wired */}
            <View style={styles.devBox}>
              <View style={styles.devTextCol}>
                <Text style={styles.devTitle}>Browser Preview Toggle</Text>
                <Text style={styles.devSubtitle}>
                  Test Starter Pack ({FREE_GAMES_COUNT} free) vs Full Zoo Pack ({GAMES.length} games · {UNLOCK_PRODUCT_ID})
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

          {/* Pinned Bottom Purchase Footer */}
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
                  accessibilityLabel={`Unlock All ${GAMES.length} Games — ${UNLOCK_PRICE_DISPLAY}`}
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
                          {pendingMeta
                            ? `Unlock ${pendingMeta.title} + All ${GAMES.length} Games — ${UNLOCK_PRICE_DISPLAY}`
                            : `Unlock All ${GAMES.length} Games — ${UNLOCK_PRICE_DISPLAY}`}
                        </Text>
                      </View>
                    )}
                  </View>
                </TactileButton>
                <View style={styles.footerMetaRow}>
                  <Text style={styles.ctaMicroCopy}>
                    Pay once · Keep forever
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
                {pendingMeta ? (
                  <TactileButton
                    onPress={launchPendingLockedGame}
                    accessibilityLabel={`Play ${pendingMeta.title} now`}
                  >
                    <View style={styles.buyBtn}>
                      <Text style={styles.buyBtnText}>
                        ▶ Play {pendingMeta.title} Now!
                      </Text>
                    </View>
                  </TactileButton>
                ) : (
                  <View style={styles.unlockedPill}>
                    <Text style={styles.unlockedPillText}>
                      ✓ Full Jungle Adventure Active ({GAMES.length} Games)
                    </Text>
                  </View>
                )}
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
    padding: 12,
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '94%',
    backgroundColor: COLORS.cream,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#DEC9A4',
    padding: 16,
    shadowColor: '#3A2818',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetTablet: {
    maxWidth: 660,
    padding: 22,
    borderRadius: 34,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  timerLiveTag: {
    backgroundColor: '#E5E8FF',
    borderWidth: 1.5,
    borderColor: '#98A4EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerLiveText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2D3775',
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
    marginBottom: 10,
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontSize: 18.5,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 2,
  },
  titleTablet: {
    fontSize: 21.5,
  },
  priceSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.jungleDeep,
    lineHeight: 17,
  },
  controlsCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    borderWidth: 1.6,
    borderColor: '#E5D8BF',
    padding: 12,
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLORS.inkMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  controlBlock: {
    marginBottom: 10,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stagePill: {
    borderRadius: 13,
    borderWidth: 1.8,
    borderColor: '#DFD2BA',
    backgroundColor: '#FBF6EA',
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  stagePillActive: {
    backgroundColor: '#E1F5DF',
    borderColor: COLORS.emerald,
  },
  stagePillMain: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
  },
  stagePillSub: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  stagePillTextActive: {
    color: COLORS.jungleDark,
  },
  timerPill: {
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: '#DFD2BA',
    backgroundColor: '#FBF6EA',
    paddingVertical: 7,
    alignItems: 'center',
  },
  timerPillActive: {
    backgroundColor: '#E4E8FF',
    borderColor: '#5B6BC4',
  },
  timerPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkMuted,
  },
  timerPillTextActive: {
    color: '#253070',
  },
  snapshotCard: {
    backgroundColor: '#FBF5E6',
    borderRadius: 20,
    borderWidth: 1.6,
    borderColor: '#E5D5B5',
    padding: 12,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFDF8',
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: '#E8DBC2',
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.woodDark,
  },
  statFavorite: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.jungleDeep,
  },
  statCaption: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkMuted,
    marginTop: 1,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    borderRadius: 999,
    borderWidth: 1.3,
    borderColor: '#DFD3BC',
    backgroundColor: '#F6EFE1',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  skillBadgeActive: {
    backgroundColor: '#E4F7E6',
    borderColor: '#82CC8D',
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  skillBadgeTextActive: {
    color: COLORS.jungleDark,
    fontWeight: '800',
  },
  promiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
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
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 14,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.inkMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  showcaseGrid: {
    gap: 7,
    marginBottom: 12,
  },
  showcaseGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showcaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  showcaseCardTablet: {
    width: '49%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  showcaseArtBox: {
    width: 66,
    height: 46,
    borderRadius: 12,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
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
    gap: 2.5,
    marginTop: -3,
  },
  miniLetterTile: {
    width: 24,
    height: 28,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLetterText: {
    fontSize: 15,
    fontWeight: '900',
  },
  showcaseCopy: {
    flex: 1,
  },
  showcaseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  showcaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    flexShrink: 1,
  },
  requestedChip: {
    backgroundColor: '#FFE885',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  requestedChipText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#6B4700',
  },
  showcaseBenefit: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusBanner: {
    backgroundColor: '#E5F7E7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#8FD698',
    padding: 9,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.jungleDark,
    textAlign: 'center',
  },
  stickyFooter: {
    borderTopWidth: 1.5,
    borderTopColor: '#EAE0CD',
    paddingTop: 10,
    marginTop: 4,
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#25592D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  buyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buyBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
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
    paddingVertical: 11,
    alignItems: 'center',
    marginBottom: 6,
  },
  unlockedPillText: {
    fontSize: 15,
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
