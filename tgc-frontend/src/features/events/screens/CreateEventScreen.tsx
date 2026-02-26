import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft, ChevronDown, Calendar, Upload, X} from 'lucide-react-native';
import {pickImageFromDevice} from '../../../utils/media/pickImage';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppBackground from '../../../components/ui/AppBackground';
import SoftGradient from '../../../components/ui/SoftGradient';
import SurfaceCard from '../../../components/ui/SurfaceCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import {useAppSelector} from '../../../store/hooks';
import {useCreateEvent} from '../hooks/useCreateEvent';
import {useUploadEventCover} from '../hooks/useUploadEventCover';
import {useMyTribes} from '../../tribes/hooks/useMyTribes';
import {
  TGC_COLORS,
  TGC_GRADIENTS,
  TGC_RADIUS,
  TGC_SPACING,
} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../../../app/navigation/AppStack';
import type {EventCategory, EventVisibility} from '../../../types/auth';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

type EventCategoryOption = {
  id: string;
  label: string;
  category: EventCategory;
};

// UI shows expanded TGC categories while payload stays compatible with the current backend enum.
const EVENT_CATEGORY_OPTIONS: EventCategoryOption[] = [
  {id: 'workshop-training', label: 'Workshop / Training', category: 'WORKSHOP'},
  {id: 'practice-session', label: 'Practice Session', category: 'FITNESS'},
  {id: 'live-performance', label: 'Live Performance', category: 'MUSIC'},
  {id: 'competition-challenge', label: 'Competition / Challenge', category: 'FITNESS'},
  {id: 'networking-event', label: 'Networking Event', category: 'SOCIAL'},
  {id: 'seminar-talk', label: 'Seminar / Talk', category: 'WORKSHOP'},
  {id: 'festival-community', label: 'Festival / Community Gathering', category: 'SOCIAL'},
  {id: 'popup-market', label: 'Pop-up / Market', category: 'ART'},
  {id: 'volunteer-drive', label: 'Volunteer Drive', category: 'VOLUNTEER'},
  {id: 'bootcamp-intensive', label: 'Bootcamp / Intensive', category: 'WORKSHOP'},
  {id: 'open-mic', label: 'Open Mic', category: 'OPEN_MIC'},
  {id: 'meetup-social', label: 'Meetup / Social', category: 'SOCIAL'},
  {id: 'online-session', label: 'Online Session', category: 'TECH'},
  {id: 'demo-showcase', label: 'Demo / Showcase', category: 'TECH'},
  {id: 'other', label: 'Other', category: 'OTHER'},
];

const VISIBILITIES: {label: string; value: EventVisibility; desc: string}[] = [
  {label: 'Public', value: 'PUBLIC', desc: 'Anyone can see'},
  {label: 'Tribe Only', value: 'TRIBE_ONLY', desc: 'Only tribe members'},
  {label: 'Private', value: 'PRIVATE', desc: 'Only you & collaborators'},
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function defaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  return d;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── PickerModal (category / tribe selector) ──────────────────────────────

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: {label: string; value: string}[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

function PickerModal({visible, title, items, selected, onSelect, onClose}: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={pickerStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={pickerStyles.sheet}>
        <View style={pickerStyles.handle} />
        <Text style={pickerStyles.title}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={i => i.value}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[pickerStyles.item, selected === item.value && pickerStyles.itemActive]}
              onPress={() => {onSelect(item.value); onClose();}}
              activeOpacity={0.8}>
              <Text style={[pickerStyles.itemText, selected === item.value && pickerStyles.itemTextActive]}>
                {item.label}
              </Text>
              {selected === item.value && <Text style={pickerStyles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)'},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  handle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: TGC_COLORS.border,
    alignSelf: 'center', marginBottom: 14,
  },
  title: {color: TGC_COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 12},
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4,
    backgroundColor: TGC_COLORS.bgSecondary, borderWidth: 1, borderColor: TGC_COLORS.border,
  },
  itemActive: {backgroundColor: 'rgba(125,211,192,0.14)', borderColor: TGC_COLORS.mint},
  itemText: {color: TGC_COLORS.textPrimary, fontSize: 15, fontWeight: '700'},
  itemTextActive: {color: TGC_COLORS.mint},
  checkmark: {color: TGC_COLORS.mint, fontSize: 16, fontWeight: '900'},
});

