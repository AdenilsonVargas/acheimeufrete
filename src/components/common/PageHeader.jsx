import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, showBack = false, icon: Icon = null }) {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </button>
        )}
        {Icon && <Icon className="w-8 h-8 text-orange-600" />}
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </div>
      {subtitle && <p className="text-gray-400 ml-11">{subtitle}</p>}
    </div>
  );
}
