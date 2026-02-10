import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import useAuthStore from '@/hooks/useAuthStore';
import { MapPin, Plus, Edit2, Trash2, Star, Loader2 } from 'lucide-react';

const API_BASE = '/api';

export default function EnderecosColeta() {
  const { user, token } = useAuthStore();
  const [enderecos, setEnderecos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    padrao: false,
  });

  const limparForm = () => {
    setForm({
      nome: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      padrao: false,
    });
    setEditandoId(null);
  };

  const carregarEnderecos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/enderecos-coleta`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnderecos(res.data.enderecos || []);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setEnderecos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      carregarEnderecos();
    }
  }, [user, token]);

  const buscarCEP = async (cep) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;
    try {
      const res = await axios.get(`${API_BASE}/enderecos-coleta/cep/buscar`, {
        params: { cep: cep.replace(/\D/g, '') },
      });
      setForm((prev) => ({
        ...prev,
        logradouro: res.data.logradouro || '',
        bairro: res.data.bairro || '',
        cidade: res.data.cidade || '',
        estado: res.data.estado || '',
      }));
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    }
  };

  const handleCEPBlur = (e) => {
    buscarCEP(e.target.value);
  };

  const handleAddOrUpdate = async () => {
    if (!form.nome.trim()) {
      alert('Nome do endereço é obrigatório');
      return;
    }
    if (!form.cep.trim()) {
      alert('CEP é obrigatório');
      return;
    }

    setSalvando(true);
    try {
      if (editandoId) {
        // Confirmar edição
        const confirmar = window.confirm(`Salvar alterações no endereço "${form.nome}"?`);
        if (!confirmar) {
          setSalvando(false);
          return;
        }

        await axios.put(
          `${API_BASE}/enderecos-coleta/${editandoId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Endereço atualizado com sucesso!');
      } else {
        await axios.post(
          `${API_BASE}/enderecos-coleta`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Endereço criado com sucesso!');
      }
      limparForm();
      carregarEnderecos();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert(err.response?.data?.message || 'Erro ao salvar endereço');
    } finally {
      setSalvando(false);
    }
  };

  const handleEdit = (endereco) => {
    const confirmar = window.confirm(`Editar o endereço "${endereco.nome}"?`);
    if (!confirmar) return;

    setForm({
      nome: endereco.nome || '',
      cep: endereco.cep || '',
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      estado: endereco.estado || '',
      padrao: endereco.padrao || false,
    });
    setEditandoId(endereco.id);
  };

  const handleDelete = async (id, nome) => {
    const confirmar = window.confirm(`Tem certeza que deseja deletar o endereço "${nome}"?`);
    if (!confirmar) return;

    try {
      await axios.delete(`${API_BASE}/enderecos-coleta/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Endereço deletado com sucesso!');
      carregarEnderecos();
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao deletar endereço');
    }
  };

  const handleMarcarPadrao = async (id, nome) => {
    const confirmar = window.confirm(`Marcar "${nome}" como endereço padrão?`);
    if (!confirmar) return;

    try {
      await axios.patch(
        `${API_BASE}/enderecos-coleta/${id}/marcar-padrao`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Endereço padrão atualizado!');
      carregarEnderecos();
    } catch (err) {
      console.error('Erro ao marcar como padrão:', err);
      alert('Erro ao marcar como padrão');
    }
  };

  const handleCancelEdit = () => {
    const confirmar = window.confirm('Descartar alterações?');
    if (confirmar) {
      limparForm();
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-orange-600" />
            Endereços de Coleta
          </h1>
          <div className="text-sm text-slate-400">
            Total: <span className="text-white font-bold">{enderecos.length}</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            {editandoId ? '✏️ Edição de Endereço' : '🏭 Criação de Endereço'}
          </h2>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nome do Endereço <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: MATRIZ, FILIAL SP, FILIAL CURITIBA"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-field w-full uppercase"
              />
              <p className="text-xs text-slate-400 mt-1">
                Será convertido automaticamente para MAIÚSCULA
              </p>
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="00000-000"
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                onBlur={handleCEPBlur}
                className="input-field w-full"
                maxLength={9}
              />
              <p className="text-xs text-slate-400 mt-1">
                Digite o CEP e os demais campos serão preenchidos automaticamente
              </p>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Logradouro</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida..."
                  value={form.logradouro}
                  onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                  className="input-field w-full uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Número</label>
                <input
                  type="text"
                  placeholder="1000"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Complemento + Bairro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Complemento</label>
                <input
                  type="text"
                  placeholder="Sala, Bloco..."
                  value={form.complemento}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                  className="input-field w-full uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Bairro</label>
                <input
                  type="text"
                  placeholder="Centro, Jardins..."
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  className="input-field w-full uppercase"
                />
              </div>
            </div>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="São Paulo, Rio de Janeiro..."
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  className="input-field w-full uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
                <input
                  type="text"
                  placeholder="SP, RJ, MG..."
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                  className="input-field w-full uppercase"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Padrão */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="padrao"
                checked={form.padrao}
                onChange={(e) => setForm({ ...form, padrao: e.target.checked })}
                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="padrao" className="text-sm text-slate-300">
                <Star className="w-4 h-4 inline text-orange-500" /> Marcar como endereço padrão
              </label>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              {editandoId ? (
                <>
                  <button
                    onClick={handleAddOrUpdate}
                    disabled={salvando}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>💾 Salvar Endereço</>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={salvando}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    ✖️ Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddOrUpdate}
                  disabled={salvando}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Incluir Endereço
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Endereços */}
        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-slate-400">Carregando endereços...</p>
            </div>
          ) : enderecos.length === 0 ? (
            <div className="card text-center py-8">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhum endereço cadastrado ainda.</p>
              <p className="text-sm text-slate-500 mt-1">Crie seu primeiro endereço acima!</p>
            </div>
          ) : (
            enderecos.map((e) => (
              <div
                key={e.id}
                className={`card hover:shadow-xl transition-shadow ${
                  e.padrao ? 'border-2 border-orange-500 bg-gradient-to-r from-orange-900/10 to-transparent' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Nome + Badge Padrão */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white uppercase">{e.nome}</h3>
                      {e.padrao && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white">
                          <Star className="w-3 h-3" /> PADRÃO
                        </span>
                      )}
                    </div>

                    {/* Endereço Completo */}
                    <p className="text-slate-300 mb-1">
                      <strong>CEP:</strong> {e.cep}
                    </p>
                    <p className="text-slate-300 mb-1">
                      <strong>Endereço:</strong> {e.logradouro}, {e.numero}
                      {e.complemento && ` - ${e.complemento}`}
                    </p>
                    <p className="text-slate-300">
                      <strong>Bairro:</strong> {e.bairro} | <strong>Cidade:</strong> {e.cidade}/{e.estado}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col gap-2 ml-4">
                    {!e.padrao && (
                      <button
                        onClick={() => handleMarcarPadrao(e.id, e.nome)}
                        className="btn-secondary text-xs flex items-center gap-1 px-3 py-1"
                        title="Marcar como padrão"
                      >
                        <Star className="w-3 h-3" /> Padrão
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(e)}
                      className="btn-secondary text-xs flex items-center gap-1 px-3 py-1"
                      title="Editar"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(e.id, e.nome)}
                      className="btn-danger text-xs flex items-center gap-1 px-3 py-1"
                      title="Deletar"
                    >
                      <Trash2 className="w-3 h-3" /> Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informações */}
        <div className="card bg-blue-900/20 border border-blue-700">
          <h3 className="text-lg font-bold text-blue-400 mb-2">ℹ️ Informações Importantes</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Digite o <strong>CEP</strong> primeiro, os demais campos são preenchidos automaticamente</li>
            <li>• O endereço marcado como <strong>PADRÃO</strong> aparecerá primeiro ao criar cotações</li>
            <li>• Todos os endereços serão convertidos para <strong>MAIÚSCULA</strong> (para emissão de NF)</li>
            <li>• Você pode ter múltiplos endereços (matriz, filiais, etc.)</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
