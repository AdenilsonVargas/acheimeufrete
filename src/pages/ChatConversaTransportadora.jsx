import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import BrazilTimeInfo from '@/components/BrazilTimeInfo';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { MessageCircle, Send, Paperclip } from 'lucide-react';

export default function ChatConversaTransportadora() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [conversa, setConversa] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [novaMensagem, setNovaMensagem] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.chat.get(id);
        setConversa(res?.data || res);

        const resMsgs = await api.entities.mensagem.filter({ chatId: id, limit: 100 });
        setMensagens(resMsgs?.data || resMsgs || []);
      } catch (err) {
        console.error('Erro ao buscar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleEnviar = async () => {
    if (!novaMensagem.trim()) return;
    try {
      await api.entities.mensagem.create({
        chatId: id,
        usuarioId: user?.id,
        conteudo: novaMensagem,
        data: new Date(),
        tipo: 'transportador'
      });
      setMensagens([...mensagens, { conteudo: novaMensagem, usuarioId: user?.id, data: new Date(), tipo: 'transportador' }]);
      setNovaMensagem('');
    } catch (err) {
      console.error('Erro ao enviar', err);
    }
  };

  if (loading) return <div className="text-white p-4">Carregando...</div>;
  if (!conversa) return <div className="text-white p-4">Conversa não encontrada</div>;

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-4">
        <BrazilTimeInfo />
        <div className="h-[calc(100vh-280px)] flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">←</button>
              <MessageCircle className="w-6 h-6 text-cyan-600" />
              <div>
                <h2 className="text-xl font-bold text-white">{conversa.cliente}</h2>
                <p className="text-slate-400 text-sm">Frete: {conversa.cotacaoId}</p>
              </div>
            </div>
            <button className="text-cyan-400 hover:text-cyan-300">Ver Detalhes</button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3">
            {mensagens.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhuma mensagem nesta conversa</p>
            ) : (
              mensagens.map((m, idx) => (
                <div key={idx} className={`flex ${m.tipo === 'transportador' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-lg ${m.tipo === 'transportador' ? 'bg-cyan-900 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    <p className="text-sm">{m.conteudo}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(m.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <button className="text-slate-400 hover:text-white">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              placeholder="Escreva uma mensagem..."
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
              className="input-field flex-1"
            />
            <button 
              onClick={handleEnviar}
              className="btn-primary px-4 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
