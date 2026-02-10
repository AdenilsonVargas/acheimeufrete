import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import useAuthStore from '@/hooks/useAuthStore';
import { apiClient } from '@/api/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Send, AlertCircle, Loader, Check, CheckCheck } from 'lucide-react';

/**
 * Chat em Tempo Real para Cotações
 * 
 * FUNCIONALIDADES:
 * - Conexão WebSocket via Socket.io
 * - Histórico de mensagens
 * - Notificações de digitação
 * - Status de mensagem (enviada/lida)
 * - Dark mode completo
 * - Segurança com JWT
 */

const Chat = () => {
  const { cotacaoId } = useParams();
  const { user } = useAuthStore();

  // Estados de conexão e carregamento
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados de dados
  const [mensagens, setMensagens] = useState([]);
  const [cotacao, setCotacao] = useState(null);
  const [participantes, setParticipantes] = useState({});

  // Estados de forma
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [digitando, setDigitando] = useState({});

  // Refs
  const containerMensagens = useRef(null);
  const inputRef = useRef(null);
  const timeoutDigitacao = useRef(null);

  // ========== EFEITO: Carregar dados iniciais ==========
  useEffect(() => {
    const carregarInicial = async () => {
      try {
        setCarregando(true);

        // Carregar dados da cotação
        const cotResponse = await apiClient.get(`/api/chat-cotacao/${cotacaoId}/info`);
        if (cotResponse.data.success) {
          setCotacao(cotResponse.data.data);
        }

        // Carregar histórico de mensagens
        const historyResponse = await apiClient.get(`/api/chat-cotacao/${cotacaoId}`);
        if (historyResponse.data.success) {
          setMensagens(historyResponse.data.data || []);
        }

        setErro(null);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setErro('Falha ao carregar chat');
      } finally {
        setCarregando(false);
      }
    };

    carregarInicial();
  }, [cotacaoId]);

  // ========== EFEITO: Conectar WebSocket ==========
  useEffect(() => {
    if (!user?.token) return;

    // Determinar URL do servidor (usar a mesma do cliente)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const serverUrl = `${window.location.protocol}//${wsHost}`;

    const novoSocket = io(serverUrl, {
      auth: {
        token: user.token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // ===== EVENTOS DE CONEXÃO =====
    novoSocket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket');
      setConectado(true);

      // Entrar na sala da cotação
      novoSocket.emit('join-cotacao', cotacaoId);
    });

    novoSocket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor WebSocket');
      setConectado(false);
    });

    // ===== EVENTOS DE MENSAGEM =====
    novoSocket.on('new-message', (mensagem) => {
      console.log('📨 Nova mensagem recebida:', mensagem);

      setMensagens(prev => {
        // Evitar duplicatas
        if (prev.some(m => m.id === mensagem.id)) {
          return prev;
        }
        return [...prev, mensagem];
      });

      // Marcar como lida se é de outro usuário
      if (mensagem.usuarioId !== user?.id) {
        novoSocket.emit('mark-as-read', {
          cotacaoId,
          mensagenIds: [mensagem.id]
        });
      }
    });

    novoSocket.on('messages-read', (data) => {
      setMensagens(prev =>
        prev.map(m =>
          data.mensagensIds.includes(m.id)
            ? { ...m, lida: true }
            : m
        )
      );
    });

    // ===== EVENTOS DE DIGITAÇÃO =====
    novoSocket.on('user-typing', (data) => {
      setDigitando(prev => ({
        ...prev,
        [data.userId]: data.userName
      }));

      // Remover indicador após 3 segundos
      setTimeout(() => {
        setDigitando(prev => {
          const novo = { ...prev };
          delete novo[data.userId];
          return novo;
        });
      }, 3000);
    });

    // ===== EVENTOS DE USUÁRIOS =====
    novoSocket.on('user-online', (data) => {
      console.log(`✅ ${data.userName} entrou no chat`);
      setParticipantes(prev => ({
        ...prev,
        [data.userId]: { nome: data.userName, online: true }
      }));

      // Adicionar notificação de sistema
      setMensagens(prev => [...prev, {
        id: `system-${Date.now()}`,
        conteudo: data.message,
        sistema: true,
        timestamp: data.timestamp
      }]);
    });

    novoSocket.on('user-offline', (data) => {
      console.log(`❌ ${data.userName} saiu do chat`);
      setParticipantes(prev => ({
        ...prev,
        [data.userId]: { nome: data.userName, online: false }
      }));

      // Adicionar notificação de sistema
      setMensagens(prev => [...prev, {
        id: `system-${Date.now()}`,
        conteudo: data.message,
        sistema: true,
        timestamp: data.timestamp
      }]);
    });

    // ===== EVENTOS DE ERRO =====
    novoSocket.on('error', (data) => {
      console.error('Erro WebSocket:', data);
      setErro(data.message);
    });

    novoSocket.on('connect_error', (err) => {
      console.error('Erro de conexão WebSocket:', err);
      setErro('Erro ao conectar ao servidor');
    });

    setSocket(novoSocket);

    return () => {
      novoSocket.disconnect();
    };
  }, [user?.token, user?.id, cotacaoId]);

  // ========== EFEITO: Auto-scroll para última mensagem ==========
  useEffect(() => {
    if (containerMensagens.current) {
      setTimeout(() => {
        containerMensagens.current.scrollTop = containerMensagens.current.scrollHeight;
      }, 0);
    }
  }, [mensagens]);

  // ========== HANDLER: Detectar digitação ==========
  const handleDigitacao = (e) => {
    setNovaMensagem(e.target.value);

    if (!socket || !conectado) return;

    // Notificar digitação
    socket.emit('user-typing', { cotacaoId });

    // Limpar timeout anterior
    if (timeoutDigitacao.current) {
      clearTimeout(timeoutDigitacao.current);
    }
  };

  // ========== HANDLER: Enviar mensagem ==========
  const handleEnviar = async (e) => {
    e.preventDefault();

    if (!novaMensagem.trim() || !socket || !conectado || enviando) {
      return;
    }

    const mensagemParaEnviar = novaMensagem.trim();
    setNovaMensagem('');
    setEnviando(true);

    try {
      // Enviar via Socket.io (salva automaticamente no banco)
      socket.emit('send-message', {
        cotacaoId,
        conteudo: mensagemParaEnviar
      });

      inputRef.current?.focus();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setErro('Falha ao enviar mensagem');
      setNovaMensagem(mensagemParaEnviar);
    } finally {
      setEnviando(false);
    }
  };

  // ========== RENDER: Estado de carregamento ==========
  if (carregando) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando chat...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ========== RENDER: Estado de erro ==========
  if (erro && !mensagens.length) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-400">{erro}</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* ===== HEADER ===== */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chat da Cotação
              </h1>
              {cotacao && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {cotacao.titulo} • {cotacao.cidadeColeta} → {cotacao.cidadeEntrega}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {conectado ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* ===== CONTAINER DE MENSAGENS ===== */}
        <div
          ref={containerMensagens}
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 space-y-4"
        >
          {mensagens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma mensagem ainda. Comece a conversa!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mensagens.map((mensagem) => {
                const isOwn = mensagem.usuarioId === user?.id;
                const isSistema = mensagem.sistema;

                if (isSistema) {
                  return (
                    <div key={mensagem.id} className="flex justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-1 rounded-full">
                        {mensagem.conteudo}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold opacity-75 mb-1">
                          {mensagem.usuarioNome}
                        </p>
                      )}
                      <p className="break-words">{mensagem.conteudo}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(mensagem.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isOwn && (
                          <>
                            {mensagem.lida ? (
                              <CheckCheck className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Indicador de digitação */}
              {Object.values(digitando).length > 0 && (
                <div className="flex gap-2 items-center text-gray-500 dark:text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>{Object.values(digitando)[0]} está digitando...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== CAIXA DE ERRO =====  */}
        {erro && mensagens.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{erro}</p>
          </div>
        )}

        {/* ===== INPUTCAIXA DE MENSAGEM ===== */}
        <form onSubmit={handleEnviar} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={novaMensagem}
              onChange={handleDigitacao}
              placeholder="Digite uma mensagem..."
              disabled={!conectado || enviando}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!conectado || enviando || !novaMensagem.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {enviando ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
