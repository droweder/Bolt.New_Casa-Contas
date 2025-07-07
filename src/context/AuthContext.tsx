import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
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

// Usuário admin padrão - sempre disponível
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  username: 'admin',
  password: '123456',
  isAdmin: true,
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([DEFAULT_ADMIN]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Carregar dados salvos
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem('finance-users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        // Garantir que o admin sempre existe
        const hasAdmin = parsedUsers.some((u: User) => u.username === 'admin');
        if (!hasAdmin) {
          setUsers([DEFAULT_ADMIN, ...parsedUsers]);
        } else {
          setUsers(parsedUsers);
        }
      } else {
        // Se não há dados salvos, usar apenas o admin padrão
        setUsers([DEFAULT_ADMIN]);
      }

      // Verificar usuário logado
      const savedCurrentUser = localStorage.getItem('finance-current-user');
      const savedAuthToken = localStorage.getItem('finance-auth-token');
      
      if (savedCurrentUser && savedAuthToken) {
        const parsedUser = JSON.parse(savedCurrentUser);
        setCurrentUser(parsedUser);
        setAuthToken(savedAuthToken);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Em caso de erro, garantir que pelo menos o admin existe
      setUsers([DEFAULT_ADMIN]);
      localStorage.removeItem('finance-current-user');
      localStorage.removeItem('finance-users');
      localStorage.removeItem('finance-auth-token');
    }
  }, []);

  // Salvar usuários no localStorage
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('finance-users', JSON.stringify(users));
    }
  }, [users]);

  // Salvar usuário atual no localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('finance-current-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('finance-current-user');
    }
  }, [currentUser]);

  // Salvar token de autenticação
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('finance-auth-token', authToken);
    } else {
      localStorage.removeItem('finance-auth-token');
    }
  }, [authToken]);

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 Tentativa de login:', { username, password });
    
    // Primeiro, verificar autenticação local
    const localUser = users.find(user => 
      user.username === username && user.password === password
    );

    if (!localUser) {
      console.log('❌ Credenciais locais inválidas');
      return false;
    }

    console.log('✅ Autenticação local bem-sucedida');
    
    // Definir usuário atual com dados locais
    let authenticatedUser = { ...localUser };
    let token = `local-token-${Date.now()}`;

    // Tentar autenticação com Supabase de forma não-bloqueante
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@finance.local`, // Usar email fictício baseado no username
        password: password,
      });

      if (data.user && !error) {
        // Autenticação Supabase bem-sucedida - atualizar com dados do Supabase
        authenticatedUser = {
          ...localUser,
          id: data.user.id, // Usar ID do Supabase para sincronização
        };
        token = data.session?.access_token || token;
        console.log('🎉 Login Supabase também realizado com sucesso!');
      } else {
        console.log('⚠️ Falha na autenticação Supabase (continuando com local):', error?.message);
      }
    } catch (supabaseError: any) {
      console.log('⚠️ Erro na autenticação Supabase (continuando com local):', supabaseError?.message);
    }
    
    // Definir usuário autenticado (local ou Supabase)
    setCurrentUser(authenticatedUser);
    setAuthToken(token);
    console.log('🎉 Login realizado com sucesso!');
    return true;
  };

  const logout = async () => {
    try {
      // Tentar logout do Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Erro no logout Supabase:', error);
    }
    
    setCurrentUser(null);
    setAuthToken(null);
    console.log('👋 Logout realizado');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    
    // Se o usuário atual foi atualizado, atualizar também o currentUser
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
    }
  };

  const deleteUser = (id: string) => {
    // Não permitir deletar o admin padrão
    if (id === DEFAULT_ADMIN.id) {
      alert('Não é possível deletar o usuário administrador padrão');
      return;
    }
    
    setUsers(prev => prev.filter(user => user.id !== id));
    
    // Se o usuário atual foi deletado, fazer logout
    if (currentUser && currentUser.id === id) {
      setCurrentUser(null);
      setAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        isAuthenticated: !!currentUser,
        authToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};