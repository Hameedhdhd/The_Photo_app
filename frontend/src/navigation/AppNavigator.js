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
              const devEmail = 'Hameed@Hd.com';
              const devPass = 'Hameed2024!';
              console.log('Starting auth for', devEmail);
              try {
                // Try sign in first
                let signInResult = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass });
                console.log('Sign in result:', signInResult.error ? `ERROR: ${signInResult.error.message}` : 'SUCCESS');
                
                if (signInResult.error) {
                  // Try sign up (may succeed but require email confirmation)
                  const signUpResult = await supabase.auth.signUp({ email: devEmail, password: devPass });
                  console.log('Sign up result:', signUpResult.error ? `ERROR: ${signUpResult.error.message}` : 'SUCCESS');
                  
                  // Try sign in again after sign-up
                  signInResult = await supabase.auth.signInWithPassword({ email: devEmail, password: devPass });
                  console.log('Retry sign in:', signInResult.error ? `ERROR: ${signInResult.error.message}` : 'SUCCESS');
                }
                
                if (signInResult.data?.session) {
                  setSession(signInResult.data.session);
                } else {
                  // All auth methods failed — use mock mode as fallback
                  console.log('Using mock login mode');
                  setIsMockLogin(true);
                }
              } catch (err) {
                console.error('Auth exception:', err);
                setIsMockLogin(true); // fallback
              }
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