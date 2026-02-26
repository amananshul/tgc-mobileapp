import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Users,
  CalendarCheck,
  Zap,
  Crown,
  ArrowRight,
  Check,
  Lock,
  Calendar,
  MapPin,
} from 'lucide-react-native';
import type { Event } from '../../../types/auth';
import Toast from 'react-native-toast-message';
import SoftGradient from '../../../components/ui/SoftGradient';
import { useDashboard } from '../hooks/useDashboard';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import { useMe } from '../../profile/hooks/useMe';
import {useEnableHost} from '../../host/hooks/useEnableHost';
import {useUIMode} from '../../ui-mode/UIModeProvider';
import TribeCoverAvatar from '../../tribes/components/TribeCoverAvatar';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type { AppStackParamList } from '../../../app/navigation/AppStack';

interface DashboardScreenProps {
  onOpenProfile?: () => void;
}

const accentBackground = {
  mint: 'rgba(125,211,192,0.17)',
  coral: 'rgba(255,139,123,0.16)',
  lavender: 'rgba(200,182,255,0.2)',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  join_tribe: <Users size={20} color={TGC_COLORS.lavender} />,
  attend_event: <CalendarCheck size={20} color={TGC_COLORS.coral} />,
  add_skill: <Zap size={20} color={TGC_COLORS.mint} />,
  create_event: <Calendar size={20} color={TGC_COLORS.mint} />,
  create_tribe: <Users size={20} color={TGC_COLORS.lavender} />,
  post_update: <Zap size={20} color={TGC_COLORS.coral} />,
  manage_tribes: <Crown size={20} color={TGC_COLORS.lavender} />,
};

