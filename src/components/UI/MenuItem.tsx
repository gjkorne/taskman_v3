import React, { useContext } from 'react';
import { cn } from '../../lib/utils';
import { MenuContext } from './Menu';

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  danger?: boolean;
  selected?: boolean;
}

/**
 * MenuItem component
 * A density-aware menu item for use within Menu component
 */
export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  onClick,
  disabled = false,
  icon,
  className = '',
  danger = false,
  selected = false
}) => {
  const { handleItemClick, densityLevel } = useContext(MenuContext);

  // Get padding based on density level
  const getPadding = () => {
    switch (densityLevel) {
      case 'compact':
        return 'px-2 py-1 text-xs';
      case 'comfortable':
        return 'px-4 py-3 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  // Handle click event
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      handleItemClick();
    }
  };

  // Get icon size based on density
  const getIconSize = () => {
    switch (densityLevel) {
      case 'compact':
        return 'w-3 h-3 mr-1.5';
      case 'comfortable':
        return 'w-5 h-5 mr-3';
      default:
        return 'w-4 h-4 mr-2';
    }
  };

  const padding = getPadding();
  const iconSize = getIconSize();

  return (
    <div
      className={cn(
        'flex items-center w-full rounded',
        padding,
        'cursor-pointer transition-colors',
        selected && 'bg-gray-100',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
        className
      )}
      onClick={handleClick}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      {icon && (
        <span className={iconSize}>
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </div>
  );
};

export default MenuItem;
