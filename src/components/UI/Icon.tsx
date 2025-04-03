import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Type for the icon name
type IconName = keyof typeof LucideIcons;

// Props for the Icon component
interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

/**
 * Icon component that wraps Lucide icons with proper React camelCase attributes
 * to fix the SVG DOM property warnings in the console
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  ...props
}) => {
  // Get the Lucide icon component
  const LucideIconComponent = LucideIcons[name] as LucideIcon;
  
  if (!LucideIconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <LucideIconComponent
      size={size}
      color={color}
      className={className}
      // Fix the SVG attribute warnings by using camelCase props
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
};

export default Icon;
