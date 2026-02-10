import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AvaliacaoModal({ isOpen, onClose, cotacao, transportadora, onSuccess }) {
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (nota === 0) {
      setError("Por favor, selecione uma nota de 1 a 5 estrelas");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const user = await base44.auth.me();

      // Criar avaliação
      await base44.entities.Avaliacao.create({
        cotacaoId: cotacao.id,
        clienteId: user.perfilAtivoId,
        transportadoraId: transportadora.id,
        nota: nota,
        comentario: comentario.trim() || "",
        dataAvaliacao: new Date().toISOString()
      });

      // Buscar perfil da transportadora
      const perfisTransp = await base44.entities.PerfilTransportadora.filter({
        userIdGoogle: transportadora.id
      });

      if (perfisTransp.length > 0) {
        const perfilTransp = perfisTransp[0];
        
        // Calcular nova média
        const totalAtual = perfilTransp.totalAvaliacoes || 0;
        const mediaAtual = perfilTransp.avaliacaoMedia || 0;
        const novoTotal = totalAtual + 1;
        const novaMedia = ((mediaAtual * totalAtual) + nota) / novoTotal;

        // Atualizar perfil da transportadora
        await base44.entities.PerfilTransportadora.update(perfilTransp.id, {
          avaliacaoMedia: novaMedia,
          totalAvaliacoes: novoTotal
        });
      }

      // Marcar cotação como avaliada
      await base44.entities.Cotacao.update(cotacao.id, {
        avaliada: true
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      setError("Erro ao enviar avaliação. Tente novamente.");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Transportadora</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {transportadora.nome}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="mb-3 block text-center">Selecione sua avaliação:</Label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <button
                  key={estrela}
                  type="button"
                  className="transition-transform hover:scale-110 focus:outline-none"
                  onMouseEnter={() => setNotaHover(estrela)}
                  onMouseLeave={() => setNotaHover(0)}
                  onClick={() => setNota(estrela)}
                >
                  <Star
                    className={`w-10 h-10 ${
                      estrela <= (notaHover || nota)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {nota > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                Você selecionou: {nota} {nota === 1 ? 'estrela' : 'estrelas'}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="comentario">Comentário (Opcional)</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte sobre sua experiência com esta transportadora..."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || nota === 0}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {submitting ? (
              "Enviando..."
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}