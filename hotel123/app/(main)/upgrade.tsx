import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, roomsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function UpgradeStay() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [activeStay, setActiveStay] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [requestStatus, setRequestStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE');

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 240 + insets.top;
  const NAV_STICKY_HEIGHT = 60 + insets.top;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTextOpacity = scrollY.interpolate({
    inputRange: [HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT - 20, HEADER_MAX_HEIGHT - NAV_STICKY_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!token) return;
    try {
      let stayRes = await bookingsAPI.getActive(token);
      let stay = null;
      
      if (stayRes.success && stayRes.bookings && stayRes.bookings.length > 0) {
        stay = stayRes.bookings[0];
      } else {
        const upcomingRes = await bookingsAPI.getUpcoming(token);
        if (upcomingRes.success && upcomingRes.bookings && upcomingRes.bookings.length > 0) {
          stay = upcomingRes.bookings[0];
        }
      }

      if (stay) {
        setActiveStay(stay);
        const roomsRes = await roomsAPI.getAll({ 
            propertyId: stay.room?.propertyId, 
            available: true 
        });
        const currentPrice = stay.room?.basePrice || 0;
        const upgrades = (roomsRes || []).filter((r: any) => 
            r.id !== stay.roomId && r.basePrice > currentPrice
        );
        setAvailableRooms(upgrades);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onScroll = (e: any) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / (width - 54));
    setIndex(slideIndex);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  if (!activeStay) {
    return (
        <View style={[styles.container, { padding: 40, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18 }}>No active stay found</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
              <Text style={{ color: '#000', fontWeight: '600' }}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );
  }

  if (requestStatus === 'SUCCESS') {
    return (
      <View style={[styles.container, { padding: 30, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={styles.successCircle}>
            <Ionicons name="sparkles" size={80} color="#C26A2C" />
          </View>
          <Text style={styles.successTitle}>Upgrade Requested</Text>
          <Text style={styles.successSubtitle}>
            Your request to upgrade to the {selectedRoom?.type} has been sent. Our team will review availability and notify you shortly.
          </Text>
          <TouchableOpacity 
            onPress={() => router.replace('/(main)/bookings')} 
            style={styles.homeButton}
          >
            <Text style={styles.homeButtonText}>View My Bookings</Text>
          </TouchableOpacity>
      </View>
    );
  }

  const selectedRoom = availableRooms[index];
  const upgradePrice = selectedRoom ? (selectedRoom.basePrice - activeStay.room.basePrice) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* STICKY HEADER */}
      <Animated.View style={[styles.stickyHeader, { height: NAV_STICKY_HEIGHT, opacity: headerBgOpacity, paddingTop: insets.top }]}>
        <Animated.Text style={[styles.stickyTitle, { opacity: headerTextOpacity }]}>Upgrade Stay</Animated.Text>
      </Animated.View>

      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>

      <Animated.ScrollView 
        onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER */}
        <View style={[styles.header, { height: HEADER_MAX_HEIGHT }]}>
          <Image
            source={require('../../assets/images/image6.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
          <View style={[styles.headerContent, { paddingTop: insets.top + 70 }]}>
            <Text style={styles.headerTitle}>Upgrade Stay</Text>
            <Text style={styles.headerSubtitle}>
              Experience unmatched luxury with our premium room collections.
            </Text>
          </View>
        </View>

        <View style={styles.content}>
            {/* CURRENT ROOM SUMMARY */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTag}>CURRENT ROOM</Text>
                  <Text style={styles.roomName}>{activeStay.room?.type}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Rate</Text>
                  <Text style={styles.priceValue}>₹{activeStay.room?.basePrice.toLocaleString()}/night</Text>
                </View>
            </View>

            {/* AVAILABLE UPGRADES */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Upgrades</Text>
                {availableRooms.length > 0 ? (
                    <View style={styles.upgradeCard}>
                        {/* CAROUSEL */}
                        <View style={styles.carouselContainer}>
                            <ScrollView
                              horizontal
                              pagingEnabled
                              showsHorizontalScrollIndicator={false}
                              onScroll={onScroll}
                              scrollEventThrottle={16}
                            >
                              {availableRooms.map((room, i) => (
                                <Image 
                                  key={i} 
                                  source={room.images?.[0] ? { uri: room.images[0] } : require('../../assets/images/image11.png')} 
                                  style={styles.carouselImage} 
                                />
                              ))}
                            </ScrollView>
                            <View style={styles.pagination}>
                                {availableRooms.map((_, i) => (
                                    <View key={i} style={[styles.dot, index === i && styles.activeDot]} />
                                ))}
                            </View>
                        </View>

                        {/* ROOM DETAILS */}
                        <View style={styles.upgradeInfo}>
                            <Text style={styles.upgradeType}>{selectedRoom?.type}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={12} color="#C26A2C" />
                                <Text style={styles.ratingText}>4.9 • Best Seller</Text>
                            </View>

                            <View style={styles.amenitiesGrid}>
                                {(selectedRoom?.amenities || ['WiFi', 'AC', 'TV']).slice(0, 4).map((item: string, i: number) => (
                                    <View key={i} style={styles.amenityPill}>
                                        <Text style={styles.amenityText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.footerRow}>
                                <View>
                                    <Text style={styles.footerLabel}>UPGRADE CHARGE</Text>
                                    <Text style={styles.footerPrice}>+₹{upgradePrice.toLocaleString()}/night</Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.upgradeButton, requestStatus === 'PENDING' && { opacity: 0.7 }]}
                                  disabled={requestStatus === 'PENDING'}
                                  onPress={async () => {
                                    setRequestStatus('PENDING');
                                    try {
                                        await bookingsAPI.upgradeStay(token!, activeStay.id, selectedRoom.id);
                                        setRequestStatus('SUCCESS');
                                    } catch (e) {
                                        setRequestStatus('IDLE');
                                    }
                                  }}
                                >
                                    {requestStatus === 'PENDING' ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.upgradeButtonText}>Request Upgrade</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="sparkles-outline" size={32} color="#CCC" />
                        <Text style={styles.emptyText}>You're already in our best available room!</Text>
                    </View>
                )}
            </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  stickyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    color: '#1A1A1A',
  },
  
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  headerContent: {
    paddingHorizontal: 25,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    lineHeight: 22,
  },

  content: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTag: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  roomName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1A1A1A',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },

  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 16,
    marginLeft: 4,
  },
  
  upgradeCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  carouselContainer: {
    height: 250,
  },
  carouselImage: {
    width: width - 40,
    height: 250,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 15,
    backgroundColor: '#FFF',
  },
  
  upgradeInfo: {
    padding: 24,
  },
  upgradeType: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#1A1A1A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    marginLeft: 6,
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#C26A2C',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  amenityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  amenityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#999',
    letterSpacing: 0.5,
  },
  footerPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  upgradeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  
  // SUCCESS STATE
  successCircle: {
    marginBottom: 24,
    shadowColor: '#C26A2C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  successTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  homeButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  homeButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFF',
  },

  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
