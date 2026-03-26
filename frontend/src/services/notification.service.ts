export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationCategory = 'payment' | 'security' | 'kyc' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  actions?: NotificationAction[];
  snoozedUntil?: Date;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationPreferences {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<NotificationCategory, boolean>;
}

const STORAGE_KEY = 'afripay_notifications';
const PREFS_KEY = 'afripay_notification_prefs';

const defaultPrefs: NotificationPreferences = {
  sound: true,
  desktop: false,
  email: true,
  categories: { payment: true, security: true, kyc: true, system: true },
};

type Listener = (notifications: Notification[]) => void;
const listeners = new Set<Listener>();
let notifications: Notification[] = load();

function load(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((n: Notification) => ({
      ...n,
      timestamp: new Date(n.timestamp),
      snoozedUntil: n.snoozedUntil ? new Date(n.snoozedUntil) : undefined,
    }));
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  listeners.forEach(fn => fn([...notifications]));
}

export const notificationService = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    fn([...notifications]);
    return () => listeners.delete(fn);
  },

  add(n: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
    const prefs = notificationService.getPreferences();
    if (!prefs.categories[n.category]) return;

    const notification: Notification = {
      ...n,
      id: crypto.randomUUID(),
      read: false,
      timestamp: new Date(),
    };
    notifications = [notification, ...notifications].slice(0, 100);
    persist();

    if (prefs.sound) notificationService.playSound(n.type);
    if (prefs.desktop) notificationService.sendDesktopNotification(notification);
    return notification;
  },

  markRead(id: string) {
    notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    persist();
  },

  markAllRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    persist();
  },

  dismiss(id: string) {
    notifications = notifications.filter(n => n.id !== id);
    persist();
  },

  snooze(id: string, minutes = 60) {
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    notifications = notifications.map(n => n.id === id ? { ...n, snoozedUntil } : n);
    persist();
  },

  clearAll() {
    notifications = [];
    persist();
  },

  getAll(): Notification[] {
    const now = new Date();
    return notifications.filter(n => !n.snoozedUntil || n.snoozedUntil <= now);
  },

  getUnreadCount(): number {
    return notificationService.getAll().filter(n => !n.read).length;
  },

  getGrouped(): Record<NotificationCategory, Notification[]> {
    const grouped: Record<string, Notification[]> = {};
    for (const n of notificationService.getAll()) {
      if (!grouped[n.category]) grouped[n.category] = [];
      grouped[n.category].push(n);
    }
    return grouped as Record<NotificationCategory, Notification[]>;
  },

  getPreferences(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
    } catch {
      return defaultPrefs;
    }
  },

  savePreferences(prefs: NotificationPreferences) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  playSound(type: NotificationType) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'error' ? 220 : type === 'warning' ? 440 : 660;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* AudioContext not available */ }
  },

  async requestDesktopPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  sendDesktopNotification(n: Notification) {
    if (Notification.permission === 'granted') {
      new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
    }
  },
};
