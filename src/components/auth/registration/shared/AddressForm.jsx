import React, { useState } from 'react';
import { MapPin, AlertCircle, Loader } from 'lucide-react';

/**
 * Formulário de endereço reutilizável
 * Busca CEP automaticamente usando ViaCEP
 */
export default function AddressForm({
  value = {},
  onChange,
  label = 'Endereço',
  required = false,
  addressType = 'residencial', // residencial, comercial, coleta
  compact = false, // Se true, mostra versão compacta
}) {
  const [form, setForm] = useState({
    cep: value.cep || '',
    logradouro: value.logradouro || '',
    numero: value.numero || '',
    complemento: value.complemento || '',
    bairro: value.bairro || '',
    cidade: value.cidade || '',
    estado: value.estado || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepNotFound, setCepNotFound] = useState(false);

  const TYPE_LABELS = {
    residencial: 'Endereço Residencial',
    comercial: 'Endereço Comercial',
    coleta: 'Endereço de Coleta',
  };

  // Buscar CEP via ViaCEP
  const buscarCEP = async (cep) => {
    const cleaned = cep.replace(/\D/g, '');

    if (cleaned.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      setCepNotFound(false);
      return;
    }

    setLoading(true);
    setError('');
    setCepNotFound(false);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepNotFound(true);
        setError('CEP não encontrado');
      } else {
        const newForm = {
          ...form,
          cep: `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        };
        setForm(newForm);
        setCepNotFound(false);

        if (onChange) {
          onChange(newForm);
        }
      }
    } catch (err) {
      setError('Erro ao buscar CEP. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCEPChange = (e) => {
    const valor = e.target.value;
    const newForm = { ...form, cep: valor };
    setForm(newForm);

    // Se digitou 8 números, busca automaticamente
    const cleaned = valor.replace(/\D/g, '');
    if (cleaned.length === 8) {
      buscarCEP(valor);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);

    if (onChange) {
      onChange(newForm);
    }
  };

  const handleBlur = () => {
    if (onChange) {
      onChange(form);
    }
  };

  const isComplete =
    form.cep && form.logradouro && form.numero && form.bairro && form.cidade && form.estado;

  if (compact) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">{TYPE_LABELS[addressType]}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="col-span-1">
            <p className="text-gray-400 text-xs mb-1">CEP</p>
            <p className="text-white font-medium">{form.cep || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-1">Rua</p>
            <p className="text-white font-medium">{form.logradouro || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Nº</p>
            <p className="text-white font-medium">{form.numero || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-xs mb-1">Bairro</p>
            <p className="text-white font-medium">{form.bairro || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Cidade</p>
            <p className="text-white font-medium">{form.cidade || '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">UF</p>
            <p className="text-white font-medium">{form.estado || '-'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">
          {TYPE_LABELS[addressType]}
        </h3>
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>

      {/* CEP */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CEP
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="cep"
            value={form.cep}
            onChange={handleCEPChange}
            placeholder="00000-000"
            maxLength="9"
            inputMode="numeric"
            disabled={loading}
            className={`
              w-full px-4 py-2.5 rounded-lg font-medium
              bg-gray-900 text-white placeholder-gray-600
              border-2 transition-all outline-none
              ${loading ? 'opacity-50' : ''}
              ${cepNotFound
                ? 'border-red-500 focus:border-red-600'
                : 'border-gray-700 focus:border-blue-500'
              }
            `}
          />
          {loading && (
            <Loader className="absolute right-3 top-3 w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>
        {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
      </div>

      {/* Rua / Logradouro */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rua / Logradouro
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          name="logradouro"
          value={form.logradouro}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Avenida Principal"
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white placeholder-gray-600 border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
        />
      </div>

      {/* Número e Complemento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Número
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="numero"
            value={form.numero}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="123"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white placeholder-gray-600 border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Complemento
          </label>
          <input
            type="text"
            name="complemento"
            value={form.complemento}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Apto 45"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white placeholder-gray-600 border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Bairro, Cidade, Estado */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bairro
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Centro"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white placeholder-gray-600 border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cidade
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="São Paulo"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white placeholder-gray-600 border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Estado / UF
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          name="estado"
          value={form.estado}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-900 text-white border-2 border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50"
        >
          <option value="">Selecione...</option>
          <option value="AC">Acre</option>
          <option value="AL">Alagoas</option>
          <option value="AP">Amapá</option>
          <option value="AM">Amazonas</option>
          <option value="BA">Bahia</option>
          <option value="CE">Ceará</option>
          <option value="DF">Distrito Federal</option>
          <option value="ES">Espírito Santo</option>
          <option value="GO">Goiás</option>
          <option value="MA">Maranhão</option>
          <option value="MT">Mato Grosso</option>
          <option value="MS">Mato Grosso do Sul</option>
          <option value="MG">Minas Gerais</option>
          <option value="PA">Pará</option>
          <option value="PB">Paraíba</option>
          <option value="PR">Paraná</option>
          <option value="PE">Pernambuco</option>
          <option value="PI">Piauí</option>
          <option value="RJ">Rio de Janeiro</option>
          <option value="RN">Rio Grande do Norte</option>
          <option value="RS">Rio Grande do Sul</option>
          <option value="RO">Rondônia</option>
          <option value="RR">Roraima</option>
          <option value="SC">Santa Catarina</option>
          <option value="SP">São Paulo</option>
          <option value="SE">Sergipe</option>
          <option value="TO">Tocantins</option>
        </select>
      </div>

      {/* Indicador de conclusão */}
      {isComplete && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm text-green-300">Endereço completo</span>
        </div>
      )}
    </div>
  );
}

// Importar CheckCircle
import { CheckCircle } from 'lucide-react';
