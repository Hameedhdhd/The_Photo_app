import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, typography, spacing, radius } from '../theme';

export default function ResultCard({ title, price, room, description, itemId }) {
  return (
    <View style={styles.container}>
      {/* Title Card */}
      <Card shadow="md" style={styles.card}>
        <Text style={styles.label}>Title</Text>
        <Text style={styles.titleValue}>{title}</Text>
        {itemId && (
          <Text style={styles.itemId}>ID: {itemId}</Text>
        )}
      </Card>

      {/* Price & Room Row */}
      <View style={styles.row}>
        <Card shadow="md" style={styles.flexCard}>
          <View style={styles.priceHeader}>
            <Ionicons name="pricetag" size={16} color={colors.accent} />
            <Text style={styles.label}>Price</Text>
          </View>
          <Text style={styles.priceValue}>{price}</Text>
        </Card>
        <Card shadow="md" style={styles.flexCard}>
          <View style={styles.roomHeader}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.label}>Room</Text>
          </View>
          <Text style={styles.roomValue}>{room}</Text>
        </Card>
      </View>
    </View>
  );
}

export function DescriptionCard({ description, language }) {
  return (
    <Card shadow="md" style={styles.card}>
      <View style={styles.descHeader}>
        <Ionicons name="document-text-outline" size={16} color={colors.textTertiary} />
        <Text style={styles.label}>Description ({language.toUpperCase()})</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  label: {
    ...typography.overline,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  titleValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  itemId: {
    ...typography.small,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexCard: {
    flex: 1,
    marginBottom: 0,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  roomValue: {
    ...typography.h4,
    color: colors.primary,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});