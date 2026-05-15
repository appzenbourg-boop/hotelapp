import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function CheckIn() {
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<any>();
  const { token } = useAuth();

  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState<any[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (idImage) return; 
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
    }
  };

  const handleConfirm = async () => {
    if (!firstName || !lastName || phone.length < 10) {
      Alert.alert('Incomplete Form', 'Please enter your full name and valid phone number.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sync check-in data with backend
      if (bookingId && token) {
        try {
          await bookingsAPI.checkIn(token, bookingId, {
            idType: idType || undefined,
            idImage: idImage || undefined,
            numberOfGuests: guests.length + 1,
          });
        } catch (e) {
          console.log('API checkIn sync non-fatal error:', e);
        }
      }

      // 2. Send OTP
      const { authAPI } = require('../../services/api');
      await authAPI.sendOTP(phone);
      
      router.push({
        pathname: '/(main)/otp',
        params: {
          phone,
          name: `${firstName} ${lastName}`,
          guests: guests.length + 1,
          bookingId,
        },
      });
    } catch (e) {
      console.error('Check-in process error:', e);
      Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* HEADER */}
            <ImageBackground
              source={require('../../assets/images/image4.png')}
              style={[styles.header, { height: 220 + insets.top }]}
              imageStyle={styles.headerRadius}
            >
              <View style={styles.overlay} />

              <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 10 }]}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Check-In</Text>
            </ImageBackground>

            {/* FORM */}
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Guest Information</Text>
              
              <TextInput
                placeholder="FIRST NAME"
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#999"
              />
              <TextInput
                placeholder="LAST NAME"
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#999"
              />

              <View style={styles.phoneBox}>
                <View style={styles.countryCodeBox}>
                  <Text style={styles.countryCode}>+91</Text>
                  <Ionicons name="chevron-down" size={14} color="#666" />
                </View>
                <View style={styles.phoneDivider} />
                <TextInput
                  placeholder="MOBILE NUMBER"
                  style={styles.phoneInput}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>

              <Text style={styles.sectionTitle}>Verification</Text>
              <TextInput
                placeholder="ID TYPE (AADHAR, PASSPORT, ETC)"
                style={styles.input}
                value={idType}
                onChangeText={setIdType}
                placeholderTextColor="#999"
              />

              <TouchableOpacity 
                  style={[styles.imagePicker, idImage && styles.imagePickerActive]} 
                  onPress={pickImage}
                  activeOpacity={idImage ? 1 : 0.7}
              >
                  {idImage ? (
                      <View style={styles.previewContainer}>
                          <ImageBackground source={{ uri: idImage }} style={styles.previewImage} imageStyle={{ borderRadius: 15 }}>
                              <View style={styles.uploadedBadge}>
                                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                  <Text style={styles.uploadedText}>Document Uploaded</Text>
                              </View>
                          </ImageBackground>
                      </View>
                  ) : (
                      <View style={styles.pickerPlaceholder}>
                          <View style={styles.cameraCircle}>
                            <Ionicons name="camera" size={30} color="#666" />
                          </View>
                          <Text style={styles.pickerLabel}>Upload ID Proof Photo</Text>
                          <Text style={styles.pickerSub}>Clear image of your government ID</Text>
                      </View>
                  )}
              </TouchableOpacity>

              <View style={styles.guestSection}>
                  <View style={styles.guestHeader}>
                    <Text style={styles.sectionTitle}>Additional Guests</Text>
                    <TouchableOpacity 
                        style={styles.addBtn}
                        onPress={() => setGuests([...guests, { name: '' }])}
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  {guests.map((g, index) => (
                    <View key={index} style={styles.guestCard}>
                      <View style={styles.guestCardHeader}>
                        <Text style={styles.guestLabel}>GUEST {index + 2}</Text>
                        <TouchableOpacity onPress={() => {
                            const n = [...guests];
                            n.splice(index, 1);
                            setGuests(n);
                        }}>
                            <Ionicons name="close-circle" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                      <TextInput 
                        placeholder="FULL NAME" 
                        style={styles.guestInput}
                        value={g.name}
                        onChangeText={(t) => {
                            const n = [...guests];
                            n[index].name = t;
                            setGuests(n);
                        }}
                        placeholderTextColor="#999"
                      />
                    </View>
                  ))}
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                disabled={loading}
                onPress={handleConfirm}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                        <Text style={styles.confirmText}>Proceed to Verify</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { width, justifyContent: 'center', alignItems: 'center' },
  headerRadius: { borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  backBtn: { 
    position: 'absolute', 
    left: 20, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 28, color: '#fff', fontFamily: 'Inter-Bold' },
  content: { paddingHorizontal: 24, paddingTop: 30 },
  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#1A1A1A', marginBottom: 15, marginTop: 10 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#000',
  },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 10,
  },
  countryCode: { fontFamily: 'Inter-Bold', fontSize: 14, color: '#1A1A1A', marginRight: 4 },
  phoneDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0' },
  phoneInput: { flex: 1, paddingHorizontal: 15, fontFamily: 'Inter-Medium', fontSize: 14, color: '#000' },
  
  imagePicker: {
    height: 180,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 25,
    overflow: 'hidden',
  },
  imagePickerActive: { borderColor: '#4CAF50', borderStyle: 'solid' },
  pickerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  pickerLabel: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#1A1A1A' },
  pickerSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#999', marginTop: 4 },
  previewContainer: { flex: 1 },
  previewImage: { flex: 1, justifyContent: 'flex-end' },
  uploadedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    margin: 15, 
    padding: 10, 
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  uploadedText: { marginLeft: 8, fontFamily: 'Inter-Bold', fontSize: 12, color: '#4CAF50' },

  guestSection: { marginTop: 10 },
  guestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  guestCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  guestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  guestLabel: { fontFamily: 'Inter-Bold', fontSize: 11, color: '#999', letterSpacing: 1 },
  guestInput: { height: 48, borderBottomWidth: 1, borderBottomColor: '#EEE', fontFamily: 'Inter-Medium', fontSize: 14, padding: 0, color: '#000' },

  confirmBtn: {
    marginTop: 30,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    gap: 10,
  },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-Bold' },
});
