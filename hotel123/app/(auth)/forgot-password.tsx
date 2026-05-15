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
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';

export default function ForgotPassword() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP' | 'RESET'>('MOBILE');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async () => {
    if (mobile.length < 10) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }
    try {
      setLoading(true);
      const res = await authAPI.sendOTP(mobile);
      if (res.success) {
        setStep('OTP');
        Alert.alert('Success', 'Verification code sent to your mobile');
      } else {
        Alert.alert('Error', res.error || 'Failed to send OTP');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'OTP delivery failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      Alert.alert('Error', 'Please enter 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      const res = await authAPI.verifyOTP(mobile, otp);
      if (res.verified || res.status === 'approved' || res.success) {
        setStep('RESET');
      } else {
        Alert.alert('Error', 'Invalid OTP code');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await authAPI.resetPassword(mobile, newPassword, true);
      if (res.success) {
        Alert.alert('Success', 'Password reset successfully. Please login.');
        router.replace('/(auth)/sign-in');
      } else {
        Alert.alert('Error', res.error || 'Failed to reset password');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Operation failed');
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.welcomeText}>
                {step === 'MOBILE' ? 'Reset Password' : step === 'OTP' ? 'Verify' : 'New Password'}
              </Text>
              <Text style={styles.subtitleText}>
                {step === 'MOBILE' 
                  ? 'Enter your mobile to get recovery code' 
                  : step === 'OTP' 
                  ? `Enter code sent to +91 ${mobile}` 
                  : 'Set a strong new password'}
              </Text>

              {step === 'MOBILE' && (
                <View style={styles.mobileRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="Mobile Number"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    value={mobile}
                    onChangeText={setMobile}
                  />
                </View>
              )}

              {step === 'OTP' && (
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              )}

              {step === 'RESET' && (
                <>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="New Password"
                      placeholderTextColor="#888"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#888"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={
                  step === 'MOBILE' ? handleSendOTP : 
                  step === 'OTP' ? handleVerifyOTP : handleResetPassword
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {step === 'MOBILE' ? 'Send Code' : step === 'OTP' ? 'Verify Code' : 'Update Password'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  welcomeText: { fontSize: 26, fontFamily: 'Poppins-SemiBold', color: '#000', marginBottom: 8 },
  subtitleText: { fontSize: 14, color: '#666', marginBottom: 24 },
  mobileRow: { flexDirection: 'row', marginBottom: 20 },
  countryCodeBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    height: 52,
  },
  countryCodeText: { fontSize: 16, color: '#000' },
  mobileInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 52,
    color: '#000',
  },
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    marginBottom: 20,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 52,
    marginBottom: 16,
    color: '#000',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, fontSize: 16, color: '#000' },
  eyeIcon: { padding: 10 },
  primaryButton: {
    backgroundColor: '#2F2E2E',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { height: 52, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#2F2E2E', fontSize: 15, fontWeight: '500' },
});
