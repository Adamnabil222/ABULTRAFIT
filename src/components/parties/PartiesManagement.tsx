import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { Party, PaymentMethod } from '../../types';
import { formatCurrency, formatDateArabic, exportToCsv } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Users,
  Truck,
  PlusCircle,
  Phone,
  Search,
  FileText,
  DollarSign,
  Download,
  Trash2,
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const PartiesManagement: React.FC = () => {
  const {
    parties,
    addParty,
    deleteParty,
    getPartySummary,
    getPartyStatement,
    recordDebtSettlement,
    accounts,
  } = useAccounting();

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [searchQuery, setSearchQuery] = useState('');

  // Add party modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Statement modal
  const [viewingParty, setViewingParty] = useState<Party | null>(null);

  // Settlement modal
  const [settlingParty, setSettlingParty] = useState<Party | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [settlementAccount, setSettlementAccount] = useState<string>(accounts[0]?.id || '');
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('cash');
  const [settlementDate, setSettlementDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [settleSuccess, setSettleSuccess] = useState('');

  // Delete modal
  const [deletingPartyId, setDeletingPartyId] = useState<string | null>(null);

  const filteredParties = parties.filter((p) => {
    if (p.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone?.toLowerCase().includes(q) || false;
      return matchName || matchPhone;
    }
    return true;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addParty({
      name: name.trim(),
      type: activeTab,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setPhone('');
    setNotes('');
    setIsAddOpen(false);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingParty) return;
    const numAmount = parseFloat(settlementAmount) || 0;
    if (numAmount <= 0) return;

    await recordDebtSettlement(
      settlingParty.id,
      numAmount,
      settlementAccount,
      settlementMethod,
      settlementDate,
      settlementNotes
    );

    setSettleSuccess('تم تسجيل الدفعة وتحديث الرصيد بنجاح!');
    setTimeout(() => {
      setSettleSuccess('');
      setSettlingParty(null);
      setSettlementAmount('');
      setSettlementNotes('');
    }, 1200);
  };

  // Export statement for active viewed party
  const handleExportStatement = (party: Party) => {
    const statement = getPartyStatement(party.id);
    const headers = ['التاريخ', 'نوع العملية', 'البيان', 'المبلغ الإجمالي', 'المسدد', 'المتبقي', 'الحالة', 'ملاحظات'];
    const rows = statement.map((item) => [
      item.date,
      item.type === 'revenue'
        ? 'فاتورة إيراد'
        : item.type === 'expense'
        ? 'فاتورة شراء'
        : 'دفعة سداد',
      item.title,
      item.amount,
      item.paidAmount,
      item.remainingAmount,
      item.status === 'completed'
        ? 'مدفوع بالكامل'
        : item.status === 'partial'
        ? 'مدفوع جزئياً'
        : 'آجل',
      item.notes || '',
    ]);

    exportToCsv(`كشف_حساب_${party.name}_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">العملاء والموردين</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات وأرصدة العملاء والموردين ومتابعة الديون والمدفوعات الآجلة وكشوف الحسابات
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{activeTab === 'customer' ? '+ إضافة عميل جديد' : '+ إضافة مورد جديد'}</span>
        </button>
      </div>

      {/* Tabs Switcher: Customers vs Suppliers */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>سجل العملاء (مديونيات وحسابات)</span>
          </button>

          <button
            onClick={() => setActiveTab('supplier')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'supplier'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>سجل الموردين (التزامات ومستحقات)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`بحث في ${activeTab === 'customer' ? 'العملاء' : 'الموردين'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* Parties Grid */}
      {filteredParties.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700 mb-1">
            لا يوجد {activeTab === 'customer' ? 'عملاء' : 'موردين'} مسجلين حالياً
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            يمكنك تسجيل {activeTab === 'customer' ? 'عميل جديد' : 'مورد جديد'} أو ستتم إضافتهم تلقائياً عند تسجيل الفواتير.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            + إضافة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredParties.map((party) => {
            const summary = getPartySummary(party.id);
            const isCustomer = party.type === 'customer';
            const hasDebt = summary.remainingAmount > 0;

            return (
              <div
                key={party.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                          isCustomer
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {party.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-800 leading-tight">
                          {party.name}
                        </h3>
                        {party.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{party.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingPartyId(party.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Financial Stats for this Party */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl my-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">إجمالي التعاملات</span>
                      <span className="text-xs font-black text-slate-800">
                        {formatCurrency(summary.totalVolume)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">المسدد</span>
                      <span className="text-xs font-black text-emerald-600">
                        {formatCurrency(summary.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isCustomer ? 'متبقي عليه' : 'متبقي له'}
                      </span>
                      <span
                        className={`text-xs font-black ${
                          hasDebt ? (isCustomer ? 'text-amber-600' : 'text-rose-600') : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(summary.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setViewingParty(party)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>كشف حساب</span>
                  </button>

                  {hasDebt && (
                    <button
                      onClick={() => {
                        setSettlingParty(party);
                        setSettlementAmount(String(summary.remainingAmount));
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                        isCustomer
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{isCustomer ? 'تحصيل دفعة' : 'سداد دفعة'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Party Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-black text-slate-800">
                {activeTab === 'customer' ? 'إضافة عميل جديد' : 'إضافة مورد جديد'}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeTab === 'customer' ? 'اسم العميل أو الشركة *' : 'اسم المورد أو الشركة *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الأمل، مكتب النور..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={2}
                  placeholder="العنوان أو شروط التعامل..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement of Account Modal */}
      {viewingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-100 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 block">
                  كشف حساب تفصيلي ({viewingParty.type === 'customer' ? 'عميل' : 'مورد'})
                </span>
                <h3 className="text-xl font-black text-slate-800">{viewingParty.name}</h3>
                {viewingParty.phone && (
                  <span className="text-xs text-slate-500 font-medium">الهاتف: {viewingParty.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportStatement(viewingParty)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير كشف الحساب</span>
                </button>
                <button
                  onClick={() => setViewingParty(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary Strip */}
            {(() => {
              const summary = getPartySummary(viewingParty.id);
              return (
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl mb-6 text-center">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5 font-medium">إجمالي المعاملات</span>
                    <span className="text-base font-black text-slate-800">
                      {formatCurrency(summary.totalVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5 font-medium">المسدد فعلياً</span>
                    <span className="text-base font-black text-emerald-600">
                      {formatCurrency(summary.paidAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5 font-medium">
                      {viewingParty.type === 'customer' ? 'الرصيد المستحق عليه' : 'الرصيد المستحق له'}
                    </span>
                    <span
                      className={`text-base font-black ${
                        summary.remainingAmount > 0
                          ? viewingParty.type === 'customer'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatCurrency(summary.remainingAmount)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Table of Ledger Transactions */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 pr-3">التاريخ</th>
                    <th className="py-2.5">النوع</th>
                    <th className="py-2.5">البيان</th>
                    <th className="py-2.5">المبلغ</th>
                    <th className="py-2.5">المسدد</th>
                    <th className="py-2.5">المتبقي</th>
                    <th className="py-2.5 pl-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getPartyStatement(viewingParty.id).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-3 text-slate-500 whitespace-nowrap">
                        {formatDateArabic(item.date)}
                      </td>
                      <td className="py-2.5 whitespace-nowrap font-bold">
                        {item.type === 'revenue'
                          ? 'فاتورة إيراد'
                          : item.type === 'expense'
                          ? 'فاتورة شراء'
                          : 'دفعة سداد'}
                      </td>
                      <td className="py-2.5 text-slate-800 font-semibold">{item.title}</td>
                      <td className="py-2.5 whitespace-nowrap font-bold">{formatCurrency(item.amount)}</td>
                      <td className="py-2.5 whitespace-nowrap font-bold text-emerald-600">
                        {formatCurrency(item.paidAmount)}
                      </td>
                      <td className="py-2.5 whitespace-nowrap font-bold text-amber-600">
                        {formatCurrency(item.remainingAmount)}
                      </td>
                      <td className="py-2.5 pl-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'partial'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {item.status === 'completed'
                            ? 'مدفوع'
                            : item.status === 'partial'
                            ? 'جزئي'
                            : 'آجل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingParty(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Settlement Modal */}
      {settlingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-black text-slate-800">
                {settlingParty.type === 'customer'
                  ? `تحصيل دفعة من: ${settlingParty.name}`
                  : `سداد دفعة للمورد: ${settlingParty.name}`}
              </h3>
              <button
                onClick={() => setSettlingParty(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settleSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settleSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المسدد (ج.م) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الدفعة</label>
                <input
                  type="date"
                  required
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={settlementMethod}
                    onChange={(e) => setSettlementMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="wallet">محفظة إلكترونية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {settlingParty.type === 'customer' ? 'إيداع بالخزينة' : 'خصم من الخزينة'}
                  </label>
                  <select
                    value={settlementAccount}
                    onChange={(e) => setSettlementAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الإيصال</label>
                <input
                  type="text"
                  placeholder="رقم الشيك، الحوالة، أو إيصال الاستلام..."
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettlingParty(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  تسجيل الدفعة وتحديث الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingPartyId}
        title="تأكيد حذف الحساب"
        message="هل أنت متأكد من حذف هذا الطرف؟ لن يتم حذف عملياته المسجلة مسبقاً ولكن سيتم إزالته من القائمة السريعة."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (deletingPartyId) {
            await deleteParty(deletingPartyId);
            setDeletingPartyId(null);
          }
        }}
        onCancel={() => setDeletingPartyId(null)}
      />
    </div>
  );
};
