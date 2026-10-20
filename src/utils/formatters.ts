import { TimeRangePreset } from '../types';

export const formatCurrency = (amount: number, showSign = false): string => {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absVal);

  if (showSign) {
    if (isNegative) return `-${formatted} ج.م`;
    if (amount > 0) return `+${formatted} ج.م`;
    return `${formatted} ج.م`;
  }

  return isNegative ? `-${formatted} ج.م` : `${formatted} ج.م`;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
};

export const formatDateArabic = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat('ar-EG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const getPresetDateRange = (preset: TimeRangePreset): { startDate: string; endDate: string } => {
  const now = new Date();
  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(now);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };

    case 'week': {
      // Start of week (Saturday in Egypt/Arab world or 6 days ago)
      const start = new Date(now);
      const day = start.getDay(); // 0 is Sunday, 6 is Saturday
      const diff = (day + 1) % 7; // days since Saturday
      start.setDate(start.getDate() - diff);
      return { startDate: formatYMD(start), endDate: todayStr };
    }

    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatYMD(start), endDate: todayStr };
    }

    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }

    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatYMD(start), endDate: todayStr };
    }

    case 'all':
    default:
      return { startDate: '2020-01-01', endDate: todayStr };
  }
};

export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  // Add UTF-8 BOM so Excel opens Arabic correctly
  let csvContent = '\uFEFF';
  csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

  rows.forEach((row) => {
    const formattedRow = row.map((cell) => {
      const str = cell === null || cell === undefined ? '' : String(cell);
      return `"${str.replace(/"/g, '""')}"`;
    });
    csvContent += formattedRow.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
