/**
 * Error Handling Utilities
 * Centralized error management, user-friendly messages, logging
 */

import { Alert } from 'react-native';
import { logger } from './api';

/**
 * User-friendly error messages mapped from error types
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to reach the server. Please check your internet connection.',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },

  // Authentication errors
  AUTH_ERROR: {
    title: 'Authentication Failed',
    message: 'Please log in again.',
  },
  UNAUTHORIZED: {
    title: 'Unauthorized',
    message: 'You don\'t have permission to perform this action.',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
  },
  MISSING_FIELD: {
    title: 'Missing Information',
    message: 'Please fill in all required fields.',
  },

  // File errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'Please select a smaller file (max 10 MB).',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'Please select a valid image file.',
  },

  // Server errors
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on the server. Please try again later.',
  },
  NOT_FOUND: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
  },

  // Generic error
  GENERIC_ERROR: {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Classify error and return user-friendly message
 */
export const getErrorMessage = (error) => {
  // API errors
  if (error.name === 'APIError') {
    if (error.status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
    if (error.status === 403) return ERROR_MESSAGES.AUTH_ERROR;
    if (error.status === 404) return ERROR_MESSAGES.NOT_FOUND;
    if (error.status === 400) return ERROR_MESSAGES.VALIDATION_ERROR;
    if (error.status >= 500) return ERROR_MESSAGES.SERVER_ERROR;
    return ERROR_MESSAGES.GENERIC_ERROR;
  }

  // Network errors
  if (error.message === 'Network request failed') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // File errors
  if (error.code === 'FILE_TOO_LARGE') {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  }
  if (error.code === 'INVALID_FILE_TYPE') {
    return ERROR_MESSAGES.INVALID_FILE_TYPE;
  }

  // Validation errors
  if (error.code === 'VALIDATION_ERROR') {
    return {
      title: ERROR_MESSAGES.VALIDATION_ERROR.title,
      message: error.details || ERROR_MESSAGES.VALIDATION_ERROR.message,
    };
  }

  // Generic fallback
  return {
    title: error.name || ERROR_MESSAGES.GENERIC_ERROR.title,
    message: error.message || ERROR_MESSAGES.GENERIC_ERROR.message,
  };
};

/**
 * Show error alert to user
 */
export const showErrorAlert = (error, callback) => {
  const { title, message } = getErrorMessage(error);
  Alert.alert(title, message, [{ text: 'OK', onPress: callback }]);
};

/**
 * Handle async function with error handling and optional UI feedback
 */
export const handleAsync = async (
  asyncFn,
  {
    onSuccess = null,
    onError = null,
    showAlert = true,
    showLoading = null,
    context = 'Operation',
  } = {}
) => {
  try {
    if (showLoading) showLoading(true);
    logger.log('Handler', `Starting: ${context}`);

    const result = await asyncFn();

    if (showLoading) showLoading(false);
    if (onSuccess) onSuccess(result);

    logger.log('Handler', `Success: ${context}`);
    return { success: true, data: result };
  } catch (error) {
    if (showLoading) showLoading(false);

    logger.error('Handler', `Error in ${context}`, error);

    if (onError) onError(error);
    if (showAlert) showErrorAlert(error, () => {});

    return { success: false, error };
  }
};

/**
 * Validate async function and return result or null
 */
export const tryAsync = async (asyncFn, fallbackValue = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    logger.error('Handler', 'Caught error in tryAsync', error);
    return fallbackValue;
  }
};

/**
 * Retry async function with exponential backoff
 */
export const retryAsync = async (
  asyncFn,
  { maxRetries = 3, delay = 1000, backoffMultiplier = 2 } = {}
) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      logger.log('Handler', `Attempt ${i + 1}/${maxRetries}`);
      return await asyncFn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(backoffMultiplier, i);
        logger.warn('Handler', `Retry in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * Validate required fields
 */
export const validateRequired = (data, fields) => {
  const missing = [];

  for (const field of fields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    const error = new Error('Missing required fields');
    error.code = 'VALIDATION_ERROR';
    error.details = `Missing: ${missing.join(', ')}`;
    throw error;
  }
};

/**
 * Validate file size
 */
export const validateFileSize = (bytes, maxMB = 10) => {
  const maxBytes = maxMB * 1024 * 1024;
  if (bytes > maxBytes) {
    const error = new Error(`File too large (max ${maxMB}MB)`);
    error.code = 'FILE_TOO_LARGE';
    throw error;
  }
};

/**
 * Validate file type
 */
export const validateFileType = (mimeType, allowedTypes = ['image/jpeg', 'image/png']) => {
  if (!allowedTypes.includes(mimeType)) {
    const error = new Error(`Invalid file type: ${mimeType}`);
    error.code = 'INVALID_FILE_TYPE';
    throw error;
  }
};
