import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, servicesAPI } from '../../services/api';

export default function WakeupScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [loading, setLoading] = useState(false);

  const handleSet = async () => {
    const wakeTime = `${hour}:${minute} ${period}`;

    if (!token) {
      router.push({ pathname: '/(services)/wakeup-confirmed', params: { wakeTime } });
      return;
    }

    setLoading(true);
    try {
      const bookingRes = await bookingsAPI.getActive(token);
      const booking = bookingRes.success && bookingRes.bookings?.length > 0
        ? bookingRes.bookings[0]
        : null;

      if (booking) {
        await servicesAPI.requestWakeupCall(token, booking.roomId, wakeTime);
      }
      router.push({ pathname: '/(services)/wakeup-confirmed', params: { wakeTime } });
    } catch (e) {
      console.error('Wakeup request error:', e);
      router.push({ pathname: '/(services)/wakeup-confirmed', params: { wakeTime } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* BACKGROUND IMAGE WITH OVERLAY */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../../assets/images/image16.png')}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.heroOverlay}
        />
        
        <View style={styles.heroContent}>
            <MaterialCommunityIcons name="alarm-check" size={48} color="#FFF" />
            <Text style={styles.heroTitle}>Wake-Up Call</Text>
            <Text style={styles.heroSubtitle}>Start your day exactly when you want</Text>
        </View>
      </View>

      {/* SELECTION CARD */}
      <View style={styles.contentCard}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
          bounces={false}
        >
          <View style={styles.pickerTitleRow}>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <View style={styles.activeIndicator} />
          </View>
  
          <View style={styles.timePickerContainer}>
            {/* HOUR BOX */}
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>HOUR</Text>
              <View style={styles.digitBox}>
                  <Text style={styles.digitText}>{hour}</Text>
                  <Picker
                      selectedValue={hour}
                      onValueChange={setHour}
                      style={styles.hiddenPicker}
                  >
                      {Array.from({ length: 12 }, (_, i) => {
                      const v = String(i + 1).padStart(2, '0');
                      return <Picker.Item key={v} label={v} value={v} />;
                      })}
                  </Picker>
              </View>
            </View>
  
            <Text style={styles.timeSeparator}>:</Text>
  
            {/* MINUTE BOX */}
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>MIN</Text>
              <View style={styles.digitBox}>
                  <Text style={styles.digitText}>{minute}</Text>
                  <Picker
                      selectedValue={minute}
                      onValueChange={setMinute}
                      style={styles.hiddenPicker}
                  >
                      {Array.from({ length: 60 }, (_, i) => {
                      const v = String(i).padStart(2, '0');
                      return <Picker.Item key={v} label={v} value={v} />;
                      })}
                  </Picker>
              </View>
            </View>
  
            {/* PERIOD TOGGLE */}
            <View style={styles.periodContainer}>
              <TouchableOpacity 
                  style={[styles.periodBtn, period === 'AM' && styles.periodBtnActive]} 
                  onPress={() => setPeriod('AM')}
              >
                  <Text style={[styles.periodBtnText, period === 'AM' && styles.periodBtnTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[styles.periodBtn, period === 'PM' && styles.periodBtnActive]} 
                  onPress={() => setPeriod('PM')}
              >
                  <Text style={[styles.periodBtnText, period === 'PM' && styles.periodBtnTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>
  
          <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Our staff will call your room phone at the selected time.</Text>
          </View>
  
          <View style={{ flex: 1, minHeight: 40 }} />
  
          <TouchableOpacity
            style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
            onPress={handleSet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                  <Text style={styles.confirmBtnText}>Schedule Call</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* BACK BUTTON AT ROOT FOR TOP LAYER */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  heroContainer: {
    height: '45%',
    width: '100%',
    justifyContent: 'flex-end',
    padding: 30,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  heroContent: {
    marginBottom: 20,
    paddingTop: 60, // Ensure content doesn't hit the back button
  },
  heroTitle: {
    fontSize: 38,
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  contentCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  pickerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 10,
  },

  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeBox: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#64748B',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  digitBox: {
    width: 76,
    height: 86,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  digitText: {
    fontSize: 40,
    fontFamily: 'Poppins-Bold',
    color: '#1E293B',
  },
  timeSeparator: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: '#CBD5E1',
    marginHorizontal: 12,
    marginBottom: 18,
  },
  hiddenPicker: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
  },

  periodContainer: {
    marginLeft: 20,
    gap: 10,
  },
  periodBtn: {
    width: 48,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  periodBtnText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: '#64748B',
  },
  periodBtnTextActive: {
    color: '#FFF',
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 18,
    borderRadius: 22,
    marginTop: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  infoText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
    color: '#4338CA',
    fontFamily: 'Inter-Medium',
    lineHeight: 20,
  },

  confirmBtn: {
    backgroundColor: '#1E293B',
    height: 68,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 19,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.5,
  },
});
