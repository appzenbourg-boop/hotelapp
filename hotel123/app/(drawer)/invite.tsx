import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Share,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { referralAPI } from '../../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Invite() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    rewardPerReferral: 100,
  });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    if (token) {
      fetchReferralData();
    }
  }, [token]);

  const fetchReferralData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Fetch referral code
      const codeRes = await referralAPI.getMyReferralCode(token);
      if (codeRes.success && codeRes.code) {
        setReferralCode(codeRes.code);
        setReferralLink(`https://hotel.app/ref/${codeRes.code}`);
      }

      // Fetch stats
      const statsRes = await referralAPI.getReferralStats(token);
      if (statsRes.success) {
        setStats({
          totalEarnings: statsRes.totalEarnings || 0,
          totalReferrals: statsRes.totalReferrals || 0,
          completedReferrals: statsRes.completedReferrals || 0,
          pendingReferrals: statsRes.pendingReferrals || 0,
          rewardPerReferral: statsRes.rewardPerReferral || 100,
        });
      }

      // Fetch referral list
      const listRes = await referralAPI.getReferrals(token);
      if (listRes.success && listRes.referrals) {
        setReferrals(listRes.referrals);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on this amazing hotel booking app and get ₹${stats.rewardPerReferral} off on your first booking! Use my referral code: ${referralCode}\n\n${referralLink}`,
        title: 'Invite Friends & Earn Rewards',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleReferrals = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowReferrals(!showReferrals);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={[styles.container, { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom }]}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Invite & Earn</Text>

          {/* spacer for centering */}
          <View style={{ width: 26 }} />
        </View>

        {/* GIFT */}
        <Image
          source={require('../../assets/images/gift.png')}
          style={styles.giftImg}
        />

        <Text style={styles.referText}>Refer friends and earn</Text>
        <Text style={styles.amountText}>₹{stats.rewardPerReferral} per referral</Text>

        {/* REFERRAL CODE */}
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.codeText}>{referralCode || 'Loading...'}</Text>
        </View>

        {/* LINK */}
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {referralLink || 'Generating link...'}
          </Text>

          <TouchableOpacity onPress={handleCopy}>
            <Ionicons name="copy-outline" size={22} />
          </TouchableOpacity>
        </View>

        {/* SHARE BUTTON */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnText}>Share & Earn Now</Text>
        </TouchableOpacity>

        {/* STATS */}
        <View style={styles.statsCard}>

          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Earnings</Text>
            <Text style={styles.statsValue}>₹{stats.totalEarnings.toFixed(2)}</Text>
          </View>

          <TouchableOpacity style={styles.statsRow} onPress={toggleReferrals}>
            <Text style={styles.statsLabel}>Referrals ({stats.totalReferrals})</Text>
            <Ionicons
              name={showReferrals ? 'chevron-down' : 'chevron-forward'}
              size={20}
              color="#777"
            />
          </TouchableOpacity>

          {showReferrals && (
            <View style={styles.referralBox}>

              <View style={styles.progressBg}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(stats.completedReferrals / Math.max(stats.totalReferrals, 1)) * 100}%` }
                  ]} 
                />
              </View>

              <Text style={styles.progressText}>
                {stats.completedReferrals} of {stats.totalReferrals} completed
              </Text>

              {referrals.length > 0 ? (
                referrals.map((referral, i) => (
                  <View key={referral.id || i} style={styles.personRow}>
                    <Text>{i + 1}. {referral.name || referral.phone || 'User'}</Text>

                    <View style={[
                      styles.badge,
                      referral.status === 'COMPLETED' ? styles.done : styles.pending
                    ]}>
                      <Text style={styles.badgeText}>
                        {referral.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noReferralsText}>No referrals yet. Start sharing!</Text>
              )}

            </View>
          )}

        </View>

        {/* HOW IT WORKS */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How it works</Text>
          
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Share your referral code with friends</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>They sign up and make their first booking</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>You both get ₹{stats.rewardPerReferral} in your wallet!</Text>
          </View>
        </View>

      </ScrollView>
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

  container: {
    backgroundColor: '#F6F6F6',
    padding: 20,
    alignItems: 'center',
  },


  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },

  giftImg: {
    width: 170,
    height: 170,
    marginTop: 10,
  },

  referText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },

  amountText: {
    marginTop: 6,
    fontSize: 36,
    fontWeight: '700',
  },

  linkBox: {
    marginTop: 24,
    backgroundColor: '#ECECEC',
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  linkText: {
    width: '85%',
    color: '#555',
  },

  shareBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  statsCard: {
    marginTop: 30,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
  },

  statsRow: {
    height: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },

  statsLabel: {
    fontWeight: '600',
  },

  statsValue: {
    fontWeight: '600',
  },

  referralBox: {
    padding: 18,
  },

  progressBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },

  progressFill: {
    width: '20%',
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },

  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#777',
  },

  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  done: {
    backgroundColor: '#DCFCE7',
  },

  pending: {
    backgroundColor: '#FEF3C7',
  },

  badgeText: {
    fontSize: 12,
  },

  /* HOW IT WORKS */
  howItWorksCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },

  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  stepNumberText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },

  codeBox: {
    marginTop: 16,
    backgroundColor: '#F0F9FF',
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
  },

  codeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 2,
  },

  noReferralsText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },

});
