// Export only what's needed from ToastContext since we've embedded the Toast component
export { 
  ToastProvider,
  useToast,
  type ToastType,
  type ToastItem,
  type ToastProps
} from './ToastContext';
