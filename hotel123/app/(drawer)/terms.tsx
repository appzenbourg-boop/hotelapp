import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using the Zenbourg Hotel Booking App, you agree to be bound by these Terms and Services. If you do not agree with any part of these terms, you may not use our services. We reserve the right to update these terms at any time without prior notice.',
  },
  {
    title: '2. User Conduct',
    content: 'Users are responsible for maintaining the confidentiality of their account credentials. You agree to use the app only for lawful purposes and in a way that does not infringe the rights of others or restrict their use and enjoyment of the app.',
  },
  {
    title: '3. Booking and Payments',
    content: 'All bookings are subject to availability and confirmation. Payment must be made through our authorized payment gateways. Zenbourg reserves the right to cancel bookings in case of suspected fraudulent activity or payment failures.',
  },
  {
    title: '4. Cancellation and Refunds',
    content: 'Cancellation policies vary by property and room type. Users are advised to review the specific cancellation terms before confirming a booking. Refunds, if applicable, will be processed according to the timeline mentioned in the property policy.',
  },
  {
    title: '5. Privacy and Data Security',
    content: 'Your privacy is important to us. We collect and process personal data in accordance with our Privacy Policy. By using the app, you consent to the collection and use of your information for service improvement and personalized experiences.',
  },
  {
    title: '6. Limitation of Liability',
    content: 'Zenbourg acts as a platform to connect users with hotel properties. We are not liable for any discrepancies in services provided by the hotels or for any direct, indirect, or incidental damages arising from the use of our app.',
  },
];

export default function Terms() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [agree, setAgree] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* ================= HEADER IMAGE ================= */}

        <ImageBackground
          source={require('../../assets/images/image6.png')}
          style={styles.headerImage}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >

          {/* DARK OVERLAY */}
          <View style={styles.overlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          {/* Header Text */}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Terms and Services</Text>
            <Text style={styles.headerSub}>
              These terms outline the rules and{'\n'}
              guidelines for using our app{'\n'}
              responsibly.
            </Text>
          </View>

        </ImageBackground>

        {/* ================= CONTENT ================= */}

        <View style={styles.content}>

          <ScrollView showsVerticalScrollIndicator={false}>

            {TERMS_SECTIONS.map((section, index) => (
              <View key={index} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            ))}

            {/* CHECKBOX */}
            <TouchableOpacity
              style={[styles.checkRow, { marginBottom: 20 }]}
              onPress={() => setAgree(!agree)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                {agree && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>

              <Text style={styles.checkText}>
                I have read and agree to the terms of{'\n'}
                service and privacy policy
              </Text>
            </TouchableOpacity>

            {/* BUTTON */}
            <TouchableOpacity
              style={[styles.button, { opacity: agree ? 1 : 0.6 }]}
              disabled={!agree}
              onPress={() => router.replace('/home')}
            >
              <Text style={styles.buttonText}>Agree and Continue</Text>
            </TouchableOpacity>

          </ScrollView>

        </View>

      </View>
    </>
  );
}


/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F1EE',
  },

  /* HEADER IMAGE */

  headerImage: {
    height: 260,
    width: '100%',
  },

  imageStyle: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  backBtn: {
    marginTop: 12,
    marginLeft: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  headerText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  headerTitle: {
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },

  headerSub: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },

  /* CONTENT */

  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  /* SECTIONS */

  sectionContainer: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  sectionContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    textAlign: 'justify',
  },

  /* CHECKBOX */

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#777',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#2F2E2E',
    borderColor: '#2F2E2E',
  },

  checkText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#444',
  },

  /* BUTTON */

  button: {
    marginTop: 20,
    height: 52,
    borderRadius: 30,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
