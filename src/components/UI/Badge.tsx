import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'danger' 
  | 'warning'
  | 'info';

export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: 'full' | 'md';
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'sm',
  rounded = 'md',
  className,
  children
}: BadgeProps) {
  // Base styles
  const baseStyles = "inline-flex items-center font-medium";
  
  // Size specific styles
  const sizeStyles = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-sm"
  };
  
  // Variant specific styles
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-indigo-100 text-indigo-800",
    secondary: "bg-purple-100 text-purple-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-blue-100 text-blue-800"
  };
  
  // Rounded styles
  const roundedStyles = {
    full: "rounded-full",
    md: "rounded-md"
  };
  
  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        roundedStyles[rounded],
        className
      )}
    >
      {children}
    </span>
  );
}
