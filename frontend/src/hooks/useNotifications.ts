import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, NotificationPreferences } from '../services/notification.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    return notificationService.subscribe(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = useCallback((id: string) => notificationService.markRead(id), []);
  const markAllRead = useCallback(() => notificationService.markAllRead(), []);
  const dismiss = useCallback((id: string) => notificationService.dismiss(id), []);
  const snooze = useCallback((id: string, minutes?: number) => notificationService.snooze(id, minutes), []);
  const clearAll = useCallback(() => notificationService.clearAll(), []);

  const preferences = notificationService.getPreferences();
  const savePreferences = useCallback((prefs: NotificationPreferences) => {
    notificationService.savePreferences(prefs);
  }, []);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    snooze,
    clearAll,
    preferences,
    savePreferences,
  };
}
