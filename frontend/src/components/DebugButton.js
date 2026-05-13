import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  SafeAreaView, Share, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, runOnJS } from '../utils/reanimated-compat';
import { DebugLogger } from '../utils/DebugLogger';
import { colors, typography, spacing, radius, shadows } from '../theme';

export default function DebugButton() {
  const [showModal, setShowModal] = useState(false);

  const openLogs = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCopy = useCallback(async () => {
    const success = await DebugLogger.copyToClipboard();
    if (success) {
      Alert.alert('Copied!', 'Logs copied to clipboard.');
    }
  }, []);

  const handleShare = useCallback(async () => {
    const text = DebugLogger.getLogsAsText();
    try {
      await Share.share({
        message: text,
        title: 'App Debug Logs',
      });
    } catch (e) {
      // User cancelled or error
    }
  }, []);

  const handleClear = useCallback(() => {
    DebugLogger.clearLogs();
  }, []);

  const logs = DebugLogger.getLogs();

  return (
    <>
      {/* Floating FAB */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={openLogs} activeOpacity={0.7}>
          <Ionicons name="bug-outline" size={20} color={colors.white} />
          {logs.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{logs.length > 99 ? '99+' : logs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Log Viewer Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Ionicons name="terminal" size={22} color={colors.primary} />
              <Text style={styles.modalTitle}>Debug Logs</Text>
            </View>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Log Count Bar */}
          <View style={styles.logCountBar}>
            <View style={styles.logCountDot} />
            <Text style={styles.logCountText}>{logs.length} log entries</Text>
          </View>

          {/* Logs List */}
          <ScrollView style={styles.logList} showsVerticalScrollIndicator={true}>
            {logs.map((log, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.duration(200).delay(index * 20)}
                style={[
                  styles.logEntry,
                  log.level === 'ERR' && styles.logError,
                  log.level === 'FATAL' && styles.logFatal,
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <View style={[styles.levelBadge, log.level === 'ERR' && styles.levelBadgeError, log.level === 'WRN' && styles.levelBadgeWarn]}>
                    <Text style={[styles.logLevel, log.level === 'ERR' && styles.levelError, log.level === 'FATAL' && styles.levelFatal, log.level === 'WRN' && styles.levelWarn]}>
                      {log.level}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logMessage} numberOfLines={4}>{log.message}</Text>
              </Animated.View>
            ))}
            {logs.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyCircle}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
                <Text style={styles.emptyText}>No logs yet</Text>
                <Text style={styles.emptySubtext}>Everything looks good!</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={handleClear} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <Text style={[styles.actionBtnText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: spacing.page,
    zIndex: 9999,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.gray900,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.gray800,
    gap: spacing.sm,
  },
  logCountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  logCountText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  logList: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logEntry: {
    backgroundColor: colors.gray800,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  logError: {
    borderLeftColor: colors.error,
    backgroundColor: '#1E1525',
  },
  logFatal: {
    borderLeftColor: '#FF0000',
    backgroundColor: '#2A0A0A',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  logTimestamp: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  levelBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  levelBadgeError: {
    backgroundColor: colors.errorLight,
  },
  levelBadgeWarn: {
    backgroundColor: colors.warningLight,
  },
  logLevel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '800',
  },
  levelError: { color: colors.error },
  levelFatal: { color: '#FF0000' },
  levelWarn: { color: colors.warning },
  logMessage: {
    color: colors.gray200,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray800,
    backgroundColor: colors.gray900,
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray800,
    gap: spacing.xs,
  },
  clearBtn: {
    backgroundColor: colors.errorLight,
  },
  actionBtnText: {
    ...typography.small,
    fontWeight: '700',
  },
});
