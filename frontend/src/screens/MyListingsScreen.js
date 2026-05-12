import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  RefreshControl, Image, TouchableOpacity, Alert
} from 'react-native';
import { supabase } from '../../supabase';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function MyListingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState([]);
  const [userId, setUserId] = useState(null);

  const getSessionUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  };

  const fetchListings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Could not fetch your listings.');
      setListings([]);
    } else {
      setListings(data);
    }
    setLoading(false);
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
      if (userId) {
        fetchListings();
      }
    }, [userId, fetchListings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const renderListingItem = ({ item }) => (
    <View style={styles.card}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.listingImage} />
      )}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.room}>• {item.room}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description_en}</Text>
        {/* Potentially add more details or actions here */}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Text style={styles.headerTitle}>My Listings</Text>
      </LinearGradient>

      {listings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centered}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
          }
        >
          <Ionicons name="pricetags-outline" size={100} color="#cbd5e1" />
          <Text style={styles.emptyStateText}>No listings yet!</Text>
          <Text style={styles.emptyStateSubText}>Go to the Scan tab to create your first listing.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => String(item.id || item.item_id)}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    zIndex: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyStateSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  listContentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden', // Ensures image corners are rounded
  },
  listingImage: {
    width: '100%',
    height: 200, // Fixed height for consistency
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 5,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: {
    fontSize: 13,
    color: '#4c669f',
    fontWeight: '600',
  },
  room: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 5,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
