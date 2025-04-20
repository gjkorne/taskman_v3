import { IService } from './IService';

/**
 * Notification types for the application
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Notification position on the screen
 */
export enum NotificationPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right',
}

/**
 * Notification interface with core properties
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  autoClose?: boolean;
  duration?: number; // milliseconds
  position?: NotificationPosition;
  timestamp: number;
  read: boolean;
  actionText?: string;
  actionHandler?: () => void;
  metadata?: Record<string, any>;
}

/**
 * Options for creating a notification
 */
export interface NotificationOptions {
  title?: string;
  autoClose?: boolean;
  duration?: number;
  position?: NotificationPosition;
  actionText?: string;
  actionHandler?: () => void;
  metadata?: Record<string, any>;
}

/**
 * Events that can be emitted by the NotificationService
 */
export interface NotificationServiceEvents {
  'notification-added': Notification;
  'notification-removed': string; // notification id
  'notification-clicked': Notification;
  'notification-action-triggered': Notification;
  'notifications-cleared': void;
  error: Error;
}

/**
 * Interface for the NotificationService
 * Provides methods to manage application notifications
 */
export interface INotificationService
  extends IService<NotificationServiceEvents> {
  /**
   * Show an info notification
   */
  info(message: string, options?: NotificationOptions): string; // returns notification id

  /**
   * Show a success notification
   */
  success(message: string, options?: NotificationOptions): string;

  /**
   * Show a warning notification
   */
  warning(message: string, options?: NotificationOptions): string;

  /**
   * Show an error notification
   */
  error(message: string, options?: NotificationOptions): string;

  /**
   * Show a notification with custom type
   */
  notify(
    type: NotificationType,
    message: string,
    options?: NotificationOptions
  ): string;

  /**
   * Get all active notifications
   */
  getNotifications(): Notification[];

  /**
   * Get a specific notification by id
   */
  getNotification(id: string): Notification | undefined;

  /**
   * Remove a specific notification
   */
  removeNotification(id: string): void;

  /**
   * Clear all notifications
   */
  clearAll(): void;

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): void;

  /**
   * Update notification settings
   */
  updateSettings(settings: {
    defaultDuration?: number;
    defaultPosition?: NotificationPosition;
    maxNotifications?: number;
  }): void;
}
