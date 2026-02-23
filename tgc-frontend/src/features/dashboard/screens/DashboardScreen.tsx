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
} from 'lucide-react-native';
import SoftGradient from '../../../components/ui/SoftGradient';
import { useDashboard } from '../hooks/useDashboard';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import { useUpdateProfile } from '../../profile/hooks/useUpdateProfile';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type { ProfileMode } from '../../../types/auth';
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
};

export default function DashboardScreen({
  onOpenProfile,
}: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, isLoading, isError, refetch } = useDashboard();
  const updateProfile = useUpdateProfile();

  if (isLoading) {
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

  const isHostMode = data.profile.activeMode === 'HOST';
  const headerGradient = isHostMode
    ? TGC_GRADIENTS.hostHeader
    : TGC_GRADIENTS.dashboardHeader;

  const setMode = (mode: ProfileMode) => {
    if (mode === data.profile.activeMode || updateProfile.isPending) return;
    updateProfile.mutate({ activeMode: mode });
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === 'join_tribe') {
      navigation.navigate('ExploreTribes');
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
          <Text style={styles.subtitle}>{data.welcome.subtitle}</Text>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              onPress={() => setMode('USER')}
              style={[styles.modePill, !isHostMode && styles.modePillActive]}
            >
              <Text
                style={[styles.modeText, !isHostMode && styles.modeTextActive]}
              >
                USER
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('HOST')}
              style={[styles.modePill, isHostMode && styles.modePillActive]}
            >
              <Text
                style={[styles.modeText, isHostMode && styles.modeTextActive]}
              >
                HOST
              </Text>
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
            <Text style={styles.cardTitle}>Next Best Actions</Text>
            {data.nextActions.length ? (
              data.nextActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={() => handleActionClick(action.id)}
                  disabled={action.done}
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
                    {action.done ? (
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

          {data.tribes.length > 0 && (
            <SurfaceCard style={styles.card}>
              <View style={styles.tribesHeaderRow}>
                <Text style={styles.cardTitle}>My Tribes</Text>
              </View>
              {data.tribes.map(tribe => (
                <TouchableOpacity
                  key={tribe.id}
                  onPress={() =>
                    navigation.navigate('TribeDetail', { slug: tribe.slug })
                  }
                  style={styles.tribeRow}
                  activeOpacity={0.6}
                >
                  <View style={styles.tribeAvatar}>
                    <Text style={styles.tribeEmoji}>{tribe.emoji}</Text>
                  </View>
                  <View style={styles.tribeBody}>
                    <Text style={styles.tribeName}>{tribe.name}</Text>
                    <Text style={styles.tribeMembers}>
                      {tribe.members} members
                    </Text>
                  </View>
                  <Text style={styles.tribeArrow}>↗</Text>
                </TouchableOpacity>
              ))}
            </SurfaceCard>
          )}

          {isHostMode ? (
            <SurfaceCard style={styles.card}>
              <Text style={styles.cardTitle}>Host Snapshot</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {data.hostStats.totalRsvps}
                  </Text>
                  <Text style={styles.statLabel}>Total RSVPs</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {data.hostStats.activeGigs}
                  </Text>
                  <Text style={styles.statLabel}>Active Gigs</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {data.hostStats.pendingApprovals}
                  </Text>
                  <Text style={styles.statLabel}>Approvals</Text>
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
                title={data.hostModeCard.cta}
                onPress={() => {}}
                variant="outline"
                compact
                style={styles.hostBtn}
              />
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
  modeText: {
    fontSize: 12,
    fontWeight: '800',
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 84,
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TGC_COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tribeEmoji: {
    fontSize: 20,
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
});
