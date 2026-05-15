import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LiveSupport() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [exitVisible, setExitVisible] = useState(false);
  const [checkedOut, setCheckedOut] = useState<any[]>([]);
  const [canceled, setCanceled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await bookingsAPI.getMyBookings(token);
      if (res.success && res.bookings) {
        const all = res.bookings;
        setCheckedOut(all.filter((b: any) => b.status === 'CHECKED_OUT'));
        setCanceled(all.filter((b: any) => b.status === 'CANCELLED'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.bookingRow}
      activeOpacity={0.8}
      onPress={() => router.push({
        pathname: '/live-support-chat',
        params: { 
          bookingId: item.id,
          hotelName: item.property?.name || item.room?.property?.name || 'Hotel',
          propertyId: item.propertyId || item.property?.id || item.room?.propertyId || ''
        }
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.hotelName}>{item.property?.name || 'Hotel Name'}</Text>
        <Text style={styles.address}>{item.property?.address || 'Hotel Address'}</Text>
        <Text style={styles.date}>
          {new Date(item.checkIn).toLocaleDateString()} – {new Date(item.checkOut).toLocaleDateString()}
        </Text>
      </View>

      <Image
        source={item.property?.coverImage ? { uri: item.property.coverImage } : (item.property?.images?.[0] ? { uri: item.property.images[0] } : require('../../assets/images/image6.png'))}
        style={styles.hotelImage}
      />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* HEADER */}
        <View style={[styles.header, { height: 'auto', paddingTop: 10 + insets.top, paddingBottom: 16 }]}>
          <Text style={styles.headerTitle}>Live Support</Text>

          <TouchableOpacity onPress={() => setExitVisible(true)}>
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#F44336" />
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.pageTitle}>
              Choose the booking you need{'\n'}help with
            </Text>

            {checkedOut.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Checked out</Text>
                {checkedOut.map(item => <View key={item.id}>{renderItem({ item })}</View>)}
              </>
            )}

            {canceled.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Canceled</Text>
                {canceled.map(item => <View key={item.id}>{renderItem({ item })}</View>)}
              </>
            )}

            {checkedOut.length === 0 && canceled.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No recent bookings found</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* EXIT MODAL */}
        <Modal transparent visible={exitVisible} animationType="slide">
          <Pressable
            style={styles.overlay}
            onPress={() => setExitVisible(false)}
          />

          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.sheetTitle}>Leaving? Tell us why.</Text>
            <Text style={styles.sheetSub}>This will help us serve you better</Text>

            {/* RESOLVED → HOME */}
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setExitVisible(false);
                router.replace('/home');
              }}
            >
              <Text style={styles.sheetLink}>My Query is resolved</Text>
            </TouchableOpacity>

            {/* NOT RESOLVED → EMAIL */}
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setExitVisible(false);
                Linking.openURL('mailto:hotel@gmail.com');
              }}
            >
              <Text style={styles.sheetLink}>My Query is not resolved</Text>
            </TouchableOpacity>

            {/* RESTART CHAT → HELP */}
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setExitVisible(false);
                router.replace('/help');
              }}
            >
              <Text style={styles.sheetLink}>Restart the Chat</Text>
            </TouchableOpacity>

          </View>
        </Modal>

      </View>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
  },

  exitText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },

  pageTitle: {
    fontSize: 26,
    textAlign: 'center',
    marginVertical: 25,
    fontFamily: 'Poppins-SemiBold',
  },

  sectionTitle: {
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },

  bookingRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },

  hotelName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

  address: {
    fontSize: 13,
    color: '#888',
    marginVertical: 2,
  },

  date: {
    fontSize: 13,
  },

  hotelImage: {
    width: 55,
    height: 55,
    borderRadius: 8,
    marginLeft: 12,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },

  sheetSub: {
    color: '#777',
    marginVertical: 6,
  },

  sheetItem: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  sheetLink: {
    color: '#1E6BFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#999',
  },
});
