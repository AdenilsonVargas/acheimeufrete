import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, CheckCircle } from 'lucide-react';
import TransportadorPJForm from '@/components/auth/registration/transportador/TransportadorPJForm';

/**
 * Página de cadastro para Transportador PJ
 */
export default function TransportadorPJRegistration() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      // Preparar FormData para upload de arquivos
      const submitFormData = new FormData();

      // Adicionar dados básicos
      Object.keys(formData).forEach(key => {
        if (key !== 'documentos' && key !== 'endereco' && key !== 'veiculo') {
          submitFormData.append(key, formData[key]);
        }
      });

      // Adicionar endereço como JSON
      submitFormData.append('endereco', JSON.stringify(formData.endereco));

      // Adicionar veículo como JSON (se existe)
      if (formData.veiculo && formData.veiculo.placa) {
        submitFormData.append('veiculo', JSON.stringify(formData.veiculo));
      }

      // Adicionar documentos
      formData.documentos.forEach((doc, index) => {
        if (doc.file) {
          submitFormData.append(`documento_${doc.tipo}`, doc.file);
          submitFormData.append(`documento_${doc.tipo}_tipo`, doc.tipo);
        }
      });

      // Enviar para API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao registrar');
      }

      // Sucesso
      setSubmitSuccess(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (error) {
      setSubmitError(error.message || 'Erro ao registrar. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Cadastro de Transportadora
          </h1>
          <p className="text-gray-400">
            Preencha todos os dados para criar sua conta
          </p>
        </div>

        {/* Sucesso */}
        {submitSuccess && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6 mb-8 flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-1">Cadastro realizado com sucesso!</h3>
              <p className="text-green-200 text-sm">
                Seus dados foram recebidos e estão aguardando aprovação. Você receberá um email quando o processo estiver completo.
              </p>
              <p className="text-green-300 text-xs mt-3">Redirecionando para login...</p>
            </div>
          </div>
        )}

        {/* Erro geral */}
        {submitError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-white mb-1">Erro no cadastro</h3>
              <p className="text-red-200 text-sm">{submitError}</p>
              <button
                onClick={() => setSubmitError('')}
                className="text-red-300 hover:text-red-200 text-xs mt-3 underline"
              >
                Descartar mensagem
              </button>
            </div>
          </div>
        )}

        {/* Formulário */}
        {!submitSuccess && (
          <div className="bg-gray-800/30 backdrop-blur border border-gray-700 rounded-xl p-8">
            <TransportadorPJForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Informações adicionais */}
        <div className="mt-12 bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <h3 className="font-semibold text-blue-300 mb-3">ℹ️ Informações importantes</h3>
          <ul className="text-sm text-blue-200 space-y-2">
            <li>✓ Todos os dados são verificados antes da aprovação</li>
            <li>✓ Os documentos devem estar legíveis e em dia</li>
            <li>✓ Você pode atualizar seus dados no painel depois</li>
            <li>✓ Se tiver dúvidas, entre em contato conosco</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
