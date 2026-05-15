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

export default function ToiletriesScreen() {
  const [phase, setPhase] = useState<'loading' | 'confirmed'>('loading');
  const [roomNumber, setRoomNumber] = useState('---');
  const { token } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Spinner Rotations
  const spinOuter = useRef(new Animated.Value(0)).current;
  const spinInner = useRef(new Animated.Value(0)).current;

  // Center icon float
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Bubbles
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRoomInfo();

    const timer = setTimeout(() => setPhase('confirmed'), 2200);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Spinners
    const createSpin = (val: Animated.Value, duration: number, reverse: boolean) => {
      Animated.loop(
        Animated.timing(val, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };
    createSpin(spinOuter, 1000, false);
    createSpin(spinInner, 750, true);

    // Icon float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    // Bubbles rise
    const animateBubble = (val: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animateBubble(bubble1, 0);
    animateBubble(bubble2, 350);
    animateBubble(bubble3, 700);

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

  const rotateOuter = spinOuter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateInner = spinInner.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });
  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const getBubbleStyle = (val: Animated.Value) => ({
    transform: [
      { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
      { scale: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0.5] }) }
    ],
    opacity: val.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] })
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimShell
        label={`TOILETRIES · ROOM ${roomNumber}`}
        showDoneButton={phase === 'confirmed'}
        onDone={() => router.replace('/(main)/home')}
      >
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <View style={styles.loadingContainer}>

              <View style={styles.spinnerWrapper}>
                <Animated.View style={[styles.outerRing, { transform: [{ rotate: rotateOuter }] }]} />
                <Animated.View style={[styles.innerRing, { transform: [{ rotate: rotateInner }] }]} />

                {/* Bubbles */}
                <Animated.View style={[styles.bubble, { left: '30%', top: '60%' }, getBubbleStyle(bubble1)]} />
                <Animated.View style={[styles.bubble, { left: '50%', top: '65%', width: 10, height: 10 }, getBubbleStyle(bubble2)]} />
                <Animated.View style={[styles.bubble, { left: '70%', top: '60%', width: 12, height: 12 }, getBubbleStyle(bubble3)]} />

                <View style={styles.centerOrb}>
                  <Animated.Text style={{ fontSize: 32, transform: [{ translateY }] }}>🧴</Animated.Text>
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.loadingTitle}>Preparing Amenities…</Text>
                <DotLoader color="#ed8936" />
              </View>

              <ProgressBar to="#f6ad55" duration="2.2" />
            </View>
          )}

          {/* ── Confirmed phase ── */}
          {phase === 'confirmed' && (
            <ConfirmedView
              accentRgb="237, 137, 54"
              iconBg="#fff3e0"
              iconEl={<Text style={{ fontSize: 38 }}>🧴</Text>}
              title={"Toiletries\nConfirmed"}
              subtitle="Your personal care amenities are being packaged and will arrive at your door soon."
              eta="10–15 min"
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
  outerRing: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    borderWidth: 2.5, borderColor: '#ed8936', borderRightColor: 'rgba(237,137,54,0.2)',
  },
  innerRing: {
    position: 'absolute', width: 108, height: 108, borderRadius: 54,
    borderWidth: 2, borderColor: '#f6ad55', borderLeftColor: 'rgba(246,173,85,0.2)',
  },
  centerOrb: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    position: 'absolute', width: 8, height: 8, borderRadius: 6,
    backgroundColor: 'rgba(246,173,85,0.6)',
  },
  loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e', marginBottom: 10 },
});
