import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { supabase } from '../../supabase';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import ResultScreen from '../screens/ResultScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import { LoadingScreen } from '../components/LoadingSpinner';
import { colors, typography, spacing, radius, shadows } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ name, focused, size }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 15, stiffness: 300 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, focused && styles.tabIconActive, animatedStyle]}>
      <Ionicons
        name={name}
        size={focused ? size + 2 : size}
        color={focused ? colors.primary : colors.textTertiary}
      />
    </Animated.View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
          } else if (route.name === 'My Items') {
            iconName = focused ? 'list' : 'list-outline';
          }
          return <AnimatedTabIcon name={iconName} focused={focused} size={24} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Scan" component={HomeScreen} />
      <Tab.Screen name="My Items" component={MyListingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [isMockLogin, setIsMockLogin] = useState(false);
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
        {session || isMockLogin ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{
                cardStyle: { backgroundColor: colors.gray50 },
              }}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{
                cardStyle: { backgroundColor: colors.gray50 },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onMockLogin={async () => {
              // Create a real Supabase anonymous session so items can be saved/fetched
              const { error } = await supabase.auth.signInAnonymously();
              if (error) {
                console.error('Anonymous sign-in error:', error);
                setIsMockLogin(true); // fallback to mock
              }
              // onAuthStateChange will update session automatically
            }} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm + 2,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.sm + 4,
    height: Platform.OS === 'ios' ? 88 : 68,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...shadows.xl,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  tabIconContainer: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.md,
  },
  tabIconActive: {
    backgroundColor: colors.infoLight,
  },
});