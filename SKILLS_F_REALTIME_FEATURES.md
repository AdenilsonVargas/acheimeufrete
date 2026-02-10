# 🔄 SKILL F: REAL-TIME FEATURES
## Chat, Notifications, Status Updates (WebSocket patterns)

> **OBJETIVO:** Chat time-real, notificações push, status updates instantâneo

---

## 1. WEBSOCKET SETUP

### 💻 Backend WebSocket Server
```javascript
// backend/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();  // userId -> Set of connections

wss.on('connection', (ws) => {
  let userId = null;
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.type === 'auth') {
        // Autenticar cliente
        const token = msg.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        
        // Registrar conexão
        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId).add(ws);
        
        console.log(`✅ Cliente ${userId} conectado (${clients.size} ativos)`);
        ws.send(JSON.stringify({ type: 'auth_success' }));
      }
      
      else if (msg.type === 'message') {
        // Nova mensagem de chat
        const { chatId, texto } = msg;
        
        // Salvar no BD
        const mensagem = await prisma.mensagem.create({
          data: {
            chatId,
            remetenteId: userId,
            textoMensagem: texto,
            dataHora: new Date()
          }
        });
        
        // Buscar destinatários
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { quotacao: true }
        });
        
        const [embarcador, transportador] = [chat.quotacao.embarcadorId, chat.quotacao.transportadorId];
        const destinatarioId = userId === embarcador ? transportador : embarcador;
        
        // Enviar para destinatário
        if (clients.has(destinatarioId)) {
          clients.get(destinatarioId).forEach(clientWs => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'message_received',
                chatId,
                mensagem: {
                  id: mensagem.id,
                  remetenteId: userId,
                  textoMensagem: texto,
                  dataHora: mensagem.dataHora
                }
              }));
            }
          });
        }
      }
      
      else if (msg.type === 'typing_indicator') {
        // Mostrar que usuário está digitando
        const { chatId } = msg;
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        const [_, destinatarioId] = chat.quotacao.embarcadorId === userId 
          ? [userId, chat.quotacao.transportadorId]
          : [userId, chat.quotacao.embarcadorId];
        
        if (clients.has(destinatarioId)) {
          clients.get(destinatarioId).forEach(clientWs => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'typing',
                chatId,
                usuarioId: userId,
                nomeUsuario: msg.nomeUsuario
              }));
            }
          });
        }
      }
      
      else if (msg.type === 'status_update') {
        // Atualizar status de quotação
        const { freteId, novoStatus } = msg;
        
        const frete = await prisma.frete.findUnique({
          where: { id: freteId },
          include: { quotacao: true }
        });
        
        // Notificar ambos os usuários
        const usuarios = [frete.quotacao.embarcadorId, frete.transportadorId];
        const mensagem = `Status atualizado: ${novoStatus}`;
        
        usuarios.forEach(usuarioId => {
          if (clients.has(usuarioId)) {
            clients.get(usuarioId).forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'status_changed',
                  freteId,
                  novoStatus,
                  mensagem
                }));
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro no WebSocket:', error);
      ws.send(JSON.stringify({ type: 'error', mensagem: error.message }));
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      clients.get(userId)?.delete(ws);
      if (clients.get(userId)?.size === 0) {
        clients.delete(userId);
      }
      console.log(`❌ Cliente ${userId} desconectado`);
    }
  });
});
```

---

## 2. FRONTEND WEBSOCKET HOOK

### 🪝 Custom Hook
```javascript
// src/hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [listeners, setListeners] = useState({});
  
  useEffect(() => {
    if (!user) return;
    
    // Conectar ao WebSocket
    const ws = new WebSocket('wss://seu-dominio.com/ws');
    
    ws.onopen = () => {
      console.log('🔌 WebSocket conectado');
      
      // Autenticar
      ws.send(JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('token')
      }));
    };
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === 'auth_success') {
        setConnected(true);
        console.log('✅ Autenticado no WebSocket');
      }
      
      // Chamar listeners registrados
      if (listeners[msg.type]) {
        listeners[msg.type].forEach(callback => callback(msg));
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ Erro WebSocket:', error);
      setConnected(false);
    };
    
    ws.onclose = () => {
      setConnected(false);
      console.log('🔌 WebSocket desconectado');
      
      // Reconectar após 3 segundos
      setTimeout(() => {
        // Chamar hook novamente
      }, 3000);
    };
    
    wsRef.current = ws;
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user]);
  
  const send = (msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };
  
  const on = (msgType, callback) => {
    setListeners(prev => ({
      ...prev,
      [msgType]: [...(prev[msgType] || []), callback]
    }));
  };
  
  return { connected, send, on };
}
```

