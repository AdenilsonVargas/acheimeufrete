import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AvaliacaoClienteModal({ isOpen, onClose, cotacao, cliente, onSuccess, obrigatorio = true }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (nota === 0) {
      setError("Por favor, selecione uma nota de 1 a 5 estrelas");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Criar avaliação do cliente
      const avaliacao = await base44.entities.AvaliacaoCliente.create({
        cotacaoId: cotacao.id,
        transportadoraId: cotacao.transportadoraId,
        clienteId: cliente.id,
        nota,
        comentario: comentario.trim() || null,
        dataAvaliacao: new Date().toISOString()
      });

      // Buscar todas as avaliações do cliente para recalcular média
      const todasAvaliacoes = await base44.entities.AvaliacaoCliente.filter({
        clienteId: cliente.id
      });

      const somaNotas = todasAvaliacoes.reduce((sum, av) => sum + av.nota, 0);
      const novaMedia = somaNotas / todasAvaliacoes.length;

      // Atualizar perfil do cliente com nova média
      await base44.entities.PerfilCliente.update(cliente.id, {
        avaliacaoMedia: novaMedia,
        totalAvaliacoes: todasAvaliacoes.length
      });

      // Atualizar cotação com ID da avaliação
      await base44.entities.Cotacao.update(cotacao.id, {
        avaliacaoClienteId: avaliacao.id,
        avaliada: true
      });

      // Chamar onSuccess imediatamente após salvar avaliação
      await onSuccess();
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      if (err?.message?.includes("Rate limit") || err?.message?.includes("429")) {
        setError("Sistema ocupado. Aguarde alguns segundos e tente novamente.");
      } else {
        setError("Erro ao enviar avaliação. Tente novamente.");
      }
      setLoading(false);
    }
  };

  const renderEstrelas = () => {
    const estrelas = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= (hoveredStar || nota);
      estrelas.push(
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={() => setNota(i)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-10 h-10 ${
              filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        </button>
      );
    }
    return estrelas;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Avaliar Cliente</DialogTitle>
          <DialogDescription>
            Avalie o cliente <strong>{cliente?.nome || "Cliente"}</strong> nesta entrega
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Como foi a experiência com este cliente? *
            </label>
            <div className="flex justify-center gap-2 p-4 bg-gray-50 rounded-lg">
              {renderEstrelas()}
            </div>
            {nota > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                Você selecionou: <strong>{nota} {nota === 1 ? 'estrela' : 'estrelas'}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Compartilhe sua experiência com este cliente..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            {!obrigatorio && (
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading || nota === 0}
              className={`${obrigatorio ? 'w-full' : 'flex-1'} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800`}
            >
              {loading ? "Finalizando..." : "Enviar Avaliação e Finalizar"}
            </Button>
          </div>
          {obrigatorio && (
            <p className="text-xs text-center text-gray-500">
              A avaliação é obrigatória para finalizar a entrega
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
