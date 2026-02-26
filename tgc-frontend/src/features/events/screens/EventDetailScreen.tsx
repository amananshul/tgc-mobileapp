import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  User,
  ExternalLink,
  EllipsisVertical,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {useEventDetail} from '../hooks/useEventDetail';
import {useRegisterEvent} from '../hooks/useRegisterEvent';
import {useDeleteEvent} from '../hooks/useDeleteEvent';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_SHADOWS,
  TGC_SPACING,
  TGC_RADIUS,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';
import {useAppSelector} from '../../../store/hooks';

type NavProp = NativeStackNavigationProp<AppStackParamList>;
type RouteType = RouteProp<AppStackParamList, 'EventDetail'>;

const CATEGORY_ICONS: Record<string, string> = {
  WORKSHOP: '🛠️',
  OPEN_MIC: '🎤',
  FITNESS: '💪',
  MUSIC: '🎵',
  ART: '🎨',
  TECH: '💻',
  SOCIAL: '🤝',
  VOLUNTEER: '🌱',
  OTHER: '✨',
};

const CATEGORY_COLORS: Record<string, string> = {
  WORKSHOP: '#C8B6FF',
  OPEN_MIC: '#FFB3A7',
  FITNESS: '#7DD3C0',
  MUSIC: '#FFB3A7',
  ART: '#C8B6FF',
  TECH: '#7DD3C0',
  SOCIAL: '#A7E6D7',
  VOLUNTEER: '#26C281',
  OTHER: '#E8E5E1',
};

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {slug} = route.params;
  const authUser = useAppSelector(state => state.auth.user);

  const detailQuery = useEventDetail(slug);
  const registerMutation = useRegisterEvent(slug);
  const deleteMutation = useDeleteEvent(slug);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const event = detailQuery.data?.event;

  const handleRegister = async () => {
    if (!event) return;
    setIsRegistering(true);
    try {
      await registerMutation.mutateAsync(event.id);
    } finally {
      setIsRegistering(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <AppBackground style={styles.container}>
        <View style={[styles.loadingHeader, {paddingTop: insets.top + 12}]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
            <ArrowLeft size={20} color={TGC_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TGC_COLORS.mint} />
        </View>
      </AppBackground>
    );
  }

  if (detailQuery.isError || !event) {
    return (
      <AppBackground style={styles.container}>
        <View style={[styles.loadingHeader, {paddingTop: insets.top + 12}]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
            <ArrowLeft size={20} color={TGC_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  const isFull = event.capacity != null && event.registrationCount >= event.capacity;
  const catColor = CATEGORY_COLORS[event.category] || TGC_COLORS.lavender;
  const catIcon = CATEGORY_ICONS[event.category] || '✨';
  const canManageEvent =
    !!authUser &&
    (authUser.role === 'ADMIN' || event.createdBy?.id === authUser.id);

  const capacityPercent = event.capacity
    ? Math.min((event.registrationCount / event.capacity) * 100, 100)
    : null;

  const handleDeleteEvent = () => {
    setShowActionsMenu(false);
    Alert.alert(
      'Delete Event',
      'This will remove the event from public and host listings. You can continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(event.id);
              navigation.goBack();
            } catch {
              // handled by mutation toast
            }
          },
        },
      ],
    );
  };

  const handleEditEvent = () => {
    setShowActionsMenu(false);
    Toast.show({
      type: 'info',
      text1: 'Edit event',
      text2: 'Edit flow is not wired yet on this screen.',
      position: 'top',
    });
  };

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 110}}>

        {/* ── Cover Image — 220px full-bleed ─────────────────── */}
        <View style={styles.coverContainer}>
          {event.coverImageUrl ? (
            <>
              <Image
                source={{uri: event.coverImageUrl}}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.coverOverlay} />
            </>
          ) : (
            <View style={[styles.coverPlaceholder, {backgroundColor: catColor + '33'}]}>
              <Text style={styles.coverPlaceholderEmoji}>{catIcon}</Text>
            </View>
          )}

          {/* Back button — absolute top-left */}
          <TouchableOpacity
            style={[styles.backBtnAbsolute, {top: insets.top + 12}]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          {canManageEvent ? (
            <TouchableOpacity
              style={[styles.menuBtnAbsolute, {top: insets.top + 12}]}
              onPress={() => setShowActionsMenu(true)}
              activeOpacity={0.8}>
              <EllipsisVertical size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Title Section — white card below cover ─────────── */}
        <View style={styles.titleSection}>
          <View style={[
            styles.categoryBadge,
            {backgroundColor: catColor + '22', borderColor: catColor + '55'},
          ]}>
            <Text style={[styles.categoryBadgeText, {color: catColor}]}>
              {catIcon}  {event.category.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.titleMeta}>
            <MapPin size={13} color={TGC_COLORS.textSecondary} />
            <Text style={styles.titleMetaText}>{event.city}</Text>
          </View>
        </View>

        {/* ── Info Cards ─────────────────────────────────────── */}
        <View style={styles.cardsSection}>

          {/* Date & Time */}
          <SurfaceCard style={styles.card}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, {backgroundColor: 'rgba(125,211,192,0.16)'}]}>
                <Calendar size={20} color={TGC_COLORS.mint} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{formatFullDate(event.startAt)}</Text>
                {event.endAt && (
                  <Text style={styles.infoSub}>Ends: {formatFullDate(event.endAt)}</Text>
                )}
              </View>
            </View>
          </SurfaceCard>

          {/* Location */}
          {(event.venueName || event.addressText || event.city) && (
            <SurfaceCard style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, {backgroundColor: 'rgba(255,139,123,0.14)'}]}>
                  <MapPin size={20} color={TGC_COLORS.coral} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Where</Text>
                  {event.venueName && (
                    <Text style={styles.infoValue}>{event.venueName}</Text>
                  )}
                  {event.addressText && (
                    <Text style={styles.infoSub}>{event.addressText}</Text>
                  )}
                  <Text style={[styles.infoSub, {marginTop: 2}]}>📍 {event.city}</Text>
                </View>
              </View>
            </SurfaceCard>
          )}

          {/* Tribe badge */}
          {event.tribe && (
            <TouchableOpacity
              style={styles.tribeBadgeCard}
              onPress={() => navigation.navigate('TribeDetail', {slug: event.tribe!.slug})}
              activeOpacity={0.8}>
              <Text style={styles.tribeBadgeEmoji}>🏘️</Text>
              <View style={styles.tribeBadgeContent}>
                <Text style={styles.tribeBadgeLabel}>Community Event</Text>
                <Text style={styles.tribeBadgeName}>{event.tribe.name}</Text>
              </View>
              <ExternalLink size={16} color={TGC_COLORS.mint} />
            </TouchableOpacity>
          )}

          {/* About */}
          {event.description && (
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </SurfaceCard>
          )}

          {/* Capacity */}
          <SurfaceCard style={styles.card}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, {backgroundColor: 'rgba(200,182,255,0.16)'}]}>
                <Users size={20} color={TGC_COLORS.lavender} />
              </View>
              <View style={[styles.infoContent, {flex: 1}]}>
                <Text style={styles.infoLabel}>Registrations</Text>
                <Text style={styles.infoValue}>
                  {event.registrationCount}
                  {event.capacity ? ` / ${event.capacity} spots` : ' registered'}
                </Text>
                {capacityPercent != null && (
                  <View style={styles.capacityTrack}>
                    <View
                      style={[
                        styles.capacityFill,
                        {
                          width: `${capacityPercent}%` as any,
                          backgroundColor:
                            capacityPercent > 85 ? TGC_COLORS.coral : TGC_COLORS.mint,
                        },
                      ]}
                    />
                  </View>
                )}
                {isFull && <Text style={styles.fullText}>Event is full</Text>}
              </View>
            </View>
          </SurfaceCard>

          {/* Host */}
          {event.createdBy && (
            <SurfaceCard style={styles.card}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, {backgroundColor: TGC_COLORS.bgSecondary}]}>
                  <User size={20} color={TGC_COLORS.textSecondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hosted by</Text>
                  <Text style={styles.infoValue}>
                    {event.createdBy.fullName ||
                      (event.createdBy.username
                        ? `@${event.createdBy.username}`
                        : 'TGC Host')}
                  </Text>
                </View>
              </View>
            </SurfaceCard>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Action Bar ──────────────────────────── */}
      <View style={[styles.bottomBar, {paddingBottom: Math.max(insets.bottom, 12) + 4}]}>
        {event.isRegistered ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('MyPass', {
                passCode: event.myPassCode!,
                eventTitle: event.title,
                eventStartAt: event.startAt,
                eventCity: event.city,
                eventSlug: slug,
              })
            }>
            <SoftGradient
              colors={TGC_GRADIENTS.lavender}
              style={styles.actionBtn}
              intensity={0.9}>
              <Text style={styles.actionBtnText}>🎟️  View My Pass</Text>
            </SoftGradient>
          </TouchableOpacity>
        ) : isFull ? (
          <View style={[styles.actionBtn, styles.actionBtnFull]}>
            <Text style={[styles.actionBtnText, {color: TGC_COLORS.textSecondary}]}>
              Event Full
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isRegistering}
            activeOpacity={0.85}>
            <SoftGradient
              colors={TGC_GRADIENTS.dashboardHeader}
              style={styles.actionBtn}
              intensity={0.95}>
              {isRegistering ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>Register for Free</Text>
              )}
            </SoftGradient>
          </TouchableOpacity>
        )}
      </View>

      {canManageEvent ? (
        <Modal
          transparent
          visible={showActionsMenu}
          animationType="fade"
          onRequestClose={() => setShowActionsMenu(false)}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setShowActionsMenu(false)}
          />
          <View style={[styles.menuSheet, {top: insets.top + 58}]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditEvent}
              activeOpacity={0.8}>
              <View style={[styles.menuIconWrap, styles.menuIconEdit]}>
                <Pencil size={16} color={TGC_COLORS.lavender} />
              </View>
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteEvent}
              activeOpacity={0.8}
              disabled={deleteMutation.isPending}>
              <View style={[styles.menuIconWrap, styles.menuIconDelete]}>
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color={TGC_COLORS.coral} />
                ) : (
                  <Trash2 size={16} color={TGC_COLORS.coral} />
                )}
              </View>
              <Text style={[styles.menuItemText, styles.menuDeleteText]}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      ) : null}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  loadingHeader: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 12,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  coverContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderEmoji: {
    fontSize: 72,
  },
  backBtnAbsolute: {
    position: 'absolute',
    left: TGC_SPACING.pageHorizontal,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnAbsolute: {
    position: 'absolute',
    right: TGC_SPACING.pageHorizontal,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TGC_COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
  },
  titleSection: {
    backgroundColor: TGC_COLORS.white,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TGC_COLORS.border,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: TGC_RADIUS.chip,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  eventTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginBottom: 8,
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleMetaText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cardsSection: {
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    padding: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: {
    color: TGC_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  infoSub: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  descriptionText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  capacityTrack: {
    marginTop: 8,
    height: 7,
    borderRadius: 999,
    backgroundColor: TGC_COLORS.border,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 999,
  },
  fullText: {
    color: TGC_COLORS.coral,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  tribeBadgeCard: {
    backgroundColor: 'rgba(125,211,192,0.09)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,192,0.35)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tribeBadgeEmoji: {
    fontSize: 28,
  },
  tribeBadgeContent: {
    flex: 1,
  },
  tribeBadgeLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tribeBadgeName: {
    color: TGC_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(253,252,250,0.97)',
    borderTopWidth: 1,
    borderTopColor: TGC_COLORS.border,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 12,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  menuSheet: {
    position: 'absolute',
    right: TGC_SPACING.pageHorizontal,
    width: 176,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    padding: 8,
    ...TGC_SHADOWS.card,
  },
  menuItem: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconEdit: {
    backgroundColor: 'rgba(200,182,255,0.18)',
  },
  menuIconDelete: {
    backgroundColor: 'rgba(255,139,123,0.12)',
  },
  menuItemText: {
    color: TGC_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  menuDeleteText: {
    color: TGC_COLORS.coral,
  },
  actionBtn: {
    borderRadius: TGC_RADIUS.button,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnFull: {
    backgroundColor: TGC_COLORS.bgSecondary,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: TGC_COLORS.mint,
    borderRadius: TGC_RADIUS.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
