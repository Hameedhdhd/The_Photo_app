import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import EmptyState from '../EmptyState';
import ListingCard from '../ListingCard';
import { colors, spacing } from '../../theme';

export default function MarketplaceList({
  items,
  refreshing,
  onRefresh,
  searchQuery,
  searchLocation,
  searchRadius,
  renderListItem,
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="storefront-outline"
        title={searchQuery ? 'No Results' : searchLocation ? 'No Items in Radius' : 'No Items Yet'}
        subtitle={searchQuery ? 'Try a different search term' : searchLocation ? `No items found within ${searchRadius}km` : 'Be the first to list something!'}
        iconBgColor={colors.infoLight}
        iconColor={colors.primary}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.item_id || item.id)}
      renderItem={renderListItem}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={12}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.page - 4,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
