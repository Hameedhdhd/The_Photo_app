import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { colors, spacing } from '../theme';
import { supabase } from '../../supabase';

// New Sub-components
import ResultImageGallery from '../components/result/ResultImageGallery';
import ResultForm from '../components/result/ResultForm';

export default function ResultScreen({ route, navigation }) {
  const { result, imageUris, room } = route.params;
  const photos = imageUris || [];

  const [title, setTitle] = useState(result?.title || '');
  const [description, setDescription] = useState(result?.description || '');
  const [price, setPrice] = useState(result?.price || '');
  const [selectedCategory, setSelectedCategory] = useState(result?.category || 'Other');
  const [selectedSubcategories, setSelectedSubcategories] = useState(result?.subcategory ? [result.subcategory] : []);
  const [postalCode, setPostalCode] = useState(result?.postalCode || '');
  const [streetName, setStreetName] = useState(result?.streetName || '');
  const [city, setCity] = useState(result?.city || '');
  const [country, setCountry] = useState(result?.country || '');
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [status, setStatus] = useState('listed');

  // German address autocomplete state
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const citySearchTimer = useRef(null);

  const titleRef = useRef(null);
  const priceRef = useRef(null);
  const descRef = useRef(null);
  const cityRef = useRef(null);

  const itemId = result?.item_id || result?.id;

  // Auto-fill city + state when postal code reaches 5 digits
  const handlePostalCodeChange = useCallback(async (text) => {
    setPostalCode(text);
    const clean = text.replace(/\D/g, '');
    if (clean.length === 5) {
      setPostalLookupLoading(true);
      try {
        const { data, error } = await supabase
          .from('german_addresses')
          .select('city, state')
          .eq('postal_code', clean)
          .limit(1)
          .single();
        if (data && !error) {
          setCity(data.city);
          setCountry('Germany');
        }
      } catch (_) {
        // silently ignore
      } finally {
        setPostalLookupLoading(false);
      }
    }
  }, []);

  // Debounced city search for autocomplete dropdown
  const handleCityChange = useCallback((text) => {
    setCity(text);
    setShowCitySuggestions(false);
    if (citySearchTimer.current) clearTimeout(citySearchTimer.current);

    if (text.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    citySearchTimer.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('german_addresses')
          .select('city, postal_code, state')
          .ilike('city', `${text.trim()}%`)
          .order('city')
          .limit(6);
        if (data && data.length > 0) {
          const seen = new Set();
          const unique = data.filter(r => {
            if (seen.has(r.city)) return false;
            seen.add(r.city);
            return true;
          });
          setCitySuggestions(unique);
          setShowCitySuggestions(true);
        } else {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        }
      } catch (_) {
        setCitySuggestions([]);
      }
    }, 300);
  }, []);

  const selectCitySuggestion = useCallback((item) => {
    setCity(item.city);
    setPostalCode(prev => prev || item.postal_code);
    setCountry('Germany');
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setEditingField(null);
  }, []);

  useEffect(() => {
    return () => {
      if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Missing Fields', 'Title and Price are required.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.id) {
        Alert.alert('Login Required', 'You must log in to list items.');
        setSaving(false);
        return;
      }
      
      const combinedAddress = `${streetName}, ${postalCode} ${city}, ${country}`.trim();
      const imageUrls = [];
      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        if (uri.startsWith('file:') || uri.startsWith('content:')) {
          const fileName = `${user.id}_${Date.now()}_${i}.jpg`;
          const response = await fetch(uri);
          const blob = await response.blob();
          const { error } = await supabase.storage.from('item_images').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('item_images').getPublicUrl(fileName);
          imageUrls.push(publicUrl);
        } else {
          imageUrls.push(uri);
        }
      }

      const listingData = {
        title: title.trim(),
        price: price.trim(),
        description: (description || '').trim(),
        address: combinedAddress,
        status: status || 'listed',
        user_id: user.id,
        listed_at: new Date().toISOString(),
        category: selectedCategory,
        subcategory: selectedSubcategories.length > 0 ? selectedSubcategories[0] : null,
        room: selectedCategory,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      };

      if (itemId) {
        const { error } = await supabase.from('items').update(listingData).eq('item_id', itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('items').insert([listingData]);
        if (error) throw error;
      }

      Alert.alert('🎉 Listed!', 'Your item is now live!');
      navigation.navigate('Main', { screen: 'Marketplace' });
    } catch (error) {
      Alert.alert('Save Failed', error.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }, [title, price, description, streetName, postalCode, city, country, selectedCategory, status, itemId, navigation, photos]);

  const toggleFavorite = useCallback(async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    try {
      if (itemId) {
        await supabase.from('items').update({ favorite: newValue }).eq('item_id', itemId);
      }
    } catch (err) {
      setIsFavorite(!newValue);
    }
  }, [isFavorite, itemId]);

  const copyToClipboard = useCallback(async () => {
    if (!description) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(description);
      } else {
        const Clipboard = require('expo-clipboard').default;
        await Clipboard.setStringAsync(description);
      }
      Alert.alert('Copied!', 'Description copied.');
    } catch (err) {}
  }, [description]);

  const handleDone = useCallback(() => {
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

  return (
    <View style={styles.container}>
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'none'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ResultImageGallery
            photos={photos}
            activePhotoIndex={activePhotoIndex}
            setActivePhotoIndex={setActivePhotoIndex}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />

          <ResultForm
            itemId={itemId}
            title={title} setTitle={setTitle}
            price={price} setPrice={setPrice}
            description={description} setDescription={setDescription}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedSubcategories={selectedSubcategories} setSelectedSubcategories={setSelectedSubcategories}
            streetName={streetName} setStreetName={setStreetName}
            postalCode={postalCode} handlePostalCodeChange={handlePostalCodeChange}
            city={city} handleCityChange={handleCityChange}
            country={country} setCountry={setCountry}
            editingField={editingField} focusField={focusField} blurField={blurField}
            copyToClipboard={copyToClipboard}
            postalLookupLoading={postalLookupLoading}
            showCitySuggestions={showCitySuggestions}
            citySuggestions={citySuggestions}
            selectCitySuggestion={selectCitySuggestion}
            titleRef={titleRef}
            priceRef={priceRef}
            descRef={descRef}
            cityRef={cityRef}
          />

          <View style={styles.actions}>
            <Button
              title="List Item"
              onPress={handleSave}
              loading={saving}
              variant="primary"
              icon="checkmark-circle"
              fullWidth
              size="large"
            />
            <View style={styles.buttonGap} />
            <Button
              title="Done — Back to Scanner"
              onPress={handleDone}
              variant="dark"
              icon="checkmark-done"
              fullWidth
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl + 100,
  },
  actions: {
    marginTop: spacing.xl,
  },
  buttonGap: {
    height: spacing.md,
  },
});
