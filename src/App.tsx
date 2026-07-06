import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PeriodSelector from './components/PeriodSelector';
import StatsGrid from './components/StatsGrid';
import BandingTable from './components/BandingTable';
import BandingForm from './components/BandingForm';
import LoginGate from './components/LoginGate';
import EditHistoryList from './components/EditHistoryList';
import ConfirmModal from './components/ConfirmModal';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import { BandingItem, PeriodeIndex, KeteranganStatus, PERIOD_MONTHS, EditLog } from './types';
import { ClipboardList, HelpCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'wdbos_banding_livechat_items';
const HISTORY_LOGS_KEY = 'wdbos_edit_history_logs';
const CURRENT_USER_KEY = 'wdbos_current_staff';

const DEFAULT_WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbyouC1SdCqvy3aXx6i0gNdyx60ygEaCueDmItZJN2zXk3FDSgyvCU8Atz6XmlSXblkN/exec';

// Empty sample data arrays
const SAMPLE_ITEMS: BandingItem[] = [];
const SAMPLE_LOGS: EditLog[] = [];

export default function App() {
  const [items, setItems] = useState<BandingItem[]>([]);
  const [logs, setLogs] = useState<EditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodeIndex>(1);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('wdbos_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('wdbos_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BandingItem | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Pull latest data from Google Sheets spreadsheet to keep dashboard synced for all staff
  const pullDataFromGoogleSheets = async () => {
    const webAppUrl = localStorage.getItem('wdbos_google_sheets_webapp_url') || DEFAULT_WEB_APP_URL;
    if (!webAppUrl) return;

    try {
      const response = await fetch(webAppUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Filter out any sample data automatically
        const cleanItems = result.data.filter((item: BandingItem) => !item.id.includes('sample'));
        setItems(cleanItems);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanItems));

        if (Array.isArray(result.staffList)) {
          localStorage.setItem('wdbos_staff_synced_list', JSON.stringify(result.staffList.filter(Boolean)));
        }
        if (Array.isArray(result.situsList)) {
          localStorage.setItem('wdbos_situs_synced_list', JSON.stringify(result.situsList.filter(Boolean)));
        }

        // Sync history logs from spreadsheet
        if (Array.isArray(result.logs)) {
          const cleanLogs = result.logs.filter((log: EditLog) => log.itemName !== 'Sesi Operator' && !log.id.includes('sample'));
          const sortedLogs = cleanLogs.sort((a, b) => b.timestamp - a.timestamp);
          setLogs(sortedLogs);
          localStorage.setItem(HISTORY_LOGS_KEY, JSON.stringify(sortedLogs));
        }

        console.log(`Successfully pulled ${cleanItems.length} items from Google Sheets on load.`);
      }
    } catch (err) {
      console.error('Failed to pull data from Google Sheets on load, falling back to local storage cache:', err);
    }
  };

  // Initialize and load items, logs & session
  useEffect(() => {
    // 1. Load active user
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      setCurrentUser(savedUser);
    }

    // 2. Load Banding data from local storage first (instant cache)
    const savedItems = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems) as BandingItem[];
        const nonSampleItems = parsed.filter(item => !item.id.includes('sample'));
        setItems(nonSampleItems);
      } catch (err) {
        console.error('Failed to parse items from localstorage', err);
      }
    }

    // 3. Load logs (excluding operator session logs and sample logs)
    const savedLogs = localStorage.getItem(HISTORY_LOGS_KEY);
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs) as EditLog[];
        const filteredLogs = parsedLogs.filter(
          log => log.itemName !== 'Sesi Operator' && !log.id.includes('sample')
        );
        setLogs(filteredLogs);
      } catch (err) {
        console.error('Failed to parse logs from localstorage', err);
      }
    }

    // 4. Set current period
    const now = new Date();
    setSelectedYear(now.getFullYear());
    const month = now.getMonth();
    if (month >= 0 && month <= 2) setSelectedPeriod(1);
    else if (month >= 3 && month <= 5) setSelectedPeriod(2);
    else if (month >= 6 && month <= 8) setSelectedPeriod(3);
    else setSelectedPeriod(4);

    // 5. Pull latest data from Google Sheets to sync dashboard state for other staff
    pullDataFromGoogleSheets();
  }, []);

  // Send single audit log to Google Sheets Web App
  const syncLogToGoogleSheets = async (log: EditLog) => {
    const webAppUrl = localStorage.getItem('wdbos_google_sheets_webapp_url') || DEFAULT_WEB_APP_URL;
    if (!webAppUrl) return;

    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_log',
          log: log
        })
      });
      console.log(`Synced audit log ID ${log.id} to Google Sheets.`);
    } catch (err) {
      console.error('Error syncing audit log to Google Sheets:', err);
    }
  };

  // Helper function to log audit trails
  const createAuditLog = (actionType: EditLog['actionType'], itemName: string, details: string) => {
    const newLog: EditLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      operator: currentUser || 'Sistem',
      actionType,
      itemName,
      details,
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(HISTORY_LOGS_KEY, JSON.stringify(updatedLogs));

    // Sync the log to Google Sheets so other staff members can see it
    syncLogToGoogleSheets(newLog);
  };

  // Sync banding items to state & storage
  const saveItemsToStateAndStorage = (newItems: BandingItem[]) => {
    setItems(newItems);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
  };

  // Send single row changes to Google Sheets Web App if configured
  const syncChangeToGoogleSheet = async (action: 'create' | 'update' | 'delete', item: BandingItem) => {
    const webAppUrl = localStorage.getItem('wdbos_google_sheets_webapp_url') || DEFAULT_WEB_APP_URL;
    if (!webAppUrl) return;

    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data: item
        })
      });
      console.log(`Synced action [${action}] for item ID ${item.id} to Google Sheets.`);
    } catch (err) {
      console.error('Error syncing individual change to Google Sheets:', err);
    }
  };

  // Handle Login Gate selection
  const handleLogin = (staffName: string) => {
    setCurrentUser(staffName);
    localStorage.setItem(CURRENT_USER_KEY, staffName);
  };

  // Handle Logout / Sign out
  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const executeLogout = () => {
    setCurrentUser('');
    localStorage.removeItem(CURRENT_USER_KEY);
    setConfirmLogout(false);
  };

  // Add or Edit save callback
  const handleSaveItem = (formData: Omit<BandingItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (formData.id) {
      // Edit mode
      const oldItem = items.find(i => i.id === formData.id);
      const updatedItem: BandingItem = {
        ...oldItem,
        ...formData,
      } as BandingItem;
      const updated = items.map((item) => {
        if (item.id === formData.id) {
          return updatedItem;
        }
        return item;
      });
      saveItemsToStateAndStorage(updated);
      syncChangeToGoogleSheet('update', updatedItem);
      
      // Log modification
      const changeMsg = `Mengedit data kasus. Status: ${formData.keterangan}. Tanggal: ${formData.tanggal}. Keterangan: ${formData.keteranganBanding || '-'}`;
      createAuditLog('UPDATE', `${formData.namaStaff} (${formData.namaSitus})`, changeMsg);
    } else {
      // Create mode
      const newItem: BandingItem = {
        ...formData,
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      };
      saveItemsToStateAndStorage([newItem, ...items]);
      syncChangeToGoogleSheet('create', newItem);

      // Log addition
      createAuditLog(
        'CREATE', 
        `${formData.namaStaff} (${formData.namaSitus})`, 
        `Menambahkan kasus banding baru. Status: ${formData.keterangan}. Alasan banding: ${formData.keteranganBanding || 'tidak ada rincian'}`
      );
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Delete handler
  const handleDeleteItem = (id: string) => {
    const deletedItem = items.find((item) => item.id === id);
    const filtered = items.filter((item) => item.id !== id);
    saveItemsToStateAndStorage(filtered);

    if (deletedItem) {
      syncChangeToGoogleSheet('delete', deletedItem);
      createAuditLog('DELETE', `${deletedItem.namaStaff} (${deletedItem.namaSitus})`, 'Menghapus data kasus banding ini dari dashboard.');
    }
  };

  // Duplicate helper
  const handleDuplicateItem = (item: BandingItem) => {
    const duplicated: BandingItem = {
      ...item,
      id: '', // empty for create mode
      tanggal: new Date().toISOString().split('T')[0], // default current date
      keterangan: 'PENDING', // reset to pending on duplicate
      keteranganBandingDiTolak: '', // clear rejection
      createdAt: Date.now()
    };
    
    // Log duplication click
    createAuditLog('DUPLICATE', `${item.namaStaff} (${item.namaSitus})`, `Menduplikasi kasus lama untuk membuat ajuan banding baru.`);
    
    setEditingItem(duplicated);
    setIsFormOpen(true);
  };

  // Inline status change
  const handleStatusChange = (id: string, newStatus: KeteranganStatus) => {
    const oldItem = items.find(i => i.id === id);
    let updatedItem: BandingItem | null = null;
    const updated = items.map((item) => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          keterangan: newStatus,
          keteranganBandingDiTolak: newStatus !== 'BANDING DI TOLAK' && newStatus !== 'NOTE' ? '' : item.keteranganBandingDiTolak,
        };
        return updatedItem;
      }
      return item;
    });
    saveItemsToStateAndStorage(updated);

    if (oldItem && updatedItem) {
      syncChangeToGoogleSheet('update', updatedItem);
      createAuditLog(
        'STATUS_CHANGE', 
        `${oldItem.namaStaff} (${oldItem.namaSitus})`, 
        `Mengubah status keterangan langsung dari [${oldItem.keterangan}] ke [${newStatus}].`
      );
    }
  };

  // Import JSON handler
  const handleImportData = (importedItems: BandingItem[]) => {
    const existingIds = new Set(items.map((i) => i.id));
    const merged = [...items];

    importedItems.forEach((imp) => {
      if (!existingIds.has(imp.id)) {
        merged.unshift(imp);
      } else {
        const idx = merged.findIndex((m) => m.id === imp.id);
        if (idx !== -1) merged[idx] = imp;
      }
    });

    saveItemsToStateAndStorage(merged);
    createAuditLog('STATUS_CHANGE', 'Sistem Impor', `Mengimpor backup data JSON dengan total ${importedItems.length} record.`);
  };

  // Clear all history logs callback
  const handleClearLogs = () => {
    setLogs([]);
    localStorage.setItem(HISTORY_LOGS_KEY, JSON.stringify([]));
  };

  // Filter items by selected period
  const itemsInSelectedPeriod = items.filter((item) => {
    if (!item.tanggal) return false;
    const parts = item.tanggal.split('-');
    if (parts.length < 2) return false;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;

    if (isNaN(year) || isNaN(month)) return false;

    const matchedYear = year === selectedYear;
    const matchedMonth = PERIOD_MONTHS[selectedPeriod].months.includes(month);

    return matchedYear && matchedMonth;
  });

  // If no user is logged in, show the identity picker gate
  if (!currentUser) {
    return <LoginGate onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const activeLogsCount = logs.filter(log => {
    const isSystemOrSyncLog = 
      log.itemName === 'Sinkronisasi Google Sheet' ||
      log.itemName === 'Tarik Google Sheet' ||
      log.itemName === 'Sistem Impor' ||
      log.itemName === 'Sistem Reset' ||
      log.itemName.startsWith('Staff:') ||
      log.itemName.startsWith('Situs:');
    return !isSystemOrSyncLog;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex flex-col font-sans text-gray-800 dark:text-gray-100 antialiased transition-colors duration-200">
      {/* App Header Component with User Info */}
      <Header 
        items={items} 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenHistory={() => setIsHistoryOpen(true)}
        logsCount={activeLogsCount}
        onAddClick={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Helper */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 dark:from-gray-900/60 dark:to-gray-900/40 dark:bg-none dark:border dark:border-rose-900/30 text-white dark:text-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white dark:text-rose-400">BANDING KESALAHAN LIVECHAT ANDA DISINI</h2>
            <p className="text-sm text-rose-100 dark:text-gray-400 max-w-xl">
              Gunakan portal ini untuk merekam keberatan banding, menautkan multi-tautan tangkapan layar, dan memantau keputusan auditor per triwulan secara profesional.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 items-center">
            <GoogleSheetsSync 
              items={items}
              onSyncComplete={(importedItems, logMsg, importedLogs) => {
                saveItemsToStateAndStorage(importedItems);
                if (importedLogs && Array.isArray(importedLogs)) {
                  const cleanLogs = importedLogs.filter(log => log.itemName !== 'Sesi Operator' && !log.id.includes('sample'));
                  const sortedLogs = cleanLogs.sort((a, b) => b.timestamp - a.timestamp);
                  setLogs(sortedLogs);
                  localStorage.setItem(HISTORY_LOGS_KEY, JSON.stringify(sortedLogs));
                }
              }}
              createAuditLog={createAuditLog}
            />
          </div>
        </div>

        {/* Fiscal Period Selector Component */}
        <PeriodSelector
          selectedYear={selectedYear}
          selectedPeriod={selectedPeriod}
          onYearChange={setSelectedYear}
          onPeriodChange={setSelectedPeriod}
          totalInSelectedPeriod={itemsInSelectedPeriod.length}
        />

        {/* Global Key Performance Indicators (KPIs) */}
        <StatsGrid items={itemsInSelectedPeriod} />

        {/* Main Table Segment with filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-bold text-gray-900">Daftar Pengajuan Banding</h3>
              <p className="text-xs text-gray-500">Menampilkan kasus di {PERIOD_MONTHS[selectedPeriod].name} Tahun {selectedYear}</p>
            </div>
          </div>
          
          <BandingTable
            items={itemsInSelectedPeriod}
            onEdit={(item) => {
              setEditingItem(item);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteItem}
            onDuplicate={handleDuplicateItem}
            onStatusChange={handleStatusChange}
          />
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6 mt-12 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
        <p>© {new Date().getFullYear()} WDBOS Livechat Banding Dashboard. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-gray-300">Didesain dengan presisi pixel-perfect dan keamanan log terintegrasi.</p>
      </footer>

      {/* Modal Popup Form */}
      {isFormOpen && (
        <BandingForm
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setIsFormOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* History Edit Sidebar Drawer */}
      {isHistoryOpen && (
        <EditHistoryList
          logs={logs}
          onClearLogs={handleClearLogs}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {/* GLOBAL LOGOUT CONFIRMATION */}
      <ConfirmModal
        isOpen={confirmLogout}
        title="Keluar Operator"
        message="Apakah Anda yakin ingin keluar dari operator aktif saat ini?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        type="warning"
        onConfirm={executeLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
