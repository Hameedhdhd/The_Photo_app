import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TextInput,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from '../utils/reanimated-compat';
import { supabase } from '../../supabase';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageToggle from '../components/LanguageToggle';
import CategoryScroll from '../components/CategoryScroll';
import { colors, typography, spacing, radius, shadows } from '../theme';

const ROOMS = [
  'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Garage', 'Office', 'Other'
];

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.61:8000/api/analyze-image').replace('/api/analyze-image', '');

// Fetch formatted description from backend (single source of truth)
async function fetchFormattedDescription(title, descDe, descEn, extraData = {}, category = '', condition = '') {
  try {
    const res = await fetch(`${API_BASE}/api/format-description`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description_de: descDe, description_en: descEn,
        specs: extraData.specs, programs_de: extraData.programs_de,
        programs_en: extraData.programs_en, features_de: extraData.features_de,
        features_en: extraData.features_en, condition, category,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.formatted_description;
    }
  } catch (e) { console.error('Format description error:', e); }
  return null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.5;

export default function ResultScreen({ route, navigation }) {
  const { result, imageUris, room } = route.params;
  const photos = imageUris || [];

  const [title, setTitle] = useState(result?.title || '');
  const [descriptionDe, setDescriptionDe] = useState(result?.description_de || '');
  const [descriptionEn, setDescriptionEn] = useState(result?.description_en || '');
  const [price, setPrice] = useState(result?.price || '');
  const [lang, setLang] = useState('de');
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [roomValue, setRoomValue] = useState(room || result?.room || 'Other');
  const [formattedDesc, setFormattedDesc] = useState(result?.formatted_description || '');
  const [condition, setCondition] = useState('');
  const extraData = result?.extra_data || {};

  const CONDITIONS = [
    { value: '', label: 'Not specified', color: colors.gray300 },
    { value: 'Neuwertig', label: '🟢 Neuwertig / Like New', color: '#22c55e' },
    { value: 'Sehr Gut', label: '🟢 Sehr Gut / Very Good', color: '#15803d' },
    { value: 'Gut', label: '🔵 Gut / Good', color: '#3b82f6' },
    { value: 'Fair', label: '🟡 Akzeptabel / Fair', color: '#eab308' },
    { value: 'Defekt', label: '🔴 Defekt / For Part', color: '#ef4444' },
  ];

  const titleRef = useRef(null);
  const descRef = useRef(null);
  const priceRef = useRef(null);

  const itemId = result?.item_id || result?.id;
  const currentDescription = lang === 'en' ? descriptionEn : descriptionDe;
  const setCurrentDescription = lang === 'en' ? setDescriptionEn : setDescriptionDe;

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updateData = {
        title,
        price,
        room: roomValue,
        description_de: descriptionDe,
        description_en: descriptionEn,
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
      setIsFavorite(!newValue);
    }
  }, [isFavorite, itemId]);

  // Fetch formatted description from backend whenever fields change
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const formatted = await fetchFormattedDescription(title, descriptionDe, descriptionEn, extraData, result?.category, condition);
      if (formatted) setFormattedDesc(formatted);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, descriptionDe, descriptionEn, condition]);

  const copyPreview = useCallback(async () => {
    const text = formattedDesc;
    if (!text) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text);
      } else {
        const Clipboard = require('expo-clipboard').default;
        await Clipboard.setStringAsync(text);
      }
      Alert.alert('Copied!', 'Kleinanzeigen description copied to clipboard.');
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  }, [formattedDesc]);

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

  const handleDone = useCallback(() => {
    // Navigate back to scan screen with reset
    navigation.navigate('Main', { screen: 'Scan', params: { reset: true } });
  }, [navigation]);

  const focusField = useCallback((field) => {
    setEditingField(field);
    if (field === 'title') titleRef.current?.focus();
    else if (field === 'price') priceRef.current?.focus();
    else if (field === 'description') descRef.current?.focus();
  }, []);

  const blurField = useCallback(() => {
    setEditingField(null);
  }, []);

  const Container = Platform.OS === 'web' ? View : KeyboardAvoidingView;
  const containerProps = Platform.OS === 'web'
    ? { style: styles.container }
    : { style: styles.container, behavior: 'padding', keyboardVerticalOffset: 90 };

  return (
    <Container {...containerProps}>
      <Header
        title="Listing Details"
        subtitle="Review & edit your item"
        leftAction
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightAction
        rightIcon="checkmark-done"
        onRightPress={handleDone}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Gallery */}
        {photos.length > 0 && (
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
        )}

        {/* Item ID */}
        {itemId && (
          <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.idRow}>
            <Text style={styles.idLabel}>Item ID</Text>
            <Text style={styles.idValue}>{itemId}</Text>
          </Animated.View>
        )}

        {/* Language Toggle */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.langSection}>
          <LanguageToggle value={lang} onChange={setLang} />
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
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              onFocus={() => setEditingField('title')}
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
            />
          </Card>
        </Animated.View>

        {/* Room Selector */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <Card shadow="sm" style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>Room / Section</Text>
              </View>
            </View>
            <CategoryScroll
              categories={ROOMS}
              selectedCategory={roomValue}
              onSelect={setRoomValue}
              showAllOption={false}
            />
          </Card>
        </Animated.View>

        {/* Condition Picker */}
        <Animated.View entering={FadeInDown.duration(300).delay(275)}>
          <Card shadow="sm" style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldHeaderLeft}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>Condition</Text>
              </View>
            </View>
            <View style={styles.conditionGrid}>
              {CONDITIONS.filter(c => c.value).map(c => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.conditionChip, condition === c.value && { backgroundColor: c.color, borderColor: c.color }]}
                  onPress={() => setCondition(condition === c.value ? '' : c.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.conditionChipText, condition === c.value && styles.conditionChipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Description (Kleinanzeigen formatted) */}
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
                <TouchableOpacity onPress={copyPreview} style={styles.copyBtn} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => focusField('description')} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={16} color={editingField === 'description' ? colors.primary : colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.formattedDescription}>{formattedDesc || 'Loading...'}</Text>
            {editingField === 'description' && (
              <View style={styles.editOverlay}>
                <TextInput
                  ref={descRef}
                  style={styles.descriptionInput}
                  value={currentDescription}
                  onChangeText={setCurrentDescription}
                  onFocus={() => setEditingField('description')}
                  onBlur={blurField}
                  placeholder={`Enter ${lang === 'en' ? 'English' : 'German'} description...`}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.editHint}>Editing {lang.toUpperCase()} description — changes auto-format</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Action Buttons */}
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
          <View style={styles.buttonGap} />
          <Button
            title="Done — View My Items"
            onPress={() => navigation.navigate('Main', { screen: 'My Items' })}
            variant="dark"
            icon="checkmark-done"
            fullWidth
            size="large"
          />
        </Animated.View>
      </ScrollView>
    </Container>
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
    paddingBottom: spacing.xxxl + 20,
  },
  // Photo Section
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
  // ID Row
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  // Formatted Description Display
  formattedDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    whiteSpace: 'pre-wrap',
    backgroundColor: '#fafafa',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editOverlay: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: spacing.sm,
  },
  editHint: {
    ...typography.small,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
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
  previewBox: {
    backgroundColor: '#fafafa',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    whiteSpace: 'pre-wrap',
  },
  previewTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  previewMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewDesc: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  previewDisclaimer: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: spacing.md,
  },
  // Condition Picker
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  conditionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  conditionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conditionChipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  conditionChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  // Actions
  actions: {
    marginTop: spacing.xl,
  },
  buttonGap: {
    height: spacing.md,
  },
});

