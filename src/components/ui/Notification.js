import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NOTIFICATION_TYPES = {
  success: 'bg-green-50 text-green-800',
  error: 'bg-red-50 text-red-800',
  warning: 'bg-yellow-50 text-yellow-800',
  info: 'bg-blue-50 text-blue-800',
};

const ICON_COLORS = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

/**
 * Notification component for displaying alerts and messages
 * @param {Object} props - Component props
 * @param {string} props.type - Notification type (success, error, warning, info)
 * @param {string} props.title - Notification title
 * @param {string} props.message - Notification message
 * @param {boolean} props.show - Whether to show the notification
 * @param {function} props.onClose - Function to call when notification is closed
 * @param {number} props.autoClose - Auto close duration in ms (0 to disable)
 */
const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  show = false, 
  onClose,
  autoClose = 5000
}) => {
  const [isVisible, setIsVisible] = useState(show);
  
  // Handle auto close
  useEffect(() => {
    setIsVisible(show);
    
    if (show && autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      
      return () => clearTimeout(timer);
    }
  }, [show, autoClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className={`rounded-md p-4 ${NOTIFICATION_TYPES[type]}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' && (
            <svg className={`h-5 w-5 ${ICON_COLORS[type]}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'error' && (
            <svg className={`h-5 w-5 ${ICON_COLORS[type]}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'warning' && (
            <svg className={`h-5 w-5 ${ICON_COLORS[type]}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {type === 'info' && (
            <svg className={`h-5 w-5 ${ICON_COLORS[type]}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {message && <div className="text-sm mt-1">{message}</div>}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${ICON_COLORS[type]} bg-transparent hover:bg-${type}-100`}
              onClick={handleClose}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * NotificationContainer for managing multiple notifications
 */
export const NotificationContainer = ({ notifications = [], onClose }) => {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md">
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id || index}
          {...notification}
          onClose={() => onClose(notification.id || index)}
        />
      ))}
    </div>
  );
};

export default Notification;
