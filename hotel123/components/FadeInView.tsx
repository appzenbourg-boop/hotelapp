import React, { useEffect, useRef } from 'react';
import { ViewStyle, StyleProp, Animated, Easing } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  translateX?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

export default function FadeInView({ 
  children, 
  delay = 0, 
  duration = 300, 
  translateY = 20,
  translateX = 0,
  scale = 0.95,
  style 
}: FadeInViewProps) {
  const opacity = React.useMemo(() => new Animated.Value(0), []);
  const positionY = React.useMemo(() => new Animated.Value(translateY), [translateY]);
  const positionX = React.useMemo(() => new Animated.Value(translateX), [translateX]);
  const currentScale = React.useMemo(() => new Animated.Value(scale), [scale]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(positionY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(positionX, {
        toValue: 0,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(currentScale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      style, 
      {
        opacity,
        transform: [
          { translateY: positionY },
          { translateX: positionX },
          { scale: currentScale },
        ],
      }
    ]}>
      {children}
    </Animated.View>
  );
}
