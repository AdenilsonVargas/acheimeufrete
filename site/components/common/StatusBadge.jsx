import React from "react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  aberta: { label: "Aberta", className: "bg-blue-100 text-blue-800" },
  em_andamento: { label: "Em Andamento", className: "bg-yellow-100 text-yellow-800" },
  visualizada: { label: "Visualizada", className: "bg-purple-100 text-purple-800" },
  aguardando_pagamento: { label: "Aguardando Pagamento", className: "bg-orange-100 text-orange-800" },
  aceita: { label: "Aceita", className: "bg-green-100 text-green-800" },
  em_transito: { label: "Em Trânsito", className: "bg-indigo-100 text-indigo-800" },
  aguardando_confirmacao: { label: "Aguardando Confirmação", className: "bg-yellow-100 text-yellow-800" },
  finalizada: { label: "Finalizada", className: "bg-green-100 text-green-800" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800" },
  contestada: { label: "Contestada", className: "bg-red-100 text-red-800" },
  pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Aprovado", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800" },
  blocked: { label: "Bloqueado", className: "bg-gray-100 text-gray-800" },
  default: { label: "Desconhecido", className: "bg-gray-100 text-gray-800" }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
