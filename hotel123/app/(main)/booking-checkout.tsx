import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { roomsAPI, walletAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
// import { BlurView } from 'expo-blur'; // Disabled for Expo Go compatibility

import { useNavigationContext } from '../../context/NavigationContext';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = require('../../assets/images/image7.png');

export default function BookingCheckout() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { roomId, checkIn, checkOut } = params;
  
  const { lastMainTab } = useNavigationContext();
  const { token } = useAuth();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFareDetails, setShowFareDetails] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const dateInfo = useMemo(() => {
    const start = checkIn ? new Date(checkIn as string) : new Date();
    const end = checkOut ? new Date(checkOut as string) : new Date();
    if (!checkOut) end.setDate(end.getDate() + 3);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    return { start, end, nights };
  }, [checkIn, checkOut]);

  React.useEffect(() => {
    if (params.roomId) fetchRoomDetails();
    if (token) fetchWalletBalance();
  }, [params.roomId, token]);

  const fetchWalletBalance = async () => {
    try {
      const res = await walletAPI.getBalance(token!);
      if (res.success) {
        setWalletBalance(res.balance || 0);
      }
    } catch (e) {
      console.error('Failed to fetch wallet balance:', e);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const res = await roomsAPI.getById(params.roomId as string);
      const finalRoom = res?.room ? res.room : res;
      if (finalRoom && (finalRoom.id || finalRoom._id)) setRoom(finalRoom);
    } catch (e) {
      console.error('Failed to fetch room details:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#000" />
    </View>
  );

  if (!room) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontFamily: 'Inter-Medium' }}>Room not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#007AFF' }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const settings = room.property?.settings || {
    gstPercent: 18.0,
    serviceChargePercent: 0.0,
    luxuryTaxPercent: 0.0,
    defaultDiscountPercent: 0.0
  };

  const baseTotal = (room.basePrice || 0) * dateInfo.nights;

  const gstPct = settings.gstPercent ?? 18;
  const svcChargePct = settings.serviceChargePercent ?? 0;
  const luxTaxPct = settings.luxuryTaxPercent ?? 0;
  const discPct = settings.defaultDiscountPercent ?? 0;

  const gstAmount = Math.round(baseTotal * (gstPct / 100));
  const serviceFee = Math.round(baseTotal * (svcChargePct / 100));
  const luxuryTaxAmount = Math.round(baseTotal * (luxTaxPct / 100));
  
  const subTotal = baseTotal + gstAmount + serviceFee + luxuryTaxAmount;
  const discountAmount = Math.round(baseTotal * (discPct / 100));
  
  const totalAmount = Math.max(0, subTotal - discountAmount);

  const carouselImages = room.images && room.images.length > 0 
    ? room.images 
    : [FALLBACK_IMAGE, FALLBACK_IMAGE];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* STICKY HEADER */}
      <View style={styles.stickyHeader}>
          <View style={StyleSheet.absoluteFill}>
              <ImageCarousel images={carouselImages} />
          </View>
          <TouchableOpacity
            style={[styles.backIconBtn, { top: 12 + insets.top }]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(lastMainTab as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 360, paddingBottom: 150 }}
      >
        <View style={styles.content}>
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.hotelName}>{room.property?.name || 'Zenbourg Grand Hotel'}</Text>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#FFC107" />
                        <Text style={styles.ratingText}>4.9 (124 reviews)</Text>
                    </View>
                </View>
                <View style={styles.roomNumBadge}>
                    <Text style={styles.roomNumText}>#{room.roomNumber}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionRow}>
                <View>
                    <Text style={styles.sectionHeading}>{room.type}</Text>
                    <Text style={styles.subLabel}>Max occupancy {room.maxOccupancy} guests</Text>
                </View>
            </View>

            <View style={styles.amenityGrid}>
                {room.amenities?.map((am: string, i: number) => (
                    <View key={i} style={styles.amenityItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.amenityLabel}>{am}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Check-in Details</Text>
            <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                    <View style={styles.infoIconBox}><Ionicons name="enter" size={20} color="#000" /></View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.infoItemLabel}>Check-In</Text>
                        <Text style={styles.infoItemValue}>{dateInfo.start.toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <View style={styles.infoIconBox}><Ionicons name="exit" size={20} color="#000" /></View>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.infoItemLabel}>Check-Out</Text>
                        <Text style={styles.infoItemValue}>{dateInfo.end.toLocaleDateString()}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.divider} />

            {/* WALLET SECTION */}
            <View style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <View style={styles.walletIconBox}>
                  <Ionicons name="wallet" size={24} color="#C26A2C" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.walletTitle}>Digital Wallet</Text>
                  <Text style={styles.walletBalance}>Balance: ₹{walletBalance.toFixed(2)}</Text>
                </View>
                {walletBalance > 0 && (
                  <TouchableOpacity 
                    style={[styles.useWalletBtn, useWallet && styles.useWalletBtnActive]}
                    onPress={() => setUseWallet(!useWallet)}
                  >
                    <Text style={[styles.useWalletText, useWallet && styles.useWalletTextActive]}>
                      {useWallet ? 'Applied' : 'Use'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {useWallet && walletBalance > 0 && (
                <View style={styles.walletDiscountRow}>
                  <Text style={styles.walletDiscountText}>Wallet discount applied</Text>
                  <Text style={styles.walletDiscountAmount}>-₹{Math.min(walletBalance, totalAmount).toFixed(2)}</Text>
                </View>
              )}
            </View>
        </View>
      </ScrollView>

      {/* FLOATING ACTION BAR */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(24, insets.bottom + 10), backgroundColor: 'rgba(255,255,255,0.95)' }]}>
        <View style={styles.amountContainer}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => setShowFareDetails(true)}
            style={styles.fareTrigger}
          >
            <Text style={styles.totalValueLabel}>Total Amount</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>₹{String(totalAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
              <Ionicons name="chevron-up" size={16} color="#000" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => {
            const bData = {
              roomId: room.id,
              checkIn: dateInfo.start.toISOString(),
              checkOut: dateInfo.end.toISOString(),
              numberOfGuests: room.maxOccupancy || 1,
              specialRequests: "",
              totalAmount: totalAmount,
              useWallet: useWallet
            };
            
            const finalPayable = useWallet ? Math.max(0, totalAmount - walletBalance) : totalAmount;

            router.push({
              pathname: '/(services)/extend-payment',
              params: {
                amount: finalPayable.toString(),
                bookingData: JSON.stringify(bData)
              }
            });
          }}
        >
          <Text style={styles.payText}>Proceed to Pay</Text>
          <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>

      {/* FARE BREAKDOWN MODAL */}
      <Modal visible={showFareDetails} transparent animationType="slide" onRequestClose={() => setShowFareDetails(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFareDetails(false)}>
            <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Fare Breakdown</Text>
                
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>₹{String(room.basePrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} x {dateInfo.nights} night(s)</Text>
                  <Text style={styles.fareAmount}>₹{String(baseTotal).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                </View>
                
                {gstAmount > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>GST ({gstPct}%)</Text>
                    <Text style={styles.fareAmount}>₹{String(gstAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                  </View>
                )}
                
                {luxuryTaxAmount > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Luxury Tax ({luxTaxPct}%)</Text>
                    <Text style={styles.fareAmount}>₹{String(luxuryTaxAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                  </View>
                )}

                {serviceFee > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Service & Handling ({svcChargePct}%)</Text>
                    <Text style={styles.fareAmount}>₹{String(serviceFee).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                  </View>
                )}

                {discountAmount > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={[styles.fareLabel, { color: '#2E7D32' }]}>{settings.discountLabel || 'Discount'} ({discPct}%)</Text>
                    <Text style={[styles.fareAmount, { color: '#2E7D32' }]}>-₹{String(discountAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                  </View>
                )}

                <View style={[styles.divider, { marginVertical: 20 }]} />
                
                <View style={styles.fareRow}>
                  <Text style={styles.totalLabelFinal}>Total Payable</Text>
                  <Text style={styles.totalAmountFinal}>₹{String(totalAmount).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                </View>
                
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowFareDetails(false)}>
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ImageCarousel({ images }: { images: any[] }) {
  const [index, setIndex] = useState(0);
  const onScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {images.map((img, i) => (
          <ExpoImage 
            key={i} 
            source={typeof img === 'string' ? { uri: img } : img} 
            style={{ width, height: '100%' }} 
            contentFit="cover"
            transition={300}
          />
        ))}
      </ScrollView>
      <View style={styles.dotsContainer}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, index === i && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  stickyHeader: { position: 'absolute', top: 0, width: '100%', height: 360, overflow: 'hidden', backgroundColor: '#000', zIndex: 10 },
  backIconBtn: { position: 'absolute', left: 20, backgroundColor: '#FFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 11, elevation: 4 },
  dotsContainer: { position: 'absolute', bottom: 20, flexDirection: 'row', alignSelf: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#FFF', width: 20 },
  content: { padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hotelName: { fontSize: 24, color: '#1A1A1A', fontFamily: 'Inter-Bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { marginLeft: 6, fontSize: 13, color: '#666' },
  roomNumBadge: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  roomNumText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1.5, backgroundColor: '#F0F0F0', marginVertical: 24 },
  sectionRow: { marginBottom: 16 },
  sectionHeading: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#1A1A1A' },
  subLabel: { color: '#888', fontSize: 13, marginTop: 4 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  amenityLabel: { marginLeft: 6, fontSize: 13, color: '#333' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter-Bold', marginBottom: 16 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EEE' },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { backgroundColor: '#F8F8F8', width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoItemLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase' },
  infoItemValue: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#000' },
  infoDivider: { height: 1, backgroundColor: '#F6F6F6', marginVertical: 12 },
  bottomActionBar: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderColor: '#F0F0F0', backgroundColor: 'rgba(255,255,255,0.95)' },
  amountContainer: { flex: 1 },
  fareTrigger: { alignSelf: 'flex-start' },
  totalValueLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  priceValue: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#000', marginRight: 4 },
  payBtn: { backgroundColor: '#000', paddingHorizontal: 28, paddingVertical: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  payText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#EEE', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter-Bold', marginBottom: 20, textAlign: 'center' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  fareLabel: { color: '#666', fontSize: 15 },
  fareAmount: { fontWeight: '600', fontSize: 15 },
  totalLabelFinal: { fontSize: 18, fontFamily: 'Inter-Bold' },
  totalAmountFinal: { fontSize: 18, fontFamily: 'Inter-Bold' },
  closeModalBtn: { backgroundColor: '#000', marginTop: 20, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  closeModalText: { color: '#FFF', fontWeight: 'bold' },
  
  walletCard: {
    backgroundColor: '#FFF8F4',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  walletTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
  },
  walletBalance: {
    fontSize: 13,
    color: '#C26A2C',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  useWalletBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C26A2C',
  },
  useWalletBtnActive: {
    backgroundColor: '#C26A2C',
  },
  useWalletText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: '#C26A2C',
  },
  useWalletTextActive: {
    color: '#FFF',
  },
  walletDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(194, 106, 44, 0.1)',
  },
  walletDiscountText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter-Medium',
  },
  walletDiscountAmount: {
    fontSize: 14,
    color: '#2E7D32',
    fontFamily: 'Inter-Bold',
  },
});
