import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Trash2, Edit2, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

// Lista de estados brasileiros
const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Validar CPF
const validarCPF = (cpf) => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(cpfLimpo[9]) !== dv1) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  return parseInt(cpfLimpo[10]) === dv2;
};

// Validar CNPJ
const validarCNPJ = (cnpj) => {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
  
  let soma = 0;
  const multiplicador1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * multiplicador1[i];
  }
  let resto = soma % 11;
  let dv1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(cnpjLimpo[12]) !== dv1) return false;
  
  soma = 0;
  const multiplicador2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * multiplicador2[i];
  }
  resto = soma % 11;
  let dv2 = resto < 2 ? 0 : 11 - resto;
  return parseInt(cnpjLimpo[13]) === dv2;
};

// Formatar CPF
const formatarCPF = (valor) => {
  const cpfLimpo = valor.replace(/\D/g, '').slice(0, 11);
  if (cpfLimpo.length <= 3) return cpfLimpo;
  if (cpfLimpo.length <= 6) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3)}`;
  if (cpfLimpo.length <= 9) return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6)}`;
  return `${cpfLimpo.slice(0, 3)}.${cpfLimpo.slice(3, 6)}.${cpfLimpo.slice(6, 9)}-${cpfLimpo.slice(9)}`;
};

// Formatar CNPJ
const formatarCNPJ = (valor) => {
  const cnpjLimpo = valor.replace(/\D/g, '').slice(0, 14);
  if (cnpjLimpo.length <= 2) return cnpjLimpo;
  if (cnpjLimpo.length <= 5) return `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2)}`;
  if (cnpjLimpo.length <= 8) return `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5)}`;
  if (cnpjLimpo.length <= 12) return `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8)}`;
  return `${cnpjLimpo.slice(0, 2)}.${cnpjLimpo.slice(2, 5)}.${cnpjLimpo.slice(5, 8)}/${cnpjLimpo.slice(8, 12)}-${cnpjLimpo.slice(12)}`;
};