---

## 3. CHAT COMPONENT

### 💬 Chat Interface
```javascript
// src/components/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Send, Loader } from 'lucide-react';

export function Chat({ chatId, usuarioNome }) {
  const [mensagens, setMensagens] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuariosDigitando, setUsuariosDigitando] = useState(new Set());
  const { connected, send, on } = useWebSocket();
  const messagesEnd = useRef(null);
  const { user } = useAuth();
  
  // Carregar histórico
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/chats/${chatId}/mensagens`);
        setMensagens(res.data);
      } finally {
        setCarregando(false);
      }
    })();
  }, [chatId]);
  
  // Scroll para última mensagem
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);
  
  // Listener para novas mensagens
  useEffect(() => {
    on('message_received', (msg) => {
      if (msg.chatId === chatId) {
        setMensagens(prev => [...prev, msg.mensagem]);
      }
    });
    
    on('typing', (msg) => {
      if (msg.chatId === chatId) {
        setUsuariosDigitando(prev => new Set([...prev, msg.usuarioId]));
        setTimeout(() => {
          setUsuariosDigitando(prev => {
            prev.delete(msg.usuarioId);
            return new Set([...prev]);
          });
        }, 3000);
      }
    });
  }, [chatId, on]);
  
  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    setEnviando(true);
    send({
      type: 'message',
      chatId,
      texto: inputValue
    });
    
    setInputValue('');
    setEnviando(false);
  };
  
  const handleTyping = () => {
    send({
      type: 'typing_indicator',
      chatId,
      nomeUsuario: user.nome
    });
  };
  
  if (carregando) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin" /></div>;
  }
  
  return (
    <div className="flex flex-col h-96 rounded-lg border dark:border-gray-700">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
        {mensagens.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.remetenteId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.remetenteId === user.id
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
            }`}>
              <p>{msg.textoMensagem}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.dataHora).toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
        
        {usuariosDigitando.size > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{usuarioNome} está digitando</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEnd} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            onInput={handleTyping}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={!connected || enviando}
          />
          <button
            onClick={handleSend}
            disabled={!connected || enviando || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. STATUS UPDATES & NOTIFICATIONS

### 📡 Notification Center
```javascript
// src/components/NotificationCenter.jsx
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

export function NotificationCenter() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const { connected, on } = useWebSocket();
  
  useEffect(() => {
    // Carregar notificações
    (async () => {
      const res = await apiClient.get('/notificacoes');
      setNotificacoes(res.data);
    })();
  }, []);
  
  // Listener para status updates
  useEffect(() => {
    on('status_changed', (msg) => {
      setNotificacoes(prev => [
        {
          id: Date.now(),
          tipo: 'status_update',
          mensagem: msg.mensagem,
          freteId: msg.freteId,
          dataHora: new Date()
        },
        ...prev
      ]);
    });
  }, [on]);
  
  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
      >
        <Bell className="w-6 h-6" />
        {notificacoes.filter(n => !n.lido).length > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {notificacoes.filter(n => !n.lido).length}
          </span>
        )}
      </button>
      
      {aberto && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <p className="p-4 text-center text-gray-600">Sem notificações</p>
          ) : (
            notificacoes.map(notif => (
              <div
                key={notif.id}
                className="px-4 py-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => {
                  apiClient.patch(`/notificacoes/${notif.id}/lidas`);
                  setNotificacoes(prev => prev.map(n => n.id === notif.id ? { ...n, lido: true } : n));
                }}
              >
                <p className="font-medium">{notif.mensagem}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(notif.dataHora).toLocaleString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Success Metrics
✅ Message latency < 100ms  
✅ Reconnect automático  
✅ Chat sincronizado entre devices  
✅ Typing indicators suave  
✅ 99.9% delivery rate

---

**Próxima Skill:** SKILL G - Admin & Moderation
