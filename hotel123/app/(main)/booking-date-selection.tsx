import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomsAPI } from '../../services/api';
// import { BlurView } from 'expo-blur'; // Disabled for Expo Go compatibility

const { width } = Dimensions.get('window');

export default function BookingDateSelection() {
    const insets = useSafeAreaInsets();
    const { roomId } = useLocalSearchParams();
    const [step, setStep] = useState<'checkin' | 'checkout'>('checkin');
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [blockedDates, setBlockedDates] = useState<any[]>([]);
    
    const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
    const slideAnim = React.useMemo(() => new Animated.Value(20), []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    React.useEffect(() => {
        if (roomId) fetchRoomAvailability();
    }, [roomId]);

    const fetchRoomAvailability = async () => {
        try {
            const res = await roomsAPI.getById(roomId as string);
            if (res && res.bookings) {
                setBlockedDates(res.bookings);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const isDateBlocked = useCallback((date: Date) => {
        const d = new Date(date).setHours(12, 0, 0, 0);
        return blockedDates.some(b => {
            const start = new Date(b.checkIn).setHours(12, 0, 0, 0);
            const end = new Date(b.checkOut).setHours(12, 0, 0, 0);
            return d >= start && d < end;
        });
    }, [blockedDates]);

    const handleDateSelect = (day: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selected.setHours(12, 0, 0, 0);

        const today = new Date();
        today.setHours(12, 0, 0, 0);

        if (selected < today) return;
        if (isDateBlocked(selected) && step === 'checkin') return;

        if (step === 'checkin') {
            setCheckInDate(selected);
            setStep('checkout');
            setCheckOutDate(null);
        } else {
            if (checkInDate && selected <= checkInDate) {
                setCheckInDate(selected);
                setCheckOutDate(null);
            } else {
                let hasBlock = false;
                if (checkInDate) {
                    let curr = new Date(checkInDate);
                    while (curr < selected) {
                        if (isDateBlocked(curr)) {
                            hasBlock = true;
                            break;
                        }
                        curr.setDate(curr.getDate() + 1);
                    }
                }
                if (!hasBlock) setCheckOutDate(selected);
            }
        }
    };

    const dayStatus = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        if (checkInDate && date.getTime() === checkInDate.getTime()) return 'start';
        if (checkOutDate && date.getTime() === checkOutDate.getTime()) return 'end';
        if (checkInDate && checkOutDate && date > checkInDate && date < checkOutDate) return 'middle';
        if (isDateBlocked(date)) return 'blocked';

        return 'none';
    };

    const calendarDays = useMemo(() => {
        const totalDays = daysInMonth(currentMonth);
        const start = startDay(currentMonth);
        const days = [];
        const todayAtNoon = new Date().setHours(12, 0, 0, 0);

        for (let i = 0; i < start; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            date.setHours(12, 0, 0, 0);

            const status = dayStatus(i);
            const isBlocked = status === 'blocked';
            const isPast = date.getTime() < todayAtNoon;
            const isSelectable = !isBlocked && !isPast;
            const isActive = (status === 'start' || status === 'end');

            days.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[
                        styles.dayCell,
                        status === 'start' && styles.startDay,
                        status === 'end' && styles.endDay,
                        status === 'middle' && styles.middleDay,
                    ]}
                    activeOpacity={isSelectable ? 0.7 : 1}
                    onPress={() => isSelectable && handleDateSelect(i)}
                >
                    <Text style={[
                        styles.dayText,
                        isActive && styles.activeDayText,
                        (isPast || isBlocked) && { color: '#D0D0D0' },
                        status === 'middle' && { color: '#000', fontWeight: '600' }
                    ]}>{i}</Text>
                    {isBlocked && <View style={styles.blockedDot} />}
                </TouchableOpacity>
            );
        }
        return days;
    }, [currentMonth, checkInDate, checkOutDate, blockedDates, step]);

    const handleConfirm = () => {
        if (!checkInDate || !checkOutDate) return;

        router.push({
            pathname: '/(main)/booking-checkout',
            params: {
                roomId: roomId,
                checkIn: checkInDate.toISOString(),
                checkOut: checkOutDate.toISOString()
            }
        });
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />
            
            <Animated.View style={[styles.header, { paddingTop: insets.top + 10, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Book Your Stay</Text>
            </Animated.View>

            <View style={styles.stepIndicator}>
                <View style={[styles.stepItem, step === 'checkin' && styles.stepActive]}>
                    <Text style={[styles.stepText, step === 'checkin' && styles.stepTextActive]}>Check-In</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#DDD" />
                <View style={[styles.stepItem, step === 'checkout' && styles.stepActive]}>
                    <Text style={[styles.stepText, step === 'checkout' && styles.stepTextActive]}>Check-Out</Text>
                </View>
            </View>

            <View style={styles.selectionSummary}>
                <View style={styles.summaryDate}>
                    <Text style={styles.summaryLabel}>FROM</Text>
                    <Text style={styles.summaryValue}>{checkInDate ? checkInDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryDate}>
                    <Text style={styles.summaryLabel}>TO</Text>
                    <Text style={styles.summaryValue}>{checkOutDate ? checkOutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</Text>
                </View>
            </View>

            <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.monthHeader}>
                    <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
                        <View style={styles.navBtn}><Ionicons name="chevron-back" size={20} color="#000" /></View>
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
                    <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
                    <View style={styles.navBtn}><Ionicons name="chevron-forward" size={20} color="#000" /></View>
                    </TouchableOpacity>
                </View>

                <View style={styles.weekHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                        <Text key={i} style={styles.weekText}>{d}</Text>
                    ))}
                </View>

                <View style={styles.daysGrid}>
                    {calendarDays}
                </View>

                <View style={styles.legend}>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#000' }]} /><Text style={styles.legendText}>Selected</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EEE' }]} /><Text style={styles.legendText}>In-Range</Text></View>
                    <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' }]} /><Text style={styles.legendText}>Blocked</Text></View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
                <View>
                    <Text style={styles.totalLabel}>Total Stay Duration</Text>
                    <Text style={styles.totalValue}>
                        {checkInDate && checkOutDate
                            ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
                            : 0} Night(s)
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.confirmBtn, (!checkInDate || !checkOutDate) && styles.disabledBtn]}
                    disabled={!checkInDate || !checkOutDate}
                    onPress={handleConfirm}
                >
                    <Text style={styles.confirmText}>Continue to Checkout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, marginRight: 16 },
    title: { fontSize: 22, fontFamily: 'Inter-Bold', color: '#1A1A1A' },

    stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 16 },
    stepItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8F8F8' },
    stepActive: { backgroundColor: '#000' },
    stepText: { fontSize: 13, color: '#999', fontWeight: '600' },
    stepTextActive: { color: '#FFF' },

    selectionSummary: { flexDirection: 'row', paddingHorizontal: 24, marginVertical: 20, alignItems: 'center', justifyContent: 'center', gap: 24 },
    summaryDate: { alignItems: 'center' },
    summaryLabel: { fontSize: 10, color: '#AAA', fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#000' },
    summaryDivider: { width: 40, height: 2, backgroundColor: '#EEE', borderRadius: 1 },

    calendarContainer: { flex: 1, paddingHorizontal: 20 },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
    monthTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#1A1A1A' },
    navBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },

    weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    weekText: { fontSize: 12, color: '#AAA', fontWeight: '700', width: width / 8, textAlign: 'center' },

    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    dayCell: { width: width / 8.5, height: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 4, marginHorizontal: 1, borderRadius: 12 },
    dayText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#1A1A1A' },
    activeDayText: { color: '#FFF', fontWeight: '800' },

    startDay: { backgroundColor: '#000', borderRadius: 12 },
    endDay: { backgroundColor: '#000', borderRadius: 12 },
    middleDay: { backgroundColor: '#F0F0F0', borderRadius: 0 },

    legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 40, paddingBottom: 100 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: '#888', fontWeight: '500' },

    footer: {
        width: '100%',
        paddingHorizontal: 24,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    totalLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
    totalValue: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#000' },
    confirmBtn: { backgroundColor: '#000', paddingHorizontal: 24, paddingVertical: 18, borderRadius: 20, elevation: 2 },
    disabledBtn: { backgroundColor: '#E0E0E0' },
    confirmText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    blockedDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: '#CCC' }
});
