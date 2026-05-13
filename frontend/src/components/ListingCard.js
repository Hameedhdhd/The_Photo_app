import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from '../utils/reanimated-compat';
import { colors, typography, spacing, radius, shadows, layout } from '../theme';

const CARD_WIDTH = (layout.screenWidth - 45) / 2;

export default function ListingCard({ item, index, onPress, onToggleFavorite }) {
  const isFavorite = item.favorite || false;

  const handleFavoritePress = useCallback((e) => {
    e?.stopPropagation?.();
    if (onToggleFavorite) onToggleFavorite(item);
  }, [item, onToggleFavorite]);

  return (
    <Animated.View entering={FadeInDown.duration(300).delay((index || 0) * 50)}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress && onPress(item)}
        activeOpacity={0.85}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.gray300} />
            </View>
          )}
          {/* Multi-image Badge */}
          {item.image_urls && item.image_urls.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="copy-outline" size={10} color={colors.white} />
              <Text style={styles.imageCountText}>{item.image_urls.length}</Text>
            </View>
          )}

          {/* Favorite Heart */}
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.favorite : colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <Text style={styles.price}>{item.price || '—'}</Text>
          <View style={styles.tags}>
            {item.room && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.room}</Text>
              </View>
            )}
            {item.category && (
              <View style={[styles.tag, styles.tagCategory]}>
                <Text style={[styles.tagText, styles.tagCategoryText]}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  tagCategory: {
    backgroundColor: colors.warningLight,
  },
  tagCategoryText: {
    color: '#D97706',
  },
  imageCountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 2,
  },
  imageCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
