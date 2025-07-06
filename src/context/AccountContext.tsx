import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '../types';

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
  const [accounts, setAccounts] = useState<Account[]>([]);

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

  const addAccount = (account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, updatedAccount: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updatedAccount } : account
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
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