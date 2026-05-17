import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Alert, Modal, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabase';
import ImageCropper from '../components/ImageCropper';
import Header from '../components/Header';
import MenuDrawer from '../components/MenuDrawer';
import { colors } from '../theme';
import { optimizeImage } from '../utils/imageOptimizer';
import { CATEGORIES } from '../constants/categories';

// New Sub-components
import HomeEmptyState from '../components/home/HomeEmptyState';
import HomeGallery from '../components/home/HomeGallery';
import HomeResultPreview from '../components/home/HomeResultPreview';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function HomeScreen({ navigation }) {
  const [imageUris, setImageUris] = useState([]);
  const [pendingUri, setPendingUri] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('Other');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  // Handle reset param from ResultScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState()?.routes?.find(r => r.name === 'Scan Items')?.params;
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      Alert.alert('Login Required', 'You must log in to scan and list items.');
      return;
    }
    
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
    try {
      console.log('[HomeScreen] Optimizing image before upload...');
      const optimized = await optimizeImage(imageUri, 'medium');
      const optimizedUri = optimized.uri;
      
      const formData = new FormData();
      if (optimizedUri.startsWith('blob:') || optimizedUri.startsWith('data:')) {
        const blobResp = await fetch(optimizedUri);
        const blob = await blobResp.blob();
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        formData.append('file', { uri: optimizedUri, name: 'photo.jpg', type: 'image/jpeg' });
      }
      formData.append('room', selectedRoom);
      if (uid) formData.append('user_id', uid);

      const response = await fetch(`${API_BASE_URL}/api/analyze-image`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('[HomeScreen] Image optimization failed:', error);
      throw error;
    }
  }, [selectedRoom]);

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

  const handleAddManually = useCallback(() => {
    navigation.navigate('Result', {
      result: { 
        title: '', 
        description: '', 
        price: '', 
        item_id: null,
        category: selectedRoom,
        subcategory: selectedSubcategories.length > 0 ? selectedSubcategories[0] : null
      },
      imageUris: [...imageUris],
      room: selectedRoom,
      isManual: true,
    });
  }, [navigation, imageUris, selectedRoom, selectedSubcategories]);

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

  return (
    <View style={styles.container}>
      <Header
        title="List It Fast"
        subtitle="Scan & sell in seconds"
        showMenu
        onMenuPress={() => setMenuVisible(true)}
      />

      <View style={styles.content}>
        {imageUris.length === 0 && !loading && !result ? (
          <HomeEmptyState
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            selectedSubcategories={selectedSubcategories}
            setSelectedSubcategories={setSelectedSubcategories}
            takePhoto={takePhoto}
            pickImage={pickImage}
            handleAddManually={handleAddManually}
          />
        ) : imageUris.length > 0 && !result ? (
          <HomeGallery
            imageUris={imageUris}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            selectedSubcategories={selectedSubcategories}
            setSelectedSubcategories={setSelectedSubcategories}
            takePhoto={takePhoto}
            pickImage={pickImage}
            removeImage={removeImage}
            loading={loading}
            analyzeAsOneItem={analyzeAsOneItem}
            analyzeAsSeparateItems={analyzeAsSeparateItems}
            handleAddManually={handleAddManually}
            handleReset={handleReset}
          />
        ) : (
          <HomeResultPreview
            result={result}
            loading={loading}
            imageUris={imageUris}
            selectedRoom={selectedRoom}
            selectedSubcategories={selectedSubcategories}
            navigation={navigation}
            handleReset={handleReset}
          />
        )}
      </View>

      <Modal visible={showCropper} animationType="slide" presentationStyle="fullScreen">
        {pendingUri && (
          <ImageCropper
            imageUri={pendingUri}
            onCrop={handleCropComplete}
            onRetake={handleCropRetake}
          />
        )}
      </Modal>

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
        currentRoute="Scan Items"
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
});
