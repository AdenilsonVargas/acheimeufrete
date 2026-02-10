import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { Star, Gift, Plus, Check } from 'lucide-react';

export default function PacotesPremium() {
  const { user } = useAuthStore();
  const [pacotes, setPacotes] = useState([]);
  const [planoAtual, setPlanoAtual] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // TODO: Implementar endpoints de pacotes premium e assinatura no backend
        setPacotes([]);
        setPlanoAtual(null);
      } catch (err) {
        console.error('Erro ao listar', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleAssinar = async (pacoteId) => {
    try {
      // TODO: Implementar endpoint de assinatura premium no backend
      alert('Assinatura (dados não persistidos - backend não implementado)');
    } catch (err) {
      console.error('Erro ao assinar', err);
    }
  };

  const planosPadrao = [
    {
      id: 1,
      nome: 'Básico',
      preco: 'Grátis',
      precoNum: 0,
      descricao: 'Para iniciantes',
      beneficios: [
        '5 cotações por mês',
        'Chat básico',
        'Relatórios simples',
        'Suporte por email'
      ]
    },
    {
      id: 2,
      nome: 'Profissional',
      preco: 'R$ 99/mês',
      precoNum: 99,
      destaque: true,
      descricao: 'Mais popular',
      beneficios: [
        '50 cotações por mês',
        'Chat ilimitado',
        'Relatórios avançados',
        'Prioridade no suporte',
        'Análise de mercado',
        'Certificado de excelência'
      ]
    },
    {
      id: 3,
      nome: 'Empresarial',
      preco: 'R$ 299/mês',
      precoNum: 299,
      descricao: 'Para grandes operações',
      beneficios: [
        'Cotações ilimitadas',
        'Chat 24/7 com suporte dedicado',
        'Relatórios personalizados',
        'API de integração',
        'Análise competitiva',
        'Gestor de conta pessoal'
      ]
    }
  ];

  return (
    <DashboardLayout userType={user?.userType === 'transportador' ? 'transportador' : 'embarcador'}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Gift className="w-8 h-8 text-orange-600" /> Planos Premium
        </h1>
        <p className="text-slate-400 mb-8">Escolha o plano ideal para suas necessidades</p>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planosPadrao.map((plano) => (
              <div 
                key={plano.id}
                className={`card transition ${plano.destaque ? 'border-2 border-orange-600 md:scale-105' : ''}`}
              >
                {plano.destaque && (
                  <div className="mb-4 pb-4 border-b border-orange-600">
                    <span className="inline-block px-3 py-1 bg-orange-600 text-white rounded-full text-xs font-bold">
                      ⭐ Mais Popular
                    </span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-white mb-2">{plano.nome}</h2>
                <p className="text-slate-400 text-sm mb-4">{plano.descricao}</p>

                <div className="mb-6">
                  <p className={`text-4xl font-bold ${plano.precoNum === 0 ? 'text-cyan-400' : 'text-orange-600'}`}>
                    {plano.preco}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {plano.beneficios.map((beneficio, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">{beneficio}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => plano.precoNum > 0 && handleAssinar(plano.id)}
                  disabled={planoAtual === plano.id}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    planoAtual === plano.id
                      ? 'bg-green-900 text-green-300'
                      : plano.destaque
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {planoAtual === plano.id ? '✓ Seu Plano' : plano.precoNum === 0 ? 'Usar Gratuito' : 'Assinar'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Perguntas Frequentes</h2>
          <div className="space-y-4">
            <div>
              <p className="text-white font-semibold mb-1">Posso mudar de plano a qualquer momento?</p>
              <p className="text-slate-400 text-sm">Sim! Você pode fazer upgrade ou downgrade a qualquer momento.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Há período de teste gratuito?</p>
              <p className="text-slate-400 text-sm">Sim! 30 dias grátis para planos Profissional e Empresarial.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Como faço para cancelar?</p>
              <p className="text-slate-400 text-sm">Você pode cancelar a qualquer momento sem penalidades.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
