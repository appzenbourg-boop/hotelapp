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
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';

import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export default function Home() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [activeStay, setActiveStay] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  React.useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch all bookings
      const res = await bookingsAPI.getMyBookings(token);
      if (res.success && res.bookings) {
        setAllBookings(res.bookings);
        const active = res.bookings.find((b: any) => b.status === 'CHECKED_IN');
        if (active) {
          setActiveStay(active);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* ... (Drawer logic) ... */}
        <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
          {/* HERO IMAGE */}
          <ImageBackground
            source={require('../../assets/images/image4.png')}
            style={[styles.heroImage, { height: 287 + insets.top, paddingTop: insets.top + 10 }]}
            imageStyle={styles.heroImageRadius}
          >
            <View style={styles.overlay} />
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setDrawerOpen(true)}
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroText}>
              Enjoy your stay at {activeStay?.room?.property?.name || 'Zenbourg'}
            </Text>
          </ImageBackground>

          {/* DND */}
          <View style={styles.dndRow}>
            <Text style={styles.dndText}>Do Not Disturb (DND)</Text>
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
              <ActivityIndicator size="large" color="#000" style={{ margin: 50 }} />
            ) : activeStay ? (
              <View>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={activeStay?.room?.images?.[0] ? { uri: activeStay.room.images[0] } : require('../../assets/images/image5.png')}
                    style={styles.cardImage}
                  />
                  <TouchableOpacity style={styles.favIcon}>
                    <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.hotelName}>{activeStay?.room?.property?.name || 'Zenbourg Hotel'}</Text>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={14} color="#000" />
                      <Text style={styles.ratingText}>4.90 (200)</Text>
                    </View>
                  </View>

                  <Text style={styles.detailsText}>
                    Room {activeStay?.room?.roomNumber || '---'} · {activeStay?.numberOfGuests ?? 0} Guests
                  </Text>

                  <Text style={styles.priceText}>
                    ₹{String(activeStay?.totalAmount ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} Total · {activeStay?.status || 'Active'}
                  </Text>

                  <View style={styles.serviceGrid}>
                    <ServiceButton label="Open / Close Door" route="/(services)/door" icon="key-outline" />
                    <ServiceButton label="House Keeping" route="/(services)/housekeeping" icon="sparkles-outline" />
                    <ServiceButton label="Wake-up Call" route="/(services)/wakeup" icon="alarm-outline" />
                    <ServiceButton label="Extra Linens" route="/(services)/linens" icon="layers-outline" />
                    <ServiceButton label="Toiletries Refill" route="/(services)/toiletries" icon="flask-outline" />
                    <ServiceButton label="Food Ordering" route="/(services)/food" icon="fast-food-outline" />
                    <ServiceButton label="Spa & Wellness" route="/(services)/spa" icon="leaf-outline" />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text>No active stay found.</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.outlineButtonBelow}
            onPress={() => {
              if (activeStay) {
                router.push({
                  pathname: '/(main)/checkout',
                  params: {
                    bookingId: activeStay.id
                  }
                });
              } else {
                router.push('/(main)/checkout');
              }
            }}
          >
            <Text style={styles.buttonText}>Check-out →</Text>
          </TouchableOpacity>

          {/* MY BOOKINGS SECTION */}
          {allBookings.length > 0 && (
            <View style={{ marginTop: 30, paddingHorizontal: 27 }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: '#2F2E2E', marginBottom: 15 }}>
                My Bookings ({allBookings.length})
              </Text>
              {allBookings.map((booking, idx) => (
                <View key={booking.id} style={styles.bookingContainer}>
                  <TouchableOpacity
                    style={styles.miniBookingCard}
                    onPress={() => router.push({ pathname: '/(main)/hotel-details', params: { propertyId: booking.room?.propertyId || booking.propertyId, propertyName: booking.room?.property?.name } })}
                  >
                    <Image
                      source={booking.room?.images?.[0] ? { uri: booking.room.images[0] } : require('../../assets/images/image5.png')}
                      style={styles.miniImage}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14 }}>{booking.room?.property?.name || 'Zenbourg Hotel'}</Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: '#666' }}>
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: booking.status === 'CHECKED_IN' ? '#E8F5E9' : '#FFF3E0' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: booking.status === 'CHECKED_IN' ? '#2E7D32' : '#EF6C00' }
                        ]}>
                          {booking.status === 'CHECKED_IN' ? 'Active Stay' : 'Upcoming'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                  {/* ACTION BUTTONS PER BOOKING */}
                  <View style={styles.bookingActions}>
                    {booking.status === 'RESERVED' && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push({ pathname: '/(main)/checkin', params: { bookingId: booking.id } })}
                      >
                        <Ionicons name="log-in-outline" size={16} color="#C26A2C" />
                        <Text style={styles.actionButtonText}>Check-In Now</Text>
                      </TouchableOpacity>
                    )}

                    {booking.status === 'CHECKED_IN' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { borderColor: '#2E7D32' }]}
                        onPress={() => router.push('/(main)/home-checkout')}
                      >
                        <Ionicons name="apps-outline" size={16} color="#2E7D32" />
                        <Text style={[styles.actionButtonText, { color: '#2E7D32' }]}>Manage Stay & Services</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, { borderColor: '#666' }]}
                      onPress={() => router.push({ pathname: '/(main)/hotel-details', params: { propertyId: booking.room?.propertyId || booking.propertyId, propertyName: booking.room?.property?.name } })}
                    >
                      <Ionicons name="information-circle-outline" size={16} color="#666" />
                      <Text style={[styles.actionButtonText, { color: '#666' }]}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}


        </ScrollView>

        <BottomNav activeTab="home" />
      </View>
    </>
  );
}

