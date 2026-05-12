import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchListings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Could not load your listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Refresh when tab is focused
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchListings();
    });
    return unsubscribe;
  }, [navigation, fetchListings]);

  const deleteListing = async (id) => {
    Alert.alert('Delete Listing', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(id);
          try {
            const { error } = await supabase.from('items').delete().eq('id', id);
            if (error) throw error;
            setListings(prev => prev.filter(item => item.id !== id));
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Could not delete listing.');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleArea}>
          <Text style={styles.cardCategory}>{item.category || 'Uncategorized'}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteListing(item.id)} disabled={deleting === item.id}>
          {deleting === item.id ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#94a3b8" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{item.price || 'N/A'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'published' ? '#d4edda' : '#fff3cd' }]}>
          <Text style={[styles.statusText, { color: item.status === 'published' ? '#155724' : '#856404' }]}>
            {item.status === 'published' ? 'Published' : 'Draft'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.header}>
        <Ionicons name="list-outline" size={32} color="#fff" />
        <Text style={styles.title}>My Listings</Text>
        <Text style={styles.subtitle}>{listings.length} item{listings.length !== 1 ? 's' : ''} saved</Text>
      </LinearGradient>

      {listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyText}>Take a photo of an item to generate your first AI-powered listing!</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchListings(); }} colors={['#FF6B6B']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#64748b' },
  header: {
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 5 },
  subtitle: { fontSize: 14, color: '#e2e8f0', marginTop: 3 },
  listContent: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleArea: { flex: 1, marginRight: 15 },
  cardCategory: { fontSize: 12, color: '#4c669f', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  cardTitle: { fontSize: 16, color: '#1e293b', fontWeight: '600', lineHeight: 22 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceTag: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: { fontSize: 16, fontWeight: '800', color: '#FF6B6B' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#64748b', marginTop: 20 },
  emptyText: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 24 },
});
