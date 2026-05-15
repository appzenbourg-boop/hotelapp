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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI, amenitiesAPI } from '../../services/api';

export default function LaundryScreen() {
    const insets = useSafeAreaInsets();
    const t = useTranslation();
    const { token } = useAuth();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchLaundryOptions = async () => {
        if (!token) return [];
        try {
            // Get property ID
            let propertyId = null;
            const bookingRes = await bookingsAPI.getActive(token);
            if (bookingRes.success && bookingRes.bookings?.length > 0) {
                propertyId = bookingRes.bookings[0].propertyId;
            } else {
                const allRes = await bookingsAPI.getMyBookings(token);
                const array = Array.isArray(allRes) ? allRes : (allRes?.value || []);
                if (array.length > 0) propertyId = array[0].propertyId;
            }
            if (!propertyId) propertyId = "69e531fc66a1b1601c0af5d2";

            // Try Quick Actions
            let dashServices = [];
            try {
                const res = await amenitiesAPI.getDashboardServices(propertyId, token);
                dashServices = Array.isArray(res) ? res : (res?.value || []);
            } catch (e) {}
            
            const laundryDash = dashServices.find((s: any) => 
                s.name?.toLowerCase().includes('laundry') || 
                s.route?.toLowerCase().includes('laundry')
            );

            if (laundryDash && laundryDash.options && Array.isArray(laundryDash.options) && laundryDash.options.length > 0) {
                return laundryDash.options.map((opt: any, idx: number) => ({
                    id: opt.id || String(idx),
                    name: opt.label,
                    duration: opt.duration || "Same Day",
                    price: `₹${opt.price?.toLocaleString()}`,
                    amount: opt.price
                }));
            }

            // Try Amenities fallback
            const amenitiesRes = await amenitiesAPI.getAll(propertyId);
            const amenitiesArray = Array.isArray(amenitiesRes) ? amenitiesRes : (amenitiesRes?.amenities || amenitiesRes?.value || []);

            const laundryAmenity = amenitiesArray.find((a: any) => 
                a.name?.toLowerCase().includes('laundry')
            );
            
            if (laundryAmenity && laundryAmenity.options && Array.isArray(laundryAmenity.options)) {
                return laundryAmenity.options.map((opt: any, idx: number) => ({
                    id: opt.id || String(idx),
                    name: opt.label,
                    duration: opt.duration || "Same Day",
                    price: `₹${opt.price?.toLocaleString()}`,
                    amount: opt.price
                }));
            }

            // Final fallback
            return [
                { id: '1', name: "Wash & Fold", duration: "Same Day", price: "₹500 / bag", amount: 500 },
                { id: '2', name: "Dry Cleaning", duration: "Next Day", price: "₹200 / item", amount: 200 },
            ];
        } catch (err) {
            console.error("Laundry fetch error", err);
            throw err;
        }
    };

    const { data: options = [], isLoading: fetching } = useSWR(
        token ? ['laundry_options', token] : null,
        fetchLaundryOptions
    );

    const handleRequest = async () => {
        if (!selectedId) return;
        const option = options.find(o => o.id === selectedId);
        if (!option) return;

        if (!token) {
            router.push({ pathname: '/(services)/laundry-confirmed', params: { optionName: option.name } });
            return;
        }

        setLoading(true);
        try {
            const bookingRes = await bookingsAPI.getActive(token);
            const booking = bookingRes.success && bookingRes.bookings?.length > 0
                ? bookingRes.bookings[0]
                : null;

            await servicesAPI.create(token, {
                type: 'LAUNDRY',
                title: `Laundry: ${option.name}`,
                description: `${option.name} - ${option.duration}`,
                roomId: booking?.roomId || undefined,
                priority: 'NORMAL',
                amount: option.amount,
            });

            router.push({ pathname: '/(services)/laundry-confirmed', params: { optionName: option.name } });
        } catch (e) {
            console.error('Laundry request error:', e);
            router.push({ pathname: '/(services)/laundry-confirmed', params: { optionName: option.name } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.container}>
                <View style={styles.headerWrapper}>
                    <Image
                        source={require('../../assets/images/image10.png')}
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

                <View style={styles.bottomCard}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
                    >
                        <Text style={styles.title}>Laundry Service</Text>

                        <View style={styles.infoBox}>
                            <MaterialCommunityIcons name="tshirt-crew-outline" size={24} color="#2B6CB0" />
                            <Text style={styles.infoText}>
                                Fresh clothes, anytime. Our premium laundry service ensures your garments are handled with care and returned promptly to your room.
                            </Text>
                        </View>

                        <View style={styles.menuSection}>
                            <Text style={styles.sectionTitle}>Select Option</Text>
                            {fetching && options.length === 0 ? (
                                <View style={{ gap: 12 }}>
                                    {[1, 2].map(i => (
                                        <Skeleton key={i} height={80} borderRadius={16} />
                                    ))}
                                </View>
                            ) : options.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#718096', marginVertical: 20 }}>No laundry options available.</Text>
                            ) : options.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.row, selectedId === item.id && styles.selectedRow]}
                                    onPress={() => setSelectedId(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.name, selectedId === item.id && styles.selectedText]}>{item.name}</Text>
                                        <Text style={styles.time}>{item.duration}</Text>
                                    </View>
                                    <Text style={[styles.price, selectedId === item.id && styles.selectedText]}>{item.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.requestBtn, (!selectedId || loading) && styles.requestBtnDisabled]}
                            onPress={handleRequest}
                            disabled={!selectedId || loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.requestText}>Request Pick-up</Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerWrapper: { height: 300, borderBottomLeftRadius: 50, borderBottomRightRadius: 50, overflow: 'hidden' },
    headerImage: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    backBtn: { position: 'absolute', left: 20, width: 36, height: 36, backgroundColor: '#fff', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    bottomCard: { flex: 1, marginTop: -50, backgroundColor: '#F7FAFC', borderTopLeftRadius: 50, borderTopRightRadius: 50, paddingHorizontal: 24 },
    scrollContent: { paddingTop: 40 },
    title: { fontSize: 28, fontFamily: 'Poppins-SemiBold', color: '#1A202C', marginBottom: 20 },
    infoBox: { flexDirection: 'row', backgroundColor: '#EBF8FF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#BEE3F8', marginBottom: 30, gap: 12 },
    infoText: { flex: 1, fontSize: 14, color: '#2B6CB0', lineHeight: 22, fontFamily: 'Inter-Regular' },
    menuSection: { marginBottom: 40 },
    sectionTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#2D3748', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
    selectedRow: { borderColor: '#4299E1', backgroundColor: '#EBF8FF' },
    selectedText: { color: '#2B6CB0' },
    name: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#1A202C' },
    time: { fontSize: 12, color: '#718096', marginTop: 2 },
    price: { fontSize: 16, fontFamily: 'Poppins-Bold', color: '#2B6CB0' },
    requestBtn: { backgroundColor: '#2F2E2E', height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
    requestBtnDisabled: { backgroundColor: '#cbd5e0' },
    requestText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
});
