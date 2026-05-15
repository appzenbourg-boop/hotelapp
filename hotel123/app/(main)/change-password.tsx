import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const [forgot, setForgot] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [otp, setOtp] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const sendOtp = () => {
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp.length === 6) {
      setOtpVerified(true);
    }
  };

  const canSubmit =
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    (forgot ? otpVerified : oldPassword.length > 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#2F2E2E" />
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>

        <View style={styles.card}>
          {/* NORMAL CHANGE PASSWORD */}
          {!forgot && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Old Password"
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
              />

              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => setForgot(true)}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* FORGOT PASSWORD FLOW */}
          {forgot && (
            <>
              {!otpSent && (
                <>
                  <Text style={styles.infoText}>
                    OTP will be sent to your registered mobile number
                  </Text>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={sendOtp}
                  >
                    <Text style={styles.primaryText}>Send OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {otpSent && !otpVerified && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={verifyOtp}
                  >
                    <Text style={styles.primaryText}>Verify OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {otpVerified && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </>
              )}
            </>
          )}

          {/* SUBMIT */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit && { opacity: 0.5 },
            ]}
            disabled={!canSubmit}
            onPress={() => router.back()}
          >
            <Text style={styles.submitText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFECEC',
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#2F2E2E',
  },

  card: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
  },

  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    marginBottom: 14,
    fontFamily: 'Inter-Regular',
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },

  forgotText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#2F2E2E',
  },

  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 14,
    color: '#2F2E2E',
  },

  primaryButton: {
    height: 48,
    borderRadius: 30,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  primaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },

  submitButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
