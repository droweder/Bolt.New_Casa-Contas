import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AccountProvider } from './context/AccountContext';
import { FinanceProvider } from './context/FinanceContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import IncomeList from './components/IncomeList';
import Settings from './components/Settings';
import DailyAccountSummary from './components/DailyAccountSummary';
import Login from './components/Login';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'expenses':
        return <ExpenseList />;
      case 'income':
        return <IncomeList />;
      case 'daily-summary':
        return <DailyAccountSummary />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main>{renderContent()}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AccountProvider>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </AccountProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;