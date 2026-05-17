import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import CategoryPicker from '../CategoryPicker';

export default function MarketplaceHeader({
  filteredItemsCount,
  viewMode,
  setViewMode,
  searchLocation,
  setShowLocationModal,
  searchRadius,
  searchQuery,
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategories = [],
  onSelectSubcategory = () => {},
  navigation,
}) {
  return (
    <View>
      <LinearGradient
        colors={[colors.primary, '#818CF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Marketplace</Text>
              <Text style={styles.headerSub}>
                {filteredItemsCount > 0
                  ? `${filteredItemsCount} items available`
                  : 'Discover amazing deals'}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.searchRadiusBtn}
                onPress={() => navigation.navigate('RadiusSearch')}
              >
                <Ionicons name="radio-button-off-outline" size={20} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Ionicons name="grid-outline" size={17} color={viewMode === 'list' ? colors.primary : 'rgba(255,255,255,0.7)'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                  onPress={() => setViewMode('map')}
                >
                  <Ionicons name="map-outline" size={17} color={viewMode === 'map' ? colors.primary : 'rgba(255,255,255,0.7)'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Location & Search Bar */}
          <View style={styles.searchBarContainer}>
            <TouchableOpacity 
              style={styles.locationSelector}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={searchLocation ? colors.primary : colors.textTertiary}
              />
              <Text style={[
                styles.locationText,
                searchLocation && styles.locationTextActive
              ]}>
                {searchLocation ? `${searchLocation.name.split(',')[0]}...` : 'All Germany'}
              </Text>
              <Ionicons 
                name="chevron-down-outline" 
                size={16} 
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            {searchLocation && (
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusText}>{searchRadius}km</Text>
              </View>
            )}

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Category Picker */}
      <View style={styles.categoriesContainer}>
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSubcategories={selectedSubcategories}
            onSelectSubcategory={onSelectSubcategory}
            multiSelect={true}
            showAllOption={true}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.page,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchRadiusBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
  },
  searchBarContainer: {
    gap: spacing.sm,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.sm,
  },
  locationText: {
    flex: 1,
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  locationTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  radiusBadge: {
    position: 'absolute',
    top: 0,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 1,
  },
  radiusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  categoriesContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
  },
});
