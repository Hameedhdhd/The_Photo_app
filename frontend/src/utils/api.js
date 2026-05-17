/**
 * API Configuration & Client
 * Centralized API management with error handling, logging, and auth
 */

import { fetchWithCache, apiCache } from './apiCache';

// API Base URL configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Development flag
const isDev = __DEV__;

/**
 * Logger with development flag
 */
const logger = {
  log: (tag, msg, data) => isDev && console.log(`[${tag}]`, msg, data || ''),
  error: (tag, msg, error) => console.error(`[${tag}]`, msg, error),
  warn: (tag, msg) => isDev && console.warn(`[${tag}]`, msg),
};

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Request interceptor - adds auth headers, logging
 */
const prepareRequest = (options = {}, { headers = {}, ...rest } = {}) => {
  return {
    ...options,
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
};

/**
 * Response handler - checks status, parses JSON, handles errors
 */
const handleResponse = async (response, requestUrl) => {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType?.includes('application/json');

  // Handle non-JSON responses (like blob for images)
  if (!isJSON && !response.ok) {
    throw new APIError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      { url: requestUrl }
    );
  }

  // Handle JSON responses
  if (isJSON) {
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        response.status,
        data.detail || `HTTP ${response.status}`,
        data
      );
    }

    return data;
  }

  // Handle non-JSON success
  if (response.ok) {
    return response;
  }

  throw new APIError(response.status, response.statusText, { url: requestUrl });
};

/**
 * GET request with caching
 */
export const apiGet = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logger.log('API', `GET ${endpoint}`);

  try {
    // Try cache first
    const cached = await apiCache.get(url);
    if (cached && !options.skipCache) {
      logger.log('API', `Cache HIT: ${endpoint}`);
      return cached;
    }

    const response = await fetch(url, prepareRequest(options));
    const data = await handleResponse(response, url);

    // Cache the result
    if (options.cacheTime) {
      await apiCache.set(url, {}, data, options.cacheTime);
    }

    return data;
  } catch (error) {
    logger.error('API', `GET ${endpoint} failed`, error);
    throw error;
  }
};

/**
 * POST request (no caching)
 */
export const apiPost = async (endpoint, body = {}, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logger.log('API', `POST ${endpoint}`, body);

  try {
    const response = await fetch(
      url,
      prepareRequest(
        {
          method: 'POST',
          body: body instanceof FormData ? body : JSON.stringify(body),
        },
        options
      )
    );

    // Don't parse JSON for FormData responses with blobs
    if (body instanceof FormData) {
      return await handleResponse(response, url);
    }

    const data = await handleResponse(response, url);
    return data;
  } catch (error) {
    logger.error('API', `POST ${endpoint} failed`, error);
    throw error;
  }
};

/**
 * PUT request
 */
export const apiPut = async (endpoint, body = {}, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logger.log('API', `PUT ${endpoint}`, body);

  try {
    const response = await fetch(
      url,
      prepareRequest(
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
        options
      )
    );

    const data = await handleResponse(response, url);
    return data;
  } catch (error) {
    logger.error('API', `PUT ${endpoint} failed`, error);
    throw error;
  }
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  logger.log('API', `DELETE ${endpoint}`);

  try {
    const response = await fetch(url, prepareRequest({ method: 'DELETE' }, options));
    const data = await handleResponse(response, url);
    return data;
  } catch (error) {
    logger.error('API', `DELETE ${endpoint} failed`, error);
    throw error;
  }
};

/**
 * Clear all cached API responses
 * Call this on logout, refresh, etc.
 */
export const clearAPICache = async () => {
  await apiCache.clearAll();
  logger.log('API', 'Cache cleared');
};

/**
 * Get API base URL
 */
export const getAPIBaseURL = () => API_BASE_URL;

/**
 * Export logger for use in components
 */
export { logger };
