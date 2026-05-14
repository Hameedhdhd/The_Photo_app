import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  ScrollView, Alert, Modal, StatusBar, Dimensions, RefreshControl
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from '../utils/reanimated-compat';

import { supabase } from '../../supabase';
import { ROOMS, VALID_ROOM_LABELS } from '../constants';
import ImageCropper from '../components/ImageCropper';
import Header from '../components/Header';
import Button from '../components/Button';
import CategoryScroll from '../components/CategoryScroll';
import SearchBar from '../components/SearchBar';
import ListingCard from '../components/ListingCard';
import MenuDrawer from '../components/MenuDrawer';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { colors, typography, spacing, radius, shadows, layout } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.178.61:8000/api/analyze-image';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [imageUris, setImageUris] = useState([]);
  const [pendingUri, setPendingUri] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dashboard data
  const [recentItems, setRecentItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentItems();
  }, []);

  // Handle reset param from ResultScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find(r => r.name === 'Scan')?.params;
      if (params?.reset) {
        setImageUris([]);
        setResult(null);
        setLoading(false);
        navigation.setParams({ reset: undefined });
        fetchRecentItems();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const fetchRecentItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentItems(data || []);
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecentItems();
  }, []);

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

  const uploadAndAnalyze = useCallback(async (uris, uid) => {
    const formData = new FormData();
    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        const blobResp = await fetch(uri);
        const blob = await blobResp.blob();
        const file = new File([blob], `photo_${i}.jpg`, { type: 'image/jpeg' });
        formData.append('files', file);
      } else {
        formData.append('files', { uri, name: `photo_${i}.jpg`, type: 'image/jpeg' });
      }
    }
    formData.append('room', selectedRoom === 'All' ? 'Other' : selectedRoom);
    if (uid) formData.append('user_id', uid);

    const response = await fetch(API_URL, { 
      method: 'POST', 
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }
    return await response.json();
  }, [selectedRoom]);

  const analyzeAsOneItem = useCallback(async () => {
    if (imageUris.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const uid = await getSessionUserId();
      const data = await uploadAndAnalyze(imageUris, uid);
      setResult(data);
    } catch (error) {
      Alert.alert('Analysis Failed', error.message);
    } finally {
      setLoading(false);
    }
  }, [imageUris, uploadAndAnalyze, getSessionUserId]);

  const handleReset = useCallback(() => {
    setImageUris([]);
    setResult(null);
  }, []);

  const roomLabels = ROOMS.map(r => r.label);
  const roomIcons = ROOMS.reduce((acc, r) => ({ ...acc, [r.label]: r.icon }), {});

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        subtitle="Your smart inventory"
        showMenu
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* Main Dashboard Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Search Bar */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your items..."
            showFilter={false}
          />
        </Animated.View>

        {/* 2. Room Categories */}
        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Rooms & Sections</Text>
          <CategoryScroll
            categories={roomLabels}
            selectedCategory={selectedRoom}
            onSelect={setSelectedRoom}
            icons={roomIcons}
          />
        </Animated.View>

        {/* 3. Quick Scan Banner */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <LinearGradient
            colors={[colors.primary, '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanBanner}
          >
            <View style={styles.scanContent}>
              <View style={styles.scanTextWrapper}>
                <Text style={styles.scanTitle}>Scan New Item</Text>
                <Text style={styles.scanSubtitle}>AI will generate everything</Text>
              </View>
              <TouchableOpacity style={styles.scanFab} onPress={takePhoto}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.scanActions}>
              <TouchableOpacity style={styles.scanActionBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={18} color={colors.white} />
                <Text style={styles.scanActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 4. Active Analysis / Photo Gallery (only if photos selected) */}
        {imageUris.length > 0 && !result && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.activeAnalysis}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Selected Photos ({imageUris.length})</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={takePhoto}>
                <Ionicons name="add" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </ScrollView>
            <Button
              title="Analyze with AI"
              onPress={analyzeAsOneItem}
              variant="primary"
              icon="sparkles"
              loading={loading}
              style={styles.analyzeBtn}
            />
          </Animated.View>
        )}

        {/* 5. Analysis Result Preview */}
        {result && !loading && (
          <Animated.View entering={FadeInUp} style={styles.resultCard}>
            <View style={styles.resultInfo}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <View>
                <Text style={styles.resultTitle}>{result.title}</Text>
                <Text style={styles.resultPrice}>{result.price}</Text>
              </View>
            </View>
            <Button
              title="Review Details"
              onPress={() => navigation.navigate('Result', { result, imageUris })}
              variant="secondary"
              size="small"
            />
          </Animated.View>
        )}

        {/* 6. Recent Items Feed */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('My Items')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentGrid}>
            {recentItems.length > 0 ? (
              recentItems.map((item, index) => (
                <ListingCard
                  key={item.item_id || item.id || index.toString()}
                  item={item}
                  index={index}
                  onPress={(i) => navigation.navigate('ItemDetail', { item: i })}
                />
              ))
            ) : (
              <View style={styles.emptyRecent}>
                <Ionicons name="cube-outline" size={40} color={colors.gray200} />
                <Text style={styles.emptyRecentText}>No items yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(route) => {
          setMenuVisible(false);
          navigation.navigate(route);
        }}
        currentRoute="Scan"
        onLogout={() => supabase.auth.signOut()}
      />
      
      {loading && <LoadingOverlay message="AI is analyzing..." />}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  searchSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginLeft: spacing.page,
    marginBottom: spacing.xs,
  },
  scanBanner: {
    marginHorizontal: spacing.page,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.primary,
    marginBottom: spacing.lg,
  },
  scanContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  scanSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scanFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  scanActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: spacing.md,
  },
  scanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  // Active Analysis
  activeAnalysis: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray100,
    marginBottom: spacing.lg,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: spacing.page,
  },
  clearText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
  },
  photoList: {
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  addMoreBtn: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray100,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeBtn: {
    marginHorizontal: spacing.page,
    marginTop: spacing.sm,
  },
  // Result Card
  resultCard: {
    marginHorizontal: spacing.page,
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  resultTitle: {
    fontWeight: '700',
    color: colors.success,
    fontSize: 14,
  },
  resultPrice: {
    fontSize: 12,
    color: colors.success,
    opacity: 0.8,
  },
  // Recent Feed
  recentSection: {
    marginTop: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: spacing.page,
    marginBottom: spacing.sm,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.page,
    justifyContent: 'space-between',
    gap: 0, // Gap can interfere with space-between on wrap
  },
  emptyRecent: {
    width: '100%',
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
});
