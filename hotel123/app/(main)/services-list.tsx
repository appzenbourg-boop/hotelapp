import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { servicesAPI, bookingsAPI } from '../../services/api';
import FadeInView from '../../components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ServicesListScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [tab, setTab] = useState<'requests' | 'manual'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [token, tab])
  );

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reqRes, bookRes] = await Promise.all([
        servicesAPI.getMyRequests(token),
        bookingsAPI.getActive(token)
      ]);

      if (reqRes.success) {
        setRequests(reqRes.requests || []);
      }
      if (bookRes.success && bookRes.bookings?.length > 0) {
        setActiveBooking(bookRes.bookings[0]);
      }
    } catch (e) {
      console.error('Fetch services error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const manualServices = [
    { id: 'wakeup', title: 'Wake-up Call', icon: 'alarm-check', color: '#6366F1', route: '/(services)/wakeup' },
    { id: 'housekeeping', title: 'Housekeeping', icon: 'broom', color: '#10B981', route: '/(services)/housekeeping' },
    { id: 'laundry', title: 'Laundry', icon: 'tshirt-crew', color: '#3B82F6', route: '/(services)/laundry' },
    { id: 'spa', title: 'Spa & Wellness', icon: 'flower', color: '#EC4899', route: '/(services)/spa' },
    { id: 'toiletries', title: 'Toiletries', icon: 'soap', color: '#F59E0B', route: '/(services)/toiletries' },
    { id: 'door', title: 'Door Unlock', icon: 'key-wireless', color: '#1A1A1A', route: '/(services)/door' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>Stay Services</Text>
        <Text style={styles.headerSubtitle}>Manage your requests & amenities</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'requests' && styles.activeTab]} 
          onPress={() => setTab('requests')}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.activeTabText]}>Active Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'manual' && styles.activeTab]} 
          onPress={() => setTab('manual')}
        >
          <Text style={[styles.tabText, tab === 'manual' && styles.activeTabText]}>New Service</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {tab === 'requests' ? (
          <View style={styles.requestsList}>
            {loading ? (
              <ActivityIndicator size="large" color="#1A1A1A" style={{ marginTop: 50 }} />
            ) : requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="clipboard-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No active service requests</Text>
              </View>
            ) : (
              requests.map((req, idx) => (
                <FadeInView key={req.id} delay={idx * 100}>
                  <View style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestType}>{req.type.replace('_', ' ')}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) }]}>
                        <Text style={styles.statusText}>{req.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.requestTitle}>{req.title}</Text>
                    {req.scheduledAt && (
                        <View style={styles.scheduledRow}>
                            <Ionicons name="time-outline" size={14} color="#6366F1" />
                            <Text style={styles.scheduledText}>Scheduled: {new Date(req.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                    )}
                    <Text style={styles.requestTime}>{new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </FadeInView>
              ))
            )}
          </View>
        ) : (
          <View style={styles.manualGrid}>
             {manualServices.map((service, idx) => (
               <FadeInView key={service.id} delay={idx * 50} style={styles.gridItemWrapper}>
                 <TouchableOpacity 
                   style={styles.gridItem}
                   onPress={() => router.push(service.route as any)}
                 >
                    <View style={[styles.iconBox, { backgroundColor: service.color + '15' }]}>
                        <MaterialCommunityIcons name={service.icon as any} size={32} color={service.color} />
                    </View>
                    <Text style={styles.itemTitle}>{service.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#CCC" />
                 </TouchableOpacity>
               </FadeInView>
             ))}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="services" />
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return '#F59E0B';
    case 'ACCEPTED': return '#3B82F6';
    case 'IN_PROGRESS': return '#8B5CF6';
    case 'COMPLETED': return '#10B981';
    case 'CANCELLED': return '#EF4444';
    default: return '#94A3B8';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingBottom: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 32, fontFamily: 'Poppins-Bold', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#64748B', marginTop: 4 },
  
  tabContainer: { 
    flexDirection: 'row', 
    marginHorizontal: 24, 
    marginTop: 20, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 16, 
    padding: 4 
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#FFF', elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#64748B' },
  activeTabText: { color: '#1A1A1A' },
  
  scroll: { flex: 1, marginTop: 10 },
  requestsList: { padding: 24 },
  requestCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  requestType: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#FFF' },
  requestTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#1A1A1A', marginBottom: 4 },
  requestTime: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#94A3B8' },
  scheduledRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  scheduledText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#6366F1' },

  manualGrid: { padding: 24 },
  gridItemWrapper: { width: '100%', marginBottom: 12 },
  gridItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { flex: 1, marginLeft: 16, fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#1A1A1A' },
  
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontFamily: 'Inter-Medium', color: '#94A3B8' },
});
