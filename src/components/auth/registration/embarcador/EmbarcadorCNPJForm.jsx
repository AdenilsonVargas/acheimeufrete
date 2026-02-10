'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, ChevronDown } from 'lucide-react';
import FormStepper from '../shared/FormStepper';
import PhoneInput from '../inputs/PhoneInput';
import EmailInput from '../inputs/EmailInput';
import PasswordInput from '../inputs/PasswordInput';
import CNPJInput from '../inputs/CNPJInput';
import AddressForm from '../shared/AddressForm';
import DocumentUpload from '../shared/DocumentUpload';
import {
  validatePhoneInput,
  validateEmailMatch,
  validatePasswordMatch,
  validatePassword,
} from '@/utils/validators';

const REQUIRED_DOCUMENTS = ['CARTAO_CNPJ', 'RG_REPRESENTANTE', 'COMPROVANTE_ENDERECO'];

const steps = [
  {
    id: 0,
    title: 'Dados da Empresa',
    description: 'Razão Social, CNPJ e Inscrição Estadual',
  },
  {
    id: 1,
    title: 'Endereço Comercial',
    description: 'Onde sua empresa está localizada',
  },
  {
    id: 2,
    title: 'Contato do Representante',
    description: 'Nome, email e telefone de quem representa a empresa',
  },
  {
    id: 3,
    title: 'Segurança',
    description: 'Crie uma senha para a conta',
  },
  {
    id: 4,
    title: 'Dados de Faturamento',
    description: 'Informações para emissão de notas',
  },
  {
    id: 5,
    title: 'Documentos',
    description: 'Upload de documentação da empresa',
  },
];