export default function DashboardScreen({
  onOpenProfile,
}: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, isLoading, isError, refetch } = useDashboard();
  const meQuery = useMe();
  const {uiMode, canUseHostMode, setUIMode} = useUIMode();
  const enableHost = useEnableHost();

  if (isLoading || meQuery.isLoading) {
    return <Loader color={TGC_COLORS.mint} />;
  }

  if (isError || !data) {
    return (
      <AppBackground style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>We couldn't load your dashboard</Text>
          <Text style={styles.emptyText}>
            Check your connection and try again.
          </Text>
          <Button
            title="Retry"
            onPress={() => refetch()}
            style={styles.retryBtn}
            compact
          />
        </View>
      </AppBackground>
    );
  }

  const isHostMode = uiMode === 'HOST' && canUseHostMode;
  const headerGradient = isHostMode
    ? TGC_GRADIENTS.hostHeader
    : TGC_GRADIENTS.dashboardHeader;
  const userRole = meQuery.data?.user?.role ?? data.user.role;

  const handleActionClick = (actionId: string) => {
    if (actionId === 'join_tribe') {
      navigation.navigate('ExploreTribes');
      return;
    }
    if (actionId === 'attend_event') {
      navigation.navigate('ExploreEvents');
      return;
    }
    if (actionId === 'create_event') {
      navigation.navigate('CreateEvent');
      return;
    }
    if (actionId === 'create_tribe') {
      navigation.navigate('CreateTribe');
      return;
    }
    if (actionId === 'manage_tribes') {
      onOpenProfile?.();
      return;
    }
    if (actionId === 'post_update') {
      if (data.tribes[0]) {
        navigation.navigate('TribeDetail', {slug: data.tribes[0].slug});
      } else {
        navigation.navigate('ExploreTribes');
      }
    }
  };

  const handleModePress = (mode: 'USER' | 'HOST') => {
    if (mode === 'HOST' && !canUseHostMode) {
      Toast.show({
        type: 'info',
        text1: 'Host mode is locked',
        text2: 'Enable Host from your Profile to unlock this mode.',
        position: 'top',
      });
      onOpenProfile?.();
      return;
    }
    setUIMode(mode);
  };

  const displayedActions = isHostMode
    ? [
        {
          id: 'create_event',
          title: 'Create Event',
          description: 'Host a new event and bring your community together.',
          done: false,
          accent: 'mint' as const,
        },
        {
          id: 'create_tribe',
          title: 'Create Tribe',
          description: 'Start a new community and invite members.',
          done: false,
          accent: 'lavender' as const,
        },
        {
          id: 'post_update',
          title: 'Post Update',
          description: 'Share an update in one of your tribes.',
          done: false,
          accent: 'coral' as const,
        },
      ]
    : data.nextActions;

  const handleEnableHost = async () => {
    try {
      await enableHost.mutateAsync();
      setUIMode('HOST');
    } catch {
      // handled by mutation toast
    }
  };

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SoftGradient
          colors={headerGradient}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          intensity={0.56}
        >
          <Text style={styles.title}>
            {isHostMode ? 'Host Dashboard' : 'Dashboard'}
          </Text>
          <Text style={styles.subtitle}>
            {isHostMode
              ? 'Create tribes, post updates, and manage your community'
              : data.welcome.subtitle}
          </Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              onPress={() => handleModePress('USER')}
              style={[styles.modePill, !isHostMode && styles.modePillActive]}
            >
              <Text
                style={[styles.modeText, !isHostMode && styles.modeTextActive]}
              >
                USER
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleModePress('HOST')}
              style={[
                styles.modePill,
                isHostMode && styles.modePillActive,
                !canUseHostMode && styles.modePillDisabled,
              ]}
            >
              <View style={styles.modeTextRow}>
                <Text
                  style={[
                    styles.modeText,
                    isHostMode && styles.modeTextActive,
                    !canUseHostMode && styles.modeTextDisabled,
                  ]}
                >
                  HOST
                </Text>
                {!canUseHostMode ? (
                  <Lock size={12} color="rgba(255,255,255,0.92)" />
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </SoftGradient>

        <View style={styles.cardsSection}>
          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Card</Text>
            <Text style={styles.progressLabel}>
              {data.profileSummary.completionText}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${data.onboarding.completeness}%` },
                ]}
              />
            </View>
            <Button
              title="Complete Profile"
              onPress={() => onOpenProfile?.()}
              variant="outline"
              compact
              style={styles.smallButton}
            />
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>
              {isHostMode ? 'Host Quick Actions' : 'Next Best Actions'}
            </Text>
            {displayedActions.length ? (
              displayedActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleActionClick(action.id)}
                  disabled={!isHostMode && action.done}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      {
                        backgroundColor: accentBackground[action.accent],
                      },
                    ]}
                  >
                    {!isHostMode && action.done ? (
                      <Check size={20} color={TGC_COLORS.mint} />
                    ) : (
                      ACTION_ICONS[action.id] || (
                        <ArrowRight
                          size={20}
                          color={TGC_COLORS.textSecondary}
                        />
                      )
                    )}
                  </View>
                  <View style={styles.actionBody}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDesc}>{action.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                You're all caught up for now.
              </Text>
            )}
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <View style={styles.karmaHeader}>
              <Crown size={20} color={TGC_COLORS.mint} />
              <Text style={[styles.cardTitle, { marginBottom: 0 }]}>
                Karma Level: {data.karma.level}
              </Text>
            </View>
            <View style={styles.progressTrackMint}>
              <View
                style={[
                  styles.progressFillMint,
                  { width: `${data.karma.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {data.karma.pointsToNext} points until next level
            </Text>
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <View style={styles.tribesHeaderRow}>
              <Text style={styles.cardTitle}>My Tribes</Text>
            </View>
            {data.tribes.length > 0 ? (
              data.tribes.map(tribe => (
                <TouchableOpacity
                  key={tribe.id}
                  onPress={() =>
                    navigation.navigate('TribeDetail', { slug: tribe.slug })
                  }
                  style={styles.tribeRow}
                  activeOpacity={0.6}
                >
                  <TribeCoverAvatar
                    name={tribe.name}
                    coverImageUrl={tribe.coverImageUrl}
                    size={48}
                    borderRadius={24}
                    containerStyle={styles.tribeAvatar}
                    initialsTextStyle={styles.tribeInitials}
                  />
                  <View style={styles.tribeBody}>
                    <Text style={styles.tribeName}>{tribe.name}</Text>
                    <Text style={styles.tribeMembers}>
                      {tribe.members} members
                    </Text>
                  </View>
                  <Text style={styles.tribeArrow}>↗</Text>
                </TouchableOpacity>
              ))
            ) : (
              <>
                <Text style={styles.emptyText}>
                  You haven&apos;t joined any tribes yet.
                </Text>
                <Button
                  title="Explore Tribes"
                  onPress={() => navigation.navigate('ExploreTribes')}
                  compact
                  variant="outline"
                  style={styles.smallButton}
                />
              </>
            )}
          </SurfaceCard>

          {/* ── Upcoming Events Preview ── */}
          {(data.upcomingEventsPreview ?? []).length > 0 && (
            <SurfaceCard style={styles.card}>
              <View style={styles.tribesHeaderRow}>
                <Text style={styles.cardTitle}>Upcoming Events</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ExploreEvents')}>
                  <Text style={styles.seeAllLink}>See all</Text>
                </TouchableOpacity>
              </View>
              {(data.upcomingEventsPreview as Event[]).map(ev => (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventPreviewRow}
                  onPress={() => navigation.navigate('EventDetail', {slug: ev.slug})}
                  activeOpacity={0.7}>
                  <View style={[styles.eventPreviewIcon, ev.isRegistered && styles.eventPreviewIconRegistered]}>
                    <Calendar size={18} color={ev.isRegistered ? TGC_COLORS.mint : TGC_COLORS.textSecondary} />
                  </View>
                  <View style={styles.eventPreviewBody}>
                    <Text style={styles.eventPreviewTitle} numberOfLines={1}>{ev.title}</Text>
                    <View style={styles.eventPreviewMeta}>
                      <MapPin size={11} color={TGC_COLORS.textSecondary} />
                      <Text style={styles.eventPreviewMetaText}>{ev.city}</Text>
                    </View>
                  </View>
                  {ev.isRegistered && (
                    <View style={styles.eventRegisteredBadge}>
                      <Text style={styles.eventRegisteredBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.exploreEventsBtn}
                onPress={() => navigation.navigate('ExploreEvents')}
                activeOpacity={0.8}>
                <Text style={styles.exploreEventsBtnText}>Explore All Events</Text>
              </TouchableOpacity>
            </SurfaceCard>
          )}

          {(data.upcomingEventsPreview ?? []).length === 0 && (
            <SurfaceCard style={styles.card}>
              <View style={styles.tribesHeaderRow}>
                <Text style={styles.cardTitle}>Events</Text>
              </View>
              <Text style={styles.emptyText}>No upcoming events near you.</Text>
              <TouchableOpacity
                style={styles.exploreEventsBtn}
                onPress={() => navigation.navigate('ExploreEvents')}
                activeOpacity={0.8}>
                <Text style={styles.exploreEventsBtnText}>Explore Events</Text>
              </TouchableOpacity>
            </SurfaceCard>
          )}

          {isHostMode ? (
            <SurfaceCard style={styles.card}>
              <Text style={styles.cardTitle}>Host Snapshot</Text>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, styles.statItemMint]}>
                  <Calendar size={18} color={TGC_COLORS.mint} />
                  <Text style={[styles.statValue, {color: TGC_COLORS.mint}]}>
                    {(data.hostStats as any)?.totalEventsCreated ?? data.hostStats?.activeGigs ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>{'Events\nCreated'}</Text>
                </View>
                <View style={[styles.statItem, styles.statItemCoral]}>
                  <Users size={18} color={TGC_COLORS.coral} />
                  <Text style={[styles.statValue, {color: TGC_COLORS.coral}]}>
                    {data.hostStats?.totalRsvps ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>{'Total\nRegist.'}</Text>
                </View>
                <View style={[styles.statItem, styles.statItemLavender]}>
                  <Crown size={18} color={TGC_COLORS.lavender} />
                  <Text style={[styles.statValue, {color: TGC_COLORS.lavender}]}>
                    {data.tribes?.length ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>{'My\nTribes'}</Text>
                </View>
              </View>
            </SurfaceCard>
          ) : (
            <SoftGradient
              colors={TGC_GRADIENTS.lavender}
              style={styles.hostCard}
            >
              <Text style={styles.hostTitle}>{data.hostModeCard.title}</Text>
              <Text style={styles.hostSubtitle}>
                {data.hostModeCard.subtitle}
              </Text>
              <Button
                title={canUseHostMode ? 'Switch to Host Mode' : 'Become a Host'}
                onPress={() => {
                  if (canUseHostMode) {
                    setUIMode('HOST');
                  } else {
                    handleEnableHost();
                  }
                }}
                loading={enableHost.isPending}
                variant="outline"
                compact
                style={styles.hostBtn}
              />
              <Text style={styles.hostTinyNote}>Role: {userRole}</Text>
            </SoftGradient>
          )}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
    marginBottom:22
  },
  content: {
    paddingTop: 0,
    paddingBottom: 120,
    gap: 14,
  },
  cardsSection: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    gap: 14,
    marginTop: 16,
  },
  header: {
    borderRadius: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: 'rgba(45, 42, 38, 0.16)',
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: 8,
    color: '#fff',
    fontSize: 15,
    opacity: 0.96,
    fontWeight: '600',
  },
  modeSwitch: {
    marginTop: 14,
    width: 180,
    borderRadius: 999,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.24)',
    flexDirection: 'row',
    gap: 6,
  },
  modePill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillActive: {
    backgroundColor: '#fff',
  },
  modePillDisabled: {
    opacity: 0.88,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
  },
  modeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeTextDisabled: {
    color: 'rgba(255,255,255,0.92)',
  },
  modeTextActive: {
    color: TGC_COLORS.textPrimary,
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  progressLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: TGC_COLORS.coral,
  },
  karmaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressTrackMint: {
    height: 10,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillMint: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: TGC_COLORS.mint,
  },
  progressHint: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
  },
  smallButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    backgroundColor: TGC_COLORS.bgSecondary,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 20,
    color: TGC_COLORS.textPrimary,
    fontWeight: '700',
  },
  actionBody: {
    marginLeft: 10,
    flex: 1,
  },
  actionTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  actionDesc: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  hostCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 4,
    ...TGC_SHADOWS.card,
  },
  hostTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '900',
  },
  hostSubtitle: {
    marginTop: 8,
    color: TGC_COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 280,
    marginBottom: 14,
  },
  hostBtn: {
    backgroundColor: '#FFFFFF',
  },
  hostTinyNote: {
    marginTop: 10,
    color: TGC_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 90,
    justifyContent: 'center',
    gap: 4,
  },
  statItemMint: {
    borderColor: 'rgba(125,211,192,0.45)',
    backgroundColor: 'rgba(125,211,192,0.07)',
  },
  statItemCoral: {
    borderColor: 'rgba(255,139,123,0.45)',
    backgroundColor: 'rgba(255,139,123,0.07)',
  },
  statItemLavender: {
    borderColor: 'rgba(200,182,255,0.45)',
    backgroundColor: 'rgba(200,182,255,0.07)',
  },
  statValue: {
    color: TGC_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 2,
    color: TGC_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    marginHorizontal: TGC_SPACING.pageHorizontal,
    marginTop: 80,
    backgroundColor: TGC_COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: 22,
    ...TGC_SHADOWS.card,
  },
  emptyTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  tribesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tribeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: TGC_COLORS.border,
  },
  tribeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TGC_COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tribeInitials: {
    fontSize: 18,
  },
  tribeBody: {
    flex: 1,
  },
  tribeName: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tribeMembers: {
    color: TGC_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  tribeArrow: {
    color: TGC_COLORS.lavender,
    fontSize: 16,
    marginLeft: 8,
  },
  seeAllLink: {
    color: TGC_COLORS.mint,
    fontSize: 13,
    fontWeight: '700',
  },
  eventPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: TGC_COLORS.border,
    gap: 12,
  },
  eventPreviewIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventPreviewIconRegistered: {
    backgroundColor: 'rgba(125,211,192,0.14)',
    borderColor: 'rgba(125,211,192,0.4)',
  },
  eventPreviewBody: {
    flex: 1,
    gap: 3,
  },
  eventPreviewTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  eventPreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventPreviewMetaText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  eventRegisteredBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: TGC_COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRegisteredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  exploreEventsBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(125,211,192,0.12)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,192,0.35)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  exploreEventsBtnText: {
    color: TGC_COLORS.mint,
    fontSize: 14,
    fontWeight: '800',
  },
});
