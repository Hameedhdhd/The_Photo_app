import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';

export default function Card({
  children,
  style,
  onPress,
  padding = spacing.md + 2,
  shadow = 'sm',
  elevated = false,
}) {
  const cardStyle = [
    styles.card,
    shadows[shadow] || shadows.sm,
    elevated && styles.elevated,
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={cardStyle}>{children}</View>
      </TouchableWithoutFeedback>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  elevated: {
    borderWidth: 0,
  },
});