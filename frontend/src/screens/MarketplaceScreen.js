import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { supabase } from '../../supabase';
import { colors, spacing, layout } from '../theme';
import ListingCard from '../components/ListingCard';
import { SkeletonCard } from '../components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';

// New Sub-components
import MarketplaceHeader from '../components/marketplace/MarketplaceHeader';
import MarketplaceLocationModal from '../components/marketplace/MarketplaceLocationModal';
import MarketplaceList from '../components/marketplace/MarketplaceList';
import MarketplaceMap from '../components/marketplace/MarketplaceMap';
import MarketplaceItemModal from '../components/marketplace/MarketplaceItemModal';
import { CATEGORIES } from '../constants/categories';

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [stateInput, setStateInput] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef(null);
  const [unifiedSearchInput, setUnifiedSearchInput] = useState('');
  const [unifiedSearchSuggestions, setUnifiedSearchSuggestions] = useState([]);
  const [showUnifiedSearchSuggestions, setShowUnifiedSearchSuggestions] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [postcodeSuggestions, setPostcodeSuggestions] = useState([]);
  const [showPostcodeSuggestions, setShowPostcodeSuggestions] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUserId(session.user.id);
    };
    init();
    fetchItems(0);
    getCurrentLocation();
  }, []);

  useEffect(() => { filterItems(); }, [items, searchQuery, selectedCategory]);

  const fetchItems = async (offset = 0) => {
    try {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${baseURL}/api/items?limit=${pageSize}&offset=${offset}&category=${selectedCategory}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (offset === 0) setItems(data || []);
      else setItems(prev => [...prev, ...data]);
      setHasMore((data || []).length === pageSize);
      setPageOffset(offset);
    } catch (e) {
      if (offset === 0) setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setUserLocation({ latitude: 52.52, longitude: 13.405 });
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        return;
      }
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => setUserLocation({ latitude: 52.52, longitude: 13.405 }),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        setUserLocation({ latitude: 52.52, longitude: 13.405 });
      }
    } catch (e) {
      setUserLocation({ latitude: 52.52, longitude: 13.405 });
    }
  };

  const performRadiusSearch = useCallback(async () => {
    if (!searchLocation) {
      filterItems();
      return;
    }
    setLoading(true);
    setSearchResults([]);
    try {
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      let url = `${baseURL}/api/search-radius?latitude=${searchLocation.lat}&longitude=${searchLocation.lng}&radius_km=${searchRadius}`;
      if (selectedCategory !== 'All') url += `&category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) setSearchResults(data);
      else setSearchResults([]);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchLocation, searchRadius, selectedCategory]);

  const filterItems = () => {
    let filtered = items;
    if (selectedCategory !== 'All') filtered = filtered.filter(i => i.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    setFilteredItems(filtered);
  };

  useEffect(() => {
    if (searchLocation) performRadiusSearch();
    else {
      setSearchResults(null);
      filterItems();
    }
  }, [searchLocation, searchRadius, selectedCategory, performRadiusSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, []);

  const handleUseMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
        const data = await response.json();
        if (data && data.address) {
          const address = data.address;
          let postcode = address.postcode || '';
          if (!postcode) {
            const displayNameParts = data.display_name ? data.display_name.split(',').map(p => p.trim()) : [];
            const postcodeMatch = displayNameParts.join(' ').match(/\b\d{5}\b/);
            if (postcodeMatch) postcode = postcodeMatch[0];
          }
          if (postcode) {
             const { data: dbData } = await supabase.from('german_addresses').select('postcode, city, state').eq('postcode', postcode.trim()).limit(1);
             if (dbData && dbData.length > 0) {
               const dbRecord = dbData[0];
               setCityInput(dbRecord.city);
               setPostcodeInput(dbRecord.postcode);
               setStateInput(dbRecord.state);
              setSearchLocation({ lat, lng, name: `${dbRecord.state}, ${dbRecord.city}, ${dbRecord.postcode}` });
            } else {
              const city = address.city || address.town || address.village || address.county || '';
              setCityInput(city);
              setPostcodeInput(postcode);
              setStateInput(address.state || '');
              setSearchLocation({ lat, lng, name: `${address.state || ''}, ${city}, ${postcode}` });
            }
          } else {
            setSearchLocation({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
          }
        }
      } catch (geocodeError) {
        setSearchLocation({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    } catch (error) {}
  };

  const handleClearLocation = () => {
    setSearchLocation(null);
    setSearchResults(null);
    setCityInput('');
    setPostcodeInput('');
    setStateInput('');
    setShowCitySuggestions(false);
    setShowPostcodeSuggestions(false);
  };

  // Individual field clear handlers
  const handleClearCity = () => {
    setCityInput('');
    setShowCitySuggestions(false);
  };

  const handleClearPostcode = () => {
    setPostcodeInput('');
    setShowPostcodeSuggestions(false);
  };

  const handleClearState = () => {
    setStateInput('');
  };

  // State search handler - search locations by state only
  const handleStateChange = async (text) => {
    setStateInput(text);
    if (text.trim().length >= 2) {
      try {
        // Search for unique states and their cities
        const trimmedText = text.trim();
        const { data } = await supabase
          .from('german_addresses')
          .select('state, city, postcode')
          .ilike('state', `${trimmedText}%`)
          .limit(20);
        
        if (data && data.length > 0) {
          // Get unique states with at least one city example
          const uniqueStates = Array.from(
            new Map(data.map(item => [item.state, item])).values()
          );
          // For now, we'll search all cities in that state
          const citiesInState = Array.from(
            new Map(data.map(item => [`${item.city}_${item.state}`, item])).values()
          );
          setPostcodeSuggestions(citiesInState);
          setShowPostcodeSuggestions(true);
        }
      } catch (error) {
        console.log('State search error:', error);
      }
    } else {
      setShowPostcodeSuggestions(false);
    }
  };

  const handlePostcodeChange = async (text) => {
    setPostcodeInput(text);
    if (text.trim().length === 5) {
      try {
        const { data } = await supabase.from('german_addresses').select('postcode, city, state').eq('postcode', text.trim()).order('city', { ascending: true });
        if (data && data.length > 0) {
          if (data.length === 1) {
            setCityInput(data[0].city);
            setStateInput(data[0].state);
            setPostcodeSuggestions([]);
            setShowPostcodeSuggestions(false);
            await geocodeLocation(data[0].city, text.trim());
          } else {
            const uniqueCities = Array.from(new Map(data.map(item => [`${item.city}_${item.state}`, { city: item.city, state: item.state, postcode: item.postcode }])).values());
            setPostcodeSuggestions(uniqueCities);
            setShowPostcodeSuggestions(true);
          }
        }
      } catch (error) {}
    } else {
      setPostcodeSuggestions([]);
      setShowPostcodeSuggestions(false);
    }
  };

  const handleSelectPostcode = async (suggestion) => {
    setCityInput(suggestion.city);
    setStateInput(suggestion.state);
    setPostcodeInput(suggestion.postcode);
    setShowPostcodeSuggestions(false);
    await geocodeLocation(suggestion.city, suggestion.postcode);
  };

  const handleUnifiedSearchChange = async (text) => {
    setUnifiedSearchInput(text);
    if (text.trim().length >= 2) {
      try {
        const trimmedText = text.trim();
        const isNumeric = /^\d+$/.test(trimmedText);
        let query = supabase.from('german_addresses').select('postcode, city, state');
        if (isNumeric) query = query.ilike('postcode', `${trimmedText}%`);
        else query = query.ilike('city', `${trimmedText}%`);
        const { data } = await query.limit(10);
        if (data && data.length > 0) {
          const uniqueResults = Array.from(new Map(data.map(item => [`${item.city}_${item.state}_${item.postcode}`, item])).values());
          setUnifiedSearchSuggestions(uniqueResults);
          setShowUnifiedSearchSuggestions(true);
        } else setShowUnifiedSearchSuggestions(false);
      } catch (error) { setUnifiedSearchSuggestions([]); }
    } else setShowUnifiedSearchSuggestions(false);
  };

  const handleSelectUnifiedResult = async (result) => {
    setCityInput(result.city);
    setPostcodeInput(result.postcode);
    setStateInput(result.state);
    setUnifiedSearchInput('');
    setShowUnifiedSearchSuggestions(false);
    await geocodeLocation(result.city, result.postcode);
  };

  const handleCityChange = async (text) => {
    setCityInput(text);
    if (text.trim().length > 1) {
      try {
        const trimmedText = text.trim();
        const { data } = await supabase
          .from('german_addresses')
          .select('city, postcode, state')
          .ilike('city', `${trimmedText}%`)
          .limit(10);
        
        if (data && data.length > 0) {
          // Get unique cities with their first postcode/state
          const uniqueCities = Array.from(
            new Map(data.map(item => [item.city, { city: item.city, postcode: item.postcode, state: item.state }])).values()
          );
          setCitySuggestions(uniqueCities);
          setShowCitySuggestions(true);
        } else setShowCitySuggestions(false);
      } catch (error) { 
        console.log('City search error:', error);
        setCitySuggestions([]); 
      }
    } else setShowCitySuggestions(false);
  };

  const handleSelectCity = async (city) => {
    console.log('[MarketplaceScreen] City selected:', city.city, city.postcode);
    setCityInput(city.city);
    setPostcodeInput(city.postcode);
    setStateInput(city.state);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    // Auto-geocode immediately
    await geocodeLocation(city.city, city.postcode);
  };

  const geocodeLocation = async (city, postcode) => {
    try {
      let query = '';
      if (city && postcode) query = `${city}, ${postcode}, Germany`;
      else if (city) query = `${city}, Germany`;
      else if (postcode) query = `${postcode}, Germany`;
      else return;
      
      console.log('[MarketplaceScreen] Geocoding:', query);
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const cleanName = city && postcode ? `${city}, ${postcode}, Germany` : query;
        console.log('[MarketplaceScreen] Geocoded successfully:', cleanName, 'Lat:', lat, 'Lng:', lon);
        setSearchLocation({ lat: parseFloat(lat), lng: parseFloat(lon), name: cleanName });
      } else {
        console.log('[MarketplaceScreen] Geocoding returned no results for:', query);
      }
    } catch (error) {
      console.error('[MarketplaceScreen] Geocoding error:', error);
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSearchLocation({ lat: latitude, lng: longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
  };

  const navigateToItemDetail = (item) => navigation.navigate('ItemDetail', { item });

  const navigateToChat = (item) => {
    if (!item.user_id || !currentUserId || item.user_id === currentUserId) return;
    const sortedIds = [currentUserId, item.user_id].sort();
    navigation.navigate('ChatDetail', { chatId: `${sortedIds[0]}_${sortedIds[1]}_${item.item_id}`, otherUserId: item.user_id, item });
  };

  const renderListItem = ({ item, index }) => (
    <ListingCard item={item} index={index} onPress={() => navigateToItemDetail(item)} onMessage={() => navigateToChat(item)} />
  );

  const displayItems = searchResults !== null ? searchResults : filteredItems;
  const itemsWithLocation = filteredItems.filter(i => i.latitude && i.longitude);

  if (loading && items.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.primary, '#818CF8']} style={styles.headerGradient}>
          <View style={styles.headerContent}><Text style={styles.headerTitle}>Marketplace</Text></View>
        </LinearGradient>
        <View style={styles.skeletonContainer}><View style={styles.skeletonRow}><SkeletonCard /><SkeletonCard /></View></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <MarketplaceHeader
        filteredItemsCount={filteredItems.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchLocation={searchLocation}
        setShowLocationModal={setShowLocationModal}
        searchRadius={searchRadius}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={[{ label: 'All', icon: 'grid-outline' }, ...CATEGORIES]}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubcategories={selectedSubcategories}
        onSelectSubcategory={setSelectedSubcategories}
        navigation={navigation}
      />

      {viewMode === 'list' ? (
        <MarketplaceList
          items={displayItems}
          refreshing={refreshing}
          onRefresh={onRefresh}
          searchQuery={searchQuery}
          searchLocation={searchLocation}
          searchRadius={searchRadius}
          renderListItem={renderListItem}
        />
      ) : (
        <MarketplaceMap
          itemsWithLocation={itemsWithLocation}
          userLocation={userLocation}
          setSelectedItem={setSelectedItem}
        />
      )}

      <MarketplaceLocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        handleUseMyLocation={handleUseMyLocation}
        unifiedSearchInput={unifiedSearchInput}
        handleUnifiedSearchChange={handleUnifiedSearchChange}
        showUnifiedSearchSuggestions={showUnifiedSearchSuggestions}
        unifiedSearchSuggestions={unifiedSearchSuggestions}
        handleSelectUnifiedResult={handleSelectUnifiedResult}
        cityInput={cityInput}
        handleCityChange={handleCityChange}
        handleClearCity={handleClearCity}
        showCitySuggestions={showCitySuggestions}
        citySuggestions={citySuggestions}
        handleSelectCity={handleSelectCity}
        postcodeInput={postcodeInput}
        handlePostcodeChange={handlePostcodeChange}
        handleClearPostcode={handleClearPostcode}
        showPostcodeSuggestions={showPostcodeSuggestions}
        postcodeSuggestions={postcodeSuggestions}
        handleSelectPostcode={handleSelectPostcode}
        stateInput={stateInput}
        handleStateChange={handleStateChange}
        handleClearState={handleClearState}
        geocodeLocation={geocodeLocation}
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        searchLocation={searchLocation}
        handleMapPress={handleMapPress}
        handleClearLocation={handleClearLocation}
        mapKey={mapKey}
        mapRef={mapRef}
      />

      <MarketplaceItemModal
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        navigateToItemDetail={navigateToItemDetail}
        navigateToChat={navigateToChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  headerGradient: { paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingBottom: spacing.lg, paddingHorizontal: spacing.page },
  headerContent: {},
  headerTitle: { fontSize: 28, fontWeight: '900', color: colors.white },
  skeletonContainer: { padding: spacing.page },
  skeletonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
});
