import React, { useState } from 'react';
import { Bell, X, AlertCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications } = useNotifications();

  // Converter notificações do hook em array de objetos
  const notificationsList = [];
  
  if (notifications?.cotacoesDisponiveis > 0) {
    notificationsList.push({
      id: 'cotacoes-disponiveis',
      type: 'quote_available',
      title: 'Cotações Disponíveis',
      message: `${notifications.cotacoesDisponiveis} nova${notifications.cotacoesDisponiveis > 1 ? 's' : ''} cotação${notifications.cotacoesDisponiveis > 1 ? 's' : ''} para responder`,
      icon: AlertCircle,
      color: 'bg-green-50 text-green-600 border-green-200',
      link: '/cotacoes-disponiveis',
      time: 'Agora'
    });
  }

  if (notifications?.chats > 0) {
    notificationsList.push({
      id: 'chats',
      type: 'new_message',
      title: 'Novas Mensagens',
      message: `${notifications.chats} nova${notifications.chats > 1 ? 's' : ''} mensagem${notifications.chats > 1 ? 's' : ''} no chat`,
      icon: MessageCircle,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/chats-transportadora',
      time: 'Agora'
    });
  }

  const unreadCount = notificationsList.length;

  return (
    <div className="relative">
      {/* Botão Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Notificações</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notificações */}
          {notificationsList.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {notificationsList.map((notif) => {
                const IconComponent = notif.icon;
                return (
                  <Link
                    key={notif.id}
                    to={notif.link}
                    onClick={() => setIsOpen(false)}
                    className={`block p-4 border-l-4 hover:bg-slate-50 transition-colors ${notif.color}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${notif.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{notif.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-2">{notif.time}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Você não tem notificações</p>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
