import { Easing } from 'react-native';

export const Animations = {
  // Durations
  DURATION_QUICK: 150,
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,

  // Easings - React Native Animated doesn't have bezier, using standard easings
  EASING_OUT_QUAD: Easing.out(Easing.quad),
  EASING_IN_OUT_QUAD: Easing.inOut(Easing.quad),

  // Press feedback
  PRESS_SCALE: 0.97,
};

// Satisfy expo-router default export requirement for routes
export default (() => null);
