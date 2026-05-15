import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
  Pressable,
} from 'react-native';
import { Stack, router, useFocusEffect, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';
import HotelImage from '../../components/HotelImage';

import { useAuth } from '../../context/AuthContext';
import { favoritesAPI, notificationsAPI } from '../../services/api';
import { useFavorites } from '../../context/FavoritesContext';
import { useNavigationContext } from '../../context/NavigationContext';
import AnimatedButton from '../../components/AnimatedButton';
import FadeInView from '../../components/FadeInView';
import SkeletonView from '../../components/SkeletonView';
import { Animations } from '../../constants/Animations';

const { width } = Dimensions.get('window');

import useSWR from 'swr';

export default function FavoriteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { toggleFavorite } = useFavorites();
  const { setLastMainTab } = useNavigationContext();

  useFocusEffect(
    React.useCallback(() => {
      setLastMainTab('/(main)/favorite');
      setShowSortMenu(false); // Reset menu state on focus
    }, [])
  );

  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const HEADER_MAX_HEIGHT = 230 + insets.top;
  const HEADER_MIN_HEIGHT = insets.top + 60;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const collapsedOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const { favoriteData: favoritesList, mutate, isLoading, isValidating } = useFavorites();

  // Notification Watcher
  const { data: notifData, mutate: mutateNotifs } = useSWR(
    token ? ['in_app_notifications', token] : null,
    () => notificationsAPI.getUnread(token!),
    { refreshInterval: 15000 }
  );

  const hasNotifications = (notifData?.count || 0) > 0;

  const handleNotificationPress = () => {
    router.push('/(main)/notifications');
  };

  const filteredList = useMemo(() => {
    let sorted = [...favoritesList];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0));
    }
    return sorted;
  }, [favoritesList, sortBy]);

  const handleSort = (sort: 'recent' | 'price-low' | 'price-high') => {
    setSortBy(sort);
    setShowSortMenu(false);
  };

  const onRefresh = () => {
    mutate();
  };

  const handleRemove = async (propertyId: string) => {
    // Optimistic update
    const updated = favoritesList.filter(item => (item.property?.id || item.propertyId) !== propertyId);
    mutate(updated, false);
    
    try {
      await toggleFavorite(propertyId);
      // Cache is already optimistically updated, no need to re-fetch immediately
      // SWR will re-validate on next focus anyway
    } catch (e) {
      console.error(e);
      mutate(); // Revert on error
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* ANIMATED HEADER */}
        <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
          {/* Background Image with Fade */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
            <ImageBackground
              source={require('../../assets/images/image4.png')}
              style={[styles.headerImg, { height: HEADER_MAX_HEIGHT }]}
              imageStyle={styles.headerRadius}
            >
              <View style={styles.overlay} />
            </ImageBackground>
          </Animated.View>

          {/* EXPANDED LAYOUT */}
          <Animated.View 
            style={[
              { 
                paddingTop: insets.top + 20, 
                opacity: expandedOpacity,
                position: 'absolute',
                width: '100%',
                alignItems: 'center',
              }
            ]}
            pointerEvents={isHeaderCollapsed ? 'none' : 'auto'}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.menuBtn}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <Ionicons name="menu" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Favorites</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity 
                  style={styles.menuBtn}
                  onPress={handleNotificationPress}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                  {hasNotifications && (
                    <View style={{
                      position: 'absolute', top: 6, right: 8,
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#000'
                    }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuBtn}
                  onPress={() => setShowSortMenu(!showSortMenu)}
                >
                  <Ionicons name="filter-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.headerSubtitle}>
              Your favorite rooms are saved here{'\n'}
              review and book them whenever you're{'\n'}
              ready.
            </Text>
          </Animated.View>

          {/* COLLAPSED LAYOUT */}
          <Animated.View 
            style={[
              { 
                position: 'absolute',
                top: insets.top + 10,
                left: 16,
                right: 16,
                opacity: collapsedOpacity,
                flexDirection: 'row',
                alignItems: 'center',
                height: 44,
              }
            ]}
            pointerEvents={isHeaderCollapsed ? 'auto' : 'none'}
          >
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Ionicons name="menu" size={28} color="#000" />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: '#000', fontSize: 18 }]}>Favorites</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications-outline" size={24} color="#000" />
                {hasNotifications && (
                  <View style={{
                    position: 'absolute', top: 6, right: 8,
                    width: 10, height: 10, borderRadius: 5,
                    backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFF'
                  }} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <Ionicons name="filter-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
        </Animated.View>
      </Animated.View>


      {/* Sort Menu Dropdown - Moved OUTSIDE header to avoid clipping */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { top: insets.top + (isHeaderCollapsed ? 60 : 160) }]}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
            onPress={() => handleSort('recent')}
          >
            <Ionicons name="time-outline" size={20} color={sortBy === 'recent' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>Most Recent</Text>
            {sortBy === 'recent' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price-low' && styles.sortOptionActive]}
            onPress={() => handleSort('price-low')}
          >
            <Ionicons name="arrow-down-outline" size={20} color={sortBy === 'price-low' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'price-low' && styles.sortTextActive]}>Price: Low to High</Text>
            {sortBy === 'price-low' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price-high' && styles.sortOptionActive]}
            onPress={() => handleSort('price-high')}
          >
            <Ionicons name="arrow-up-outline" size={20} color={sortBy === 'price-high' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'price-high' && styles.sortTextActive]}>Price: High to Low</Text>
            {sortBy === 'price-high' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
        </View>
      )}

        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 150 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={isValidating} onRefresh={onRefresh} />}
          scrollEventThrottle={8}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={{ height: HEADER_MAX_HEIGHT }} />

          <View style={{ marginTop: 20 }}>

            {isLoading && (
              <View style={{ paddingHorizontal: 20 }}>
                <SkeletonView height={300} borderRadius={28} style={{ marginBottom: 20 }} />
                <SkeletonView height={300} borderRadius={28} />
              </View>
            )}

            {!isLoading && favoritesList.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="heart-dislike-outline" size={60} color="#CCC" />
                <Text style={{ fontFamily: 'Inter-Regular', color: '#666', marginTop: 10 }}>No favorites added yet.</Text>
                <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#C26A2C', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }} onPress={() => router.push('/(main)/book')}>
                    <Text style={{ color: '#FFF', fontFamily: 'Inter-Bold' }}>Explore Hotels</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredList.map((room, idx) => (
              <FadeInView key={room.id || room._id || idx} delay={idx * 150} translateY={15}>
                <FavoriteCard
                  room={room}
                  onRemove={() => handleRemove(room.property?.id || room.propertyId)}
                />
              </FadeInView>
            ))}

          </View>

        </Animated.ScrollView>

        <BottomNav activeTab="favorite" />

        {/* Sort Menu Overlay - Closes menu when clicking outside */}
        {showSortMenu && (
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} 
            onPress={() => setShowSortMenu(false)} 
          />
        )}

        {/* Sort Menu Dropdown - Moved OUTSIDE header to avoid clipping */}
        {showSortMenu && (
          <View style={[styles.sortMenu, { top: insets.top + (isHeaderCollapsed ? 60 : 160), zIndex: 3000 }]}>
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
              onPress={() => handleSort('recent')}
            >
              <Ionicons name="time-outline" size={20} color={sortBy === 'recent' ? '#C26A2C' : '#666'} />
              <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>Most Recent</Text>
              {sortBy === 'recent' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'price-low' && styles.sortOptionActive]}
              onPress={() => handleSort('price-low')}
            >
              <Ionicons name="arrow-down-outline" size={20} color={sortBy === 'price-low' ? '#C26A2C' : '#666'} />
              <Text style={[styles.sortText, sortBy === 'price-low' && styles.sortTextActive]}>Price: Low to High</Text>
              {sortBy === 'price-low' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'price-high' && styles.sortOptionActive]}
              onPress={() => handleSort('price-high')}
            >
              <Ionicons name="arrow-up-outline" size={20} color={sortBy === 'price-high' ? '#C26A2C' : '#666'} />
              <Text style={[styles.sortText, sortBy === 'price-high' && styles.sortTextActive]}>Price: High to Low</Text>
              {sortBy === 'price-high' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

function FavoriteCard({ room, onRemove }: { room: any, onRemove: () => void }) {
  return (
    <AnimatedButton
      style={styles.card}
      onPress={() => router.push({
        pathname: '/(main)/hotel-details',
        params: { propertyId: room.property?.id || room.propertyId, propertyName: room.property?.name }
      })}
    >

      <View style={styles.imageWrapper}>
        <HotelImage
          source={room.property?.coverImage ? { uri: room.property.coverImage } : (room.property?.images?.[0] ? { uri: room.property.images[0] } : (room.images?.[0] ? { uri: room.images[0] } : require('../../assets/images/image7.png')))}
          style={styles.cardImg}
        />

        <TouchableOpacity style={styles.heart} onPress={onRemove}>
          <Ionicons name="heart" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>

        <View style={styles.rowBetween}>
          <Text style={styles.hotelName}>{room.property?.name || room.type}</Text>

          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#F4A261" />
            <Text style={styles.ratingText}>4.90</Text>
          </View>
        </View>

        <Text style={styles.details} numberOfLines={1}>
          {room.property?.address || room.type}
        </Text>

        <Text style={styles.price}>
          ₹{room.basePrice || room.pricePerNight} per night
        </Text>

      </View>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFECEC',
  },

  /* HEADER */

  headerContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    overflow: 'hidden',
    zIndex: 1000,
    backgroundColor: '#FFF',
  },

  headerImg: {
    width,
    alignItems: 'center',
  },

  headerRadius: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#fff',
  },

  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 0,
  },

  menuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },

  headerSubtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 22,
    color: '#fff',
    opacity: 0.9,
  },

  /* CARD */

  card: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
  },

  imageWrapper: {
    width: '100%',
    height: 220,
  },

  cardImg: {
    width: '100%',
    height: '100%',
  },

  heart: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,0,0,0.7)', // Red background to indicate it's favorited
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    padding: 16,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hotelName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#000',
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#555',
  },

  details: {
    marginTop: 6,
    fontSize: 12,
    color: '#555',
  },

  price: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#2F2E2E',
  },

  // Sort Menu
  sortMenu: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 2000,
    minWidth: 200,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#FFF5ED',
  },
  sortText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  sortTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#C26A2C',
  },
});
