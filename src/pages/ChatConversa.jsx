import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import BrazilTimeInfo from '@/components/BrazilTimeInfo';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Send } from 'lucide-react';

export default function ChatConversa() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.entities.chat.get(id);
        setMensagens(res?.mensagens || []);
      } catch (err) {
        console.error('Erro ao carregar chat', err);
      }
    };

    fetch();
  }, [id]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setLoading(true);
    try {
      await api.entities.chat.update(id, { 
        mensagens: [...mensagens, { texto: novaMensagem, remetente: user?.id, data: new Date() }]
      });
      setMensagens([...mensagens, { texto: novaMensagem, remetente: user?.id, data: new Date() }]);
      setNovaMensagem('');
    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-4">
        <BrazilTimeInfo />
        <div className="h-[calc(100vh-280px)] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {mensagens.map((m, idx) => (
              <div key={idx} className={`flex ${m.remetente === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded ${
                  m.remetente === user?.id 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-slate-700 text-slate-100'
                }`}>
                  <p>{m.texto}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(m.data).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleEnviar} className="flex gap-2">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
