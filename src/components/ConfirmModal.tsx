import React from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  showPasswordInput?: boolean;
  passwordValue?: string;
  onPasswordChange?: (val: string) => void;
  passwordPlaceholder?: string;
  isConfirmDisabled?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  type = 'warning',
  onConfirm,
  onCancel,
  showPasswordInput = false,
  passwordValue = '',
  onPasswordChange,
  passwordPlaceholder,
  isConfirmDisabled = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorMap = {
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/20',
      icon: AlertTriangle,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/20',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/20',
      icon: HelpCircle,
    }
  };

  const selected = colorMap[type];
  const IconComponent = selected.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col p-6 animate-scale-in"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4 mt-2">
          <div className={`p-3.5 rounded-full border ${selected.bg}`}>
            <IconComponent className="h-6 w-6 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium px-2">{message}</p>
          </div>

          {showPasswordInput && (
            <div className="w-full text-left space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Password Konfirmasi
              </label>
              <input
                type="password"
                placeholder={passwordPlaceholder || "Masukkan password..."}
                value={passwordValue}
                onChange={(e) => onPasswordChange?.(e.target.value)}
                className="block w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:bg-white dark:focus:bg-gray-900 outline-none transition-all font-semibold text-gray-800 dark:text-white"
              />
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                Masukkan password <span className="font-bold text-rose-600 dark:text-rose-400">wdbos88</span> untuk mengonfirmasi.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2.5 w-full pt-2 text-gray-800 dark:text-gray-100">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-3 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                if (!isConfirmDisabled) {
                  onConfirm();
                }
              }}
              disabled={isConfirmDisabled}
              className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer ${
                isConfirmDisabled 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed shadow-none' 
                  : selected.btn
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
