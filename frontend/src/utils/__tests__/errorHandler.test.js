/**
 * Unit Tests for Error Handler Utility
 */

import {
  getErrorMessage,
  handleAsync,
  tryAsync,
  retryAsync,
  validateRequired,
  validateFileSize,
  validateFileType,
} from '../errorHandler';

describe('getErrorMessage', () => {
  test('should map API error 401 to unauthorized', () => {
    const error = { name: 'APIError', status: 401 };
    const msg = getErrorMessage(error);
    expect(msg.title).toContain('Unauthorized');
  });

  test('should map API error 404 to not found', () => {
    const error = { name: 'APIError', status: 404 };
    const msg = getErrorMessage(error);
    expect(msg.title).toContain('Not Found');
  });

  test('should map network error', () => {
    const error = { message: 'Network request failed' };
    const msg = getErrorMessage(error);
    expect(msg.title).toContain('Connection');
  });

  test('should map file size error', () => {
    const error = { code: 'FILE_TOO_LARGE' };
    const msg = getErrorMessage(error);
    expect(msg.title).toContain('File Too Large');
  });

  test('should return generic error for unknown type', () => {
    const error = { message: 'Unknown error' };
    const msg = getErrorMessage(error);
    expect(msg.title).toBeDefined();
    expect(msg.message).toBeDefined();
  });
});

describe('handleAsync', () => {
  test('should handle successful async operation', async () => {
    const mockFn = jest.fn().mockResolvedValue({ data: 'success' });
    const onSuccess = jest.fn();

    const result = await handleAsync(mockFn, {
      onSuccess,
      showAlert: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ data: 'success' });
    expect(onSuccess).toHaveBeenCalled();
  });

  test('should handle failed async operation', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const onError = jest.fn();

    const result = await handleAsync(mockFn, {
      onError,
      showAlert: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });

  test('should call loading callbacks', async () => {
    const mockFn = jest.fn().mockResolvedValue({});
    const showLoading = jest.fn();

    await handleAsync(mockFn, {
      showLoading,
      showAlert: false,
    });

    expect(showLoading).toHaveBeenCalledWith(true);
    expect(showLoading).toHaveBeenCalledWith(false);
  });
});

describe('tryAsync', () => {
  test('should return result on success', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await tryAsync(mockFn);

    expect(result).toBe('success');
  });

  test('should return fallback on error', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
    const result = await tryAsync(mockFn, 'fallback');

    expect(result).toBe('fallback');
  });

  test('should return null by default on error', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Failed'));
    const result = await tryAsync(mockFn);

    expect(result).toBeNull();
  });
});

describe('retryAsync', () => {
  test('should succeed on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await retryAsync(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry on failure', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce('success');

    const result = await retryAsync(mockFn, { maxRetries: 2, delay: 10 });

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('should throw after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      retryAsync(mockFn, { maxRetries: 2, delay: 10 })
    ).rejects.toThrow('Always fails');

    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('validateRequired', () => {
  test('should pass with all required fields', () => {
    expect(() => {
      validateRequired(
        { name: 'John', email: 'john@test.com' },
        ['name', 'email']
      );
    }).not.toThrow();
  });

  test('should throw with missing field', () => {
    expect(() => {
      validateRequired(
        { name: 'John', email: '' },
        ['name', 'email']
      );
    }).toThrow('Missing required fields');
  });

  test('should throw with empty string', () => {
    expect(() => {
      validateRequired(
        { name: '', email: 'test@test.com' },
        ['name', 'email']
      );
    }).toThrow();
  });
});

describe('validateFileSize', () => {
  test('should pass with valid file size', () => {
    expect(() => {
      validateFileSize(5 * 1024 * 1024, 10); // 5MB, max 10MB
    }).not.toThrow();
  });

  test('should throw with oversized file', () => {
    expect(() => {
      validateFileSize(15 * 1024 * 1024, 10); // 15MB, max 10MB
    }).toThrow('FILE_TOO_LARGE');
  });
});

describe('validateFileType', () => {
  test('should pass with valid MIME type', () => {
    expect(() => {
      validateFileType('image/jpeg', ['image/jpeg', 'image/png']);
    }).not.toThrow();
  });

  test('should throw with invalid MIME type', () => {
    expect(() => {
      validateFileType('video/mp4', ['image/jpeg', 'image/png']);
    }).toThrow('INVALID_FILE_TYPE');
  });
});
