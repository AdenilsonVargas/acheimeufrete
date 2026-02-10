import React from 'react';
import { Edit2 } from 'lucide-react';

export default function ProdutosDetalhesEditor({ 
  produtos = [],
  onChange,
  isEditable = true
}) {
  const [editingId, setEditingId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});

  const handleEdit = (produto) => {
    setEditingId(produto.id);
    setEditForm(produto);
  };

  const handleSave = () => {
    const updated = produtos.map(p => 
      p.id === editingId ? { ...editForm } : p
    );
    onChange(updated);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (produtos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>Nenhum produto adicionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {produtos.map(produto => (
        <div 
          key={produto.id}
          className="bg-slate-800 rounded-lg border border-slate-700 p-4"
        >
          {editingId === produto.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  value={editForm.peso}
                  onChange={(e) => setEditForm({...editForm, peso: e.target.value})}
                  className="input-field"
                  placeholder="Peso (kg)"
                />
              </div>
              <textarea
                value={editForm.descricao || ''}
                onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                placeholder="Descrição"
                className="input-field h-20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm font-medium"
                >
                  Salvar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{produto.nome}</h4>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>Peso: {produto.peso}kg</span>
                  <span>NCM: {produto.ncm || 'N/A'}</span>
                  {produto.dimensoes && <span>Dims: {produto.dimensoes}</span>}
                </div>
                {produto.descricao && (
                  <p className="text-sm text-gray-400 mt-2">{produto.descricao}</p>
                )}
              </div>
              {isEditable && (
                <button
                  onClick={() => handleEdit(produto)}
                  className="p-2 text-blue-400 hover:bg-blue-600/20 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
