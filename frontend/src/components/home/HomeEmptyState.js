import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import CategoryPicker from '../CategoryPicker';
import EmptyState from '../EmptyState';
import Button from '../Button';
import { colors, typography, spacing } from '../../theme';

export default function HomeEmptyState({
  selectedRoom,
  setSelectedRoom,
  selectedSubcategories,
  setSelectedSubcategories,
  takePhoto,
  pickImage,
  handleAddManually,
}) {
  return (
    <Animated.ScrollView
      entering={FadeInUp.duration(400)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Category</Text>
         <CategoryPicker
           selectedCategory={selectedRoom}
           onSelectCategory={setSelectedRoom}
           selectedSubcategories={selectedSubcategories}
           onSelectSubcategory={setSelectedSubcategories}
           multiSelect={false}
           showAllOption={false}
         />
      </View>

      {/* Empty State Illustration */}
      <EmptyState
        icon="scan-outline"
        title="Ready to sell?"
        subtitle="Take photos or pick from gallery to generate a listing with AI"
        iconBgColor={colors.infoLight}
        iconColor={colors.primary}
      />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Take Photo"
          onPress={takePhoto}
          variant="primary"
          icon="camera"
          fullWidth
          size="large"
        />
        <View style={styles.buttonDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <Button
          title="Choose from Gallery"
          onPress={pickImage}
          variant="secondary"
          icon="images"
          fullWidth
          size="large"
        />
        <View style={styles.buttonGap} />
        <Button
          title="Add Manually"
          onPress={handleAddManually}
          variant="dark"
          icon="create-outline"
          fullWidth
          size="medium"
        />
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  actions: {
    paddingBottom: spacing.xl,
  },
  buttonDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  buttonGap: {
    height: spacing.md,
  },
});
