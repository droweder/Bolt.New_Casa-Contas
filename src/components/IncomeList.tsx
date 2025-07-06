import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, DollarSign, Filter, Search } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { Income } from '../types';
import IncomeForm from './IncomeForm';

const IncomeList: React.FC = () => {
  const { income, deleteIncome, categories, filters, updateFilters } = useFinance();
  const { formatCurrency, formatDate, settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const filteredIncome = income.filter(incomeItem => {
    const incomeFilters = filters.income;
    if (incomeFilters.source && incomeItem.source !== incomeFilters.source) return false;
    if (incomeFilters.startDate && incomeItem.date < incomeFilters.startDate) return false;
    if (incomeFilters.endDate && incomeItem.date > incomeFilters.endDate) return false;
    if (incomeFilters.account && incomeItem.account !== incomeFilters.account) return false;
    if (incomeFilters.description && !incomeItem.notes?.toLowerCase().includes(incomeFilters.description.toLowerCase())) return false;
    if (incomeFilters.location && !incomeItem.location?.toLowerCase().includes(incomeFilters.location.toLowerCase())) return false;
    return true;
  });

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      deleteIncome(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingIncome(null);
  };

  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0);
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const labels = {
    title: 'Receitas',
    subtitle: 'Acompanhe suas fontes de receita',
    add: 'Adicionar Receita',
    totalIncome: 'Total de Receitas',
    filters: 'Filtros',
    category: 'Categoria',
    allCategories: 'Todas as Categorias',
    startDate: 'Data Inicial',
    endDate: 'Data Final',
    account: 'Conta',
    allAccounts: 'Todas as Contas',
    date: 'Data',
    amount: 'Valor',
    location: 'Local/Pessoa',
    description: 'Descrição',
    installments: 'Parcelas',
    actions: 'Ações',
    noRecords: 'Nenhuma receita encontrada.',
    search: 'Buscar...',
  };

  // Get unique sources and accounts for filters
  const uniqueSources = [...new Set(income.map(item => item.source))];
  const uniqueAccounts = [...new Set(income.map(item => item.account).filter(Boolean))];

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{labels.subtitle}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {labels.add}
          </button>
        </div>
      </div>

      {/* Total Income Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">{labels.totalIncome}</p>
            <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-3 bg-green-400 bg-opacity-30 rounded-lg">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{labels.filters}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.category}</label>
            <select
              value={filters.income.source}
              onChange={(e) => updateFilters('income', { source: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{labels.allCategories}</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.account}</label>
            <select
              value={filters.income.account}
              onChange={(e) => updateFilters('income', { account: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{labels.allAccounts}</option>
              {uniqueAccounts.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.description}</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.income.description || ''}
                onChange={(e) => updateFilters('income', { description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder={labels.search}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.location}</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.income.location || ''}
                onChange={(e) => updateFilters('income', { location: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                placeholder={labels.search}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.startDate}</label>
            <input
              type="date"
              value={filters.income.startDate}
              onChange={(e) => updateFilters('income', { startDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.endDate}</label>
            <input
              type="date"
              value={filters.income.endDate}
              onChange={(e) => updateFilters('income', { endDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Income List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.category}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.location}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.description}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.amount}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.account}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.installments}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.date}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncome.map((incomeItem) => (
                <tr key={incomeItem.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      {incomeItem.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {incomeItem.location || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {incomeItem.notes || '-'}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {formatCurrency(incomeItem.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {incomeItem.account || '-'}
                  </td>
                  <td className="py-3 px-4">
                    -
                  </td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(incomeItem.date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(incomeItem)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(incomeItem.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredIncome.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {labels.noRecords}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <IncomeForm
          income={editingIncome}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default IncomeList;