import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from '../utils/reanimated-compat';
import { colors, typography, spacing, radius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Calculate item width to fit ~6 items on screen
// (Screen - PagePadding*2 - Gap*(Items-1)) / Items
const ITEM_WIDTH = Math.floor((SCREEN_WIDTH - spacing.page * 2 - spacing.xs * 5) / 6.2);

export default function CategoryScroll({
  categories,
  selectedCategory,
  onSelect,
  showAllOption = true,
  icons = {}, // Optional map of label -> iconName
}) {
  const scrollViewRef = useRef(null);

  const displayCategories = showAllOption && !categories.includes('All')
    ? ['All', ...categories]
    : categories;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH + spacing.xs}
      >
        {displayCategories.map((category) => {
          const isSelected = selectedCategory === category;
          // Use provided icon, fallback to common ones, or default
          const icon = icons[category] || 
                      (category === 'All' ? 'grid-outline' : 'pricetag-outline');

          return (
            <CategoryItem
              key={category}
              category={category}
              icon={icon}
              isSelected={isSelected}
              onPress={() => onSelect(category)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryItem({ category, icon, isSelected, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      style={[styles.item, isSelected && styles.itemActive, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <View style={[styles.iconContainer, isSelected && styles.iconContainerActive]}>
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? colors.white : colors.textSecondary}
        />
      </View>
      <Text
        style={[styles.label, isSelected && styles.labelActive]}
        numberOfLines={1}
      >
        {category}
      </Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    width: ITEM_WIDTH,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  itemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  labelActive: {
    color: colors.white,
    fontWeight: '700',
  },
});
