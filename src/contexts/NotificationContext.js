import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NotificationContainer } from '../components/ui/Notification';

// Create context
const NotificationContext = createContext();

/**
 * NotificationProvider component
 * Manages application notifications
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const id = notification.id || uuidv4();
    
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { ...notification, id, show: true }
    ]);
    
    return id;
  }, []);

  // Remove a notification by id
  const removeNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // Success notification shorthand
  const showSuccess = useCallback((message, title = 'Success', autoClose = 5000) => {
    return addNotification({ type: 'success', message, title, autoClose });
  }, [addNotification]);

  // Error notification shorthand
  const showError = useCallback((message, title = 'Error', autoClose = 8000) => {
    return addNotification({ type: 'error', message, title, autoClose });
  }, [addNotification]);

  // Info notification shorthand
  const showInfo = useCallback((message, title = 'Information', autoClose = 5000) => {
    return addNotification({ type: 'info', message, title, autoClose });
  }, [addNotification]);

  // Warning notification shorthand
  const showWarning = useCallback((message, title = 'Warning', autoClose = 7000) => {
    return addNotification({ type: 'warning', message, title, autoClose });
  }, [addNotification]);

  // Shipping notification
  const showShippingUpdate = useCallback((order) => {
    const title = 'Order Shipped';
    const message = `Your order #${order.id.slice(-8)} has been shipped and is on its way to you.${
      order.trackingNumber ? ` Tracking number: ${order.trackingNumber}` : ''
    }`;
    
    return addNotification({ 
      type: 'success', 
      message, 
      title, 
      autoClose: 0,  // Don't auto close shipping notifications
      data: { order }
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showShippingUpdate
      }}
    >
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
