import React, { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from './hoc/withDensity';
import { densityClasses } from './DensityStyles';
import { createPortal } from 'react-dom';

interface ModalBaseProps extends WithDensityProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  closeOnOutsideClick?: boolean;
  hideCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  disableEscapeKey?: boolean;
}

/**
 * ModalBase component
 * A density-aware modal dialog
 */
const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  closeOnOutsideClick = true,
  hideCloseButton = false,
  size = 'md',
  disableEscapeKey = false,
  densityLevel,
  densitySpacing
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key press to close modal
  useEffect(() => {
    if (!isOpen || disableEscapeKey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, disableEscapeKey]);

  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    full: 'max-w-full w-full h-full m-0 rounded-none'
  };

  // Adjust padding and spacing based on density level
  const getHeaderPadding = () => {
    switch (densityLevel) {
      case 'compact':
        return 'px-3 py-2';
      case 'comfortable':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getBodyPadding = () => {
    switch (densityLevel) {
      case 'compact':
        return 'px-3 py-2';
      case 'comfortable':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getTitleSize = () => {
    switch (densityLevel) {
      case 'compact':
        return 'text-base';
      case 'comfortable':
        return 'text-xl';
      default:
        return 'text-lg';
    }
  };

  const getCloseButtonSize = () => {
    switch (densityLevel) {
      case 'compact':
        return 'h-4 w-4';
      case 'comfortable':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200"
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={cn(
          densityClasses.container,
          "bg-white shadow-lg max-h-[90vh] flex flex-col rounded-lg relative",
          sizeClasses[size],
          className
        )}
        style={{ gap: densitySpacing.gap }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {(title || !hideCloseButton) && (
          <div className={cn(
            "flex items-center justify-between border-b border-gray-200",
            getHeaderPadding()
          )}>
            {title && (
              <h2 
                id="modal-title" 
                className={cn(
                  "font-semibold text-gray-900",
                  getTitleSize()
                )}
              >
                {title}
              </h2>
            )}
            
            {!hideCloseButton && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors ml-auto"
                aria-label="Close dialog"
              >
                <X className={getCloseButtonSize()} />
              </button>
            )}
          </div>
        )}
        
        {/* Modal Body */}
        <div className={cn(
          "overflow-y-auto flex-1",
          getBodyPadding()
        )}>
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at the root level to avoid z-index issues
  return createPortal(modalContent, document.body);
};

/**
 * Modal component with density awareness
 * A reusable modal dialog that adapts based on density settings
 */
export const Modal = withDensity(ModalBase);

export default Modal;
