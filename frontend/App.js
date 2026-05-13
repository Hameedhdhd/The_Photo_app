import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import DebugButton from './src/components/DebugButton';
import './src/utils/DebugLogger';
import { colors } from './src/theme';

// Fix web scroll: ensure nested ScrollViews work properly
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root { height: 100%; margin: 0; }
    /* Allow ScrollView overflow on web */
    div[style*="overflow"] { -webkit-overflow-scrolling: touch; }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" backgroundColor={colors.primary} />
        <AppNavigator />
        <DebugButton />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
});