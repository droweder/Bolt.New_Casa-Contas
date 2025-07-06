export interface Expense {
  id: string;
  date: string; // Data da despesa
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
  location?: string; // Local/pessoa da despesa
  paid?: boolean; // Status de pagamento
  // Installment fields
  isInstallment?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroup?: string; // To group related installments
  dueDate?: string; // Individual due date for each installment
  isCreditCard?: boolean; // Credit card flag
}

export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
  notes: string;
  createdAt: string;
  location?: string; // Local/pessoa da receita
  account?: string; // Conta que recebeu a receita
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface MonthlyData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'pt-BR' | 'en-US';
  currency: 'BRL' | 'USD';
}

export interface DailyAccountSummary {
  date: string;
  accounts: {
    [accountId: string]: {
      dailyExpenses: number;
      finalBalance: number;
    };
  };
  totalDailyBalance: number;
}

export interface FilterState {
  expenses: {
    category: string;
    account: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    installmentGroup: string;
  };
  income: {
    source: string;
    account: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate: string;
  };
  dailySummary: {
    startDate: string;
    endDate: string;
    visibleAccounts: string[];
    sortBy: 'date' | 'balance';
    sortOrder: 'asc' | 'desc';
  };
}