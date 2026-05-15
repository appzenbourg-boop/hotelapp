import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI, amenitiesAPI } from '../../services/api';

export default function SpaScreen() {
    const insets = useSafeAreaInsets();
    const t = useTranslation();
    const { token } = useAuth();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    // Fetcher function for SWR
    const fetchOptions = async () => {
        if (!token) return [];
        try {
            // 1. Get Property ID (try multiple sources)
            let propertyId = null;
            
            const bookingRes = await bookingsAPI.getActive(token);
            if (bookingRes.success && bookingRes.bookings?.length > 0) {
                propertyId = bookingRes.bookings[0].propertyId;
            } else {
                const allBookingsRes = await bookingsAPI.getMyBookings(token);
                const bookingsArray = Array.isArray(allBookingsRes) ? allBookingsRes : (allBookingsRes?.value || []);
                if (bookingsArray.length > 0) {
                    propertyId = bookingsArray[0].propertyId;
                }
            }

            if (!propertyId) propertyId = "69e531fc66a1b1601c0af5d2";

            // 2. Fetch from Dashboard Services
            let dashServices = [];
            try {
                const res = await amenitiesAPI.getDashboardServices(propertyId, token);
                dashServices = Array.isArray(res) ? res : (res?.value || []);
            } catch (e) {
                console.log("[SPA] Dashboard API failed, trying Amenities fallback...");
            }
            
            const spaDash = dashServices.find((s: any) => 
                s.name?.toLowerCase().includes('spa') || 
                s.route?.toLowerCase().includes('spa')
            );

            if (spaDash && spaDash.options && Array.isArray(spaDash.options) && spaDash.options.length > 0) {
                return spaDash.options.map((opt: any, idx: number) => ({
                    id: opt.id || String(idx),
                    name: opt.label || opt.name || 'Treatment',
                    price: `₹${(opt.price || opt.amount || 0).toLocaleString()}`,
                    amount: opt.price || opt.amount || 0,
                    duration: opt.duration ? (typeof opt.duration === 'number' ? `${opt.duration} min` : opt.duration) : "60 min"
                }));
            }

            // 3. Fallback to Amenities
            const amenitiesRes = await amenitiesAPI.getAll(propertyId);
            const amenitiesArray = Array.isArray(amenitiesRes) ? amenitiesRes : (amenitiesRes?.amenities || amenitiesRes?.value || []);
            
            const spaAmenity = amenitiesArray.find((a: any) => 
                a.name?.toLowerCase().includes('spa') || 
                a.category?.toLowerCase() === 'wellness'
            );
            
            if (spaAmenity && spaAmenity.options && Array.isArray(spaAmenity.options) && spaAmenity.options.length > 0) {
                return spaAmenity.options.map((opt: any, idx: number) => ({
                    id: opt.id || String(idx),
                    name: opt.label || opt.name || 'Treatment',
                    duration: opt.duration ? (typeof opt.duration === 'number' ? `${opt.duration} min` : opt.duration) : "60 min",
                    price: `₹${(opt.price || opt.amount || 0).toLocaleString()}`,
                    amount: opt.price || opt.amount || 0
                }));
            }

            // Default Fallback
            setDebugInfo("Using default fallback treatments.");
            return [
                { id: '1', name: "Aromatherapy Massage", duration: "60 min", price: "₹2,500", amount: 2500 },
                { id: '2', name: "Deep Tissue Massage", duration: "90 min", price: "₹3,500", amount: 3500 },
                { id: '3', name: "Signature Facial", duration: "45 min", price: "₹1,800", amount: 1800 },
            ];
        } catch (err: any) {
            console.error("Failed to fetch spa options", err);
            setDebugInfo(`Error: ${err.message || 'Unknown network error'}`);
            throw err;
        }
    };

    const { data: treatments = [], error: fetchError, isLoading: fetching } = useSWR(
        token ? ['spa_options', token] : null,
        fetchOptions,
        { revalidateOnFocus: true }
    );

    const handleRequest = async () => {
        if (!selectedId) return;
        const treatment = treatments.find(t => t.id === selectedId);
        if (!treatment) return;

        if (!token) {
            router.push({ pathname: '/(services)/spa-confirmed', params: { treatmentName: treatment.name } });
            return;
        }

        setLoading(true);
        try {
            const bookingRes = await bookingsAPI.getActive(token);
            const booking = bookingRes.success && bookingRes.bookings?.length > 0
                ? bookingRes.bookings[0]
                : null;

            await servicesAPI.create(token, {
                type: 'SPA',
                title: `Spa: ${treatment.name}`,
                description: `${treatment.name} - ${treatment.duration}`,
                roomId: booking?.roomId || undefined,
                priority: 'NORMAL',
                amount: treatment.amount,
            });

            router.push({ pathname: '/(services)/spa-confirmed', params: { treatmentName: treatment.name } });
        } catch (e) {
            console.error('Spa request error:', e);
            // Navigate anyway — don't block the user
            router.push({ pathname: '/(services)/spa-confirmed', params: { treatmentName: treatment.name } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.container}>

                {/* HEADER */}
                <View style={styles.headerWrapper}>
                    <Image
                        source={require('../../assets/images/image4.png')}
                        style={styles.headerImage}
                    />
                    <View style={styles.overlay} />

                    <TouchableOpacity
                        style={[styles.backBtn, { top: insets.top + 10 }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={22} color="#000" />
                    </TouchableOpacity>
                </View>

                {/* CONTENT */}
                <View style={styles.bottomCard}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
                    >
                        <Text style={styles.title}>{t('service_spa')}</Text>

                        <View style={styles.infoBox}>
                            <Ionicons name="leaf-outline" size={24} color="#276749" />
                            <Text style={styles.infoText}>
                                Experience ultimate relaxation with our in-room wellness treatments. Our specialists are trained to provide a variety of therapeutic services in the comfort of your suite.
                            </Text>
                        </View>

                        <View style={styles.menuSection}>
                            <Text style={styles.sectionTitle}>Available Treatments</Text>
                            {fetching && treatments.length === 0 ? (
                                <View style={{ gap: 12 }}>
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} height={80} borderRadius={16} />
                                    ))}
                                </View>
                            ) : treatments.length === 0 ? (
                                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                    <Text style={{ textAlign: 'center', color: '#718096' }}>No treatments available at the moment.</Text>
                                    {debugInfo && (
                                        <Text style={{ textAlign: 'center', color: '#e53e3e', fontSize: 12, marginTop: 10 }}>{debugInfo}</Text>
                                    )}
                                </View>
                            ) : treatments.map((item) => (
                                <TreatmentItem
                                    key={item.id}
                                    name={item.name}
                                    duration={item.duration}
                                    price={item.price}
                                    isSelected={selectedId === item.id}
                                    onSelect={() => setSelectedId(item.id)}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.requestBtn, (!selectedId || loading) && styles.requestBtnDisabled]}
                            onPress={handleRequest}
                            disabled={!selectedId || loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.requestText}>Request an Appointment</Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>

            </View>
        </>
    );
}

function TreatmentItem({ name, duration, price, isSelected, onSelect }: any) {
    return (
        <TouchableOpacity
            style={[styles.treatmentRow, isSelected && styles.selectedRow]}
            onPress={onSelect}
            activeOpacity={0.7}
        >
            <View style={{ flex: 1 }}>
                <Text style={[styles.treatmentName, isSelected && styles.selectedText]}>{name}</Text>
                <Text style={styles.treatmentTime}>{duration}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.treatmentPrice, isSelected && styles.selectedText]}>{price}</Text>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#276749" style={{ marginTop: 4 }} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerWrapper: {
        height: 300,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        overflow: 'hidden',
    },
    headerImage: { width: '100%', height: '100%' },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backBtn: {
        position: 'absolute',
        left: 20,
        width: 36,
        height: 36,
        backgroundColor: '#fff',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomCard: {
        flex: 1,
        marginTop: -50,
        backgroundColor: '#F7FAFC',
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        paddingHorizontal: 24,
    },
    scrollContent: {
        paddingTop: 40,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        color: '#1A202C',
        marginBottom: 20,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F0FFF4',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C6F6D5',
        marginBottom: 30,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#276749',
        lineHeight: 22,
        fontFamily: 'Inter-Regular',
    },
    menuSection: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
        color: '#2D3748',
        marginBottom: 16,
    },
    treatmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedRow: {
        borderColor: '#68d391',
        backgroundColor: '#f0fff4',
    },
    selectedText: {
        color: '#276749',
    },
    treatmentName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#1A202C',
    },
    treatmentTime: {
        fontSize: 12,
        color: '#718096',
        marginTop: 2,
    },
    treatmentPrice: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
        color: '#276749',
    },
    requestBtn: {
        backgroundColor: '#2F2E2E',
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestBtnDisabled: {
        backgroundColor: '#cbd5e0',
    },
    requestText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});
