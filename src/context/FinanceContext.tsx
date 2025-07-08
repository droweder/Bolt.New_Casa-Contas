import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, Income, Category, FilterState } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
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

  // Check Supabase connection
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('count').limit(1);
        if (!error) {
          setIsSupabaseConnected(true);
          console.log('✅ Supabase conectado');
        } else {
          setIsSupabaseConnected(false);
          console.log('❌ Supabase desconectado:', error.message);
        }
      } catch (error) {
        setIsSupabaseConnected(false);
        console.log('❌ Erro ao verificar conexão Supabase:', error);
      }
    };

    checkSupabaseConnection();
  }, []);

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

  // Helper function to get current user ID

  // Helper function to sync to Supabase
  const syncToSupabase = async (table: string, data: any) => {
    if (!isSupabaseConnected) return;
    
    try {
      const { error } = await supabase.from(table).upsert(data);
      if (error) {
        console.error(`❌ Erro ao sincronizar ${table}:`, error);
      } else {
        console.log(`✅ ${table} sincronizado com sucesso`);
      }
    } catch (error) {
      console.error(`❌ Erro na sincronização ${table}:`, error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);

    // Sync to Supabase immediately
    await syncToSupabase('expenses', {
      id: newExpense.id,
      date: newExpense.date,
      category: newExpense.category,
      description: newExpense.description,
      amount: newExpense.amount,
      payment_method: newExpense.paymentMethod,
      location: newExpense.location || null,
      paid: newExpense.paid || false,
      is_installment: newExpense.isInstallment || false,
      installment_number: newExpense.installmentNumber || null,
      total_installments: newExpense.totalInstallments || null,
      installment_group: newExpense.installmentGroup || null,
      due_date: newExpense.dueDate || null,
      is_credit_card: newExpense.isCreditCard || false,
      user_id: currentUser.id,
      created_at: newExpense.createdAt,
    });
  };

  const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setIncome(prev => [...prev, newIncome]);

    // Sync to Supabase immediately
    await syncToSupabase('income', {
      id: newIncome.id,
      date: newIncome.date,
      source: newIncome.source,
      amount: newIncome.amount,
      notes: newIncome.notes || '',
      location: newIncome.location || null,
      account: newIncome.account || null,
      user_id: currentUser.id,
      created_at: newIncome.createdAt,
    });
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCategories(prev => [...prev, newCategory]);

    // Sync to Supabase immediately
    await syncToSupabase('categories', {
      id: newCategory.id,
      name: newCategory.name,
      type: newCategory.type,
      user_id: currentUser.id,
      created_at: newCategory.createdAt,
    });
  };

  const updateExpense = async (id: string, updatedExpense: Partial<Expense>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updatedExpense } : expense
    ));

    // Find the updated expense and sync to Supabase
    const expense = expenses.find(e => e.id === id);
    if (expense && isSupabaseConnected) {
      const updatedData = { ...expense, ...updatedExpense };
      await syncToSupabase('expenses', {
        id: updatedData.id,
        date: updatedData.date,
        category: updatedData.category,
        description: updatedData.description,
        amount: updatedData.amount,
        payment_method: updatedData.paymentMethod,
        location: updatedData.location || null,
        paid: updatedData.paid || false,
        is_installment: updatedData.isInstallment || false,
        installment_number: updatedData.installmentNumber || null,
        total_installments: updatedData.totalInstallments || null,
        installment_group: updatedData.installmentGroup || null,
        due_date: updatedData.dueDate || null,
        is_credit_card: updatedData.isCreditCard || false,
        user_id: currentUser.id,
        created_at: updatedData.createdAt,
      });
    }
  };

  const updateIncome = async (id: string, updatedIncome: Partial<Income>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setIncome(prev => prev.map(income => 
      income.id === id ? { ...income, ...updatedIncome } : income
    ));

    // Find the updated income and sync to Supabase
    const incomeItem = income.find(i => i.id === id);
    if (incomeItem && isSupabaseConnected) {
      const updatedData = { ...incomeItem, ...updatedIncome };
      await syncToSupabase('income', {
        id: updatedData.id,
        date: updatedData.date,
        source: updatedData.source,
        amount: updatedData.amount,
        notes: updatedData.notes || '',
        location: updatedData.location || null,
        account: updatedData.account || null,
        user_id: currentUser.id,
        created_at: updatedData.createdAt,
      });
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<Category>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updatedCategory } : category
    ));

    // Find the updated category and sync to Supabase
    const category = categories.find(c => c.id === id);
    if (category && isSupabaseConnected) {
      const updatedData = { ...category, ...updatedCategory };
      await syncToSupabase('categories', {
        id: updatedData.id,
        name: updatedData.name,
        type: updatedData.type,
        user_id: currentUser.id,
        created_at: updatedData.createdAt,
      });
    }
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setExpenses(prev => prev.filter(expense => expense.id !== id));

    // Delete from Supabase
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
          console.error('❌ Erro ao deletar despesa do Supabase:', error);
        } else {
          console.log('✅ Despesa deletada do Supabase');
        }
      } catch (error) {
        console.error('❌ Erro na deleção:', error);
      }
    }
  };

  const deleteIncome = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setIncome(prev => prev.filter(income => income.id !== id));

    // Delete from Supabase
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.from('income').delete().eq('id', id);
        if (error) {
          console.error('❌ Erro ao deletar receita do Supabase:', error);
        } else {
          console.log('✅ Receita deletada do Supabase');
        }
      } catch (error) {
        console.error('❌ Erro na deleção:', error);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setCategories(prev => prev.filter(category => category.id !== id));

    // Delete from Supabase
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) {
          console.error('❌ Erro ao deletar categoria do Supabase:', error);
        } else {
          console.log('✅ Categoria deletada do Supabase');
        }
      } catch (error) {
        console.error('❌ Erro na deleção:', error);
      }
    }
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