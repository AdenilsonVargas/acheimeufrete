import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { User, Mail, Phone, MapPin, LogOut } from 'lucide-react';

export default function Perfil() {
  const { user, logout } = useAuthStore();
  const [perfil, setPerfil] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.auth.updateMe(perfil);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar perfil', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Meu Perfil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar e Info Básica */}
          <div className="card">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-600 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">{perfil.nome || perfil.nomeCompleto}</h2>
              <p className="text-slate-400 text-sm">{perfil.role === 'transportador' ? 'Transportador' : 'Embarcador'}</p>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="md:col-span-2 card">
            <h3 className="text-lg font-bold text-white mb-4">Dados Pessoais</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <input name="email" value={perfil.email || ''} onChange={handleChange} className="input-field w-full" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Telefone
                </label>
                <input name="telefone" value={perfil.telefone || ''} onChange={handleChange} className="input-field w-full" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Endereço
                </label>
                <input name="endereco" value={perfil.endereco || ''} onChange={handleChange} className="input-field w-full" />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSave} className="btn-primary" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              {saved && <p className="text-green-400 text-sm">✓ Perfil atualizado com sucesso!</p>}
            </div>
          </div>
        </div>

        {/* Seção de Segurança */}
        <div className="card mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Segurança</h3>
          <div className="space-y-4">
            <button className="btn-secondary">Alterar Senha</button>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
