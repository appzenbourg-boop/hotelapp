import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { router, Stack } from 'expo-router';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI } from '../../services/api';
import { AnimShell, DotLoader, ProgressBar, BurstParticles } from '../../components/housekeeping/hotelAnimUtils';
import Svg, { Path } from 'react-native-svg';

const OPTIONS = [
  { label: "Full Clean", icon: "🧽", desc: "Complete room cleaning & refresh" },
  { label: "Quick Tidy", icon: "✨", desc: "Light straightening & surfaces" },
  { label: "Turn Down Service", icon: "🌙", desc: "Evening bed & amenity prep" },
];

export default function HouseKeepingScreen() {
  const { token } = useAuth();
  const [phase, setPhase] = useState<'picker' | 'loading' | 'confirmed' | 'error'>('picker');
  const [selected, setSelected] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastServiceId, setLastServiceId] = useState<string | null>(null);

  // Animations for phases
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [phase]);

  const { data: screenData, isLoading: fetching } = useSWR(
    token ? ['housekeeping_data', token] : null,
    async () => {
      try {
        const bookingRes = await bookingsAPI.getActive(token);
        if (bookingRes.success && bookingRes.bookings?.length > 0) {
          const booking = bookingRes.bookings[0];
          const propertyId = booking.room?.propertyId || booking.propertyId;
          
          let hkOptions = OPTIONS;
          if (propertyId) {
            try {
              const configRes = await servicesAPI.getConfigs(propertyId);
              if (configRes?.success && configRes.configs) {
                const hkConfig = configRes.configs.find((c: any) => c.type === 'HOUSEKEEPING');
                if (hkConfig?.options?.length > 0) {
                  hkOptions = hkConfig.options.filter((opt: any) => opt.label !== "Do Not Disturb");
                }
              }
            } catch (e) {}
          }
          return { roomNumber: booking.room?.roomNumber || '---', options: hkOptions, roomId: booking.roomId };
        }
        return { roomNumber: '412', options: OPTIONS, roomId: null };
      } catch (e) {
        return { roomNumber: '412', options: OPTIONS, roomId: null };
      }
    }
  );

  const roomNumber = screenData?.roomNumber || '---';
  const options = screenData?.options || OPTIONS;

  const handleConfirm = async () => {
    if (!selected) return;

    setPhase('loading');

    if (!token) {
      // Demo mode animation for verification
      setTimeout(() => setPhase('confirmed'), 2000);
      return;
    }

    try {
      // 1. Get room ID first
      let bookingRes = await bookingsAPI.getActive(token);
      let booking = (bookingRes.success && bookingRes.bookings && bookingRes.bookings.length > 0) ? bookingRes.bookings[0] : null;

      if (!booking) {
        bookingRes = await bookingsAPI.getUpcoming(token);
        if (bookingRes.success && bookingRes.bookings && bookingRes.bookings.length > 0) {
          booking = bookingRes.bookings[0];
        }
      }

      if (booking) {
        const res = await servicesAPI.requestHousekeeping(token, booking.roomId, `Service: ${selected}`);
        if (res.success) {
          // Store service ID for chat linkage
          setLastServiceId(res.request?.id || res.id);
          setTimeout(() => setPhase('confirmed'), 2000);
        } else {
          setPhase('error');
          setErrorMsg('Failed to submit request.');
        }
      } else {
        setPhase('error');
        setErrorMsg('No active booking found.');
      }
    } catch (e) {
      setPhase('error');
      setErrorMsg('Network error occurred.');
    }
  };

  if (phase === 'error') {
    return (
      <AnimShell label={`HOUSEKEEPING · ROOM ${roomNumber}`} showDoneButton={true} onDone={() => router.back()}>
        <Text style={{ color: 'red', fontSize: 18, fontFamily: 'Poppins-SemiBold' }}>Request Failed</Text>
        <Text style={{ color: '#7A7A7A', textAlign: 'center', marginTop: 10 }}>{errorMsg}</Text>
      </AnimShell>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimShell
        label={`HOUSEKEEPING · ROOM ${roomNumber}`}
        showDoneButton={phase === 'confirmed'}
        onDone={() => router.back()}
      >
        <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

          {/* ══════════════════════════════════════════
                        PHASE 1 — Option picker
                    ══════════════════════════════════════════ */}
          {phase === 'picker' && (
            <View style={{ width: '100%' }}>
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Text style={{ fontSize: 26 }}>🧹</Text>
                </View>
                <Text style={styles.headerTitle}>Housekeeping</Text>
                <Text style={styles.headerSubtitle}>Select the type of service you need</Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                {fetching && options.length === 3 ? (
                   <View style={{ gap: 10 }}>
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} height={80} borderRadius={20} />
                      ))}
                   </View>
                ) : options.map((opt) => {
                  const isSel = selected === opt.label;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => setSelected(opt.label)}
                      activeOpacity={0.7}
                      style={[
                        styles.optionCard,
                        isSel && styles.optionCardSelected
                      ]}
                    >
                      <View style={[styles.optionIcon, isSel && styles.optionIconSelected]}>
                        <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, isSel && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                      <View style={[styles.radio, isSel && styles.radioSelected]}>
                        {isSel && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
                disabled={!selected}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>
                  {selected ? `Request ${selected}` : "Select a service type"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════
                        PHASE 2 — Loading
                    ══════════════════════════════════════════ */}
          {phase === 'loading' && (
            <View style={styles.loadingContainer}>
              <View style={styles.loaderGraphic}>
                <View style={styles.loaderOrbOuter} />
                <View style={styles.loaderOrbInner}>
                  <Text style={{ fontSize: 30 }}>🧹</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={styles.loadingTitle}>Dispatching Team...</Text>
                <Text style={styles.loadingSubtitle}>{selected}</Text>
                <DotLoader color="#9f7aea" />
              </View>

              <ProgressBar to="#9f7aea" duration="2.4" />
            </View>
          )}

          {/* ══════════════════════════════════════════
                        PHASE 3 — Confirmed
                    ══════════════════════════════════════════ */}
          {phase === 'confirmed' && (
            <View style={styles.confirmedContainer}>
              <View style={styles.orbWrapper}>
                <View style={styles.rippleHaze} />
                <View style={styles.rippleMiddle} />
                <View style={styles.rippleInner}>
                  <Svg width="52" height="52" viewBox="0 0 52 52">
                    <Path
                      d="M26 10 L27.8 21 L38 22.5 L27.8 24 L26 35 L24.2 24 L14 22.5 L24.2 21 Z"
                      fill="#1c1c1e"
                    />
                    <Path
                      d="M38 8 L38.8 12 L43 12.5 L38.8 13 L38 17 L37.2 13 L33 12.5 L37.2 12 Z"
                      fill="#1c1c1e" opacity="0.85"
                    />
                    <Path
                      d="M40 28 L40.5 31 L44 31.5 L40.5 32 L40 35 L39.5 32 L36 31.5 L39.5 31 Z"
                      fill="#1c1c1e" opacity="0.70"
                    />
                  </Svg>
                </View>
                <BurstParticles color="rgba(159,122,234,0.65)" color2="rgba(183,148,244,0.55)" />
              </View>

              <Text style={styles.confirmedTitle}>
                House Keeping Request{"\n"}Confirmed
              </Text>

              <Text style={styles.confirmedSubtitle}>
                Housekeeping has been requested. Please wait a few minutes — our team will reach your room shortly.
              </Text>

              <View style={styles.etaBadge}>
                <View style={styles.etaDot} />
                <Text style={styles.etaText}>
                  {selected} · 20–30 MIN
                </Text>
              </View>

              {/* Chat with assigned staff */}
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => router.push({
                  pathname: '/(drawer)/live-support-chat',
                  params: {
                    serviceId: lastServiceId, // Link to specific request
                    isService: 'true',
                    hotelName: 'Assigned Staff Member',
                    propertyId: '',
                  }
                })}
              >
                <Text style={styles.chatBtnText}>💬 Chat with Staff</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </AnimShell>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 24 },
  headerIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: 'rgba(159,122,234,0.14)',
    borderWidth: 1.5, borderColor: 'rgba(159,122,234,0.32)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12
  },
  headerTitle: { fontSize: 22, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e' },
  headerSubtitle: { fontSize: 13, color: '#9a9690', marginTop: 4, fontFamily: 'Inter-Regular' },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 10,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(159,122,234,0.10)',
    borderColor: 'rgba(159,122,234,0.48)',
  },
  optionIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#f5f3f0',
    alignItems: 'center', justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: 'rgba(159,122,234,0.18)' },
  optionLabel: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#1c1c1e' },
  optionLabelSelected: { color: '#6b46c1' },
  optionDesc: { fontSize: 12, color: '#9a9690', marginTop: 2, fontFamily: 'Inter-Regular' },

  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#d0ccc6',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#9f7aea', backgroundColor: 'rgba(159,122,234,0.18)' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9f7aea' },

  confirmBtn: {
    width: '100%', height: 60, borderRadius: 30,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnDisabled: { backgroundColor: '#d8d4cf' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins-Medium' },

  loadingContainer: { alignItems: 'center', gap: 30 },
  loaderGraphic: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  loaderOrbOuter: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 3,
    borderColor: '#9f7aea', borderRightColor: 'transparent',
  },
  loaderOrbInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#faf5ff',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e' },
  loadingSubtitle: { fontSize: 13, color: '#9a9690', marginBottom: 4, fontFamily: 'Inter-Regular' },

  confirmedContainer: { alignItems: 'center', width: '100%' },
  orbWrapper: { position: 'relative', width: 170, height: 170, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  rippleHaze: {
    position: 'absolute', width: 170, height: 170,
    borderRadius: 85, backgroundColor: 'rgba(159,122,234,0.10)',
  },
  rippleMiddle: {
    position: 'absolute', width: 134, height: 134,
    borderRadius: 67, backgroundColor: 'rgba(159,122,234,0.18)',
  },
  rippleInner: {
    width: 102, height: 102, borderRadius: 51,
    backgroundColor: 'rgba(159,122,234,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmedTitle: { fontSize: 27, fontFamily: 'Poppins-Bold', color: '#1c1c1e', textAlign: 'center', lineHeight: 32, marginBottom: 12 },
  confirmedSubtitle: { fontSize: 14, color: '#8a8680', textAlign: 'center', lineHeight: 22, maxWidth: 280, marginBottom: 20, fontFamily: 'Inter-Regular' },

  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: 99, backgroundColor: 'rgba(159,122,234,0.10)',
    borderWidth: 1, borderColor: 'rgba(159,122,234,0.32)',
  },
  etaDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#9f7aea' },
  etaText: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#6b46c1', textTransform: 'uppercase', letterSpacing: 0.5 },
  chatBtn: {
    marginTop: 20, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 30, borderWidth: 1.5, borderColor: '#1565C0',
    backgroundColor: 'rgba(21,101,192,0.06)',
  },
  chatBtnText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1565C0' },
});
