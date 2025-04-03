/**
 * Form validation utilities
 * Provides consistent validation rules and error messages for forms
 */

// Types for validation
export type ValidationRule = (value: any) => string | null;
export type FieldValidation = Record<string, ValidationRule[]>;
export type ValidationErrors = Record<string, string | null>;

/**
 * Common validation rules
 */

// Required field validation
export const required = (message: string = 'This field is required'): ValidationRule => 
  (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  };

// Minimum length validation
export const minLength = (length: number, message?: string): ValidationRule => 
  (value: string) => {
    if (!value || value.length < length) {
      return message || `Must be at least ${length} characters`;
    }
    return null;
  };

// Maximum length validation
export const maxLength = (length: number, message?: string): ValidationRule => 
  (value: string) => {
    if (value && value.length > length) {
      return message || `Must be no more than ${length} characters`;
    }
    return null;
  };

// Pattern validation (regex)
export const pattern = (regex: RegExp, message: string): ValidationRule => 
  (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  };

// Email validation
export const isEmail = (message: string = 'Please enter a valid email address'): ValidationRule => 
  pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, message);

// Date validation
export const isValidDate = (message: string = 'Please enter a valid date'): ValidationRule => 
  (value: any) => {
    if (!value) return null;
    
    // Check if it's a valid date string
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return message;
    }
    return null;
  };

// Future date validation
export const isFutureDate = (message: string = 'Date must be in the future'): ValidationRule => 
  (value: any) => {
    if (!value) return null;
    
    const date = new Date(value);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    
    if (date <= now) {
      return message;
    }
    
    return null;
  };

// Custom field validation
export const custom = (validationFn: (value: any) => boolean, message: string): ValidationRule =>
  (value: any) => {
    if (!validationFn(value)) {
      return message;
    }
    return null;
  };

/**
 * Validate a single value against an array of validation rules
 * Returns the first error message or null if all validations pass
 */
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Validate form values against field validation rules
 * Returns an object with field names and error messages
 */
export function validateForm(
  values: Record<string, any>, 
  fieldValidations: FieldValidation
): ValidationErrors {
  const errors: ValidationErrors = {};
  
  for (const [field, rules] of Object.entries(fieldValidations)) {
    const error = validateField(values[field], rules);
    errors[field] = error;
  }
  
  return errors;
}

/**
 * Check if form has any validation errors
 */
export function hasFormErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(error => error !== null);
}

/**
 * Create a validation schema for a task form
 */
export function createTaskValidationSchema() {
  return {
    title: [
      required('Task title is required'),
      minLength(3, 'Title must be at least 3 characters'),
      maxLength(100, 'Title must be less than 100 characters')
    ],
    due_date: [
      isValidDate('Please enter a valid due date')
    ],
    estimated_time: [
      custom(
        (value) => !value || (typeof value === 'number' && value > 0),
        'Estimated time must be a positive number'
      )
    ]
  };
}
