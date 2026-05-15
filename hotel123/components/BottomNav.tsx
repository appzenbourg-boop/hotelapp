import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationContext } from '../context/NavigationContext';

const { width } = Dimensions.get('window');

  type Tab = 'home' | 'bookings' | 'services' | 'book' | 'favorite';

  interface Props {
    activeTab: Tab;
  }

  import { useTranslation } from '../hooks/useTranslation';

  export default function BottomNav({ activeTab }: Props) {
    const t = useTranslation();
    const insets = useSafeAreaInsets();
    const { setLastMainTab } = useNavigationContext();

    React.useEffect(() => {
      const routeMap: Record<Tab, string> = {
        home: '/(main)/home',
        bookings: '/(main)/bookings',
        book: '/(main)/book',
        favorite: '/(main)/favorite',
        services: '/(main)/home' // Fallback
      };
      setLastMainTab(routeMap[activeTab]);
    }, [activeTab]);

    const handleNavigation = (route: string, tab: Tab) => {
      if (activeTab === tab) return; // Don't navigate if already on this tab
      router.replace(route as any);
    };

    return (
      <View style={[styles.bottomNav, { bottom: Math.max(20, insets.bottom + 10) }]}>
        <NavItem
          icon="home-outline"
          label={t('home')}
          active={activeTab === 'home'}
          onPress={() => handleNavigation('/(main)/home', 'home')}
        />

        <NavItem
          icon="calendar-outline"
          label={t('bookings')}
          active={activeTab === 'bookings'}
          onPress={() => handleNavigation('/(main)/bookings', 'bookings')}
        />


        <NavItem
          icon="add-circle-outline"
          label={t('newBooking') || "New Booking"}
          active={activeTab === 'book'}
          onPress={() => handleNavigation('/(main)/book', 'book')}
        />

        <NavItem
          icon="heart-outline"
          label={t('favorite')}
          active={activeTab === 'favorite'}
          onPress={() => handleNavigation('/(main)/favorite', 'favorite')}
        />
      </View>
    );
  }

function NavItem({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={24}
        color={active ? '#FFFFFF' : '#9E9E9E'}
        style={{ transform: [{ scale: active ? 1.1 : 1 }] }}
      />
      <Text
        style={[
          styles.navLabel,
          { color: active ? '#FFFFFF' : '#9E9E9E' },
          active && styles.activeLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 76,
    backgroundColor: '#2A2A2A',

    borderRadius: 45,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    marginTop: 4,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#9E9E9E',
  },
  activeLabel: {
    fontFamily: 'Inter-SemiBold',
  },
});
