import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Dimensions, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
  withTiming, runOnJS, FadeIn, FadeOut
} from '../utils/reanimated-compat';
import { supabase } from '../../supabase';
import { colors, typography, spacing, radius, shadows } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

const MENU_ITEMS = [
  { id: 'home', label: 'Scan Item', icon: 'scan-outline', route: 'Scan' },
  { id: 'listings', label: 'My Items', icon: 'list-outline', route: 'My Items' },
  { id: 'settings', label: 'Settings', icon: 'settings-outline', route: 'Settings' },
  { id: 'about', label: 'About', icon: 'information-circle-outline', route: 'About' },
];

export default function MenuDrawer({
  visible,
  onClose,
  onNavigate,
  currentRoute,
  onLogout
}) {
  const translateX = useSharedValue(-DRAWER_WIDTH);

  const handleLogout = useCallback(async () => {
    onClose();
    if (onLogout) {
      onLogout();
    } else {
      await supabase.auth.signOut();
    }
  }, [onClose, onLogout]);

  const handleNavigate = useCallback((route) => {
    onClose();
    if (onNavigate) {
      onNavigate(route);
    }
  }, [onClose, onNavigate]);

  React.useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 250 });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <Animated.View entering={FadeIn.duration(300)} style={[styles.drawer, drawerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={colors.white} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Welcome</Text>
                <Text style={styles.userEmail}>List It Fast User</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconContainer, isActive && styles.menuIconActive]}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isActive ? colors.primary : colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.lg,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  userInfo: {
    marginLeft: spacing.md + 2,
    flex: 1,
  },
  userName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
  },
  menuItemActive: {
    backgroundColor: colors.infoLight,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuIconActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  menuLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.errorLight,
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
