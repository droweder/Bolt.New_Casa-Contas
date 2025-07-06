import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          payment_method: string;
          location: string | null;
          paid: boolean;
          is_installment: boolean;
          installment_number: number | null;
          total_installments: number | null;
          installment_group: string | null;
          due_date: string | null;
          is_credit_card: boolean;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          payment_method: string;
          location?: string | null;
          paid?: boolean;
          is_installment?: boolean;
          installment_number?: number | null;
          total_installments?: number | null;
          installment_group?: string | null;
          due_date?: string | null;
          is_credit_card?: boolean;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          date?: string;
          category?: string;
          description?: string;
          amount?: number;
          payment_method?: string;
          location?: string | null;
          paid?: boolean;
          is_installment?: boolean;
          installment_number?: number | null;
          total_installments?: number | null;
          installment_group?: string | null;
          due_date?: string | null;
          is_credit_card?: boolean;
          created_at?: string;
          user_id?: string;
        };
      };
      income: {
        Row: {
          id: string;
          date: string;
          source: string;
          amount: number;
          notes: string;
          location: string | null;
          account: string | null;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          date: string;
          source: string;
          amount: number;
          notes: string;
          location?: string | null;
          account?: string | null;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          date?: string;
          source?: string;
          amount?: number;
          notes?: string;
          location?: string | null;
          account?: string | null;
          created_at?: string;
          user_id?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: 'income' | 'expense';
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'income' | 'expense';
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'income' | 'expense';
          created_at?: string;
          user_id?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          initial_balance: number;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          initial_balance: number;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          initial_balance?: number;
          created_at?: string;
          user_id?: string;
        };
      };
    };
  };
}