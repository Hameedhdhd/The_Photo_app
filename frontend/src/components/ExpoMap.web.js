import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpoMap = ({ children, style, initialRegion }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Map View is currently native-only</Text>
      <Text style={styles.subtext}>Please use the mobile app to view the interactive map.</Text>
    </View>
  );
};

export const Marker = () => null;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  subtext: {
    fontSize: 13,
    color: '#adb5bd',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ExpoMap;
