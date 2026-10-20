import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  Transaction,
  Party,
  FinancialAccount,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  PartyStatementItem,
} from '../types';

interface AccountingContextType {
  transactions: Transaction[];
  parties: Party[];
  accounts: FinancialAccount[];
  loading: boolean;

  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addParty: (data: Omit<Party, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateParty: (id: string, data: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;

  addAccount: (data: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (id: string, data: Partial<FinancialAccount>) => Promise<void>;

  transferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    notes?: string
  ) => Promise<void>;

  recordDebtSettlement: (
    partyId: string,
    amount: number,
    accountId: string,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => Promise<void>;

  // Financial Aggregates
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  totalCollectedCash: number;
  totalPaidCash: number;
  totalTreasuryBalance: number;
  totalReceivables: number; // فلوس عند العملاء
  totalPayables: number; // فلوس للموردين

  // Account & Party helpers
  getAccountBalance: (accountId: string) => number;
  getPartySummary: (partyId: string) => {
    totalVolume: number;
    paidAmount: number;
    remainingAmount: number;
  };
  getPartyStatement: (partyId: string) => PartyStatementItem[];

  // Data helpers
  seedDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

// LocalStorage Keys for guest mode
const LS_TX_KEY = 'abultrafit_transactions_v1';
const LS_PARTIES_KEY = 'abultrafit_parties_v1';
const LS_ACCOUNTS_KEY = 'abultrafit_accounts_v1';

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Default accounts template with zero balances
  const defaultAccountsTemplate: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'الخزينة النقدية الرئيسية', type: 'cash', initialBalance: 0, notes: 'الدرج النقدي للمكتب' },
    { name: 'حساب البنك الأهلي', type: 'bank', initialBalance: 0, notes: 'الحساب التجاري للتحويلات' },
    { name: 'انستاباي ومحافظ فودافون كاش', type: 'wallet', initialBalance: 0, notes: 'التحصيل الإلكتروني الفوري' },
  ];

  // Helper to persist to localStorage for guest or offline caching
  const saveLocal = useCallback((txs: Transaction[], pts: Party[], acts: FinancialAccount[]) => {
    localStorage.setItem(LS_TX_KEY, JSON.stringify(txs));
    localStorage.setItem(LS_PARTIES_KEY, JSON.stringify(pts));
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(acts));
  }, []);

  // Reset flag version to ensure user-requested zeroing is applied
  const RESET_VERSION = 'abultrafit_zeroed_v2';

  // Listen to Firestore when user is logged in, or load from LocalStorage
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Check if user requested zeroing or first clean boot
    const hasBeenZeroed = localStorage.getItem(RESET_VERSION);
    if (!hasBeenZeroed) {
      localStorage.removeItem(LS_TX_KEY);
      localStorage.removeItem(LS_PARTIES_KEY);
      localStorage.removeItem(LS_ACCOUNTS_KEY);
      localStorage.setItem(RESET_VERSION, 'true');
    }

