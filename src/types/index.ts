export interface Expense {
  id: string;
  date: string; // Stored in YYYY-MM-DD format
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  location?: string;
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroup?: string;
  dueDate?: string; // Stored in YYYY-MM-DD format
  isCreditCard?: boolean;
  paid?: boolean;
}

export interface Income {
  id: string;
  date: string; // Stored in YYYY-MM-DD format
  source: string;
  amount: number;
  notes?: string;
  location?: string;
  account?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  date: string; // Stored in YYYY-MM-DD format
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category?: string;
  account: string;
  toAccount?: string; // For transfers
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // Stored in YYYY-MM-DD format
  description?: string;
}