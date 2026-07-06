import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Globe, User, Calendar, Link as LinkIcon, FileText, Check } from 'lucide-react';
import { BandingItem, KeteranganStatus, SITUS_PRESETS, STATUS_OPTIONS } from '../types';

interface BandingFormProps {
  item?: BandingItem | null; // if passed, we are editing
  onSave: (item: Omit<BandingItem, 'id' | 'createdAt'> & { id?: string }) => void;
  onClose: () => void;
}

export default function BandingForm({ item, onSave, onClose }: BandingFormProps) {
  const [tanggal, setTanggal] = useState('');
  const [namaSitus, setNamaSitus] = useState('');
  const [namaStaff, setNamaStaff] = useState('');
  
  // List of links for Auditor Proof (at least one empty input initially)
  const [buktiSSAuditor, setBuktiSSAuditor] = useState<string[]>(['']);
  // List of links for Appeal Proof (at least one empty input initially)
  const [buktiBanding, setBuktiBanding] = useState<string[]>(['']);
  
  const [keteranganBanding, setKeteranganBanding] = useState('');
  const [keterangan, setKeterangan] = useState<KeteranganStatus>('PENDING');
  const [keteranganBandingDiTolak, setKeteranganBandingDiTolak] = useState('');

  const [situsList, setSitusList] = useState<string[]>([]);

  // Preset loading for edits
  useEffect(() => {
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

    if (item) {
      setTanggal(item.tanggal);
      setNamaSitus(item.namaSitus);
      setNamaStaff(item.namaStaff);
      setBuktiSSAuditor(item.buktiSSAuditor.length > 0 ? [...item.buktiSSAuditor] : ['']);
      setBuktiBanding(item.buktiBanding.length > 0 ? [...item.buktiBanding] : ['']);
      setKeteranganBanding(item.keteranganBanding || '');
      setKeterangan(item.keterangan);
      setKeteranganBandingDiTolak(item.keteranganBandingDiTolak || '');
    } else {
      // Default values for new record
      const today = new Date().toISOString().split('T')[0];
      setTanggal(today);
      setNamaSitus(combined[0] || SITUS_PRESETS[0] || '');
      setNamaStaff('');
      setBuktiSSAuditor(['']);
      setBuktiBanding(['']);
      setKeteranganBanding('');
      setKeterangan('PENDING');
      setKeteranganBandingDiTolak('');
    }
  }, [item]);

  // Handle link changes
  const handleLinkChange = (index: number, value: string, type: 'auditor' | 'banding') => {
    if (type === 'auditor') {
      const updated = [...buktiSSAuditor];
      updated[index] = value;
      setBuktiSSAuditor(updated);
    } else {
      const updated = [...buktiBanding];
      updated[index] = value;
      setBuktiBanding(updated);
    }
  };

  const addLinkInput = (type: 'auditor' | 'banding') => {
    if (type === 'auditor') {
      setBuktiSSAuditor([...buktiSSAuditor, '']);
    } else {
      setBuktiBanding([...buktiBanding, '']);
    }
  };

  const removeLinkInput = (index: number, type: 'auditor' | 'banding') => {
    if (type === 'auditor') {
      const updated = [...buktiSSAuditor];
      updated.splice(index, 1);
      // Ensure always has at least one input box
      setBuktiSSAuditor(updated.length > 0 ? updated : ['']);
    } else {
      const updated = [...buktiBanding];
      updated.splice(index, 1);
      setBuktiBanding(updated.length > 0 ? updated : ['']);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !namaSitus || !namaStaff) {
      alert('Mohon isi Tanggal, Nama Situs, dan Nama Staff.');
      return;
    }

    // Clean links (filter out empty inputs, trim whitespace)
    const cleanedAuditorLinks = buktiSSAuditor.map(l => l.trim()).filter(l => l !== '');
    const cleanedBandingLinks = buktiBanding.map(l => l.trim()).filter(l => l !== '');

    onSave({
      ...(item && { id: item.id }),
      tanggal,
      namaSitus,
      namaStaff,
      buktiSSAuditor: cleanedAuditorLinks,
      buktiBanding: cleanedBandingLinks,
      keteranganBanding,
      keterangan,
      keteranganBandingDiTolak,
    });
  };

  return (
    <div id="banding-form-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id="banding-form-modal" 
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col my-8 max-h-[90vh] transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {item ? 'Edit Record Banding' : 'Tambah Record Banding Baru'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Isi formulir lengkap di bawah untuk merekam data banding livechat.
            </p>
          </div>
          <button 
            id="btn-close-form"
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-800 dark:text-gray-100">
          {/* Row 1: Tanggal & Nama Situs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-tanggal" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Tanggal Kejadian <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  type="date"
                  id="input-tanggal"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-situs" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Nama Situs <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Globe className="h-4 w-4" />
                </div>
                <select
                  id="input-situs"
                  value={namaSitus}
                  onChange={(e) => setNamaSitus(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all cursor-pointer font-medium"
                >
                  {situsList.map((preset) => (
                    <option key={preset} value={preset} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                      {preset}
                    </option>
                  ))}
                  <option value="CUSTOM" className="bg-white dark:bg-gray-900 text-gray-950 dark:text-gray-400 font-bold">--- Lainnya (Tulis Manual) ---</option>
                </select>
              </div>
              {/* If "CUSTOM" or not in preset, allow typing */}
              {!situsList.includes(namaSitus) && namaSitus !== '' && (
                <input
                  type="text"
                  placeholder="Masukkan Nama Situs Manual..."
                  value={namaSitus === 'CUSTOM' ? '' : namaSitus}
                  onChange={(e) => setNamaSitus(e.target.value)}
                  className="mt-2 block w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                />
              )}
            </div>
          </div>

          {/* Row 2: Nama Staff */}
          <div>
            <label htmlFor="input-staff" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Nama Staff <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                id="input-staff"
                required
                placeholder="Nama staff yang mengajukan banding..."
                value={namaStaff}
                onChange={(e) => setNamaStaff(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 3: BUKTI SS DARI AUDITOR (Array of links) */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950/40 rounded-xl border border-gray-200/60 dark:border-gray-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  BUKTI SS DARI AUDITOR
                </label>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Masukkan link screenshot bukti kesalahan dari auditor (bisa lebih dari 1)</p>
              </div>
              <button
                type="button"
                id="btn-add-auditor-link"
                onClick={() => addLinkInput('auditor')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 px-2 py-1 rounded-md transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Link</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {buktiSSAuditor.map((link, index) => (
                <div key={`auditor-${index}`} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <LinkIcon className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/screenshot.jpg"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value, 'auditor')}
                      className="block w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLinkInput(index, 'auditor')}
                    className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Hapus Link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: BUKTI BANDING (Array of links) */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950/40 rounded-xl border border-gray-200/60 dark:border-gray-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  BUKTI BANDING
                </label>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Masukkan link screenshot atau dokumen pendukung banding (bisa lebih dari 1)</p>
              </div>
              <button
                type="button"
                id="btn-add-banding-link"
                onClick={() => addLinkInput('banding')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 px-2 py-1 rounded-md transition-colors cursor-pointer border border-rose-100 dark:border-rose-900/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Link</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {buktiBanding.map((link, index) => (
                <div key={`banding-${index}`} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <LinkIcon className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="url"
                      placeholder="https://example.com/bukti-banding.jpg"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value, 'banding')}
                      className="block w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLinkInput(index, 'banding')}
                    className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Hapus Link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Row 5: KETERANGAN BANDING (Appeal Description) */}
          <div>
            <label htmlFor="input-keterangan-banding" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Keterangan Banding
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                <FileText className="h-4 w-4" />
              </div>
              <textarea
                id="input-keterangan-banding"
                rows={3}
                placeholder="Tuliskan detail argumen atau alasan banding di sini..."
                value={keteranganBanding}
                onChange={(e) => setKeteranganBanding(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Row 6: KETERANGAN (Status Dropdown) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label htmlFor="input-status" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Keterangan (Status)
              </label>
              <select
                id="input-status"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value as KeteranganStatus)}
                className="block w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all cursor-pointer font-semibold"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 7: KETERANGAN BANDING DI TOLAK (Shown and styled beautifully) */}
            <div className="sm:col-span-2">
              <label htmlFor="input-keterangan-tolak" className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Keterangan Banding Di Tolak / Catatan Tambahan
              </label>
              <textarea
                id="input-keterangan-tolak"
                rows={2}
                placeholder={
                  keterangan === 'BANDING DI TOLAK' 
                    ? 'Tulis alasan rinci mengapa banding ditolak oleh auditor...' 
                    : 'Tuliskan catatan tambahan (diperlukan jika status NOTE)...'
                }
                value={keteranganBandingDiTolak}
                onChange={(e) => setKeteranganBandingDiTolak(e.target.value)}
                className="block w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-b-2xl">
          <button
            type="button"
            id="btn-cancel-form"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            id="btn-save-form"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Simpan Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
