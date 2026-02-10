import React, { useState } from 'react';
import { Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePhoneInput, formatPhone, isValidPhone } from '@/utils/validators';

/**
 * Input de telefone com validação em tempo real
 * Formato esperado: (xx) xxxxx-xxxx
 */
export default function PhoneInput({
  value = '',
  onChange,
  onBlur,
  placeholder = '(11) 98765-4321',
  label = 'Telefone',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  showValidation = true,
}) {
  const [focused, setFocused] = useState(false);
  const [validation, setValidation] = useState({ isValid: false, error: '' });

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Validar enquanto usuário digita
    const result = validatePhoneInput(inputValue);
    setValidation(result);

    // Callback com valor bruto
    if (onChange) {
      onChange({
        raw: inputValue.replace(/\D/g, ''),
        formatted: result.formatted,
        isValid: result.isValid,
      });
    }
  };

  const handleBlur = (e) => {
    setFocused(false);
    
    // Validação final ao sair do campo
    const result = isValidPhone(e.target.value);
    setValidation({
      isValid: result,
      error: result ? '' : 'Telefone inválido',
    });

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  // Status de validação
  const isValid = validation.isValid && !error;
  const isInvalid = validation.error || error;
  const showError = (isInvalid || error) && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />
        
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2.5 rounded-lg font-medium
            bg-gray-900 text-white placeholder-gray-600
            border-2 transition-all outline-none
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-800' : ''}
            ${showError 
              ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20'
              : isValid
              ? 'border-green-600 focus:border-green-600 focus:ring-1 focus:ring-green-500/20'
              : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            }
          `}
        />

        {/* Ícone de status */}
        {showValidation && (isValid || showError) && (
          <div className="absolute right-3 top-3">
            {isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : showError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : null}
          </div>
        )}
      </div>

      {/* Mensagem de erro ou ajuda */}
      {showError && (
        <p className="text-sm text-red-400">{validation.error || error}</p>
      )}
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}

      {/* Validação silenciosa enquanto digita */}
      {focused && !validation.error && value.length > 0 && value.length < 14 && (
        <p className="text-xs text-gray-500">Continuando...</p>
      )}
    </div>
  );
}
