import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, CheckSquare, CreditCard, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function NotificationBellsCliente({ user }) {
  // Buscar chats com mensagens não lidas
  const { data: mensagensNaoLidas = 0 } = useQuery({
    queryKey: ['notif-chats-cliente', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user?.perfilAtivoId) return 0;
      
      const chats = await base44.entities.Chat.filter({
        clienteId: user.perfilAtivoId,
        lidoPorCliente: false
      });

      return chats.length;
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 15000
  });

  // Buscar cotações aguardando aprovação de CT-e
  const { data: cotacoesAguardandoAprovacao = [] } = useQuery({
    queryKey: ['notif-cte-aprovacao', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user?.perfilAtivoId) return [];
      
      const cotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "aguardando_aprovacao_cte"
      });

      return cotacoes;
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 30000
  });

  // Buscar cotações aguardando pagamento
  const { data: cotacoesAguardandoPagamento = [] } = useQuery({
    queryKey: ['notif-pagamento', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user?.perfilAtivoId) return [];
      
      const cotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "aguardando_pagamento"
      });

      return cotacoes;
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 30000
  });

  // Buscar cotações finalizadas não avaliadas
  const { data: cotacoesNaoAvaliadas = [] } = useQuery({
    queryKey: ['notif-avaliacoes', user?.perfilAtivoId],
    queryFn: async () => {
      if (!user?.perfilAtivoId) return [];
      
      const cotacoes = await base44.entities.Cotacao.filter({
        clienteId: user.perfilAtivoId,
        status: "finalizada",
        avaliada: false
      });

      return cotacoes;
    },
    enabled: !!user?.perfilAtivoId,
    refetchInterval: 60000
  });

  const totalNotificacoesGerais = cotacoesAguardandoAprovacao.length + 
                                   cotacoesAguardandoPagamento.length + 
                                   cotacoesNaoAvaliadas.length;

  return (
    <div className="flex items-center gap-4">
      {/* Sino de Mensagens/Chats */}
      {mensagensNaoLidas > 0 && (
        <Link to={createPageUrl("Chats")}>
          <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
            <MessageSquare className="w-6 h-6 text-gray-700" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
            </Badge>
          </div>
        </Link>
      )}

      {/* Sino de Notificações Gerais */}
      {totalNotificacoesGerais > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-6 h-6 text-gray-700" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500 text-white text-xs">
                {totalNotificacoesGerais > 9 ? '9+' : totalNotificacoesGerais}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold">Notificações Pendentes</h4>
              </div>

              {/* CT-e para Aprovar */}
              {cotacoesAguardandoAprovacao.length > 0 && (
                <Link to={createPageUrl("Dashboard")}>
                  <div className="p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckSquare className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-semibold text-red-800">
                        Aprovação CT-e Pendente
                      </p>
                    </div>
                    <p className="text-xs text-red-700">
                      {cotacoesAguardandoAprovacao.length} cotação(ões) aguardando sua aprovação
                    </p>
                  </div>
                </Link>
              )}

              {/* Pagamentos Pendentes */}
              {cotacoesAguardandoPagamento.length > 0 && (
                <Link to={createPageUrl("Creditos")}>
                  <div className="p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-orange-600" />
                      <p className="text-sm font-semibold text-orange-800">
                        Pagamento Pendente
                      </p>
                    </div>
                    <p className="text-xs text-orange-700">
                      {cotacoesAguardandoPagamento.length} cotação(ões) aguardando pagamento
                    </p>
                  </div>
                </Link>
              )}

              {/* Avaliações Pendentes */}
              {cotacoesNaoAvaliadas.length > 0 && (
                <Link to={createPageUrl("CotacoesFinalizadasCliente")}>
                  <div className="p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm font-semibold text-yellow-800">
                        Avaliações Pendentes
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {cotacoesNaoAvaliadas.length} cotação(ões) aguardando avaliação
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
