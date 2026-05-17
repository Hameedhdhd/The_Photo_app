/**
 * Input Validation Utilities
 * Centralized validation for forms, API inputs, etc.
 */

/**
 * Validation result object
 */
export class ValidationResult {
  constructor(isValid = true, errors = {}) {
    this.isValid = isValid;
    this.errors = errors;
    this.firstError = Object.values(errors)[0];
  }

  addError(field, message) {
    this.errors[field] = message;
    this.isValid = false;
  }

  getErrors() {
    return this.errors;
  }

  hasError(field) {
    return !!this.errors[field];
  }

  getError(field) {
    return this.errors[field];
  }
}

/**
 * Validators
 */
export const Validators = {
  /**
   * Email validation
   */
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  /**
   * Password validation (min 6 chars, 1 number, 1 uppercase)
   */
  password: (value) => {
    if (value.length < 6) return false;
    if (!/\d/.test(value)) return false;
    if (!/[A-Z]/.test(value)) return false;
    return true;
  },

  /**
   * URL validation
   */
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Phone number (basic)
   */
  phone: (value) => {
    const regex = /^[\d\s\-\+\(\)]{7,15}$/;
    return regex.test(value.replace(/\s/g, ''));
  },

  /**
   * Price (positive number)
   */
  price: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  /**
   * Postcode (German, 5 digits)
   */
  postcode: (value) => {
    const regex = /^\d{5}$/;
    return regex.test(value.trim());
  },

  /**
   * Address (not empty, reasonable length)
   */
  address: (value) => {
    return value.trim().length >= 5 && value.trim().length <= 200;
  },

  /**
   * Text field (not empty)
   */
  required: (value) => {
    return value && value.trim().length > 0;
  },

  /**
   * Text field (min length)
   */
  minLength: (length) => (value) => {
    return value && value.trim().length >= length;
  },

  /**
   * Text field (max length)
   */
  maxLength: (length) => (value) => {
    return value && value.trim().length <= length;
  },

  /**
   * Number range
   */
  range: (min, max) => (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },
};

/**
 * Form validator
 */
export class FormValidator {
  constructor(schema = {}) {
    this.schema = schema; // { fieldName: { validators: [...], messages: {...} } }
  }

  /**
   * Validate single field
   */
  validateField(fieldName, value) {
    const field = this.schema[fieldName];
    if (!field) return new ValidationResult(true); // No schema for this field

    const result = new ValidationResult(true);

    if (!field.validators) return result;

    for (const validator of field.validators) {
      const isValid = validator(value);
      if (!isValid) {
        const message = field.messages?.[validator.name] || `${fieldName} is invalid`;
        result.addError(fieldName, message);
        break; // Stop after first error
      }
    }

    return result;
  }

  /**
   * Validate entire form
   */
  validate(data) {
    const result = new ValidationResult(true);

    for (const fieldName of Object.keys(this.schema)) {
      const fieldResult = this.validateField(fieldName, data[fieldName]);
      if (!fieldResult.isValid) {
        result.errors[fieldName] = fieldResult.firstError;
        result.isValid = false;
      }
    }

    return result;
  }
}

/**
 * Pre-built schemas
 */
export const SCHEMAS = {
  /**
   * Login form
   */
  login: new FormValidator({
    email: {
      validators: [Validators.required, Validators.email],
      messages: {
        required: 'Email is required',
        email: 'Invalid email format',
      },
    },
    password: {
      validators: [Validators.required, Validators.minLength(6)],
      messages: {
        required: 'Password is required',
        minLength: 'Password must be at least 6 characters',
      },
    },
  }),

  /**
   * Listing form
   */
  listing: new FormValidator({
    title: {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
      ],
      messages: {
        required: 'Title is required',
        minLength: 'Title must be at least 3 characters',
        maxLength: 'Title must be less than 100 characters',
      },
    },
    price: {
      validators: [Validators.required, Validators.price],
      messages: {
        required: 'Price is required',
        price: 'Price must be a positive number',
      },
    },
    description: {
      validators: [Validators.minLength(10), Validators.maxLength(500)],
      messages: {
        minLength: 'Description must be at least 10 characters',
        maxLength: 'Description must be less than 500 characters',
      },
    },
  }),

  /**
   * Address form
   */
  address: new FormValidator({
    address: {
      validators: [Validators.required, Validators.address],
      messages: {
        required: 'Address is required',
        address: 'Please enter a valid address',
      },
    },
    postcode: {
      validators: [Validators.postcode],
      messages: {
        postcode: 'Postcode must be 5 digits',
      },
    },
  }),
};

/**
 * Sanitization utilities
 */
export const Sanitizers = {
  /**
   * Remove HTML tags
   */
  stripHTML: (value) => {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, '');
  },

  /**
   * Trim whitespace
   */
  trim: (value) => {
    return value?.trim() ?? '';
  },

  /**
   * Normalize price (2 decimal places)
   */
  normalizePrice: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  },

  /**
   * Normalize postcode (remove spaces)
   */
  normalizePostcode: (value) => {
    return value.replace(/\s/g, '');
  },
};
