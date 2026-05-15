import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, FadeInDown } from 'react-native-reanimated';
import { colors, typography, spacing, radius, gradients } from '../theme';
import { triggerHaptic } from '../utils/haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Header({
  title,
  subtitle,
  rightAction,
  rightIcon,
  onRightPress,
  leftAction,
  leftIcon,
  onLeftPress,
  showMenu,
  onMenuPress,
  gradient = true,
  children,
}) {
  const Wrapper = gradient ? LinearGradient : View;
  const wrapperProps = gradient
    ? { colors: gradients.primary, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};

  const menuScale = useSharedValue(1);
  const rightScale = useSharedValue(1);

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rightScale.value }],
  }));

  const handleMenuPressIn = () => {
    triggerHaptic('light');
    menuScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handleMenuPressOut = () => {
    menuScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleRightPressIn = () => {
    triggerHaptic('light');
    rightScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handleRightPressOut = () => {
    rightScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const renderLeftAction = () => {
    if (showMenu) {
      return (
        <AnimatedTouchable
          onPress={onMenuPress}
          onPressIn={handleMenuPressIn}
          onPressOut={handleMenuPressOut}
          style={[styles.actionButton, menuAnimatedStyle]}
          activeOpacity={0.9}
        >
          <Ionicons name="menu" size={24} color={colors.white} />
        </AnimatedTouchable>
      );
    }
    if (leftAction) {
      return (
        <TouchableOpacity onPress={onLeftPress} style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name={leftIcon || 'arrow-back'} size={24} color={colors.white} />
        </TouchableOpacity>
      );
    }
    return <View style={styles.actionPlaceholder} />;
  };

  return (
    <Wrapper style={styles.header} {...wrapperProps}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={styles.row}>
            {renderLeftAction()}

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            {rightAction ? (
              <AnimatedTouchable
                onPress={onRightPress}
                onPressIn={handleRightPressIn}
                onPressOut={handleRightPressOut}
                style={[styles.actionButton, rightAnimatedStyle]}
                activeOpacity={0.7}
              >
                <Ionicons name={rightIcon || 'settings-outline'} size={24} color={colors.white} />
              </AnimatedTouchable>
            ) : (
              <View style={styles.actionPlaceholder} />
            )}
          </View>
          {children}
        </Animated.View>
      </SafeAreaView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  safeArea: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.page,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPlaceholder: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.small,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});