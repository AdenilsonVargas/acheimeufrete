'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, ChevronDown } from 'lucide-react';
import FormStepper from '../shared/FormStepper';
import PhoneInput from '../inputs/PhoneInput';
import EmailInput from '../inputs/EmailInput';
import PasswordInput from '../inputs/PasswordInput';
import CPFInput from '../inputs/CPFInput';
import DateInput from '../inputs/DateInput';
import AddressForm from '../shared/AddressForm';
import DocumentUpload from '../shared/DocumentUpload';
import {
  validatePhoneInput,
  validateEmailMatch,
  validatePasswordMatch,
  validatePassword,
} from '@/utils/validators';

const CIRTH_TYPES = ['Moto', 'Triciclo', 'Caminhão', 'Van', 'Utilitário'];
const REQUIRED_DOCUMENTS = ['CNH', 'RG', 'CPF', 'COMPROVANTE_ENDERECO'];

export default function TransportadorAutonomoForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCiotStep, setShowCiotStep] = useState(null); // null = not answered yet, true = sim, false = não
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  
  const [form, setForm] = useState({
    // Dados Pessoais
    nome: '',
    sobrenome: '',
    cpf: '',
    rg: '',
    cnhNumero: '',
    cnhVencimento: '',

    // Endereço Residencial
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },

    // Contato
    email: '',
    emailConfirmacao: '',
    telefone: '',

    // Segurança
    senha: '',
    senhaConfirmacao: '',

    // CIOT (condicional)
    ciotNumero: '',
    ciotVencimento: '',

    // Veículo
    veiculo: {
      tipo: '',
      placa: '',
      renavam: '',
      crlvVencimento: '',
    },

    // Documentos
    documentos: [],
  });

  const [errors, setErrors] = useState({});

  // Steps baseados na decisão de CIOT
  const getSteps = () => {
    const baseSteps = [
      {
        id: 0,
        title: 'Dados Pessoais',
        description: 'Nome, CPF, RG e CNH',
      },
      {
        id: 1,
        title: 'Endereço Residencial',
        description: 'Onde você mora',
      },
      {
        id: 2,
        title: 'Contato',
        description: 'Email e telefone',
      },
      {
        id: 3,
        title: 'Segurança',
        description: 'Crie sua senha',
      },
      {
        id: 4,
        title: 'CIOT',
        description: 'Você emite CIOT?',
      },
    ];

    // Se respondeu Sim ao CIOT, adiciona passo de dados CIOT
    if (showCiotStep === true) {
      baseSteps.push({
        id: 5,
        title: 'Dados CIOT',
        description: 'Informações da emissão',
      });
    }

    // Adiciona passos de veículo e documentos
    const finalSteps = [
      ...baseSteps,
      {
        id: showCiotStep === true ? 6 : 5,
        title: 'Veículo',
        description: 'Placa, tipo e RENAVAM',
      },
      {
        id: showCiotStep === true ? 7 : 6,
        title: 'Documentos',
        description: 'Upload de arquivos',
      },
    ];

    return finalSteps;
  };

  const steps = getSteps();

  // Validação por passo
  const validateStep = (stepId) => {
    const stepErrors = {};

    switch (stepId) {
      case 0: // Dados Pessoais
        if (!form.nome.trim()) stepErrors.nome = 'Nome obrigatório';
        if (!form.sobrenome.trim()) stepErrors.sobrenome = 'Sobrenome obrigatório';
        if (!form.cpf.trim()) stepErrors.cpf = 'CPF obrigatório';
        if (!form.rg.trim()) stepErrors.rg = 'RG obrigatório';
        if (!form.cnhNumero.trim()) stepErrors.cnhNumero = 'Número da CNH obrigatório';
        if (!form.cnhVencimento) stepErrors.cnhVencimento = 'Data de vencimento obrigatória';
        break;

      case 1: // Endereço
        if (!form.endereco.cep.trim()) stepErrors.endereco_cep = 'CEP obrigatório';
        if (!form.endereco.logradouro.trim()) stepErrors.endereco_logradouro = 'Logradouro obrigatório';
        if (!form.endereco.numero.trim()) stepErrors.endereco_numero = 'Número obrigatório';
        if (!form.endereco.bairro.trim()) stepErrors.endereco_bairro = 'Bairro obrigatório';
        if (!form.endereco.cidade.trim()) stepErrors.endereco_cidade = 'Cidade obrigatória';
        if (!form.endereco.estado.trim()) stepErrors.endereco_estado = 'Estado obrigatório';
        break;

      case 2: // Contato
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

      case 4: // Decisão CIOT
        if (showCiotStep === null) {
          stepErrors.ciot = 'Escolha uma opção';
        }
        break;

      case 5: // Dados CIOT (se showCiotStep === true)
        if (showCiotStep === true) {
          if (!form.ciotNumero.trim()) stepErrors.ciotNumero = 'Número CIOT obrigatório';
          if (!form.ciotVencimento) stepErrors.ciotVencimento = 'Data de vencimento obrigatória';
        }
        break;

      case 6: // Veículo (step muda baseado em CIOT)
      case 5: // Se não tem CIOT, esse é o step 5
        if (!form.veiculo.tipo) stepErrors.veiculo_tipo = 'Tipo de veículo obrigatório';
        if (!form.veiculo.placa.trim()) stepErrors.veiculo_placa = 'Placa obrigatória';
        if (!form.veiculo.renavam.trim()) stepErrors.veiculo_renavam = 'RENAVAM obrigatório';
        if (!form.veiculo.crlvVencimento) stepErrors.veiculo_crlvVencimento = 'Vencimento CRLV obrigatório';
        break;

      case 7: // Documentos (se tem CIOT)
      case 6: // Documentos (se não tem CIOT)
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

    // Se estamos no passo de decisão CIOT e não respondeu ainda
    if (currentStep === 4 && showCiotStep === null) {
      return;
    }

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

  const handleCiotDecision = (response) => {
    setShowCiotStep(response);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      // Preparar FormData
      const formData = new FormData();

      // Adicionar dados do formulário
      formData.append('userType', 'transportador_autonomo');
      formData.append('nome', form.nome);
      formData.append('sobrenome', form.sobrenome);
      formData.append('cpf', form.cpf);
      formData.append('rg', form.rg);
      formData.append('cnhNumero', form.cnhNumero);
      formData.append('cnhVencimento', form.cnhVencimento);
      formData.append('email', form.email);
      formData.append('telefone', form.telefone);
      formData.append('senha', form.senha);
      formData.append('endereco', JSON.stringify(form.endereco));

      if (showCiotStep === true) {
        formData.append('ciotNumero', form.ciotNumero);
        formData.append('ciotVencimento', form.ciotVencimento);
      }

      formData.append('veiculo', JSON.stringify(form.veiculo));

      // Adicionar arquivos
      Object.entries(uploadedFiles).forEach(([docType, file]) => {
        formData.append(`documents_${docType}`, file);
      });

      // Enviar para API (ainda não implementada no backend)
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
        nome: '',
        sobrenome: '',
        cpf: '',
        rg: '',
        cnhNumero: '',
        cnhVencimento: '',
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
        },
        email: '',
        emailConfirmacao: '',
        telefone: '',
        senha: '',
        senhaConfirmacao: '',
        ciotNumero: '',
        ciotVencimento: '',
        veiculo: {
          tipo: '',
          placa: '',
          renavam: '',
          crlvVencimento: '',
        },
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/login?registered=true&type=transportador_autonomo';
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
      case 0: // Dados Pessoais
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.nome ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="João"
              />
              {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Sobrenome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.sobrenome}
                onChange={(e) => setForm({ ...form, sobrenome: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.sobrenome ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Silva"
              />
              {errors.sobrenome && <p className="text-red-500 text-sm mt-1">{errors.sobrenome}</p>}
            </div>

            <CPFInput
              value={form.cpf}
              onChange={(data) => setForm({ ...form, cpf: data.formatted })}
              error={errors.cpf}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                RG <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.rg}
                onChange={(e) => setForm({ ...form, rg: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.rg ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="12.345.678-9"
              />
              {errors.rg && <p className="text-red-500 text-sm mt-1">{errors.rg}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Número da CNH <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.cnhNumero}
                onChange={(e) => setForm({ ...form, cnhNumero: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                  errors.cnhNumero ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="123456789012345"
              />
              {errors.cnhNumero && <p className="text-red-500 text-sm mt-1">{errors.cnhNumero}</p>}
            </div>

            <DateInput
              label="Data de Vencimento CNH"
              value={form.cnhVencimento}
              onChange={(e) => setForm({ ...form, cnhVencimento: e.target.value })}
              error={errors.cnhVencimento}
              required
              validateExpiration
            />
          </div>
        );

      case 1: // Endereço Residencial
        return (
          <AddressForm
            value={form.endereco}
            onChange={(endereco) => setForm({ ...form, endereco })}
            errors={errors}
            title="Endereço Residencial"
            description="Onde você reside"
          />
        );

      case 2: // Contato
        return (
          <div className="space-y-6">
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

      case 4: // Decisão CIOT
        return (
          <div className="space-y-6">
            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Você emite CIOT (Conhecimento de Transporte)?
              </h3>
              <p className="text-gray-400 mb-6 text-sm">
                CIOT é o documento que comprova o transporte realizado. Selecione sim se você emite
                esse documento ou não.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleCiotDecision(true)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    showCiotStep === true
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-700 bg-gray-800 hover:border-green-500'
                  }`}
                >
                  <div className="font-semibold text-gray-100">✓ Sim, eu emito CIOT</div>
                  <p className="text-sm text-gray-400 mt-1">
                    Você precisará fornecer dados da emissão
                  </p>
                </button>

                <button
                  onClick={() => handleCiotDecision(false)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    showCiotStep === false
                      ? 'border-orange-500 bg-orange-900/20'
                      : 'border-gray-700 bg-gray-800 hover:border-orange-500'
                  }`}
                >
                  <div className="font-semibold text-gray-100">✗ Não, não emito CIOT</div>
                  <p className="text-sm text-gray-400 mt-1">
                    Você não precisará fornecer esses dados
                  </p>
                </button>
              </div>
            </div>

            {errors.ciot && <p className="text-red-500 text-sm">{errors.ciot}</p>}
          </div>
        );

      case 5: // Dados CIOT (condicional)
        if (showCiotStep === true) {
          return (
            <div className="space-y-6">
              <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  ℹ️ Forneça as informações da sua emissão de CIOT
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Número CIOT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ciotNumero}
                  onChange={(e) => setForm({ ...form, ciotNumero: e.target.value })}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                    errors.ciotNumero ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="000000000000000"
                />
                {errors.ciotNumero && <p className="text-red-500 text-sm mt-1">{errors.ciotNumero}</p>}
              </div>

              <DateInput
                label="Data de Vencimento CIOT"
                value={form.ciotVencimento}
                onChange={(e) => setForm({ ...form, ciotVencimento: e.target.value })}
                error={errors.ciotVencimento}
                required
                validateExpiration
              />
            </div>
          );
        }
        return null;

      case 6: // Veículo (passo 5 se não tem CIOT)
      case 5:
        if ((showCiotStep === true && currentStep === 6) || (showCiotStep !== true && currentStep === 5)) {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Tipo de Veículo <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.veiculo.tipo}
                  onChange={(e) => setForm({ ...form, veiculo: { ...form.veiculo, tipo: e.target.value } })}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                    errors.veiculo_tipo ? 'border-red-500' : 'border-gray-700'
                  }`}
                >
                  <option value="">Selecione o tipo...</option>
                  {CIRTH_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.veiculo_tipo && <p className="text-red-500 text-sm mt-1">{errors.veiculo_tipo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Placa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.veiculo.placa}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      veiculo: { ...form.veiculo, placa: e.target.value.toUpperCase() },
                    })
                  }
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 uppercase ${
                    errors.veiculo_placa ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="ABC1234"
                />
                {errors.veiculo_placa && <p className="text-red-500 text-sm mt-1">{errors.veiculo_placa}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  RENAVAM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.veiculo.renavam}
                  onChange={(e) => setForm({ ...form, veiculo: { ...form.veiculo, renavam: e.target.value } })}
                  className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 ${
                    errors.veiculo_renavam ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="12345678901"
                />
                {errors.veiculo_renavam && <p className="text-red-500 text-sm mt-1">{errors.veiculo_renavam}</p>}
              </div>

              <DateInput
                label="Data de Vencimento CRLV"
                value={form.veiculo.crlvVencimento}
                onChange={(e) => setForm({ ...form, veiculo: { ...form.veiculo, crlvVencimento: e.target.value } })}
                error={errors.veiculo_crlvVencimento}
                required
                validateExpiration
              />
            </div>
          );
        }
        return null;

      case 7: // Documentos (passo 6 se não tem CIOT)
      case 6:
        if ((showCiotStep === true && currentStep === 7) || (showCiotStep !== true && currentStep === 6)) {
          return (
            <DocumentUpload
              requiredDocuments={REQUIRED_DOCUMENTS}
              uploadedFiles={uploadedFiles}
              onFilesChange={setUploadedFiles}
              error={errors.documentos}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Cadastro de Transportador Autônomo</h1>
          <p className="text-gray-400">Preencha seus dados para se registrar na plataforma</p>
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

        {/* Success Message */}
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
              disabled={loading || (currentStep === 4 && showCiotStep === null)}
              className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                loading || (currentStep === 4 && showCiotStep === null)
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
