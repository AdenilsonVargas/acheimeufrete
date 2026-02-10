import React, { useState } from 'react';
import { Star, Send, AlertCircle, X } from 'lucide-react';

/**
 * Modal de Avaliação de Cliente
 * 
 * Props:
 * - onClose: função para fechar modal
 * - cotacaoId: ID da cotação
 * - clienteNome: nome do cliente
 * - onAvaliacaoEnviada: callback após enviar
 * - apiClient: instância do axios
 */

const AvaliarCliente = ({ onClose, cotacaoId, clienteNome, onAvaliacaoEnviada, apiClient }) => {
  const [nota, setNota] = useState(0);
  const [notPagamento, setNotPagamento] = useState(0);
  const [notComunicacao, setNotComunicacao] = useState(0);
  const [notOrganizacao, setNotOrganizacao] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(false);

  const handleEnviar = async (e) => {
    e.preventDefault();

    if (nota === 0) {
      setErro('Avaliação geral é obrigatória');
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const response = await apiClient.post('/api/avaliacoes/cliente', {
        cotacaoId,
        nota,
        pagamento: notPagamento || null,
        comunicacao: notComunicacao || null,
        organizacao: notOrganizacao || null,
        comentario
      });

      if (response.data.success) {
        setSucesso(true);
        setTimeout(() => {
          if (onAvaliacaoEnviada) {
            onAvaliacaoEnviada();
          }
          onClose();
        }, 1500);
      } else {
        setErro(response.data.error || 'Erro ao enviar avaliação');
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao enviar avaliação');
      console.error('Erro ao avaliar:', err);
    } finally {
      setEnviando(false);
    }
  };

  const renderStars = (rating, setRating, max = 5) => (
    <div className="flex gap-2">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setRating(i + 1)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={`${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (sucesso) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Avaliação Enviada!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Obrigado por avaliar. Sua avaliação foi registrada com sucesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Avaliar {clienteNome}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleEnviar} className="p-6 space-y-6">
          {/* Erro */}
          {erro && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{erro}</p>
            </div>
          )}

          {/* Avaliação Geral */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Avaliação Geral <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              {renderStars(nota, setNota)}
              {nota > 0 && (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {nota}/5
                </span>
              )}
            </div>
          </div>

          {/* Critérios Opcionais */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Critérios específicos (opcional)
            </p>

            {/* Pagamento */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Pontualidade de Pagamento
              </label>
              {renderStars(notPagamento, setNotPagamento)}
            </div>

            {/* Comunicação */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Comunicação
              </label>
              {renderStars(notComunicacao, setNotComunicacao)}
            </div>

            {/* Organização */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Organização e Clareza
              </label>
              {renderStars(notOrganizacao, setNotOrganizacao)}
            </div>
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Comentário (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value.substring(0, 1000))}
              placeholder="Compartilhe sua experiência..."
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comentario.length}/1000 caracteres
            </p>
          </div>

          {/* Dicas */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>💡 Dica:</strong> Seja honesto e justo. Suas avaliações ajudam clientes a melhorar e facilitam parcerias futuras.
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || nota === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Enviar Avaliação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvaliarCliente;
