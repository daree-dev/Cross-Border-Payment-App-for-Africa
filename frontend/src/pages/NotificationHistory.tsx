import React, { useState } from 'react';
import { Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { NotificationPreferences } from '../components/notifications/NotificationPreferences';
import { NotificationCategory } from '../services/notification.service';

const TABS = ['notifications', 'preferences'] as const;
type Tab = typeof TABS[number];

const CATEGORY_LABELS: Record<NotificationCategory | 'all', string> = {
  all: 'All', payment: 'Payments', security: 'Security', kyc: 'KYC', system: 'System',
};

export default function NotificationHistory() {
  const [tab, setTab] = useState<Tab>('notifications');
  const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
  const { notifications, unreadCount, markRead, markAllRead, dismiss, snooze, clearAll } = useNotifications();

  const filtered = category === 'all' ? notifications : notifications.filter(n => n.category === category);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm rounded-md capitalize transition-colors ${
              tab === t ? 'bg-white dark:bg-gray-700 font-medium shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'preferences' ? (
        <NotificationPreferences />
      ) : (
        <>
          {/* Actions */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{unreadCount} unread</span>
            <div className="flex gap-3">
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-500 transition-colors">
                <CheckCheck size={13} /> Mark all read
              </button>
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
            {(Object.keys(CATEGORY_LABELS) as Array<NotificationCategory | 'all'>).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  category === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">No notifications</p>
            ) : (
              filtered.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                  onDismiss={dismiss}
                  onSnooze={snooze}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
