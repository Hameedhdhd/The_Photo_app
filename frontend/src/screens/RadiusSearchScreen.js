import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Slider, Alert, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { colors, spacing, radius, typography, shadows } from '../theme';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryPicker from '../components/CategoryPicker';
import { CATEGORIES } from '../constants/categories';

export default function RadiusSearchScreen() {
  const navigation = useNavigation();
  const [latitude, setLatitude] = useState(53.5511);
  const [longitude, setLongitude] = useState(9.9936);
  const [radiusKm, setRadiusKm] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const addressInputRef = useRef(null);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      Alert.alert('Success', `Location set to: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location.');
    }
  };

  const performSearch = useCallback(async () => {
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please set a valid search location.');
      return;
    }

    setLoading(true);
    setResults([]);
    setHasSearched(true);

    try {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      
      let url = `${baseURL}/api/search-radius?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`;
      
      if (selectedCategory !== 'All') {
        url += `&category=${selectedCategory}`;
      }
      if (selectedSubcategories.length > 0) {
        url += `&subcategories=${selectedSubcategories.join(',')}`;
      }
      if (minPrice) {
        url += `&min_price=${minPrice}`;
      }
      if (maxPrice) {
        url += `&max_price=${maxPrice}`;
      }

      console.log('[RadiusSearch] Calling API:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
        console.log('[RadiusSearch] Found', data.length, 'items');
        Alert.alert('Success', `Found ${data.length} items within ${radiusKm}km`);
      } else {
        Alert.alert('Error', data.detail || 'Search failed');
      }
    } catch (error) {
      console.error('[RadiusSearch] Error:', error);
      Alert.alert('Error', 'Could not connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusKm, selectedCategory, selectedSubcategories, minPrice, maxPrice]);

  const navigateToItemDetail = (item) => {
    navigation.navigate('ItemDetail', { item });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#818CF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Radius Search</Text>
              <Text style={styles.headerSub}>Find items near you</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Section */}
        <Card shadow="sm" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Search Location</Text>
          </View>

          <View style={styles.coordsRow}>
            <View style={styles.coordsInput}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude.toString()}
                onChangeText={(text) => setLatitude(parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />
            </View>
            <View style={styles.coordsInput}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude.toString()}
                onChangeText={(text) => setLongitude(parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />
            </View>
          </View>

          <Button
            title="Use My Location"
            onPress={getCurrentLocation}
            variant="secondary"
            icon="locate-outline"
            fullWidth
            size="medium"
          />
        </Card>

        {/* Radius Section */}
        <Card shadow="sm" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="radio-button-off-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Search Radius</Text>
          </View>

          <View style={styles.radiusDisplay}>
            <Text style={styles.radiusValue}>{radiusKm.toFixed(0)} km</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={radiusKm}
            onValueChange={setRadiusKm}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.gray200}
          />

          <View style={styles.rangeLabels}>
            <Text style={styles.rangeLabel}>1 km</Text>
            <Text style={styles.rangeLabel}>100 km</Text>
          </View>
        </Card>

        {/* Category Filter */}
        <Card shadow="sm" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Category</Text>
          </View>

          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSubcategories={selectedSubcategories}
            onSelectSubcategory={setSelectedSubcategories}
            multiSelect={true}
            showAllOption={true}
          />
        </Card>

        {/* Price Filter */}
        <Card shadow="sm" style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Price Range (Optional)</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Text style={styles.label}>Min Price €</Text>
              <TextInput
                style={styles.input}
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
            <View style={styles.priceInput}>
              <Text style={styles.label}>Max Price €</Text>
              <TextInput
                style={styles.input}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="decimal-pad"
                placeholder="∞"
              />
            </View>
          </View>
        </Card>

        {/* Search Button */}
        <Button
          title={loading ? 'Searching...' : 'Search'}
          onPress={performSearch}
          loading={loading}
          variant="primary"
          icon="search"
          fullWidth
          size="large"
          style={styles.searchBtn}
        />

        {/* Results */}
        {hasSearched && results.length === 0 && !loading && (
          <Card shadow="sm" style={[styles.section, styles.emptyState]}>
            <Ionicons name="inbox-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>Try expanding your search radius or changing filters</Text>
          </Card>
        )}

        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>{results.length} Results</Text>
            {results.map((item, index) => (
              <Animated.View
                key={item.item_id}
                entering={FadeInDown.duration(300).delay(index * 50)}
              >
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => navigateToItemDetail(item)}
                  activeOpacity={0.7}
                >
                  {item.image_url && (
                    <View style={styles.resultImage}>
                      <Ionicons name="image-outline" size={24} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.resultPrice}>{item.price}</Text>
                    {item.address && (
                      <Text style={styles.resultAddress} numberOfLines={1}>{item.address}</Text>
                    )}
                    <View style={styles.distanceBadge}>
                      <Ionicons name="location" size={12} color={colors.primary} />
                      <Text style={styles.distanceText}>{item.distance_km} km away</Text>
                    </View>
                  </View>
                  <View style={styles.resultArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.page,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.page,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordsInput: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceInput: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  radiusDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  radiusValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  categoriesScroll: {
    marginHorizontal: -spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: colors.white,
  },
  searchBtn: {
    marginTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  resultsSection: {
    gap: spacing.md,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.lg,
    padding: spacing.md,
    ...shadows.sm,
    gap: spacing.md,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: spacing.md,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resultPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  resultAddress: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.md,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  resultArrow: {
    marginLeft: spacing.sm,
  },
});
