import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PeriodeIndex, PERIOD_MONTHS } from '../types';

interface PeriodSelectorProps {
  selectedYear: number;
  selectedPeriod: PeriodeIndex;
  onYearChange: (year: number) => void;
  onPeriodChange: (period: PeriodeIndex) => void;
  totalInSelectedPeriod: number;
}

export default function PeriodSelector({
  selectedYear,
  selectedPeriod,
  onYearChange,
  onPeriodChange,
  totalInSelectedPeriod,
}: PeriodSelectorProps) {
  // Generate a list of years (e.g. current year - 3 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  const handlePrevPeriod = () => {
    if (selectedPeriod === 1) {
      onPeriodChange(4);
      onYearChange(selectedYear - 1);
    } else {
      onPeriodChange((selectedPeriod - 1) as PeriodeIndex);
    }
  };

  const handleNextPeriod = () => {
    if (selectedPeriod === 4) {
      onPeriodChange(1);
      onYearChange(selectedYear + 1);
    } else {
      onPeriodChange((selectedPeriod + 1) as PeriodeIndex);
    }
  };

  return (
    <div id="period-selector-container" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Year & Navigation */}
        <div className="flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-2 rounded-lg">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tahun & Navigasi</div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                id="select-year"
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="text-sm font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-md px-2 py-1 outline-none focus:border-rose-500 transition-colors"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {y}
                  </option>
                ))}
              </select>
              
              <div className="flex items-center gap-1 ml-1">
                <button
                  id="btn-prev-period"
                  onClick={handlePrevPeriod}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors"
                  title="Periode Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  id="btn-next-period"
                  onClick={handleNextPeriod}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors"
                  title="Periode Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Period Tabs */}
        <div className="flex-1 max-w-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-950 p-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
            {([1, 2, 3, 4] as PeriodeIndex[]).map((p) => {
              const active = selectedPeriod === p;
              return (
                <button
                  key={p}
                  id={`btn-period-tab-${p}`}
                  onClick={() => onPeriodChange(p)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-md transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 font-bold shadow-xs border border-rose-100 dark:border-rose-950/60'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 font-medium'
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider">Periode {p}</span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {p === 1 ? 'Jan - Mar' : p === 2 ? 'Apr - Jun' : p === 3 ? 'Jul - Sep' : 'Okt - Des'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rightmost: Total Indicator */}
        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Banding</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{totalInSelectedPeriod} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">Kasus</span></div>
        </div>
      </div>
    </div>
  );
}