    if (!user) {
      // Guest mode - load from localStorage
      try {
        const localTxs = JSON.parse(localStorage.getItem(LS_TX_KEY) || '[]');
        const localParties = JSON.parse(localStorage.getItem(LS_PARTIES_KEY) || '[]');
        let localAccounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');

        if (localAccounts.length === 0) {
          const now = new Date().toISOString();
          localAccounts = defaultAccountsTemplate.map((acc, idx) => ({
            ...acc,
            id: `acc_default_${idx + 1}`,
            userId,
            createdAt: now,
            updatedAt: now,
          }));
          localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(localAccounts));
        }

        setTransactions(localTxs);
        setParties(localParties);
        setAccounts(localAccounts);
      } catch (err) {
        console.error('Failed to load local data', err);
      }
      setLoading(false);
      return;
    }

    // Authenticated user with Firebase Firestore
    setLoading(true);

    // Auto-migrate any transactions or parties created prior to login
    try {
      const pendingTxs: Transaction[] = JSON.parse(localStorage.getItem(LS_TX_KEY) || '[]');
      const pendingParties: Party[] = JSON.parse(localStorage.getItem(LS_PARTIES_KEY) || '[]');

      if (pendingTxs.length > 0) {
        pendingTxs.forEach((t) => {
          const tDoc = doc(db, 'users', userId, 'transactions', t.id);
          setDoc(tDoc, { ...t, userId }).catch(() => {});
        });
        localStorage.removeItem(LS_TX_KEY);
      }

      if (pendingParties.length > 0) {
        pendingParties.forEach((p) => {
          const pDoc = doc(db, 'users', userId, 'parties', p.id);
          setDoc(pDoc, { ...p, userId }).catch(() => {});
        });
        localStorage.removeItem(LS_PARTIES_KEY);
      }
    } catch (migErr) {
      console.warn('Local data migration error:', migErr);
    }

    const txCollection = collection(db, 'users', userId, 'transactions');
    const partyCollection = collection(db, 'users', userId, 'parties');
    const accountCollection = collection(db, 'users', userId, 'accounts');

    const unsubscribeTx = onSnapshot(
      txCollection,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/transactions`);
      }
    );

    const unsubscribeParties = onSnapshot(
      partyCollection,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Party));
        setParties(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/parties`);
      }
    );

    const unsubscribeAccounts = onSnapshot(
      accountCollection,
      async (snapshot) => {
        if (snapshot.empty) {
          // Initialize default accounts for this new user
          const now = new Date().toISOString();
          for (let i = 0; i < defaultAccountsTemplate.length; i++) {
            const accId = `acc_${Date.now()}_${i}`;
            const accDoc = doc(db, 'users', userId, 'accounts', accId);
            await setDoc(accDoc, {
              id: accId,
              userId,
              ...defaultAccountsTemplate[i],
              createdAt: now,
              updatedAt: now,
            }).catch((e) => handleFirestoreError(e, OperationType.WRITE, `users/${userId}/accounts`));
          }
        } else {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FinancialAccount));
          setAccounts(items);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/accounts`);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTx();
      unsubscribeParties();
      unsubscribeAccounts();
    };
  }, [userId, user]);

  // Keep local storage in sync as secondary cache
  useEffect(() => {
    if (transactions.length > 0 || parties.length > 0 || accounts.length > 0) {
      saveLocal(transactions, parties, accounts);
    }
  }, [transactions, parties, accounts, saveLocal]);

  // CRUD Operations
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newTx: Transaction = {
      ...data,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    if (user) {
      const txDoc = doc(db, 'users', userId, 'transactions', id);
      try {
        await setDoc(txDoc, newTx);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/transactions/${id}`);
      }
    } else {
      setTransactions((prev) => [newTx, ...prev]);
    }

    return id;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const now = new Date().toISOString();
    if (user) {
      const txDoc = doc(db, 'users', userId, 'transactions', id);
      try {
        await updateDoc(txDoc, { ...data, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/transactions/${id}`);
      }
    } else {
      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: now } : item))
      );
    }
  };

  const deleteTransaction = async (id: string) => {
    if (user) {
      const txDoc = doc(db, 'users', userId, 'transactions', id);
      try {
        await deleteDoc(txDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/transactions/${id}`);
      }
    } else {
      setTransactions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const addParty = async (data: Omit<Party, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newParty: Party = {
      ...data,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    if (user) {
      const partyDoc = doc(db, 'users', userId, 'parties', id);
      try {
        await setDoc(partyDoc, newParty);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/parties/${id}`);
      }
    } else {
      setParties((prev) => [...prev, newParty]);
    }

    return id;
  };

  const updateParty = async (id: string, data: Partial<Party>) => {
    const now = new Date().toISOString();
    if (user) {
      const partyDoc = doc(db, 'users', userId, 'parties', id);
      try {
        await updateDoc(partyDoc, { ...data, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/parties/${id}`);
      }
    } else {
      setParties((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: now } : item))
      );
    }
  };

  const deleteParty = async (id: string) => {
    if (user) {
      const partyDoc = doc(db, 'users', userId, 'parties', id);
      try {
        await deleteDoc(partyDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/parties/${id}`);
      }
    } else {
      setParties((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const addAccount = async (
    data: Omit<FinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newAccount: FinancialAccount = {
      ...data,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    if (user) {
      const accDoc = doc(db, 'users', userId, 'accounts', id);
      try {
        await setDoc(accDoc, newAccount);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${userId}/accounts/${id}`);
      }
    } else {
      setAccounts((prev) => [...prev, newAccount]);
    }

    return id;
  };

  const updateAccount = async (id: string, data: Partial<FinancialAccount>) => {
    const now = new Date().toISOString();
    if (user) {
      const accDoc = doc(db, 'users', userId, 'accounts', id);
      try {
        await updateDoc(accDoc, { ...data, updatedAt: now });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/accounts/${id}`);
      }
    } else {
      setAccounts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: now } : item))
      );
    }
  };

  // Internal Transfer: Does NOT affect total revenue or expense!
  const transferBetweenAccounts = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    notes?: string
  ) => {
    if (fromAccountId === toAccountId) {
      throw new Error('لا يمكن التحويل لنفس الحساب');
    }
    const fromAcc = accounts.find((a) => a.id === fromAccountId);
    const toAcc = accounts.find((a) => a.id === toAccountId);

    await addTransaction({
      type: 'transfer',
      date,
      title: `تحويل من ${fromAcc?.name || 'حساب'} إلى ${toAcc?.name || 'حساب'}`,
      category: 'تحويل داخلي',
      amount,
      paidAmount: amount,
      remainingAmount: 0,
      paymentMethod: fromAcc?.type || 'cash',
      accountId: fromAccountId,
      toAccountId,
      status: 'completed',
      partyType: 'none',
      notes: notes || 'تحويل رصيد داخلي بين الخزينة والحسابات',
    });
  };

  // Settle Debt / Receive Customer payment or Pay supplier
  const recordDebtSettlement = async (
    partyId: string,
    amount: number,
    accountId: string,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => {
    const party = parties.find((p) => p.id === partyId);
    if (!party) throw new Error('الطرف غير موجود');

    const isCustomer = party.type === 'customer';

    await addTransaction({
      type: 'debt_payment',
      date,
      title: isCustomer
        ? `تحصيل دفعة مستحقة من العميل: ${party.name}`
        : `سداد دفعة مستحقة للمورد: ${party.name}`,
      category: isCustomer ? 'تحصيل ديون عملاء' : 'سداد مستحقات موردين',
      amount,
      paidAmount: amount,
      remainingAmount: 0,
      paymentMethod,
      accountId,
      status: 'completed',
      partyType: party.type,
      partyId,
      partyName: party.name,
      partyPhone: party.phone,
      notes: notes || (isCustomer ? 'سداد جزء من مديونية سابقة' : 'دفعة سداد حساب للمورد'),
    });
  };

  // Financial Calculations
  const totalRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'revenue')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const netProfit = useMemo(() => {
    return totalRevenue - totalExpense;
  }, [totalRevenue, totalExpense]);

  // Actual cash collected into treasury
  const totalCollectedCash = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'revenue') return sum + (t.paidAmount || 0);
      if (t.type === 'debt_payment' && t.partyType === 'customer') return sum + (t.paidAmount || 0);
      return sum;
    }, 0);
  }, [transactions]);

  // Actual cash paid out from treasury
  const totalPaidCash = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'expense') return sum + (t.paidAmount || 0);
      if (t.type === 'debt_payment' && t.partyType === 'supplier') return sum + (t.paidAmount || 0);
      return sum;
    }, 0);
  }, [transactions]);

  // Receivables from customers (إجمالي ما تبقى عند العملاء)
  const totalReceivables = useMemo(() => {
    const uncollectedRevenue = transactions
      .filter((t) => t.type === 'revenue' && (t.remainingAmount || 0) > 0)
      .reduce((sum, t) => sum + (t.remainingAmount || 0), 0);

    const settledDebts = transactions
      .filter((t) => t.type === 'debt_payment' && t.partyType === 'customer')
      .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

    return Math.max(0, uncollectedRevenue - settledDebts);
  }, [transactions]);

  // Payables to suppliers (إجمالي المستحق للموردين)
  const totalPayables = useMemo(() => {
    const unpaidExpenses = transactions
      .filter((t) => t.type === 'expense' && (t.remainingAmount || 0) > 0)
      .reduce((sum, t) => sum + (t.remainingAmount || 0), 0);

    const paidToSuppliers = transactions
      .filter((t) => t.type === 'debt_payment' && t.partyType === 'supplier')
      .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

    return Math.max(0, unpaidExpenses - paidToSuppliers);
  }, [transactions]);

  // Balance per specific account
  const getAccountBalance = useCallback(
    (accId: string): number => {
      const acc = accounts.find((a) => a.id === accId);
      if (!acc) return 0;
      let balance = acc.initialBalance || 0;

      transactions.forEach((t) => {
        // Cash Inflow:
        // 1. Revenue paid into this account
        if (t.type === 'revenue' && t.accountId === accId) {
          balance += t.paidAmount || 0;
        }
        // 2. Customer debt payment received into this account
        if (t.type === 'debt_payment' && t.partyType === 'customer' && t.accountId === accId) {
          balance += t.paidAmount || 0;
        }
        // 3. Incoming Transfer into this account
        if (t.type === 'transfer' && t.toAccountId === accId) {
          balance += t.paidAmount || 0;
        }

        // Cash Outflow:
        // 1. Expense paid from this account
        if (t.type === 'expense' && t.accountId === accId) {
          balance -= t.paidAmount || 0;
        }
        // 2. Supplier debt payment paid from this account
        if (t.type === 'debt_payment' && t.partyType === 'supplier' && t.accountId === accId) {
          balance -= t.paidAmount || 0;
        }
        // 3. Outgoing Transfer from this account
        if (t.type === 'transfer' && t.accountId === accId) {
          balance -= t.paidAmount || 0;
        }
      });

      return balance;
    },
    [accounts, transactions]
  );

  // Total Treasury Balance across all accounts
  const totalTreasuryBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);
  }, [accounts, getAccountBalance]);

  // Party summary
  const getPartySummary = useCallback(
    (partyId: string) => {
      const party = parties.find((p) => p.id === partyId);
      if (!party) return { totalVolume: 0, paidAmount: 0, remainingAmount: 0 };

      const partyTxs = transactions.filter(
        (t) => t.partyId === partyId || (t.partyName && t.partyName === party.name)
      );

      const isCustomer = party.type === 'customer';

      let totalVolume = 0;
      let totalPaid = 0;

      partyTxs.forEach((t) => {
        if ((isCustomer && t.type === 'revenue') || (!isCustomer && t.type === 'expense')) {
          totalVolume += t.amount || 0;
          totalPaid += t.paidAmount || 0;
        } else if (t.type === 'debt_payment') {
          totalPaid += t.paidAmount || 0;
        }
      });

      const remainingAmount = Math.max(0, totalVolume - totalPaid);

      return { totalVolume, paidAmount: totalPaid, remainingAmount };
    },
    [parties, transactions]
  );

  // Statement of account
  const getPartyStatement = useCallback(
    (partyId: string): PartyStatementItem[] => {
      const party = parties.find((p) => p.id === partyId);
      if (!party) return [];

      return transactions
        .filter((t) => t.partyId === partyId || (t.partyName && t.partyName === party.name))
        .map((t) => ({
          id: t.id,
          date: t.date,
          title: t.title,
          type: t.type,
          amount: t.amount,
          paidAmount: t.paidAmount,
          remainingAmount: t.remainingAmount,
          status: t.status,
          notes: t.notes,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    [parties, transactions]
  );

  // Seed realistic starter data
  const seedDemoData = async () => {
    const today = new Date();
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const d0 = formatYMD(today);
    const d1 = formatYMD(new Date(today.getTime() - 86400000 * 2));
    const d2 = formatYMD(new Date(today.getTime() - 86400000 * 5));
    const d3 = formatYMD(new Date(today.getTime() - 86400000 * 12));
    const d4 = formatYMD(new Date(today.getTime() - 86400000 * 20));

    // Customers
    const c1Id = await addParty({ name: 'شركة الأمل للتجارة والتوزيع', type: 'customer', phone: '01012345678' });
    const c2Id = await addParty({ name: 'مكتب النور للمقاولات', type: 'customer', phone: '01123456789' });
    const c3Id = await addParty({ name: 'كافيه سنترال بوينت', type: 'customer', phone: '01234567890' });

    // Suppliers
    const s1Id = await addParty({ name: 'مطابع الأهرام للورق والكرتون', type: 'supplier', phone: '01098765432' });
    const s2Id = await addParty({ name: 'شركة دلتا للتوريدات والخامات', type: 'supplier', phone: '01298765432' });

    const mainAccId = accounts[0]?.id || 'acc_default_1';
    const bankAccId = accounts[1]?.id || 'acc_default_2';
    const walletAccId = accounts[2]?.id || 'acc_default_3';

    // Revenues
    await addTransaction({
      type: 'revenue',
      date: d0,
      title: 'توريد حزمة برمجية وتجهيز أنظمة للمكتب الرئيسي',
      category: 'خدمات واشتراكات',
      amount: 18500,
      paidAmount: 18500,
      remainingAmount: 0,
      paymentMethod: 'bank',
      accountId: bankAccId,
      status: 'completed',
      partyType: 'customer',
      partyId: c1Id,
      partyName: 'شركة الأمل للتجارة والتوزيع',
      notes: 'تم التحويل لحساب البنك الأهلي مباشرة',
    });

    await addTransaction({
      type: 'revenue',
      date: d1,
      title: 'مبيعات منتجات وتجهيزات لمشروع جديد',
      category: 'مبيعات منتجات وبضائع',
      amount: 24000,
      paidAmount: 14000,
      remainingAmount: 10000,
      paymentMethod: 'cash',
      accountId: mainAccId,
      status: 'partial',
      partyType: 'customer',
      partyId: c2Id,
      partyName: 'مكتب النور للمقاولات',
      notes: 'دفعة مقدمة نقداً 14,000 ج.م والمتبقي 10,000 ج.م يستحق الأسبوع القادم',
    });

    await addTransaction({
      type: 'revenue',
      date: d2,
      title: 'اشتراك شهري في خدمات الدعم الفني والاستشارات',
      category: 'خدمات واشتراكات',
      amount: 6500,
      paidAmount: 6500,
      remainingAmount: 0,
      paymentMethod: 'wallet',
      accountId: walletAccId,
      status: 'completed',
      partyType: 'customer',
      partyId: c3Id,
      partyName: 'كافيه سنترال بوينت',
      notes: 'تحويل عبر محفظة فودافون كاش',
    });

    await addTransaction({
      type: 'revenue',
      date: d4,
      title: 'دفعة تعاقد تصميم وتجهيز هوية بصرية كاملة',
      category: 'تصميم وطباعة',
      amount: 12000,
      paidAmount: 12000,
      remainingAmount: 0,
      paymentMethod: 'bank',
      accountId: bankAccId,
      status: 'completed',
      partyType: 'customer',
      partyId: c1Id,
      partyName: 'شركة الأمل للتجارة والتوزيع',
    });

    // Expenses
    await addTransaction({
      type: 'expense',
      date: d0,
      title: 'سداد إيجار مقر الشركة الشهري',
      category: 'إيجار ومقر العمل',
      amount: 8000,
      paidAmount: 8000,
      remainingAmount: 0,
      paymentMethod: 'bank',
      accountId: bankAccId,
      status: 'completed',
      partyType: 'none',
      notes: 'إيجار مقر شهر الحالي',
    });

    await addTransaction({
      type: 'expense',
      date: d1,
      title: 'شراء خامات ومواد تشغيل وأوراق طباعة للمشروع',
      category: 'خامات ومواد أولية',
      amount: 9500,
      paidAmount: 5000,
      remainingAmount: 4500,
      paymentMethod: 'cash',
      accountId: mainAccId,
      status: 'partial',
      partyType: 'supplier',
      partyId: s1Id,
      partyName: 'مطابع الأهرام للورق والكرتون',
      notes: 'سداد دفعة نقدية 5,000 ج.م والمتبقي 4,500 ج.م للمورد',
    });

    await addTransaction({
      type: 'expense',
      date: d2,
      title: 'حملة إعلانية ممولة على فيسبوك وانستجرام',
      category: 'تسويق وإعلانات',
      amount: 3200,
      paidAmount: 3200,
      remainingAmount: 0,
      paymentMethod: 'wallet',
      accountId: walletAccId,
      status: 'completed',
      partyType: 'none',
      notes: 'دفع بالبطاقة الإلكترونية',
    });

    await addTransaction({
      type: 'expense',
      date: d3,
      title: 'فاتورة الكهرباء والإنترنت فايبر السريع',
      category: 'فواتير (كهرباء / مياه / إنترنت)',
      amount: 1450,
      paidAmount: 1450,
      remainingAmount: 0,
      paymentMethod: 'wallet',
      accountId: walletAccId,
      status: 'completed',
      partyType: 'none',
    });

    await addTransaction({
      type: 'expense',
      date: d4,
      title: 'رواتب موظفي التشغيل والخدمات الفنية',
      category: 'رواتب وأجور الموظفين',
      amount: 15000,
      paidAmount: 15000,
      remainingAmount: 0,
      paymentMethod: 'bank',
      accountId: bankAccId,
      status: 'completed',
      partyType: 'none',
    });
  };

  const clearAllData = async () => {
    if (user) {
      for (const t of transactions) {
        await deleteDoc(doc(db, 'users', userId, 'transactions', t.id)).catch(() => {});
      }
      for (const p of parties) {
        await deleteDoc(doc(db, 'users', userId, 'parties', p.id)).catch(() => {});
      }
      for (const a of accounts) {
        await updateDoc(doc(db, 'users', userId, 'accounts', a.id), {
          initialBalance: 0,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    }
    setTransactions([]);
    setParties([]);
    const resetAccounts = accounts.map((a) => ({ ...a, initialBalance: 0 }));
    setAccounts(resetAccounts);
    localStorage.removeItem(LS_TX_KEY);
    localStorage.removeItem(LS_PARTIES_KEY);
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(resetAccounts));
  };

  return (
    <AccountingContext.Provider
      value={{
        transactions,
        parties,
        accounts,
        loading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addParty,
        updateParty,
        deleteParty,
        addAccount,
        updateAccount,
        transferBetweenAccounts,
        recordDebtSettlement,
        totalRevenue,
        totalExpense,
        netProfit,
        totalCollectedCash,
        totalPaidCash,
        totalTreasuryBalance,
        totalReceivables,
        totalPayables,
        getAccountBalance,
        getPartySummary,
        getPartyStatement,
        seedDemoData,
        clearAllData,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
