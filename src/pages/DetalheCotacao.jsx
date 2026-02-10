import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, ArrowLeft, Star, AlertCircle, CheckCircle, Upload, Plus, X } from 'lucide-react';
import * as favoritasAPI from '@/api/favoritas';

// Formatar CPF
const formatarCPF = (cpf) => {
  if (!cpf) return '';
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return limpo;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
};

// Formatar CNPJ
const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const limpo = cnpj.replace(/\D/g, '');
  if (limpo.length !== 14) return limpo;
  return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12)}`;
};

// Formatar número (brazileiro)
const formatarNumero = (valor) => {
  if (!valor) return '0,00';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function DetalheCotacao() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [cotacao, setCotacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModalNF, setShowModalNF] = useState(false);
  const [nfFile, setNfFile] = useState(null);
  const [emitindoNF, setEmitindoNF] = useState(false);
  const [successNF, setSuccessNF] = useState('');
  const [errorNF, setErrorNF] = useState('');
  const [showModalFavorita, setShowModalFavorita] = useState(false);
  const [nomeFavorita, setNomeFavorita] = useState('');
  const [estaFavoritada, setEstaFavoritada] = useState(false);
  const [salvendoFavorita, setSalvendoFavorita] = useState(false);
  const [errorFavorita, setErrorFavorita] = useState('');

  useEffect(() => {
    const fetchCotacao = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.entities.cotacao.get(id);
        console.log('DEBUG - Response completa:', res);
        console.log('DEBUG - res.data:', res?.data);
        console.log('DEBUG - res.data.cotacao:', res?.data?.cotacao);
        const cotacaoData = res?.data?.cotacao || res?.cotacao || res?.data || res;
        console.log('DEBUG - cotacaoData final:', cotacaoData);
        setCotacao(cotacaoData);
        setError('');
      } catch (err) {
        console.error('Erro carregando cotação', err);
        setError('Erro ao carregar cotação');
        setCotacao(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCotacao();
  }, [id]);

  const handleEmitirNF = () => {
    setShowModalNF(true);
    setErrorNF('');
    setSuccessNF('');
  };

  const handleAnexarNF = async () => {
    if (!nfFile) {
      setErrorNF('Selecione um arquivo para anexar');
      return;
    }
    setEmitindoNF(true);
    setErrorNF('');
    try {
      // TODO: Implementar upload de NF para o backend
      // const formData = new FormData();
      // formData.append('notaFiscal', nfFile);
      // await api.entities.cotacao.uploadNotaFiscal(id, formData);
      
      setSuccessNF('Nota fiscal anexada com sucesso!');
      setTimeout(() => {
        setShowModalNF(false);
        setNfFile(null);
      }, 2000);
    } catch (err) {
      console.error('Erro ao anexar NF', err);
      setErrorNF('Erro ao anexar nota fiscal. Tente novamente.');
    } finally {
      setEmitindoNF(false);
    }
  };

  const handleGerarNF = async () => {
    setEmitindoNF(true);
    setErrorNF('');
    try {
      // TODO: Implementar geração de NF pelo sistema
      // await api.entities.cotacao.gerarNotaFiscal(id);
      
      setSuccessNF('Nota fiscal gerada com sucesso!');
      setTimeout(() => {
        setShowModalNF(false);
      }, 2000);
    } catch (err) {
      console.error('Erro ao gerar NF', err);
      setErrorNF('Erro ao gerar nota fiscal. Tente novamente.');
    } finally {
      setEmitindoNF(false);
    }
  };

  const handleFavoritarCotacao = async () => {
    if (!nomeFavorita.trim()) {
      setErrorFavorita('Digite um nome para a favorita');
      return;
    }
    
    console.log('DEBUG - Favoritando cotação:', { id, cotacaoId: cotacao?.id, nomeFavorita });
    
    setSalvendoFavorita(true);
    setErrorFavorita('');
    
    try {
      const cotacaoId = id || cotacao?.id;
      if (!cotacaoId) {
        throw new Error('ID da cotação não encontrado');
      }
      await favoritasAPI.criarFavorita(cotacaoId, nomeFavorita);
      setEstaFavoritada(true);
      setNomeFavorita('');
      setShowModalFavorita(false);
    } catch (err) {
      console.error('Erro ao favoritar cotação:', err);
      setErrorFavorita(err.response?.data?.message || err.message || 'Erro ao salvar favorita');
    } finally {
      setSalvendoFavorita(false);
    }
  };

  const handleAbrirModalFavorita = () => {
    setShowModalFavorita(true);
    setNomeFavorita('');
    setErrorFavorita('');
  };

  if (loading) {
    return (
      <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
        <div className="text-slate-300">Carregando cotação...</div>
      </DashboardLayout>
    );
  }

  if (error || !cotacao) {
    return (
      <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
        <div className="space-y-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 font-semibold">Cotação não encontrada</p>
              <p className="text-red-300 text-sm mt-1">{error || 'A cotação solicitada não existe ou foi removida.'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isEmbarcador = user?.userType !== 'transportador';
  const mostrarBotaoNF = isEmbarcador && cotacao.status === 'aceita';

  return (
    <DashboardLayout userType={isEmbarcador ? 'embarcador' : 'transportador'}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-orange-500" /> Cotação #{cotacao.numero || cotacao.id?.slice(-8)}
          </h1>
          <div className="text-right flex items-center gap-4">
            <button 
              onClick={handleAbrirModalFavorita}
              title={estaFavoritada ? 'Já marcada como favorita' : 'Marcar como favorita'}
              className={`transition-all p-2 rounded-lg ${
                estaFavoritada 
                  ? 'bg-yellow-400/20 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-400/30' 
                  : 'bg-slate-700/30 text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50'
              }`}
            >
              <Star className={`w-7 h-7 ${estaFavoritada ? 'fill-yellow-400' : ''}`} />
            </button>
            <span className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wide ${
              cotacao.status === 'aberta' ? 'bg-blue-600/20 text-blue-300' :
              cotacao.status === 'respondida' ? 'bg-yellow-600/20 text-yellow-300' :
              cotacao.status === 'aceita' ? 'bg-green-600/20 text-green-300' :
              'bg-slate-600/20 text-slate-300'
            }`}>
              {cotacao.status === 'aberta' ? '🔵 ABERTA' :
               cotacao.status === 'respondida' ? '🟡 RESPONDIDA' :
               cotacao.status === 'aceita' ? '✅ ACEITA' : cotacao.status?.toUpperCase?.() || 'DESCONHECIDA'}
            </span>
          </div>
        </div>

        {/* Botão de Emissão/Anexo de Nota Fiscal (apenas para embarcador em cotações aceitas) */}
        {mostrarBotaoNF && (
          <div className="bg-gradient-to-r from-orange-600/20 to-blue-600/20 backdrop-blur rounded-xl p-6 border-2 border-orange-500/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-orange-400" />
                  Nota Fiscal
                </h3>
                <p className="text-slate-300 text-sm">
                  {cotacao.notaFiscalEmitida 
                    ? '✅ Nota fiscal já foi emitida/anexada para esta cotação.' 
                    : 'Emita ou anexe a nota fiscal para esta cotação aceita.'}
                </p>
              </div>
              {!cotacao.notaFiscalEmitida && (
                <button
                  onClick={handleEmitirNF}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Emitir/Anexar NF
                </button>
              )}
            </div>
          </div>
        )}

        {/* REMETENTE (Embarcador) */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">📤 REMETENTE (EMBARCADOR)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">NOME</p>
              <p className="text-white font-bold text-lg">{cotacao.remetenteNome || cotacao.user?.nomeCompleto || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">TIPO</p>
              <p className="text-white font-bold text-lg">{cotacao.tipoPessoaRemetente === 'cnpj' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}</p>
            </div>
            {cotacao.tipoPessoaRemetente === 'cnpj' && cotacao.remetenteCNPJ && (
              <div>
                <p className="text-slate-400 text-sm font-semibold uppercase">CNPJ</p>
                <p className="text-white font-bold text-lg">{formatarCNPJ(cotacao.remetenteCNPJ)}</p>
              </div>
            )}
            {cotacao.tipoPessoaRemetente === 'cpf' && cotacao.remetenteCPF && (
              <div>
                <p className="text-slate-400 text-sm font-semibold uppercase">CPF</p>
                <p className="text-white font-bold text-lg">{formatarCPF(cotacao.remetenteCPF)}</p>
              </div>
            )}
          </div>
        </div>

        {/* DESTINATÁRIO */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">📥 DESTINATÁRIO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">NOME COMPLETO</p>
              <p className="text-white font-bold text-lg">{cotacao.destinatarioNome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">TIPO DE PESSOA</p>
              <p className="text-white font-bold text-lg">{cotacao.destinatarioTipoPessoa === 'cnpj' ? 'PESSOA JURÍDICA (CNPJ)' : 'PESSOA FÍSICA (CPF)'}</p>
            </div>
            {cotacao.destinatarioTipoPessoa === 'cpf' && cotacao.destinatarioCPF && (
              <div>
                <p className="text-slate-400 text-sm font-semibold uppercase">CPF</p>
                <p className="text-white font-bold text-lg">{formatarCPF(cotacao.destinatarioCPF)}</p>
              </div>
            )}
            {cotacao.destinatarioTipoPessoa === 'cnpj' && cotacao.destinatarioCNPJ && (
              <div>
                <p className="text-slate-400 text-sm font-semibold uppercase">CNPJ</p>
                <p className="text-white font-bold text-lg">{formatarCNPJ(cotacao.destinatarioCNPJ)}</p>
              </div>
            )}
            {cotacao.destinatarioCodigoCadastro && (
              <div>
                <p className="text-slate-400 text-sm font-semibold uppercase">CÓDIGO DE CADASTRO</p>
                <p className="text-white font-bold text-lg">{cotacao.destinatarioCodigoCadastro}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm font-semibold uppercase">ENDEREÇO DE ENTREGA</p>
              <p className="text-white font-bold text-lg">
                {cotacao.enderecoEntrega || cotacao.destinatarioCidade || 'N/A'}
                {cotacao.bairroEntrega && `, ${cotacao.bairroEntrega}`}
                {cotacao.complementoEntrega && ` - ${cotacao.complementoEntrega}`}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">CEP</p>
              <p className="text-white font-bold text-lg">{cotacao.destinatarioCep || cotacao.cepEntrega || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">CIDADE/ESTADO</p>
              <p className="text-white font-bold text-lg">{cotacao.cidadeEntrega || cotacao.destinatarioCidade}/{cotacao.estadoEntrega || cotacao.destinatarioEstado}</p>
            </div>
            {cotacao.destinatarioObservacoes && (
              <div className="md:col-span-2 p-3 bg-slate-700/30 rounded border border-slate-600/50">
                <p className="text-slate-400 text-sm font-semibold uppercase">OBSERVAÇÕES</p>
                <p className="text-white font-bold text-base mt-1">{cotacao.destinatarioObservacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ORIGEM (Coleta) */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">🚚 COLETA (ORIGEM)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cotacao.enderecoColetaNome && (
              <div className="md:col-span-2">
                <p className="text-slate-400 text-sm font-semibold uppercase">NOME DO ENDEREÇO</p>
                <p className="text-white font-bold text-lg">{cotacao.enderecoColetaNome}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm font-semibold uppercase">ENDEREÇO COMPLETO</p>
              <p className="text-white font-bold text-lg">
                {cotacao.enderecoColeta}
                {cotacao.bairroColeta && `, ${cotacao.bairroColeta}`}
                {cotacao.complementoColeta && ` - ${cotacao.complementoColeta}`}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">CEP</p>
              <p className="text-white font-bold text-lg">{cotacao.cepColeta || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold uppercase">CIDADE/ESTADO</p>
              <p className="text-white font-bold text-lg">{cotacao.cidadeColeta}/{cotacao.estadoColeta}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm font-semibold uppercase">DATA/HORA DE COLETA</p>
              <p className="text-white font-bold text-lg">{new Date(cotacao.dataColeta).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* ESPECIFICAÇÕES DA CARGA */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">📦 ESPECIFICAÇÕES DA CARGA</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Peso Total</p>
              <p className="text-white font-semibold">{cotacao.peso ? `${formatarNumero(cotacao.peso)} kg` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Altura</p>
              <p className="text-white font-semibold">{cotacao.altura ? `${formatarNumero(cotacao.altura)} m` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Largura</p>
              <p className="text-white font-semibold">{cotacao.largura ? `${formatarNumero(cotacao.largura)} m` : 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Profundidade</p>
              <p className="text-white font-semibold">{cotacao.profundidade ? `${formatarNumero(cotacao.profundidade)} m` : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* VALORES */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">💰 VALORES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/30 rounded border border-slate-600/50">
              <p className="text-slate-400 text-sm">Valor Estimado</p>
              <p className="text-white font-bold text-xl">R$ {formatarNumero(cotacao.valorEstimado || 0)}</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded border border-slate-600/50">
              <p className="text-slate-400 text-sm">Valor Mínimo</p>
              <p className="text-white font-bold text-xl">R$ {formatarNumero(cotacao.valorMinimo || 0)}</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded border border-slate-600/50">
              <p className="text-slate-400 text-sm">Valor Máximo</p>
              <p className="text-white font-bold text-xl">R$ {formatarNumero(cotacao.valorMaximo || 0)}</p>
            </div>
          </div>
        </div>

        {/* RESPOSTAS DE TRANSPORTADORAS */}
        {cotacao.respostas && cotacao.respostas.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-4">🚛 Respostas de Transportadoras ({cotacao.respostas.length})</h2>
            
            {/* Se cotação ainda está aberta, mostrar transportadores */}
            {cotacao.status === 'aberta' || cotacao.status === 'respondida' ? (
              <div className="space-y-3">
                {cotacao.respostas.map(resposta => (
                  <div key={resposta.id} className="p-4 bg-slate-700/30 rounded border border-slate-600/50 hover:border-slate-500/50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-white font-semibold">R$ {formatarNumero(resposta.valor)}</p>
                        <p className="text-slate-400 text-sm">Entrega: {new Date(resposta.dataEntrega).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{resposta.pontuacaoVotacao?.toFixed(1) || 5}</span>
                        <span className="text-slate-400 text-sm">({resposta.totalAvaliacoes})</span>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {resposta.tipoTransportador === 'autonomo' ? '🤝 Autônomo' : '🏢 Empresa'}
                      {resposta.ehAutonomoCiot ? ' | 📋 Emite CIoT' : ''}
                    </div>
                    {resposta.descricao && <p className="text-slate-300 text-sm mt-2">{resposta.descricao}</p>}
                  </div>
                ))}
              </div>
            ) : (
              // Se já foi paga/aceita, mostrar apenas a transportadora selecionada
              <div className="p-4 bg-green-600/20 rounded border border-green-600/50">
                <p className="text-green-200 font-semibold">Transportadora Selecionada</p>
                <p className="text-white mt-2">Valor: R$ {formatarNumero(cotacao.valorFinalTransportadora)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Emissão/Anexo de Nota Fiscal */}
      {showModalNF && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-7 h-7 text-orange-500" />
                Nota Fiscal
              </h2>
              <button
                onClick={() => setShowModalNF(false)}
                className="text-slate-400 hover:text-white transition"
                disabled={emitindoNF}
              >
                ✕
              </button>
            </div>

            {errorNF && (
              <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errorNF}</p>
              </div>
            )}

            {successNF && (
              <div className="mb-4 bg-green-900/30 border border-green-700/50 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-200 text-sm">{successNF}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Informações da Cotação */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Dados da Cotação</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Produto</p>
                    <p className="text-white font-semibold">{cotacao.produtoNome || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Peso Total</p>
                    <p className="text-white font-semibold">{formatarNumero(cotacao.pesoTotal || 0)} kg</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Valor NF</p>
                    <p className="text-white font-semibold">R$ {formatarNumero(cotacao.valorNotaFiscal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Destinatário</p>
                    <p className="text-white font-semibold">{cotacao.destinatarioNome || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Transportadora */}
              {cotacao.transportadoraSelecionada && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">Transportadora Selecionada</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Nome</p>
                      <p className="text-white font-semibold">{cotacao.transportadoraNome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">CNPJ</p>
                      <p className="text-white font-semibold">{formatarCNPJ(cotacao.transportadoraCNPJ) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opções */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">Opção 1: Gerar Nota Fiscal pelo Sistema</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    O sistema irá gerar automaticamente a nota fiscal com base nos dados da cotação.
                  </p>
                  <button
                    onClick={handleGerarNF}
                    disabled={emitindoNF}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emitindoNF ? '⏳ Gerando...' : '✨ Gerar Nota Fiscal'}
                  </button>
                </div>

                <div className="text-center text-slate-400 font-semibold">OU</div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3">Opção 2: Anexar Nota Fiscal Existente</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Faça upload de uma nota fiscal já emitida (PDF, PNG, JPG).
                  </p>
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-orange-500 transition">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-slate-400 text-sm">
                        {nfFile ? nfFile.name : 'Clique para selecionar arquivo'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => setNfFile(e.target.files[0])}
                        className="hidden"
                        disabled={emitindoNF}
                      />
                    </label>
                    <button
                      onClick={handleAnexarNF}
                      disabled={!nfFile || emitindoNF}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {emitindoNF ? '⏳ Anexando...' : '📎 Anexar Nota Fiscal'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModalNF(false)}
                  disabled={emitindoNF}
                  className="flex-1 px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Favorita */}
      {showModalFavorita && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                Salvar como Favorita
              </h2>
              <button
                onClick={() => setShowModalFavorita(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-sm">
              Nomeie esta cotação para acessá-la rapidamente no futuro. O nome deve ser único.
            </p>

            <div>
              <input
                type="text"
                placeholder='Ex: "Frete SP-RJ Padrão"'
                value={nomeFavorita}
                onChange={(e) => setNomeFavorita(e.target.value)}
                maxLength={50}
                disabled={salvendoFavorita}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-slate-400 text-xs mt-1">{nomeFavorita.length}/50</p>
            </div>

            {errorFavorita && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{errorFavorita}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModalFavorita(false)}
                disabled={salvendoFavorita}
                className="flex-1 px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleFavoritarCotacao}
                disabled={salvendoFavorita || !nomeFavorita.trim()}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvendoFavorita ? '⏳ Salvando...' : '⭐ Salvar Favorita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}