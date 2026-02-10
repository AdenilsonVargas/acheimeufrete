import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Eye } from 'lucide-react';

/**
 * ResponderCotação - Responda com segurança
 * 
 * FUNCIONALIDADES:
 * - Validação de entrada rigorosa
 * - Preview da cotação antes de responder
 * - Mascaras de entrada (valor, data)
 * - Feedback em tempo real
 * - Mensagens de erro e sucesso
 */
export default function ResponderCotacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cotacao, setCotacao] = useState(null);
  const [carregandoCotacao, setCarregandoCotacao] = useState(true);
  const [erroCotacao, setErroCotacao] = useState(null);

  const [form, setForm] = useState({
    valor: '',
    dataEntrega: '',
    descricao: ''
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [success, setSuccess] = useState('');

  // Validação em tempo real
  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarCotacao();
  }, [id]);

  const carregarCotacao = async () => {
    try {
      setCarregandoCotacao(true);
      setErroCotacao(null);

      const response = await apiClient.client.get(`/cotacoes/${id}`);
      setCotacao(response.data?.cotacao || response.data);
    } catch (error) {
      console.error('Erro ao carregar cotação:', error);
      setErroCotacao(
        error.response?.data?.message ||
        'Erro ao carregar cotação. Tente novamente.'
      );
    } finally {
      setCarregandoCotacao(false);
    }
  };

  const validarCampos = () => {
    const novosErros = {};

    // Validar valor
    if (!form.valor || form.valor.trim() === '') {
      novosErros.valor = 'Valor é obrigatório';
    } else {
      const valorNum = parseFloat(String(form.valor).replace(',', '.'));
      if (isNaN(valorNum) || valorNum <= 0) {
        novosErros.valor = 'Valor deve ser maior que zero';
      } else if (valorNum > 1000000) {
        novosErros.valor = 'Valor não pode exceder R$ 1.000.000';
      }
    }

    // Validar data de entrega
    if (!form.dataEntrega) {
      novosErros.dataEntrega = 'Data de entrega é obrigatória';
    } else {
      const data = new Date(form.dataEntrega);
      if (isNaN(data.getTime())) {
        novosErros.dataEntrega = 'Data inválida';
      } else if (data <= new Date()) {
        novosErros.dataEntrega = 'Data deve ser no futuro';
      } else {
        const dataMax = new Date();
        dataMax.setDate(dataMax.getDate() + 90);
        if (data > dataMax) {
          novosErros.dataEntrega = 'Data não pode ser mais de 90 dias no futuro';
        }
      }
    }

    // Validar descrição (opcional, mas limitar)
    if (form.descricao && form.descricao.length > 1000) {
      novosErros.descricao = 'Descrição não pode exceder 1000 caracteres';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro quando usuário começa a digitar
    if (erros[name]) {
      setErros(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCampos()) {
      setErro('Corrija os erros antes de enviar');
      return;
    }

    setEnviando(true);
    setErro('');
    setSuccess('');

    try {
      const payload = {
        cotacaoId: id,
        valor: parseFloat(String(form.valor).replace(',', '.')),
        dataEntrega: form.dataEntrega,
        descricao: form.descricao.trim() || null
      };

      const response = await apiClient.client.post('/respostas', payload);

      if (response.data?.success) {
        setSuccess('✅ Resposta enviada com sucesso!');
        setTimeout(() => {
          navigate('/dashboard-transportadora');
        }, 2000);
      } else {
        setErro(response.data?.message || 'Erro ao enviar resposta');
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setErro(
        error.response?.data?.message ||
        error.message ||
        'Erro ao enviar resposta. Tente novamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  if (carregandoCotacao) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Carregando cotação...
            </h3>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (erroCotacao) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Erro ao carregar cotação
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">{erroCotacao}</p>
                <button
                  onClick={carregarCotacao}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!cotacao) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Cotação não encontrada
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalhes da Cotação */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Responder Cotação
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Envie sua proposta para esta oportunidade
              </p>
            </div>

            {/* Informações da Cotação */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Informações da Cotação
                  </h3>
                  <dl className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex justify-between">
                      <dt className="font-medium">Título:</dt>
                      <dd>{cotacao.titulo}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Cidade Coleta:</dt>
                      <dd>{cotacao.cidadeColeta}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Cidade Entrega:</dt>
                      <dd>{cotacao.cidadeEntrega}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Data Coleta:</dt>
                      <dd>{new Date(cotacao.dataColeta).toLocaleDateString('pt-BR')}</dd>
                    </div>
                    {cotacao.dataHoraFim && (
                      <div className="flex justify-between">
                        <dt className="font-medium">Expira em:</dt>
                        <dd>{new Date(cotacao.dataHoraFim).toLocaleDateString('pt-BR')}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
              {erro && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300">{erro}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 dark:text-green-300">{success}</p>
                </div>
              )}

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="text"
                  name="valor"
                  value={form.valor}
                  onChange={handleChange}
                  placeholder="Ex: 1.500,00"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    erros.valor
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {erros.valor && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erros.valor}</p>
                )}
              </div>

              {/* Data Entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Entrega *
                </label>
                <input
                  type="date"
                  name="dataEntrega"
                  value={form.dataEntrega}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    erros.dataEntrega
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                {erros.dataEntrega && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erros.dataEntrega}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Adicione observações sobre sua proposta..."
                  maxLength={1000}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    erros.descricao
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.descricao.length}/1000 caracteres
                </p>
                {erros.descricao && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erros.descricao}</p>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {enviando ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Proposta'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          {/* Dicas de Segurança */}
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                💡 Dicas para Melhor Proposta
              </h4>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Defina um preço competitivo</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Seja realista com a entrega</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Adicione observações relevantes</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Mantenha seu perfil atualizado</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                ⚠️ Importante
              </h4>
              <ul className="space-y-2 text-xs text-yellow-800 dark:text-yellow-200">
                <li>• Não compartilhe dados sensíveis aqui</li>
                <li>• A proposta é vinculante quando aceita</li>
                <li>• Você pode editar antes de ser aceita</li>
                <li>• Respeite os prazos oferecidos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
