import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { MessageCircle, Plus, Send } from 'lucide-react';

export default function ChatSuporte() {
  const { user } = useAuthStore();
  const [conversas, setConversas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversa, setSelectedConversa] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [assunto, setAssunto] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.chat.filter({ tipo: 'suporte', usuarioId: user?.id, limit: 50 });
        setConversas(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (selectedConversa) {
      const fetch = async () => {
        try {
          const res = await api.entities.mensagem.filter({ chatId: selectedConversa.id, limit: 100 });
          setMensagens(res?.data || res || []);
        } catch (err) {
          console.error('Erro ao listar mensagens', err);
        }
      };
      fetch();
    }
  }, [selectedConversa]);

  const handleEnviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    try {
      await api.entities.mensagem.create({
        chatId: selectedConversa?.id,
        usuarioId: user?.id,
        conteudo: novaMensagem,
        data: new Date(),
        tipo: 'usuario'
      });
      setMensagens([...mensagens, { conteudo: novaMensagem, usuarioId: user?.id, data: new Date(), tipo: 'usuario' }]);
      setNovaMensagem('');
    } catch (err) {
      console.error('Erro ao enviar', err);
    }
  };

  const handleNovaConversa = async () => {
    if (!assunto.trim()) return;
    try {
      const novaConversa = await api.entities.chat.create({
        usuarioId: user?.id,
        tipo: 'suporte',
        assunto: assunto,
        status: 'aberto',
        dataCriacao: new Date()
      });
      setConversas([...conversas, novaConversa]);
      setAssunto('');
    } catch (err) {
      console.error('Erro ao criar', err);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-cyan-600" /> Suporte
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Conversas ({conversas.length})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {conversas.map((c) => (
                <div 
                  key={c.id || c._id}
                  onClick={() => setSelectedConversa(c)}
                  className={`p-3 rounded-lg cursor-pointer transition ${selectedConversa?.id === c.id ? 'bg-cyan-900 border-2 border-cyan-600' : 'bg-slate-800 hover:border-cyan-600 border border-slate-700'}`}
                >
                  <p className="text-white font-semibold text-sm">{c.assunto}</p>
                  <p className="text-slate-400 text-xs">{new Date(c.dataCriacao).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <input 
                placeholder="Novo assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="input-field w-full text-sm mb-2"
              />
              <button 
                onClick={handleNovaConversa}
                className="btn-primary w-full text-sm flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Nova
              </button>
            </div>
          </div>

          <div className="md:col-span-2 card flex flex-col">
            {selectedConversa ? (
              <>
                <div>
                  <h2 className="text-lg font-bold text-white mb-2">{selectedConversa.assunto}</h2>
                  <p className="text-slate-400 text-sm">Status: <span className={`font-semibold ${selectedConversa.status === 'aberto' ? 'text-orange-400' : 'text-green-400'}`}>{selectedConversa.status}</span></p>
                </div>

                <div className="flex-1 overflow-y-auto my-4 space-y-2">
                  {mensagens.length === 0 ? (
                    <p className="text-slate-300">Nenhuma mensagem</p>
                  ) : (
                    mensagens.map((m, idx) => (
                      <div key={idx} className={`flex ${m.usuarioId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded ${m.usuarioId === user?.id ? 'bg-cyan-900' : 'bg-slate-800'}`}>
                          <p className="text-white text-sm">{m.conteudo}</p>
                          <p className="text-slate-400 text-xs mt-1">{new Date(m.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    placeholder="Digite uma mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensagem()}
                    className="input-field flex-1 text-sm"
                  />
                  <button 
                    onClick={handleEnviarMensagem}
                    className="btn-primary px-3 py-2 flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-slate-300">Selecione uma conversa</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
