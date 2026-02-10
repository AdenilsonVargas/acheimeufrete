import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { validateCNPJInput, isValidCNPJ, formatCNPJ } from '@/utils/validators';

/**
 * Input de CNPJ com validação
 * Formato: xx.xxx.xxx/xxxx-xx
 */
export default function CNPJInput({
  value = '',
  onChange,
  onBlur,
  placeholder = '00.000.000/0000-00',
  label = 'CNPJ',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  showValidation = true,
}) {
  const [focused, setFocused] = useState(false);
  const [validation, setValidation] = useState({ isValid: false, formatted: '', error: '' });

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Validar enquanto usuário digita
    const result = validateCNPJInput(inputValue);
    setValidation(result);

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

    const result = validateCNPJInput(e.target.value);
    setValidation(result);

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const showError = (validation.error || error) && !focused;
  const showValid = validation.isValid && !error && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          maxLength="18"
          inputMode="numeric"
          className={`
            w-full pl-10 pr-10 py-2.5 rounded-lg font-medium
            bg-gray-900 text-white placeholder-gray-600
            border-2 transition-all outline-none
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-800' : ''}
            ${showError
              ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20'
              : showValid
              ? 'border-green-600 focus:border-green-600 focus:ring-1 focus:ring-green-500/20'
              : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            }
          `}
        />

        {/* Ícone de status */}
        {showValidation && (showValid || showError) && (
          <div className="absolute right-3 top-3">
            {showValid ? (
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
    </div>
  );
}
