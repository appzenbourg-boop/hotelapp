import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notifData, mutate, isLoading } = useSWR(
    token ? ['all_in_app_notifications', token] : null,
    () => notificationsAPI.getUnread(token!) // can use getAll if created, using getUnread since it contains list
  );

  const notifications = notifData?.notifications || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  };

  const handleMarkRead = async (id?: string) => {
    try {
      await notificationsAPI.markAsRead(token!, id, !id);
      await mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Find appropriate icon based on title keyword
    let iconName: keyof typeof Ionicons.glyphMap = 'notifications';
    let color = '#C26A2C';
    const title = (item.title || '').toLowerCase();
    if (title.includes('approval') || title.includes('confirm')) { iconName = 'checkmark-circle'; color = '#2E7D32'; }
    else if (title.includes('upgrade')) { iconName = 'trending-up'; color = '#6200EA'; }
    else if (title.includes('extend')) { iconName = 'time'; color = '#FF6F00'; }
    else if (title.includes('alert')) { iconName = 'warning'; color = '#D32F2F'; }

    const handlePress = () => {
        if (title.includes('approval') || title.includes('extend') || title.includes('upgrade') || title.includes('pay')) {
            router.push('/(main)/bookings');
        }
    };

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={handlePress}
      >
        <View style={styles.iconBox}>
          <LinearGradient
            colors={[color, `${color}CC`]}
            style={styles.iconGradient}
          >
             <Ionicons name={iconName} size={20} color="#FFF" />
          </LinearGradient>
        </View>
        
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.title} numberOfLines={1}>{item.title || 'Update'}</Text>
            <View style={styles.unreadDot} />
          </View>
          <Text style={styles.description}>{item.description}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            {(title.includes('approval') || title.includes('extend') || title.includes('upgrade')) && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: color, fontFamily: 'Inter-Bold', marginRight: 4 }}>Action Required</Text>
                    <Ionicons name="chevron-forward" size={12} color={color} />
                </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Updates</Text>
        
        {notifications.length > 0 ? (
            <TouchableOpacity onPress={() => handleMarkRead()} style={styles.actionBtn}>
               <Text style={styles.actionText}>Clear All</Text>
            </TouchableOpacity>
        ) : <View style={{ width: 50 }} />}
      </View>

      {isLoading && !refreshing ? (
          <View style={styles.center}>
              <ActivityIndicator size="large" color="#C26A2C" />
          </View>
      ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
              <View style={styles.bellCircle}>
                  <Ionicons name="notifications-off-outline" size={60} color="#BBB" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySub}>When there are updates regarding your bookings or stay, you will see them here.</Text>
          </View>
      ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C26A2C" />}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    marginRight: 16,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  bellCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
