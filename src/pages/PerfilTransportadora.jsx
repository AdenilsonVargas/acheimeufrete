import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { User, Phone, Mail, MapPin, Lock, Save } from 'lucide-react';

export default function PerfilTransportadora() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeEmpresa: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        nomeEmpresa: user.nomeEmpresa || '',
        cnpj: user.cnpj || '',
        email: user.email || '',
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        cidade: user.cidade || '',
        estado: user.estado || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.auth.updatePerfil({ ...form });
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar', err);
      alert('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    logout();
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-8 h-8 text-orange-600" /> Perfil da Transportadora
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-orange-800 rounded-full mx-auto flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{user?.nomeEmpresa || 'Transportadora'}</h2>
              <p className="text-slate-400 text-sm">{user?.cnpj || 'CNPJ'}</p>
            </div>
          </div>

          <div className="md:col-span-2 card">
            <h2 className="text-lg font-bold text-white mb-6">Dados da Empresa</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Nome da Empresa</label>
                  <input 
                    value={form.nomeEmpresa}
                    onChange={(e) => setForm({...form, nomeEmpresa: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">CNPJ</label>
                  <input 
                    value={form.cnpj}
                    onChange={(e) => setForm({...form, cnpj: e.target.value})}
                    className="input-field w-full"
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </label>
                  <input 
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Telefone
                  </label>
                  <input 
                    value={form.telefone}
                    onChange={(e) => setForm({...form, telefone: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Endereço
                </label>
                <input 
                  value={form.endereco}
                  onChange={(e) => setForm({...form, endereco: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Cidade</label>
                  <input 
                    value={form.cidade}
                    onChange={(e) => setForm({...form, cidade: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Estado</label>
                  <input 
                    value={form.estado}
                    onChange={(e) => setForm({...form, estado: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Segurança
            </h3>
            <button className="btn-secondary w-full mb-3">Alterar Senha</button>
            <button className="btn-secondary w-full">Ativar Autenticação 2FA</button>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-white mb-4">Ações</h3>
            <button 
              onClick={handleLogout}
              className="btn-danger w-full"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
