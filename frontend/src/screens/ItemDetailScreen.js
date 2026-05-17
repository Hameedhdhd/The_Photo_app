import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TextInput,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../supabase';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageToggle from '../components/LanguageToggle';
import CategoryPicker from '../components/CategoryPicker';
import { colors, typography, spacing, radius, shadows } from '../theme';
import { CATEGORIES } from '../constants/categories';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;

  const [title, setTitle] = useState(item?.title || '');
  const [descriptionDe, setDescriptionDe] = useState(item?.description_de || '');
  const [descriptionEn, setDescriptionEn] = useState(item?.description_en || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || '');
  const [lang, setLang] = useState('de');
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item?.favorite || false);
  const [roomValue, setRoomValue] = useState(item?.room || 'Other');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const titleRef = useRef(null);
  const descRef = useRef(null);
  const priceRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.error('Error getting user:', err);
      } finally {
        setLoadingUser(false);
      }
    };
    getUser();
  }, []);

  const itemId = item?.item_id || item?.id;
  const imageUrl = item?.image_url;
  const category = item?.category;
  // Only mark as owner once user loads AND item has a user_id. Avoids null === null = true.
  const isOwner = !loadingUser && currentUserId !== null && currentUserId === item?.user_id;
  const hasSingleDescription = !!description;

  const currentDescription = hasSingleDescription ? description : (lang === 'en' ? descriptionEn : descriptionDe);
  const setCurrentDescription = hasSingleDescription ? setDescription : (lang === 'en' ? setDescriptionEn : setDescriptionDe);

  const toggleFavorite = useCallback(async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    try {
      if (itemId) {
        await supabase
          .from('items')
          .update({ favorite: newValue })
          .eq('item_id', itemId);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      setIsFavorite(!newValue); // revert
    }
  }, [isFavorite, itemId]);

  const handleSave = useCallback(async () => {
    if (!isOwner) return;
    setSaving(true);
    try {
      const updateData = {
        title,
        price,
        room: roomValue,
        description_de: descriptionDe,
        description_en: descriptionEn,
        description: description,
      };

      if (itemId) {
        const { error } = await supabase
          .from('items')
          .update(updateData)
          .eq('item_id', itemId);

        if (error) throw error;
      }

      Alert.alert('Saved!', 'Your changes have been saved.');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, price, descriptionDe, descriptionEn, roomValue, itemId]);

  const copyToClipboard = useCallback(async () => {
    const text = currentDescription;
    if (!text) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        const Clipboard = require('expo-clipboard').default;
        await Clipboard.setStringAsync(text);
      }
      Alert.alert('Copied!', 'Description copied to clipboard.');
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }, [currentDescription]);

  const focusField = useCallback((field) => {
    if (!isOwner) return;
    setEditingField(field);
    if (field === 'title') titleRef.current?.focus();
    else if (field === 'price') priceRef.current?.focus();
    else if (field === 'description') descRef.current?.focus();
  }, [isOwner]);

  const blurField = useCallback(() => {
    setEditingField(null);
  }, []);

  const handleMessageSeller = useCallback(() => {
    if (!item?.user_id || !currentUserId) return;
    
    // Generate chat ID from user IDs (sorted)
    const sortedIds = [currentUserId, item.user_id].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}_${item.item_id}`;
    
    navigation.navigate('ChatDetail', {
      chatId,
      otherUserId: item.user_id,
      item,
    });
  }, [item, currentUserId, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        title="Item Details"
        subtitle={item?.title || 'View & edit'}
        leftAction
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightAction
        rightIcon={isFavorite ? 'heart' : 'heart-outline'}
        onRightPress={toggleFavorite}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image */}
        {imageUrl && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.imageSection}>
            <Image source={{ uri: imageUrl }} style={styles.mainImage} />
            <TouchableOpacity
              style={styles.favBadge}
              onPress={toggleFavorite}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? colors.favorite : colors.white}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Item ID & Category */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.metaRow}>
          {itemId && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>ID: {itemId}</Text>
            </View>
          )}
          {category && (
            <View style={[styles.metaChip, styles.metaChipCategory]}>
              <Text style={[styles.metaChipText, styles.metaChipCategoryText]}>{category}</Text>
            </View>
          )}
        </Animated.View>

        {/* Language Toggle (only show if using old bilingual descriptions) */}
        {!hasSingleDescription && (
          <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.langSection}>
            <LanguageToggle value={lang} onChange={setLang} />
          </Animated.View>
        )}

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
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setEditingField('title')}
              onBlur={blurField}
              placeholder="Enter title..."
              placeholderTextColor={colors.textTertiary}
              returnKeyType="next"
              onSubmitEditing={() => focusField('price')}
              editable={isOwner}
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
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              onFocus={() => setEditingField('price')}
              onBlur={blurField}
              placeholder="Enter price..."
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => focusField('description')}
              editable={isOwner}
            />
          </Card>
        </Animated.View>

        {/* Category Selector */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <Card shadow="sm" style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>Category</Text>
              </View>
            </View>
            <CategoryPicker
              selectedCategory={roomValue}
              onSelectCategory={setRoomValue}
              selectedSubcategories={[]}
              onSelectSubcategory={() => {}}
              showAllOption={false}
            />
          </Card>
        </Animated.View>

        {/* Editable Description with Copy */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <Card shadow="sm" style={[styles.fieldCard, editingField === 'description' && styles.fieldCardActive]}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <Ionicons name="document-text-outline" size={16} color={editingField === 'description' ? colors.primary : colors.textTertiary} />
                <Text style={[styles.fieldLabel, editingField === 'description' && styles.fieldLabelActive]}>
                  Description ({lang.toUpperCase()})
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
              style={styles.descriptionInput}
              value={currentDescription}
              onChangeText={setCurrentDescription}
              onFocus={() => setEditingField('description')}
              onBlur={blurField}
              placeholder={hasSingleDescription ? "Item description..." : `Enter ${lang === 'en' ? 'English' : 'German'} description...`}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              editable={isOwner}
            />
          </Card>
        </Animated.View>

        {/* Save Button (Owner Only) */}
        {isOwner && (
          <Animated.View entering={FadeInDown.duration(300).delay(350)} style={styles.actions}>
            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              variant="primary"
              icon="checkmark-circle"
              fullWidth
              size="large"
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Message Seller Footer (Non-Owner Only) */}
      {!isOwner && !loadingUser && currentUserId && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.footer}>
          <Button
            title="Message Seller"
            onPress={handleMessageSeller}
            variant="primary"
            icon="chatbubbles-outline"
            fullWidth
            size="large"
          />
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl + 100, // Increased padding to ensure end of page is visible
  },
  // Image
  imageSection: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  mainImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.xl,
    resizeMode: 'cover',
  },
  favBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaChip: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  metaChipText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  metaChipCategory: {
    backgroundColor: colors.warningLight,
  },
  metaChipCategoryText: {
    color: '#D97706',
  },
  // Language
  langSection: {
    marginBottom: spacing.lg,
  },
  // Field Cards
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
  fieldHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fieldLabel: {
    ...typography.overline,
    color: colors.textTertiary,
  },
  fieldLabelActive: {
    color: colors.primary,
  },
  copyBtn: {
    padding: spacing.xs,
  },
  // Title Input
  titleInput: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  // Price Input
  priceInput: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
  },
  // Description Input
  descriptionInput: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    minHeight: 120,
    paddingVertical: spacing.xs,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },
  // Actions
  actions: {
    marginTop: spacing.xl,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    ...shadows.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
});
