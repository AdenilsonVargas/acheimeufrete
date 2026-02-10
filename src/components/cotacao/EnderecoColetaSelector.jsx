import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import api from '@/api/client';

export default function EnderecoColetaSelector({ 
  value, 
  onChange, 
  userId,
  error = null 
}) {
  const [enderecos, setEnderecos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newEnd, setNewEnd] = useState({ cep: '', rua: '', numero: '', cidade: '', estado: '' });

  useEffect(() => {
    fetchEnderecos();
  }, [userId]);

  const fetchEnderecos = async () => {
    setIsLoading(true);
    try {
      const res = await api.entities.enderecoColeta.list({ owner: userId });
      setEnderecos(res?.data || res || []);
    } catch (err) {
      console.error('Erro ao carregar endereços:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newEnd.cep || !newEnd.rua || !newEnd.cidade) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const res = await api.entities.enderecoColeta.create({
        ...newEnd,
        owner: userId
      });
      setEnderecos([...enderecos, res.data || res]);
      onChange(res.data?.id || res?.id);
      setNewEnd({ cep: '', rua: '', numero: '', cidade: '', estado: '' });
      setAddingNew(false);
    } catch (err) {
      alert('Erro ao adicionar endereço');
    }
  };

  const selectedAddress = enderecos.find(e => e.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Endereço de Coleta</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-field flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className={selectedAddress ? 'text-white' : 'text-gray-500'}>
              {selectedAddress 
                ? `${selectedAddress.rua}, ${selectedAddress.numero} - ${selectedAddress.cidade}/${selectedAddress.estado}`
                : 'Selecione um endereço'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
            {isLoading ? (
              <div className="p-4"><LoadingSpinner text="Carregando..." /></div>
            ) : (
              <>
                <div className="max-h-48 overflow-y-auto">
                  {enderecos.length > 0 ? (
                    enderecos.map(end => (
                      <button
                        key={end.id}
                        type="button"
                        onClick={() => {
                          onChange(end.id);
                          setIsOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-0 transition"
                      >
                        <p className="text-white font-medium">{end.rua}, {end.numero}</p>
                        <p className="text-sm text-gray-400">{end.cidade}/{end.estado} - CEP: {end.cep}</p>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">Nenhum endereço cadastrado</div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setAddingNew(!addingNew);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-orange-500 hover:bg-slate-700 border-t border-slate-700 transition text-sm font-medium"
                >
                  + Adicionar Novo Endereço
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {addingNew && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
          <h4 className="font-semibold text-white">Novo Endereço de Coleta</h4>
          
          <input
            type="text"
            placeholder="CEP"
            value={newEnd.cep}
            onChange={(e) => setNewEnd({...newEnd, cep: e.target.value})}
            className="input-field"
          />
          
          <input
            type="text"
            placeholder="Rua"
            value={newEnd.rua}
            onChange={(e) => setNewEnd({...newEnd, rua: e.target.value})}
            className="input-field"
          />
          
          <input
            type="text"
            placeholder="Número"
            value={newEnd.numero}
            onChange={(e) => setNewEnd({...newEnd, numero: e.target.value})}
            className="input-field"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Cidade"
              value={newEnd.cidade}
              onChange={(e) => setNewEnd({...newEnd, cidade: e.target.value})}
              className="input-field"
            />
            
            <select
              value={newEnd.estado}
              onChange={(e) => setNewEnd({...newEnd, estado: e.target.value})}
              className="input-field"
            >
              <option value="">UF</option>
              <option value="SP">SP</option>
              <option value="RJ">RJ</option>
              <option value="MG">MG</option>
              <option value="BA">BA</option>
              <option value="RS">RS</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition text-sm font-medium"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
