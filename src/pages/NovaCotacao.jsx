import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import * as favoritasAPI from '@/api/favoritas';
import { FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

// Tipos de frete
const TIPOS_FRETE = ['CIF', 'FOB'];

// Serviços adicionais
const SERVICOS_ADICIONAIS = [
  { id: 'precisaPalete', label: 'Precisa Palete', valor: 'precisaPalete' },
  { id: 'ehUrgente', label: 'Urgente (+ caro)', valor: 'ehUrgente' },
  { id: 'ehFragil', label: 'Frágil', valor: 'ehFragil' },
  { id: 'precisaCargaDedicada', label: 'Carga Dedicada', valor: 'precisaCargaDedicada' },
  { id: 'precisaMontagem', label: 'Montagem', valor: 'precisaMontagem' },
  { id: 'precisaInstalacao', label: 'Instalação', valor: 'precisaInstalacao' },
  { id: 'precisaEscoltaArmada', label: 'Escolta Armada', valor: 'precisaEscoltaArmada' },
  { id: 'precisaArmazenamento', label: 'Armazenamento', valor: 'precisaArmazenamento' },
  { id: 'precisaSeguro', label: 'Seguro de Carga', valor: 'precisaSeguro' }
];

// Helpers para números com vírgula
const parseLocaleNumber = (value) => {
  if (value === null || value === undefined || value === '') return NaN;
  const sanitized = String(value).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(sanitized);
  return Number.isNaN(num) ? NaN : num;
};

const toLocaleInput = (num, decimals = 2) => {
  if (num === null || num === undefined || num === '') return '';
  return Number(num).toFixed(decimals).replace('.', ',');
};

export default function NovaCotacao() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const favoritaId = searchParams.get('favorita');
  
  // Listas para autocomplete
  const [produtos, setProdutos] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [enderecosColeta, setEnderecosColeta] = useState([]);
  
  // Estados para dropdown/search
  const [filtroProdu, setFiltroProdu] = useState('');
  const [filtroDestinatario, setFiltroDestinatario] = useState('');
  const [showProdutosList, setShowProdutosList] = useState(false);
  const [showDestinatariosList, setShowDestinatariosList] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  // Formulário
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    produtoId: '',
    produtoNome: '',
    produtoNCM: '',
    produtoPeso: '',
    produtoUnidade: '',
    produtosLista: [],
    destinatarioId: '',
    destinatarioNome: '',
    destinatarioTipoPessoa: '',
    destinatarioCPF: '',
    destinatarioCNPJ: '',
    destinatarioCodigoCadastro: '',
    destinatarioCep: '',
    destinatarioCidade: '',
    destinatarioEstado: '',
    destinatarioObservacoes: '',
    enderecoColetaId: '',
    enderecoColetaNome: '',
    enderecoColetaCep: '',
    enderecoColetaLogradouro: '',
    enderecoColetaBairro: '',
    enderecoColetaNumero: '',
    enderecoColetaComplemento: '',
    enderecoColetaCidade: '',
    enderecoColetaEstado: '',
    pesoTotal: '',
    quantidadeVolumes: '',
    volumes: [],
    valorNotaFiscal: '',
    tipoFrete: 'CIF',
    servicosAdicionais: {},
    tempoCotacaoMinutos: 120,
    dataHoraColeta: '',
    aceitaMotoCarAte100km: false,
    aceitaTransportadorSemCNPJ: false,
    observacoes: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    fetchDados();
  }, [user]);

  // Carregar dados de favorita se fornecido
  useEffect(() => {
    if (favoritaId && !loadingDados) {
      loadFavoritaData();
    }
  }, [favoritaId, loadingDados]);

  const loadFavoritaData = async () => {
    try {
      const favorita = await favoritasAPI.obterFavorita(favoritaId);
      if (favorita?.cotacao?.metadados) {
        const metadados = favorita.cotacao.metadados;
        setForm(prev => ({
          ...prev,
          produtosLista: metadados.produtosLista || [],
          destinatarioId: favorita.cotacao.destinatarioId || '',
          enderecoColetaId: favorita.cotacao.enderecoColetaId || '',
          quantidadeVolumes: metadados.quantidadeVolumes || '',
          volumes: metadados.volumes || [],
          tipoFrete: metadados.tipoFrete || 'CIF',
          servicosAdicionais: metadados.servicosAdicionais || {},
          valorNotaFiscal: metadados.valorNotaFiscal || '',
          observacoes: favorita.cotacao.observacoes || ''
        }));
        setStep(2); // Pula para próximo passo já com dados preenchidos
      }
    } catch (err) {
      console.error('Erro ao carregar favorita:', err);
    }
  };

  const fetchDados = async () => {
    if (!user?.id) {
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
    try {
      const [prodRes, destRes, endRes] = await Promise.all([
        api.entities.produto.list({ clienteId: user?.id, limit: 100 }),
        api.entities.destinatario.list({ clienteId: user?.id, limit: 100 }),
        api.entities.enderecoColeta.list({ clienteId: user?.id, limit: 100 })
      ]);

      setProdutos(prodRes?.data || prodRes || []);
      setDestinatarios(destRes?.data || destRes || []);
      setEnderecosColeta(endRes?.enderecos || endRes?.data?.enderecos || endRes?.data || endRes || []);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar dados', err);
      // Dados mock para modo teste
      const produtosMock = [
        {
          id: '1',
          nome: 'Eletrônicos Frágeis',
          ncmCode: '84713090',
          pesoKg: 5,
          unidadeMedida: 'unidade',
          valorUnitario: 1500
        },
        {
          id: '2',
          nome: 'Bebidas Perecíveis',
          ncmCode: '22021000',
          pesoKg: 2,
          unidadeMedida: 'unidade',
          valorUnitario: 50
        }
      ];
      
      const destinatariosMock = [
        {
          id: '1',
          nome: 'Empresa XYZ',
          cep: '01310100',
          cidade: 'São Paulo',
          estado: 'SP',
          endereco: 'Av. Paulista, 1000'
        },
        {
          id: '2',
          nome: 'Loja ABC',
          cep: '20040020',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          endereco: 'Rua da Lapa, 200'
        }
      ];
      
      const enderecosMock = [
        {
          id: '1',
          nome: 'MATRIZ',
          cep: '01310100',
          logradouro: 'AV. PAULISTA',
          numero: '500',
          bairro: 'BELA VISTA',
          cidade: 'SÃO PAULO',
          estado: 'SP',
          padrao: true
        }
      ];
      
      setProdutos(produtosMock);
      setDestinatarios(destinatariosMock);
      setEnderecosColeta(enderecosMock);
      setError('');
    } finally {
      setLoadingDados(false);
    }
  };

  // Filtrar produtos por nome ou NCM
  const produtosFiltrados = produtos.filter(p =>
    p.nome?.toUpperCase().includes(filtroProdu.toUpperCase()) ||
    p.ncmCode?.includes(filtroProdu)
  );

  // Filtrar destinatários
  const destinatariosFiltrados = destinatarios.filter(d =>
    d.nomeCompleto?.toUpperCase().includes(filtroDestinatario.toUpperCase()) ||
    d.cidade?.toUpperCase().includes(filtroDestinatario.toUpperCase())
  );

  // Quando seleciona um produto, preencher dados automaticamente
  const handleSelectProduto = (produto) => {
    const novoProduto = {
      id: produto.id || produto._id,
      nome: produto.nome,
      ncmCode: produto.ncmCode,
      pesoKg: produto.pesoKg || 0,
      altura: produto.altura || 0,
      largura: produto.largura || 0,
      comprimento: produto.comprimento || 0,
      valorUnitario: produto.valorUnitario || 0,
      unidadeMedida: produto.unidadeMedida,
      quantidade: 1,
      valorTotal: produto.valorUnitario || 0,
      pesoTotal: produto.pesoKg || 0
    };
    setForm(prev => ({
      ...prev,
      produtosLista: [...(prev.produtosLista || []), novoProduto],
      quantidadeVolumes: prev.quantidadeVolumes || '1'
    }));
    setFiltroProdu('');
    setShowProdutosList(false);
  };

  // Remover produto da lista
  const handleRemoveProduto = (index) => {
    setForm(prev => ({
      ...prev,
      produtosLista: (prev.produtosLista || []).filter((_, i) => i !== index)
    }));
  };

  // Atualizar campos de um produto (quantidade, valorUnitario, pesoKg)
  const handleUpdateProdutoField = (index, field, value) => {
    setForm(prev => {
      const list = [...(prev.produtosLista || [])];
      const p = { ...list[index] };
      const numeric = parseFloat(String(value).replace(/,/g, '.')) || 0;
      if (field === 'quantidade') p.quantidade = Math.max(1, parseInt(value) || 1);
      else if (field === 'valorUnitario') p.valorUnitario = numeric;
      else if (field === 'pesoKg') p.pesoKg = numeric;
      else if (field === 'altura') p.altura = numeric;
      else if (field === 'largura') p.largura = numeric;
      else if (field === 'comprimento') p.comprimento = numeric;
      // Recalcular totais
      p.valorTotal = (p.quantidade || 0) * (p.valorUnitario || 0);
      p.pesoTotal = (p.quantidade || 0) * (p.pesoKg || 0);
      list[index] = p;
      return { ...prev, produtosLista: list };
    });
  };

  // Atualizar dimensões de um volume
  const handleUpdateVolumeDimensions = (volumeIdx, field, value) => {
    setForm(prev => {
      const newVolumes = [...(prev.volumes || [])];
      if (!newVolumes[volumeIdx]) {
        newVolumes[volumeIdx] = { altura: 0, largura: 0, profundidade: 0, peso: 0 };
      }
      newVolumes[volumeIdx][field] = parseFloat(value) || 0;
      return { ...prev, volumes: newVolumes };
    });
  };

  // Ajustar quantidade de volumes e preencher medidas padrão
  const handleQuantidadeVolumesChange = (value) => {
    const qtd = Math.max(1, parseInt(value) || 1);
    const { pesoTotal } = calcularTotais();
    const primeiroProd = (form.produtosLista || [])[0] || {};
    
    // Se for apenas 1 volume, usa o peso total; se for múltiplos, divide
    const pesoPorVolume = qtd === 1 ? pesoTotal : Number(pesoTotal / qtd).toFixed(2);
    
    const alturaPadrao = primeiroProd.altura || '';
    const larguraPadrao = primeiroProd.largura || '';
    const comprimentoPadrao = primeiroProd.comprimento || '';

    const novosVolumes = Array.from({ length: qtd }).map((_, idx) => {
      return {
        altura: alturaPadrao,
        largura: larguraPadrao,
        profundidade: comprimentoPadrao,
        peso: pesoPorVolume
      };
    });

    setForm(prev => ({ ...prev, quantidadeVolumes: String(qtd), volumes: novosVolumes }));
  };

  // Calcular totais
  const calcularTotais = () => {
    let pesoTotal = 0;
    let valorTotal = 0;
    (form.produtosLista || []).forEach(prod => {
      const qtd = prod.quantidade || 0;
      const vunit = prod.valorUnitario || 0;
      const punit = prod.pesoKg || 0;
      valorTotal += qtd * vunit;
      pesoTotal += qtd * punit;
    });
    return { pesoTotal, valorTotal };
  };

  // Quando seleciona um destinatário, preencher endereço + CPF/CNPJ automaticamente
  const handleSelectDestinatario = (destinatario) => {
    setForm(prev => ({
      ...prev,
      destinatarioId: destinatario.id || destinatario._id,
      destinatarioCep: destinatario.cep,
      destinatarioCidade: destinatario.cidade,
      destinatarioEstado: destinatario.estado,
      destinatarioBairro: destinatario.bairro || '',
      destinatarioTipoPessoa: destinatario.tipoPessoa,
      destinatarioCPF: destinatario.cpf,
      destinatarioCNPJ: destinatario.cnpj,
      destinatarioCodigoCadastro: destinatario.codigoCadastro,
      destinatarioNome: destinatario.nomeCompleto,
      destinatarioObservacoes: destinatario.observacoes
    }));
    setFiltroDestinatario('');
    setShowDestinatariosList(false);
  };

  // Quando seleciona endereço de coleta, preencher automaticamente
  const handleSelectEnderecoColeta = (endereco) => {
    setForm(prev => ({
      ...prev,
      enderecoColetaId: endereco.id || endereco._id,
      enderecoColetaNome: endereco.nome,
      enderecoColetaCep: endereco.cep,
      enderecoColetaCidade: endereco.cidade,
      enderecoColetaEstado: endereco.estado,
      enderecoColetaLogradouro: endereco.logradouro || '',
      enderecoColetaBairro: endereco.bairro || '',
      enderecoColetaNumero: endereco.numero || '',
      enderecoColetaComplemento: endereco.complemento || ''
    }));
  };

  // Validações por etapa
  const validarStep1 = () => {
    if (!Array.isArray(form.produtosLista) || form.produtosLista.length === 0) {
      setError('Adicione pelo menos um produto');
      return false;
    }
    const { pesoTotal } = calcularTotais();
    if (pesoTotal <= 0) {
      setError('Peso total deve ser maior que zero');
      return false;
    }
    return true;
  };

  const validarStep2 = () => {
    if (!form.destinatarioId) {
      setError('Selecione um destinatário');
      return false;
    }
    if (!form.enderecoColetaId) {
      setError('Selecione um endereço de coleta');
      return false;
    }
    const qtdVolumes = parseInt(form.quantidadeVolumes);
    if (!form.quantidadeVolumes || qtdVolumes <= 0) {
      setError('Quantidade de volumes deve ser maior que zero');
      return false;
    }
    const volumesCompletos = Array.from({ length: qtdVolumes }).every((_, idx) => {
      const v = form.volumes[idx] || {};
      return v.altura && v.largura && v.profundidade && v.peso;
    });
    if (!volumesCompletos) {
      setError('Preencha altura, largura, profundidade e peso de todos os volumes');
      return false;
    }
    return true;
  };

  const validarStep3 = () => {
    if (!form.tipoFrete) {
      setError('Escolha o tipo de frete');
      return false;
    }
    if (!form.dataHoraColeta) {
      setError('Data e hora da coleta é obrigatória');
      return false;
    }
    const tempo = parseInt(form.tempoCotacaoMinutos);
    if (Number.isNaN(tempo) || tempo <= 0) {
      setError('Tempo de cotação deve ser maior que zero');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && !validarStep1()) return;
    if (step === 2 && !validarStep2()) return;
    if (step === 3 && !validarStep3()) return;
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validarStep1() || !validarStep2() || !validarStep3()) {
      return;
    }

    setLoading(true);
    try {
      const { pesoTotal, valorTotal } = calcularTotais();
      const produtoPrincipal = (form.produtosLista || [])[0] || {};
      const cotacaoData = {
        // Título e descrição obrigatórios
        titulo: `COTAÇÃO ${form.destinatarioCidade} - ${new Date().toLocaleDateString('pt-BR')}`,
        descricao: form.observacoes || `Cotação de frete para ${form.destinatarioNome || 'cliente'}`,
        clienteId: user?.id,
        produtoId: produtoPrincipal.id,
        produtoNome: produtoPrincipal.nome,
        produtoNCM: produtoPrincipal.ncmCode,
        produtoPeso: pesoTotal,
        produtoUnidade: produtoPrincipal.unidadeMedida,
        produtosLista: form.produtosLista || [],
        destinatarioId: form.destinatarioId,
        destinatarioNome: form.destinatarioNome,
        destinatarioTipoPessoa: form.destinatarioTipoPessoa,
        destinatarioCPF: form.destinatarioCPF,
        destinatarioCNPJ: form.destinatarioCNPJ,
        destinatarioCodigoCadastro: form.destinatarioCodigoCadastro,
        destinatarioObservacoes: form.destinatarioObservacoes,
        destinatarioCep: form.destinatarioCep,
        destinatarioCidade: form.destinatarioCidade,
        destinatarioEstado: form.destinatarioEstado,
        destinatarioBairro: form.destinatarioBairro || '',
        enderecoColetaId: form.enderecoColetaId,
        enderecoColetaNome: form.enderecoColetaNome,
        enderecoColetaLogradouro: form.enderecoColetaLogradouro,
        enderecoColetaBairro: form.enderecoColetaBairro,
        enderecoColetaNumero: form.enderecoColetaNumero,
        enderecoColetaComplemento: form.enderecoColetaComplemento,
        enderecoColetaCep: form.enderecoColetaCep,
        enderecoColetaCidade: form.enderecoColetaCidade,
        enderecoColetaEstado: form.enderecoColetaEstado,
        pesoTotal: pesoTotal,
        quantidadeVolumes: parseInt(form.quantidadeVolumes),
        volumes: form.volumes || [],
        valorNotaFiscal: valorTotal,
        tipoFrete: form.tipoFrete,
        servicosAdicionais: form.servicosAdicionais || {},
        tempoCotacaoMinutos: parseInt(form.tempoCotacaoMinutos),
        dataHoraColeta: form.dataHoraColeta,
        aceitaMotoCarAte100km: form.aceitaMotoCarAte100km,
        aceitaTransportadorSemCNPJ: form.aceitaTransportadorSemCNPJ,
        observacoes: (form.observacoes || '').toUpperCase(),
        status: 'aberta'
      };

      const res = await api.entities.cotacao.create(cotacaoData);
      const cotacaoId = res?.id || res?.cotacao?.id || res?.data?.id;
      
      setSuccess('Cotação criada com sucesso! Redirecionando...');
      setTimeout(() => {
        if (cotacaoId) {
          navigate(`/cotacoes/${cotacaoId}`);
        } else {
          navigate('/cotacoes');
        }
      }, 1500);
    } catch (err) {
      console.error('Erro ao criar cotação', err);
      setError('Erro ao criar cotação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDados) {
    return (
      <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
        <div className="space-y-6">
          <p className="text-slate-300">Carregando dados...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-orange-500" /> Nova Cotação de Frete
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4].map((num, idx) => (
                <div key={num} className="flex items-center gap-2 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 flex-shrink-0 transition-all ${
                    step >= num ? 'bg-orange-600 text-white border-orange-400 shadow-lg shadow-orange-500/50' : 'bg-slate-800 text-slate-400 border-slate-600'
                  }`}>
                    {num}
                  </div>
                  <div className="text-xs md:text-sm lg:text-base font-semibold text-white/90 uppercase hidden sm:block min-w-max">
                    {num === 1 && 'PRODUTOS'}
                    {num === 2 && 'DESTINO'}
                    {num === 3 && 'SERVIÇOS'}
                    {num === 4 && 'RESUMO'}
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-1 rounded-full transition-all ${step > num ? 'bg-orange-500 shadow-md shadow-orange-500/50' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {step > 1 && (
            <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4 flex flex-wrap gap-4 text-sm text-white">
              <div className="flex-1 min-w-[220px]">
                <p className="font-semibold text-orange-400">Produtos</p>
                <p>{(form.produtosLista || []).length} item(ns) • Peso {toLocaleInput(calcularTotais().pesoTotal,3)} kg • Valor R$ {toLocaleInput(calcularTotais().valorTotal)}</p>
              </div>
              {form.destinatarioId && (
                <div className="flex-1 min-w-[220px]">
                  <p className="font-semibold text-orange-400">Destinatário</p>
                  <p>{form.destinatarioNome || 'Selecionado'} • {form.destinatarioCidade} - {form.destinatarioEstado}</p>
                </div>
              )}
              {form.enderecoColetaId && (
                <div className="flex-1 min-w-[220px]">
                  <p className="font-semibold text-orange-400">Coleta</p>
                  <p>{form.enderecoColetaNome} • {form.enderecoColetaCidade}-{form.enderecoColetaEstado}</p>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 space-y-4 relative z-40">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">1. Produtos</h2>
                <span className="text-xs text-slate-400">Adicione um ou mais produtos e edite quantidades e medidas</span>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Selecione um Produto *</label>
                <div className="relative z-50">
                  <input
                    type="text"
                    value={filtroProdu}
                    onChange={(e) => {
                      setFiltroProdu(e.target.value);
                      setShowProdutosList(true);
                    }}
                    onFocus={() => setShowProdutosList(true)}
                    placeholder="Busque por nome ou NCM..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                  />
                  {showProdutosList && produtosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[9999] max-h-64 overflow-y-auto">
                      {produtosFiltrados.map(p => (
                        <button
                          key={p.id || p._id}
                          type="button"
                          onClick={() => handleSelectProduto(p)}
                          className="w-full text-left px-4 py-3 text-white hover:bg-slate-800 border-b border-slate-800 last:border-b-0 transition"
                        >
                          <div className="font-semibold">{p.nome}</div>
                          <div className="text-sm text-slate-400">NCM: {p.ncmCode} | {toLocaleInput(p.pesoKg, 3)}kg | {p.unidadeMedida}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {Array.isArray(form.produtosLista) && form.produtosLista.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {form.produtosLista.map((prod, idx) => (
                      <div key={idx} className="p-3 rounded border border-slate-700 bg-slate-800">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-white font-semibold">{prod.nome}</p>
                            <p className="text-xs text-slate-400">NCM: {prod.ncmCode}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveProduto(idx)} className="text-red-400 hover:text-red-300">✕</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3">
                          <div>
                            <label className="text-xs text-slate-400">Qtd</label>
                            <input type="number" min="1" value={prod.quantidade}
                              onChange={(e)=>handleUpdateProdutoField(idx,'quantidade',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Valor Unit (R$)</label>
                            <input type="number" step="0.01" value={prod.valorUnitario}
                              onChange={(e)=>handleUpdateProdutoField(idx,'valorUnitario',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Peso Unit (kg)</label>
                            <input type="number" step="0.001" value={prod.pesoKg}
                              onChange={(e)=>handleUpdateProdutoField(idx,'pesoKg',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Altura (cm)</label>
                            <input type="number" step="0.1" value={prod.altura}
                              onChange={(e)=>handleUpdateProdutoField(idx,'altura',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Largura (cm)</label>
                            <input type="number" step="0.1" value={prod.largura}
                              onChange={(e)=>handleUpdateProdutoField(idx,'largura',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400">Comp. (cm)</label>
                            <input type="number" step="0.1" value={prod.comprimento}
                              onChange={(e)=>handleUpdateProdutoField(idx,'comprimento',e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white" />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-300 flex gap-6">
                          <span>Total: R$ {toLocaleInput((prod.quantidade||0)*(prod.valorUnitario||0))}</span>
                          <span>Peso: {toLocaleInput((prod.quantidade||0)*(prod.pesoKg||0),3)} kg</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-slate-700 flex flex-wrap gap-6 text-white font-semibold">
                      <span>Peso Total: {toLocaleInput(calcularTotais().pesoTotal,3)} kg</span>
                      <span>Valor Total: R$ {toLocaleInput(calcularTotais().valorTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 relative z-40">
                <h2 className="text-lg font-bold text-white mb-4">2. Destinatário</h2>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Selecione um Destinatário *</label>
                  <div className="relative z-50">
                    <input
                      type="text"
                      value={filtroDestinatario}
                      onChange={(e) => {
                        setFiltroDestinatario(e.target.value);
                        setShowDestinatariosList(true);
                      }}
                      onFocus={() => setShowDestinatariosList(true)}
                      placeholder="Busque por nome ou cidade..."
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                    />
                    {showDestinatariosList && destinatariosFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[9999]999] max-h-64 overflow-y-auto">
                        {destinatariosFiltrados.map(d => (
                          <button
                            key={d.id || d._id}
                            type="button"
                            onClick={() => handleSelectDestinatario(d)}
                            className="w-full text-left px-4 py-3 text-white hover:bg-slate-800 border-b border-slate-800 last:border-b-0 transition"
                          >
                            <div className="font-semibold">{d.nomeCompleto}</div>
                            <div className="text-sm text-slate-400">{d.logradouro}, {d.numero} - {d.bairro}, {d.cidade}, {d.estado}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {form.destinatarioId && (
                    <div className="mt-2 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                      <p className="text-green-300 text-sm font-semibold">✓ {form.destinatarioCidade}, {form.destinatarioEstado}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 relative z-10">
                <h2 className="text-lg font-bold text-white mb-4">Endereço de Coleta *</h2>

                {!Array.isArray(enderecosColeta) || enderecosColeta.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-2">Nenhum endereço de coleta cadastrado ainda.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/enderecos-coleta')}
                      className="text-orange-500 hover:text-orange-400 underline"
                    >
                      Cadastrar endereço de coleta
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enderecosColeta.map(endereco => (
                      <button
                        key={endereco.id || endereco._id}
                        type="button"
                        onClick={() => handleSelectEnderecoColeta(endereco)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          form.enderecoColetaId === (endereco.id || endereco._id)
                            ? 'border-orange-500 bg-orange-900/20'
                            : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white uppercase">{endereco.nome || 'SEM NOME'}</p>
                          {endereco.padrao && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-500 text-white">
                              PADRÃO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{endereco.logradouro}, {endereco.numero}</p>
                        <p className="text-sm text-slate-400">{endereco.cidade}, {endereco.estado} - CEP: {endereco.cep}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Volumes para Frete</h2>

                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-orange-600/30">
                  <label className="block text-sm font-medium text-slate-300 mb-3">Quantidade de Volumes *</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={form.quantidadeVolumes}
                      onChange={(e) => handleQuantidadeVolumesChange(e.target.value)}
                      placeholder="Digite número de volumes"
                      min="1"
                      className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">💡 Pode ser diferente da quantidade de produtos (ex: 10 produtos em 2 volumes)</p>
                </div>

                {form.quantidadeVolumes && parseInt(form.quantidadeVolumes) > 0 && (
                  <div className="space-y-3">
                    {Array.from({ length: parseInt(form.quantidadeVolumes) }).map((_, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white">Volume {idx + 1}</h4>
                          <span className="text-xs text-slate-400">Copie as medidas conforme o pacote</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Altura (cm)</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0" 
                              value={form.volumes[idx]?.altura || ''}
                              onChange={(e) => handleUpdateVolumeDimensions(idx, 'altura', e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-orange-500" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Largura (cm)</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0" 
                              value={form.volumes[idx]?.largura || ''}
                              onChange={(e) => handleUpdateVolumeDimensions(idx, 'largura', e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-orange-500" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Profundidade (cm)</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0" 
                              value={form.volumes[idx]?.profundidade || ''}
                              onChange={(e) => handleUpdateVolumeDimensions(idx, 'profundidade', e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-orange-500" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Peso (kg)</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              placeholder="0" 
                              value={form.volumes[idx]?.peso || ''}
                              onChange={(e) => handleUpdateVolumeDimensions(idx, 'peso', e.target.value)}
                              className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-orange-500" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">3. Tipo de Frete e Serviços</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-3">Tipo de Frete *</label>
                    <div className="flex gap-4">
                      {TIPOS_FRETE.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setForm({ ...form, tipoFrete: tipo })}
                          className={`px-6 py-2 rounded-lg font-semibold transition ${
                            form.tipoFrete === tipo
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-3">Serviços Adicionais</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SERVICOS_ADICIONAIS.map(servico => (
                        <button
                          key={servico.id}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            servicosAdicionais: {
                              ...prev.servicosAdicionais,
                              [servico.valor]: !prev.servicosAdicionais[servico.valor]
                            }
                          }))}
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            form.servicosAdicionais[servico.valor]
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                          }`}
                        >
                          {servico.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Data/Hora e Observações</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Data/Hora da Coleta *</label>
                    <input
                      type="datetime-local"
                      value={form.dataHoraColeta}
                      onChange={(e) => setForm({ ...form, dataHoraColeta: e.target.value })}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Tempo de Cotação (minutos)</label>
                    <input
                      type="number"
                      value={form.tempoCotacaoMinutos}
                      onChange={(e) => setForm({ ...form, tempoCotacaoMinutos: e.target.value })}
                      placeholder="120"
                      min="30"
                      step="30"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-slate-400 text-sm mb-2">Observações</label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Informações adicionais sobre a coleta, restrições, etc..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition h-20 resize-none"
                  />
                </div>

                <div className="space-y-3 mt-6">
                  <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700/50 transition">
                    <input
                      type="checkbox"
                      checked={form.aceitaMotoCarAte100km}
                      onChange={(e) => setForm({ ...form, aceitaMotoCarAte100km: e.target.checked })}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-slate-300">Aceitar transportadoras com moto/carro até 100km</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700/50 transition">
                    <input
                      type="checkbox"
                      checked={form.aceitaTransportadorSemCNPJ}
                      onChange={(e) => setForm({ ...form, aceitaTransportadorSemCNPJ: e.target.checked })}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <span className="text-slate-300">Aceitar transportadores sem CNPJ (sem documentos fiscais)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">4. Resumo final</h2>
                  <button type="button" onClick={() => setStep(1)} className="text-orange-400 text-sm hover:text-orange-300">Editar tudo</button>
                </div>

                <div className="space-y-4 text-sm text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Produtos ({(form.produtosLista || []).length})</p>
                      <p className="text-slate-300">Peso total {toLocaleInput(calcularTotais().pesoTotal,3)} kg • Valor R$ {toLocaleInput(calcularTotais().valorTotal)}</p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Destinatário</p>
                      <p className="text-slate-300">{form.destinatarioNome} • {form.destinatarioCidade}-{form.destinatarioEstado}</p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Endereço de Coleta</p>
                      <p className="text-slate-300">{form.enderecoColetaNome} • {form.enderecoColetaCidade}-{form.enderecoColetaEstado}</p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Volumes ({form.quantidadeVolumes})</p>
                      <p className="text-slate-300">Preenchidos: Alt/Larg/Prof/Peso</p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Frete e Serviços</p>
                      <p className="text-slate-300">{form.tipoFrete} • Coleta: {form.dataHoraColeta || 'sem data'} • Tempo cotação: {form.tempoCotacaoMinutos} min</p>
                    </div>
                    <button type="button" onClick={() => setStep(3)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Observações</p>
                      <p className="text-slate-300 whitespace-pre-line">{form.observacoes || 'Nenhuma observação'}</p>
                    </div>
                    <button type="button" onClick={() => setStep(3)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">Aceites</p>
                      <p className="text-slate-300">
                        Moto/Carro até 100km: {form.aceitaMotoCarAte100km ? 'Sim' : 'Não'} • Sem CNPJ: {form.aceitaTransportadorSemCNPJ ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(3)} className="text-orange-400 hover:text-orange-300 text-xs">Editar</button>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-orange-900/30 border border-orange-700 text-orange-100 text-sm">
                  Ao enviar, a cotação não poderá ser editada. Você pode voltar e ajustar qualquer etapa antes de confirmar.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition"
              >
                ← Voltar
              </button>
            )}

            {step < 4 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50"
              >
                Continuar
              </button>
            )}

            {step === 4 && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50"
              >
                {loading ? '⏳ Criando Cotação...' : '✓ Enviar Cotação'}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/cotacoes')}
              className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition"
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
