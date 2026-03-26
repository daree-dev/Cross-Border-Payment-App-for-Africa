import React, { useState } from 'react';
import { Bell, Volume2, Monitor, Mail } from 'lucide-react';
import { notificationService, NotificationPreferences as Prefs, NotificationCategory } from '../../services/notification.service';
import { useNotifications } from '../../hooks/useNotifications';

const CATEGORIES: Array<{ key: NotificationCategory; label: string }> = [
  { key: 'payment',  label: 'Payment notifications' },
  { key: 'security', label: 'Security alerts' },
  { key: 'kyc',      label: 'KYC updates' },
  { key: 'system',   label: 'System messages' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export function NotificationPreferences() {
  const { preferences, savePreferences } = useNotifications();
  const [prefs, setPrefs] = useState<Prefs>(preferences);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<Prefs>) => setPrefs(p => ({ ...p, ...patch }));

  const handleSave = () => {
    savePreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDesktopToggle = async (val: boolean) => {
    if (val) {
      const granted = await notificationService.requestDesktopPermission();
      update({ desktop: granted });
    } else {
      update({ desktop: false });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Bell size={16} /> Notification Preferences
      </h2>

      {/* Delivery channels */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery</p>
        {[
          { key: 'sound' as const,   icon: <Volume2 size={15} />,  label: 'Sound alerts' },
          { key: 'desktop' as const, icon: <Monitor size={15} />,  label: 'Desktop notifications' },
          { key: 'email' as const,   icon: <Mail size={15} />,     label: 'Email notifications' },
        ].map(({ key, icon, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              {icon} {label}
            </span>
            <Toggle
              checked={prefs[key]}
              onChange={key === 'desktop' ? handleDesktopToggle : (v) => update({ [key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</p>
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <Toggle
              checked={prefs.categories[key]}
              onChange={(v) => update({ categories: { ...prefs.categories, [key]: v } })}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
      >
        {saved ? 'Saved!' : 'Save preferences'}
      </button>
    </div>
  );
}