/* ================= HELPERS ================= */

function ServiceButton({ label, route, icon }: any) {
  return (
    <View style={styles.serviceItem}>
      <TouchableOpacity
        style={styles.serviceButton}
        onPress={() => router.push(route)}
      >
        <Ionicons name={icon} size={36} color="#C26A2C" />
      </TouchableOpacity>
      <Text style={styles.serviceText}>{label}</Text>
    </View>
  );
}

function DrawerButton({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.drawerButton} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#2F2E2E" />
      <Text style={styles.drawerButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFECEC' },

  /* DRAWER */
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 251,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  drawerClose: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(217,217,217,1)',
  },

  profileText: {
    marginLeft: 12,
    flex: 1,
  },

  userName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(47,46,46,1)',
  },

  phone: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 40,
    color: 'rgba(0,0,0,0.56)',
  },

  Divider: { height: 1, backgroundColor: '#D0D0D0', marginVertical: 16 },

  drawerButton: {
    width: 216,
    height: 57,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  drawerButtonText: {
    marginLeft: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2F2E2E',
  },

  heroImage: { width, paddingHorizontal: 22 },
  heroImageRadius: { borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },

  menuButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  heroText: {
    marginTop: 28,
    width: 367,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    lineHeight: 40,
    color: '#FFFFFF',
  },

  searchBar: {
    position: 'absolute',
    bottom: 20,
    left: 17,
    width: 377,
    height: 65,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(217,217,217,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },

  searchTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FFFFFF' },
  searchSubtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#FFFFFF', opacity: 0.8 },

  dndRow: {
    marginTop: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dndText: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#2F2E2E' },

  card: { marginTop: 20, marginHorizontal: 27, backgroundColor: '#FFFFFF', borderRadius: 30, overflow: 'hidden' },

  cardImageWrapper: { width: '100%', height: 250, borderRadius: 35, overflow: 'hidden' },

  cardImage: { width: '100%', height: '100%' },

  favIcon: { position: 'absolute', top: 18, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: '#00000059', justifyContent: 'center', alignItems: 'center' },

  cardContent: { padding: 16 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  hotelName: { fontFamily: 'Inter-SemiBold', fontSize: 18, color: '#000000' },

  rating: { flexDirection: 'row', alignItems: 'center' },

  ratingText: { marginLeft: 4, fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#696767' },

  detailsText: { marginTop: 6, fontFamily: 'Inter-Regular', fontSize: 13, color: '#0000008F' },

  priceText: { marginTop: 4, fontFamily: 'Inter-Regular', fontSize: 13, color: '#2F2E2E' },

  serviceGrid: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceItem: { width: '30%', alignItems: 'center', marginBottom: 28 },

  serviceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  serviceText: { marginTop: 10, fontSize: 15, fontFamily: 'Inter-SemiBold', textAlign: 'center' },

  buttonText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#2F2E2E' },

  outlineButtonBelow: { marginTop: 16, marginHorizontal: 27, height: 43, borderRadius: 30, borderWidth: 1, borderColor: '#2F2E2E', justifyContent: 'center', alignItems: 'center' },

  miniBookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  bookingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingActions: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C26A2C',
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#C26A2C',
    marginLeft: 4,
  },
});
