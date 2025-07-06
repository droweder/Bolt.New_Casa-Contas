import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface ImportCSVProps {
  onClose: () => void;
}

const ImportCSV: React.FC<ImportCSVProps> = ({ onClose }) => {
  const { addExpense, addIncome } = useFinance();
  const [importType, setImportType] = useState<'expenses' | 'income'>('expenses');
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const expenseTemplate = `Date,Category,Description,Amount,PaymentMethod,Paid,Installments,InstallmentNumber,DueDate
2025-01-15,Food & Dining,Almoço no restaurante,45.50,Credit Card,true,1,1,2025-01-15
2025-01-14,Transport,Uber para trabalho,18.90,Pix,true,1,1,2025-01-14
2025-01-13,Shopping,Compras parceladas,360.00,Credit Card,false,3,1,2025-02-13`;

  const incomeTemplate = `Date,Source,Amount,Notes
2025-01-01,Salary,5000.00,Salário mensal
2025-01-15,Freelance,800.00,Projeto extra`;

  const downloadTemplate = () => {
    const template = importType === 'expenses' ? expenseTemplate : incomeTemplate;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const processImport = async () => {
    if (!csvData.trim()) {
      alert('Por favor, cole os dados CSV');
      return;
    }

    setIsProcessing(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const data = parseCSV(csvData);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

        try {
          if (importType === 'expenses') {
            // Validate required fields for expenses
            if (!row.Date || !row.Category || !row.Amount) {
              errors.push(`Linha ${rowNumber}: Campos obrigatórios faltando (Date, Category, Amount)`);
              continue;
            }

            const amount = parseFloat(row.Amount.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (isNaN(amount)) {
              errors.push(`Linha ${rowNumber}: Valor inválido (${row.Amount})`);
              continue;
            }

            const paid = row.Paid ? 
              (row.Paid.toLowerCase() === 'true' || row.Paid.toLowerCase() === 'sim' || row.Paid === '1') : 
              false;

            const installments = parseInt(row.Installments) || 1;
            const installmentNumber = parseInt(row.InstallmentNumber) || 1;
            const isInstallment = installments > 1;

            // For installments, create a group ID based on description and date
            const installmentGroup = isInstallment ? 
              `${row.Description}_${row.Date}_${Date.now()}` : 
              undefined;

            addExpense({
              date: row.Date,
              category: row.Category,
              description: row.Description || '',
              amount: amount,
              paymentMethod: row.PaymentMethod || 'Credit Card',
              paid: paid,
              isInstallment: isInstallment,
              installmentNumber: installmentNumber,
              totalInstallments: installments,
              installmentGroup: installmentGroup,
              dueDate: row.DueDate || row.Date,
            });

            successCount++;
          } else {
            // Validate required fields for income
            if (!row.Date || !row.Source || !row.Amount) {
              errors.push(`Linha ${rowNumber}: Campos obrigatórios faltando (Date, Source, Amount)`);
              continue;
            }

            const amount = parseFloat(row.Amount.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (isNaN(amount)) {
              errors.push(`Linha ${rowNumber}: Valor inválido (${row.Amount})`);
              continue;
            }

            addIncome({
              date: row.Date,
              source: row.Source,
              amount: amount,
              notes: row.Notes || ''
            });

            successCount++;
          }
        } catch (error) {
          errors.push(`Linha ${rowNumber}: Erro ao processar dados`);
        }
      }

      setResults({ success: successCount, errors });
    } catch (error) {
      errors.push('Erro ao processar CSV. Verifique o formato dos dados.');
      setResults({ success: 0, errors });
    }

    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Importar Dados CSV</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {!results ? (
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
                      ? 'Date,Category,Description,Amount,PaymentMethod,Paid,Installments,InstallmentNumber,DueDate'
                      : 'Date,Source,Amount,Notes'
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
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900 dark:text-amber-300">Instruções Importantes</h3>
                  <ul className="text-sm text-amber-800 dark:text-amber-400 mt-2 space-y-1">
                    <li>• Use formato de data: YYYY-MM-DD (ex: 2025-01-15)</li>
                    <li>• Valores monetários podem usar vírgula ou ponto decimal</li>
                    <li>• Para campo "Paid": use true/false, sim/não, ou 1/0</li>
                    <li>• Para parcelas: Installments = número total, InstallmentNumber = parcela atual</li>
                    <li>• DueDate é opcional, se não informado usará a Date</li>
                    <li>• Certifique-se de que as categorias existem no sistema</li>
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
                onClick={processImport}
                disabled={isProcessing || !csvData.trim()}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar Dados
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results */
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

            {results.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-300 font-medium mb-2">
                  ⚠️ {results.errors.length} erro(s) encontrado(s):
                </p>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
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