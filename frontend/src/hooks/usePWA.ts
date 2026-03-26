import { useState, useEffect, useCallback } from 'react';

export type SWStatus = 'idle' | 'installing' | 'installed' | 'update-available' | 'error';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  swStatus: SWStatus;
  pushSupported: boolean;
  pushSubscribed: boolean;
  promptInstall: () => Promise<boolean>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePWA(): PWAState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swStatus, setSwStatus] = useState<SWStatus>('idle');
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // ── Service Worker registration ──────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        setSwStatus('installing');
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwStatus('update-available');
            } else if (worker.state === 'activated') {
              setSwStatus('installed');
            }
          });
        });

        if (reg.active) setSwStatus('installed');
      } catch {
        setSwStatus('error');
      }
    };

    register();
  }, []);

  // ── Install prompt ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Detect standalone (already installed) ────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Online / offline ─────────────────────────────────────────────────────
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  // ── Push subscription state ──────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setPushSubscribed(!!sub))
    );
  }, []);

  // ── promptInstall ────────────────────────────────────────────────────────
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
    return outcome === 'accepted';
  }, [installPrompt]);

  // ── subscribeToPush ──────────────────────────────────────────────────────
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        ...(VAPID_PUBLIC_KEY ? { applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) } : {}),
      });

      // Send subscription to backend (fire-and-forget; backend may not implement yet)
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(sub),
      }).catch(() => {});

      setPushSubscribed(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── unsubscribeFromPush ──────────────────────────────────────────────────
  const unsubscribeFromPush = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      setPushSubscribed(false);
    }
  }, []);

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    isOnline,
    swStatus,
    pushSupported: 'PushManager' in window && 'serviceWorker' in navigator,
    pushSubscribed,
    promptInstall,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
