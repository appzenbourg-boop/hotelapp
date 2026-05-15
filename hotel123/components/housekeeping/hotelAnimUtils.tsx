import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ══════════════════════════════════════════
// AnimShell component
// ══════════════════════════════════════════
export const AnimShell = ({ children, label, showDoneButton, onDone }: any) => {
    const insets = useSafeAreaInsets();
    return (
        <View style={shellStyles.outer}>
            <View style={[shellStyles.header, { paddingTop: Math.max(20, insets.top + 10) }]}>
                <TouchableOpacity 
                    style={shellStyles.backBtn} 
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="#9a9690" />
                </TouchableOpacity>
                <Text style={shellStyles.label}>{label}</Text>
            </View>

            <View style={shellStyles.container}>
                {children}
            </View>

            {showDoneButton && (
                <TouchableOpacity 
                    style={[shellStyles.doneBtn, { bottom: Math.max(20, insets.bottom + 10) }]} 
                    onPress={onDone}
                >
                    <Text style={shellStyles.doneText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const shellStyles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center label
    },
    backBtn: {
        position: 'absolute',
        left: 20,
    },
    label: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#9a9690',
        letterSpacing: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneBtn: {
        position: 'absolute',
        left: 40,
        right: 40,
        height: 60,
        backgroundColor: '#1c1c1e',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doneText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
});

// ══════════════════════════════════════════
// DotLoader component
// ══════════════════════════════════════════
export const DotLoader = ({ color = '#9f7aea' }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (val: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(val, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(val, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    const getStyle = (val: Animated.Value) => ({
        opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
    });

    return (
        <View style={dotLoaderStyles.row}>
            <Animated.View style={[dotLoaderStyles.dot, { backgroundColor: color }, getStyle(dot1)]} />
            <Animated.View style={[dotLoaderStyles.dot, { backgroundColor: color }, getStyle(dot2)]} />
            <Animated.View style={[dotLoaderStyles.dot, { backgroundColor: color }, getStyle(dot3)]} />
        </View>
    );
};

const dotLoaderStyles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, justifyContent: 'center', height: 20 },
    dot: { width: 6, height: 6, borderRadius: 3 },
});

// ══════════════════════════════════════════
// ProgressBar component
// ══════════════════════════════════════════
export const ProgressBar = ({ from, to, duration }: any) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration: parseInt(duration) * 1000 || 2400,
            easing: Easing.linear,
            useNativeDriver: false, // Width can't use native driver
        }).start();
    }, []);

    return (
        <View style={progressBarStyles.track}>
            <Animated.View
                style={[
                    progressBarStyles.fill,
                    {
                        width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        backgroundColor: to,
                    },
                ]}
            />
        </View>
    );
};

const progressBarStyles = StyleSheet.create({
    track: {
        width: width - 80,
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: { height: '100%' },
});

// ══════════════════════════════════════════
// BurstParticles component
// ══════════════════════════════════════════
export const BurstParticles = ({ color, color2 }: any) => {
    const particles = Array.from({ length: 8 }).map(() => ({
        anim: useRef(new Animated.Value(0)).current,
        angle: Math.random() * Math.PI * 2,
        distance: 40 + Math.random() * 40,
    }));

    useEffect(() => {
        particles.forEach((p, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 100),
                    Animated.timing(p.anim, {
                        toValue: 1,
                        duration: 800 + Math.random() * 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, []);

    return (
        <View style={StyleSheet.absoluteFill}>
            {particles.map((p, i) => {
                const x = p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(p.angle) * p.distance],
                });
                const y = p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(p.angle) * p.distance],
                });
                const opacity = p.anim.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [1, 1, 0],
                });
                const scale = p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5],
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            particleStyles.particle,
                            {
                                backgroundColor: i % 2 === 0 ? color : color2,
                                opacity,
                                transform: [{ translateX: x }, { translateY: y }, { scale }],
                                left: '50%',
                                top: '50%',
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const particleStyles = StyleSheet.create({
    particle: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        marginLeft: -3,
        marginTop: -3,
    },
});
// ══════════════════════════════════════════
// ConfirmedView component
// ══════════════════════════════════════════
export const ConfirmedView = ({ accentRgb, iconBg, iconEl, title, subtitle, eta, extraBadge }: any) => {
    const checkAnim = useRef(new Animated.Value(64)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(checkAnim, {
                toValue: 0,
                duration: 600,
                delay: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const accentColor = `rgb(${accentRgb})`;

    return (
        <View style={confirmedStyles.container}>
            <View style={confirmedStyles.orbWrapper}>
                <View style={[confirmedStyles.rippleHaze, { backgroundColor: `rgba(${accentRgb}, 0.15)` }]} />
                <View style={[confirmedStyles.rippleInnerHaze, { backgroundColor: `rgba(${accentRgb}, 0.08)` }]} />
                <BurstParticles color={`rgba(${accentRgb}, 0.7)`} color2={`rgba(${accentRgb}, 0.4)`} />
                <View style={[confirmedStyles.iconBg, { backgroundColor: iconBg }]}>
                    {iconEl || (
                        <Svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                            <AnimatedPath
                                d="M11 23 L19 32 L35 15"
                                stroke={accentColor}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="64"
                                strokeDashoffset={checkAnim}
                            />
                        </Svg>
                    )}
                </View>
            </View>

            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
                <Text style={confirmedStyles.title}>{title}</Text>
                <Text style={confirmedStyles.subtitle}>{subtitle}</Text>

                {eta && (
                    <View style={confirmedStyles.etaBadge}>
                        <Ionicons name="time-outline" size={14} color={accentColor} />
                        <Text style={[confirmedStyles.etaText, { color: accentColor }]}>ETA: {eta}</Text>
                    </View>
                )}

                {extraBadge}
            </Animated.View>
        </View>
    );
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const confirmedStyles = StyleSheet.create({
    container: { alignItems: 'center', width: '100%' },
    orbWrapper: {
        position: 'relative', width: 160, height: 160,
        marginBottom: 30, alignItems: 'center', justifyContent: 'center'
    },
    rippleHaze: {
        position: 'absolute', width: 160, height: 160,
        borderRadius: 80,
    },
    rippleInnerHaze: {
        position: 'absolute', width: 132, height: 132,
        borderRadius: 66,
    },
    iconBg: {
        width: 104, height: 104, borderRadius: 52,
        alignItems: 'center', justifyContent: 'center',
    },
    title: {
        fontSize: 26, fontFamily: 'Poppins-Bold',
        color: '#1c1c1e', textAlign: 'center',
        lineHeight: 32, marginBottom: 12
    },
    subtitle: {
        fontSize: 14, color: '#8a8680', textAlign: 'center',
        lineHeight: 22, maxWidth: 280, marginBottom: 20,
        fontFamily: 'Inter-Regular'
    },
    etaBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 8, paddingHorizontal: 16,
        backgroundColor: '#f8fafc', borderRadius: 99,
        borderWidth: 1, borderColor: '#e2e8f0',
    },
    etaText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
});
