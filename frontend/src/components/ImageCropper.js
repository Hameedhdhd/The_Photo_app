import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH * 0.8;

export default function ImageCropper({ imageUri, onCrop, onCancel }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const onPinchEvent = useAnimatedGestureHandler({
    onActive: (event) => {
      scale.value = event.scale;
    },
    onEnd: () => {
      // Keep within reasonable bounds
      if (scale.value < 1) scale.value = withSpring(1);
      if (scale.value > 3) scale.value = withSpring(3);
    },
  });

  const onPanEvent = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: () => {
      // We could add boundary snapping here
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleDone = async () => {
    // In a real custom cropper we'd calculate the exact pixel offsets
    // For now, let's use the current image with basic manipulation 
    // to provide a placeholder for the advanced logic
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    onCrop(result.uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cropperWindow}>
        <PanGestureHandler onGestureEvent={onPanEvent}>
          <Animated.View style={{ flex: 1 }}>
            <PinchGestureHandler onGestureEvent={onPinchEvent}>
              <Animated.View style={styles.imageContainer}>
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={[styles.image, animatedStyle]}
                  resizeMode="contain"
                />
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
        
        {/* Visual Crop Frame Overlay */}
        <View style={styles.overlay} pointerEvents="none">
           <View style={styles.cropFrame} />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.doneButton]} onPress={handleDone}>
          <Text style={styles.buttonText}>Crop & Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cropperWindow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 30,
    backgroundColor: '#000',
  },
  button: {
    padding: 15,
  },
  doneButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
