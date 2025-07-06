import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, Income, Category, FilterState } from '../types';

interface FinanceContextType {
  expenses: Expense[];
  income: Income[];
  categories: Category[];
  filters: FilterState;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteExpense: (id: string) => void;
  deleteIncome: (id: string) => void;
  deleteCategory: (id: string) => void;
  updateFilters: (section: keyof FilterState, newFilters: Partial<FilterState[keyof FilterState]>) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterState>({
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
      startDate: '',
      endDate: '',
    },
    dailySummary: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      visibleAccounts: [],
      sortBy: 'date',
      sortOrder: 'desc',
    },
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('finance-expenses');
    const savedIncome = localStorage.getItem('finance-income');
    const savedCategories = localStorage.getItem('finance-categories');
    const savedFilters = localStorage.getItem('finance-filters');

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    if (savedIncome) {
      setIncome(JSON.parse(savedIncome));
    }
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Initialize with default categories based on the Excel data
      const defaultCategories: Category[] = [
        // Expense categories from the Excel
        { id: '1', name: 'Serviços Mensais', type: 'expense', createdAt: new Date().toISOString() },
        { id: '2', name: 'Empréstimos', type: 'expense', createdAt: new Date().toISOString() },
        { id: '3', name: 'Holerite/Extras', type: 'expense', createdAt: new Date().toISOString() },
        { id: '4', name: 'Cuidados Pessoais/Saúde', type: 'expense', createdAt: new Date().toISOString() },
        { id: '5', name: 'Aplicações/Cotas/Retornos', type: 'expense', createdAt: new Date().toISOString() },
        { id: '6', name: 'Contribuição', type: 'expense', createdAt: new Date().toISOString() },
        { id: '7', name: 'Ressarcimento', type: 'expense', createdAt: new Date().toISOString() },
        { id: '8', name: 'Outros', type: 'expense', createdAt: new Date().toISOString() },
        { id: '9', name: 'Transferência', type: 'expense', createdAt: new Date().toISOString() },
        { id: '10', name: 'Presentes', type: 'expense', createdAt: new Date().toISOString() },
        { id: '11', name: 'Uso/Consumo/Alimentação', type: 'expense', createdAt: new Date().toISOString() },
        { id: '12', name: 'Food & Dining', type: 'expense', createdAt: new Date().toISOString() },
        { id: '13', name: 'Transport', type: 'expense', createdAt: new Date().toISOString() },
        { id: '14', name: 'Rent', type: 'expense', createdAt: new Date().toISOString() },
        { id: '15', name: 'Utilities', type: 'expense', createdAt: new Date().toISOString() },
        { id: '16', name: 'Entertainment', type: 'expense', createdAt: new Date().toISOString() },
        { id: '17', name: 'Healthcare', type: 'expense', createdAt: new Date().toISOString() },
        { id: '18', name: 'Shopping', type: 'expense', createdAt: new Date().toISOString() },
        
        // Income categories
        { id: '19', name: 'Salary', type: 'income', createdAt: new Date().toISOString() },
        { id: '20', name: 'Freelance', type: 'income', createdAt: new Date().toISOString() },
        { id: '21', name: 'Investment', type: 'income', createdAt: new Date().toISOString() },
        { id: '22', name: 'Serviços Mensais', type: 'income', createdAt: new Date().toISOString() },
        { id: '23', name: 'Holerite/Extras', type: 'income', createdAt: new Date().toISOString() },
        { id: '24', name: 'Aplicações/Cotas/Retornos', type: 'income', createdAt: new Date().toISOString() },
        { id: '25', name: 'Contribuição', type: 'income', createdAt: new Date().toISOString() },
        { id: '26', name: 'Ressarcimento', type: 'income', createdAt: new Date().toISOString() },
        { id: '27', name: 'Transferência', type: 'income', createdAt: new Date().toISOString() },
      ];
      setCategories(defaultCategories);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('finance-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('finance-income', JSON.stringify(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem('finance-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance-filters', JSON.stringify(filters));
  }, [filters]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const addIncome = (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setIncome(prev => [...prev, newIncome]);
  };

  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    ));
  };

  const updateIncome = (id: string, updatedIncome: Partial<Income>) => {
    setIncome(prev => prev.map(income => 
      income.id === id ? { ...income, ...updatedIncome } : income
    ));
  };

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updatedCategory } : category
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const deleteIncome = (id: string) => {
    setIncome(prev => prev.filter(income => income.id !== id));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  };

  const updateFilters = (section: keyof FilterState, newFilters: Partial<FilterState[keyof FilterState]>) => {
    setFilters(prev => ({
      ...prev,
      [section]: { ...prev[section], ...newFilters }
    }));
  };

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        income,
        categories,
        filters,
        addExpense,
        addIncome,
        addCategory,
        updateExpense,
        updateIncome,
        updateCategory,
        deleteExpense,
        deleteIncome,
        deleteCategory,
        updateFilters,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};