import apiClient from './client';

const api = apiClient.client;

// Listar todas as favoritas do usuário
export const listarFavoritas = async () => {
  try {
    const response = await api.get('/cotacoes-favoritas');
    return response;
  } catch (error) {
    console.error('Erro ao listar favoritas:', error);
    throw error;
  }
};

// Criar nova favorita
export const criarFavorita = async (cotacaoId, nome) => {
  try {
    const response = await api.post('/cotacoes-favoritas', {
      cotacaoId,
      nome,
    });
    return response;
  } catch (error) {
    console.error('Erro ao criar favorita:', error);
    throw error;
  }
};

// Obter favorita específica
export const obterFavorita = async (favoritaId) => {
  try {
    const response = await api.get(`/cotacoes-favoritas/${favoritaId}`);
    return response;
  } catch (error) {
    console.error('Erro ao obter favorita:', error);
    throw error;
  }
};

// Atualizar nome da favorita
export const atualizarFavorita = async (favoritaId, nome) => {
  try {
    const response = await api.put(`/cotacoes-favoritas/${favoritaId}`, {
      nome,
    });
    return response;
  } catch (error) {
    console.error('Erro ao atualizar favorita:', error);
    throw error;
  }
};

// Deletar favorita
export const deletarFavorita = async (favoritaId) => {
  try {
    const response = await api.delete(`/cotacoes-favoritas/${favoritaId}`);
    return response;
  } catch (error) {
    console.error('Erro ao deletar favorita:', error);
    throw error;
  }
};
