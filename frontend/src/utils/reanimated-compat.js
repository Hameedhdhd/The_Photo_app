/**
 * Reanimated compatibility shim - REMOVES all native module dependencies.
 * This file allows the app to run on any version of Expo Go without crashing.
 */
import React, { useRef } from 'react';
import { View, ScrollView, Text, Image, Animated as RNAnimated } from 'react-native';

// Create a mock Animated object that uses standard RN components
const MockAnimated = {
  View: RNAnimated.createAnimatedComponent(View),
  ScrollView: RNAnimated.createAnimatedComponent(ScrollView),
  Text: RNAnimated.Text,
  Image: RNAnimated.Image,
  createAnimatedComponent: RNAnimated.createAnimatedComponent,
};

// Animation factory for entering/exiting (returns a chainable dummy object)
const createDummyAnimation = () => {
  const obj = {
    duration: () => obj,
    delay: () => obj,
    springify: () => obj,
    damping: () => obj,
    stiffness: () => obj,
    withCallback: () => obj,
  };
  return obj;
};

export const FadeIn = createDummyAnimation;
export const FadeInDown = createDummyAnimation;
export const FadeInUp = createDummyAnimation;
export const FadeOut = createDummyAnimation;
export const FadeOutDown = createDummyAnimation;
export const FadeOutUp = createDummyAnimation;

// Hooks (return standard values or no-ops)
export const useSharedValue = (initialValue) => useRef(initialValue).current;
export const useAnimatedStyle = () => ({});
export const withSpring = (value) => value;
export const withTiming = (value) => value;
export const withRepeat = (value) => value;
export const withSequence = (value) => value;
export const withDelay = (delay, anim) => anim;
export const runOnJS = (fn) => fn;

export default MockAnimated;
