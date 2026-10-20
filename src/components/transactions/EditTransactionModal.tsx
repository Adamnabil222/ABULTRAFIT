import React, { useState } from 'react';
import { Transaction, PaymentMethod, TransactionStatus, REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from '../../types';
import { useAccounting } from '../../context/AccountingContext';
import { X, Save, AlertCircle } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { updateTransaction, accounts } = useAccounting();

  const [date, setDate] = useState(transaction.date);
  const [title, setTitle] = useState(transaction.title);
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState<string>(String(transaction.amount));
  const [paidAmount, setPaidAmount] = useState<string>(String(transaction.paidAmount));
  const [status, setStatus] = useState<TransactionStatus>(transaction.status);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod);
  const [accountId, setAccountId] = useState<string>(transaction.accountId);
  const [partyName, setPartyName] = useState(transaction.partyName || '');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isRevenue = transaction.type === 'revenue';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  const numAmount = parseFloat(amount) || 0;
  const numPaid = parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, numAmount - numPaid);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('يرجى إدخال البيان');
      return;
    }

    if (numAmount <= 0) {
      setError('يرجى إدخال مبلغ أكبر من الصفر');
      return;
    }

    setLoading(true);

    try {
      await updateTransaction(transaction.id, {
        date,
        title: title.trim(),
        category,
        amount: numAmount,
        paidAmount: numPaid,
        remainingAmount: remaining,
        status,
        paymentMethod,
        accountId,
        partyName: partyName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل العملية');
    } finally {
      setLoading(false);
    }
  };

  const categories = isRevenue ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">تعديل بيانات العملية</h3>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                isRevenue
                  ? 'bg-emerald-100 text-emerald-800'
                  : isExpense
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isRevenue ? 'إيراد' : isExpense ? 'مصروف' : 'تحويل'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
            {!isTransfer && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البيان / الوصف</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            />
          </div>

          {!isTransfer && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isRevenue ? 'اسم العميل' : 'اسم المورد'}
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإجمالي (ج.م)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-black text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المدفوع / المحصل فعلياً
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  const p = parseFloat(e.target.value) || 0;
                  if (p >= numAmount) setStatus('completed');
                  else if (p === 0) setStatus('pending');
                  else setStatus('partial');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="cash">نقدي</option>
                <option value="bank">تحويل بنكي</option>
                <option value="wallet">محفظة إلكترونية</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حساب الخزينة</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
