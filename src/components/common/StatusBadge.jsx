import React from 'react';

const statusConfig = {
  'pendente': { bg: 'bg-yellow-900', text: 'text-yellow-300', label: 'Pendente' },
  'aceita': { bg: 'bg-green-900', text: 'text-green-300', label: 'Aceita' },
  'rejeitada': { bg: 'bg-red-900', text: 'text-red-300', label: 'Rejeitada' },
  'em_coleta': { bg: 'bg-blue-900', text: 'text-blue-300', label: 'Em Coleta' },
  'em_transito': { bg: 'bg-cyan-900', text: 'text-cyan-300', label: 'Em Trânsito' },
  'entregue': { bg: 'bg-green-900', text: 'text-green-300', label: 'Entregue' },
  'cancelada': { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Cancelada' },
  'em_processamento': { bg: 'bg-indigo-900', text: 'text-indigo-300', label: 'Em Processamento' },
  'active': { bg: 'bg-green-900', text: 'text-green-300', label: 'Ativo' },
  'inactive': { bg: 'bg-gray-700', text: 'text-gray-300', label: 'Inativo' },
};

export default function StatusBadge({ status, customLabel = null }) {
  const config = statusConfig[status?.toLowerCase()] || statusConfig['pendente'];
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      {customLabel || config.label}
    </span>
  );
}
