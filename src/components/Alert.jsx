import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function Alert({ type = 'info', title, message, onClose }) {
  const typeStyles = {
    error: 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    success: 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  };

  const iconColors = {
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
  };

  const icons = {
    error: <XCircle className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />,
    success: <CheckCircle className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />,
    info: <Info className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />,
    warning: <AlertCircle className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />,
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${typeStyles[type]}`}>
      {icons[type]}
      <div className="flex-1">
        {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
        {message && <p className="text-sm leading-relaxed">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xl opacity-70 hover:opacity-100 transition flex-shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}
