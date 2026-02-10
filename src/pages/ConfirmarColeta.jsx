import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CheckCircle2, MapPin, Truck, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function ConfirmarColeta() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coletasPendentes, setColetasPendentes] = useState([]);
  const [coletasConfirmadas, setColetasConfirmadas] = useState([]);
  const [selectedCotacao, setSelectedCotacao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [codigoConfirmacao, setCodigoConfirmacao] = useState('');

  useEffect(() => {
    fetchColetas();
  }, [user]);

  const fetchColetas = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Cotações em andamento (aguardando coleta)
      const resEmAndamento = await api.entities.cotacao.list({
        status: 'em_andamento',
        clienteId: user?.id,
        limit: 100
      });
      const dadosEmAndamento = resEmAndamento?.data || resEmAndamento;
      const arrayEmAndamento = Array.isArray(dadosEmAndamento) ? dadosEmAndamento : [];
      const pendentes = arrayEmAndamento.filter(
        c => !c.dataHoraColetaConfirmada
      );
      setColetasPendentes(pendentes);

      // Cotações já coletadas
      const resConfirmadas = await api.entities.cotacao.list({
        status: 'coletada',
        clienteId: user?.id,
        limit: 100
      });
      const dadosConfirmadas = resConfirmadas?.data || resConfirmadas;
      setColetasConfirmadas(Array.isArray(dadosConfirmadas) ? dadosConfirmadas : []);
      setError('');
    } catch (err) {
      console.error('Erro ao listar coletas', err);
      setColetasPendentes([]);
      setColetasConfirmadas([]);
      // Dados mock para modo teste
      const coletasMock = [
        {
          id: '1',
          produtoNome: 'Eletrônicos Frágeis',
          enderecoColetaCidade: 'São Paulo',
          enderecoColetaEstado: 'SP',
          destinatarioCidade: 'Campinas',
          destinatarioEstado: 'SP',
          pesoTotal: 50,
          transportadorNome: 'Transportadora ABC',
          dataHoraColetaConfirmada: null
        }
      ];
      setColetasPendentes(coletasMock);
      setColetasConfirmadas([]);
      setError('');
    } finally {
      setLoading(false);
    }
  }

  const handleAbrirModal = (cotacao) => {
    setSelectedCotacao(cotacao);
    setCodigoConfirmacao('');
    setModalAberto(true);
    setError('');
  };

  const handleConfirmarColeta = async () => {
    if (!codigoConfirmacao.trim()) {
      setError('Digite o código de confirmação');
      return;
    }

    try {
      const cotacaoId = selectedCotacao.id || selectedCotacao._id;
      await api.entities.cotacao.update(cotacaoId, {
        status: 'coletada',
        codigoConfirmacaoColeta: codigoConfirmacao.trim(),
        dataHoraColetaConfirmada: new Date().toISOString()
      });

      setSuccess('Coleta confirmada com sucesso!');
      setModalAberto(false);
      setCodigoConfirmacao('');
      fetchColetas();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao confirmar coleta', err);
      setError('Erro ao confirmar coleta. Verifique o código.');
    }
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-green-500" /> Confirmar Coleta
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

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Aguardando Coleta</p>
            <p className="text-4xl font-bold text-orange-500">{coletasPendentes.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Peso Total (kg)</p>
            <p className="text-4xl font-bold text-cyan-400">
              {coletasPendentes.reduce((sum, c) => sum + (parseFloat(c.pesoTotal) || 0), 0).toFixed(0)}
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Coletas Confirmadas</p>
            <p className="text-4xl font-bold text-green-500">{coletasConfirmadas.length}</p>
          </div>
        </div>

        {/* Coletas Pendentes */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-4">Coletas Aguardando Confirmação ({coletasPendentes.length})</h2>

          {loading ? (
            <p className="text-slate-300">Carregando coletas...</p>
          ) : coletasPendentes.length === 0 ? (
            <p className="text-slate-300">Nenhuma coleta aguardando confirmação</p>
          ) : (
            <div className="space-y-3">
              {coletasPendentes.map(cotacao => (
                <div key={cotacao.id || cotacao._id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-slate-400 text-sm">Produto</p>
                      <p className="text-white font-semibold">{cotacao.produtoNome}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4" />
                        <span>{cotacao.enderecoColetaCidade} → {cotacao.destinatarioCidade}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Peso</p>
                      <p className="text-white font-semibold">{cotacao.pesoTotal} kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Transportador</p>
                      <p className="text-white font-semibold text-sm">{cotacao.transportadorNome || 'Aguardando'}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleAbrirModal(cotacao)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition"
                      >
                        ✓ Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Confirmação */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Confirmar Coleta</h3>
                <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Produto</p>
                  <p className="text-white font-semibold">{selectedCotacao?.produtoNome}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-1">De / Para</p>
                  <p className="text-white text-sm">
                    {selectedCotacao?.enderecoColetaCidade}, {selectedCotacao?.enderecoColetaEstado} →{' '}
                    {selectedCotacao?.destinatarioCidade}, {selectedCotacao?.destinatarioEstado}
                  </p>
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <label className="block text-slate-400 text-sm mb-2">Código de Confirmação *</label>
                  <input
                    type="text"
                    value={codigoConfirmacao}
                    onChange={(e) => setCodigoConfirmacao(e.target.value)}
                    placeholder="Digite o código fornecido pelo transportador"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleConfirmarColeta}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition"
                  >
                    ✓ Confirmar
                  </button>
                  <button
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coletas Confirmadas - Histórico */}
        {coletasConfirmadas.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4">Histórico de Coletas Confirmadas ({coletasConfirmadas.length})</h2>
            <div className="space-y-3">
              {coletasConfirmadas.slice(0, 5).map(cotacao => (
                <div key={cotacao.id || cotacao._id} className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Produto</p>
                      <p className="text-green-300 font-semibold text-sm">{cotacao.produtoNome}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Confirmado em</p>
                      <p className="text-green-300 text-sm">
                        {new Date(cotacao.dataHoraColetaConfirmada).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Código</p>
                      <p className="text-green-300 font-mono text-sm">{cotacao.codigoConfirmacaoColeta}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-semibold">Confirmada</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
