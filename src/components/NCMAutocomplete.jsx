import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import api from '@/api/client';
import NCMNotFoundModal from './NCMNotFoundModal';
import useAuthStore from '@/hooks/useAuthStore';

/**
 * Componente de Autocomplete NCM otimizado para alta carga
 * - Debounce de 400ms para evitar requests excessivos
 * - AbortController para cancelar requisições pendentes
 * - Busca só após 4 caracteres
 * - Cache básico em memória (opcional)
 * - Limite de 20 resultados por padrão
 * - Modal para solicitar NCM não encontrado
 */
export default function NCMAutocomplete({ value, onChange, onSelect, className = '' }) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showNCMNotFoundModal, setShowNCMNotFoundModal] = useState(false);
  const [lastSearchWithoutResults, setLastSearchWithoutResults] = useState('');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Buscar NCMs com debounce e cancelamento
  const searchNCMs = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 4) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError('');

    try {
      // Usa proxy do Vite em dev (/api) e VITE_API_URL se definido em produção
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(
        `${baseUrl}/ncms/search?query=${encodeURIComponent(searchQuery)}&limit=20`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error('Erro ao buscar NCMs');

      const data = await response.json();
      setResults(data.data || []);
      
      // Se nenhum resultado encontrado, armazenar para mostrar modal depois
      if ((!data.data || data.data.length === 0) && searchQuery.length >= 4) {
        setLastSearchWithoutResults(searchQuery);
      }
      
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro busca NCM:', err);
        setError('Erro ao buscar');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler com debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Novo timer de debounce (400ms)
    debounceTimerRef.current = setTimeout(() => {
      searchNCMs(newValue);
    }, 400);
  };

  // Selecionar NCM
  const handleSelect = (ncm) => {
    setQuery(ncm.codigo);
    onChange?.(ncm.codigo);
    onSelect?.(ncm);
    setShowDropdown(false);
    setResults([]);
    inputRef.current?.blur();
  };

  // Limpar busca
  const handleClear = () => {
    setQuery('');
    onChange?.('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Navegação por teclado
  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input com ícones */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 4 && results.length > 0 && setShowDropdown(true)}
          placeholder="Digite 4+ caracteres: código ou nome"
          maxLength="20"
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-10 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hint de 4 caracteres */}
      {query.length > 0 && query.length < 4 && (
        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Digite pelo menos 4 caracteres para buscar
        </p>
      )}

      {/* Erro */}
      {error && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Dropdown de resultados */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto"
        >
          {results.map((ncm, index) => (
            <button
              key={ncm.codigo}
              type="button"
              onClick={() => handleSelect(ncm)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition border-b border-slate-700/50 last:border-0 ${
                index === highlightedIndex ? 'bg-slate-700' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-20">
                  <span className="text-orange-400 font-mono font-bold text-sm">
                    {ncm.codigo}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {ncm.descricao}
                  </p>
                  {ncm.classificacao && (
                    <p className="text-slate-400 text-xs mt-1">
                      {ncm.classificacao}
                    </p>
                  )}
                  {ncm.caracteristicas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ncm.caracteristicas.slice(0, 3).map((car) => (
                        <span
                          key={car}
                          className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-300"
                        >
                          {car}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Nenhum resultado */}
      {showDropdown && !loading && query.length >= 4 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 text-center">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-sm mb-3">
            Nenhum NCM encontrado para "{query}"
          </p>
          <button
            type="button"
            onClick={() => {
              setLastSearchWithoutResults(query);
              setShowNCMNotFoundModal(true);
            }}
            className="text-orange-400 hover:text-orange-300 text-xs font-semibold transition"
          >
            💬 Solicitar adição deste NCM
          </button>
        </div>
      )}

      {/* Modal NCM Não Encontrado */}
      {showNCMNotFoundModal && (
        <NCMNotFoundModal
          query={lastSearchWithoutResults}
          onClose={() => {
            setShowNCMNotFoundModal(false);
            setLastSearchWithoutResults('');
          }}
          clienteId={user?.id}
          clienteNome={user?.nome || user?.name || 'Cliente'}
        />
      )}
    </div>
  );
}
