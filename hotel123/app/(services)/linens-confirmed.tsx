import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { AnimShell, DotLoader, ProgressBar, ConfirmedView } from '../../components/housekeeping/hotelAnimUtils';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';

export default function LinensConfirmedScreen() {
  const [phase, setPhase] = useState<'loading' | 'confirmed'>('loading');
  const [roomNumber, setRoomNumber] = useState('---');
  const { token } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Rotation anims for the triple spinner
  const spin1 = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  const spin3 = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fetch room info
    fetchRoomInfo();

    // Phase transition
    const timer = setTimeout(() => setPhase('confirmed'), 2200);

    // Start animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const createSpin = (val: Animated.Value, duration: number, reverse = false) => {
      Animated.loop(
        Animated.timing(val, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    createSpin(spin1, 1100);
    createSpin(spin2, 850, true);
    createSpin(spin3, 650);

    // Icon float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  const fetchRoomInfo = async () => {
    if (!token) {
      setRoomNumber('412');
      return;
    }
    try {
      const res = await bookingsAPI.getActive(token);
      if (res.success && res.bookings && res.bookings.length > 0) {
        setRoomNumber(res.bookings[0].room?.roomNumber || '---');
      } else {
        setRoomNumber('412');
      }
    } catch (e) {
      setRoomNumber('412');
    }
  };

  const rotate1 = spin1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = spin2.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });
  const rotate3 = spin3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimShell
        label={`LINENS · ROOM ${roomNumber}`}
        showDoneButton={phase === 'confirmed'}
        onDone={() => router.replace('/(main)/home')}
      >
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <View style={styles.loadingContainer}>

              {/* Triple orbital spinner */}
              <View style={styles.spinnerWrapper}>
                <Animated.View style={[styles.arc, styles.arc1, { transform: [{ rotate: rotate1 }] }]} />
                <Animated.View style={[styles.arc, styles.arc2, { transform: [{ rotate: rotate2 }] }]} />
                <Animated.View style={[styles.arc, styles.arc3, { transform: [{ rotate: rotate3 }] }]} />
                <View style={styles.centerOrb}>
                  <Animated.Text style={{ fontSize: 30, transform: [{ translateY }] }}>🛏</Animated.Text>
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.loadingTitle}>Requesting Linens…</Text>
                <DotLoader color="#3b82f6" />
              </View>

              <ProgressBar from="#3b82f6" to="#93c5fd" duration="2.2" />
            </View>
          )}

          {/* ── Confirmed phase ── */}
          {phase === 'confirmed' && (
            <ConfirmedView
              accentRgb="59, 130, 246"
              iconBg="#dbeafe"
              title={"Linens Request\nConfirmed"}
              subtitle="Fresh bedding & towels are being prepared. Our team will arrive at your room shortly."
              eta="15–20 min"
            />
          )}

        </Animated.View>
      </AnimShell>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { alignItems: 'center', gap: 28 },
  spinnerWrapper: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  arc: {
    position: 'absolute',
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  arc1: {
    width: 140, height: 140, borderRadius: 70,
    borderTopColor: '#3b82f6',
    borderRightColor: 'rgba(59,130,246,0.3)',
    borderWidth: 2.5,
  },
  arc2: {
    width: 112, height: 112, borderRadius: 56,
    borderBottomColor: '#60a5fa',
    borderLeftColor: 'rgba(96,165,250,0.3)',
    borderWidth: 2,
  },
  arc3: {
    width: 84, height: 84, borderRadius: 42,
    borderTopColor: '#93c5fd',
    borderRightColor: 'rgba(147,197,253,0.3)',
    borderWidth: 1.5,
  },
  centerOrb: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e', marginBottom: 10 },
});
