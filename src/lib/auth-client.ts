import { NeonUser, AuthResponse } from '../types/auth';

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-red-king-b6bu7owl.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth';
const TOKEN_STORAGE_KEY = 'aoki_nutri_auth_token';
const USER_STORAGE_KEY = 'aoki_nutri_auth_user';

export interface SignUpParams {
  name: string;
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

class NeonAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = NEON_AUTH_URL.replace(/\/$/, '');
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  public setSession(token: string, user: NeonUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  public clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  public getStoredUser(): NeonUser | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Realiza o cadastro no Neon Auth
   */
  public async signUp(params: SignUpParams): Promise<{ user: NeonUser; token?: string }> {
    const { name, email, password } = params;

    const res = await fetch(`${this.baseUrl}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = this.extractErrorMessage(data, res.status);
      throw new Error(message);
    }

    const token = data?.token || data?.session?.token || `neon_token_${Date.now()}`;
    const user: NeonUser = data?.user || {
      id: data?.id || `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    this.setSession(token, user);
    return { user, token };
  }

  /**
   * Realiza o login no Neon Auth
   */
  public async signIn(params: SignInParams): Promise<{ user: NeonUser; token?: string }> {
    const { email, password } = params;

    const res = await fetch(`${this.baseUrl}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = this.extractErrorMessage(data, res.status);
      throw new Error(message);
    }

    const token = data?.token || data?.session?.token || `neon_token_${Date.now()}`;
    const user: NeonUser = data?.user || {
      id: data?.id || `user_${Date.now()}`,
      name: data?.name || email.split('@')[0],
      email: email.trim().toLowerCase(),
    };

    this.setSession(token, user);
    return { user, token };
  }

  /**
   * Encerra a sessão
   */
  public async signOut(): Promise<void> {
    const token = this.getToken();
    try {
      await fetch(`${this.baseUrl}/sign-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.warn('Erro ao chamar sign-out remoto:', e);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Verifica a sessão ativa
   */
  public async getSession(): Promise<{ user: NeonUser; token: string } | null> {
    const token = this.getToken();
    const storedUser = this.getStoredUser();

    if (!token && !storedUser) {
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/get-session`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data: AuthResponse = await res.json();
        if (data?.user) {
          const validToken = data.token || data.session?.token || token || 'active_token';
          this.setSession(validToken, data.user);
          return { user: data.user, token: validToken };
        }
      }
    } catch (e) {
      console.warn('Não foi possível verificar sessão com servidor Neon Auth:', e);
    }

    // Se temos dados persistidos localmente válidos, mantemos a sessão
    if (storedUser && token) {
      return { user: storedUser, token };
    }

    return null;
  }

  private extractErrorMessage(data: any, status: number): string {
    if (data?.message) {
      const msg = String(data.message).toLowerCase();
      if (msg.includes('user already exists') || msg.includes('email already')) {
        return 'Já existe uma conta cadastrada com este e-mail.';
      }
      if (msg.includes('invalid credentials') || msg.includes('invalid email or password') || msg.includes('password is incorrect')) {
        return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
      }
      if (msg.includes('password') && (msg.includes('short') || msg.includes('length'))) {
        return 'A senha deve ter no mínimo 9 caracteres.';
      }
      return data.message;
    }

    if (data?.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }

    if (status === 401 || status === 400) {
      return 'E-mail ou senha inválidos. Verifique suas credenciais.';
    }

    if (status === 409) {
      return 'Este e-mail já está em uso por outro profissional.';
    }

    return 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
  }
}

export const neonAuth = new NeonAuthService();
