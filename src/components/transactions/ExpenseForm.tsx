import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { EXPENSE_CATEGORIES, PaymentMethod, TransactionStatus } from '../../types';
import { MinusCircle, CheckCircle2, Truck, DollarSign, Calendar, Tag, CreditCard, FileText } from 'lucide-react';

interface ExpenseFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, isModal = false }) => {
  const { addTransaction, addParty, parties, accounts } = useAccounting();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<TransactionStatus>('completed');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const suppliers = parties.filter((p) => p.type === 'supplier');

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (paymentStatus === 'completed') {
      setPaidAmount(val);
    } else if (paymentStatus === 'pending') {
      setPaidAmount('0');
    }
  };

  const handleStatusChange = (status: TransactionStatus) => {
    setPaymentStatus(status);
    if (status === 'completed') {
      setPaidAmount(amount);
    } else if (status === 'pending') {
      setPaidAmount('0');
    } else if (status === 'partial') {
      if (!paidAmount || Number(paidAmount) >= Number(amount)) {
        setPaidAmount(String(Math.round((Number(amount) || 0) / 2)));
      }
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const numPaid =
    paymentStatus === 'completed'
      ? numAmount
      : paymentStatus === 'pending'
      ? 0
      : parseFloat(paidAmount) || 0;
  const remaining = Math.max(0, numAmount - numPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('يرجى إدخال اسم أو بيان المصروف');
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (paymentStatus === 'partial' && (numPaid <= 0 || numPaid >= numAmount)) {
      setErrorMessage('في حالة الدفع الجزئي، يجب أن يكون المبلغ المدفوع أكبر من صفر وأقل من الإجمالي');
      return;
    }

    setLoading(true);

    try {
      let finalSupplierId = selectedSupplierId;
      let finalSupplierName = '';

      if (isAddingNewSupplier && newSupplierName.trim()) {
        finalSupplierId = await addParty({
          name: newSupplierName.trim(),
          type: 'supplier',
          phone: supplierPhone.trim() || undefined,
        });
        finalSupplierName = newSupplierName.trim();
      } else if (selectedSupplierId) {
        const found = suppliers.find((s) => s.id === selectedSupplierId);
        finalSupplierName = found?.name || '';
      }

      await addTransaction({
        type: 'expense',
        date,
        title: title.trim(),
        category,
        amount: numAmount,
        paidAmount: numPaid,
        remainingAmount: remaining,
        paymentMethod,
        accountId: accountId || accounts[0]?.id || 'acc_1',
        status: paymentStatus,
        partyType: finalSupplierName ? 'supplier' : 'none',
        partyId: finalSupplierId || undefined,
        partyName: finalSupplierName || undefined,
        partyPhone: supplierPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage('تم تسجيل المصروف وخصم المبلغ من الخزينة بنجاح!');
      setTitle('');
      setAmount('');
      setPaidAmount('');
      setNotes('');
      setNewSupplierName('');
      setSupplierPhone('');
      setIsAddingNewSupplier(false);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ المصروف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white ${isModal ? 'p-0' : 'p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm'} max-w-3xl mx-auto`}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <MinusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800">تسجيل مصروف جديد</h2>
          <p className="text-xs text-slate-500">سجل مدفوعاتك، الإيجارات، الرواتب ومشتريات الخامات بدقة</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Date & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>التاريخ</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>اسم المصروف / البيان *</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: فاتورة كهرباء، شراء خامات، راتب موظف، إيجار..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-medium"
            />
          </div>
        </div>

        {/* Row 2: Category & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>تصنيف المصروف *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-medium"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-rose-600" />
              <span>المبلغ بالجنيه المصري (EGP) *</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Supplier Selection (Optional) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-500" />
              <span>اسم المورد (إن وجد)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNewSupplier(!isAddingNewSupplier)}
              className="text-xs text-rose-700 hover:text-rose-800 font-bold hover:underline cursor-pointer"
            >
              {isAddingNewSupplier ? 'اختيار من قائمة الموردين' : '+ مورد جديد'}
            </button>
          </div>

          {!isAddingNewSupplier ? (
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-medium text-slate-700"
            >
              <option value="">بدون تحديد مورد (مصروف عام)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="اسم المورد أو الشركة الموردة"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
              />
              <input
                type="tel"
                placeholder="رقم الهاتف (اختياري)"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          )}
        </div>

        {/* Row 4: Payment Status (Fully paid, partially, unpaid) */}
        <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
          <label className="block text-xs font-bold text-slate-700 mb-2.5">حالة سداد الفاتورة</label>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <button
              type="button"
              onClick={() => handleStatusChange('completed')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentStatus === 'completed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              مدفوع بالكامل
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('partial')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentStatus === 'partial'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              مدفوع جزئياً
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('pending')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                paymentStatus === 'pending'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              آجل (لم يسدد بعد)
            </button>
          </div>

          {paymentStatus === 'partial' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-rose-100/80 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  المبلغ المدفوع فعلياً الآن (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  max={amount}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-rose-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  المتبقي للمورد (مستحق عليك)
                </label>
                <div className="w-full px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-sm font-black text-purple-700">
                  {remaining.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'pending' && (
            <div className="text-xs font-bold text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
              سيتم تسجيل كامل المبلغ ({numAmount.toLocaleString('ar-EG')} ج.م) كالتزام مالي مستحق عليك للمورد.
            </div>
          )}
        </div>

        {/* Row 5: Payment method & Disbursing Treasury (Only if paid > 0) */}
        {numPaid > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>طريقة الدفع</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-medium"
              >
                <option value="cash">نقدي (كاش من الخزينة)</option>
                <option value="bank">تحويل بنكي</option>
                <option value="wallet">محفظة إلكترونية (فودافون كاش / انستاباي)</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                خصم المبلغ من حساب الخزينة
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Row 6: Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات إضافية</label>
          <textarea
            rows={2}
            placeholder="ملاحظات حول سبب الصرف، رقم الإيصال أو الشيك..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-base shadow-lg shadow-rose-600/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <MinusCircle className="w-5 h-5" />
            <span>{loading ? 'جاري الحفظ...' : 'إضافة مصروف'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
