import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Check, X, Clock } from 'lucide-react';
import { Notification, NotificationType } from '../../services/notification.service';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, minutes?: number) => void;
}

const typeIcon: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error:   <XCircle size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
  info:    <Info size={16} className="text-blue-500" />,
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationItem({ notification: n, onMarkRead, onDismiss, onSnooze }: NotificationItemProps) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg transition-colors ${
        n.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'
      }`}
    >
      <span className="mt-0.5 shrink-0">{typeIcon[n.type]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${n.read ? 'font-normal' : 'font-semibold'} text-gray-900 dark:text-white`}>
            {n.title}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(n.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
        {n.actions && (
          <div className="flex gap-2 mt-2">
            {n.actions.map((a, i) => (
              <button key={i} onClick={a.onClick} className="text-xs text-primary-500 hover:underline">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {!n.read && (
          <button onClick={() => onMarkRead(n.id)} title="Mark as read" className="text-gray-400 hover:text-green-500 transition-colors">
            <Check size={14} />
          </button>
        )}
        <button onClick={() => onSnooze(n.id, 60)} title="Snooze 1h" className="text-gray-400 hover:text-yellow-500 transition-colors">
          <Clock size={14} />
        </button>
        <button onClick={() => onDismiss(n.id)} title="Dismiss" className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
