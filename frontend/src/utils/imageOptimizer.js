/**
 * Image Optimization Utility
 * Compresses and resizes images before upload to reduce bandwidth and storage
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 }, // For list previews
  preview: { width: 600, height: 600 },    // For detail views
  original: { width: 1200, height: 1200 }, // For full-size storage
};

/**
 * Compress image with quality and size optimization
 * @param {string} imageUri - Local URI of image
 * @param {string} quality - 'low', 'medium', 'high' (compression level)
 * @returns {Promise<{uri: string, size: number}>} Optimized image URI and size
 */
export const optimizeImage = async (imageUri, quality = 'medium') => {
  try {
    // Determine compression level
    const compressionMap = {
      low: 0.6,
      medium: 0.75,
      high: 0.85,
    };
    const compressionQuality = compressionMap[quality] || 0.75;

    // Determine target size
    const sizeMap = {
      low: IMAGE_SIZES.thumbnail,
      medium: IMAGE_SIZES.preview,
      high: IMAGE_SIZES.original,
    };
    const targetSize = sizeMap[quality] || IMAGE_SIZES.preview;

    // First pass: resize
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: targetSize.width, height: targetSize.height } }],
      { compress: compressionQuality, format: 'jpeg' }
    );

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(resized.uri);
    const fileSizeInMB = (fileInfo.size || 0) / (1024 * 1024);

    console.log(
      `[ImageOptimizer] Optimized (${quality}): ${fileSizeInMB.toFixed(2)}MB, ` +
      `${targetSize.width}x${targetSize.height}`
    );

    return {
      uri: resized.uri,
      size: fileSizeInMB,
      width: targetSize.width,
      height: targetSize.height,
    };
  } catch (error) {
    console.error('[ImageOptimizer] Error optimizing image:', error);
    throw error;
  }
};

/**
 * Batch optimize multiple images
 * @param {string[]} imageUris - Array of image URIs
 * @param {string} quality - Compression level
 * @returns {Promise<{uri: string, size: number}[]>}
 */
export const optimizeImageBatch = async (imageUris, quality = 'medium') => {
  try {
    const optimized = await Promise.all(
      imageUris.map((uri) => optimizeImage(uri, quality))
    );

    const totalSize = optimized.reduce((sum, img) => sum + img.size, 0);
    console.log(
      `[ImageOptimizer] Batch optimized: ${optimized.length} images, ` +
      `${totalSize.toFixed(2)}MB total`
    );

    return optimized;
  } catch (error) {
    console.error('[ImageOptimizer] Batch optimization failed:', error);
    throw error;
  }
};

/**
 * Get thumbnail version of an image (for list previews)
 * Small file size, instant load
 */
export const getThumbnail = async (imageUri) => {
  return optimizeImage(imageUri, 'low');
};

/**
 * Get preview version of an image (for detail views)
 * Medium file size, good quality
 */
export const getPreview = async (imageUri) => {
  return optimizeImage(imageUri, 'medium');
};

/**
 * Get high-quality version (for full storage)
 * Larger file, best quality
 */
export const getHighQuality = async (imageUri) => {
  return optimizeImage(imageUri, 'high');
};
