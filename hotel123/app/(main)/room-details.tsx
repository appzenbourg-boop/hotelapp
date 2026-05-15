import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { roomsAPI, amenitiesAPI, API_CONFIG } from '../../services/api';
import DateRangePicker from '../../components/DateRangePicker';

const { width } = Dimensions.get('window');

// Common mapping for static amenities fallback icons if dynamic icon can't be found
const STATIC_ICONS: Record<string, any> = {
  // Essential Tech & Comfort
  'wifi': 'wifi',
  'ac': 'air-conditioner',
  'air conditioning': 'air-conditioner',
  'fan': 'fan',
  'heater': 'heater',
  'heating': 'radiator',
  'fireplace': 'fireplace',
  'tv': 'television',
  'smart tv': 'television-classic',
  'netflix': 'television-play',
  'channel': 'television-guide',
  'safe': 'safe-square-outline',
  'vault': 'safe',
  'phone': 'phone-classic',
  'telephone': 'phone',
  'charger': 'battery-charging',
  'usb': 'usb-port',
  'plug': 'power-plug',

  // Workspace & Furniture
  'workspace': 'desk',
  'desk': 'desk',
  'table': 'table-furniture',
  'chair': 'chair-rolling',
  'sofa': 'sofa-single',
  'couch': 'sofa',
  'bed': 'bed-empty',
  'king': 'bed-king',
  'queen': 'bed-queen',
  'single': 'bed-single',
  'closet': 'wardrobe',
  'wardrobe': 'wardrobe-outline',
  'hanger': 'hanger',

  // Food & Drink
  'breakfast': 'coffee',
  'coffee': 'coffee-maker',
  'tea': 'tea',
  'kettle': 'kettle',
  'mini bar': 'fridge-outline',
  'fridge': 'fridge-bottom',
  'refrigerator': 'fridge',
  'microwave': 'microwave',
  'oven': 'toaster-oven',
  'stove': 'stove',
  'kitchenette': 'countertop-outline',
  'kitchen': 'chef-hat',
  'bar': 'glass-cocktail',
  'wine': 'glass-wine',
  'beer': 'glass-mug',
  'restaurant': 'silverware-fork-knife',
  'dining': 'silverware-clean',
  'room service': 'room-service',

  // Bath & Hygiene
  'bathtub': 'bathtub-outline',
  'bath': 'bathtub',
  'shower': 'shower',
  'jacuzzi': 'hot-tub',
  'hot tub': 'hot-tub',
  'toilet': 'toilet',
  'bidet': 'shower-head',
  'towel': 'towel',
  'hair dryer': 'hair-dryer',
  'slippers': 'shoe-sneaker',
  'robe': 'hanger',
  'laundry': 'washing-machine',
  'washer': 'washing-machine',
  'iron': 'iron-board',
  'dryer': 'tumble-dryer',

  // Views & Outdoor
  'balcony': 'balcony',
  'terrace': 'storefront-outline',
  'patio': 'deck',
  'garden': 'flower',
  'sea view': 'waves',
  'ocean': 'waves',
  'beach': 'beach',
  'pool': 'pool',
  'swimming': 'swim',
  'mountain': 'mountain',
  'city': 'city',
  'view': 'eye-outline',
  'window': 'window-maximize',

  // Services & Misc
  'parking': 'car',
  'garage': 'garage',
  'gym': 'dumbbell',
  'fitness': 'weight-lifter',
  'spa': 'spa',
  'massage': 'hands-pray',
  'sauna': 'hot-tub',
  'smoke': 'smoking-off',
  'smoking': 'smoking',
  'pet': 'paw',
  'dog': 'dog-side',
  'cat': 'cat',
  'newspaper': 'newspaper',
  'elevator': 'elevator',
  'lift': 'elevator-passenger',
  'security': 'security',
  'camera': 'cctv',
  'key': 'key-variant',
  'card': 'credit-card-key',
  'baby': 'baby-face-outline',
  'crib': 'cradle-outline',
};

