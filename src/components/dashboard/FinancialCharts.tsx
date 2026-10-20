import React, { useMemo } from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, BarChart3 } from 'lucide-react';

interface FinancialChartsProps {
  transactions: Transaction[];
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ transactions }) => {
  // 1. Group transactions by month (last 6 months)
  const monthlyData = useMemo(() => {
    const monthsMap: {
      [key: string]: { label: string; revenue: number; expense: number; profit: number };
    } = {};

    const now = new Date();
    // Initialize past 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(d);
      monthsMap[key] = { label, revenue: 0, expense: 0, profit: 0 };
    }

    transactions.forEach((t) => {
      if (!t.date) return;
      const key = t.date.substring(0, 7); // YYYY-MM
      if (monthsMap[key]) {
        if (t.type === 'revenue') {
          monthsMap[key].revenue += t.amount || 0;
        } else if (t.type === 'expense') {
          monthsMap[key].expense += t.amount || 0;
        }
      }
    });

    return Object.values(monthsMap).map((m) => ({
      ...m,
      profit: m.revenue - m.expense,
    }));
  }, [transactions]);

  // Max value for bar chart scale
  const maxBarValue = useMemo(() => {
    const max = Math.max(
      ...monthlyData.map((m) => Math.max(m.revenue, m.expense)),
      1000
    );
    return max * 1.15; // 15% headroom
  }, [monthlyData]);

  // 2. Expense Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: { [cat: string]: number } = {};
    let total = 0;

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'أخرى';
        map[cat] = (map[cat] || 0) + (t.amount || 0);
        total += t.amount || 0;
      });

    const list = Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));

    list.sort((a, b) => b.amount - a.amount);
    return { list: list.slice(0, 6), total };
  }, [transactions]);

  // 3. Comparison of current month vs previous month
  const comparison = useMemo(() => {
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    let curRev = 0;
    let curExp = 0;
    let prevRev = 0;
    let prevExp = 0;

    transactions.forEach((t) => {
      const k = t.date?.substring(0, 7);
      if (k === curKey) {
        if (t.type === 'revenue') curRev += t.amount || 0;
        if (t.type === 'expense') curExp += t.amount || 0;
      } else if (k === prevKey) {
        if (t.type === 'revenue') prevRev += t.amount || 0;
        if (t.type === 'expense') prevExp += t.amount || 0;
      }
    });

    const curProfit = curRev - curExp;
    const prevProfit = prevRev - prevExp;

    const revDiff = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : 0;
    const expDiff = prevExp > 0 ? ((curExp - prevExp) / prevExp) * 100 : 0;
    const profitDiff = prevProfit !== 0 ? ((curProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

    return {
      curRev,
      curExp,
      curProfit,
      prevRev,
      prevExp,
      prevProfit,
      revDiff,
      expDiff,
      profitDiff,
    };
  }, [transactions]);

  const categoryColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Monthly Revenue vs Expense Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">الإيرادات مقابل المصروفات شهرياً</h3>
              <p className="text-xs text-slate-500">مقارنة حركة التدفقات خلال آخر 6 أشهر</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">الإيرادات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-600">المصروفات</span>
            </div>
          </div>
        </div>

        {/* Bars Container */}
        <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
          {monthlyData.map((item, idx) => {
            const revHeight = Math.min(100, Math.max(4, (item.revenue / maxBarValue) * 100));
            const expHeight = Math.min(100, Math.max(4, (item.expense / maxBarValue) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-48 relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 whitespace-nowrap shadow-lg pointer-events-none">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-emerald-300">إيراد: {formatCurrency(item.revenue)}</span>
                    <span className="text-rose-300">مصروف: {formatCurrency(item.expense)}</span>
                    <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      صافي: {formatCurrency(item.profit)}
                    </span>
                  </div>

                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${revHeight}%` }}
                    className="w-1/2 max-w-[28px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:brightness-110 relative"
                  ></div>

                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expHeight}%` }}
                    className="w-1/2 max-w-[28px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-500 hover:brightness-110 relative"
                  ></div>
                </div>

                {/* Month Label */}
                <div className="text-xs font-semibold text-slate-600 mt-2">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Current Month vs Previous Month Comparison Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">مقارنة الشهر الحالي بالسابق</h3>
              <p className="text-xs text-slate-500">تقييم نسبة النمو المالي والتغير</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Revenue comparison */}
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>إيرادات الشهر الحالي</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    comparison.revDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {comparison.revDiff >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(Math.round(comparison.revDiff))}%
                </span>
              </div>
              <div className="text-lg font-bold text-slate-800">{formatCurrency(comparison.curRev)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                الشهر السابق: {formatCurrency(comparison.prevRev)}
              </div>
            </div>

            {/* Expense comparison */}
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>مصروفات الشهر الحالي</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    comparison.expDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {comparison.expDiff > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(Math.round(comparison.expDiff))}%
                </span>
              </div>
              <div className="text-lg font-bold text-slate-800">{formatCurrency(comparison.curExp)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                الشهر السابق: {formatCurrency(comparison.prevExp)}
              </div>
            </div>

            {/* Net profit comparison */}
            <div className="p-3.5 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>صافي أرباح الشهر</span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                    comparison.curProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {comparison.profitDiff >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(Math.round(comparison.profitDiff))}%
                </span>
              </div>
              <div
                className={`text-xl font-black ${
                  comparison.curProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(comparison.curProfit)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                الشهر السابق: {formatCurrency(comparison.prevProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Expense Breakdown by Category */}
      <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">توزيع المصروفات حسب التصنيف</h3>
              <p className="text-xs text-slate-500">أين تذهب أموال المشروع وما هي أعلى بنود الإنفاق؟</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-600">
            إجمالي المصروفات: {formatCurrency(categoryBreakdown.total)}
          </div>
        </div>

        {categoryBreakdown.list.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            لا توجد مصروفات مسجلة بعد لعرض التوزيع
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.list.map((cat, idx) => {
              const colorClass = categoryColors[idx % categoryColors.length];
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {formatNumber(cat.percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${colorClass}`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {formatCurrency(cat.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
