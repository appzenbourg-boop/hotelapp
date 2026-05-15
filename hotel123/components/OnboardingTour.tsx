import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Easing,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

const STEPS = [
    { item: 'welcome', title: 'Welcome to Zenbourg', msg: 'Explore your premium hospitality dashboard. Let us show you how to manage your stay.', arrow: null },
    { item: 'menu', title: 'Navigation Menu', msg: 'Tap the drawer icon to access your profile, bookings, and settings.', arrow: 'up-left' },
    { item: 'search', title: 'Search Hotels', msg: 'Find and book properties across all locations with date and guest filters.', arrow: 'down' },
    { item: 'hotel', title: 'Active Stays', msg: 'Track your current or upcoming hotel stays and access key details here.', arrow: 'up' },
    { item: 'services', title: 'In-Room Services', msg: 'Request housekeeping, food, or door access directly through these buttons.', arrow: 'up' },
    { item: 'finish', title: 'Complete Setup', msg: 'You are ready to use the app. Tap anywhere to start your experience.', arrow: null },
];

export default function OnboardingTour({ userId }: { userId?: string }) {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const opacity = React.useMemo(() => new Animated.Value(0), []);
    const slideY = React.useMemo(() => new Animated.Value(20), []);

    const storageKey = `formal_app_tour_${userId || 'default'}`;

    useEffect(() => {
        (async () => {
            try {
                const done = await AsyncStorage.getItem(storageKey);
                if (!done) {
                    setTimeout(() => {
                        setStepIndex(0);
                        setVisible(true);
                    }, 1500);
                }
            } catch { }
        })();
    }, [userId]);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(slideY, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            ]).start();
        }
    }, [visible, stepIndex]);

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(i => i + 1);
        } else {
            finishTour();
        }
    };

    const handlePrev = () => setStepIndex(i => Math.max(0, i - 1));

    const finishTour = async () => {
        setVisible(false);
        try { await AsyncStorage.setItem(storageKey, 'true'); } catch { }
    };

    if (!visible) return null;

    const step = STEPS[stepIndex];

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                {/* Semi-transparent background */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={finishTour}
                />

                <Animated.View style={[
                    styles.card,
                    { opacity, transform: [{ translateY: slideY }] }
                ]}>
                    <View style={styles.header}>
                        <Text style={styles.stepCount}>TOOLTIP {stepIndex + 1} OF {STEPS.length}</Text>
                        <TouchableOpacity onPress={finishTour}>
                            <Ionicons name="close" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.msg}>{step.msg}</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.dotRow}>
                            {STEPS.map((_, i) => (
                                <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
                            ))}
                        </View>

                        <View style={styles.btnRow}>
                            {stepIndex > 0 && (
                                <TouchableOpacity onPress={handlePrev} style={styles.backBtn}>
                                    <Text style={styles.backText}>Previous</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                                <Text style={styles.nextText}>{stepIndex === STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contextual Directional Arrow (Formal) */}
                    {step.arrow === 'up-left' && (
                        <Ionicons name="arrow-up-outline" size={30} color="#fff" style={styles.arrowTopLeft} />
                    )}
                    {step.arrow === 'down' && (
                        <Ionicons name="arrow-down-outline" size={30} color="#fff" style={styles.arrowBottomCenter} />
                    )}
                    {step.arrow === 'up' && (
                        <Ionicons name="arrow-up-outline" size={30} color="#fff" style={styles.arrowTopCenter} />
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepCount: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    content: {
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    msg: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotRow: {
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
    },
    dotActive: {
        backgroundColor: '#2F2E2E',
        width: 14,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    backBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    backText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    nextBtn: {
        backgroundColor: '#2F2E2E',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    nextText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },

    // Positional arrows to point at features
    arrowTopLeft: {
        position: 'absolute',
        top: -50,
        left: 20,
    },
    arrowBottomCenter: {
        position: 'absolute',
        bottom: -50,
        alignSelf: 'center',
    },
    arrowTopCenter: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
    }
});
