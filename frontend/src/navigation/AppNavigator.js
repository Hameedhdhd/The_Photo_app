import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from '../utils/reanimated-compat';

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

// DEV MODE: Set to true to auto-login with test account, false to show login screen
const DEV_MODE = true;
const DEV_EMAIL = 'Hameed@Hd.com';
const DEV_PASSWORD = 'Hameed2024!';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    // Safety timeout: show login screen if auth takes too long
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth timeout - showing login screen');
        setLoading(false);
      }
    }, 5000);

    async function initAuth() {
      try {
        // Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (existingSession) {
          setSession(existingSession);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        // DEV MODE: Auto-login with test account
        if (DEV_MODE) {
          console.log('Dev mode: auto-signing in as', DEV_EMAIL);
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: DEV_EMAIL,
              password: DEV_PASSWORD,
            });
            if (!mounted) return;
            if (error) {
              console.log('Sign in failed, trying sign up:', error.message);
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: DEV_EMAIL,
                password: DEV_PASSWORD,
              });
              if (signUpError) {
                console.error('Dev auth failed:', signUpError.message);
              } else if (signUpData.session) {
                setSession(signUpData.session);
              }
            } else if (data.session) {
              setSession(data.session);
            }
          } catch (err) {
            console.error('Dev auth exception:', err);
          }
        }
      } catch (err) {
        console.error('getSession error:', err);
      }
      
      if (mounted) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
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
          </>
        ) : (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLogin={async (email, password) => {
                  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                  if (error) throw error;
                  if (data.session) setSession(data.session);
                }}
                onSignUp={async (email, password) => {
                  const { data, error } = await supabase.auth.signUp({ email, password });
                  if (error) throw error;
                  if (data.session) setSession(data.session);
                }}
                onGoogleLogin={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                  if (error) throw error;
                }}
                onDevSkip={async () => {
                  const { data, error } = await supabase.auth.signInWithPassword({
                    email: DEV_EMAIL,
                    password: DEV_PASSWORD,
                  });
                  if (error) throw error;
                  if (data.session) setSession(data.session);
                }}
              />
            )}
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