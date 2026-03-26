import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) setDismissed(true);
  };

  return (
    <div
      role="banner"
      className="fixed bottom-20 left-3 right-3 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4"
    >
      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0">
        <Smartphone size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Install AfriPay</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Add to home screen for faster access</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 bg-primary-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors shrink-0"
      >
        <Download size={13} />
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
