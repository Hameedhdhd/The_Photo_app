import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadows, layout } from '../theme';
import { triggerHaptic } from '../utils/haptics';

const CARD_WIDTH = (layout.screenWidth - 45) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 1.1;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Use React.memo to prevent re-renders when props haven't changed
const ListingCard = React.memo(function ListingCard({ item, index, onPress, onToggleFavorite, onMessage }) {
  const isFavorite = item.favorite || false;
  const scale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const favStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  const handlePressIn = () => scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  const handlePressOut = () => scale.value = withSpring(1, { damping: 15, stiffness: 200 });

  const handleFavorite = useCallback((e) => {
    e?.stopPropagation?.();
    triggerHaptic(isFavorite ? 'light' : 'success');
    favoriteScale.value = withSpring(1.3, { damping: 10, stiffness: 300 });
    setTimeout(() => favoriteScale.value = withSpring(1, { damping: 12, stiffness: 250 }), 150);
    if (onToggleFavorite) onToggleFavorite(item);
  }, [item, isFavorite, onToggleFavorite, favoriteScale]);

  return (
    <Animated.View entering={FadeInDown.duration(350).delay((index || 0) * 60).springify()}>
      <AnimatedTouchable
        style={[styles.card, cardStyle]}
        onPress={() => { triggerHaptic('light'); onPress?.(item); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Image with gradient overlay */}
        <View style={styles.imageWrapper}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={36} color={colors.gray300} />
              <Text style={styles.noImageText}>No image</Text>
            </View>
          )}

          {/* Gradient overlay for price at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.gradient}
          >
            <View style={styles.priceRow}>
              <Text style={styles.priceText} numberOfLines={1}>
                {item.price || '—'}
              </Text>
            </View>
          </LinearGradient>

          {/* Top action buttons */}
          <View style={styles.topActions}>
            {onMessage && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.chatBtn]}
                onPress={(e) => { e.stopPropagation(); onMessage(); }}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble" size={14} color={colors.white} />
              </TouchableOpacity>
            )}
            <Animated.View style={favStyle}>
              <TouchableOpacity
                style={[styles.actionBtn, isFavorite && styles.favBtnActive]}
                onPress={handleFavorite}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={14}
                  color={colors.white}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Category tag */}
          {item.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>
          {item.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.address}</Text>
            </View>
          )}
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  noImageText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
  },
  topActions: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    backgroundColor: 'rgba(99,102,241,0.85)',
  },
  favBtnActive: {
    backgroundColor: 'rgba(244,63,94,0.85)',
  },
  categoryTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.sm + 2,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    color: colors.textTertiary,
    flex: 1,
  },
});

export default ListingCard;
