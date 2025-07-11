import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, PieChart, BarChart3 } from 'lucide-react';
import { useFinanceCalculations } from '../hooks/useFinanceCalculations';
import { useSettings } from '../context/SettingsContext';

const Dashboard: React.FC = () => {
  const {
    totalExpensesThisMonth,
    totalIncomeThisMonth,
    balanceThisMonth,
    totalUnpaidExpenses,
    expensesByCategory,
    monthlyTrend,
  } = useFinanceCalculations();

  const { formatCurrency, settings } = useSettings();

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
  }> = ({ title, value, icon, trend, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mr-1" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            {settings.language === 'pt-BR' ? 'vs. mês anterior' : 'vs. last month'}
          </span>
        </div>
      )}
    </div>
  );

  const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / totalExpensesThisMonth) * 100,
  }));

  const labels = {
    title: settings.language === 'pt-BR' ? 'Dashboard' : 'Dashboard',
    subtitle: settings.language === 'pt-BR' ? 'Visão geral da sua atividade financeira' : 'Overview of your financial activity',
    totalIncome: settings.language === 'pt-BR' ? 'Total de Receitas' : 'Total Income',
    totalExpenses: settings.language === 'pt-BR' ? 'Total de Despesas' : 'Total Expenses',
    balance: settings.language === 'pt-BR' ? 'Saldo' : 'Balance',
    unpaidExpenses: settings.language === 'pt-BR' ? 'Despesas Não Pagas' : 'Unpaid Expenses',
    expensesByCategory: settings.language === 'pt-BR' ? 'Despesas por Categoria' : 'Expenses by Category',
    monthlyTrend: settings.language === 'pt-BR' ? 'Tendência Mensal' : 'Monthly Trend',
    income: settings.language === 'pt-BR' ? 'Receitas' : 'Income',
    expenses: settings.language === 'pt-BR' ? 'Despesas' : 'Expenses',
    alertMessage: settings.language === 'pt-BR' ? 
      `Suas despesas excedem suas receitas este mês em ${formatCurrency(Math.abs(balanceThisMonth))}` :
      `Your expenses exceed your income this month by ${formatCurrency(Math.abs(balanceThisMonth))}`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{labels.subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={labels.totalIncome}
          value={formatCurrency(totalIncomeThisMonth)}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          trend="up"
        />
        <StatCard
          title={labels.totalExpenses}
          value={formatCurrency(totalExpensesThisMonth)}
          icon={<TrendingDown className="w-6 h-6 text-red-600" />}
          trend="down"
        />
        <StatCard
          title={labels.balance}
          value={formatCurrency(balanceThisMonth)}
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          className={balanceThisMonth < 0 ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : ''}
        />
        <StatCard
          title={labels.unpaidExpenses}
          value={formatCurrency(totalUnpaidExpenses)}
          icon={<AlertCircle className="w-6 h-6 text-amber-600" />}
        />
      </div>

      {/* Alert for negative balance */}
      {balanceThisMonth < 0 && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 dark:text-red-300 font-medium">
              {labels.alertMessage}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{labels.expensesByCategory}</h2>
            <PieChart className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {categoryData.map(({ category, amount, percentage }) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{labels.monthlyTrend}</h2>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <div className="space-y-4">
            {monthlyTrend.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{month.month}</span>
                  <span className={`text-sm font-medium ${month.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.balance)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.income}</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((month.totalIncome / Math.max(...monthlyTrend.map(m => m.totalIncome))) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatCurrency(month.totalIncome)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{labels.expenses}</div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((month.totalExpenses / Math.max(...monthlyTrend.map(m => m.totalExpenses))) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatCurrency(month.totalExpenses)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;