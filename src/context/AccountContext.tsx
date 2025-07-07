import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AccountContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Check Supabase connection
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.from('accounts').select('count').limit(1);
        if (!error) {
          setIsSupabaseConnected(true);
          console.log('✅ Supabase conectado para contas');
        } else {
          setIsSupabaseConnected(false);
          console.log('❌ Supabase desconectado para contas:', error.message);
        }
      } catch (error) {
        setIsSupabaseConnected(false);
        console.log('❌ Erro ao verificar conexão Supabase para contas:', error);
      }
    };

    checkSupabaseConnection();
  }, []);

  useEffect(() => {
    const savedAccounts = localStorage.getItem('finance-accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      // Contas padrão baseadas nos métodos de pagamento
      const defaultAccounts: Account[] = [
        { id: '1', name: 'Viacredi - Tatiane', initialBalance: 0, createdAt: new Date().toISOString() },
        { id: '2', name: 'Viacredi - Dirceu', initialBalance: 0, createdAt: new Date().toISOString() },
        { id: '3', name: 'Mercado Pago', initialBalance: 0, createdAt: new Date().toISOString() },
        { id: '4', name: 'Carteira - Tatiane', initialBalance: 0, createdAt: new Date().toISOString() },
        { id: '5', name: 'Carteira - Dirceu', initialBalance: 0, createdAt: new Date().toISOString() },
        { id: '6', name: 'UtilAlimentação', initialBalance: 0, createdAt: new Date().toISOString() },
      ];
      setAccounts(defaultAccounts);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finance-accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Helper function to get current user ID

  // Helper function to sync to Supabase
  const syncToSupabase = async (data: any) => {
    if (!isSupabaseConnected) return;
    
    try {
      const { error } = await supabase.from('accounts').upsert(data);
      if (error) {
        console.error('❌ Erro ao sincronizar conta:', error);
      } else {
        console.log('✅ Conta sincronizada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização da conta:', error);
    }
  };

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAccount]);

    // Sync to Supabase immediately
    await syncToSupabase({
      id: newAccount.id,
      name: newAccount.name,
      initial_balance: newAccount.initialBalance,
      user_id: currentUser.id,
      created_at: newAccount.createdAt,
    });
  };

  const updateAccount = async (id: string, updatedAccount: Partial<Account>) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updatedAccount } : account
    ));

    // Find the updated account and sync to Supabase
    const account = accounts.find(a => a.id === id);
    if (account && isSupabaseConnected) {
      const updatedData = { ...account, ...updatedAccount };
      await syncToSupabase({
        id: updatedData.id,
        name: updatedData.name,
        initial_balance: updatedData.initialBalance,
        user_id: currentUser.id,
        created_at: updatedData.createdAt,
      });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setAccounts(prev => prev.filter(account => account.id !== id));

    // Delete from Supabase
    if (isSupabaseConnected) {
      try {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) {
          console.error('❌ Erro ao deletar conta do Supabase:', error);
        } else {
          console.log('✅ Conta deletada do Supabase');
        }
      } catch (error) {
        console.error('❌ Erro na deleção da conta:', error);
      }
    }
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        addAccount,
        updateAccount,
        deleteAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};