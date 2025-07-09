import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAccounts } from '../context/AccountContext';

interface ImportCSVProps {
  onClose: () => void;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ProcessedRow {
  rowNumber: number;
  data: any;
  status: 'success' | 'error' | 'warning';
  messages: string[];
}

const ImportCSV: React.FC<ImportCSVProps> = ({ onClose }) => {
  const { addExpense, addIncome, categories } = useFinance();
  const { accounts } = useAccounts();
  const [importType, setImportType] = useState<'expenses' | 'income'>('expenses');
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ProcessedRow[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[]; warnings: string[] } | null>(null);

  const expenseTemplate = `Date,Category,Description,Amount,PaymentMethod,Location,Installments,InstallmentNumber,IsCreditCard
2025-01-15,Alimentação,Almoço no restaurante,45.50,Cartão de Crédito,Restaurante ABC,1,1,true
2025-01-14,Transporte,Uber para trabalho,18.90,Pix,Centro da cidade,1,1,false
2025-02-13,Compras,Compras parceladas,360.00,Cartão de Crédito,Shopping XYZ,3,1,true
2025-03-13,Compras,Compras parceladas,360.00,Cartão de Crédito,Shopping XYZ,3,2,true
2025-04-13,Compras,Compras parceladas,360.00,Cartão de Crédito,Shopping XYZ,3,3,true`;

  const incomeTemplate = `Date,Source,Amount,Notes,Location,Account
2025-01-01,Salário,5000.00,Salário mensal,Empresa ABC,Conta Corrente
2025-01-15,Freelance,800.00,Projeto desenvolvimento web,Cliente XYZ,Pix
2025-01-20,Investimentos,150.00,Dividendos ações,Corretora,Conta Investimentos`;

  const downloadTemplate = () => {
    const template = importType === 'expenses' ? expenseTemplate : incomeTemplate;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${importType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue; // Skip empty lines
      
      // Handle CSV parsing with proper quote handling
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return { headers, data };
  };

  const validateRow = (row: any, rowNumber: number, type: 'expenses' | 'income'): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (type === 'expenses') {
      // Required fields validation
      if (!row.Date) errors.push('Data é obrigatória');
      if (!row.Category) errors.push('Categoria é obrigatória');
      if (!row.Amount) errors.push('Valor é obrigatório');
      if (!row.PaymentMethod) errors.push('Método de pagamento é obrigatório');

      // Date validation
      if (row.Date && !isValidDate(row.Date)) {
        errors.push(`Data inválida: ${row.Date}. Use formato YYYY-MM-DD`);
      }

      // Amount validation
      if (row.Amount) {
        const amount = parseFloat(row.Amount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Valor inválido: ${row.Amount}`);
        }
      }

      // Category validation
      const expenseCategories = categories.filter(cat => cat.type === 'expense');
      if (row.Category && !expenseCategories.some(cat => cat.name === row.Category)) {
        warnings.push(`Categoria "${row.Category}" não existe no sistema`);
      }

      // Account validation
      if (row.PaymentMethod && !accounts.some(acc => acc.name === row.PaymentMethod)) {
        warnings.push(`Conta "${row.PaymentMethod}" não existe no sistema`);
      }

      // Installment validation
      if (row.Installments) {
        const installments = parseInt(row.Installments);
        if (isNaN(installments) || installments < 1) {
          errors.push(`Número de parcelas inválido: ${row.Installments}`);
        }
      }

      if (row.InstallmentNumber) {
        const installmentNumber = parseInt(row.InstallmentNumber);
        const totalInstallments = parseInt(row.Installments) || 1;
        if (isNaN(installmentNumber) || installmentNumber < 1 || installmentNumber > totalInstallments) {
          errors.push(`Número da parcela inválido: ${row.InstallmentNumber}`);
        }
      }

    } else {
      // Income validation
      if (!row.Date) errors.push('Data é obrigatória');
      if (!row.Source) errors.push('Fonte é obrigatória');
      if (!row.Amount) errors.push('Valor é obrigatório');

      // Date validation
      if (row.Date && !isValidDate(row.Date)) {
        errors.push(`Data inválida: ${row.Date}. Use formato YYYY-MM-DD`);
      }

      // Amount validation
      if (row.Amount) {
        const amount = parseFloat(row.Amount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Valor inválido: ${row.Amount}`);
        }
      }

      // Source validation
      const incomeCategories = categories.filter(cat => cat.type === 'income');
      if (row.Source && !incomeCategories.some(cat => cat.name === row.Source)) {
        warnings.push(`Fonte "${row.Source}" não existe no sistema`);
      }

      // Account validation
      if (row.Account && !accounts.some(acc => acc.name === row.Account)) {
        warnings.push(`Conta "${row.Account}" não existe no sistema`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  };

  const validateCSV = async () => {
    if (!csvData.trim()) {
      alert('Por favor, cole os dados CSV');
      return;
    }

    setIsValidating(true);
    const processedRows: ProcessedRow[] = [];

    try {
      const { data } = parseCSV(csvData);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed
        const validation = validateRow(row, rowNumber, importType);

        const messages = [...validation.errors, ...validation.warnings];
        const status = validation.errors.length > 0 ? 'error' : 
                     validation.warnings.length > 0 ? 'warning' : 'success';

        processedRows.push({
          rowNumber,
          data: row,
          status,
          messages
        });
      }

      setValidationResults(processedRows);
      setShowValidation(true);
    } catch (error) {
      alert(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    setIsValidating(false);
  };

  const processImport = async () => {
    setIsProcessing(true);
    const errors: string[] = [];
    const warnings: string[] = [];
    let successCount = 0;

    try {
      const validRows = validationResults.filter(row => row.status !== 'error');

      for (const processedRow of validRows) {
        const row = processedRow.data;

        try {
          if (importType === 'expenses') {
            const amount = parseFloat(row.Amount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));

            const installments = parseInt(row.Installments) || 1;
            const installmentNumber = parseInt(row.InstallmentNumber) || 1;
            const isInstallment = installments > 1;
            const isCreditCard = row.IsCreditCard ? 
              (row.IsCreditCard.toString().toLowerCase() === 'true' || 
               row.IsCreditCard.toString().toLowerCase() === 'sim' || 
               row.IsCreditCard.toString() === '1') : false;

            // Create installment group for related installments
            const installmentGroup = isInstallment ? 
              `${row.Description || 'Despesa'}_${row.Date}_import_${Date.now()}` : 
              undefined;

            addExpense({
              date: row.Date,
              category: row.Category,
              description: row.Description || '',
              amount: amount,
              paymentMethod: row.PaymentMethod,
              location: row.Location || '',
              isInstallment: isInstallment,
              installmentNumber: installmentNumber,
              totalInstallments: installments,
              installmentGroup: installmentGroup,
              isCreditCard: isCreditCard,
            });

            successCount++;
          } else {
            const amount = parseFloat(row.Amount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));

            addIncome({
              date: row.Date,
              source: row.Source,
              amount: amount,
              notes: row.Notes || '',
              location: row.Location || '',
              account: row.Account || ''
            });

            successCount++;
          }

          // Collect warnings from validation
          if (processedRow.status === 'warning') {
            warnings.push(...processedRow.messages.map(msg => `Linha ${processedRow.rowNumber}: ${msg}`));
          }

        } catch (error) {
          errors.push(`Linha ${processedRow.rowNumber}: Erro ao processar dados`);
        }
      }

      setResults({ success: successCount, errors, warnings });
      setShowValidation(false);
    } catch (error) {
      errors.push('Erro geral ao processar dados');
      setResults({ success: 0, errors, warnings });
    }

    setIsProcessing(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const validRowsCount = validationResults.filter(row => row.status !== 'error').length;
  const errorRowsCount = validationResults.filter(row => row.status === 'error').length;
  const warningRowsCount = validationResults.filter(row => row.status === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 pb-4 z-10 flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Importar Dados CSV</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {!results && !showValidation ? (
          <>
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tipo de Dados
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="expenses"
                    checked={importType === 'expenses'}
                    onChange={(e) => setImportType(e.target.value as 'expenses' | 'income')}
                    className="mr-2"
                  />
                  Despesas
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="income"
                    checked={importType === 'income'}
                    onChange={(e) => setImportType(e.target.value as 'expenses' | 'income')}
                    className="mr-2"
                  />
                  Receitas
                </label>
              </div>
            </div>

            {/* Template Download */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-300">Formato CSV Necessário</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    {importType === 'expenses' 
                      ? 'Date,Category,Description,Amount,PaymentMethod,Location,Installments,InstallmentNumber,IsCreditCard'
                      : 'Date,Source,Amount,Notes,Location,Account'
                    }
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar Template
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900 dark:text-amber-300">Instruções Importantes</h3>
                  <ul className="text-sm text-amber-800 dark:text-amber-400 mt-2 space-y-1">
                    <li>• Use formato de data: YYYY-MM-DD (ex: 2025-01-15)</li>
                    <li>• Valores monetários podem usar vírgula ou ponto decimal</li>
                    <li>• Para campos booleanos: use true/false, sim/não, ou 1/0</li>
                    <li>• Para parcelas: Installments = número total, InstallmentNumber = parcela atual</li>
                    <li>• Para parcelas, use a data de cada parcela no campo Date</li>
                    <li>• Categorias e contas inexistentes serão sinalizadas como avisos</li>
                    <li>• Use aspas duplas para campos que contenham vírgulas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CSV Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cole seus dados CSV aqui:
              </label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="w-full h-40 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder={importType === 'expenses' ? expenseTemplate : incomeTemplate}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={validateCSV}
                disabled={isValidating || !csvData.trim()}
                className="flex-1 px-4 py-2 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Validando...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Validar Dados
                  </>
                )}
              </button>
            </div>
          </>
        ) : showValidation ? (
          /* Validation Results */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Validação Concluída</h3>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {validRowsCount - warningRowsCount} Válidos
                  </span>
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-300">
                    {warningRowsCount} Avisos
                  </span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-300">
                    {errorRowsCount} Erros
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Details */}
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              {validationResults.map((row, index) => (
                <div key={index} className={`p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0 ${getStatusColor(row.status)}`}>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(row.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        Linha {row.rowNumber}: {row.data.Description || row.data.Source || 'Sem descrição'}
                      </div>
                      {row.messages.length > 0 && (
                        <ul className="text-xs mt-1 space-y-1">
                          {row.messages.map((message, msgIndex) => (
                            <li key={msgIndex}>• {message}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowValidation(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={processImport}
                disabled={isProcessing || validRowsCount === 0}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar {validRowsCount} Registros
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Final Results */
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Importação Concluída</h3>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-300">
                ✅ <strong>{results.success}</strong> registros importados com sucesso
              </p>
            </div>

            {results.warnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                  ⚠️ {results.warnings.length} aviso(s):
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 max-h-32 overflow-y-auto">
                  {results.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                  ❌ {results.errors.length} erro(s):
                </p>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportCSV;