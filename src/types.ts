export type KeteranganStatus = 'PENDING' | 'DONE' | 'BANDING DI TOLAK' | 'NOTE';

export interface BandingItem {
  id: string;
  tanggal: string; // Format: YYYY-MM-DD
  namaSitus: string;
  namaStaff: string;
  buktiSSAuditor: string[]; // list of links
  buktiBanding: string[]; // list of links
  keteranganBanding: string;
  keterangan: KeteranganStatus;
  keteranganBandingDiTolak: string;
  createdAt: number;
}

export interface EditLog {
  id: string;
  timestamp: number;
  operator: string;
  itemId?: string;
  itemName: string; // e.g., "Andi Saputra (WDBOS VIP)"
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE' | 'STATUS_CHANGE';
  details: string;
}

export type PeriodeIndex = 1 | 2 | 3 | 4;

export interface PeriodeFilter {
  year: number;
  periode: PeriodeIndex;
}

export const PERIOD_MONTHS: Record<PeriodeIndex, { name: string; months: number[] }> = {
  1: { name: 'PERIODE 1 (Jan - Mar)', months: [0, 1, 2] }, // January = 0, February = 1, March = 2
  2: { name: 'PERIODE 2 (Apr - Jun)', months: [3, 4, 5] },
  3: { name: 'PERIODE 3 (Jul - Sep)', months: [6, 7, 8] },
  4: { name: 'PERIODE 4 (Okt - Des)', months: [9, 10, 11] },
};

export const STATUS_OPTIONS: { value: KeteranganStatus; label: string; color: string; bg: string; border: string }[] = [
  {
    value: 'PENDING',
    label: 'PENDING',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  {
    value: 'DONE',
    label: 'DONE',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  {
    value: 'BANDING DI TOLAK',
    label: 'BANDING DI TOLAK',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  {
    value: 'NOTE',
    label: 'NOTE',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
];

export const SITUS_PRESETS = [
  'WDBOS',
];

export const STAFF_PRESETS = [
  'Andi Saputra',
  'Siti Rahma',
  'Budi Santoso',
  'Hendra Wijaya',
  'Dewi Lestari',
  'Rian Hidayat',
  'Mega Utami',
];

