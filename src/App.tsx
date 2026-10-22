import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { Logo } from './components/Logo';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  // Ao carregar se já estiver logado, redireciona para o dashboard
  useEffect(() => {
    // Sincroniza hash da URL ou estado simples de rota
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#register') {
        setCurrentPage('register');
      } else {
        setCurrentPage('login');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: 'login' | 'register') => {
    setCurrentPage(page);
    window.location.hash = page === 'register' ? '#register' : '#login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/50 to-slate-100 p-4">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Logo size="lg" />
          <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium mt-2 bg-emerald-100/60 px-4 py-1.5 rounded-full border border-emerald-200">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Carregando sistema...
          </div>
        </div>
      </div>
    );
  }

  // Regra: se já estiver logado, exibe direto o Dashboard (impede acesso às telas de login/cadastro)
  if (isAuthenticated) {
    return <DashboardPage />;
  }

  // Telas públicas de autenticação
  if (currentPage === 'register') {
    return (
      <RegisterPage
        onNavigateToLogin={() => navigateTo('login')}
        onRegisterSuccess={() => {
          // Automaticamente autenticado pelo contexto
        }}
      />
    );
  }

  return (
    <LoginPage
      onNavigateToRegister={() => navigateTo('register')}
      onLoginSuccess={() => {
        // Automaticamente autenticado pelo contexto
      }}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
