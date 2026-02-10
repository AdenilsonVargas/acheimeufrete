import React from 'react';
import { Bell, AlertCircle } from 'lucide-react';

export default function NotificationBellsCliente({ notificacoes = [] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notificacoes.filter(n => !n.lido).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-800 rounded-lg transition"
      >
        <Bell className="w-6 h-6 text-gray-400 hover:text-orange-500 transition" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-slate-900 p-4 border-b border-slate-700">
            <h3 className="font-bold text-white">Notificações</h3>
          </div>

          {notificacoes.length > 0 ? (
            <div>
              {notificacoes.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition cursor-pointer ${
                    notif.lido ? '' : 'bg-orange-600/10'
                  }`}
                >
                  <div className="flex gap-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      notif.tipo === 'alerta' ? 'text-red-400' :
                      notif.tipo === 'info' ? 'text-blue-400' :
                      'text-green-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{notif.titulo}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.mensagem}</p>
                      <p className="text-xs text-gray-500 mt-2">{notif.data}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma notificação
            </div>
          )}
        </div>
      )}
    </div>
  );
}
