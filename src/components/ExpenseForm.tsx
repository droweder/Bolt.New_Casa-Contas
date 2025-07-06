import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Minus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { Expense } from '../types';

interface ExpenseFormProps {
  expense?: Expense | null;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expense, onClose }) => {
  const { addExpense, updateExpense, categories } = useFinance();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'Credit Card',
    location: '',
    isInstallment: false,
    totalInstallments: 1,
    isCreditCard: false,
    firstDueDate: new Date().toISOString().split('T')[0],
  });

  const [installmentDates, setInstallmentDates] = useState<string[]>([]);

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString().replace('.', ','),
        paymentMethod: expense.paymentMethod,
        location: expense.location || '',
        isInstallment: expense.isInstallment || false,
        totalInstallments: expense.totalInstallments || 1,
        isCreditCard: expense.isCreditCard || false,
        firstDueDate: expense.dueDate || new Date().toISOString().split('T')[0],
      });

      if (expense.isInstallment && expense.dueDate) {
        setInstallmentDates([expense.dueDate]);
      }
    }
  }, [expense]);

  useEffect(() => {
    if (formData.isInstallment) {
      // Generate dates maintaining the same day of month
      const dates = [];
      const baseDate = new Date(formData.firstDueDate);
      
      for (let i = 0; i < formData.totalInstallments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(baseDate.getMonth() + i);
        dates.push(installmentDate.toISOString().split('T')[0]);
      }
      
      setInstallmentDates(dates);
    } else {
      setInstallmentDates([]);
    }
  }, [formData.isInstallment, formData.totalInstallments, formData.firstDueDate]);

  const handleInstallmentDateChange = (index: number, date: string) => {
    const newDates = [...installmentDates];
    newDates[index] = date;
    setInstallmentDates(newDates);
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers, comma and dot
    const sanitized = value.replace(/[^0-9.,]/g, '');
    setFormData({ ...formData, amount: sanitized });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const baseAmount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(baseAmount) || baseAmount <= 0) {
      alert('Por favor, insira um valor válido');
      return;
    }

    const installmentAmount = formData.isInstallment ? baseAmount / formData.totalInstallments : baseAmount;

    if (formData.isInstallment && !expense) {
      // Create multiple installments with clean descriptions
      const installmentGroup = Date.now().toString();
      
      for (let i = 0; i < formData.totalInstallments; i++) {
        const expenseData = {
          date: installmentDates[i] || formData.firstDueDate,
          category: formData.category,
          description: formData.description, // Clean description without installment info
          amount: installmentAmount,
          paymentMethod: formData.paymentMethod,
          location: formData.location,
          isInstallment: true,
          installmentNumber: i + 1,
          totalInstallments: formData.totalInstallments,
          installmentGroup: installmentGroup,
          dueDate: installmentDates[i] || formData.firstDueDate,
          isCreditCard: formData.isCreditCard,
          paid: false,
        };

        addExpense(expenseData);
      }
    } else {
      // Single expense or update existing
      const expenseData = {
        date: formData.isInstallment ? installmentDates[0] : formData.firstDueDate,
        category: formData.category,
        description: formData.description, // Clean description
        amount: baseAmount,
        paymentMethod: formData.paymentMethod,
        location: formData.location,
        isInstallment: formData.isInstallment,
        installmentNumber: expense?.installmentNumber,
        totalInstallments: expense?.totalInstallments,
        installmentGroup: expense?.installmentGroup,
        dueDate: formData.isInstallment ? installmentDates[0] : formData.firstDueDate,
        isCreditCard: formData.isCreditCard,
        paid: expense?.paid || false,
      };

      if (expense) {
        updateExpense(expense.id, expenseData);
      } else {
        addExpense(expenseData);
      }
    }

    onClose();
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const labels = {
    title: expense ? 'Editar Despesa' : 'Adicionar Despesa',
    category: 'Categoria',
    description: 'Descrição',
    amount: 'Valor (R$)',
    paymentMethod: 'Método de Pagamento',
    location: 'Local/Pessoa',
    installment: 'Parcelar esta despesa',
    installments: 'Número de Parcelas',
    firstDueDate: 'Data do Primeiro Vencimento',
    dueDates: 'Datas de Vencimento das Parcelas',
    creditCard: 'Cartão de Crédito',
    cancel: 'Cancelar',
    save: expense ? 'Atualizar' : 'Adicionar',
    perInstallment: 'Valor por parcela',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {labels.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.category} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Selecione uma categoria</option>
                {expenseCategories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.amount} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0,00"
                required
              />
              {formData.isInstallment && formData.amount && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  {labels.perInstallment}: R$ {(parseFloat(formData.amount.replace(',', '.')) / formData.totalInstallments).toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.description}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Notas opcionais sobre esta despesa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.location}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Supermercado, João Silva, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.paymentMethod}
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Viacredi - Tatiane">Viacredi - Tatiane</option>
              <option value="Viacredi - Dirceu">Viacredi - Dirceu</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Carteira - Tatiane">Carteira - Tatiane</option>
              <option value="Carteira - Dirceu">Carteira - Dirceu</option>
              <option value="UtilAlimentação">UtilAlimentação</option>
              <option value="Banco do Brasil">Banco do Brasil</option>
              <option value="Nubank">Nubank</option>
            </select>
          </div>

          {/* Credit Card Option */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCreditCard"
              checked={formData.isCreditCard}
              onChange={(e) => setFormData({ ...formData, isCreditCard: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="isCreditCard" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {labels.creditCard}
            </label>
          </div>

          {/* Installment Section */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="isInstallment"
                checked={formData.isInstallment}
                onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                disabled={!!expense} // Disable for editing existing expenses
              />
              <label htmlFor="isInstallment" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {labels.installment}
              </label>
            </div>

            {formData.isInstallment && (
              <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {labels.firstDueDate}
                    </label>
                    <input
                      type="date"
                      value={formData.firstDueDate}
                      onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {labels.installments}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          totalInstallments: Math.max(1, formData.totalInstallments - 1) 
                        })}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        disabled={formData.totalInstallments <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.totalInstallments}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          totalInstallments: Math.max(1, parseInt(e.target.value) || 1) 
                        })}
                        className="w-20 text-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          totalInstallments: Math.min(60, formData.totalInstallments + 1) 
                        })}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {labels.dueDates}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {Array.from({ length: formData.totalInstallments }, (_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-16">
                          {index + 1}/{formData.totalInstallments}:
                        </span>
                        <input
                          type="date"
                          value={installmentDates[index] || ''}
                          onChange={(e) => handleInstallmentDateChange(index, e.target.value)}
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {labels.save} Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;