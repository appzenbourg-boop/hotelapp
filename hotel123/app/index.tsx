import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Animated, Easing } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { token, loading } = useAuth();
  
  // Create Animated values without useRef to avoid freezing
  const logoScale = React.useMemo(() => new Animated.Value(0.3), []);
  const logoOpacity = React.useMemo(() => new Animated.Value(0), []);
  const logoTranslateY = React.useMemo(() => new Animated.Value(20), []);
  const bgScale = React.useMemo(() => new Animated.Value(1.1), []);

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(bgScale, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Separate effect for navigation — depends on auth loading state
  useEffect(() => {
    if (loading) return; // Wait for auth to resolve

    const timer = setTimeout(() => {
      if (token) {
        router.replace('/(main)/book');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [token, loading]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <Animated.View style={[styles.container, { transform: [{ scale: bgScale }] }]}>
        <Animated.Image 
          source={require('../assets/images/logoapp.png')} 
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY }
              ],
            }
          ]}
          resizeMode="contain"
        />
        
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#EAE5E0', // Matching the logo beige background
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.7,
    height: width * 0.7,
  },
});
