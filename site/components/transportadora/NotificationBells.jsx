import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function NotificationBells({ user }) {
  const navigate = useNavigate();

  // Buscar cotações disponíveis (novas cotações para precificar)
  const { data: cotacoesDisponiveis = [] } = useQuery({
    queryKey: ['notif-cotacoes-disponiveis', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return [];

      const [opcoesEnvio, ncmsAtendidos, regioesAtendidas, todasCotacoes] = await Promise.all([
        base44.entities.OpcaoEnvio.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.NCMAtendido.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.RegiaoAtendida.filter({ transportadoraId: user.perfilAtivoId }),
        base44.entities.Cotacao.filter({})
      ]);

      const agora = new Date();
      const cotacoesAbertas = todasCotacoes.filter(c => {
        const statusValido = (c.status === "aberta" || c.status === "em_andamento" || c.status === "visualizada") &&
          c.status !== "aguardando_pagamento";
        const dataFim = c.dataHoraFim ? new Date(c.dataHoraFim) : null;
        const naoExpirada = dataFim ? dataFim > agora : false;
        return statusValido && naoExpirada;
      });

      const minhasRespostas = await base44.entities.RespostaCotacao.filter({
        transportadoraId: user.perfilAtivoId
      });
      const cotacoesRespondidas = minhasRespostas.map(r => r.cotacaoId);

      const ncmCodes = ncmsAtendidos.map(n => n.ncmCode);
      const temRegioes = regioesAtendidas.length > 0;
      const temOpcoes = opcoesEnvio.length > 0;

      const cotacoesCompativeis = cotacoesAbertas.filter(cotacao => {
        const ncmMatch = ncmCodes.includes(cotacao.produtoNCM);
        
        let regiaoMatch = true;
        if (temRegioes) {
          regiaoMatch = regioesAtendidas.some(regiao => {
            if (regiao.estados && regiao.estados.length > 0) {
              return regiao.estados.includes(cotacao.destinatarioEstado);
            }
            if (regiao.cepInicio && regiao.cepFim) {
              const cep = cotacao.destinatarioCep.replace(/\D/g, '');
              return cep >= regiao.cepInicio && cep <= regiao.cepFim;
            }
            return true;
          });
        }

        const jaRespondida = cotacoesRespondidas.includes(cotacao.id);

        return ncmMatch && regiaoMatch && temOpcoes && !jaRespondida;
      });

      return cotacoesCompativeis;
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  // Buscar cotações aceitas e mensagens não lidas
  const { data: chatsData } = useQuery({
    queryKey: ['notif-chats-transportadora', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user) return { cotacoesAceitas: 0, mensagensNaoLidas: 0 };

      // Buscar todos os chats da transportadora
      const meusChats = await base44.entities.Chat.filter({
        transportadoraId: user.perfilAtivoId
      });

      let mensagensNaoLidas = 0;
      
      meusChats.forEach(chat => {
        // Ignorar expirados/bloqueados ou com data expirada
        const expiradoPorStatus = chat.status === "expirado" || chat.status === "bloqueado";
        const expiradoPorData = chat.dataHoraExpiracao ? new Date(chat.dataHoraExpiracao) <= new Date() : false;
        if (expiradoPorStatus || expiradoPorData) return;

        const naoLido = chat.lidoPorTransportadora === false;
        const temMsgCliente = Array.isArray(chat.mensagens) && chat.mensagens.some(m => m.remetente === "cliente");

        // Conta 1 por chat com mensagem de cliente não lida
        if (temMsgCliente && naoLido) {
          mensagensNaoLidas += 1;
          return;
        }
      });

      return {
        mensagensNaoLidas
      };
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 15000 // Atualiza a cada 15 segundos
  });

  const numCotacoesDisponiveis = cotacoesDisponiveis.length;
  const numMensagensNaoLidas = chatsData?.mensagensNaoLidas || 0;
  const totalNotificacoes = numCotacoesDisponiveis + numMensagensNaoLidas;

  return (
    <div className="flex items-center gap-2">
      {/* Botão 1: Mensagens (Vermelho) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="w-5 h-5 text-gray-700" />
            {totalNotificacoes > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {totalNotificacoes > 9 ? '9+' : totalNotificacoes}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Alertas (chats e cotações)</h4>
            {totalNotificacoes > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Chats não lidos: {numMensagensNaoLidas}</p>
                <p className="text-sm text-gray-600">Cotações disponíveis: {numCotacoesDisponiveis}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => navigate(createPageUrl("ChatsTransportadora"))}
                  >
                    Ver Chats
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate(createPageUrl("CotacoesDisponiveis"))}
                  >
                    Ver Cotações
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma notificação pendente</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Botão 2: Cotações Disponíveis (Verde) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <DollarSign className="w-5 h-5 text-green-600" />
            {numCotacoesDisponiveis > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-green-500 text-white text-xs">
                {numCotacoesDisponiveis > 9 ? '9+' : numCotacoesDisponiveis}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Novas Cotações</h4>
            {numCotacoesDisponiveis > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {numCotacoesDisponiveis} cotação(ões) aguardando sua proposta
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => navigate(createPageUrl("CotacoesDisponiveis"))}
                >
                  Ver Cotações
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma cotação disponível no momento</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
