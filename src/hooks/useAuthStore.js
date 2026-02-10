import { create } from 'zustand';
import { apiClient } from '../api/client';

export const useAuthStore = create((set) => ({
  // Carregar user do localStorage se existir (para persistência entre reloads)
  user: (() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log('💾 INIT: Usuário carregado do localStorage:', { 
          email: parsedUser?.email, 
          userType: parsedUser?.userType 
        });
        return parsedUser;
      } else {
        console.log('💾 INIT: Nenhum usuário no localStorage');
        return null;
      }
    } catch (e) {
      console.error('❌ INIT: Erro ao recuperar user do localStorage:', e);
      return null;
    }
  })(),
  
  token: (() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('🔑 INIT: Token encontrado no localStorage (primeiros 20 chars):', token.substring(0, 20) + '...');
    } else {
      console.log('🔑 INIT: Nenhum token no localStorage');
    }
    return token;
  })() || null,

  // ✨ NOVO: Tipo de usuário selecionado NESTA SESSÃO (pode ser diferente de user.userType)
  selectedUserType: (() => {
    const saved = localStorage.getItem('selected_user_type');
    if (saved) {
      console.log('👤 INIT: Tipo selecionado carregado do localStorage:', saved);
      return saved;
    }
    return null;
  })(),

  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  
  // ✨ NOVO: Definir tipo selecionado (embarcador ou transportador)
  setSelectedUserType: (userType) => {
    console.log('👤 setSelectedUserType:', userType);
    localStorage.setItem('selected_user_type', userType);
    set({ selectedUserType: userType });
  },

  // ✨ NOVO: Limpar tipo selecionado
  clearSelectedUserType: () => {
    console.log('👤 clearSelectedUserType: Limpando tipo selecionado');
    localStorage.removeItem('selected_user_type');
    set({ selectedUserType: null });
  },
  
  setToken: (token) => {
    localStorage.setItem('auth_token', token);
    apiClient.setToken(token);
    set({ token });
  },

  login: async (email, password, selectedUserType) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔐 useAuthStore: Iniciando login com:', { email, password: '***', selectedUserType });
      const response = await apiClient.auth.login(email, password, selectedUserType);
      console.log('✅ useAuthStore: Login bem-sucedido! Response:', response);
      const { token, user } = response;
      
      set({ user, token, selectedUserType, isLoading: false });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('selected_user_type', selectedUserType);
      apiClient.setToken(token);
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      console.error('   Mensagem:', error?.message);
      console.error('   Code:', error?.code);
      console.error('   Response:', error?.response);
      
      // NÃO criar mock users - exigir backend disponível
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao fazer login';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.auth.register(userData);
      const { token, user } = response;
      
      set({ user, token, isLoading: false });
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      apiClient.setToken(token);
      
      return response;
    } catch (error) {
      console.error('❌ Erro ao registrar:', error);
      
      // NÃO criar mock users - exigir backend disponível
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao registrar';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // Remover token do client da API
    apiClient.logout();
    // Limpar todo o estado
    set({ user: null, token: null, selectedUserType: null, isLoading: false, error: null });
    // Remover todos os dados do localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('selected_user_type');
    localStorage.removeItem('IS_MOCK_MODE');
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('✋ checkAuth: Sem token no localStorage');
      return;
    }

    try {
      console.log('🔍 checkAuth: Validando token com backend...');
      const response = await apiClient.auth.me();
      // Garantir que userType está presente
      const user = response?.user || response;
      if (!user?.userType) {
        console.warn('⚠️ checkAuth: userType ausente na resposta do backend!', user);
      }
      const selectedUserType = localStorage.getItem('selected_user_type');
      set({ user, token, selectedUserType });
      console.log('✅ checkAuth: Usuário restaurado:', { 
        email: user?.email, 
        userType: user?.userType,
        selectedUserType 
      });
    } catch (error) {
      // CRITICAL: NÃO limpar localStorage se houver erro temporário!
      // Apenas fazer log do erro
      console.error('❌ checkAuth: Erro ao validar com backend:', error?.message);
      console.warn('⚠️ checkAuth: Mantendo sessão do localStorage apesar do erro');
      
      // Apenas notificar erro sem limpar state
      set({ error: 'Erro ao validar sessão com servidor' });
      
      // IMPORTANTE: NÃO executar logout aqui!
      // User pode estar em modo offline
    }
  },
}));;

export default useAuthStore;
