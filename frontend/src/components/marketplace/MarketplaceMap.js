import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from '../ExpoMap';
import EmptyState from '../EmptyState';
import { colors } from '../../theme';

export default function MarketplaceMap({
  itemsWithLocation,
  userLocation,
  setSelectedItem,
}) {
  if (itemsWithLocation.length === 0) {
    return (
      <View style={styles.mapContainer}>
        <EmptyState
          icon="map-outline"
          title="No Items on Map"
          subtitle="List items with addresses to see them here"
          iconBgColor={colors.infoLight}
          iconColor={colors.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={{
          latitude: userLocation?.latitude || 52.52,
          longitude: userLocation?.longitude || 13.405,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {itemsWithLocation.map((item) => (
          <Marker
            key={item.item_id}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            title={item.title}
            description={item.price}
            onPress={() => setSelectedItem(item)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1 },
  map: { flex: 1 },
});
