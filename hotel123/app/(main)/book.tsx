import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  StatusBar,
  ImageBackground,
  Animated,
  Alert,
  Pressable,
} from 'react-native';
import { Stack, router, useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import BottomNav from '../../components/BottomNav';
import OptimizedImage from '../../components/OptimizedImage';
import { hotelAPI, calculateDistance, favoritesAPI, roomsAPI, notificationsAPI } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useNavigationContext } from '../../context/NavigationContext';

const STATES = [
    { id: '1', name: 'Maharashtra', key: 'maharashtra', image: require('../../assets/images/monument_maharashtra.jpg') },
    { id: '2', name: 'West Bengal', key: 'west_bengal', image: require('../../assets/images/monument_bengali.jpg') },
    { id: '3', name: 'Odisha', key: 'odisha', image: require('../../assets/images/monument_odia.jpg') },
    { id: '4', name: 'Delhi', key: 'delhi', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '5', name: 'Karnataka', key: 'karnataka', image: require('../../assets/images/monument_karnataka.jpg') },
    { id: '6', name: 'Tamil Nadu', key: 'tamil_nadu', image: require('../../assets/images/monument_maharashtra.jpg') },
    { id: '7', name: 'Rajasthan', key: 'rajasthan', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '8', name: 'Gujarat', key: 'gujarat', image: require('../../assets/images/monument_karnataka.jpg') },
    { id: '9', name: 'Kerala', key: 'kerala', image: require('../../assets/images/monument_odia.jpg') },
    { id: '10', name: 'Goa', key: 'goa', image: require('../../assets/images/monument_bengali.jpg') },
    { id: '11', name: 'Uttar Pradesh', key: 'uttar_pradesh', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '12', name: 'Punjab', key: 'punjab', image: require('../../assets/images/monument_maharashtra.jpg') },
    { id: '13', name: 'Telangana', key: 'telangana', image: require('../../assets/images/monument_karnataka.jpg') },
    { id: '14', name: 'Himachal Pradesh', key: 'himachal_pradesh', image: require('../../assets/images/monument_odia.jpg') },
    { id: '15', name: 'Andhra Pradesh', key: 'andhra_pradesh', image: require('../../assets/images/monument_bengali.jpg') },
    { id: '16', name: 'Uttarakhand', key: 'uttarakhand', image: require('../../assets/images/monument_odia.jpg') },
    { id: '17', name: 'Haryana', key: 'haryana', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '18', name: 'Jammu & Kashmir', key: 'jammu_kashmir', image: require('../../assets/images/monument_odia.jpg') },
    { id: '19', name: 'Bihar', key: 'bihar', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '20', name: 'Jharkhand', key: 'jharkhand', image: require('../../assets/images/monument_karnataka.jpg') },
    { id: '21', name: 'Assam', key: 'assam', image: require('../../assets/images/monument_odia.jpg') },
    { id: '22', name: 'Madhya Pradesh', key: 'madhya_pradesh', image: require('../../assets/images/monument_delhi.jpg') },
    { id: '23', name: 'Chhattisgarh', key: 'chhattisgarh', image: require('../../assets/images/monument_karnataka.jpg') },
    { id: '24', name: 'Puducherry', key: 'puducherry', image: require('../../assets/images/monument_maharashtra.jpg') },
    { id: '25', name: 'Chandigarh', key: 'chandigarh', image: require('../../assets/images/monument_delhi.jpg') },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerContainer: { position: 'absolute', top: 0, width: '100%', overflow: 'hidden', zIndex: 1000 },
  headerContent: { paddingHorizontal: 16, width: '100%' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  locationSelector: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
  locationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center' },
  locationTitle: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#000', marginRight: 4, maxWidth: 120 },
  locationSub: { fontSize: 10, fontFamily: 'Inter-Regular', color: '#333', marginTop: 2, textAlign: 'center', maxWidth: 150 },

  searchWrapper: { width: '100%', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, paddingHorizontal: 15, width: '100%' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter-Regular', color: '#000' },
  clearIcon: { marginLeft: 10 },

  menuBtn: { backgroundColor: 'transparent', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  statesSection: { marginTop: 10, paddingHorizontal: 22 },
  statesList: { paddingVertical: 5, paddingLeft: 0 },
  stateCircle: { alignItems: 'center', marginRight: 24, width: 72 },
  stateIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, position: 'relative', borderWidth: 3, borderColor: 'transparent' },
  stateIconBoxSelected: { borderColor: '#C26A2C' },
  stateMonumentImage: { width: '100%', height: '100%' },
  stateActiveDot: { position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#C26A2C', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  stateLabel: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#666', marginTop: 8, textAlign: 'center' },
  stateLabelSelected: { color: '#000', fontFamily: 'Inter-Bold' },

  hotelsSection: { marginTop: 30, paddingHorizontal: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#1A1A1A' },
  sectionSubtitle: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#666', marginTop: 4 },
  
  filterBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF5ED', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C26A2C',
  },
  filterBtnText: { 
    marginLeft: 6, 
    fontSize: 13, 
    fontFamily: 'Inter-SemiBold', 
    color: '#C26A2C' 
  },

  sortContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  sortOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
  sortOptionTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#C26A2C',
  },

  card: { backgroundColor: '#FFF', borderRadius: 30, marginBottom: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardImg: { width: '100%', height: 220 },
  cardInfo: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotelName: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#1A1A1A', flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  ratingText: { marginLeft: 6, fontSize: 13, fontFamily: 'Inter-Bold', color: '#FFA000' },
  locationDetail: { fontSize: 14, color: '#666', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  priceTag: { fontSize: 15, color: '#2E7D32', fontFamily: 'Inter-SemiBold' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  distanceText: { marginLeft: 6, fontSize: 12, color: '#444', fontFamily: 'Inter-Bold' },

  loadMoreBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, backgroundColor: '#FFF', borderRadius: 15, borderStyle: 'dotted', borderWidth: 1, borderColor: '#C26A2C', marginTop: 10 },
  loadMoreText: { color: '#C26A2C', fontSize: 15, fontFamily: 'Inter-Bold' },

  centerBox: { height: 250, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 15 },
  resetBtn: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  resetBtnText: { color: '#C26A2C', fontFamily: 'Inter-Bold', fontSize: 14 }
});

const StateItem = React.memo(({ item, selected, onPress, t }: any) => (
    <TouchableOpacity 
        style={styles.stateCircle}
        activeOpacity={0.8}
        onPress={() => onPress(item.name)}
    >
        <View style={[styles.stateIconBox, selected && styles.stateIconBoxSelected]}>
            <Image 
                source={item.image} 
                style={styles.stateMonumentImage} 
                resizeMode="cover"
            />
            {selected && (
                <View style={styles.stateActiveDot}><Ionicons name="checkmark" size={12} color="#FFF" /></View>
            )}
        </View>
        <Text style={[styles.stateLabel, selected && styles.stateLabelSelected]}>{t(item.key)}</Text>
    </TouchableOpacity>
));

export default function Book() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { location } = useLocation();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sortBy, setSortBy] = useState<'distance' | 'price-low' | 'price-high' | 'rating' | 'name-az' | 'name-za'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { favorites, toggleFavorite, favoriteData, isLoading: favsLoading } = useFavorites();
  const { setLastMainTab } = useNavigationContext();

  useFocusEffect(
    React.useCallback(() => {
      setLastMainTab('/(main)/book');
      setShowFilters(false); // Reset menu state on focus
    }, [])
  );

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

  const applySorting = (hotelList: any[], sort: string) => {
    const sorted = [...hotelList];
    if (sort === 'distance' && location.coords) {
      return sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (sort === 'price-low') {
      return sorted.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
    } else if (sort === 'price-high') {
      return sorted.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
    } else if (sort === 'rating') {
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'name-az') {
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'name-za') {
      return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }
    return sorted;
  };

  // SWR for Hotels
  const { data: rawHotels = [], isLoading: loading, mutate: mutateHotels } = useSWR(
    ['hotels_list', searchQuery, selectedState, location.city, location.coords?.latitude],
    async () => {
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedState) filters.location = selectedState;
      else if (searchQuery) filters.location = location.city;
      
      const res = await hotelAPI.getAll(filters);
      let result = [];
      if (Array.isArray(res)) result = res;
      else if (res?.data && Array.isArray(res.data)) result = res.data;
      else if (res?.properties && Array.isArray(res.properties)) result = res.properties;
      else if (res && typeof res === 'object') result = [res];

      if (location.coords && result.length > 0) {
        result = result.map(h => ({
          ...h,
          distance: calculateDistance(
            location.coords!.latitude, 
            location.coords!.longitude,
            h.latitude || 0,
            h.longitude || 0
          )
        }));
      }
      return result;
    },
    { revalidateOnFocus: false }
  );

  const hotels = React.useMemo(() => applySorting(rawHotels, sortBy), [rawHotels, sortBy, location.coords]);
  const t = useTranslation();

  // Scroll animation - use native driver for smooth 60fps
  const scrollY = useRef(new Animated.Value(0)).current;
  const isHeaderCollapsedRef = useRef(false);
  
  const HEADER_MAX_HEIGHT = 280;
  const HEADER_MIN_HEIGHT = insets.top + 60;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  // Use translateY to shrink the header (native driver compatible)
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -(HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT)],
    extrapolate: 'clamp',
  });
  
  // Fade out background image
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // Show/hide expanded layout
  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  // Show/hide collapsed layout
  const collapsedOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Compensate collapsed bar position as header slides up
  const collapsedTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const handleStatePress = useCallback((stateName: string) => {
      setSelectedState(current => current === stateName ? null : stateName);
  }, []);

  const handleToggleFavorite = async (propertyId: string, hotel: any) => {
    try {
        await toggleFavorite(propertyId, hotel);
    } catch (error) {
        console.error('❌ Error toggling favorite:', error);
        Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const renderStateItem = useCallback(({ item }: any) => (
      <StateItem item={item} selected={selectedState === item.name} onPress={handleStatePress} t={t} />
  ), [selectedState, t, handleStatePress]);

  const renderHotelItem = ({ item }: { item: any }) => {
    const isFavorite = favorites.has(item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/(main)/hotel-details', params: { propertyId: item.id, propertyName: item.name } })}
      >
        <View style={{ position: 'relative' }}>
          <OptimizedImage 
            source={item.coverImage ? { uri: item.coverImage } : (item.images?.[0] ? { uri: item.images[0] } : require('../../assets/images/image7.png'))} 
            style={styles.cardImg}
            priority="normal"
          />
          <TouchableOpacity 
            style={{
              position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: 20,
              backgroundColor: isFavorite ? '#C26A2C' : 'rgba(255,255,255,0.9)',
              justifyContent: 'center', alignItems: 'center', elevation: 4,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
            }}
            onPress={(e) => { e.stopPropagation(); handleToggleFavorite(item.id, item); }}
            activeOpacity={0.7}
          >
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FFF" : "#C26A2C"} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
              <Text style={styles.hotelName}>{item.name}</Text>
              <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#FFA000" /><Text style={styles.ratingText}>4.9</Text>
              </View>
          </View>
          <Text style={styles.locationDetail}>{item.address || 'Location information'}</Text>
          <View style={styles.cardFooter}>
              <Text style={styles.priceTag}>Luxurious Stay</Text>
              {item.distance !== undefined && (
                  <View style={styles.distanceBadge}>
                      <Ionicons name="location" size={12} color="#666" /><Text style={styles.distanceText}>{item.distance.toFixed(1)} km</Text>
                  </View>
              )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleLoadMore = () => setVisibleCount(prev => prev + 10);
  const displayedHotels = hotels.slice(0, visibleCount);

  // Track scroll position via ref (no re-renders)
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      isHeaderCollapsedRef.current = value > HEADER_SCROLL_DISTANCE / 2;
    });
    return () => scrollY.removeListener(listenerId);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ANIMATED HEADER - ORIGINAL DESIGN WITH SMOOTH TRANSITIONS */}
      <Animated.View style={[styles.headerContainer, { height: HEADER_MAX_HEIGHT, backgroundColor: '#FFF', transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
            <ImageBackground
                source={require('../../assets/images/image4.png')}
                style={{ width: '100%', height: '100%' }}
                imageStyle={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
            >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }]} />
            </ImageBackground>
        </Animated.View>
        
        <View style={[styles.headerContent, { paddingTop: insets.top + 10 }]}>
            {/* EXPANDED LAYOUT - Original Design */}
            <Animated.View 
              style={{ 
                opacity: expandedOpacity,
                width: '100%',
              }} 
              pointerEvents="auto"
            >
              <View style={[styles.headerTopRow, { height: 44 }]}>
                  <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
                      <Ionicons name="menu" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.locationSelector} onPress={() => router.push('/(main)/location-selector')} activeOpacity={0.7}>
                      <View style={styles.locationPill}>
                          <Ionicons name="location" size={18} color="#C26A2C" style={{ marginRight: 4 }} />
                          <Text style={styles.locationTitle} numberOfLines={1}>{location.city || 'Detecting...'}</Text>
                          <Ionicons name="chevron-down" size={12} color="#000" />
                      </View>
                      <Text style={styles.locationSub} numberOfLines={1}>
                          {location.address || 'Detecting Area...'}
                      </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleNotificationPress} style={styles.menuBtn}>
                      <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                      {hasNotifications && (
                        <View style={{
                          position: 'absolute', top: 6, right: 8,
                          width: 9, height: 9, borderRadius: 4.5,
                          backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#000'
                        }} />
                      )}
                  </TouchableOpacity>
              </View>
              
              <View style={[styles.searchWrapper, { marginTop: 12 }]}>
                  <View style={[styles.searchContainer, { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: '#DDD', height: 48, elevation: 6 }]}>
                      <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                      <TextInput
                          placeholder={t('searchPlaceholder') || "Search hotels..."}
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholderTextColor="#AAA"
                      />
                      {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                              <Ionicons name="close-circle" size={18} color="#999" />
                          </TouchableOpacity>
                      )}
                  </View>
              </View>
            </Animated.View>

            {/* COLLAPSED LAYOUT - Hamburger | Search | Location */}
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
                  transform: [{ translateY: collapsedTranslateY }],
                }
              ]}
              pointerEvents="box-none"
            >
              {/* Menu Button */}
              <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
                  <Ionicons name="menu" size={28} color="#000" />
              </TouchableOpacity>
              
              {/* Search Bar - Center */}
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <View style={[styles.searchContainer, { backgroundColor: "#FFF", borderWidth: 1, borderColor: '#E0E0E0', height: 44, elevation: 2 }]}>
                    <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
                    <TextInput
                        placeholder="Search..."
                        style={[styles.searchInput, { fontSize: 14 }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#AAA"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
              </View>
              
              {/* Location & Notification Cluster */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={() => router.push('/(main)/location-selector')} 
                  style={[styles.menuBtn, { width: 40, height: 44 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={22} color="#C26A2C" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handleNotificationPress} 
                  style={[styles.menuBtn, { width: 40, height: 44 }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications-outline" size={22} color="#000" />
                  {hasNotifications && (
                    <View style={{
                      position: 'absolute', top: 8, right: 6,
                      width: 9, height: 9, borderRadius: 4.5,
                      backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFF'
                    }} />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={{ height: HEADER_MAX_HEIGHT }} />

        <View style={styles.statesSection}>
            <Text style={styles.sectionTitle}>{t('explore_destinations')}</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={STATES}
                renderItem={renderStateItem}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.statesList, { paddingRight: 22 }]}
                extraData={selectedState}
            />
        </View>

        <View style={styles.hotelsSection}>
            <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                      {searchQuery ? `Results for "${searchQuery}"` : selectedState ? `Hotels in ${selectedState}` : location.coords ? 'Hotels Near You' : t('available_hotels')}
                  </Text>
                  {location.coords && !selectedState && !searchQuery && (
                    <Text style={styles.sectionSubtitle}>
                      Sorted by distance from {location.city}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.filterBtn}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons name="options-outline" size={20} color="#C26A2C" />
                  <Text style={styles.filterBtnText}>Sort</Text>
                </TouchableOpacity>
            </View>

            {/* Sort Options - In Flow */}
            {showFilters && (
              <View style={styles.sortContainer}>
                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'distance' && styles.sortOptionActive]}
                  onPress={() => { setSortBy('distance'); setShowFilters(false); }}
                >
                  <Ionicons name="location-outline" size={18} color={sortBy === 'distance' ? '#C26A2C' : '#666'} />
                  <Text style={[styles.sortOptionText, sortBy === 'distance' && styles.sortOptionTextActive]}>
                    Nearest First
                  </Text>
                  {sortBy === 'distance' && <Ionicons name="checkmark" size={18} color="#C26A2C" />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'price-low' && styles.sortOptionActive]}
                  onPress={() => { setSortBy('price-low'); setShowFilters(false); }}
                >
                  <Ionicons name="cash-outline" size={18} color={sortBy === 'price-low' ? '#C26A2C' : '#666'} />
                  <Text style={[styles.sortOptionText, sortBy === 'price-low' && styles.sortOptionTextActive]}>
                    Price: Low to High
                  </Text>
                  {sortBy === 'price-low' && <Ionicons name="checkmark" size={18} color="#C26A2C" />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'price-high' && styles.sortOptionActive]}
                  onPress={() => { setSortBy('price-high'); setShowFilters(false); }}
                >
                  <Ionicons name="cash-outline" size={18} color={sortBy === 'price-high' ? '#C26A2C' : '#666'} />
                  <Text style={[styles.sortOptionText, sortBy === 'price-high' && styles.sortOptionTextActive]}>
                    Price: High to Low
                  </Text>
                  {sortBy === 'price-high' && <Ionicons name="checkmark" size={18} color="#C26A2C" />}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'rating' && styles.sortOptionActive]}
                  onPress={() => { setSortBy('rating'); setShowFilters(false); }}
                >
                  <Ionicons name="star-outline" size={18} color={sortBy === 'rating' ? '#C26A2C' : '#666'} />
                  <Text style={[styles.sortOptionText, sortBy === 'rating' && styles.sortOptionTextActive]}>
                    Highest Rated
                  </Text>
                  {sortBy === 'rating' && <Ionicons name="checkmark" size={18} color="#C26A2C" />}
                </TouchableOpacity>
              </View>
            )}


            
            {(loading || refreshing) && <ActivityIndicator size="small" color="#C26A2C" style={{ marginVertical: 20 }} />}
            
                {displayedHotels.length > 0 ? (
                    <>
                        <View>
                            {displayedHotels.map((hotel) => (
                                <View key={hotel.id}>{renderHotelItem({ item: hotel })}</View>
                            ))}
                        </View>
                        {hotels.length > visibleCount && (
                            <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.7}>
                                <Text style={styles.loadMoreText}>Show 10 More Hotels</Text>
                                <Ionicons name="chevron-down" size={16} color="#C26A2C" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        )}
                    </>
                ) : !loading && (
                    <View style={styles.centerBox}>
                        <Ionicons name="business-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No hotels found for "{searchQuery || location.city}".</Text>
                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedState(null); setSearchQuery(''); mutateHotels(); }}>
                            <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {loading && (
                    <View style={{ gap: 20 }}>
                        {[1, 2].map(i => (
                          <View key={i} style={styles.card}>
                            <Skeleton height={220} />
                            <View style={{ padding: 20, gap: 10 }}>
                               <Skeleton width="60%" height={20} />
                               <Skeleton width="40%" height={15} />
                               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                  <Skeleton width="30%" height={20} />
                                  <Skeleton width="25%" height={20} />
                                </View>
                            </View>
                          </View>
                        ))}
                    </View>
                )}
        </View>
      </Animated.ScrollView>
      <BottomNav activeTab="book" />

      {/* Sort Menu Overlay - Closes menu when clicking outside */}
      {showFilters && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} 
          onPress={() => setShowFilters(false)} 
        />
      )}

    </View>
  );
}
