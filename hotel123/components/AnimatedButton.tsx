import React, { useRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, View, Animated } from 'react-native';

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scale?: number;
}

export default function AnimatedButton({ 
  children, 
  scale = 0.95, 
  onPressIn,
  onPressOut,
  style,
  ...props 
}: AnimatedButtonProps) {
  const sharedScale = React.useMemo(() => new Animated.Value(1), []);

  const handlePressIn = (event: any) => {
    Animated.timing(sharedScale, {
      toValue: scale,
      duration: 100,
      useNativeDriver: true,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    Animated.spring(sharedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPressOut?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: sharedScale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
