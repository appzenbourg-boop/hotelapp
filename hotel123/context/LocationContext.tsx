import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  address: string | null;
  city: string | null;
  loading: boolean;
  error: string | null;
}

interface LocationContextType {
  location: LocationState;
  refreshLocation: () => Promise<void>;
  setSelectedCity: (city: string) => void;
  setDetailedLocation: (lat: number, lon: number, address: string, city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>({
    coords: null,
    address: null,
    city: null,
    loading: true,
    error: null,
  });

  const getAddress = async (lat: number, lon: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const item = result[0];
        const cityName = item.city || item.region || item.subregion || 'Unknown City';
        const formattedAddress = `${item.name || ''}, ${cityName}`.replace(/^, /, '');
        return { formattedAddress, cityName };
      }
    } catch (e) {
      console.warn('Geocoding error:', e);
    }
    return { formattedAddress: 'Detecting...', cityName: 'Default City' };
  };

  const refreshLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(prev => ({ ...prev, loading: false, error: 'Permission denied', city: 'Noida (Default)' }));
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { formattedAddress, cityName } = await getAddress(loc.coords.latitude, loc.coords.longitude);
      
      const newState = {
          coords: { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
          address: formattedAddress,
          city: cityName,
          loading: false,
          error: null
      };
      setLocation(newState);
      await AsyncStorage.setItem('user_location', JSON.stringify(newState));
    } catch (error) {
      console.error('Location error:', error);
      setLocation(prev => ({ ...prev, loading: false, error: 'Failed to get location', city: 'Delhi (Fallback)' }));
    }
  };

  const setSelectedCity = (city: string) => {
      setLocation(prev => ({ ...prev, city, address: city, coords: null }));
  };

  const setDetailedLocation = (lat: number, lon: number, address: string, city: string) => {
      const newState = {
          coords: { latitude: lat, longitude: lon },
          address,
          city,
          loading: false,
          error: null
      };
      setLocation(newState);
      AsyncStorage.setItem('user_location', JSON.stringify(newState));
  };

  useEffect(() => {
    const loadSaved = async () => {
        const saved = await AsyncStorage.getItem('user_location');
        if (saved) {
            setLocation(JSON.parse(saved));
        } else {
            refreshLocation();
        }
    };
    loadSaved();
  }, []);

  return (
    <LocationContext.Provider value={{ location, refreshLocation, setSelectedCity, setDetailedLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
};
