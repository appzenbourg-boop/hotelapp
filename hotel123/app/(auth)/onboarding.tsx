import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const { width } = Dimensions.get('window');

import DateTimePicker from '@react-native-community/datetimepicker';

type OnboardingStep = 'NAME' | 'DOB' | 'GENDER' | 'EMAIL' | 'REFERRAL';

export default function Onboarding() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [step, setStep] = useState<OnboardingStep>('NAME');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState<Date>(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionStep = (nextStep: OnboardingStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setStep(nextStep);
  };

  const handleNext = async () => {
    switch (step) {
      case 'NAME':
        if (!name.trim()) return Alert.alert('Required', 'Please enter your full name');
        transitionStep('DOB');
        break;
      case 'DOB':
        transitionStep('GENDER');
        break;
      case 'GENDER':
        if (!gender) return Alert.alert('Required', 'Please select your gender');
        transitionStep('EMAIL');
        break;
      case 'EMAIL':
        // Skip or next
        transitionStep('REFERRAL');
        break;
      case 'REFERRAL':
        handleFinish();
        break;
    }
  };

  const handleFinish = async () => {
    try {
      setLoading(true);
      
      const generatedPassword = `user_${phone}_${Math.random().toString(36).substring(7)}`;
      
      const res = await authAPI.signup(
        name, 
        phone === 'new' ? '91'+Math.floor(Math.random()*10000000000) : phone!, 
        generatedPassword, 
        email || undefined, 
        referralCode || undefined,
        dob.toISOString(),
        gender
      );
      
      if (res && res.token) {
        await login(res.token, res.user);
        router.replace('/(main)/home');
      } else {
        const errorMsg = res?.error || 'Could not create account';
        if (errorMsg.toLowerCase().includes('referral')) {
            Alert.alert('Invalid Code', 'The referral code is invalid.', [
                { text: 'Try Again', onPress: () => setStep('REFERRAL') },
                { text: 'Skip', onPress: () => { setReferralCode(''); handleFinish(); } }
            ]);
        } else {
            Alert.alert('Signup Failed', errorMsg);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'NAME':
        return (
          <>
            <Text style={styles.welcomeText}>Your Name</Text>
            <Text style={styles.subtitleText}>Please enter your full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </>
        );
      case 'DOB':
        return (
          <>
            <Text style={styles.welcomeText}>Date of Birth</Text>
            <Text style={styles.subtitleText}>When were you born?</Text>
            <TouchableOpacity 
                style={styles.input} 
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={{ color: dob ? '#000' : '#888', marginTop: 14 }}>
                    {dob.toLocaleDateString()}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    value={dob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setDob(selectedDate);
                    }}
                    maximumDate={new Date()}
                />
            )}
          </>
        );
      case 'GENDER':
        return (
          <>
            <Text style={styles.welcomeText}>Gender</Text>
            <Text style={styles.subtitleText}>Select your gender</Text>
            <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity 
                        key={g} 
                        style={[styles.genderOption, gender === g && styles.genderSelected]}
                        onPress={() => setGender(g)}
                    >
                        <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </>
        );
      case 'EMAIL':
        return (
          <>
            <Text style={styles.welcomeText}>Your Email</Text>
            <Text style={styles.subtitleText}>For booking receipts (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#888"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoFocus
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => transitionStep('REFERRAL')} style={{ marginBottom: 10 }}>
              <Text style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>Skip</Text>
            </TouchableOpacity>
          </>
        );
      case 'REFERRAL':
        return (
          <>
            <Text style={styles.welcomeText}>Referral Code</Text>
            <Text style={styles.subtitleText}>Have a code? (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter code"
              placeholderTextColor="#888"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              autoFocus
              autoCapitalize="characters"
            />
            <TouchableOpacity onPress={handleFinish} style={{ marginBottom: 10 }}>
              <Text style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>Skip</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  const getProgress = () => {
    switch (step) {
      case 'NAME': return '20%';
      case 'DOB': return '40%';
      case 'GENDER': return '60%';
      case 'EMAIL': return '80%';
      case 'REFERRAL': return '100%';
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
        <Image
            source={require('../../assets/images/logoapp.png')}
            style={styles.logo}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                  if(step === 'NAME') router.back();
                  else if(step === 'DOB') transitionStep('NAME');
                  else if(step === 'GENDER') transitionStep('DOB');
                  else if(step === 'EMAIL') transitionStep('GENDER');
                  else if(step === 'REFERRAL') transitionStep('EMAIL');
                }} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: getProgress() }]} />
                </View>
              </View>

              <Animated.View style={{ opacity: fadeAnim }}>
                  {renderContent()}
              </Animated.View>

              <TouchableOpacity
                style={[styles.nextButton, loading && { opacity: 0.7 }]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>{step === 'REFERRAL' ? 'Finish' : 'Next'}</Text>
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
    paddingTop: 80,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    marginLeft: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 4,
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
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    height: 52,
    marginBottom: 24,
    color: '#000',
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#2F2E2E',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center',
    position: 'absolute',
    top: 60,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  genderOption: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderSelected: {
    backgroundColor: '#2F2E2E',
    borderColor: '#2F2E2E',
  },
  genderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  genderTextSelected: {
    color: '#fff',
  },
});
