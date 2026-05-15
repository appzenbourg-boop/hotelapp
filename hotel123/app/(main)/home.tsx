import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
  Switch,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { Stack, router, useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';
import HotelImage from '../../components/HotelImage';

import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { bookingsAPI, hotelAPI, amenitiesAPI, notificationsAPI } from '../../services/api';
import { ActivityIndicator } from 'react-native';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigationContext } from '../../context/NavigationContext';
import { useNotifications } from '../../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function Home() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { location, refreshLocation } = useLocation();
  const t = useTranslation();
  const { setLastMainTab } = useNavigationContext();
  
  useFocusEffect(
    React.useCallback(() => {
      setLastMainTab('/(main)/home');
    }, [])
  );
  
  const [dndEnabled, setDndEnabled] = useState(false);

  // SWR for Active Booking
  const { data: activeStay, mutate: mutateStay, isLoading: stayLoading } = useSWR(
    token ? ['active_booking', token] : null,
    async () => {
      const res = await bookingsAPI.getActive(token);
      if (res.success && res.bookings?.length > 0) return res.bookings[0];
      const upcoming = await bookingsAPI.getUpcoming(token);
      if (upcoming.success && upcoming.bookings?.length > 0) return upcoming.bookings[0];
      return null;
    }
  );
  
  // Notification Watcher via Global Context
  const { unreadCount } = useNotifications();

  const hasNotifications = unreadCount > 0;

  const handleNotificationPress = () => {
    router.push('/(main)/notifications');
  };

  // Parallel fetch for Property level amenities as immediate fallback
  const { data: fallbackPropAmenities } = useSWR(
    activeStay?.room?.propertyId ? ['home_prop_amenities', activeStay.room.propertyId] : null,
    async () => {
      const res = await amenitiesAPI.getAll(activeStay.room.propertyId);
      return Array.isArray(res) ? res : (res?.amenities || res?.value || []);
    }
  );

  // Dynamic Dashboard Services feed from DB / Admin dashboard
  const { data: dashboardServicesData } = useSWR(
    activeStay?.room?.propertyId ? ['dashboard_services', activeStay.room.propertyId] : null,
    () => amenitiesAPI.getDashboardServices(activeStay.room.propertyId)
  );

  // Compile operational display grid with safe static defaults matching previous known config
  const displayServices = dashboardServicesData?.services && dashboardServicesData.services.length > 0 
    ? dashboardServicesData.services 
    : [
        { name: "House Keeping", route: "/(services)/housekeeping", iconName: "sparkles-outline" },
        { name: "Open Door", route: "/(services)/door", iconName: "key-outline" },
        { name: "Wake-up Call", route: "/(services)/wakeup", iconName: "alarm-outline" },
        { name: "Toiletries", route: "/(services)/toiletries", iconName: "flask-outline" },
        { name: "Food Order", route: "/(services)/food", iconName: "fast-food-outline" },
        { name: "Spa Service", route: "/(services)/spa", iconName: "leaf-outline" }
      ];


  const [isFavorite, setIsFavorite] = useState(false);

  // Scroll animation
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 287 + insets.top;
  const NAV_STICKY_HEIGHT = 70 + insets.top;

  // Header background opacity (0 -> 1)
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Transparent header opacity (1 -> 0)
  const transparentHeaderOpacity = scrollY.interpolate({
    inputRange: [0, (HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT) / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Solid header opacity (0 -> 1)
  const solidHeaderOpacity = scrollY.interpolate({
    inputRange: [(HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT) / 2, HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const loading = stayLoading && !activeStay;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* STICKY ANIMATED NAVBAR CONTAINER */}
        <Animated.View style={[
            styles.headerSticky, 
            { 
              height: NAV_STICKY_HEIGHT, 
              paddingTop: insets.top + 5,
              backgroundColor: 'rgba(239, 236, 236, 1)',
              opacity: headerBgOpacity,
              elevation: 4,
              shadowOpacity: 0.1,
            }
        ]} />

        {/* HEADER CONTENT (Absolute layers for cross-fade) */}
        <View style={[styles.headerSticky, { height: NAV_STICKY_HEIGHT, paddingTop: insets.top + 5, backgroundColor: 'transparent', elevation: 0 }]}>
            <View style={styles.headerTopRow}>
                {/* MENU BUTTON */}
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                    <View style={styles.iconStack}>
                        <Animated.View style={{ opacity: transparentHeaderOpacity }}>
                            <Ionicons name="menu" color="#FFFFFF" size={28} />
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: solidHeaderOpacity }]}>
                            <Ionicons name="menu" color="#2F2E2E" size={28} />
                        </Animated.View>
                    </View>
                </TouchableOpacity>

                {/* LOCATION SELECTOR */}
                <TouchableOpacity 
                    style={styles.locationSelector}
                    onPress={() => router.push('/(main)/location-selector')}
                    activeOpacity={0.7}
                >
                    <View style={styles.locationContent}>
                        <View style={styles.locationLabelRow}>
                            <View style={styles.textStack}>
                                <Animated.Text style={[styles.locationTitle, { color: '#FFFFFF', opacity: transparentHeaderOpacity }]}>
                                    {location.city || 'Detecting...'}
                                </Animated.Text>
                                <Animated.Text style={[styles.locationTitle, { position: 'absolute', color: '#2F2E2E', opacity: solidHeaderOpacity }]}>
                                    {location.city || 'Detecting...'}
                                </Animated.Text>
                            </View>
                            <View style={[styles.iconStack, { marginLeft: 4 }]}>
                                <Animated.View style={{ opacity: transparentHeaderOpacity }}>
                                    <Ionicons name="chevron-down" color="#FFFFFF" size={14} />
                                </Animated.View>
                                <Animated.View style={[StyleSheet.absoluteFill, { opacity: solidHeaderOpacity }]}>
                                    <Ionicons name="chevron-down" color="#2F2E2E" size={14} />
                                </Animated.View>
                            </View>
                        </View>
                        <View style={styles.textStack}>
                            <Animated.Text style={[styles.locationSub, { color: '#FFFFFF', opacity: transparentHeaderOpacity }]}>
                                {location.address || 'Click to refresh'}
                            </Animated.Text>
                            <Animated.Text style={[styles.locationSub, { position: 'absolute', color: '#2F2E2E', opacity: solidHeaderOpacity }]}>
                                {location.address || 'Click to refresh'}
                            </Animated.Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* NOTIFICATION BELL */}
                <TouchableOpacity
                    style={[styles.headerIconButton, { marginRight: 10 }]}
                    onPress={handleNotificationPress}
                >
                    <View style={styles.iconStack}>
                        <Animated.View style={{ opacity: transparentHeaderOpacity }}>
                            <Ionicons name="notifications-outline" color="#FFFFFF" size={24} />
                            {hasNotifications && (
                              <View style={{
                                position: 'absolute', top: 2, right: 2,
                                width: 9, height: 9, borderRadius: 4.5,
                                backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#000'
                              }} />
                            )}
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: solidHeaderOpacity }]}>
                            <Ionicons name="notifications-outline" color="#2F2E2E" size={24} />
                            {hasNotifications && (
                              <View style={{
                                position: 'absolute', top: 2, right: 2,
                                width: 9, height: 9, borderRadius: 4.5,
                                backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFF'
                              }} />
                            )}
                        </Animated.View>
                    </View>
                </TouchableOpacity>

                {/* SEARCH BUTTON */}
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => router.push('/(main)/search')}
                >
                    <View style={styles.iconStack}>
                        <Animated.View style={{ opacity: transparentHeaderOpacity }}>
                            <Ionicons name="search" color="#FFFFFF" size={24} />
                        </Animated.View>
                        <Animated.View style={[StyleSheet.absoluteFill, { opacity: solidHeaderOpacity }]}>
                            <Ionicons name="search" color="#2F2E2E" size={24} />
                        </Animated.View>
                    </View>
                </TouchableOpacity>
            </View>
        </View>

        <Animated.ScrollView 
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
            showsVerticalScrollIndicator={false}
        >
          {/* HERO IMAGE */}
          <ImageBackground
            source={require('../../assets/images/image4.png')}
            style={[styles.heroImage, { height: HEADER_MAX_HEIGHT, paddingTop: insets.top + 80 }]}
            imageStyle={styles.heroImageRadius}
          >
            <View style={styles.overlay} />
            <Animated.Text style={[styles.heroText, { opacity: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
                extrapolate: 'clamp'
            }) }]}>
              {t('welcome_message') || 'Enjoy your stay at'} {activeStay?.room?.property?.name || 'Stay In'}
            </Animated.Text>
          </ImageBackground>

          {/* DND */}
          <View style={styles.dndRow}>
            <Text style={styles.dndText}>{t('dnd_mode') || 'Do Not Disturb (DND)'}</Text>
            <Switch
              value={dndEnabled}
              onValueChange={setDndEnabled}
              trackColor={{ false: '#CFCFCF', true: '#2F2E2E' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* HOTEL CARD */}
          <View style={styles.card}>
            {loading ? (
              <View style={{ padding: 20 }}>
                <Skeleton height={200} borderRadius={25} />
                <View style={{ marginTop: 20, gap: 10 }}>
                   <Skeleton width="60%" height={24} />
                   <Skeleton width="40%" height={16} />
                   <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <Skeleton width="30%" height={60} borderRadius={15} />
                      <Skeleton width="30%" height={60} borderRadius={15} />
                      <Skeleton width="30%" height={60} borderRadius={15} />
                   </View>
                </View>
              </View>
            ) : activeStay ? (
              <View>
                <View style={styles.cardImageWrapper}>
                  <HotelImage
                    source={activeStay.room?.images?.[0] ? { uri: activeStay.room.images[0] } : require('../../assets/images/image5.png')}
                    style={styles.cardImage}
                  />
                  <TouchableOpacity 
                    style={styles.favIcon}
                    onPress={async () => {
                      if (isFavorite) {
                        setIsFavorite(false);
                        return;
                      }
                      try {
                        const { favoritesAPI } = require('../../services/api');
                        await favoritesAPI.add(token || '', activeStay.roomId);
                        setIsFavorite(true);
                      } catch (e) {
                         console.error(e);
                      }
                    }}
                  >
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color={isFavorite ? "#FF4b4b" : "#FFF"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.hotelName}>{activeStay.room?.property?.name || 'Zenbourg Hotel'}</Text>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={14} color="#000" />
                      <Text style={styles.ratingText}>4.90 (200)</Text>
                    </View>
                  </View>


                  <Text style={styles.detailsText}>
                    Room {activeStay.room?.roomNumber} · {activeStay.numberOfGuests} Guests
                  </Text>

                  <Text style={styles.priceText}>
                    ₹{activeStay.totalAmount} Total · {activeStay.status}
                  </Text>


                  <View style={styles.stayActionRow}>
                    <TouchableOpacity 
                      style={styles.stayActionBtn}
                      onPress={() => router.push('/(main)/extend-stay')}
                    >
                      <Ionicons name="time-outline" size={20} color="#C26A2C" />
                      <Text style={styles.stayActionText}>Extend Stay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.stayActionBtn}
                      onPress={() => router.push('/(main)/upgrade')}
                    >
                      <Ionicons name="trending-up-outline" size={20} color="#C26A2C" />
                      <Text style={styles.stayActionText}>Upgrade Room</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.amenityRow}>
                    {Array.from(new Set([
                      ...(activeStay.room?.amenities || []), 
                      ...(activeStay.room?.property?.amenities?.map((a: any) => a.name) || []),
                      ...(Array.isArray(fallbackPropAmenities) ? fallbackPropAmenities.map((a: any) => a.name) : [])
                    ])).map((amenity: any, idx: number) => (
                      <View key={idx} style={styles.amenityBadge}>
                        <Ionicons name="sparkles-outline" size={12} color="#666" style={{ marginRight: 4 }} />
                        <Text style={styles.amenityText}>{amenity}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.serviceGrid}>
                    {displayServices.map((svc: any, sIdx: number) => (
                      <ServiceButton 
                        key={sIdx} 
                        label={svc.name} 
                        route={svc.route || '/(services)/general'} 
                        icon={svc.iconName || 'help-circle-outline'} 
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="calendar-outline" size={48} color="#D0D0D0" />
                <Text style={{ marginTop: 12, fontFamily: 'Inter-Bold', fontSize: 18 }}>{t('no_bookings_yet') || 'No bookings, yet!'}</Text>
                <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>{t('search_next_destination') || 'Search for your next destination & start booking now'}</Text>
                <TouchableOpacity 
                    style={styles.bookNowBtn}
                    onPress={() => router.push('/(main)/book')}
                >
                    <Text style={styles.bookNowBtnText}>{t('book_now') || 'Book now'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
            {activeStay && (
                <TouchableOpacity
                  style={styles.outlineButtonBelow}
                  onPress={() => {
                      if (activeStay.status === 'CHECKED_IN') {
                        router.push({
                          pathname: '/(main)/checkout',
                          params: { bookingId: activeStay.id }
                        });
                      } else {
                        router.push({
                          pathname: '/(main)/checkin',
                          params: { bookingId: activeStay.id }
                        });
                      }
                  }}
                >
                  <Text style={styles.buttonText}>
                    {activeStay.status === 'CHECKED_IN' ? (t('checkout') || 'Check-out') : (t('checkin') || 'Check-in')} →
                  </Text>
                </TouchableOpacity>
            )}

          <TouchableOpacity
            style={[styles.outlineButtonBelow, { marginTop: 12 }]}
            onPress={() => router.push('/(main)/bookings')}
          >
            <Text style={styles.buttonText}>View All Bookings →</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
        <BottomNav activeTab="home" />
      </View>
    </>
  );
}


function ServiceButton({ label, route, icon }: any) {
  return (
    <View style={styles.serviceItem}>
      <TouchableOpacity
        style={styles.serviceButton}
        onPress={() => router.push(route)}
      >
        <Ionicons name={icon} size={32} color="#C26A2C" />
      </TouchableOpacity>
      <Text style={styles.serviceText}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFECEC' },
  headerSticky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    paddingHorizontal: 22,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  heroImage: { width, paddingHorizontal: 22 },
  heroImageRadius: { borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  locationSelector: { flex: 1, marginHorizontal: 10, alignItems: 'center' },
  locationContent: { alignItems: 'center' },
  locationLabelRow: { flexDirection: 'row', alignItems: 'center' },
  locationTitle: { fontSize: 16, fontFamily: 'Inter-Bold' },
  locationSub: { fontSize: 10, fontFamily: 'Inter-Regular' },
  heroText: { marginTop: 10, fontFamily: 'Inter-Bold', fontSize: 24, color: '#FFFFFF' },
  iconStack: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  textStack: { alignItems: 'center', justifyContent: 'center' },
  dndRow: { marginTop: 24, paddingHorizontal: 27, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dndText: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#2F2E2E' },
  card: { marginTop: 20, marginHorizontal: 27, backgroundColor: '#FFFFFF', borderRadius: 30, overflow: 'hidden', paddingBottom: 20 },
  cardImageWrapper: { width: '100%', height: 250, borderRadius: 35, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  favIcon: { position: 'absolute', top: 18, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotelName: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: '#000000' },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 4, fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#696767' },
  detailsText: { marginTop: 6, fontFamily: 'Inter-Regular', fontSize: 13, color: '#0000008F' },
  priceText: { marginTop: 4, fontFamily: 'Inter-Regular', fontSize: 13, color: '#2F2E2E' },
  serviceGrid: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceItem: { width: '30%', alignItems: 'center', marginBottom: 20 },
  serviceButton: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5
  },
  serviceText: { marginTop: 8, fontSize: 12, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  stayActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  stayActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#C26A2C',
    borderRadius: 15,
    height: 48,
    gap: 8,
  },
  stayActionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#C26A2C',
  },
  bookNowBtn: { marginTop: 20, backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  bookNowBtnText: { color: '#FFF', fontSize: 14, fontFamily: 'Inter-Bold' },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  amenityText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: 'Inter-Medium',
  },
  outlineButtonBelow: { marginTop: 16, marginHorizontal: 27, height: 50, borderRadius: 30, borderWidth: 1, borderColor: '#2F2E2E', justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#2F2E2E' },
  chatAssistCard: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  chatAssistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAssistIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAssistTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#000',
  },
  chatAssistSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
