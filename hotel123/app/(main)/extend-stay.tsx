import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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
import { bookingsAPI } from '../../services/api';
import DateRangePicker from '../../components/DateRangePicker';

const { width } = Dimensions.get('window');

export default function ExtendStay() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [activeStay, setActiveStay] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [newCheckOut, setNewCheckOut] = React.useState<Date | null>(null);
  const [requestStatus, setRequestStatus] = React.useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE');

  // Scroll animation
  const scrollY = React.useRef(new Animated.Value(0)).current;
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

  React.useEffect(() => {
    fetchActiveStay();
  }, []);

  const fetchActiveStay = async () => {
    if (!token) return;
    try {
      const res = await bookingsAPI.getActive(token);
      if (res.success && res.bookings && res.bookings.length > 0) {
        setActiveStay(res.bookings[0]);
      } else {
        const upcomingRes = await bookingsAPI.getUpcoming(token);
        if (upcomingRes.success && upcomingRes.bookings && upcomingRes.bookings.length > 0) {
          setActiveStay(upcomingRes.bookings[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentCheckOut = activeStay ? new Date(activeStay.checkOut) : null;
  const pricePerNight = activeStay?.room?.basePrice || 0;
  
  const diffNights = (newCheckOut && currentCheckOut) 
    ? Math.ceil((newCheckOut.getTime() - currentCheckOut.getTime()) / (1000 * 3600 * 24))
    : 0;
  
  const extendAmount = diffNights > 0 ? diffNights * pricePerNight : 0;
  const isButtonEnabled = extendAmount > 0;

  const handleConfirmDates = (start: Date, end: Date) => {
    setNewCheckOut(end);
    setShowCalendar(false);
  };

  const handleSubmitRequest = async () => {
    if (!token || !newCheckOut || !activeStay) return;
    
    setRequestStatus('PENDING');
    try {
      // Hit the manage endpoint with request flag or the backend will handle status
      await bookingsAPI.extendStay(token, activeStay.id, newCheckOut.toISOString());
      setRequestStatus('SUCCESS');
    } catch (e) {
      console.error(e);
      setRequestStatus('IDLE');
    }
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
            <Ionicons name="checkmark-circle" size={80} color="#C26A2C" />
          </View>
          <Text style={styles.successTitle}>Request Submitted</Text>
          <Text style={styles.successSubtitle}>
            Your extension request for Room {activeStay.room?.roomNumber} has been sent to the front desk. We will notify you once it's approved.
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* STICKY HEADER */}
      <Animated.View style={[styles.stickyHeader, { height: NAV_STICKY_HEIGHT, opacity: headerBgOpacity, paddingTop: insets.top }]}>
        <Animated.Text style={[styles.stickyTitle, { opacity: headerTextOpacity }]}>Extend Stay</Animated.Text>
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
            <Text style={styles.headerTitle}>Extend Stay</Text>
            <Text style={styles.headerSubtitle}>
              Love your room? Stay a little longer with instant extension.
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
            {/* CURRENT BOOKING INFO */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTag}>ACTIVE RESERVATION</Text>
                  <Text style={styles.hotelName}>{activeStay.room?.property?.name || 'Stay In'}</Text>
                </View>
                
                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>CHECK-IN</Text>
                        <Text style={styles.infoValue}>{new Date(activeStay.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>CHECK-OUT</Text>
                        <Text style={styles.infoValue}>{new Date(activeStay.checkOut).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                </View>

                <View style={styles.roomStrip}>
                    <Ionicons name="business-outline" size={16} color="#666" />
                    <Text style={styles.roomText}>Room {activeStay.room?.roomNumber} • {activeStay.room?.type}</Text>
                </View>
            </View>

            {/* SELECTION AREA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select New Dates</Text>
                <TouchableOpacity 
                    style={styles.datePickerTrigger}
                    onPress={() => setShowCalendar(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.datePickerIcon}>
                        <Ionicons name="calendar" size={20} color="#FFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.pickerLabel}>New Checkout</Text>
                        <Text style={styles.pickerValue}>
                            {newCheckOut ? newCheckOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Set extension date'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                {extendAmount > 0 && (
                    <Animated.View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Extended Duration</Text>
                            <Text style={styles.summaryValue}>{diffNights} {diffNights === 1 ? 'Night' : 'Nights'}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Nightly Rate</Text>
                            <Text style={styles.summaryValue}>₹{pricePerNight.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Charge</Text>
                            <Text style={styles.totalValue}>₹{extendAmount.toLocaleString()}</Text>
                        </View>
                    </Animated.View>
                )}
            </View>

            <TouchableOpacity
              style={[styles.payButton, (!isButtonEnabled || requestStatus === 'PENDING') && styles.payButtonDisabled]}
              disabled={!isButtonEnabled || requestStatus === 'PENDING'}
              onPress={handleSubmitRequest}
            >
              {requestStatus === 'PENDING' ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.payButtonText}>Submit Request for Approval</Text>
                  <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
        </View>

        <DateRangePicker 
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          onConfirm={(start, end) => handleConfirmDates(start, end)}
          initialCheckIn={currentCheckOut}
          minDate={currentCheckOut || undefined}
        />
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
    marginBottom: 20,
  },
  cardTag: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#C26A2C',
    letterSpacing: 1,
    marginBottom: 4,
  },
  hotelName: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#1A1A1A',
  },
  
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#DDD',
    marginHorizontal: 20,
  },
  infoLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#1A1A1A',
  },
  
  roomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  roomText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
  
  datePickerTrigger: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  datePickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#999',
  },
  pickerValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginTop: 2,
  },

  summaryContainer: {
    marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  totalValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#C26A2C',
  },

  payButton: {
    marginTop: 40,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
    elevation: 0,
    shadowOpacity: 0,
  },
  payButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFF',
    marginRight: 8,
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
  }
});
