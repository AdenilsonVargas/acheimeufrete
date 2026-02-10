import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { FileText, Download, Send, MapPin, Truck } from 'lucide-react';

export default function EmitirCTe() {
  const { user } = useAuthStore();
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState(null);
  const [form, setForm] = useState({ descricaoProduto: '', naturezaCarga: '', valor: '' });

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.entities.cotacao.filter({ status: 'aceita', transportadorId: user?.id, limit: 50 });
        setCotacoes(res?.data || res || []);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleEmitir = async () => {
    if (!selectedCotacao || !form.naturezaCarga) return;
    try {
      const cteData = {
        cotacaoId: selectedCotacao.id || selectedCotacao._id,
        descricaoProduto: form.descricaoProduto,
        naturezaCarga: form.naturezaCarga,
        valor: parseFloat(form.valor) || selectedCotacao.valor,
        dataEmissao: new Date(),
        status: 'emitido'
      };
      await api.entities.cte.create(cteData);
      alert('CT-e emitido com sucesso!');
      setSelectedCotacao(null);
      setForm({ descricaoProduto: '', naturezaCarga: '', valor: '' });
    } catch (err) {
      console.error('Erro ao emitir', err);
      alert('Erro ao emitir CT-e');
    }
  };

  const handleDownload = (cteId) => {
    api.files.downloadCTe(cteId)
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `CTE_${cteId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(err => console.error('Erro ao baixar', err));
  };

  return (
    <DashboardLayout userType={user?.userType === "transportador" ? "transportador" : "embarcador"}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-8 h-8 text-orange-600" /> Emitir CT-e
        </h1>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : cotacoes.length === 0 ? (
          <div className="card">
            <p className="text-slate-300">Nenhuma cotação aceita para emitir CT-e.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="card mb-6">
                <h2 className="text-lg font-bold text-white mb-4">Cotações Disponíveis</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cotacoes.map((c) => (
                    <div 
                      key={c.id || c._id}
                      onClick={() => setSelectedCotacao(c)}
                      className={`p-4 rounded-lg cursor-pointer transition ${selectedCotacao?.id === c.id || selectedCotacao?._id === c._id ? 'bg-orange-900 border-2 border-orange-600' : 'bg-slate-800 border border-slate-700 hover:border-orange-600'}`}
                    >
                      <h3 className="text-white font-semibold">{c.titulo}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                        <MapPin className="w-4 h-4" /> {c.origem} → {c.destino}
                      </div>
                      <p className="text-orange-400 font-bold mt-2">R$ {(c.valor || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="card">
                <h2 className="text-lg font-bold text-white mb-4">Dados do CT-e</h2>
                {selectedCotacao ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Natureza da Carga</label>
                      <input 
                        placeholder="Ex: Alimentos Secos"
                        value={form.naturezaCarga}
                        onChange={(e) => setForm({...form, naturezaCarga: e.target.value})}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Descrição</label>
                      <textarea 
                        placeholder="Descrição do produto"
                        value={form.descricaoProduto}
                        onChange={(e) => setForm({...form, descricaoProduto: e.target.value})}
                        className="input-field w-full h-20"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Valor</label>
                      <input 
                        type="number"
                        placeholder="Valor"
                        value={form.valor}
                        onChange={(e) => setForm({...form, valor: e.target.value})}
                        className="input-field w-full"
                      />
                    </div>
                    <button onClick={handleEmitir} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Emitir CT-e
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400">Selecione uma cotação</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
