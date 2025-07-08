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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
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

  // Buscar dados do Supabase quando o usuário estiver autenticado
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setExpenses([]);
        setIncome([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Buscar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true });

        if (categoriesError) {
          console.error('❌ Erro ao buscar categorias:', categoriesError);
        } else {
          const mappedCategories: Category[] = categoriesData.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type as 'income' | 'expense',
            createdAt: cat.created_at,
          }));
          setCategories(mappedCategories);
          console.log('✅ Categorias carregadas:', mappedCategories.length);
        }

        // Buscar despesas
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (expensesError) {
          console.error('❌ Erro ao buscar despesas:', expensesError);
        } else {
          const mappedExpenses: Expense[] = expensesData.map(exp => ({
            id: exp.id,
            date: exp.date,
            category: exp.category,
            description: exp.description,
            amount: parseFloat(exp.amount.toString()),
            paymentMethod: exp.payment_method,
            location: exp.location,
            paid: exp.paid,
            isInstallment: exp.is_installment,
            installmentNumber: exp.installment_number,
            totalInstallments: exp.total_installments,
            installmentGroup: exp.installment_group,
            dueDate: exp.due_date,
            isCreditCard: exp.is_credit_card,
            createdAt: exp.created_at,
          }));
          setExpenses(mappedExpenses);
          console.log('✅ Despesas carregadas:', mappedExpenses.length);
        }

        // Buscar receitas
        const { data: incomeData, error: incomeError } = await supabase
          .from('income')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (incomeError) {
          console.error('❌ Erro ao buscar receitas:', incomeError);
        } else {
          const mappedIncome: Income[] = incomeData.map(inc => ({
            id: inc.id,
            date: inc.date,
            source: inc.source,
            amount: parseFloat(inc.amount.toString()),
            notes: inc.notes,
            location: inc.location,
            account: inc.account,
            createdAt: inc.created_at,
          }));
          setIncome(mappedIncome);
          console.log('✅ Receitas carregadas:', mappedIncome.length);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: expense.date,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          payment_method: expense.paymentMethod,
          location: expense.location || null,
          paid: expense.paid || false,
          is_installment: expense.isInstallment || false,
          installment_number: expense.installmentNumber || null,
          total_installments: expense.totalInstallments || null,
          installment_group: expense.installmentGroup || null,
          due_date: expense.dueDate || null,
          is_credit_card: expense.isCreditCard || false,
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar despesa:', error);
        return;
      }

      const newExpense: Expense = {
        id: data.id,
        date: data.date,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        paymentMethod: data.payment_method,
        location: data.location,
        paid: data.paid,
        isInstallment: data.is_installment,
        installmentNumber: data.installment_number,
        totalInstallments: data.total_installments,
        installmentGroup: data.installment_group,
        dueDate: data.due_date,
        isCreditCard: data.is_credit_card,
        createdAt: data.created_at,
      };

      setExpenses(prev => [newExpense, ...prev]);
      console.log('✅ Despesa adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar despesa:', error);
    }
  };

  const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('income')
        .insert({
          date: income.date,
          source: income.source,
          amount: income.amount,
          notes: income.notes || '',
          location: income.location || null,
          account: income.account || null,
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar receita:', error);
        return;
      }

      const newIncome: Income = {
        id: data.id,
        date: data.date,
        source: data.source,
        amount: parseFloat(data.amount.toString()),
        notes: data.notes,
        location: data.location,
        account: data.account,
        createdAt: data.created_at,
      };

      setIncome(prev => [newIncome, ...prev]);
      console.log('✅ Receita adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar receita:', error);
    }
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          type: category.type,
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar categoria:', error);
        return;
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        createdAt: data.created_at,
      };

      setCategories(prev => [...prev, newCategory]);
      console.log('✅ Categoria adicionada');
    } catch (error) {
      console.error('❌ Erro ao adicionar categoria:', error);
    }
  };

  const updateExpense = async (id: string, updatedExpense: Partial<Expense>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const updateData: any = {};
      if (updatedExpense.date !== undefined) updateData.date = updatedExpense.date;
      if (updatedExpense.category !== undefined) updateData.category = updatedExpense.category;
      if (updatedExpense.description !== undefined) updateData.description = updatedExpense.description;
      if (updatedExpense.amount !== undefined) updateData.amount = updatedExpense.amount;
      if (updatedExpense.paymentMethod !== undefined) updateData.payment_method = updatedExpense.paymentMethod;
      if (updatedExpense.location !== undefined) updateData.location = updatedExpense.location;
      if (updatedExpense.paid !== undefined) updateData.paid = updatedExpense.paid;
      if (updatedExpense.isCreditCard !== undefined) updateData.is_credit_card = updatedExpense.isCreditCard;
      if (updatedExpense.dueDate !== undefined) updateData.due_date = updatedExpense.dueDate;

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao atualizar despesa:', error);
        return;
      }

      setExpenses(prev => prev.map(expense => 
        expense.id === id ? { ...expense, ...updatedExpense } : expense
      ));
      console.log('✅ Despesa atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar despesa:', error);
    }
  };

  const updateIncome = async (id: string, updatedIncome: Partial<Income>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const updateData: any = {};
      if (updatedIncome.date !== undefined) updateData.date = updatedIncome.date;
      if (updatedIncome.source !== undefined) updateData.source = updatedIncome.source;
      if (updatedIncome.amount !== undefined) updateData.amount = updatedIncome.amount;
      if (updatedIncome.notes !== undefined) updateData.notes = updatedIncome.notes;
      if (updatedIncome.location !== undefined) updateData.location = updatedIncome.location;
      if (updatedIncome.account !== undefined) updateData.account = updatedIncome.account;

      const { error } = await supabase
        .from('income')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao atualizar receita:', error);
        return;
      }

      setIncome(prev => prev.map(income => 
        income.id === id ? { ...income, ...updatedIncome } : income
      ));
      console.log('✅ Receita atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar receita:', error);
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<Category>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const updateData: any = {};
      if (updatedCategory.name !== undefined) updateData.name = updatedCategory.name;
      if (updatedCategory.type !== undefined) updateData.type = updatedCategory.type;

      const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao atualizar categoria:', error);
        return;
      }

      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...updatedCategory } : category
      ));
      console.log('✅ Categoria atualizada');
    } catch (error) {
      console.error('❌ Erro ao atualizar categoria:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao deletar despesa:', error);
        return;
      }

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      console.log('✅ Despesa deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar despesa:', error);
    }
  };

  const deleteIncome = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao deletar receita:', error);
        return;
      }

      setIncome(prev => prev.filter(income => income.id !== id));
      console.log('✅ Receita deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar receita:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Erro ao deletar categoria:', error);
        return;
      }

      setCategories(prev => prev.filter(category => category.id !== id));
      console.log('✅ Categoria deletada');
    } catch (error) {
      console.error('❌ Erro ao deletar categoria:', error);
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
        isLoading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};