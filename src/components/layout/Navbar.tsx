import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, PlusCircle, MinusCircle, Cloud, CloudOff, LogIn, LogOut, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenRevenue: () => void;
  onOpenExpense: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenRevenue,
  onOpenExpense,
}) => {
  const { user, isGuest, loginGoogle, logout, userName } = useAuth();

  const todayFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between print:hidden shadow-xs">
      {/* Left (RTL Start): Menu toggle and App Branding on small screens */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Right (RTL End): Cloud Sync Badge, Quick Actions & User Menu */}
      <div className="flex items-center gap-3">
        {/* Quick Add Buttons */}
        <button
          onClick={onOpenRevenue}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200/60 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          <span>+ إيراد</span>
        </button>

        <button
          onClick={onOpenExpense}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all border border-rose-200/60 cursor-pointer"
        >
          <MinusCircle className="w-4 h-4 text-rose-600" />
          <span>+ مصروف</span>
        </button>

        {/* Cloud Status / Auth */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-r border-slate-200 pr-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">متصل بالسحابة (Firebase)</span>
            </div>

            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={userName || 'مستخدم'}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  {userName ? userName.charAt(0) : 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                {userName}
              </span>
              <button
                onClick={logout}
                title="تسجيل الخروج"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              <CloudOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">حفظ محلي آمن</span>
            </div>
            <button
              onClick={loginGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>مزامنة سحابية</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
