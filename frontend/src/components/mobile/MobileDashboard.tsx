import React from 'react';
import { Send, Download, Clock, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';

interface Balance {
  asset: string;
  balance: string;
}

interface RecentTx {
  id: string;
  direction: 'sent' | 'received';
  amount: string;
  asset: string;
  created_at: string;
}

interface MobileDashboardProps {
  balances: Balance[];
  recentTransactions: RecentTx[];
  userName?: string;
}

export function MobileDashboard({ balances, recentTransactions, userName }: MobileDashboardProps) {
  const navigate = useNavigate();
  const { isOnline } = usePWA();

  const primaryBalance = balances.find((b) => b.asset === 'XLM') ?? balances[0];

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-24">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300">
          <WifiOff size={13} />
          You're offline — showing cached data
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm opacity-80">
            {userName ? `Hi, ${userName.split(' ')[0]}` : 'Your balance'}
          </p>
          {isOnline
            ? <Wifi size={14} className="opacity-60" />
            : <WifiOff size={14} className="opacity-60" />}
        </div>
        {primaryBalance ? (
          <>
            <p className="text-3xl font-bold tracking-tight">
              {parseFloat(primaryBalance.balance).toFixed(2)}
            </p>
            <p className="text-sm opacity-70 mt-0.5">{primaryBalance.asset}</p>
          </>
        ) : (
          <p className="text-2xl font-bold opacity-60">—</p>
        )}

        {/* Other balances */}
        {balances.length > 1 && (
          <div className="flex gap-3 mt-3 pt-3 border-t border-white/20">
            {balances.filter((b) => b !== primaryBalance).map((b) => (
              <div key={b.asset}>
                <p className="text-xs opacity-60">{b.asset}</p>
                <p className="text-sm font-semibold">{parseFloat(b.balance).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Send', icon: Send, path: '/send', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
          { label: 'Receive', icon: Download, path: '/receive', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
          { label: 'History', icon: Clock, path: '/history', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
        ].map(({ label, icon: Icon, path, color }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} transition-transform active:scale-95`}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent</h2>
          <button onClick={() => navigate('/history')} className="text-xs text-primary-500">See all</button>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.direction === 'sent'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-500'
                  }`}>
                    {tx.direction === 'sent' ? <Send size={14} /> : <Download size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{tx.direction}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${tx.direction === 'sent' ? 'text-red-500' : 'text-green-500'}`}>
                  {tx.direction === 'sent' ? '-' : '+'}{parseFloat(tx.amount).toFixed(2)} {tx.asset}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
