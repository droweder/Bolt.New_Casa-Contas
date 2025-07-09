import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'pt-BR', // Fixed to Brazilian Portuguese
    currency: 'BRL', // Fixed to Brazilian Real
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('finance-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Ensure language and currency are always set to Brazilian defaults
      setSettings({
        ...parsed,
        language: 'pt-BR',
        currency: 'BRL',
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('finance-settings', JSON.stringify(settings));
    
    // Aplicar tema
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    // Prevent changing language and currency
    const filteredSettings = { ...newSettings };
    delete filteredSettings.language;
    delete filteredSettings.currency;
    
    setSettings(prev => ({ 
      ...prev, 
      ...filteredSettings,
      language: 'pt-BR', // Always Brazilian Portuguese
      currency: 'BRL', // Always Brazilian Real
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};