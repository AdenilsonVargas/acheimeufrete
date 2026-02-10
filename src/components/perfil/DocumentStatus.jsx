import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle, XCircle, Clock, Edit2, Save, X } from 'lucide-react';

/**
 * Componente de Status de Documento
 * Mostra informações sobre um documento (pendente, aprovado, rejeitado)
 */
export default function DocumentStatus({ documento, onStatusChange }) {
  const getStatusBadge = (status) => {
    const config = {
      'pendente_analise': {
        bg: 'bg-yellow-900',
        text: 'text-yellow-200',
        icon: Clock,
        label: 'Pendente'
      },
      'aprovado': {
        bg: 'bg-green-900',
        text: 'text-green-200',
        icon: CheckCircle,
        label: 'Aprovado'
      },
      'rejeitado': {
        bg: 'bg-red-900',
        text: 'text-red-200',
        icon: XCircle,
        label: 'Rejeitado'
      }
    };

    const config_item = config[status] || config['pendente_analise'];
    const Icon = config_item.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config_item.bg}`}>
        <Icon className="w-4 h-4" />
        <span className={`text-sm font-semibold ${config_item.text}`}>
          {config_item.label}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">{documento.tipo}</h4>
            <p className="text-sm text-slate-400">{documento.nomeArquivo || 'Sem nome'}</p>
          </div>
        </div>
        {getStatusBadge(documento.status)}
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        {documento.dataUpload && (
          <p>📅 Enviado: {new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</p>
        )}
        {documento.dataAprovacao && (
          <p className="text-green-400">✅ Aprovado: {new Date(documento.dataAprovacao).toLocaleDateString('pt-BR')}</p>
        )}
        {documento.motivoRejeicao && (
          <p className="text-red-400">❌ Motivo: {documento.motivoRejeicao}</p>
        )}
      </div>

      {documento.url && (
        <button className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium">
          📄 Ver documento
        </button>
      )}
    </div>
  );
}
