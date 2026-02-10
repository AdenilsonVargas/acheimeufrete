import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, MessageCircle, Send, AlertCircle, CheckCircle, TrendingDown, DollarSign } from 'lucide-react';

export default function NegociacaoCTe() {
  const { user } = useAuthStore();
  const [negociacoes, setNegociacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNeg, setSelectedNeg] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    valorProposta: '',
    decisao: '', // 'aprovar', 'rejeitar', 'contraproposição'
    mensagem: ''
  });

  useEffect(() => {
    fetchNegociacoes();
  }, [user]);

  const fetchNegociacoes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Buscar cotações com status de negociação (em_andamento)
      const res = await api.entities.cotacao.list({
        status: 'em_andamento',
        limit: 100
      });

      const todasCotacoes = res?.data || res || [];

      // Filtrar apenas as que têm respostas de cotação (negociações ativas)
      const comsRespostas = todasCotacoes.filter(cotacao => {
        // Se é embarcador, mostrar cotações suas com respostas de transportadores
        if (user?.userType === 'embarcador') {
          return cotacao.clienteId === user?.id && cotacao.respostasCotacao?.length > 0;
        }
        // Se é transportador, mostrar negociações em andamento
        return true;
      });

      setNegociacoes(comsRespostas);
      setError('');
    } catch (err) {
      console.error('Erro ao listar negociações', err);
      setError('Erro ao carregar negociações');
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    if (!selectedNeg) {
      setError('Selecione uma negociação');
      return false;
    }

    if (form.decisao === 'contraproposição') {
      const valor = parseFloat(form.valorProposta);
      if (!form.valorProposta || valor <= 0) {
        setError('Digite um valor válido para a contraproposição');
        return false;
      }

      // Verificar limite de tentativas de negociação
      const tentativas = (selectedNeg.tentativasNegociacao || 0) + 1;
      if (tentativas > 2) {
        setError('Limite de 2 tentativas de negociação atingido');
        return false;
      }
    }

    return true;
  };

  const handleEnviarResposta = async () => {
    setError('');
    setSuccess('');

    if (!validarFormulario()) {
      return;
    }

    try {
      const cotacaoId = selectedNeg.id || selectedNeg._id;

      let novoStatus = selectedNeg.status;
      let atualizacoes = {
        ultimaMensagem: form.mensagem || `Decisão: ${form.decisao}`,
        dataUltimaMensagem: new Date().toISOString(),
        tentativasNegociacao: (selectedNeg.tentativasNegociacao || 0) + 1
      };

      if (form.decisao === 'aprovar') {
        novoStatus = 'aceita';
        atualizacoes.statusNegociacao = 'aceita';
      } else if (form.decisao === 'rejeitar') {
        novoStatus = 'rejeitada';
        atualizacoes.statusNegociacao = 'rejeitada';
      } else if (form.decisao === 'contraproposição') {
        novoStatus = 'em_andamento';
        atualizacoes.valorContraPropostado = parseFloat(form.valorProposta);
        atualizacoes.statusNegociacao = 'aguardando_resposta';
      }

      atualizacoes.status = novoStatus;

      await api.entities.cotacao.update(cotacaoId, atualizacoes);

      setSuccess('Resposta enviada com sucesso!');
      setForm({ valorProposta: '', decisao: '', mensagem: '' });
      
      setTimeout(() => {
        fetchNegociacoes();
        setSelectedNeg(null);
      }, 1500);
    } catch (err) {
      console.error('Erro ao enviar resposta', err);
      setError('Erro ao enviar resposta. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'aceita': return 'text-green-400';
      case 'rejeitada': return 'text-red-400';
      case 'em_andamento': return 'text-yellow-400';
      default: return 'text-cyan-400';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'aceita': return 'bg-green-900/20 border-green-700/50';
      case 'rejeitada': return 'bg-red-900/20 border-red-700/50';
      case 'em_andamento': return 'bg-yellow-900/20 border-yellow-700/50';
      default: return 'bg-cyan-900/20 border-cyan-700/50';
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'embarcador' ? 'embarcador' : 'transportador'}>
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" /> Negociação CT-e
        </h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Negociações */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4">Negociações Ativas ({negociacoes.length})</h2>

            {loading ? (
              <p className="text-slate-300">Carregando...</p>
            ) : negociacoes.length === 0 ? (
              <p className="text-slate-300">Nenhuma negociação ativa no momento</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {negociacoes.map(neg => {
                  const isSelected = selectedNeg?.id === neg.id || selectedNeg?._id === neg._id;
                  return (
                    <button
                      key={neg.id || neg._id}
                      onClick={() => setSelectedNeg(neg)}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-900/30'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-white font-semibold">{neg.produtoNome}</h3>
                        <span className={`text-sm font-semibold ${getStatusColor(neg.status || 'em_andamento')}`}>
                          {neg.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-2">
                        {neg.enderecoColetaCidade} → {neg.destinatarioCidade}
                      </p>
                      <div className="flex justify-between items-end">
                        <div className="text-sm text-slate-300">
                          <p>Tentativas: {neg.tentativasNegociacao || 0}/2</p>
                        </div>
                        <p className="text-cyan-400 font-semibold">
                          Valor: R$ {(neg.valorTotal || 0).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Painel de Resposta */}
          <div className={`bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 ${
            !selectedNeg ? 'opacity-50' : ''
          }`}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Resposta
            </h2>

            {selectedNeg ? (
              <div className="space-y-4">
                {/* Info da Negociação */}
                <div className={`p-3 rounded-lg border ${getStatusBg(selectedNeg.status)}`}>
                  <p className="text-slate-400 text-sm mb-1">Cotação</p>
                  <p className="text-white font-semibold mb-2">{selectedNeg.produtoNome}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400">Valor Ofertado</p>
                      <p className="text-cyan-300 font-semibold">R$ {(selectedNeg.valorTotal || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tentativas</p>
                      <p className="text-yellow-300 font-semibold">{selectedNeg.tentativasNegociacao || 0}/2</p>
                    </div>
                  </div>
                </div>

                {selectedNeg.valorContraPropostado && (
                  <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Última Contraproposição</p>
                    <p className="text-purple-300 font-semibold">R$ {(parseFloat(selectedNeg.valorContraPropostado) || 0).toFixed(2)}</p>
                    <p className="text-slate-400 text-xs mt-2">Diferença: {((parseFloat(selectedNeg.valorContraPropostado) || 0) - (parseFloat(selectedNeg.valorTotal) || 0)).toFixed(2)} ({((((parseFloat(selectedNeg.valorContraPropostado) || 0) - (parseFloat(selectedNeg.valorTotal) || 0)) / (parseFloat(selectedNeg.valorTotal) || 1)) * 100).toFixed(1)}%)</p>
                  </div>
                )}

                {/* Opções de Decisão */}
                <div>
                  <label className="block text-slate-400 text-sm mb-3">Sua Decisão</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, decisao: 'aprovar' })}
                      className={`w-full p-3 rounded-lg border-2 transition text-left font-semibold ${
                        form.decisao === 'aprovar'
                          ? 'border-green-600 bg-green-900/30 text-green-300'
                          : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-green-600'
                      }`}
                    >
                      ✓ Aprovar Valor
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, decisao: 'contraproposição' })}
                      className={`w-full p-3 rounded-lg border-2 transition text-left font-semibold flex items-center gap-2 ${
                        form.decisao === 'contraproposição'
                          ? 'border-orange-600 bg-orange-900/30 text-orange-300'
                          : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-orange-600'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" /> Fazer Contraproposição
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, decisao: 'rejeitar' })}
                      className={`w-full p-3 rounded-lg border-2 transition text-left font-semibold ${
                        form.decisao === 'rejeitar'
                          ? 'border-red-600 bg-red-900/30 text-red-300'
                          : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-red-600'
                      }`}
                    >
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>

                {/* Campo de Valor para Contraproposição */}
                {form.decisao === 'contraproposição' && (
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Seu Valor (R$) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={form.valorProposta}
                        onChange={(e) => setForm({ ...form, valorProposta: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                    {form.valorProposta && (
                      <p className="text-sm text-slate-400 mt-2">
                        Diferença: R$ {((parseFloat(form.valorProposta) || 0) - (parseFloat(selectedNeg?.valorTotal) || 0)).toFixed(2)} ({(((parseFloat(form.valorProposta) || 0) - (parseFloat(selectedNeg?.valorTotal) || 0)) / (parseFloat(selectedNeg?.valorTotal) || 1) * 100).toFixed(1)}%)
                      </p>
                    )}
                  </div>
                )}

                {/* Campo de Mensagem */}
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Mensagem (Opcional)</label>
                  <textarea
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                    placeholder="Sua resposta..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition h-24 resize-none"
                  />
                </div>

                {/* Botão Enviar */}
                <button
                  onClick={handleEnviarResposta}
                  disabled={!form.decisao}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Enviar Resposta
                </button>
              </div>
            ) : (
              <p className="text-slate-300">Selecione uma negociação para responder</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
