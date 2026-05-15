import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This screen handles hotel://payment-cancelled deep link
// Razorpay's ondismiss redirects here when user closes the payment modal
export default function PaymentCancelled() {
  useEffect(() => {
    const cleanup = async () => {
      // Clean up any pending booking data
      await AsyncStorage.multiRemove(['pending_booking_data', 'pending_booking_amount']);
      // Go back to home silently — no error shown for user-initiated cancel
      router.replace('/(main)/home');
    };
    cleanup();
  }, []);

  return null;
}
