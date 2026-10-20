import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { AccountType } from '../../types';
import { formatCurrency, formatDateArabic, exportToCsv } from '../../utils/formatters';
import {
  Wallet,
  Building2,
  Smartphone,
  ArrowRightLeft,
  PlusCircle,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface TreasuryManagementProps {
  isTransferModalOpen?: boolean;
  onCloseTransferModal?: () => void;
}

export const TreasuryManagement: React.FC<TreasuryManagementProps> = ({
  isTransferModalOpen = false,
  onCloseTransferModal,
}) => {
  const {
    accounts,
    addAccount,
    transferBetweenAccounts,
    getAccountBalance,
    totalTreasuryBalance,
    transactions,
  } = useAccounting();

  // Transfer modal
  const [showTransfer, setShowTransfer] = useState(isTransferModalOpen);
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [transferError, setTransferError] = useState('');

  // Add Account modal
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accInitial, setAccInitial] = useState('');
  const [accNotes, setAccNotes] = useState('');

  // Selected account for filtering ledger
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Handle Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    const numAmount = parseFloat(transferAmount) || 0;
    if (numAmount <= 0) {
      setTransferError('يرجى إدخال مبلغ تحويل صحيح');
      return;
    }

    if (fromAccountId === toAccountId) {
      setTransferError('لا يمكن التحويل من الحساب إلى نفسه، اختر حسابين مختلفين');
      return;
    }

    const senderBalance = getAccountBalance(fromAccountId);
    if (senderBalance < numAmount) {
      setTransferError(`رصيد الحساب المحول منه (${formatCurrency(senderBalance)}) غير كافٍ لإتمام التحويل`);
      return;
    }

    try {
      await transferBetweenAccounts(
        fromAccountId,
        toAccountId,
        numAmount,
        transferDate,
        transferNotes
      );

      setTransferSuccess('تم تنفيذ التحويل الداخلي بنجاح دون التأثير على قائمة الأرباح والخسائر.');
      setTransferAmount('');
      setTransferNotes('');
      setTimeout(() => {
        setTransferSuccess('');
        setShowTransfer(false);
        if (onCloseTransferModal) onCloseTransferModal();
      }, 1200);
    } catch (err: any) {
      setTransferError(err.message || 'حدث خطأ أثناء إجراء التحويل');
    }
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    await addAccount({
      name: accName.trim(),
      type: accType,
      initialBalance: parseFloat(accInitial) || 0,
      notes: accNotes.trim() || undefined,
    });

    setAccName('');
    setAccInitial('');
    setAccNotes('');
    setShowAddAccount(false);
  };

  // Movement transactions for the selected account
  const accountMovements = transactions.filter((t) => {
    if (selectedAccountId === 'all') {
      return true;
    }
    return t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
  });

  const exportTreasuryReport = () => {
    const headers = ['التاريخ', 'النوع', 'البيان', 'الحساب المعني', 'المبلغ المحصل / المودع', 'المبلغ المصروف', 'ملاحظات'];
    const rows = accountMovements.map((t) => {
      const isDeposit =
        t.type === 'revenue' ||
        (t.type === 'debt_payment' && t.partyType === 'customer') ||
        (t.type === 'transfer' && t.toAccountId === selectedAccountId);

      const acc = accounts.find((a) => a.id === t.accountId);

      return [
        t.date,
        t.type === 'transfer'
          ? 'تحويل داخلي'
          : t.type === 'revenue'
          ? 'إيداع إيراد'
          : t.type === 'expense'
          ? 'صرف مصروف'
          : 'سداد دفعة',
        t.title,
        acc?.name || '',
        isDeposit ? t.paidAmount : 0,
        !isDeposit ? t.paidAmount : 0,
        t.notes || '',
      ];
    });

    exportToCsv(`حركة_الخزينة_ABULTRAFIT_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">إدارة الخزينة والسيولة</h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة أرصدة الخزينة النقدية، الحسابات البنكية، والمحافظ والتحويلات الداخلية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransfer(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل بين الحسابات</span>
          </button>
          <button
            onClick={() => setShowAddAccount(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ إضافة حساب / خزينة</span>
          </button>
        </div>
      </div>

      {/* Total Treasury Liquidity Card */}
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-1">
            إجمالي رصيد السيولة النقدية والبنكية المتاحة الآن
          </span>
          <div className="text-3xl font-black tracking-tight text-white">
            {formatCurrency(totalTreasuryBalance)}
          </div>
          <p className="text-xs text-slate-300 mt-2">
            مجموع الأرصدة النقدية في الخزينة والبنك والمحافظ بعد خصم كافة المصروفات وإضافة كافة المقبوضات
          </p>
        </div>

        <button
          onClick={exportTreasuryReport}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/10 backdrop-blur-md self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>تصدير تقرير الخزينة</span>
        </button>
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const balance = getAccountBalance(acc.id);
          const isCash = acc.type === 'cash';
          const isBank = acc.type === 'bank';

          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? 'all' : acc.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                selectedAccountId === acc.id
                  ? 'bg-slate-50/90 border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-100 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      isCash
                        ? 'bg-emerald-50 text-emerald-600'
                        : isBank
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {isCash ? (
                      <Wallet className="w-5 h-5" />
                    ) : isBank ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800">{acc.name}</h3>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {isCash ? 'خزينة نقدية' : isBank ? 'حساب بنكي' : 'محفظة إلكترونية'}
                    </span>
                  </div>
                </div>

                {selectedAccountId === acc.id && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                    الحساب المختار
                  </span>
                )}
              </div>

              <div className="mt-2">
                <span className="text-xs text-slate-500 font-medium block mb-1">الرصيد الفعلي الحالي</span>
                <div
                  className={`text-2xl font-black tracking-tight ${
                    balance >= 0 ? 'text-slate-800' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(balance)}
                </div>
              </div>

              {acc.initialBalance > 0 && (
                <div className="text-[11px] text-slate-400 mt-2">
                  الرصيد الافتتاحي: {formatCurrency(acc.initialBalance)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Movement Log for Treasury */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                حركة الخزينة والتدفقات النقدية{' '}
                {selectedAccountId !== 'all' &&
                  `(${accounts.find((a) => a.id === selectedAccountId)?.name})`}
              </h3>
              <p className="text-xs text-slate-500">سجل عمليات القبض والصرف والتحويل</p>
            </div>
          </div>

          {selectedAccountId !== 'all' && (
            <button
              onClick={() => setSelectedAccountId('all')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold hover:underline"
            >
              عرض كافة الحسابات
            </button>
          )}
        </div>

        {accountMovements.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            لا توجد حركات مسجلة على هذا الحساب
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 pr-3">التاريخ</th>
                  <th className="py-3">النوع</th>
                  <th className="py-3">البيان</th>
                  <th className="py-3">الحساب المعني</th>
                  <th className="py-3">المبلغ المحصل/المودع</th>
                  <th className="py-3 pl-3">المبلغ المصروف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountMovements.slice(0, 15).map((t) => {
                  const isDeposit =
                    t.type === 'revenue' ||
                    (t.type === 'debt_payment' && t.partyType === 'customer') ||
                    (t.type === 'transfer' && t.toAccountId === selectedAccountId);

                  const isOutflow =
                    t.type === 'expense' ||
                    (t.type === 'debt_payment' && t.partyType === 'supplier') ||
                    (t.type === 'transfer' && t.accountId === selectedAccountId);

                  const acc = accounts.find((a) => a.id === t.accountId);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">
                        {formatDateArabic(t.date)}
                      </td>
                      <td className="py-3 whitespace-nowrap font-bold">
                        {t.type === 'transfer'
                          ? 'تحويل داخلي'
                          : t.type === 'revenue'
                          ? 'إيراد'
                          : t.type === 'expense'
                          ? 'مصروف'
                          : 'سداد'}
                      </td>
                      <td className="py-3 text-slate-800 font-semibold">{t.title}</td>
                      <td className="py-3 text-slate-500">{acc?.name || '-'}</td>
                      <td className="py-3 font-black text-emerald-600 whitespace-nowrap">
                        {isDeposit ? `+${formatCurrency(t.paidAmount)}` : '-'}
                      </td>
                      <td className="py-3 pl-3 font-black text-rose-600 whitespace-nowrap">
                        {isOutflow ? `-${formatCurrency(t.paidAmount)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-800">تحويل رصيد بين الحسابات</h3>
              </div>
              <button
                onClick={() => {
                  setShowTransfer(false);
                  if (onCloseTransferModal) onCloseTransferModal();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs mb-4 leading-relaxed font-semibold">
              التحويل الداخلي يغير توزيع الرصيد بين الخزائن والبنك فقط، ولا يؤثر إطلاقاً على صافي الربح أو الخسارة.
            </div>

            {transferSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            {transferError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التحويل من حساب (المرسل) *
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (الرصيد: {formatCurrency(getAccountBalance(a.id))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التحويل إلى حساب (المستقبل) *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ المحول (ج.م) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات التحويل</label>
                <input
                  type="text"
                  placeholder="مثال: توريد نقدي للبنك، سحب من الصراف..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransfer(false);
                    if (onCloseTransferModal) onCloseTransferModal();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  تنفيذ التحويل الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-black text-slate-800">إضافة حساب أو خزينة جديدة</h3>
              <button
                onClick={() => setShowAddAccount(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الحساب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حساب بنك مصر، فودافون كاش مبيعات..."
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحساب</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="cash">خزينة نقدية (كاش)</option>
                    <option value="bank">حساب بنكي</option>
                    <option value="wallet">محفظة إلكترونية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرصيد الافتتاحي (ج.م)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={accInitial}
                    onChange={(e) => setAccInitial(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  placeholder="رقم الحساب أو الفرع..."
                  value={accNotes}
                  onChange={(e) => setAccNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
