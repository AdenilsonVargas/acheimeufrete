import React, { useState, useEffect } from 'react';
import { Box, ChevronDown, Plus, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import api from '@/api/client';

export default function ProdutoSelector({ 
  value, 
  onChange, 
  userId,
  error = null 
}) {
  const [produtos, setProdutos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, [userId]);

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const res = await api.entities.produto.list({ owner: userId });
      setProdutos(res?.data || res || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProd = produtos.find(p => p.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Produto</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-field flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-gray-500" />
            <span className={selectedProd ? 'text-white' : 'text-gray-500'}>
              {selectedProd 
                ? `${selectedProd.nome} (${selectedProd.peso}kg)`
                : 'Selecione um produto'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
            {isLoading ? (
              <div className="p-4"><LoadingSpinner text="Carregando..." /></div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {produtos.length > 0 ? (
                  produtos.map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        onChange(prod.id);
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-0 transition"
                    >
                      <p className="text-white font-medium">{prod.nome}</p>
                      <div className="flex gap-4 text-xs text-gray-400 mt-1">
                        <span>Peso: {prod.peso}kg</span>
                        <span>Valor: R$ {prod.valor?.toFixed(2)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">Nenhum produto cadastrado</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
