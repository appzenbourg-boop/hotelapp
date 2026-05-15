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

const FAQS = [
  {
    question: 'How do I book a room?',
    answer: 'Simply browse our listings on the home or booking page, select a property that fits your needs, and follow the simple booking process. You will receive a confirmation once the payment is successful.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards, UPI, and net banking through our secure Razorpay integration. Your payment information is always encrypted and safe.',
  },
  {
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking through the "My Bookings" section. Please note that cancellation fees may apply depending on the property policy and how close you are to the check-in date.',
  },
  {
    question: 'How do I check my refund status?',
    answer: 'Once a refund is initiated, it typically takes 5-7 business days to reflect in your original payment method. You can track the status in the "Wallet" or "My Bookings" section.',
  },
  {
    question: 'Is my personal data safe?',
    answer: 'Absolutely. We use industry-standard encryption and follow strict data privacy guidelines to ensure your personal and payment information is protected at all times.',
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach us through the "Need Help" section in the menu, where you can start a live chat or raise a support ticket. Our team is available 24/7 to assist you.',
  },
  {
    question: 'Can I change my check-in/out dates?',
    answer: 'Modifying dates depends on current availability. You can request a change through the app, but please be aware that price differences or modification fees may apply.',
  },
];

export default function FAQ() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* ================= HEADER IMAGE ================= */}

        <ImageBackground
          source={require('../../assets/images/image6.png')}
          style={styles.headerImage}
          imageStyle={styles.imageRadius}
          resizeMode="cover"
        >

          {/* DARK OVERLAY */}
          <View style={styles.overlay} />

          {/* BACK BUTTON */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          {/* HEADER TEXT */}
          <View style={styles.headerTextBox}>
            <Text style={styles.title}>FAQs</Text>
            <Text style={styles.subtitle}>Frequently Asked Questions</Text>
          </View>

        </ImageBackground>

        {/* ================= CONTENT ================= */}

        <View style={styles.content}>

          <ScrollView showsVerticalScrollIndicator={false}>

            {FAQS.map((item, index) => (
              <Accordion
                key={index}
                title={item.question}
                desc={item.answer}
                open={openIndex === index}
                onPress={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              />
            ))}

          </ScrollView>

        </View>

      </View>
    </>
  );
}

/* ================= ACCORDION ================= */

function Accordion({ title, desc, open, onPress }: any) {
  return (
    <View style={styles.card}>

      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.question}>{title}</Text>

        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#111"
        />
      </TouchableOpacity>

      {open && (
        <Text style={styles.answer}>{desc}</Text>
      )}

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F1EE',
  },

  /* HEADER */

  headerImage: {
    height: 260,
    width: '100%',
  },

  imageRadius: {
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
    zIndex: 2,
  },

  headerTextBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },

  /* CONTENT */

  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  /* FAQ CARD */

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  question: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111',
  },

  answer: {
    marginTop: 12,
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
});
