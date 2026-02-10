import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';

export default function ProdutoSelectorMulti({ 
  value = [],
  onChange,
  error = null 
}) {
  const [form, setForm] = useState({
    nome: '',
    peso: '',
    valor: '',
    quantidade: '1',
    dimensoes: '',
    ncm: ''
  });
  const [editingId, setEditingId] = useState(null);

  const handleAdd = () => {
    if (!form.nome || !form.peso || !form.valor) {
      alert('Nome, peso e valor são obrigatórios');
      return;
    }

    if (editingId) {
      const updated = value.map(p => 
        p.id === editingId ? { ...form, id: editingId } : p
      );
      onChange(updated);
      setEditingId(null);
    } else {
      onChange([...value, { ...form, id: Date.now().toString() }]);
    }

    setForm({
      nome: '',
      peso: '',
      valor: '',
      quantidade: '1',
      dimensoes: '',
      ncm: ''
    });
  };

  const handleEdit = (produto) => {
    setForm(produto);
    setEditingId(produto.id);
  };

  const handleRemove = (id) => {
    onChange(value.filter(p => p.id !== id));
  };

  const totalPeso = value.reduce((acc, p) => acc + (parseFloat(p.peso) || 0), 0);
  const totalValor = value.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">Produtos</label>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({...form, nome: e.target.value})}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Peso (kg)"
            step="0.01"
            value={form.peso}
            onChange={(e) => setForm({...form, peso: e.target.value})}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Valor (R$)"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm({...form, valor: e.target.value})}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Quantidade"
            min="1"
            value={form.quantidade}
            onChange={(e) => setForm({...form, quantidade: e.target.value})}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Dimensões (L x A x P)"
            value={form.dimensoes}
            onChange={(e) => setForm({...form, dimensoes: e.target.value})}
            className="input-field"
          />
          <input
            type="text"
            placeholder="NCM"
            value={form.ncm}
            onChange={(e) => setForm({...form, ncm: e.target.value})}
            className="input-field"
          />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {editingId ? 'Atualizar Produto' : 'Adicionar Produto'}
        </button>
      </div>

      {value.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-300">Nome</th>
                  <th className="text-center px-4 py-2 text-gray-300">Peso</th>
                  <th className="text-center px-4 py-2 text-gray-300">Valor</th>
                  <th className="text-center px-4 py-2 text-gray-300">Qtd</th>
                  <th className="text-center px-4 py-2 text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {value.map(prod => (
                  <tr key={prod.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                    <td className="px-4 py-2 text-white">{prod.nome}</td>
                    <td className="text-center px-4 py-2 text-gray-300">{prod.peso}kg</td>
                    <td className="text-center px-4 py-2 text-green-400 font-semibold">R$ {parseFloat(prod.valor).toFixed(2)}</td>
                    <td className="text-center px-4 py-2 text-gray-300">{prod.quantidade}x</td>
                    <td className="text-center px-4 py-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(prod)}
                        className="p-1 hover:bg-blue-600/30 text-blue-400 rounded transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(prod.id)}
                        className="p-1 hover:bg-red-600/30 text-red-400 rounded transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900 px-4 py-3 border-t border-slate-700 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Peso Total</p>
              <p className="text-lg font-bold text-cyan-400">{totalPeso.toFixed(2)} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Valor Total</p>
              <p className="text-lg font-bold text-green-400">R$ {totalValor.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
