import React from 'react';
import { Layers, Check, AlertTriangle, User, LogOut, ClipboardList, Sun, Moon } from 'lucide-react';
import { BandingItem } from '../types';

interface HeaderProps {
  items: BandingItem[];
  onAddClick: () => void;
  currentUser: string;
  onLogout: () => void;
  onOpenHistory: () => void;
  logsCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ 
  items, 
  onAddClick,
  currentUser,
  onLogout,
  onOpenHistory,
  logsCount,
  theme,
  onToggleTheme
}: HeaderProps) {
  const [showStatus, setShowStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  return (
    <header id="app-header" className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Info */}
          <div className="flex items-center gap-3 justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-rose-600 to-rose-500 text-white p-2.5 rounded-xl shadow-md shadow-rose-100 dark:shadow-none">
                <Layers className="h-5.5 w-5.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">
                    LIVECHAT PORTAL
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">WDBOS</span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  DASHBOARD BANDING KESALAHAN CS
                </h1>
              </div>
            </div>

            {/* Active User Label on Mobile (or top header) */}
            {currentUser && (
              <div className="flex lg:hidden items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 rounded-xl">
                <User className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{currentUser}</span>
                <button 
                  onClick={onLogout}
                  className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                  title="Ganti Operator"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {showStatus && (
              <div 
                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                  showStatus.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50'
                }`}
              >
                {showStatus.type === 'success' ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {showStatus.message}
              </div>
            )}

            {/* Active Operator Display for Desktop */}
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2.5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/70 dark:border-rose-900/30 px-3 py-1.5 rounded-xl">
                <div className="bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 p-1 rounded-lg">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">Operator Aktif</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{currentUser}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer ml-1"
                  title="Ganti Operator / Keluar"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center justify-center p-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors cursor-pointer"
              title={theme === 'light' ? 'Ganti ke Tema Gelap' : 'Ganti ke Tema Terang'}
            >
              {theme === 'light' ? (
                <Moon className="h-4.5 w-4.5 text-gray-500" />
              ) : (
                <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              )}
            </button>

            {/* History Logs Trigger */}
            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors cursor-pointer relative"
              title="Lihat Riwayat Perubahan/Audit Logs"
            >
              <ClipboardList className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              <span>Riwayat Edit</span>
              {logsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {logsCount}
                </span>
              )}
            </button>

            <button
              id="btn-tambah-banding-header"
              onClick={onAddClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-100 dark:shadow-none transition-all cursor-pointer hover:shadow-md"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Tambah Banding</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
