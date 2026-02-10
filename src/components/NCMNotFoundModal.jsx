import React, { useState } from 'react';
import { AlertCircle, Send, X } from 'lucide-react';
import api from '@/api/client';

/**
 * Modal que aparece quando usuário pesquisa por um NCM
 * que não é encontrado no banco de dados
 */
export default function NCMNotFoundModal({ query, onClose, clienteId, clienteNome }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviarMensagem = async () => {
    if (!query || !clienteId) {
      console.error('Faltam dados para enviar mensagem');
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        ncmProcurado: query,
        remetenteNome: clienteNome || 'Cliente'
      };

      const res = await api.post('/chats/ncm-nao-encontrado', payload);

      if (res?.success || res?.data) {
        setEnviado(true);
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem NCM:', err);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-green-700/50 rounded-lg p-8 max-w-sm text-center">
          <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Mensagem Enviada!</h3>
          <p className="text-slate-300 mb-4">
            Sua solicitação para adicionar o NCM <span className="font-mono font-bold text-orange-400">{query}</span> foi enviada
            para o administrador e será analisada em breve.
          </p>
          <p className="text-slate-400 text-sm">
            Você será notificado quando o NCM for adicionado ao sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-lg max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-slate-700/50 px-6 py-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">NCM Não Encontrado</h3>
              <p className="text-slate-400 text-sm">Código: <span className="font-mono font-bold text-orange-300">{query}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-slate-300">
            O NCM <span className="font-mono font-bold text-orange-400">{query}</span> não foi encontrado em nossa base de dados.
          </p>

          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 space-y-2">
            <p className="text-slate-300 font-semibold text-sm">💡 O que você pode fazer:</p>
            <ul className="text-slate-400 text-sm space-y-1 ml-4">
              <li>✓ Verificar se o código está digitado corretamente</li>
              <li>✓ Tentar buscar pela descrição do produto</li>
              <li>✓ Enviar uma solicitação para adicionarmos o NCM</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>📋 Sugestão:</strong> Clique em "Solicitar Adição" e nossa equipe será notificada automaticamente. Analisaremos sua solicitação em breve!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/50 px-6 py-4 bg-slate-700/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition font-medium"
          >
            Fechar
          </button>
          <button
            onClick={handleEnviarMensagem}
            disabled={enviando}
            className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Solicitar Adição
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
