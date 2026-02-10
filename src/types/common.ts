/**
 * Tipos genéricos e compartilhados
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthContext {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: 'cliente' | 'transportador' | 'admin';
  avatar?: string;
  ativo: boolean;
  emailVerificado: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export type StatusCotacao = 
  | 'pendente' 
  | 'aceita' 
  | 'rejeitada' 
  | 'coletada' 
  | 'em_transito' 
  | 'entregue' 
  | 'cancelada';

export type TipoUsuario = 'cliente' | 'transportador' | 'admin';

export type StatusPagamento = 
  | 'pendente' 
  | 'processando' 
  | 'aprovado' 
  | 'rejeitado' 
  | 'reembolsado';

export interface FilterOptions {
  status?: string;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  pageSize?: number;
  ordenacao?: 'asc' | 'desc';
  ordenarPor?: string;
}
