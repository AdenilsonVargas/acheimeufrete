import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  ArrowLeft,
  User,
  Shield,
  Clock,
  Package,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function ChatSuporte() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const cotacaoId = urlParams.get('cotacaoId');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
  };

  // Buscar cotação
  const { data: cotacao } = useQuery({
    queryKey: ['cotacao-suporte', cotacaoId],
    queryFn: async () => {
      if (!cotacaoId) return null;
      const cotacoes = await base44.entities.Cotacao.filter({ id: cotacaoId });
      return cotacoes[0] || null;
    },
    enabled: !!cotacaoId
  });

  // Buscar ou criar chat de suporte
  const { data: chatSuporte, refetch: refetchChat } = useQuery({
    queryKey: ['chat-suporte', cotacaoId, user?.perfilAtivoId],
    queryFn: async () => {
      if (!cotacaoId || !user) return null;
      
      // Buscar chat existente
      const chats = await base44.entities.Chat.filter({
        cotacaoId: cotacaoId,
        tipo: "suporte"
      });
      
      if (chats.length > 0) {
        return chats[0];
      }
      
      // Criar novo chat de suporte
      const novoChat = await base44.entities.Chat.create({
        cotacaoId: cotacaoId,
        clienteId: user.perfilAtivoId,
        transportadoraId: "admin", // Admin como destinatário
        tipo: "suporte",
        status: "ativo",
        dataHoraInicio: new Date().toISOString(),
        dataHoraExpiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        mensagens: [{
          remetente: "sistema",
          mensagem: "Chat de suporte iniciado. Um administrador irá responder em breve.",
          tipoMensagem: "texto",
          dataHora: new Date().toISOString()
        }]
      });
      
      return novoChat;
    },
    enabled: !!cotacaoId && !!user,
    refetchInterval: 5000 // Atualizar a cada 5 segundos
  });

  // Scroll para o fim das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSuporte?.mensagens]);

  const handleEnviarMensagem = async () => {
    if (!mensagem.trim() || !chatSuporte) return;

    setEnviando(true);
    try {
      const novaMensagem = {
        remetente: "cliente",
        mensagem: mensagem.trim(),
        tipoMensagem: "texto",
        dataHora: new Date().toISOString()
      };

      await base44.entities.Chat.update(chatSuporte.id, {
        mensagens: [...(chatSuporte.mensagens || []), novaMensagem],
        status: "aguardando_transportadora" // Na verdade aguardando admin
      });

      setMensagem("");
      refetchChat();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
    setEnviando(false);
  };

  if (!user) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!cotacaoId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cotação não especificada. Volte para a página de cotações finalizadas.
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("CotacoesFinalizadasCliente")} className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex flex-col">
      <PageHeader
        title="Suporte"
        description="Chat com a administração"
        showBack={true}
      />

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col">
        {/* Info da cotação */}
        {cotacao && (
          <Card className="mb-4">
            <CardContent className="p-3 flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Cotação #{cotacao.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-500">{cotacao.produtoNome}</p>
              </div>
              <Badge>{cotacao.status}</Badge>
            </CardContent>
          </Card>
        )}

        {/* Área de mensagens */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Chat com Administração
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
            {chatSuporte?.mensagens?.map((msg, index) => {
              const isCliente = msg.remetente === "cliente";
              const isSistema = msg.remetente === "sistema";

              return (
                <div
                  key={index}
                  className={`flex ${isCliente ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isSistema
                        ? 'bg-gray-100 text-gray-600 text-center w-full'
                        : isCliente
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {!isSistema && (
                      <div className="flex items-center gap-2 mb-1">
                        {isCliente ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">
                          {isCliente ? 'Você' : 'Administrador'}
                        </span>
                      </div>
                    )}
                    <p className={`text-sm ${isSistema ? 'italic' : ''}`}>
                      {msg.mensagem}
                    </p>
                    <p className={`text-xs mt-1 ${isCliente ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.dataHora).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input de mensagem */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensagem()}
                disabled={enviando}
              />
              <Button
                onClick={handleEnviarMensagem}
                disabled={enviando || !mensagem.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <Clock className="w-3 h-3 inline mr-1" />
              Um administrador irá responder o mais breve possível.
            </p>
          </div>
        </Card>

        <div className="mt-4">
          <Link to={createPageUrl("CotacoesFinalizadasCliente")}>
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Cotações Finalizadas
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
