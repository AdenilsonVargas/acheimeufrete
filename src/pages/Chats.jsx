import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import ChatAvailabilityAlert from '@/components/ChatAvailabilityAlert';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { MessageSquare, Plus, Search } from 'lucide-react';

export default function Chats() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  const fetchChats = async (termoBusca = '') => {
    setLoading(true);
    try {
      const params = { usuarioId: user?.id, limit: 50 };
      if (termoBusca.trim()) {
        params.busca = termoBusca.trim();
      }
      const res = await api.entities.chat.list(params);
      const dados = res?.data || res;
      setChats(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('Erro ao listar chats', err);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  const handleBusca = (e) => {
    e.preventDefault();
    fetchChats(busca);
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            Mensagens
          </h1>
          <button className="bg-gradient-to-r from-orange-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Conversa
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-slate-200">
          <p className="font-semibold">Regras do chat:</p>
          <ul className="list-disc ml-5 text-sm mt-2 space-y-1">
            <li>Somente você (embarcador) pode abrir o chat, entre 08:00-17:00 (horário de Brasília).</li>
            <li>O transportador não abre chat; pode apenas responder.</li>
            <li>Conversa permitida até 23:59:59 do mesmo dia de abertura.</li>
            <li>Após esse horário, o chat fica inativo (somente leitura).</li>
            <li>Enquanto ativo, ambos podem anexar documentos.</li>
          </ul>
        </div>

        <ChatAvailabilityAlert />

        <form onSubmit={handleBusca} className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700/50 mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por número da cotação, transportadora, produto, NCM, data ou mensagem..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
              Buscar
            </button>
            {busca && (
              <button type="button" onClick={() => { setBusca(''); fetchChats(); }} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">
                Limpar
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : chats.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50">
            <p className="text-slate-300">Nenhuma conversa iniciada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((c) => (
              <Link key={c.id || c._id} to={`/chat/${c.id || c._id}`} className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition cursor-pointer">
                <div className="mb-3 pb-3 border-b border-slate-600/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        Cotação #{c.cotacao?.numero || 'N/A'} - {c.cotacao?.titulo || 'Sem título'}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Transportadora: <span className="text-white">{c.transportadora?.razaoSocial || c.transportadora?.nomeCompleto || 'N/A'}</span>
                      </p>
                      <p className="text-slate-400 text-sm">
                        Valor: <span className="text-orange-400 font-semibold">R$ {c.cotacao?.valorEstimado?.toFixed(2) || '0.00'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">{c.cotacao?.createdAt ? new Date(c.cotacao.createdAt).toLocaleDateString() : 'N/A'}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${c.statusChat === 'aberto' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {c.statusChat === 'aberto' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  {c.produtos && c.produtos.length > 0 && (
                    <div className="mt-2">
                      <p className="text-slate-400 text-xs">Produtos:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {c.produtos.slice(0, 3).map((p, idx) => (
                          <span key={idx} className="bg-slate-700/50 px-2 py-1 rounded text-xs text-slate-300">
                            {p.nome} (NCM: {p.ncmCode})
                          </span>
                        ))}
                        {c.produtos.length > 3 && (
                          <span className="text-slate-400 text-xs">+{c.produtos.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  )}
                  {c.cotacao && (
                    <div className="mt-2 text-xs text-slate-400">
                      <span className="text-blue-400">{c.cotacao.enderecoColeta?.split(',')[0] || 'Origem'}</span> → <span className="text-orange-400">{c.cotacao.enderecoEntrega?.split(',')[0] || 'Destino'}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm">{c.ultimaMensagem || 'Sem mensagens'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">{c.ultimaMensagemData ? new Date(c.ultimaMensagemData).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
