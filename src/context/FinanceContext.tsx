import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, Income, Category } from '../types';
import { formatDateForStorage } from '../utils/dateUtils';

interface FinanceContextType {
  expenses: Expense[];
  income: Income[];
  categories: Category[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  filters: {
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
      description: string;
      location: string;
      startDate: string;
      endDate: string;
    };
  };
  updateFilters: (type: 'expenses' | 'income', filters: any) => void;
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Alimentação', type: 'expense', color: '#ef4444' },
  { id: '2', name: 'Transporte', type: 'expense', color: '#f97316' },
  { id: '3', name: 'Moradia', type: 'expense', color: '#eab308' },
  { id: '4', name: 'Saúde', type: 'expense', color: '#22c55e' },
  { id: '5', name: 'Educação', type: 'expense', color: '#3b82f6' },
  { id: '6', name: 'Lazer', type: 'expense', color: '#8b5cf6' },
  { id: '7', name: 'Salário', type: 'income', color: '#10b981' },
  { id: '8', name: 'Freelance', type: 'income', color: '#06b6d4' },
  { id: '9', name: 'Investimentos', type: 'income', color: '#8b5cf6' },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('financeExpenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [income, setIncome] = useState<Income[]>(() => {
    const saved = localStorage.getItem('financeIncome');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('financeCategories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  const [filters, setFilters] = useState({
    expenses: {
      category: '',
      account: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      installmentGroup: '',
    },
    income: {
      source: '',
      account: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    localStorage.setItem('financeExpenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('financeIncome', JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem('financeCategories', JSON.stringify(categories));
  }, [categories]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: formatDateForStorage(expense.date),
      dueDate: expense.dueDate ? formatDateForStorage(expense.dueDate) : undefined,
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const updateExpense = (id: string, expense: Partial<Expense>) => {
    setExpenses(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            ...expense,
            date: expense.date ? formatDateForStorage(expense.date) : item.date,
            dueDate: expense.dueDate ? formatDateForStorage(expense.dueDate) : item.dueDate,
          }
        : item
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  const addIncome = (incomeItem: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...incomeItem,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: formatDateForStorage(incomeItem.date),
    };
    setIncome(prev => [...prev, newIncome]);
  };

  const updateIncome = (id: string, incomeItem: Partial<Income>) => {
    setIncome(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            ...incomeItem,
            date: incomeItem.date ? formatDateForStorage(incomeItem.date) : item.date,
          }
        : item
    ));
  };

  const deleteIncome = (id: string) => {
    setIncome(prev => prev.filter(item => item.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    setCategories(prev => prev.map(item => 
      item.id === id ? { ...item, ...category } : item
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id));
  };

  const updateFilters = (type: 'expenses' | 'income', newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: { ...prev[type], ...newFilters }
    }));
  };

  return (
    <FinanceContext.Provider value={{
      expenses,
      income,
      categories,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      updateIncome,
      deleteIncome,
      addCategory,
      updateCategory,
      deleteCategory,
      filters,
      updateFilters,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};