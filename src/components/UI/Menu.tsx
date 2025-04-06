import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from './hoc/withDensity';
import { densityClasses } from './DensityStyles';

interface MenuBaseProps extends WithDensityProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  width?: number | string;
  className?: string;
  triggerClassName?: string;
  closeOnItemClick?: boolean;
}

/**
 * MenuBase component
 * A density-aware dropdown menu component
 */
const MenuBase: React.FC<MenuBaseProps> = ({
  trigger,
  children,
  align = 'left',
  width = 'auto',
  className = '',
  triggerClassName = '',
  closeOnItemClick = true,
  densityLevel,
  densitySpacing
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  // Get menu padding based on density level
  const getMenuPadding = () => {
    switch (densityLevel) {
      case 'compact':
        return 'p-1';
      case 'comfortable':
        return 'p-3';
      default:
        return 'p-2';
    }
  };

  // Calculate menu position styles
  const getMenuPositionClass = () => {
    return align === 'left' ? 'left-0' : 'right-0';
  };

  const menuPadding = getMenuPadding();
  const positionClass = getMenuPositionClass();

  // Toggle menu open/closed
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle item click
  const handleItemClick = () => {
    if (closeOnItemClick) {
      setIsOpen(false);
    }
  };

  // Create a context provider for MenuItem components
  const menuContext = {
    closeMenu: () => setIsOpen(false),
    handleItemClick,
    densityLevel
  };

  return (
    <div className="relative inline-block">
      {/* Menu Trigger */}
      <div
        ref={triggerRef}
        onClick={toggleMenu}
        className={cn('cursor-pointer', triggerClassName)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {/* Menu Content */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            densityClasses.container,
            "absolute mt-1 border border-gray-200 rounded-md shadow-lg z-50 bg-white",
            menuPadding,
            positionClass,
            className
          )}
          style={{ 
            width: typeof width === 'number' ? `${width}px` : width,
            minWidth: '160px',
            gap: densitySpacing.gap 
          }}
          role="menu"
        >
          <MenuContext.Provider value={menuContext}>
            {children}
          </MenuContext.Provider>
        </div>
      )}
    </div>
  );
};

// Create context for menu items
interface MenuContextType {
  closeMenu: () => void;
  handleItemClick: () => void;
  densityLevel: string;
}

export const MenuContext = React.createContext<MenuContextType>({
  closeMenu: () => {},
  handleItemClick: () => {},
  densityLevel: 'normal'
});

/**
 * Menu component with density awareness
 * A dropdown menu that adapts its styling based on the density level
 */
export const Menu = withDensity(MenuBase);

export default Menu;
