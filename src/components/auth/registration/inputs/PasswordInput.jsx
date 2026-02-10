import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePasswordStrength, validatePasswordMatch } from '@/utils/validators';

/**
 * Input de senha com indicador de força
 * Com bloqueio de copiar/colar
 */
export default function PasswordInput({
  value = '',
  onChange,
  onBlur,
  placeholder = 'Senha forte',
  label = 'Senha',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  showStrength = true,
  blockPaste = true,
  blockCopy = true,
  minLength = 8,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ isValid: false, strength: 'fraca', errors: [] });

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Validar força da senha
    const result = validatePasswordStrength(inputValue);
    setStrength(result);

    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);

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
    }
  };

  const handleCopy = (e) => {
    if (blockCopy) {
      e.preventDefault();
    }
  };

  // Cores de força
  const strengthColors = {
    fraca: 'bg-red-600',
    media: 'bg-yellow-600',
    forte: 'bg-green-600',
  };

  const strengthText = {
    fraca: 'Fraca',
    media: 'Média',
    forte: 'Forte',
  };

  const isValid = strength.isValid && !error;
  const showError = (strength.errors.length > 0 || error) && !focused;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {(blockPaste || blockCopy) && (
            <span className="text-xs text-gray-500 ml-2">
              (bloqueado {blockCopy && 'copiar'} {blockCopy && blockPaste ? '/' : ''} {blockPaste && 'colar'})
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type={showPassword ? 'text' : 'password'}
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
              : isValid
              ? 'border-green-600 focus:border-green-600 focus:ring-1 focus:ring-green-500/20'
              : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            }
          `}
        />

        {/* Botão mostrar/esconder */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Indicador de força */}
      {showStrength && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${strengthColors[strength.strength]}`}
                style={{
                  width: strength.strength === 'fraca' ? '33%' : strength.strength === 'media' ? '66%' : '100%',
                }}
              />
            </div>
            <span className={`text-xs font-semibold ${
              strength.strength === 'fraca' ? 'text-red-400' :
              strength.strength === 'media' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {strengthText[strength.strength]}
            </span>
          </div>

          {/* Requisitos */}
          {strength.errors.length > 0 && (
            <ul className="text-xs text-gray-400 space-y-1">
              {strength.errors.map((error, idx) => (
                <li key={idx} className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          )}

          {strength.isValid && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
              Senha forte
            </div>
          )}
        </div>
      )}

      {/* Mensagens */}
      {showError && (
        <p className="text-sm text-red-400">{error || 'Senha não atende aos requisitos'}</p>
      )}
      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Input para confirmar senha
 * Com bloqueio de copiar/colar
 */
export function PasswordConfirmInput({
  password = '',
  value = '',
  onChange,
  onBlur,
  placeholder = 'confirme a senha',
  label = 'Confirmar Senha',
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  blockPaste = true,
  blockCopy = true,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [matchError, setMatchError] = useState('');

  const handleChange = (e) => {
    const inputValue = e.target.value;

    // Validar se combina
    const match = validatePasswordMatch(password, inputValue);
    setMatchError(match.error);

    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = (e) => {
    setFocused(false);

    if (password && value) {
      const match = validatePasswordMatch(password, value);
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
    if (blockPaste) {
      e.preventDefault();
    }
  };

  const handleCopy = (e) => {
    if (blockCopy) {
      e.preventDefault();
    }
  };

  const isValid = !matchError && value && password;
  const showError = (matchError || error) && !focused;

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
        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />

        <input
          type={showPassword ? 'text' : 'password'}
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
              : isValid
              ? 'border-green-600 focus:border-green-600 focus:ring-1 focus:ring-green-500/20'
              : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
            }
          `}
        />

        {/* Botão mostrar/esconder */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Status de validação */}
      {value && (
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-400">Senhas combinam</span>
            </>
          ) : showError ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-400">{matchError || error}</span>
            </>
          ) : null}
        </div>
      )}

      {helperText && !showError && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
