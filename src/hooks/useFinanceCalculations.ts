import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { MonthlyData } from '../types';

export const useFinanceCalculations = () => {
  const { expenses, income } = useFinance();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculations = useMemo(() => {
    // Current month calculations - usar dueDate se disponível, senão date
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.dueDate || expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const currentMonthIncome = income.filter(incomeItem => {
      const incomeDate = new Date(incomeItem.date);
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
    });

    const totalExpensesThisMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncomeThisMonth = currentMonthIncome.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);
    const balanceThisMonth = totalIncomeThisMonth - totalExpensesThisMonth;

    // Unpaid expenses
    const unpaidExpenses = expenses.filter(expense => !expense.paid);
    const totalUnpaidExpenses = unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Category breakdown
    const expensesByCategory = currentMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trend (last 6 months)
    const monthlyTrend: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.dueDate || expense.date);
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
      });

      const monthIncome = income.filter(incomeItem => {
        const incomeDate = new Date(incomeItem.date);
        return incomeDate.getMonth() === date.getMonth() && incomeDate.getFullYear() === date.getFullYear();
      });

      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalIncome = monthIncome.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

      monthlyTrend.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      });
    }

    return {
      totalExpensesThisMonth,
      totalIncomeThisMonth,
      balanceThisMonth,
      totalUnpaidExpenses,
      expensesByCategory,
      monthlyTrend,
      unpaidExpenses,
    };
  }, [expenses, income, currentMonth, currentYear]);

  return calculations;
};