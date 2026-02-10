import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";

export default function ModalInformarAtraso({ 
  cotacao, 
  aberto, 
  onFechar, 
  onSucesso 
}) {
  const [motivoAtraso, setMotivoAtraso] = useState("");
  const [novaDataEntrega, setNovaDataEntrega] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const handleSalvar = async () => {
    if (!motivoAtraso.trim()) {
      setErro("Por favor, informe o motivo do atraso");
      return;
    }

    if (!novaDataEntrega) {
      setErro("Por favor, informe a nova data de entrega");
      return;
    }

    const novaData = new Date(novaDataEntrega);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (novaData <= hoje) {
      setErro("A nova data deve ser futura");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      // Atualizar cotação com nova data e motivo do atraso
      await base44.entities.Cotacao.update(cotacao.id, {
        motivoAtraso: motivoAtraso.trim(),
        dataNovaPrevisaoEntrega: new Date(novaDataEntrega).toISOString(),
        atrasoInformadoCliente: true
      });

      // Criar registro no histórico de atraso
      const resposta = await base44.entities.RespostaCotacao.filter({
        id: cotacao.respostaSelecionadaId
      });
      
      const transportadoraId = resposta[0]?.transportadoraId;

      if (transportadoraId) {
        const agora = new Date();
        const mes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
        const ano = String(agora.getFullYear());

        await base44.entities.HistoricoAtraso.create({
          cotacaoId: cotacao.id,
          transportadoraId: transportadoraId,
          clienteId: cotacao.clienteId,
          dataPrevistaOriginal: cotacao.dataPrevistaEntrega,
          dataNovaPrevisao: new Date(novaDataEntrega).toISOString(),
          dataInicioAtraso: cotacao.dataInicioAtraso || new Date().toISOString(),
          motivoAtraso: motivoAtraso.trim(),
          valorComissao: cotacao.valorComissao || 0,
          mes: mes,
          ano: ano,
          contabilizadoMes: false,
          contabilizadoAno: false
        });
      }

      if (onSucesso) onSucesso();
      onFechar();
      setMotivoAtraso("");
      setNovaDataEntrega("");
    } catch (error) {
      console.error("Erro ao informar atraso:", error);
      setErro("Erro ao salvar. Tente novamente.");
    }

    setSalvando(false);
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Informar Atraso ao Cliente
          </DialogTitle>
          <DialogDescription>
            Informe o motivo do atraso e a nova data prevista para entrega.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {erro && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="motivo" className="text-sm font-semibold">
              Motivo do Atraso *
            </Label>
            <Textarea
              id="motivo"
              value={motivoAtraso}
              onChange={(e) => setMotivoAtraso(e.target.value)}
              placeholder="Ex: Problema mecânico no veículo, condições climáticas adversas..."
              rows={4}
              maxLength={500}
              className="resize-none mt-2"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {motivoAtraso.length}/500 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="novaData" className="text-sm font-semibold">
              Nova Data de Entrega *
            </Label>
            <Input
              id="novaData"
              type="date"
              value={novaDataEntrega}
              onChange={(e) => setNovaDataEntrega(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-2"
            />
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>Atenção:</strong> Se não cumprir esta nova data, você será bloqueado 
              de participar de novas cotações até finalizar a entrega.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onFechar}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={salvando}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {salvando ? "Salvando..." : "Informar ao Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
