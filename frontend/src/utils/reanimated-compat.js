/**
 * Reanimated compatibility shim
 * Replaces react-native-reanimated with RN Animated for Expo Go compatibility
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, View, ScrollView } from 'react-native';

// Simple entering animation wrapper
function withEnterAnimation(Component) {
  return React.forwardRef(({ entering, ...props }, ref) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (entering) {
        // Fade in + slide up
        const type = entering._type || 'fade';
        const duration = entering._duration || 400;
        const delay = entering._delay || 0;
        
        const isDown = type === 'fadeDown';
        const isUp = type === 'fadeUp';
        
        translateY.setValue(isDown ? 20 : isUp ? -20 : 0);
        opacity.setValue(0);
        
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, []);

    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Component ref={ref} {...props} />
      </Animated.View>
    );
  });
}

// Animated components
const AnimatedView = withEnterAnimation(View);
const AnimatedScrollView = withEnterAnimation(ScrollView);

const CompatAnimated = {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
};

// Entering animation factories
function createEntering(type) {
  return (durationOrConfig) => {
    const duration = typeof durationOrConfig === 'number' ? durationOrConfig : 400;
    const result = { _type: type, _duration: duration, _delay: 0 };
    result.duration = (d) => { result._duration = d; return result; };
    result.delay = (d) => { result._delay = d; return result; };
    return result;
  };
}

const FadeInDown = createEntering('fadeDown');
const FadeInUp = createEntering('fadeUp');
const FadeIn = createEntering('fade');
const FadeOut = createEntering('fade');

// Hooks compatibility
function useSharedValue(initial) {
  const ref = useRef(new Animated.Value(
    typeof initial === 'number' ? initial : 0
  ));
  return ref.current;
}

function useAnimatedStyle(worklet) {
  // Just return empty style - animations will be simplified
  return {};
}

function withSpring(toValue, config) {
  return toValue;
}

function withTiming(toValue, config) {
  return toValue;
}

function withRepeat(animation, numberOfReps, reverse) {
  return animation;
}

function runOnJS(fn) {
  return fn;
}

function withSequence(...animations) {
  return animations[animations.length - 1];
}

export {
  CompatAnimated as default,
  CompatAnimated as Animated,
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  runOnJS,
  withSequence,
};