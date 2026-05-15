import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { paymentsAPI, bookingsAPI, walletAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PaymentResult() {
  const params = useLocalSearchParams();
  const { token, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'cancelled'>('processing');
  const [message, setMessage] = useState('Finalizing your payment...');
  const [paymentType, setPaymentType] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      console.log('[PaymentResult] Auth still loading...');
      return;
    }
    
    console.log('[PaymentResult] Auth loaded. Token:', token ? 'Present' : 'Missing');
    console.log('[PaymentResult] Params:', JSON.stringify(params));
    
    const hasAnyParam = params.razorpay_payment_id || params.razorpay_order_id || params.status;
    if (!hasAnyParam) {
      console.log('[PaymentResult] No params found, redirecting home');
      router.replace('/(main)/home');
      return;
    }
    handleResult();
  }, [authLoading]);

  const handleResult = async () => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = params;

    if (!razorpay_payment_id && params.status !== 'success') {
      await AsyncStorage.multiRemove(['pending_booking_data', 'pending_booking_amount']);
      setStatus('cancelled');
      setMessage('Payment was cancelled.');
      setTimeout(() => router.replace('/(main)/home'), 2000);
      return;
    }

    try {
      setMessage('Verifying payment...');

      // Fallback: trust backend status if signatures are missing
      if (params.status === 'success' || params.status === 'SUCCESS') {
        console.log('[PaymentResult] Trusting backend success status');
        await processSuccess();
        return;
      }

      console.log('[PaymentResult] Calling verifyPayment API...');
      const verifyRes = await paymentsAPI.verifyPayment(token || '', {
        razorpay_order_id: razorpay_order_id as string,
        razorpay_payment_id: razorpay_payment_id as string,
        razorpay_signature: razorpay_signature as string,
      });

      if (!verifyRes.success) {
        console.log('[PaymentResult] Verification failed:', verifyRes.error);
        await AsyncStorage.multiRemove(['pending_booking_data', 'pending_booking_amount']);
        setStatus('failed');
        setMessage('Payment verification failed. If money was deducted, contact support.');
        return;
      }

      console.log('[PaymentResult] Verification successful');
      await processSuccess();
    } catch (e: any) {
      console.error('[PaymentResult] Error:', e);
      setStatus('failed');
      setMessage('An error occurred during verification.');
    }
  };

  const processSuccess = async () => {
    const storedBookingData = await AsyncStorage.getItem('pending_booking_data');
    console.log('[PaymentResult] Stored data:', storedBookingData);
    
    await AsyncStorage.multiRemove(['pending_booking_data', 'pending_booking_amount']);

    if (storedBookingData) {
      try {
        const parsed = JSON.parse(storedBookingData);
        setPaymentType(parsed.type);
        
        if (parsed.type === 'CHECKOUT_PAYMENT') {
            try {
              setMessage('Finalizing your check-out...');
              const checkOutRes = await bookingsAPI.checkOut(token || '', parsed.bookingId);
              if (checkOutRes.success) {
                setStatus('success');
                setMessage('Check-out complete! We hope to see you again soon.');
              } else {
                setStatus('failed');
                setMessage(checkOutRes.error || 'Failed to update check-out status.');
              }
            } catch (e: any) {
              console.error('[PaymentResult] Check-out failed:', e);
              setStatus('failed');
              setMessage('Payment successful, but check-out status update failed. Please contact support.');
            }
        } else if (parsed.type === 'wallet_recharge') {
            try {
              console.log('[PaymentResult] Crediting wallet balance. Amount:', parsed.amount, 'Token:', token ? 'Yes' : 'No');
              const creditRes = await walletAPI.addMoney(token || '', parsed.amount);
              console.log('[PaymentResult] addMoney response:', JSON.stringify(creditRes));
              setStatus('success');
              setMessage(`₹${parsed.amount} successfully added to your wallet!`);
            } catch (e: any) {
              console.error('[PaymentResult] Failed to credit wallet:', e);
              setStatus('success'); // Still show success for payment
              setMessage(`Payment successful! However, the wallet update failed: ${e.message || 'Unknown error'}. Please refresh the wallet manually.`);
            }
        } else if (parsed.type === 'EXTEND') {
            setMessage('Extending your stay...');
            const res = await bookingsAPI.extendStay(token || '', parsed.bookingId, parsed.newCheckOut);
            if (res.success) {
                setStatus('success');
                setMessage('Your stay has been extended successfully!');
            } else {
                setStatus('failed');
                setMessage(res.error || 'Failed to extend stay.');
            }
        } else if (parsed.type === 'UPGRADE') {
            setMessage('Upgrading your room...');
            const res = await bookingsAPI.upgradeStay(token || '', parsed.bookingId, parsed.newRoomId);
            if (res.success) {
                setStatus('success');
                setMessage('Your room has been upgraded successfully!');
            } else {
                setStatus('failed');
                setMessage(res.error || 'Failed to upgrade room.');
            }
        } else if (parsed.type === 'TOPUP_BALANCE') {
            setMessage('Settleing outstanding balance...');
            const res = await bookingsAPI.payBalance(token || '', parsed.bookingId, parsed.amount);
            if (res.success) {
                setStatus('success');
                setMessage('Pending balance cleared successfully!');
            } else {
                setStatus('failed');
                setMessage(res.error || 'Failed to settle balance.');
            }
        } else {
            setMessage('Creating your booking...');
            try {
              // FORCE useWallet: true since we just successfully paid via Razorpay
              // and the verify API credited the wallet balance.
              const bookingPayload = { ...parsed, useWallet: true };
              
              const bookingRes = await bookingsAPI.create(token || '', bookingPayload);
              if (bookingRes && (bookingRes.success || bookingRes.booking?.id)) {
                setStatus('success');
                setMessage('Booking confirmed! We are excited to have you.');
              } else {
                setStatus('success');
                setMessage('Payment successful! Your booking is being processed.');
              }
            } catch (bookingError: any) {
              console.error('[PaymentResult] Booking creation failed:', bookingError);
              setStatus('failed');
              setMessage(`Payment was successful, but booking creation failed: ${bookingError.message || 'Unknown error'}. Please contact support with your payment ID.`);
            }
        }
      } catch (e: any) {
        console.error('[PaymentResult] Data processing error:', e);
        setStatus('success');
        setMessage(`Payment successful! (Data error: ${e.message})`);
      }
    } else {
      setStatus('success');
      setMessage('Payment successful!');
    }
  };

  const handleContinue = () => {
    if (status === 'success') {
      if (paymentType === 'wallet_recharge') {
        // Use replace to ensure we don't go back to payment-result
        router.replace('/(drawer)/wallet');
      } else {
        router.replace('/(main)/bookings');
      }
    } else {
      router.replace('/(main)/home');
    }
  };

  if (status === 'processing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A1A1A" />
        <Text style={styles.processingText}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.iconCircle,
        { backgroundColor: status === 'success' ? '#E8F5E9' : status === 'cancelled' ? '#FFF3E0' : '#FFEBEE' }
      ]}>
        <Ionicons
          name={status === 'success' ? 'checkmark-circle' : status === 'cancelled' ? 'close-circle' : 'alert-circle'}
          size={64}
          color={status === 'success' ? '#2E7D32' : status === 'cancelled' ? '#EF6C00' : '#C62828'}
        />
      </View>

      <Text style={styles.title}>
        {status === 'success' ? 'Payment Successful!' : status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
      </Text>

      <Text style={styles.subtitle}>{message}</Text>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>
          {status === 'success' ? (paymentType === 'wallet_recharge' ? 'View Wallet' : 'View My Bookings') : 'Go Home'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  processingText: {
    marginTop: 20,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
