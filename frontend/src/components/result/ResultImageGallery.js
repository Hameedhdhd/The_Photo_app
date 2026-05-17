import React from 'react';
import { View, Text, StyleSheet, Animated, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.5;

export default function ResultImageGallery({
  photos,
  activePhotoIndex,
  setActivePhotoIndex,
  isFavorite,
  toggleFavorite,
}) {
  if (photos.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.photoSection}>
      {/* Main Photo */}
      <Image
        source={{ uri: photos[activePhotoIndex] }}
        style={styles.mainPhoto}
      />
      <View style={styles.photoBadge}>
        <Ionicons name="checkmark-circle" size={14} color={colors.white} />
        <Text style={styles.photoBadgeText}>
          {activePhotoIndex + 1}/{photos.length}
        </Text>
      </View>
      {/* Favorite Heart */}
      <TouchableOpacity
        style={styles.favBadge}
        onPress={toggleFavorite}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite ? colors.favorite : colors.white}
        />
      </TouchableOpacity>

      {/* Photo Thumbnails */}
      {photos.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbScroll}
          contentContainerStyle={styles.thumbContainer}
        >
          {photos.map((uri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActivePhotoIndex(index)}
              activeOpacity={0.8}
              style={[
                styles.thumb,
                index === activePhotoIndex && styles.thumbActive,
              ]}
            >
              <Image source={{ uri }} style={styles.thumbImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    marginBottom: spacing.lg,
  },
  mainPhoto: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: radius.xl,
    resizeMode: 'cover',
  },
  photoBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  photoBadgeText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '700',
  },
  thumbScroll: {
    marginTop: spacing.sm,
  },
  thumbContainer: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
