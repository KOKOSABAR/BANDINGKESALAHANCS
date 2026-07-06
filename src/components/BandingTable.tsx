import React, { useState } from 'react';
import { 
  Search, Filter, ExternalLink, Edit3, Trash2, Eye, Copy, 
  ArrowUpDown, FileText, CheckCircle, HelpCircle, AlertCircle, RefreshCw, X, ChevronDown
} from 'lucide-react';
import { BandingItem, KeteranganStatus, STATUS_OPTIONS } from '../types';
import ConfirmModal from './ConfirmModal';

interface BandingTableProps {
  items: BandingItem[];
  onEdit: (item: BandingItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: BandingItem) => void;
  onStatusChange: (id: string, newStatus: KeteranganStatus) => void;
}

export default function BandingTable({
  items,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
}: BandingTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [situsFilter, setSitusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'tanggal' | 'namaStaff' | 'namaSitus'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal/Drawer for viewing details
  const [viewingItem, setViewingItem] = useState<BandingItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BandingItem | null>(null);
  const [deletePassword, setDeletePassword] = useState('');

  // Extract unique site names for filters
  const uniqueSites = Array.from(new Set(items.map(item => item.namaSitus))).filter(Boolean);

  // Sorting helper
  const handleSort = (field: 'tanggal' | 'namaStaff' | 'namaSitus') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort items
  const filteredItems = items
    .filter((item) => {
      const matchSearch = 
        item.namaStaff.toLowerCase().includes(search.toLowerCase()) ||
        item.namaSitus.toLowerCase().includes(search.toLowerCase()) ||
        item.keteranganBanding.toLowerCase().includes(search.toLowerCase()) ||
        item.keteranganBandingDiTolak.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || item.keterangan === statusFilter;
      const matchSitus = situsFilter === 'ALL' || item.namaSitus === situsFilter;

      return matchSearch && matchStatus && matchSitus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'tanggal') {
        comparison = a.tanggal.localeCompare(b.tanggal);
      } else if (sortBy === 'namaStaff') {
        comparison = a.namaStaff.localeCompare(b.namaStaff);
      } else if (sortBy === 'namaSitus') {
        comparison = a.namaSitus.localeCompare(b.namaSitus);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Render screenshot links helper
  const renderLinks = (links: string[], title: string) => {
    if (!links || links.length === 0 || (links.length === 1 && links[0] === '')) {
      return <span className="text-xs text-gray-400 italic font-medium">Tidak ada link</span>;
    }

    return (
      <div className="flex flex-wrap justify-center gap-1">
        {links.map((link, idx) => {
          if (!link || link.trim() === '') return null;
          return (
            <a
              key={idx}
              href={link}
              target="_blank"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer hover:scale-102"
              title={link}
            >
              <span>SS {idx + 1}</span>
              <ExternalLink className="h-2.5 w-2.5 text-rose-500" />
            </a>
          );
        })}
      </div>
    );
  };

  const getRowBgClass = (status: KeteranganStatus) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30';
      case 'PENDING':
        return 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30';
      case 'BANDING DI TOLAK':
        return 'bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-900/30';
      case 'NOTE':
        return 'bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-100/50 dark:hover:bg-sky-900/30';
      default:
        return 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800';
    }
  };

  const getStatusSelectClasses = (status: KeteranganStatus) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-800';
      case 'PENDING':
        return 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 dark:border-amber-700 text-amber-950 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-800';
      case 'BANDING DI TOLAK':
        return 'bg-rose-100 dark:bg-rose-900/50 border-rose-500 dark:border-rose-700 text-rose-950 dark:text-rose-100 hover:bg-rose-200 dark:hover:bg-rose-800';
      case 'NOTE':
        return 'bg-sky-100 dark:bg-sky-900/50 border-sky-500 dark:border-sky-700 text-sky-950 dark:text-sky-100 hover:bg-sky-200 dark:hover:bg-sky-800';
      default:
        return 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white';
    }
  };

  return (
    <div id="banding-table-section" className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between transition-colors duration-200">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Cari staff, situs, keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-500 text-gray-900 dark:text-white outline-none transition-all"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Situs Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span>Situs:</span>
            <select
              value={situsFilter}
              onChange={(e) => setSitusFilter(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Semua Situs</option>
              {uniqueSites.map(site => (
                <option key={site} value={site} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{site}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Semua Status</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(search !== '' || statusFilter !== 'ALL' || situsFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setSitusFilter('ALL');
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left">
            <thead className="bg-gray-100/90 dark:bg-gray-950/80 text-[11px] font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-wider select-none border-b border-gray-200 dark:border-gray-800">
              <tr>
                {/* 1. TANGGAL */}
                <th 
                  onClick={() => handleSort('tanggal')}
                  className="px-2 py-2.5 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-950 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>TANGGAL</span>
                    {sortBy === 'tanggal' && (
                      <span className="text-rose-500 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                
                {/* 2. NAMA SITUS */}
                <th 
                  onClick={() => handleSort('namaSitus')}
                  className="px-2 py-2.5 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-950 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>NAMA SITUS</span>
                    {sortBy === 'namaSitus' && (
                      <span className="text-rose-500 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                
                {/* 3. NAMA STAFF */}
                <th 
                  onClick={() => handleSort('namaStaff')}
                  className="px-2 py-2.5 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-950 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>NAMA STAFF</span>
                    {sortBy === 'namaStaff' && (
                      <span className="text-rose-500 text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                
                {/* 4. BUKTI SS DARI AUDITOR */}
                <th className="px-2 py-2.5 text-center">BUKTI SS DARI AUDITOR</th>
                
                {/* 5. BUKTI BANDING */}
                <th className="px-2 py-2.5 text-center">BUKTI BANDING</th>
                
                {/* 6. KETERANGAN BANDING */}
                <th className="px-2 py-2.5 text-center">KETERANGAN BANDING</th>
                
                {/* 7. KETERANGAN (Status Dropdown) */}
                <th className="px-2 py-2.5 text-center">KETERANGAN</th>
                
                {/* 8. KETERANGAN BANDING DI TOLAK */}
                <th className="px-2 py-2.5 text-center">KETERANGAN DI TOLAK / NOTE</th>
                
                {/* ACTIONS */}
                <th className="px-2 py-2.5 text-center">AKSI</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <p className="font-semibold text-sm text-gray-500 dark:text-gray-400">Tidak ada record banding ditemukan</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Coba ubah filter periode atau tambahkan record baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const statusInfo = STATUS_OPTIONS.find((s) => s.value === item.keterangan) || STATUS_OPTIONS[0];
                  
                  const rowBgClass = getRowBgClass(item.keterangan);
                  const borderLeftColor = 
                    item.keterangan === 'DONE' ? 'border-l-emerald-500' :
                    item.keterangan === 'PENDING' ? 'border-l-amber-500' :
                    item.keterangan === 'BANDING DI TOLAK' ? 'border-l-rose-500' :
                    'border-l-sky-500';

                  return (
                    <tr 
                      key={item.id} 
                      id={`row-banding-${item.id}`} 
                      className={`transition-colors border-b border-gray-200 dark:border-gray-800 ${rowBgClass} border-l-4 ${borderLeftColor} group`}
                    >
                      {/* 1. TANGGAL */}
                      <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {item.tanggal}
                      </td>

                      {/* 2. NAMA SITUS */}
                      <td className="px-2 py-2 text-center font-extrabold text-rose-900 dark:text-rose-300 whitespace-nowrap">
                        <span className="bg-white/80 dark:bg-gray-950/80 border border-rose-200/60 dark:border-rose-950/40 px-2 py-0.5 rounded-lg shadow-2xs">
                          {item.namaSitus}
                        </span>
                      </td>

                      {/* 3. NAMA STAFF */}
                      <td className="px-2 py-2 text-center font-extrabold text-gray-950 dark:text-white whitespace-nowrap">
                        {item.namaStaff}
                      </td>

                      {/* 4. BUKTI SS DARI AUDITOR */}
                      <td className="px-2 py-2 text-center">
                        {renderLinks(item.buktiSSAuditor, 'Bukti Auditor')}
                      </td>

                      {/* 5. BUKTI BANDING */}
                      <td className="px-2 py-2 text-center">
                        {renderLinks(item.buktiBanding, 'Bukti Banding')}
                      </td>

                      {/* 6. KETERANGAN BANDING */}
                      <td className="px-2 py-2 max-w-[130px] text-center">
                        <p className="truncate text-gray-900 dark:text-gray-100 font-bold text-xs text-center" title={item.keteranganBanding}>
                          {item.keteranganBanding || <span className="text-gray-400 italic font-medium">Kosong</span>}
                        </p>
                      </td>

                      {/* 7. KETERANGAN (Inline Dropdown status selector) */}
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <div className="relative inline-block w-[145px]">
                          <select
                            id={`select-status-inline-${item.id}`}
                            value={item.keterangan}
                            onChange={(e) => onStatusChange(item.id, e.target.value as KeteranganStatus)}
                            className={`appearance-none w-full text-[10px] font-black uppercase tracking-normal pl-2 pr-6 py-1.5 rounded-lg border shadow-xs outline-none cursor-pointer focus:ring-4 focus:ring-rose-500/10 transition-all ${getStatusSelectClasses(item.keterangan)}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-xs">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                            <ChevronDown className="h-3 w-3 text-current opacity-75" />
                          </div>
                        </div>
                      </td>

                      {/* 8. KETERANGAN BANDING DI TOLAK */}
                      <td className="px-2 py-2 max-w-[130px] text-center">
                        <p className="truncate text-xs font-bold text-center" title={item.keteranganBandingDiTolak}>
                          {item.keteranganBandingDiTolak ? (
                            <span className={
                              item.keterangan === 'BANDING DI TOLAK' 
                                ? 'text-rose-900 dark:text-rose-300 bg-white/80 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/40' 
                                : item.keterangan === 'NOTE'
                                ? 'text-sky-900 dark:text-sky-300 bg-white/80 dark:bg-sky-950/40 px-1.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-900/40'
                                : 'text-gray-800 dark:text-gray-200'
                            }>
                              {item.keteranganBandingDiTolak}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic font-medium">-</span>
                          )}
                        </p>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-0.5 px-0.5 py-0.5 rounded-lg bg-white/40 dark:bg-gray-950/40 border border-gray-200/40 dark:border-gray-800/45 shadow-2xs group-hover:bg-white/80 dark:group-hover:bg-gray-900 transition-all">
                          {/* View Detail Button */}
                          <button
                            onClick={() => setViewingItem(item)}
                            className="p-1 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-gray-800 rounded-md cursor-pointer transition-all hover:scale-105"
                            title="Detail Rinci"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Duplicate Button */}
                          <button
                            onClick={() => onDuplicate(item)}
                            className="p-1 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-gray-800 rounded-md cursor-pointer transition-all hover:scale-105"
                            title="Duplikat Record"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-800 rounded-md cursor-pointer transition-all hover:scale-105"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              setItemToDelete(item);
                            }}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-md cursor-pointer transition-all hover:scale-105"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {viewingItem && (
        <div id="detail-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50">
                  {viewingItem.namaSitus}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Detail Kasus Banding</span>
              </div>
              <button 
                onClick={() => setViewingItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-350 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Info Table Card */}
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Tanggal Kejadian</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{viewingItem.tanggal}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Nama Staff</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{viewingItem.namaStaff}</span>
                </div>
              </div>

              {/* Status Badge Line */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status Keterangan</span>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-md uppercase ${
                  STATUS_OPTIONS.find(s => s.value === viewingItem.keterangan)?.bg || 'bg-gray-100'
                } ${
                  STATUS_OPTIONS.find(s => s.value === viewingItem.keterangan)?.color || 'text-gray-800'
                }`}>
                  {viewingItem.keterangan}
                </span>
              </div>

              {/* Screenshots Proof lists */}
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Bukti SS Dari Auditor</span>
                  {viewingItem.buktiSSAuditor.length === 0 || (viewingItem.buktiSSAuditor.length === 1 && viewingItem.buktiSSAuditor[0] === '') ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">Tidak ada link bukti auditor</span>
                  ) : (
                    <div className="space-y-1.5">
                      {viewingItem.buktiSSAuditor.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 p-2 rounded-lg group transition-all"
                        >
                          <span className="truncate max-w-[90%] font-medium">Link {i+1}: {url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1.5">Bukti Banding Staf</span>
                  {viewingItem.buktiBanding.length === 0 || (viewingItem.buktiBanding.length === 1 && viewingItem.buktiBanding[0] === '') ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">Tidak ada link bukti banding</span>
                  ) : (
                    <div className="space-y-1.5">
                      {viewingItem.buktiBanding.map((url, i) => (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 p-2 rounded-lg group transition-all"
                        >
                          <span className="truncate max-w-[90%] font-medium">Link {i+1}: {url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Text descriptions */}
              <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Keterangan Banding</span>
                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {viewingItem.keteranganBanding || <span className="text-gray-400 dark:text-gray-500 italic">Tidak ada rincian keterangan banding.</span>}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Keterangan Banding Di Tolak / Catatan</span>
                  <div className={`p-3 rounded-xl border text-xs whitespace-pre-line leading-relaxed ${
                    viewingItem.keterangan === 'BANDING DI TOLAK' 
                      ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300' 
                      : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {viewingItem.keteranganBandingDiTolak || <span className="text-gray-400 dark:text-gray-500 italic">Tidak ada alasan ditolak atau catatan tambahan.</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Hapus Data Banding"
        message={itemToDelete ? `Apakah Anda yakin ingin menghapus data banding untuk ${itemToDelete.namaStaff} (${itemToDelete.namaSitus}) secara permanen?` : ''}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        type="danger"
        showPasswordInput={true}
        passwordValue={deletePassword}
        onPasswordChange={setDeletePassword}
        passwordPlaceholder="Masukkan password wdbos88..."
        isConfirmDisabled={deletePassword !== 'wdbos88'}
        onConfirm={() => {
          if (itemToDelete) {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
            setDeletePassword('');
          }
        }}
        onCancel={() => {
          setItemToDelete(null);
          setDeletePassword('');
        }}
      />
    </div>
  );
}
