import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function LanguageToggle({ value, onChange, options = ['de', 'en'] }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.container}>
      <AnimatedTouchable
        style={[styles.option, value === 'de' && styles.optionActive, animatedStyle]}
        onPress={() => onChange('de')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={styles.flag}>🇩🇪</Text>
        <Text style={[styles.label, value === 'de' && styles.labelActive]}>Deutsch</Text>
      </AnimatedTouchable>

      <AnimatedTouchable
        style={[styles.option, value === 'en' && styles.optionActive, animatedStyle]}
        onPress={() => onChange('en')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Text style={styles.flag}>🇺🇸</Text>
        <Text style={[styles.label, value === 'en' && styles.labelActive]}>English</Text>
      </AnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  flag: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.white,
  },
});
