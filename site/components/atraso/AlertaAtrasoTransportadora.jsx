import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AlertaAtrasoTransportadora({ 
  perfilTransportadora,
  cotacoesAtrasadas = []
}) {
  if (!perfilTransportadora) return null;

  const { 
    entregasAtrasoMes = 0, 
    entregasAtrasoAno = 0,
    bloqueadaCotacoes = false,
    motivoBloqueio = ""
  } = perfilTransportadora;

  // Alerta de bloqueio (mais crítico)
  if (bloqueadaCotacoes) {
    return (
      <Alert className="mb-6 bg-red-50 border-red-300 animate-pulse">
        <Ban className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-lg">⛔ BLOQUEADO - Participação em Cotações Suspensa</strong>
              <p className="mt-1">{motivoBloqueio || "Você possui entregas em atraso que precisam ser finalizadas."}</p>
              <p className="mt-2 font-semibold">
                Finalize as entregas pendentes para ser desbloqueado.
              </p>
            </div>
            <Link to={createPageUrl("EmEntregaTransportadora")}>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
                Ver Entregas
              </button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta de proximidade de multa mensal (10 entregas)
  if (entregasAtrasoMes >= 8) {
    const faltam = 10 - entregasAtrasoMes;
    return (
      <Alert className="mb-6 bg-orange-50 border-orange-300">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong className="text-base">⚠️ Atenção! Você tem {entregasAtrasoMes} de 10 entregas em atraso este mês</strong>
          <p className="mt-1">
            {faltam === 0 
              ? "Multa de 50% sobre comissões das cargas atrasadas será aplicada ao atingir 10 atrasos no mês."
              : `Faltam apenas ${faltam} atraso(s) para multa de 50% sobre comissões das cargas atrasadas.`
            }
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta de proximidade de multa anual (100 entregas)
  if (entregasAtrasoAno >= 80) {
    const faltam = 100 - entregasAtrasoAno;
    return (
      <Alert className="mb-6 bg-yellow-50 border-yellow-300">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong className="text-base">⚠️ Você tem {entregasAtrasoAno} entregas em atraso este ano</strong>
          <p className="mt-1">
            Ao atingir 100 atrasos no ano, será aplicada multa de 25% sobre todas as comissões das cargas atrasadas.
            Faltam {faltam} atrasos para atingir este limite.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Alerta informativo se houver atrasos mas sem risco imediato
  if (entregasAtrasoMes > 0) {
    return (
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          <strong>{entregasAtrasoMes} de 10 entregas com atraso este mês</strong> | 
          <span className="ml-2">{entregasAtrasoAno} entregas com atraso no ano</span>
          <p className="text-xs mt-1 text-blue-600">
            A contagem mensal zera no início de cada mês. Multas: 10 atrasos/mês = 50% | 100 atrasos/ano = 25%
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}