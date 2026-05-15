import React, { useMemo } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { triggerHaptic } from '../utils/haptics';

const VARIANT_STYLES = {
  primary: {
    gradient: [colors.primary, colors.primaryDark],
    textColor: colors.white,
    shadow: shadows.primary,
    hapticType: 'medium',
  },
  accent: {
    gradient: [colors.accent, '#D97706'],
    textColor: colors.white,
    shadow: shadows.accent,
    hapticType: 'medium',
  },
  secondary: {
    gradient: null,
    bgColor: colors.white,
    textColor: colors.primary,
    borderColor: colors.border,
    shadow: shadows.sm,
    hapticType: 'light',
  },
  ghost: {
    gradient: null,
    bgColor: 'transparent',
    textColor: colors.primary,
    borderColor: 'transparent',
    shadow: null,
    hapticType: 'light',
  },
  danger: {
    gradient: [colors.error, '#DC2626'],
    textColor: colors.white,
    shadow: { ...shadows.lg, shadowColor: colors.error },
    hapticType: 'warning',
  },
  dark: {
    gradient: [colors.gray800, colors.gray900],
    textColor: colors.white,
    shadow: shadows.md,
    hapticType: 'medium',
  },
};

const SIZE_STYLES = {
  small: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, iconSize: 16, fontSize: 14 },
  medium: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg, iconSize: 20, fontSize: 17 },
  large: { paddingVertical: spacing.base + 2, paddingHorizontal: spacing.xl, iconSize: 22, fontSize: 17 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  activeOpacity = 0.7,
}) {
  const variantConfig = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.medium;
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    triggerHaptic(variantConfig.hapticType);
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useMemo(() => ({
    ...styles.container,
    ...(fullWidth && styles.fullWidth),
    ...(variantConfig.shadow || {}),
    ...style,
  }), [variant, fullWidth, style]);

  const innerStyle = useMemo(() => ({
    ...styles.inner,
    paddingVertical: sizeConfig.paddingVertical,
    paddingHorizontal: sizeConfig.paddingHorizontal,
    ...(!(variantConfig.gradient) && { backgroundColor: variantConfig.bgColor }),
    ...(!(variantConfig.gradient) && variantConfig.borderColor && { borderWidth: 1.5, borderColor: variantConfig.borderColor }),
  }), [variant, size]);

  const labelStyle = useMemo(() => ({
    ...typography[size === 'small' ? 'buttonSmall' : 'button'],
    color: variantConfig.textColor,
    ...textStyle,
  }), [variant, size, textStyle]);

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantConfig.textColor}
          style={styles.loader}
        />
      ) : (
        <>
          {icon && !iconRight && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={variantConfig.textColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={labelStyle}>{title}</Text>
          {icon && iconRight && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={variantConfig.textColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </>
  );

  if (variantConfig.gradient) {
    return (
      <Animated.View style={[animatedButtonStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={!disabled && !loading ? handlePressIn : undefined}
          onPressOut={!disabled && !loading ? handlePressOut : undefined}
          disabled={disabled || loading}
          activeOpacity={activeOpacity}
          style={[containerStyle, disabled && styles.disabled]}
        >
          <LinearGradient
            colors={variantConfig.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={innerStyle}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedButtonStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={!disabled && !loading ? handlePressIn : undefined}
        onPressOut={!disabled && !loading ? handlePressOut : undefined}
        disabled={disabled || loading}
        activeOpacity={activeOpacity}
        style={[containerStyle, innerStyle, disabled && styles.disabled]}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  loader: {
    marginHorizontal: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});