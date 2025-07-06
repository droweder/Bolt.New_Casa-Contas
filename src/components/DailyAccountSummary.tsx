import React, { useMemo, useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter, Eye, EyeOff, ArrowUpDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAccounts } from '../context/AccountContext';
import { useSettings } from '../context/SettingsContext';
import { DailyAccountSummary as DailyAccountSummaryType } from '../types';

const DailyAccountSummary: React.FC = () => {
  const { expenses, income, filters, updateFilters } = useFinance();
  const { accounts } = useAccounts();
  const { formatCurrency, formatDate } = useSettings();

  const dailySummaries = useMemo(() => {
    const summaries: DailyAccountSummaryType[] = [];
    const startDate = new Date(filters.dailySummary.startDate);
    const endDate = new Date(filters.dailySummary.endDate);

    // Gerar todas as datas no intervalo
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const dailySummary: DailyAccountSummaryType = {
        date: dateStr,
        accounts: {},
        totalDailyBalance: 0,
      };

      // Para cada conta, calcular despesas do dia e saldo final
      accounts.forEach(account => {
        // Despesas do dia para esta conta - usar dueDate se disponível
        const dailyExpenses = expenses
          .filter(expense => 
            (expense.dueDate || expense.date) === dateStr && 
            (expense.paymentMethod === account.name || expense.paymentMethod?.includes(account.name))
          )
          .reduce((sum, expense) => sum + expense.amount, 0);

        // Receitas do dia para esta conta
        const dailyIncome = income
          .filter(incomeItem => 
            incomeItem.date === dateStr && 
            (incomeItem.source === account.name || incomeItem.notes?.includes(account.name))
          )
          .reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

        // Calcular saldo acumulado até esta data
        const previousExpenses = expenses
          .filter(expense => 
            (expense.dueDate || expense.date) <= dateStr && 
            (expense.paymentMethod === account.name || expense.paymentMethod?.includes(account.name))
          )
          .reduce((sum, expense) => sum + expense.amount, 0);

        const previousIncome = income
          .filter(incomeItem => 
            incomeItem.date <= dateStr && 
            (incomeItem.source === account.name || incomeItem.notes?.includes(account.name))
          )
          .reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

        const finalBalance = account.initialBalance + previousIncome - previousExpenses;

        dailySummary.accounts[account.id] = {
          dailyExpenses,
          finalBalance,
        };
      });

      // Calcular saldo total do dia
      dailySummary.totalDailyBalance = Object.values(dailySummary.accounts)
        .reduce((sum, accountData) => sum + accountData.finalBalance, 0);

      summaries.push(dailySummary);
    }

    // Aplicar ordenação
    summaries.sort((a, b) => {
      if (filters.dailySummary.sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return filters.dailySummary.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return filters.dailySummary.sortOrder === 'asc' 
          ? a.totalDailyBalance - b.totalDailyBalance 
          : b.totalDailyBalance - a.totalDailyBalance;
      }
    });

    return summaries;
  }, [expenses, income, accounts, filters.dailySummary]);

  // Filtrar contas visíveis
  const visibleAccounts = accounts.filter(account => 
    filters.dailySummary.visibleAccounts.length === 0 || 
    filters.dailySummary.visibleAccounts.includes(account.id)
  );

  const toggleAccountVisibility = (accountId: string) => {
    const currentVisible = filters.dailySummary.visibleAccounts;
    const newVisible = currentVisible.includes(accountId)
      ? currentVisible.filter(id => id !== accountId)
      : [...currentVisible, accountId];
    
    updateFilters('dailySummary', { visibleAccounts: newVisible });
  };

  const toggleSort = (sortBy: 'date' | 'balance') => {
    const newOrder = filters.dailySummary.sortBy === sortBy && filters.dailySummary.sortOrder === 'desc' ? 'asc' : 'desc';
    updateFilters('dailySummary', { sortBy, sortOrder: newOrder });
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumo Diário das Contas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Visão geral diária do movimento financeiro por conta</p>
          </div>
          
          {/* Filtros de Data */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={filters.dailySummary.startDate}
                onChange={(e) => updateFilters('dailySummary', { startDate: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={filters.dailySummary.endDate}
                onChange={(e) => updateFilters('dailySummary', { endDate: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Total Atual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dailySummaries[0]?.totalDailyBalance || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Período</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dailySummaries.length} dias</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Visibilidade e Ordenação */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contas Visíveis</h3>
            <div className="flex flex-wrap gap-2">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => toggleAccountVisibility(account.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.dailySummary.visibleAccounts.length === 0 || filters.dailySummary.visibleAccounts.includes(account.id)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {filters.dailySummary.visibleAccounts.length === 0 || filters.dailySummary.visibleAccounts.includes(account.id) ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {account.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ordenação</h3>
            <div className="flex gap-2">
              <button
                onClick={() => toggleSort('date')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.dailySummary.sortBy === 'date'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Data {filters.dailySummary.sortBy === 'date' && (filters.dailySummary.sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleSort('balance')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.dailySummary.sortBy === 'balance'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                Saldo {filters.dailySummary.sortBy === 'balance' && (filters.dailySummary.sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Resumo Diário */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-700">
                  Data
                </th>
                {visibleAccounts.map(account => (
                  <th key={account.id} className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white min-w-[200px]" colSpan={2}>
                    {account.name}
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white min-w-[140px] bg-blue-50 dark:bg-blue-900">
                  Saldo Total Diário
                </th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="py-2 px-4 sticky left-0 bg-gray-50 dark:bg-gray-700"></th>
                {visibleAccounts.map(account => (
                  <React.Fragment key={account.id}>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Saída</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">Saldo</th>
                  </React.Fragment>
                ))}
                <th className="py-2 px-4 bg-blue-50 dark:bg-blue-900"></th>
              </tr>
            </thead>
            <tbody>
              {dailySummaries.map((summary, index) => (
                <tr key={summary.date} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${index === 0 ? 'bg-blue-25 dark:bg-blue-900/10' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(summary.date)}
                    </div>
                  </td>
                  {visibleAccounts.map(account => {
                    const accountData = summary.accounts[account.id];
                    return (
                      <React.Fragment key={account.id}>
                        <td className="py-3 px-4 text-red-600 dark:text-red-400">
                          {accountData?.dailyExpenses > 0 ? formatCurrency(accountData.dailyExpenses) : '-'}
                        </td>
                        <td className={`py-3 px-4 font-medium ${
                          (accountData?.finalBalance || 0) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(accountData?.finalBalance || 0)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className={`py-3 px-4 font-bold text-lg bg-blue-50 dark:bg-blue-900/20 ${
                    summary.totalDailyBalance >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(summary.totalDailyBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {dailySummaries.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAccountSummary;