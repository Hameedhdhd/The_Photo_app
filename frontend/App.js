import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import DebugButton from './src/components/DebugButton';
import { ToastProvider } from './src/components/Toast';
import './src/utils/DebugLogger';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <ToastProvider>
          <StatusBar style="light" backgroundColor={colors.primary} />
          <AppNavigator />
          <DebugButton />
        </ToastProvider>
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