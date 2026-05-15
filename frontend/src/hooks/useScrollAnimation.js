import React from 'react';
import { Animated, StyleSheet } from 'react-native';

export const useScrollAnimation = () => {
  const scrollY = new Animated.Value(0);

  const headerAnimatedStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 100],
          outputRange: [0, -20],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const contentAnimatedStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 100],
          outputRange: [0, 10],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return {
    scrollY,
    headerAnimatedStyle,
    contentAnimatedStyle,
    handleScroll,
  };
};

export const ParallaxScrollView = ({ children, onScroll }) => {
  return (
    <Animated.ScrollView
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: onScroll || new Animated.Value(0) } } }],
        { useNativeDriver: false }
      )}
    >
      {children}
    </Animated.ScrollView>
  );
};

export default useScrollAnimation;
