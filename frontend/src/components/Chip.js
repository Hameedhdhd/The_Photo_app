import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

export default function Chip({
  label,
  selected = false,
  onPress,
  icon,
  style,
  selectedColor = colors.primary,
}) {
  const chipStyle = useMemo(() => ({
    ...styles.chip,
    ...(selected && { backgroundColor: selectedColor, borderColor: selectedColor }),
    ...style,
  }), [selected, selectedColor, style]);

  const labelStyle = useMemo(() => ({
    ...typography.small,
    color: selected ? colors.white : colors.gray500,
    ...(selected && { fontWeight: '700' }),
  }), [selected]);

  return (
    <TouchableOpacity
      style={chipStyle}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.white : colors.gray400}
          style={styles.icon}
        />
      )}
      <Text style={labelStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  icon: {
    marginRight: spacing.xs,
  },
});