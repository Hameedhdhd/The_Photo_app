import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, SafeAreaView, Platform, Animated, PanResponder, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import Button from './Button';
import { colors, typography, spacing, radius } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 48;
const CROP_X = 24;
const CROP_Y = (SCREEN_HEIGHT * 0.42 - CROP_SIZE) / 2 + 80;

export default function ImageCropper({ imageUri, onCrop, onRetake }) {
  const [processing, setProcessing] = useState(false);
  const [zoomLabel, setZoomLabel] = useState('1.0x');

  // Animated values for pan and scale
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  // Track current values for calculations
  const currentScale = useRef(1);
  const currentPan = useRef({ x: 0, y: 0 });

  // Listeners to keep track of values without Reanimated hooks
  React.useEffect(() => {
    const scaleId = scale.addListener(({ value }) => {
      currentScale.current = value;
      setZoomLabel(`${value.toFixed(1)}x`);
    });
    const panId = pan.addListener((value) => {
      currentPan.current = value;
    });
    return () => {
      scale.removeListener(scaleId);
      pan.removeListener(panId);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: currentPan.current.x,
          y: currentPan.current.y
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const resetTransform = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCrop = async () => {
    setProcessing(true);
    try {
      // Calculate crop based on current transform
      // OriginX/Y in the original image coordinate system
      // This is an approximation since we don't have the original image dimensions here,
      // but ImageManipulator works with pixel coordinates.
      // We'll use the relative offset.
      
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.max(0, -currentPan.current.x / currentScale.current),
              originY: Math.max(0, (-currentPan.current.y + (CROP_Y - 80)) / currentScale.current),
              width: CROP_SIZE / currentScale.current,
              height: CROP_SIZE / currentScale.current,
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

  const handleZoomIn = () => {
    const nextScale = Math.min(currentScale.current + 0.5, 5);
    Animated.spring(scale, { toValue: nextScale, useNativeDriver: true }).start();
  };

  const handleZoomOut = () => {
    const nextScale = Math.max(currentScale.current - 0.5, 1);
    Animated.spring(scale, { toValue: nextScale, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.instructionText}>Drag to position • Use buttons to zoom</Text>
      </View>

      {/* Crop Area */}
      <View style={styles.cropContainer}>
        <View 
          style={styles.gestureCapture} 
          {...panResponder.panHandlers}
        >
          <Animated.View 
            style={[
              styles.imageWrapper, 
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale }
                ]
              }
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Crop Overlay */}
        <View style={styles.cropOverlay} pointerEvents="none">
          <View style={[styles.darkOverlay, { top: 0, left: 0, right: 0, height: CROP_Y - 10 }]} />
          <View style={[styles.darkOverlay, { bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT - CROP_Y - CROP_SIZE - 80 }]} />
          <View style={[styles.darkOverlay, { top: CROP_Y - 10, left: 0, width: CROP_X, height: CROP_SIZE + 20 }]} />
          <View style={[styles.darkOverlay, { top: CROP_Y - 10, right: 0, width: CROP_X, height: CROP_SIZE + 20 }]} />

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

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Ionicons name="remove-circle-outline" size={32} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.zoomBadge}>
          <Text style={styles.zoomText}>{zoomLabel}</Text>
        </View>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Ionicons name="add-circle-outline" size={32} color={colors.white} />
        </TouchableOpacity>
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
    </View>
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
  gestureCapture: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
    top: CROP_Y - 10,
    left: CROP_X,
    width: CROP_SIZE,
    height: CROP_SIZE,
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
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  zoomBtn: {
    padding: spacing.xs,
  },
  zoomBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  zoomText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
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
