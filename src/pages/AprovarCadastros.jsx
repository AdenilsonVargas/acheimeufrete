import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/api/client';

export default function AprovarCadastros() {
  const { user } = useAuth();
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [detalhes, setDetalhes] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarPendentes();
  }, [filtro]);

  const carregarPendentes = async () => {
    try {
      setLoading(true);
      const query = filtro === 'todos' ? '' : `?userType=${filtro}`;
      const response = await apiClient.client.get(`/admin/cadastros/pendentes${query}`);
      setPendentes(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar pendentes:', error);
      alert('Erro ao carregar cadastros pendentes');
    } finally {
      setLoading(false);
    }
  };

  const carregarDetalhes = async (userId) => {
    try {
      setSelecionado(userId);
      const response = await apiClient.client.get(`/admin/cadastro/${userId}`);
      setDetalhes(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes');
    }
  };

  const aprovar = async () => {
    try {
      setProcessando(true);
      await apiClient.client.post(`/admin/cadastro/${selecionado}/aprovar`);
      alert('✅ Cadastro aprovado com sucesso!');
      setDetalhes(null);
      setSelecionado(null);
      setMotivo('');
      carregarPendentes();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar cadastro');
    } finally {
      setProcessando(false);
    }
  };

  const rejeitar = async () => {
    if (!motivo.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    try {
      setProcessando(true);
      await apiClient.client.post(`/admin/cadastro/${selecionado}/rejeitar`, {
        motivo
      });
      alert('❌ Cadastro rejeitado');
      setDetalhes(null);
      setSelecionado(null);
      setMotivo('');
      carregarPendentes();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar cadastro');
    } finally {
      setProcessando(false);
    }
  };

  const getTipoBadge = (userType) => {
    const tipos = {
      transportador: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚚 Transportador' },
      embarcador: { bg: 'bg-purple-100', text: 'text-purple-800', label: '📦 Embarcador' },
      transportadora: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '🏢 Transportadora' }
    };
    const tipo = tipos[userType] || { bg: 'bg-gray-100', text: 'text-gray-800', label: userType };
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tipo.bg} ${tipo.text}`}>{tipo.label}</span>;
  };

  // Modal de detalhes
  if (detalhes) {
    return (
      <DashboardLayout userType={user?.userType || 'admin'}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detalhes do Cadastro</h2>
              <button
                onClick={() => {
                  setDetalhes(null);
                  setSelecionado(null);
                  setMotivo('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 dark:text-gray-400 text-sm">Nome</label>
                  <p className="font-semibold text-slate-900 dark:text-white">{detalhes.nomeCompleto}</p>
                </div>
                <div>
                  <label className="text-gray-600 dark:text-gray-400 text-sm">Tipo</label>
                  <div className="mt-1">{getTipoBadge(detalhes.userType)}</div>
                </div>
                <div>
                  <label className="text-gray-600 dark:text-gray-400 text-sm">Email</label>
                  <p className="font-semibold text-slate-900 dark:text-white">{detalhes.email}</p>
                </div>
                <div>
                  <label className="text-gray-600 dark:text-gray-400 text-sm">CPF/CNPJ</label>
                  <p className="font-semibold text-slate-900 dark:text-white">{detalhes.cpfOuCnpj}</p>
                </div>
              </div>

              {detalhes.userType === 'transportador' && detalhes.perfilTransportadora && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Documentos Transportador</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600 dark:text-gray-400">RNTRC</label>
                      <p className="font-semibold">{detalhes.perfilTransportadora.rntrc || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 dark:text-gray-400">Vencimento</label>
                      <p className="font-semibold">{detalhes.perfilTransportadora.dataVencimentoRntrc || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 dark:text-gray-400">Status Documentos</label>
                      <p className="font-semibold">{detalhes.perfilTransportadora.statusDocumentos}</p>
                    </div>
                  </div>
                </div>
              )}

              {detalhes.userType === 'embarcador' && detalhes.perfil && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Documentos Embarcador</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-600 dark:text-gray-400">CNPJ</label>
                      <p className="font-semibold">{detalhes.perfil.cnpj || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-gray-600 dark:text-gray-400">Status Documentos</label>
                      <p className="font-semibold">{detalhes.perfil.statusDocumentos}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Seção de Rejeição */}
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Motivo da Rejeição (se aplicável)
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                className="w-full p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:border-red-600"
                rows="3"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={aprovar}
                disabled={processando}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <CheckCircle size={20} />
                Aprovar Cadastro
              </button>
              <button
                onClick={rejeitar}
                disabled={processando || !motivo.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
              >
                <XCircle size={20} />
                Rejeitar
              </button>
              <button
                onClick={() => {
                  setDetalhes(null);
                  setSelecionado(null);
                  setMotivo('');
                }}
                disabled={processando}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={user?.userType || 'admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Aprovação de Cadastros 📋</h1>
          <p className="text-orange-100">Revise e aprove novos cadastros de transportadores e embarcadores</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          {['todos', 'transportador', 'embarcador'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltro(tipo)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filtro === tipo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300'
              }`}
            >
              {tipo === 'todos' ? 'Todos' : tipo === 'transportador' ? '🚚 Transportadores' : '📦 Embarcadores'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        ) : pendentes.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-blue-600" size={32} />
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Nenhum cadastro pendente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Data Cadastro</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((cadastro) => (
                  <tr key={cadastro.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{cadastro.nomeCompleto}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{cadastro.email}</td>
                    <td className="px-6 py-4">{getTipoBadge(cadastro.userType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(cadastro.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => carregarDetalhes(cadastro.id)}
                        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        <Eye size={18} />
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
