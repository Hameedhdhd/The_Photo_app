import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, FlatList, ScrollView, RefreshControl, TouchableOpacity, Text
} from 'react-native';
import { supabase } from '../../supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryScroll from '../components/CategoryScroll';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import MenuDrawer from '../components/MenuDrawer';
import { LoadingScreen } from '../components/LoadingSpinner';
import { colors, typography, spacing, radius } from '../theme';

const FILTER_TABS = ['All', 'Favorites'];

export default function MyListingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [activeFilter, setActiveFilter] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);

  const getSessionUserId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getSessionUserId();
      setUserId(id);
    };
    loadUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  // Extract categories from listings
  useEffect(() => {
    const roomSet = new Set();
    listings.forEach(item => {
      if (item.room) roomSet.add(item.room);
    });
    setCategories(['All', ...Array.from(roomSet)]);
  }, [listings]);

  // Filter listings based on search, category, and favorites
  useEffect(() => {
    let result = listings;

    // Favorites filter
    if (activeFilter === 'Favorites') {
      result = result.filter(item => item.favorite);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.room === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.description_en && item.description_en.toLowerCase().includes(query)) ||
        (item.description_de && item.description_de.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.room && item.room.toLowerCase().includes(query))
      );
    }

    setFilteredListings(result);
  }, [listings, searchQuery, selectedCategory, activeFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleItemPress = useCallback((item) => {
    navigation.navigate('ItemDetail', { item });
  }, [navigation]);

  const handleToggleFavorite = useCallback(async (item) => {
    const newValue = !item.favorite;
    // Optimistic update
    setListings(prev =>
      prev.map(li => li.id === item.id ? { ...li, favorite: newValue } : li)
    );
    try {
      await supabase
        .from('items')
        .update({ favorite: newValue })
        .eq('id', item.id);
    } catch (err) {
      console.error('Favorite toggle error:', err);
      // Revert on error
      setListings(prev =>
        prev.map(li => li.id === item.id ? { ...li, favorite: !newValue } : li)
      );
    }
  }, []);

  const handleMenuNavigate = useCallback((route) => {
    setMenuVisible(false);
    if (route === 'Scan') {
      navigation.navigate('Scan');
    }
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const renderListingItem = ({ item, index }) => (
    <ListingCard
      item={item}
      index={index}
      onPress={handleItemPress}
      onToggleFavorite={handleToggleFavorite}
    />
  );

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading your items..." />;
  }

  const hasFilters = searchQuery.trim() || selectedCategory !== 'All' || activeFilter === 'Favorites';
  const favoriteCount = listings.filter(i => i.favorite).length;

  return (
    <View style={styles.container}>
      <Header
        title="My Items"
        subtitle={`${listings.length} items • ${favoriteCount} favorites`}
        showMenu
        onMenuPress={() => setMenuVisible(true)}
      />

      {/* Search Bar */}
      <Animated.View entering={FadeInUp.duration(300)} style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
        />

        {/* Filter Tabs: All / Favorites */}
        <View style={styles.filterTabs}>
          {FILTER_TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'Favorites' ? 'heart' : 'list'}
                size={14}
                color={activeFilter === tab ? colors.white : colors.textTertiary}
              />
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab}
                {tab === 'Favorites' && ` (${favoriteCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Scroll */}
        <CategoryScroll
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </Animated.View>

      {/* Items Grid or Empty State */}
      {filteredListings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon={hasFilters ? 'search-outline' : 'pricetags-outline'}
            title={hasFilters ? 'No matches found' : 'No items yet'}
            subtitle={
              activeFilter === 'Favorites'
                ? 'Tap the heart icon on items to add favorites'
                : hasFilters
                  ? 'Try adjusting your search or filter'
                  : 'Scan items to start building your inventory'
            }
            iconBgColor={activeFilter === 'Favorites' ? colors.favoriteLight : hasFilters ? colors.infoLight : colors.gray100}
            iconColor={activeFilter === 'Favorites' ? colors.favorite : hasFilters ? colors.primary : colors.gray300}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={renderListingItem}
          keyExtractor={(item) => String(item.id || item.item_id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Menu Drawer */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleMenuNavigate}
        currentRoute="My Items"
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  searchSection: {
    paddingTop: spacing.md,
  },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.page,
    marginBottom: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.page - 2,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});