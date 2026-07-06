import React, { useState } from 'react';
import { X, Search, Clock, Trash2, ClipboardList, User } from 'lucide-react';
import { EditLog } from '../types';
import ConfirmModal from './ConfirmModal';

interface EditHistoryListProps {
  logs: EditLog[];
  onClearLogs: () => void;
  onClose: () => void;
}

export default function EditHistoryList({ logs, onClearLogs, onClose }: EditHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearPassword, setClearPassword] = useState('');

  // Filter logs to only include standard banding operations, excluding system and Google Sheets sync/management logs
  const bandingLogs = logs.filter((log) => {
    const isSystemOrSyncLog = 
      log.itemName === 'Sinkronisasi Google Sheet' ||
      log.itemName === 'Tarik Google Sheet' ||
      log.itemName === 'Sistem Impor' ||
      log.itemName === 'Sistem Reset' ||
      log.itemName.startsWith('Staff:') ||
      log.itemName.startsWith('Situs:');
    return !isSystemOrSyncLog;
  });

  // Filter logs based on search
  const filteredLogs = bandingLogs.filter((log) => {
    return (
      log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getActionTypeInfo = (actionType: EditLog['actionType']) => {
    switch (actionType) {
      case 'CREATE':
        return { label: 'Tambah', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40', dot: 'bg-emerald-500' };
      case 'UPDATE':
        return { label: 'Edit', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40', dot: 'bg-blue-500' };
      case 'DELETE':
        return { label: 'Hapus', bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40', dot: 'bg-rose-500' };
      case 'DUPLICATE':
        return { label: 'Duplikat', bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/40', dot: 'bg-purple-500' };
      case 'STATUS_CHANGE':
        return { label: 'Status', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40', dot: 'bg-amber-500' };
      default:
        return { label: 'Sistem', bg: 'bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-100 dark:border-gray-800', dot: 'bg-gray-500' };
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateStr} pukul ${timeStr}`;
  };

  return (
    <div id="edit-history-backdrop" className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      {/* Sliding Sheet Panel */}
      <div 
        id="edit-history-sheet" 
        className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-slide-in"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <div className="bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 p-2 rounded-lg border border-rose-100/55 dark:border-rose-900/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Riwayat Aktivitas Edit</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Log semua perubahan yang dilakukan staff</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Action Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Cari log nama staff, situs, detil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:bg-white dark:focus:bg-gray-900 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Menampilkan {filteredLogs.length} dari {bandingLogs.length} log</span>
            {bandingLogs.length > 0 && (
              <button
                onClick={() => {
                  setConfirmClear(true);
                }}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 font-bold cursor-pointer hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Logs Feed Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
              <Clock className="h-8 w-8 text-gray-300 dark:text-gray-700" />
              <p className="text-xs font-semibold">Belum ada riwayat aktivitas</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Setiap perubahan data akan terekam secara otomatis.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionTypeInfo(log.actionType);
              return (
                <div 
                  key={log.id} 
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 hover:bg-gray-50 dark:hover:bg-gray-950/50 transition-colors space-y-2 relative overflow-hidden"
                >
                  {/* Badge & Time row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  {/* Operator & Item identity */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                      <span>Oleh: </span>
                      <span className="text-gray-900 dark:text-white font-bold">{log.operator}</span>
                    </div>

                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Target: <span className="text-rose-600 dark:text-rose-400">{log.itemName}</span>
                    </div>
                  </div>

                  {/* Detail description with nice visual borders */}
                  <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 rounded-lg leading-relaxed whitespace-pre-line font-medium">
                    {log.details}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Close Button */}
        <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full text-center py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Tutup Panel Riwayat
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmClear}
        title="Kosongkan Riwayat Edit"
        message="Apakah Anda yakin ingin menghapus seluruh log aktivitas audit secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Semua"
        cancelLabel="Batal"
        type="danger"
        showPasswordInput={true}
        passwordValue={clearPassword}
        onPasswordChange={setClearPassword}
        isConfirmDisabled={clearPassword !== 'wdbos88'}
        onConfirm={() => {
          onClearLogs();
          setConfirmClear(false);
          setClearPassword('');
        }}
        onCancel={() => {
          setConfirmClear(false);
          setClearPassword('');
        }}
      />
    </div>
  );
}
