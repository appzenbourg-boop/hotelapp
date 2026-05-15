import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const { width } = Dimensions.get('window');

export default function OTPVerification() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

    const [resending, setResending] = useState(false);

    const handleResend = async () => {
        if (!phone || phone === 'new') {
            Alert.alert('Error', 'Invalid phone number for resend');
            return;
        }

        try {
            setResending(true);
            const res = await authAPI.sendOTP(phone);
            if (res.otp) {
                Alert.alert('Debug Mode', `New OTP is: ${res.otp}`);
            } else {
                Alert.alert('Success', 'Verification code resent successfully');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resend verification code');
        } finally {
            setResending(false);
        }
    };

  const handleVerify = async () => {
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    try {
      setLoading(true);
      
      const res = await authAPI.verifyOTP(phone, code);
      
      // We check if res.success is true
      // If the backend returns success, it will tell us if the user is new or existing
      if (res.isNewUser) {
        // New user -> redirect to onboarding to fill name, email, password
        router.replace(`/(auth)/onboarding?phone=${encodeURIComponent(phone || '')}`);
      } else {
        // Existing user -> we have a token from the backend now!
        await login(res.token, res.user);
        router.replace('/(main)/home');
      }
      
    } catch (error: any) {
      Alert.alert('Invalid Code', error.message || 'The verification code you entered is incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={require('../../assets/images/image1.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <Text style={styles.welcomeText}>Verify Code</Text>
              <Text style={styles.subtitleText}>
                Enter the 6-digit code sent to {phone === 'new' ? 'your mobile' : `+91 ${phone}`}
              </Text>

              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.otpBox,
                      code.length === index && styles.otpBoxActive
                    ]}
                  >
                    <Text style={styles.otpText}>{code[index] || ''}</Text>
                  </View>
                ))}
                
                <TextInput
                  style={styles.hiddenInput}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={6}
                  value={code}
                  onChangeText={(val) => setCode(val.replace(/[^0-9]/g, ''))}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, loading && { opacity: 0.7 }]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                  style={styles.resendButton} 
                  onPress={handleResend}
                  disabled={resending}
              >
                {resending ? (
                    <ActivityIndicator size="small" color="#000" />
                ) : (
                    <>
                      <Text style={styles.resendText}>Didn't receive code? </Text>
                      <Text style={styles.resendLink}>Resend</Text>
                    </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: width * 0.9,
    maxWidth: 450,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    position: 'relative',
    width: '100%',
  },
  otpBox: {
    width: width > 400 ? 52 : 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#EFECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#2F2E2E',
    backgroundColor: '#FFF',
  },
  otpText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#000',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 1, // Prevent keyboard from showing a massive cursor on Android
  },
  verifyButton: {
    backgroundColor: '#2F2E2E',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  resendLink: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Inter-SemiBold',
  },
});
