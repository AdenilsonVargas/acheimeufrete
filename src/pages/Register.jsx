import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Upload, X, Loader } from 'lucide-react';
import Footer from '@/components/Footer';
import Alert from '@/components/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCPF, formatCNPJ, formatPhone, formatCEP, fetchAddressByCEP } from '@/utils/formatters';

const steps = [
  { id: 1, title: 'Tipo de Cadastro', name: 'tipo' },
  { id: 2, title: 'Dados Básicos', name: 'basicos' },
  { id: 3, title: 'Endereço', name: 'endereco' },
  { id: 4, title: 'Documentos', name: 'documentos' },
  { id: 5, title: 'Confirmação', name: 'confirmacao' },
];

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userType, setUserType] = useState(null); // 'embarcador' ou 'transportador'
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({});
  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Dados Básicos
    email: '',
    emailConfirmation: '',
    password: '',
    passwordConfirmation: '',
    telefone: '',
    
    // Embarcador
    nomeCompleto: '',
    cpfOuCnpj: '',
    nomeFantasia: '',
    
    // Transportador
    tipoTransportador: 'pj', // 'pj' ou 'autonomo'
    razaoSocial: '',
    cnpj: '',
    cpf: '',
    inscricaoEstadual: '',
    nomeResponsavel: '',
    
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    
    // Documentos
    documentos: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Forçar MAIÚSCULAS em campos de texto (excepto email e senha)
    const fieldsToUppercase = [
      'nomeCompleto', 'nomeFantasia', 'razaoSocial', 'nomeResponsavel',
      'logradouro', 'complemento', 'bairro', 'cidade', 'inscricaoEstadual'
    ];
    
    if (fieldsToUppercase.includes(name)) {
      formattedValue = value.toUpperCase();
    }

    // Aplicar formatação baseada no campo
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'cpfOuCnpj') {
      // Detecta se é CPF ou CNPJ pela quantidade de dígitos
      const digits = value.replace(/\D/g, '').length;
      if (digits <= 11) {
        formattedValue = formatCPF(value);
      } else {
        formattedValue = formatCNPJ(value);
      }
    } else if (name === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (name === 'telefone') {
      formattedValue = formatPhone(value);
    } else if (name === 'cep') {
      formattedValue = formatCEP(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleCepChange = async (e) => {
    const { value } = e.target;
    const formattedCEP = formatCEP(value);
    
    setFormData(prev => ({
      ...prev,
      cep: formattedCEP,
    }));

    // Se o CEP tem 9 caracteres (XXXXX-XXX), busca o endereço
    if (formattedCEP.length === 9) {
      setCepLoading(true);
      setError('');
      
      try {
        const address = await fetchAddressByCEP(formattedCEP);
        setFormData(prev => ({
          ...prev,
          cep: address.cep,
          logradouro: address.logradouro.toUpperCase(),
          bairro: address.bairro.toUpperCase(),
          cidade: address.cidade.toUpperCase(),
          estado: address.estado.toUpperCase(),
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleFileUpload = (e, documentType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({
        ...prev,
        [documentType]: file,
      }));
    }
  };

  const removeFile = (documentType) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[documentType];
      return newFiles;
    });
  };

  const handleNext = () => {
    // Validações básicas por step
    if (currentStep === 1 && !userType) {
      setError('Selecione um tipo de cadastro');
      return;
    }
    
    if (currentStep === 2) {
      if (!formData.email || !formData.emailConfirmation) {
        setError('Preencha todos os campos de email');
        return;
      }
      if (formData.email !== formData.emailConfirmation) {
        setError('Os emails não conferem');
        return;
      }
      if (!formData.password || !formData.passwordConfirmation) {
        setError('Preencha todos os campos de senha');
        return;
      }
      if (formData.password !== formData.passwordConfirmation) {
        setError('As senhas não conferem');
        return;
      }
      if (!formData.telefone) {
        setError('Preencha o telefone');
        return;
      }
      
      if (userType === 'embarcador') {
        if (!formData.nomeCompleto || !formData.cpfOuCnpj) {
          setError('Preencha nome completo e CPF/CNPJ');
          return;
        }
      } else {
        if (!formData.razaoSocial) {
          setError('Preencha razão social');
          return;
        }
        if (formData.tipoTransportador === 'pj' && !formData.cnpj) {
          setError('Preencha o CNPJ');
          return;
        }
        if (formData.tipoTransportador === 'autonomo' && !formData.cpf) {
          setError('Preencha o CPF');
          return;
        }
      }
    }
    
    if (currentStep === 3) {
      if (!formData.cep || !formData.logradouro || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
        setError('Preencha todos os campos de endereço');
        return;
      }
    }

    setError('');
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // Validações finais
    if (!formData.email || !formData.password) {
      setError('Email e senha são obrigatórios');
      return;
    }

    if (formData.email !== formData.emailConfirmation) {
      setError('Os emails não conferem');
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError('As senhas não conferem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        userType,
        tipoTransportador: userType === 'transportador' ? formData.tipoTransportador : undefined,
      };

      console.log('📤 Enviando dados de cadastro:', data);
      
      const response = await register(data);
      console.log('✅ Cadastro realizado com sucesso:', response);
      
      // Redirecionar baseado no tipo de usuário cadastrado
      if (userType === 'transportador') {
        navigate('/dashboard-transportadora');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('❌ Erro no cadastro:', err);
      
      // Tentar extrair mensagem de erro do servidor
      let errorMessage = 'Erro ao fazer cadastro. Tente novamente.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative z-10 flex flex-col">
      {/* Header globalizado em App.jsx */}

      <div className="flex-1 px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          
          {/* Logo Branding */}
          <div className="flex justify-center items-center gap-3 mb-8">
            <img 
              src="/images/logoatualizada.png" 
              alt="ACHEI MEU FRETE" 
              className="h-12 w-auto object-contain"
            />
            {/* Texto da logo - Dinâmico por tema */}
            <img 
              src={isDark 
                ? "/images/acheimeufretefontebranca.png" 
                : "/images/acheimeufretefontepreta.png"
              }
              alt="ACHEI MEU FRETE" 
              className="h-6 w-auto object-contain"
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between mb-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition shadow-sm ${
                      currentStep >= step.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {step.id}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition ${
                        currentStep > step.id
                          ? 'bg-orange-500'
                          : 'bg-gray-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-700 dark:text-slate-300">
              Etapa {currentStep} de {steps.length}:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{steps[currentStep - 1].title}</span>
            </p>
          </div>

          {/* Form Card */}
          <div className="card">
            {error && (
              <Alert
                type="error"
                title="Erro"
                message={error}
                onClose={() => setError('')}
              />
            )}

            {/* Step 1: Tipo de Cadastro */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Como você vai usar a plataforma?</h2>
                
                {/* Embarcador Option */}
                <button
                  onClick={() => setUserType('embarcador')}
                  className={`w-full border-2 rounded-lg p-6 text-left transition ${
                    userType === 'embarcador'
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-600/10'
                      : 'border-gray-200 hover:border-orange-200 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">📦 Sou Embarcador</h3>
                  <p className="text-gray-700 dark:text-slate-300">
                    Preciso enviar cargas e procuro transportadores qualificados. Sou responsável pelo frete (CIF) ou recebo propostas de preço (FOB).
                  </p>
                </button>

                {/* Transportador Option */}
                <button
                  onClick={() => setUserType('transportador')}
                  className={`w-full border-2 rounded-lg p-6 text-left transition ${
                    userType === 'transportador'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-400/10'
                      : 'border-gray-200 hover:border-cyan-200 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🚚 Sou Transportador</h3>
                  <p className="text-gray-700 dark:text-slate-300">
                    Tenho frota e ofereço serviços de transporte. Respondo a cotações de clientes e obtenho frete.
                  </p>
                </button>
              </div>
            )}

            {/* Step 2: Dados Básicos */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Dados Básicos</h2>

                {/* Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Confirmar Email</label>
                    <input
                      type="email"
                      name="emailConfirmation"
                      value={formData.emailConfirmation}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Senha</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Confirmar Senha</label>
                    <input
                      type="password"
                      name="passwordConfirmation"
                      value={formData.passwordConfirmation}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-white font-medium mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>

                {/* Dados específicos por tipo */}
                {userType === 'embarcador' ? (
                  <>
                    <div>
                      <label className="block text-white font-medium mb-2">Nome Completo</label>
                      <input
                        type="text"
                        name="nomeCompleto"
                        value={formData.nomeCompleto}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">CPF/CNPJ</label>
                        <input
                          type="text"
                          name="cpfOuCnpj"
                          value={formData.cpfOuCnpj}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="XXX.XXX.XXX-XX ou XX.XXX.XXX/0001-XX"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">Nome Fantasia (Opcional)</label>
                        <input
                          type="text"
                          name="nomeFantasia"
                          value={formData.nomeFantasia}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Nome da sua empresa"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-white font-medium mb-2">Tipo de Transportador</label>
                      <select
                        name="tipoTransportador"
                        value={formData.tipoTransportador}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="pj">Pessoa Jurídica (PJ)</option>
                        <option value="autonomo">Autônomo (PF)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Razão Social</label>
                      <input
                        type="text"
                        name="razaoSocial"
                        value={formData.razaoSocial}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Nome da sua empresa"
                      />
                    </div>

                    {formData.tipoTransportador === 'pj' ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white font-medium mb-2">CNPJ</label>
                            <input
                              type="text"
                              name="cnpj"
                              value={formData.cnpj}
                              onChange={handleChange}
                              className="input-field"
                              placeholder="XX.XXX.XXX/0001-XX"
                            />
                          </div>
                          <div>
                            <label className="block text-white font-medium mb-2">Inscrição Estadual (Opcional)</label>
                            <input
                              type="text"
                              name="inscricaoEstadual"
                              value={formData.inscricaoEstadual}
                              onChange={handleChange}
                              className="input-field"
                              placeholder="IE"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Nome do Responsável</label>
                          <input
                            type="text"
                            name="nomeResponsavel"
                            value={formData.nomeResponsavel}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Nome completo"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-white font-medium mb-2">CPF</label>
                        <input
                          type="text"
                          name="cpf"
                          value={formData.cpf}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="XXX.XXX.XXX-XX"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Endereço */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Endereço</h2>

                <div>
                  <label className="block text-white font-medium mb-2">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      className="input-field"
                      placeholder="XXXXX-XXX"
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-3">
                        <Loader className="w-5 h-5 text-orange-600 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rua, Avenida, etc"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Número</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Apto, sala, etc"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Bairro</label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Cidade</label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Selecione o estado</option>
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="BA">Bahia</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="PR">Paraná</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="GO">Goiás</option>
                      <option value="DF">Distrito Federal</option>
                      {/* Adicione mais estados conforme necessário */}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documentos */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Documentos</h2>

                {userType === 'embarcador' && (
                  <>
                    {/* CPF/CNPJ */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Scan do CPF/CNPJ *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-orange-600 transition cursor-pointer">
                        <input
                          type="file"
                          id="cpf-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'cpf')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="cpf-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">PDF, PNG ou JPG</p>
                        </label>
                      </div>
                      {files.cpf && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.cpf.name}</span>
                          <button
                            onClick={() => removeFile('cpf')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comprovante de Endereço */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Comprovante de Endereço *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-orange-600 transition cursor-pointer">
                        <input
                          type="file"
                          id="address-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'endereco')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="address-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">Conta de água, luz ou telefone</p>
                        </label>
                      </div>
                      {files.endereco && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.endereco.name}</span>
                          <button
                            onClick={() => removeFile('endereco')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {userType === 'transportador' && (
                  <>
                    {/* CNPJ/CPF */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Scan do CNPJ/CPF *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                        <input
                          type="file"
                          id="cnpj-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'cnpj')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="cnpj-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">PDF, PNG ou JPG</p>
                        </label>
                      </div>
                      {files.cnpj && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.cnpj.name}</span>
                          <button
                            onClick={() => removeFile('cnpj')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CNH */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        CNH Frente e Verso *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                        <input
                          type="file"
                          id="cnh-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'cnh')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="cnh-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">PDF, PNG ou JPG</p>
                        </label>
                      </div>
                      {files.cnh && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.cnh.name}</span>
                          <button
                            onClick={() => removeFile('cnh')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CRLV */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        CRLV do Veículo *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                        <input
                          type="file"
                          id="crlv-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'crlv')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="crlv-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">Certificado de Registro e Licenciamento Veicular</p>
                        </label>
                      </div>
                      {files.crlv && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.crlv.name}</span>
                          <button
                            onClick={() => removeFile('crlv')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Comprovante de Endereço */}
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Comprovante de Endereço *
                      </label>
                      <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                        <input
                          type="file"
                          id="address-transport-file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'enderecoTransp')}
                          accept="image/*,application/pdf"
                        />
                        <label htmlFor="address-transport-file" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-white font-medium">Clique para upload ou arraste</p>
                          <p className="text-slate-400 text-sm">Conta de água, luz ou telefone</p>
                        </label>
                      </div>
                      {files.enderecoTransp && (
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded mt-2">
                          <span className="text-slate-300 text-sm">{files.enderecoTransp.name}</span>
                          <button
                            onClick={() => removeFile('enderecoTransp')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <p className="text-slate-400 text-sm">
                  Os documentos são validados por nossa equipe. Você será notificado por email quando o processo for concluído.
                </p>
              </div>
            )}

            {/* Step 5: Confirmação */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Confirmar Cadastro</h2>

                <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                  <div className="border-b border-slate-700 pb-4">
                    <p className="text-slate-400 text-sm">Email</p>
                    <p className="text-white font-semibold">{formData.email}</p>
                  </div>

                  <div className="border-b border-slate-700 pb-4">
                    <p className="text-slate-400 text-sm">Telefone</p>
                    <p className="text-white font-semibold">{formData.telefone}</p>
                  </div>

                  {userType === 'embarcador' ? (
                    <>
                      <div className="border-b border-slate-700 pb-4">
                        <p className="text-slate-400 text-sm">Nome Completo</p>
                        <p className="text-white font-semibold">{formData.nomeCompleto}</p>
                      </div>
                      <div className="border-b border-slate-700 pb-4">
                        <p className="text-slate-400 text-sm">CPF/CNPJ</p>
                        <p className="text-white font-semibold">{formData.cpfOuCnpj}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-slate-700 pb-4">
                        <p className="text-slate-400 text-sm">Razão Social</p>
                        <p className="text-white font-semibold">{formData.razaoSocial}</p>
                      </div>
                      <div className="border-b border-slate-700 pb-4">
                        <p className="text-slate-400 text-sm">
                          {formData.tipoTransportador === 'pj' ? 'CNPJ' : 'CPF'}
                        </p>
                        <p className="text-white font-semibold">
                          {formData.tipoTransportador === 'pj' ? formData.cnpj : formData.cpf}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="border-b border-slate-700 pb-4">
                    <p className="text-slate-400 text-sm">Endereço</p>
                    <p className="text-white font-semibold">
                      {formData.logradouro}, {formData.numero} - {formData.bairro}, {formData.cidade} - {formData.estado}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm">Documentos Anexados</p>
                    <p className="text-white font-semibold">{Object.keys(files).length} arquivo(s)</p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    Ao confirmar, seus dados serão revisados pela nossa equipe. Você receberá um email com a aprovação ou solicitação de documentos adicionais.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded mt-1" required />
                  <span className="text-slate-300 text-sm">
                    Li e concordo com os{' '}
                    <Link to="#" className="text-orange-600 hover:text-orange-500">
                      Termos de Serviço
                    </Link>{' '}
                    e{' '}
                    <Link to="#" className="text-orange-600 hover:text-orange-500">
                      Política de Privacidade
                    </Link>
                  </span>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              {currentStep === steps.length ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-slate-300 mt-6">
            Já possui conta?{' '}
            <Link to="/login" className="text-orange-600 hover:text-orange-500 font-bold transition">
              Faça login
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
