import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Search, Plus, Calendar, MapPin, Users, ArrowLeft} from 'lucide-react-native';
import {useEvents} from '../hooks/useEvents';
import {useRegisterEvent} from '../hooks/useRegisterEvent';
import {useAppSelector} from '../../../store/hooks';
import SoftGradient from '../../../components/ui/SoftGradient';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
  TGC_RADIUS,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';
import type {Event, EventCategory} from '../../../types/auth';

type NavProp = NativeStackNavigationProp<AppStackParamList>;
type DateFilter = 'all' | 'today' | 'weekend' | 'week';

const DATE_FILTERS: {label: string; value: DateFilter}[] = [
  {label: 'All', value: 'all'},
  {label: 'Today', value: 'today'},
  {label: 'Weekend', value: 'weekend'},
  {label: 'This Week', value: 'week'},
];

const CATEGORIES: {label: string; value: EventCategory | 'ALL'}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Tech', value: 'TECH'},
  {label: 'Music', value: 'MUSIC'},
  {label: 'Workshop', value: 'WORKSHOP'},
  {label: 'Fitness', value: 'FITNESS'},
  {label: 'Art', value: 'ART'},
  {label: 'Social', value: 'SOCIAL'},
  {label: 'Open Mic', value: 'OPEN_MIC'},
  {label: 'Volunteer', value: 'VOLUNTEER'},
  {label: 'Other', value: 'OTHER'},
];

const CATEGORY_ICONS: Record<string, string> = {
  WORKSHOP: '🛠️', OPEN_MIC: '🎤', FITNESS: '💪', MUSIC: '🎵',
  ART: '🎨', TECH: '💻', SOCIAL: '🤝', VOLUNTEER: '🌱', OTHER: '✨', ALL: '🌟',
};

function formatEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'}) +
    ' · ' + d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true});
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRegister: () => void;
  isRegistering: boolean;
}

