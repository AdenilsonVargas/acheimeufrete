import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { validateDocumentExpiration, formatDateForInput, formatDateForDisplay } from '@/utils/validators';

/**
 * Input de data com validação de vencimento
 */
export default function DateInput({
  value = '',
  onChange,
  onBlur,
  label = 'Data',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  type = 'date',
  min,
  max,
  validateExpiration = false, // Se true, valida como data de vencimento
  showValidation = true,
}) {
  const [focused, setFocused] = useState(false);
  const [validation, setValidation] = useState({ isValid: false, status: '', diasRestantes: -1 });

  const handleChange = (e) => {
    const inputValue = e.target.value;

    let validation = { isValid: !!inputValue, status: 'ok', diasRestantes: -1 };

    if (inputValue && validateExpiration) {
      validation = validateDocumentExpiration(inputValue);
    }

    setValidation(validation);

    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);

    if (e.target.value && validateExpiration) {
      const validation = validateDocumentExpiration(e.target.value);
      setValidation(validation);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const isExpired = validation.status === 'vencido';
  const isExpiringSoon = validation.status === 'proxima_vencimento';
  const showError = (isExpired || isExpiringSoon || error) && !focused;
  const showValid = validation.isValid && !isExpired && !error && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          min={min}
          max={max}
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

      {/* Mensagens */}
      {isExpired && (
        <p className="text-sm text-red-400">⚠ Documento vencido</p>
      )}
      {isExpiringSoon && (
        <p className="text-sm text-yellow-400">
          ⚠ Vence em {validation.diasRestantes} dias
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
