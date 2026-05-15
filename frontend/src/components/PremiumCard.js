import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, shadows } from '../theme';

export const PremiumCard = ({
  children,
  style,
  shadow = 'md',
  glass = false,
  elevation = true,
}) => {
  const cardStyle = [
    styles.card,
    shadows[shadow] && elevation && shadows[shadow],
    style,
  ];

  if (glass) {
    return (
      <View style={[styles.glassContainer, style]}>
        <BlurView intensity={70} style={styles.blur}>
          <View style={styles.glassContent}>
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  glassContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  blur: {
    flex: 1,
  },
  glassContent: {
    padding: spacing.md,
  },
});

export default PremiumCard;
