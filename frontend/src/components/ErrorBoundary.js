/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('[ErrorBoundary]', error, errorInfo);

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  navigateHome = () => {
    if (this.props.onError) {
      this.props.onError(this.state.error);
    }
    this.resetError();
  };

  render() {
    if (this.state.hasError) {
      const isDev = __DEV__;

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle"
                size={80}
                color={colors.danger}
              />
            </View>

            {/* Error Message */}
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </Text>

            {/* Error Details (Dev Only) */}
            {isDev && this.state.error && (
              <View style={styles.debugSection}>
                <Text style={styles.debugTitle}>Debug Info (Development Only)</Text>
                <View style={styles.debugBox}>
                  <Text style={styles.debugText} selectable>
                    {this.state.error.toString()}
                  </Text>
                </View>
                {this.state.errorInfo && (
                  <View style={styles.debugBox}>
                    <Text style={styles.debugText} selectable>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Error Count Warning */}
            {this.state.errorCount > 3 && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.warningText}>
                  Multiple errors detected. Please restart the app.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={this.resetError}
            >
              <Ionicons name="refresh" size={18} color={colors.white} />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={this.navigateHome}
            >
              <Ionicons name="home" size={18} color={colors.primary} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  content: {
    flexGrow: 1,
    padding: spacing.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  debugSection: {
    width: '100%',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  debugBox: {
    backgroundColor: colors.gray100,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  warningText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    padding: spacing.page,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
});
