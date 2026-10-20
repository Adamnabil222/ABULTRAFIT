import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency, formatDateArabic, getPresetDateRange, exportToCsv } from '../../utils/formatters';
import { TimeRangePreset } from '../../types';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { transactions, parties, accounts, totalTreasuryBalance } = useAccounting();

  const [reportType, setReportType] = useState<
    'revenue' | 'expense' | 'profitLoss' | 'partyStatement' | 'treasury'
  >('profitLoss');

  const [preset, setPreset] = useState<TimeRangePreset>('month');
  const [startDate, setStartDate] = useState(() => getPresetDateRange('month').startDate);
  const [endDate, setEndDate] = useState(() => getPresetDateRange('month').endDate);

  const [selectedPartyId, setSelectedPartyId] = useState<string>('');

  const handlePresetChange = (p: TimeRangePreset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getPresetDateRange(p);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Filtered transactions for the report
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      if (preset !== 'all') {
        if (!t.date || t.date < startDate || t.date > endDate) return false;
      }
      if (reportType === 'revenue' && t.type !== 'revenue') return false;
      if (reportType === 'expense' && t.type !== 'expense') return false;
      if (reportType === 'partyStatement') {
        if (!selectedPartyId) return true;
        const p = parties.find((item) => item.id === selectedPartyId);
        return t.partyId === selectedPartyId || (p && t.partyName === p.name);
      }
      return true;
    });
  }, [transactions, preset, startDate, endDate, reportType, selectedPartyId, parties]);

  // Aggregates for current report
  const reportTotals = useMemo(() => {
    let rev = 0;
    let exp = 0;
    let collected = 0;
    let paid = 0;

    filteredTxs.forEach((t) => {
      if (t.type === 'revenue') {
        rev += t.amount || 0;
        collected += t.paidAmount || 0;
      } else if (t.type === 'expense') {
        exp += t.amount || 0;
        paid += t.paidAmount || 0;
      } else if (t.type === 'debt_payment') {
        if (t.partyType === 'customer') collected += t.paidAmount || 0;
        if (t.partyType === 'supplier') paid += t.paidAmount || 0;
      }
    });

    return {
      revenue: rev,
      expense: exp,
      profit: rev - exp,
      collected,
      paid,
      count: filteredTxs.length,
    };
  }, [filteredTxs]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    let title = 'تقرير_مالي';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'revenue') {
      title = 'تقرير_الإيرادات_المفصل';
      headers = ['التاريخ', 'العميل', 'بيان الإيراد', 'التصنيف', 'المبلغ بالجنيه', 'المحصل', 'المتبقي', 'الحالة', 'طريقة الدفع'];
      rows = filteredTxs.map((t) => [
        t.date,
        t.partyName || '-',
        t.title,
        t.category || '',
        t.amount,
        t.paidAmount,
        t.remainingAmount,
        t.status === 'completed' ? 'محصل بالكامل' : t.status === 'partial' ? 'محصل جزئياً' : 'غير محصل',
        t.paymentMethod,
      ]);
    } else if (reportType === 'expense') {
      title = 'تقرير_المصروفات_المفصل';
      headers = ['التاريخ', 'المورد', 'بيان المصروف', 'التصنيف', 'المبلغ بالجنيه', 'المدفوع', 'المتبقي', 'طريقة الدفع'];
      rows = filteredTxs.map((t) => [
        t.date,
        t.partyName || '-',
        t.title,
        t.category || '',
        t.amount,
        t.paidAmount,
        t.remainingAmount,
        t.paymentMethod,
      ]);
    } else if (reportType === 'profitLoss') {
      title = 'تقرير_الأرباح_والخسائر';
      headers = ['البند', 'القيمة بالجنيه'];
      rows = [
        ['إجمالي الإيرادات', reportTotals.revenue],
        ['إجمالي المصروفات', reportTotals.expense],
        ['صافي الربح / الخسارة', reportTotals.profit],
        ['إجمالي المقبوضات النقدية المحصلة', reportTotals.collected],
        ['إجمالي المدفوعات النقدية المصروفة', reportTotals.paid],
        ['رصيد الخزينة الحالي الإجمالي', totalTreasuryBalance],
      ];
    } else {
      title = 'تقرير_الحسابات';
      headers = ['التاريخ', 'النوع', 'البيان', 'الطرف', 'المبلغ', 'المسدد'];
      rows = filteredTxs.map((t) => [
        t.date,
        t.type,
        t.title,
        t.partyName || '-',
        t.amount,
        t.paidAmount,
      ]);
    }

    exportToCsv(`${title}_${startDate}_إلى_${endDate}`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">التقارير والتصدير والطباعة</h1>
          <p className="text-xs text-slate-500 mt-1">
            استخراج وتصدير تقارير الإيرادات والمصروفات والأرباح وكشوف الحسابات للطباعة أو الحفظ بصيغة PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel / CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* Report Controls (Hidden in print) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 print:hidden">
        {/* Report Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'profitLoss', label: 'الأرباح والخسائر' },
            { id: 'revenue', label: 'تقرير الإيرادات' },
            { id: 'expense', label: 'تقرير المصروفات' },
            { id: 'partyStatement', label: 'كشف حساب طرف' },
            { id: 'treasury', label: 'حركة الخزينة والسيولة' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id as any)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                reportType === r.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>فترة التقرير:</span>
            </span>
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'الأسبوع' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'last_month', label: 'الشهر السابق' },
              { id: 'year', label: 'السنة' },
              { id: 'all', label: 'الكل' },
              { id: 'custom', label: 'مخصص' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as TimeRangePreset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  preset === p.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-xs font-bold">
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

          {reportType === 'partyStatement' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">اختر العميل/المورد:</span>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="">كافة العملاء والموردين</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type === 'customer' ? 'عميل' : 'مورد'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* The Printable Report Container (Styled for Screen & High-Res A4 Print) */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Formal Report Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                A
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">ABULTRAFIT</span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">برنامج المحاسبة وإدارة الأعمال المالية</p>
          </div>

          <div className="text-left text-xs space-y-1">
            <div className="font-extrabold text-slate-800 text-sm">
              {reportType === 'revenue'
                ? 'تقرير الإيرادات والمبيعات'
                : reportType === 'expense'
                ? 'تقرير المصروفات والتكاليف'
                : reportType === 'profitLoss'
                ? 'تقرير الأرباح والخسائر'
                : reportType === 'partyStatement'
                ? 'كشف حساب تفصيلي'
                : 'تقرير حركة الخزينة'}
            </div>
            <div className="text-slate-500 font-medium">
              الفترة: من {formatDateArabic(startDate)} إلى {formatDateArabic(endDate)}
            </div>
            <div className="text-slate-400">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        {/* Report Overview Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-center">
          <div>
            <span className="text-[11px] text-slate-500 block font-bold mb-1">إجمالي الإيرادات</span>
            <span className="text-base font-black text-emerald-600">
              {formatCurrency(reportTotals.revenue)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block font-bold mb-1">إجمالي المصروفات</span>
            <span className="text-base font-black text-rose-600">
              {formatCurrency(reportTotals.expense)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block font-bold mb-1">صافي الربح / الخسارة</span>
            <span
              className={`text-base font-black ${
                reportTotals.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(reportTotals.profit)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block font-bold mb-1">إجمالي المقبوض الفعلي</span>
            <span className="text-base font-black text-slate-800">
              {formatCurrency(reportTotals.collected)}
            </span>
          </div>
        </div>

        {/* Detailed Transactions in Report */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-black border-y border-slate-300">
                <th className="py-2.5 pr-3">التاريخ</th>
                <th className="py-2.5">النوع</th>
                <th className="py-2.5">البيان / الوصف</th>
                <th className="py-2.5">التصنيف</th>
                <th className="py-2.5">الطرف</th>
                <th className="py-2.5">المبلغ الإجمالي</th>
                <th className="py-2.5">المحصل / المدفوع</th>
                <th className="py-2.5 pl-3">المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTxs.map((t) => {
                const isRev = t.type === 'revenue';
                const isExp = t.type === 'expense';
                return (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3 text-slate-600 whitespace-nowrap">
                      {formatDateArabic(t.date)}
                    </td>
                    <td className="py-2.5 font-bold whitespace-nowrap">
                      {isRev ? 'إيراد' : isExp ? 'مصروف' : 'تحويل'}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800">{t.title}</td>
                    <td className="py-2.5 text-slate-600">{t.category || '-'}</td>
                    <td className="py-2.5 text-slate-600">{t.partyName || '-'}</td>
                    <td className="py-2.5 font-black whitespace-nowrap">
                      <span className={isRev ? 'text-emerald-600' : isExp ? 'text-rose-600' : ''}>
                        {formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-700 whitespace-nowrap">
                      {formatCurrency(t.paidAmount)}
                    </td>
                    <td className="py-2.5 pl-3 font-bold text-amber-700 whitespace-nowrap">
                      {t.remainingAmount > 0 ? formatCurrency(t.remainingAmount) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Report Footer / Signature Line */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>تم استخراج هذا التقرير آلياً بواسطة نظام ABULTRAFIT</span>
          </div>
          <div className="text-left font-bold text-slate-700">
            توقيع المحاسب / المدير المالي: ............................
          </div>
        </div>
      </div>
    </div>
  );
};
