import React, { useState, useEffect } from 'react';
import { User, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DocumentStatus from './DocumentStatus';
import { EditableField, EditButton } from './EditButton';
import api from '@/api/client';

/**
 * ProfileLayout - Componente estrutura para todas as páginas de perfil
 * Fornece:
 * - Cabeçalho com foto e info básica
 * - Abas para diferentes seções
 * - Gestão de documentos
 * - Edição de campos
 */
export default function ProfileLayout({
  children,
  userType = 'transportador',
  perfil = {},
  documentos = [],
  onUpdate = () => {},
  loading = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPerfil, setEditedPerfil] = useState(perfil);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    setEditedPerfil(perfil);
  }, [perfil]);

  const handleFieldChange = (field, value) => {
    setEditedPerfil(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.perfil.updatePerfil(editedPerfil);
      onUpdate(editedPerfil);
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Mostra status geral dos documentos
  const getStatusGeral = () => {
    if (!documentos || documentos.length === 0) return null;
    
    const pendentes = documentos.filter(d => d.status === 'pendente_analise').length;
    const aprovados = documentos.filter(d => d.status === 'aprovado').length;
    const rejeitados = documentos.filter(d => d.status === 'rejeitado').length;

    return { pendentes, aprovados, rejeitados, total: documentos.length };
  };

  const statusGeral = getStatusGeral();

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'ok': 'bg-green-900 text-green-200',
      'pendente_verificacao': 'bg-yellow-900 text-yellow-200',
      'rejeitado': 'bg-red-900 text-red-200'
    };
    return statusMap[status] || 'bg-slate-700 text-slate-200';
  };

  return (
    <DashboardLayout userType={userType}>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
            <p className="text-slate-400">
              Gerencie suas informações pessoais e documentos
            </p>
          </div>
          {!isEditing && (
            <EditButton
              isEditing={false}
              onEdit={() => setIsEditing(true)}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Status do Cadastro */}
        <div className={`rounded-lg border p-4 ${getStatusBadgeClass(perfil.statusCadastro)}`}>
          <div className="flex items-center gap-3">
            {perfil.statusCadastro === 'ok' && <CheckCircle className="w-5 h-5" />}
            {perfil.statusCadastro === 'pendente_verificacao' && <Clock className="w-5 h-5" />}
            {perfil.statusCadastro === 'rejeitado' && <AlertCircle className="w-5 h-5" />}
            
            <span className="font-medium">
              {perfil.statusCadastro === 'ok' && '✅ Cadastro Aprovado'}
              {perfil.statusCadastro === 'pendente_verificacao' && '⏳ Cadastro em Análise'}
              {perfil.statusCadastro === 'rejeitado' && '❌ Cadastro Rejeitado'}
            </span>
          </div>
        </div>

        {/* Resumo de Documentos */}
        {statusGeral && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <p className="text-slate-400 text-sm">Total de Documentos</p>
              <p className="text-2xl font-bold text-white">{statusGeral.total}</p>
            </div>
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <p className="text-slate-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{statusGeral.pendentes}</p>
            </div>
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <p className="text-slate-400 text-sm">Aprovados</p>
              <p className="text-2xl font-bold text-green-400">{statusGeral.aprovados}</p>
            </div>
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <p className="text-slate-400 text-sm">Rejeitados</p>
              <p className="text-2xl font-bold text-red-400">{statusGeral.rejeitados}</p>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="border-b border-slate-700 flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 font-medium transition ${
                activeTab === 'info'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              📋 Informações
            </button>
            <button
              onClick={() => setActiveTab('documentos')}
              className={`px-4 py-3 font-medium transition ${
                activeTab === 'documentos'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              📄 Documentos ({documentos?.length || 0})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {children}
                
                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-slate-700">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPerfil(perfil);
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-4">
                {documentos && documentos.length > 0 ? (
                  documentos.map(doc => (
                    <DocumentStatus key={doc.id} documento={doc} />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum documento enviado</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
