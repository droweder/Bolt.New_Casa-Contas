import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  authToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sessão existente ao carregar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && session.user && !error) {
          const user: User = {
            id: session.user.id,
            username: session.user.email || '',
            password: '', // Não armazenamos senha
            isAdmin: session.user.email === 'droweder@gmail.com',
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          
          setCurrentUser(user);
          setAuthToken(session.access_token);
          console.log('✅ Sessão existente encontrada');
        } else {
          console.log('ℹ️ Nenhuma sessão ativa encontrada');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (session && session.user) {
          const user: User = {
            id: session.user.id,
            username: session.user.email || '',
            password: '',
            isAdmin: session.user.email === 'droweder@gmail.com',
            createdAt: session.user.created_at || new Date().toISOString(),
          };
          
          setCurrentUser(user);
          setAuthToken(session.access_token);
        } else {
          setCurrentUser(null);
          setAuthToken(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Tentativa de login:', { email });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (data.user && data.session && !error) {
        const user: User = {
          id: data.user.id,
          username: data.user.email || '',
          password: '',
          isAdmin: data.user.email === 'droweder@gmail.com',
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        
        setCurrentUser(user);
        setAuthToken(data.session.access_token);
        console.log('🎉 Login realizado com sucesso!');
        return true;
      } else {
        console.log('❌ Falha na autenticação:', error?.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error?.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAuthToken(null);
      console.log('👋 Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: !!currentUser,
        authToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};