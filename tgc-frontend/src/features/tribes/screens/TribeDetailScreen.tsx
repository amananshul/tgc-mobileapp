import React, {useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Users, Tag, Shield} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import Loader from '../../../components/ui/Loader';
import {useTribeDetail} from '../hooks/useTribeDetail';
import {useJoinTribe} from '../hooks/useJoinTribe';
import {useLeaveTribe} from '../hooks/useLeaveTribe';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';

type DetailRoute = RouteProp<AppStackParamList, 'TribeDetail'>;

export default function TribeDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<DetailRoute>();
  const {slug} = route.params;

  const {data, isLoading, isError, refetch} = useTribeDetail(slug);
  const joinTribe = useJoinTribe();
  const leaveTribe = useLeaveTribe();

  const tribe = data?.tribe;

  const handleJoin = useCallback(() => {
    if (tribe) {
      joinTribe.mutate(tribe.id);
    }
  }, [tribe, joinTribe]);

  const handleLeave = useCallback(() => {
    if (!tribe) return;
    Alert.alert(
      'Leave Tribe',
      `Are you sure you want to leave ${tribe.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveTribe.mutate(tribe.id),
        },
      ],
    );
  }, [tribe, leaveTribe]);

  if (isLoading) {
    return <Loader color={TGC_COLORS.lavender} />;
  }

  if (isError || !tribe) {
    return (
      <AppBackground style={styles.container}>
        <SoftGradient
          colors={TGC_GRADIENTS.lavender}
          style={[styles.header, {paddingTop: insets.top + 12}]}
          intensity={0.56}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}>
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tribe</Text>
            <View style={styles.backBtn} />
          </View>
        </SoftGradient>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Tribe not found</Text>
          <Text style={styles.errorText}>
            This tribe may have been removed or the link is invalid.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  const isMutating = joinTribe.isPending || leaveTribe.isPending;

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SoftGradient
          colors={TGC_GRADIENTS.lavender}
          style={[styles.header, {paddingTop: insets.top + 12}]}
          intensity={0.56}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}>
              <ArrowLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tribe</Text>
            <View style={styles.backBtn} />
          </View>

          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{tribe.emoji}</Text>
          </View>

          <Text style={styles.tribeName}>{tribe.name}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.categoryBadge}>
              <Tag size={12} color={TGC_COLORS.textPrimary} />
              <Text style={styles.categoryText}>{tribe.category}</Text>
            </View>
            {tribe.visibility === 'PRIVATE' && (
              <View style={styles.privateBadge}>
                <Shield size={12} color="#fff" />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>

          <View style={styles.membersBadge}>
            <Users size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.membersText}>
              {tribe.memberCount} {tribe.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </SoftGradient>

        <View style={styles.body}>
          {tribe.description ? (
            <SurfaceCard style={styles.descCard}>
              <Text style={styles.descTitle}>About</Text>
              <Text style={styles.descText}>{tribe.description}</Text>
            </SurfaceCard>
          ) : null}

          {tribe.isJoined && tribe.memberRole ? (
            <SurfaceCard style={styles.roleCard}>
              <Text style={styles.roleLabel}>Your Role</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{tribe.memberRole}</Text>
              </View>
            </SurfaceCard>
          ) : null}

          <View style={styles.actionWrap}>
            {tribe.isJoined ? (
              tribe.memberRole === 'OWNER' ? (
                <View style={styles.ownerNote}>
                  <Text style={styles.ownerNoteText}>
                    You're the owner of this tribe
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.leaveBtn}
                  onPress={handleLeave}
                  disabled={isMutating}
                  activeOpacity={0.7}>
                  {leaveTribe.isPending ? (
                    <ActivityIndicator size="small" color={TGC_COLORS.coral} />
                  ) : (
                    <Text style={styles.leaveBtnText}>Leave Tribe</Text>
                  )}
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={handleJoin}
                disabled={isMutating}
                activeOpacity={0.7}>
                {joinTribe.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.joinBtnText}>Join Tribe</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
    shadowColor: TGC_COLORS.lavender,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(45,42,38,0.14)',
    textShadowRadius: 6,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  emoji: {
    fontSize: 38,
  },
  tribeName: {
    marginTop: 14,
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(45,42,38,0.16)',
    textShadowRadius: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    minHeight: 28,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: TGC_COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    minHeight: 28,
    borderRadius: 999,
  },
  privateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  membersText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    marginTop: 18,
    gap: 14,
  },
  descCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  descTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TGC_COLORS.textPrimary,
    marginBottom: 8,
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
    color: TGC_COLORS.textSecondary,
  },
  roleCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TGC_COLORS.textSecondary,
  },
  roleBadge: {
    backgroundColor: 'rgba(200,182,255,0.2)',
    paddingHorizontal: 14,
    minHeight: 30,
    borderRadius: 999,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: TGC_COLORS.lavender,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: TGC_COLORS.lavender,
  },
  actionWrap: {
    marginTop: 6,
  },
  joinBtn: {
    minHeight: 52,
    borderRadius: TGC_RADIUS.button,
    backgroundColor: TGC_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
    ...TGC_SHADOWS.cta,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  leaveBtn: {
    minHeight: 52,
    borderRadius: TGC_RADIUS.button,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 2,
    borderColor: TGC_COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveBtnText: {
    color: TGC_COLORS.coral,
    fontSize: 16,
    fontWeight: '800',
  },
  ownerNote: {
    minHeight: 52,
    borderRadius: TGC_RADIUS.button,
    backgroundColor: 'rgba(200,182,255,0.15)',
    borderWidth: 2,
    borderColor: TGC_COLORS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerNoteText: {
    color: TGC_COLORS.lavender,
    fontSize: 14,
    fontWeight: '800',
  },
  errorWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: TGC_COLORS.textPrimary,
  },
  errorText: {
    fontSize: 14,
    color: TGC_COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    minHeight: 42,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
