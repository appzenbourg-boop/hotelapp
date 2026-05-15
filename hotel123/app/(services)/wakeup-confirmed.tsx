import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AnimShell, DotLoader, BurstParticles, ProgressBar } from '../../components/housekeeping/hotelAnimUtils';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WakeupConfirmedScreen() {
  const { wakeTime = "07:00 AM" } = useLocalSearchParams<{ wakeTime: string }>();
  const [phase, setPhase] = useState<'loading' | 'confirmed'>('loading');
  const [roomNumber, setRoomNumber] = useState('---');
  const { token } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRoomInfo();
    const timer = setTimeout(() => setPhase('confirmed'), 2400);
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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    if (phase === 'loading') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      ).start();
    }
  }, [phase]);

  const ringRotate = ringAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <AnimShell
        label={`WAKE-UP CALL · ROOM ${roomNumber}`}
        showDoneButton={phase === 'confirmed'}
        onDone={() => router.replace('/(main)/home')}
        doneButtonColor="#1E293B"
      >
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* ── Loading phase ── */}
          {phase === 'loading' && (
            <View style={styles.loadingContainer}>

              <View style={styles.timeCard}>
                <Text style={styles.timeLabel}>SCHEDULED FOR</Text>
                <Text style={styles.timeBig}>{wakeTime}</Text>
              </View>

              <View style={styles.loaderGraphic}>
                <View style={styles.loaderOrbOuter} />
                <Animated.View style={[styles.loaderOrbInner, { transform: [{ rotate: ringRotate }] }]}>
                  <MaterialCommunityIcons name="alarm-check" size={36} color="#1E293B" />
                </Animated.View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.loadingTitle}>Setting your alarm…</Text>
                <DotLoader color="#1E293B" />
              </View>

              <ProgressBar to="#1E293B" duration="2.4" />
            </View>
          )}

          {/* ── Confirmed phase ── */}
          {phase === 'confirmed' && (
            <View style={styles.confirmedContainer}>

              <View style={styles.orbWrapper}>
                <View style={styles.rippleHaze} />
                <View style={styles.rippleInnerHaze} />
                <BurstParticles color="rgba(30,41,59,0.3)" color2="rgba(30,41,59,0.1)" />
                <View style={styles.rippleInner}>
                  <MaterialCommunityIcons name="alarm-check" size={44} color="#1E293B" />
                </View>
              </View>

              <Text style={styles.confirmedTitle}>
                {"Rise and Shine!"}
              </Text>

              <Text style={styles.confirmedSubtitle}>
                Your morning wake-up call is successfully scheduled. Sleep well.
              </Text>

              <View style={styles.finalTimeCard}>
                <Text style={styles.finalTimeText}>{wakeTime}</Text>
              </View>

              <View style={styles.confBadge}>
                <Text style={styles.confText}>Tomorrow · Room Service Confirmed</Text>
              </View>
            </View>
          )}

        </Animated.View>
      </AnimShell>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { alignItems: 'center', gap: 24 },
  timeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timeBig: {
    fontSize: 44,
    fontFamily: 'Poppins-Bold',
    color: '#1E293B',
  },
  loaderGraphic: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  loaderOrbOuter: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, borderWidth: 3,
    borderColor: '#1E293B', borderRightColor: 'transparent',
  },
  loaderOrbInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: '#1E293B', marginBottom: 10 },

  confirmedContainer: { alignItems: 'center', width: '100%' },
  orbWrapper: { position: 'relative', width: 160, height: 160, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  rippleHaze: {
    position: 'absolute', width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(30,41,59,0.05)',
  },
  rippleInnerHaze: {
    position: 'absolute', width: 130, height: 130,
    borderRadius: 65, backgroundColor: 'rgba(30,41,59,0.03)',
  },
  rippleInner: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmedTitle: { fontSize: 32, fontFamily: 'Poppins-Bold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  confirmedSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, maxWidth: 280, marginBottom: 20, fontFamily: 'Inter-Medium' },

  finalTimeCard: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 20,
  },
  finalTimeText: { fontSize: 40, fontFamily: 'Poppins-Bold', color: '#FFF', textAlign: 'center' },

  confBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
  },
  confText: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#475569' },
});
