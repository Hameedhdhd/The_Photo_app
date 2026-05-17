import React from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Button from '../Button';
import { colors, typography, spacing, radius } from '../../theme';

export default function HomeResultPreview({
  result,
  loading,
  imageUris,
  selectedRoom,
  selectedSubcategories,
  navigation,
  handleReset,
}) {
  if (!result || loading) return null;

  const isMultiple = result.type === 'multiple';

  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      style={styles.resultPreview}
    >
      <View style={styles.successCard}>
        <View style={styles.successIcon}>
          <Ionicons 
            name={isMultiple ? "checkmark-done-circle" : "checkmark-circle"} 
            size={48} 
            color={colors.success} 
          />
        </View>
        <Text style={styles.successTitle}>
          {isMultiple ? `${result.items.length} Items Analyzed` : result.title}
        </Text>
        {!isMultiple && <Text style={styles.successPrice}>{result.price}</Text>}
        <Text style={styles.successSubtitle}>
          {isMultiple 
            ? "Each photo was analyzed as a separate item"
            : `${imageUris.length} photo${imageUris.length > 1 ? 's' : ''} • AI analysis complete`
          }
        </Text>
      </View>

      {isMultiple ? (
        <ScrollView style={styles.multiResultList} showsVerticalScrollIndicator={false}>
          {result.items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.multiResultCard}
              onPress={() => navigation.navigate('ItemDetail', { item })}
              activeOpacity={0.7}
            >
              <View style={styles.multiResultInfo}>
                <Text style={styles.multiResultTitle}>{item.title}</Text>
                <Text style={styles.multiResultPrice}>{item.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Button
          title="View & Edit Details"
          onPress={() => navigation.navigate('Result', {
            result,
            imageUris,
            room: selectedRoom,
            subcategory: selectedSubcategories?.length > 0 ? selectedSubcategories[0] : null,
          })}
          variant="primary"
          icon="document-text"
          fullWidth
          size="large"
        />
      )}

      <View style={styles.buttonGap} />
      <Button
        title="Scan Another Item"
        onPress={handleReset}
        variant="secondary"
        icon="camera"
        fullWidth
        size="large"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  resultPreview: {
    flex: 1,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    justifyContent: 'center',
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.small,
    color: colors.textTertiary,
  },
  buttonGap: {
    height: spacing.md,
  },
  multiResultList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  multiResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  multiResultInfo: {
    flex: 1,
  },
  multiResultTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  multiResultPrice: {
    ...typography.small,
    fontWeight: '800',
    color: colors.accent,
  },
});
