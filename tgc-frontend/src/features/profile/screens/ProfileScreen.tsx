import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LogOut, Award, Users, Briefcase, Link2 } from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { logoutAndClear } from '../../../store/slices/authSlice';
import { logoutApi } from '../../auth/api/auth.api';
import { getRefreshToken } from '../../../services/http/tokenStore';
import { useDashboard } from '../../dashboard/hooks/useDashboard';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import SoftGradient from '../../../components/ui/SoftGradient';
import AppBackground from '../../../components/ui/AppBackground';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import { EQUIPMENT_LIST } from '../constants';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type { ProfileMode } from '../../../types/auth';
import type { AppStackParamList } from '../../../app/navigation/AppStack';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();
  const { profile, user } = useAppSelector(state => state.auth);
  const { data, isLoading, isError, refetch } = useDashboard();
  const updateProfile = useUpdateProfile();

  if (isLoading) {
    return <Loader color={TGC_COLORS.coral} />;
  }

  if (!profile || !data || isError) {
    return (
      <AppBackground style={styles.container}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Profile data is unavailable</Text>
          <Text style={styles.emptyText}>
            Please reload this screen and try again.
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

  const isHostMode = profile.activeMode === 'HOST';
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

  const setMode = (mode: ProfileMode) => {
    if (mode === profile.activeMode || updateProfile.isPending) return;
    updateProfile.mutate({ activeMode: mode });
  };

  const handleSignOut = async () => {
    try {
      const rt = await getRefreshToken();
      if (rt) {
        await logoutApi(rt).catch(() => {});
      }
    } finally {
      await logoutAndClear(dispatch);
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
          style={[styles.header, { paddingTop: insets.top + 12 }]}
          intensity={0.56}
        >
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <LogOut size={14} color="#fff" />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarFallback}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>{username}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              Level {data.profileSummary.level}
            </Text>
          </View>

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
                <Text style={styles.emptyText}>No skills added yet.</Text>
              )}
            </View>

            <Text style={[styles.cardTitle, styles.equipmentTitle]}>
              Equipment
            </Text>
            <View style={styles.chipsWrap}>
              {EQUIPMENT_LIST.map(item => (
                <View key={item} style={styles.equipmentChip}>
                  <Text style={styles.equipmentText}>{item}</Text>
                  <View style={styles.dot} />
                </View>
              ))}
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <View style={styles.tribeHeaderRow}>
              <Text style={styles.cardTitle}>My Tribes</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ExploreTribes')}
              >
                <Text style={styles.explore}>Explore</Text>
              </TouchableOpacity>
            </View>

            {data.tribes.length ? (
              data.tribes.map(tribe => (
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
              ))
            ) : (
              <Text style={styles.emptyText}>
                No tribes yet. Explore and join your first one.
              </Text>
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
    alignItems: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  signOutBtn: {
    alignSelf: 'flex-end',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.24)',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  name: {
    marginTop: 10,
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(45, 42, 38, 0.16)',
    textShadowRadius: 8,
  },
  username: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
  },
  levelBadge: {
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(125,211,192,0.92)',
    paddingHorizontal: 12,
    minHeight: 30,
    justifyContent: 'center',
  },
  levelText: {
    color: TGC_COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 12,
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
  modeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '800',
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
  retryBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
});
