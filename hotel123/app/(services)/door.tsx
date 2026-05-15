import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DoorScreen() {
  const insets = useSafeAreaInsets();
  const [locked, setLocked] = useState(true);
  const [pinVisible, setPinVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState('Guest');
  const [roomNumber, setRoomNumber] = useState('000');

  const { token } = useAuth();

  useEffect(() => {
    fetchBookingData();
  }, []);

  const fetchBookingData = async () => {
    if (!token) return;
    try {
      const res = await bookingsAPI.getActive(token);
      if (res.success && res.bookings && res.bookings.length > 0) {
        setGuestName(res.bookings[0].guest?.name || 'Guest');
        setRoomNumber(res.bookings[0].room?.roomNumber || '---');
      }
    } catch (e) {
      console.error("Failed to fetch booking data for door:", e);
    }
  };

  const CORRECT_PIN = '1234';

  const handleConfirmPin = () => {
    if (pin !== CORRECT_PIN) {
      Alert.alert('Invalid PIN', 'Please enter correct PIN');
      return;
    }

    setPinVisible(false);
    setLoading(true);

    setTimeout(() => {
      setLocked(!locked);
      setLoading(false);
      setPin('');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* TOP IMAGE */}
      <View style={styles.imageWrapper}>
        <Image
          source={require('../../assets/images/image14.png')}
          style={styles.image}
        />
        <View style={styles.overlay} />
      </View>

      {/* MAIN CARD */}
      <View style={[styles.card, { top: 120 + insets.top, height: 'auto', paddingBottom: 40 + insets.bottom }]}>
        <Text style={styles.greeting}>Hello {guestName}</Text>

        {/* STATUS CARD */}
        <LinearGradient
          colors={
            locked
              ? ['#CC0101', '#FF0808']
              : ['#099115', '#04850F']
          }
          style={styles.statusCard}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={locked ? 'lock-closed' : 'checkmark-circle'}
                size={60}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {locked ? 'Room Locked' : 'Room Unlocked'}
              </Text>
            </>
          )}
        </LinearGradient>

        <Text style={styles.roomNumber}>Room Number : {roomNumber}</Text>

        {/* LOCK BUTTON */}
        <TouchableOpacity
          style={styles.lockButton}
          activeOpacity={0.8}
          disabled={loading}
          onPress={() => setPinVisible(true)}
        >
          <Text style={styles.lockText}>
            {locked ? 'Tap To Unlock' : 'Tap To Lock'}
          </Text>
        </TouchableOpacity>

        {/* CANCEL */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.push('/(main)/home')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        {/* EMERGENCY ASSISTANCE */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => router.push('/(services)/door-confirmed')}
        >
          <Ionicons name="warning-outline" size={16} color="#CC0101" />
          <Text style={styles.emergencyText}>Having trouble? Contact Security</Text>
        </TouchableOpacity>
      </View>

      {/* PIN MODAL */}
      <Modal transparent visible={pinVisible} animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.pinCard}>
            <Text style={styles.pinTitle}>Enter PIN</Text>

            <TextInput
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              style={styles.pinInput}
              autoFocus={true}
              placeholder="0000"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPin}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPin('');
                setPinVisible(false);
              }}
            >
              <Text style={styles.cancelPin}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(235,232,232,1)',
  },

  imageWrapper: {
    width,
    height: 380,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  card: {
    position: 'absolute',
    width: 357,
    borderRadius: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    elevation: 6,
    paddingTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  greeting: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 26,
    lineHeight: 40,
    color: '#000',
  },

  statusCard: {
    marginTop: 40,
    width: 310,
    height: 190,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusText: {
    marginTop: 12,
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },

  roomNumber: {
    marginTop: 32,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: 'rgba(47,46,46,0.82)',
  },

  lockButton: {
    marginTop: 24,
    width: 312,
    height: 43,
    borderRadius: 50,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: '#FFFFFF',
  },

  cancelButton: {
    marginTop: 24,
    width: 312,
    height: 43,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(116,112,112,1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: 'rgba(116,112,112,1)',
  },

  /* PIN MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pinCard: {
    width: 280,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  pinTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },

  pinInput: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 24,
    color: '#000', // Ensure text is visible
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },

  confirmButton: {
    width: '100%',
    height: 45,
    borderRadius: 30,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  cancelPin: {
    marginTop: 12,
    color: '#777',
  },
  emergencyButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  emergencyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#CC0101',
    textDecorationLine: 'underline',
  },
});
