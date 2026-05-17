import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../../theme';

export default function MarketplaceItemModal({
  selectedItem,
  onClose,
  navigateToItemDetail,
  navigateToChat,
}) {
  if (!selectedItem) return null;

  return (
    <Modal visible={!!selectedItem} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalCard}>
          {selectedItem.image_url && (
            <Image source={{ uri: selectedItem.image_url }} style={styles.modalImage} />
          )}
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle} numberOfLines={2}>{selectedItem.title}</Text>
            <Text style={styles.modalPrice}>{selectedItem.price}</Text>
            {selectedItem.address && (
              <View style={styles.modalLocationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                <Text style={styles.modalLocationText} numberOfLines={1}>{selectedItem.address}</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { onClose(); navigateToItemDetail(selectedItem); }}>
                <Ionicons name="eye-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.modalBtnText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { onClose(); navigateToChat(selectedItem); }}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
                <Text style={[styles.modalBtnText, { color: colors.white }]}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...shadows.xl,
  },
  modalImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  modalBody: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  modalLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.lg,
  },
  modalLocationText: {
    ...typography.caption,
    color: colors.textTertiary,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalClose: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
