import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, Search, Users, Check} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import {useTribes} from '../hooks/useTribes';
import {useJoinTribe} from '../hooks/useJoinTribe';
import TribeCoverAvatar from '../components/TribeCoverAvatar';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {Tribe} from '../../../types/auth';
import type {AppStackParamList} from '../../../app/navigation/AppStack';

const CATEGORIES = [
  {id: 'all', label: 'All'},
  {id: 'tech', label: 'Tech'},
  {id: 'music', label: 'Music'},
  {id: 'business', label: 'Business'},
  {id: 'fitness', label: 'Fitness'},
  {id: 'art', label: 'Art'},
  {id: 'food', label: 'Food'},
];

export default function ExploreTribesScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const joinTribe = useJoinTribe();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch ? {search: debouncedSearch} : {}),
    ...(category !== 'all' ? {category} : {}),
  };

  const {data, isLoading, refetch} = useTribes(queryParams);

  const handleJoin = useCallback(
    (tribeId: string) => {
      joinTribe.mutate(tribeId);
    },
    [joinTribe],
  );

  const renderTribeCard = ({item}: {item: Tribe}) => (
    <TouchableOpacity
      style={styles.tribeCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TribeDetail', {slug: item.slug})}>
      <View style={styles.tribeCardTop}>
        <TribeCoverAvatar
          name={item.name}
          coverImageUrl={item.coverImageUrl}
          size={48}
          borderRadius={24}
          containerStyle={styles.avatarWrap}
          initialsTextStyle={styles.avatarInitials}
        />
        <View style={styles.tribeInfo}>
          <Text style={styles.tribeName}>{item.name}</Text>
          <View style={styles.membersRow}>
            <Users size={13} color={TGC_COLORS.textTertiary} />
            <Text style={styles.membersText}>
              {item.memberCount} members
            </Text>
          </View>
        </View>
        {item.isJoined ? (
          <View style={styles.joinedBadge}>
            <Check size={14} color="#fff" strokeWidth={2.5} />
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => handleJoin(item.id)}
            disabled={joinTribe.isPending}>
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.description ? (
        <Text style={styles.tribeDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Explore Tribes</Text>
          <View style={styles.backBtn} />
        </View>
      </SoftGradient>

      <View style={styles.searchWrap}>
        <Search size={18} color={TGC_COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tribes..."
          placeholderTextColor={TGC_COLORS.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      <View style={styles.categoriesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setCategory(cat.id)}>
                <Text
                  style={[
                    styles.categoryText,
                    active && styles.categoryTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={TGC_COLORS.lavender} />
        </View>
      ) : (
        <FlatList
          data={data?.tribes ?? []}
          keyExtractor={item => item.id}
          renderItem={renderTribeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No tribes found</Text>
              <Text style={styles.emptyText}>
                Try a different search or category.
              </Text>
            </View>
          }
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: TGC_COLORS.lavender,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  headerRow: {
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
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(45, 42, 38, 0.14)',
    textShadowRadius: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: TGC_SPACING.pageHorizontal,
    marginTop: 16,
    backgroundColor: TGC_COLORS.card,
    borderRadius: TGC_RADIUS.input,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
    ...TGC_SHADOWS.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TGC_COLORS.textPrimary,
    paddingVertical: 0,
  },
  categoriesWrap: {
    marginTop: 14,
  },
  categoriesContent: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipActive: {
    borderColor: TGC_COLORS.lavender,
    backgroundColor: 'rgba(200,182,255,0.18)',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: TGC_COLORS.textSecondary,
  },
  categoryTextActive: {
    color: TGC_COLORS.lavender,
  },
  listContent: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  tribeCard: {
    backgroundColor: TGC_COLORS.card,
    borderRadius: TGC_RADIUS.card,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: 16,
    ...TGC_SHADOWS.card,
  },
  tribeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(200,182,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
  },
  tribeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tribeName: {
    fontSize: 16,
    fontWeight: '800',
    color: TGC_COLORS.textPrimary,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  membersText: {
    fontSize: 12,
    color: TGC_COLORS.textTertiary,
    fontWeight: '600',
  },
  joinBtn: {
    minHeight: 34,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.coral,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: TGC_COLORS.coral,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.mint,
  },
  joinedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  tribeDesc: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: TGC_COLORS.textSecondary,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TGC_COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: TGC_COLORS.textSecondary,
    marginTop: 6,
  },
});
