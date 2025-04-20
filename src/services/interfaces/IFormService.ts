import { IService } from './IService';
import { ZodSchema, ZodError } from 'zod';

/**
 * Events that can be emitted by the FormService
 */
export interface FormServiceEvents {
  'form-submitted': { formId: string; data: any };
  'form-validation-error': { formId: string; errors: ZodError };
  'form-reset': { formId: string };
  'form-field-changed': { formId: string; field: string; value: any };
  error: Error;
}

/**
 * Validation result with typed data and errors
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ZodError;
}

/**
 * Form state tracking interface
 */
export interface FormState<T> {
  values: Partial<T>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
}

/**
 * Interface for the FormService
 * Provides methods to handle form validation, submission, and state management
 */
export interface IFormService extends IService<FormServiceEvents> {
  /**
   * Validate form data against a schema
   * @param schema Zod schema for validation
   * @param data Form data to validate
   * @returns Validation result with typed data or errors
   */
  validate<T>(schema: ZodSchema<T>, data: any): ValidationResult<T>;

  /**
   * Register a form with the service and get its initial state
   * @param formId Unique identifier for the form
   * @param schema Zod schema for form validation
   * @param initialValues Initial form values (optional)
   */
  registerForm<T>(
    formId: string,
    schema: ZodSchema<T>,
    initialValues?: Partial<T>
  ): FormState<T>;

  /**
   * Update form values and validate
   * @param formId Unique identifier for the form
   * @param values Form values to update
   * @param shouldValidate Whether to validate after update (default: true)
   */
  updateForm<T>(
    formId: string,
    values: Partial<T>,
    shouldValidate?: boolean
  ): FormState<T>;

  /**
   * Get current form state
   * @param formId Unique identifier for the form
   */
  getFormState<T>(formId: string): FormState<T> | null;

  /**
   * Handle form submission
   * @param formId Unique identifier for the form
   * @param onSuccess Callback for successful submission
   * @param onError Callback for validation errors
   */
  submitForm<T>(
    formId: string,
    onSuccess: (data: T) => void | Promise<void>,
    onError?: (errors: ZodError) => void
  ): Promise<void>;

  /**
   * Reset a form to its initial state
   * @param formId Unique identifier for the form
   */
  resetForm(formId: string): void;

  /**
   * Unregister a form when no longer needed
   * @param formId Unique identifier for the form
   */
  unregisterForm(formId: string): void;
}
