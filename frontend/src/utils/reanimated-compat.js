/**
 * Reanimated compatibility shim - NO native module dependency
 * Provides drop-in replacement that uses simple pass-through components
 */
import React, { useRef } from 'react';
import { View, ScrollView } from 'react-native';

// Pass-through View that accepts but ignores `entering` prop
function CompatView({ entering, ...props }) {
  return <View {...props} />;
}

// Pass-through ScrollView that accepts but ignores `entering` prop
const CompatScrollView = React.forwardRef(({ entering, ...props }, ref) => {
  return <ScrollView ref={ref} {...props} />;
});

const CompatAnimated = {
  View: CompatView,
  ScrollView: CompatScrollView,
};

// Entering animation factories - return config objects (ignored by components)
function createEntering(type) {
  const fn = () => {
    const result = { _type: type, _duration: 400, _delay: 0 };
    result.duration = (d) => { result._duration = d; return result; };
    result.delay = (d) => { result._delay = d; return result; };
    return result;
  };
  return fn;
}

const FadeInDown = createEntering('fadeDown');
const FadeInUp = createEntering('fadeUp');
const FadeIn = createEntering('fade');
const FadeOut = createEntering('fade');

// Hooks - simplified no-ops
function useSharedValue(initial) {
  return useRef(typeof initial === 'number' ? initial : 0).current;
}

function useAnimatedStyle() {
  return {};
}

function withSpring(toValue) { return toValue; }
function withTiming(toValue) { return toValue; }
function withRepeat(anim) { return anim; }
function withSequence(...anim) { return anim[anim.length - 1]; }
function runOnJS(fn) { return fn; }

export {
  CompatAnimated as default,
  CompatAnimated as Animated,
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
};