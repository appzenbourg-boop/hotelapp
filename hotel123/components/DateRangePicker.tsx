import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface DateRangePickerProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (checkIn: Date, checkOut: Date) => void;
    initialCheckIn?: Date | null;
    initialCheckOut?: Date | null;
    blockedDates?: Date[];
}

export default function DateRangePicker({ 
    visible, 
    onClose, 
    onConfirm, 
    initialCheckIn = null, 
    initialCheckOut = null,
    blockedDates = [],
}: DateRangePickerProps) {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState<'checkin' | 'checkout'>(initialCheckIn ? 'checkout' : 'checkin');
    const [checkInDate, setCheckInDate] = useState<Date | null>(initialCheckIn);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(initialCheckOut);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (visible) {
            setCheckInDate(initialCheckIn);
            setCheckOutDate(initialCheckOut);
            setStep(initialCheckIn ? 'checkout' : 'checkin');
        }
    }, [visible, initialCheckIn, initialCheckOut]);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const isDateBlocked = (date: Date) => {
        return blockedDates.some(bd => {
            const blocked = new Date(bd);
            return date.getFullYear() === blocked.getFullYear() &&
                   date.getMonth() === blocked.getMonth() &&
                   date.getDate() === blocked.getDate();
        });
    };

    const hasBlockedDateInRange = (start: Date, end: Date) => {
        const current = new Date(start);
        current.setDate(current.getDate() + 1);
        while (current < end) {
            if (isDateBlocked(current)) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    };

    const handleDateSelect = (day: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selected.setHours(12, 0, 0, 0);

        const today = new Date();
        today.setHours(12, 0, 0, 0);

        if (selected < today) return;
        if (isDateBlocked(selected)) return;

        if (step === 'checkin') {
            setCheckInDate(selected);
            setStep('checkout');
            setCheckOutDate(null);
        } else {
            if (checkInDate && selected <= checkInDate) {
                setCheckInDate(selected);
                setCheckOutDate(null);
            } else if (checkInDate && hasBlockedDateInRange(checkInDate, selected)) {
                // Don't allow selecting a range that spans over blocked dates
                setCheckInDate(selected);
                setCheckOutDate(null);
                setStep('checkout');
            } else {
                setCheckOutDate(selected);
            }
        }
    };

    const dayStatus = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(12, 0, 0, 0);

        if (checkInDate && date.getTime() === checkInDate.getTime()) return 'start';
        if (checkOutDate && date.getTime() === checkOutDate.getTime()) return 'end';
        if (checkInDate && checkOutDate && date > checkInDate && date < checkOutDate) return 'middle';

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
            const isPast = date.getTime() < todayAtNoon;
            const isBlocked = isDateBlocked(date);
            const isSelectable = !isPast && !isBlocked;
            const isActive = status !== 'none';

            days.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={[
                        styles.dayCell,
                        status === 'start' && styles.startDay,
                        status === 'end' && styles.endDay,
                        status === 'middle' && styles.middleDay,
                        isBlocked && styles.disabledDay,
                    ]}
                    activeOpacity={isSelectable ? 0.7 : 1}
                    onPress={() => isSelectable && handleDateSelect(i)}
                >
                    <Text style={[
                        styles.dayText,
                        isActive && styles.activeDayText,
                        (isPast || isBlocked) && { color: '#ccc' },
                        status === 'middle' && { color: '#000' },
                    ]}>{i}</Text>
                </TouchableOpacity>
            );
        }
        return days;
    }, [currentMonth, checkInDate, checkOutDate, blockedDates]);

    const handleConfirm = () => {
        if (checkInDate && checkOutDate) {
            onConfirm(checkInDate, checkOutDate);
            onClose();
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const formatDate = (date: Date | null) => {
        if (!date) return 'Select Date';
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Select Dates</Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateLabel}>Check-In</Text>
                        <Text style={[styles.dateValue, step === 'checkin' && styles.activeStep]}>
                            {formatDate(checkInDate)}
                        </Text>
                    </View>
                    <View style={styles.arrowBox}>
                        <Ionicons name="arrow-forward" size={20} color="#666" />
                    </View>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateLabel}>Check-Out</Text>
                        <Text style={[styles.dateValue, step === 'checkout' && styles.activeStep]}>
                            {formatDate(checkOutDate)}
                        </Text>
                    </View>
                </View>

                <ScrollView style={styles.calendarContainer}>
                    <View style={styles.monthHeader}>
                        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
                            <Ionicons name="chevron-back" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</Text>
                        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
                            <Ionicons name="chevron-forward" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekHeader}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekText}>{d}</Text>
                        ))}
                    </View>

                    <View style={styles.daysGrid}>
                        {calendarDays}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 20) }]}>
                    <View>
                        <Text style={{ color: '#666', fontSize: 12 }}>Total Stay</Text>
                        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
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
                        <Text style={styles.confirmText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { marginRight: 20 },
    title: { fontSize: 20, fontFamily: 'Inter-Bold' },

    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#f8f8f8',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    dateBox: { flex: 1 },
    dateLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
    dateValue: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#999' },
    activeStep: { color: '#000', fontFamily: 'Inter-Bold' },
    arrowBox: { paddingHorizontal: 10 },

    calendarContainer: { flex: 1, paddingHorizontal: 20 },
    monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    monthTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },

    weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekText: { width: width / 9, textAlign: 'center', color: '#999', fontFamily: 'Inter-SemiBold' },

    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: width / 8.5, height: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 6, marginHorizontal: 1 },
    dayText: { fontSize: 16, fontFamily: 'Inter-Regular' },
    activeDayText: { color: '#fff', fontFamily: 'Inter-Bold' },

    startDay: { backgroundColor: '#000', borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
    endDay: { backgroundColor: '#000', borderTopRightRadius: 20, borderBottomRightRadius: 20 },
    middleDay: { backgroundColor: '#eee' },
    disabledDay: { backgroundColor: '#f9f9f9', opacity: 0.6 },

    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    confirmBtn: {
        backgroundColor: '#000',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 30
    },
    disabledBtn: { backgroundColor: '#ccc' },
    confirmText: { color: '#fff', fontFamily: 'Inter-Bold' }
});
