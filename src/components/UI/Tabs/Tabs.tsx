import * as React from 'react';
import { cn } from '../../../lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className
}: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeValue: value,
            onValueChange
          });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      "flex space-x-1 rounded-lg bg-gray-100 p-1",
      className
    )}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
  activeValue?: string;
}

export function TabsTrigger({
  value,
  children,
  className,
  onValueChange,
  activeValue
}: TabsTriggerProps) {
  const isActive = activeValue === value;
  
  return (
    <button
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
        "focus:outline-none",
        isActive
          ? "bg-white shadow-sm text-gray-900"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string;
}

export function TabsContent({
  value,
  children,
  className,
  activeValue
}: TabsContentProps) {
  const isActive = activeValue === value;
  
  if (!isActive) return null;
  
  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  );
}