export default function RoomDetails() {
  const insets = useSafeAreaInsets();
  const { roomId } = useLocalSearchParams();
  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  // 1. Fetch Room data
  const { data: room, isLoading: loading, mutate } = useSWR(
    roomId ? ['room_details', roomId] : null,
    async () => {
      const r = await roomsAPI.getById(roomId as string);
      console.log(`🛏️ Loaded Room [${roomId}] Description: "${r?.description || 'NULL'}"`);
      return r;
    },
    { revalidateOnMount: true, dedupingInterval: 5000 }
  );

  // 2. Fetch Property Amenities to match icons
  const { data: allAmenities } = useSWR(
    room?.propertyId ? ['property_amenities', room.propertyId] : null,
    async () => {
      const res = await amenitiesAPI.getAll(room.propertyId);
      return Array.isArray(res) ? res : (res?.amenities || res?.value || []);
    }
  );

  // Generate visual list combining specific room features and overall property amenities
  const combinedAmenitiesList = React.useMemo(() => {
    // 1. Collect room-specific strings
    const roomStrings = Array.isArray(room?.amenities) ? room.amenities : [];
    
    // 2. Collect property objects
    const propObjects = Array.isArray(allAmenities) ? allAmenities : [];

    // Generate lookup map of items from property DB
    const outputList: any[] = [...propObjects];

    // Loop through room strings and add any that aren't represented in output
    roomStrings.forEach((name: string) => {
        const alreadyExists = outputList.some((item) => item.name?.toLowerCase() === name.toLowerCase());
        if (!alreadyExists) {
            outputList.push({ name, icon: 'STUB_ICON' });
        }
    });

    return outputList;
  }, [room?.amenities, allAmenities]);

  // Helper to get safe icon name for FontAwesome / MaterialCommunity
  const getAmenityIcon = (name: string, iconHint?: string) => {
      // 1. Check local STATIC mapping FIRST to force accurate system icons
      const key = name.toLowerCase();
      for (const k in STATIC_ICONS) {
          if (key.includes(k)) return STATIC_ICONS[k];
      }
      
      // 2. Second pass, use API provided hint if available and NOT our internal stub key
      if (iconHint && iconHint.length > 2 && iconHint !== 'STUB_ICON') return iconHint;

      // 3. Hard fallback generic icon
      return 'check-circle-outline'; 
  };

  // Construct gallery
  const galleryImages = React.useMemo(() => {
    const list: any[] = [];
    if (Array.isArray(room?.images)) {
      room.images.forEach((img: any) => {
         if (typeof img === 'string' && img.startsWith('http')) {
            list.push({ uri: img });
         }
      });
    }
    if (list.length === 0) {
       list.push(require('../../assets/images/image6.png'));
    }
    return list;
  }, [room?.images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll timer
  useEffect(() => {
    if (galleryImages.length <= 1 || loading || !room) return;

    const interval = setInterval(() => {
      setActiveImageIndex(prev => {
        const next = (prev + 1) % galleryImages.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500); 

    return () => clearInterval(interval);
  }, [galleryImages, loading, room]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    if (currentIndex !== activeImageIndex && currentIndex >= 0 && currentIndex < galleryImages.length) {
      setActiveImageIndex(currentIndex);
    }
  };

  const handleBookNowPress = async () => {
      if (!room) return;
      
      try {
        const url = `${API_CONFIG.BASE_URL}/rooms/${room.id}/bookings`;
        const response = await fetch(url);
        if (response.ok) {
          const res = await response.json();
          const dates: Date[] = [];
          const bookings = Array.isArray(res) ? res : (res?.bookings || []);
          bookings.forEach((b: any) => {
            if (b.status === 'CANCELLED') return;
            const start = new Date(b.checkIn);
            const end = new Date(b.checkOut);
            const current = new Date(start);
            while (current < end) {
              dates.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
          });
          setBookedDates(dates);
        } else {
          setBookedDates([]);
        }
      } catch (e) {
        setBookedDates([]);
      }
      setDatePickerVisible(true);
  };

  const onDatesConfirmed = (checkIn: Date, checkOut: Date) => {
      setDatePickerVisible(false);
      router.push({
        pathname: '/(main)/booking-checkout',
        params: { 
            roomId: room.id, 
            checkIn: checkIn.toISOString(), 
            checkOut: checkOut.toISOString() 
        }
      });
  };

  if (!room && !loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={60} color="#CCC" />
          <Text style={{ marginTop: 20, fontSize: 18, color: '#666', textAlign: 'center' }}>Room details temporarily unavailable.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 30, backgroundColor: '#000', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableOpacity 
        onPress={() => router.back()} 
        style={[styles.backBtn, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
           <Skeleton height={350} />
        ) : (
          <View style={{ height: 350, position: 'relative' }}>
            <FlatList
              ref={flatListRef}
              data={galleryImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              keyExtractor={(_, index) => `gallery-img-${index}`}
              renderItem={({ item }) => (
                <ImageBackground
                  source={item}
                  style={{ width, height: 350 }}
                  resizeMode="cover"
                >
                  <View style={styles.overlay} />
                </ImageBackground>
              )}
            />

            {galleryImages.length > 1 && (
              <View style={styles.paginationContainer}>
                {galleryImages.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[
                      styles.paginationDot,
                      activeImageIndex === idx ? styles.paginationDotActive : null
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
            <View style={styles.titleRow}>
                {loading ? <Skeleton width="70%" height={28} /> : <Text style={styles.roomTitle}>{room?.type}</Text>}
                <View style={styles.priceTag}>
                    <Text style={styles.priceText}>₹{room?.basePrice ? String(room.basePrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '-'}</Text>
                    <Text style={styles.priceSubText}>/ night</Text>
                </View>
            </View>
            
            {loading ? (
              <Skeleton width="40%" height={16} style={{ marginTop: 10 }} />
            ) : (
              <View style={styles.metaRow}>
                 <View style={styles.metaBadge}>
                     <MaterialCommunityIcons name="account-group-outline" size={16} color="#666" />
                     <Text style={styles.metaText}>Max {room?.maxOccupancy || 2} Adults</Text>
                 </View>
                 {room?.roomNumber && (
                   <View style={[styles.metaBadge, { marginLeft: 10 }]}>
                       <MaterialCommunityIcons name="door-closed" size={16} color="#666" />
                       <Text style={styles.metaText}>Room No: {room?.roomNumber}</Text>
                   </View>
                 )}
              </View>
            )}

            <View style={styles.divider} />

            {/* Description Section */}
            <Text style={styles.sectionTitle}>Room Details</Text>
            {loading ? (
               <View style={{ gap: 8 }}>
                  <Skeleton width="100%" height={16} />
                  <Skeleton width="100%" height={16} />
               </View>
            ) : (
               <Text style={styles.description}>
                   {room?.description || `Spacious and elegantly decorated ${room?.type} offering unparalleled comfort. Features include all essential amenities, elegant furnishings, and an inviting atmosphere designed for total relaxation.`}
               </Text>
            )}

            <View style={styles.divider} />

            {/* Amenities Section */}
            <Text style={styles.sectionTitle}>Key Amenities</Text>
            
            {loading ? (
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} width={100} height={40} borderRadius={10} />)}
               </View>
            ) : combinedAmenitiesList.length > 0 ? (
               <View style={styles.amenitiesGrid}>
                  {combinedAmenitiesList.map((item: any, index: number) => {
                      const iconKey = getAmenityIcon(item.name, item.icon);
                      return (
                        <View key={index} style={styles.amenityItem}>
                            <View style={styles.iconCircle}>
                               <MaterialCommunityIcons 
                                  name={iconKey as any} 
                                  size={22} 
                                  color="#C26A2C" 
                                  onError={() => null} // Prevent crash if string not matching
                               />
                            </View>
                            <Text style={styles.amenityText}>{item.name}</Text>
                        </View>
                      );
                  })}
               </View>
            ) : (
               <Text style={{ color: '#999', fontStyle: 'italic', marginTop: 5 }}>No specific amenities listed for this room type.</Text>
            )}

            <View style={styles.divider} />
            
            {/* Property Location snippet */}
            <View style={styles.propertySnippet}>
                <View>
                    <Text style={{ fontSize: 12, color: '#888', fontWeight: '600' }}>HOTEL LOCATION</Text>
                    <Text style={{ fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 4 }}>{room?.property?.name}</Text>
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{room?.property?.address}</Text>
                </View>
            </View>

        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
          <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#666', fontWeight: '500' }}>Total Estimated</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>₹{room?.basePrice ? String(room.basePrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '-'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookBtn}
            onPress={handleBookNowPress}
            activeOpacity={0.8}
          >
              <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
      </View>

      {/* Shared Date picker modal */}
      <DateRangePicker
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={onDatesConfirmed}
        blockedDates={bookedDates}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.15)' 
  },
  
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  paginationContainer: {
    position: 'absolute',
    bottom: 45,
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFF',
    width: 12,
  },

  content: {
    marginTop: -30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 30,
    minHeight: 500,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
    paddingRight: 10,
  },
  priceTag: {
    alignItems: 'flex-end'
  },
  priceText: {
    fontSize: 22,
    fontFamily: 'Inter-ExtraBold',
    color: '#C26A2C',
  },
  priceSubText: {
    fontSize: 12,
    color: '#999',
    marginTop: -2
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 6,
    fontWeight: '500',
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F0F0F0', 
    marginVertical: 24 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: 'Inter-Bold', 
    color: '#1A1A1A', 
    marginBottom: 12 
  },
  description: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 22, 
  },

  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  amenityItem: {
    width: '33.33%',
    alignItems: 'center',
    padding: 8,
    marginBottom: 10,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFF8F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEEDD'
  },
  amenityText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '600',
    textAlign: 'center',
  },

  propertySnippet: {
      backgroundColor: '#F9F9F9',
      borderRadius: 16,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#C26A2C',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  bookBtn: {
      backgroundColor: '#000',
      paddingHorizontal: 35,
      paddingVertical: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5
  },
  bookBtnText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold'
  }
});
