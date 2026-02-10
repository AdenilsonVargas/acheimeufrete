# 🎯 SKILL C: FORMS & VALIDATION MASTERY
## React Hook Form + Zod (Padrão para toda plataforma)

> **OBJETIVO:** Formulários profissionais, validação forte, UX suave, zero dados inválidos no banco

---

## 📋 TABELA DE CONTEÚDOS

1. [Setup Essencial](#1-setup-essencial)
2. [Validação com Zod](#2-validação-com-zod)
3. [Padrões de Formulário](#3-padrões-de-formulário)
4. [Error Handling](#4-error-handling)
5. [Acessibilidade](#5-acessibilidade)

---

## 1. SETUP ESSENCIAL

### 📦 Dependências
```bash
npm install react-hook-form zod @hookform/resolvers
```

### 🏗️ Setup Básico
```javascript
// src/lib/formSetup.js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Hook customizado (reutilizável em TODA plataforma)
export const useFormWithValidation = (schema, onSubmit) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange'  // Validar em tempo real
  });
  
  return { register, handleSubmit, errors, isSubmitting, isValid, watch, setValue, reset, trigger };
};
```

---

## 2. VALIDAÇÃO COM ZOD

### ✅ Schemas Reutilizáveis
```javascript
// src/schemas/auth.js
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .tolowercase(),
  senha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[!@#$%]/, 'Deve conter caractere especial')
});

export const registroSchema = loginSchema.extend({
  nome: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Apenas letras e espaços'),
  confirmaSenha: z.string()
}).refine((data) => data.senha === data.confirmaSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmaSenha']
});

// src/schemas/quotacao.js
export const criarQuotacaoSchema = z.object({
  cidadeOrigem: z.string().min(1, 'Selecione cidade'),
  cepOrigem: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP inválido')
    .refine(async (cep) => await viaCepApi(cep), 'CEP não encontrado'),
  
  cidadeDestino: z.string().min(1, 'Selecione cidade'),
  cepDestino: z.string().regex(/^\d{5}-\d{3}$/),
  
  peso: z.number()
    .positive('Peso deve ser > 0')
    .max(50000, 'Peso máximo: 50 toneladas'),
  
  dimensoes: z.object({
    comprimento: z.number().positive(),
    largura: z.number().positive(),
    altura: z.number().positive()
  }),
  
  ncmCodigo: z.string()
    .length(8, 'NCM deve ter 8 dígitos')
    .regex(/^\d+$/, 'Apenas números'),
  
  descricao: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  
  dataColeta: z.string()
    .transform((data) => new Date(data))
    .refine((data) => data > new Date(), 'Data deve ser futura'),
  
  valorEstimado: z.number().optional()
});

// src/schemas/perfil.js
export const atualizarPerfilSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  telefone: z.string()
    .regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, 'Telefone inválido'),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .refine(async (cpf) => !await cpfJaExiste(cpf), 'CPF já registrado'),
  endereco: z.object({
    rua: z.string().min(5),
    numero: z.string().min(1),
    complemento: z.string().optional(),
    bairro: z.string().min(3),
    cidade: z.string().min(3),
    cep: z.string().regex(/^\d{5}-\d{3}$/)
  })
});
```

---

## 3. PADRÕES DE FORMULÁRIO

### 🎨 Componente Base - Input com Validação
```javascript
// src/components/FormInput.jsx
import { useState } from 'react';

export function FormInput({
  label,
  placeholder,
  type = 'text',
  register,
  name,
  errors,
  icon: Icon,
  hint,
  disabled,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const error = errors[name];
  
  return (
    <div className="form-group">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {error && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2 rounded-lg border-2 transition-colors
            ${Icon ? 'pl-10' : 'pl-4'}
            ${focused ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
            disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            dark:bg-gray-800 dark:text-white
          `}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...register(name)}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-red-600 text-sm mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          {error.message}
        </p>
      )}
      
      {hint && !error && (
        <p className="text-gray-500 text-xs mt-1">{hint}</p>
      )}
    </div>
  );
}
```

### 📝 Exemplo - Formulário Completo (Criar Quotação)
```javascript
// src/pages/NovaQuotacao.jsx
import { useFormWithValidation } from '@/lib/formSetup';
import { criarQuotacaoSchema } from '@/schemas/quotacao';
import { FormInput } from '@/components/FormInput';
import { MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function NovaQuotacao() {
  const [step, setStep] = useState(1);
  const [carregando, setCarregando] = useState(false);
  
  const { register, handleSubmit, errors, isValid, watch, trigger } = useFormWithValidation(
    criarQuotacaoSchema,
    onSubmit
  );
  
  const cidadeOrigem = watch('cidadeOrigem');
  
  async function onSubmit(data) {
    try {
      setCarregando(true);
      await apiClient.post('/quotacoes/criar', data);
      toast.success('Quotação criada!');
      navigate('/minhas-quotacoes');
    } catch (error) {
      toast.error(error.response.data.erro);
    } finally {
      setCarregando(false);
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}
              `}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`}></div>}
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Origem e Destino</h2>
            
            <FormInput
              label="Cidade de Origem"
              register={register}
              name="cidadeOrigem"
              errors={errors}
              icon={MapPin}
              placeholder="Ex: São Paulo, SP"
            />
            
            <FormInput
              label="CEP de Origem"
              register={register}
              name="cepOrigem"
              errors={errors}
              placeholder="12345-678"
              hint="Formato: 12345-678"
            />
            
            <FormInput
              label="Cidade de Destino"
              register={register}
              name="cidadeDestino"
              errors={errors}
              icon={MapPin}
              placeholder="Ex: Rio de Janeiro, RJ"
            />
            
            <FormInput
              label="CEP de Destino"
              register={register}
              name="cepDestino"
              errors={errors}
              placeholder="12345-678"
            />
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Detalhes da Carga</h2>
            
            <FormInput
              label="Peso (kg)"
              type="number"
              register={register}
              name="peso"
              errors={errors}
              icon={Package}
              placeholder="1000"
            />
            
            {/* Dimensões */}
            <div className="grid grid-cols-3 gap-4">
              <FormInput label="Comprimento" type="number" register={register} name="dimensoes.comprimento" errors={errors} />
              <FormInput label="Largura" type="number" register={register} name="dimensoes.largura" errors={errors} />
              <FormInput label="Altura" type="number" register={register} name="dimensoes.altura" errors={errors} />
            </div>
            
            <FormInput
              label="Código NCM"
              register={register}
              name="ncmCodigo"
              errors={errors}
              placeholder="12345678"
              hint="Encontre em: https://www.gov.br/fim/tabela-ncm"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                rows="4"
                placeholder="Descreva a carga (ex: Eletrônicos, frágil, etc)"
                {...register('descricao')}
              />
              {errors.descricao && <p className="text-red-600 text-sm mt-1">⚠️ {errors.descricao.message}</p>}
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Data e Valor</h2>
            
            <FormInput
              label="Data de Coleta"
              type="date"
              register={register}
              name="dataColeta"
              errors={errors}
              icon={Calendar}
              min={new Date().toISOString().split('T')[0]}
            />
            
            <FormInput
              label="Valor Estimado (opcional)"
              type="number"
              register={register}
              name="valorEstimado"
              errors={errors}
              icon={DollarSign}
              placeholder="5000.00"
            />
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={step === 1}
          >
            ← Anterior
          </button>
          
          {step === 3 ? (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={!isValid || carregando}
            >
              {carregando ? 'Criando...' : 'Criar Quotação'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(Math.min(3, step + 1))}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Próximo →
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

---

## 4. ERROR HANDLING

### ⚠️ Erros Comuns
```javascript
// Validação customizada
const cpfSchema = z.string().refine(async (cpf) => {
  // Remover formato
  const clean = cpf.replace(/\D/g, '');
  
  // Validar algoritmicamente
  if (clean.length !== 11) return false;
  
  // Check duplicata
  const exists = await prisma.user.findUnique({ 
    where: { cpf: clean } 
  });
  
  return !exists;
}, 'CPF já registrado ou inválido');

// Erro do servidor aparece como erro global
const submitForm = async (data) => {
  try {
    await api.post('/quotacoes', data);
  } catch (error) {
    if (error.response?.status === 409) {
      // Conflito - adicionar erro ao campo
      setError('email', { message: 'Email já registrado' });
    }
  }
};
```

---

## 5. ACESSIBILIDADE

### ♿ WCAG 2.1 AA Compliance
```javascript
// src/components/AccessibleForm.jsx
export function AccessibleForm({ schema, onSubmit, children, ariaLabel }) {
  const { register, handleSubmit, errors, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange'
  });
  
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label={ariaLabel}
      aria-busy={isSubmitting}
      className="space-y-4"
      noValidate  // Use HTML5 validation junto com React Hook Form
    >
      {/* Campos */}
    </form>
  );
}

// Input com acessibilidade
export function AccessibleInput({ id, label, error, required, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        {...props}
      />
      {error && (
        <div id={`${id}-error`} className="text-red-600 text-sm" role="alert">
          {error.message}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Success Metrics
✅ 100% de validação antes do submit  
✅ < 1s response time em validação async  
✅ 0 dados inválidos no banco  
✅ WCAG 2.1 AA compliance  
✅ < 5s para preencher formulário padrão  

---

**Próxima Skill:** SKILL D - Data Display & Tables
