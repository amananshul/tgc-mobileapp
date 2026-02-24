import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Users, Tag, Shield} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useAppSelector} from '../../../store/hooks';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import Loader from '../../../components/ui/Loader';
import {useTribeDetail} from '../hooks/useTribeDetail';
import {useJoinTribe} from '../hooks/useJoinTribe';
import {useLeaveTribe} from '../hooks/useLeaveTribe';
import {useTribePosts} from '../hooks/useTribePosts';
import {useCreateTribePost} from '../hooks/useCreateTribePost';
import CreatePostModal from '../components/CreatePostModal';
import TribeCoverAvatar from '../components/TribeCoverAvatar';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {CreateTribePostPayload, TribePost} from '../../../types/auth';
import type {AppStackParamList} from '../../../app/navigation/AppStack';
import {pickImageFromDevice} from '../../../utils/media/pickImage';
import {uploadAndAttachTribeCover} from '../../../services/mediaUpload.service';

type DetailRoute = RouteProp<AppStackParamList, 'TribeDetail'>;

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString).getTime();
  const diffMs = Date.now() - date;
  const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateString).toLocaleDateString();
}

function getAuthorName(post: TribePost) {
  return post.author.fullName || post.author.username || 'Tribe Member';
}

export default function TribeDetailScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<DetailRoute>();
  const authUser = useAppSelector(state => state.auth.user);
  const {slug} = route.params;
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const {data, isLoading, isError, refetch} = useTribeDetail(slug);
  const joinTribe = useJoinTribe();
  const leaveTribe = useLeaveTribe();

  const tribe = data?.tribe;
  const postsQuery = useTribePosts(tribe?.id, !!tribe?.isJoined);
  const createTribePost = useCreateTribePost(tribe?.id);
  const updateCover = useMutation({
    mutationFn: async () => {
      if (!tribe?.id) {
        throw new Error('Missing tribe id');
      }
      const pickedImage = await pickImageFromDevice();
      if (!pickedImage) {
        return null;
      }
      return uploadAndAttachTribeCover(tribe.id, pickedImage);
    },
    onSuccess: async result => {
      if (!result) return;
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['tribe', slug]}),
        queryClient.invalidateQueries({queryKey: ['tribes']}),
        queryClient.invalidateQueries({queryKey: ['myTribes']}),
        queryClient.invalidateQueries({queryKey: ['dashboard']}),
      ]);
      Toast.show({
        type: 'success',
        text1: 'Cover updated',
        position: 'top',
      });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Could not update cover image.';
      Toast.show({
        type: 'error',
        text1: 'Cover update failed',
        text2: msg,
        position: 'top',
      });
    },
  });

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

  const handleCreatePost = useCallback(
    async (payload: CreateTribePostPayload) => {
      await createTribePost.mutateAsync(payload);
      setIsCreatePostOpen(false);
    },
    [createTribePost],
  );

  const posts = useMemo(() => postsQuery.data?.posts ?? [], [postsQuery.data]);
  const canChangeCover =
    !!tribe &&
    (tribe.memberRole === 'OWNER' ||
      tribe.memberRole === 'MODERATOR' ||
      authUser?.role === 'HOST' ||
      authUser?.role === 'ADMIN');

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
        {tribe.coverImageUrl ? (
          <View style={styles.coverHeader}>
            <Image
              source={{uri: tribe.coverImageUrl}}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.coverOverlay} />
            <View style={[styles.coverContent, {paddingTop: insets.top + 12}]}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}>
                  <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tribe</Text>
                <View style={styles.backBtn} />
              </View>

              <TribeCoverAvatar
                name={tribe.name}
                coverImageUrl={tribe.coverImageUrl}
                size={96}
                borderRadius={48}
                containerStyle={styles.avatarCircle}
                initialsTextStyle={styles.avatarInitials}
              />

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
                  {tribe.memberCount}{' '}
                  {tribe.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>
              {canChangeCover ? (
                <TouchableOpacity
                  style={[
                    styles.changeCoverBtn,
                    updateCover.isPending && styles.changeCoverBtnDisabled,
                  ]}
                  onPress={() => updateCover.mutate()}
                  activeOpacity={0.8}
                  disabled={updateCover.isPending}>
                  <Text style={styles.changeCoverBtnText}>
                    {updateCover.isPending
                      ? 'Uploading Cover...'
                      : 'Change Cover'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : (
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

            <TribeCoverAvatar
              name={tribe.name}
              coverImageUrl={tribe.coverImageUrl}
              size={96}
              borderRadius={48}
              containerStyle={styles.avatarCircle}
              initialsTextStyle={styles.avatarInitials}
            />

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
                {tribe.memberCount}{' '}
                {tribe.memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
            {canChangeCover ? (
              <TouchableOpacity
                style={[
                  styles.changeCoverBtn,
                  updateCover.isPending && styles.changeCoverBtnDisabled,
                ]}
                onPress={() => updateCover.mutate()}
                activeOpacity={0.8}
                disabled={updateCover.isPending}>
                <Text style={styles.changeCoverBtnText}>
                  {updateCover.isPending
                    ? 'Uploading Cover...'
                    : 'Change Cover'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </SoftGradient>
        )}

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

          <SurfaceCard style={styles.feedCard}>
            <View style={styles.feedHeaderRow}>
              <Text style={styles.feedTitle}>Feed</Text>
              {tribe.isJoined ? (
                <View style={styles.feedBadge}>
                  <Text style={styles.feedBadgeText}>Members only</Text>
                </View>
              ) : null}
            </View>

            {!tribe.isJoined ? (
              <Text style={styles.feedStateText}>
                Join this tribe to see updates and post in the feed.
              </Text>
            ) : postsQuery.isLoading ? (
              <View style={styles.feedLoadingWrap}>
                <ActivityIndicator size="small" color={TGC_COLORS.lavender} />
              </View>
            ) : postsQuery.isError ? (
              <View style={styles.feedErrorWrap}>
                <Text style={styles.feedStateText}>
                  Could not load the tribe feed.
                </Text>
                <TouchableOpacity
                  style={styles.feedRetryBtn}
                  onPress={() => postsQuery.refetch()}>
                  <Text style={styles.feedRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : posts.length ? (
              <View style={styles.feedList}>
                {posts.map(post => {
                  const authorName = getAuthorName(post);
                  const username = post.author.username
                    ? `@${post.author.username}`
                    : '@member';
                  return (
                    <View key={post.id} style={styles.postCard}>
                      <View style={styles.postHeader}>
                        {post.author.avatarUrl ? (
                          <Image
                            source={{uri: post.author.avatarUrl}}
                            style={styles.postAvatar}
                          />
                        ) : (
                          <View style={styles.postAvatarFallback}>
                            <Text style={styles.postAvatarFallbackText}>
                              {authorName.slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.postAuthorWrap}>
                          <Text style={styles.postAuthorName}>{authorName}</Text>
                          <Text style={styles.postMeta}>
                            {username} · {formatTimeAgo(post.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.postContent}>{post.content}</Text>

                      {post.imageUrl ? (
                        <Image
                          source={{uri: post.imageUrl}}
                          style={styles.postImage}
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.feedStateText}>
                No posts yet. Share the first update for this tribe.
              </Text>
            )}
          </SurfaceCard>
        </View>
      </ScrollView>

      {tribe.isJoined ? (
        <>
          <TouchableOpacity
            style={[styles.postFab, {bottom: insets.bottom + 22}]}
            onPress={() => setIsCreatePostOpen(true)}
            activeOpacity={0.85}>
            <Text style={styles.postFabPlus}>+</Text>
            <Text style={styles.postFabText}>Post</Text>
          </TouchableOpacity>
          <CreatePostModal
            visible={isCreatePostOpen}
            tribeId={tribe.id}
            onClose={() => setIsCreatePostOpen(false)}
            loading={createTribePost.isPending}
            onSubmit={handleCreatePost}
          />
        </>
      ) : null}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  coverHeader: {
    minHeight: 260,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  coverContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitials: {
    fontSize: 36,
    color: '#fff',
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
  changeCoverBtn: {
    marginTop: 12,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeCoverBtnDisabled: {
    opacity: 0.8,
  },
  changeCoverBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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
  feedCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  feedBadge: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(200,182,255,0.16)',
    borderWidth: 1,
    borderColor: TGC_COLORS.lavender,
    justifyContent: 'center',
  },
  feedBadgeText: {
    color: TGC_COLORS.lavender,
    fontSize: 11,
    fontWeight: '800',
  },
  feedLoadingWrap: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedErrorWrap: {
    gap: 10,
  },
  feedStateText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  feedRetryBtn: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    justifyContent: 'center',
  },
  feedRetryText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  feedList: {
    gap: 12,
  },
  postCard: {
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,139,123,0.18)',
    borderWidth: 1,
    borderColor: TGC_COLORS.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarFallbackText: {
    color: TGC_COLORS.coral,
    fontSize: 12,
    fontWeight: '900',
  },
  postAuthorWrap: {
    marginLeft: 10,
    flex: 1,
  },
  postAuthorName: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  postMeta: {
    color: TGC_COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  postImage: {
    marginTop: 10,
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: TGC_COLORS.border,
  },
  postFab: {
    position: 'absolute',
    right: 20,
    bottom: 22,
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
    backgroundColor: TGC_COLORS.mint,
    borderWidth: 1,
    borderColor: '#63C9B2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  postFabPlus: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: -1,
  },
  postFabText: {
    color: TGC_COLORS.textPrimary,
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
