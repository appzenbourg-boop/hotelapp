import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LaundryConfirmedScreen() {
    const insets = useSafeAreaInsets();
    const { optionName } = useLocalSearchParams();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="checkmark-circle" size={80} color="#4299E1" />
                    </View>
                    <Text style={styles.title}>Request Received!</Text>
                    <Text style={styles.subtitle}>
                        Your request for {optionName || 'Laundry service'} has been sent to our team. A staff member will arrive shortly for the pick-up.
                    </Text>

                    <TouchableOpacity 
                        style={styles.btn}
                        onPress={() => router.replace('/(main)/home')}
                    >
                        <Text style={styles.btnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 30 },
    content: { alignItems: 'center' },
    iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 26, fontFamily: 'Poppins-Bold', color: '#2D3748', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#718096', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    btn: { backgroundColor: '#2D3748', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
});
