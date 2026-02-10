import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Settings, AlertCircle, CheckCircle, Eye, EyeOff, MapPin } from 'lucide-react';

// Estados do Brasil
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function RegioesAtendidas() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lógica invertida: manter apenas desativados
  const [estadosDesativados, setEstadosDesativados] = useState([]); // ['SP', 'RJ', ...]
  const [estadosIdMap, setEstadosIdMap] = useState({}); // { 'SP': 'id123', ... }
  const [cepDesativados, setCepDesativados] = useState([]); // [{ id, cepInicio, cepFim, cidade, raioKm }]
  const [formCep, setFormCep] = useState({ cepInicio: '', cepFim: '', cidade: '', raioKm: '' });

  useEffect(() => {
    fetchRegioesDesativadas();
  }, [user]);

  const fetchRegioesDesativadas = async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.entities.regiaoAtendida.list({
        transportadorId: user?.id,
        status: 'desativado',
        limit: 200
      });
      const itens = res?.data || res || [];
      const novosEstados = [];
      const novoMapa = {};
      const novosCEPs = [];
      itens.forEach(item => {
        if (item.tipoCobertura === 'estado' && item.estado) {
          novosEstados.push(item.estado);
          novoMapa[item.estado] = item.id || item._id;
        } else if (item.tipoCobertura === 'cepRange') {
          novosCEPs.push({
            id: item.id || item._id,
            cepInicio: item.cepInicio,
            cepFim: item.cepFim,
            cidade: item.cidade || '',
            raioKm: item.raioKm || 0
          });
        }
      });
      setEstadosDesativados(novosEstados);
      setEstadosIdMap(novoMapa);
      setCepDesativados(novosCEPs);
      setError('');
    } catch (err) {
      console.error('Erro ao listar desativações de regiões', err);
      // Dados mock para modo teste
      const estadosDesativasMock = ['RJ', 'BA'];
      const cepDesativasMock = [
        {
          id: '1',
          cepInicio: '20000000',
          cepFim: '20999999',
          cidade: 'Rio de Janeiro',
          raioKm: 50
        }
      ];
      setEstadosDesativados(estadosDesativasMock);
      setEstadosIdMap({ 'RJ': 'id-rj', 'BA': 'id-ba' });
      setCepDesativados(cepDesativasMock);
      setError('');
    } finally { setLoading(false); }
  };

  const validarFaixaCEP = () => {
    const inicio = formCep.cepInicio.replace(/\D/g, '');
    const fim = formCep.cepFim.replace(/\D/g, '');
    if (!inicio || inicio.length !== 8) { setError('CEP inicial deve ter 8 dígitos'); return false; }
    if (!fim || fim.length !== 8) { setError('CEP final deve ter 8 dígitos'); return false; }
    if (parseInt(inicio) > parseInt(fim)) { setError('CEP inicial não pode ser maior que CEP final'); return false; }
    if (formCep.cidade && formCep.cidade.length < 2) { setError('Cidade deve ter pelo menos 2 caracteres'); return false; }
    const raio = parseFloat(formCep.raioKm);
    if (formCep.raioKm && (isNaN(raio) || raio <= 0)) { setError('Raio deve ser um número maior que zero'); return false; }
    return true;
  };

  const handleToggleEstado = async (estado) => {
    setError(''); setSuccess('');
    const desativado = estadosDesativados.includes(estado);
    try {
      if (desativado) {
        const id = estadosIdMap[estado];
        if (id) { await api.entities.regiaoAtendida.delete(id); }
        setEstadosDesativados(estadosDesativados.filter(e => e !== estado));
        const novoMapa = { ...estadosIdMap }; delete novoMapa[estado]; setEstadosIdMap(novoMapa);
        setSuccess(`Estado ${estado} reativado.`);
      } else {
        const res = await api.entities.regiaoAtendida.create({
          transportadorId: user?.id,
          tipoCobertura: 'estado',
          estado,
          status: 'desativado'
        });
        const id = res?.id || res?._id;
        setEstadosDesativados([...estadosDesativados, estado]);
        setEstadosIdMap({ ...estadosIdMap, [estado]: id });
        setSuccess(`Estado ${estado} desativado.`);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alternar estado', err);
      setError('Erro ao atualizar estado');
    }
  };

  const handleAddFaixaCEPDesativada = async () => {
    setError(''); setSuccess('');
    if (!validarFaixaCEP()) return;
    try {
      const payload = {
        transportadorId: user?.id,
        tipoCobertura: 'cepRange',
        cepInicio: formCep.cepInicio.replace(/\D/g, ''),
        cepFim: formCep.cepFim.replace(/\D/g, ''),
        cidade: formCep.cidade.trim(),
        raioKm: parseFloat(formCep.raioKm) || 0,
        status: 'desativado'
      };
      const res = await api.entities.regiaoAtendida.create(payload);
      const id = res?.id || res?._id;
      setCepDesativados([...cepDesativados, { id, ...payload }]);
      setFormCep({ cepInicio: '', cepFim: '', cidade: '', raioKm: '' });
      setSuccess('Faixa de CEP desativada.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao desativar faixa de CEP', err);
      setError('Erro ao desativar faixa de CEP');
    }
  };

  const handleAtivarFaixaCEP = async (id) => {
    setError(''); setSuccess('');
    try {
      await api.entities.regiaoAtendida.delete(id);
      setCepDesativados(cepDesativados.filter(c => (c.id || c._id) !== id));
      setSuccess('Faixa de CEP reativada.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao reativar faixa de CEP', err);
      setError('Erro ao reativar faixa de CEP');
    }
  };

  // Sem exclusões diretas: apenas reativar removendo desativados

  const handleCancelar = () => {
    setFormCep({ cepInicio: '', cepFim: '', cidade: '', raioKm: '' });
    setError('');
  };


  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-8 h-8 text-cyan-600" /> Regiões Atendidas
        </h1>

        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            ℹ️ <strong>Todos os estados e CEPs começam ATIVOS</strong>. Desative apenas onde sua transportadora NÃO atende.
          </p>
        </div>

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
          <div className="bg-green-900/20 backdrop-blur rounded-xl p-6 border border-green-700/50">
            <p className="text-green-400 text-sm mb-2">Estados Ativos</p>
            <p className="text-4xl font-bold text-green-300">{27 - estadosDesativados.length}</p>
          </div>
          <div className="bg-red-900/20 backdrop-blur rounded-xl p-6 border border-red-700/50">
            <p className="text-red-400 text-sm mb-2">Estados Desativados</p>
            <p className="text-4xl font-bold text-red-300">{estadosDesativados.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Faixas de CEP desativadas</p>
            <p className="text-4xl font-bold text-white">{cepDesativados.length}</p>
          </div>
        </div>

        {/* Estados - Toggle */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-4">Estados do Brasil</h2>
          {loading ? (
            <p className="text-slate-300">Carregando estados...</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {ESTADOS_BR.map(estado => {
                const desativado = estadosDesativados.includes(estado);
                return (
                  <div key={estado} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${desativado ? 'bg-red-900/10 border-red-700/30' : 'bg-green-900/10 border-green-700/30'}`}>
                    <span className="text-white font-semibold">{estado}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${desativado ? 'bg-red-700/30 text-red-300' : 'bg-green-700/30 text-green-300'}`}>{desativado ? 'DESATIVADO' : 'ATIVO'}</span>
                      <button
                        onClick={() => handleToggleEstado(estado)}
                        className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-2 ${desativado ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      >
                        {desativado ? (<><Eye className="w-4 h-4" /> Ativar</>) : (<><EyeOff className="w-4 h-4" /> Desativar</>)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CEP - Desativar Faixas */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-cyan-400" /> Faixas de CEP</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-slate-400 text-sm mb-2">CEP Inicial *</label>
              <input type="text" value={formCep.cepInicio} onChange={(e)=>setFormCep({ ...formCep, cepInicio: e.target.value })} placeholder="00000000" maxLength="8" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">CEP Final *</label>
              <input type="text" value={formCep.cepFim} onChange={(e)=>setFormCep({ ...formCep, cepFim: e.target.value })} placeholder="99999999" maxLength="8" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Cidade</label>
              <input type="text" value={formCep.cidade} onChange={(e)=>setFormCep({ ...formCep, cidade: e.target.value })} placeholder="Nome da cidade" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Raio (km)</label>
              <input type="number" value={formCep.raioKm} onChange={(e)=>setFormCep({ ...formCep, raioKm: e.target.value })} placeholder="Ex: 50" step="1" min="0" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={handleAddFaixaCEPDesativada} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition">Desativar Faixa</button>
            <button onClick={handleCancelar} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition">✕ Limpar</button>
          </div>

          {/* Lista de faixas desativadas */}
          {loading ? (
            <p className="text-slate-300">Carregando faixas...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cepDesativados.length === 0 ? (
                <p className="text-slate-300">Nenhuma faixa desativada.</p>
              ) : (
                cepDesativados.map(c => (
                  <div key={c.id || c._id} className="border border-slate-600 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-semibold">CEP {c.cepInicio} - {c.cepFim}</p>
                      <p className="text-slate-400 text-sm">{c.cidade ? `Cidade: ${c.cidade}` : 'Cidade: (não especificada)'} {c.raioKm > 0 ? `• Raio: ${c.raioKm}km` : ''}</p>
                    </div>
                    <button onClick={() => handleAtivarFaixaCEP(c.id || c._id)} className="px-3 py-1 rounded-lg font-semibold transition flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <Eye className="w-4 h-4" /> Ativar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
