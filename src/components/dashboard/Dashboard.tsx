import React from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateArabic } from '../../utils/formatters';
import { FinancialCharts } from './FinancialCharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Truck,
  PlusCircle,
  MinusCircle,
  ArrowRightLeft,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileSpreadsheet,
  Cloud,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { TransactionType } from '../../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onOpenRevenueModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenTransferModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenRevenueModal,
  onOpenExpenseModal,
  onOpenTransferModal,
}) => {
  const {
    totalRevenue,
    totalExpense,
    netProfit,
    totalTreasuryBalance,
    totalReceivables,
    totalPayables,
    transactions,
    accounts,
    parties,
    seedDemoData,
  } = useAccounting();
  const { user, loginGoogle } = useAuth();

  const isProfitable = netProfit >= 0;

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Cross-Device Cloud Synchronization Status Bar */}
      {!user ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-blue-400/25 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
              <Cloud className="w-6 h-6 animate-pulse text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  مزامنة سحابية بين الهاتف والكمبيوتر
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                تريد أن تظهر بياناتك على أي هاتف أو كمبيوتر تفتح البرنامج منه؟
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                سجّل الدخول بحساب Google لربط وحفظ بياناتك سحابياً. عند فتح البرنامج من هاتفك أو أي متصفح آخر وتسجيل الدخول، ستجد كل العمليات والأرصدة محدثة وفورية في نفس اللحظة!
              </p>
            </div>
          </div>

          <button
            onClick={loginGoogle}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer z-10"
          >
            <LogIn className="w-4 h-4 text-blue-600" />
            <span>تسجيل الدخول والمزامنة السحابية</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-emerald-100 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>المزامنة السحابية الفورية مفعلة:</strong> حسابك مرتبط سحابياً بـ ({user.email}). أي عملية تسجلها هنا تظهر فوراً على هاتفك والكمبيوتر بمجرد فتح البرنامج.
            </span>
          </div>
          <span className="text-[11px] font-black text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
            متزامن مع السحابة ✓
          </span>
        </div>
      )}

      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-2xl -translate-x-20 -translate-y-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl translate-x-10 translate-y-10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام إدارة الحسابات المالية ABULTRAFIT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              لوحة المتابعة والتحكم المالي
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl leading-relaxed">
              نظرة عامة وفورية على إيراداتك ومصروفاتك وصافي الأرباح ورصيد الخزينة ومستحقات الديون.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRevenueModal}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-800 font-bold hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>+ تسجيل إيراد جديد</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="px-5 py-3 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2 text-sm border border-rose-400/30 cursor-pointer"
            >
              <MinusCircle className="w-5 h-5 text-white" />
              <span>+ تسجيل مصروف</span>
            </button>

            <button
              onClick={onOpenTransferModal}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md transition-all flex items-center gap-2 text-sm border border-white/15 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>تحويل خزينة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Essential KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">1. إجمالي الإيرادات المسجلة</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>إجمالي المبيعات والخدمات المعترف بها</span>
          </div>
        </div>

        {/* Card 2: Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">2. إجمالي المصروفات المسجلة</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(totalExpense)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-semibold">
            <ArrowDownRight className="w-4 h-4" />
            <span>التكاليف التشغيلية والمصاريف العامة</span>
          </div>
        </div>

        {/* Card 3: Net Profit or Loss */}
        <div
          className={`rounded-2xl p-5 border shadow-xs hover:shadow-md transition-shadow relative overflow-hidden ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200'
              : 'bg-gradient-to-br from-rose-50/70 to-red-50/40 border-rose-200'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-2 h-full ${
              isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          ></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600">3. صافي الربح / الخسارة</span>
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                isProfitable
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isProfitable ? 'أرباح صافية' : 'خسائر مؤقتة'}
            </span>
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              isProfitable ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(netProfit)}
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-500">
            {isProfitable
              ? `هامش ربح تقديري: ${
                  totalRevenue > 0
                    ? Math.round((netProfit / totalRevenue) * 100)
                    : 0
                }% من الإيراد`
              : 'المصروفات تجاوزت الإيرادات حالياً'}
          </div>
        </div>

        {/* Card 4: Current Treasury Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">4. رصيد الخزينة والسيولة الحالي</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {formatCurrency(totalTreasuryBalance)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-semibold">
            <span>موزعة على {accounts.length} حسابات (نقدي، بنك، محافظ)</span>
          </div>
        </div>

        {/* Card 5: Receivables from Customers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">5. مبالغ مستحقة لي عند العملاء</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {formatCurrency(totalReceivables)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-semibold">
            <span>فواتير آجلة تنتظر التحصيل من العملاء</span>
          </div>
        </div>

        {/* Card 6: Payables to Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">6. مبالغ مستحقة عليّ للموردين</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">
            {formatCurrency(totalPayables)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-semibold">
            <span>التزامات واجبة السداد للموردين والخامات</span>
          </div>
        </div>
      </div>

      {/* Financial Charts Section */}
      <FinancialCharts transactions={transactions} />

      {/* Recent Transactions & Quick Ledger Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">أحدث العمليات المسجلة</h3>
              <p className="text-xs text-slate-500">آخر الحركات المالية المضافة في النظام</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>عرض كل السجل</span>
            <span>&larr;</span>
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 mb-1">لا توجد عمليات مسجلة بعد</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
              ابدأ الآن بتسجيل أول إيراد أو مصروف، أو قم بتجربة بيانات توضيحية لمعاينة كافة وظائف البرنامج بنقرة واحدة.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenRevenueModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                + إضافة إيراد أول
              </button>
              <button
                onClick={seedDemoData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                ملء بيانات تجريبية واقعية
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="pb-3 pr-2 font-medium">التاريخ</th>
                  <th className="pb-3 font-medium">النوع</th>
                  <th className="pb-3 font-medium">البيان / الوصف</th>
                  <th className="pb-3 font-medium">التصنيف</th>
                  <th className="pb-3 font-medium">الطرف</th>
                  <th className="pb-3 pl-2 font-medium">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => {
                  const isRevenue = tx.type === 'revenue';
                  const isExpense = tx.type === 'expense';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-2 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateArabic(tx.date)}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                      <td className="py-3 font-semibold text-slate-800 max-w-xs truncate">
                        {tx.title}
                      </td>
                      <td className="py-3 text-xs text-slate-500 whitespace-nowrap">
                        {tx.category || '-'}
                      </td>
                      <td className="py-3 text-xs text-slate-600 whitespace-nowrap">
                        {tx.partyName || '-'}
                      </td>
                      <td className="py-3 pl-2 whitespace-nowrap font-black">
                        <span
                          className={
                            isRevenue
                              ? 'text-emerald-600'
                              : isExpense
                              ? 'text-rose-600'
                              : 'text-slate-700'
                          }
                        >
                          {isRevenue ? '+' : isExpense ? '-' : ''}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
