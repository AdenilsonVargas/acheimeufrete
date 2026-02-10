import React, { useState } from 'react';
import { Truck, User, Mail, Phone, Lock, FileText, MapPin, AlertCircle } from 'lucide-react';
import Alert from '@/components/common/Alert';

export default function CadastroTransportadoraForm({ onSubmit, isLoading = false }) {
  const [form, setForm] = useState({
    nomeEmpresa: '',
    cnpj: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: '',
    rntrc: '',
    tipoVeiculo: '',
    cidade: '',
    estado: '',
    cep: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nomeEmpresa || !form.cnpj || !form.password) {
      setError('Nome, CNPJ e senha são obrigatórios');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    try {
      const { confirmPassword, ...data } = form;
      await onSubmit(data);
    } catch (err) {
      setError(err.message || 'Erro ao criar cadastro');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert 
          type="error" 
          title="Erro no cadastro"
          message={error}
          closeable
        />
      )}

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex gap-3 mb-4">
        <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-200">Cadastro para empresas transportadoras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="nomeEmpresa"
              value={form.nomeEmpresa}
              onChange={handleChange}
              placeholder="Transportes Silva LTDA"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">CNPJ</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="cnpj"
              value={form.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="contato@empresa.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">RNTRC</label>
          <input
            type="text"
            name="rntrc"
            value={form.rntrc}
            onChange={handleChange}
            placeholder="Registro Nacional"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Veículo</label>
          <select
            name="tipoVeiculo"
            value={form.tipoVeiculo}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Selecione</option>
            <option value="vans">Vans</option>
            <option value="caminhonetes">Caminhonetes</option>
            <option value="caminhoes">Caminhões</option>
            <option value="moto">Moto</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
          <input
            type="text"
            name="cep"
            value={form.cep}
            onChange={handleChange}
            placeholder="00000-000"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
          <input
            type="text"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="São Paulo"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Selecione</option>
            <option value="SP">SP</option>
            <option value="RJ">RJ</option>
            <option value="MG">MG</option>
            <option value="BA">BA</option>
            <option value="RS">RS</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? 'Criando cadastro...' : 'Criar Cadastro de Transportadora'}
      </button>
    </form>
  );
}
