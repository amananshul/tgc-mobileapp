import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  UserCircle,
  Calendar,
  Users,
  Plus,
} from 'lucide-react-native';
import DashboardScreen from '../../dashboard/screens/DashboardScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import ExploreEventsScreen from '../../events/screens/ExploreEventsScreen';
import ExploreTribesScreen from '../../tribes/screens/ExploreTribesScreen';
import {useAppSelector} from '../../../store/hooks';
import {useUIMode} from '../../ui-mode/UIModeProvider';
import {TGC_COLORS} from '../../../theme/tgcTheme';
import type {AppStackParamList} from '../.././../app/navigation/AppStack';

type AppTab = 'dashboard' | 'events' | 'tribes' | 'profile';

const TAB_CONFIG = [
  {
    id: 'dashboard' as AppTab,
    label: 'Home',
    iconActive: (color: string) => <LayoutDashboard size={22} color={color} strokeWidth={2.2} />,
    iconInactive: (color: string) => <LayoutDashboard size={22} color={color} strokeWidth={1.8} />,
    activeColor: TGC_COLORS.mint,
    bubbleBg: 'rgba(125,211,192,0.15)',
  },
  {
    id: 'events' as AppTab,
    label: 'Events',
    iconActive: (color: string) => <Calendar size={22} color={color} strokeWidth={2.2} />,
    iconInactive: (color: string) => <Calendar size={22} color={color} strokeWidth={1.8} />,
    activeColor: TGC_COLORS.mint,
    bubbleBg: 'rgba(125,211,192,0.15)',
  },
  {
    id: 'tribes' as AppTab,
    label: 'Tribes',
    iconActive: (color: string) => <Users size={22} color={color} strokeWidth={2.2} />,
    iconInactive: (color: string) => <Users size={22} color={color} strokeWidth={1.8} />,
    activeColor: TGC_COLORS.lavender,
    bubbleBg: 'rgba(200,182,255,0.15)',
  },
  {
    id: 'profile' as AppTab,
    label: 'Profile',
    iconActive: (color: string) => <UserCircle size={22} color={color} strokeWidth={2.2} />,
    iconInactive: (color: string) => <UserCircle size={22} color={color} strokeWidth={1.8} />,
    activeColor: TGC_COLORS.coral,
    bubbleBg: 'rgba(255,139,123,0.15)',
  },
];

export default function AppShellScreen() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const {user} = useAppSelector(s => s.auth);
  const {uiMode, canUseHostMode} = useUIMode();

  const isHost = canUseHostMode && uiMode === 'HOST';
  const canCreate = user?.role === 'HOST' || user?.role === 'ADMIN';

  const handleFAB = () => {
    if (canCreate) {
      navigation.navigate('CreateEvent');
    } else {
      setActiveTab('events');
    }
  };

  const tabBarHeight = Math.max(insets.bottom, 10) + 64;

  return (
    <View style={styles.container}>
      {/* ── Content area ── */}
      <View style={[styles.content, {paddingBottom: tabBarHeight}]}>
        <View style={{flex: 1, display: activeTab === 'dashboard' ? 'flex' : 'none'}}>
          <DashboardScreen onOpenProfile={() => setActiveTab('profile')} />
        </View>
        <View style={{flex: 1, display: activeTab === 'events' ? 'flex' : 'none'}}>
          <ExploreEventsScreen />
        </View>
        <View style={{flex: 1, display: activeTab === 'tribes' ? 'flex' : 'none'}}>
          <ExploreTribesScreen />
        </View>
        <View style={{flex: 1, display: activeTab === 'profile' ? 'flex' : 'none'}}>
          <ProfileScreen />
        </View>
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View
        style={[
          styles.tabBar,
          {paddingBottom: Math.max(insets.bottom, 10)},
        ]}>

        {/* Left 2 tabs: Home + Events */}
        {TAB_CONFIG.slice(0, 2).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.iconBubble,
                  isActive && {backgroundColor: tab.bubbleBg},
                ]}>
                {isActive
                  ? tab.iconActive(tab.activeColor)
                  : tab.iconInactive(TGC_COLORS.textTertiary)}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && {color: tab.activeColor},
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Center FAB */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={[
              styles.fab,
              canCreate
                ? styles.fabHost
                : styles.fabUser,
            ]}
            onPress={handleFAB}
            activeOpacity={0.85}>
            <Plus size={26} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Right 2 tabs: Tribes + Profile */}
        {TAB_CONFIG.slice(2).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.iconBubble,
                  isActive && {backgroundColor: tab.bubbleBg},
                ]}>
                {isActive
                  ? tab.iconActive(tab.activeColor)
                  : tab.iconInactive(TGC_COLORS.textTertiary)}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && {color: tab.activeColor},
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TGC_COLORS.bgPrimary,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: TGC_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: TGC_COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#A89E94',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: -6},
    elevation: 14,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingBottom: 4,
  },
  iconBubble: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TGC_COLORS.textTertiary,
    letterSpacing: 0.2,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
  fabHost: {
    backgroundColor: TGC_COLORS.mint,
    shadowColor: TGC_COLORS.mint,
  },
  fabUser: {
    backgroundColor: TGC_COLORS.mint,
    shadowColor: TGC_COLORS.mint,
  },
});
