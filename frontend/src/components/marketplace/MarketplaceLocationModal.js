import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Animated, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInUp } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from '../ExpoMap';
import { colors, spacing, radius, typography, shadows } from '../../theme';

export default function MarketplaceLocationModal({
  visible,
  onClose,
  handleUseMyLocation,
  unifiedSearchInput,
  handleUnifiedSearchChange,
  showUnifiedSearchSuggestions,
  unifiedSearchSuggestions,
  handleSelectUnifiedResult,
  cityInput,
  handleCityChange,
  handleClearCity,
  showCitySuggestions,
  citySuggestions,
  handleSelectCity,
  postcodeInput,
  handlePostcodeChange,
  handleClearPostcode,
  showPostcodeSuggestions,
  postcodeSuggestions,
  handleSelectPostcode,
  stateInput,
  handleStateChange,
  handleClearState,
  geocodeLocation,
  searchRadius,
  setSearchRadius,
  searchLocation,
  handleMapPress,
  handleClearLocation,
  mapKey,
  mapRef,
}) {
  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.locationModalOverlay}>
        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={styles.locationModalContent}
        >
          {/* Header */}
          <View style={styles.locationModalHeader}>
            <Text style={styles.locationModalTitle}>Search by Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.locationModalScroll} showsVerticalScrollIndicator={false} scrollEnabled={!(showUnifiedSearchSuggestions && unifiedSearchSuggestions.length > 0) && !(showCitySuggestions && citySuggestions.length > 0) && !(showPostcodeSuggestions && postcodeSuggestions.length > 0)}>
            {/* Current Location Button */}
            <TouchableOpacity 
              style={styles.useLocationBtn}
              onPress={handleUseMyLocation}
            >
              <Ionicons name="locate-outline" size={20} color={colors.white} />
              <Text style={styles.useLocationBtnText}>Use My Current Location</Text>
            </TouchableOpacity>

            {/* Unified Search Bar */}
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.unifiedSearchBar}>
                <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.unifiedSearchInput}
                  placeholder="Search postcode or district..."
                  placeholderTextColor={colors.textTertiary}
                  value={unifiedSearchInput}
                  onChangeText={handleUnifiedSearchChange}
                />
                {unifiedSearchInput ? (
                  <TouchableOpacity onPress={() => handleUnifiedSearchChange('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* City + Postcode + State Input */}
            <View style={styles.locationInputSection}>
              <Text style={styles.locationInputLabel}>📍 Enter Location (Optional)</Text>
              
              <View style={styles.cityPostcodeRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.cityInput}
                      placeholder="City"
                      placeholderTextColor={colors.textTertiary}
                      value={cityInput}
                      onChangeText={handleCityChange}
                    />
                    {cityInput ? (
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={handleClearCity}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <View style={{ flex: 0.7 }}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.postcodeInput}
                      placeholder="Postcode"
                      placeholderTextColor={colors.textTertiary}
                      value={postcodeInput}
                      onChangeText={handlePostcodeChange}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    {postcodeInput ? (
                      <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={handleClearPostcode}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.stateInputFull, stateInput ? styles.stateInputActive : null]}
                  placeholder="State"
                  placeholderTextColor={colors.textTertiary}
                  value={stateInput}
                  onChangeText={handleStateChange}
                  editable={true}
                />
                {stateInput ? (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={handleClearState}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity 
                style={styles.geocodeBtn}
                onPress={() => {
                  console.log('[LocationModal] Search Location button clicked');
                  geocodeLocation(cityInput, postcodeInput);
                }}
              >
                <Ionicons name="search-outline" size={18} color={colors.white} />
                <Text style={styles.geocodeBtnText}>Search Location</Text>
              </TouchableOpacity>
            </View>

            {/* Radius Adjuster */}
            <View style={styles.radiusSection}>
              <View style={styles.radiusHeader}>
                <Text style={styles.radiusLabel}>🎯 Search Radius</Text>
                <Text style={styles.radiusValue}>{Math.round(searchRadius)} km</Text>
              </View>
              <View style={styles.radiusSliderContainer}>
                <Slider
                  style={styles.radiusSlider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.gray200}
                />
              </View>
              <View style={styles.radiusLabels}>
                <Text style={styles.radiusMinLabel}>1 km</Text>
                <Text style={styles.radiusMaxLabel}>100 km</Text>
              </View>
            </View>

            {/* Interactive Map */}
            <View style={styles.mapModalSection}>
              <Text style={styles.mapModalLabel}>🗺️ Tap map to set location</Text>
              <View style={styles.mapModalContainer}>
                {searchLocation ? (
                  <MapView
                    key={mapKey}
                    ref={mapRef}
                    style={styles.mapModal}
                    provider={PROVIDER_DEFAULT}
                    region={{
                      latitude: searchLocation.lat,
                      longitude: searchLocation.lng,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                  >
                    <Marker
                      coordinate={{
                        latitude: searchLocation.lat,
                        longitude: searchLocation.lng,
                      }}
                      title="Search Location"
                      description={`${Math.round(searchRadius)}km radius`}
                    />
                    <Circle
                      center={{
                        latitude: searchLocation.lat,
                        longitude: searchLocation.lng,
                      }}
                      radius={searchRadius * 1000}
                      fillColor="rgba(99, 102, 241, 0.1)"
                      strokeColor="rgba(99, 102, 241, 0.6)"
                      strokeWidth={2}
                    />
                  </MapView>
                ) : (
                  <View style={styles.mapEmptyState}>
                    <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
                    <Text style={styles.mapEmptyText}>Select a location to see the map</Text>
                  </View>
                )}
              </View>
            </View>

            {searchLocation && (
              <View style={styles.currentLocationDisplay}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                <View style={styles.currentLocationText}>
                  <Text style={styles.currentLocationTitle}>Current Search Location</Text>
                  <Text style={styles.currentLocationCoords}>
                    {searchLocation.name}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* DROPDOWNS RENDERED OUTSIDE SCROLLVIEW */}
          {/* Unified Search Dropdown */}
          {showUnifiedSearchSuggestions && unifiedSearchSuggestions.length > 0 && (
            <View style={styles.unifiedSuggestionsDropdownContainer}>
              <ScrollView nestedScrollEnabled={true} scrollEnabled={unifiedSearchSuggestions.length > 4} style={{ maxHeight: 250 }}>
                {unifiedSearchSuggestions.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.unifiedSuggestionItem}
                    onPress={() => {
                      handleSelectUnifiedResult(result);
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.unifiedSuggestionItemName}>
                        {result.city}, {result.state}
                      </Text>
                      <Text style={styles.unifiedSuggestionItemSub}>
                        {result.postcode}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* City Dropdown */}
          {showCitySuggestions && citySuggestions.length > 0 && (
            <View style={styles.citySuggestionsDropdownContainer}>
              <ScrollView nestedScrollEnabled={true} scrollEnabled={citySuggestions.length > 4} style={{ maxHeight: 250 }}>
                {citySuggestions.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      handleSelectCity(city);
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.suggestionItemName}>{city.city}</Text>
                      <Text style={styles.suggestionItemSub} numberOfLines={1}>
                        {city.postcode}, {city.state}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Postcode Dropdown */}
          {showPostcodeSuggestions && postcodeSuggestions.length > 0 && (
            <View style={styles.postcodeSuggestionsDropdownContainer}>
              <ScrollView nestedScrollEnabled={true} scrollEnabled={postcodeSuggestions.length > 4} style={{ maxHeight: 250 }}>
                {postcodeSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      handleSelectPostcode(suggestion);
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.suggestionItemName}>
                        {suggestion.city}, {suggestion.state}
                      </Text>
                      <Text style={styles.suggestionItemSub}>
                        {suggestion.postcode}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.locationModalFooter}>
            {searchLocation && (
              <TouchableOpacity 
                style={styles.locationClearBtn}
                onPress={handleClearLocation}
              >
                <Text style={styles.locationClearBtnText}>Clear Location</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.locationDoneBtn}
              onPress={onClose}
            >
              <Text style={styles.locationDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  locationModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  locationModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    ...shadows.xl,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  locationModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationModalScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  useLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  useLocationBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  unifiedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    ...shadows.sm,
  },
  unifiedSearchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  unifiedSuggestionsDropdownContainer: {
    position: 'absolute',
    top: 160,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    zIndex: 10000,
    ...shadows.md,
    maxHeight: 250,
  },
  unifiedSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  unifiedSuggestionItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  unifiedSuggestionItemSub: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  citySuggestionsDropdownContainer: {
    position: 'absolute',
    top: 380,
    left: spacing.lg,
    right: '50%',
    marginRight: spacing.sm / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    zIndex: 10000,
    ...shadows.md,
    maxHeight: 250,
  },
  postcodeSuggestionsDropdownContainer: {
    position: 'absolute',
    top: 380,
    right: spacing.lg,
    width: '50%',
    marginLeft: spacing.sm / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    zIndex: 10000,
    ...shadows.md,
    maxHeight: 250,
  },
  locationInputSection: {
    marginBottom: spacing.lg,
  },
  locationInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityPostcodeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  postcodeInput: {
    flex: 0.8,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  suggestionItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  suggestionItemSub: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  geocodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
  },
  geocodeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stateInputFull: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  stateInputActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  radiusSection: {
    marginBottom: spacing.lg,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
  radiusSliderContainer: {
    marginBottom: spacing.md,
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  radiusMinLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  radiusMaxLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  mapModalSection: {
    marginBottom: spacing.lg,
  },
  mapModalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapModalContainer: {
    height: 300,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  mapModal: {
    flex: 1,
  },
  mapEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.lg,
  },
  mapEmptyText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  currentLocationDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  currentLocationCoords: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationModalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  locationClearBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationClearBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  locationDoneBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationDoneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -9 }],
    padding: spacing.sm,
    zIndex: 100,
  },
});
