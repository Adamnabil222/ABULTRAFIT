export type TransactionType = 'revenue' | 'expense' | 'transfer' | 'debt_payment';

export type PaymentMethod = 'cash' | 'bank' | 'wallet' | 'other';

export type TransactionStatus = 'completed' | 'partial' | 'pending';

export type PartyType = 'customer' | 'supplier' | 'none';

export type AccountType = 'cash' | 'bank' | 'wallet';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  accountId: string; // from account or deposit account
  toAccountId?: string; // for transfer between accounts
  status: TransactionStatus;
  partyType: PartyType;
  partyId?: string;
  partyName?: string;
  partyPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  userId: string;
  name: string;
  type: 'customer' | 'supplier';
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAccount {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimeRangePreset = 'today' | 'week' | 'month' | 'last_month' | 'year' | 'all' | 'custom';

export interface FilterOptions {
  preset: TimeRangePreset;
  startDate?: string;
  endDate?: string;
  type?: 'all' | TransactionType;
  category?: string;
  partyId?: string;
  status?: 'all' | TransactionStatus;
  searchQuery?: string;
}

export interface PartyStatementItem {
  id: string;
  date: string;
  title: string;
  type: TransactionType;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: TransactionStatus;
  notes?: string;
}

export const REVENUE_CATEGORIES = [
  'مبيعات منتجات وبضائع',
  'خدمات واشتراكات',
  'استشارات ومتابعة',
  'تدريب وكورسات',
  'تصميم وطباعة',
  'صيانة وتركيب',
  'إيرادات أخرى',
];

export const EXPENSE_CATEGORIES = [
  'إيجار ومقر العمل',
  'رواتب وأجور الموظفين',
  'خامات ومواد أولية',
  'طباعة وتغليف',
  'تسويق وإعلانات',
  'شحن وتوصيل',
  'مواصلات وانتقالات',
  'فواتير (كهرباء / مياه / إنترنت)',
  'صيانة وأدوات',
  'بوفيه وضيافة ونظافة',
  'مصروفات أخرى',
];