export default function EmbarcadorCNPJForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});

  const [form, setForm] = useState({
    // Dados Empresa
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',

    // Endereço Comercial
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },

    // Contato Representante
    nomeRepresentante: '',
    sobrenomeRepresentante: '',
    email: '',
    emailConfirmacao: '',
    telefone: '',

    // Segurança
    senha: '',
    senhaConfirmacao: '',

    // Dados de Faturamento
    nomeContato: '',
    emailFaturamento: '',
    telefoneFaturamento: '',

    // Documentos
    documentos: [],
  });

  const [errors, setErrors] = useState({});

  // Validação por passo
  const validateStep = (stepId) => {
    const stepErrors = {};

    switch (stepId) {
      case 0: // Dados Empresa
        if (!form.razaoSocial.trim()) stepErrors.razaoSocial = 'Razão social obrigatória';
        if (!form.nomeFantasia.trim()) stepErrors.nomeFantasia = 'Nome fantasia obrigatório';
        if (!form.cnpj.trim()) stepErrors.cnpj = 'CNPJ obrigatório';
        if (!form.inscricaoEstadual.trim()) stepErrors.inscricaoEstadual = 'Inscrição estadual obrigatória';
        break;

      case 1: // Endereço Comercial
        if (!form.endereco.cep.trim()) stepErrors.endereco_cep = 'CEP obrigatório';
        if (!form.endereco.logradouro.trim()) stepErrors.endereco_logradouro = 'Logradouro obrigatório';
        if (!form.endereco.numero.trim()) stepErrors.endereco_numero = 'Número obrigatório';
        if (!form.endereco.bairro.trim()) stepErrors.endereco_bairro = 'Bairro obrigatório';
        if (!form.endereco.cidade.trim()) stepErrors.endereco_cidade = 'Cidade obrigatória';
        if (!form.endereco.estado.trim()) stepErrors.endereco_estado = 'Estado obrigatório';
        break;

      case 2: // Contato Representante
        if (!form.nomeRepresentante.trim()) stepErrors.nomeRepresentante = 'Nome obrigatório';
        if (!form.sobrenomeRepresentante.trim()) stepErrors.sobrenomeRepresentante = 'Sobrenome obrigatório';
        if (!form.email.trim()) stepErrors.email = 'Email obrigatório';
        if (!form.emailConfirmacao.trim()) stepErrors.emailConfirmacao = 'Confirmação de email obrigatória';
        if (!validateEmailMatch(form.email, form.emailConfirmacao)) {
          stepErrors.emailConfirmacao = 'Os emails não conferem';
        }
        if (!form.telefone.trim()) stepErrors.telefone = 'Telefone obrigatório';
        if (!validatePhoneInput(form.telefone).isValid) {
          stepErrors.telefone = 'Telefone inválido';
        }
        break;

      case 3: // Segurança
        if (!form.senha.trim()) stepErrors.senha = 'Senha obrigatória';
        if (!validatePassword(form.senha).isValid) {
          stepErrors.senha = 'Senha fraca (min 8 caracteres, 1 maiúscula, 1 número, 1 especial)';
        }
        if (!validatePasswordMatch(form.senha, form.senhaConfirmacao)) {
          stepErrors.senhaConfirmacao = 'As senhas não conferem';
        }
        break;

      case 4: // Dados de Faturamento
        if (!form.nomeContato.trim()) stepErrors.nomeContato = 'Nome de contato obrigatório';
        if (!form.emailFaturamento.trim()) stepErrors.emailFaturamento = 'Email de faturamento obrigatório';
        if (!form.telefoneFaturamento.trim()) stepErrors.telefoneFaturamento = 'Telefone de faturamento obrigatório';
        break;

      case 5: // Documentos
        if (REQUIRED_DOCUMENTS.length > 0 && REQUIRED_DOCUMENTS.length !== Object.keys(uploadedFiles).length) {
          stepErrors.documentos = 'Todos os documentos obrigatórios devem ser enviados';
        }
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const nextStep = currentStep + 1;
    if (nextStep < steps.length) {
      setCurrentStep(nextStep);
      setError('');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      // Preparar FormData
      const formData = new FormData();

      // Adicionar dados do formulário
      formData.append('userType', 'embarcador_cnpj');
      formData.append('razaoSocial', form.razaoSocial);
      formData.append('nomeFantasia', form.nomeFantasia);
      formData.append('cnpj', form.cnpj);
      formData.append('inscricaoEstadual', form.inscricaoEstadual);
      formData.append('endereco', JSON.stringify(form.endereco));
      formData.append('nomeRepresentante', form.nomeRepresentante);
      formData.append('sobrenomeRepresentante', form.sobrenomeRepresentante);
      formData.append('email', form.email);
      formData.append('telefone', form.telefone);
      formData.append('senha', form.senha);
      formData.append('nomeContato', form.nomeContato);
      formData.append('emailFaturamento', form.emailFaturamento);
      formData.append('telefoneFaturamento', form.telefoneFaturamento);

      // Adicionar arquivos
      Object.entries(uploadedFiles).forEach(([docType, file]) => {
        formData.append(`documents_${docType}`, file);
      });

      // Enviar para API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao registrar');
      }

      // Sucesso!
      setForm({
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: '',
        inscricaoEstadual: '',
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
        },
        nomeRepresentante: '',
        sobrenomeRepresentante: '',
        email: '',
        emailConfirmacao: '',
        telefone: '',
        senha: '',
        senhaConfirmacao: '',
        nomeContato: '',
        emailFaturamento: '',
        telefoneFaturamento: '',
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/login?registered=true&type=embarcador_cnpj';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar conteúdo do passo
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Dados Empresa
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.razaoSocial}
                onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.razaoSocial ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Empresa LTDA"
              />
              {errors.razaoSocial && <p className="text-red-500 text-sm mt-1">{errors.razaoSocial}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nome Fantasia <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nomeFantasia}
                onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.nomeFantasia ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Empresa"
              />
              {errors.nomeFantasia && <p className="text-red-500 text-sm mt-1">{errors.nomeFantasia}</p>}
            </div>

            <CNPJInput
              value={form.cnpj}
              onChange={(data) => setForm({ ...form, cnpj: data.formatted })}
              error={errors.cnpj}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Inscrição Estadual <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.inscricaoEstadual}
                onChange={(e) => setForm({ ...form, inscricaoEstadual: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.inscricaoEstadual ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="123.456.789.012"
              />
              {errors.inscricaoEstadual && (
                <p className="text-red-500 text-sm mt-1">{errors.inscricaoEstadual}</p>
              )}
            </div>
          </div>
        );

      case 1: // Endereço Comercial
        return (
          <AddressForm
            value={form.endereco}
            onChange={(endereco) => setForm({ ...form, endereco })}
            errors={errors}
            title="Endereço Comercial"
            description="Onde sua empresa está localizada"
          />
        );

      case 2: // Contato Representante
        return (
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">ℹ️ Dados de quem representa a empresa</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nomeRepresentante}
                onChange={(e) => setForm({ ...form, nomeRepresentante: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.nomeRepresentante ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="João"
              />
              {errors.nomeRepresentante && (
                <p className="text-red-500 text-sm mt-1">{errors.nomeRepresentante}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Sobrenome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.sobrenomeRepresentante}
                onChange={(e) => setForm({ ...form, sobrenomeRepresentante: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.sobrenomeRepresentante ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Silva"
              />
              {errors.sobrenomeRepresentante && (
                <p className="text-red-500 text-sm mt-1">{errors.sobrenomeRepresentante}</p>
              )}
            </div>

            <EmailInput
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              required
            />

            <EmailInput
              isConfirmation
              value={form.emailConfirmacao}
              onChange={(e) => setForm({ ...form, emailConfirmacao: e.target.value })}
              error={errors.emailConfirmacao}
              required
            />

            <PhoneInput
              value={form.telefone}
              onChange={(data) => setForm({ ...form, telefone: data.formatted })}
              error={errors.telefone}
              required
            />
          </div>
        );

      case 3: // Segurança
        return (
          <div className="space-y-6">
            <PasswordInput
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              error={errors.senha}
              required
            />

            <PasswordInput
              isConfirmation
              value={form.senhaConfirmacao}
              onChange={(e) => setForm({ ...form, senhaConfirmacao: e.target.value })}
              error={errors.senhaConfirmacao}
              required
            />
          </div>
        );

      case 4: // Dados de Faturamento
        return (
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">ℹ️ Informações para emissão de notas fiscais</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nome de Contato para Faturamento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nomeContato}
                onChange={(e) => setForm({ ...form, nomeContato: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.nomeContato ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Maria Silva"
              />
              {errors.nomeContato && <p className="text-red-500 text-sm mt-1">{errors.nomeContato}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email para Notas Fiscais <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.emailFaturamento}
                onChange={(e) => setForm({ ...form, emailFaturamento: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.emailFaturamento ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="faturamento@empresa.com"
              />
              {errors.emailFaturamento && (
                <p className="text-red-500 text-sm mt-1">{errors.emailFaturamento}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Telefone para Contato <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.telefoneFaturamento}
                onChange={(e) => setForm({ ...form, telefoneFaturamento: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.telefoneFaturamento ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="(11) 3000-0000"
              />
              {errors.telefoneFaturamento && (
                <p className="text-red-500 text-sm mt-1">{errors.telefoneFaturamento}</p>
              )}
            </div>
          </div>
        );

      case 5: // Documentos
        return (
          <DocumentUpload
            requiredDocuments={REQUIRED_DOCUMENTS}
            uploadedFiles={uploadedFiles}
            onFilesChange={setUploadedFiles}
            error={errors.documentos}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Cadastro de Embarcador (CNPJ)</h1>
          <p className="text-gray-400">Preencha os dados da sua empresa para se registrar</p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <FormStepper
            currentStep={currentStep}
            steps={steps}
            title={steps[currentStep]?.title}
            description={steps[currentStep]?.description}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border border-gray-700">
          {renderStepContent()}
        </div>

        {/* Loading Message */}
        {loading && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-lg flex items-center gap-3">
            <Loader className="w-5 h-5 text-green-500 animate-spin" />
            <p className="text-green-200">Registrando... Por favor aguarde.</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 || loading}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentStep === 0 || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
            }`}
          >
            ← Anterior
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                loading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar Cadastro
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                loading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Próximo
              <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
