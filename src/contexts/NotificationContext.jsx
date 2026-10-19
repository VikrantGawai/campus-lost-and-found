import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isDemoMode } from '../config/firebase';
import { DEMO_NOTIFICATIONS } from '../data/demoData';

const NotificationContext = createContext(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

function loadPersistedNotifications() {
  if (!isDemoMode) return DEMO_NOTIFICATIONS;
  try {
    const saved = localStorage.getItem('clf_notifications');
    return saved ? JSON.parse(saved) : DEMO_NOTIFICATIONS;
  } catch {
    return DEMO_NOTIFICATIONS;
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadPersistedNotifications);

  useEffect(() => {
    if (isDemoMode) {
      try {
        localStorage.setItem('clf_notifications', JSON.stringify(notifications));
      } catch { /* ignore */ }
    }
  }, [notifications]);

  const addNotification = useCallback((userId, type, title, message, relatedItemId = null) => {
    const notif = {
      id: `notif-${uuidv4()}`,
      userId,
      type,
      title,
      message,
      relatedItemId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
    return notif;
  }, []);

  const markAsRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback((userId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, isRead: true } : n))
    );
  }, []);

  const getUserNotifications = useCallback(
    (userId) => notifications.filter((n) => n.userId === userId),
    [notifications]
  );

  const getUnreadCount = useCallback(
    (userId) => notifications.filter((n) => n.userId === userId && !n.isRead).length,
    [notifications]
  );

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    getUserNotifications,
    getUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
