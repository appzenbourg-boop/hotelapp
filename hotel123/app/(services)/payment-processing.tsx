import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';

export default function PaymentProcessing() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(main)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>

      <LottieView
        source={require('../../assets/animations/payment-success.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />

      <Text style={[styles.text, { fontSize: 24, color: '#1A1A1A' }]}>Authorization Confirmed</Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: '#666', fontFamily: 'Inter-Medium' }}>
        Finalizing your settlement folio...
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  animation: {
    width: 260,
    height: 260,
  },

  text: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2F2E2E',
  },

});
