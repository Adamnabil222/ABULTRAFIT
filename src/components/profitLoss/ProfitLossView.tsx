import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { TimeRangePreset } from '../../types';
import { formatCurrency, formatNumber, getPresetDateRange, exportToCsv } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Calendar,
  Download,
  Info,
  CheckCircle,
  AlertOctagon,
  Percent,
} from 'lucide-react';

export const ProfitLossView: React.FC = () => {
  const { transactions, totalTreasuryBalance } = useAccounting();

  const [preset, setPreset] = useState<TimeRangePreset>('month');
  const [startDate, setStartDate] = useState<string>(() => getPresetDateRange('month').startDate);
  const [endDate, setEndDate] = useState<string>(() => getPresetDateRange('month').endDate);

  const handlePreset = (p: TimeRangePreset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getPresetDateRange(p);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Filter transactions in chosen period
  const periodTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (preset === 'all') return true;
      if (!t.date) return false;
      return t.date >= startDate && t.date <= endDate;
    });
  }, [transactions, preset, startDate, endDate]);

  // Revenues grouped by category
  const revenueByCategory = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;
    periodTxs
      .filter((t) => t.type === 'revenue')
      .forEach((t) => {
        const cat = t.category || 'إيرادات عامة';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
        total += t.amount || 0;
      });

    const items = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }));
    items.sort((a, b) => b.amount - a.amount);
    return { items, total };
  }, [periodTxs]);

  // Expenses grouped by category
  const expenseByCategory = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;
    periodTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'مصروفات عامة';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
        total += t.amount || 0;
      });

    const items = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }));
    items.sort((a, b) => b.amount - a.amount);
    return { items, total };
  }, [periodTxs]);

  // Recognized Accounting Profit (Accrual basis)
  const recognizedRevenue = revenueByCategory.total;
  const recognizedExpense = expenseByCategory.total;
  const netProfit = recognizedRevenue - recognizedExpense;
  const isProfitable = netProfit >= 0;

  // Actual Cash Flow in this period (Cash basis)
  const actualCashInflow = useMemo(() => {
    return periodTxs.reduce((sum, t) => {
      if (t.type === 'revenue') return sum + (t.paidAmount || 0);
      if (t.type === 'debt_payment' && t.partyType === 'customer') return sum + (t.paidAmount || 0);
      return sum;
    }, 0);
  }, [periodTxs]);

  const actualCashOutflow = useMemo(() => {
    return periodTxs.reduce((sum, t) => {
      if (t.type === 'expense') return sum + (t.paidAmount || 0);
      if (t.type === 'debt_payment' && t.partyType === 'supplier') return sum + (t.paidAmount || 0);
      return sum;
    }, 0);
  }, [periodTxs]);

  const netCashFlow = actualCashInflow - actualCashOutflow;

  const profitMargin =
    recognizedRevenue > 0 ? Math.round((netProfit / recognizedRevenue) * 100) : 0;

  // Export P&L report
  const handleExport = () => {
    const headers = ['البند المحاسبي', 'التصنيف', 'القيمة بالجنيه المصري (EGP)'];
    const rows: (string | number)[][] = [
      ['--- الإيرادات التشغيلية ---', '', ''],
      ...revenueByCategory.items.map((i) => ['إيراد تشغيلي', i.name, i.amount]),
      ['إجمالي الإيرادات', '', recognizedRevenue],
      ['', '', ''],
      ['--- التكاليف والمصروفات التشغيلية ---', '', ''],
      ...expenseByCategory.items.map((i) => ['مصروف تشغيلي', i.name, i.amount]),
      ['إجمالي المصروفات', '', recognizedExpense],
      ['', '', ''],
      ['صافي الربح / الخسارة (المعترف به)', '', netProfit],
      ['هامش الربح التشغيلي', '', `${profitMargin}%`],
      ['صافي التدفق النقدي الفعلي للفترة', '', netCashFlow],
      ['رصيد الخزينة الحالي', '', totalTreasuryBalance],
    ];

    exportToCsv(`قائمة_الأرباح_والخسائر_${startDate}_إلى_${endDate}`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Range Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">قائمة الأرباح والخسائر</h1>
          <p className="text-xs text-slate-500 mt-1">
            تقرير مالي احترافي يوضح الإيرادات والمصروفات وصافي الربح المحاسبي ومقارنته بالتدفق النقدي
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>تصدير التقرير</span>
        </button>
      </div>

      {/* Period Selection Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>عرض التقرير:</span>
          </span>
          {[
            { id: 'today', label: 'يومي (اليوم)' },
            { id: 'week', label: 'أسبوعي (هذا الأسبوع)' },
            { id: 'month', label: 'شهري (هذا الشهر)' },
            { id: 'last_month', label: 'الشهر السابق' },
            { id: 'year', label: 'سنوي (هذه السنة)' },
            { id: 'all', label: 'كل الفترات' },
            { id: 'custom', label: 'فترة مخصصة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePreset(tab.id as TimeRangePreset)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-3 text-xs font-bold animate-fade-in">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200"
            />
            <span className="text-slate-400">إلى</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200"
            />
          </div>
        )}
      </div>

      {/* The Crucial Distinction Banner: Net Profit vs Treasury Balance */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-blue-900 flex items-start gap-3.5 text-xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm block">
            قاعدة محاسبية هامة: الفرق بين صافي الربح ورصيد الخزينة
          </span>
          <p className="leading-relaxed text-blue-800">
            <strong>صافي الربح:</strong> يعبر عن نتيجة أعمال المشروع الاقتصادية (الإيرادات المعترف بها ناقص التكاليف)،
            سواء تم استلام كامل المبلغ أم ما زال آجلاً.
            بينما <strong>رصيد الخزينة:</strong> هو السيولة النقدية المتوفرة فعلياً في يدك وفي حساباتك البنكية الآن.
          </p>
        </div>
      </div>

      {/* 3 Core Income Statement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي الإيرادات للفترة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(recognizedRevenue)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">
            المحصل فعلياً: {formatCurrency(actualCashInflow)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي المصروفات للفترة</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(recognizedExpense)}
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-2">
            المدفوع فعلياً: {formatCurrency(actualCashOutflow)}
          </div>
        </div>

        {/* Net Profit or Loss */}
        <div
          className={`p-6 rounded-3xl border shadow-xs relative overflow-hidden ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/90">صافي الربح / الخسارة للفترة</span>
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              {isProfitable ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-3xl font-black tracking-tight">{formatCurrency(netProfit)}</div>
          <div className="text-xs text-white/90 font-bold mt-2 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            <span>هامش الربح: {profitMargin}% من الإيراد</span>
          </div>
        </div>
      </div>

      {/* Structured Income Statement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenues Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="text-base font-bold text-slate-800">تفاصيل الإيرادات التشغيلية</h3>
            </div>
            <span className="text-sm font-black text-emerald-600">
              {formatCurrency(revenueByCategory.total)}
            </span>
          </div>

          {revenueByCategory.items.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد إيرادات مسجلة خلال هذه الفترة
            </div>
          ) : (
            <div className="space-y-3">
              {revenueByCategory.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-semibold">{formatNumber(item.pct)}%</span>
                    <span className="font-extrabold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <h3 className="text-base font-bold text-slate-800">تفاصيل المصروفات التشغيلية</h3>
            </div>
            <span className="text-sm font-black text-rose-600">
              {formatCurrency(expenseByCategory.total)}
            </span>
          </div>

          {expenseByCategory.items.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              لا توجد مصروفات مسجلة خلال هذه الفترة
            </div>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50">
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-semibold">{formatNumber(item.pct)}%</span>
                    <span className="font-extrabold text-slate-800">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cash Flow vs Treasury Comparison Box */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <span>مقارنة السيولة النقدية وحركة الخزينة لنفس الفترة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">المقبوضات النقدية الفعلية (تحصيل)</span>
            <span className="text-lg font-black text-emerald-600">{formatCurrency(actualCashInflow)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">المدفوعات النقدية الفعلية (صرف)</span>
            <span className="text-lg font-black text-rose-600">{formatCurrency(actualCashOutflow)}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-500 block mb-1">صافي التدفق النقدي للفترة</span>
            <span
              className={`text-lg font-black ${
                netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(netCashFlow)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
