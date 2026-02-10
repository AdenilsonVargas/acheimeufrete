import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { isValidEmail, validateEmailMatch } from '@/utils/validators';

/**
 * Input de email com validação
 * Sem permitir copiar/colar
 */
export default function EmailInput({
  value = '',
  onChange,
  onBlur,
  placeholder = 'seu@email.com',
  label = 'Email',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  blockPaste = false,
  blockCopy = false,
  showValidation = true,
}) {
  const [focused, setFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Validação básica
    const valid = isValidEmail(inputValue);
    setIsValid(valid);
    if (!valid && inputValue.length > 0) {
      setValidationError('Email inválido');
    } else {
      setValidationError('');
    }

    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);

    const valid = isValidEmail(e.target.value);
    setIsValid(valid);
    if (!valid && e.target.value.length > 0) {
      setValidationError('Email inválido');
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handlePaste = (e) => {
    if (blockPaste) {
      e.preventDefault();
      return;
    }
  };

  const handleCopy = (e) => {
    if (blockCopy) {
      e.preventDefault();
      return;
    }
  };

  const showError = (validationError || error) && !focused;
  const showValid = isValid && !error && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {blockPaste && <span className="text-xs text-gray-500 ml-2">(sem colar)</span>}
        </label>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onPaste={handlePaste}
          onCopy={handleCopy}
          placeholder={placeholder}
          disabled={disabled}
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
        <p className="text-sm text-red-400">{validationError || error}</p>
      )}
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Componente para confirmar email
 * Com bloqueio de copiar/colar
 */
export function EmailConfirmInput({
  email = '',
  value = '',
  onChange,
  onBlur,
  placeholder = 'confirme@email.com',
  label = 'Confirmar Email',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  showValidation = true,
}) {
  const [focused, setFocused] = useState(false);
  const [matchError, setMatchError] = useState('');

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Validar se combina com email original
    const match = validateEmailMatch(email, inputValue);
    setMatchError(match.error);

    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);

    if (value && email) {
      const match = validateEmailMatch(email, value);
      setMatchError(match.error);
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handlePaste = (e) => {
    e.preventDefault();
  };

  const handleCopy = (e) => {
    e.preventDefault();
  };

  const isValid = !matchError && value && email;
  const showError = (matchError || error) && !focused;
  const showValid = isValid && !error && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          <span className="text-xs text-gray-500 ml-2">(bloqueado copiar/colar)</span>
        </label>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onPaste={handlePaste}
          onCopy={handleCopy}
          placeholder={placeholder}
          disabled={disabled}
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
        <p className="text-sm text-red-400">{matchError || error}</p>
      )}
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
