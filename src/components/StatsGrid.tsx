import React from 'react';
import { Clock, CheckCircle2, AlertOctagon, FileSpreadsheet, StickyNote } from 'lucide-react';
import { BandingItem } from '../types';

interface StatsGridProps {
  items: BandingItem[];
}

export default function StatsGrid({ items }: StatsGridProps) {
  const total = items.length;
  const pending = items.filter((item) => item.keterangan === 'PENDING').length;
  const done = items.filter((item) => item.keterangan === 'DONE').length;
  const rejected = items.filter((item) => item.keterangan === 'BANDING DI TOLAK').length;
  const notes = items.filter((item) => item.keterangan === 'NOTE').length;

  const cards = [
    {
      label: 'TOTAL BANDING',
      value: total,
      icon: FileSpreadsheet,
      color: 'text-gray-700 dark:text-gray-200',
      bg: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800',
      iconColor: 'text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-800',
    },
    {
      label: 'PENDING',
      value: pending,
      icon: Clock,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50/60 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30',
      iconColor: 'text-amber-600 bg-amber-100/80 dark:text-amber-400 dark:bg-amber-900/40',
    },
    {
      label: 'DONE',
      value: done,
      icon: CheckCircle2,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50/60 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30',
      iconColor: 'text-emerald-600 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-900/40',
    },
    {
      label: 'BANDING DI TOLAK',
      value: rejected,
      icon: AlertOctagon,
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50/60 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30',
      iconColor: 'text-rose-600 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-900/40',
    },
    {
      label: 'NOTE / CATATAN',
      value: notes,
      icon: StickyNote,
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50/60 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30',
      iconColor: 'text-blue-600 bg-blue-100/80 dark:text-blue-400 dark:bg-blue-900/40',
    },
  ];

  return (
    <div id="stats-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            id={`stat-card-${idx}`}
            className={`flex items-center gap-3 p-4 rounded-xl border ${card.bg} transition-all duration-200 hover:shadow-xs`}
          >
            <div className={`p-2 rounded-lg ${card.iconColor} shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{card.label}</p>
              <p className={`text-xl sm:text-2xl font-black mt-0.5 ${card.color}`}>{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
