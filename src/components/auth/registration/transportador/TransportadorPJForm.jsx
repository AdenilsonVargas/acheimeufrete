import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import FormStepper from '../shared/FormStepper';
import AddressForm from '../shared/AddressForm';
import DocumentUpload from '../shared/DocumentUpload';
import PhoneInput from '../inputs/PhoneInput';
import EmailInput, { EmailConfirmInput } from '../inputs/EmailInput';
import PasswordInput, { PasswordConfirmInput } from '../inputs/PasswordInput';
import CPFInput from '../inputs/CPFInput';
import CNPJInput from '../inputs/CNPJInput';
import DateInput from '../inputs/DateInput';

/**
 * Formulário de cadastro para Transportador PJ
 * Multietapas com fluxo condicional
 */
export default function TransportadorPJForm({ onSubmit, isLoading = false }) {
  const STEPS = [
    'Dados da Empresa',
    'Endereço Comercial',
    'Contato',
    'Segurança',
    'Quantidade de Veículos',
    'Dados do Veículo',
    'Documentos',
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [showVehicleStep, setShowVehicleStep] = useState(null); // null, true (1 veiculo), false (multiplos)
  
  const [form, setForm] = useState({
    // Empresa
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',

    // Representante
    nomeResponsavel: '',
    sobrenomeResponsavel: '',
    cpfResponsavel: '',
    rgResponsavel: '',
    dataVencimentoCNH: '',

    // Endereço
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
    telefone: '',
    email: '',
    emailConfirmacao: '',

    // Segurança
    senha: '',
    senhaConfirmacao: '',

    // Veículos
    quantidadeVeiculos: null,
    veiculo: {
      placa: '',
      tipo: '',
      renavam: '',
      dataVencimentoCRLV: '',
    },

    // Documentos
    documentos: [],
  });

  const [errors, setErrors] = useState({});
  const [validations, setValidations] = useState({});

  // Steps a mostrar (condicional)
  const getSteps = () => {
    const stepsToShow = [...STEPS];
    if (showVehicleStep === null || showVehicleStep === false) {
      // Remover "Dados do Veículo" se não show
      stepsToShow.splice(5, 1);
    }
    return stepsToShow;
  };

  const getDisplayStep = () => {
    if (showVehicleStep === null) return currentStep;
    if (showVehicleStep === false && currentStep > 5) return currentStep - 1;
    return currentStep;
  };

  // Validar passo atual
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Dados da Empresa
        if (!form.razaoSocial.trim()) newErrors.razaoSocial = 'Obrigatório';
        if (!form.nomeFantasia.trim()) newErrors.nomeFantasia = 'Obrigatório';
        if (!form.cnpj || validations.cnpj?.isValid === false) newErrors.cnpj = 'CNPJ inválido';
        break;

      case 1: // Endereço
        if (!form.endereco.cep) newErrors.enderecoCep = 'CEP obrigatório';
        if (!form.endereco.logradouro) newErrors.enderecoLogr = 'Obrigatório';
        if (!form.endereco.numero) newErrors.enderecoNum = 'Obrigatório';
        if (!form.endereco.bairro) newErrors.enderecoBairro = 'Obrigatório';
        if (!form.endereco.cidade) newErrors.enderecoCidade = 'Obrigatório';
        if (!form.endereco.estado) newErrors.enderecoEstado = 'Obrigatório';
        break;

      case 2: // Contato
        if (!form.nomeResponsavel.trim()) newErrors.nomeResponsavel = 'Obrigatório';
        if (!form.sobrenomeResponsavel.trim()) newErrors.sobrenomeResponsavel = 'Obrigatório';
        if (!form.cpfResponsavel || validations.cpfResponsavel?.isValid === false) 
          newErrors.cpfResponsavel = 'CPF inválido';
        if (!form.rgResponsavel.trim()) newErrors.rgResponsavel = 'Obrigatório';
        if (!form.telefone) newErrors.telefone = 'Obrigatório';
        if (!form.email) newErrors.email = 'Obrigatório';
        if (!form.emailConfirmacao) newErrors.emailConfirmacao = 'Obrigatório';
        if (form.email !== form.emailConfirmacao) newErrors.emailMatch = 'Emails não combinam';
        break;

      case 3: // Segurança
        if (!form.senha) newErrors.senha = 'Obrigatório';
        if (!form.senhaConfirmacao) newErrors.senhaConfirmacao = 'Obrigatório';
        if (form.senha !== form.senhaConfirmacao) newErrors.senhaMatch = 'Senhas não combinam';
        break;

      case 4: // Quantidade de Veículos
        if (showVehicleStep === null) newErrors.quantidadeVeiculos = 'Selecione uma opção';
        break;

      case 5: // Dados do Veículo (se 1 veículo)
        if (showVehicleStep === true) {
          if (!form.veiculo.placa.trim()) newErrors.veiculoPlaca = 'Obrigatório';
          if (!form.veiculo.tipo) newErrors.veiculoTipo = 'Selecione um tipo';
          if (!form.veiculo.renavam.trim()) newErrors.veiculoRenavam = 'Obrigatório';
          if (!form.veiculo.dataVencimentoCRLV) newErrors.veiculoCRLV = 'Obrigatório';
        }
        break;

      case 6: // Documentos
        const requiredDocs = ['CARTAO_CNPJ', 'RG_RESPONSAVEL', 'CPF_RESPONSAVEL', 'CNH_RESPONSAVEL', 'CRLV', 'COMPROVANTE_ENDERECO'];
        const addedDocs = form.documentos.map(d => d.tipo);
        const missingDocs = requiredDocs.filter(d => !addedDocs.includes(d));
        if (missingDocs.length > 0) {
          newErrors.documentos = `Faltam ${missingDocs.length} documento(s)`;
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Avançar passo
  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const stepsLength = getSteps().length;

    if (currentStep === 4 && showVehicleStep === false) {
      // Pulando o passo de veículo
      setCurrentStep(currentStep + 2);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Voltar passo
  const handlePrev = () => {
    if (currentStep === 6 && showVehicleStep === false) {
      setCurrentStep(currentStep - 2);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  // Enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      // Preparar dados para envio
      const submitData = {
        userType: 'transportador',
        tipoTransportador: 'pj',
        ...form,
      };

      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  // Renderizar conteúdo do passo
  const renderStepContent = () => {
    const step = currentStep;

    switch (step) {
      case 0: // Dados da Empresa
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Razão Social
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.razaoSocial}
                  onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
                  placeholder="Transportes Silva LTDA"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.razaoSocial && <p className="text-sm text-red-400 mt-1">{errors.razaoSocial}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Fantasia
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.nomeFantasia}
                  onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
                  placeholder="Silva Transport"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.nomeFantasia && <p className="text-sm text-red-400 mt-1">{errors.nomeFantasia}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CNPJInput
                value={form.cnpj}
                onChange={(data) => {
                  setForm({ ...form, cnpj: data.formatted });
                  setValidations({ ...validations, cnpj: data });
                }}
                error={errors.cnpj}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={form.inscricaoEstadual}
                  onChange={(e) => setForm({ ...form, inscricaoEstadual: e.target.value })}
                  placeholder="123.456.789.012"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Endereço
        return (
          <AddressForm
            value={form.endereco}
            onChange={(endereco) => setForm({ ...form, endereco })}
            addressType="comercial"
            required
          />
        );

      case 2: // Contato
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Responsável
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.nomeResponsavel}
                  onChange={(e) => setForm({ ...form, nomeResponsavel: e.target.value })}
                  placeholder="João"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.nomeResponsavel && <p className="text-sm text-red-400 mt-1">{errors.nomeResponsavel}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sobrenome
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.sobrenomeResponsavel}
                  onChange={(e) => setForm({ ...form, sobrenomeResponsavel: e.target.value })}
                  placeholder="Silva"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.sobrenomeResponsavel && <p className="text-sm text-red-400 mt-1">{errors.sobrenomeResponsavel}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CPFInput
                value={form.cpfResponsavel}
                onChange={(data) => {
                  setForm({ ...form, cpfResponsavel: data.formatted });
                  setValidations({ ...validations, cpfResponsavel: data });
                }}
                error={errors.cpfResponsavel}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RG
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.rgResponsavel}
                  onChange={(e) => setForm({ ...form, rgResponsavel: e.target.value })}
                  placeholder="1234567"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.rgResponsavel && <p className="text-sm text-red-400 mt-1">{errors.rgResponsavel}</p>}
              </div>

              <DateInput
                value={form.dataVencimentoCNH}
                onChange={(data) => setForm({ ...form, dataVencimentoCNH: data })}
                label="Vencimento CNH"
                validateExpiration
                required
              />
            </div>

            <PhoneInput
              value={form.telefone}
              onChange={(data) => setForm({ ...form, telefone: data.formatted })}
              error={errors.telefone}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EmailInput
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                error={errors.email}
                required
              />

              <EmailConfirmInput
                email={form.email}
                value={form.emailConfirmacao}
                onChange={(value) => setForm({ ...form, emailConfirmacao: value })}
                error={errors.emailMatch || errors.emailConfirmacao}
                required
              />
            </div>
          </div>
        );

      case 3: // Segurança
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PasswordInput
              value={form.senha}
              onChange={(value) => setForm({ ...form, senha: value })}
              showStrength
              required
            />

            <PasswordConfirmInput
              password={form.senha}
              value={form.senhaConfirmacao}
              onChange={(value) => setForm({ ...form, senhaConfirmacao: value })}
              error={errors.senhaMatch || errors.senhaConfirmacao}
              required
            />
          </div>
        );

      case 4: // Quantidade de Veículos
        return (
          <div className="space-y-4">
            <p className="text-gray-300 mb-6">Quantos veículos sua empresa possui?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowVehicleStep(true);
                  setCurrentStep(currentStep + 1);
                }}
                className="p-6 rounded-lg border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all text-left"
              >
                <div className="text-2xl font-bold text-white mb-2">1</div>
                <p className="text-gray-300">Um único veículo</p>
                <p className="text-xs text-gray-500 mt-2">Faça upload dos dados e documentos do veículo agora</p>
              </button>

              <button
                onClick={() => {
                  setShowVehicleStep(false);
                  setCurrentStep(currentStep + 2);
                }}
                className="p-6 rounded-lg border-2 border-gray-700 hover:border-green-500 hover:bg-gray-800/50 transition-all text-left"
              >
                <div className="text-2xl font-bold text-white mb-2">2+</div>
                <p className="text-gray-300">Múltiplos veículos</p>
                <p className="text-xs text-gray-500 mt-2">Adicione os dados dos veículos depois no painel</p>
              </button>
            </div>
          </div>
        );

      case 5: // Dados do Veículo (se 1 veículo)
        if (showVehicleStep === false) return null;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Placa do Veículo
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.veiculo.placa}
                  onChange={(e) => setForm({
                    ...form,
                    veiculo: { ...form.veiculo, placa: e.target.value.toUpperCase() }
                  })}
                  placeholder="ABC1234"
                  maxLength="8"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none uppercase"
                />
                {errors.veiculoPlaca && <p className="text-sm text-red-400 mt-1">{errors.veiculoPlaca}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Veículo
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={form.veiculo.tipo}
                  onChange={(e) => setForm({
                    ...form,
                    veiculo: { ...form.veiculo, tipo: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="caminhao">Caminhão</option>
                  <option value="van">Van</option>
                  <option value="carro">Carro</option>
                  <option value="trator">Trator</option>
                  <option value="reboque">Reboque</option>
                </select>
                {errors.veiculoTipo && <p className="text-sm text-red-400 mt-1">{errors.veiculoTipo}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RENAVAM
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={form.veiculo.renavam}
                  onChange={(e) => setForm({
                    ...form,
                    veiculo: { ...form.veiculo, renavam: e.target.value }
                  })}
                  placeholder="1234567890"
                  maxLength="11"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 transition-all outline-none"
                />
                {errors.veiculoRenavam && <p className="text-sm text-red-400 mt-1">{errors.veiculoRenavam}</p>}
              </div>

              <DateInput
                value={form.veiculo.dataVencimentoCRLV}
                onChange={(data) => setForm({
                  ...form,
                  veiculo: { ...form.veiculo, dataVencimentoCRLV: data }
                })}
                label="Vencimento CRLV"
                validateExpiration
                required
              />
            </div>
          </div>
        );

      case 6: // Documentos
        return (
          <DocumentUpload
            documents={form.documentos}
            onDocumentsChange={(documentos) => setForm({ ...form, documentos })}
            requiredDocuments={[
              'CARTAO_CNPJ',
              'RG_RESPONSAVEL',
              'CPF_RESPONSAVEL',
              'CNH_RESPONSAVEL',
              'CRLV',
              'COMPROVANTE_ENDERECO'
            ]}
          />
        );

      default:
        return null;
    }
  };

  const stepsLength = getSteps().length;
  const isLastStep = currentStep === stepsLength - 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* FormStepper */}
      <FormStepper
        currentStep={getDisplayStep()}
        steps={getSteps()}
        title={`${getSteps()[getDisplayStep()]}`}
        description="Preencha todos os campos obrigatórios para continuar"
      />

      {/* Conteúdo */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        {renderStepContent()}

        {/* Erro geral */}
        {errors.submit && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{errors.submit}</p>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex gap-4 justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 0 || isLoading}
          className="px-6 py-3 rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Voltar
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Próximo →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? 'Enviando...' : 'Finalizar Cadastro'}
            <CheckCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
