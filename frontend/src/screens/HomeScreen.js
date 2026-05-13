import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  ScrollView, Alert, Modal, StatusBar, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../supabase';
import ImageCropper from '../components/ImageCropper';
import Header from '../components/Header';
import Button from '../components/Button';
import CategoryScroll from '../components/CategoryScroll';
import EmptyState from '../components/EmptyState';
import MenuDrawer from '../components/MenuDrawer';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { colors, typography, spacing, radius, shadows } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.61:8000/api/analyze-image';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROOMS = [
  { label: 'Kitchen', icon: 'restaurant-outline' },
  { label: 'Bathroom', icon: 'water-outline' },
  { label: 'Bedroom', icon: 'bed-outline' },
  { label: 'Living Room', icon: 'tv-outline' },
  { label: 'Garage', icon: 'car-outline' },
  { label: 'Electrical', icon: 'flash-outline' },
  { label: 'Other', icon: 'apps-outline' },
];

const THUMB_SIZE = (SCREEN_WIDTH - spacing.page * 2 - spacing.md * 2) / 3;

export default function HomeScreen({ navigation }) {
  const [imageUris, setImageUris] = useState([]);
  const [pendingUri, setPendingUri] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('Other');
  const [menuVisible, setMenuVisible] = useState(false);

  // Handle reset param from ResultScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find(r => r.name === 'Scan')?.params;
      if (params?.reset) {
        setImageUris([]);
        setResult(null);
        setLoading(false);
        navigation.setParams({ reset: undefined });
      }
    });
    return unsubscribe;
  }, [navigation]);

  const getSessionUserId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  }, []);

  const takePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan items.');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      setPendingUri(pickerResult.assets[0].uri);
      setShowCropper(true);
    }
  }, []);

  const pickImage = useCallback(async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!pickerResult.canceled) {
      const newUris = pickerResult.assets.map(a => a.uri);
      setImageUris(prev => [...prev, ...newUris]);
    }
  }, []);

  const handleCropComplete = useCallback((croppedUri) => {
    setShowCropper(false);
    setPendingUri(null);
    setImageUris(prev => [...prev, croppedUri]);
  }, []);

  const handleCropRetake = useCallback(() => {
    setShowCropper(false);
    setPendingUri(null);
  }, []);

  const removeImage = useCallback((index) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  }, []);

  const analyzeSingleImage = useCallback(async (imageUri, uid) => {
    const formData = new FormData();
    if (imageUri.startsWith('blob:') || imageUri.startsWith('data:')) {
      const blobResp = await fetch(imageUri);
      const blob = await blobResp.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
    } else {
      formData.append('file', { uri: imageUri, name: 'photo.jpg', type: 'image/jpeg' });
    }
    formData.append('room', selectedRoom);
    if (uid) formData.append('user_id', uid);

    const response = await fetch(API_URL, { method: 'POST', body: formData });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return await response.json();
  }, [selectedRoom]);

  // Analyze all photos as ONE item
  const analyzeAsOneItem = useCallback(async () => {
    if (imageUris.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo first.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const uid = await getSessionUserId();
      const data = await analyzeSingleImage(imageUris[0], uid);
      setResult(data);
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [imageUris, analyzeSingleImage, getSessionUserId]);

  // Analyze each photo as a SEPARATE item
  const analyzeAsSeparateItems = useCallback(async () => {
    if (imageUris.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo first.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const uid = await getSessionUserId();
      const results = [];
      for (let i = 0; i < imageUris.length; i++) {
        try {
          const data = await analyzeSingleImage(imageUris[i], uid);
          results.push(data);
        } catch (err) {
          console.error(`Failed to analyze photo ${i + 1}:`, err);
        }
      }
      if (results.length === 0) {
        Alert.alert('Analysis Failed', 'Could not analyze any photos.');
      } else {
        setResult({ type: 'multiple', items: results });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [imageUris, analyzeSingleImage, getSessionUserId]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const handleMenuNavigate = useCallback((route) => {
    setMenuVisible(false);
    if (route === 'My Items') {
      navigation.navigate('My Items');
    }
  }, [navigation]);

  const handleReset = useCallback(() => {
    setImageUris([]);
    setResult(null);
  }, []);

  const roomCategories = ROOMS.map(r => r.label);

  return (
    <View style={styles.container}>
      <Header
        title="List It Fast"
        subtitle="Scan & sell in seconds"
        showMenu
        onMenuPress={() => setMenuVisible(true)}
      />

      <View style={styles.content}>
        {/* Empty State - No Images */}
        {imageUris.length === 0 && !loading && !result && (
          <Animated.ScrollView
            entering={FadeInUp.duration(400)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Room Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Room / Section</Text>
              <CategoryScroll
                categories={roomCategories}
                selectedCategory={selectedRoom}
                onSelect={setSelectedRoom}
                showAllOption={false}
              />
            </View>

            {/* Empty State Illustration */}
            <EmptyState
              icon="scan-outline"
              title="Ready to sell?"
              subtitle="Take photos or pick from gallery to generate a listing with AI"
              iconBgColor={colors.infoLight}
              iconColor={colors.primary}
            />

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="Take Photo"
                onPress={takePhoto}
                variant="primary"
                icon="camera"
                fullWidth
                size="large"
              />
              <View style={styles.buttonDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <Button
                title="Choose from Gallery"
                onPress={pickImage}
                variant="secondary"
                icon="images"
                fullWidth
                size="large"
              />
            </View>
          </Animated.ScrollView>
        )}

        {/* Photo Gallery + Analyze */}
        {imageUris.length > 0 && !result && (
          <Animated.ScrollView
            entering={FadeInUp.duration(400)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Room Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Room / Section</Text>
              <CategoryScroll
                categories={roomCategories}
                selectedCategory={selectedRoom}
                onSelect={setSelectedRoom}
                showAllOption={false}
              />
            </View>

            {/* Photo Gallery Header */}
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>
                Photos ({imageUris.length})
              </Text>
              <View style={styles.galleryActions}>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={18} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage} activeOpacity={0.7}>
                  <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Photo Grid */}
            <View style={styles.photoGrid}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.photoThumbContainer}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Main</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Add More Placeholder */}
              <TouchableOpacity
                style={styles.addMoreThumb}
                onPress={takePhoto}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={32} color={colors.textTertiary} />
                <Text style={styles.addMoreText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {loading && (
              <View style={styles.analyzingContainer}>
                <LoadingOverlay message="AI is analyzing..." />
              </View>
            )}

            {/* Action Buttons */}
            {!loading && (
              <View style={styles.analyzeActions}>
                {imageUris.length === 1 ? (
                  <Button
                    title="Analyze Photo"
                    onPress={analyzeAsOneItem}
                    variant="primary"
                    icon="sparkles"
                    fullWidth
                    size="large"
                  />
                ) : (
                  <>
                    <Button
                      title="Same Item — Multi-Angle"
                      onPress={analyzeAsOneItem}
                      variant="primary"
                      icon="sparkles"
                      fullWidth
                      size="large"
                    />
                    <View style={styles.buttonGap} />
                    <Button
                      title="Different Items — Analyze Separately"
                      onPress={analyzeAsSeparateItems}
                      variant="dark"
                      icon="copy-outline"
                      fullWidth
                      size="large"
                    />
                  </>
                )}
                <View style={styles.buttonGap} />
                <Button
                  title="Clear All & Start Over"
                  onPress={handleReset}
                  variant="secondary"
                  icon="trash"
                  fullWidth
                  size="medium"
                />
              </View>
            )}
          </Animated.ScrollView>
        )}

        {/* Analysis Results - Single Item */}
        {result && !loading && result.type !== 'multiple' && (
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.resultPreview}
          >
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>{result.title}</Text>
              <Text style={styles.successPrice}>{result.price}</Text>
              <Text style={styles.successSubtitle}>
                {imageUris.length} photo{imageUris.length > 1 ? 's' : ''} • AI analysis complete
              </Text>
            </View>
            <Button
              title="View & Edit Details"
              onPress={() => navigation.navigate('Result', {
                result,
                imageUris,
                room: selectedRoom,
              })}
              variant="primary"
              icon="document-text"
              fullWidth
              size="large"
            />
            <View style={styles.buttonGap} />
            <Button
              title="Scan Another Item"
              onPress={handleReset}
              variant="secondary"
              icon="camera"
              fullWidth
              size="large"
            />
          </Animated.View>
        )}

        {/* Analysis Results - Multiple Items */}
        {result && !loading && result.type === 'multiple' && (
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.resultPreview}
          >
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-done-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>{result.items.length} Items Analyzed</Text>
              <Text style={styles.successSubtitle}>
                Each photo was analyzed as a separate item
              </Text>
            </View>
            <ScrollView style={styles.multiResultList} showsVerticalScrollIndicator={false}>
              {result.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.multiResultCard}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                  activeOpacity={0.7}
                >
                  <View style={styles.multiResultInfo}>
                    <Text style={styles.multiResultTitle}>{item.title}</Text>
                    <Text style={styles.multiResultPrice}>{item.price}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.buttonGap} />
            <Button
              title="Scan Another Item"
              onPress={handleReset}
              variant="secondary"
              icon="camera"
              fullWidth
              size="large"
            />
          </Animated.View>
        )}
      </View>

      {/* Image Cropper Modal */}
      <Modal visible={showCropper} animationType="slide" presentationStyle="fullScreen">
        {pendingUri && (
          <ImageCropper
            imageUri={pendingUri}
            onCrop={handleCropComplete}
            onRetake={handleCropRetake}
          />
        )}
      </Modal>

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
        currentRoute="Scan"
        onLogout={handleLogout}
      />

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  actions: {
    paddingBottom: spacing.xl,
  },
  buttonDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  // Gallery
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  galleryTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  galleryActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.infoLight,
  },
  addPhotoText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  photoThumbContainer: {
    position: 'relative',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    resizeMode: 'cover',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  addMoreThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  addMoreText: {
    ...typography.overline,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Analyzing
  analyzingContainer: {
    marginBottom: spacing.xl,
  },
  // Analyze Actions
  analyzeActions: {
    paddingBottom: spacing.xl,
  },
  // Result Preview Section
  resultPreview: {
    flex: 1,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    justifyContent: 'center',
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    ...typography.small,
    color: colors.textTertiary,
  },
  buttonGap: {
    height: spacing.md,
  },
  // Multi-Result List
  multiResultList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  multiResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  multiResultInfo: {
    flex: 1,
  },
  multiResultTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  multiResultPrice: {
    ...typography.small,
    fontWeight: '800',
    color: colors.accent,
  },
});
