// API client for the backend REST API
import type { User, Expense, Income, Category, Account } from "@shared/schema";

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    credentials: 'include', // Include session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(response.status, errorData.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User }> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string): Promise<{ user: User }> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<{ message: string }> {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  async getSession(): Promise<{ user: User }> {
    return apiRequest('/auth/session');
  },
};

// Expenses API
export const expensesApi = {
  async getAll(): Promise<Expense[]> {
    return apiRequest('/expenses');
  },

  async create(expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>): Promise<Expense> {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async update(id: string, expense: Partial<Omit<Expense, 'id' | 'created_at' | 'user_id'>>): Promise<Expense> {
    return apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};

// Income API
export const incomeApi = {
  async getAll(): Promise<Income[]> {
    return apiRequest('/income');
  },

  async create(income: Omit<Income, 'id' | 'created_at' | 'user_id'>): Promise<Income> {
    return apiRequest('/income', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  },

  async update(id: string, income: Partial<Omit<Income, 'id' | 'created_at' | 'user_id'>>): Promise<Income> {
    return apiRequest(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(income),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/income/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    return apiRequest('/categories');
  },

  async create(category: Omit<Category, 'id' | 'created_at' | 'user_id'>): Promise<Category> {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async update(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'user_id'>>): Promise<Category> {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Accounts API
export const accountsApi = {
  async getAll(): Promise<Account[]> {
    return apiRequest('/accounts');
  },

  async create(account: Omit<Account, 'id' | 'created_at' | 'user_id'>): Promise<Account> {
    return apiRequest('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  },

  async update(id: string, account: Partial<Omit<Account, 'id' | 'created_at' | 'user_id'>>): Promise<Account> {
    return apiRequest(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  },

  async delete(id: string): Promise<{ message: string }> {
    return apiRequest(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },
};

// **INÍCIO DA ALTERAÇÃO**
// Adiciona a função para chamar o modelo de chat da IA e a exporta
export async function callChatModel(message: string): Promise<{ reply: string }> {
  return apiRequest('/chat', { // Endpoint para o chat da IA
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
// **FIM DA ALTERAÇÃO**

export { ApiError };
