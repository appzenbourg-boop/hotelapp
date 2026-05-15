import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';

const languages = [
  'English',
  'Hindi',
  'Marathi',
  'Bengali',
  'Odia',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Gujarati',
];

export default function Language() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useAuth();
  const [selected, setSelected] = useState(language || 'English');

  const handleSave = async () => {
    await setLanguage(selected);
    router.back();
  };

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
          {/* Overlay */}
          <View style={styles.overlay} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.headerText}>
            <Text style={styles.title}>Change Language</Text>
            <Text style={styles.subtitle}>
              Switch to your preferred language for a{'\n'}
              smoother experience.
            </Text>
          </View>
        </ImageBackground>

        {/* ================= LANGUAGE LIST ================= */}
        <View style={styles.content}>

          <ScrollView showsVerticalScrollIndicator={false}>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageCard,
                  selected === lang && { borderColor: '#2DBE60', borderWidth: 1.5 }
                ]}
                onPress={() => setSelected(lang)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.languageText,
                  selected === lang && { fontFamily: 'Inter-SemiBold', color: '#2DBE60' }
                ]}>{lang}</Text>

                {selected === lang && (
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color="#2DBE60"
                  />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.selectBtn}
              onPress={handleSave}
            >
              <Text style={styles.selectText}>Save Changes</Text>
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
    height: 260,               // Perfect visible image height
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
  },

  headerText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
  },

  /* CONTENT */

  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  languageCard: {
    height: 58,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  languageText: {
    fontSize: 16,
    color: '#2F2E2E',
    fontFamily: 'Inter-Regular',
  },

  selectBtn: {
    marginTop: 30,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#2F2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  selectText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
