import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ArrowLeft, Calendar, MapPin, Share2} from 'lucide-react-native';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SHADOWS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';

type NavProp = NativeStackNavigationProp<AppStackParamList>;
type RouteType = RouteProp<AppStackParamList, 'MyPass'>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyPassScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {passCode, eventTitle, eventStartAt, eventCity, eventSlug} = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My TGC Event Pass\n\nEvent: ${eventTitle}\nDate: ${formatDate(eventStartAt)}\nCity: ${eventCity}\n\nPass Code: ${passCode}`,
        title: 'My TGC Event Pass',
      });
    } catch {}
  };

  return (
    <AppBackground style={styles.container}>
      <SoftGradient
        colors={TGC_GRADIENTS.dashboardHeader}
        style={[styles.header, {paddingTop: insets.top + 12}]}
        intensity={0.52}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Pass</Text>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.backBtn}
            activeOpacity={0.8}>
            <Share2 size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Show this at the event entry</Text>
      </SoftGradient>

      <View style={styles.content}>
        {/* ── Pass Card ─────────────────────────────────── */}
        <SurfaceCard style={styles.passCard}>
          {/* Ticket notch decorations */}
          <View style={styles.notchLeft} />
          <View style={styles.notchRight} />
          <View style={styles.dashedDivider} />

          {/* Event info top half */}
          <View style={styles.passTop}>
            <Text style={styles.passEventTitle} numberOfLines={2}>
              {eventTitle}
            </Text>

            <View style={styles.passMeta}>
              <Calendar size={14} color={TGC_COLORS.mint} />
              <Text style={styles.passMetaText}>{formatDate(eventStartAt)}</Text>
            </View>
            <View style={styles.passMeta}>
              <MapPin size={14} color={TGC_COLORS.mint} />
              <Text style={styles.passMetaText}>{eventCity}</Text>
            </View>
          </View>

          {/* QR placeholder bottom half */}
          <View style={styles.passBottom}>
            <View style={styles.qrPlaceholder}>
              {/* Faux QR grid */}
              {Array.from({length: 9}).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    {
                      backgroundColor:
                        [0, 2, 6, 8, 4].includes(i)
                          ? TGC_COLORS.textPrimary
                          : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.qrLabel}>Scan QR (Coming Soon)</Text>

            <View style={styles.passCodeBlock}>
              <Text style={styles.passCodeLabel}>PASS CODE</Text>
              <Text style={styles.passCode}>{passCode}</Text>
            </View>
          </View>
        </SurfaceCard>

        {/* ── Instructions ── */}
        <SurfaceCard style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to use</Text>
          <Text style={styles.infoText}>
            Show this pass code at the event entry. The event host will verify your registration. Keep a screenshot handy in case of no internet.
          </Text>
        </SurfaceCard>

        {/* ── Add to Calendar placeholder ── */}
        <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.8}>
          <Calendar size={18} color={TGC_COLORS.mint} />
          <Text style={styles.calendarBtnText}>Add to Calendar (coming soon)</Text>
        </TouchableOpacity>

        {/* ── View Event Details ── */}
        {eventSlug && (
          <TouchableOpacity
            style={styles.viewEventBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EventDetail', {slug: eventSlug})}>
            <Text style={styles.viewEventBtnText}>View Event Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 22,
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
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
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingTop: 20,
    gap: 16,
  },
  passCard: {
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  notchLeft: {
    position: 'absolute',
    left: -18,
    top: '52%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TGC_COLORS.bgPrimary,
    zIndex: 2,
  },
  notchRight: {
    position: 'absolute',
    right: -18,
    top: '52%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TGC_COLORS.bgPrimary,
    zIndex: 2,
  },
  dashedDivider: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '52%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    zIndex: 1,
  },
  passTop: {
    padding: 24,
    paddingBottom: 20,
  },
  passEventTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 12,
  },
  passMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  passMetaText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  passBottom: {
    padding: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TGC_COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCell: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  qrLabel: {
    color: TGC_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 18,
  },
  passCodeBlock: {
    backgroundColor: 'rgba(125,211,192,0.1)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,192,0.4)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  passCodeLabel: {
    color: TGC_COLORS.mint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  passCode: {
    color: TGC_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    padding: 18,
  },
  infoTitle: {
    color: TGC_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  infoText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(125,211,192,0.1)',
    borderRadius: TGC_RADIUS.button,
    borderWidth: 1.5,
    borderColor: 'rgba(125,211,192,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  calendarBtnText: {
    color: TGC_COLORS.mint,
    fontSize: 14,
    fontWeight: '800',
  },
  viewEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: TGC_RADIUS.button,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: TGC_COLORS.bgSecondary,
  },
  viewEventBtnText: {
    color: TGC_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
});
