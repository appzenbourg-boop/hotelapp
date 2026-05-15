import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DigitalRegistration() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { name, guests, bookingId } = useLocalSearchParams<any>();
  const [roomNumber, setRoomNumber] = React.useState('---');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    handleAutoCheckIn();
  }, []);

  const handleAutoCheckIn = async () => {
    if (!token) return;

    try {
      let booking;

      // 1. Precise Check-In: Use the specific bookingId if we have it
      if (bookingId) {
        const res = await bookingsAPI.getMyBookings(token);
        if (res.success && res.bookings) {
          booking = res.bookings.find((b: any) => b.id === bookingId);
        }
      }

      // 2. Fallback: If no ID or ID not found, pick the first upcoming one
      if (!booking) {
        const res = await bookingsAPI.getUpcoming(token);
        if (res.success && res.bookings && res.bookings.length > 0) {
          booking = res.bookings[0];
        }
      }

      if (booking) {
        setRoomNumber(booking.room?.roomNumber || '---');
        // Update status to CHECKED_IN
        try {
          const updateRes = await bookingsAPI.updateStatus(token, booking.id, 'CHECKED_IN');
          if (updateRes.success) {
            console.log('Successfully checked in');
          }
        } catch (err: any) {
          // Robust handle for backend state conflicts
          const isAlreadyCheckedIn = 
            err.message?.includes('already checked in') || 
            err.message?.includes('Failed to check in') ||
            JSON.stringify(err).includes('already checked in');

          if (isAlreadyCheckedIn) {
            console.log('Booking potentially already checked in, proceeding to fetch active data...');
          } else {
            throw err;
          }
        }
      } else {
        // Final fallback: already checked in?
        const activeRes = await bookingsAPI.getActive(token);
        if (activeRes.success && activeRes.bookings && activeRes.bookings.length > 0) {
          const activeBooking = activeRes.bookings[0];
          setRoomNumber(activeBooking.room?.roomNumber || activeBooking.roomNumber || '---');
        }
      }
    } catch (e) {
      console.error('Auto check-in failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (d: Date) => d.toDateString();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        <ImageBackground
          source={require('../../assets/images/image4.png')}
          style={[styles.header, { height: 260 + insets.top }]}
        >
          <View style={styles.overlay} />
          <Ionicons name="checkmark-circle" size={90} color="#fff" />
          <Text style={styles.title}>Digital Registration</Text>
          <Text style={styles.subtitle}>Check in successful</Text>
        </ImageBackground>

        <View style={styles.card}>

          <Row label="Name" value={name} />
          <Row label="Number of Guests" value={guests} />
          <Row label="Room Number" value={roomNumber} />
          <Row label="Check-in" value={formatDate(today)} />
          <Row label="Check-out" value={formatDate(tomorrow)} />

          <Text style={styles.keyTitle}>Digital Room Key</Text>

          <View style={styles.keyBox}>
            <Ionicons name="phone-portrait-outline" size={22} />
            <Text style={{ marginLeft: 10 }}>Room {roomNumber}</Text>
            <Ionicons name="wifi" size={22} style={{ marginLeft: 'auto' }} />
          </View>

          <TouchableOpacity
            style={[styles.btn, { marginBottom: Math.max(10, insets.bottom) }]}
            onPress={() => router.replace('/(services)/checkin-animation')}
          >
            <Text style={styles.btnText}>Continue</Text>
          </TouchableOpacity>


        </View>

      </View>
    </>
  );
}

/* SMALL ROW */
const Row = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

/* STYLES */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFECEC' },
  header: { width, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  title: { fontSize: 26, color: '#fff', marginTop: 10 },
  subtitle: { color: '#fff' },
  card: {
    marginTop: -30,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  label: { color: '#777' },
  value: { fontWeight: '600' },
  keyTitle: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  keyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 40,
    padding: 14,
    marginTop: 10
  },
  btn: {
    marginTop: 30,
    height: 56,
    borderRadius: 40,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: { color: '#fff', fontSize: 18 }
});
