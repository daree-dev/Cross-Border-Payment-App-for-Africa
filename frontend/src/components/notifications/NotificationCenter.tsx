import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBadge } from './NotificationBadge';
import { NotificationItem } from './NotificationItem';
import { NotificationCategory } from '../../services/notification.service';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  payment: 'Payments',
  security: 'Security',
  kyc: 'KYC',
  system: 'System',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, dismiss, snooze } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeCategory);

  const categories: Array<NotificationCategory | 'all'> = ['all', 'payment', 'security', 'kyc', 'system'];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute -top-1.5 -right-1.5">
          <NotificationBadge count={unreadCount} />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} title="Mark all read" className="text-gray-400 hover:text-green-500 transition-colors">
                <CheckCheck size={15} />
              </button>
              <button
                onClick={() => { navigate('/notifications'); setOpen(false); }}
                title="View history"
                className="text-gray-400 hover:text-primary-500 transition-colors"
              >
                <History size={15} />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
            ) : (
              filtered.map(n => (
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
        </div>
      )}
    </div>
  );
}
