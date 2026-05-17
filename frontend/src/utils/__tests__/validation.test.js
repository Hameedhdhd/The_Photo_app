/**
 * Unit Tests for Validation Utility
 */

import { Validators, FormValidator, Sanitizers, SCHEMAS } from '../validation';

describe('Validators', () => {
  describe('email', () => {
    test('should validate correct email', () => {
      expect(Validators.email('user@example.com')).toBe(true);
      expect(Validators.email('test.email+tag@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(Validators.email('invalid')).toBe(false);
      expect(Validators.email('invalid@')).toBe(false);
      expect(Validators.email('@domain.com')).toBe(false);
    });
  });

  describe('password', () => {
    test('should validate strong password', () => {
      expect(Validators.password('Password123')).toBe(true);
    });

    test('should reject weak password', () => {
      expect(Validators.password('weak')).toBe(false); // Too short
      expect(Validators.password('nouppercase123')).toBe(false); // No uppercase
      expect(Validators.password('NoNumbers')).toBe(false); // No numbers
    });
  });

  describe('price', () => {
    test('should validate positive price', () => {
      expect(Validators.price('19.99')).toBe(true);
      expect(Validators.price('100')).toBe(true);
    });

    test('should reject invalid price', () => {
      expect(Validators.price('0')).toBe(false);
      expect(Validators.price('-50')).toBe(false);
      expect(Validators.price('abc')).toBe(false);
    });
  });

  describe('postcode', () => {
    test('should validate German postcode', () => {
      expect(Validators.postcode('10115')).toBe(true);
      expect(Validators.postcode('53175')).toBe(true);
    });

    test('should reject invalid postcode', () => {
      expect(Validators.postcode('123')).toBe(false); // Too short
      expect(Validators.postcode('1011A')).toBe(false); // Contains letter
      expect(Validators.postcode('101 15')).toBe(false); // Contains space
    });
  });

  describe('required', () => {
    test('should validate non-empty string', () => {
      expect(Validators.required('text')).toBe(true);
      expect(Validators.required('  text  ')).toBe(true);
    });

    test('should reject empty string', () => {
      expect(Validators.required('')).toBe(false);
      expect(Validators.required('   ')).toBe(false);
    });
  });
});

describe('FormValidator', () => {
  test('should validate single field', () => {
    const schema = new FormValidator({
      email: {
        validators: [Validators.required, Validators.email],
        messages: {
          required: 'Email is required',
          email: 'Invalid email',
        },
      },
    });

    const result1 = schema.validateField('email', 'test@example.com');
    expect(result1.isValid).toBe(true);

    const result2 = schema.validateField('email', 'invalid');
    expect(result2.isValid).toBe(false);
    expect(result2.getError('email')).toBe('Invalid email');
  });

  test('should validate entire form', () => {
    const result = SCHEMAS.login.validate({
      email: 'test@example.com',
      password: 'Password123',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('should collect multiple field errors', () => {
    const result = SCHEMAS.login.validate({
      email: 'invalid',
      password: 'weak',
    });

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });
});

describe('Sanitizers', () => {
  test('stripHTML should remove HTML tags', () => {
    expect(Sanitizers.stripHTML('<p>Hello</p>')).toBe('Hello');
    expect(Sanitizers.stripHTML('<div class="test">Text</div>')).toBe('Text');
  });

  test('trim should remove whitespace', () => {
    expect(Sanitizers.trim('  hello  ')).toBe('hello');
    expect(Sanitizers.trim('test')).toBe('test');
  });

  test('normalizePrice should format correctly', () => {
    expect(Sanitizers.normalizePrice('19.5')).toBe('19.50');
    expect(Sanitizers.normalizePrice('100')).toBe('100.00');
    expect(Sanitizers.normalizePrice('invalid')).toBe('0.00');
  });

  test('normalizePostcode should remove spaces', () => {
    expect(Sanitizers.normalizePostcode('101 15')).toBe('10115');
    expect(Sanitizers.normalizePostcode('53 175')).toBe('53175');
  });
});
