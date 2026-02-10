import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingSpinner({ text = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-12 h-12 mb-4">
        <Loader className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
      <p className="text-gray-400 text-center">{text}</p>
    </div>
  );
}
