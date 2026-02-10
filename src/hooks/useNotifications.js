import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import api from '@/api/client';

/**
 * Hook para buscar notificações REAIS do backend
 * REGRAS:
 * - Cotações Disponíveis: apenas cotações não expiradas (dataHoraFim > now)
 * - Cotações Aceitas: cotação foi aceita pelo transportador
 * - Chats: mensagens não lidas (cada mensagem = 1 notificação)
 */
export function useNotifications() {
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0 };

      try {
        const userType = user.userType || user.tipoUsuario;

        // TRANSPORTADOR
        if (userType === 'transportadora') {
          const [cotacoesDisponiveisRes, chatsRes] = await Promise.all([
            // Endpoint já filtra por expiração
            api.entities.cotacao.disponiveis({ limit: 100 }).catch(() => null),
            // Chats do transportador
            api.entities.chat.list({ usuarioId: user.id }).catch(() => null)
          ]);

          const cotacoesDisponiveis = cotacoesDisponiveisRes?.cotacoes || [];
          const chats = Array.isArray(chatsRes) ? chatsRes : [];

          // Contar mensagens não lidas nos chats
          let mensagensNaoLidas = 0;
          chats.forEach(chat => {
            if (chat.mensagens && Array.isArray(chat.mensagens)) {
              mensagensNaoLidas += chat.mensagens.filter(m => 
                m.remetenteId !== user.id && !m.lidoTransportadora
              ).length;
            }
          });

          return {
            cotacoesDisponiveis: cotacoesDisponiveis.length,
            cotacoesAceitas: 0, // TODO: implementar quando tiver endpoint
            chats: mensagensNaoLidas,
            total: cotacoesDisponiveis.length + mensagensNaoLidas
          };
        }

        // EMBARCADOR
        if (userType === 'embarcador') {
          const [cotacoesRes, chatsRes] = await Promise.all([
            api.entities.cotacao.list({ userId: user.id }).catch(() => null),
            api.entities.chat.list({ usuarioId: user.id }).catch(() => null)
          ]);

          const cotacoes = cotacoesRes?.cotacoes || [];
          const chats = Array.isArray(chatsRes) ? chatsRes : [];

          // Contar cotações com respostas novas
          const cotacoesComRespostas = cotacoes.filter(c => 
            c.respostas && c.respostas.length > 0 && c.status === 'aberta'
          ).length;

          // Contar mensagens não lidas nos chats
          let mensagensNaoLidas = 0;
          chats.forEach(chat => {
            if (chat.mensagens && Array.isArray(chat.mensagens)) {
              mensagensNaoLidas += chat.mensagens.filter(m => 
                m.remetenteId !== user.id && !m.lidoCliente
              ).length;
            }
          });

          return {
            cotacoes: cotacoesComRespostas,
            chats: mensagensNaoLidas,
            total: cotacoesComRespostas + mensagensNaoLidas
          };
        }

        // ADMIN - sem notificações
        return { total: 0 };

      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return { total: 0 };
      }
    },
    enabled: !!user,
    staleTime: 30000, // Cache de 30 segundos
    refetchInterval: 60000 // Atualiza a cada 1 minuto
  });

  return {
    notifications: notifications || { total: 0 },
    isLoading
  };
}