// ─── DateField ────────────────────────────────────────────────────────────
// Tappable field that shows the selected date and opens the native picker.

interface DateFieldProps {
  label: string;
  date: Date | null;
  onPress: () => void;
  onClear?: () => void;
  required?: boolean;
}

function DateField({label, date, onPress, onClear, required}: DateFieldProps) {
  return (
    <TouchableOpacity style={dfStyles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={dfStyles.iconBox}>
        <Calendar size={16} color={date ? TGC_COLORS.mint : TGC_COLORS.textSecondary} />
      </View>
      <View style={dfStyles.body}>
        <Text style={dfStyles.label}>
          {label}{required && <Text style={dfStyles.required}> *</Text>}
        </Text>
        <Text style={date ? dfStyles.value : dfStyles.placeholder}>
          {date ? formatDisplayDate(date) : 'Tap to set'}
        </Text>
      </View>
      {onClear && date ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.7}>
          <X size={14} color={TGC_COLORS.coral} />
        </TouchableOpacity>
      ) : (
        <ChevronDown size={14} color={TGC_COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const dfStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: TGC_RADIUS.input,
    borderWidth: 1.5,
    borderColor: TGC_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(125,211,192,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: {flex: 1, gap: 2},
  label: {color: TGC_COLORS.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4},
  required: {color: TGC_COLORS.coral},
  value: {color: TGC_COLORS.textPrimary, fontSize: 14, fontWeight: '800'},
  placeholder: {color: TGC_COLORS.textTertiary, fontSize: 14, fontWeight: '600'},
});

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function CreateEventScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const user = useAppSelector(s => s.auth.user);
  const createEvent = useCreateEvent();
  const uploadEventCover = useUploadEventCover();
  const myTribesQuery = useMyTribes();

  // Cover image — local preview + uploaded CDN path
  const [coverImage, setCoverImage] = useState<{uri: string} | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const handlePickCover = async () => {
    try {
      const image = await pickImageFromDevice();
      if (!image) return;
      setCoverImage({uri: image.uri}); // show local preview immediately
      setCoverUrl(null);               // clear any previous upload URL
      const result = await uploadEventCover.mutateAsync({image});
      setCoverUrl(result.path);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Image error',
        text2: err?.message || 'Could not upload cover image.',
        position: 'top',
      });
    }
  };

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [addressText, setAddressText] = useState('');
  const [categoryOptionId, setCategoryOptionId] = useState<string>('other');
  const [visibility, setVisibility] = useState<EventVisibility>('PUBLIC');
  const [tribeId, setTribeId] = useState<string | undefined>(undefined);
  const [capacity, setCapacity] = useState('');

  // Date/time — stored as Date objects
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Picker visibility
  // pickerField: which field is being edited ('start' | 'end' | null)
  const [pickerField, setPickerField] = useState<'start' | 'end' | null>(null);

  // Android: two-step state (date first → then time)
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const [androidTemp, setAndroidTemp] = useState<Date>(new Date());

  const openPicker = (field: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      const base = field === 'start' ? startDate : (endDate ?? startDate);
      setAndroidTemp(base);
      setAndroidStep('date');
    }
    setPickerField(field);
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setPickerField(null);
        return;
      }
      if (!selected) return;

      if (androidStep === 'date') {
        // Store the picked date, then immediately prompt for time
        setAndroidTemp(selected);
        setAndroidStep('time');
      } else {
        // Merge date from androidTemp + time from selected
        const combined = new Date(androidTemp);
        combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        if (pickerField === 'start') setStartDate(combined);
        else setEndDate(combined);
        setPickerField(null);
      }
    } else {
      // iOS — picker stays open inside modal; update live
      if (selected) {
        if (pickerField === 'start') setStartDate(selected);
        else setEndDate(selected);
      }
    }
  };

  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showTribePicker, setShowTribePicker] = useState(false);

  const canCreate = user?.role === 'HOST' || user?.role === 'ADMIN';
  const myTribes = myTribesQuery.data?.tribes ?? [];
  const selectedCategoryOption =
    EVENT_CATEGORY_OPTIONS.find(c => c.id === categoryOptionId) ??
    EVENT_CATEGORY_OPTIONS[EVENT_CATEGORY_OPTIONS.length - 1];
  const selectedCatLabel = selectedCategoryOption.label;
  const selectedTribeLabel = tribeId
    ? myTribes.find(t => t.id === tribeId)?.name ?? 'Unknown Tribe'
    : 'None (General event)';

  const handleSubmit = async () => {
    if (!title.trim() || !city.trim()) return;

    const payload: any = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: selectedCategoryOption.category,
      city: city.trim(),
      venueName: venueName.trim() || undefined,
      addressText: addressText.trim() || undefined,
      startAt: startDate.toISOString(),
      endAt: endDate?.toISOString() || undefined,
      visibility,
      tribeId: tribeId || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      coverImageUrl: coverUrl || undefined,
    };

    const result = await createEvent.mutateAsync(payload);
    if (result?.event?.slug) {
      navigation.replace('EventDetail', {slug: result.event.slug});
    } else {
      navigation.goBack();
    }
  };

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <SoftGradient
          colors={TGC_GRADIENTS.dashboardHeader}
          style={[styles.header, {paddingTop: insets.top + 12}]}
          intensity={0.54}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Event</Text>
            <View style={styles.backBtn} />
          </View>
          <Text style={styles.headerSubtitle}>
            Host an event and bring your community together.
          </Text>
        </SoftGradient>

        {!canCreate ? (
          <SurfaceCard style={styles.card}>
            <Text style={styles.cardTitle}>Host access required</Text>
            <Text style={styles.cardText}>
              Enable Host mode from your Profile to create events.
            </Text>
            <Button title="Back" onPress={() => navigation.goBack()} style={styles.submitBtn} />
          </SurfaceCard>
        ) : (
          <>
            {/* ── Cover Image ── */}
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>Cover Image</Text>
              <Text style={styles.inputLabel}>Add a photo to attract attendees (optional)</Text>
              <TouchableOpacity
                style={styles.coverUpload}
                onPress={handlePickCover}
                activeOpacity={0.7}
                disabled={uploadEventCover.isPending}>
                {coverImage ? (
                  <>
                    <Image source={coverImage} style={styles.coverImage} resizeMode="cover" />
                    {uploadEventCover.isPending && (
                      <View style={styles.coverOverlay}>
                        <ActivityIndicator color="#fff" size="large" />
                        <Text style={styles.coverOverlayText}>Uploading…</Text>
                      </View>
                    )}
                    {!uploadEventCover.isPending && coverUrl && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>✓ Uploaded</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Upload size={30} color={TGC_COLORS.mint} />
                    <Text style={styles.coverPlaceholderText}>Tap to upload cover</Text>
                    <Text style={styles.coverPlaceholderSub}>JPG, PNG · 16:9 recommended</Text>
                  </View>
                )}
              </TouchableOpacity>
            </SurfaceCard>

            {/* ── Basic Info ── */}
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>Event Details</Text>
              <Input
                label="Title *"
                placeholder="e.g. Rooftop Open Mic Night"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
                accentColor={TGC_COLORS.mint}
              />
              <Input
                label="Description (optional)"
                placeholder="What's this event about?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accentColor={TGC_COLORS.mint}
              />
              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={() => setShowCatPicker(true)} activeOpacity={0.8}>
                <Text style={styles.selectorValue}>{selectedCatLabel}</Text>
                <ChevronDown size={16} color={TGC_COLORS.textSecondary} />
              </TouchableOpacity>
            </SurfaceCard>

            {/* ── Location ── */}
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Input label="City *" placeholder="e.g. Mumbai" value={city} onChangeText={setCity} accentColor={TGC_COLORS.mint} />
              <Input label="Venue Name (optional)" placeholder="e.g. The Canvas Co-working" value={venueName} onChangeText={setVenueName} accentColor={TGC_COLORS.mint} />
              <Input label="Address (optional)" placeholder="Full address" value={addressText} onChangeText={setAddressText} accentColor={TGC_COLORS.mint} />
            </SurfaceCard>

            {/* ── Date & Time ── */}
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <DateField
                label="Start"
                date={startDate}
                onPress={() => openPicker('start')}
                required
              />
              <DateField
                label="End (optional)"
                date={endDate}
                onPress={() => openPicker('end')}
                onClear={() => setEndDate(null)}
              />
            </SurfaceCard>

            {/* ── Settings ── */}
            <SurfaceCard style={styles.card}>
              <Text style={styles.sectionTitle}>Settings</Text>

              <Text style={styles.inputLabel}>Visibility</Text>
              <View style={styles.visibilityRow}>
                {VISIBILITIES.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.visibilityPill, visibility === opt.value && styles.visibilityPillActive]}
                    onPress={() => setVisibility(opt.value)}
                    activeOpacity={0.8}>
                    <Text style={[styles.visibilityText, visibility === opt.value && styles.visibilityTextActive]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.visibilityDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {myTribes.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, {marginTop: 14}]}>Tribe (optional)</Text>
                  <TouchableOpacity style={styles.selectorRow} onPress={() => setShowTribePicker(true)} activeOpacity={0.8}>
                    <Text style={styles.selectorValue}>{selectedTribeLabel}</Text>
                    <ChevronDown size={16} color={TGC_COLORS.textSecondary} />
                  </TouchableOpacity>
                  {visibility === 'TRIBE_ONLY' && !tribeId && (
                    <Text style={styles.warningText}>⚠️ Select a tribe for TRIBE_ONLY events.</Text>
                  )}
                </>
              )}

              <Input
                label="Capacity (optional)"
                placeholder="e.g. 50"
                value={capacity}
                onChangeText={v => setCapacity(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                accentColor={TGC_COLORS.mint}
              />
            </SurfaceCard>

            <Button
              title="Create Event"
              onPress={handleSubmit}
              loading={createEvent.isPending}
              disabled={!title.trim() || !city.trim()}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>

      {/* ── Android native date/time dialogs (chained: date → time) ── */}
      {Platform.OS === 'android' && pickerField !== null && (
        <DateTimePicker
          value={androidTemp}
          mode={androidStep}
          display="default"
          onChange={handleDateChange}
          minimumDate={
            androidStep === 'date'
              ? pickerField === 'start'
                ? new Date()
                : startDate
              : undefined
          }
        />
      )}

      {/* ── iOS bottom-sheet picker ── */}
      {Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          visible={pickerField !== null}
          onRequestClose={() => setPickerField(null)}>
          <TouchableOpacity
            style={iosStyles.backdrop}
            onPress={() => setPickerField(null)}
            activeOpacity={1}
          />
          <View style={[iosStyles.sheet, {paddingBottom: insets.bottom + 8}]}>
            <View style={iosStyles.handle} />
            <View style={iosStyles.sheetHeader}>
              <Text style={iosStyles.sheetTitle}>
                {pickerField === 'start' ? 'Start Date & Time' : 'End Date & Time'}
              </Text>
              <TouchableOpacity onPress={() => setPickerField(null)} activeOpacity={0.7}>
                <Text style={iosStyles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={
                pickerField === 'start'
                  ? startDate
                  : (endDate ?? startDate)
              }
              mode="datetime"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={pickerField === 'end' ? startDate : new Date()}
              style={iosStyles.picker}
            />
          </View>
        </Modal>
      )}

      {/* Category picker */}
      <PickerModal
        visible={showCatPicker}
        title="Choose Category"
        items={EVENT_CATEGORY_OPTIONS.map(option => ({
          label: option.label,
          value: option.id,
        }))}
        selected={categoryOptionId}
        onSelect={v => setCategoryOptionId(v)}
        onClose={() => setShowCatPicker(false)}
      />

      {/* Tribe picker */}
      <PickerModal
        visible={showTribePicker}
        title="Associate with Tribe"
        items={[
          {label: 'None (General event)', value: ''},
          ...myTribes.map(t => ({label: t.name, value: t.id})),
        ]}
        selected={tribeId ?? ''}
        onSelect={v => setTribeId(v || undefined)}
        onClose={() => setShowTribePicker(false)}
      />
    </AppBackground>
  );
}

