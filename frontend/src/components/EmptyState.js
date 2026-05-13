import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {  } from '../utils/reanimated-compat';
import { Animated } from '../utils/reanimated-compat';
import { colors, typography, spacing, radius } from '../theme';

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  iconBgColor = colors.gray100,
  iconColor = colors.gray300,
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon || 'folder-outline'} size={48} color={iconColor} />
      </View>
      <Text style={styles.title}>{title || 'No items'}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
