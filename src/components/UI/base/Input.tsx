import React from 'react';
import { useDensity } from '../../../contexts/ui/DensityContext';
import { densityClasses } from '../DensityStyles';

/**
 * Size variants for the Input component
 */
export type InputSize = 'small' | 'medium' | 'large';

/**
 * Props for the Input component
 */
export interface InputProps {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

/**
 * A text input component that adapts to density settings
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  className = '',
  size = 'medium',
  prefix,
  suffix,
  fullWidth = false,
  containerClassName = '',
  id,
  ...rest
}) => {
  const { density } = useDensity();
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Compute CSS classes based on props
  const inputClass = densityClasses.input;
  const sizeClass = `input-${size}`;
  const errorClass = error ? 'input-error' : '';
  const fullWidthClass = fullWidth ? 'input-full-width' : '';
  const prefixClass = prefix ? 'input-has-prefix' : '';
  const suffixClass = suffix ? 'input-has-suffix' : '';
  
  const inputClasses = [
    inputClass,
    sizeClass,
    errorClass,
    fullWidthClass,
    prefixClass,
    suffixClass,
    className
  ].filter(Boolean).join(' ');
  
  const containerClasses = [
    'input-container',
    fullWidthClass,
    containerClassName
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} data-density={density}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      
      <div className="input-wrapper">
        {prefix && (
          <div className="input-prefix">
            {prefix}
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={
            helperText || error ? `${inputId}-helper` : undefined
          }
          {...rest}
        />
        
        {suffix && (
          <div className="input-suffix">
            {suffix}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <div
          id={`${inputId}-helper`}
          className={`input-helper-text ${error ? 'input-error-text' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
};
