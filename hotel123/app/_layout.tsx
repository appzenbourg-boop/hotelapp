import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { LocationProvider } from '../context/LocationContext';
import { NavigationProvider } from '../context/NavigationContext';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter_24pt-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter_24pt-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_24pt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#2F2E2E' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationProvider>
            <FavoritesProvider>
              <LocationProvider>
                <NotificationProvider>
                  <Stack 
                  screenOptions={{ 
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }} 
                >
                  {/* payment-result is only reachable via deep link after Razorpay payment */}
                  <Stack.Screen 
                    name="payment-result" 
                    options={{ 
                      presentation: 'transparentModal',
                      animation: 'fade',
                      gestureEnabled: false,
                    }} 
                  />
                </Stack>
                </NotificationProvider>
              </LocationProvider>
          </FavoritesProvider>
        </NavigationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

