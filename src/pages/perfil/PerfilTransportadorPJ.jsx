import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import ProfileLayout from '@/components/perfil/ProfileLayout';
import { EditableField } from '@/components/perfil/EditButton';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';

/**
 * Perfil do Transportador PJ
 * Mostra informações da empresa, responsável e documentos
 */
export default function PerfilTransportadorPJ() {
  const { user } = useAuthStore();
  const [perfil, setPerfil] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    setLoading(true);
    try {
      const response = await api.perfil.getMeuPerfil();
      if (response.data) {
        setPerfil(response.data);
        setDocumentos(response.data.documentos || []);
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregando suas informações');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarTelefone = async (field, value) => {
    try {
      await api.perfil.updatePerfil({ [field]: value });
      setPerfil(prev => ({ ...prev, [field]: value }));
    } catch (err) {
      console.error('Erro ao salvar:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex gap-3 max-w-md">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-200">Erro</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return <div className="text-white">Perfil não encontrado</div>;
  }

  return (
    <ProfileLayout 
      userType={user?.userType || 'embarcador'}
      perfil={perfil}
      documentos={documentos}
      onUpdate={setPerfil}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações da Empresa */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">
            📋 Dados da Empresa
          </h3>
          <EditableField
            label="Razão Social"
            value={perfil.razaoSocial}
            name="razaoSocial"
            editable={false}
          />
          <EditableField
            label="CNPJ"
            value={perfil.cpfOuCnpj}
            name="cpfOuCnpj"
            editable={false}
          />
          <EditableField
            label="Inscrição Estadual"
            value={perfil.inscricaoEstadual}
            name="inscricaoEstadual"
            editable={false}
          />
        </div>

        {/* Informações do Responsável */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">
            👤 Responsável Legal
          </h3>
          <EditableField
            label="Nome Completo"
            value={perfil.nomeResponsavel}
            name="nomeResponsavel"
            editable={false}
          />
          <EditableField
            label="CPF"
            value={perfil.cpfResponsavel}
            name="cpfResponsavel"
            editable={false}
          />
          <EditableField
            label="RG"
            value={perfil.rgResponsavel}
            name="rgResponsavel"
            editable={false}
          />
        </div>

        {/* Informações de Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">
            📞 Contato
          </h3>
          <EditableField
            label="Email"
            value={perfil.email}
            name="email"
            editable={false}
          />
          <EditableField
            label="Telefone"
            value={perfil.telefone}
            name="telefone"
            type="tel"
            onSave={handleSalvarTelefone}
            editable={true}
          />
        </div>

        {/* Informações de Operação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-3">
            🚚 Operação
          </h3>
          <EditableField
            label="Quantidade de Veículos"
            value={
              perfil.quantidadeVeiculos === 0
                ? 'Múltiplos'
                : perfil.quantidadeVeiculos === 1
                  ? 'Um veículo'
                  : perfil.quantidadeVeiculos
            }
            name="quantidadeVeiculos"
            editable={false}
          />
          <div className="pt-3 border-t border-slate-700 text-slate-400 text-sm">
            <p>Status: <span className="text-green-400 font-semibold">Verificado</span></p>
            <p>Data de Registro: {new Date(perfil.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Endereços Cadastrados */}
      {perfil.enderecos && perfil.enderecos.length > 0 && (
        <div className="mt-8 border-t border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">📍 Endereços Cadastrados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {perfil.enderecos.map(endereco => (
              <div key={endereco.id} className="bg-slate-700 rounded-lg p-4">
                <p className="text-white font-semibold">{endereco.logradouro}, {endereco.numero}</p>
                <p className="text-slate-300 text-sm">{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                <p className="text-slate-400 text-sm">CEP: {endereco.cep}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
