import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, runOnJS, useAnimatedReaction
} from 'react-native-reanimated';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import Button from './Button';
import { colors, typography, spacing, radius, shadows } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_CROP_SIZE = 120;
const MAX_CROP_SIZE = SCREEN_WIDTH - 48;
const INITIAL_CROP_SIZE = SCREEN_WIDTH - 48;
const INITIAL_CROP_X = 24;
const INITIAL_CROP_Y = (SCREEN_HEIGHT * 0.42 - INITIAL_CROP_SIZE) / 2 + 80;

export default function ImageCropper({ imageUri, onCrop, onRetake }) {
  const [processing, setProcessing] = useState(false);
  const [zoomLabel, setZoomLabel] = useState('1.0x');

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const updateZoomLabel = useCallback((val) => {
    setZoomLabel(`${val.toFixed(1)}x`);
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
      runOnJS(updateZoomLabel)(scale.value);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetTransform = useCallback(() => {
    'worklet';
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    runOnJS(setZoomLabel)('1.0x');
  }, []);

  const handleCrop = async () => {
    setProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, -translateX.value / scale.value),
              originY: Math.max(0, (-translateY.value + (INITIAL_CROP_Y - 80)) / scale.value),
              width: INITIAL_CROP_SIZE / scale.value,
              height: INITIAL_CROP_SIZE / scale.value,
            },
          },
          { resize: { width: 800 } },
        ],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      onCrop(manipResult.uri);
    } catch (error) {
      console.error('Crop error:', error);
      onCrop(imageUri);
    } finally {
      setProcessing(false);
    }
  };

  const handleUseFull = () => {
    onCrop(imageUri);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={onRetake} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Retake</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adjust Photo</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      {/* Instruction Bar */}
      <View style={styles.instructionBar}>
        <Ionicons name="hand-left-outline" size={14} color={colors.primary} />
        <Text style={styles.instructionText}>Pinch to zoom • Drag to position</Text>
      </View>

      {/* Crop Area */}
      <View style={styles.cropContainer}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageWrapper, animatedStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        {/* Crop Overlay */}
        <View style={styles.cropOverlay} pointerEvents="none">
          <View style={[styles.darkOverlay, { top: 0, left: 0, right: 0, height: INITIAL_CROP_Y - 10 }]} />
          <View style={[styles.darkOverlay, { bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT - INITIAL_CROP_Y - INITIAL_CROP_SIZE - 80 }]} />
          <View style={[styles.darkOverlay, { top: INITIAL_CROP_Y - 10, left: 0, width: INITIAL_CROP_X, height: INITIAL_CROP_SIZE + 20 }]} />
          <View style={[styles.darkOverlay, { top: INITIAL_CROP_Y - 10, right: 0, width: INITIAL_CROP_X, height: INITIAL_CROP_SIZE + 20 }]} />

          {/* Crop Frame */}
          <View style={styles.cropFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={[styles.gridLine, { top: '33.33%' }]} />
            <View style={[styles.gridLine, { top: '66.66%' }]} />
            <View style={[styles.gridLineVertical, { left: '33.33%' }]} />
            <View style={[styles.gridLineVertical, { left: '66.66%' }]} />
          </View>
        </View>
      </View>

      {/* Zoom Indicator */}
      <View style={styles.zoomIndicator}>
        <View style={styles.zoomBadge}>
          <Ionicons name="scan-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.zoomText}>{zoomLabel}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.resetButton} onPress={resetTransform} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <Button
          title="Crop & Use"
          onPress={handleCrop}
          loading={processing}
          icon="crop"
          style={styles.cropButton}
        />

        <TouchableOpacity style={styles.useFullButton} onPress={handleUseFull} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={18} color={colors.white} />
          <Text style={styles.useFullText}>Use Full</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  backText: {
    ...typography.small,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.white,
  },
  headerSpacer: {
    width: 80,
  },
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.page,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.small,
    color: colors.primaryLight,
    marginLeft: spacing.xs,
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cropFrame: {
    position: 'absolute',
    top: INITIAL_CROP_Y - 10,
    left: INITIAL_CROP_X,
    width: INITIAL_CROP_SIZE,
    height: INITIAL_CROP_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  topLeft: { top: -3, left: -3, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: -3, right: -3, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: -3, left: -3, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: -3, right: -3, borderBottomWidth: 4, borderRightWidth: 4 },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  zoomIndicator: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  zoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  zoomText: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  resetText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  cropButton: {
    flex: 1,
  },
  useFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  useFullText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});