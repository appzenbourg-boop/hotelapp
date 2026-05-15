import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/api';

export default function Wallet() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchWalletBalance();
      }
    }, [token])
  );

  const fetchWalletBalance = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await walletAPI.getBalance(token);
      if (res.success) {
        setBalance(res.balance || 0);
      }
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(main)/home');
          }
        }}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rewards</Text>
      </View>

      {/* MAIN WALLET */}
      <View style={styles.section}>
        {loading ? (
          <View style={[styles.walletCard, { backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <View style={styles.walletCardContainer}>
            <TouchableOpacity
              style={[styles.walletCard, { backgroundColor: '#1E1E1E' }]}
              activeOpacity={0.9}
              onPress={() => router.push('/(drawer)/wallet-details')}
            >
              <Text style={styles.walletTitle}>Reward Balance</Text>
              <Text style={styles.walletAmount}>₹{balance.toFixed(2)}</Text>
              <Text style={styles.walletSubtitle}>Available for booking discounts</Text>

              <View style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>View Transaction History</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.floatingRefreshBtn} 
              onPress={fetchWalletBalance}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color="#FFF" style={{ opacity: loading ? 0.5 : 1 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* HOW IT WORKS */}
      <View style={styles.infoSection}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="gift" size={32} color="#2563EB" />
        </View>
        <Text style={styles.infoTitle}>Earn Rewards!</Text>
        <Text style={styles.infoDescription}>
          Share your referral code with friends. When they create an account using your code, your wallet automatically gets credited with reward money!
        </Text>
        
        <TouchableOpacity 
          style={styles.inviteButton}
          onPress={() => router.push('/(drawer)/invite')}
        >
          <Text style={styles.inviteButtonText}>Invite Friends Now</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F6F6',
    padding: 20,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
  },

  section: {
    marginTop: 10,
  },

  walletCard: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    padding: 20,
    justifyContent: 'center',
  },
  walletCardContainer: {
    width: '100%',
    position: 'relative',
  },
  floatingRefreshBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  walletTitle: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },

  walletAmount: {
    marginTop: 12,
    fontSize: 32,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  walletSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#E0E0E0',
  },

  viewDetailsBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginRight: 6,
  },

  infoSection: {
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  infoTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#111',
    marginBottom: 10,
  },

  infoDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  inviteButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
  },

  inviteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
