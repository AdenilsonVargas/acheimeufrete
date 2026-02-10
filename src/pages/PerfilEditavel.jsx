import React, { useState, useEffect } from 'react';
import { Upload, Save, Edit2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/api/client';

export default function PerfilEditavel() {
  const { user } = useAuth();
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState(user);
  const [formData, setFormData] = useState(user);
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    setPerfil(user);
    setFormData(user);
  }, [user]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      // Preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          fotoPerfil: event.target?.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const salvar = async () => {
    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'fotoPerfil' && key !== 'password') {
          formDataToSend.append(key, formData[key] || '');
        }
      });

      if (foto) {
        formDataToSend.append('foto', foto);
      }

      const response = await apiClient.client.put('/auth/me', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPerfil(response.data);
      setEditando(false);
      alert('✅ Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const cancelar = () => {
    setFormData(perfil);
    setFoto(null);
    setEditando(false);
  };

  if (!user) {
    return <DashboardLayout userType={user?.userType || 'embarcador'}><p>Carregando...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout userType={user?.userType || 'embarcador'}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-blue-600 rounded-xl p-6 text-white flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Perfil 👤</h1>
            <p className="text-orange-100">Gerencie seus dados de cadastro</p>
          </div>
          <button
            onClick={() => setEditando(!editando)}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
              editando
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-white hover:bg-gray-100 text-orange-600'
            }`}
          >
            {editando ? <X size={20} /> : <Edit2 size={20} />}
            {editando ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Foto de Perfil */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center">
              <div className="mb-4">
                {formData.fotoPerfil ? (
                  <img
                    src={formData.fotoPerfil}
                    alt="Perfil"
                    className="w-48 h-48 rounded-lg object-cover mx-auto border-4 border-orange-500"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 dark:bg-slate-700 rounded-lg mx-auto flex items-center justify-center">
                    <span className="text-gray-400 text-3xl">📷</span>
                  </div>
                )}
              </div>

              {editando && (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                  <span className="inline-block cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 mx-auto transition">
                    <Upload size={18} />
                    Alterar Foto
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-400"
                  />
                </div>

                {/* Nome Completo */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nomeCompleto || ''}
                    onChange={(e) => handleChange('nomeCompleto', e.target.value)}
                    disabled={!editando}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      editando
                        ? 'border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-700'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Telefone e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone || ''}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    disabled={!editando}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      editando
                        ? 'border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-700'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Tipo de Usuário
                  </label>
                  <input
                    type="text"
                    value={user?.userType === 'transportador' ? '🚚 Transportador' : user?.userType === 'embarcador' ? '📦 Embarcador' : user?.userType}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* CPF/CNPJ */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  {user?.userType === 'embarcador' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  value={formData.cpfOuCnpj || ''}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-slate-700 dark:border-slate-600 text-gray-600 dark:text-gray-400"
                />
              </div>

              {/* Razão Social */}
              {user?.userType === 'embarcador' && (
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    value={formData.razaoSocial || ''}
                    onChange={(e) => handleChange('razaoSocial', e.target.value)}
                    disabled={!editando}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      editando
                        ? 'border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-700'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>
              )}

              {/* Status */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Status Cadastro:</span>{' '}
                  <span className={`px-3 py-1 rounded-full text-white font-semibold text-sm ${
                    user?.statusCadastro === 'aprovado' ? 'bg-green-500' :
                    user?.statusCadastro === 'rejeitado' ? 'bg-red-500' :
                    user?.statusCadastro === 'pendente' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}>
                    {user?.statusCadastro}
                  </span>
                </p>
              </div>

              {/* Botões de Ação */}
              {editando && (
                <div className="flex gap-3">
                  <button
                    onClick={salvar}
                    disabled={loading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Save size={20} />
                    Salvar Alterações
                  </button>
                  <button
                    onClick={cancelar}
                    disabled={loading}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition"
                  >
                    Descartar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
