import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useQueryClient} from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LogOut, Award, Users, Briefcase, Link2, Lock } from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { logoutAndClear } from '../../../store/slices/authSlice';
import { logoutApi } from '../../auth/api/auth.api';
import { getRefreshToken } from '../../../services/http/tokenStore';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import {useMe} from '../hooks/useMe';
import {useEnableHost} from '../../host/hooks/useEnableHost';
import {useMyTribes} from '../../tribes/hooks/useMyTribes';
import {useUIMode} from '../../ui-mode/UIModeProvider';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import SoftGradient from '../../../components/ui/SoftGradient';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type { AppStackParamList } from '../../../app/navigation/AppStack';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { profile: authProfile, user: authUser } = useAppSelector(state => state.auth);
  const dashboardQuery = useDashboard();
  const meQuery = useMe();
  const myTribesQuery = useMyTribes();
  const {uiMode, canUseHostMode, setUIMode} = useUIMode();
  const enableHost = useEnableHost();

  if (dashboardQuery.isLoading || meQuery.isLoading || myTribesQuery.isLoading) {
    return <Loader color={TGC_COLORS.coral} />;
  }

  const data = dashboardQuery.data;
  const profile = meQuery.data?.profile ?? authProfile;
  const user = meQuery.data?.user ?? authUser;

  if (!profile || !user || !data || dashboardQuery.isError || meQuery.isError) {
    return (
      <AppBackground style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Profile data is unavailable</Text>
          <Text style={styles.emptyText}>
            Please reload this screen and try again.
          </Text>
          <Button
            title="Retry"
            onPress={() => {
              dashboardQuery.refetch();
              meQuery.refetch();
              myTribesQuery.refetch();
            }}
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
    : TGC_GRADIENTS.profileHeader;

  const displayName =
    profile.fullName ||
    profile.username ||
    user?.email?.split('@')[0] ||
    'TGC Member';
  const username = profile.username ? `@${profile.username}` : '@newmember';

  const completeness = data.onboarding.completeness;
  const canCreateTribes = user?.role === 'HOST' || user?.role === 'ADMIN';
  const shouldShowEnableHost = user?.role === 'USER';
  const myTribes = myTribesQuery.data?.tribes ?? [];

  const setMode = (mode: 'USER' | 'HOST') => {
    if (mode === 'HOST' && !canUseHostMode) {
      Toast.show({
        type: 'info',
        text1: 'Host mode is locked',
        text2: 'Tap "Become a Host" to unlock HOST mode.',
        position: 'top',
      });
      return;
    }
    setUIMode(mode);
  };

  const handleEnableHost = async () => {
    try {
      await enableHost.mutateAsync();
      setUIMode('HOST');
    } catch {
      // handled by mutation toast
    }
  };

  const handleSignOut = async () => {
    try {
      const rt = await getRefreshToken();
      if (rt) {
        await logoutApi(rt).catch(() => {});
      }
    } finally {
      queryClient.clear();
      await logoutAndClear(dispatch);
    }
  };

  return (
    <AppBackground style={styles.container}>
        <SoftGradient
          colors={headerGradient}
          style={[styles.header, {paddingTop: insets.top + 8}]}
          intensity={0.56}
        >
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={14} color="#fff" />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image
                source={{uri: profile.avatarUrl}}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarFallback}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.username}>{username}</Text>

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
                {!canUseHostMode ? <Lock size={12} color="#fff" /> : null}
              </View>
            </TouchableOpacity>
          </View>
        </SoftGradient>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsSection}>
          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Profile Completeness</Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${completeness}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              Profile {completeness}% complete
            </Text>
          </SurfaceCard>

          <SurfaceCard style={[styles.card, styles.statsCard]}>
            <View style={styles.statCol}>
              <Award
                size={18}
                color={TGC_COLORS.mint}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statNum}>{data.stats.eventsAttended}</Text>
              <Text style={styles.statLabel}>Events Attended</Text>
            </View>
            <View style={styles.statCol}>
              <Briefcase
                size={18}
                color={TGC_COLORS.coral}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statNum}>{data.stats.gigsDone}</Text>
              <Text style={styles.statLabel}>Gigs Done</Text>
            </View>
            <View style={styles.statCol}>
              <Link2
                size={18}
                color={TGC_COLORS.lavender}
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.statNum}>{data.stats.connections}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Skills</Text>
            <View style={styles.chipsWrap}>
              {profile.skills.length ? (
                profile.skills.map(skill => (
                  <View key={skill} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.inlineEmptyBlock}>
                  <Text style={styles.emptyText}>No skills added yet.</Text>
                  <Button
                    title="Add Skill"
                    onPress={() => {}}
                    variant="outline"
                    compact
                    style={styles.smallInlineBtn}
                  />
                </View>
              )}
            </View>

            <Text style={[styles.cardTitle, styles.equipmentTitle]}>
              Equipment
            </Text>
            <Text style={styles.emptyText}>
              Equipment details are not set up yet. Add skills first and we&apos;ll
              expand this section next.
            </Text>
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Host Access</Text>
            {shouldShowEnableHost ? (
              <>
                <Text style={styles.hostText}>
                  Become a Host to create tribes and build your own community.
                </Text>
                <Button
                  title="Become a Host"
                  onPress={handleEnableHost}
                  loading={enableHost.isPending}
                  style={styles.hostPrimaryBtn}
                />
              </>
            ) : (
              <>
                <Text style={styles.hostText}>
                  Host access is enabled. You can create and manage your own tribes.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CreateTribe')}
                  style={styles.createTribeBtn}
                  activeOpacity={0.75}
                >
                  <Text style={styles.createTribeBtnText}>Create Tribe</Text>
                </TouchableOpacity>
              </>
            )}
          </SurfaceCard>

          {isHostMode && canCreateTribes ? (
            <SurfaceCard style={styles.card}>
              <Text style={styles.cardTitle}>Host Workspace</Text>
              <Text style={styles.hostText}>
                Quick actions for managing your communities and updates.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateTribe')}
                style={styles.createTribeBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.createTribeBtnText}>Create Tribe</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('ExploreTribes')}
                style={styles.secondaryActionBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.secondaryActionBtnText}>Manage My Tribes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (myTribes[0]) {
                    navigation.navigate('TribeDetail', {slug: myTribes[0].slug});
                  }
                }}
                style={styles.secondaryActionBtn}
                activeOpacity={0.75}
                disabled={!myTribes.length}
              >
                <Text style={styles.secondaryActionBtnText}>
                  {myTribes.length ? 'Post Update' : 'Post Update (Join/Create a tribe first)'}
                </Text>
              </TouchableOpacity>
            </SurfaceCard>
          ) : null}

          <SurfaceCard style={styles.card}>
            <View style={styles.tribeHeaderRow}>
              <Text style={styles.cardTitle}>My Tribes</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ExploreTribes')}
              >
                <Text style={styles.explore}>Explore</Text>
              </TouchableOpacity>
            </View>

            {myTribes.length ? (
              myTribes.map(tribe => (
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
                      {tribe.memberCount} members
                    </Text>
                  </View>
                  <Text style={styles.tribeArrow}>↗</Text>
                </TouchableOpacity>
              ))
            ) : (
              <>
                <Text style={styles.emptyText}>
                  No tribes yet. Explore and join your first one.
                </Text>
                {canCreateTribes ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('CreateTribe')}
                    style={styles.inlineCreateBtn}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.inlineCreateBtnText}>
                      Or create your own tribe
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </SurfaceCard>
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
  scrollArea: {
    flex: 1,
    marginBottom:22,
  },
  scrollContent: {
    paddingBottom: 120,
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
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  signOutBtn: {
    alignSelf: 'flex-end',
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signOutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.24)',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  name: {
    marginTop: 8,
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(45, 42, 38, 0.16)',
    textShadowRadius: 6,
  },
  username: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
  },
  modeSwitch: {
    marginTop: 12,
    width: 180,
    borderRadius: 999,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.24)',
    flexDirection: 'row',
    gap: 6,
  },
  modePill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: '#fff',
  },
  modePillDisabled: {
    opacity: 0.88,
  },
  modeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '800',
  },
  modeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeTextDisabled: {
    color: 'rgba(255,255,255,0.9)',
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
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: TGC_COLORS.coral,
  },
  progressText: {
    marginTop: 8,
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    paddingVertical: 12,
  },
  statNum: {
    color: TGC_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 3,
    color: TGC_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineEmptyBlock: {
    width: '100%',
  },
  smallInlineBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  skillChip: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TGC_COLORS.mint,
    backgroundColor: 'rgba(125,211,192,0.16)',
    justifyContent: 'center',
  },
  skillChipText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  equipmentTitle: {
    marginTop: 18,
  },
  equipmentChip: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TGC_COLORS.coralLight,
    backgroundColor: 'rgba(255,179,167,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  equipmentText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#11B819',
  },
  tribeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explore: {
    color: TGC_COLORS.coral,
    fontSize: 14,
    fontWeight: '700',
  },
  hostText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  hostPrimaryBtn: {
    marginTop: 12,
  },
  createTribeBtn: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(125,211,192,0.18)',
    borderWidth: 2,
    borderColor: TGC_COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTribeBtnText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryActionBtnText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tribeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
  },
  tribeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(200,182,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tribeEmoji: {
    fontSize: 24,
  },
  tribeBody: {
    flex: 1,
    marginLeft: 10,
  },
  tribeName: {
    color: TGC_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  tribeMembers: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  tribeArrow: {
    color: TGC_COLORS.mint,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyCard: {
    marginHorizontal: TGC_SPACING.pageHorizontal,
    marginTop: 80,
    backgroundColor: TGC_COLORS.white,
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
  inlineCreateBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(200,182,255,0.16)',
    borderWidth: 1,
    borderColor: TGC_COLORS.lavender,
    justifyContent: 'center',
  },
  inlineCreateBtnText: {
    color: TGC_COLORS.lavender,
    fontSize: 13,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
});
