import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Mail, Lock, ArrowRight, LogIn } from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onLoginSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações básicas
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Por favor, insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Falha no login:', err);
      const msg = err?.message || 'Falha ao autenticar. Verifique seu e-mail e senha.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para gerenciar seus pacientes e planos alimentares."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert
            type="error"
            title="Não foi possível entrar"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Input
          id="login-email"
          label="E-mail profissional"
          type="email"
          placeholder="seu.email@exemplo.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          leftIcon={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-1">
          <Input
            id="login-password"
            label="Senha"
            type="password"
            placeholder="•••••••••"
            autoComplete="current-password"
            required
            showPasswordToggle
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<LogIn className="w-4 h-4" />}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="pt-4 text-center border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Não tem conta?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
