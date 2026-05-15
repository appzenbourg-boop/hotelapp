import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Linking,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import { helpAPI, bookingsAPI } from '../../services/api';

export default function Help() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [ticketType, setTicketType] = React.useState<'TECHNICAL' | 'BOOKING' | 'PAYMENT' | 'LOST_ITEM' | 'OTHER'>('TECHNICAL');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const openEmail = () => {
    Linking.openURL('mailto:support@zenbourg.com');
  };

  const openLiveSupport = async () => {
    // Try to get the most recent booking to link the chat to the right hotel
    if (token) {
      try {
        const res = await bookingsAPI.getMyBookings(token);
        if (res.success && res.bookings && res.bookings.length > 0) {
          // Use most recent booking
          const latest = res.bookings[0];
          router.push({
            pathname: '/(drawer)/live-support-chat',
            params: {
              bookingId: latest.id,
              hotelName: latest.room?.property?.name || 'Zenbourg Support',
              propertyId: latest.propertyId || latest.room?.propertyId || '',
              hotelPhone: latest.room?.property?.phone || '',
            }
          });
          return;
        }
      } catch (e) {
        // Fall through to generic support
      }
    }
    // No booking found — open generic support
    router.push({
      pathname: '/(drawer)/live-support-chat',
      params: {
        bookingId: 'General',
        hotelName: 'Zenbourg Support',
        propertyId: '',
        hotelPhone: '',
      }
    });
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please login to raise a ticket');
      return;
    }

    setLoading(true);
    try {
      await helpAPI.createTicket(token, {
        type: ticketType,
        subject: ticketType === 'LOST_ITEM' ? `Lost Item Report: ${subject}` : subject,
        message,
        priority: ticketType === 'LOST_ITEM' ? 'HIGH' : 'NORMAL',
      });
      Alert.alert('Success', 'Your ticket has been raised successfully. Our team will get back to you soon.');
      setSubject('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to raise ticket. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ================= HEADER IMAGE ================= */}

            <ImageBackground
              source={require('../../assets/images/image6.png')}
              style={styles.headerImage}
              imageStyle={styles.imageRadius}
              resizeMode="cover"
            >
              <View style={styles.overlay} />
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={22} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerTextBox}>
                <Text style={styles.title}>Need Help?</Text>
                <Text style={styles.subtitle}>We're here to assist you 24/7</Text>
              </View>
            </ImageBackground>

            {/* ================= CONTENT ================= */}

            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Quick Support</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionCard} onPress={openLiveSupport}>
                  <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="chatbubbles" size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.actionLabel}>Live Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={openEmail}>
                  <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="mail" size={24} color="#7B1FA2" />
                  </View>
                  <Text style={styles.actionLabel}>Email Us</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Raise Reported Issue</Text>

              <View style={styles.form}>
                <Text style={styles.label}>Select Category</Text>
                <View style={styles.typeRow}>
                  {(['LOST_ITEM', 'TECHNICAL', 'BOOKING', 'PAYMENT', 'OTHER'] as const).map((type) => (
                    <TouchableOpacity 
                      key={type}
                      style={[styles.typeChip, ticketType === type && styles.activeTypeChip]}
                      onPress={() => setTicketType(type)}
                    >
                      <Text style={[styles.typeText, ticketType === type && styles.activeTypeText]}>
                        {type.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ticketType === 'LOST_ITEM' ? (
                  <>
                    <Text style={styles.label}>Item Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Wallet, Watch, iPhone 15"
                      value={subject}
                      onChangeText={setSubject}
                    />
                    <Text style={styles.label}>Item Description & Where you lost it</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Tell us color, brand and the place you last saw it"
                      multiline
                      numberOfLines={5}
                      value={message}
                      onChangeText={setMessage}
                      textAlignVertical="top"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Brief summary of the issue"
                      value={subject}
                      onChangeText={setSubject}
                    />
                    <Text style={styles.label}>Message</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe your issue in detail..."
                      multiline
                      numberOfLines={5}
                      value={message}
                      onChangeText={setMessage}
                      textAlignVertical="top"
                    />
                  </>
                )}

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && styles.disabledBtn]} 
                  onPress={handleCreateTicket}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                        {ticketType === 'LOST_ITEM' ? 'REPORT LOST ITEM' : 'SUBMIT REQUEST'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </View>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerImage: {
    height: 240, 
    width: '100%',
  },
  imageRadius: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    marginTop: 15,
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTextBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#444',
    marginBottom: 8,
    marginTop: 16,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTypeChip: {
    backgroundColor: '#C26A2C', // Using themed orange
    borderColor: '#C26A2C',
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  activeTypeText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    color: '#1A1A1A',
  },
  textArea: {
    height: 120,
  },
  submitBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
