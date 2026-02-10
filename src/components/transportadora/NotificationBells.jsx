import React from 'react';
import { Bell, Truck } from 'lucide-react';

export default function NotificationBells({ notificacoes = [] }) {
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
            <h3 className="font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Notificações do Transportador
            </h3>
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
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-orange-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{notif.titulo}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.mensagem}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">{notif.data}</p>
                        {notif.acao && (
                          <button className="text-xs px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition">
                            {notif.acao}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              Nenhuma notificação de entrega
            </div>
          )}
        </div>
      )}
    </div>
  );
}
