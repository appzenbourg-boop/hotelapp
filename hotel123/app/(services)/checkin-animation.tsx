import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur'; // Disabled for Expo Go compatibility

const { width } = Dimensions.get('window');

const icons = ['🪪', '💳', '🛎️', '🗝️'];

// Redesigned Theme Colors
const COLORS = {
    background: '#EFECEC', // App background
    card: '#FFFFFF',
    text: '#2F2E2E',
    accent: '#F8D3D3', // Peach color from success screens
    border: '#D1D1D1',
    door: '#4A2C2A', // Rich Mahogany
    doorFrame: '#B8860B', // Dark Goldenrod / Brass
    doorBack: '#FAF3E0', // Warm Cream / Almond
    lockGold: '#FFD700', // Gold
    iconInactive: '#E0E0E0',
};

export default function CheckinAnimation() {
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);

    const walkAnim = useRef(new Animated.Value(0)).current;
    const doorRotate = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (done) {
            const timer = setTimeout(() => {
                router.replace('/(main)/home');
            }, 2000);
            return () => clearTimeout(timer);
        }

        if (step < icons.length) {
            const timer = setTimeout(() => setStep((s) => s + 1), 1400);
            return () => clearTimeout(timer);
        } else {
            setTimeout(() => setDone(true), 600);
        }
    }, [step, done]);

    useEffect(() => {
        if (step > 0 && step < 4) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(walkAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.timing(walkAnim, {
                        toValue: 0,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            walkAnim.setValue(0);
        }

        if (step >= 4) {
            Animated.timing(doorRotate, {
                toValue: 1,
                duration: 900,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }).start();
        }
    }, [step]);

    useEffect(() => {
        if (done) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [done]);

    const doorRotation = doorRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-65deg'],
    });

    const walkTranslateX = walkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, -1],
    });

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.glow} />

                {!done ? (
                    <>
                        <View style={styles.animationArea}>
                            <View style={[styles.doorFrameWrap, { transform: [{ perspective: 500 }] }]}>
                                {/* Outer Frame (Brass) */}
                                <View style={styles.doorOuterFrame} />

                                {/* Inner Cream Wall */}
                                <View style={styles.doorBack} />

                                <Animated.View
                                    style={[
                                        styles.door,
                                        { transform: [{ rotateY: doorRotation }] },
                                        step >= 4 && styles.doorOpenShadow,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.lockIndicator,
                                            {
                                                backgroundColor:
                                                    step >= 3 ? COLORS.lockGold : 'rgba(0,0,0,0.3)',
                                                shadowOpacity: step >= 3 ? 0.6 : 0,
                                            },
                                        ]}
                                    />
                                    {/* Panel detail */}
                                    <View style={styles.doorDetailTop} />
                                    <View style={styles.doorDetailBottom} />
                                </Animated.View>
                                {step >= 4 && <View style={styles.roomGlow} />}
                            </View>

                            <Animated.Text
                                style={[
                                    styles.walker,
                                    {
                                        left: step >= 4 ? '60%' : '-30%',
                                        transform: [{ scaleX: walkTranslateX }],
                                    },
                                ]}
                            >
                                🚶
                            </Animated.Text>
                        </View>

                        <View style={styles.iconRow}>
                            {icons.map((icon, i) => {
                                const complete = i < step - 1 || step > icons.length;
                                const active = i === step - 1 && step <= icons.length;
                                const pending = i >= step;

                                return (
                                    <View
                                        key={i}
                                        style={[
                                            styles.iconCircle,
                                            complete && styles.iconComplete,
                                            active && styles.iconActive,
                                            pending && styles.iconPending,
                                        ]}
                                    >
                                        <Text style={[styles.iconText, (active || complete) && { opacity: 1 }]}>{icon}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={styles.statusText}>Preparing your royal stay...</Text>
                    </>
                ) : (
                    <Animated.View
                        style={[
                            styles.doneContainer,
                            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#B8860B']}
                            style={styles.doneCircle}
                        >
                            <Text style={styles.finalIcon}>🗝️</Text>
                        </LinearGradient>
                        <Text style={styles.welcomeText}>Welcome Home</Text>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        paddingVertical: 60,
        paddingHorizontal: 40,
        width: 320,
        borderRadius: 45,
        backgroundColor: COLORS.card,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.12,
        shadowRadius: 50,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -80,
        left: '50%',
        marginLeft: -100,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(184, 134, 11, 0.05)',
        zIndex: -1,
    },
    animationArea: {
        width: 120,
        height: 150,
        marginBottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doorFrameWrap: {
        width: 100,
        height: 140,
        position: 'relative',
    },
    doorOuterFrame: {
        position: 'absolute',
        top: -4,
        bottom: -4,
        left: -4,
        right: -4,
        borderWidth: 6,
        borderColor: COLORS.doorFrame,
        borderRadius: 14,
        backgroundColor: COLORS.doorFrame,
    },
    doorBack: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.doorBack,
        borderRadius: 8,
    },
    door: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.door,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: '#3D2423',
        backfaceVisibility: 'hidden',
        zIndex: 5,
    },
    doorOpenShadow: {
        shadowColor: '#000',
        shadowOffset: { width: -15, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    lockIndicator: {
        position: 'absolute',
        right: 14,
        top: '55%',
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
    },
    doorDetailTop: {
        position: 'absolute',
        top: 20,
        left: 12,
        right: 12,
        height: 40,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
    },
    doorDetailBottom: {
        position: 'absolute',
        bottom: 20,
        left: 12,
        right: 12,
        height: 50,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
    },
    roomGlow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 215, 0, 0.25)',
    },
    walker: {
        position: 'absolute',
        bottom: -30,
        fontSize: 32,
        zIndex: 10,
    },
    iconRow: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 20,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    iconComplete: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    iconActive: {
        backgroundColor: COLORS.text,
        borderColor: COLORS.text,
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    iconPending: {
        opacity: 0.3,
    },
    iconText: {
        fontSize: 20,
    },
    doneContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#B8860B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
    },
    finalIcon: {
        fontSize: 44,
    },
    statusText: {
        color: COLORS.text,
        opacity: 0.6,
        marginTop: 35,
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        letterSpacing: 0.5,
    },
    welcomeText: {
        color: COLORS.text,
        marginTop: 28,
        fontSize: 24,
        fontFamily: 'Poppins-SemiBold',
    },
});
