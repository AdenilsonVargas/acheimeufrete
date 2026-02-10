import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Database, AlertCircle, CheckCircle, Search, Eye, EyeOff, Loader2 } from 'lucide-react';

const TOTAL_NCMS_BRASIL = 10507;

export default function NCMsAtendidos() {
  const { user } = useAuthStore();
  const [ncmsDesativados, setNcmsDesativados] = useState([]); // Objetos de NCM desativados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busca, setBusca] = useState('');
  const [searching, setSearching] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [selecionado, setSelecionado] = useState(null);

  useEffect(() => {
    fetchNCMsDesativados();
  }, [user]);

  const fetchNCMsDesativados = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Buscar lista de NCMs desativados pelo transportador
      const res = await api.entities.ncmAtendido.list({
        transportadorId: user?.id,
        status: 'desativado',
        limit: 200
      });
      const desativados = (res?.data || res || []).map(n => ({
        id: n.id,
        codigo: n.codigo || n.ncmCode,
        descricao: n.descricao || '',
        status: n.status || 'desativado'
      }));
      setNcmsDesativados(desativados);
      setError('');
    } catch (err) {
      console.error('Erro ao listar NCMs desativados', err);
      setError('Não foi possível carregar os NCMs desativados agora.');
    } finally {
      setLoading(false);
    }
  };

  // Busca inteligente: dispara apenas com 4+ caracteres
  useEffect(() => {
    const term = busca.trim();
    if (term.length < 4) {
      setResultadosBusca([]);
      setSearching(false);
      setSelecionado(null);
      return;
    }

    // Nova busca: limpar seleção anterior
    setSelecionado(null);

    let cancelado = false;
    const buscar = async () => {
      setSearching(true);
      try {
        const res = await api.entities.ncm.search(term, 20);
        if (cancelado) return;
        const lista = res?.data?.data || res?.data || res || [];
        setResultadosBusca(lista);
        setError('');
      } catch (err) {
        console.error('Erro ao buscar NCMs', err);
        if (!cancelado) setError('Não foi possível buscar NCMs agora.');
      } finally {
        if (!cancelado) setSearching(false);
      }
    };

    const t = setTimeout(buscar, 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [busca]);

  const handleToggleNCM = async (ncm) => {
    if (!ncm) return;
    setError('');
    setSuccess('');

    const existente = ncmsDesativados.find((c) => c.codigo === ncm.codigo);

    try {
      if (existente) {
        await api.entities.ncmAtendido.delete(existente.id);
        setNcmsDesativados(ncmsDesativados.filter((c) => c.codigo !== ncm.codigo));
        setSuccess('NCM reativado com sucesso!');
      } else {
        await api.entities.ncmAtendido.create({
          codigo: ncm.codigo,
          descricao: ncm.descricao || '',
          transportadorId: user?.id,
          status: 'desativado'
        });
        setNcmsDesativados([...ncmsDesativados, { codigo: ncm.codigo, descricao: ncm.descricao || '', status: 'desativado' }]);
        setSuccess('NCM desativado com sucesso!');
      }

      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Erro ao atualizar NCM', err);
      setError('Erro ao atualizar status do NCM');
    }
  };

  const isDesativado = useMemo(
    () => (codigo) => ncmsDesativados.some((n) => n.codigo === codigo),
    [ncmsDesativados]
  );


  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" /> Gestão de NCMs
        </h1>

        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            ℹ️ <strong>Todos os NCMs começam ATIVOS</strong> por padrão. Desative apenas os produtos que sua transportadora NÃO movimenta.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 backdrop-blur rounded-xl p-6 border border-green-700/50">
            <p className="text-green-400 text-sm mb-2">NCMs Ativos</p>
            <p className="text-4xl font-bold text-green-300">
              {Math.max(TOTAL_NCMS_BRASIL - ncmsDesativados.length, 0)}
            </p>
          </div>
          <div className="bg-red-900/20 backdrop-blur rounded-xl p-6 border border-red-700/50">
            <p className="text-red-400 text-sm mb-2">NCMs Desativados</p>
            <p className="text-4xl font-bold text-red-300">{ncmsDesativados.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Total de NCMs</p>
            <p className="text-4xl font-bold text-white">{TOTAL_NCMS_BRASIL}</p>
          </div>
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

        {/* Busca + card único */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-2">Buscar NCM</h2>
          <p className="text-slate-300 text-sm mb-4">Digite ao menos 4 caracteres do código ou nome para pesquisar. Não mostramos a lista completa para manter a página leve.</p>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: 8517 ou TELEFONE CELULAR"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {searching && (
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando NCMs...
            </div>
          )}

          {!searching && resultadosBusca.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
              {resultadosBusca.map((ncm, idx) => {
                const desativado = isDesativado(ncm.codigo);
                return (
                  <button
                    key={`${ncm.codigo}-${idx}`}
                    onClick={() => setSelecionado(ncm)}
                    className="w-full text-left border border-slate-700 rounded-lg p-3 hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold font-mono">{ncm.codigo}</p>
                        <p className="text-slate-300 text-sm line-clamp-1">{ncm.descricao}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${desativado ? 'bg-red-700/30 text-red-300' : 'bg-green-700/30 text-green-300'}`}>
                        {desativado ? 'DESATIVADO' : 'ATIVO'}
                      </span>
                    </div>
                    {ncm.classificacao && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ncm.classificacao}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {busca.length >= 4 && !searching && resultadosBusca.length === 0 && (
            <p className="text-slate-300 text-sm">Nenhum NCM encontrado para essa busca.</p>
          )}

          {selecionado && (
            <div className="mt-4 border border-slate-700 rounded-lg p-4 bg-slate-800/60">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-white font-semibold text-lg">{selecionado.codigo}</p>
                  <p className="text-slate-200 text-sm">{selecionado.descricao}</p>
                  {selecionado.classificacao && (
                    <p className="text-slate-400 text-xs mt-1">{selecionado.classificacao}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isDesativado(selecionado.codigo) ? 'bg-red-700/30 text-red-300' : 'bg-green-700/30 text-green-300'}`}>
                  {isDesativado(selecionado.codigo) ? 'DESATIVADO' : 'ATIVO'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleToggleNCM(selecionado)}
                  className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                    isDesativado(selecionado.codigo)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isDesativado(selecionado.codigo) ? (
                    <>
                      <Eye className="w-4 h-4" /> Ativar
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" /> Desativar
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
