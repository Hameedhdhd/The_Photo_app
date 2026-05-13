import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, typography, spacing, radius } from '../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CATEGORY_ICONS = {
  'Kitchen': 'restaurant-outline',
  'Bathroom': 'water-outline',
  'Bedroom': 'bed-outline',
  'Living Room': 'tv-outline',
  'Garage': 'car-outline',
  'Electrical': 'flash-outline',
  'Other': 'apps-outline',
  'All': 'grid-outline',
};

export default function CategoryScroll({
  categories,
  selectedCategory,
  onSelect,
  showAllOption = true,
}) {
  const scrollViewRef = useRef(null);

  const displayCategories = showAllOption && !categories.includes('All')
    ? ['All', ...categories]
    : categories;

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || 'pricetag-outline';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={72}
      >
        {displayCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const icon = getCategoryIcon(category);

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
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
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
          size={20}
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
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.page - spacing.sm,
    gap: spacing.sm,
  },
  item: {
    alignItems: 'center',
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    marginRight: spacing.sm,
  },
  itemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
  },
  labelActive: {
    color: colors.white,
    fontWeight: '700',
  },
});