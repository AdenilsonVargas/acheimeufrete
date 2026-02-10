/**
 * API Client - Desvinculado do base44
 * Sistema de API para comunicação com backend
 */

import axios from 'axios';

// Em desenvolvimento, usa o proxy do Vite (/api)
// Em produção, usa VITE_API_URL ou localhost:5000/api
const API_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  : '/api';

console.log('📡 API URL carregada:', API_URL);
console.log('🔍 VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('🔍 PROD mode:', import.meta.env.PROD);

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de requisição
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de resposta
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('🔴 API Error:', error);
        
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        
        // Se for erro de rede, retorna mensagem mais clara
        if (!error.response) {
          const networkError = {
            message: 'Network Error - Backend não disponível. Usando modo teste.',
            code: 'NETWORK_ERROR',
            originalError: error.message,
          };
          return Promise.reject(networkError);
        }
        
        return Promise.reject(error.response?.data || { message: error.message });
      }
    );
  }

  // ============================================
  // AUTH - Autenticação
  // ============================================
  
  auth = {
    login: (email, password, selectedUserType) =>
      this.client.post('/auth/login', { email, password, selectedUserType }),
    
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    },
    
    register: (userData) =>
      this.client.post('/auth/register', userData),
    
    me: () => {
      console.log('🔐 apiClient.auth.me(): Buscando dados do usuário autenticado...');
      return this.client.get('/auth/me').then(response => {
        console.log('✅ apiClient.auth.me() sucesso:', response);
        return response;
      }).catch(error => {
        console.error('❌ apiClient.auth.me() erro:', error);
        throw error;
      });
    },
    
    updateMe: (data) =>
      this.client.put('/auth/me', data),
    
    updatePerfil: (id, data) =>
      this.client.put(`/auth/perfil/${id}`, data),
    
    refreshToken: () =>
      this.client.post('/auth/refresh'),
    
    verifyEmail: (token) =>
      this.client.post('/auth/verify-email', { token }),
    
    requestPasswordReset: (email) =>
      this.client.post('/auth/request-password-reset', { email }),
    
    resetPassword: (token, password) =>
      this.client.post('/auth/reset-password', { token, password }),
  };

  // ============================================
  // PERFIL - Dados de Perfil e Documentos (Fase 10)
  // ============================================

  perfil = {
    // Obter perfil do usuário autenticado
    getMeuPerfil: () =>
      this.client.get('/perfil/meu-perfil'),
    
    // Atualizar perfil (apenas campos permitidos: telefone, fotoPerfil)
    updatePerfil: (data) =>
      this.client.put('/perfil/meu-perfil', data),
    
    // Obter status dos documentos do usuário
    getStatusDocumentos: () =>
      this.client.get('/perfil/meus-documentos/status'),
    
    // Admin: Obter perfil de um usuário específico
    getPerfilPorId: (userId) =>
      this.client.get(`/perfil/usuario/${userId}`),
    
    // Admin: Obter estatísticas de aprovação
    getEstatisticasAprovacao: () =>
      this.client.get('/perfil/estatisticas/aprovacao'),
  };

  // ============================================
  // ADMIN - Aprovação de Cadastro (Fase 10)
  // ============================================

  admin = {
    // Listar usuários pendentes de verificação
    getUsuariosPendentes: (params) =>
      this.client.get('/admin/usuarios-pendentes', { params }),
    
    // Obter detalhes de um usuário e seus documentos
    getUsuarioDetalhes: (userId) =>
      this.client.get(`/admin/usuario/${userId}/documentos`),
    
    // Aprovar cadastro de um usuário
    aprovarCadastro: (userId) =>
      this.client.put(`/admin/usuario/${userId}/aprovar`),
    
    // Rejeitar cadastro de um usuário
    rejeitarCadastro: (userId, motivo) =>
      this.client.put(`/admin/usuario/${userId}/rejeitar`, { motivo }),
    
    // Mudar status de um documento
    mudarStatusDocumento: (documentoId, status, motivo) =>
      this.client.put(`/admin/documento/${documentoId}/status`, { status, motivo }),
  };

  // ============================================
  // ENTITIES - CRUD de Entidades
  // ============================================

  entities = {
    // Cotações (backend usa /api/cotacoes)
    cotacao: {
      list: (params) =>
        this.client.get('/cotacoes', { params }),
      
      get: (id) =>
        this.client.get(`/cotacoes/${id}`),
      
      create: (data) =>
        this.client.post('/cotacoes', data),
      
      update: (id, data) =>
        this.client.put(`/cotacoes/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/cotacoes/${id}`),
      
      filter: (query) =>
        this.client.get('/cotacoes', { params: query }),
      
      // Listar cotações disponíveis para transportadores (já filtra por expiração)
      disponiveis: (params) =>
        this.client.get('/cotacoes/disponiveis', { params }),
    },

    // Respostas de Cotação (backend usa /api/respostas)
    respostaCotacao: {
      list: (params) =>
        this.client.get('/respostas', { params }),
      
      get: (id) =>
        this.client.get(`/respostas/${id}`),
      
      create: (data) =>
        this.client.post('/respostas', data),
      
      update: (id, data) =>
        this.client.put(`/respostas/${id}`),
      
      delete: (id) =>
        this.client.delete(`/respostas/${id}`),
      
      filter: (query) =>
        this.client.get('/respostas', { params: query }),
      
      minhasRespostas: () =>
        this.client.get('/respostas/minhas-respostas'),
    },

    // Produtos
    produto: {
      list: (params) =>
        this.client.get('/produtos', { params }),
      
      get: (id) =>
        this.client.get(`/produtos/${id}`),
      
      create: (data) =>
        this.client.post('/produtos', data),
      
      update: (id, data) =>
        this.client.put(`/produtos/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/produtos/${id}`),
      
      filter: (query) =>
        this.client.get('/produtos', { params: query }),
    },

    // Endereços de Coleta (backend usa /api/enderecos-coleta)
    enderecoColeta: {
      list: (params) =>
        this.client.get('/enderecos-coleta', { params }),
      
      get: (id) =>
        this.client.get(`/enderecos-coleta/${id}`),
      
      create: (data) =>
        this.client.post('/enderecos-coleta', data),
      
      update: (id, data) =>
        this.client.put(`/enderecos-coleta/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/enderecos-coleta/${id}`),
      
      marcarPadrao: (id) =>
        this.client.patch(`/enderecos-coleta/${id}/marcar-padrao`),
    },

    // Destinatários
    destinatario: {
      list: (params) =>
        this.client.get('/destinatarios', { params }),
      
      get: (id) =>
        this.client.get(`/destinatarios/${id}`),
      
      create: (data) =>
        this.client.post('/destinatarios', data),
      
      update: (id, data) =>
        this.client.put(`/destinatarios/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/destinatarios/${id}`),
    },

    // Perfil Embarcador
    perfilEmbarcador: {
      get: (id) =>
        this.client.get(`/perfil-embarcador/${id}`),
      
      create: (data) =>
        this.client.post('/perfil-embarcador', data),
      
      update: (id, data) =>
        this.client.put(`/perfil-embarcador/${id}`, data),
    },

    // Perfil Transportador
    perfilTransportador: {
      get: (id) =>
        this.client.get(`/perfil-transportador/${id}`),
      
      create: (data) =>
        this.client.post('/perfil-transportador', data),
      
      update: (id, data) =>
        this.client.put(`/perfil-transportador/${id}`, data),
      
      list: (params) =>
        this.client.get('/perfil-transportador', { params }),
    },

    // Chats
    chat: {
      list: (params) =>
        this.client.get('/chat', { params }),
      
      get: (id) =>
        this.client.get(`/chat/${id}`),
      
      create: (data) =>
        this.client.post('/chat', data),
      
      sendMessage: (chatId, message) =>
        this.client.post(`/chat/${chatId}/message`, { message }),
      
      filter: (query) =>
        this.client.get('/chat', { params: query }),
    },

    // Pagamentos
    pagamento: {
      list: (params) =>
        this.client.get('/pagamento', { params }),
      
      get: (id) =>
        this.client.get(`/pagamento/${id}`),
      
      create: (data) =>
        this.client.post('/pagamento', data),
      
      update: (id, data) =>
        this.client.put(`/pagamento/${id}`, data),
    },

    // Avaliações (backend usa /api/avaliacoes)
    avaliacao: {
      list: (params) =>
        this.client.get('/avaliacoes', { params }),
      
      create: (data) =>
        this.client.post('/avaliacoes', data),
    },

    // Opções de Envio
    opcaoEnvio: {
      list: (params) =>
        this.client.get('/opcao-envio', { params }),
      
      create: (data) =>
        this.client.post('/opcao-envio', data),
      
      update: (id, data) =>
        this.client.put(`/opcao-envio/${id}`, data),
    },

    // NCM Atendido
    ncmAtendido: {
      list: (params) =>
        this.client.get('/ncm-atendido', { params }),
      
      create: (data) =>
        this.client.post('/ncm-atendido', data),
      
      delete: (id) =>
        this.client.delete(`/ncm-atendido/${id}`),
    },

    // NCM master
    ncm: {
      search: (query, limit = 20) =>
        this.client.get('/ncms/search', { params: { query, limit } }),
    },

    // Regiões Atendidas
    regiaoAtendida: {
      list: (params) =>
        this.client.get('/regioes/list', { params }),
      
      create: (data) =>
        this.client.post('/regioes', data),
      
      delete: (id) =>
        this.client.delete(`/regioes/${id}`),
    },

    // Financeiro
    financeiro: {
      list: (params) =>
        this.client.get('/financeiro', { params }),
      
      get: (id) =>
        this.client.get(`/financeiro/${id}`),
    },

    // CTe - Conhecimento de Transporte Eletrônico
    cte: {
      list: (params) =>
        this.client.get('/cte', { params }),
      
      get: (id) =>
        this.client.get(`/cte/${id}`),
      
      create: (data) =>
        this.client.post('/cte', data),
      
      update: (id, data) =>
        this.client.put(`/cte/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/cte/${id}`),
      
      emitir: (id) =>
        this.client.post(`/cte/${id}/emitir`, {}),
      
      cancelar: (id) =>
        this.client.post(`/cte/${id}/cancelar`, {}),
      
      filter: (query) =>
        this.client.get('/cte', { params: query }),
    },

    // CIOT - Conhecimento de Transporte Intermodal
    ciot: {
      list: (params) =>
        this.client.get('/ciot', { params }),
      
      get: (id) =>
        this.client.get(`/ciot/${id}`),
      
      create: (data) =>
        this.client.post('/ciot', data),
      
      update: (id, data) =>
        this.client.put(`/ciot/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/ciot/${id}`),
    },

    // MDFe - Manifesto de Documento Fiscal Eletrônico
    mdfe: {
      list: (params) =>
        this.client.get('/mdfe', { params }),
      
      get: (id) =>
        this.client.get(`/mdfe/${id}`),
      
      create: (data) =>
        this.client.post('/mdfe', data),
      
      update: (id, data) =>
        this.client.put(`/mdfe/${id}`, data),
    },

    // Mensagens
    mensagem: {
      list: (params) =>
        this.client.get('/mensagem', { params }),
      
      get: (id) =>
        this.client.get(`/mensagem/${id}`),
      
      create: (data) =>
        this.client.post('/mensagem', data),
      
      markAsRead: (id) =>
        this.client.put(`/mensagem/${id}/read`, {}),
      
      filter: (query) =>
        this.client.get('/mensagem', { params: query }),
    },

    // Assinatura Premium
    assinaturaPremium: {
      list: (params) =>
        this.client.get('/assinatura-premium', { params }),
      
      get: (id) =>
        this.client.get(`/assinatura-premium/${id}`),
      
      create: (data) =>
        this.client.post('/assinatura-premium', data),
      
      update: (id, data) =>
        this.client.put(`/assinatura-premium/${id}`, data),
      
      cancel: (id) =>
        this.client.post(`/assinatura-premium/${id}/cancel`, {}),
    },

    // Credenciais
    credencial: {
      list: (params) =>
        this.client.get('/credencial', { params }),
      
      get: (id) =>
        this.client.get(`/credencial/${id}`),
      
      create: (data) =>
        this.client.post('/credencial', data),
      
      update: (id, data) =>
        this.client.put(`/credencial/${id}`, data),
      
      delete: (id) =>
        this.client.delete(`/credencial/${id}`),
      
      filter: (query) =>
        this.client.get('/credencial', { params: query }),
    },

    // Histórico
    historico: {
      list: (params) =>
        this.client.get('/historico', { params }),
      
      get: (id) =>
        this.client.get(`/historico/${id}`),
    },

    // Acesso Temporário
    acessoTemporario: {
      list: (params) =>
        this.client.get('/acesso-temporario', { params }),
      
      create: (data) =>
        this.client.post('/acesso-temporario', data),
      
      revoke: (id) =>
        this.client.delete(`/acesso-temporario/${id}`),
    },

    // Pacote Premium
    pacotePremium: {
      list: (params) =>
        this.client.get('/pacote-premium', { params }),
      
      get: (id) =>
        this.client.get(`/pacote-premium/${id}`),
    },

    // Perfil
    perfil: {
      get: (id) =>
        this.client.get(`/perfil/${id}`),
      
      update: (id, data) =>
        this.client.put(`/perfil/${id}`, data),
      
      filter: (query) =>
        this.client.get('/perfil', { params: query }),
    },
  };

  // ============================================
  // FILES - Upload de Arquivos
  // ============================================

  files = {
    upload: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return this.client.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    uploadMultiple: (files) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      return this.client.post('/files/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    delete: (fileId) =>
      this.client.delete(`/files/${fileId}`),
   
     download: (fileId) =>
       this.client.get(`/files/${fileId}/download`, { responseType: 'blob' }),
   
     downloadCTe: (cteId) =>
       this.client.get(`/files/cte/${cteId}/download`, { responseType: 'blob' }),
  };

  // ============================================
  // UTILITIES
  // ============================================

  setToken(token) {
    localStorage.setItem('auth_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    delete this.client.defaults.headers.common['Authorization'];
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export const apiClient = new APIClient();
export default apiClient;
