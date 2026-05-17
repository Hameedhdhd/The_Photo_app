import React from 'react';
import { View, Text, StyleSheet, Animated, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Card from '../Card';
import CategoryPicker from '../CategoryPicker';
import { colors, typography, spacing, radius } from '../../theme';
import { CATEGORIES } from '../../constants/categories';

export default function ResultForm({
  itemId,
  title, setTitle,
  price, setPrice,
  description, setDescription,
  selectedCategory, setSelectedCategory,
  selectedSubcategories, setSelectedSubcategories,
  streetName, setStreetName,
  postalCode, handlePostalCodeChange,
  city, handleCityChange,
  country, setCountry,
  editingField, focusField, blurField,
  copyToClipboard,
  postalLookupLoading,
  showCitySuggestions, citySuggestions, selectCitySuggestion,
  titleRef, priceRef, descRef, cityRef,
}) {
  return (
    <View>
      {/* Item ID */}
      {itemId && (
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.idRow}>
          <Text style={styles.idLabel}>Item ID</Text>
          <Text style={styles.idValue}>{itemId}</Text>
        </Animated.View>
      )}

      {/* Category Picker */}
      <Animated.View entering={FadeInDown.duration(300).delay(100)}>
        <Card shadow="sm" style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldHeaderLeft}>
              <Ionicons name="grid-outline" size={16} color={colors.primary} />
              <Text style={[styles.fieldLabel, { color: colors.primary }]}>Category *</Text>
            </View>
          </View>
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSubcategories={selectedSubcategories}
            onSelectSubcategory={setSelectedSubcategories}
            showAllOption={false}
            multiSelect={false}
          />
        </Card>
      </Animated.View>

      {/* Editable Title */}
      <Animated.View entering={FadeInDown.duration(300).delay(150)}>
        <Card shadow="sm" style={[styles.fieldCard, editingField === 'title' && styles.fieldCardActive]}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldHeaderLeft}>
              <Ionicons name="text-outline" size={16} color={editingField === 'title' ? colors.primary : colors.textTertiary} />
              <Text style={[styles.fieldLabel, editingField === 'title' && styles.fieldLabelActive]}>Title</Text>
            </View>
            <TouchableOpacity onPress={() => focusField('title')} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={16} color={editingField === 'title' ? colors.primary : colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <TextInput
            ref={titleRef}
            style={[styles.titleInput, { minHeight: 40 }]}
            value={title}
            onChangeText={setTitle}
            onFocus={() => focusField('title')}
            onBlur={blurField}
            placeholder="Enter title..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="next"
            onSubmitEditing={() => focusField('price')}
          />
        </Card>
      </Animated.View>

      {/* Editable Price */}
      <Animated.View entering={FadeInDown.duration(300).delay(200)}>
        <Card shadow="sm" style={[styles.fieldCard, editingField === 'price' && styles.fieldCardActive]}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldHeaderLeft}>
              <Ionicons name="pricetag-outline" size={16} color={editingField === 'price' ? colors.primary : colors.textTertiary} />
              <Text style={[styles.fieldLabel, editingField === 'price' && styles.fieldLabelActive]}>Price</Text>
            </View>
            <TouchableOpacity onPress={() => focusField('price')} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={16} color={editingField === 'price' ? colors.primary : colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <TextInput
            ref={priceRef}
            style={[styles.priceInput, { minHeight: 50 }]}
            value={price}
            onChangeText={setPrice}
            onFocus={() => focusField('price')}
            onBlur={blurField}
            placeholder="Enter price..."
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => focusField('description')}
          />
        </Card>
      </Animated.View>

      {/* Editable Description */}
      <Animated.View entering={FadeInDown.duration(300).delay(300)}>
        <Card shadow="sm" style={[styles.fieldCard, editingField === 'description' && styles.fieldCardActive]}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldHeaderLeft}>
              <Ionicons name="document-text-outline" size={16} color={editingField === 'description' ? colors.primary : colors.textTertiary} />
              <Text style={[styles.fieldLabel, editingField === 'description' && styles.fieldLabelActive]}>
                Description
              </Text>
            </View>
            <View style={styles.fieldHeaderRight}>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => focusField('description')} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={16} color={editingField === 'description' ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            ref={descRef}
            style={[styles.descriptionInput, { minHeight: 120 }]}
            value={description}
            onChangeText={setDescription}
            onFocus={() => focusField('description')}
            onBlur={blurField}
            placeholder="Enter description..."
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </Card>
      </Animated.View>

      {/* Structured Address Inputs */}
      <Animated.View entering={FadeInDown.duration(300).delay(350)}>
        <Card shadow="sm" style={styles.fieldCard}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldHeaderLeft}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.fieldLabel, { color: colors.primary }]}>Pickup Address *</Text>
            </View>
          </View>

          <View style={styles.addressGrid}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Street & Number</Text>
              <TextInput
                style={[styles.smallInput, editingField === 'street' && styles.inputActive]}
                value={streetName}
                onChangeText={setStreetName}
                onFocus={() => focusField('street')}
                onBlur={blurField}
                placeholder="e.g. Hauptstraße 12"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>
                Postal Code {postalLookupLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </Text>
              <TextInput
                style={[styles.smallInput, editingField === 'postal' && styles.inputActive]}
                value={postalCode}
                onChangeText={handlePostalCodeChange}
                onFocus={() => focusField('postal')}
                onBlur={blurField}
                placeholder="10115"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <View style={styles.addressGrid}>
            <View style={[styles.inputGroup, { position: 'relative', zIndex: 10 }]}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                ref={cityRef}
                style={[styles.smallInput, editingField === 'city' && styles.inputActive]}
                value={city}
                onChangeText={handleCityChange}
                onFocus={() => focusField('city')}
                onBlur={() => {
                  blurField();
                  setTimeout(() => blurField(), 200);
                }}
                placeholder="Berlin"
                placeholderTextColor={colors.textTertiary}
                autoCorrect={false}
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {citySuggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={`${item.city}-${idx}`}
                      style={[
                        styles.suggestionItem,
                        idx === citySuggestions.length - 1 && styles.suggestionItemLast,
                      ]}
                      onPress={() => selectCitySuggestion(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={12} color={colors.primary} />
                      <Text style={styles.suggestionCity}>{item.city}</Text>
                      <Text style={styles.suggestionPostal}>{item.postal_code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                style={[styles.smallInput, editingField === 'country' && styles.inputActive]}
                value={country}
                onChangeText={setCountry}
                onFocus={() => focusField('country')}
                onBlur={blurField}
                placeholder="Germany"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>
          <Text style={styles.hintText}>
            💡 Enter postal code to auto-fill city, or type city name for suggestions
          </Text>
        </Card>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  idLabel: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  idValue: {
    ...typography.small,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  fieldCard: {
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fieldHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.overline,
    color: colors.textTertiary,
  },
  fieldLabelActive: {
    color: colors.primary,
  },
  fieldHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copyBtn: {
    padding: spacing.xs,
  },
  titleInput: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  priceInput: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  descriptionInput: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    minHeight: 120,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },
  addressGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    ...typography.overline,
    color: colors.textTertiary,
    marginBottom: 4,
    fontSize: 10,
  },
  smallInput: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.gray50,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  hintText: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    marginTop: 2,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: 6,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionCity: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    fontSize: 13,
  },
  suggestionPostal: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
  },
});
