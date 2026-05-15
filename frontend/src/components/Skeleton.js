import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { colors, spacing, radius } from '../theme';

export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 1],
      [0.5, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard = () => (
  <View style={styles.card}>
    <Skeleton height={150} borderRadius={radius.lg} style={styles.image} />
    <View style={styles.content}>
      <Skeleton height={16} width="80%" style={styles.title} />
      <Skeleton height={20} width="50%" style={styles.price} />
      <View style={styles.tagsRow}>
        <Skeleton height={12} width="25%" borderRadius={radius.sm} />
        <Skeleton height={12} width="25%" borderRadius={radius.sm} />
      </View>
    </View>
  </View>
);

export const SkeletonListingCard = () => (
  <View style={styles.card}>
    <Skeleton height={120} borderRadius={radius.lg} />
    <View style={styles.content}>
      <Skeleton height={14} width="70%" style={styles.title} />
      <Skeleton height={18} width="40%" style={styles.price} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    marginBottom: spacing.sm,
  },
  price: {
    marginBottom: spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
