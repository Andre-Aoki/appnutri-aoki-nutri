import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NeonUser, Nutricionista } from '../types/auth';
import { neonAuth } from '../lib/auth-client';
import { syncNutricionista, getNutricionistaByEmail } from '../lib/db';

interface AuthContextType {
  user: NeonUser | null;
  nutricionista: Nutricionista | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<NeonUser | null>(null);
  const [nutricionista, setNutricionista] = useState<Nutricionista | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadNutricionistaProfile = useCallback(async (currentUser: NeonUser) => {
    try {
      let nutri = await getNutricionistaByEmail(currentUser.email);
      if (!nutri) {
        // Tenta sincronizar caso não exista na tabela ainda
        nutri = await syncNutricionista(currentUser.name || 'Nutricionista', currentUser.email, currentUser.id);
      }
      if (nutri) {
        setNutricionista(nutri);
      }
    } catch (err) {
      console.warn('Perfil de nutricionista ainda não sincronizado:', err);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await neonAuth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadNutricionistaProfile(session.user);
      } else {
        setUser(null);
        setNutricionista(null);
      }
    } catch (e) {
      console.error('Erro ao verificar sessão:', e);
      setUser(null);
      setNutricionista(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadNutricionistaProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await neonAuth.signIn({ email, password });
      setUser(result.user);
      await loadNutricionistaProfile(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (nome: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Cria a conta no Neon Auth
      const result = await neonAuth.signUp({ name: nome, email, password });
      setUser(result.user);

      // 2. Salva nome e email na tabela `nutricionistas` no Neon
      const nutri = await syncNutricionista(nome, email, result.user.id);
      if (nutri) {
        setNutricionista(nutri);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await neonAuth.signOut();
      setUser(null);
      setNutricionista(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadNutricionistaProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        nutricionista,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
