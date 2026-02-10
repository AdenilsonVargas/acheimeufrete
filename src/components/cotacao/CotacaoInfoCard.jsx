import React from 'react';
import { MapPin, Truck, Package, DollarSign, Calendar } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

export default function CotacaoInfoCard({ cotacao, onClick = null }) {
  if (!cotacao) return null;

  const statusMap = {
    pendente: 'pendente',
    aceita: 'aceita',
    rejeitada: 'rejeitada',
    coletada: 'em_coleta'
  };

  return (
    <div 
      onClick={onClick}
      className={`card cursor-pointer hover:border-orange-500 transition group ${onClick ? 'hover:shadow-lg hover:shadow-orange-500/20' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition">
            Cotação #{cotacao.id?.toString().slice(-6) || Math.random().toString(36).slice(-6).toUpperCase()}
          </h3>
          <p className="text-sm text-gray-400">
            {new Date(cotacao.dataCriacao || Date.now()).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <StatusBadge status={statusMap[cotacao.status] || 'pendente'} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Rota</p>
            <p className="text-sm text-white truncate">
              {cotacao.origem?.cidade || 'Origem'} → {cotacao.destino?.cidade || 'Destino'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Package className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-400">Peso</p>
            <p className="text-sm text-white">{cotacao.peso || 0}kg</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Truck className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-400">Tipo</p>
            <p className="text-sm text-white">{cotacao.tipoVeiculo || 'Padrão'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-400">Prazo</p>
            <p className="text-sm text-white">{cotacao.prazo || '5-7 dias'}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Valor estimado:</span>
          <span className="text-2xl font-bold text-orange-500">
            R$ {(cotacao.valor || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
