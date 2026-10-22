import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { User, Mail, Lock, Check, UserPlus, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validação dinâmica da senha (mínimo 9 caracteres)
  const isPasswordLongEnough = password.length >= 9;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres para sua segurança.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      await register(nome, email, password);
      onRegisterSuccess();
    } catch (err: any) {
      console.error('Falha no cadastro:', err);
      const msg = err?.message || 'Falha ao criar sua conta. Verifique os dados e tente novamente.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Cadastre-se para ter acesso completo ao sistema de gestão nutricional."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert
            type="error"
            title="Não foi possível criar a conta"
            message={errorMessage}
            onClose={() => setErrorMessage(null)}
          />
        )}

        <Input
          id="register-nome"
          label="Nome completo"
          type="text"
          placeholder="Dra. Mariana Oliveira"
          autoComplete="name"
          required
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          leftIcon={<User className="w-4 h-4" />}
        />

        <Input
          id="register-email"
          label="E-mail profissional"
          type="email"
          placeholder="mariana@nutricao.com"
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
            id="register-password"
            label="Senha"
            type="password"
            placeholder="Mínimo 9 caracteres"
            autoComplete="new-password"
            required
            showPasswordToggle
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {/* Indicador de senha de 9 dígitos */}
          {password.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  isPasswordLongEnough
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Check className="w-3 h-3" />
              </div>
              <span
                className={
                  isPasswordLongEnough
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-500'
                }
              >
                Mínimo de 9 caracteres {password.length > 0 && `(${password.length}/9)`}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Input
            id="register-confirm-password"
            label="Confirmar senha"
            type="password"
            placeholder="Repita sua senha"
            autoComplete="new-password"
            required
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  doPasswordsMatch
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {doPasswordsMatch ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-[10px] font-bold">✕</span>
                )}
              </div>
              <span
                className={
                  doPasswordsMatch
                    ? 'text-emerald-700 font-medium'
                    : 'text-rose-600 font-medium'
                }
              >
                {doPasswordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}
              </span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          leftIcon={<UserPlus className="w-4 h-4" />}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </Button>

        <div className="pt-4 text-center border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Já tem conta?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
            >
              Faça login
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
