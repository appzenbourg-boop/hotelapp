import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';

import { useLocation } from '../../context/LocationContext';
import { useTranslation } from '../../hooks/useTranslation';

const { width, height } = Dimensions.get('window');

const POPULAR_CITIES = ['Goa', 'Mumbai', 'Delhi', 'Bangalore', 'Noida', 'Lonavala', 'Pune', 'Udaipur'];

export default function LocationSelector() {
  useEffect(() => {
    console.log("LocationSelector mounted");
  }, []);

  const insets = useSafeAreaInsets();
  const { location, refreshLocation, setSelectedCity, setDetailedLocation } = useLocation();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: location.coords?.latitude || 28.6139,
    longitude: location.coords?.longitude || 77.2090,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [markerCoords, setMarkerCoords] = useState({
    latitude: location.coords?.latitude || 28.6139,
    longitude: location.coords?.longitude || 77.2090,
  });
  const [reverseAddress, setReverseAddress] = useState(location.address || 'Select place on map');
  const t = useTranslation();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please enable it in settings.');
      }
    })();
  }, []);

  // Search logic using Geoapify Cloud
  useEffect(() => {
    if (search.length > 2) {
      const delay = setTimeout(async () => {
        setSearching(true);
        try {
          const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(search)}&apiKey=e6f13848c19246eab1bef2662e18ebd0`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data?.features) {
            const res = data.features.slice(0, 5).map((f: any) => ({
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              city: f.properties.city || f.properties.state || 'Unknown',
              full: f.properties.formatted || 'Unknown Location'
            }));
            setResults(res);
          }
        } catch (e) {
            console.error('Geocoding search failed:', e);
        } finally {
            setSearching(false);
        }
      }, 800);
      return () => clearTimeout(delay);
    } else {
        setResults([]);
    }
  }, [search]);

  const handleSelectResult = (item: any) => {
    const newRegion = { ...mapRegion, latitude: item.latitude, longitude: item.longitude };
    setMarkerCoords({ latitude: item.latitude, longitude: item.longitude });
    setMapRegion(newRegion);
    setReverseAddress(item.full);
    setSearch('');
    setResults([]);
    Keyboard.dismiss();
    
    // Animate viewport directly to target
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const handleMarkerDrag = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setMarkerCoords(coords);
    try {
        const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=e6f13848c19246eab1bef2662e18ebd0`;
        const response = await fetch(url);
        const data = await response.json();
        if (data?.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const cityName = props.city || props.state || 'Unknown';
            setReverseAddress(props.formatted || `${cityName}`);
        }
    } catch(err) {
        console.warn('Reverse geocoding failed:', err);
    }
  };

  const confirmLocation = () => {
      // Logic to finalize
      const city = reverseAddress.split(',').pop()?.trim() || 'Delhi';
      setDetailedLocation(markerCoords.latitude, markerCoords.longitude, reverseAddress, city);
      router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'fade_from_bottom'
      }} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Exact Location</Text>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search area, building, street..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {searching && <ActivityIndicator size="small" color="#C26A2C" />}
      </View>

      {/* SEARCH RESULTS DROPDOWN */}
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
            {results.map((res, i) => (
                <TouchableOpacity key={i} style={styles.resRow} onPress={() => handleSelectResult(res)}>
                    <Ionicons name="location-sharp" size={18} color="#666" />
                    <Text style={styles.resText}>{res.full}</Text>
                </TouchableOpacity>
            ))}
        </View>
      )}

      {/* MAIN CONTENT AREA (MAP + INFO) */}
      <View style={{ flex: 1, backgroundColor: '#F0F0F0', overflow: 'hidden' }}>
          {/* CRASH GUARD: Show a message if API Key is placeholder */}
          {/* Geoapify Map Integration */}

          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            mapType="none"
          >
            <UrlTile
              urlTemplate="https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=e6f13848c19246eab1bef2662e18ebd0"
              maximumZ={19}
              flipY={false}
              zIndex={1}
            />
            <Marker 
                coordinate={markerCoords} 
                draggable 
                onDragEnd={handleMarkerDrag}
                pinColor="#C26A2C"
            />
          </MapView>

          {/* FLOATING ACTION BAR */}
          <View style={styles.floatingCard}>
              <View style={styles.locInfo}>
                  <Ionicons name="navigate-circle" size={32} color="#C26A2C" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.locMainTitle} numberOfLines={1}>Selected Location</Text>
                      <Text style={styles.locFullAddress} numberOfLines={2}>{reverseAddress}</Text>
                  </View>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={confirmLocation}>
                  <Text style={styles.confirmText}>CONFIRM LOCATION</Text>
              </TouchableOpacity>
          </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', marginHorizontal: 20, marginBottom: 10, height: 50, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE', zIndex: 100 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter-Regular', color: '#000' },

  resultsContainer: { position: 'absolute', top: 120, left: 20, right: 20, backgroundColor: '#FFF', borderRadius: 12, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, zIndex: 200, paddingVertical: 10 },
  resRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  resText: { marginLeft: 12, fontSize: 14, color: '#333' },

  map: { flex: 1 },

  floatingCard: { 
      position: 'absolute', 
      bottom: 30, 
      left: 20, 
      right: 20, 
      backgroundColor: '#FFF', 
      borderRadius: 20, 
      padding: 20, 
      elevation: 20, 
      shadowColor: '#000', 
      shadowOpacity: 0.3, 
      shadowRadius: 15 
  },
  locInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locMainTitle: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#666' },
  locFullAddress: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#1A1A1A', marginTop: 2 },
  
  confirmBtn: { backgroundColor: '#1A1A1A', height: 56, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  confirmText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter-Bold', letterSpacing: 1 }
});
