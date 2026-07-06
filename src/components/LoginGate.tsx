import React, { useState, useEffect } from 'react';
import { Layers, User, LogIn, Search, Sun, Moon } from 'lucide-react';
import { STAFF_PRESETS } from '../types';

interface LoginGateProps {
  onLogin: (staffName: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function LoginGate({ onLogin, theme, onToggleTheme }: LoginGateProps) {
  const [staffList, setStaffList] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyouC1SdCqvy3aXx6i0gNdyx60ygEaCueDmItZJN2zXk3FDSgyvCU8Atz6XmlSXblkN/exec';

  // Load existing custom staff names plus presets and fetch from Sheets
  useEffect(() => {
    // 1. Initial offline load from local cache & static presets
    const savedStaff = localStorage.getItem('wdbos_staff_custom_list');
    let customList: string[] = [];
    if (savedStaff) {
      try {
        customList = JSON.parse(savedStaff);
      } catch (e) {
        console.error(e);
      }
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
    
    if (combined.length > 0) {
      setSelectedStaff(combined[0]);
    }

    // 2. Fetch live list of staff from Google Sheets if configured
    const webAppUrl = localStorage.getItem('wdbos_google_sheets_webapp_url') || DEFAULT_WEB_APP_URL;
    if (webAppUrl) {
      setIsSyncing(true);
      fetch(`${webAppUrl}?type=staff`)
        .then(res => res.json())
        .then(resData => {
          if (resData.status === 'success' && Array.isArray(resData.staffList)) {
            const liveStaff = resData.staffList.filter(Boolean);
            localStorage.setItem('wdbos_staff_synced_list', JSON.stringify(liveStaff));
            
            const newCombined = Array.from(new Set([...liveStaff, ...customList]));
            setStaffList(newCombined);
            if (newCombined.length > 0) {
              setSelectedStaff(prev => {
                if (newCombined.includes(prev)) return prev;
                return newCombined[0] || '';
              });
            }
          }
        })
        .catch(err => {
          console.error('Failed to fetch staff list from Google Sheets:', err);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, []);

  const handleEnterDashboard = () => {
    if (!selectedStaff) {
      setErrorMsg('Silakan pilih nama staff terlebih dahulu.');
      return;
    }
    onLogin(selectedStaff);
  };

  return (
    <div id="login-gate-container" className="min-h-screen flex items-center justify-center bg-radial from-rose-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 px-4 sm:px-6 relative transition-colors duration-200 text-gray-800 dark:text-gray-100">
      
      {/* Floating Theme Switcher on Login Screen */}
      {onToggleTheme && theme && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onToggleTheme}
            className="inline-flex items-center justify-center p-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl shadow-md transition-colors cursor-pointer"
            title={theme === 'light' ? 'Ganti ke Tema Gelap' : 'Ganti ke Tema Terang'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-500" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 transition-all duration-200">
        
        {/* Header branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="bg-gradient-to-tr from-rose-600 to-rose-500 text-white p-3.5 rounded-2xl shadow-lg shadow-rose-100 dark:shadow-none">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              WDBOS LIVECHAT GATE
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-400 font-medium mt-1">
              Pilih identitas Anda sebelum mengakses dashboard banding
            </p>
          </div>
        </div>

        {/* Form Selector */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="staff-login-select" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Pilih Nama Staff / Operator
              </label>
              {isSyncing ? (
                <span className="text-[10px] text-rose-500 font-bold animate-pulse flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  Sinkron Sheet...
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                  ● Terhubung Sheet
                </span>
              )}
            </div>
            
            {/* Search Input for Staff Name */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  const matched = staffList.filter(s => s.toLowerCase().includes(val.toLowerCase()));
                  if (matched.length > 0 && !matched.includes(selectedStaff)) {
                    setSelectedStaff(matched[0]);
                  }
                }}
                placeholder="Cari nama staff / operator..."
                className="block w-full pl-10 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 outline-none transition-all font-medium text-gray-700 dark:text-gray-300"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="h-4.5 w-4.5" />
              </div>
              
              <select
                id="staff-login-select"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="block w-full pl-11 pr-10 py-3 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-500 outline-none transition-all cursor-pointer font-semibold text-gray-800 dark:text-gray-100"
              >
                <option value="" disabled>-- Pilih Nama Anda --</option>
                {staffList
                  .filter(staff => staff.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((staff) => (
                    <option key={staff} value={staff} className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
                      {staff}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 text-center font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Enter Button */}
        <button
          onClick={handleEnterDashboard}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-100 dark:shadow-none hover:shadow-lg transition-all cursor-pointer"
        >
          <LogIn className="h-4.5 w-4.5" />
          <span>Masuk ke Dashboard</span>
        </button>

        {/* Footer info */}
        <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-2 border-t border-gray-100 dark:border-gray-800">
          Setiap aktivitas penambahan & pengeditan banding akan terekam ke dalam log riwayat berdasarkan nama staff yang dipilih.
        </div>
      </div>
    </div>
  );
}
