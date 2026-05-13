import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Button from '../components/Button';
import { colors, typography, spacing, radius, shadows } from '../theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ onMockLogin }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onMockLogin) onMockLogin();
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark, '#3730A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.heroContent}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
              style={styles.logoCircle}
            >
              <Ionicons name="scan" size={48} color={colors.white} />
            </LinearGradient>
          </View>
          
          <Text style={styles.appName}>List It Fast</Text>
          <Text style={styles.tagline}>Scan • Organize • Sell</Text>
        </Animated.View>
      </LinearGradient>

      {/* Form Section */}
      <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.formSection}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>
            Get started in seconds — snap a photo and let AI create your listing.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Scan</Text>
              <Text style={styles.featureDesc}>AI-powered item recognition</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bilingual</Text>
              <Text style={styles.featureDesc}>Auto-generate DE & EN listings</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Kleinanzeigen Ready</Text>
              <Text style={styles.featureDesc}>List directly on marketplace</Text>
            </View>
          </View>
        </View>

        <Button
          title="Get Started"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="large"
          icon="arrow-forward"
          iconRight
        />

        <Text style={styles.disclaimer}>
          Full account setup coming soon
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    height: height * 0.42,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
    letterSpacing: 2,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  welcomeContainer: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  features: {
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontSize: 15,
  },
  featureDesc: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 1,
  },
  disclaimer: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});