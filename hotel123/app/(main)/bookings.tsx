import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Disabled for Expo Go compatibility
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import BottomNav from '../../components/BottomNav';
import HotelImage from '../../components/HotelImage';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, notificationsAPI, API_CONFIG } from '../../services/api';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { useNavigationContext } from '../../context/NavigationContext';
import AnimatedButton from '../../components/AnimatedButton';
import FadeInView from '../../components/FadeInView';
import SkeletonView from '../../components/SkeletonView';
import { Animations } from '../../constants/Animations';


const { width } = Dimensions.get('window');

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { token } = useAuth();
  const t = useTranslation();
  const [tab, setTab] = useState<'current' | 'past' | 'cancelled'>('current');
  const { setLastMainTab } = useNavigationContext();

  useFocusEffect(
    React.useCallback(() => {
      setLastMainTab('/(main)/bookings');
      setShowSortMenu(false); // Reset menu state on focus
    }, [])
  );

  const [dnd, setDnd] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  
  // 📡 REAL-TIME DYNAMIC NOTIFICATIONS
  const { data: notifData, mutate: mutateNotifs } = useSWR(
    token ? 'notifications_list' : null,
    () => notificationsAPI.getNotifications(token!, true) // true means onlyUnread
  );
  const hasNotifications = !!(notifData?.notifications && notifData.notifications.length > 0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 5;

  const [sortBy, setSortBy] = useState<'createdAt' | 'price'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const HEADER_MAX_HEIGHT = 196 + insets.top;
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


  const { data: bookingData, isLoading: loading, mutate: mutateBookings } = useSWR(
    token ? ['bookings_list', tab, page, sortBy, order] : null,
    async () => {
      let statusQuery = '';
      if (tab === 'current') statusQuery = 'RESERVED,CHECKED_IN';
      else if (tab === 'past') statusQuery = 'CHECKED_OUT';
      else if (tab === 'cancelled') statusQuery = 'CANCELLED,NO_SHOW';
      
      const response = await bookingsAPI.getMyBookings(token!, statusQuery, page, LIMIT, sortBy, order);
      return response;
    },
    { 
      revalidateOnFocus: true,
      refreshInterval: 10000 // Poll every 10 seconds for real-time updates from admin
    }
  );

  useEffect(() => {
    if (bookingData?.bookings) {
      if (page === 1) {
        setBookings(bookingData.bookings);
      } else {
        setBookings(prev => {
          const combined = [...prev, ...bookingData.bookings];
          const unique = Array.from(new Set(combined.map(b => b.id))).map(id => combined.find(b => b.id === id));
          return unique;
        });
      }
      setTotal(bookingData.total || 0);
    }
  }, [bookingData, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([mutateBookings(), mutateNotifs()]);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && bookings.length < total) {
      setPage(prev => prev + 1);
    }
  };

  const handleSort = (newSort: 'createdAt' | 'price', newOrder: 'asc' | 'desc') => {
    setSortBy(newSort);
    setOrder(newOrder);
    setShowSortMenu(false);
    setPage(1);
    // useFocusEffect will trigger fetchBookings
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    // Start from a base date to get the time right or just parse string if it's "14:00"
    // But from DB it comes as ISO string for checkIn/checkOut
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to calculate nights between checkIn and checkOut
  const getNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const handleNotificationPress = () => {
    router.push('/(main)/notifications');
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const handleDownloadInvoice = async (bookingId: string) => {
    setDownloadingId(bookingId);
    try {
      const res = await bookingsAPI.getInvoice(token || '', bookingId);
      if (res.success && res.invoice) {
        await generateInvoicePDF(res.invoice);
      } else {
        throw new Error('Backend failed');
      }
    } catch (e) {
      console.log('Backend invoice failed, falling back to local generator...');
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const { generateInvoiceFromBooking } = require('../../utils/invoiceGenerator');
        await generateInvoiceFromBooking(booking);
      } else {
        Alert.alert('Notice', 'Generating standard invoice...');
        // Fallback to minimal data if find fails
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Track scroll position for layout switching
  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const shouldCollapse = value > HEADER_SCROLL_DISTANCE / 2;
      if (shouldCollapse !== isHeaderCollapsed) {
        setIsHeaderCollapsed(shouldCollapse);
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [isHeaderCollapsed]);

  return (
    <View style={styles.container}>
      {/* ANIMATED HEADER */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight, position: 'absolute', top: 0, width: '100%', zIndex: 1000 }]}>
        {/* Background Image with Fade */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          <Image
            source={require('../../assets/images/image6.png')}
            style={[styles.headerImage, { height: HEADER_MAX_HEIGHT }]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'transparent']}
            style={[styles.headerOverlay, { height: HEADER_MAX_HEIGHT }]}
          />
        </Animated.View>

        {/* EXPANDED LAYOUT */}
        <Animated.View 
          style={[
            styles.headerContent, 
            { 
              paddingTop: insets.top + 10, 
              opacity: expandedOpacity,
              position: 'absolute',
              width: '100%',
            }
          ]}
          pointerEvents={isHeaderCollapsed ? 'none' : 'auto'}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bookings</Text>
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

          <View style={styles.tabWrapper}>
            <View style={[styles.tabContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              {['current', 'past', 'cancelled'].map((tabKey) => (
                <TouchableOpacity
                  key={tabKey}
                  style={styles.tab}
                  onPress={() => setTab(tabKey as any)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      tab === tabKey && styles.activeTabText,
                    ]}
                  >
                    {t(tabKey)}
                  </Text>
                  {tab === tabKey && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
            <Text style={[styles.headerTitle, { color: '#000', fontSize: 18 }]}>Bookings</Text>
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


      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEventThrottle={8}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={{ height: HEADER_MAX_HEIGHT }} />

        {loading && bookings.length === 0 ? (
          <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <View style={styles.card}>
               <Skeleton height={250} borderRadius={35} />
               <View style={{ padding: 16, gap: 10 }}>
                  <Skeleton width="60%" height={20} />
                  <Skeleton width="80%" height={15} />
                  <View style={styles.divider} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width={80} height={40} />
                    <Skeleton width={80} height={40} />
                    <Skeleton width={80} height={40} />
                  </View>
               </View>
            </View>
          </View>
        ) : (
          <>
            {bookings.length === 0 && (
              <View style={{ marginTop: 50, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: '#666' }}>
                  No {tab} bookings found.
                </Text>
              </View>
            )}

            {/* CURRENT BOOKING */}
            {tab === 'current' && bookings.map((booking, idx) => (
              <FadeInView key={booking.id} delay={idx * 150} translateY={15}>
                <View style={styles.card}>
                  <HotelImage
                    source={booking.room?.images?.[0] ? { uri: booking.room.images[0] } : require('../../assets/images/image7.png')}
                    style={styles.cardImage}
                  />

                  <View style={styles.cardContent}>
                    <Text style={styles.hotelName}>{booking.room?.property?.name || 'Hotel Name'}</Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Location: </Text>
                      {booking.room?.property?.address || 'Unknown Location'}
                    </Text>

                    <Text style={styles.metaText}>
                      <Text style={styles.metaLabel}>Guests: </Text>
                      {booking.numberOfGuests} Guests
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.dateRow}>
                      <DateBlock date={formatDate(booking.checkIn)} time={formatTime(booking.checkIn)} />
                      <VerticalDivider />
                      <DateBlock date={formatDate(booking.checkOut)} time={formatTime(booking.checkOut)} />
                      <VerticalDivider />
                      <DateBlock date={getNights(booking.checkIn, booking.checkOut).toString()} time="Nights" />
                    </View>

                    <View style={styles.dndRow}>
                      <Text style={styles.dndText}>Do Not Disturb (DND)</Text>
                      <Switch value={dnd} onValueChange={setDnd} trackColor={{ false: "#767577", true: "#F4A261" }} />
                    </View>

                    {/* ⚠️ PENDING BALANCE ALERT / PAY BUTTON */}
                    {(booking.totalAmount > booking.paidAmount) && (
                      <View style={{ marginTop: 10, marginBottom: 5 }}>
                        <AnimatedButton
                          style={[styles.outlineButton, { backgroundColor: '#FEF2F2', borderColor: '#EF4444', borderStyle: 'solid' }]}
                          onPress={() => {
                            const outstanding = booking.totalAmount - booking.paidAmount;
                            router.push({
                              pathname: '/(services)/extend-payment',
                              params: {
                                amount: outstanding.toString(),
                                bookingData: JSON.stringify({
                                  bookingId: booking.id,
                                  amount: outstanding,
                                  type: 'TOPUP_BALANCE'
                                })
                              }
                            });
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                            <Text style={[styles.buttonText, { color: '#B91C1C', fontFamily: 'Inter-Bold' }]}>
                              Pay Pending Balance: ₹{(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </AnimatedButton>
                      </View>
                    )}

                    <AnimatedButton
                      style={styles.outlineButton}
                      onPress={() => router.push('/(main)/extend-stay')}
                    >
                      <Text style={styles.buttonText}>Extend Stay →</Text>
                    </AnimatedButton>

                    <AnimatedButton
                      style={styles.outlineButton}
                      onPress={() => router.push('/(main)/upgrade')}
                    >
                      <Text style={styles.buttonText}>Upgrade Stay →</Text>
                    </AnimatedButton>

                    {/* CHECKED_IN: chat with staff + checkout */}
                    {booking.status === 'CHECKED_IN' && (
                      <>
                        <AnimatedButton
                          style={[styles.outlineButton, { marginTop: 10, borderColor: '#1565C0' }]}
                          onPress={() => router.push({
                            pathname: '/(drawer)/live-support-chat',
                            params: {
                              bookingId: booking.id,
                              hotelName: booking.room?.property?.name || 'Hotel',
                              propertyId: booking.propertyId || booking.room?.propertyId || '',
                              hotelPhone: booking.room?.property?.phone || '',
                            }
                          })}
                        >
                          <Text style={[styles.buttonText, { color: '#1565C0' }]}>💬 Chat with Staff</Text>
                        </AnimatedButton>

                        <AnimatedButton
                          style={[styles.outlineButton, { marginTop: 10 }]}
                          onPress={() => router.push({ pathname: '/(main)/checkout', params: { bookingId: booking.id } })}
                        >
                          <Text style={styles.buttonText}>Check-out →</Text>
                        </AnimatedButton>
                      </>
                    )}

                    {/* RESERVED: check-in + cancel */}
                    {booking.status === 'RESERVED' && (
                      <>
                        <AnimatedButton
                          style={[styles.outlineButton, { marginTop: 10, borderColor: '#2E7D32' }]}
                          onPress={() => router.push({ pathname: '/(main)/checkin', params: { bookingId: booking.id } })}
                        >
                          <Text style={[styles.buttonText, { color: '#2E7D32' }]}>✓ Check In</Text>
                        </AnimatedButton>

                        <AnimatedButton
                          style={[styles.cancelButton, { marginTop: 10 }]}
                          onPress={() => {
                            Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
                              { text: 'No', style: 'cancel' },
                              {
                                text: 'Yes, Cancel', style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await bookingsAPI.updateStatus(token!, booking.id, 'CANCELLED');
                                    mutateBookings();
                                  } catch (e) {
                                    Alert.alert('Error', 'Failed to cancel booking');
                                  }
                                }
                              }
                            ]);
                          }}
                        >
                          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                        </AnimatedButton>
                      </>
                    )}

                  </View>
                </View>
              </FadeInView>
            ))}

            {/* PAST SECTION */}
            {tab === 'past' && bookings.map((booking, idx) => (
              <FadeInView key={booking.id} delay={idx * 150} translateY={15}>
                <View style={styles.pastContainer}>
                  <View style={styles.pastCard}>

                    {/* Hotel Info */}
                    <View style={styles.pastTopRow}>
                      <View style={styles.pastTextBlock}>
                        <Text style={styles.pastHotelName}>{booking.room?.property?.name}</Text>
                        <Text style={styles.pastAddress}>
                          {booking.room?.property?.address}
                        </Text>
                      </View>

                      <HotelImage
                        source={booking.room?.images?.[0] ? { uri: booking.room.images[0] } : require('../../assets/images/image8.png')}
                        style={styles.pastHotelImage}
                      />
                    </View>

                    {/* Book Again */}
                    <AnimatedButton
                      style={styles.bookAgainButton}
                      onPress={() => router.push('/(main)/book')}
                    >
                      <Text style={styles.bookAgainText}>Book Again</Text>
                    </AnimatedButton>

                    <View style={styles.pastDivider} />

                    {/* Check-in / Check-out */}
                    <View style={styles.checkRow}>
                      <View>
                        <Text style={styles.checkTitle}>Check-In</Text>
                        <Text style={styles.checkDate}>{formatDate(booking.checkIn)}</Text>
                        <Text style={styles.checkTime}>{formatTime(booking.checkIn)}</Text>
                      </View>

                      <View style={styles.verticalDividerPast} />

                      <View>
                        <Text style={styles.checkTitle}>Check-Out</Text>
                        <Text style={styles.checkDate}>{formatDate(booking.checkOut)}</Text>
                        <Text style={styles.checkTime}>{formatTime(booking.checkOut)}</Text>
                      </View>
                    </View>

                    <View style={styles.pastDivider} />

                    {/* Booking ID */}
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.sectionTitle}>Booking-ID</Text>
                        <Text style={styles.sectionValue}>#{String(booking.id || '').slice(-8).toUpperCase()}</Text>
                      </View>
                      <Ionicons name="copy-outline" size={20} />
                    </View>

                    <View style={styles.pastDivider} />

                    {/* Reserved For */}
                    <View>
                      <Text style={styles.sectionTitle}>Reserved for</Text>
                      <Text style={styles.sectionValue}>{booking.guest?.name || 'Guest'}</Text>
                    </View>

                    <View style={styles.pastDivider} />

                    {/* Rooms */}
                    <View>
                      <Text style={styles.sectionTitle}>Rooms & guests</Text>
                      <Text style={styles.sectionValue}>{booking.room?.type} | {booking.numberOfGuests} guests</Text>
                    </View>

                    <View style={styles.pastDivider} />

                    <View>
                      <Text style={styles.sectionTitle}>Total Fair</Text>
                      <View style={styles.fairDownloadRow}>
                         <Text style={styles.sectionValue}>₹{String(booking.totalAmount || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                         <TouchableOpacity 
                           style={styles.miniDownloadBtn}
                           onPress={() => handleDownloadInvoice(booking.id)}
                           disabled={downloadingId === booking.id}
                         >
                           {downloadingId === booking.id ? (
                             <ActivityIndicator size="small" color="#C26A2C" />
                           ) : (
                             <>
                               <Ionicons name="download-outline" size={16} color="#C26A2C" />
                               <Text style={styles.miniDownloadText}>Invoice</Text>
                             </>
                           )}
                         </TouchableOpacity>
                      </View>
                    </View>


                  </View>
                </View>
              </FadeInView>
            ))}

            {/* CANCELLED SECTION */}
            {tab === 'cancelled' && bookings.length > 0 && bookings.map((booking) => (
              <View key={booking.id} style={[styles.pastContainer, { opacity: 0.7 }]}>
                {/* Reuse past card simplified */}
                  <View style={styles.pastCard}>
                    <Text style={[styles.pastHotelName, { color: 'red' }]}>Cancelled</Text>
                    <Text style={styles.pastHotelName}>{booking.room?.property?.name || 'Hotel'}</Text>
                    <Text style={styles.sectionValue}>Booking ID: #{String(booking.id || '').slice(-8).toUpperCase()}</Text>
                  </View>
              </View>
            ))}

            {tab === 'cancelled' && bookings.length === 0 && (
              <View style={styles.cancelledContainer}>
                <Image
                  source={require('../../assets/images/cancelled.png')}
                  style={styles.cancelledImage}
                />

                <LinearGradient
                  colors={['rgba(47,46,46,0.66)', 'rgba(255,123,0,0.66)']}
                  style={styles.cancelledBorder}
                >
                  <View style={styles.cancelledBox}>
                    <Text style={styles.cancelledText}>
                      You have no canceled hotel bookings. When you do, they’ll appear here.
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}
            {bookings.length < total && (
              <View style={styles.paginationContainer}>
                <Text style={styles.pageIndicator}>
                  Showing {bookings.length} of {total} bookings
                </Text>
                <TouchableOpacity 
                  style={styles.loadMoreBtn} 
                  onPress={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                        <Text style={styles.loadMoreText}>Load More</Text>
                        <Ionicons name="chevron-down" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {bookings.length > 0 && bookings.length >= total && (
                <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text style={{ color: '#999', fontSize: 13, fontFamily: 'Inter-Medium' }}>
                        You've reached the end of your {tab} bookings
                    </Text>
                </View>
            )}
          </>
        )}
      </Animated.ScrollView>

      <BottomNav activeTab="bookings" />

      {/* Sort Menu Overlay - Closes menu when clicking outside */}
      {showSortMenu && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} 
          onPress={() => setShowSortMenu(false)} 
        />
      )}

      {/* Sort Menu Dropdown - Moved OUTSIDE header to avoid clipping */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { top: insets.top + (isHeaderCollapsed ? 60 : 110), zIndex: 3000 }]}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'createdAt' && order === 'desc' && styles.sortOptionActive]}
            onPress={() => handleSort('createdAt', 'desc')}
          >
            <Ionicons name="time-outline" size={20} color={sortBy === 'createdAt' && order === 'desc' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'createdAt' && order === 'desc' && styles.sortTextActive]}>Newest First</Text>
            {sortBy === 'createdAt' && order === 'desc' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'createdAt' && order === 'asc' && styles.sortOptionActive]}
            onPress={() => handleSort('createdAt', 'asc')}
          >
            <Ionicons name="hourglass-outline" size={20} color={sortBy === 'createdAt' && order === 'asc' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'createdAt' && order === 'asc' && styles.sortTextActive]}>Oldest First</Text>
            {sortBy === 'createdAt' && order === 'asc' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price' && order === 'asc' && styles.sortOptionActive]}
            onPress={() => handleSort('price', 'asc')}
          >
            <Ionicons name="arrow-down-outline" size={20} color={sortBy === 'price' && order === 'asc' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'price' && order === 'asc' && styles.sortTextActive]}>Price: Low to High</Text>
            {sortBy === 'price' && order === 'asc' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'price' && order === 'desc' && styles.sortOptionActive]}
            onPress={() => handleSort('price', 'desc')}
          >
            <Ionicons name="arrow-up-outline" size={20} color={sortBy === 'price' && order === 'desc' ? '#C26A2C' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'price' && order === 'desc' && styles.sortTextActive]}>Price: High to Low</Text>
            {sortBy === 'price' && order === 'desc' && <Ionicons name="checkmark" size={20} color="#C26A2C" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* SMALL COMPONENTS */

function DateBlock({ date, time }: { date: string; time: string }) {
  return (
    <View>
      <Text style={styles.dateText}>{date}</Text>
      <Text style={styles.timeText}>{time}</Text>
    </View>
  );
}

function VerticalDivider() {
  return <View style={styles.verticalDivider} />;
}


/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F1EE' },

  headerContainer: { 
    overflow: 'hidden',
    backgroundColor: '#FFF',
  }, 

  headerImage: {
    width,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  headerOverlay: { position: 'absolute', width, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },

  headerContent: {
    width,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },

  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  menuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },

  tabWrapper: {
    width: width - 40,
    height: 55,
    borderRadius: 50,
    overflow: 'hidden',
  },

  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(217,217,217,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  tab: { alignItems: 'center' },

  tabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },

  activeTabText: { fontFamily: 'Inter-SemiBold' },

  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: '#F4A261',
    marginTop: 6,
    borderRadius: 2,
  },

  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingBottom: 30,
  },

  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 35,
  },

  cardContent: { padding: 16 },

  hotelName: { fontSize: 20, fontFamily: 'Inter-SemiBold' },

  metaText: { marginTop: 4, fontSize: 15, fontFamily: 'Inter-Regular' },

  metaLabel: { fontFamily: 'Inter-SemiBold' },

  divider: { height: 1, backgroundColor: '#74707057', marginVertical: 12 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },

  dateText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },

  timeText: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#00000075' },

  verticalDivider: { width: 1, height: 35, backgroundColor: '#74707057' },

  dndRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },

  dndText: { fontSize: 20, fontFamily: 'Inter-Bold' },

  outlineButton: { marginTop: 10, height: 43, borderRadius: 30, borderWidth: 1, borderColor: '#2F2E2E', justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#2F2E2E' },
  cancelButton: { marginTop: 10, height: 43, borderRadius: 30, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#FFFFFF' },



  /* PAST */
  pastContainer: { marginTop: 24, paddingHorizontal: 16 },

  pastCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },

  pastTopRow: { flexDirection: 'row', justifyContent: 'space-between' },

  pastTextBlock: { flex: 1, paddingRight: 12 },

  pastHotelName: { fontFamily: 'Poppins-SemiBold', fontSize: 24 },

  pastAddress: { fontFamily: 'Poppins-Regular', fontSize: 18, color: '#747070' },

  pastHotelImage: { width: 80, height: 75, borderRadius: 5 },

  bookAgainButton: {
    marginTop: 16,
    width: '100%',
    height: 44,
    borderRadius: 20,
    backgroundColor: '#EBE8E8',
    borderWidth: 1,
    borderColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookAgainText: { fontFamily: 'Poppins-Medium', fontSize: 18 },

  pastDivider: { height: 1, backgroundColor: '#D0D0D0', marginVertical: 16 },

  checkRow: { flexDirection: 'row', justifyContent: 'space-between' },

  checkTitle: { fontFamily: 'Inter-Bold', fontSize: 16 },

  checkDate: { fontFamily: 'Inter-SemiBold', fontSize: 14 },

  checkTime: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#747070' },

  verticalDividerPast: { width: 1, height: 50, backgroundColor: '#CFCFCF' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },

  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 16 },

  sectionValue: { fontFamily: 'Inter-Regular', fontSize: 14 },

  /* CANCELLED */
  cancelledContainer: { marginTop: 30, alignItems: 'center' },

  cancelledImage: { width, height: 312, resizeMode: 'contain' },

  cancelledBorder: { marginTop: 30, borderRadius: 10, padding: 1 },

  cancelledBox: {
    width: 346,
    height: 118,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  cancelledText: { fontSize: 16, fontFamily: 'Inter-Regular', textAlign: 'center' },

  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  fairDownloadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  miniDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#C26A2C',
  },
  miniDownloadText: { fontSize: 12, color: '#C26A2C', fontFamily: 'Inter-SemiBold', marginLeft: 4 },
  paginationContainer: {
    padding: 20,
    alignItems: 'center',
  },
  pageIndicator: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  loadMoreBtn: {
    width: '100%',
    backgroundColor: '#1E293B',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  loadMoreText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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