function EventCard({event, onPress, onRegister, isRegistering}: EventCardProps) {
  const isFull = event.capacity != null && event.registrationCount >= event.capacity;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Cover Image or Placeholder */}
      <View style={styles.cardCover}>
        {event.coverImageUrl ? (
          <Image
            source={{uri: event.coverImageUrl}}
            style={styles.coverImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverGradient}>
            <Text style={styles.coverIcon}>{CATEGORY_ICONS[event.category] ?? '✨'}</Text>
          </View>
        )}
        {/* Category badge overlay */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{event.category.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
          {event.tribe && (
            <View style={styles.tribeBadge}>
              <Text style={styles.tribeBadgeText}>{event.tribe.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <MapPin size={13} color={TGC_COLORS.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.venueName ? `${event.venueName}, ` : ''}{event.city}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Calendar size={13} color={TGC_COLORS.textSecondary} />
            <Text style={styles.metaText}>{formatEventDate(event.startAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Users size={13} color={TGC_COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {event.registrationCount}{event.capacity ? ` / ${event.capacity}` : ''} registered
            </Text>
          </View>
        </View>

        {/* CTA */}
        {event.isRegistered ? (
          <View style={styles.registeredBtn}>
            <Text style={styles.registeredBtnText}>✓ Registered</Text>
          </View>
        ) : isFull ? (
          <View style={[styles.ctaBtn, styles.ctaBtnFull]}>
            <Text style={styles.ctaBtnText}>Event Full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={onRegister}
            disabled={isRegistering}
            activeOpacity={0.85}>
            {isRegistering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>Register</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface ExploreEventsScreenProps {
  embedded?: boolean; // true when rendered inside tab shell (no back btn)
}

export default function ExploreEventsScreen({embedded}: ExploreEventsScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const {user} = useAppSelector(s => s.auth);
  const canCreate = user?.role === 'HOST' || user?.role === 'ADMIN';
  const canGoBack = navigation.canGoBack();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'ALL'>('ALL');
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const eventsQuery = useEvents({
    search: debouncedSearch || undefined,
    category: activeCategory === 'ALL' ? undefined : activeCategory,
    dateFilter,
  });

  const registerMutation = useRegisterEvent();

  const handleRegister = useCallback(
    async (event: Event) => {
      setRegisteringId(event.id);
      try {
        await registerMutation.mutateAsync(event.id);
      } finally {
        setRegisteringId(null);
      }
    },
    [registerMutation],
  );

  const events = eventsQuery.data?.events ?? [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Gradient Header ── */}
      <SoftGradient
        colors={TGC_GRADIENTS.dashboardHeader}
        style={[styles.header, {paddingTop: insets.top + 14}]}
        intensity={0.55}>

        {/* Top row */}
        <View style={styles.headerTopRow}>
          {canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerIconBtn}
              activeOpacity={0.8}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconBtn} />
          )}
          <Text style={styles.headerTitle}>Explore Events</Text>
          {canCreate ? (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('CreateEvent')}
              activeOpacity={0.85}>
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconBtn} />
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={TGC_COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, cities, venues..."
            placeholderTextColor={TGC_COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Date filter chips */}
        <View style={styles.dateChipsRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.dateChip,
                dateFilter === f.value && styles.dateChipActive,
              ]}
              onPress={() => setDateFilter(f.value)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.dateChipText,
                  dateFilter === f.value && styles.dateChipTextActive,
                ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SoftGradient>

      {/* ── Category chips ── */}
      <View style={styles.catSection}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.value}
          contentContainerStyle={styles.catChipsRow}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.catChip,
                activeCategory === item.value && styles.catChipActive,
              ]}
              onPress={() => setActiveCategory(item.value)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.catChipText,
                  activeCategory === item.value && styles.catChipTextActive,
                ]}>
                {CATEGORY_ICONS[item.value]} {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Events List ── */}
      {eventsQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TGC_COLORS.mint} />
          <Text style={styles.loadingText}>Finding events...</Text>
        </View>
      ) : eventsQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyTitle}>Couldn't load events</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => eventsQuery.refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🎭</Text>
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different city, category or date filter.
          </Text>
          {canCreate && (
            <TouchableOpacity
              style={styles.createFirstBtn}
              onPress={() => navigation.navigate('CreateEvent')}
              activeOpacity={0.85}>
              <Plus size={16} color="#fff" />
              <Text style={styles.createFirstBtnText}>Create First Event</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', {slug: item.slug})}
              onRegister={() => handleRegister(item)}
              isRegistering={registeringId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={eventsQuery.isFetching && !eventsQuery.isLoading}
              onRefresh={() => eventsQuery.refetch()}
              tintColor={TGC_COLORS.mint}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  header: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: TGC_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dateChipActive: {
    backgroundColor: '#fff',
  },
  dateChipText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '700',
  },
  dateChipTextActive: {
    color: TGC_COLORS.mint,
  },
  catSection: {
    backgroundColor: TGC_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: TGC_COLORS.border,
    paddingVertical: 12,
  },
  catChipsRow: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    backgroundColor: TGC_COLORS.white,
  },
  catChipActive: {
    borderColor: TGC_COLORS.lavender,
    backgroundColor: 'rgba(200,182,255,0.1)',
  },
  catChipText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: TGC_COLORS.textPrimary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },

  // ── Event Card ──
  card: {
    backgroundColor: TGC_COLORS.white,
    borderRadius: TGC_RADIUS.card,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    overflow: 'hidden',
    ...TGC_SHADOWS.card,
  },
  cardCover: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    flex: 1,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverIcon: {
    fontSize: 52,
    opacity: 0.7,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(200,182,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: TGC_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  tribeBadge: {
    backgroundColor: 'rgba(125,211,192,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(125,211,192,0.4)',
    marginTop: 2,
  },
  tribeBadgeText: {
    color: TGC_COLORS.mint,
    fontSize: 10,
    fontWeight: '700',
  },
  metaList: {
    gap: 6,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ctaBtn: {
    height: 42,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },
  ctaBtnFull: {
    backgroundColor: TGC_COLORS.textTertiary,
    shadowOpacity: 0,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  registeredBtn: {
    height: 42,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TGC_COLORS.mint,
    backgroundColor: 'rgba(125,211,192,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registeredBtnText: {
    color: TGC_COLORS.mint,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── States ──
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TGC_SPACING.pageHorizontal,
  },
  loadingText: {
    marginTop: 12,
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TGC_COLORS.mint,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  createFirstBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  retryBtn: {
    backgroundColor: TGC_COLORS.mint,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
