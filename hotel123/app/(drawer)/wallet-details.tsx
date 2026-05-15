import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/api';

export default function WalletDetails() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchWalletData();
    }
  }, [token, activeTab]);

  const fetchWalletData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Fetch balance
      const balanceRes = await walletAPI.getBalance(token);
      if (balanceRes.success) {
        setBalance(balanceRes.balance || 0);
      }

      // Fetch transactions
      const type = activeTab === 'all' ? undefined : activeTab.toUpperCase() as 'CREDIT' | 'DEBIT';
      const txnRes = await walletAPI.getTransactions(token, type);
      if (txnRes.success && txnRes.transactions) {
        setTransactions(txnRes.transactions);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = transactions;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>

      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* HEADER */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.walletTitle}>Your Money</Text>
          <Text style={styles.expiry}>Wallet Balance</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.amount}>₹{balance.toFixed(2)}</Text>
              <Text style={styles.amountLabel}>Available balance</Text>
            </View>

            <View>
              <Text style={styles.amount}>₹{balance.toFixed(2)}</Text>
              <Text style={styles.amountLabel}>Usable anytime</Text>
            </View>
          </View>

          <Image
            source={require('../../assets/images/coin.png')}
            style={styles.coinImg}
          />

        </View>

        {/* WHITE CARD BODY */}
        <View style={styles.body}>

          {/* TABS */}
          <View style={styles.tabsRow}>
            <Tab label="All" value="all" active={activeTab} setActive={setActiveTab} />
            <Tab label="Credit" value="credit" active={activeTab} setActive={setActiveTab} />
            <Tab label="Debit" value="debit" active={activeTab} setActive={setActiveTab} />
          </View>

          {/* LIST */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : filteredData.length > 0 ? (
            <ScrollView>

              {filteredData.map(item => (
                <TransactionRow key={item.id} item={item} formatDate={formatDate} />
              ))}

            </ScrollView>
          ) : (
            <View style={styles.emptyBox}>
              <Image
                source={require('../../assets/images/empty-wallet.png')}
                style={styles.emptyImg}
              />
              <Text style={styles.emptyTitle}>No transaction, yet!</Text>
              <Text style={styles.emptySub}>
                Make a booking & start earning wallet money
              </Text>
            </View>
          )}

        </View>

      </View>
    </>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Tab({ label, value, active, setActive }: any) {
  const selected = active === value;

  return (
    <TouchableOpacity
      style={[styles.tabBtn, selected && styles.tabActive]}
      onPress={() => setActive(value)}
    >
      <Text style={[styles.tabText, selected && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TransactionRow({ item, formatDate }: any) {
  return (
    <View style={styles.txnRow}>

      <View style={styles.txnLeft}>
        <Ionicons
          name={item.type === 'CREDIT' ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={22}
          color={item.type === 'CREDIT' ? '#16A34A' : '#DC2626'}
        />

        <View style={{ marginLeft: 10 }}>
          <Text style={styles.txnType}>
            {item.description || (item.type === 'CREDIT' ? 'Money Added' : 'Money Deducted')}
          </Text>
          <Text style={styles.txnDate}>{formatDate(item.createdAt || item.date)}</Text>
        </View>
      </View>

      <Text
        style={[
          styles.txnAmount,
          { color: item.type === 'CREDIT' ? '#16A34A' : '#DC2626' },
        ]}
      >
        {item.type === 'CREDIT' ? '+' : '-'} ₹{item.amount}
      </Text>

    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B1B1B' },

  /* HEADER */

  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  backBtn: {
    marginBottom: 16,
  },

  walletTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },

  expiry: {
    marginTop: 4,
    color: '#9CA3AF',
  },

  balanceRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  amount: {
    fontSize: 26,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },

  amountLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  coinImg: {
    position: 'absolute',
    right: 20,
    top: 80,
    width: 70,
    height: 70,
  },

  /* BODY */

  body: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },

  /* TABS */

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 10,
  },

  tabActive: {
    borderColor: '#000',
  },

  tabText: {
    color: '#555',
  },

  tabTextActive: {
    color: '#000',
    fontFamily: 'Inter-SemiBold',
  },

  /* TRANSACTION */

  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F1F1',
  },

  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  txnType: {
    fontFamily: 'Inter-SemiBold',
  },

  txnDate: {
    fontSize: 12,
    color: '#777',
  },

  txnAmount: {
    fontFamily: 'Inter-SemiBold',
  },

  /* EMPTY STATE */

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },

  emptyImg: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },

  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
