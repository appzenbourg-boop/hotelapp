import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, paymentsAPI, API_CONFIG } from '../../services/api';
import { Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExtendPayment() {
  const insets = useSafeAreaInsets();
  const { bookingData, amount } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    handlePayment();
  }, []);

  const handlePayment = async () => {
    try {
      const payAmount = parseFloat(amount as string) || 0;

      // If amount is 0 (paid fully by wallet), skip Razorpay and confirm directly
      if (payAmount === 0) {
        if (bookingData) {
            const bData = JSON.parse(bookingData as string);
            
            // HANDLE TOP-UP VIA WALLET ONLY
            if (bData.type === 'TOPUP_BALANCE') {
                const res = await bookingsAPI.payBalance(token!, bData.bookingId, bData.amount);
                if (res.success) {
                    router.replace({
                        pathname: '/payment-result',
                        params: { status: 'success' }
                    });
                    return;
                } else {
                    Alert.alert('Payment Error', res.error || 'Failed to settle balance.');
                    router.back();
                    return;
                }
            }

            const res = await bookingsAPI.create(token!, bData);
            if (res.success) {
                router.replace({
                    pathname: '/(services)/payment-result',
                    params: { status: 'success', bookingId: res.booking?.id }
                });
                return;
            } else {
                Alert.alert('Booking Error', res.error || 'Failed to confirm booking.');
                router.back();
                return;
            }
        }
      }

      // Create Razorpay order
      const paiseAmount = Math.round(payAmount * 100);
      const response = await paymentsAPI.createOrder(token || '', paiseAmount, {
        type: bookingData ? 'BOOKING' : 'GENERAL',
        bookingData: bookingData ? JSON.parse(bookingData as string) : null
      });

      if (!response.success || !response.order) {
        throw new Error(response.error || 'Failed to initiate payment.');
      }

      if (bookingData) {
        await AsyncStorage.setItem('pending_booking_data', bookingData as string);
        await AsyncStorage.setItem('pending_booking_amount', String(payAmount));
      }

      const successUrl = encodeURIComponent(Linking.createURL('payment-result'));
      const cancelUrl = encodeURIComponent(Linking.createURL('payment-cancelled'));
      const apiBase = API_CONFIG.BASE_URL.replace('/api', '');
      
      const rawPhone = user?.phone || '';
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      let formattedContact = '';
      
      if (cleanPhone.length === 10) {
        formattedContact = cleanPhone;
      } else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        formattedContact = cleanPhone.substring(2);
      } else {
        // If not a standard 10-digit or 91-prefix number, leave empty to let them type
        formattedContact = '';
      }

      const checkoutUrl =
        `${apiBase}/payments/checkout/${response.order.id}` +
        `?key=${response.key}` +
        `&amount=${response.order.amount}` +
        `&name=${encodeURIComponent(user?.name || '')}` +
        `&email=${encodeURIComponent(user?.email || '')}` +
        `&contact=${formattedContact}` +
        `&successUrl=${successUrl}` +
        `&cancelUrl=${cancelUrl}`;

      await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: false,
        enableBarCollapsing: true,
      });

      // After browser closes, we stay on this loading screen until deep link hits payment-result
    } catch (error: any) {
      console.error('Payment Error:', error);
      Alert.alert('Payment Error', error.message || 'Failed to open payment gateway.', [
        { text: 'Go Back', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
       <ActivityIndicator size="large" color="#1A1A1A" />
       <Text style={styles.redirectText}>Redirecting to Secure Gateway...</Text>
       <Text style={styles.amountText}>Amount: ₹{parseFloat(amount as string).toLocaleString('en-IN')}</Text>
       
       <TouchableOpacity 
         style={styles.cancelBtn} 
         onPress={() => router.back()}
       >
         <Text style={styles.cancelText}>Cancel Payment</Text>
       </TouchableOpacity>
    </View>
  );
}

/* ---------- COMPONENT ---------- */

function UpiButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: any;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.upiButton, active && styles.upiButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={icon} style={styles.upiIcon} />
      <Text style={styles.upiText}>{label}</Text>
      {active && (
        <View style={styles.upiCheck}>
          <Ionicons name="checkmark-circle" size={24} color="#2F2E2E" />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ---------- STYLES (UNCHANGED) ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  topRow: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  title: {
    marginTop: 60,
    fontFamily: 'Poppins-Bold',
    fontSize: 34,
    color: '#000000',
    letterSpacing: -1,
  },

  redirectText: {
    marginTop: 20,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  amountText: {
    marginTop: 8,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666',
  },
  cancelBtn: {
    marginTop: 40,
    padding: 12,
  },
  cancelText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#C62828',
    textDecorationLine: 'underline',
  },
  divider: {
    marginTop: 24,
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  methodRow: {
    marginTop: 32,
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 6,
    gap: 0,
  },

  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },

  methodOptionActive: {
    backgroundColor: '#2F2E2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  radio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 10,
  },

  radioActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },

  methodText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#1A1A1A',
  },

  methodTextActive: {
    color: '#FFFFFF',
  },

  payUsingText: {
    marginTop: 38,
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1A1A1A',
  },

  upiList: {
    marginTop: 20,
  },

  upiButton: {
    width: '100%',
    height: 78,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    // Professional Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  upiButtonActive: {
    borderColor: '#2F2E2E',
    borderWidth: 2,
  },

  upiIcon: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },

  upiText: {
    marginLeft: 18,
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: '#1A1A1A',
    flex: 1,
  },

  upiCheck: {
    marginLeft: 'auto',
  },

  payNowButton: {
    marginTop: 20,
    alignSelf: 'center',
    width: '100%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    marginBottom: 40,
  },

  payNowText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },

  // CARD SPECIFIC STYLES
  cardImagesRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardImage: {
    width: 48,
    height: 30,
    resizeMode: 'contain',
  },
  cardLabel: {
    marginTop: 24,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#444',
  },
  inputBox: {
    marginTop: 8,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F9F9F9',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  saveRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxActive: {
    backgroundColor: '#2F2E2E',
    borderColor: '#2F2E2E',
  },
  saveText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#444',
  },
});

