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

export default function DoorConfirmedScreen() {
    const [phase, setPhase] = useState<'shaking' | 'locking' | 'confirmed'>('shaking');
    const [roomNumber, setRoomNumber] = useState('---');
    const { token } = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Shake animation
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Locking spinner
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Ripple pulse
    const rippleAnim = useRef(new Animated.Value(0)).current;

    // Lock click effect
    const clickAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchRoomInfo();

        const t1 = setTimeout(() => setPhase('locking'), 1100);
        const t2 = setTimeout(() => setPhase('confirmed'), 2400);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Shaking loop
        const shakeLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
            ])
        );
        shakeLoop.start();

        // Ripple loop
        Animated.loop(
            Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            })
        ).start();

        // Spinner loop (locking phase)
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            shakeLoop.stop();
        };
    }, []);

    useEffect(() => {
        if (phase === 'locking') {
            Animated.sequence([
                Animated.timing(clickAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
                Animated.timing(clickAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [phase]);

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

    const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] });
    const spinRotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const rippleScale = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
    const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AnimShell
                label={`DOOR LOCK · ROOM ${roomNumber}`}
                showDoneButton={phase === 'confirmed'}
                onDone={() => router.replace('/(main)/home')}
            >
                <Animated.View style={{ width: '100%', opacity: fadeAnim }}>

                    {/* ── Loading phases ── */}
                    {phase !== 'confirmed' && (
                        <View style={styles.loadingContainer}>

                            <View style={styles.spinnerWrapper}>
                                {/* Spinner (locking only) */}
                                {phase === 'locking' && (
                                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spinRotate }] }]} />
                                )}

                                {/* Ripple (shaking only) */}
                                {phase === 'shaking' && (
                                    <Animated.View style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />
                                )}

                                <View style={styles.centerOrb}>
                                    <Animated.Text style={{
                                        fontSize: 36,
                                        transform: [
                                            { translateX: phase === 'shaking' ? shakeX : 0 },
                                            { scale: phase === 'locking' ? clickAnim : 1 }
                                        ]
                                    }}>
                                        {phase === 'locking' ? "🔒" : "🔐"}
                                    </Animated.Text>
                                </View>
                            </View>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.loadingTitle}>
                                    {phase === 'shaking' ? "Detecting Issue…" : "Securing Lock…"}
                                </Text>
                                <DotLoader color="#e53e3e" />
                            </View>

                            <ProgressBar from="#e53e3e" to="#fc8181" duration="2.4" />
                        </View>
                    )}

                    {/* ── Confirmed phase ── */}
                    {phase === 'confirmed' && (
                        <ConfirmedView
                            accentRgb="229, 62, 62"
                            iconBg="#fff5f5"
                            iconEl={<Text style={{ fontSize: 38 }}>🔒</Text>}
                            title={"Security Team\nNotified"}
                            subtitle="Our security team has been alerted and will assist you with the door lock immediately."
                            eta="5–10 min"
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
    spinner: {
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        borderWidth: 2.5, borderColor: '#e53e3e', borderRightColor: 'rgba(229,62,62,0.2)',
    },
    ripple: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        borderWidth: 2, borderColor: 'rgba(229,62,62,0.3)',
    },
    centerOrb: {
        width: 84, height: 84, borderRadius: 42,
        backgroundColor: '#fff5f5',
        alignItems: 'center', justifyContent: 'center',
    },
    loadingTitle: { fontSize: 21, fontFamily: 'Poppins-SemiBold', color: '#1c1c1e', marginBottom: 10 },
});
