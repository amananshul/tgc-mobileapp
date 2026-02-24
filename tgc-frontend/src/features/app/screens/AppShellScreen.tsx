import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LayoutDashboard, UserCircle} from 'lucide-react-native';
import DashboardScreen from '../../dashboard/screens/DashboardScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import {TGC_COLORS} from '../../../theme/tgcTheme';

type AppTab = 'dashboard' | 'profile';

export default function AppShellScreen() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const insets = useSafeAreaInsets();

  const isDashboard = activeTab === 'dashboard';
  const isProfile = activeTab === 'profile';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={{flex: 1, display: isDashboard ? 'flex' : 'none'}}>
          <DashboardScreen onOpenProfile={() => setActiveTab('profile')} />
        </View>
        <View style={{flex: 1, display: isProfile ? 'flex' : 'none'}}>
          <ProfileScreen />
        </View>
      </View>

      <View style={[styles.tabBar, {paddingBottom: Math.max(insets.bottom, 10) + 4}]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}>
          <View style={[styles.iconBubble, isDashboard && styles.iconBubbleDashboardActive]}>
            <LayoutDashboard
              size={22}
              color={isDashboard ? TGC_COLORS.mint : TGC_COLORS.textTertiary}
              strokeWidth={isDashboard ? 2.2 : 1.8}
            />
          </View>
          <Text style={[styles.label, isDashboard && styles.labelDashboardActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}>
          <View style={[styles.iconBubble, isProfile && styles.iconBubbleProfileActive]}>
            <UserCircle
              size={22}
              color={isProfile ? TGC_COLORS.coral : TGC_COLORS.textTertiary}
              strokeWidth={isProfile ? 2.2 : 1.8}
            />
          </View>
          <Text style={[styles.label, isProfile && styles.labelProfileActive]}>
            Profile
          </Text>
        </TouchableOpacity>
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
    borderColor: TGC_COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#A89E94',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: -6},
    elevation: 12,
    paddingTop: 10,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconBubbleDashboardActive: {
    backgroundColor: 'rgba(125,211,192,0.15)',
  },
  iconBubbleProfileActive: {
    backgroundColor: 'rgba(255,139,123,0.15)',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: TGC_COLORS.textTertiary,
    letterSpacing: 0.2,
  },
  labelDashboardActive: {
    color: TGC_COLORS.mint,
  },
  labelProfileActive: {
    color: TGC_COLORS.coral,
  },
});
