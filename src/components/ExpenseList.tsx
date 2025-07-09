import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Filter, Calendar, CreditCard, Link, Search, DollarSign } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { Expense } from '../types';
import ExpenseForm from './ExpenseForm';

const ExpenseList: React.FC = () => {
  const { expenses, categories, deleteExpense, filters, updateFilters } = useFinance();
  const { formatCurrency, formatDate, settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const filteredExpenses = expenses.filter(expense => {
    const expenseFilters = filters.expenses;
    if (expenseFilters.category && expense.category !== expenseFilters.category) return false;
    if (expenseFilters.account && expense.paymentMethod !== expenseFilters.account) return false;
    if (expenseFilters.description && !expense.description.toLowerCase().includes(expenseFilters.description.toLowerCase())) return false;
    if (expenseFilters.location && !expense.location?.toLowerCase().includes(expenseFilters.location.toLowerCase())) return false;
    if (expenseFilters.startDate && (expense.dueDate || expense.date) < expenseFilters.startDate) return false;
    if (expenseFilters.endDate && (expense.dueDate || expense.date) > expenseFilters.endDate) return false;
    if (expenseFilters.installmentGroup && expense.installmentGroup !== expenseFilters.installmentGroup) return false;
    return true;
  });

  // Group expenses by installment group
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    if (expense.isInstallment && expense.installmentGroup) {
      if (!acc[expense.installmentGroup]) {
        acc[expense.installmentGroup] = [];
      }
      acc[expense.installmentGroup].push(expense);
    } else {
      acc[expense.id] = [expense];
    }
    return acc;
  }, {} as Record<string, Expense[]>);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      deleteExpense(id);
    }
  };

  const handleDeleteInstallmentGroup = (installmentGroup: string) => {
    const groupExpenses = expenses.filter(e => e.installmentGroup === installmentGroup);
    if (window.confirm(`Tem certeza que deseja excluir todas as ${groupExpenses.length} parcelas?`)) {
      groupExpenses.forEach(expense => deleteExpense(expense.id));
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  // Get unique accounts for filter
  const uniqueAccounts = [...new Set(expenses.map(e => e.paymentMethod))];

  // Calculate total expenses
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const labels = {
    title: 'Despesas',
    subtitle: 'Acompanhe e gerencie suas despesas',
    add: 'Adicionar Despesa',
    totalExpenses: 'Total de Despesas',
    filters: 'Filtros',
    category: 'Categoria',
    allCategories: 'Todas as Categorias',
    account: 'Conta',
    allAccounts: 'Todas as Contas',
    description: 'Descrição',
    location: 'Local/Pessoa',
    startDate: 'Data Inicial',
    endDate: 'Data Final',
    amount: 'Valor',
    payment: 'Conta',
    dueDate: 'Vencimento',
    installment: 'Parcela',
    actions: 'Ações',
    noExpenses: 'Nenhuma despesa encontrada.',
    installments: 'parcelas',
    total: 'Total',
    creditCard: 'Cartão',
    search: 'Buscar...',
  };

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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {labels.add}
          </button>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">{labels.totalExpenses}</p>
            <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 bg-red-400 bg-opacity-30 rounded-lg">
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
              value={filters.expenses.category}
              onChange={(e) => updateFilters('expenses', { category: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{labels.allCategories}</option>
              {expenseCategories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.account}</label>
            <select
              value={filters.expenses.account}
              onChange={(e) => updateFilters('expenses', { account: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                value={filters.expenses.description}
                onChange={(e) => updateFilters('expenses', { description: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                value={filters.expenses.location}
                onChange={(e) => updateFilters('expenses', { location: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={labels.search}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.startDate}</label>
            <input
              type="date"
              value={filters.expenses.startDate}
              onChange={(e) => updateFilters('expenses', { startDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{labels.endDate}</label>
            <input
              type="date"
              value={filters.expenses.endDate}
              onChange={(e) => updateFilters('expenses', { endDate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.category}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.location}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.description}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.amount}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.payment}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.installment}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.dueDate}</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedExpenses).map(([groupId, groupExpenses]) => {
                const isInstallmentGroup = groupExpenses.length > 1;
                const totalAmount = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                
                return (
                  <React.Fragment key={groupId}>
                    {isInstallmentGroup && (
                      <tr className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                        <td colSpan={8} className="py-2 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-900 dark:text-blue-300">
                                {groupExpenses[0].description} - {groupExpenses.length} {labels.installments}
                              </span>
                              <span className="text-blue-700 dark:text-blue-400">
                                {labels.total}: {formatCurrency(totalAmount)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteInstallmentGroup(groupId)}
                              className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded transition-colors"
                              title="Excluir todas as parcelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {groupExpenses
                      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0))
                      .map((expense) => (
                        <tr 
                          key={expense.id} 
                          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            isInstallmentGroup ? 'bg-blue-25 dark:bg-blue-900/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {expense.location || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {expense.description || '-'}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{expense.paymentMethod}</span>
                              {expense.isCreditCard && (
                                <span className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded text-xs">
                                  {labels.creditCard}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {expense.isInstallment && (
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {expense.installmentNumber}/{expense.totalInstallments}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {(expense.dueDate || expense.date) ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(expense.dueDate || expense.date)}
                                </span>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(expense)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {labels.noExpenses}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ExpenseList;