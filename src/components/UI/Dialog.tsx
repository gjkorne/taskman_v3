import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { withDensity, WithDensityProps } from './hoc/withDensity';
import { densityClasses } from './DensityStyles';
import { Modal } from './Modal';

interface DialogBaseProps extends WithDensityProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'info' | 'warning' | 'danger' | 'success';
  className?: string;
  confirmDisabled?: boolean;
}

/**
 * DialogBase component
 * A density-aware dialog for simple interactions like confirmations
 */
const DialogBase: React.FC<DialogBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  className = '',
  confirmDisabled = false,
  densityLevel,
  densitySpacing
}) => {
  // Handle actions
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  // Get variant-specific classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return {
          button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          border: 'border-yellow-200',
          bg: 'bg-yellow-50'
        };
      case 'danger':
        return {
          button: 'bg-red-500 hover:bg-red-600 text-white',
          border: 'border-red-200',
          bg: 'bg-red-50'
        };
      case 'success':
        return {
          button: 'bg-green-500 hover:bg-green-600 text-white',
          border: 'border-green-200',
          bg: 'bg-green-50'
        };
      default:
        return {
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          border: 'border-blue-200',
          bg: 'bg-blue-50'
        };
    }
  };

  const variantClasses = getVariantClasses();

  // Adjust button padding based on density level
  const getButtonPadding = () => {
    switch (densityLevel) {
      case 'compact':
        return 'px-3 py-1 text-xs';
      case 'comfortable':
        return 'px-5 py-2.5 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  // Get spacing between buttons based on density
  const getButtonGroupSpacing = () => {
    switch (densityLevel) {
      case 'compact':
        return 'gap-2';
      case 'comfortable':
        return 'gap-4';
      default:
        return 'gap-3';
    }
  };

  const buttonPadding = getButtonPadding();
  const buttonGroupSpacing = getButtonGroupSpacing();

  return (
    <Modal 
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className={cn("overflow-hidden", className)}
    >
      <div className={cn(
        densityClasses.container,
        "flex flex-col"
      )}
      style={{ gap: densitySpacing.gap }}
      >
        <div className={cn(
          "flex-1",
          densityLevel === 'compact' ? 'mb-3' : 
          densityLevel === 'comfortable' ? 'mb-6' : 'mb-4'
        )}>
          {children}
        </div>
        
        <div className={cn(
          "flex justify-end",
          buttonGroupSpacing
        )}>
          {onCancel && (
            <button
              onClick={handleCancel}
              className={cn(
                "border border-gray-300 text-gray-700 hover:bg-gray-50 rounded",
                buttonPadding
              )}
            >
              {cancelText}
            </button>
          )}
          
          {onConfirm && (
            <button
              onClick={handleConfirm}
              className={cn(
                variantClasses.button,
                "rounded transition-colors",
                buttonPadding,
                confirmDisabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={confirmDisabled}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

/**
 * Dialog component with density awareness
 * A specialized modal for simple interactions like confirmations or alerts
 */
export const Dialog = withDensity(DialogBase);

export default Dialog;
