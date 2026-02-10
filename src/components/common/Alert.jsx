import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const typeConfig = {
  error: { bg: 'bg-red-900', border: 'border-red-700', icon: AlertCircle, color: 'text-red-300' },
  success: { bg: 'bg-green-900', border: 'border-green-700', icon: CheckCircle, color: 'text-green-300' },
  warning: { bg: 'bg-yellow-900', border: 'border-yellow-700', icon: AlertTriangle, color: 'text-yellow-300' },
  info: { bg: 'bg-blue-900', border: 'border-blue-700', icon: Info, color: 'text-blue-300' },
};

export default function Alert({ type = 'info', title, message, closeable = true, autoClose = 0 }) {
  const [visible, setVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => setVisible(false), autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  if (!visible) return null;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 mb-4 flex items-start gap-3`}>
      <Icon className={`w-6 h-6 flex-shrink-0 ${config.color}`} />
      <div className="flex-1">
        {title && <h4 className={`font-semibold ${config.color}`}>{title}</h4>}
        {message && <p className="text-gray-200 text-sm mt-1">{message}</p>}
      </div>
      {closeable && (
        <button onClick={() => setVisible(false)} className="p-1 hover:bg-black/20 rounded">
          <X className="w-4 h-4 text-gray-300" />
        </button>
      )}
    </div>
  );
}
