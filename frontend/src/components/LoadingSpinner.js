import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from '../utils/reanimated-compat';
import { useEffect } from 'react';
import { colors, typography, spacing, radius } from '../theme';

export function LoadingOverlay({ message = 'Analyzing...' }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.glassCard, animatedStyle]}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>
    </View>
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.logoCircle}
          >
            <ActivityIndicator size="large" color={colors.white} />
          </LinearGradient>
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