export default function Destinatarios() {
  const { user } = useAuthStore();
  const [destinatarios, setDestinatarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const [form, setForm] = useState({
    nomeCompleto: '',
    tipoPessoa: 'cpf',
    cpf: '',
    cnpj: '',
    codigoCadastro: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
    aceitaMotoCarAte100km: false
  });

  useEffect(() => {
    fetchDestinatarios();
  }, [user]);

  const fetchDestinatarios = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.entities.destinatario.list({ clienteId: user?.id, limit: 50 });
      const dados = res?.data || res;
      setDestinatarios(Array.isArray(dados) ? dados : []);
      setError('');
    } catch (err) {
      console.error('Erro ao listar destinatários', err);
      setDestinatarios([]);
    } finally {
      setLoading(false);
    }
  };

  const buscarEnderecoPorCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setError('CEP deve conter 8 dígitos');
      return;
    }

    setLoadingCep(true);
    setError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        setLoadingCep(false);
        return;
      }

      setForm(prev => ({
        ...prev,
        cep: cepLimpo,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || 'SP'
      }));
      setError('');
    } catch (err) {
      console.error('Erro ao buscar CEP', err);
      setError('Erro ao buscar CEP. Verifique sua conexão.');
    } finally {
      setLoadingCep(false);
    }
  };

  const validarFormulario = () => {
    if (!form.nomeCompleto.trim()) {
      setError('Nome do destinatário é obrigatório');
      return false;
    }
    if (form.nomeCompleto.length < 3) {
      setError('Nome deve ter pelo menos 3 caracteres');
      return false;
    }

    if (!form.tipoPessoa || !['cpf', 'cnpj'].includes(form.tipoPessoa)) {
      setError('Tipo de pessoa deve ser CPF ou CNPJ');
      return false;
    }

    if (form.tipoPessoa === 'cpf') {
      if (!form.cpf.trim()) {
        setError('CPF é obrigatório para pessoa física');
        return false;
      }
      if (!validarCPF(form.cpf)) {
        setError('CPF inválido');
        return false;
      }
    } else if (form.tipoPessoa === 'cnpj') {
      if (!form.cnpj.trim()) {
        setError('CNPJ é obrigatório para pessoa jurídica');
        return false;
      }
      if (!validarCNPJ(form.cnpj)) {
        setError('CNPJ inválido');
        return false;
      }
    }

    const cepLimpo = form.cep.replace(/\D/g, '');
    if (!cepLimpo || cepLimpo.length !== 8) {
      setError('CEP é obrigatório e deve conter 8 dígitos');
      return false;
    }

    if (!form.logradouro.trim()) {
      setError('Logradouro é obrigatório');
      return false;
    }

    if (!form.numero.trim()) {
      setError('Número é obrigatório');
      return false;
    }

    if (!form.bairro.trim()) {
      setError('Bairro é obrigatório');
      return false;
    }

    if (!form.cidade.trim()) {
      setError('Cidade é obrigatória');
      return false;
    }

    if (!ESTADOS_BR.includes(form.estado)) {
      setError('Estado inválido');
      return false;
    }

    return true;
  };

  const handleAddDestinatario = async () => {
    setError('');
    setSuccess('');

    if (!validarFormulario()) {
      return;
    }

    try {
      const destinatarioData = {
        ...form,
        nomeCompleto: form.nomeCompleto.toUpperCase(),
        cep: form.cep.replace(/\D/g, ''),
        cpf: form.cpf.replace(/\D/g, '') || null,
        cnpj: form.cnpj.replace(/\D/g, '') || null,
        codigoCadastro: form.codigoCadastro.trim() || null,
        observacoes: form.observacoes.trim() || null,
        clienteId: user?.id
      };

      if (editingId) {
        await api.entities.destinatario.update(editingId, destinatarioData);
        setDestinatarios(destinatarios.map(d => (d.id || d._id) === editingId ? { ...d, ...destinatarioData } : d));
        setSuccess('Destinatário atualizado com sucesso!');
        setEditingId(null);
      } else {
        const res = await api.entities.destinatario.create(destinatarioData);
        setDestinatarios([...destinatarios, res]);
        setSuccess('Destinatário adicionado com sucesso!');
      }

      resetFormulario();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar destinatário', err);
      if (err.response?.status === 409) {
        setError('Já existe um destinatário com este nome para este cliente.');
      } else {
        setError('Erro ao salvar destinatário. Tente novamente.');
      }
    }
  };

  const resetFormulario = () => {
    setForm({
      nomeCompleto: '',
      tipoPessoa: 'cpf',
      cpf: '',
      cnpj: '',
      codigoCadastro: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: 'SP',
      pais: 'Brasil',
      observacoes: '',
      aceitaMotoCarAte100km: false
    });
  };

  const handleDeleteDestinatario = (destinatario) => {
    if (!window.confirm(`Tem certeza que deseja deletar o destinatário ${destinatario.nomeCompleto}?`)) return;

    try {
      api.entities.destinatario.delete(destinatario.id);
      setDestinatarios(destinatarios.filter(d => (d.id || d._id) !== destinatario.id));
      setSuccess('Destinatário deletado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao deletar', err);
      setError('Erro ao deletar destinatário');
    }
  };

  const handleEditDestinatario = (destinatario) => {
    setEditingId(destinatario.id || destinatario._id);
    setForm({
      nomeCompleto: destinatario.nomeCompleto || '',
      tipoPessoa: destinatario.tipoPessoa || 'cpf',
      cpf: destinatario.cpf || '',
      cnpj: destinatario.cnpj || '',
      codigoCadastro: destinatario.codigoCadastro || '',
      cep: destinatario.cep || '',
      logradouro: destinatario.logradouro || '',
      numero: destinatario.numero || '',
      complemento: destinatario.complemento || '',
      bairro: destinatario.bairro || '',
      cidade: destinatario.cidade || '',
      estado: destinatario.estado || 'SP',
      pais: destinatario.pais || 'Brasil',
      observacoes: destinatario.observacoes || '',
      aceitaMotoCarAte100km: destinatario.aceitaMotoCarAte100km || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <MapPin className="w-8 h-8 text-orange-500" /> Destinatários
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

        {/* Formulário */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-bold text-white mb-6">
            {editingId ? '✏️ Edição de Destinatário' : '➕ Criação de Destinatário'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Nome Completo *</label>
              <input
                type="text"
                value={form.nomeCompleto}
                onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                placeholder="Ex: JOÃO SILVA SANTOS"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Tipo de Pessoa */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Tipo de Pessoa *</label>
              <select
                value={form.tipoPessoa}
                onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition"
              >
                <option value="cpf">Pessoa Física (CPF)</option>
                <option value="cnpj">Pessoa Jurídica (CNPJ)</option>
              </select>
            </div>

            {/* CPF ou CNPJ */}
            {form.tipoPessoa === 'cpf' ? (
              <div>
                <label className="block text-slate-400 text-sm mb-2">CPF *</label>
                <input
                  type="text"
                  value={formatarCPF(form.cpf)}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength="14"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 text-sm mb-2">CNPJ *</label>
                <input
                  type="text"
                  value={formatarCNPJ(form.cnpj)}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  maxLength="18"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            )}

            {/* Código de Cadastro */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Código de Cadastro (opcional)</label>
              <input
                type="text"
                value={form.codigoCadastro}
                onChange={(e) => setForm({ ...form, codigoCadastro: e.target.value })}
                placeholder="Ex: CLI-001"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
              <p className="text-slate-500 text-xs mt-1">Usar para integração com sistemas externos</p>
            </div>

            {/* CEP */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">CEP (8 dígitos) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.cep}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, cep: valor });
                  }}
                  onBlur={() => form.cep.replace(/\D/g, '').length === 8 && buscarEnderecoPorCep(form.cep)}
                  placeholder="00000000"
                  maxLength="8"
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
                />
                {loadingCep && (
                  <button disabled className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 text-sm">Buscando...</button>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">Preencher e sair do campo busca automaticamente</p>
            </div>

            {/* Logradouro */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Logradouro *</label>
              <input
                type="text"
                value={form.logradouro}
                onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                placeholder="Ex: RUA DAS FLORES"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Número *</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ex: 123"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Complemento */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Complemento</label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                placeholder="Ex: APTO 42"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Bairro *</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Ex: CENTRO"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Cidade *</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Ex: SÃO PAULO"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Estado *</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition"
              >
                {ESTADOS_BR.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Ex: Chegar entre 14h-16h, ligar antes de chegar, cão na propriedade..."
                rows="3"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition resize-none"
              />
            </div>

            {/* Aceita Moto/Carro até 100km */}
            <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              <input
                type="checkbox"
                id="aceitaMoto"
                checked={form.aceitaMotoCarAte100km}
                onChange={(e) => setForm({ ...form, aceitaMotoCarAte100km: e.target.checked })}
                className="w-5 h-5 rounded cursor-pointer"
              />
              <label htmlFor="aceitaMoto" className="text-slate-300 cursor-pointer flex-1">
                Aceita coletas via moto/carro até 100km de distância
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAddDestinatario}
              className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition"
            >
              {editingId ? '💾 Salvar Destinatário' : '⮕ Incluir Destinatário'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  resetFormulario();
                }}
                className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-semibold hover:bg-slate-600/50 transition"
              >
                ❌ Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Total de Destinatários</p>
            <p className="text-3xl font-bold text-white mt-2">{destinatarios.length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Pessoa Física</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{destinatarios.filter(d => d.tipoPessoa === 'cpf').length}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-sm">Pessoa Jurídica</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{destinatarios.filter(d => d.tipoPessoa === 'cnpj').length}</p>
          </div>
        </div>

        {/* Lista de Destinatários */}
        {loading ? (
          <p className="text-slate-300">Carregando destinatários...</p>
        ) : destinatarios.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700/50 text-center">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
            <p className="text-slate-300">Nenhum destinatário cadastrado ainda.</p>
            <p className="text-slate-500 text-sm mt-1">Crie seu primeiro destinatário para usar nas cotações.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {destinatarios.map((d) => (
              <div key={d.id || d._id} className="bg-slate-800/50 backdrop-blur rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{d.nomeCompleto}</h3>
                    {d.codigoCadastro && <p className="text-slate-400 text-sm">Código: {d.codigoCadastro}</p>}
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Tipo</p>
                        <p className="text-slate-300">{d.tipoPessoa === 'cpf' ? 'CPF' : 'CNPJ'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Documento</p>
                        <p className="text-slate-300">{d.tipoPessoa === 'cpf' ? d.cpf : d.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Endereço</p>
                        <p className="text-slate-300">{d.logradouro}, {d.numero} {d.complemento ? `- ${d.complemento}` : ''}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">CEP/Cidade</p>
                        <p className="text-slate-300">{d.cep} - {d.cidade}/{d.estado}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Restrições</p>
                        <p className="text-slate-300">
                          {d.aceitaMotoCarAte100km ? '✅ Moto/Carro' : '❌ Sem restrição'}
                        </p>
                      </div>
                    </div>
                    {d.observacoes && (
                      <div className="mt-3 p-2 bg-slate-700/30 rounded border border-slate-600/50">
                        <p className="text-slate-400 text-xs">Observações: {d.observacoes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDestinatario(d)}
                      className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/40 transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDestinatario(d)}
                      className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 transition"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
