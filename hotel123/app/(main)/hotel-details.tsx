import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { Skeleton } from '../../components/Skeleton';
import { roomsAPI, hotelAPI, amenitiesAPI, favoritesAPI, bookingsAPI, API_CONFIG } from '../../services/api';
import { Image as ExpoImage } from 'expo-image';
import DateRangePicker from '../../components/DateRangePicker';
import { useNavigationContext } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HotelDetails() {
  const insets = useSafeAreaInsets();
  const { propertyId } = useLocalSearchParams();
  const { lastMainTab } = useNavigationContext();
  const { user, token } = useAuth();
  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const { data: details, isLoading: loading, mutate } = useSWR(
    propertyId ? ['hotel_details', propertyId] : null,
    async () => {
      const [propertyRes, roomsRes] = await Promise.all([
        hotelAPI.getById(propertyId as string),
        roomsAPI.getAll({ propertyId: propertyId as string }),
      ]);
      
      const prop = propertyRes?.property || propertyRes?.data || propertyRes;
      console.log('🏨 Hotel Description from DB:', prop?.description ? (prop.description.substring(0, 30) + '...') : 'NULL/MISSING');
      
      return {
        property: prop,
        rooms: roomsRes?.rooms || roomsRes?.data || (Array.isArray(roomsRes) ? roomsRes : [])
      };
    },
    { revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 5000 }
  );

  const property = details?.property;
  const rooms = details?.rooms || [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(lastMainTab as any);
    }
  };




  const handleRoomPress = (room: any) => {
    router.push({
        pathname: '/(main)/room-details',
        params: { roomId: room.id }
    });
  };

  const onDatesConfirmed = (checkIn: Date, checkOut: Date) => {
    if (selectedRoom) {
      router.push({
        pathname: '/(main)/booking-checkout',
        params: { 
            roomId: selectedRoom.id, 
            checkIn: checkIn.toISOString(), 
            checkOut: checkOut.toISOString() 
        }
      });
    }
  };

  if (!property && !loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={60} color="#CCC" />
          <Text style={{ marginTop: 20, fontSize: 18, color: '#666', textAlign: 'center' }}>This hotel's information is temporarily unavailable.</Text>
          <TouchableOpacity onPress={handleBack} style={{ marginTop: 30, backgroundColor: '#000', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Return to Search</Text>
          </TouchableOpacity>
      </View>
    );
  }

  // Compile all gallery images (Cover Photo + Gallery images)
  const galleryImages = React.useMemo(() => {
    const list: any[] = [];
    if (property?.coverImage && typeof property.coverImage === 'string' && property.coverImage.startsWith('http')) {
      list.push({ uri: property.coverImage });
    }
    if (Array.isArray(property?.images)) {
      property.images.forEach((img: string) => {
         if (img && img.startsWith('http') && img !== property.coverImage) {
            list.push({ uri: img });
         }
      });
    }
    if (list.length === 0) {
       list.push(require('../../assets/images/image6.png'));
    }
    return list;
  }, [property?.coverImage, property?.images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll timer
  useEffect(() => {
    if (galleryImages.length <= 1 || loading || !property) return;

    const interval = setInterval(() => {
      setActiveImageIndex(prev => {
        const next = (prev + 1) % galleryImages.length;
        flatListRef.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 3500); // Switch image every 3.5 seconds

    return () => clearInterval(interval);
  }, [galleryImages, loading, property]);

  // Track manual scrolls
  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    if (currentIndex !== activeImageIndex && currentIndex >= 0 && currentIndex < galleryImages.length) {
      setActiveImageIndex(currentIndex);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back Button - Fixed Position */}
      <TouchableOpacity 
        onPress={handleBack} 
        style={[styles.backBtn, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Favorite Button - Top Right */}
      <TouchableOpacity
        style={[styles.favBtn, { top: insets.top + 10 }]}
        onPress={async () => {
          if (!propertyId) return;
          try {
            if (rooms.length > 0) {
              // Note: Favorites actually link to room IDs in this database
              await favoritesAPI.add(token || '', rooms[0].id); 
              Alert.alert('Success', 'Hotel added to your favorites!');
            } else {
              Alert.alert('Notice', 'This hotel is currently fully booked.');
            }
          } catch (e) {
             Alert.alert('Notice', 'Already in your favorites collection.');
          }
        }}
      >
        <Ionicons name="heart" size={24} color="#FF4b4b" />
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header Image Carousel - Scrolls with content */}
        {loading && !property ? (
           <Skeleton height={300} />
        ) : (
          <View style={{ height: 300, position: 'relative' }}>
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
                  style={{ width, height: 300 }}
                  resizeMode="cover"
                >
                  <View style={styles.overlay} />
                </ImageBackground>
              )}
            />

            {/* Pagination Dots Overlay */}
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

        {/* Content */}
        <View style={styles.content}>
            <View style={styles.titleRow}>
                {loading && !property ? <Skeleton width="70%" height={28} /> : <Text style={styles.hotelName}>{property?.name}</Text>}
                <View style={styles.rating}>
                    <Ionicons name="star" size={16} color="#FFA000" />
                    <Text style={styles.ratingText}>4.9</Text>
                </View>
            </View>
            {loading && !property ? <Skeleton width="50%" height={16} style={{ marginTop: 10 }} /> : <Text style={styles.address}>{property?.address}</Text>}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>About this hotel</Text>
            {loading && !property ? (
               <View style={{ gap: 8 }}>
                  <Skeleton width="100%" height={16} />
                  <Skeleton width="100%" height={16} />
                  <Skeleton width="60%" height={16} />
               </View>
            ) : (
               <Text style={styles.description}>
                 {property?.description && property.description.length > 5 
                   ? property.description 
                   : `Discover ultimate hospitality at ${property?.name || 'our property'}. Featuring unparalleled customer support, premium accommodation, and proximity to key locations, ensuring an unforgettable memory of your stay.`}
               </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Rooms ({rooms?.length || 0})</Text>
            {loading && rooms.length === 0 ? (
               <View style={{ gap: 16 }}>
                  {[1, 2].map(i => (
                    <View key={i} style={styles.roomCard}>
                       <Skeleton width={110} height={110} borderRadius={12} />
                       <View style={{ flex: 1, marginLeft: 12, gap: 10 }}>
                          <Skeleton width="60%" height={18} />
                          <Skeleton width="40%" height={14} />
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                             <Skeleton width="30%" height={20} />
                             <Skeleton width={60} height={30} borderRadius={10} />
                          </View>
                       </View>
                    </View>
                  ))}
               </View>
            ) : (!rooms || rooms.length === 0) ? (
                <Text style={styles.noRooms}>No rooms available at the moment.</Text>
            ) : (
                rooms.map((room) => (
                    <TouchableOpacity 
                        key={room?.id || Math.random().toString()} 
                        style={styles.roomCard}
                        onPress={() => handleRoomPress(room)}
                        activeOpacity={0.7}
                    >
                        <ExpoImage 
                            source={room.images?.[0] ? { uri: room.images[0] } : require('../../assets/images/image7.png')} 
                            style={styles.roomImg}
                            contentFit="cover"
                        />
                        <View style={styles.roomInfo}>
                            <View>
                                <Text style={styles.roomType}>{room.type}</Text>
                                <Text style={styles.roomMeta}>{room.category}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <View>
                                    <Text style={styles.price}>₹{String(room.basePrice ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
                                    <Text style={styles.perNight}>/ night</Text>
                                </View>
                                <View style={styles.bookBadge}>
                                    <Text style={styles.bookText}>Book</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { width: '100%', height: 300 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  favBtn: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  content: { 
    padding: 20, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -30, 
    backgroundColor: '#FFF',
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8 
  },
  hotelName: { 
    fontSize: 22, 
    fontFamily: 'Inter-Bold', 
    color: '#1A1A1A', 
    flex: 1, 
    marginRight: 12,
    lineHeight: 28,
  },
  rating: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF9E5', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  ratingText: { 
    marginLeft: 4, 
    fontSize: 14, 
    fontFamily: 'Inter-Bold', 
    color: '#FFA000' 
  },
  address: { 
    fontSize: 13, 
    color: '#666', 
    marginBottom: 20, 
    lineHeight: 18 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F0F0F0', 
    marginVertical: 20 
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
    marginBottom: 20 
  },
  noRooms: { 
    color: '#999', 
    fontStyle: 'italic', 
    marginTop: 10, 
    textAlign: 'center' 
  },
  roomCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    marginBottom: 16, 
    padding: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    borderWidth: 1, 
    borderColor: '#F5F5F5' 
  },
  roomImg: { 
    width: 110, 
    height: 110, 
    borderRadius: 12 
  },
  roomInfo: { 
    flex: 1, 
    marginLeft: 12, 
    justifyContent: 'space-between', 
    paddingVertical: 4 
  },
  roomType: { 
    fontSize: 16, 
    fontFamily: 'Inter-Bold', 
    color: '#1A1A1A', 
    marginBottom: 4 
  },
  roomMeta: { 
    fontSize: 12, 
    color: '#999', 
    marginBottom: 8 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  price: { 
    fontSize: 16, 
    fontFamily: 'Inter-Bold', 
    color: '#000' 
  },
  perNight: { 
    fontSize: 11, 
    color: '#999', 
    fontFamily: 'Inter-Regular' 
  },
  bookBadge: { 
    backgroundColor: '#000', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 10 
  },
  bookText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontFamily: 'Inter-Bold' 
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 45, // Higher to sit above the white content overlay curve
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
    width: 12, // Slightly wider to show focus
  }
});
