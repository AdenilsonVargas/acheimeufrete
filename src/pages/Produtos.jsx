import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import NCMAutocomplete from '@/components/NCMAutocomplete';
import NCMDownloadButton from '@/components/NCMDownloadButton';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Package, AlertCircle, CheckCircle, Trash2, Edit2, Tag } from 'lucide-react';

export default function Produtos() {
  const { user } = useAuthStore();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  // Lista de unidades de medida permitidas
  const UNIDADES_PERMITIDAS = ['kg', 'ton', 'litro', 'm3', 'unidade', 'saca', 'palete', 'container', 'granel'];
  
  // Flags de classificação de produtos
  const FLAGS_PRODUTOS = [
    'fragil', 'quimico', 'liquido', 'granel', 'delicado', 'perecivel',
    'refrigerado', 'congelado', 'inflamavel', 'corrosivo', 'toxico',
    'explosivo', 'radioativo', 'biologico', 'volumoso', 'pesado',
    'empilhavel', 'nao_empilhavel', 'requer_cuidado', 'alto_valor'
  ];

  // Parse números aceitando vírgula e removendo pontos de milhar
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

  const metersToCmInput = (valueM) => {
    if (valueM === null || valueM === undefined || valueM === '') return '';
    return (Number(valueM) * 100).toFixed(0);
  };

  const cmInputToMeters = (valueCm) => {
    const num = parseLocaleNumber(valueCm);
    return Number.isNaN(num) ? NaN : num / 100;
  };

  const [form, setForm] = useState({
    nome: '',
    sku: '',
    ncmCode: '',
    ncmClassificacao: '',
    unidadeMedida: 'kg',
    pesoKg: '',
    larguraM: '',
    alturaM: '',
    comprimentoM: '',
    valorUnitario: '',
    flags: [],
    observacoes: ''
  });

  const [ncmSugerido, setNcmSugerido] = useState(null); // Armazena NCM selecionado do autocomplete

  useEffect(() => {
    fetchProdutos();
  }, [user]);

  const fetchProdutos = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.entities.produto.list({ clienteId: user?.id, limit: 50 });
      const dados = res?.data || res;
      setProdutos(Array.isArray(dados) ? dados : []);
      setError('');
    } catch (err) {
      console.error('Erro ao listar produtos', err);
      setProdutos([]);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Validações conforme as regras de negócio
  const validarFormulario = () => {
    if (!form.nome.trim()) {
      setError('Nome do produto é obrigatório');
      return false;
    }
    if (form.nome.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!form.ncmCode.trim()) {
      setError('Código NCM é obrigatório');
      return false;
    }
    if (!/^\d{8}$/.test(form.ncmCode.replace(/\D/g, ''))) {
      setError('Código NCM deve ter 8 dígitos');
      return false;
    }

    const pesoNum = parseLocaleNumber(form.pesoKg);
    if (Number.isNaN(pesoNum) || pesoNum <= 0) {
      setError('Peso deve ser um valor maior que zero');
      return false;
    }

    const larguraNum = parseLocaleNumber(form.larguraM);
    const alturaNum = parseLocaleNumber(form.alturaM);
    const comprimentoNum = parseLocaleNumber(form.comprimentoM);

    if (Number.isNaN(larguraNum) || Number.isNaN(alturaNum) || Number.isNaN(comprimentoNum) || larguraNum <= 0 || alturaNum <= 0 || comprimentoNum <= 0) {
      setError('Dimensões (cm) devem ser maiores que zero');
      return false;
    }

    const valorNum = parseLocaleNumber(form.valorUnitario || 0);
    if (Number.isNaN(valorNum) || valorNum < 0) {
      setError('Valor unitário não pode ser negativo');
      return false;
    }

    if (!UNIDADES_PERMITIDAS.includes(form.unidadeMedida)) {
      setError('Unidade de medida inválida');
      return false;
    }

    return true;
  };

  const handleAddProduto = async () => {
    setError('');
    setSuccess('');

    if (!validarFormulario()) {
      return;
    }

    try {
      const pesoKgNum = parseLocaleNumber(form.pesoKg);
      const larguraMNum = cmInputToMeters(form.larguraM);
      const alturaMNum = cmInputToMeters(form.alturaM);
      const comprimentoMNum = cmInputToMeters(form.comprimentoM);
      const valorUnitarioNum = parseLocaleNumber(form.valorUnitario || 0);

      const produtoData = {
        ...form,
        nome: form.nome.toUpperCase(),
        ncmCode: form.ncmCode.replace(/\D/g, ''),
        ncmClassificacao: form.ncmClassificacao.trim() || ncmSugerido?.classificacao || '',
        pesoKg: pesoKgNum,
        larguraM: larguraMNum,
        alturaM: alturaMNum,
        comprimentoM: comprimentoMNum,
        valorUnitario: valorUnitarioNum,
        clienteId: user?.id,
        flags: form.flags || []
      };

      if (editingId) {
        const resUp = await api.entities.produto.update(editingId, produtoData);
        const atualizado = resUp?.data || resUp;
        setProdutos(produtos.map(p => (p.id || p._id) === editingId ? { ...p, ...atualizado } : p));
        setSuccess('Produto atualizado com sucesso!');
        setEditingId(null);
      } else {
        const res = await api.entities.produto.create(produtoData);
        const novo = res?.data || res;
        setProdutos([...produtos, novo]);
        setSuccess('Produto adicionado com sucesso!');
      }

      // Resetar formulário
      setNcmSugerido(null);
      setForm({
        nome: '',
        sku: '',
        ncmCode: '',
        ncmClassificacao: '',
        unidadeMedida: 'kg',
        pesoKg: '',
        larguraM: '',
        alturaM: '',
        comprimentoM: '',
        valorUnitario: '',
        flags: [],
        observacoes: ''
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar produto', err);
      setError('Erro ao salvar produto. Tente novamente.');
    }
  };

  const handleDeleteProduto = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja deletar o produto "${nome}"?`)) return;

    try {
      await api.entities.produto.delete(id);
      setProdutos(produtos.filter(p => (p.id || p._id) !== id));
      setSuccess('Produto deletado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao deletar produto', err);
      setError('Erro ao deletar produto');
    }
  };

  const handleEditProduto = (produto) => {
    if (!window.confirm(`Editar o produto "${produto.nome}"?`)) return;
    setEditingId(produto.id || produto._id);
    setNcmSugerido(null);
    setForm({
      nome: produto.nome || '',
      sku: produto.sku || '',
      ncmCode: produto.ncmCode || '',
      ncmClassificacao: produto.ncmClassificacao || '',
      unidadeMedida: produto.unidadeMedida || 'kg',
      pesoKg: toLocaleInput(produto.pesoKg, 3),
      larguraM: metersToCmInput(produto.larguraM),
      alturaM: metersToCmInput(produto.alturaM),
      comprimentoM: metersToCmInput(produto.comprimentoM),
      valorUnitario: toLocaleInput(produto.valorUnitario, 2),
      flags: produto.flags || [],
      observacoes: produto.observacoes || ''
    });
  };

  const handleToggleFlag = (flag) => {
    setForm(prev => ({
      ...prev,
      flags: prev.flags.includes(flag)
        ? prev.flags.filter(f => f !== flag)
        : [...prev.flags, flag]
    }));
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <Package className="w-8 h-8 text-orange-500" /> Produtos
        </h1>

        {/* Mensagens de Sucesso e Erro */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold">Erro</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 font-semibold">Sucesso</p>
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Formulário de Cadastro */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-6">
            {editingId ? '✏️ Edição de Produto' : '➕ Criação de Produto'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome do Produto */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Nome do Produto *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: PNEU CARRO COMUM"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                maxLength="100"
              />
              <p className="text-slate-500 text-xs mt-1">Será convertido para maiúsculas</p>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">SKU</label>
              <input
                type="text"
                value={form.sku || ''}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Ex: SKU-001-ABC"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                maxLength="50"
              />
              <p className="text-slate-500 text-xs mt-1">Opcional. Identificador interno do produto.</p>
            </div>

            {/* Código NCM - SUBSTITUIR INPUT MANUAL POR AUTOCOMPLETE */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Código NCM (8 dígitos) *</label>
              <NCMAutocomplete
                value={form.ncmCode}
                onChange={(codigo) => setForm({ ...form, ncmCode: codigo })}
                onSelect={(ncm) => {
                  // Ao selecionar NCM, preencher classificação e características
                  setNcmSugerido(ncm);
                  setForm({
                    ...form,
                    ncmCode: ncm.codigo,
                    ncmClassificacao: ncm.classificacao || ncm.descricao || '',
                    // Adicionar características sugeridas às flags existentes (sem duplicar)
                    flags: Array.from(new Set([...form.flags, ...(ncm.caracteristicas || [])]))
                  });
                }}
              />
            </div>

            {/* Classificação NCM - Preenchida automaticamente */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">
                Classificação NCM
                {ncmSugerido && (
                  <span className="ml-2 text-xs text-green-400">✓ Preenchido automaticamente</span>
                )}
              </label>
              <input
                type="text"
                value={form.ncmClassificacao}
                onChange={(e) => setForm({ ...form, ncmClassificacao: e.target.value })}
                placeholder="Ex: Produtos de Borracha"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              {ncmSugerido?.descricao && (
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {ncmSugerido.descricao}
                </p>
              )}
            </div>

            {/* Características sugeridas do NCM (exibir logo abaixo) */}
            {ncmSugerido?.caracteristicas?.length > 0 && (
              <div className="md:col-span-2 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Características sugeridas para este NCM
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ncmSugerido.caracteristicas.map((car) => {
                    const isActive = form.flags.includes(car);
                    return (
                      <button
                        key={car}
                        type="button"
                        onClick={() => {
                          setForm({
                            ...form,
                            flags: isActive
                              ? form.flags.filter((f) => f !== car)
                              : [...form.flags, car]
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {isActive ? '✓ ' : ''}{car.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Clique para marcar/desmarcar
                </p>
              </div>
            )}

            {/* Unidade de Medida */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Unidade de Medida *</label>
              <select
                value={form.unidadeMedida}
                onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition"
              >
                {UNIDADES_PERMITIDAS.map(u => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Peso */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Peso (kg) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.pesoKg}
                onChange={(e) => setForm({ ...form, pesoKg: e.target.value.replace(/[^0-9,\.]/g, '') })}
                placeholder="Ex: 25,5"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Use vírgula para decimais</p>
            </div>

            {/* Valor Unitário */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Valor Unitário (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.valorUnitario}
                onChange={(e) => setForm({ ...form, valorUnitario: e.target.value.replace(/[^0-9,\.]/g, '') })}
                placeholder="Ex: 150,00"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Use vírgula para decimais</p>
            </div>

            {/* Dimensões */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Largura (cm) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.larguraM}
                onChange={(e) => setForm({ ...form, larguraM: e.target.value.replace(/[^0-9,\.]/g, '') })}
                placeholder="Ex: 120"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Informe em centímetros</p>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Altura (cm) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.alturaM}
                onChange={(e) => setForm({ ...form, alturaM: e.target.value.replace(/[^0-9,\.]/g, '') })}
                placeholder="Ex: 150"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Informe em centímetros</p>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Comprimento (cm) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.comprimentoM}
                onChange={(e) => setForm({ ...form, comprimentoM: e.target.value.replace(/[^0-9,\.]/g, '') })}
                placeholder="Ex: 200"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Informe em centímetros</p>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o produto..."
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition h-20 resize-none"
              />
            </div>

            {/* Flags de Classificação */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-3">Características do Produto</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {FLAGS_PRODUTOS.map(flag => (
                  <button
                    key={flag}
                    onClick={() => handleToggleFlag(flag)}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      form.flags.includes(flag)
                        ? 'bg-orange-600 text-white border border-orange-500'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {flag.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddProduto}
              className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition"
            >
              {editingId ? '💾 Salvar Produto' : '➕ Incluir Produto'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setNcmSugerido(null);
                  setForm({
                    nome: '',
                    sku: '',
                    ncmCode: '',
                    ncmClassificacao: '',
                    unidadeMedida: 'kg',
                    pesoKg: '',
                    larguraM: '',
                    alturaM: '',
                    comprimentoM: '',
                    valorUnitario: '',
                    flags: [],
                    observacoes: ''
                  });
                }}
                className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition"
              >
                ❌ Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Total de Produtos</p>
            <p className="text-3xl font-bold text-white mt-2">{produtos.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Frágeis</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{produtos.filter(p => p.flags?.includes('fragil')).length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Refrigerados</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{produtos.filter(p => p.flags?.includes('refrigerado')).length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Alto Valor</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{produtos.filter(p => p.flags?.includes('alto_valor')).length}</p>
          </div>
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <p className="text-slate-300">Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700/50 text-center">
            <Package className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-300">Nenhum produto cadastrado ainda.</p>
            <p className="text-slate-500 text-sm mt-1">Crie seu primeiro produto acima para começar.</p>
          </div>
        ) : (
          <>
            {/* Link de Download da Planilha NCM pequeno, no canto inferior direito */}
            <div className="flex justify-end mt-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Precisa de referência de NCMs?</span>
                <NCMDownloadButton className="text-xs" />
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos.map((p, index) => (
                <div key={p.id || p._id || `produto-${index}`} className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{p.nome}</h3>
                      {p.sku && <p className="text-slate-500 text-xs">SKU: {p.sku}</p>}
                      <p className="text-slate-400 text-sm">NCM: {p.ncmCode}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditProduto(p)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/40 transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduto(p.id || p._id, p.nome)}
                        className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 transition"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300"><span className="text-slate-500">Peso:</span> {toLocaleInput(p.pesoKg, 3)} kg</p>
                    <p className="text-slate-300"><span className="text-slate-500">Dimensões:</span> {(p.larguraM * 100).toFixed(0)} cm × {(p.alturaM * 100).toFixed(0)} cm × {(p.comprimentoM * 100).toFixed(0)} cm</p>
                    <p className="text-slate-300"><span className="text-slate-500">Unidade:</span> {p.unidadeMedida}</p>
                    {p.valorUnitario > 0 && (
                      <p className="text-slate-300"><span className="text-slate-500">Valor:</span> R$ {toLocaleInput(p.valorUnitario, 2)}</p>
                    )}
                  </div>

                  {p.flags && p.flags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.flags.map(flag => (
                        <span key={flag} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                          {flag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.observacoes && (
                    <p className="text-slate-400 text-xs mt-3 italic">{p.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
