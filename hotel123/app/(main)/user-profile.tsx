import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { useAuth } from '../../context/AuthContext';

export default function UserProfile() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout, token } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: Math.max(20, insets.bottom) }]}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons name="menu" size={28} color="#2F2E2E" />
          </TouchableOpacity>

          <Text style={styles.title}>Profile</Text>
        </View>

        {/* PROFILE INFO */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.profileImage ? (
              <Image 
                source={{ uri: user.profileImage }} 
                style={styles.avatarImage} 
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={40} color="rgba(0,0,0,0.3)" />
            )}
          </View>

          <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.phone}>{user?.phone || 'No Phone'}</Text>
          <Text style={styles.phone}>{user?.email || 'No Email'}</Text>
          {user?.address && <Text style={styles.phone}>{user.address}</Text>}
        </View>

        {/* OPTIONS */}
        <View style={styles.optionList}>
          <ProfileOption
            label="Change Personal Details"
            onPress={() => router.push('/(main)/change-personal-details')}
          />
          <ProfileOption
            label="Change Password"
            onPress={() => router.push('/(main)/change-password')}
          />
          <ProfileOption label="Bookings" />
          <ProfileOption label="Payments" />
        </View>

        {/* WHATSAPP SUPPORT */}
        <View style={styles.supportCard}>
          <Text style={styles.supportText}>
            If you have any other query you can reach out to us.
          </Text>

          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() =>
              Linking.openURL('https://wa.me/916388163169')
            }
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp Us</Text>
          </TouchableOpacity>
        </View>

        {/* AUTH BUTTON */}
        <TouchableOpacity
          style={[styles.logoutButton, !token && { backgroundColor: '#2F2E2E' }]}
          onPress={async () => {
            if (token) {
                await logout();
            }
            router.replace('/(auth)/sign-in');
          }}
        >
          <Text style={styles.logoutText}>{token ? 'Logout' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

/* ---------- COMPONENT ---------- */

function ProfileOption({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={styles.optionText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#2F2E2E" />
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFECEC',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },


  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginRight: 12,
  },

  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#2F2E2E',
  },

  profileCard: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 30,
    alignItems: 'center',
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217,217,217,1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  
  avatarImage: {
    width: '100%',
    height: '100%',
  },

  name: {
    marginTop: 14,
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#2F2E2E',
  },

  phone: {
    marginTop: 4,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(0,0,0,0.56)',
  },

  optionList: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
  },

  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },

  optionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2F2E2E',
  },

  /* SUPPORT */
  supportCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  supportText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#2F2E2E',
    marginBottom: 14,
  },

  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  whatsappText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#25D366',
  },

  logoutButton: {
    marginTop: 30,
    height: 48,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
