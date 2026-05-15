import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { colors, typography, spacing, radius, gradients } from '../theme';

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  iconBgColor = colors.gray100,
  iconColor = colors.gray300,
  gradient = true,
}) {
  const IconContainer = gradient && iconBgColor === colors.infoLight ? LinearGradient : View;
  const iconProps = gradient && iconBgColor === colors.infoLight
    ? { colors: [colors.infoLight, 'rgba(99,102,241,0.1)'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Animated.View entering={FadeInUp.duration(500).delay(100)}>
        <IconContainer
          style={[
            styles.iconCircle,
            !gradient && { backgroundColor: iconBgColor },
          ]}
          {...iconProps}
        >
          <Ionicons name={icon || 'folder-outline'} size={48} color={iconColor} />
        </IconContainer>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(200)}>
        <Text style={styles.title}>{title || 'No items'}</Text>
      </Animated.View>

      {subtitle && (
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      )}

      {action && (
        <Animated.View entering={FadeInUp.duration(500).delay(400)}>
          {action}
        </Animated.View>
      )}
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
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.1)',
  },
  title: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
});