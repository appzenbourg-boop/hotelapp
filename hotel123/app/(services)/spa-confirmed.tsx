import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AnimShell, DotLoader, ProgressBar, ConfirmedView } from '../../components/housekeeping/hotelAnimUtils';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';

export default function SpaConfirmedScreen() {
    const { treatmentName = "Wellness Treatment" } = useLocalSearchParams<{ treatmentName: string }>();
    const [phase, setPhase] = useState<'loading' | 'confirmed'>('loading');
    const [roomNumber, setRoomNumber] = useState('---');
    const { token } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Triple rings rotations
    const spin1 = useRef(new Animated.Value(0)).current;
    const spin2 = useRef(new Animated.Value(0)).current;
    const spin3 = useRef(new Animated.Value(0)).current;

    // Haze ripple
    const rippleAnim = useRef(new Animated.Value(0)).current;

    // Icon leaf sway
    const swayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchRoomInfo();

        const timer = setTimeout(() => setPhase('confirmed'), 2200);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        const createLoop = (val: Animated.Value, duration: number) => {
            Animated.loop(
                Animated.timing(val, {
                    toValue: 1,
                    duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        createLoop(spin1, 2200);
        createLoop(spin2, 2900);
        createLoop(spin3, 3600);

        // Ripple pulse
        Animated.loop(
            Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            })
        ).start();

        // Leaf sway
        Animated.loop(
            Animated.sequence([
                Animated.timing(swayAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(swayAnim, { toValue: -1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
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
    const rotate2 = spin2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const rotate3 = spin3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const rippleScale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
    const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.6, 0.3, 0] });

    const swayRotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AnimShell
                label={`SPA & WELLNESS · ROOM ${roomNumber}`}
                showDoneButton={phase === 'confirmed'}
                onDone={() => router.replace('/(main)/home')}
            >
                <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

                    {/* ── Loading phase ── */}
                    {phase === 'loading' && (
                        <View style={styles.loadingContainer}>

                            <View style={styles.spinnerWrapper}>
                                {/* Concentric slow rings */}
                                <Animated.View style={[styles.ring, styles.ring1, { transform: [{ rotate: rotate1 }] }]} />
                                <Animated.View style={[styles.ring, styles.ring2, { transform: [{ rotate: rotate2 }] }]} />
                                <Animated.View style={[styles.ring, styles.ring3, { transform: [{ rotate: rotate3 }] }]} />

                                {/* Haze ripple */}
                                <Animated.View style={[styles.haze, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />

                                <View style={styles.centerOrb}>
                                    <Animated.Text style={{ fontSize: 32, transform: [{ rotate: swayRotate }] }}>🌿</Animated.Text>
                                </View>
                            </View>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.loadingTitle}>Alerting Wellness Team…</Text>
                                <Text style={styles.treatmentText}>{treatmentName}</Text>
                                <DotLoader color="#68d391" />
                            </View>

                            <ProgressBar to="#9ae6b4" duration="2.2" />
                        </View>
                    )}

                    {/* ── Confirmed phase ── */}
                    {phase === 'confirmed' && (
                        <ConfirmedView
                            accentRgb="104, 211, 145"
                            iconBg="#f0fff4"
                            iconEl={<Text style={{ fontSize: 38 }}>🌿</Text>}
                            title={"Wellness Team\nAlerted"}
                            subtitle={`Our spa team will contact you shortly to confirm your ${treatmentName} details.`}
                            eta="By appointment"
                            extraBadge={
                                <View style={styles.extraBadge}>
                                    <Text style={styles.extraBadgeText}>Specialist will confirm timing</Text>
                                </View>
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
    ring: {
        position: 'absolute', borderRadius: 70, borderWidth: 1.8,
        borderColor: 'rgba(104,211,145,0.45)',
    },
    ring1: { width: 140, height: 140, borderRadius: 70 },
    ring2: { width: 112, height: 112, borderRadius: 56, borderWidth: 1.4, borderColor: 'rgba(104,211,145,0.32)' },
    ring3: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(104,211,145,0.22)' },
    haze: {
        position: 'absolute', width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(104,211,145,0.12)',
    },
    centerOrb: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#f0fff4',
        alignItems: 'center', justifyContent: 'center',
    },
    loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e', marginBottom: 4 },
    treatmentText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#68d391', marginBottom: 12 },
    extraBadge: {
        marginTop: 15, paddingVertical: 8, paddingHorizontal: 20,
        backgroundColor: '#f0fff4', borderRadius: 99,
        borderWidth: 1, borderColor: '#9ae6b4',
    },
    extraBadgeText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#276749' },
});
