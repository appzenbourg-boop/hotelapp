import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Vibration, Alert } from 'react-native';
import { Audio } from 'expo-av';
import useSWR from 'swr';
import { useAuth } from './AuthContext';
import { notificationsAPI } from '../services/api';

// Simple public lightweight preview sound for real-time chime
const CHIME_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

type NotificationContextType = {
  unreadCount: number;
  refresh: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const prevCount = useRef<number | null>(null);
  const soundObject = useRef<Audio.Sound | null>(null);

  // Global Polling mechanism
  const { data, mutate } = useSWR(
    token ? ['global_notifications', token] : null,
    () => notificationsAPI.getUnread(token!),
    { 
      refreshInterval: 15000, 
      revalidateOnFocus: true 
    }
  );

  const currentCount = data?.count || 0;

  // Configure Audio component for instant in-app playback on startup
  useEffect(() => {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      return () => {
          if (soundObject.current) {
              soundObject.current.unloadAsync();
          }
      };
  }, []);

  const playNotificationSound = async () => {
    try {
       Vibration.vibrate([0, 500, 200, 500]); // Double burst vibration
       
       const { sound } = await Audio.Sound.createAsync(
           { uri: CHIME_URL },
           { shouldPlay: true, volume: 1.0 }
       );
       soundObject.current = sound;
       await sound.playAsync();
    } catch (error) {
       console.warn('Failed to play notification audio:', error);
    }
  };

  // 2. Watcher: If Count Increases -> Trigger Sound Chime & Internal Alert!
  useEffect(() => {
    if (token && data) {
      if (prevCount.current !== null && currentCount > prevCount.current) {
         
         // 1. Play Custom Audio Chime!
         playNotificationSound();
         
         // 2. Show In-App Popover alert!
         const latestMsg = data?.notifications?.[0]?.description || "You received a new service update.";
         const { router } = require('expo-router');
         Alert.alert(
           "Zenbourg Update 🛎️", 
           latestMsg,
           [
             { text: "Later", style: "cancel" },
             { text: "View", onPress: () => router.push('/(main)/notifications') }
           ]
         );
      }
      prevCount.current = currentCount;
    } else if (!token) {
      prevCount.current = null;
    }
  }, [currentCount, token]);

  return (
    <NotificationContext.Provider value={{ unreadCount: currentCount, refresh: () => mutate() }}>
      {children}
    </NotificationContext.Provider>
  );
};
