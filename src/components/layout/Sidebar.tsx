import React, { useState } from 'react';
import { useAccounting } from '../../context/AccountingContext';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  LayoutDashboard,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Wallet,
  FileText,
  Sparkles,
  Database,
  RotateCcw,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenRevenueModal: () => void;
  onOpenExpenseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  onOpenRevenueModal,
  onOpenExpenseModal,
}) => {
  const { netProfit, totalTreasuryBalance, seedDemoData, clearAllData, transactions } =
    useAccounting();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'revenue',
      label: 'تسجيل الإيرادات',
      icon: PlusCircle,
      accent: 'emerald',
    },
    {
      id: 'expense',
      label: 'تسجيل المصروفات',
      icon: MinusCircle,
      accent: 'rose',
    },
    {
      id: 'transactions',
      label: 'سجل العمليات الكامل',
      icon: FileSpreadsheet,
      badge: transactions.length > 0 ? transactions.length : null,
    },
    {
      id: 'profitLoss',
      label: 'الأرباح والخسائر',
      icon: TrendingUp,
    },
    {
      id: 'parties',
      label: 'العملاء والموردين',
      icon: Users,
    },
    {
      id: 'treasury',
      label: 'إدارة الخزينة والسيولة',
      icon: Wallet,
    },
    {
      id: 'reports',
      label: 'التقارير والتصدير والطباعة',
      icon: FileText,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        ></div>
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-72 bg-white border-l border-slate-100 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out shadow-xs print:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Brand & Logo */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white font-black flex items-center justify-center text-base shadow-md shadow-emerald-500/20">
                A
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight block leading-tight">
                  ABULTRAFIT
                </span>
                <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase block">
                  نظام إدارة الحسابات
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-emerald-400'
                          : item.accent === 'emerald'
                          ? 'text-emerald-600'
                          : item.accent === 'rose'
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area: Mini KPI summary & Demo Data Buttons */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
          {/* Quick Metrics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-500 font-medium">صافي الأرباح:</span>
              <span
                className={`font-black ${
                  netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatCurrency(netProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-500 font-medium">رصيد الخزينة:</span>
              <span className="font-black text-slate-800">
                {formatCurrency(totalTreasuryBalance)}
              </span>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200/50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير بيانات البرنامج بالكامل (0 ج.م)</span>
            </button>

            {transactions.length === 0 && (
              <button
                onClick={seedDemoData}
                className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>تحميل بيانات تجريبية (للمعاينة)</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Zero out / Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="تأكيد تصفير كافة بيانات البرنامج"
        message="هل أنت متأكد من تصفير كافة الإيرادات والمصروفات والعملاء والموردين وأرصدة الخزائن وجعلها صفر؟ لن يمكن التراجع عن هذه الخطوة."
        confirmLabel="نعم، قم بتصفير كل البيانات"
        cancelLabel="إلغاء"
        onConfirm={async () => {
          await clearAllData();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
        isDestructive={true}
      />
    </>
  );
};
