import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';

/**
 * Componente de Edição de Campo
 * Permite editar um campo específico do perfil
 */
export function EditableField({ label, value, name, onSave, editable = true, type = 'text' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(name, editValue);
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        <div className="flex gap-2">
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            placeholder={label}
            disabled={isSaving}
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditValue(value || '');
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-white">{value || '-'}</p>
        </div>
        {editable && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition"
            title={`Editar ${label}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Componente de Botão de Edição
 * Alterna entre modo visualização e edição
 */
export function EditButton({ isEditing, onEdit, onCancel, isSaving, label = 'Editar Perfil' }) {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onEdit}
      disabled={isSaving}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition"
    >
      <Edit2 className="w-4 h-4" />
      {isSaving ? 'Salvando...' : label}
    </button>
  );
}

export default EditableField;
