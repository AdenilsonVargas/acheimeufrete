import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { CreditCard, Wallet, TrendingUp } from 'lucide-react';

export default function Pagamentos() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ valor: '', metodo: 'pix', descricao: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.entities.pagamento.create({ ...formData, usuarioId: user?.id });
      setSuccess(true);
      setFormData({ valor: '', metodo: 'pix', descricao: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao processar pagamento', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Pagamentos</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Saldo */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-slate-300">Saldo Disponível</h3>
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-white">R$ 0,00</p>
          </div>

          {/* Gasto Mês */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-slate-300">Gasto Este Mês</h3>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-white">R$ 0,00</p>
          </div>

          {/* Próximas Faturas */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-slate-300">Próximo Vencimento</h3>
              <CreditCard className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-2xl font-bold text-white">—</p>
          </div>
        </div>

        {/* Novo Pagamento */}
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Novo Pagamento</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Método de Pagamento</label>
              <select name="metodo" value={formData.metodo} onChange={handleChange} className="input-field w-full">
                <option value="pix">PIX</option>
                <option value="cartao">Cartão de Crédito</option>
                <option value="transferencia">Transferência Bancária</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Descrição (Opcional)</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="input-field w-full h-24"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Processando...' : 'Processar Pagamento'}
            </button>

            {success && <p className="text-green-400 text-sm">✓ Pagamento realizado com sucesso!</p>}
          </form>
        </div>

        {/* Histórico */}
        <div className="card mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Histórico de Pagamentos</h2>
          <p className="text-slate-300">Nenhum pagamento registrado.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
