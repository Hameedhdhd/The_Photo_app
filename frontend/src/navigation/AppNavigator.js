import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../supabase';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ResultScreen from '../screens/ResultScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import RadiusSearchScreen from '../screens/RadiusSearchScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import { LoadingScreen } from '../components/LoadingSpinner';
import { colors, typography, spacing, radius, shadows } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Animated icon for regular tabs
const AnimatedTabIcon = ({ name, focused, size }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, { damping: 15, stiffness: 300 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, focused && styles.tabIconActive, animatedStyle]}>
      <Ionicons
        name={name}
        size={focused ? size + 4 : size + 2}
        color={focused ? colors.primary : colors.gray500}
      />
    </Animated.View>
  );
};

// Scan tab button wrapper - keeps alignment with other tabs
const ScanTabButton = ({ onPress, tintColor }) => {
  return (
    <TouchableOpacity
      style={styles.scanTabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.scanIconContainer}>
        <Ionicons name="camera" size={24} color={tintColor} />
      </View>
    </TouchableOpacity>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          if (route.name === 'Marketplace') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Scan Items') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'My Items') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }
          return <AnimatedTabIcon name={iconName} focused={focused} size={24} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
      />
      <Tab.Screen
        name="Scan Items"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Scan Items',
        }}
      />
      <Tab.Screen
        name="My Items"
        component={MyListingsScreen}
      />
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ cardStyle: { backgroundColor: colors.gray50 } }}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ cardStyle: { backgroundColor: colors.gray50 } }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ cardStyle: { backgroundColor: colors.gray50 } }}
            />
            <Stack.Screen
              name="RadiusSearch"
              component={RadiusSearchScreen}
              options={{ cardStyle: { backgroundColor: colors.gray50 } }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md + 4,
    height: Platform.OS === 'ios' ? 98 : 86,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    ...shadows.xl,
    elevation: 20,
  },
  tabBarLabel: {
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  tabIconContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  tabIconActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.12)', // Slightly stronger than infoLight
  },
  // Scan Tab Button
  scanTabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  scanIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLabel: {
    fontWeight: '700',
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
