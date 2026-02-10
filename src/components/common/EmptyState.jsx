import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({ 
  title = 'Nenhum resultado encontrado',
  description = 'Tente diferentes filtros ou crie um novo item',
  icon: Icon = AlertCircle,
  actionButton = null
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-slate-800 p-6 rounded-lg mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center mb-6 max-w-md">{description}</p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
}
