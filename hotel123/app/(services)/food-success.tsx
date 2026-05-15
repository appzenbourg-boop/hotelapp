import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AnimShell, DotLoader, ProgressBar, ConfirmedView } from '../../components/housekeeping/hotelAnimUtils';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';

export default function FoodSuccessScreen() {
  const { serviceId } = useLocalSearchParams<any>();
  const [phase, setPhase] = useState<'loading' | 'confirmed'>('loading');
  const [roomNumber, setRoomNumber] = useState('---');
  const { token } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Spinner Rotations
  const spinDashed = useRef(new Animated.Value(0)).current;
  const spinInner = useRef(new Animated.Value(0)).current;
  const spinReverse = useRef(new Animated.Value(0)).current;

  // Icon forklift animation
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRoomInfo();

    const timer = setTimeout(() => setPhase('confirmed'), 2200);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Spinners
    const createLoop = (val: Animated.Value, duration: number, reverse = false) => {
      Animated.loop(
        Animated.timing(val, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    createLoop(spinDashed, 5000);
    createLoop(spinInner, 1100);
    createLoop(spinReverse, 1800, true);

    // Forklift entrance & subtle float
    Animated.sequence([
      Animated.timing(liftAnim, {
        toValue: 1,
        duration: 550,
        delay: 200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(liftAnim, { toValue: 0.95, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(liftAnim, { toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      )
    ]).start();

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

  const rotateDashed = spinDashed.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateInner = spinInner.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateReverse = spinReverse.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  // forklift/entrance scale + translateY
  const liftY = liftAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const liftScale = liftAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimShell
        label={`ROOM DINING · ROOM ${roomNumber}`}
        showDoneButton={phase === 'confirmed'}
        onDone={() => router.replace('/(main)/home')}
      >
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <View style={styles.loadingContainer}>

              <View style={styles.spinnerWrapper}>
                {/* Dashed Orbit (Kitchen cooking) */}
                <Animated.View style={[styles.orbitDashed, { transform: [{ rotate: rotateDashed }] }]} />

                {/* Solid inner spinner */}
                <Animated.View style={[styles.ringSolid, { transform: [{ rotate: rotateInner }] }]} />

                {/* Slow reverse ring */}
                <Animated.View style={[styles.ringReverse, { transform: [{ rotate: rotateReverse }] }]} />

                <View style={styles.centerOrb}>
                  <Animated.Text style={{
                    fontSize: 28,
                    transform: [{ translateY: liftY }, { scale: liftScale }]
                  }}>🍽</Animated.Text>
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.loadingTitle}>Order Sent to Kitchen…</Text>
                <DotLoader color="#d69e2e" />
              </View>

              <ProgressBar from="#d69e2e" to="#f6e05e" duration="2.2" />
            </View>
          )}

          {/* ── Confirmed phase ── */}
          {phase === 'confirmed' && (
            <ConfirmedView
              accentRgb="214, 158, 46"
              iconBg="#fffbeb"
              iconEl={<Text style={{ fontSize: 38 }}>🍽</Text>}
              title={"Order\nConfirmed"}
              subtitle="Your order has been sent to our kitchen. It will be delivered hot to your door."
              eta="30–40 min"
              extraBadge={
                <TouchableOpacity
                  style={{
                    marginTop: 20, paddingHorizontal: 28, paddingVertical: 14,
                    borderRadius: 30, borderWidth: 1.5, borderColor: '#d69e2e',
                    backgroundColor: 'rgba(214,158,46,0.06)',
                  }}
                  onPress={() => router.push({
                    pathname: '/(drawer)/live-support-chat',
                    params: {
                      serviceId,
                      isService: 'true',
                      hotelName: 'Kitchen Staff',
                    }
                  })}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#d69e2e' }}>💬 Chat with Kitchen</Text>
                </TouchableOpacity>
              }
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
  orbitDashed: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    borderWidth: 2, borderColor: 'rgba(214,158,46,0.35)', borderStyle: 'dashed',
  },
  ringSolid: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 2.5, borderColor: '#d69e2e', borderRightColor: 'rgba(214,158,46,0.2)',
  },
  ringReverse: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, borderColor: '#f6e05e', borderLeftColor: 'rgba(246,224,94,0.2)',
  },
  centerOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fffbeb',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e', marginBottom: 10 },
});
