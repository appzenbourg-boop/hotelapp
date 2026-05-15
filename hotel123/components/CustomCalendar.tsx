import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
}

export default function CustomCalendar({ visible, onClose, onSelect }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { daysElements, monthLabel } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

        const totalSlots = startDayOfWeek + daysInMonth;
        const elements = [];

        // Empty slots for previous month
        for (let i = 0; i < startDayOfWeek; i++) {
            elements.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            // Format manually to avoid timezone issues with toISOString
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateString = `${y}-${m}-${day}`;

            elements.push(
                <TouchableOpacity
                    key={`day-${i}`}
                    style={styles.dayCell}
                    activeOpacity={0.6}
                    onPress={() => {
                        onSelect(dateString);
                        onClose();
                    }}
                >
                    <Text style={styles.dayText}>{i}</Text>
                </TouchableOpacity>
            );
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        return {
            daysElements: elements,
            monthLabel: `${monthNames[month]} ${year}`
        };
    }, [currentDate]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.calendarContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton} hitSlop={10}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>{monthLabel}</Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton} hitSlop={10}>
                            <Ionicons name="chevron-forward" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Week Days Header */}
                    <View style={styles.weekHeader}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {daysElements}
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    calendarContainer: { width: '90%', backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    monthTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#2F2E2E' },
    navButton: { padding: 8 },
    weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    weekDayText: { width: '14.28%', textAlign: 'center', fontFamily: 'Inter-SemiBold', color: '#9E9E9E', fontSize: 13 },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#2F2E2E' },
    closeButton: { marginTop: 20, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
    closeButtonText: { color: '#2F2E2E', fontFamily: 'Inter-SemiBold', fontSize: 14 }
});
