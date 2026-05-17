import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, typography, spacing, radius, gradients } from '../theme';

export function LoadingOverlay({ message = 'Analyzing...' }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const dotAnimation = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
    dotAnimation.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnimation.value, [0, 0.33, 0.66, 1], [1, 0.6, 0.3, 1], Extrapolate.CLAMP),
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnimation.value, [0, 0.33, 0.66, 1], [0.6, 0.3, 1, 0.6], Extrapolate.CLAMP),
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotAnimation.value, [0, 0.33, 0.66, 1], [0.3, 1, 0.6, 0.3], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.glassCard, animatedStyle]}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, styles.dot1, dot1AnimatedStyle]} />
          <Animated.View style={[styles.dot, styles.dot2, dot2AnimatedStyle]} />
          <Animated.View style={[styles.dot, styles.dot3, dot3AnimatedStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: interpolate(rotate.value, [0, 1], ['0deg', '360deg']),
      },
    ],
  }));

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <View style={styles.logoContainer}>
          <Animated.View style={logoAnimatedStyle}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.logoCircle}
            >
              <ActivityIndicator size="large" color={colors.white} />
            </LinearGradient>
          </Animated.View>
        </View>
        <Text style={styles.screenMessage}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  spinnerContainer: {
    marginBottom: spacing.md,
  },
  message: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
  screen: {
    flex: 1,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContent: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  screenMessage: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});