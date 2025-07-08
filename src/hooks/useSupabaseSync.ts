import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAccounts } from '../context/AccountContext';

export const useSupabaseSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const { currentUser, authToken } = useAuth();
  const { expenses, income, categories } = useFinance();
  const { accounts } = useAccounts();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection status on mount
    validateConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [authToken]);

  const validateConnection = async (): Promise<boolean> => {
    setConnectionStatus('checking');
    try {
      // Verificar se o token está presente
      if (!authToken) {
        console.warn('⚠️ Token de autenticação não encontrado - usuário não autenticado');
        setConnectionStatus('disconnected');
        return false;
      }

      // Verificar conexão com Supabase
      const { data, error } = await supabase.from('categories').select('count').limit(1);
      
      if (error) {
        console.error('❌ Erro na conexão com Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setConnectionStatus('disconnected');
        return false;
      }

      console.log('✅ Conexão com Supabase validada');
      setConnectionStatus('connected');
      return true;
    } catch (error: any) {
      console.error('❌ Erro na validação da conexão:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack
      });
      setConnectionStatus('disconnected');
      return false;
    }
  };

  const syncToSupabase = async (): Promise<boolean> => {
    try {
      if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      console.log('🔄 Iniciando sincronização para Supabase...');

      // Sincronizar categorias
      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert({
            id: category.id,
            name: category.name,
            type: category.type,
            user_id: currentUser.id,
            created_at: category.createdAt,
          });

        if (error) {
          console.error('❌ Erro ao sincronizar categoria:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            category: category.name
          });
          throw error;
        }
      }

      // Sincronizar contas
      for (const account of accounts) {
        const { error } = await supabase
          .from('accounts')
          .upsert({
            id: account.id,
            name: account.name,
            initial_balance: account.initialBalance,
            user_id: currentUser.id,
            created_at: account.createdAt,
          });

        if (error) {
          console.error('❌ Erro ao sincronizar conta:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            account: account.name
          });
          throw error;
        }
      }

      // Sincronizar despesas
      for (const expense of expenses) {
        const { error } = await supabase
          .from('expenses')
          .upsert({
            id: expense.id,
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
            created_at: expense.createdAt,
          });

        if (error) {
          console.error('❌ Erro ao sincronizar despesa:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            expense: expense.description
          });
          throw error;
        }
      }

      // Sincronizar receitas
      for (const incomeItem of income) {
        const { error } = await supabase
          .from('income')
          .upsert({
            id: incomeItem.id,
            date: incomeItem.date,
            source: incomeItem.source,
            amount: incomeItem.amount,
            notes: incomeItem.notes || '',
            location: incomeItem.location || null,
            account: incomeItem.account || null,
            user_id: currentUser.id,
            created_at: incomeItem.createdAt,
          });

        if (error) {
          console.error('❌ Erro ao sincronizar receita:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            income: incomeItem.source
          });
          throw error;
        }
      }

      console.log('✅ Sincronização para Supabase concluída');
      return true;
    } catch (error: any) {
      console.error('❌ Erro na sincronização para Supabase:', {
        message: error?.message || 'Erro desconhecido',
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      return false;
    }
  };

  const syncFromSupabase = async (): Promise<boolean> => {
    try {
      if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      console.log('🔄 Iniciando sincronização do Supabase...');

      // Buscar dados do usuário específico
      const { data: userData, error: userError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id);

      if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', {
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        });
        throw userError;
      }

      console.log('✅ Dados do usuário encontrados:', userData?.length || 0, 'registros');
      return true;
    } catch (error: any) {
      console.error('❌ Erro na sincronização do Supabase:', {
        message: error?.message || 'Erro desconhecido',
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      return false;
    }
  };

  const syncData = async () => {
    if (!isOnline || !currentUser) {
      console.log('⚠️ Sincronização cancelada: offline ou usuário não autenticado');
      return;
    }

    setSyncStatus('syncing');
    
    try {
      // 1. Validar conexão e autenticação
      const isConnected = await validateConnection();
      if (!isConnected) {
        throw new Error('Falha na validação da conexão');
      }

      // 2. Sincronizar dados locais para Supabase
      const uploadSuccess = await syncToSupabase();
      if (!uploadSuccess) {
        throw new Error('Falha no upload dos dados');
      }

      // 3. Sincronizar dados do Supabase para local
      const downloadSuccess = await syncFromSupabase();
      if (!downloadSuccess) {
        throw new Error('Falha no download dos dados');
      }

      setLastSyncTime(new Date());
      setSyncStatus('success');
      console.log('🎉 Sincronização completa realizada com sucesso!');
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack
      });
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  return {
    isOnline,
    syncStatus,
    lastSyncTime,
    connectionStatus,
    syncData,
    validateConnection,
  };
};