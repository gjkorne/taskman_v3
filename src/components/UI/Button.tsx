import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning'
  | 'info';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  // Base styles
  const baseStyles = "rounded font-medium transition-all duration-200 inline-flex items-center justify-center";
  
  // Size specific styles
  const sizeStyles = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base"
  };
  
  // Variant specific styles
  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
    success: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
    danger: "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
    warning: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
    info: "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  };
  
  // Full width style
  const widthStyle = fullWidth ? "w-full" : "";
  
  // Icon spacing
  const iconSpacing = children ? (iconPosition === 'left' ? 'mr-1.5' : 'ml-1.5') : '';
  
  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        widthStyle,
        className
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className={iconSpacing}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className={iconSpacing}>{icon}</span>
      )}
    </button>
  );
}
