import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/api/client';
import useAuthStore from '@/hooks/useAuthStore';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  X,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  Calendar
} from 'lucide-react';

export default function Relatorios() {
  const { user } = useAuthStore();
  const userType = user?.userType || 'embarcador';

  const [cotacoes, setCotacoes] = useState([]);
  const [cotacoesFiltradas, setCotacoesFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    destinatario: '',
    transportadora: '',
    embarcador: '',
    numeroCotacao: '',
    dataInicio: '',
    dataFim: '',
    tipoProduto: '',
    valorMin: '',
    valorMax: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    valorTotal: 0,
    pendentes: 0,
    finalizadas: 0
  });

  // Carregar cotações ao montar
  useEffect(() => {
    fetchCotacoes();
  }, []);

  // Aplicar filtros quando mudam
  useEffect(() => {
    aplicarFiltros();
  }, [filtros, cotacoes]);

  const fetchCotacoes = async () => {
    setLoading(true);
    try {
      const response = await api.entities.cotacao.filter({ limit: 1000 });
      const dados = response?.data || response || [];
      const cotacoesArray = Array.isArray(dados) ? dados : [];
      setCotacoes(cotacoesArray);
      calcularStats(cotacoesArray);
    } catch (err) {
      console.error('Erro ao buscar cotações:', err);
      setCotacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularStats = (dados) => {
    const arrDados = Array.isArray(dados) ? dados : [];
    const total = arrDados.length;
    const valorTotal = arrDados.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0);
    const pendentes = arrDados.filter(c => 
      ['aberta', 'aguardando', 'em_analise'].includes(c.status)
    ).length;
    const finalizadas = arrDados.filter(c => c.status === 'finalizada').length;

    setStats({ total, valorTotal, pendentes, finalizadas });
  };

  const aplicarFiltros = () => {
    const arrCotacoes = Array.isArray(cotacoes) ? cotacoes : [];
    let resultado = [...arrCotacoes];

    // Filtro por destinatário
    if (filtros.destinatario) {
      resultado = resultado.filter(c => 
        c.destinatarioNome?.toLowerCase().includes(filtros.destinatario.toLowerCase()) ||
        c.destinatario?.nome?.toLowerCase().includes(filtros.destinatario.toLowerCase())
      );
    }

    // Filtro por transportadora (apenas para embarcador e admin)
    if (filtros.transportadora && ['embarcador', 'admin'].includes(userType)) {
      resultado = resultado.filter(c => 
        c.transportadoraNome?.toLowerCase().includes(filtros.transportadora.toLowerCase()) ||
        c.transportadora?.nome?.toLowerCase().includes(filtros.transportadora.toLowerCase())
      );
    }

    // Filtro por embarcador (apenas para transportador e admin)
    if (filtros.embarcador && ['transportador', 'admin'].includes(userType)) {
      resultado = resultado.filter(c => 
        c.embarcadorNome?.toLowerCase().includes(filtros.embarcador.toLowerCase()) ||
        c.cliente?.nome?.toLowerCase().includes(filtros.embarcador.toLowerCase()) ||
        c.embarcador?.nome?.toLowerCase().includes(filtros.embarcador.toLowerCase())
      );
    }

    // Filtro por número da cotação
    if (filtros.numeroCotacao) {
      resultado = resultado.filter(c => 
        c.id?.toLowerCase().includes(filtros.numeroCotacao.toLowerCase()) ||
        c.numero?.toString().includes(filtros.numeroCotacao)
      );
    }

    // Filtro por data início
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio);
      resultado = resultado.filter(c => {
        const dataCotacao = new Date(c.createdAt || c.created_date);
        return dataCotacao >= dataInicio;
      });
    }

    // Filtro por data fim
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Final do dia
      resultado = resultado.filter(c => {
        const dataCotacao = new Date(c.createdAt || c.created_date);
        return dataCotacao <= dataFim;
      });
    }

    // Filtro por tipo de produto
    if (filtros.tipoProduto) {
      resultado = resultado.filter(c => 
        c.tipoProduto?.toLowerCase().includes(filtros.tipoProduto.toLowerCase()) ||
        c.produtos?.some(p => p.tipo?.toLowerCase().includes(filtros.tipoProduto.toLowerCase()))
      );
    }

    // Filtro por valor mínimo
    if (filtros.valorMin) {
      const valorMin = parseFloat(filtros.valorMin);
      resultado = resultado.filter(c => (parseFloat(c.valor) || 0) >= valorMin);
    }

    // Filtro por valor máximo
    if (filtros.valorMax) {
      const valorMax = parseFloat(filtros.valorMax);
      resultado = resultado.filter(c => (parseFloat(c.valor) || 0) <= valorMax);
    }

    setCotacoesFiltradas(resultado);
  };

  const limparFiltros = () => {
    setFiltros({
      destinatario: '',
      transportadora: '',
      embarcador: '',
      numeroCotacao: '',
      dataInicio: '',
      dataFim: '',
      tipoProduto: '',
      valorMin: '',
      valorMax: ''
    });
  };

  const exportarCSV = () => {
    const headers = [
      'Nº Cotação',
      'Destinatário',
      userType !== 'transportador' ? 'Transportadora' : 'Embarcador',
      'Tipo Produto',
      'Valor',
      'Status',
      'Data'
    ];

    const rows = cotacoesFiltradas.map(c => [
      c.id?.slice(0, 8) || c.numero || 'N/A',
      c.destinatarioNome || c.destinatario?.nome || 'N/A',
      userType !== 'transportador' 
        ? (c.transportadoraNome || c.transportadora?.nome || 'N/A')
        : (c.embarcadorNome || c.cliente?.nome || c.embarcador?.nome || 'N/A'),
      c.tipoProduto || c.produtos?.[0]?.tipo || 'N/A',
      `R$ ${(parseFloat(c.valor) || 0).toFixed(2)}`,
      c.status || 'N/A',
      new Date(c.createdAt || c.created_date).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_cotacoes_${new Date().getTime()}.csv`;
    link.click();
  };

  const exportarPDF = () => {
    // Criar HTML para impressão em PDF
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Cotações</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1e40af; color: white; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
        </style>
      </head>
      <body>
        <h1>Relatório de Cotações</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Usuário: ${user?.nome || 'N/A'}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div>Total de Cotações</div>
            <div class="stat-value">${cotacoesFiltradas.length}</div>
          </div>
          <div class="stat-card">
            <div>Valor Total</div>
            <div class="stat-value">R$ ${Array.isArray(cotacoesFiltradas) ? cotacoesFiltradas.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0).toFixed(2) : '0.00'}</div>
          </div>
          <div class="stat-card">
            <div>Pendentes</div>
            <div class="stat-value">${cotacoesFiltradas.filter(c => ['aberta', 'aguardando'].includes(c.status)).length}</div>
          </div>
          <div class="stat-card">
            <div>Finalizadas</div>
            <div class="stat-value">${cotacoesFiltradas.filter(c => c.status === 'finalizada').length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nº Cotação</th>
              <th>Destinatário</th>
              <th>${userType !== 'transportador' ? 'Transportadora' : 'Embarcador'}</th>
              <th>Tipo Produto</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${cotacoesFiltradas.map(c => `
              <tr>
                <td>${c.id?.slice(0, 8) || c.numero || 'N/A'}</td>
                <td>${c.destinatarioNome || c.destinatario?.nome || 'N/A'}</td>
                <td>${userType !== 'transportador' 
                  ? (c.transportadoraNome || c.transportadora?.nome || 'N/A')
                  : (c.embarcadorNome || c.cliente?.nome || c.embarcador?.nome || 'N/A')}</td>
                <td>${c.tipoProduto || c.produtos?.[0]?.tipo || 'N/A'}</td>
                <td>R$ ${(parseFloat(c.valor) || 0).toFixed(2)}</td>
                <td>${c.status || 'N/A'}</td>
                <td>${new Date(c.createdAt || c.created_date).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <DashboardLayout userType={userType}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-orange-500" /> 
            Relatórios {userType === 'admin' ? 'do Sistema' : 'de Cotações'}
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={exportarCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button 
              onClick={exportarPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total de Cotações</p>
                <p className="text-3xl font-bold text-cyan-400">{cotacoesFiltradas.length}</p>
              </div>
              <FileText className="w-10 h-10 text-cyan-400 opacity-50" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Valor Total</p>
                <p className="text-3xl font-bold text-green-400">
                  R$ {Array.isArray(cotacoesFiltradas) ? (cotacoesFiltradas.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0) / 1000).toFixed(1) : '0.0'}k
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-orange-400">
                  {cotacoesFiltradas.filter(c => ['aberta', 'aguardando', 'em_analise'].includes(c.status)).length}
                </p>
              </div>
              <Package className="w-10 h-10 text-orange-400 opacity-50" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Finalizadas</p>
                <p className="text-3xl font-bold text-blue-400">
                  {cotacoesFiltradas.filter(c => c.status === 'finalizada').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-blue-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Painel de Filtros */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-500" />
              Filtros de Busca
            </h2>
            <button 
              onClick={limparFiltros}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro Destinatário - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Destinatário</label>
              <input
                type="text"
                value={filtros.destinatario}
                onChange={(e) => setFiltros({...filtros, destinatario: e.target.value})}
                placeholder="Nome do destinatário"
                className="input w-full"
              />
            </div>

            {/* Filtro Transportadora - Embarcador e Admin */}
            {['embarcador', 'admin'].includes(userType) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Transportadora</label>
                <input
                  type="text"
                  value={filtros.transportadora}
                  onChange={(e) => setFiltros({...filtros, transportadora: e.target.value})}
                  placeholder="Nome da transportadora"
                  className="input w-full"
                />
              </div>
            )}

            {/* Filtro Embarcador - Transportador e Admin */}
            {['transportador', 'admin'].includes(userType) && (
              <div>
                <label className="block text-sm text-slate-300 mb-1">Embarcador</label>
                <input
                  type="text"
                  value={filtros.embarcador}
                  onChange={(e) => setFiltros({...filtros, embarcador: e.target.value})}
                  placeholder="Nome do embarcador"
                  className="input w-full"
                />
              </div>
            )}

            {/* Filtro Número Cotação - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nº Cotação</label>
              <input
                type="text"
                value={filtros.numeroCotacao}
                onChange={(e) => setFiltros({...filtros, numeroCotacao: e.target.value})}
                placeholder="Número ou ID"
                className="input w-full"
              />
            </div>

            {/* Filtro Data Início - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="input w-full"
              />
            </div>

            {/* Filtro Data Fim - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="input w-full"
              />
            </div>

            {/* Filtro Tipo Produto - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tipo de Produto</label>
              <input
                type="text"
                value={filtros.tipoProduto}
                onChange={(e) => setFiltros({...filtros, tipoProduto: e.target.value})}
                placeholder="Ex: Eletrônicos"
                className="input w-full"
              />
            </div>

            {/* Filtro Valor Mínimo - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Valor Mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={filtros.valorMin}
                onChange={(e) => setFiltros({...filtros, valorMin: e.target.value})}
                placeholder="0.00"
                className="input w-full"
              />
            </div>

            {/* Filtro Valor Máximo - TODOS */}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Valor Máximo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={filtros.valorMax}
                onChange={(e) => setFiltros({...filtros, valorMax: e.target.value})}
                placeholder="9999.99"
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Resultados ({cotacoesFiltradas.length} cotações)
          </h2>

          {loading ? (
            <p className="text-slate-300 text-center py-8">Carregando...</p>
          ) : cotacoesFiltradas.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma cotação encontrada com os filtros aplicados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="text-left p-3 text-slate-300 font-semibold">Nº Cotação</th>
                    <th className="text-left p-3 text-slate-300 font-semibold">Destinatário</th>
                    {userType !== 'transportador' && (
                      <th className="text-left p-3 text-slate-300 font-semibold">Transportadora</th>
                    )}
                    {['transportador', 'admin'].includes(userType) && (
                      <th className="text-left p-3 text-slate-300 font-semibold">Embarcador</th>
                    )}
                    <th className="text-left p-3 text-slate-300 font-semibold">Tipo Produto</th>
                    <th className="text-right p-3 text-slate-300 font-semibold">Valor</th>
                    <th className="text-center p-3 text-slate-300 font-semibold">Status</th>
                    <th className="text-center p-3 text-slate-300 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {cotacoesFiltradas.map((cotacao) => (
                    <tr key={cotacao.id} className="hover:bg-slate-700/50">
                      <td className="p-3 text-cyan-400 font-mono font-semibold">
                        #{cotacao.id?.slice(0, 8) || cotacao.numero || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-200">
                        {cotacao.destinatarioNome || cotacao.destinatario?.nome || 'N/A'}
                      </td>
                      {userType !== 'transportador' && (
                        <td className="p-3 text-slate-200">
                          {cotacao.transportadoraNome || cotacao.transportadora?.nome || '-'}
                        </td>
                      )}
                      {['transportador', 'admin'].includes(userType) && (
                        <td className="p-3 text-slate-200">
                          {cotacao.embarcadorNome || cotacao.cliente?.nome || cotacao.embarcador?.nome || 'N/A'}
                        </td>
                      )}
                      <td className="p-3 text-slate-200">
                        {cotacao.tipoProduto || cotacao.produtos?.[0]?.tipo || 'N/A'}
                      </td>
                      <td className="p-3 text-right text-green-400 font-semibold">
                        R$ {(parseFloat(cotacao.valor) || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          cotacao.status === 'finalizada' ? 'bg-green-500/20 text-green-400' :
                          cotacao.status === 'aceita' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {cotacao.status || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-300 text-sm">
                        {new Date(cotacao.createdAt || cotacao.created_date).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-700">
                  <tr>
                    <td colSpan={userType === 'admin' ? 5 : 4} className="p-3 text-white font-bold">
                      TOTAL DO PERÍODO FILTRADO
                    </td>
                    <td className="p-3 text-right text-green-400 font-bold text-lg">
                      R$ {Array.isArray(cotacoesFiltradas) ? cotacoesFiltradas.reduce((sum, c) => sum + (parseFloat(c.valor) || 0), 0).toFixed(2) : '0.00'}
                    </td>
                    <td colSpan="2" className="p-3 text-center text-white font-semibold">
                      {cotacoesFiltradas.length} cotação(ões)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
