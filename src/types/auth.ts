export interface NeonUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  image?: string | null;
}

export interface Nutricionista {
  id: string;
  user_id?: string;
  nome: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: NeonUser;
  nutricionista?: Nutricionista | null;
}

export interface AuthResponse {
  token?: string;
  user: NeonUser;
  session?: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
  };
}
