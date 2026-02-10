import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function CompletarCadastro() {
  const { user } = useAuthStore();
  const [etapas, setEtapas] = useState({
    dadosBasicos: true,
    endereco: false,
    documentos: false,
    bancarios: false,
    confirmacao: false
  });
  const [etapaAtual, setEtapaAtual] = useState(0);

  const etapasLista = [
    { nome: 'Dados Básicos', key: 'dadosBasicos' },
    { nome: 'Endereço', key: 'endereco' },
    { nome: 'Documentos', key: 'documentos' },
    { nome: 'Bancários', key: 'bancarios' },
    { nome: 'Confirmação', key: 'confirmacao' }
  ];

  const handleProxima = async () => {
    if (etapaAtual < etapasLista.length - 1) {
      setEtapas({...etapas, [etapasLista[etapaAtual + 1].key]: true});
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleAnterior = () => {
    if (etapaAtual > 0) setEtapaAtual(etapaAtual - 1);
  };

  const handleConcluir = async () => {
    try {
      await api.auth.updatePerfil({ status: 'completo' });
      alert('Cadastro concluído com sucesso!');
    } catch (err) {
      console.error('Erro ao concluir', err);
    }
  };

  const progressoPercentual = ((etapaAtual + 1) / etapasLista.length) * 100;

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle className="w-8 h-8 text-green-600" /> Completar Cadastro
        </h1>

        <div className="card mb-8">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Progresso: {Math.round(progressoPercentual)}%</p>
              <p className="text-white font-semibold text-sm">
                {etapaAtual + 1} de {etapasLista.length}
              </p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-600 to-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${progressoPercentual}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between mb-6">
            {etapasLista.map((etapa, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx < etapaAtual ? 'bg-green-900 text-green-300' :
                  idx === etapaAtual ? 'bg-orange-600 text-white' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {idx < etapaAtual ? '✓' : idx + 1}
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">{etapa.nome}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{etapasLista[etapaAtual].nome}</h2>

          {etapaAtual === 0 && (
            <div className="space-y-4">
              <p className="text-slate-300 mb-4">Verifique e atualize seus dados básicos</p>
              <input placeholder="Nome Completo" className="input-field w-full" defaultValue={user?.nome} />
              <input placeholder="Email" className="input-field w-full" defaultValue={user?.email} />
              <input placeholder="Telefone" className="input-field w-full" defaultValue={user?.telefone} />
            </div>
          )}

          {etapaAtual === 1 && (
            <div className="space-y-4">
              <p className="text-slate-300 mb-4">Confirme seu endereço</p>
              <input placeholder="Rua" className="input-field w-full" defaultValue={user?.endereco} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Número" className="input-field w-full" />
                <input placeholder="Complemento" className="input-field w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Cidade" className="input-field w-full" />
                <input placeholder="Estado" className="input-field w-full" />
                <input placeholder="CEP" className="input-field w-full" />
              </div>
            </div>
          )}

          {etapaAtual === 2 && (
            <div className="space-y-4">
              <p className="text-slate-300 mb-4">Verifique seus documentos</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-slate-300">RG - Enviado</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-slate-300">CPF - Enviado</p>
                </div>
              </div>
            </div>
          )}

          {etapaAtual === 3 && (
            <div className="space-y-4">
              <p className="text-slate-300 mb-4">Dados Bancários (para receber pagamentos)</p>
              <select className="input-field w-full">
                <option>Banco</option>
                <option>Banco do Brasil</option>
                <option>Itaú</option>
                <option>Bradesco</option>
              </select>
              <input placeholder="Agência" className="input-field w-full" />
              <input placeholder="Conta" className="input-field w-full" />
              <input placeholder="Tipo de Conta" className="input-field w-full" />
            </div>
          )}

          {etapaAtual === 4 && (
            <div className="space-y-4">
              <p className="text-white font-semibold mb-4">Revise seus dados</p>
              <div className="bg-slate-800 p-4 rounded space-y-2">
                <p className="text-slate-300"><span className="text-slate-400">Nome:</span> {user?.nome}</p>
                <p className="text-slate-300"><span className="text-slate-400">Email:</span> {user?.email}</p>
                <p className="text-slate-300"><span className="text-slate-400">Telefone:</span> {user?.telefone}</p>
              </div>
              <label className="flex items-center gap-2 text-slate-300">
                <input type="checkbox" className="w-4 h-4" />
                Confirmo que todos os dados estão corretos
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-between">
          <button 
            onClick={handleAnterior}
            disabled={etapaAtual === 0}
            className="btn-secondary"
          >
            ← Anterior
          </button>
          {etapaAtual === etapasLista.length - 1 ? (
            <button 
              onClick={handleConcluir}
              className="btn-primary"
            >
              Concluir ✓
            </button>
          ) : (
            <button 
              onClick={handleProxima}
              className="btn-primary"
            >
              Próxima →
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
