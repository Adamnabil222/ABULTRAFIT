import React, { useState, useMemo } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Transaction, TimeRangePreset, TransactionType, TransactionStatus } from '../../types';
import { formatCurrency, formatDateArabic, getPresetDateRange, exportToCsv } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { EditTransactionModal } from './EditTransactionModal';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface TransactionsLedgerProps {
  onOpenRevenue: () => void;
  onOpenExpense: () => void;
}

export const TransactionsLedger: React.FC<TransactionsLedgerProps> = ({
  onOpenRevenue,
  onOpenExpense,
}) => {
  const { transactions, deleteTransaction, accounts } = useAccounting();

  // Filter States
  const [preset, setPreset] = useState<TimeRangePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Handle Preset change
  const handlePresetChange = (newPreset: TimeRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const range = getPresetDateRange(newPreset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  // Distinct categories available in current transactions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Date Range
      if (preset !== 'all' && startDate && endDate) {
        if (tx.date < startDate || tx.date > endDate) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesParty = tx.partyName?.toLowerCase().includes(query) || false;
        const matchesCategory = tx.category?.toLowerCase().includes(query) || false;
        const matchesNotes = tx.notes?.toLowerCase().includes(query) || false;
        const matchesAmount = String(tx.amount).includes(query);

        if (!matchesTitle && !matchesParty && !matchesCategory && !matchesNotes && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, preset, startDate, endDate, typeFilter, categoryFilter, statusFilter, searchQuery]);

  // Filtered Financial Totals
  const filteredTotals = useMemo(() => {
    let revenue = 0;
    let expense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'revenue') revenue += t.amount || 0;
      if (t.type === 'expense') expense += t.amount || 0;
    });

    return {
      revenue,
      expense,
      profit: revenue - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'التاريخ',
      'نوع العملية',
      'البيان والوصف',
      'التصنيف',
      'الطرف (عميل/مورد)',
      'المبلغ الإجمالي (ج.م)',
      'المسدد/المحصل فعلياً',
      'المتبقي',
      'حالة السداد',
      'طريقة الدفع',
      'حساب الخزينة',
      'ملاحظات',
    ];

    const rows = filteredTransactions.map((t) => {
      const typeLabel =
        t.type === 'revenue'
          ? 'إيراد'
          : t.type === 'expense'
          ? 'مصروف'
          : t.type === 'transfer'
          ? 'تحويل داخلي'
          : 'سداد دفعة';

      const statusLabel =
        t.status === 'completed'
          ? 'مدفوع بالكامل'
          : t.status === 'partial'
          ? 'مدفوع جزئياً'
          : 'آجل / لم يدفع';

      const acc = accounts.find((a) => a.id === t.accountId);

      return [
        t.date,
        typeLabel,
        t.title,
        t.category || '',
        t.partyName || '-',
        t.amount,
        t.paidAmount,
        t.remainingAmount,
        statusLabel,
        t.paymentMethod,
        acc?.name || '',
        t.notes || '',
      ];
    });

    exportToCsv(`سجل_العمليات_ABULTRAFIT_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleDeleteConfirm = async () => {
    if (deletingTxId) {
      await deleteTransaction(deletingTxId);
      setDeletingTxId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">سجل العمليات المالي</h1>
          <p className="text-xs text-slate-500 mt-1">
            كشف كامل وشامل لجميع الإيرادات والمصروفات والتحويلات مع إمكانية التصفية والتعديل
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel / CSV</span>
          </button>
          <button
            onClick={onOpenRevenue}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إيراد</span>
          </button>
          <button
            onClick={onOpenExpense}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            <span>+ مصروف</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        {/* Preset Time Buttons */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 ml-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>الفترة الزمنية:</span>
          </span>
          {[
            { id: 'all', label: 'كل الوقت' },
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'last_month', label: 'الشهر السابق' },
            { id: 'year', label: 'هذه السنة' },
            { id: 'custom', label: 'فترة مخصصة' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePresetChange(item.id as TimeRangePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === item.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs if 'custom' is active */}
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-2xl animate-fade-in text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">من تاريخ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">إلى تاريخ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
          </div>
        )}

        {/* Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في البيان، العميل، المورد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="all">كل أنواع العمليات</option>
              <option value="revenue">إيرادات فقط</option>
              <option value="expense">مصروفات فقط</option>
              <option value="transfer">تحويلات بين الحسابات</option>
              <option value="debt_payment">سداد ديون ومستحقات</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="all">كل التصنيفات</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="all">كل حالات التحصيل والسداد</option>
              <option value="completed">مدفوع بالكامل</option>
              <option value="partial">مدفوع جزئياً</option>
              <option value="pending">آجل / لم يدفع بعد</option>
            </select>
          </div>
        </div>

        {/* Live Filter Totals Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">عدد العمليات:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                {filteredTotals.count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">إيرادات الفترة:</span>
              <span className="font-extrabold text-emerald-600">
                {formatCurrency(filteredTotals.revenue)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">مصروفات الفترة:</span>
              <span className="font-extrabold text-rose-600">
                {formatCurrency(filteredTotals.expense)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">صافي أرباح الفترة:</span>
              <span
                className={`font-black ${
                  filteredTotals.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(filteredTotals.profit)}
              </span>
            </div>
          </div>

          {(typeFilter !== 'all' ||
            categoryFilter !== 'all' ||
            statusFilter !== 'all' ||
            searchQuery.trim() ||
            preset !== 'all') && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                handlePresetChange('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">لا توجد عمليات مطابقة للفلاتر</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              جرّب تغيير التاريخ أو تفريغ خيارات البحث لإظهار النتائج.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="py-3.5 pr-4">التاريخ</th>
                  <th className="py-3.5">النوع</th>
                  <th className="py-3.5">البيان / الوصف</th>
                  <th className="py-3.5">التصنيف</th>
                  <th className="py-3.5">الطرف المعني</th>
                  <th className="py-3.5">المبلغ الإجمالي</th>
                  <th className="py-3.5">المحصل / المدفوع</th>
                  <th className="py-3.5">الحالة</th>
                  <th className="py-3.5">طريقة الدفع</th>
                  <th className="py-3.5 pl-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isRevenue = tx.type === 'revenue';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 pr-4 font-medium text-slate-500 whitespace-nowrap">
                        {formatDateArabic(tx.date)}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            isRevenue
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpense
                              ? 'bg-rose-100 text-rose-800'
                              : isTransfer
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isRevenue
                            ? 'إيراد'
                            : isExpense
                            ? 'مصروف'
                            : isTransfer
                            ? 'تحويل داخلي'
                            : 'سداد دفعة'}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-800 max-w-xs">
                        <div className="truncate">{tx.title}</div>
                        {tx.notes && (
                          <div className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600 whitespace-nowrap">
                        {tx.category || '-'}
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                        {tx.partyName || '-'}
                      </td>
                      <td className="py-3.5 whitespace-nowrap font-black">
                        <span
                          className={
                            isRevenue
                              ? 'text-emerald-600'
                              : isExpense
                              ? 'text-rose-600'
                              : 'text-slate-800'
                          }
                        >
                          {isRevenue ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 whitespace-nowrap font-semibold text-slate-600">
                        {formatCurrency(tx.paidAmount)}
                        {tx.remainingAmount > 0 && (
                          <span className="text-[10px] text-amber-600 block">
                            (متبقي: {formatCurrency(tx.remainingAmount)})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tx.status === 'completed'
                            ? 'مدفوع بالكامل'
                            : tx.status === 'partial'
                            ? 'مدفوع جزئياً'
                            : 'آجل / لم يدفع'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod === 'cash'
                          ? 'نقدي'
                          : tx.paymentMethod === 'bank'
                          ? 'تحويل بنكي'
                          : tx.paymentMethod === 'wallet'
                          ? 'محفظة إلكترونية'
                          : 'أخرى'}
                      </td>
                      <td className="py-3.5 pl-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => setEditingTx(tx)}
                            title="تعديل العملية"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTxId(tx.id)}
                            title="حذف العملية"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          isOpen={!!editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingTxId}
        title="تأكيد حذف العملية"
        message="هل أنت متأكد من رغبتك في حذف هذه العملية بشكل نهائي؟ سيتم إلغاء تأثيرها وتحديث رصيد الخزينة والتقارير تلقائياً."
        confirmLabel="نعم، احذف العملية"
        cancelLabel="تراجع"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTxId(null)}
        isDestructive={true}
      />
    </div>
  );
};
