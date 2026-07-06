import React, { useState, useEffect } from 'react';
import { 
  Cloud, Check, X, RefreshCw, ArrowLeftRight, HelpCircle, 
  FileSpreadsheet, Link, User, Plus, Trash2, Globe
} from 'lucide-react';
import { BandingItem, STAFF_PRESETS, SITUS_PRESETS } from '../types';

interface GoogleSheetsSyncProps {
  items: BandingItem[];
  onSyncComplete: (importedItems: BandingItem[], logMessage: string) => void;
  createAuditLog: (actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE', itemName: string, details: string) => void;
}

const STORAGE_KEY = 'wdbos_google_sheets_webapp_url';
const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyouC1SdCqvy3aXx6i0gNdyx60ygEaCueDmItZJN2zXk3FDSgyvCU8Atz6XmlSXblkN/exec';

export default function GoogleSheetsSync({ items, onSyncComplete, createAuditLog }: GoogleSheetsSyncProps) {
  const [webAppUrl, setWebAppUrl] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().startsWith('https://script.google.com/')) {
      return saved.trim();
    }
    return DEFAULT_WEB_APP_URL;
  });
  
  const [savedUrl, setSavedUrl] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().startsWith('https://script.google.com/')) {
      return saved.trim();
    }
    return DEFAULT_WEB_APP_URL;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync / write the default to local storage on mount if missing or invalid
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !saved.trim().startsWith('https://script.google.com/')) {
      localStorage.setItem(STORAGE_KEY, DEFAULT_WEB_APP_URL);
    }
  }, []);

  const handleSaveUrl = () => {
    const trimmed = webAppUrl.trim();
    if (trimmed === '') {
      localStorage.removeItem(STORAGE_KEY);
      setSavedUrl('');
      setStatusMsg({ type: 'success', text: 'URL Koneksi dihapus. Aplikasi kembali menggunakan penyimpanan lokal.' });
    } else if (!trimmed.startsWith('https://script.google.com/')) {
      setStatusMsg({ type: 'error', text: 'URL tidak valid. Harus dimulai dengan https://script.google.com/macros/s/...' });
      return;
    } else {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setSavedUrl(trimmed);
      setStatusMsg({ type: 'success', text: 'URL Web App berhasil disimpan dan terhubung!' });
    }
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // 1. Sync All: Send all local data to Google Sheets
  const handleSyncAll = async () => {
    if (!savedUrl) return;
    setIsLoading(true);
    setStatusMsg({ type: 'success', text: 'Memulai sinkronisasi massal ke Google Sheets...' });

    try {
      await fetch(savedUrl, {
        method: 'POST',
        mode: 'no-cors', // handle CORS gracefully
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_all',
          items: items
        })
      });

      // Since mode is no-cors, we might not get full response status, but we assume success if no error is thrown
      setStatusMsg({ 
        type: 'success', 
        text: 'Berhasil menyinkronkan ' + items.length + ' data ke Google Sheets! Silakan periksa Google Sheet Anda.' 
      });
      createAuditLog('STATUS_CHANGE', 'Sinkronisasi Google Sheet', `Operator menyinkronkan seluruh ${items.length} entri data ke Google Sheet.`);
    } catch (error) {
      console.error('Error syncing to Google Sheet:', error);
      setStatusMsg({ type: 'error', text: 'Gagal menghubungi Google Apps Script. Pastikan URL benar dan Deploy sebagai Web App (Anyone).' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Pull All: Fetch all data from Google Sheets
  const handlePullAll = async () => {
    if (!savedUrl) return;
    setIsLoading(true);
    setStatusMsg({ type: 'success', text: 'Mengunduh data terbaru dari Google Sheets...' });

    try {
      const response = await fetch(savedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        if (Array.isArray(result.staffList)) {
          localStorage.setItem('wdbos_staff_synced_list', JSON.stringify(result.staffList.filter(Boolean)));
        }
        if (Array.isArray(result.situsList)) {
          localStorage.setItem('wdbos_situs_synced_list', JSON.stringify(result.situsList.filter(Boolean)));
        }
        onSyncComplete(result.data, `Mengunduh ${result.data.length} data dari Google Sheets.`);
        setStatusMsg({ 
          type: 'success', 
          text: `Selesai! Berhasil mengunduh & memperbarui ${result.data.length} data dari Google Sheets ke dashboard.` 
        });
        createAuditLog('STATUS_CHANGE', 'Tarik Google Sheet', `Operator menarik ${result.data.length} entri data dari Google Sheet.`);
      } else {
        setStatusMsg({ type: 'error', text: result.message || 'Gagal mengambil data. Format tidak sesuai.' });
      }
    } catch (error) {
      console.error('Error pulling from Google Sheet:', error);
      setStatusMsg({ 
        type: 'error', 
        text: 'Tidak dapat mengambil data langsung (Kendala Kebijakan CORS Browser). Silakan pastikan deploy script Google Anda diatur ke "Anyone" dan bertipe "Web App".' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Staff Management State & Functions
  const [staffList, setStaffList] = useState<string[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [staffError, setStaffError] = useState('');
  const [isSyncingStaff, setIsSyncingStaff] = useState(false);

  const loadStaffList = () => {
    const savedStaff = localStorage.getItem('wdbos_staff_custom_list');
    let customList: string[] = [];
    if (savedStaff) {
      try {
        customList = JSON.parse(savedStaff);
      } catch (e) {}
    }

    const cachedSynced = localStorage.getItem('wdbos_staff_synced_list');
    let syncedList: string[] = [];
    if (cachedSynced) {
      try {
        syncedList = JSON.parse(cachedSynced);
      } catch (e) {}
    }

    const basePresets = syncedList.length > 0 ? syncedList : STAFF_PRESETS;
    const combined = Array.from(new Set([...basePresets, ...customList]));
    setStaffList(combined);
  };

  // Situs Management State & Functions
  const [situsList, setSitusList] = useState<string[]>([]);
  const [newSitusName, setNewSitusName] = useState('');
  const [situsError, setSitusError] = useState('');
  const [isSyncingSitus, setIsSyncingSitus] = useState(false);

  const loadSitusList = () => {
    const savedSitus = localStorage.getItem('wdbos_situs_custom_list');
    let customList: string[] = [];
    if (savedSitus) {
      try {
        customList = JSON.parse(savedSitus);
      } catch (e) {}
    }

    const cachedSynced = localStorage.getItem('wdbos_situs_synced_list');
    let syncedList: string[] = [];
    if (cachedSynced) {
      try {
        syncedList = JSON.parse(cachedSynced);
      } catch (e) {}
    }

    const basePresets = syncedList.length > 0 ? syncedList : SITUS_PRESETS;
    const combined = Array.from(new Set([...basePresets, ...customList]));
    setSitusList(combined);
  };

  useEffect(() => {
    if (isOpen) {
      loadStaffList();
      loadSitusList();
    }
  }, [isOpen]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStaffName.trim();
    if (!name) return;

    if (staffList.some(s => s.toLowerCase() === name.toLowerCase())) {
      setStaffError('Nama staff ini sudah ada dalam daftar.');
      return;
    }

    // Update locally
    const savedStaff = localStorage.getItem('wdbos_staff_custom_list');
    let customList: string[] = [];
    if (savedStaff) {
      try { customList = JSON.parse(savedStaff); } catch (e) {}
    }
    customList.push(name);
    localStorage.setItem('wdbos_staff_custom_list', JSON.stringify(customList));

    const updatedCombined = [...staffList, name];
    setStaffList(updatedCombined);
    setNewStaffName('');
    setStaffError('');

    createAuditLog('CREATE', `Staff: ${name}`, 'Menambahkan nama staff baru.');

    // Sync to Google Sheets
    const urlToUse = savedUrl || DEFAULT_WEB_APP_URL;
    if (urlToUse) {
      setIsSyncingStaff(true);
      try {
        await fetch(urlToUse, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'add_staff',
            staffName: name
          })
        });
        console.log('Successfully synced added staff to Google Sheets');
      } catch (err) {
        console.error('Failed to sync added staff to Google Sheets:', err);
      } finally {
        setIsSyncingStaff(false);
      }
    }
  };

  const handleDeleteStaff = async (nameToDelete: string) => {
    if (staffList.length <= 1) {
      setStaffError('Harus ada setidaknya satu staff dalam daftar.');
      return;
    }

    // Update local lists
    const savedStaff = localStorage.getItem('wdbos_staff_custom_list');
    let customList: string[] = [];
    if (savedStaff) {
      try { customList = JSON.parse(savedStaff); } catch (e) {}
    }
    const filteredCustom = customList.filter(s => s !== nameToDelete);
    localStorage.setItem('wdbos_staff_custom_list', JSON.stringify(filteredCustom));

    const cachedSynced = localStorage.getItem('wdbos_staff_synced_list');
    let syncedList: string[] = [];
    if (cachedSynced) {
      try { syncedList = JSON.parse(cachedSynced); } catch (e) {}
    }
    const filteredSynced = syncedList.filter(s => s !== nameToDelete);
    localStorage.setItem('wdbos_staff_synced_list', JSON.stringify(filteredSynced));

    const updatedCombined = staffList.filter(s => s !== nameToDelete);
    setStaffList(updatedCombined);
    setStaffError('');

    createAuditLog('DELETE', `Staff: ${nameToDelete}`, 'Menghapus nama staff dari daftar.');

    // Sync deletion to Google Sheets
    const urlToUse = savedUrl || DEFAULT_WEB_APP_URL;
    if (urlToUse) {
      setIsSyncingStaff(true);
      try {
        await fetch(urlToUse, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete_staff',
            staffName: nameToDelete
          })
        });
        console.log('Successfully synced deleted staff to Google Sheets');
      } catch (err) {
        console.error('Failed to sync deleted staff to Google Sheets:', err);
      } finally {
        setIsSyncingStaff(false);
      }
    }
  };

  const handleAddSitus = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSitusName.trim().toUpperCase();
    if (!name) return;

    if (situsList.some(s => s.toLowerCase() === name.toLowerCase())) {
      setSitusError('Nama situs ini sudah ada dalam daftar.');
      return;
    }

    // Update locally
    const savedSitus = localStorage.getItem('wdbos_situs_custom_list');
    let customList: string[] = [];
    if (savedSitus) {
      try { customList = JSON.parse(savedSitus); } catch (e) {}
    }
    customList.push(name);
    localStorage.setItem('wdbos_situs_custom_list', JSON.stringify(customList));

    const updatedCombined = [...situsList, name];
    setSitusList(updatedCombined);
    setNewSitusName('');
    setSitusError('');

    createAuditLog('CREATE', `Situs: ${name}`, 'Menambahkan nama situs baru.');

    // Sync to Google Sheets
    const urlToUse = savedUrl || DEFAULT_WEB_APP_URL;
    if (urlToUse) {
      setIsSyncingSitus(true);
      try {
        await fetch(urlToUse, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'add_situs',
            situsName: name
          })
        });
        console.log('Successfully synced added situs to Google Sheets');
      } catch (err) {
        console.error('Failed to sync added situs to Google Sheets:', err);
      } finally {
        setIsSyncingSitus(false);
      }
    }
  };

  const handleDeleteSitus = async (nameToDelete: string) => {
    if (situsList.length <= 1) {
      setSitusError('Harus ada setidaknya satu situs dalam daftar.');
      return;
    }

    // Update local lists
    const savedSitus = localStorage.getItem('wdbos_situs_custom_list');
    let customList: string[] = [];
    if (savedSitus) {
      try { customList = JSON.parse(savedSitus); } catch (e) {}
    }
    const filteredCustom = customList.filter(s => s !== nameToDelete);
    localStorage.setItem('wdbos_situs_custom_list', JSON.stringify(filteredCustom));

    const cachedSynced = localStorage.getItem('wdbos_situs_synced_list');
    let syncedList: string[] = [];
    if (cachedSynced) {
      try { syncedList = JSON.parse(cachedSynced); } catch (e) {}
    }
    const filteredSynced = syncedList.filter(s => s !== nameToDelete);
    localStorage.setItem('wdbos_situs_synced_list', JSON.stringify(filteredSynced));

    const updatedCombined = situsList.filter(s => s !== nameToDelete);
    setSitusList(updatedCombined);
    setSitusError('');

    createAuditLog('DELETE', `Situs: ${nameToDelete}`, 'Menghapus nama situs dari daftar.');

    // Sync deletion to Google Sheets
    const urlToUse = savedUrl || DEFAULT_WEB_APP_URL;
    if (urlToUse) {
      setIsSyncingSitus(true);
      try {
        await fetch(urlToUse, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete_situs',
            situsName: nameToDelete
          })
        });
        console.log('Successfully synced deleted situs to Google Sheets');
      } catch (err) {
        console.error('Failed to sync deleted situs to Google Sheets:', err);
      } finally {
        setIsSyncingSitus(false);
      }
    }
  };

  return (
    <div id="google-sheets-sync-container" className="inline-block">
      {/* Mini Status Indicator & Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
          savedUrl 
            ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Hubungkan ke Google Sheets"
      >
        <Cloud className={`h-3.5 w-3.5 ${savedUrl ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
        <span>PENGATURAN</span>
        {savedUrl ? (
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        ) : (
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">Offline</span>
        )}
      </button>

      {/* MODAL CONFIGURATION PANEL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-slate-900 dark:bg-gray-950 text-white rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-base">Google Sheets Live Synchronization</h3>
                  <p className="text-[10px] text-slate-300 dark:text-slate-400">Simpan otomatis & sinkronisasi data banding Anda secara real-time</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-gray-800 dark:text-gray-200">
              {/* Active Connection URL Form */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Google Apps Script Web App URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Link className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-slate-800 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-900/50 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0 border border-gray-700 dark:border-gray-800"
                  >
                    Simpan & Sambungkan
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  *Dengan menyambungkan URL, setiap kali Anda menambah, menghapus, atau mengganti dropdown keterangan/status, perubahan akan disimpan instan ke baris spreadsheet Google Sheets Anda secara real-time!
                </p>
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className={`p-3.5 rounded-xl border text-xs font-bold leading-relaxed flex items-start gap-2.5 ${
                  statusMsg.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' 
                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                }`}>
                  {statusMsg.type === 'success' ? (
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Sync Actions (Only if connected) */}
              {savedUrl && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/70 dark:border-emerald-900/30 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Koneksi Aktif Terhubung</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sync All Button */}
                    <button
                      onClick={handleSyncAll}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Sinkronkan Semua ({items.length} Data) ke Sheet</span>
                    </button>

                    {/* Pull All Button */}
                    <button
                      onClick={handlePullAll}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      title="Tarik seluruh data dari Google Sheet dan timpa data di dashboard lokal"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span>Ambil/Tarik Data Dari Sheet</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-400 text-center font-medium">
                    Sinkronkan Semua: Timpa/Ganti seluruh data Google Sheet dengan data yang ada di dashboard saat ini.
                  </p>
                </div>
              )}

              {/* Staff Management Section */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-rose-500" />
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Manajemen Daftar Staff / Operator</span>
                  </div>
                  {isSyncingStaff && (
                    <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                      Menyinkronkan...
                    </span>
                  )}
                </div>

                {/* List of current staff */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 max-h-40 overflow-y-auto">
                  {staffList.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Belum ada staff terdaftar.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {staffList.map((staff) => (
                        <div key={staff} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100/80 dark:hover:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800/80 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200">
                          <span>{staff}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="text-gray-400 hover:text-rose-500 p-1 transition-colors cursor-pointer border-none bg-transparent"
                            title={`Hapus ${staff}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to add staff */}
                <form onSubmit={handleAddStaff} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama staff baru..."
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-800 rounded-lg focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none bg-white dark:bg-gray-950"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 border-none animate-pulse"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {staffError && (
                  <p className="text-[10px] text-rose-500 font-bold">{staffError}</p>
                )}
              </div>

              {/* Situs Management Section */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-rose-500" />
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Manajemen Daftar Situs</span>
                  </div>
                  {isSyncingSitus && (
                    <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                      Menyinkronkan...
                    </span>
                  )}
                </div>

                {/* List of current situs */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 max-h-40 overflow-y-auto">
                  {situsList.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Belum ada situs terdaftar.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {situsList.map((situs) => (
                        <div key={situs} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100/80 dark:hover:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800/80 transition-colors text-xs font-semibold text-gray-800 dark:text-gray-200">
                          <span>{situs}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSitus(situs)}
                            className="text-gray-400 hover:text-rose-500 p-1 transition-colors cursor-pointer border-none bg-transparent"
                            title={`Hapus ${situs}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to add situs */}
                <form onSubmit={handleAddSitus} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan nama situs baru..."
                    value={newSitusName}
                    onChange={(e) => setNewSitusName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-800 rounded-lg focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none bg-white dark:bg-gray-950"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 border-none animate-pulse"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {situsError && (
                  <p className="text-[10px] text-rose-500 font-bold">{situsError}</p>
                )}
              </div>

              {/* Instructions Panel Toggle */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer border-none outline-none"
                >
                  <div className="flex items-center gap-2 text-slate-800 dark:text-gray-200">
                    <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span>Panduan Langkah Demi Langkah Cara Pasang</span>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 font-extrabold text-sm">{showInstructions ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
                </button>

                {showInstructions && (
                  <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-xs space-y-3.5 text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">Langkah 1: Siapkan Spreadsheet</p>
                      <p>Buat Google Sheets baru di Google Drive Anda.</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">Langkah 2: Salin Script Google Apps Script</p>
                      <p>Di Google Sheets, klik menu <span className="font-bold text-gray-800 dark:text-white">Extensions &gt; Apps Script</span>.</p>
                      <p>Hapus seluruh kode bawaan, lalu salin dan tempel isi kode dari file <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">/code.gs</span> yang ada di file manager proyek ini.</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">Langkah 3: Jalankan Fungsi Pengaturan Pertama</p>
                      <p>Di dalam editor Apps Script, pilih fungsi <span className="font-bold text-gray-800 dark:text-white">initializeSheet</span> di dropdown atas, lalu klik tombol <span className="font-bold text-gray-800 dark:text-white">Run</span>.</p>
                      <p>Berikan izin akses (klik Advanced &gt; Go to Untitled project &gt; Allow). Google Sheets Anda akan otomatis membuat tab baru bernama <span className="font-bold text-gray-800 dark:text-white">"Data Banding"</span> lengkap dengan header rapi, warna baris, lebar kolom pas, serta dropdown status!</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">Langkah 4: Deploy sebagai Web App</p>
                      <p>Klik tombol biru <span className="font-bold text-gray-800 dark:text-white">Deploy &gt; New deployment</span> di kanan atas.</p>
                      <p>Pilih tipe <span className="font-bold text-gray-800 dark:text-white">Web app</span> (klik ikon roda gigi jika belum muncul).</p>
                      <p>Ubah settingan:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><span className="font-bold text-gray-800 dark:text-white">Execute as:</span> Me (email anda)</li>
                        <li><span className="font-bold text-gray-800 dark:text-white">Who has access:</span> Anyone</li>
                      </ul>
                      <p>Klik <span className="font-bold text-gray-800 dark:text-white">Deploy</span>, lalu salin <span className="font-bold text-gray-800 dark:text-white">Web app URL</span> yang diberikan.</p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white">Langkah 5: Tempel URL di Sini</p>
                      <p>Tempel URL tersebut pada kolom input di atas lalu klik <span className="font-bold text-gray-800 dark:text-white">Simpan & Sambungkan</span>. Selesai! Data Anda siap disinkronkan.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-950 rounded-b-2xl border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2.5">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
