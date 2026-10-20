import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AccountingProvider } from './context/AccountingContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { RevenueForm } from './components/transactions/RevenueForm';
import { ExpenseForm } from './components/transactions/ExpenseForm';
import { TransactionsLedger } from './components/transactions/TransactionsLedger';
import { ProfitLossView } from './components/profitLoss/ProfitLossView';
import { PartiesManagement } from './components/parties/PartiesManagement';
import { TreasuryManagement } from './components/treasury/TreasuryManagement';
import { ReportsView } from './components/reports/ReportsView';
import { X } from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Quick Action Modals
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenRevenue={() => setIsRevenueModalOpen(true)}
        onOpenExpense={() => setIsExpenseModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
          onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
        />

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={(page) => setCurrentPage(page)}
              onOpenRevenueModal={() => setIsRevenueModalOpen(true)}
              onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
              onOpenTransferModal={() => setIsTransferModalOpen(true)}
            />
          )}

          {currentPage === 'revenue' && (
            <div className="animate-fade-in pb-12">
              <RevenueForm onSuccess={() => setCurrentPage('transactions')} />
            </div>
          )}

          {currentPage === 'expense' && (
            <div className="animate-fade-in pb-12">
              <ExpenseForm onSuccess={() => setCurrentPage('transactions')} />
            </div>
          )}

          {currentPage === 'transactions' && (
            <TransactionsLedger
              onOpenRevenue={() => setIsRevenueModalOpen(true)}
              onOpenExpense={() => setIsExpenseModalOpen(true)}
            />
          )}

          {currentPage === 'profitLoss' && <ProfitLossView />}

          {currentPage === 'parties' && <PartiesManagement />}

          {currentPage === 'treasury' && (
            <TreasuryManagement
              isTransferModalOpen={isTransferModalOpen}
              onCloseTransferModal={() => setIsTransferModalOpen(false)}
            />
          )}

          {currentPage === 'reports' && <ReportsView />}
        </main>
      </div>

      {/* Quick Revenue Modal Dialog */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl relative my-8">
            <button
              onClick={() => setIsRevenueModalOpen(false)}
              className="absolute left-6 top-6 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <RevenueForm
              isModal={true}
              onSuccess={() => setIsRevenueModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Expense Modal Dialog */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-100 shadow-2xl relative my-8">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute left-6 top-6 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <ExpenseForm
              isModal={true}
              onSuccess={() => setIsExpenseModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Transfer Modal Dialog (rendered via TreasuryManagement or standalone) */}
      {isTransferModalOpen && currentPage !== 'treasury' && (
        <TreasuryManagement
          isTransferModalOpen={true}
          onCloseTransferModal={() => setIsTransferModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AccountingProvider>
        <MainApp />
      </AccountingProvider>
    </AuthProvider>
  );
}