// ─── iOS sheet styles ─────────────────────────────────────────────────────

const iosStyles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)'},
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: TGC_COLORS.border,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {color: TGC_COLORS.textPrimary, fontSize: 17, fontWeight: '900'},
  doneBtn: {color: TGC_COLORS.mint, fontSize: 16, fontWeight: '800'},
  picker: {width: '100%', height: 200},
});

// ─── Main styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 60},
  header: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: TGC_SPACING.pageHorizontal,
    paddingBottom: 22,
    shadowColor: TGC_COLORS.mint,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {color: '#fff', fontSize: 20, fontWeight: '900'},
  headerSubtitle: {
    color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 19,
    marginTop: 10, textAlign: 'center', paddingHorizontal: 16,
  },
  card: {
    marginTop: 16,
    marginHorizontal: TGC_SPACING.pageHorizontal,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardTitle: {color: TGC_COLORS.textPrimary, fontSize: 20, fontWeight: '900'},
  cardText: {color: TGC_COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6},
  sectionTitle: {color: TGC_COLORS.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 14},
  inputLabel: {color: TGC_COLORS.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8},
  selectorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: TGC_COLORS.bgSecondary,
    borderRadius: TGC_RADIUS.input, borderWidth: 1.5, borderColor: TGC_COLORS.border,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14,
  },
  selectorValue: {color: TGC_COLORS.textPrimary, fontSize: 15, fontWeight: '700'},
  visibilityRow: {flexDirection: 'row', gap: 8, marginBottom: 4},
  visibilityPill: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    borderColor: TGC_COLORS.border, backgroundColor: TGC_COLORS.bgSecondary,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
  },
  visibilityPillActive: {borderColor: TGC_COLORS.mint, backgroundColor: 'rgba(125,211,192,0.12)'},
  visibilityText: {color: TGC_COLORS.textPrimary, fontSize: 13, fontWeight: '800'},
  visibilityTextActive: {color: TGC_COLORS.mint},
  visibilityDesc: {color: TGC_COLORS.textSecondary, fontSize: 10, fontWeight: '600', marginTop: 3, textAlign: 'center'},
  warningText: {color: TGC_COLORS.coral, fontSize: 12, fontWeight: '600', marginTop: 6},
  coverUpload: {
    width: '100%', height: 164,
    borderRadius: TGC_RADIUS.card, overflow: 'hidden',
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(125,211,192,0.45)', marginTop: 6,
  },
  coverImage: {width: '100%', height: '100%'},
  coverOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  coverOverlayText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  coverBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(125,211,192,0.88)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  coverBadgeText: {color: '#fff', fontSize: 11, fontWeight: '800'},
  coverPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(125,211,192,0.06)', gap: 8,
  },
  coverPlaceholderText: {color: TGC_COLORS.textSecondary, fontSize: 14, fontWeight: '700'},
  coverPlaceholderSub: {color: TGC_COLORS.textTertiary, fontSize: 11, fontWeight: '600'},
  submitBtn: {marginTop: 20, marginHorizontal: TGC_SPACING.pageHorizontal},
});
