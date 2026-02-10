import React, { useState, useEffect } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import api from '@/api/client';

export default function DestinatarioSelector({ 
  value, 
  onChange, 
  userId,
  error = null 
}) {
  const [destinatarios, setDestinatarios] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newDest, setNewDest] = useState({ nome: '', contato: '', telefone: '', cep: '', endereco: '', cidade: '', estado: '' });

  useEffect(() => {
    fetchDestinatarios();
  }, [userId]);

  const fetchDestinatarios = async () => {
    setIsLoading(true);
    try {
      const res = await api.entities.destinatario.list({ owner: userId });
      setDestinatarios(res?.data || res || []);
    } catch (err) {
      console.error('Erro ao carregar destinatários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newDest.nome || !newDest.endereco || !newDest.cidade) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const res = await api.entities.destinatario.create({
        ...newDest,
        owner: userId
      });
      setDestinatarios([...destinatarios, res.data || res]);
      onChange(res.data?.id || res?.id);
      setNewDest({ nome: '', contato: '', telefone: '', cep: '', endereco: '', cidade: '', estado: '' });
      setAddingNew(false);
    } catch (err) {
      alert('Erro ao adicionar destinatário');
    }
  };

  const selectedDest = destinatarios.find(d => d.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">Destinatário</label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-field flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <span className={selectedDest ? 'text-white' : 'text-gray-500'}>
              {selectedDest 
                ? `${selectedDest.nome} - ${selectedDest.endereco}`
                : 'Selecione um destinatário'}
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
                  {destinatarios.length > 0 ? (
                    destinatarios.map(dest => (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => {
                          onChange(dest.id);
                          setIsOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-0 transition"
                      >
                        <p className="text-white font-medium">{dest.nome}</p>
                        <p className="text-sm text-gray-400">{dest.endereco} - {dest.cidade}/{dest.estado}</p>
                        {dest.telefone && <p className="text-xs text-gray-500">{dest.telefone}</p>}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">Nenhum destinatário cadastrado</div>
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
                  + Adicionar Novo Destinatário
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {addingNew && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
          <h4 className="font-semibold text-white">Novo Destinatário</h4>
          
          <input
            type="text"
            placeholder="Nome da Empresa"
            value={newDest.nome}
            onChange={(e) => setNewDest({...newDest, nome: e.target.value})}
            className="input-field"
          />
          
          <input
            type="text"
            placeholder="Contato"
            value={newDest.contato}
            onChange={(e) => setNewDest({...newDest, contato: e.target.value})}
            className="input-field"
          />

          <input
            type="tel"
            placeholder="Telefone"
            value={newDest.telefone}
            onChange={(e) => setNewDest({...newDest, telefone: e.target.value})}
            className="input-field"
          />
          
          <input
            type="text"
            placeholder="CEP"
            value={newDest.cep}
            onChange={(e) => setNewDest({...newDest, cep: e.target.value})}
            className="input-field"
          />
          
          <input
            type="text"
            placeholder="Endereço"
            value={newDest.endereco}
            onChange={(e) => setNewDest({...newDest, endereco: e.target.value})}
            className="input-field"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Cidade"
              value={newDest.cidade}
              onChange={(e) => setNewDest({...newDest, cidade: e.target.value})}
              className="input-field"
            />
            
            <select
              value={newDest.estado}
              onChange={(e) => setNewDest({...newDest, estado: e.target.value})}
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
