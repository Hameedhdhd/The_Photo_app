import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Dimensions } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import CategoryPicker from '../CategoryPicker';
import Button from '../Button';
import { LoadingOverlay } from '../LoadingSpinner';
import { colors, typography, spacing, radius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - spacing.page * 2 - spacing.md * 2) / 3;

export default function HomeGallery({
  imageUris,
  selectedRoom,
  setSelectedRoom,
  selectedSubcategories,
  setSelectedSubcategories,
  takePhoto,
  pickImage,
  removeImage,
  loading,
  analyzeAsOneItem,
  analyzeAsSeparateItems,
  handleAddManually,
  handleReset,
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

      {/* Photo Gallery Header */}
      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>
          Photos ({imageUris.length})
        </Text>
        <View style={styles.galleryActions}>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={styles.addPhotoText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addPhotoText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photo Grid */}
      <View style={styles.photoGrid}>
        {imageUris.map((uri, index) => (
          <View key={index} style={styles.photoThumbContainer}>
            <Image source={{ uri }} style={styles.photoThumb} />
            {index === 0 && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Main</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeImage(index)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {/* Add More Placeholder */}
        <TouchableOpacity
          style={styles.addMoreThumb}
          onPress={takePhoto}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={32} color={colors.textTertiary} />
          <Text style={styles.addMoreText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.analyzingContainer}>
          <LoadingOverlay message="AI is analyzing..." />
        </View>
      )}

      {/* Action Buttons */}
      {!loading && (
        <View style={styles.analyzeActions}>
          {imageUris.length === 1 ? (
            <Button
              title="Analyze Photo"
              onPress={analyzeAsOneItem}
              variant="primary"
              icon="sparkles"
              fullWidth
              size="large"
            />
          ) : (
            <>
              <Button
                title="Same Item — Multi-Angle"
                onPress={analyzeAsOneItem}
                variant="primary"
                icon="sparkles"
                fullWidth
                size="large"
              />
              <View style={styles.buttonGap} />
              <Button
                title="Different Items — Analyze Separately"
                onPress={analyzeAsSeparateItems}
                variant="dark"
                icon="copy-outline"
                fullWidth
                size="large"
              />
            </>
          )}
          <View style={styles.buttonGap} />
          <Button
            title="Add Details Manually"
            onPress={handleAddManually}
            variant="secondary"
            icon="create-outline"
            fullWidth
            size="large"
          />
          <View style={styles.buttonGap} />
          <Button
            title="Clear All & Start Over"
            onPress={handleReset}
            variant="secondary"
            icon="trash"
            fullWidth
            size="medium"
          />
        </View>
      )}
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
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  galleryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.infoLight,
  },
  addPhotoText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  photoThumbContainer: {
    position: 'relative',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  addMoreThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  addMoreText: {
    ...typography.overline,
    color: colors.textTertiary,
    marginTop: 2,
  },
  analyzingContainer: {
    marginBottom: spacing.xl,
  },
  analyzeActions: {
    paddingBottom: spacing.xl,
  },
  buttonGap: {
    height: spacing.md,
  },
});
