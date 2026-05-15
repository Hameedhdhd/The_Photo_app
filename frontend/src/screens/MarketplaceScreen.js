import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ScrollView, RefreshControl, Modal, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors, spacing, radius, typography, shadows, layout } from '../theme';
import EmptyState from '../components/EmptyState';
import ListingCard from '../components/ListingCard';
import { SkeletonCard } from '../components/Skeleton';

// Safe maps import
let MapView = null, Marker = null, PROVIDER_GOOGLE = null;
if (Platform.OS !== 'web') {
  try {
    const moduleName = 'react-native-maps';
    const maps = require(moduleName);
    MapView = maps.default; Marker = maps.Marker; PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) { console.log('react-native-maps not available'); }
}

const CATEGORIES = [
  { label: 'All', icon: 'grid-outline' },
  { label: 'Electronics', icon: 'phone-portrait-outline' },
  { label: 'Furniture', icon: 'bed-outline' },
  { label: 'Clothing', icon: 'shirt-outline' },
  { label: 'Books', icon: 'book-outline' },
  { label: 'Sports', icon: 'bicycle-outline' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    init();
    fetchItems();
    getCurrentLocation();
  }, []);

  useEffect(() => { filterItems(); }, [items, searchQuery, selectedCategory]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items').select('*').eq('status', 'listed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error('Error fetching items:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    try {
      if (navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => console.log('Location:', err.message),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      }
    } catch (e) {}
  };

  const filterItems = () => {
    let filtered = items;
    if (selectedCategory !== 'All') filtered = filtered.filter(i => i.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    setFilteredItems(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, []);

  const navigateToItemDetail = (item) => navigation.navigate('ItemDetail', { item });

  const navigateToChat = (item) => {
    if (!item.user_id || !currentUserId || item.user_id === currentUserId) return;
    const sortedIds = [currentUserId, item.user_id].sort();
    navigation.navigate('ChatDetail', {
      chatId: `${sortedIds[0]}_${sortedIds[1]}_${item.item_id}`,
      otherUserId: item.user_id,
      item,
    });
  };

  const renderListItem = ({ item, index }) => (
    <ListingCard
      item={item}
      index={index}
      onPress={() => navigateToItemDetail(item)}
      onMessage={() => navigateToChat(item)}
    />
  );

  const itemsWithLocation = filteredItems.filter(i => i.latitude && i.longitude);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[colors.primary, '#818CF8']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSub}>Discover amazing deals</Text>
          </View>
        </LinearGradient>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonRow}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ─── Premium Header ─── */}
      <LinearGradient
        colors={[colors.primary, '#818CF8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Marketplace</Text>
              <Text style={styles.headerSub}>
                {filteredItems.length > 0
                  ? `${filteredItems.length} items available`
                  : 'Discover amazing deals'}
              </Text>
            </View>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="grid-outline" size={17} color={viewMode === 'list' ? colors.primary : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                onPress={() => setViewMode('map')}
              >
                <Ionicons name="map-outline" size={17} color={viewMode === 'map' ? colors.primary : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items, categories..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ─── Category Chips ─── */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.label)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ─── Content ─── */}
      {viewMode === 'list' ? (
        filteredItems.length === 0 ? (
          <EmptyState
            icon="storefront-outline"
            title={searchQuery ? 'No Results' : 'No Items Yet'}
            subtitle={searchQuery ? 'Try a different search term' : 'Be the first to list something!'}
            iconBgColor={colors.infoLight}
            iconColor={colors.primary}
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => String(item.item_id || item.id)}
            renderItem={renderListItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <View style={styles.mapContainer}>
          {!MapView || itemsWithLocation.length === 0 ? (
            <EmptyState
              icon="map-outline"
              title={!MapView ? 'Map Not Available' : 'No Items on Map'}
              subtitle={!MapView ? 'Use list view to browse items' : 'List items with addresses to see them here'}
              iconBgColor={colors.infoLight}
              iconColor={colors.primary}
            />
          ) : (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: userLocation?.latitude || 52.52,
                longitude: userLocation?.longitude || 13.405,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {Marker && itemsWithLocation.map((item) => (
                item.latitude && item.longitude ? (
                  <Marker
                    key={item.item_id}
                    coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                    title={item.title}
                    description={item.price}
                    onPress={() => setSelectedItem(item)}
                  />
                ) : null
              ))}
            </MapView>
          )}
        </View>
      )}

      {/* ─── Map Item Modal ─── */}
      <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedItem(null)}>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.modalCard}>
              {selectedItem.image_url && (
                <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} />
              )}
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle} numberOfLines={2}>{selectedItem.title}</Text>
                <Text style={styles.modalPrice}>{selectedItem.price}</Text>
                {selectedItem.address && (
                  <View style={styles.modalLocationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.modalLocationText} numberOfLines={1}>{selectedItem.address}</Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => { setSelectedItem(null); navigateToItemDetail(selectedItem); }}>
                    <Ionicons name="eye-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.modalBtnText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { setSelectedItem(null); navigateToChat(selectedItem); }}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
                    <Text style={[styles.modalBtnText, { color: colors.white }]}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  // ── Header ──
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.page,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  // ── Categories ──
  categoriesContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.white,
  },
  // ── List ──
  listContent: {
    paddingHorizontal: spacing.page - 4,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  skeletonContainer: {
    padding: spacing.page,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  // ── Map ──
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  modalBody: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.lg,
  },
  modalLocationText: {
    ...typography.caption,
    color: colors.textTertiary,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
