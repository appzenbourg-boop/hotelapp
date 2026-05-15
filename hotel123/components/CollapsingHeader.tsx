import React, { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

interface CollapsingHeaderProps {
  title: string;
  subtitle?: string;
  backgroundImage: any;
  scrollY: Animated.Value;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
}

export default function CollapsingHeader({
  title,
  subtitle,
  backgroundImage,
  scrollY,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
}: CollapsingHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const HEADER_MAX_HEIGHT = 230;
  const HEADER_MIN_HEIGHT = insets.top + 60;
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const collapsedOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE / 2, SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      setIsCollapsed(value > SCROLL_DISTANCE / 2);
    });
    return () => scrollY.removeListener(listenerId);
  }, []);

  return (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      {/* Background Image */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
        <ImageBackground
          source={backgroundImage}
          style={{ width: '100%', height: '100%' }}
          imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }]} />
        </ImageBackground>
      </Animated.View>

      {/* Expanded Content */}
      <Animated.View
        style={[
          styles.expandedContent,
          { paddingTop: insets.top + 12, opacity: titleOpacity },
        ]}
        pointerEvents={isCollapsed ? 'none' : 'auto'}
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.iconBtn}
          >
            <Ionicons name="menu" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </Animated.View>

      {/* Collapsed Content */}
      <Animated.View
        style={[
          styles.collapsedContent,
          { top: insets.top + 10, opacity: collapsedOpacity },
        ]}
        pointerEvents={isCollapsed ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconBtn}
        >
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.collapsedTitle}>
          <Text style={styles.collapsedTitleText} numberOfLines={1}>{title}</Text>
        </View>

        <View style={{ width: 44 }} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  collapsedContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  collapsedTitle: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  collapsedTitleText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000',
  },
});
