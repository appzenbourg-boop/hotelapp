import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function PaymentSuccess() {
  const insets = useSafeAreaInsets();
  
  const iconScale = React.useMemo(() => new Animated.Value(0), []);
  const textOpacity = React.useMemo(() => new Animated.Value(0), []);
  const textTranslateY = React.useMemo(() => new Animated.Value(20), []);
  const cardOpacity = React.useMemo(() => new Animated.Value(0), []);
  const cardTranslateY = React.useMemo(() => new Animated.Value(20), []);
  const footerOpacity = React.useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <Animated.View style={[styles.successIconContainer, { transform: [{ scale: iconScale }] }]}>
          <View style={styles.outerPulse}>
            <View style={styles.innerCircle}>
              <Ionicons name="checkmark-sharp" size={60} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
          <Text style={styles.title}>Payment Secured!</Text>
          <Text style={styles.subtitle}>
            Your booking has been confirmed successfully.{'\n'}
            We've sent the details to your email.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cardInfo, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
            <View style={styles.row}>
                <Text style={styles.label}>Booking Status</Text>
                <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>CONFIRMED</Text>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
                <Text style={styles.label}>Transaction ID</Text>
                <Text style={styles.value}>#TXN-{Math.floor(Math.random() * 900000 + 100000)}</Text>
            </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { paddingBottom: Math.max(30, insets.bottom), opacity: footerOpacity }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.8}
            onPress={() => router.replace('/(main)/home')}
          >
            <Text style={styles.btnTextPrimary}>Return to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.btnSecondary}
            activeOpacity={0.6}
            onPress={() => router.replace('/(main)/bookings')}
          >
            <Text style={styles.btnTextSecondary}>View My Reservations</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  successIconContainer: { marginBottom: 40 },
  outerPulse: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },

  textContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#1A1A1A', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },

  cardInfo: { width: '100%', backgroundColor: '#F8F8F8', borderRadius: 24, padding: 24, marginBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#999', fontWeight: '600' },
  value: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#000' },
  confirmedBadge: { backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  confirmedText: { fontSize: 11, color: '#4CAF50', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 16 },

  footer: { width: '100%', position: 'absolute', bottom: 0, paddingHorizontal: 32 },
  btnPrimary: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 20, alignItems: 'center', width: '100%' },
  btnTextPrimary: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  btnSecondary: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', width: '100%', marginTop: 8 },
  btnTextSecondary: { color: '#666', fontSize: 15, fontWeight: '600' }
});
