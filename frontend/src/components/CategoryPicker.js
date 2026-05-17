import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Modal, FlatList, Pressable, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { CATEGORIES } from '../constants/categories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  selectedSubcategories = [],
  onSelectSubcategory,
  multiSelect = false,
  showAllOption = true,
}) {
  const [showMainModal, setShowMainModal] = useState(false);
  const subScrollRef = useRef(null);

  // Find current category object
  const currentCatObj = CATEGORIES.find(c => c.label === selectedCategory);
  const subcategories = currentCatObj?.subcategories || [];

  const handleMainCategoryPress = (catLabel) => {
    onSelectCategory(catLabel);
    // Clear subcategories when main category changes
    onSelectSubcategory([]);
  };

  const isSubSelected = (sub) => selectedSubcategories.includes(sub);

  const toggleSubcategory = (sub) => {
    if (multiSelect) {
      if (isSubSelected(sub)) {
        onSelectSubcategory(selectedSubcategories.filter(s => s !== sub));
      } else {
        onSelectSubcategory([...selectedSubcategories, sub]);
      }
    } else {
      onSelectSubcategory([sub]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Categories Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
        decelerationRate="fast"
      >
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.mainChip,
              selectedCategory === 'All' && styles.mainChipActive,
              styles.allChip
            ]}
            onPress={() => setShowMainModal(true)}
          >
            <Ionicons 
              name="grid-outline" 
              size={18} 
              color={selectedCategory === 'All' ? colors.white : colors.primary} 
            />
            <Text style={[styles.mainChipText, selectedCategory === 'All' && styles.mainChipTextActive]}>
              All
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={14} 
              color={selectedCategory === 'All' ? colors.white : colors.textTertiary} 
            />
          </TouchableOpacity>
        )}

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.mainChip, isSelected && styles.mainChipActive]}
              onPress={() => handleMainCategoryPress(cat.label)}
            >
              <Ionicons 
                name={cat.icon} 
                size={18} 
                color={isSelected ? colors.white : colors.textSecondary} 
              />
              <Text style={[styles.mainChipText, isSelected && styles.mainChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subcategories Row - Simple Appearance to avoid Web crash */}
      {subcategories.length > 0 && (
        <View style={styles.subContainer}>
          <Text style={styles.subLabel}>Subcategories</Text>
          <ScrollView
            ref={subScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subScrollContent}
          >
            {subcategories.map((sub) => {
              const isSelected = isSubSelected(sub);
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subChip, isSelected && styles.subChipActive]}
                  onPress={() => toggleSubcategory(sub)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subChipContent}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.white} />
                    )}
                    <Text 
                      style={[styles.subChipText, isSelected && styles.subChipTextActive]}
                      numberOfLines={1}
                    >
                      {sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Categories Modal (Dropdown for "All") */}
      <Modal
        visible={showMainModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMainModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowMainModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Main Category</Text>
              <TouchableOpacity onPress={() => setShowMainModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.label}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedCategory === item.label && styles.modalItemActive
                  ]}
                  onPress={() => {
                    handleMainCategoryPress(item.label);
                    setShowMainModal(false);
                  }}
                >
                  <View style={[
                    styles.modalIconBg,
                    selectedCategory === item.label && styles.modalIconBgActive
                  ]}>
                    <Ionicons 
                      name={item.icon} 
                      size={22} 
                      color={selectedCategory === item.label ? colors.white : colors.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.modalItemText,
                    selectedCategory === item.label && styles.modalItemTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalList}
            />

            <TouchableOpacity 
              style={[styles.modalAllBtn, selectedCategory === 'All' && styles.modalAllBtnActive]}
              onPress={() => {
                onSelectCategory('All');
                onSelectSubcategory([]);
                setShowMainModal(false);
              }}
            >
              <Text style={[styles.modalAllBtnText, selectedCategory === 'All' && styles.modalAllBtnTextActive]}>
                View All Categories
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  mainScrollContent: {
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  mainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    gap: 6,
    ...shadows.sm,
  },
  mainChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  allChip: {
    borderColor: colors.primary,
  },
  mainChipText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  mainChipTextActive: {
    color: colors.white,
  },
  // Subcategories
  subContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginHorizontal: spacing.page,
  },
  subLabel: {
    ...typography.overline,
    color: colors.textTertiary,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    minHeight: 32,
    justifyContent: 'center',
  },
  subChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  subChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 120,
  },
  subChipText: {
    ...typography.small,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    lineHeight: 16,
  },
  subChipTextActive: {
    color: colors.white,
    fontWeight: '700',
    lineHeight: 16,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  modalItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    margin: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  modalItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  modalIconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalIconBgActive: {
    backgroundColor: colors.primary,
  },
  modalItemText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalAllBtn: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalAllBtnActive: {
    backgroundColor: colors.primary,
  },
  modalAllBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalAllBtnTextActive: {
    color: colors.white,
  },
});
